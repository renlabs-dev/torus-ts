"use client";

import { useCallback, useState, useEffect } from "react";
import type { NodeProps } from "@xyflow/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import { Key } from "lucide-react";
import type { PermissionIdNodeData } from "./constraint-node-types";
import {
  PermissionNodeContainer,
  useChildNodeManagement,
} from "./constraint-node-container";
import { permissionIdSchema } from "../constraint-validation-schemas";

// Placeholder permission IDs (Vec<H256>) - in the future this will come from a network query
const PLACEHOLDER_PERMISSION_IDS = [
  "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
  "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
  "0x5555aaaa5555aaaa5555aaaa5555aaaa5555aaaa5555aaaa5555aaaa5555aaaa",
];

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

  // Sync local state with external changes
  useEffect(() => {
    if (data.permissionId !== permissionId) {
      setPermissionId(data.permissionId || "");
    }
  }, [data.permissionId, permissionId]);

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
      <div className="flex items-center justify-center font-semibold">
        <Select value={permissionId} onValueChange={handlePermissionIdChange}>
          <SelectTrigger className="w-fit pl-[0.05em] pr-1 gap-2 bg-zinc-300 text-accent rounded-full">
            <div
              className="flex items-center gap-2 bg-accent z-50 px-3 py-[0.45em] rounded-full
                text-zinc-300 rounded-r-none"
            >
              <Key className="h-4 w-4" />
              <span className="text-nowrap font-medium">Permission ID</span>
            </div>
            <SelectValue placeholder="Select Permission ID" />
          </SelectTrigger>
          <SelectContent>
            {PLACEHOLDER_PERMISSION_IDS.map((permissionId) => (
              <SelectItem key={permissionId} value={permissionId}>
                {permissionId.slice(0, 9)}...{permissionId.slice(-8)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
