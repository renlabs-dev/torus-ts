import type { DragEvent } from "react";
import { useDnD } from "./permission-flow-dnd-context";

type NodeType = "input" | "default" | "output" | "selectorNode";

function PermissionFlowSidebar() {
  const [_, setType] = useDnD();

  const onDragStart = (
    event: DragEvent<HTMLDivElement>,
    nodeType: NodeType,
  ): void => {
    setType(nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside
      className="text-white bg-[#101010] p-[15px_10px] text-xs border-r border-solid
        border-r-gray-200 w-full md:w-1/5 md:max-w-[250px]"
    >
      <div className="mb-2.5">
        You can drag these nodes to the pane on the right.
      </div>
      <div
        className="h-5 p-1 border border-solid border-[#0041d0] rounded mb-2.5 flex justify-center
          items-center cursor-grab"
        onDragStart={(event) => onDragStart(event, "input")}
        draggable
      >
        Input Node
      </div>
      <div
        className="h-5 p-1 border border-solid border-[#1a192b] rounded mb-2.5 flex justify-center
          items-center cursor-grab"
        onDragStart={(event) => onDragStart(event, "default")}
        draggable
      >
        Default Node
      </div>
      <div
        className="h-5 p-1 border border-solid border-[#ff0072] rounded mb-2.5 flex justify-center
          items-center cursor-grab"
        onDragStart={(event) => onDragStart(event, "output")}
        draggable
      >
        Output Node
      </div>
      <div
        className="h-5 p-1 border border-solid border-[#c9f1dd] rounded mb-2.5 flex justify-center
          items-center cursor-grab text-black"
        onDragStart={(event) => onDragStart(event, "selectorNode")}
        draggable
      >
        Color Selector Node
      </div>
    </aside>
  );
}

export default PermissionFlowSidebar;
