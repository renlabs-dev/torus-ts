import type { PermissionContract } from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";
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
