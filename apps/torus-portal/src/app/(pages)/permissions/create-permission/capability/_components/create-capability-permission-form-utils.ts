import type {
  PermissionDuration,
  RevocationTerms,
} from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";

import type { CreateCapabilityPermissionFormData } from "./create-capability-permission-form-schema";

export function transformFormDataToSDK(
  data: CreateCapabilityPermissionFormData,
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

  // Transform paths to the required format
  const paths = new Map([[null, [data.namespacePath]]]);

  return {
    recipient: data.recipient as SS58Address,
    paths,
    duration,
    revocation,
    instances: parseInt(data.instances),
  };
}
