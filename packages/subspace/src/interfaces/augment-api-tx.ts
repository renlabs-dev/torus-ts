// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

// import type lookup before we augment - in some environments
// this is required to allow for ambient/previous definitions
import '@polkadot/api-base/types/submittable';

import type { ApiTypes, AugmentedSubmittable, SubmittableExtrinsic, SubmittableExtrinsicFunction } from '@polkadot/api-base/types';
import type { Bytes, Compact, Option, U8aFixed, Vec, bool, u16, u32, u64, u8 } from '@polkadot/types-codec';
import type { AnyNumber, IMethod, ITuple } from '@polkadot/types-codec/types';
import type { AccountId32, Call, H256, MultiAddress, Percent } from '@polkadot/types/interfaces/runtime';
import type { NodeSubspaceRuntimeOriginCaller, PalletBalancesAdjustmentDirection, PalletGovernanceApiVoteMode, PalletMultisigTimepoint, PalletOffworkerDecryptedWeightsPayload, PalletOffworkerKeepAlivePayload, PalletSubspaceParamsBurnGeneralBurnConfiguration, SpConsensusGrandpaEquivocationProof, SpCoreVoid, SpRuntimeMultiSignature, SpWeightsWeightV2Weight, SubstrateFixedFixedI128 } from '@polkadot/types/lookup';

export type __AugmentedSubmittable = AugmentedSubmittable<() => unknown>;
export type __SubmittableExtrinsic<ApiType extends ApiTypes> = SubmittableExtrinsic<ApiType>;
export type __SubmittableExtrinsicFunction<ApiType extends ApiTypes> = SubmittableExtrinsicFunction<ApiType>;

declare module '@polkadot/api-base/types/submittable' {
  interface AugmentedSubmittables<ApiType extends ApiTypes> {
    balances: {
      /**
       * Burn the specified liquid free balance from the origin account.
       * 
       * If the origin's account ends up below the existential deposit as a result
       * of the burn and `keep_alive` is false, the account will be reaped.
       * 
       * Unlike sending funds to a _burn_ address, which merely makes the funds inaccessible,
       * this `burn` operation will reduce total issuance by the amount _burned_.
       **/
      burn: AugmentedSubmittable<(value: Compact<u64> | AnyNumber | Uint8Array, keepAlive: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [Compact<u64>, bool]>;
      /**
       * Adjust the total issuance in a saturating way.
       * 
       * Can only be called by root and always needs a positive `delta`.
       * 
       * # Example
       **/
      forceAdjustTotalIssuance: AugmentedSubmittable<(direction: PalletBalancesAdjustmentDirection | 'Increase' | 'Decrease' | number | Uint8Array, delta: Compact<u64> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletBalancesAdjustmentDirection, Compact<u64>]>;
      /**
       * Set the regular balance of a given account.
       * 
       * The dispatch origin for this call is `root`.
       **/
      forceSetBalance: AugmentedSubmittable<(who: MultiAddress | { Id: any } | { Index: any } | { Raw: any } | { Address32: any } | { Address20: any } | string | Uint8Array, newFree: Compact<u64> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [MultiAddress, Compact<u64>]>;
      /**
       * Exactly as `transfer_allow_death`, except the origin must be root and the source account
       * may be specified.
       **/
      forceTransfer: AugmentedSubmittable<(source: MultiAddress | { Id: any } | { Index: any } | { Raw: any } | { Address32: any } | { Address20: any } | string | Uint8Array, dest: MultiAddress | { Id: any } | { Index: any } | { Raw: any } | { Address32: any } | { Address20: any } | string | Uint8Array, value: Compact<u64> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [MultiAddress, MultiAddress, Compact<u64>]>;
      /**
       * Unreserve some balance from a user by force.
       * 
       * Can only be called by ROOT.
       **/
      forceUnreserve: AugmentedSubmittable<(who: MultiAddress | { Id: any } | { Index: any } | { Raw: any } | { Address32: any } | { Address20: any } | string | Uint8Array, amount: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [MultiAddress, u64]>;
      /**
       * Transfer the entire transferable balance from the caller account.
       * 
       * NOTE: This function only attempts to transfer _transferable_ balances. This means that
       * any locked, reserved, or existential deposits (when `keep_alive` is `true`), will not be
       * transferred by this function. To ensure that this function results in a killed account,
       * you might need to prepare the account by removing any reference counters, storage
       * deposits, etc...
       * 
       * The dispatch origin of this call must be Signed.
       * 
       * - `dest`: The recipient of the transfer.
       * - `keep_alive`: A boolean to determine if the `transfer_all` operation should send all
       * of the funds the account has, causing the sender account to be killed (false), or
       * transfer everything except at least the existential deposit, which will guarantee to
       * keep the sender account alive (true).
       **/
      transferAll: AugmentedSubmittable<(dest: MultiAddress | { Id: any } | { Index: any } | { Raw: any } | { Address32: any } | { Address20: any } | string | Uint8Array, keepAlive: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [MultiAddress, bool]>;
      /**
       * Transfer some liquid free balance to another account.
       * 
       * `transfer_allow_death` will set the `FreeBalance` of the sender and receiver.
       * If the sender's account is below the existential deposit as a result
       * of the transfer, the account will be reaped.
       * 
       * The dispatch origin for this call must be `Signed` by the transactor.
       **/
      transferAllowDeath: AugmentedSubmittable<(dest: MultiAddress | { Id: any } | { Index: any } | { Raw: any } | { Address32: any } | { Address20: any } | string | Uint8Array, value: Compact<u64> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [MultiAddress, Compact<u64>]>;
      /**
       * Same as the [`transfer_allow_death`] call, but with a check that the transfer will not
       * kill the origin account.
       * 
       * 99% of the time you want [`transfer_allow_death`] instead.
       * 
       * [`transfer_allow_death`]: struct.Pallet.html#method.transfer
       **/
      transferKeepAlive: AugmentedSubmittable<(dest: MultiAddress | { Id: any } | { Index: any } | { Raw: any } | { Address32: any } | { Address20: any } | string | Uint8Array, value: Compact<u64> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [MultiAddress, Compact<u64>]>;
      /**
       * Upgrade a specified account.
       * 
       * - `origin`: Must be `Signed`.
       * - `who`: The account to be upgraded.
       * 
       * This will waive the transaction fee if at least all but 10% of the accounts needed to
       * be upgraded. (We let some not have to be upgraded just in order to allow for the
       * possibility of churn).
       **/
      upgradeAccounts: AugmentedSubmittable<(who: Vec<AccountId32> | (AccountId32 | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [Vec<AccountId32>]>;
      /**
       * Generic tx
       **/
      [key: string]: SubmittableExtrinsicFunction<ApiType>;
    };
    governanceModule: {
      addDaoApplication: AugmentedSubmittable<(applicationKey: AccountId32 | string | Uint8Array, data: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32, Bytes]>;
      addGlobalCustomProposal: AugmentedSubmittable<(data: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
      addGlobalParamsProposal: AugmentedSubmittable<(data: Bytes | string | Uint8Array, maxNameLength: u16 | AnyNumber | Uint8Array, minNameLength: u16 | AnyNumber | Uint8Array, maxAllowedSubnets: u16 | AnyNumber | Uint8Array, maxAllowedModules: u16 | AnyNumber | Uint8Array, maxRegistrationsPerBlock: u16 | AnyNumber | Uint8Array, maxAllowedWeights: u16 | AnyNumber | Uint8Array, floorStakeDelegationFee: Percent | AnyNumber | Uint8Array, floorValidatorWeightFee: Percent | AnyNumber | Uint8Array, floorFounderShare: u8 | AnyNumber | Uint8Array, minWeightStake: u64 | AnyNumber | Uint8Array, curator: AccountId32 | string | Uint8Array, proposalCost: u64 | AnyNumber | Uint8Array, proposalExpiration: u32 | AnyNumber | Uint8Array, generalSubnetApplicationCost: u64 | AnyNumber | Uint8Array, kappa: u16 | AnyNumber | Uint8Array, rho: u16 | AnyNumber | Uint8Array, subnetImmunityPeriod: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes, u16, u16, u16, u16, u16, u16, Percent, Percent, u8, u64, AccountId32, u64, u32, u64, u16, u16, u64]>;
      addSubnetCustomProposal: AugmentedSubmittable<(netuid: u16 | AnyNumber | Uint8Array, data: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u16, Bytes]>;
      addSubnetParamsProposal: AugmentedSubmittable<(netuid: u16 | AnyNumber | Uint8Array, data: Bytes | string | Uint8Array, founder: AccountId32 | string | Uint8Array, founderShare: u16 | AnyNumber | Uint8Array, name: Bytes | string | Uint8Array, metadata: Option<Bytes> | null | Uint8Array | Bytes | string, immunityPeriod: u16 | AnyNumber | Uint8Array, incentiveRatio: u16 | AnyNumber | Uint8Array, maxAllowedUids: u16 | AnyNumber | Uint8Array, maxAllowedWeights: u16 | AnyNumber | Uint8Array, minAllowedWeights: u16 | AnyNumber | Uint8Array, maxWeightAge: u64 | AnyNumber | Uint8Array, tempo: u16 | AnyNumber | Uint8Array, maximumSetWeightCallsPerEpoch: Option<u16> | null | Uint8Array | u16 | AnyNumber, voteMode: PalletGovernanceApiVoteMode | 'Authority' | 'Vote' | number | Uint8Array, bondsMa: u64 | AnyNumber | Uint8Array, moduleBurnConfig: PalletSubspaceParamsBurnGeneralBurnConfiguration | { minBurn?: any; maxBurn?: any; adjustmentAlpha?: any; targetRegistrationsInterval?: any; targetRegistrationsPerInterval?: any; maxRegistrationsPerInterval?: any } | string | Uint8Array, minValidatorStake: u64 | AnyNumber | Uint8Array, maxAllowedValidators: Option<u16> | null | Uint8Array | u16 | AnyNumber, useWeightsEncryption: bool | boolean | Uint8Array, copierMargin: SubstrateFixedFixedI128 | { bits?: any } | string | Uint8Array, maxEncryptionPeriod: Option<u64> | null | Uint8Array | u64 | AnyNumber) => SubmittableExtrinsic<ApiType>, [u16, Bytes, AccountId32, u16, Bytes, Option<Bytes>, u16, u16, u16, u16, u16, u64, u16, Option<u16>, PalletGovernanceApiVoteMode, u64, PalletSubspaceParamsBurnGeneralBurnConfiguration, u64, Option<u16>, bool, SubstrateFixedFixedI128, Option<u64>]>;
      addToWhitelist: AugmentedSubmittable<(moduleKey: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32]>;
      addTransferDaoTreasuryProposal: AugmentedSubmittable<(data: Bytes | string | Uint8Array, value: u64 | AnyNumber | Uint8Array, dest: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes, u64, AccountId32]>;
      disableVotePowerDelegation: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>, []>;
      enableVotePowerDelegation: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>, []>;
      refuseDaoApplication: AugmentedSubmittable<(id: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
      removeFromWhitelist: AugmentedSubmittable<(moduleKey: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32]>;
      removeVoteProposal: AugmentedSubmittable<(proposalId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
      voteProposal: AugmentedSubmittable<(proposalId: u64 | AnyNumber | Uint8Array, agree: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, bool]>;
      /**
       * Generic tx
       **/
      [key: string]: SubmittableExtrinsicFunction<ApiType>;
    };
    grandpa: {
      /**
       * Note that the current authority set of the GRANDPA finality gadget has stalled.
       * 
       * This will trigger a forced authority set change at the beginning of the next session, to
       * be enacted `delay` blocks after that. The `delay` should be high enough to safely assume
       * that the block signalling the forced change will not be re-orged e.g. 1000 blocks.
       * The block production rate (which may be slowed down because of finality lagging) should
       * be taken into account when choosing the `delay`. The GRANDPA voters based on the new
       * authority will start voting on top of `best_finalized_block_number` for new finalized
       * blocks. `best_finalized_block_number` should be the highest of the latest finalized
       * block of all validators of the new authority set.
       * 
       * Only callable by root.
       **/
      noteStalled: AugmentedSubmittable<(delay: u64 | AnyNumber | Uint8Array, bestFinalizedBlockNumber: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64]>;
      /**
       * Report voter equivocation/misbehavior. This method will verify the
       * equivocation proof and validate the given key ownership proof
       * against the extracted offender. If both are valid, the offence
       * will be reported.
       **/
      reportEquivocation: AugmentedSubmittable<(equivocationProof: SpConsensusGrandpaEquivocationProof | { setId?: any; equivocation?: any } | string | Uint8Array, keyOwnerProof: SpCoreVoid | null) => SubmittableExtrinsic<ApiType>, [SpConsensusGrandpaEquivocationProof, SpCoreVoid]>;
      /**
       * Report voter equivocation/misbehavior. This method will verify the
       * equivocation proof and validate the given key ownership proof
       * against the extracted offender. If both are valid, the offence
       * will be reported.
       * 
       * This extrinsic must be called unsigned and it is expected that only
       * block authors will call it (validated in `ValidateUnsigned`), as such
       * if the block author is defined it will be defined as the equivocation
       * reporter.
       **/
      reportEquivocationUnsigned: AugmentedSubmittable<(equivocationProof: SpConsensusGrandpaEquivocationProof | { setId?: any; equivocation?: any } | string | Uint8Array, keyOwnerProof: SpCoreVoid | null) => SubmittableExtrinsic<ApiType>, [SpConsensusGrandpaEquivocationProof, SpCoreVoid]>;
      /**
       * Generic tx
       **/
      [key: string]: SubmittableExtrinsicFunction<ApiType>;
    };
    multisig: {
      /**
       * Register approval for a dispatch to be made from a deterministic composite account if
       * approved by a total of `threshold - 1` of `other_signatories`.
       * 
       * Payment: `DepositBase` will be reserved if this is the first approval, plus
       * `threshold` times `DepositFactor`. It is returned once this dispatch happens or
       * is cancelled.
       * 
       * The dispatch origin for this call must be _Signed_.
       * 
       * - `threshold`: The total number of approvals for this dispatch before it is executed.
       * - `other_signatories`: The accounts (other than the sender) who can approve this
       * dispatch. May not be empty.
       * - `maybe_timepoint`: If this is the first approval, then this must be `None`. If it is
       * not the first approval, then it must be `Some`, with the timepoint (block number and
       * transaction index) of the first approval transaction.
       * - `call_hash`: The hash of the call to be executed.
       * 
       * NOTE: If this is the final approval, you will want to use `as_multi` instead.
       * 
       * ## Complexity
       * - `O(S)`.
       * - Up to one balance-reserve or unreserve operation.
       * - One passthrough operation, one insert, both `O(S)` where `S` is the number of
       * signatories. `S` is capped by `MaxSignatories`, with weight being proportional.
       * - One encode & hash, both of complexity `O(S)`.
       * - Up to one binary search and insert (`O(logS + S)`).
       * - I/O: 1 read `O(S)`, up to 1 mutate `O(S)`. Up to one remove.
       * - One event.
       * - Storage: inserts one item, value size bounded by `MaxSignatories`, with a deposit
       * taken for its lifetime of `DepositBase + threshold * DepositFactor`.
       **/
      approveAsMulti: AugmentedSubmittable<(threshold: u16 | AnyNumber | Uint8Array, otherSignatories: Vec<AccountId32> | (AccountId32 | string | Uint8Array)[], maybeTimepoint: Option<PalletMultisigTimepoint> | null | Uint8Array | PalletMultisigTimepoint | { height?: any; index?: any } | string, callHash: U8aFixed | string | Uint8Array, maxWeight: SpWeightsWeightV2Weight | { refTime?: any; proofSize?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u16, Vec<AccountId32>, Option<PalletMultisigTimepoint>, U8aFixed, SpWeightsWeightV2Weight]>;
      /**
       * Register approval for a dispatch to be made from a deterministic composite account if
       * approved by a total of `threshold - 1` of `other_signatories`.
       * 
       * If there are enough, then dispatch the call.
       * 
       * Payment: `DepositBase` will be reserved if this is the first approval, plus
       * `threshold` times `DepositFactor`. It is returned once this dispatch happens or
       * is cancelled.
       * 
       * The dispatch origin for this call must be _Signed_.
       * 
       * - `threshold`: The total number of approvals for this dispatch before it is executed.
       * - `other_signatories`: The accounts (other than the sender) who can approve this
       * dispatch. May not be empty.
       * - `maybe_timepoint`: If this is the first approval, then this must be `None`. If it is
       * not the first approval, then it must be `Some`, with the timepoint (block number and
       * transaction index) of the first approval transaction.
       * - `call`: The call to be executed.
       * 
       * NOTE: Unless this is the final approval, you will generally want to use
       * `approve_as_multi` instead, since it only requires a hash of the call.
       * 
       * Result is equivalent to the dispatched result if `threshold` is exactly `1`. Otherwise
       * on success, result is `Ok` and the result from the interior call, if it was executed,
       * may be found in the deposited `MultisigExecuted` event.
       * 
       * ## Complexity
       * - `O(S + Z + Call)`.
       * - Up to one balance-reserve or unreserve operation.
       * - One passthrough operation, one insert, both `O(S)` where `S` is the number of
       * signatories. `S` is capped by `MaxSignatories`, with weight being proportional.
       * - One call encode & hash, both of complexity `O(Z)` where `Z` is tx-len.
       * - One encode & hash, both of complexity `O(S)`.
       * - Up to one binary search and insert (`O(logS + S)`).
       * - I/O: 1 read `O(S)`, up to 1 mutate `O(S)`. Up to one remove.
       * - One event.
       * - The weight of the `call`.
       * - Storage: inserts one item, value size bounded by `MaxSignatories`, with a deposit
       * taken for its lifetime of `DepositBase + threshold * DepositFactor`.
       **/
      asMulti: AugmentedSubmittable<(threshold: u16 | AnyNumber | Uint8Array, otherSignatories: Vec<AccountId32> | (AccountId32 | string | Uint8Array)[], maybeTimepoint: Option<PalletMultisigTimepoint> | null | Uint8Array | PalletMultisigTimepoint | { height?: any; index?: any } | string, call: Call | IMethod | string | Uint8Array, maxWeight: SpWeightsWeightV2Weight | { refTime?: any; proofSize?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u16, Vec<AccountId32>, Option<PalletMultisigTimepoint>, Call, SpWeightsWeightV2Weight]>;
      /**
       * Immediately dispatch a multi-signature call using a single approval from the caller.
       * 
       * The dispatch origin for this call must be _Signed_.
       * 
       * - `other_signatories`: The accounts (other than the sender) who are part of the
       * multi-signature, but do not participate in the approval process.
       * - `call`: The call to be executed.
       * 
       * Result is equivalent to the dispatched result.
       * 
       * ## Complexity
       * O(Z + C) where Z is the length of the call and C its execution weight.
       **/
      asMultiThreshold1: AugmentedSubmittable<(otherSignatories: Vec<AccountId32> | (AccountId32 | string | Uint8Array)[], call: Call | IMethod | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Vec<AccountId32>, Call]>;
      /**
       * Cancel a pre-existing, on-going multisig transaction. Any deposit reserved previously
       * for this operation will be unreserved on success.
       * 
       * The dispatch origin for this call must be _Signed_.
       * 
       * - `threshold`: The total number of approvals for this dispatch before it is executed.
       * - `other_signatories`: The accounts (other than the sender) who can approve this
       * dispatch. May not be empty.
       * - `timepoint`: The timepoint (block number and transaction index) of the first approval
       * transaction for this dispatch.
       * - `call_hash`: The hash of the call to be executed.
       * 
       * ## Complexity
       * - `O(S)`.
       * - Up to one balance-reserve or unreserve operation.
       * - One passthrough operation, one insert, both `O(S)` where `S` is the number of
       * signatories. `S` is capped by `MaxSignatories`, with weight being proportional.
       * - One encode & hash, both of complexity `O(S)`.
       * - One event.
       * - I/O: 1 read `O(S)`, one remove.
       * - Storage: removes one item.
       **/
      cancelAsMulti: AugmentedSubmittable<(threshold: u16 | AnyNumber | Uint8Array, otherSignatories: Vec<AccountId32> | (AccountId32 | string | Uint8Array)[], timepoint: PalletMultisigTimepoint | { height?: any; index?: any } | string | Uint8Array, callHash: U8aFixed | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u16, Vec<AccountId32>, PalletMultisigTimepoint, U8aFixed]>;
      /**
       * Generic tx
       **/
      [key: string]: SubmittableExtrinsicFunction<ApiType>;
    };
    offworker: {
      addAuthorities: AugmentedSubmittable<(newAuthorities: Vec<ITuple<[AccountId32, ITuple<[Bytes, Bytes]>]>> | ([AccountId32 | string | Uint8Array, ITuple<[Bytes, Bytes]> | [Bytes | string | Uint8Array, Bytes | string | Uint8Array]])[]) => SubmittableExtrinsic<ApiType>, [Vec<ITuple<[AccountId32, ITuple<[Bytes, Bytes]>]>>]>;
      sendDecryptedWeights: AugmentedSubmittable<(payload: PalletOffworkerDecryptedWeightsPayload | { subnetId?: any; decryptedWeights?: any; delta?: any; blockNumber?: any; public?: any; forcedSendByRotation?: any } | string | Uint8Array, signature: SpRuntimeMultiSignature | { Ed25519: any } | { Sr25519: any } | { Ecdsa: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletOffworkerDecryptedWeightsPayload, SpRuntimeMultiSignature]>;
      sendPing: AugmentedSubmittable<(payload: PalletOffworkerKeepAlivePayload | { publicKey?: any; blockNumber?: any; public?: any } | string | Uint8Array, signature: SpRuntimeMultiSignature | { Ed25519: any } | { Sr25519: any } | { Ecdsa: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletOffworkerKeepAlivePayload, SpRuntimeMultiSignature]>;
      /**
       * Generic tx
       **/
      [key: string]: SubmittableExtrinsicFunction<ApiType>;
    };
    subnetEmissionModule: {
      delegateWeightControl: AugmentedSubmittable<(netuid: u16 | AnyNumber | Uint8Array, target: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u16, AccountId32]>;
      removeWeightControl: AugmentedSubmittable<(netuid: u16 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u16]>;
      setWeights: AugmentedSubmittable<(netuid: u16 | AnyNumber | Uint8Array, uids: Vec<u16> | (u16 | AnyNumber | Uint8Array)[], weights: Vec<u16> | (u16 | AnyNumber | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [u16, Vec<u16>, Vec<u16>]>;
      setWeightsEncrypted: AugmentedSubmittable<(netuid: u16 | AnyNumber | Uint8Array, encryptedWeights: Bytes | string | Uint8Array, decryptedWeightsHash: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u16, Bytes, Bytes]>;
      /**
       * Generic tx
       **/
      [key: string]: SubmittableExtrinsicFunction<ApiType>;
    };
    subspaceModule: {
      addStake: AugmentedSubmittable<(moduleKey: AccountId32 | string | Uint8Array, amount: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32, u64]>;
      addStakeMultiple: AugmentedSubmittable<(moduleKeys: Vec<AccountId32> | (AccountId32 | string | Uint8Array)[], amounts: Vec<u64> | (u64 | AnyNumber | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [Vec<AccountId32>, Vec<u64>]>;
      bridge: AugmentedSubmittable<(amount: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
      bridgeWithdraw: AugmentedSubmittable<(amount: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
      deregister: AugmentedSubmittable<(netuid: u16 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u16]>;
      register: AugmentedSubmittable<(networkName: Bytes | string | Uint8Array, name: Bytes | string | Uint8Array, address: Bytes | string | Uint8Array, moduleKey: AccountId32 | string | Uint8Array, metadata: Option<Bytes> | null | Uint8Array | Bytes | string) => SubmittableExtrinsic<ApiType>, [Bytes, Bytes, Bytes, AccountId32, Option<Bytes>]>;
      registerSubnet: AugmentedSubmittable<(name: Bytes | string | Uint8Array, metadata: Option<Bytes> | null | Uint8Array | Bytes | string) => SubmittableExtrinsic<ApiType>, [Bytes, Option<Bytes>]>;
      removeStake: AugmentedSubmittable<(moduleKey: AccountId32 | string | Uint8Array, amount: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32, u64]>;
      removeStakeMultiple: AugmentedSubmittable<(moduleKeys: Vec<AccountId32> | (AccountId32 | string | Uint8Array)[], amounts: Vec<u64> | (u64 | AnyNumber | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [Vec<AccountId32>, Vec<u64>]>;
      transferMultiple: AugmentedSubmittable<(destinations: Vec<AccountId32> | (AccountId32 | string | Uint8Array)[], amounts: Vec<u64> | (u64 | AnyNumber | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [Vec<AccountId32>, Vec<u64>]>;
      transferStake: AugmentedSubmittable<(moduleKey: AccountId32 | string | Uint8Array, newModuleKey: AccountId32 | string | Uint8Array, amount: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32, AccountId32, u64]>;
      updateModule: AugmentedSubmittable<(netuid: u16 | AnyNumber | Uint8Array, name: Bytes | string | Uint8Array, address: Bytes | string | Uint8Array, stakeDelegationFee: Option<Percent> | null | Uint8Array | Percent | AnyNumber, validatorWeightFee: Option<Percent> | null | Uint8Array | Percent | AnyNumber, metadata: Option<Bytes> | null | Uint8Array | Bytes | string) => SubmittableExtrinsic<ApiType>, [u16, Bytes, Bytes, Option<Percent>, Option<Percent>, Option<Bytes>]>;
      updateSubnet: AugmentedSubmittable<(netuid: u16 | AnyNumber | Uint8Array, founder: AccountId32 | string | Uint8Array, founderShare: u16 | AnyNumber | Uint8Array, name: Bytes | string | Uint8Array, metadata: Option<Bytes> | null | Uint8Array | Bytes | string, immunityPeriod: u16 | AnyNumber | Uint8Array, incentiveRatio: u16 | AnyNumber | Uint8Array, maxAllowedUids: u16 | AnyNumber | Uint8Array, maxAllowedWeights: u16 | AnyNumber | Uint8Array, minAllowedWeights: u16 | AnyNumber | Uint8Array, maxWeightAge: u64 | AnyNumber | Uint8Array, tempo: u16 | AnyNumber | Uint8Array, maximumSetWeightCallsPerEpoch: Option<u16> | null | Uint8Array | u16 | AnyNumber, voteMode: PalletGovernanceApiVoteMode | 'Authority' | 'Vote' | number | Uint8Array, bondsMa: u64 | AnyNumber | Uint8Array, moduleBurnConfig: PalletSubspaceParamsBurnGeneralBurnConfiguration | { minBurn?: any; maxBurn?: any; adjustmentAlpha?: any; targetRegistrationsInterval?: any; targetRegistrationsPerInterval?: any; maxRegistrationsPerInterval?: any } | string | Uint8Array, minValidatorStake: u64 | AnyNumber | Uint8Array, maxAllowedValidators: Option<u16> | null | Uint8Array | u16 | AnyNumber, useWeightsEncryption: bool | boolean | Uint8Array, copierMargin: SubstrateFixedFixedI128 | { bits?: any } | string | Uint8Array, maxEncryptionPeriod: Option<u64> | null | Uint8Array | u64 | AnyNumber) => SubmittableExtrinsic<ApiType>, [u16, AccountId32, u16, Bytes, Option<Bytes>, u16, u16, u16, u16, u16, u64, u16, Option<u16>, PalletGovernanceApiVoteMode, u64, PalletSubspaceParamsBurnGeneralBurnConfiguration, u64, Option<u16>, bool, SubstrateFixedFixedI128, Option<u64>]>;
      /**
       * Generic tx
       **/
      [key: string]: SubmittableExtrinsicFunction<ApiType>;
    };
    sudo: {
      /**
       * Permanently removes the sudo key.
       * 
       * **This cannot be un-done.**
       **/
      removeKey: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>, []>;
      /**
       * Authenticates the current sudo key and sets the given AccountId (`new`) as the new sudo
       * key.
       **/
      setKey: AugmentedSubmittable<(updated: MultiAddress | { Id: any } | { Index: any } | { Raw: any } | { Address32: any } | { Address20: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [MultiAddress]>;
      /**
       * Authenticates the sudo key and dispatches a function call with `Root` origin.
       **/
      sudo: AugmentedSubmittable<(call: Call | IMethod | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Call]>;
      /**
       * Authenticates the sudo key and dispatches a function call with `Signed` origin from
       * a given account.
       * 
       * The dispatch origin for this call must be _Signed_.
       **/
      sudoAs: AugmentedSubmittable<(who: MultiAddress | { Id: any } | { Index: any } | { Raw: any } | { Address32: any } | { Address20: any } | string | Uint8Array, call: Call | IMethod | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [MultiAddress, Call]>;
      /**
       * Authenticates the sudo key and dispatches a function call with `Root` origin.
       * This function does not check the weight of the call, and instead allows the
       * Sudo user to specify the weight of the call.
       * 
       * The dispatch origin for this call must be _Signed_.
       **/
      sudoUncheckedWeight: AugmentedSubmittable<(call: Call | IMethod | string | Uint8Array, weight: SpWeightsWeightV2Weight | { refTime?: any; proofSize?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Call, SpWeightsWeightV2Weight]>;
      /**
       * Generic tx
       **/
      [key: string]: SubmittableExtrinsicFunction<ApiType>;
    };
    system: {
      /**
       * Provide the preimage (runtime binary) `code` for an upgrade that has been authorized.
       * 
       * If the authorization required a version check, this call will ensure the spec name
       * remains unchanged and that the spec version has increased.
       * 
       * Depending on the runtime's `OnSetCode` configuration, this function may directly apply
       * the new `code` in the same block or attempt to schedule the upgrade.
       * 
       * All origins are allowed.
       **/
      applyAuthorizedUpgrade: AugmentedSubmittable<(code: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
      /**
       * Authorize an upgrade to a given `code_hash` for the runtime. The runtime can be supplied
       * later.
       * 
       * This call requires Root origin.
       **/
      authorizeUpgrade: AugmentedSubmittable<(codeHash: H256 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [H256]>;
      /**
       * Authorize an upgrade to a given `code_hash` for the runtime. The runtime can be supplied
       * later.
       * 
       * WARNING: This authorizes an upgrade that will take place without any safety checks, for
       * example that the spec name remains the same and that the version number increases. Not
       * recommended for normal use. Use `authorize_upgrade` instead.
       * 
       * This call requires Root origin.
       **/
      authorizeUpgradeWithoutChecks: AugmentedSubmittable<(codeHash: H256 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [H256]>;
      /**
       * Kill all storage items with a key that starts with the given prefix.
       * 
       * **NOTE:** We rely on the Root origin to provide us the number of subkeys under
       * the prefix we are removing to accurately calculate the weight of this function.
       **/
      killPrefix: AugmentedSubmittable<(prefix: Bytes | string | Uint8Array, subkeys: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes, u32]>;
      /**
       * Kill some items from storage.
       **/
      killStorage: AugmentedSubmittable<(keys: Vec<Bytes> | (Bytes | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [Vec<Bytes>]>;
      /**
       * Make some on-chain remark.
       * 
       * Can be executed by every `origin`.
       **/
      remark: AugmentedSubmittable<(remark: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
      /**
       * Make some on-chain remark and emit event.
       **/
      remarkWithEvent: AugmentedSubmittable<(remark: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
      /**
       * Set the new runtime code.
       **/
      setCode: AugmentedSubmittable<(code: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
      /**
       * Set the new runtime code without doing any checks of the given `code`.
       * 
       * Note that runtime upgrades will not run if this is called with a not-increasing spec
       * version!
       **/
      setCodeWithoutChecks: AugmentedSubmittable<(code: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
      /**
       * Set the number of pages in the WebAssembly environment's heap.
       **/
      setHeapPages: AugmentedSubmittable<(pages: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
      /**
       * Set some items of storage.
       **/
      setStorage: AugmentedSubmittable<(items: Vec<ITuple<[Bytes, Bytes]>> | ([Bytes | string | Uint8Array, Bytes | string | Uint8Array])[]) => SubmittableExtrinsic<ApiType>, [Vec<ITuple<[Bytes, Bytes]>>]>;
      /**
       * Generic tx
       **/
      [key: string]: SubmittableExtrinsicFunction<ApiType>;
    };
    timestamp: {
      /**
       * Set the current time.
       * 
       * This call should be invoked exactly once per block. It will panic at the finalization
       * phase, if this call hasn't been invoked by that time.
       * 
       * The timestamp should be greater than the previous one by the amount specified by
       * [`Config::MinimumPeriod`].
       * 
       * The dispatch origin for this call must be _None_.
       * 
       * This dispatch class is _Mandatory_ to ensure it gets executed in the block. Be aware
       * that changing the complexity of this call could result exhausting the resources in a
       * block to execute any other calls.
       * 
       * ## Complexity
       * - `O(1)` (Note that implementations of `OnTimestampSet` must also be `O(1)`)
       * - 1 storage read and 1 storage mutation (codec `O(1)` because of `DidUpdate::take` in
       * `on_finalize`)
       * - 1 event handler `on_timestamp_set`. Must be `O(1)`.
       **/
      set: AugmentedSubmittable<(now: Compact<u64> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Compact<u64>]>;
      /**
       * Generic tx
       **/
      [key: string]: SubmittableExtrinsicFunction<ApiType>;
    };
    utility: {
      /**
       * Send a call through an indexed pseudonym of the sender.
       * 
       * Filter from origin are passed along. The call will be dispatched with an origin which
       * use the same filter as the origin of this call.
       * 
       * NOTE: If you need to ensure that any account-based filtering is not honored (i.e.
       * because you expect `proxy` to have been used prior in the call stack and you do not want
       * the call restrictions to apply to any sub-accounts), then use `as_multi_threshold_1`
       * in the Multisig pallet instead.
       * 
       * NOTE: Prior to version *12, this was called `as_limited_sub`.
       * 
       * The dispatch origin for this call must be _Signed_.
       **/
      asDerivative: AugmentedSubmittable<(index: u16 | AnyNumber | Uint8Array, call: Call | IMethod | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u16, Call]>;
      /**
       * Send a batch of dispatch calls.
       * 
       * May be called from any origin except `None`.
       * 
       * - `calls`: The calls to be dispatched from the same origin. The number of call must not
       * exceed the constant: `batched_calls_limit` (available in constant metadata).
       * 
       * If origin is root then the calls are dispatched without checking origin filter. (This
       * includes bypassing `frame_system::Config::BaseCallFilter`).
       * 
       * ## Complexity
       * - O(C) where C is the number of calls to be batched.
       * 
       * This will return `Ok` in all circumstances. To determine the success of the batch, an
       * event is deposited. If a call failed and the batch was interrupted, then the
       * `BatchInterrupted` event is deposited, along with the number of successful calls made
       * and the error of the failed call. If all were successful, then the `BatchCompleted`
       * event is deposited.
       **/
      batch: AugmentedSubmittable<(calls: Vec<Call> | (Call | IMethod | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [Vec<Call>]>;
      /**
       * Send a batch of dispatch calls and atomically execute them.
       * The whole transaction will rollback and fail if any of the calls failed.
       * 
       * May be called from any origin except `None`.
       * 
       * - `calls`: The calls to be dispatched from the same origin. The number of call must not
       * exceed the constant: `batched_calls_limit` (available in constant metadata).
       * 
       * If origin is root then the calls are dispatched without checking origin filter. (This
       * includes bypassing `frame_system::Config::BaseCallFilter`).
       * 
       * ## Complexity
       * - O(C) where C is the number of calls to be batched.
       **/
      batchAll: AugmentedSubmittable<(calls: Vec<Call> | (Call | IMethod | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [Vec<Call>]>;
      /**
       * Dispatches a function call with a provided origin.
       * 
       * The dispatch origin for this call must be _Root_.
       * 
       * ## Complexity
       * - O(1).
       **/
      dispatchAs: AugmentedSubmittable<(asOrigin: NodeSubspaceRuntimeOriginCaller | { system: any } | { Void: any } | string | Uint8Array, call: Call | IMethod | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [NodeSubspaceRuntimeOriginCaller, Call]>;
      /**
       * Send a batch of dispatch calls.
       * Unlike `batch`, it allows errors and won't interrupt.
       * 
       * May be called from any origin except `None`.
       * 
       * - `calls`: The calls to be dispatched from the same origin. The number of call must not
       * exceed the constant: `batched_calls_limit` (available in constant metadata).
       * 
       * If origin is root then the calls are dispatch without checking origin filter. (This
       * includes bypassing `frame_system::Config::BaseCallFilter`).
       * 
       * ## Complexity
       * - O(C) where C is the number of calls to be batched.
       **/
      forceBatch: AugmentedSubmittable<(calls: Vec<Call> | (Call | IMethod | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [Vec<Call>]>;
      /**
       * Dispatch a function call with a specified weight.
       * 
       * This function does not check the weight of the call, and instead allows the
       * Root origin to specify the weight of the call.
       * 
       * The dispatch origin for this call must be _Root_.
       **/
      withWeight: AugmentedSubmittable<(call: Call | IMethod | string | Uint8Array, weight: SpWeightsWeightV2Weight | { refTime?: any; proofSize?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Call, SpWeightsWeightV2Weight]>;
      /**
       * Generic tx
       **/
      [key: string]: SubmittableExtrinsicFunction<ApiType>;
    };
  } // AugmentedSubmittables
} // declare module
