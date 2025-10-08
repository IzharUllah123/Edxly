import clsx from "clsx";
import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import "./toolbar.scss";
import { newTextElement } from "@excalidraw/element";
import FlowchartDropdown from "./FlowchartDropdown"; // adjust the relative path


import {
  CLASSES,
  KEYS,
  capitalizeString,
  isTransparent,
} from "@excalidraw/common";

import {
  shouldAllowVerticalAlign,
  suppportsHorizontalAlign,
} from "@excalidraw/element";

import {
  hasBoundTextElement,
  isElbowArrow,
  isImageElement,
  isLinearElement,
  isTextElement,
  isArrowElement,
} from "@excalidraw/element";

import { hasStrokeColor, toolIsArrow } from "@excalidraw/element";

import type {
  ExcalidrawElement,
  ExcalidrawElementType,
  NonDeletedElementsMap,
  NonDeletedSceneElementsMap,
} from "@excalidraw/element/types";

import { actionToggleZenMode } from "../actions";

import { alignActionsPredicate } from "../actions/actionAlign";
import { trackEvent } from "../analytics";
import { useTunnels } from "../context/tunnels";

import { t } from "../i18n";
import {
  canChangeRoundness,
  canHaveArrowheads,
  getTargetElements,
  hasBackground,
  hasStrokeStyle,
  hasStrokeWidth,
} from "../scene";

import { getFormValue } from "../actions/actionProperties";

import { useTextEditorFocus } from "../hooks/useTextEditorFocus";

import { getToolbarTools} from "./shapes";
import { StylePicker } from "./StylePicker";
import { ColorPicker } from "./ColorPicker/ColorPicker";
import { DEFAULT_ELEMENT_BACKGROUND_COLOR_PALETTE, DEFAULT_ELEMENT_BACKGROUND_PICKS } from "@excalidraw/common";

import "./Actions.scss";

import { useDevice, useExcalidrawContainer } from "./App";
import Stack from "./Stack";
import { ToolButton } from "./ToolButton";
import { Tooltip } from "./Tooltip";
import DropdownMenu from "./dropdownMenu/DropdownMenu";
import { PropertiesPopover } from "./PropertiesPopover";
import LiveCollaborationTrigger from "./live-collaboration/LiveCollaborationTrigger";
import {
  
  sharpArrowIcon,
  roundArrowIcon,
  elbowArrowIcon,
  TextSizeIcon,
  adjustmentsIcon,
  DotsHorizontalIcon,
  RectangleIcon,
  DiamondIcon,
  EllipseIcon,
  ArrowIcon,
  LineIcon,
} from "./icons";

import type {
  AppClassProperties,
  AppProps,
  UIAppState,
  Zoom,
  AppState,
} from "../types";
import type { ActionManager } from "../actions/manager";

// Common CSS class combinations
const PROPERTIES_CLASSES = clsx([
  CLASSES.SHAPE_ACTIONS_THEME_SCOPE,
  "properties-content",
]);




export const canChangeStrokeColor = (
  appState: UIAppState,
  targetElements: ExcalidrawElement[],
) => {
  let commonSelectedType: ExcalidrawElementType | null =
    targetElements[0]?.type || null;

  for (const element of targetElements) {
    if (element.type !== commonSelectedType) {
      commonSelectedType = null;
      break;
    }
  }

  return (
    (hasStrokeColor(appState.activeTool.type) &&
      commonSelectedType !== "image" &&
      commonSelectedType !== "frame" &&
      commonSelectedType !== "magicframe") ||
    targetElements.some((element) => hasStrokeColor(element.type))
  );

  

  




};




// Replace these functions in your Actions.tsx file

export const canChangeBackgroundColor = (
  appState: UIAppState,
  targetElements: ExcalidrawElement[],
) => {
  // Always show fill color for all toolbar shapes
  const toolbarShapes = ["rectangle", "ellipse", "diamond", "arrow", "line", "freedraw", "text"];
  
  return (
    toolbarShapes.includes(appState.activeTool.type) ||
    targetElements.some((element) => toolbarShapes.includes(element.type)) ||
    hasBackground(appState.activeTool.type) ||
    targetElements.some((element) => hasBackground(element.type))
  );
};

// Add this helper function with a different name to avoid conflict
export const hasLinearElements = (
  appState: UIAppState,
  targetElements: ExcalidrawElement[],
) => {
  const linearTypes = ["arrow", "line", "freedraw"];
  
  return (
    linearTypes.includes(appState.activeTool.type) ||
    targetElements.some((element) => linearTypes.includes(element.type))
  );
};


export const SelectedShapeActions = ({
  appState,
  elementsMap,
  renderAction,
  app,
}: {
  appState: UIAppState;
  elementsMap: NonDeletedElementsMap | NonDeletedSceneElementsMap;
  renderAction: ActionManager["renderAction"];
  app: AppClassProperties;
}) => {
  const targetElements = getTargetElements(elementsMap, appState);

  let isSingleElementBoundContainer = false;
  if (
    targetElements.length === 2 &&
    (hasBoundTextElement(targetElements[0]) ||
      hasBoundTextElement(targetElements[1]))
  ) {
    isSingleElementBoundContainer = true;
  }
  const isEditingTextOrNewElement = Boolean(
    appState.editingTextElement || appState.newElement,
  );
  const device = useDevice();
  const isRTL = document.documentElement.getAttribute("dir") === "rtl";

  const showFillIcons =
    (hasBackground(appState.activeTool.type) &&
      !isTransparent(appState.currentItemBackgroundColor)) ||
    targetElements.some(
      (element) =>
        hasBackground(element.type) && !isTransparent(element.backgroundColor),
    );

  const showLinkIcon =
    targetElements.length === 1 || isSingleElementBoundContainer;

  const showLineEditorAction =
    !appState.selectedLinearElement?.isEditing &&
    targetElements.length === 1 &&
    isLinearElement(targetElements[0]) &&
    !isElbowArrow(targetElements[0]);

  const showCropEditorAction =
    !appState.croppingElementId &&
    targetElements.length === 1 &&
    isImageElement(targetElements[0]);

  const showAlignActions =
    !isSingleElementBoundContainer && alignActionsPredicate(appState, app);

  return (
    <div className="selected-shape-actions">
      <div>
        {canChangeStrokeColor(appState, targetElements) &&
          renderAction("changeStrokeColor")}
      </div>
      {canChangeBackgroundColor(appState, targetElements) && (
        <div>{renderAction("changeBackgroundColor")}</div>
      )}
      {showFillIcons && renderAction("changeFillStyle")}

      {(hasStrokeWidth(appState.activeTool.type) ||
        targetElements.some((element) => hasStrokeWidth(element.type))) &&
        renderAction("changeStrokeWidth")}

      {(appState.activeTool.type === "freedraw" ||
        targetElements.some((element) => element.type === "freedraw")) &&
        renderAction("changeStrokeShape")}

      {(hasStrokeStyle(appState.activeTool.type) ||
        targetElements.some((element) => hasStrokeStyle(element.type))) && (
        <>
          {renderAction("changeStrokeStyle")}
          {renderAction("changeSloppiness")}
        </>
      )}

      {(canChangeRoundness(appState.activeTool.type) ||
        targetElements.some((element) => canChangeRoundness(element.type))) && (
        <>{renderAction("changeRoundness")}</>
      )}

      {(toolIsArrow(appState.activeTool.type) ||
        targetElements.some((element) => toolIsArrow(element.type))) && (
        <>{renderAction("changeArrowType")}</>
      )}

      {(appState.activeTool.type === "text" ||
        targetElements.some(isTextElement)) && (
        <>
          {renderAction("changeFontFamily")}
          {renderAction("changeFontSize")}
          {(appState.activeTool.type === "text" ||
            suppportsHorizontalAlign(targetElements, elementsMap)) &&
            renderAction("changeTextAlign")}
        </>
      )}

      {shouldAllowVerticalAlign(targetElements, elementsMap) &&
        renderAction("changeVerticalAlign")}
      {(canHaveArrowheads(appState.activeTool.type) ||
        targetElements.some((element) => canHaveArrowheads(element.type))) && (
        <>{renderAction("changeArrowhead")}</>
      )}

      {renderAction("changeOpacity")}

      <fieldset>
        <legend>{t("labels.layers")}</legend>
        <div className="buttonList">
          {renderAction("sendToBack")}
          {renderAction("sendBackward")}
          {renderAction("bringForward")}
          {renderAction("bringToFront")}
        </div>
      </fieldset>

      {showAlignActions && !isSingleElementBoundContainer && (
        <fieldset>
          <legend>{t("labels.align")}</legend>
          <div className="buttonList">
            {
              // swap this order for RTL so the button positions always match their action
              // (i.e. the leftmost button aligns left)
            }
            {isRTL ? (
              <>
                {renderAction("alignRight")}
                {renderAction("alignHorizontallyCentered")}
                {renderAction("alignLeft")}
              </>
            ) : (
              <>
                {renderAction("alignLeft")}
                {renderAction("alignHorizontallyCentered")}
                {renderAction("alignRight")}
              </>
            )}
            {targetElements.length > 2 &&
              renderAction("distributeHorizontally")}
            {/* breaks the row ˇˇ */}
            <div style={{ flexBasis: "100%", height: 0 }} />
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: ".5rem",
                marginTop: "-0.5rem",
              }}
            >
              {renderAction("alignTop")}
              {renderAction("alignVerticallyCentered")}
              {renderAction("alignBottom")}
              {targetElements.length > 2 &&
                renderAction("distributeVertically")}
            </div>
          </div>
        </fieldset>
      )}
      {!isEditingTextOrNewElement && targetElements.length > 0 && (
        <fieldset>
          <legend>{t("labels.actions")}</legend>
          <div className="buttonList">
            {!device.editor.isMobile && renderAction("duplicateSelection")}
            {!device.editor.isMobile && renderAction("deleteSelectedElements")}
            {renderAction("group")}
            {renderAction("ungroup")}
            {showLinkIcon && renderAction("hyperlink")}
            {showCropEditorAction && renderAction("cropEditor")}
            {showLineEditorAction && renderAction("toggleLinearEditor")}
          </div>
        </fieldset>
      )}
    </div>
  );
};

export const CompactShapeActions = ({
  appState,
  elementsMap,
  renderAction,
  app,
  setAppState,
}: {
  appState: UIAppState;
  elementsMap: NonDeletedElementsMap | NonDeletedSceneElementsMap;
  renderAction: ActionManager["renderAction"];
  app: AppClassProperties;
  setAppState: React.Component<any, AppState>["setState"];
}) => {
  const targetElements = getTargetElements(elementsMap, appState);
  const { saveCaretPosition, restoreCaretPosition } = useTextEditorFocus();
  const { container } = useExcalidrawContainer();

  const isEditingTextOrNewElement = Boolean(
    appState.editingTextElement || appState.newElement,
  );

  const showFillIcons =
    (hasBackground(appState.activeTool.type) &&
      !isTransparent(appState.currentItemBackgroundColor)) ||
    targetElements.some(
      (element) =>
        hasBackground(element.type) && !isTransparent(element.backgroundColor),
    );

  const showLinkIcon = targetElements.length === 1;

  const showLineEditorAction =
    !appState.selectedLinearElement?.isEditing &&
    targetElements.length === 1 &&
    isLinearElement(targetElements[0]) &&
    !isElbowArrow(targetElements[0]);

  const showCropEditorAction =
    !appState.croppingElementId &&
    targetElements.length === 1 &&
    isImageElement(targetElements[0]);

  const showAlignActions = alignActionsPredicate(appState, app);

  let isSingleElementBoundContainer = false;
  if (
    targetElements.length === 2 &&
    (hasBoundTextElement(targetElements[0]) ||
      hasBoundTextElement(targetElements[1]))
  ) {
    isSingleElementBoundContainer = true;
  }

  const isRTL = document.documentElement.getAttribute("dir") === "rtl";

  return (
    <div className="compact-shape-actions">
      {/* Stroke Color */}
      {canChangeStrokeColor(appState, targetElements) && (
        <div className={clsx("compact-action-item")}>
          {renderAction("changeStrokeColor")}
        </div>
      )}

      {/* Background Color */}
      {canChangeBackgroundColor(appState, targetElements) && (
        <div className="compact-action-item">
          {renderAction("changeBackgroundColor")}
        </div>
      )}

      {/* Combined Properties (Fill, Stroke, Opacity) */}
      {(showFillIcons ||
        hasStrokeWidth(appState.activeTool.type) ||
        targetElements.some((element) => hasStrokeWidth(element.type)) ||
        hasStrokeStyle(appState.activeTool.type) ||
        targetElements.some((element) => hasStrokeStyle(element.type)) ||
        canChangeRoundness(appState.activeTool.type) ||
        targetElements.some((element) => canChangeRoundness(element.type))) && (
        <div className="compact-action-item">
          <Popover.Root
            open={appState.openPopup === "compactStrokeStyles"}
            onOpenChange={(open) => {
              if (open) {
                setAppState({ openPopup: "compactStrokeStyles" });
              } else {
                setAppState({ openPopup: null });
              }
            }}
          >
            <Popover.Trigger asChild>
              <button
                type="button"
                className="compact-action-button properties-trigger"
               
                title={t("labels.stroke")}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  setAppState({
                    openPopup:
                      appState.openPopup === "compactStrokeStyles"
                        ? null
                        : "compactStrokeStyles",
                  });
                }}
              >
                {adjustmentsIcon}
              </button>
            </Popover.Trigger>
            {appState.openPopup === "compactStrokeStyles" && (
              <PropertiesPopover
                className={PROPERTIES_CLASSES}
                container={container}
                style={{ maxWidth: "13rem" }}
                onClose={() => {}}
              >
                <div className="selected-shape-actions">
                  {showFillIcons && renderAction("changeFillStyle")}
                  {(hasStrokeWidth(appState.activeTool.type) ||
                    targetElements.some((element) =>
                      hasStrokeWidth(element.type),
                    )) &&
                    renderAction("changeStrokeWidth")}
                  {(hasStrokeStyle(appState.activeTool.type) ||
                    targetElements.some((element) =>
                      hasStrokeStyle(element.type),
                    )) && (
                    <>
                      {renderAction("changeStrokeStyle")}
                      {renderAction("changeSloppiness")}
                    </>
                  )}
                  {(canChangeRoundness(appState.activeTool.type) ||
                    targetElements.some((element) =>
                      canChangeRoundness(element.type),
                    )) &&
                    renderAction("changeRoundness")}
                  {renderAction("changeOpacity")}
                </div>
              </PropertiesPopover>
            )}
          </Popover.Root>
        </div>
      )}

      {/* Combined Arrow Properties */}
      {(toolIsArrow(appState.activeTool.type) ||
        targetElements.some((element) => toolIsArrow(element.type))) && (
        <div className="compact-action-item">
          <Popover.Root
            open={appState.openPopup === "compactArrowProperties"}
            onOpenChange={(open) => {
              if (open) {
                setAppState({ openPopup: "compactArrowProperties" });
              } else {
                setAppState({ openPopup: null });
              }
            }}
          >
            <Popover.Trigger asChild>
              <button
                type="button"
                className="compact-action-button properties-trigger"
                title={t("labels.arrowtypes")}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  setAppState({
                    openPopup:
                      appState.openPopup === "compactArrowProperties"
                        ? null
                        : "compactArrowProperties",
                  });
                }}
              >
                {(() => {
                  // Show an icon based on the current arrow type
                  const arrowType = getFormValue(
                    targetElements,
                    app,
                    (element) => {
                      if (isArrowElement(element)) {
                        return element.elbowed
                          ? "elbow"
                          : element.roundness
                          ? "round"
                          : "sharp";
                      }
                      return null;
                    },
                    (element) => isArrowElement(element),
                    (hasSelection) =>
                      hasSelection ? null : appState.currentItemArrowType,
                  );

                  if (arrowType === "elbow") {
                    return elbowArrowIcon;
                  }
                  if (arrowType === "round") {
                    return roundArrowIcon;
                  }
                  return sharpArrowIcon;
                })()}
              </button>
            </Popover.Trigger>
            {appState.openPopup === "compactArrowProperties" && (
              <PropertiesPopover
                container={container}
                className="properties-content"
                style={{ maxWidth: "13rem" }}
                onClose={() => {}}
              >
                {renderAction("changeArrowProperties")}
              </PropertiesPopover>
            )}
          </Popover.Root>
        </div>
      )}

      {/* Linear Editor */}
      {showLineEditorAction && (
        <div className="compact-action-item">
          {renderAction("toggleLinearEditor")}
        </div>
      )}

      {/* Text Properties */}
      {(appState.activeTool.type === "text" ||
        targetElements.some(isTextElement)) && (
        <>
          <div className="compact-action-item">
            {renderAction("changeFontFamily")}
          </div>
          <div className="compact-action-item">
            <Popover.Root
              open={appState.openPopup === "compactTextProperties"}
              onOpenChange={(open) => {
                if (open) {
                  if (appState.editingTextElement) {
                    saveCaretPosition();
                  }
                  setAppState({ openPopup: "compactTextProperties" });
                } else {
                  setAppState({ openPopup: null });
                  if (appState.editingTextElement) {
                    restoreCaretPosition();
                  }
                }
              }}
            >
              <Popover.Trigger asChild>
                <button
                  type="button"
                  className="compact-action-button properties-trigger"
                  title={t("labels.textAlign")}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (appState.openPopup === "compactTextProperties") {
                      setAppState({ openPopup: null });
                    } else {
                      if (appState.editingTextElement) {
                        saveCaretPosition();
                      }
                      setAppState({ openPopup: "compactTextProperties" });
                    }
                  }}
                >
                  {TextSizeIcon}
                </button>
              </Popover.Trigger>
              {appState.openPopup === "compactTextProperties" && (
                <PropertiesPopover
                  className={PROPERTIES_CLASSES}
                  container={container}
                  style={{ maxWidth: "13rem" }}
                  // Improve focus handling for text editing scenarios
                  preventAutoFocusOnTouch={!!appState.editingTextElement}
                  onClose={() => {
                    // Refocus text editor when popover closes with caret restoration
                    if (appState.editingTextElement) {
                      restoreCaretPosition();
                    }
                  }}
                >
                  <div className="selected-shape-actions">
                    {(appState.activeTool.type === "text" ||
                      targetElements.some(isTextElement)) &&
                      renderAction("changeFontSize")}
                    {(appState.activeTool.type === "text" ||
                      suppportsHorizontalAlign(targetElements, elementsMap)) &&
                      renderAction("changeTextAlign")}
                    {shouldAllowVerticalAlign(targetElements, elementsMap) &&
                      renderAction("changeVerticalAlign")}
                  </div>
                </PropertiesPopover>
              )}
            </Popover.Root>
          </div>
        </>
      )}

      {/* Dedicated Copy Button */}
      {!isEditingTextOrNewElement && targetElements.length > 0 && (
        <div className="compact-action-item">
          {renderAction("duplicateSelection")}
        </div>
      )}

      {/* Dedicated Delete Button */}
      {!isEditingTextOrNewElement && targetElements.length > 0 && (
        <div className="compact-action-item">
          {renderAction("deleteSelectedElements")}
        </div>
      )}

      {/* Combined Other Actions */}
      {!isEditingTextOrNewElement && targetElements.length > 0 && (
        <div className="compact-action-item">
          <Popover.Root
            open={appState.openPopup === "compactOtherProperties"}
            onOpenChange={(open) => {
              if (open) {
                setAppState({ openPopup: "compactOtherProperties" });
              } else {
                setAppState({ openPopup: null });
              }
            }}
          >
            <Popover.Trigger asChild>
              <button
                type="button"
                className="compact-action-button properties-trigger"
                title={t("labels.actions")}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setAppState({
                    openPopup:
                      appState.openPopup === "compactOtherProperties"
                        ? null
                        : "compactOtherProperties",
                  });
                }}
              >
                {DotsHorizontalIcon}
              </button>
            </Popover.Trigger>
            {appState.openPopup === "compactOtherProperties" && (
              <PropertiesPopover
                className={PROPERTIES_CLASSES}
                container={container}
                style={{
                  maxWidth: "12rem",
                  // center the popover content
                  justifyContent: "center",
                  alignItems: "center",
                }}
                onClose={() => {}}
              >
                <div className="selected-shape-actions">
                  <fieldset>
                    <legend>{t("labels.layers")}</legend>
                    <div className="buttonList">
                      {renderAction("sendToBack")}
                      {renderAction("sendBackward")}
                      {renderAction("bringForward")}
                      {renderAction("bringToFront")}
                    </div>
                  </fieldset>

                  {showAlignActions && !isSingleElementBoundContainer && (
                    <fieldset>
                      <legend>{t("labels.align")}</legend>
                      <div className="buttonList">
                        {isRTL ? (
                          <>
                            {renderAction("alignRight")}
                            {renderAction("alignHorizontallyCentered")}
                            {renderAction("alignLeft")}
                          </>
                        ) : (
                          <>
                            {renderAction("alignLeft")}
                            {renderAction("alignHorizontallyCentered")}
                            {renderAction("alignRight")}
                          </>
                        )}
                        {targetElements.length > 2 &&
                          renderAction("distributeHorizontally")}
                        {/* breaks the row ˇˇ */}
                        <div style={{ flexBasis: "100%", height: 0 }} />
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: ".5rem",
                            marginTop: "-0.5rem",
                          }}
                        >
                          {renderAction("alignTop")}
                          {renderAction("alignVerticallyCentered")}
                          {renderAction("alignBottom")}
                          {targetElements.length > 2 &&
                            renderAction("distributeVertically")}
                        </div>
                      </div>
                    </fieldset>
                  )}
                  <fieldset>
                    <legend>{t("labels.actions")}</legend>
                    <div className="buttonList">
                      {renderAction("group")}
                      {renderAction("ungroup")}
                      {showLinkIcon && renderAction("hyperlink")}
                      {showCropEditorAction && renderAction("cropEditor")}
                    </div>
                  </fieldset>
                </div>
              </PropertiesPopover>
            )}
          </Popover.Root>
        </div>
      )}
    </div>
  );
};

// Dynamic Color Box that shows the last selected color
const DynamicColorBox = ({
  appState,
  lastSelectedColorSource,
}: {
  appState: UIAppState;
  lastSelectedColorSource: 'fill' | 'stroke';
}) => {
  const currentColor = lastSelectedColorSource === 'fill'
    ? appState.currentItemBackgroundColor || "#d4a574"
    : appState.currentItemStrokeColor || "#000000";

  return (
    <div
      className="ColorDisplayBox"
      title="Current Color"
      aria-label="Current Color"
      style={{
        width: "28px",
        height: "28px",
        border: "2px solid #ccc",
        borderRadius: "4px",
        backgroundColor: currentColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "default",
        userSelect: "none",
      }}
    >
      {/* Small transparent indicator for transparent colors */}
      {(currentColor === "transparent" || currentColor === "#ffffff00") && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(45deg)",
            width: "16px",
            height: "2px",
            backgroundColor: "#666",
          }}
        />
      )}
    </div>
  );
};

// F and S Color Buttons (Fill and Stroke)
const ColorButtons = ({
  appState,
  onChange,
  container,
  elementsMap,
  renderAction,
  setLastSelectedColorSource,
}: {
  appState: UIAppState;
  onChange: (updates: Partial<UIAppState>) => void;
  container: HTMLElement;
  elementsMap: NonDeletedElementsMap;
  renderAction: any;
  setLastSelectedColorSource: React.Dispatch<React.SetStateAction<'fill' | 'stroke'>>;
}) => {
  const [fillOpen, setFillOpen] = useState(false);
  const [strokeOpen, setStrokeOpen] = useState(false);
  const targetElements = getTargetElements(elementsMap, appState);
  const { currentItemBackgroundColor } = appState;

  // Check if we're dealing with linear elements (arrows, lines)
  const linearTypes = ["arrow", "line", "freedraw"];
  const isLinearElementType = linearTypes.includes(appState.activeTool.type) ||
    targetElements.some((element) => linearTypes.includes(element.type));

  // Display the appropriate color based on element type for preview
  const displayFillColor = targetElements.length === 1
    ? targetElements[0]?.backgroundColor || currentItemBackgroundColor || "#d4a574"
    : currentItemBackgroundColor || "#d4a574";

  const displayStrokeColor = targetElements.length === 1
    ? targetElements[0]?.strokeColor || appState.currentItemStrokeColor || "#000000"
    : appState.currentItemStrokeColor || "#000000";

  const fillColorIsTransparent = displayFillColor === "transparent";
  const strokeColorIsTransparent = displayStrokeColor === "transparent";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      {/* F Button (Fill Color) */}
      <Popover.Root open={fillOpen} onOpenChange={setFillOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="ColorButton"
            title="Fill Color (F)"
            aria-label="Fill Color"
            style={{
              width: "20px",
              height: "16px",
              fontSize: "10px",
              fontWeight: "bold",
              color: "#333",
              backgroundColor: "#e8f4f8", // Light blue background for Fill button
              border: "1px solid #ccc",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
            }}
          >
            F
          </button>
        </Popover.Trigger>
        <Popover.Content
          className="style-picker-popover excalidraw"
          style={{
            minWidth: "200px",
            zIndex: 1200,
          }}
          align="start"
          side="bottom"
          avoidCollisions={true}
          collisionPadding={10}
        >
          <div className="style-picker-container">
            <div className="style-picker-section">
              <label className="style-picker-label">Fill Color</label>
              <div className="color-controls">
                <ColorPicker
                  type="elementBackground"
                  color={
                    targetElements.length === 1
                      ? targetElements[0]?.backgroundColor ?? null
                      : null
                  }
                  onChange={(color) => {
                    onChange({
                      currentItemBackgroundColor: color,
                    });
                    setLastSelectedColorSource('fill');
                    setFillOpen(false);
                  }}
                  label="Fill Color"
                  elements={targetElements}
                  appState={appState as any}
                  updateData={(data) => {
                    if (data.openPopup !== undefined) {
                      onChange({ openPopup: data.openPopup } as any);
                    }
                  }}
                  compactMode={false}
                />
              </div>
            </div>
          </div>
        </Popover.Content>
      </Popover.Root>

      {/* S Button (Stroke Color & Properties) */}
      <Popover.Root open={strokeOpen} onOpenChange={setStrokeOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="ColorButton"
            title="Stroke & Properties (S)"
            aria-label="Stroke & Properties"
            style={{
              width: "20px",
              height: "16px",
              fontSize: "10px",
              fontWeight: "bold",
              color: "#333",
              backgroundColor: "#cee4c2ff", // Light pink/red background for Stroke button
              border: "1px solid #ccc",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
            }}
          >
            S
          </button>
        </Popover.Trigger>
        <Popover.Content
          className="style-picker-popover excalidraw"
          style={{
            minWidth: "280px",
            zIndex: 1200,
          }}
          align="start"
          side="bottom"
          avoidCollisions={true}
          collisionPadding={10}
        >
          <div className="style-picker-container">
            {/* Stroke Color */}
            <div className="style-picker-section">
              <label className="style-picker-label">Stroke Color</label>
              <div className="color-controls">
                <ColorPicker
                  type="elementStroke"
                  color={
                    targetElements.length === 1
                      ? targetElements[0]?.strokeColor ?? null
                      : null
                  }
                  onChange={(color) => {
                    onChange({
                      currentItemStrokeColor: color,
                    });
                    setLastSelectedColorSource('stroke');
                    setStrokeOpen(false);
                  }}
                  label="Stroke Color"
                  elements={targetElements}
                  appState={appState as any}
                  updateData={(data) => {
                    if (data.openPopup !== undefined) {
                      onChange({ openPopup: data.openPopup } as any);
                    }
                  }}
                  compactMode={false}
                />
              </div>
            </div>

            {/* Properties */}
            <div className="style-picker-section">
              <label className="style-picker-label">Properties</label>
              <div
                className="style-properties"
                onClick={() => setStrokeOpen(false)} // CLOSE ON ANY PROPERTY CLICK
              >
                {renderAction("changeStrokeWidth")}
                {renderAction("changeFillStyle")}
                {renderAction("changeStrokeStyle")}
                {renderAction("changeRoundness")}
              </div>
            </div>

            {/* Text-specific */}
            {appState.activeTool.type === "text" && (
              <div className="style-picker-section">
                <label className="style-picker-label">Text</label>
                <div
                  className="style-properties"
                  onClick={() => setStrokeOpen(false)} // CLOSE ON ANY TEXT PROPERTY CLICK
                >
                  {renderAction("changeFontFamily")}
                  {renderAction("changeFontSize")}
                  {renderAction("changeTextAlign")}
                </div>
              </div>
            )}
          </div>
        </Popover.Content>
      </Popover.Root>
    </div>
  );
};




// BG Dropdown Component - Styled like other toolbar buttons with hover effects
const BGDropdown = ({ appState, onChange, renderAction }: {
  appState: UIAppState;
  onChange: (updates: Partial<UIAppState>) => void;
  renderAction: any;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="ToolIcon_type_button ToolIcon"
          title="Canvas Background (BG)"
          // aria-label="Canvas Background"
          style={{
            border: "none",
            padding: 0,
            backgroundColor: "initial",
            fontSize: "inherit",
            margin: 0,
          }}
        >
          <div
            className="ToolIcon__icon"
            style={{
              // backgroundColor: appState.viewBackgroundColor || "#ffffff",
              background:"transparint",
              color: "#333",
              fontSize: "10px",
              fontWeight: "bold",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
            aria-disabled="false"
          >
            BG
          </div>
        </button>
      </Popover.Trigger>
      <Popover.Content
        className="style-picker-popover excalidraw"
        style={{
          minWidth: "200px",
          zIndex: 1200,
        }}
        align="start"
        side="bottom"
        avoidCollisions={true}
        collisionPadding={10}
        onClick={() => setIsOpen(false)}
      >
        <div className="style-picker-container">
          <div className="style-picker-section">
            <label className="style-picker-label">Canvas Background</label>
            <div className="color-controls">
              {renderAction("changeViewBackgroundColor")}
            </div>
          </div>
        </div>
      </Popover.Content>
    </Popover.Root>
  );
};

// Emjoies function

export const ShapesSwitcher = ({
  activeTool,
  appState,
  app,
  UIOptions,
  elementsMap,
  setAppState,
  onChange,
  renderAction,
  isCollaborating,
  onShareDialogOpen,
  renderTopRightUI,
}: {
  activeTool: UIAppState["activeTool"];
  appState: UIAppState;
  app: AppClassProperties;
  UIOptions: AppProps["UIOptions"];
  elementsMap: any;
  setAppState: any;
  onChange: any;
  renderAction: any;
  isCollaborating: boolean;
  onShareDialogOpen?: () => void;
  renderTopRightUI?: React.ComponentProps<any>["renderTopRightUI"];
}) => {
    const [isShapesMenuOpen, setIsShapesMenuOpen] = useState(false);
  const [isEmojiMenuOpen, setIsEmojiMenuOpen] = useState(false);
  const [isFlowchartMenuOpen, setIsFlowchartMenuOpen] = useState(false);
  const [isGraphMenuOpen, setIsGraphMenuOpen] = useState(false);
  const [lastSelectedColorSource, setLastSelectedColorSource] = useState<'fill' | 'stroke'>('stroke');



  const frameToolSelected = activeTool.type === "frame";
  // const laserToolSelected = activeTool.type === "laser";
  // const lassoToolSelected =
  //   activeTool.type === "lasso" && app.defaultSelectionTool !== "lasso";

  const embeddableToolSelected = activeTool.type === "embeddable";

  // Check if any merged shape is currently active
  const mergedShapesSelected = [
    "rectangle",
    "diamond",
    "ellipse",
    "arrow",
    "line",
  ].includes(activeTool.type);

  const { TTDDialogTriggerTunnel } = useTunnels();
  const { container } = useExcalidrawContainer();
  

  const toolbarTools = getToolbarTools(app);

  return (
    <>
      <TTDDialogTriggerTunnel.In>
      </TTDDialogTriggerTunnel.In>

      {toolbarTools.map(
        ({ value, icon, key, numericKey, fillable = false }, index) => {

          if (
            UIOptions.tools?.[
              value as Extract<
                typeof value,
                keyof AppProps["UIOptions"]["tools"]
              >
            ] === false
          ) {
            return null;
          }

// Handle canvas background tool
          if (value === "canvasbackground") {
            return (
              <BGDropdown
                key={value}
                appState={appState}
                onChange={onChange}
                renderAction={renderAction}
              />
            );
          }



// Emojies Section


// Emojies Section
// ---------- Replace your existing Emoji dropdown with this block ----------
if (value === "emoji") {
  return (
    <DropdownMenu open={isEmojiMenuOpen} key={value}>
      <DropdownMenu.Trigger
        className="ToolIcon"
        onToggle={() => setIsEmojiMenuOpen(!isEmojiMenuOpen)}
        title="Emojis"
      >
        <span className={"ToolIcon__keybinding"}>8</span>
       <span style={{ filter: "grayscale(100%) brightness(1.1) contrast(1.2)" }}>
    😊
  </span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        onClickOutside={() => setIsEmojiMenuOpen(false)}
        onSelect={() => setIsEmojiMenuOpen(false)}
        className="App-toolbar__shapes-dropdown"
        style={{ display: "flex", gap: "0.5rem", padding: "0.5rem" }}
      >
        {["❤️", "😂", "😢", "😎", "👍"].map((emoji) => (
          <DropdownMenu.Item
            key={emoji}
            onSelect={() => {
              // call the helper (it's async). we intentionally don't await here.
              void insertEmoji(app, emoji);
              setIsEmojiMenuOpen(false);
            }}
            style={{ fontSize: "1.5rem" }}
          >
            {emoji}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}





// ------------------------------------------------------------------------



// FlowChart sEction




if (value === "flowchart") {
  return (
    <DropdownMenu open={isFlowchartMenuOpen} key={value}>
      <DropdownMenu.Trigger
        className="ToolIcon"
        onToggle={() => setIsFlowchartMenuOpen(!isFlowchartMenuOpen)}
        title="Flowchart"
      >
        <span className="ToolIcon__keybinding">9</span>
        
         <span style={{ filter: "grayscale(100%) brightness(1.1) contrast(1.2)" }}>
  📊
</span>

      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <FlowchartDropdown
          addElementsViaAction={(els: any[]) => {
            // Get current elements using the correct method
            const currentElements = app.scene.getNonDeletedElements();
            const newElements = [...currentElements, ...els];
            
            // Replace all elements
            app.scene.replaceAllElements(newElements);
            
            // Close the dropdown
            setIsFlowchartMenuOpen(false);
          }}
        />
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}


// Graphs
// FlowChart section (your existing code)




          // Handle the style picker tool specially (with F/S buttons)
          if (value === "stylepicker") {
            return (
              <div key={value} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <ColorButtons
                  appState={appState}
                  onChange={onChange}
                  container={container || document.body}
                  elementsMap={elementsMap || new Map()}
                  renderAction={renderAction}
                  setLastSelectedColorSource={setLastSelectedColorSource}
                />
                <DynamicColorBox
                  appState={appState}
                  lastSelectedColorSource={lastSelectedColorSource || 'stroke'}
                />
                {renderTopRightUI?.(false, appState)}
              </div>
            );
          }

// color




// FlowChart Working



          // Handle the shapes dropdown specially
          if (value === "shapes") {
            return (
              <DropdownMenu open={isShapesMenuOpen} key={value}>
                <DropdownMenu.Trigger
                  className={clsx("Shape", { fillable},"ToolIcon","ToolIcon--selected")}
                  onToggle={() => setIsShapesMenuOpen(!isShapesMenuOpen)}
                  title={t("toolBar.rectangle")}
                                   
                >
                  <span className="ToolIcon__keybinding">7</span>
                  {/* Show the icon of the currently active shape, or rectangle if none is active */}
                  {mergedShapesSelected ? (
                    activeTool.type === "rectangle" ? RectangleIcon :
                    activeTool.type === "diamond" ? DiamondIcon :
                    activeTool.type === "ellipse" ? EllipseIcon :
                    activeTool.type === "arrow" ? ArrowIcon :
                    activeTool.type === "line" ? LineIcon : RectangleIcon
                  ) : RectangleIcon}
                </DropdownMenu.Trigger>
                <DropdownMenu.Content
                  onClickOutside={() => setIsShapesMenuOpen(false)}
                  onSelect={() => setIsShapesMenuOpen(false)}
                  className="App-toolbar__shapes-dropdown"
                >
                  <DropdownMenu.Item
                    onSelect={() => app.setActiveTool({ type: "rectangle" })}
                    icon={RectangleIcon}
                    shortcut={capitalizeString(KEYS.R)}
                    data-testid="toolbar-rectangle"
                    selected={activeTool.type === "rectangle"}
                  >
                    {t("toolBar.rectangle")}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onSelect={() => app.setActiveTool({ type: "diamond" })}
                    icon={DiamondIcon}
                    shortcut={capitalizeString(KEYS.D)}
                    data-testid="toolbar-diamond"
                    selected={activeTool.type === "diamond"}
                  >
                    {t("toolBar.diamond")}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onSelect={() => app.setActiveTool({ type: "ellipse" })}
                    icon={EllipseIcon}
                    shortcut={capitalizeString(KEYS.O)}
                    data-testid="toolbar-ellipse"
                    selected={activeTool.type === "ellipse"}
                  >
                    {t("toolBar.ellipse")}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onSelect={() => app.setActiveTool({ type: "arrow" })}
                    icon={ArrowIcon}
                    shortcut={capitalizeString(KEYS.A)}
                    data-testid="toolbar-arrow"
                    selected={activeTool.type === "arrow"}
                  >
                    {t("toolBar.arrow")}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onSelect={() => app.setActiveTool({ type: "line" })}
                    icon={LineIcon}
                    shortcut={capitalizeString(KEYS.L)}
                    data-testid="toolbar-line"
                    selected={activeTool.type === "line"}
                  >
                    {t("toolBar.line")}
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu>
            );
          }



          const label = t(`toolBar.${value}`);
          const letter =
            key && capitalizeString(typeof key === "string" ? key : key[0]);
          const shortcut = letter
            ? `${letter} ${t("helpDialog.or")} ${
                numericKey
                  ? Array.isArray(numericKey)
                    ? numericKey[0]
                    : String(numericKey)
                  : ""
              }`
            : `${
                numericKey
                  ? Array.isArray(numericKey)
                    ? numericKey[0]
                    : String(numericKey)
                  : ""
              }`;

          return (
            <ToolButton
              className={clsx("Shape", { fillable })}
              key={value}
              type="radio"
              icon={icon}
              checked={activeTool.type === value}
              name="editor-current-shape"
              title={`${capitalizeString(label)} — ${shortcut}`}
              keyBindingLabel={
                (numericKey &&
                  (Array.isArray(numericKey) ? numericKey[0] : numericKey)) ||
                letter
              }
              aria-label={capitalizeString(label)}
              aria-keyshortcuts={shortcut}
              data-testid={`toolbar-${value}`}
              onPointerDown={({ pointerType }) => {
                if (!appState.penDetected && pointerType === "pen") {
                  app.togglePenMode(true);
                }

                if (value === "selection") {
                  if (appState.activeTool.type === "selection") {
                    app.setActiveTool({ type: "lasso" });
                  } else {
                    app.setActiveTool({ type: "selection" });
                  }
                }
              }}
              onChange={({ pointerType }) => {
                if (appState.activeTool.type !== value) {
                  trackEvent("toolbar", value, "ui");
                }
                if (value === "image") {
                  app.setActiveTool({
                    type: value,
                  });
                } else {
                  app.setActiveTool({ type: value });
                }
              }}
            />
          );
        },
      )}




    





      
    </>
  );

// Color








};








// ---------- Add this helper function near the bottom of the file (before ZoomActions) ----------



/**
 * Insert an emoji into the canvas as a text element.
 */
async function insertEmoji(app: AppClassProperties, emoji: string) {
  console.log("insertEmoji called with:", emoji);
  
  try {
    // Generate random position to avoid overlapping
    const randomX = 300 + Math.random() * 400; // Random between 200-600
    const randomY = 50 + Math.random() * 300; // Random between 150-450
    
    // Or use a counter approach for consistent spacing
    // You could also store a counter and increment it
    
    const textElement = newTextElement({
      x: randomX,
      y: randomY,
      text: emoji,
      fontSize: 48,
      fontFamily: 1,
      textAlign: "center",
      verticalAlign: "middle",
    });
    
    console.log("Created text element at:", randomX, randomY);

    const currentElements = app.scene.getNonDeletedElements();
    const newElements = [...currentElements, textElement];

    app.scene.replaceAllElements(newElements);
    
    console.log("Scene updated successfully");

  } catch (err) {
    console.error("Failed to insert emoji:", err);
  }
}




export const ZoomActions = ({
  renderAction,
  zoom,
}: {
  renderAction: ActionManager["renderAction"];
  zoom: Zoom;
}) => (
  <Stack.Col gap={1} className={CLASSES.ZOOM_ACTIONS}>
    <Stack.Row align="center">
      {renderAction("zoomOut")}
      {renderAction("resetZoom")}
      {renderAction("zoomIn")}
    </Stack.Row>
  </Stack.Col>
);

export const UndoRedoActions = ({
  renderAction,
  className,
}: {
  renderAction: ActionManager["renderAction"];
  className?: string;
}) => (
  <div className={`undo-redo-buttons ${className}`}>
    <div className="undo-button-container">
      <Tooltip label={t("buttons.undo")}>{renderAction("undo")}</Tooltip>
    </div>
    <div className="redo-button-container">
      <Tooltip label={t("buttons.redo")}> {renderAction("redo")}</Tooltip>
    </div>
  </div>
);



export const ExitZenModeAction = ({
  actionManager,
  showExitZenModeBtn,
}: {
  actionManager: ActionManager;
  showExitZenModeBtn: boolean;
}) => (
  <button
    type="button"
    className={clsx("disable-zen-mode", {
      "disable-zen-mode--visible": showExitZenModeBtn,
    })}
    onClick={() => actionManager.executeAction(actionToggleZenMode)}
  >
    {t("buttons.exitZenMode")}
  </button>
);
