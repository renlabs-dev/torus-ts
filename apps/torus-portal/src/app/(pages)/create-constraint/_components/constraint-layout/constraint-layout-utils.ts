import { Position } from "@xyflow/react";
import type { Direction } from "./constraint-layout-types";

export function getSourceHandlePosition(direction: Direction) {
  switch (direction) {
    case "TB":
      return Position.Bottom;
    case "BT":
      return Position.Top;
    case "LR":
      return Position.Right;
    case "RL":
      return Position.Left;
  }
}

export function getTargetHandlePosition(direction: Direction) {
  switch (direction) {
    case "TB":
      return Position.Top;
    case "BT":
      return Position.Bottom;
    case "LR":
      return Position.Left;
    case "RL":
      return Position.Right;
  }
}
