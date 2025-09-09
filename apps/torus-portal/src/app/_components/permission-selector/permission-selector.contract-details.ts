import type { PermissionContract } from "@torus-network/sdk/chain";
import { smallAddress } from "@torus-network/torus-utils/subspace";
import {
  formatCapabilityPath,
  getCapabilityPaths,
} from "~/utils/capability-path";
import { match } from "rustie";

export interface ContractDetails {
  type: "Stream" | "Capability" | "Curator" | "Wallet";
  details: string[];
}

/**
 * Extract detailed information from a permission contract using match patterns
 */
export function getContractDetails(
  contract: PermissionContract,
  formatAddress: (address: string | undefined) => string,
): ContractDetails {
  return match(contract.scope)({
    Stream: (stream): ContractDetails => {
      const recipients =
        stream.recipients instanceof Map
          ? Array.from(stream.recipients.keys()).map((key) =>
              smallAddress(key, 8),
            )
          : Object.keys(stream.recipients).map((key) => smallAddress(key, 8));

      return {
        type: "Stream",
        details: [
          `Delegator: ${formatAddress(contract.delegator)}`,
          ...recipients.map((_, idx) => {
            const address =
              stream.recipients instanceof Map
                ? Array.from(stream.recipients.keys())[idx]
                : Object.keys(stream.recipients)[idx];
            return `Recipient: ${formatAddress(address)}`;
          }),
          ...stream.recipientManagers.map(
            (manager) => `Manager: ${formatAddress(manager)}`,
          ),
          ...stream.weightSetters.map(
            (setter) => `Weight Setter: ${formatAddress(setter)}`,
          ),
        ],
      };
    },

    Namespace: (namespace): ContractDetails => {
      const { paths } = getCapabilityPaths(namespace.paths);
      const formattedPaths = paths.map((path) => formatCapabilityPath(path));

      return {
        type: "Capability",
        details: [
          `Delegator: ${formatAddress(contract.delegator)}`,
          `Recipient: ${formatAddress(namespace.recipient)}`,
          `Max Instances: ${namespace.maxInstances}`,
          formattedPaths.length > 0
            ? `paths: ${formattedPaths.join(", ")}`
            : "",
        ].filter(Boolean),
      };
    },

    Curator: (curator): ContractDetails => ({
      type: "Curator",
      details: [`Recipient: ${formatAddress(curator.recipient)}`],
    }),

    Wallet: (wallet): ContractDetails => ({
      type: "Wallet",
      details: [
        `Delegator: ${formatAddress(contract.delegator)}`,
        `Recipient: ${formatAddress(wallet.recipient)}`,
        `Stake Type: ${match(wallet.type)({
          Stake: (stake) =>
            `Transfer: ${stake.canTransferStake ? "Allowed" : "Denied"}, Exclusive: ${stake.exclusiveStakeAccess ? "Yes" : "No"}`,
        })}`,
      ],
    }),
  });
}
