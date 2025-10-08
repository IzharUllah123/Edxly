import { KEYS } from "@excalidraw/common";
import LiveCollaborationTrigger from "./live-collaboration/LiveCollaborationTrigger";
import {
  SelectionIcon,
  FreedrawIcon,
  TextIcon,
  ImageIcon,
  EraserIcon,
  handIcon,
  RectangleIcon,
  DiamondIcon,
  EllipseIcon,
  ArrowIcon,
  LineIcon,
  adjustmentsIcon,
  backgroundIcon,
  EmojiIcon
} from "./icons";

import type { AppClassProperties } from "../types";
import { Value } from "sass";

// Custom shapes icon that combines multiple shapes



export const SHAPES = [
  {
    icon: handIcon,
    value: "hand",
    key: KEYS.H,
    numericKey: KEYS["1"],
    fillable: false,
  },

  {
    icon: SelectionIcon,
    value: "selection",
    key: KEYS.V,
    numericKey: KEYS["2"],
    fillable: false,
  },

  {
    icon: FreedrawIcon,
    value: "freedraw",
    key: KEYS.P, 
    numericKey: KEYS["3"],
    fillable: false,
  },

  {
    icon: EraserIcon,
    value: "eraser",
    key: KEYS.E,
    numericKey: KEYS["4"],
    fillable: false,
  },

  {
    icon: TextIcon,
    value: "text",
    key: KEYS.T,
    numericKey: KEYS["5"],
    fillable: false,
  },

  {
    icon: backgroundIcon,
    value: "canvasbackground",
    key: "B",
    fillable: false,
  },

  {
    icon: ImageIcon,
    value: "image",
    key: "I",
    numericKey: KEYS["6"],
    fillable: false,
  },


{
  icon: <img src="1.png" alt="Shapes" style={{ width: 20, height: 20 }} />,
  value: "shapes",
  key: KEYS.S,
  numericKey: KEYS["7"],
  fillable: true,
},




// {
//   value: "emoji",
//  icon: "☺",
//   key: KEYS.F,
//   numericKey: KEYS["8"],
//   fillable: false
// },

{ 
  value: "emoji",
  icon: EmojiIcon,  // Use the SVG component
  key: KEYS.F,
  numericKey: KEYS["8"],
  fillable: false 
},

   {
  value: "flowchart",
  icon: "fLow",
  key: KEYS.G,
  numericKey: KEYS["9"],
  fillable: false,
},

 {
  value: "stylepicker",
  icon: adjustmentsIcon,
  key: "z",
  numericKey: "1",
  fillable: false,
},


] as const;



export const getToolbarTools = (app: AppClassProperties) => {
  return app.defaultSelectionTool === "lasso"
    ? ([
        {
          value: "lasso",
          icon: SelectionIcon,
          key: KEYS.V,
          numericKey: KEYS["1"],
          fillable: true,
        },
        SHAPES[1],
        ...SHAPES.slice(2),
      ] as const)
    : SHAPES;



    
};




export const findShapeByKey = (key: string, app: AppClassProperties) => {
  const shape = getToolbarTools(app).find((shape, index) => {
    return (
      (shape.numericKey != null && key === shape.numericKey.toString()) ||
      (shape.key &&
        (typeof shape.key === "string"
          ? shape.key === key
          : (shape.key as readonly string[]).includes(key)))
    );
  });
  return shape;
}
