import type { PermissionContract } from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";
import { smallAddress } from "@torus-network/torus-utils/subspace";
import { match } from "rustie";

/**
 * Filter function - check all places user can appear including recipients
 * Shows all permissions where user has any role (for viewing/potential actions)
 */
export function hasUserRole(
  contract: PermissionContract,
  userAddress: SS58Address,
) {
  if (contract.delegator === userAddress) return true;

  const hasScopeRole = match(contract.scope)({
    Stream: (stream) => {
      const recipients = stream.recipients;
      const isRecipient =
        recipients instanceof Map
          ? recipients.has(userAddress)
          : userAddress in recipients;

      return (
        isRecipient ||
        stream.recipientManagers.includes(userAddress) ||
        stream.weightSetters.includes(userAddress)
      );
    },
    Namespace: (namespace) => {
      return namespace.recipient === userAddress;
    },
    Curator: (curator) => {
      return curator.recipient === userAddress;
    },
    Wallet: (wallet) => {
      return wallet.recipient === userAddress;
    },
  });

  if (hasScopeRole) return true;

  const hasEnforcementRole = match(contract.enforcement)({
    ControlledBy: (controlled) => controlled.controllers.includes(userAddress),
    None: () => false,
  });

  if (hasEnforcementRole) return true;

  const hasRevocationRole = match(contract.revocation)({
    RevocableByArbiters: (arbiters) => arbiters.accounts.includes(userAddress),
    RevocableByDelegator: () => contract.delegator === userAddress, // Delegator can revoke
    Irrevocable: () => false,
    RevocableAfter: () => contract.delegator === userAddress, // Delegator can revoke after time
  });

  return hasRevocationRole;
}

/**
 * Get all roles that a user has for a specific permission
 * Based on new-fields.md specification
 */
export function getUserRoles(
  contract: PermissionContract,
  userAddress: SS58Address,
): string[] {
  const roles: string[] = [];

  if (contract.delegator === userAddress) {
    roles.push("Delegator");
  }

  if ("Stream" in contract.scope) {
    const stream = contract.scope.Stream;

    const recipients = stream.recipients;
    const isRecipient =
      recipients instanceof Map
        ? recipients.has(userAddress)
        : Object.prototype.hasOwnProperty.call(recipients, userAddress);

    if (isRecipient) {
      roles.push("Recipient");
    }

    if (stream.recipientManagers.includes(userAddress)) {
      roles.push("Recipient Manager");
    }

    if (stream.weightSetters.includes(userAddress)) {
      roles.push("Weight Setter");
    }
  }

  if ("Namespace" in contract.scope) {
    if (contract.scope.Namespace.recipient === userAddress) {
      roles.push("Recipient");
    }
  }

  if ("Curator" in contract.scope) {
    if (contract.scope.Curator.recipient === userAddress) {
      roles.push("Recipient");
    }
  }

  if ("Wallet" in contract.scope) {
    if (contract.scope.Wallet.recipient === userAddress) {
      roles.push("Recipient");
    }
  }

  if ("ControlledBy" in contract.enforcement) {
    if (contract.enforcement.ControlledBy.controllers.includes(userAddress)) {
      roles.push("Enforcement Controller");
    }
  }

  if ("RevocableByArbiters" in contract.revocation) {
    if (
      contract.revocation.RevocableByArbiters.accounts.includes(userAddress)
    ) {
      roles.push("Revocation Arbiter");
    }
  }

  return roles;
}

/**
 * Get the primary role badge text for display
 * Returns the most important role for badge display
 */
export function getPrimaryRoleBadge(
  contract: PermissionContract,
  userAddress: SS58Address,
): string | null {
  const roles = getUserRoles(contract, userAddress);

  if (roles.length === 0) return null;

  const rolePriority = [
    "Delegator",
    "Recipient Manager",
    "Weight Setter",
    "Recipient",
    "Enforcement Controller",
    "Revocation Arbiter",
  ];

  for (const priority of rolePriority) {
    if (roles.includes(priority)) {
      return priority;
    }
  }

  return roles[0] || null;
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
  walletPermissions: Map<string, PermissionContract>;
}): Set<string> {
  const allAddresses = new Set<string>();

  [
    ...permissions.streamPermissions,
    ...permissions.namespacePermissions,
    ...permissions.curatorPermissions,
    ...permissions.walletPermissions,
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
    } else if ("Wallet" in contract.scope) {
      allAddresses.add(contract.scope.Wallet.recipient);
    }
  });

  return allAddresses;
}

/**
 * Sort all permissions by user role priority, with delegator permissions first
 */
export function sortPermissionsByRole(
  permissions: {
    streamPermissions: Map<string, PermissionContract>;
    namespacePermissions: Map<string, PermissionContract>;
    curatorPermissions: Map<string, PermissionContract>;
    walletPermissions: Map<string, PermissionContract>;
  },
  userAddress: SS58Address,
): {
  streamPermissions: Map<string, PermissionContract>;
  namespacePermissions: Map<string, PermissionContract>;
  curatorPermissions: Map<string, PermissionContract>;
  walletPermissions: Map<string, PermissionContract>;
} {
  // Helper function to sort a single permission Map
  const sortPermissionMap = (
    permissionMap: Map<string, PermissionContract>,
  ) => {
    const entries = Array.from(permissionMap.entries());

    entries.sort(([_idA, contractA], [_idB, contractB]) => {
      const roleA = getPrimaryRoleBadge(contractA, userAddress);
      const roleB = getPrimaryRoleBadge(contractB, userAddress);

      // Use the same role priority as getPrimaryRoleBadge
      const rolePriority = [
        "Delegator",
        "Recipient Manager",
        "Weight Setter",
        "Recipient",
        "Enforcement Controller",
        "Revocation Arbiter",
      ];

      const priorityA = roleA
        ? rolePriority.indexOf(roleA)
        : rolePriority.length;
      const priorityB = roleB
        ? rolePriority.indexOf(roleB)
        : rolePriority.length;

      return priorityA - priorityB;
    });

    return new Map(entries);
  };

  return {
    streamPermissions: sortPermissionMap(permissions.streamPermissions),
    namespacePermissions: sortPermissionMap(permissions.namespacePermissions),
    curatorPermissions: sortPermissionMap(permissions.curatorPermissions),
    walletPermissions: sortPermissionMap(permissions.walletPermissions),
  };
}
