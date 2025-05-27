"use client";

import { useCallback, useState } from "react";
import type { NodeProps } from "@xyflow/react";
import { Input } from "@torus-ts/ui/components/input";
import { Key } from "lucide-react";
import type { PermissionIdNodeData } from "./constraint-node-types";
import {
  PermissionNodeContainer,
  useChildNodeManagement,
} from "./constraint-node-container";
import { permissionIdSchema } from "../constraint-validation-schemas";

interface PermissionNodePermissionIdProps {
  id: string;
  data: PermissionIdNodeData;
}

export function PermissionNodePermissionId({
  id,
  data,
}: PermissionNodePermissionIdProps) {
  const { updateNodeData } = useChildNodeManagement(id);

  const [permissionId, setPermissionId] = useState(data.permissionId || "");
  const [permissionIdError, setPermissionIdError] = useState<string>("");

  const handlePermissionIdChange = useCallback(
    (value: string) => {
      setPermissionId(value);

      const validation = permissionIdSchema.safeParse(value);

      if (!validation.success && value.length > 0) {
        setPermissionIdError(
          validation.error.errors[0]?.message ?? "Invalid permission ID",
        );
      } else {
        setPermissionIdError("");
      }

      updateNodeData<PermissionIdNodeData>((currentData) => ({
        ...currentData,
        permissionId: value,
      }));
    },
    [updateNodeData],
  );

  return (
    <PermissionNodeContainer
      id={id}
      data={data}
      hasSourceHandle={true}
      hasTargetHandle={false}
      createChildNodes={() => ({ nodes: [], edges: [] })}
      shouldAutoCreateChildren={false}
    >
      <div className="flex flex-col items-center justify-center">
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#87878B]">
          <Key className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">
            Permission ID
          </span>
        </div>

        <div className="text-white relative">↓</div>

        <Input
          id={`${id}-permission-id`}
          type="text"
          value={permissionId}
          onChange={(e) => handlePermissionIdChange(e.target.value)}
          className={`w-full ${permissionIdError ? "border-red-500" : "border-blue-300"}
            focus:border-blue-500 focus:ring-blue-500`}
          placeholder="Enter permission ID"
        />

        {permissionIdError && (
          <p className="text-red-500 text-xs mt-1">{permissionIdError}</p>
        )}
      </div>
    </PermissionNodeContainer>
  );
}

// Wrapper to satisfy ReactFlow's NodeProps type requirement
export default function PermissionNodePermissionIdWrapper(props: NodeProps) {
  return (
    <PermissionNodePermissionId
      id={props.id}
      data={props.data as PermissionIdNodeData}
    />
  );
}
