import type {
  SS58Address,
  EmissionAllocation,
  DistributionControl,
  PermissionDuration,
  RevocationTerms,
  EnforcementAuthority,
} from "@torus-network/sdk";
import type { GrantEmissionPermissionFormData } from "./grant-emission-permission-form-schema";

// Helper to transform form data to SDK format
export function transformFormDataToSDK(data: GrantEmissionPermissionFormData) {
  // Transform allocation
  let allocation: EmissionAllocation;
  if (data.allocation.type === "FixedAmount") {
    allocation = {
      FixedAmount: BigInt(parseFloat(data.allocation.amount) * 1e6), // Convert to micro units as bigint
    };
  } else {
    allocation = {
      Streams: new Map(
        data.allocation.streams.map((stream) => [
          stream.streamId as `0x${string}`,
          parseFloat(stream.percentage),
        ]),
      ),
    };
  }

  // Transform targets
  const targets = data.targets.map(
    (target) =>
      [target.account as SS58Address, parseInt(target.weight)] as [
        SS58Address,
        number,
      ],
  );

  // Transform distribution
  let distribution: DistributionControl;
  switch (data.distribution.type) {
    case "Manual":
      distribution = { Manual: null };
      break;
    case "Automatic":
      distribution = {
        Automatic: BigInt(parseFloat(data.distribution.threshold) * 1e6),
      };
      break;
    case "AtBlock":
      distribution = { AtBlock: parseInt(data.distribution.blockNumber) };
      break;
    case "Interval":
      distribution = { Interval: parseInt(data.distribution.blocks) };
      break;
    default:
      distribution = { Manual: null };
  }

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

  // Transform enforcement
  let enforcement: EnforcementAuthority;
  if (data.enforcement.type === "None") {
    enforcement = { None: null };
  } else {
    enforcement = {
      ControlledBy: {
        controllers: data.enforcement.controllers,
        requiredVotes: BigInt(parseInt(data.enforcement.requiredVotes)),
      },
    };
  }

  return {
    grantee: data.grantee,
    allocation,
    targets,
    distribution,
    duration,
    revocation,
    enforcement,
  };
}
