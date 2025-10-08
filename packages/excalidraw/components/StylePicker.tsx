import React, { useState } from "react";
import "./Toolbar.scss";
import type { UIAppState } from "../types";
import type { ExcalidrawElement, NonDeletedElementsMap } from "@excalidraw/element/types";

interface StylePickerProps {
  appState: UIAppState;
  elementsMap: NonDeletedElementsMap;
  onChange: (updates: Partial<UIAppState>) => void;  // FIXED: removed the stray 'f'
  renderAction: any; // ActionManager renderAction type
  container: HTMLElement;
}


export const StylePicker: React.FC<StylePickerProps> = ({
  appState,
}) => {
  // Get the current color from the most recently selected (stroke)
  const currentColor = appState.currentItemStrokeColor || appState.currentItemBackgroundColor || "#000000";

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



const getTargetElements = (
  elementsMap: NonDeletedElementsMap,
  appState: UIAppState,
) => {
  const selectedElements = appState.selectedElementIds || {};
  const elements: ExcalidrawElement[] = [];

  for (const element of elementsMap.values()) {
    if ((selectedElements as Record<string, boolean>)[element.id]) {
      elements.push(element);
    }
  }

  return elements;
};
