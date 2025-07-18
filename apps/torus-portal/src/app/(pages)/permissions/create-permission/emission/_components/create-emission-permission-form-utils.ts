import type {
  DistributionControl,
  EmissionAllocation,
  EnforcementAuthority,
  PermissionDuration,
  RevocationTerms,
  SS58Address,
} from "@torus-network/sdk";

import type { CreateEmissionPermissionFormData } from "./create-emission-permission-form-schema";

export function transformFormDataToSDK(data: CreateEmissionPermissionFormData) {
  let allocation: EmissionAllocation;
  if (data.allocation.type === "FixedAmount") {
    allocation = {
      FixedAmount: BigInt(parseFloat(data.allocation.amount) * 1e6),
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

  const targets = data.targets.map(
    (target) =>
      [target.account as SS58Address, parseInt(target.weight)] as [
        SS58Address,
        number,
      ],
  );

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

  let duration: PermissionDuration;
  if (data.duration.type === "Indefinite") {
    duration = { Indefinite: null };
  } else {
    duration = { UntilBlock: parseInt(data.duration.blockNumber) };
  }

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
    allocation,
    targets,
    distribution,
    duration,
    revocation,
    enforcement,
  };
}
