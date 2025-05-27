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
      <div className="flex flex-col items-center justify-center">
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#87878B]">
          <Key className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">
            Permission ID
          </span>
        </div>

        <div className="text-white relative">↓</div>

        <Select value={permissionId} onValueChange={handlePermissionIdChange}>
          <SelectTrigger
            className={`w-full ${permissionIdError ? "border-red-500" : "border-blue-300"}
              focus:border-blue-500 focus:ring-blue-500`}
          >
            <SelectValue placeholder="Select permission..." />
          </SelectTrigger>
          <SelectContent>
            {PLACEHOLDER_PERMISSION_IDS.map((permissionId, index) => (
              <SelectItem key={permissionId} value={permissionId}>
                <div className="flex flex-col">
                  <span className="font-medium">Permission {index + 1}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {permissionId.slice(0, 16)}...{permissionId.slice(-8)}
                  </span>
                </div>
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
