import type { PermissionContract } from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";
import { smallAddress } from "@torus-network/torus-utils/subspace";
import { match } from "rustie";

/**
 * Filter function - check all places user can appear except recipients
 */
export function hasUserRole(
  contract: PermissionContract,
  userAddress: SS58Address,
) {
  if (contract.delegator === userAddress) return true;

  const hasScopeRole = match(contract.scope)({
    Stream: (stream) => {
      return (
        stream.recipientManagers.includes(userAddress) ||
        stream.weightSetters.includes(userAddress)
      );
    },
    Namespace: () => false,
    Curator: () => false,
  });

  if (hasScopeRole) return true;

  const hasEnforcementRole = match(contract.enforcement)({
    ControlledBy: (controlled) => controlled.controllers.includes(userAddress),
    None: () => false,
  });

  if (hasEnforcementRole) return true;

  const hasRevocationRole = match(contract.revocation)({
    RevocableByArbiters: (arbiters) => arbiters.accounts.includes(userAddress),
    Irrevocable: () => false,
    RevocableByDelegator: () => false,
    RevocableAfter: () => false,
  });

  return hasRevocationRole;
}

/**
 * Format an address with agent name if available
 * Returns "AgentName (address...)" if agent name exists, otherwise just the truncated address
 */
export function formatAddressWithAgentName(
  address: string | undefined,
  agentNamesMap: Map<string, string> | undefined,
  addressLength: number = 8,
): string {
  if (!address) return "Unknown Address";

  const agentName = agentNamesMap?.get(address);
  if (agentName) {
    return `${agentName} (${smallAddress(address, addressLength)})`;
  }
  return smallAddress(address, addressLength);
}

/**
 * Extract all unique addresses from permission contracts
 * This includes delegators, recipients, managers, and weight setters
 */
export function extractAllAddressesFromPermissions(permissions: {
  streamPermissions: Map<string, PermissionContract>;
  namespacePermissions: Map<string, PermissionContract>;
  curatorPermissions: Map<string, PermissionContract>;
}): Set<string> {
  const allAddresses = new Set<string>();

  [
    ...permissions.streamPermissions,
    ...permissions.namespacePermissions,
    ...permissions.curatorPermissions,
  ].forEach(([_, contract]) => {
    allAddresses.add(contract.delegator);

    if ("Stream" in contract.scope) {
      const recipients = contract.scope.Stream.recipients;
      if (recipients instanceof Map) {
        recipients.forEach((_, address) => allAddresses.add(address));
      } else {
        Object.keys(recipients).forEach((address) => allAddresses.add(address));
      }
      contract.scope.Stream.recipientManagers.forEach((address) =>
        allAddresses.add(address),
      );
      contract.scope.Stream.weightSetters.forEach((address) =>
        allAddresses.add(address),
      );
    } else if ("Namespace" in contract.scope) {
      allAddresses.add(contract.scope.Namespace.recipient);
    } else if ("Curator" in contract.scope) {
      allAddresses.add(contract.scope.Curator.recipient);
    }
  });

  return allAddresses;
}
