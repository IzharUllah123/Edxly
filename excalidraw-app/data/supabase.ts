import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { reconcileElements } from "@excalidraw/excalidraw";
import { MIME_TYPES } from "@excalidraw/common";
import { decompressData } from "@excalidraw/excalidraw/data/encode";
import {
  encryptData,
  decryptData,
} from "@excalidraw/excalidraw/data/encryption";
import { restoreElements } from "@excalidraw/excalidraw/data/restore";
import { getSceneVersion } from "@excalidraw/element";

import type { RemoteExcalidrawElement } from "@excalidraw/excalidraw/data/reconcile";
import type {
  ExcalidrawElement,
  FileId,
  OrderedExcalidrawElement,
} from "@excalidraw/element/types";
import type {
  AppState,
  BinaryFileData,
  BinaryFileMetadata,
  DataURL,
} from "@excalidraw/excalidraw/types";

import { FILE_CACHE_MAX_AGE_SEC } from "../app_constants";
import { getSyncableElements } from ".";

import type { SyncableExcalidrawElement } from ".";
import type Portal from "../collab/Portal";
import type { Socket } from "socket.io-client";

// Supabase Client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration. Please check VITE_SUPABASE_URL and VITE_SUPABASE_KEY in your .env file.');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

// Types
interface SupabaseStoredScene {
  id: string;
  scene_version: number;
  iv: string; // base64 encoded
  ciphertext: string; // base64 encoded
  created_at: string;
  updated_at: string;
}

// Scene Version Cache
class SupabaseSceneVersionCache {
  private static cache = new WeakMap<Socket, number>();
  static get = (socket: Socket) => {
    return SupabaseSceneVersionCache.cache.get(socket);
  };
  static set = (
    socket: Socket,
    elements: readonly SyncableExcalidrawElement[],
  ) => {
    SupabaseSceneVersionCache.cache.set(socket, getSceneVersion(elements));
  };
}

// Helper functions
const encryptElements = async (
  key: string,
  elements: readonly ExcalidrawElement[],
): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> => {
  const json = JSON.stringify(elements);
  const encoded = new TextEncoder().encode(json);
  const { encryptedBuffer, iv } = await encryptData(key, encoded);

  return { ciphertext: encryptedBuffer, iv };
};

const decryptElements = async (
  data: SupabaseStoredScene,
  roomKey: string,
): Promise<readonly ExcalidrawElement[]> => {
  // Decode base64 to Uint8Array
  const ciphertext = Uint8Array.from(atob(data.ciphertext), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(data.iv), c => c.charCodeAt(0));

  const decrypted = await decryptData(iv, ciphertext, roomKey);
  const decodedData = new TextDecoder("utf-8").decode(
    new Uint8Array(decrypted),
  );
  return JSON.parse(decodedData);
};

const createSupabaseSceneDocument = async (
  roomId: string,
  elements: readonly SyncableExcalidrawElement[],
  roomKey: string,
): Promise<SupabaseStoredScene> => {
  const sceneVersion = getSceneVersion(elements);
  const { ciphertext, iv } = await encryptElements(roomKey, elements);

  return {
    id: roomId,
    scene_version: sceneVersion,
    iv: btoa(String.fromCharCode(...iv)),
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

// Save scene to Supabase
export const saveToSupabase = async (
  portal: Portal,
  elements: readonly SyncableExcalidrawElement[],
  appState: AppState,
): Promise<readonly SyncableExcalidrawElement[] | null> => {
  const { roomId, roomKey, socket } = portal;
  if (!roomId || !roomKey || !socket) {
    return null;
  }

  try {
    // Check if we should save (similar to Firebase logic)
    if (isSavedToSupabase(portal, elements)) {
      return null;
    }

    // Get existing scene or create new one
    const { data: existingScene } = await supabase
      .from('scenes')
      .select('*')
      .eq('id', roomId)
      .single();

    let finalElements = elements;

    if (existingScene) {
      // Reconcile with existing scene
      const existingElements = getSyncableElements(
        restoreElements(await decryptElements(existingScene, roomKey), null),
      );

      finalElements = getSyncableElements(
        reconcileElements(
          elements,
          existingElements as OrderedExcalidrawElement[] as RemoteExcalidrawElement[],
          appState,
        ),
      );
    }

    // Create and upsert the scene
    const storedScene = await createSupabaseSceneDocument(roomId, finalElements, roomKey);

    const { error } = await supabase
      .from('scenes')
      .upsert(storedScene, { onConflict: 'id' });

    if (error) {
      console.error('Error saving to Supabase:', error);
      throw error;
    }

    // Update cache
    SupabaseSceneVersionCache.set(socket, finalElements);

    return finalElements;
  } catch (error) {
    console.error('saveToSupabase error:', error);
    throw error;
  }
};

// Load scene from Supabase
export const loadFromSupabase = async (
  roomId: string,
  roomKey: string,
  socket: Socket | null,
): Promise<readonly SyncableExcalidrawElement[] | null> => {
  try {
    const { data, error } = await supabase
      .from('scenes')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error || !data) {
      return null;
    }

    const elements = getSyncableElements(
      restoreElements(await decryptElements(data, roomKey), null, {
        deleteInvisibleElements: true,
      }),
    );

    if (socket) {
      SupabaseSceneVersionCache.set(socket, elements);
    }

    return elements;
  } catch (error) {
    console.error('loadFromSupabase error:', error);
    throw error;
  }
};

// Save files to Supabase Storage
export const saveFilesToSupabase = async ({
  prefix,
  files,
}: {
  prefix: string;
  files: { id: FileId; buffer: Uint8Array }[];
}): Promise<{ savedFiles: FileId[]; erroredFiles: FileId[] }> => {
  const erroredFiles: FileId[] = [];
  const savedFiles: FileId[] = [];

  await Promise.all(
    files.map(async ({ id, buffer }) => {
      try {
        const fileName = `${prefix}/${id}`;
        const { error } = await supabase.storage
          .from('excalidraw-files')
          .upload(fileName, buffer, {
            cacheControl: `public, max-age=${FILE_CACHE_MAX_AGE_SEC}`,
            upsert: true,
          });

        if (error) {
          console.error(`Error uploading file ${id}:`, error);
          erroredFiles.push(id);
        } else {
          savedFiles.push(id);
        }
      } catch (error: any) {
        console.error(`Error uploading file ${id}:`, error);
        erroredFiles.push(id);
      }
    }),
  );

  return { savedFiles, erroredFiles };
};

// Load files from Supabase Storage
export const loadFilesFromSupabase = async (
  prefix: string,
  decryptionKey: string,
  filesIds: readonly FileId[],
): Promise<{ loadedFiles: BinaryFileData[]; erroredFiles: Map<FileId, true> }> => {
  const loadedFiles: BinaryFileData[] = [];
  const erroredFiles = new Map<FileId, true>();

  await Promise.all(
    [...new Set(filesIds)].map(async (id) => {
      try {
        const fileName = `${prefix}/${id}`;
        const { data, error } = await supabase.storage
          .from('excalidraw-files')
          .download(fileName);

        if (error || !data) {
          erroredFiles.set(id, true);
          return;
        }

        const arrayBuffer = await data.arrayBuffer();

        const { data: decompressedData, metadata } = await decompressData<BinaryFileMetadata>(
          new Uint8Array(arrayBuffer),
          { decryptionKey },
        );

        const dataURL = new TextDecoder().decode(decompressedData) as DataURL;

        loadedFiles.push({
          mimeType: metadata.mimeType || MIME_TYPES.binary,
          id,
          dataURL,
          created: metadata?.created || Date.now(),
          lastRetrieved: metadata?.created || Date.now(),
        });
      } catch (error: any) {
        console.error(`Error loading file ${id}:`, error);
        erroredFiles.set(id, true);
      }
    }),
  );

  return { loadedFiles, erroredFiles };
};

// Check if scene is already saved
export const isSavedToSupabase = (
  portal: Portal,
  elements: readonly ExcalidrawElement[],
): boolean => {
  if (portal.socket && portal.roomId && portal.roomKey) {
    const sceneVersion = getSceneVersion(elements);
    return SupabaseSceneVersionCache.get(portal.socket) === sceneVersion;
  }
  // If no room exists, consider it saved
  return true;
};
