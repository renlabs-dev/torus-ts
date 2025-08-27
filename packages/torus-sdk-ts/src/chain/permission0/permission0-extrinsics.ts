import type { ApiPromise } from "@polkadot/api";
import type { Bytes, Option, u16 } from "@polkadot/types";
import { BTreeMap, BTreeSet } from "@polkadot/types";
import type { AccountId32, H256, Percent } from "@polkadot/types/interfaces";

import type { SS58Address } from "../../types/index.js";
import type {
  DistributionControl,
  EmissionAllocation,
  EnforcementAuthority,
  PermissionDuration,
  PermissionId,
  RevocationTerms,
  StreamId,
} from "./permission0-types.js";

export interface DelegateNamespacePermission {
  api: ApiPromise;
  recipient: SS58Address;
  paths: Map<H256 | null, string[]>;
  duration: PermissionDuration;
  revocation: RevocationTerms;
  instances: number;
}

/**
 * Delegate a permission over namespaces
 */
export function delegateNamespacePermission({
  api,
  recipient,
  paths,
  duration,
  revocation,
  instances,
}: DelegateNamespacePermission) {
  // Convert the paths map to BTreeMap with BTreeSet values
  const pathsMap = new BTreeMap<Option<H256>, BTreeSet<Bytes>>(
    api.registry,
    "Option<H256>",
    "BTreeSet<Bytes>",
    new Map(),
  );

  for (const [parent, pathList] of paths.entries()) {
    const btreeSet = new BTreeSet<Bytes>(api.registry, "Bytes", pathList);
    // Convert null to Option<H256>
    const optionParent =
      parent === null
        ? api.createType("Option<H256>", null)
        : api.createType("Option<H256>", parent);
    pathsMap.set(optionParent, btreeSet);
  }

  return api.tx.permission0.delegateNamespacePermission(
    recipient,
    pathsMap,
    duration,
    revocation,
    instances,
  );
}

/**
 * Delegate a stream permission with multiple recipients
 */
export interface DelegateStreamPermission {
  api: ApiPromise;
  recipients: [SS58Address, number][];
  allocation: EmissionAllocation;
  distribution: DistributionControl;
  duration: PermissionDuration;
  revocation: RevocationTerms;
  enforcement: EnforcementAuthority;
  recipientManager?: SS58Address;
  weightSetter?: SS58Address;
}

/**
 * TODO: test
 * TODO: docs
 */
export function delegateStreamPermission({
  api,
  recipients,
  allocation,
  distribution,
  duration,
  revocation,
  enforcement,
  recipientManager,
  weightSetter,
}: DelegateStreamPermission) {
  const recipientsMap = new Map(recipients);

  const recipientsMap_ = new BTreeMap<AccountId32, u16>(
    api.registry,
    "AccountId32",
    "u32",
    recipientsMap,
  );

  return api.tx.permission0.delegateStreamPermission(
    recipientsMap_,
    allocation,
    distribution,
    duration,
    revocation,
    enforcement,
    recipientManager ?? null,
    weightSetter ?? null,
  );
}

export function togglePermission(
  api: ApiPromise,
  permissionId: PermissionId,
  enable: boolean,
) {
  return api.tx.permission0.togglePermissionAccumulation(permissionId, enable);
}

export interface UpdateStreamPermission {
  api: ApiPromise;
  permissionId: PermissionId;
  newRecipients?: [SS58Address, number][];
  newStreams?: Map<StreamId, number>;
  newDistributionControl?: DistributionControl;
  recipientManager?: SS58Address;
  weightSetter?: SS58Address;
}

/**
  If you call as a recipient:
  you can only provide the new_targets,
  whenever you want, no limits. if the recipient sends
  new_streams/new_distribution_control, the extrinsic fails.

  If you call as a delegator:
  you can send all the values, 
  but only if the revocation term: is RevocableByDelegator
  is RevocableAfter(N) and CurrentBlock > N
  think of it as the revocation term defining whether
  the delegator can modify the contract without
  breaching the "terms of service"
 */
export function updateStreamPermission({
  api,
  permissionId,
  newRecipients,
  newStreams,
  newDistributionControl,
  recipientManager,
  weightSetter,
}: UpdateStreamPermission) {
  const recipientsMap = newRecipients
    ? new BTreeMap<AccountId32, u16>(
        api.registry,
        "AccountId32",
        "u16",
        new Map(newRecipients),
      )
    : new BTreeMap<AccountId32, u16>(
        api.registry,
        "AccountId32",
        "u16",
        new Map(),
      );

  const streamsMap = newStreams
    ? new BTreeMap<H256, Percent>(api.registry, "H256", "Percent", newStreams)
    : null;

  return api.tx.permission0.updateStreamPermission(
    permissionId,
    recipientsMap,
    streamsMap,
    newDistributionControl ?? null,
    recipientManager ?? null,
    weightSetter ?? null,
  );
}

/**
 * Revoke a permission. The caller must met revocation constraints or be a root key.
 **/
export function revokePermission(api: ApiPromise, permissionId: PermissionId) {
  return api.tx.permission0.revokePermission(permissionId);
}
