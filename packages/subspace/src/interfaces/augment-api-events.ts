// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

// import type lookup before we augment - in some environments
// this is required to allow for ambient/previous definitions
import '@polkadot/api-base/types/events';

import type { ApiTypes, AugmentedEvent } from '@polkadot/api-base/types';
import type { Bytes, Null, Option, Result, U8aFixed, Vec, bool, u16, u32, u64 } from '@polkadot/types-codec';
import type { ITuple } from '@polkadot/types-codec/types';
import type { AccountId32, H256 } from '@polkadot/types/interfaces/runtime';
import type { FrameSupportDispatchDispatchInfo, FrameSupportTokensMiscBalanceStatus, PalletMultisigTimepoint, PalletSubspaceParamsGlobalGlobalParams, SpConsensusGrandpaAppPublic, SpRuntimeDispatchError } from '@polkadot/types/lookup';

export type __AugmentedEvent<ApiType extends ApiTypes> = AugmentedEvent<ApiType>;

declare module '@polkadot/api-base/types/events' {
  interface AugmentedEvents<ApiType extends ApiTypes> {
    balances: {
      /**
       * A balance was set by root.
       **/
      BalanceSet: AugmentedEvent<ApiType, [who: AccountId32, free: u64], { who: AccountId32, free: u64 }>;
      /**
       * Some amount was burned from an account.
       **/
      Burned: AugmentedEvent<ApiType, [who: AccountId32, amount: u64], { who: AccountId32, amount: u64 }>;
      /**
       * Some amount was deposited (e.g. for transaction fees).
       **/
      Deposit: AugmentedEvent<ApiType, [who: AccountId32, amount: u64], { who: AccountId32, amount: u64 }>;
      /**
       * An account was removed whose balance was non-zero but below ExistentialDeposit,
       * resulting in an outright loss.
       **/
      DustLost: AugmentedEvent<ApiType, [account: AccountId32, amount: u64], { account: AccountId32, amount: u64 }>;
      /**
       * An account was created with some free balance.
       **/
      Endowed: AugmentedEvent<ApiType, [account: AccountId32, freeBalance: u64], { account: AccountId32, freeBalance: u64 }>;
      /**
       * Some balance was frozen.
       **/
      Frozen: AugmentedEvent<ApiType, [who: AccountId32, amount: u64], { who: AccountId32, amount: u64 }>;
      /**
       * Total issuance was increased by `amount`, creating a credit to be balanced.
       **/
      Issued: AugmentedEvent<ApiType, [amount: u64], { amount: u64 }>;
      /**
       * Some balance was locked.
       **/
      Locked: AugmentedEvent<ApiType, [who: AccountId32, amount: u64], { who: AccountId32, amount: u64 }>;
      /**
       * Some amount was minted into an account.
       **/
      Minted: AugmentedEvent<ApiType, [who: AccountId32, amount: u64], { who: AccountId32, amount: u64 }>;
      /**
       * Total issuance was decreased by `amount`, creating a debt to be balanced.
       **/
      Rescinded: AugmentedEvent<ApiType, [amount: u64], { amount: u64 }>;
      /**
       * Some balance was reserved (moved from free to reserved).
       **/
      Reserved: AugmentedEvent<ApiType, [who: AccountId32, amount: u64], { who: AccountId32, amount: u64 }>;
      /**
       * Some balance was moved from the reserve of the first account to the second account.
       * Final argument indicates the destination balance type.
       **/
      ReserveRepatriated: AugmentedEvent<ApiType, [from: AccountId32, to: AccountId32, amount: u64, destinationStatus: FrameSupportTokensMiscBalanceStatus], { from: AccountId32, to: AccountId32, amount: u64, destinationStatus: FrameSupportTokensMiscBalanceStatus }>;
      /**
       * Some amount was restored into an account.
       **/
      Restored: AugmentedEvent<ApiType, [who: AccountId32, amount: u64], { who: AccountId32, amount: u64 }>;
      /**
       * Some amount was removed from the account (e.g. for misbehavior).
       **/
      Slashed: AugmentedEvent<ApiType, [who: AccountId32, amount: u64], { who: AccountId32, amount: u64 }>;
      /**
       * Some amount was suspended from an account (it can be restored later).
       **/
      Suspended: AugmentedEvent<ApiType, [who: AccountId32, amount: u64], { who: AccountId32, amount: u64 }>;
      /**
       * Some balance was thawed.
       **/
      Thawed: AugmentedEvent<ApiType, [who: AccountId32, amount: u64], { who: AccountId32, amount: u64 }>;
      /**
       * The `TotalIssuance` was forcefully changed.
       **/
      TotalIssuanceForced: AugmentedEvent<ApiType, [old: u64, new_: u64], { old: u64, new_: u64 }>;
      /**
       * Transfer succeeded.
       **/
      Transfer: AugmentedEvent<ApiType, [from: AccountId32, to: AccountId32, amount: u64], { from: AccountId32, to: AccountId32, amount: u64 }>;
      /**
       * Some balance was unlocked.
       **/
      Unlocked: AugmentedEvent<ApiType, [who: AccountId32, amount: u64], { who: AccountId32, amount: u64 }>;
      /**
       * Some balance was unreserved (moved from reserved to free).
       **/
      Unreserved: AugmentedEvent<ApiType, [who: AccountId32, amount: u64], { who: AccountId32, amount: u64 }>;
      /**
       * An account was upgraded.
       **/
      Upgraded: AugmentedEvent<ApiType, [who: AccountId32], { who: AccountId32 }>;
      /**
       * Some amount was withdrawn from the account (e.g. for transaction fees).
       **/
      Withdraw: AugmentedEvent<ApiType, [who: AccountId32, amount: u64], { who: AccountId32, amount: u64 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    governanceModule: {
      /**
       * A new application has been created.
       **/
      ApplicationCreated: AugmentedEvent<ApiType, [u64]>;
      /**
       * A proposal has been accepted.
       **/
      ProposalAccepted: AugmentedEvent<ApiType, [u64]>;
      /**
       * A new proposal has been created.
       **/
      ProposalCreated: AugmentedEvent<ApiType, [u64]>;
      /**
       * A proposal has expired.
       **/
      ProposalExpired: AugmentedEvent<ApiType, [u64]>;
      /**
       * A proposal has been refused.
       **/
      ProposalRefused: AugmentedEvent<ApiType, [u64]>;
      /**
       * A vote has been cast on a proposal.
       **/
      ProposalVoted: AugmentedEvent<ApiType, [u64, AccountId32, bool]>;
      /**
       * A vote has been unregistered from a proposal.
       **/
      ProposalVoteUnregistered: AugmentedEvent<ApiType, [u64, AccountId32]>;
      /**
       * A module account has been added to the whitelist.
       **/
      WhitelistModuleAdded: AugmentedEvent<ApiType, [AccountId32]>;
      /**
       * A module account has been removed from the whitelist.
       **/
      WhitelistModuleRemoved: AugmentedEvent<ApiType, [AccountId32]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    grandpa: {
      /**
       * New authority set has been applied.
       **/
      NewAuthorities: AugmentedEvent<ApiType, [authoritySet: Vec<ITuple<[SpConsensusGrandpaAppPublic, u64]>>], { authoritySet: Vec<ITuple<[SpConsensusGrandpaAppPublic, u64]>> }>;
      /**
       * Current authority set has been paused.
       **/
      Paused: AugmentedEvent<ApiType, []>;
      /**
       * Current authority set has been resumed.
       **/
      Resumed: AugmentedEvent<ApiType, []>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    multisig: {
      /**
       * A multisig operation has been approved by someone.
       **/
      MultisigApproval: AugmentedEvent<ApiType, [approving: AccountId32, timepoint: PalletMultisigTimepoint, multisig: AccountId32, callHash: U8aFixed], { approving: AccountId32, timepoint: PalletMultisigTimepoint, multisig: AccountId32, callHash: U8aFixed }>;
      /**
       * A multisig operation has been cancelled.
       **/
      MultisigCancelled: AugmentedEvent<ApiType, [cancelling: AccountId32, timepoint: PalletMultisigTimepoint, multisig: AccountId32, callHash: U8aFixed], { cancelling: AccountId32, timepoint: PalletMultisigTimepoint, multisig: AccountId32, callHash: U8aFixed }>;
      /**
       * A multisig operation has been executed.
       **/
      MultisigExecuted: AugmentedEvent<ApiType, [approving: AccountId32, timepoint: PalletMultisigTimepoint, multisig: AccountId32, callHash: U8aFixed, result: Result<Null, SpRuntimeDispatchError>], { approving: AccountId32, timepoint: PalletMultisigTimepoint, multisig: AccountId32, callHash: U8aFixed, result: Result<Null, SpRuntimeDispatchError> }>;
      /**
       * A new multisig operation has begun.
       **/
      NewMultisig: AugmentedEvent<ApiType, [approving: AccountId32, multisig: AccountId32, callHash: U8aFixed], { approving: AccountId32, multisig: AccountId32, callHash: U8aFixed }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    offworker: {
      /**
       * New authorities were successfully added
       **/
      AuthoritiesAdded: AugmentedEvent<ApiType, []>;
      /**
       * Offchain worker sent decrypted weights
       **/
      DecryptedWeightsSent: AugmentedEvent<ApiType, [subnetId: u16, blockNumber: u64, worker: AccountId32], { subnetId: u16, blockNumber: u64, worker: AccountId32 }>;
      /**
       * Decryption node successfully sent decrypted weights back to the runtime on time
       **/
      DecryptionNodeCallbackSuccess: AugmentedEvent<ApiType, [subnetId: u16, nodeId: AccountId32], { subnetId: u16, nodeId: AccountId32 }>;
      /**
       * Offchain worker sent keep_alive message
       **/
      KeepAliveSent: AugmentedEvent<ApiType, [blockNumber: u64, worker: AccountId32], { blockNumber: u64, worker: AccountId32 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    subnetEmissionModule: {
      /**
       * Decryption node was banned, as it failed to send decrypted weights back to the runtime
       **/
      DecryptionNodeBanned: AugmentedEvent<ApiType, [subnetId: u16, nodeId: AccountId32], { subnetId: u16, nodeId: AccountId32 }>;
      /**
       * Decryption node was called by the runtime to send decrypted weights back, if node fails
       * to do so on time, it will get banned
       **/
      DecryptionNodeCallbackScheduled: AugmentedEvent<ApiType, [subnetId: u16, nodeId: AccountId32, banBlock: u64], { subnetId: u16, nodeId: AccountId32, banBlock: u64 }>;
      /**
       * Weight copying decryption was canceled
       **/
      DecryptionNodeCanceled: AugmentedEvent<ApiType, [subnetId: u16, nodeId: AccountId32], { subnetId: u16, nodeId: AccountId32 }>;
      /**
       * Weight copying decryption node was rotated
       **/
      DecryptionNodeRotated: AugmentedEvent<ApiType, [subnetId: u16, previousNodeId: AccountId32, newNodeId: AccountId32], { subnetId: u16, previousNodeId: AccountId32, newNodeId: AccountId32 }>;
      /**
       * Subnets tempo has finished or Snapshot has been taken
       **/
      EpochFinalized: AugmentedEvent<ApiType, [u16]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    subspaceModule: {
      /**
       * Event created when user bridged tokens
       **/
      Bridged: AugmentedEvent<ApiType, [AccountId32, u64]>;
      /**
       * Event created when assets were returned from the bridge
       **/
      BridgeWithdrawn: AugmentedEvent<ApiType, [AccountId32, u64]>;
      /**
       * Event created when global parameters are updated
       **/
      GlobalParamsUpdated: AugmentedEvent<ApiType, [PalletSubspaceParamsGlobalGlobalParams]>;
      /**
       * Event created when a module account has been deregistered from the chain
       **/
      ModuleDeregistered: AugmentedEvent<ApiType, [u16, u16, AccountId32]>;
      /**
       * Event created when a new module account has been registered to the chain
       **/
      ModuleRegistered: AugmentedEvent<ApiType, [u16, u16, AccountId32]>;
      /**
       * Event created when the module's updated information is added to the network
       **/
      ModuleUpdated: AugmentedEvent<ApiType, [u16, AccountId32]>;
      /**
       * Event created when a new network is added
       **/
      NetworkAdded: AugmentedEvent<ApiType, [u16, Bytes]>;
      /**
       * Event created when a network is removed
       **/
      NetworkRemoved: AugmentedEvent<ApiType, [u16]>;
      /**
       * Event created when stake has been transferred from the coldkey account onto the key
       * staking account
       **/
      StakeAdded: AugmentedEvent<ApiType, [AccountId32, AccountId32, u64]>;
      /**
       * Event created when stake has been removed from the key staking account onto the coldkey
       * account
       **/
      StakeRemoved: AugmentedEvent<ApiType, [AccountId32, AccountId32, u64]>;
      /**
       * Event created when subnet parameters are updated
       **/
      SubnetParamsUpdated: AugmentedEvent<ApiType, [u16]>;
      /**
       * Event created when a caller successfully sets their weights on a subnetwork
       **/
      WeightsSet: AugmentedEvent<ApiType, [u16, u16]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    sudo: {
      /**
       * The sudo key has been updated.
       **/
      KeyChanged: AugmentedEvent<ApiType, [old: Option<AccountId32>, new_: AccountId32], { old: Option<AccountId32>, new_: AccountId32 }>;
      /**
       * The key was permanently removed.
       **/
      KeyRemoved: AugmentedEvent<ApiType, []>;
      /**
       * A sudo call just took place.
       **/
      Sudid: AugmentedEvent<ApiType, [sudoResult: Result<Null, SpRuntimeDispatchError>], { sudoResult: Result<Null, SpRuntimeDispatchError> }>;
      /**
       * A [sudo_as](Pallet::sudo_as) call just took place.
       **/
      SudoAsDone: AugmentedEvent<ApiType, [sudoResult: Result<Null, SpRuntimeDispatchError>], { sudoResult: Result<Null, SpRuntimeDispatchError> }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    system: {
      /**
       * `:code` was updated.
       **/
      CodeUpdated: AugmentedEvent<ApiType, []>;
      /**
       * An extrinsic failed.
       **/
      ExtrinsicFailed: AugmentedEvent<ApiType, [dispatchError: SpRuntimeDispatchError, dispatchInfo: FrameSupportDispatchDispatchInfo], { dispatchError: SpRuntimeDispatchError, dispatchInfo: FrameSupportDispatchDispatchInfo }>;
      /**
       * An extrinsic completed successfully.
       **/
      ExtrinsicSuccess: AugmentedEvent<ApiType, [dispatchInfo: FrameSupportDispatchDispatchInfo], { dispatchInfo: FrameSupportDispatchDispatchInfo }>;
      /**
       * An account was reaped.
       **/
      KilledAccount: AugmentedEvent<ApiType, [account: AccountId32], { account: AccountId32 }>;
      /**
       * A new account was created.
       **/
      NewAccount: AugmentedEvent<ApiType, [account: AccountId32], { account: AccountId32 }>;
      /**
       * On on-chain remark happened.
       **/
      Remarked: AugmentedEvent<ApiType, [sender: AccountId32, hash_: H256], { sender: AccountId32, hash_: H256 }>;
      /**
       * An upgrade was authorized.
       **/
      UpgradeAuthorized: AugmentedEvent<ApiType, [codeHash: H256, checkVersion: bool], { codeHash: H256, checkVersion: bool }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    transactionPayment: {
      /**
       * A transaction fee `actual_fee`, of which `tip` was added to the minimum inclusion fee,
       * has been paid by `who`.
       **/
      TransactionFeePaid: AugmentedEvent<ApiType, [who: AccountId32, actualFee: u64, tip: u64], { who: AccountId32, actualFee: u64, tip: u64 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    utility: {
      /**
       * Batch of dispatches completed fully with no error.
       **/
      BatchCompleted: AugmentedEvent<ApiType, []>;
      /**
       * Batch of dispatches completed but has errors.
       **/
      BatchCompletedWithErrors: AugmentedEvent<ApiType, []>;
      /**
       * Batch of dispatches did not complete fully. Index of first failing dispatch given, as
       * well as the error.
       **/
      BatchInterrupted: AugmentedEvent<ApiType, [index: u32, error: SpRuntimeDispatchError], { index: u32, error: SpRuntimeDispatchError }>;
      /**
       * A call was dispatched.
       **/
      DispatchedAs: AugmentedEvent<ApiType, [result: Result<Null, SpRuntimeDispatchError>], { result: Result<Null, SpRuntimeDispatchError> }>;
      /**
       * A single item within a Batch of dispatches has completed with no error.
       **/
      ItemCompleted: AugmentedEvent<ApiType, []>;
      /**
       * A single item within a Batch of dispatches has completed with error.
       **/
      ItemFailed: AugmentedEvent<ApiType, [error: SpRuntimeDispatchError], { error: SpRuntimeDispatchError }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
  } // AugmentedEvents
} // declare module
