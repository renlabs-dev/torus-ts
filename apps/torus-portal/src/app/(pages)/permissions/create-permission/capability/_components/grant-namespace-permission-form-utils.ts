import type {
  SS58Address,
  PermissionDuration,
  RevocationTerms,
} from "@torus-network/sdk";
import type { GrantNamespacePermissionFormData } from "./grant-namespace-permission-form-schema";

export function transformFormDataToSDK(data: GrantNamespacePermissionFormData) {
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
    case "RevocableByGrantor":
      revocation = { RevocableByGrantor: null };
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

  return {
    grantee: data.grantee as SS58Address,
    paths: [data.namespacePath], // Convert single path to array as expected by transaction
    duration,
    revocation,
  };
}
