import { Card } from "@torus-ts/ui/components/card";
import type {
  CustomGraphData,
  CustomGraphNode,
} from "./permission-graph-utils";

interface PermissionGraphDetailsProps {
  selectedNode: CustomGraphNode | null;
  graphData: CustomGraphData | null;
}

export function PermissionGraphDetails(props: PermissionGraphDetailsProps) {
  return (
    <Card className="w-full lg:w-80 p-4">
      <h3 className="text-lg font-semibold mb-3">
        {props.selectedNode ? "Node Details" : "Graph Information"}
      </h3>

      {props.selectedNode ? (
        <div>
          <p>
            <span className="font-medium">ID:</span> {props.selectedNode.id}
          </p>
          <p>
            <span className="font-medium">Name:</span> {props.selectedNode.name}
          </p>
          {props.selectedNode.val && (
            <p>
              <span className="font-medium">Value:</span>{" "}
              {props.selectedNode.val}
            </p>
          )}
          <div className="mt-2">
            <span className="font-medium">Color:</span>
            <div
              className="inline-block ml-2 w-4 h-4 rounded-full"
              style={{ backgroundColor: props.selectedNode.color }}
            />
          </div>
        </div>
      ) : (
        <div>
          {props.graphData ? (
            <>
              <p>
                <span className="font-medium">Nodes:</span>{" "}
                {props.graphData.nodes.length}
              </p>
              <p>
                <span className="font-medium">Links:</span>{" "}
                {props.graphData.links.length}
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Click on a node to view its details.
              </p>
            </>
          ) : (
            <p className="text-slate-400">Loading graph data...</p>
          )}
        </div>
      )}
    </Card>
  );
}
