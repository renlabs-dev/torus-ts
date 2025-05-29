"use client";

import { useCallback, useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import type { PermissionIdNodeData } from "./constraint-node-types";
import {
  PermissionNodeContainer,
  useChildNodeManagement,
} from "./constraint-node-container";
import { useTorus } from "@torus-ts/torus-provider";
import { usePermissionsByGrantor } from "@torus-ts/query-provider/hooks";
import { H256_HEX } from "@torus-network/sdk";
import type { SS58Address } from "@torus-network/sdk";
import { Key } from "lucide-react";

interface PermissionNodePermissionIdProps {
  id: string;
  data: PermissionIdNodeData;
}

export function ConstraintNodePermissionId({
  id,
  data,
}: PermissionNodePermissionIdProps) {
  const { updateNodeData } = useChildNodeManagement(id);
  const { api, selectedAccount } = useTorus();

  const [permissionId, setPermissionId] = useState(data.permissionId || "");
  const [permissionIdError, setPermissionIdError] = useState<string>("");

  const { data: permissionsByGrantor, isLoading: isLoadingPermissions } =
    usePermissionsByGrantor(api, selectedAccount?.address as SS58Address);

  const [permissionError, permissions] = permissionsByGrantor ?? [
    undefined,
    undefined,
  ];
  const hasPermissions = permissions && permissions.length > 0;
  const isWalletConnected = selectedAccount?.address != null;
  const shouldDisablePermissionSelect = !isWalletConnected || !hasPermissions;

  // Sync local state with external changes
  useEffect(() => {
    if (data.permissionId !== permissionId) {
      setPermissionId(data.permissionId || "");
    }
  }, [data.permissionId, permissionId]);

  const handlePermissionIdChange = useCallback(
    (value: string) => {
      setPermissionId(value);

      const validation = H256_HEX.safeParse(value);

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
        <div className="w-full">
          <div className="flex items-center justify-center font-semibold">
            <Select
              value={permissionId}
              onValueChange={handlePermissionIdChange}
              disabled={shouldDisablePermissionSelect}
            >
              <SelectTrigger className="w-fit pl-[0.05em] pr-1 gap-2 bg-zinc-300 text-accent rounded-full">
                <div
                  className="flex items-center gap-2 bg-accent z-50 px-3 py-[0.45em] rounded-full
                    text-zinc-300 rounded-r-none"
                >
                  <Key className="h-4 w-4" />
                  <span className="text-nowrap font-medium">Permission ID</span>
                </div>
                <SelectValue
                  placeholder={
                    !isWalletConnected
                      ? "Connect wallet"
                      : isLoadingPermissions
                        ? "Loading..."
                        : permissionError
                          ? "No permissions"
                          : !hasPermissions
                            ? "No permissions"
                            : "Select Permission ID"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {permissions?.map((permissionId) => (
                  <SelectItem key={permissionId} value={permissionId}>
                    {permissionId.slice(0, 6)}...${permissionId.slice(-4)}
                  </SelectItem>
                )) ?? []}
              </SelectContent>
            </Select>
          </div>

          {permissionIdError && (
            <p className="text-red-500 text-xs mt-1">{permissionIdError}</p>
          )}
        </div>
      </div>
    </PermissionNodeContainer>
  );
}
