import type { H256 } from "@polkadot/types/interfaces";

import type {
  PermissionDuration,
  RevocationTerms,
} from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";

import type { PathWithPermission } from "./create-capability-flow/types";
import type { CreateCapabilityPermissionFormData } from "./create-capability-permission-form-schema";

export function transformFormDataToSDK(
  data: CreateCapabilityPermissionFormData,
  pathsWithPermissions: PathWithPermission[],
) {
  // Transform duration
  let duration: PermissionDuration;
  if (data.duration.type === "Indefinite") {
    duration = { Indefinite: null };
  } else {
    duration = { UntilBlock: parseInt(data.duration.blockNumber) };
  }

  // Transform revocation
  let revocation: RevocationTerms;
  switch (data.revocation.type) {
    case "Irrevocable":
      revocation = { Irrevocable: null };
      break;
    case "RevocableByDelegator":
      revocation = { RevocableByDelegator: null };
      break;
    case "RevocableByArbiters":
      revocation = {
        RevocableByArbiters: {
          accounts: data.revocation.accounts,
          requiredVotes: BigInt(parseInt(data.revocation.requiredVotes)),
        },
      };
      break;
    case "RevocableAfter":
      revocation = { RevocableAfter: parseInt(data.revocation.blockNumber) };
      break;
    default:
      revocation = { Irrevocable: null };
  }

  // Group paths by permission ID
  const pathsMap = new Map<H256 | null, string[]>();

  pathsWithPermissions.forEach(({ path, permissionId }) => {
    // Cast the permissionId to H256 (it's already in the correct hex format)
    const h256PermissionId = permissionId as unknown as H256;
    if (!pathsMap.has(h256PermissionId)) {
      pathsMap.set(h256PermissionId, []);
    }
    pathsMap.get(h256PermissionId)?.push(path);
  });

  return {
    recipient: data.recipient as SS58Address,
    paths: pathsMap,
    duration,
    revocation,
    instances: parseInt(data.instances),
  };
}
