// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

// import type lookup before we augment - in some environments
// this is required to allow for ambient/previous definitions
import '@polkadot/api-base/types/storage';

import type { ApiTypes, AugmentedQuery, QueryableStorageEntry } from '@polkadot/api-base/types';
import type { BTreeSet, Bytes, Null, Option, Struct, U256, U8aFixed, Vec, bool, u128, u16, u32, u64 } from '@polkadot/types-codec';
import type { AnyNumber, ITuple } from '@polkadot/types-codec/types';
import type { AccountId32, H160, H256, Percent } from '@polkadot/types/interfaces/runtime';
import type { EthereumBlock, EthereumReceiptReceiptV3, EthereumTransactionTransactionV2, FpRpcTransactionStatus, FrameSupportDispatchPerDispatchClassWeight, FrameSupportTokensMiscIdAmount, FrameSystemAccountInfo, FrameSystemCodeUpgradeAuthorization, FrameSystemEventRecord, FrameSystemLastRuntimeUpgradeInfo, FrameSystemPhase, PalletBalancesAccountData, PalletBalancesBalanceLock, PalletBalancesReserveData, PalletEmission0ConsensusMember, PalletEvmCodeMetadata, PalletGovernanceApplicationAgentApplication, PalletGovernanceConfigGovernanceConfiguration, PalletGovernanceProposal, PalletGovernanceProposalUnrewardedProposal, PalletGrandpaStoredPendingChange, PalletGrandpaStoredState, PalletMultisigMultisig, PalletPermission0PermissionEnforcementReferendum, PalletPermission0PermissionPermissionContract, PalletTorus0Agent, PalletTorus0BurnBurnConfiguration, PalletTorus0FeeValidatorFeeConstraints, PalletTorus0NamespaceNamespaceMetadata, PalletTorus0NamespaceNamespaceOwnership, PalletTorus0NamespaceNamespacePricingConfig, PalletTransactionPaymentReleases, SpConsensusAuraSr25519AppSr25519Public, SpConsensusGrandpaAppPublic, SpRuntimeDigest, TorusRuntimeRuntimeHoldReason } from '@polkadot/types/lookup';
import type { Observable } from '@polkadot/types/types';

export type __AugmentedQuery<ApiType extends ApiTypes> = AugmentedQuery<ApiType, () => unknown>;
export type __QueryableStorageEntry<ApiType extends ApiTypes> = QueryableStorageEntry<ApiType>;

declare module '@polkadot/api-base/types/storage' {
  interface AugmentedQueries<ApiType extends ApiTypes> {
    aura: {
      /**
       * The current authority set.
       **/
      authorities: AugmentedQuery<ApiType, () => Observable<Vec<SpConsensusAuraSr25519AppSr25519Public>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * The current slot of this block.
       * 
       * This will be set in `on_initialize`.
       **/
      currentSlot: AugmentedQuery<ApiType, () => Observable<u64>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Generic query
       **/
      [key: string]: QueryableStorageEntry<ApiType>;
    };
    balances: {
      /**
       * The Balances pallet example of storing the balance of an account.
       * 
       * # Example
       * 
       * ```nocompile
       * impl pallet_balances::Config for Runtime {
       * type AccountStore = StorageMapShim<Self::Account<Runtime>, frame_system::Provider<Runtime>, AccountId, Self::AccountData<Balance>>
       * }
       * ```
       * 
       * You can also store the balance of an account in the `System` pallet.
       * 
       * # Example
       * 
       * ```nocompile
       * impl pallet_balances::Config for Runtime {
       * type AccountStore = System
       * }
       * ```
       * 
       * But this comes with tradeoffs, storing account balances in the system pallet stores
       * `frame_system` data alongside the account data contrary to storing account balances in the
       * `Balances` pallet, which uses a `StorageMap` to store balances data only.
       * NOTE: This is only used in the case that this pallet is used to store balances.
       **/
      account: AugmentedQuery<ApiType, (arg: AccountId32 | string | Uint8Array) => Observable<PalletBalancesAccountData>, [AccountId32]> & QueryableStorageEntry<ApiType, [AccountId32]>;
      /**
       * Freeze locks on account balances.
       **/
      freezes: AugmentedQuery<ApiType, (arg: AccountId32 | string | Uint8Array) => Observable<Vec<FrameSupportTokensMiscIdAmount>>, [AccountId32]> & QueryableStorageEntry<ApiType, [AccountId32]>;
      /**
       * Holds on account balances.
       **/
      holds: AugmentedQuery<ApiType, (arg: AccountId32 | string | Uint8Array) => Observable<Vec<{
    readonly id: TorusRuntimeRuntimeHoldReason;
    readonly amount: u128;
  } & Struct>>, [AccountId32]> & QueryableStorageEntry<ApiType, [AccountId32]>;
      /**
       * The total units of outstanding deactivated balance in the system.
       **/
      inactiveIssuance: AugmentedQuery<ApiType, () => Observable<u128>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Any liquidity locks on some account balances.
       * NOTE: Should only be accessed when setting, changing and freeing a lock.
       * 
       * Use of locks is deprecated in favour of freezes. See `https://github.com/paritytech/substrate/pull/12951/`
       **/
      locks: AugmentedQuery<ApiType, (arg: AccountId32 | string | Uint8Array) => Observable<Vec<PalletBalancesBalanceLock>>, [AccountId32]> & QueryableStorageEntry<ApiType, [AccountId32]>;
      /**
       * Named reserves on some account balances.
       * 
       * Use of reserves is deprecated in favour of holds. See `https://github.com/paritytech/substrate/pull/12951/`
       **/
      reserves: AugmentedQuery<ApiType, (arg: AccountId32 | string | Uint8Array) => Observable<Vec<PalletBalancesReserveData>>, [AccountId32]> & QueryableStorageEntry<ApiType, [AccountId32]>;
      /**
       * The total units issued in the system.
       **/
      totalIssuance: AugmentedQuery<ApiType, () => Observable<u128>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Generic query
       **/
      [key: string]: QueryableStorageEntry<ApiType>;
    };
    emission0: {
      /**
       * Map of consensus members indexed by their keys. A consensus member is
       * any agent eligible for emissions in the next epoch. This means
       * deregistered agents will also receive emissions.
       **/
      consensusMembers: AugmentedQuery<ApiType, (arg: AccountId32 | string | Uint8Array) => Observable<Option<PalletEmission0ConsensusMember>>, [AccountId32]> & QueryableStorageEntry<ApiType, [AccountId32]>;
      /**
       * Percentage of issued tokens to be burned every epoch.
       **/
      emissionRecyclingPercentage: AugmentedQuery<ApiType, () => Observable<Percent>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Ratio between incentives and dividends on distribution. 50% means they
       * are distributed equally.
       **/
      incentivesRatio: AugmentedQuery<ApiType, () => Observable<Percent>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Amount of tokens accumulated since the last epoch. This increases on
       * every block. See [`distribute::get_total_emission_per_block`].
       **/
      pendingEmission: AugmentedQuery<ApiType, () => Observable<u128>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Map of agents delegating weight control to other agents. Emissions
       * derived from weight delegation are taxed and the fees go the original
       * weight setter.
       **/
      weightControlDelegation: AugmentedQuery<ApiType, (arg: AccountId32 | string | Uint8Array) => Observable<Option<AccountId32>>, [AccountId32]> & QueryableStorageEntry<ApiType, [AccountId32]>;
      /**
       * Generic query
       **/
      [key: string]: QueryableStorageEntry<ApiType>;
    };
    ethereum: {
      blockHash: AugmentedQuery<ApiType, (arg: U256 | AnyNumber | Uint8Array) => Observable<H256>, [U256]> & QueryableStorageEntry<ApiType, [U256]>;
      /**
       * The current Ethereum block.
       **/
      currentBlock: AugmentedQuery<ApiType, () => Observable<Option<EthereumBlock>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * The current Ethereum receipts.
       **/
      currentReceipts: AugmentedQuery<ApiType, () => Observable<Option<Vec<EthereumReceiptReceiptV3>>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * The current transaction statuses.
       **/
      currentTransactionStatuses: AugmentedQuery<ApiType, () => Observable<Option<Vec<FpRpcTransactionStatus>>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Current building block's transactions and receipts.
       **/
      pending: AugmentedQuery<ApiType, () => Observable<Vec<ITuple<[EthereumTransactionTransactionV2, FpRpcTransactionStatus, EthereumReceiptReceiptV3]>>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Generic query
       **/
      [key: string]: QueryableStorageEntry<ApiType>;
    };
    evm: {
      accountCodes: AugmentedQuery<ApiType, (arg: H160 | string | Uint8Array) => Observable<Bytes>, [H160]> & QueryableStorageEntry<ApiType, [H160]>;
      accountCodesMetadata: AugmentedQuery<ApiType, (arg: H160 | string | Uint8Array) => Observable<Option<PalletEvmCodeMetadata>>, [H160]> & QueryableStorageEntry<ApiType, [H160]>;
      accountStorages: AugmentedQuery<ApiType, (arg1: H160 | string | Uint8Array, arg2: H256 | string | Uint8Array) => Observable<H256>, [H160, H256]> & QueryableStorageEntry<ApiType, [H160, H256]>;
      suicided: AugmentedQuery<ApiType, (arg: H160 | string | Uint8Array) => Observable<Option<Null>>, [H160]> & QueryableStorageEntry<ApiType, [H160]>;
      /**
       * Generic query
       **/
      [key: string]: QueryableStorageEntry<ApiType>;
    };
    governance: {
      /**
       * A map of agent applications, past and present.
       **/
      agentApplications: AugmentedQuery<ApiType, (arg: u32 | AnyNumber | Uint8Array) => Observable<Option<PalletGovernanceApplicationAgentApplication>>, [u32]> & QueryableStorageEntry<ApiType, [u32]>;
      /**
       * Determines if new agents can be registered on the chain.
       **/
      agentsFrozen: AugmentedQuery<ApiType, () => Observable<bool>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * List of allocator keys, which are the default validators on the network.
       **/
      allocators: AugmentedQuery<ApiType, (arg: AccountId32 | string | Uint8Array) => Observable<Option<Null>>, [AccountId32]> & QueryableStorageEntry<ApiType, [AccountId32]>;
      /**
       * The treasury address to which the treasury emission percentages and
       * other funds go to. A proposal can be created withdrawing the funds to a
       * key.
       **/
      daoTreasuryAddress: AugmentedQuery<ApiType, () => Observable<AccountId32>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Global governance configuration files.
       **/
      globalGovernanceConfig: AugmentedQuery<ApiType, () => Observable<PalletGovernanceConfigGovernanceConfiguration>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Determines if new namespaces can be created on the chain.
       **/
      namespacesFrozen: AugmentedQuery<ApiType, () => Observable<bool>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * List of keys that are NOT delegating their voting power. By default, all
       * keys delegate their voting power.
       **/
      notDelegatingVotingPower: AugmentedQuery<ApiType, () => Observable<BTreeSet<AccountId32>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Map of past and present proposals indexed by their incrementing ID.
       **/
      proposals: AugmentedQuery<ApiType, (arg: u64 | AnyNumber | Uint8Array) => Observable<Option<PalletGovernanceProposal>>, [u64]> & QueryableStorageEntry<ApiType, [u64]>;
      /**
       * Fee taken from emission distribution and deposited into
       * [`DaoTreasuryAddress`].
       **/
      treasuryEmissionFee: AugmentedQuery<ApiType, () => Observable<Percent>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Queue of proposals to be rewarded after closing.
       **/
      unrewardedProposals: AugmentedQuery<ApiType, (arg: u64 | AnyNumber | Uint8Array) => Observable<Option<PalletGovernanceProposalUnrewardedProposal>>, [u64]> & QueryableStorageEntry<ApiType, [u64]>;
      /**
       * List of whitelisted keys. Keys listed here are allowed to register
       * agents.
       **/
      whitelist: AugmentedQuery<ApiType, (arg: AccountId32 | string | Uint8Array) => Observable<Option<Null>>, [AccountId32]> & QueryableStorageEntry<ApiType, [AccountId32]>;
      /**
       * Generic query
       **/
      [key: string]: QueryableStorageEntry<ApiType>;
    };
    grandpa: {
      /**
       * The current list of authorities.
       **/
      authorities: AugmentedQuery<ApiType, () => Observable<Vec<ITuple<[SpConsensusGrandpaAppPublic, u64]>>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * The number of changes (both in terms of keys and underlying economic responsibilities)
       * in the "set" of Grandpa validators from genesis.
       **/
      currentSetId: AugmentedQuery<ApiType, () => Observable<u64>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * next block number where we can force a change.
       **/
      nextForced: AugmentedQuery<ApiType, () => Observable<Option<u64>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Pending change: (signaled at, scheduled change).
       **/
      pendingChange: AugmentedQuery<ApiType, () => Observable<Option<PalletGrandpaStoredPendingChange>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * A mapping from grandpa set ID to the index of the *most recent* session for which its
       * members were responsible.
       * 
       * This is only used for validating equivocation proofs. An equivocation proof must
       * contains a key-ownership proof for a given session, therefore we need a way to tie
       * together sessions and GRANDPA set ids, i.e. we need to validate that a validator
       * was the owner of a given key on a given session, and what the active set ID was
       * during that session.
       * 
       * TWOX-NOTE: `SetId` is not under user control.
       **/
      setIdSession: AugmentedQuery<ApiType, (arg: u64 | AnyNumber | Uint8Array) => Observable<Option<u32>>, [u64]> & QueryableStorageEntry<ApiType, [u64]>;
      /**
       * `true` if we are currently stalled.
       **/
      stalled: AugmentedQuery<ApiType, () => Observable<Option<ITuple<[u64, u64]>>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * State of the current authority set.
       **/
      state: AugmentedQuery<ApiType, () => Observable<PalletGrandpaStoredState>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Generic query
       **/
      [key: string]: QueryableStorageEntry<ApiType>;
    };
    multisig: {
      /**
       * The set of open multisig operations.
       **/
      multisigs: AugmentedQuery<ApiType, (arg1: AccountId32 | string | Uint8Array, arg2: U8aFixed | string | Uint8Array) => Observable<Option<PalletMultisigMultisig>>, [AccountId32, U8aFixed]> & QueryableStorageEntry<ApiType, [AccountId32, U8aFixed]>;
      /**
       * Generic query
       **/
      [key: string]: QueryableStorageEntry<ApiType>;
    };
    permission0: {
      /**
       * Accumulated amounts for each stream
       **/
      accumulatedStreamAmounts: AugmentedQuery<ApiType, (arg1: AccountId32 | string | Uint8Array, arg2: H256 | string | Uint8Array, arg3: H256 | string | Uint8Array) => Observable<Option<u128>>, [AccountId32, H256, H256]> & QueryableStorageEntry<ApiType, [AccountId32, H256, H256]>;
      /**
       * Enforcement votes in progress and the voters
       **/
      enforcementTracking: AugmentedQuery<ApiType, (arg1: H256 | string | Uint8Array, arg2: PalletPermission0PermissionEnforcementReferendum | { EmissionAccumulation: any } | { Execution: any } | string | Uint8Array) => Observable<BTreeSet<AccountId32>>, [H256, PalletPermission0PermissionEnforcementReferendum]> & QueryableStorageEntry<ApiType, [H256, PalletPermission0PermissionEnforcementReferendum]>;
      /**
       * Active permission contracts - stored by permission ID
       **/
      permissions: AugmentedQuery<ApiType, (arg: H256 | string | Uint8Array) => Observable<Option<PalletPermission0PermissionPermissionContract>>, [H256]> & QueryableStorageEntry<ApiType, [H256]>;
      /**
       * Permissions delegated by a specific account
       **/
      permissionsByDelegator: AugmentedQuery<ApiType, (arg: AccountId32 | string | Uint8Array) => Observable<Vec<H256>>, [AccountId32]> & QueryableStorageEntry<ApiType, [AccountId32]>;
      /**
       * Mapping from (delegator, recipient) to permission IDs
       **/
      permissionsByParticipants: AugmentedQuery<ApiType, (arg: ITuple<[AccountId32, AccountId32]> | [AccountId32 | string | Uint8Array, AccountId32 | string | Uint8Array]) => Observable<Vec<H256>>, [ITuple<[AccountId32, AccountId32]>]> & QueryableStorageEntry<ApiType, [ITuple<[AccountId32, AccountId32]>]>;
      /**
       * Permissions received by a specific account
       **/
      permissionsByRecipient: AugmentedQuery<ApiType, (arg: AccountId32 | string | Uint8Array) => Observable<Vec<H256>>, [AccountId32]> & QueryableStorageEntry<ApiType, [AccountId32]>;
      /**
       * Revocations in progress and the voters
       **/
      revocationTracking: AugmentedQuery<ApiType, (arg: H256 | string | Uint8Array) => Observable<BTreeSet<AccountId32>>, [H256]> & QueryableStorageEntry<ApiType, [H256]>;
      /**
       * Generic query
       **/
      [key: string]: QueryableStorageEntry<ApiType>;
    };
    sudo: {
      /**
       * The `AccountId` of the sudo key.
       **/
      key: AugmentedQuery<ApiType, () => Observable<Option<AccountId32>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Generic query
       **/
      [key: string]: QueryableStorageEntry<ApiType>;
    };
    system: {
      /**
       * The full account information for a particular account ID.
       **/
      account: AugmentedQuery<ApiType, (arg: AccountId32 | string | Uint8Array) => Observable<FrameSystemAccountInfo>, [AccountId32]> & QueryableStorageEntry<ApiType, [AccountId32]>;
      /**
       * Total length (in bytes) for all extrinsics put together, for the current block.
       **/
      allExtrinsicsLen: AugmentedQuery<ApiType, () => Observable<Option<u32>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * `Some` if a code upgrade has been authorized.
       **/
      authorizedUpgrade: AugmentedQuery<ApiType, () => Observable<Option<FrameSystemCodeUpgradeAuthorization>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Map of block numbers to block hashes.
       **/
      blockHash: AugmentedQuery<ApiType, (arg: u64 | AnyNumber | Uint8Array) => Observable<H256>, [u64]> & QueryableStorageEntry<ApiType, [u64]>;
      /**
       * The current weight for the block.
       **/
      blockWeight: AugmentedQuery<ApiType, () => Observable<FrameSupportDispatchPerDispatchClassWeight>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Digest of the current block, also part of the block header.
       **/
      digest: AugmentedQuery<ApiType, () => Observable<SpRuntimeDigest>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * The number of events in the `Events<T>` list.
       **/
      eventCount: AugmentedQuery<ApiType, () => Observable<u32>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Events deposited for the current block.
       * 
       * NOTE: The item is unbound and should therefore never be read on chain.
       * It could otherwise inflate the PoV size of a block.
       * 
       * Events have a large in-memory size. Box the events to not go out-of-memory
       * just in case someone still reads them from within the runtime.
       **/
      events: AugmentedQuery<ApiType, () => Observable<Vec<FrameSystemEventRecord>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Mapping between a topic (represented by T::Hash) and a vector of indexes
       * of events in the `<Events<T>>` list.
       * 
       * All topic vectors have deterministic storage locations depending on the topic. This
       * allows light-clients to leverage the changes trie storage tracking mechanism and
       * in case of changes fetch the list of events of interest.
       * 
       * The value has the type `(BlockNumberFor<T>, EventIndex)` because if we used only just
       * the `EventIndex` then in case if the topic has the same contents on the next block
       * no notification will be triggered thus the event might be lost.
       **/
      eventTopics: AugmentedQuery<ApiType, (arg: H256 | string | Uint8Array) => Observable<Vec<ITuple<[u64, u32]>>>, [H256]> & QueryableStorageEntry<ApiType, [H256]>;
      /**
       * The execution phase of the block.
       **/
      executionPhase: AugmentedQuery<ApiType, () => Observable<Option<FrameSystemPhase>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Total extrinsics count for the current block.
       **/
      extrinsicCount: AugmentedQuery<ApiType, () => Observable<Option<u32>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Extrinsics data for the current block (maps an extrinsic's index to its data).
       **/
      extrinsicData: AugmentedQuery<ApiType, (arg: u32 | AnyNumber | Uint8Array) => Observable<Bytes>, [u32]> & QueryableStorageEntry<ApiType, [u32]>;
      /**
       * Whether all inherents have been applied.
       **/
      inherentsApplied: AugmentedQuery<ApiType, () => Observable<bool>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Stores the `spec_version` and `spec_name` of when the last runtime upgrade happened.
       **/
      lastRuntimeUpgrade: AugmentedQuery<ApiType, () => Observable<Option<FrameSystemLastRuntimeUpgradeInfo>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * The current block number being processed. Set by `execute_block`.
       **/
      number: AugmentedQuery<ApiType, () => Observable<u64>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Hash of the previous block.
       **/
      parentHash: AugmentedQuery<ApiType, () => Observable<H256>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * True if we have upgraded so that AccountInfo contains three types of `RefCount`. False
       * (default) if not.
       **/
      upgradedToTripleRefCount: AugmentedQuery<ApiType, () => Observable<bool>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * True if we have upgraded so that `type RefCount` is `u32`. False (default) if not.
       **/
      upgradedToU32RefCount: AugmentedQuery<ApiType, () => Observable<bool>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Generic query
       **/
      [key: string]: QueryableStorageEntry<ApiType>;
    };
    timestamp: {
      /**
       * Whether the timestamp has been updated in this block.
       * 
       * This value is updated to `true` upon successful submission of a timestamp by a node.
       * It is then checked at the end of each block execution in the `on_finalize` hook.
       **/
      didUpdate: AugmentedQuery<ApiType, () => Observable<bool>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * The current time for the current block.
       **/
      now: AugmentedQuery<ApiType, () => Observable<u64>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Generic query
       **/
      [key: string]: QueryableStorageEntry<ApiType>;
    };
    torus0: {
      /**
       * Known registered network agents indexed by the owner's key.
       **/
      agents: AugmentedQuery<ApiType, (arg: AccountId32 | string | Uint8Array) => Observable<Option<PalletTorus0Agent>>, [AccountId32]> & QueryableStorageEntry<ApiType, [AccountId32]>;
      /**
       * Cooldown (in blocks) in which an agent needs to wait between each `update_agent` call.
       **/
      agentUpdateCooldown: AugmentedQuery<ApiType, () => Observable<u64>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Amount of tokens to burn from a payer key when registering new agents.
       **/
      burn: AugmentedQuery<ApiType, () => Observable<u128>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * [`Burn`] configuration values.
       **/
      burnConfig: AugmentedQuery<ApiType, () => Observable<PalletTorus0BurnBurnConfiguration>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * The weight dividends have when finding agents to prune. 100% meaning it
       * is taking fully into account.
       **/
      dividendsParticipationWeight: AugmentedQuery<ApiType, () => Observable<Percent>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Constraints defining validation of agent fees.
       **/
      feeConstraints: AugmentedQuery<ApiType, () => Observable<PalletTorus0FeeValidatorFeeConstraints>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Maximum number of characters allowed in an agent URL.
       **/
      maxAgentUrlLength: AugmentedQuery<ApiType, () => Observable<u16>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Max allowed of validators. This is used then calculating emissions, only
       * the top staked agents up to this value will have their weights
       * considered.
       **/
      maxAllowedValidators: AugmentedQuery<ApiType, () => Observable<u16>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Maximum number of characters allowed in an agent name.
       **/
      maxNameLength: AugmentedQuery<ApiType, () => Observable<u16>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Maximum amount of agent registrations per block, tracked by
       * [`RegistrationsThisBlock`].
       **/
      maxRegistrationsPerBlock: AugmentedQuery<ApiType, () => Observable<u16>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Minimum amount of stake in tokens a key has to deposit in an agent.
       **/
      minAllowedStake: AugmentedQuery<ApiType, () => Observable<u128>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Minimum number of characters required in an agent name.
       **/
      minNameLength: AugmentedQuery<ApiType, () => Observable<u16>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Minimum required stake for an agent to be considered a validator.
       **/
      minValidatorStake: AugmentedQuery<ApiType, () => Observable<u128>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Count of namespaces registered per account
       **/
      namespaceCount: AugmentedQuery<ApiType, (arg: PalletTorus0NamespaceNamespaceOwnership | { System: any } | { Account: any } | string | Uint8Array) => Observable<u32>, [PalletTorus0NamespaceNamespaceOwnership]> & QueryableStorageEntry<ApiType, [PalletTorus0NamespaceNamespaceOwnership]>;
      namespacePricingConfig: AugmentedQuery<ApiType, () => Observable<PalletTorus0NamespaceNamespacePricingConfig>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Namespace registry - maps (owner, path) to metadata
       **/
      namespaces: AugmentedQuery<ApiType, (arg1: PalletTorus0NamespaceNamespaceOwnership | { System: any } | { Account: any } | string | Uint8Array, arg2: Bytes | string | Uint8Array) => Observable<Option<PalletTorus0NamespaceNamespaceMetadata>>, [PalletTorus0NamespaceNamespaceOwnership, Bytes]> & QueryableStorageEntry<ApiType, [PalletTorus0NamespaceNamespaceOwnership, Bytes]>;
      /**
       * Number of agent registrations that happened this block.
       **/
      registrationsThisBlock: AugmentedQuery<ApiType, () => Observable<u16>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Number of agent registrations that happened in the last
       * [`BurnConfiguration::target_registrations_interval`] blocks.
       **/
      registrationsThisInterval: AugmentedQuery<ApiType, () => Observable<u16>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Number of blocks between emissions.
       **/
      rewardInterval: AugmentedQuery<ApiType, () => Observable<u16>, []> & QueryableStorageEntry<ApiType, []>;
      stakedBy: AugmentedQuery<ApiType, (arg1: AccountId32 | string | Uint8Array, arg2: AccountId32 | string | Uint8Array) => Observable<Option<u128>>, [AccountId32, AccountId32]> & QueryableStorageEntry<ApiType, [AccountId32, AccountId32]>;
      stakingTo: AugmentedQuery<ApiType, (arg1: AccountId32 | string | Uint8Array, arg2: AccountId32 | string | Uint8Array) => Observable<Option<u128>>, [AccountId32, AccountId32]> & QueryableStorageEntry<ApiType, [AccountId32, AccountId32]>;
      /**
       * The total amount of stake in the network.
       **/
      totalStake: AugmentedQuery<ApiType, () => Observable<u128>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Generic query
       **/
      [key: string]: QueryableStorageEntry<ApiType>;
    };
    transactionPayment: {
      nextFeeMultiplier: AugmentedQuery<ApiType, () => Observable<u128>, []> & QueryableStorageEntry<ApiType, []>;
      storageVersion: AugmentedQuery<ApiType, () => Observable<PalletTransactionPaymentReleases>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Generic query
       **/
      [key: string]: QueryableStorageEntry<ApiType>;
    };
  } // AugmentedQueries
} // declare module
