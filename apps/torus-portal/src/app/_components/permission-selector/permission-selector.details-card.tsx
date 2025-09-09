"use client";

import type { PermissionContract } from "@torus-network/sdk/chain";
import { smallAddress } from "@torus-network/torus-utils/subspace";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import { useIsMobile } from "@torus-ts/ui/hooks/use-mobile";
import {
  getCapabilityPaths,
  ShortenedCapabilityPath,
} from "~/utils/capability-path";
import { Copy } from "lucide-react";
import { match } from "rustie";
import { AddressWithAgent } from "../address-with-agent";

interface PermissionDetailsCardProps {
  permissionId: string;
  contract: PermissionContract | undefined;
}

interface DetailRow {
  label: string;
  value?: string;
  component?: React.ReactNode;
}

export function PermissionDetailsCard({
  permissionId,
  contract,
}: PermissionDetailsCardProps) {
  const isMobile = useIsMobile();

  if (!contract) {
    return null;
  }

  const getPermissionType = () => {
    return match(contract.scope)({
      Stream: () => "Stream" as const,
      Namespace: () => "Capability" as const,
      Curator: () => "Curator" as const,
      Wallet: () => "Wallet" as const,
    });
  };

  const formatDuration = () => {
    return match(contract.duration)({
      Indefinite: () => "Indefinite",
      UntilBlock: (blockNumber) => `Until Block ${blockNumber.toString()}`,
    });
  };

  const formatRevocation = () => {
    return match(contract.revocation)({
      Irrevocable: () => "Irrevocable",
      RevocableByDelegator: () => "Revocable by Delegator",
      RevocableAfter: (blockNumber) =>
        `Revocable after Block ${blockNumber.toString()}`,
      RevocableByArbiters: (arbiters) =>
        `Revocable by ${arbiters.requiredVotes.toString()} of ${arbiters.accounts.length} Arbiters`,
    });
  };

  // Format enforcement
  const formatEnforcement = () => {
    return match(contract.enforcement)({
      None: () => "None",
      ControlledBy: (controllers) =>
        `Controlled by ${controllers.controllers.length} Controllers`,
    });
  };

  // Get detailed rows based on permission type
  const getDetailRows = (): DetailRow[] => {
    const permissionType = getPermissionType();

    const baseRows: DetailRow[] = [
      {
        label: "Permission ID",
        component: (
          <div className="flex items-center gap-2">
            <CopyButton
              copy={permissionId}
              variant="ghost"
              message="Permission ID copied to clipboard"
              className="hover:bg-muted/50 h-auto p-1"
            >
              <Copy className="h-3 w-3" />
            </CopyButton>
            <span className="font-mono text-sm">
              {smallAddress(permissionId, 8)}
            </span>
          </div>
        ),
      },
      {
        label: "Delegator",
        component: (
          <AddressWithAgent
            address={contract.delegator}
            showCopyButton={true}
            addressLength={8}
            className="text-sm"
          />
        ),
      },
      {
        label: "Type",
        value: permissionType,
      },
      {
        label: "Duration",
        value: formatDuration(),
      },
      {
        label: "Revocation",
        value: formatRevocation(),
      },
      {
        label: "Enforcement",
        value: formatEnforcement(),
      },
      {
        label: "Created At",
        value: `Block ${contract.createdAt.toString()}`,
      },
      {
        label: "Execution Count",
        value: contract.executionCount.toString(),
      },
    ];

    // Add type-specific rows
    const typeSpecificRows = match(contract.scope)({
      Stream: (stream): DetailRow[] => {
        const rows: DetailRow[] = [];

        // Recipients
        const recipients = stream.recipients;
        if (recipients instanceof Map) {
          Array.from(recipients.entries()).forEach(([address, weight], idx) => {
            rows.push({
              label: idx === 0 ? "Recipients" : "",
              component: (
                <div className="flex items-center justify-between gap-2">
                  <AddressWithAgent
                    address={address}
                    showCopyButton={true}
                    addressLength={8}
                    className="text-sm"
                  />
                  <span className="text-muted-foreground text-xs">
                    Weight: {String(weight)}
                  </span>
                </div>
              ),
            });
          });
        } else {
          Object.entries(recipients).forEach(([address, weight], idx) => {
            rows.push({
              label: idx === 0 ? "Recipients" : "",
              component: (
                <div className="flex items-center justify-between gap-2">
                  <AddressWithAgent
                    address={address}
                    showCopyButton={true}
                    addressLength={8}
                    className="text-sm"
                  />
                  <span className="text-muted-foreground text-xs">
                    Weight: {String(weight)}
                  </span>
                </div>
              ),
            });
          });
        }

        // Allocation type
        const allocationType = match(stream.allocation)({
          Streams: (streamsMap) => `Streams (${streamsMap.size} streams)`,
          FixedAmount: (amount) => `Fixed Amount: ${amount.toString()}`,
        });
        rows.push({
          label: "Allocation",
          value: allocationType,
        });

        // Distribution type
        const distributionType = match(stream.distribution)({
          Manual: () => "Manual",
          Automatic: (threshold) =>
            `Automatic (threshold: ${threshold.toString()})`,
          AtBlock: (block) => `At Block ${block.toString()}`,
          Interval: (interval) => `Every ${interval.toString()} blocks`,
        });
        rows.push({
          label: "Distribution",
          value: distributionType,
        });

        // Accumulating
        rows.push({
          label: "Accumulating",
          value: stream.accumulating ? "Yes" : "No",
        });

        // Recipient Managers
        if (stream.recipientManagers.length > 0) {
          stream.recipientManagers.forEach((manager, idx) => {
            rows.push({
              label: idx === 0 ? "Recipient Managers" : "",
              component: (
                <AddressWithAgent
                  address={manager}
                  showCopyButton={true}
                  addressLength={8}
                  className="text-sm"
                />
              ),
            });
          });
        }

        // Weight Setters
        if (stream.weightSetters.length > 0) {
          stream.weightSetters.forEach((setter, idx) => {
            rows.push({
              label: idx === 0 ? "Weight Setters" : "",
              component: (
                <AddressWithAgent
                  address={setter}
                  showCopyButton={true}
                  addressLength={8}
                  className="text-sm"
                />
              ),
            });
          });
        }

        return rows;
      },

      Namespace: (namespace): DetailRow[] => {
        const rows: DetailRow[] = [
          {
            label: "Recipient",
            component: (
              <AddressWithAgent
                address={namespace.recipient}
                showCopyButton={true}
                addressLength={8}
                className="text-sm"
              />
            ),
          },
          {
            label: "Max Instances",
            value: namespace.maxInstances.toString(),
          },
        ];

        // Capability paths
        const { paths } = getCapabilityPaths(namespace.paths);
        if (paths.length > 0) {
          if (paths.length === 1) {
            rows.push({
              label: "Capability Path",
              component: (
                <ShortenedCapabilityPath
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  path={paths[0]!}
                  showTooltip={true}
                  className="font-mono text-sm"
                />
              ),
            });
          } else {
            paths.forEach((path, index) => {
              rows.push({
                label: index === 0 ? "Capability Paths" : "",
                component: (
                  <div className="text-sm">
                    {index + 1}.{" "}
                    <ShortenedCapabilityPath
                      path={path}
                      showTooltip={true}
                      className="font-mono"
                    />
                  </div>
                ),
              });
            });
          }
        }

        return rows;
      },

      Curator: (curator): DetailRow[] => [
        {
          label: "Recipient",
          component: (
            <AddressWithAgent
              address={curator.recipient}
              showCopyButton={true}
              addressLength={8}
              className="text-sm"
            />
          ),
        },
        {
          label: "Max Instances",
          value: curator.maxInstances.toString(),
        },
      ],

      Wallet: (wallet): DetailRow[] => [
        {
          label: "Recipient",
          component: (
            <AddressWithAgent
              address={wallet.recipient}
              showCopyButton={true}
              addressLength={8}
              className="text-sm"
            />
          ),
        },
        {
          label: "Stake Details",
          value: match(wallet.rType)({
            Stake: (stake) =>
              `Transfer: ${stake.canTransferStake ? "Allowed" : "Denied"}, Exclusive: ${stake.exclusiveStakeAccess ? "Yes" : "No"}`,
          }),
        },
      ],
    });

    return [...baseRows, ...typeSpecificRows];
  };

  // Mobile-responsive class helpers
  const getDetailRowClassName = () =>
    isMobile ? "flex flex-col space-y-1" : "flex items-center";
  const getDetailValueClassName = () =>
    isMobile
      ? "text-muted-foreground break-all"
      : "ml-2 text-muted-foreground break-all";

  const detailRows = getDetailRows();

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-sm font-semibold">
          Permission Details
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 pt-0 text-sm">
        {detailRows.map((row, index) => (
          <div key={index} className={getDetailRowClassName()}>
            <span className="flex-shrink-0 font-medium">{row.label}:</span>
            <div className={getDetailValueClassName()}>
              {row.component ?? row.value}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
