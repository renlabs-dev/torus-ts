// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

// import type lookup before we augment - in some environments
// this is required to allow for ambient/previous definitions
import '@polkadot/types/lookup';

import type { BTreeMap, BTreeSet, Bytes, Compact, Enum, Null, Option, Result, Struct, Text, U256, U8aFixed, Vec, bool, u128, u16, u32, u64, u8 } from '@polkadot/types-codec';
import type { ITuple } from '@polkadot/types-codec/types';
import type { AccountId32, Call, H160, H256, MultiAddress, Percent } from '@polkadot/types/interfaces/runtime';
import type { Event } from '@polkadot/types/interfaces/system';

declare module '@polkadot/types/lookup' {
  /** @name FrameSystemAccountInfo (3) */
  interface FrameSystemAccountInfo extends Struct {
    readonly nonce: u32;
    readonly consumers: u32;
    readonly providers: u32;
    readonly sufficients: u32;
    readonly data: PalletBalancesAccountData;
  }

  /** @name PalletBalancesAccountData (5) */
  interface PalletBalancesAccountData extends Struct {
    readonly free: u128;
    readonly reserved: u128;
    readonly frozen: u128;
    readonly flags: u128;
  }

  /** @name FrameSupportDispatchPerDispatchClassWeight (9) */
  interface FrameSupportDispatchPerDispatchClassWeight extends Struct {
    readonly normal: SpWeightsWeightV2Weight;
    readonly operational: SpWeightsWeightV2Weight;
    readonly mandatory: SpWeightsWeightV2Weight;
  }

  /** @name SpWeightsWeightV2Weight (10) */
  interface SpWeightsWeightV2Weight extends Struct {
    readonly refTime: Compact<u64>;
    readonly proofSize: Compact<u64>;
  }

  /** @name SpRuntimeDigest (15) */
  interface SpRuntimeDigest extends Struct {
    readonly logs: Vec<SpRuntimeDigestDigestItem>;
  }

  /** @name SpRuntimeDigestDigestItem (17) */
  interface SpRuntimeDigestDigestItem extends Enum {
    readonly isOther: boolean;
    readonly asOther: Bytes;
    readonly isConsensus: boolean;
    readonly asConsensus: ITuple<[U8aFixed, Bytes]>;
    readonly isSeal: boolean;
    readonly asSeal: ITuple<[U8aFixed, Bytes]>;
    readonly isPreRuntime: boolean;
    readonly asPreRuntime: ITuple<[U8aFixed, Bytes]>;
    readonly isRuntimeEnvironmentUpdated: boolean;
    readonly type: 'Other' | 'Consensus' | 'Seal' | 'PreRuntime' | 'RuntimeEnvironmentUpdated';
  }

  /** @name FrameSystemEventRecord (20) */
  interface FrameSystemEventRecord extends Struct {
    readonly phase: FrameSystemPhase;
    readonly event: Event;
    readonly topics: Vec<H256>;
  }

  /** @name FrameSystemEvent (22) */
  interface FrameSystemEvent extends Enum {
    readonly isExtrinsicSuccess: boolean;
    readonly asExtrinsicSuccess: {
      readonly dispatchInfo: FrameSupportDispatchDispatchInfo;
    } & Struct;
    readonly isExtrinsicFailed: boolean;
    readonly asExtrinsicFailed: {
      readonly dispatchError: SpRuntimeDispatchError;
      readonly dispatchInfo: FrameSupportDispatchDispatchInfo;
    } & Struct;
    readonly isCodeUpdated: boolean;
    readonly isNewAccount: boolean;
    readonly asNewAccount: {
      readonly account: AccountId32;
    } & Struct;
    readonly isKilledAccount: boolean;
    readonly asKilledAccount: {
      readonly account: AccountId32;
    } & Struct;
    readonly isRemarked: boolean;
    readonly asRemarked: {
      readonly sender: AccountId32;
      readonly hash_: H256;
    } & Struct;
    readonly isTaskStarted: boolean;
    readonly asTaskStarted: {
      readonly task: TorusRuntimeRuntimeTask;
    } & Struct;
    readonly isTaskCompleted: boolean;
    readonly asTaskCompleted: {
      readonly task: TorusRuntimeRuntimeTask;
    } & Struct;
    readonly isTaskFailed: boolean;
    readonly asTaskFailed: {
      readonly task: TorusRuntimeRuntimeTask;
      readonly err: SpRuntimeDispatchError;
    } & Struct;
    readonly isUpgradeAuthorized: boolean;
    readonly asUpgradeAuthorized: {
      readonly codeHash: H256;
      readonly checkVersion: bool;
    } & Struct;
    readonly type: 'ExtrinsicSuccess' | 'ExtrinsicFailed' | 'CodeUpdated' | 'NewAccount' | 'KilledAccount' | 'Remarked' | 'TaskStarted' | 'TaskCompleted' | 'TaskFailed' | 'UpgradeAuthorized';
  }

  /** @name FrameSupportDispatchDispatchInfo (23) */
  interface FrameSupportDispatchDispatchInfo extends Struct {
    readonly weight: SpWeightsWeightV2Weight;
    readonly class: FrameSupportDispatchDispatchClass;
    readonly paysFee: FrameSupportDispatchPays;
  }

  /** @name FrameSupportDispatchDispatchClass (24) */
  interface FrameSupportDispatchDispatchClass extends Enum {
    readonly isNormal: boolean;
    readonly isOperational: boolean;
    readonly isMandatory: boolean;
    readonly type: 'Normal' | 'Operational' | 'Mandatory';
  }

  /** @name FrameSupportDispatchPays (25) */
  interface FrameSupportDispatchPays extends Enum {
    readonly isYes: boolean;
    readonly isNo: boolean;
    readonly type: 'Yes' | 'No';
  }

  /** @name SpRuntimeDispatchError (26) */
  interface SpRuntimeDispatchError extends Enum {
    readonly isOther: boolean;
    readonly isCannotLookup: boolean;
    readonly isBadOrigin: boolean;
    readonly isModule: boolean;
    readonly asModule: SpRuntimeModuleError;
    readonly isConsumerRemaining: boolean;
    readonly isNoProviders: boolean;
    readonly isTooManyConsumers: boolean;
    readonly isToken: boolean;
    readonly asToken: SpRuntimeTokenError;
    readonly isArithmetic: boolean;
    readonly asArithmetic: SpArithmeticArithmeticError;
    readonly isTransactional: boolean;
    readonly asTransactional: SpRuntimeTransactionalError;
    readonly isExhausted: boolean;
    readonly isCorruption: boolean;
    readonly isUnavailable: boolean;
    readonly isRootNotAllowed: boolean;
    readonly type: 'Other' | 'CannotLookup' | 'BadOrigin' | 'Module' | 'ConsumerRemaining' | 'NoProviders' | 'TooManyConsumers' | 'Token' | 'Arithmetic' | 'Transactional' | 'Exhausted' | 'Corruption' | 'Unavailable' | 'RootNotAllowed';
  }

  /** @name SpRuntimeModuleError (27) */
  interface SpRuntimeModuleError extends Struct {
    readonly index: u8;
    readonly error: U8aFixed;
  }

  /** @name SpRuntimeTokenError (28) */
  interface SpRuntimeTokenError extends Enum {
    readonly isFundsUnavailable: boolean;
    readonly isOnlyProvider: boolean;
    readonly isBelowMinimum: boolean;
    readonly isCannotCreate: boolean;
    readonly isUnknownAsset: boolean;
    readonly isFrozen: boolean;
    readonly isUnsupported: boolean;
    readonly isCannotCreateHold: boolean;
    readonly isNotExpendable: boolean;
    readonly isBlocked: boolean;
    readonly type: 'FundsUnavailable' | 'OnlyProvider' | 'BelowMinimum' | 'CannotCreate' | 'UnknownAsset' | 'Frozen' | 'Unsupported' | 'CannotCreateHold' | 'NotExpendable' | 'Blocked';
  }

  /** @name SpArithmeticArithmeticError (29) */
  interface SpArithmeticArithmeticError extends Enum {
    readonly isUnderflow: boolean;
    readonly isOverflow: boolean;
    readonly isDivisionByZero: boolean;
    readonly type: 'Underflow' | 'Overflow' | 'DivisionByZero';
  }

  /** @name SpRuntimeTransactionalError (30) */
  interface SpRuntimeTransactionalError extends Enum {
    readonly isLimitReached: boolean;
    readonly isNoLayer: boolean;
    readonly type: 'LimitReached' | 'NoLayer';
  }

  /** @name TorusRuntimeRuntimeTask (31) */
  type TorusRuntimeRuntimeTask = Null;

  /** @name PalletGrandpaEvent (32) */
  interface PalletGrandpaEvent extends Enum {
    readonly isNewAuthorities: boolean;
    readonly asNewAuthorities: {
      readonly authoritySet: Vec<ITuple<[SpConsensusGrandpaAppPublic, u64]>>;
    } & Struct;
    readonly isPaused: boolean;
    readonly isResumed: boolean;
    readonly type: 'NewAuthorities' | 'Paused' | 'Resumed';
  }

  /** @name SpConsensusGrandpaAppPublic (35) */
  interface SpConsensusGrandpaAppPublic extends U8aFixed {}

  /** @name PalletBalancesEvent (36) */
  interface PalletBalancesEvent extends Enum {
    readonly isEndowed: boolean;
    readonly asEndowed: {
      readonly account: AccountId32;
      readonly freeBalance: u128;
    } & Struct;
    readonly isDustLost: boolean;
    readonly asDustLost: {
      readonly account: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isTransfer: boolean;
    readonly asTransfer: {
      readonly from: AccountId32;
      readonly to: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isBalanceSet: boolean;
    readonly asBalanceSet: {
      readonly who: AccountId32;
      readonly free: u128;
    } & Struct;
    readonly isReserved: boolean;
    readonly asReserved: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isUnreserved: boolean;
    readonly asUnreserved: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isReserveRepatriated: boolean;
    readonly asReserveRepatriated: {
      readonly from: AccountId32;
      readonly to: AccountId32;
      readonly amount: u128;
      readonly destinationStatus: FrameSupportTokensMiscBalanceStatus;
    } & Struct;
    readonly isDeposit: boolean;
    readonly asDeposit: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isWithdraw: boolean;
    readonly asWithdraw: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isSlashed: boolean;
    readonly asSlashed: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isMinted: boolean;
    readonly asMinted: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isBurned: boolean;
    readonly asBurned: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isSuspended: boolean;
    readonly asSuspended: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isRestored: boolean;
    readonly asRestored: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isUpgraded: boolean;
    readonly asUpgraded: {
      readonly who: AccountId32;
    } & Struct;
    readonly isIssued: boolean;
    readonly asIssued: {
      readonly amount: u128;
    } & Struct;
    readonly isRescinded: boolean;
    readonly asRescinded: {
      readonly amount: u128;
    } & Struct;
    readonly isLocked: boolean;
    readonly asLocked: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isUnlocked: boolean;
    readonly asUnlocked: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isFrozen: boolean;
    readonly asFrozen: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isThawed: boolean;
    readonly asThawed: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isTotalIssuanceForced: boolean;
    readonly asTotalIssuanceForced: {
      readonly old: u128;
      readonly new_: u128;
    } & Struct;
    readonly type: 'Endowed' | 'DustLost' | 'Transfer' | 'BalanceSet' | 'Reserved' | 'Unreserved' | 'ReserveRepatriated' | 'Deposit' | 'Withdraw' | 'Slashed' | 'Minted' | 'Burned' | 'Suspended' | 'Restored' | 'Upgraded' | 'Issued' | 'Rescinded' | 'Locked' | 'Unlocked' | 'Frozen' | 'Thawed' | 'TotalIssuanceForced';
  }

  /** @name FrameSupportTokensMiscBalanceStatus (37) */
  interface FrameSupportTokensMiscBalanceStatus extends Enum {
    readonly isFree: boolean;
    readonly isReserved: boolean;
    readonly type: 'Free' | 'Reserved';
  }

  /** @name PalletTransactionPaymentEvent (38) */
  interface PalletTransactionPaymentEvent extends Enum {
    readonly isTransactionFeePaid: boolean;
    readonly asTransactionFeePaid: {
      readonly who: AccountId32;
      readonly actualFee: u128;
      readonly tip: u128;
    } & Struct;
    readonly type: 'TransactionFeePaid';
  }

  /** @name PalletSudoEvent (39) */
  interface PalletSudoEvent extends Enum {
    readonly isSudid: boolean;
    readonly asSudid: {
      readonly sudoResult: Result<Null, SpRuntimeDispatchError>;
    } & Struct;
    readonly isKeyChanged: boolean;
    readonly asKeyChanged: {
      readonly old: Option<AccountId32>;
      readonly new_: AccountId32;
    } & Struct;
    readonly isKeyRemoved: boolean;
    readonly isSudoAsDone: boolean;
    readonly asSudoAsDone: {
      readonly sudoResult: Result<Null, SpRuntimeDispatchError>;
    } & Struct;
    readonly type: 'Sudid' | 'KeyChanged' | 'KeyRemoved' | 'SudoAsDone';
  }

  /** @name PalletMultisigEvent (43) */
  interface PalletMultisigEvent extends Enum {
    readonly isNewMultisig: boolean;
    readonly asNewMultisig: {
      readonly approving: AccountId32;
      readonly multisig: AccountId32;
      readonly callHash: U8aFixed;
    } & Struct;
    readonly isMultisigApproval: boolean;
    readonly asMultisigApproval: {
      readonly approving: AccountId32;
      readonly timepoint: PalletMultisigTimepoint;
      readonly multisig: AccountId32;
      readonly callHash: U8aFixed;
    } & Struct;
    readonly isMultisigExecuted: boolean;
    readonly asMultisigExecuted: {
      readonly approving: AccountId32;
      readonly timepoint: PalletMultisigTimepoint;
      readonly multisig: AccountId32;
      readonly callHash: U8aFixed;
      readonly result: Result<Null, SpRuntimeDispatchError>;
    } & Struct;
    readonly isMultisigCancelled: boolean;
    readonly asMultisigCancelled: {
      readonly cancelling: AccountId32;
      readonly timepoint: PalletMultisigTimepoint;
      readonly multisig: AccountId32;
      readonly callHash: U8aFixed;
    } & Struct;
    readonly type: 'NewMultisig' | 'MultisigApproval' | 'MultisigExecuted' | 'MultisigCancelled';
  }

  /** @name PalletMultisigTimepoint (44) */
  interface PalletMultisigTimepoint extends Struct {
    readonly height: u64;
    readonly index: u32;
  }

  /** @name PalletEthereumEvent (45) */
  interface PalletEthereumEvent extends Enum {
    readonly isExecuted: boolean;
    readonly asExecuted: {
      readonly from: H160;
      readonly to: H160;
      readonly transactionHash: H256;
      readonly exitReason: EvmCoreErrorExitReason;
      readonly extraData: Bytes;
    } & Struct;
    readonly type: 'Executed';
  }

  /** @name EvmCoreErrorExitReason (48) */
  interface EvmCoreErrorExitReason extends Enum {
    readonly isSucceed: boolean;
    readonly asSucceed: EvmCoreErrorExitSucceed;
    readonly isError: boolean;
    readonly asError: EvmCoreErrorExitError;
    readonly isRevert: boolean;
    readonly asRevert: EvmCoreErrorExitRevert;
    readonly isFatal: boolean;
    readonly asFatal: EvmCoreErrorExitFatal;
    readonly type: 'Succeed' | 'Error' | 'Revert' | 'Fatal';
  }

  /** @name EvmCoreErrorExitSucceed (49) */
  interface EvmCoreErrorExitSucceed extends Enum {
    readonly isStopped: boolean;
    readonly isReturned: boolean;
    readonly isSuicided: boolean;
    readonly type: 'Stopped' | 'Returned' | 'Suicided';
  }

  /** @name EvmCoreErrorExitError (50) */
  interface EvmCoreErrorExitError extends Enum {
    readonly isStackUnderflow: boolean;
    readonly isStackOverflow: boolean;
    readonly isInvalidJump: boolean;
    readonly isInvalidRange: boolean;
    readonly isDesignatedInvalid: boolean;
    readonly isCallTooDeep: boolean;
    readonly isCreateCollision: boolean;
    readonly isCreateContractLimit: boolean;
    readonly isOutOfOffset: boolean;
    readonly isOutOfGas: boolean;
    readonly isOutOfFund: boolean;
    readonly isPcUnderflow: boolean;
    readonly isCreateEmpty: boolean;
    readonly isOther: boolean;
    readonly asOther: Text;
    readonly isMaxNonce: boolean;
    readonly isInvalidCode: boolean;
    readonly asInvalidCode: u8;
    readonly type: 'StackUnderflow' | 'StackOverflow' | 'InvalidJump' | 'InvalidRange' | 'DesignatedInvalid' | 'CallTooDeep' | 'CreateCollision' | 'CreateContractLimit' | 'OutOfOffset' | 'OutOfGas' | 'OutOfFund' | 'PcUnderflow' | 'CreateEmpty' | 'Other' | 'MaxNonce' | 'InvalidCode';
  }

  /** @name EvmCoreErrorExitRevert (54) */
  interface EvmCoreErrorExitRevert extends Enum {
    readonly isReverted: boolean;
    readonly type: 'Reverted';
  }

  /** @name EvmCoreErrorExitFatal (55) */
  interface EvmCoreErrorExitFatal extends Enum {
    readonly isNotSupported: boolean;
    readonly isUnhandledInterrupt: boolean;
    readonly isCallErrorAsFatal: boolean;
    readonly asCallErrorAsFatal: EvmCoreErrorExitError;
    readonly isOther: boolean;
    readonly asOther: Text;
    readonly type: 'NotSupported' | 'UnhandledInterrupt' | 'CallErrorAsFatal' | 'Other';
  }

  /** @name PalletEvmEvent (56) */
  interface PalletEvmEvent extends Enum {
    readonly isLog: boolean;
    readonly asLog: {
      readonly log: EthereumLog;
    } & Struct;
    readonly isCreated: boolean;
    readonly asCreated: {
      readonly address: H160;
    } & Struct;
    readonly isCreatedFailed: boolean;
    readonly asCreatedFailed: {
      readonly address: H160;
    } & Struct;
    readonly isExecuted: boolean;
    readonly asExecuted: {
      readonly address: H160;
    } & Struct;
    readonly isExecutedFailed: boolean;
    readonly asExecutedFailed: {
      readonly address: H160;
    } & Struct;
    readonly type: 'Log' | 'Created' | 'CreatedFailed' | 'Executed' | 'ExecutedFailed';
  }

  /** @name EthereumLog (57) */
  interface EthereumLog extends Struct {
    readonly address: H160;
    readonly topics: Vec<H256>;
    readonly data: Bytes;
  }

  /** @name PalletGovernanceEvent (59) */
  interface PalletGovernanceEvent extends Enum {
    readonly isProposalCreated: boolean;
    readonly asProposalCreated: u64;
    readonly isProposalAccepted: boolean;
    readonly asProposalAccepted: u64;
    readonly isProposalRefused: boolean;
    readonly asProposalRefused: u64;
    readonly isProposalExpired: boolean;
    readonly asProposalExpired: u64;
    readonly isProposalVoted: boolean;
    readonly asProposalVoted: ITuple<[u64, AccountId32, bool]>;
    readonly isProposalVoteUnregistered: boolean;
    readonly asProposalVoteUnregistered: ITuple<[u64, AccountId32]>;
    readonly isWhitelistAdded: boolean;
    readonly asWhitelistAdded: AccountId32;
    readonly isWhitelistRemoved: boolean;
    readonly asWhitelistRemoved: AccountId32;
    readonly isApplicationCreated: boolean;
    readonly asApplicationCreated: u32;
    readonly isApplicationAccepted: boolean;
    readonly asApplicationAccepted: u32;
    readonly isApplicationDenied: boolean;
    readonly asApplicationDenied: u32;
    readonly isApplicationExpired: boolean;
    readonly asApplicationExpired: u32;
    readonly isPenaltyApplied: boolean;
    readonly asPenaltyApplied: {
      readonly curator: AccountId32;
      readonly agent: AccountId32;
      readonly penalty: Percent;
    } & Struct;
    readonly isAgentFreezingToggled: boolean;
    readonly asAgentFreezingToggled: {
      readonly curator: AccountId32;
      readonly newState: bool;
    } & Struct;
    readonly isNamespaceFreezingToggled: boolean;
    readonly asNamespaceFreezingToggled: {
      readonly curator: AccountId32;
      readonly newState: bool;
    } & Struct;
    readonly type: 'ProposalCreated' | 'ProposalAccepted' | 'ProposalRefused' | 'ProposalExpired' | 'ProposalVoted' | 'ProposalVoteUnregistered' | 'WhitelistAdded' | 'WhitelistRemoved' | 'ApplicationCreated' | 'ApplicationAccepted' | 'ApplicationDenied' | 'ApplicationExpired' | 'PenaltyApplied' | 'AgentFreezingToggled' | 'NamespaceFreezingToggled';
  }

  /** @name PalletTorus0Event (61) */
  interface PalletTorus0Event extends Enum {
    readonly isStakeAdded: boolean;
    readonly asStakeAdded: ITuple<[AccountId32, AccountId32, u128]>;
    readonly isStakeRemoved: boolean;
    readonly asStakeRemoved: ITuple<[AccountId32, AccountId32, u128]>;
    readonly isAgentRegistered: boolean;
    readonly asAgentRegistered: AccountId32;
    readonly isAgentUnregistered: boolean;
    readonly asAgentUnregistered: AccountId32;
    readonly isAgentUpdated: boolean;
    readonly asAgentUpdated: AccountId32;
    readonly isNamespaceCreated: boolean;
    readonly asNamespaceCreated: {
      readonly owner: PalletTorus0NamespaceNamespaceOwnership;
      readonly path: Bytes;
    } & Struct;
    readonly isNamespaceDeleted: boolean;
    readonly asNamespaceDeleted: {
      readonly owner: PalletTorus0NamespaceNamespaceOwnership;
      readonly path: Bytes;
    } & Struct;
    readonly type: 'StakeAdded' | 'StakeRemoved' | 'AgentRegistered' | 'AgentUnregistered' | 'AgentUpdated' | 'NamespaceCreated' | 'NamespaceDeleted';
  }

  /** @name PalletTorus0NamespaceNamespaceOwnership (62) */
  interface PalletTorus0NamespaceNamespaceOwnership extends Enum {
    readonly isSystem: boolean;
    readonly isAccount: boolean;
    readonly asAccount: AccountId32;
    readonly type: 'System' | 'Account';
  }

  /** @name PalletEmission0Event (65) */
  interface PalletEmission0Event extends Enum {
    readonly isWeightsSet: boolean;
    readonly asWeightsSet: AccountId32;
    readonly isDelegatedWeightControl: boolean;
    readonly asDelegatedWeightControl: ITuple<[AccountId32, AccountId32]>;
    readonly type: 'WeightsSet' | 'DelegatedWeightControl';
  }

  /** @name PalletPermission0Event (66) */
  interface PalletPermission0Event extends Enum {
    readonly isPermissionDelegated: boolean;
    readonly asPermissionDelegated: {
      readonly delegator: AccountId32;
      readonly recipient: AccountId32;
      readonly permissionId: H256;
    } & Struct;
    readonly isPermissionRevoked: boolean;
    readonly asPermissionRevoked: {
      readonly delegator: AccountId32;
      readonly recipient: AccountId32;
      readonly revokedBy: Option<AccountId32>;
      readonly permissionId: H256;
    } & Struct;
    readonly isPermissionExpired: boolean;
    readonly asPermissionExpired: {
      readonly delegator: AccountId32;
      readonly recipient: AccountId32;
      readonly permissionId: H256;
    } & Struct;
    readonly isPermissionAccumulationToggled: boolean;
    readonly asPermissionAccumulationToggled: {
      readonly permissionId: H256;
      readonly accumulating: bool;
      readonly toggledBy: Option<AccountId32>;
    } & Struct;
    readonly isPermissionEnforcementExecuted: boolean;
    readonly asPermissionEnforcementExecuted: {
      readonly permissionId: H256;
      readonly executedBy: Option<AccountId32>;
    } & Struct;
    readonly isEnforcementVoteCast: boolean;
    readonly asEnforcementVoteCast: {
      readonly permissionId: H256;
      readonly voter: AccountId32;
      readonly referendum: PalletPermission0PermissionEnforcementReferendum;
    } & Struct;
    readonly isEnforcementAuthoritySet: boolean;
    readonly asEnforcementAuthoritySet: {
      readonly permissionId: H256;
      readonly controllersCount: u32;
      readonly requiredVotes: u32;
    } & Struct;
    readonly isEmissionDistribution: boolean;
    readonly asEmissionDistribution: {
      readonly permissionId: H256;
      readonly streamId: Option<H256>;
      readonly target: AccountId32;
      readonly amount: u128;
      readonly reason: PalletPermission0PermissionEmissionDistributionReason;
    } & Struct;
    readonly isAccumulatedEmission: boolean;
    readonly asAccumulatedEmission: {
      readonly permissionId: H256;
      readonly streamId: H256;
      readonly amount: u128;
    } & Struct;
    readonly type: 'PermissionDelegated' | 'PermissionRevoked' | 'PermissionExpired' | 'PermissionAccumulationToggled' | 'PermissionEnforcementExecuted' | 'EnforcementVoteCast' | 'EnforcementAuthoritySet' | 'EmissionDistribution' | 'AccumulatedEmission';
  }

  /** @name PalletPermission0PermissionEnforcementReferendum (67) */
  interface PalletPermission0PermissionEnforcementReferendum extends Enum {
    readonly isEmissionAccumulation: boolean;
    readonly asEmissionAccumulation: bool;
    readonly isExecution: boolean;
    readonly type: 'EmissionAccumulation' | 'Execution';
  }

  /** @name PalletPermission0PermissionEmissionDistributionReason (69) */
  interface PalletPermission0PermissionEmissionDistributionReason extends Enum {
    readonly isAutomatic: boolean;
    readonly isManual: boolean;
    readonly type: 'Automatic' | 'Manual';
  }

  /** @name PalletFaucetEvent (70) */
  interface PalletFaucetEvent extends Enum {
    readonly isFaucet: boolean;
    readonly asFaucet: ITuple<[AccountId32, u128]>;
    readonly type: 'Faucet';
  }

  /** @name FrameSystemPhase (71) */
  interface FrameSystemPhase extends Enum {
    readonly isApplyExtrinsic: boolean;
    readonly asApplyExtrinsic: u32;
    readonly isFinalization: boolean;
    readonly isInitialization: boolean;
    readonly type: 'ApplyExtrinsic' | 'Finalization' | 'Initialization';
  }

  /** @name FrameSystemLastRuntimeUpgradeInfo (74) */
  interface FrameSystemLastRuntimeUpgradeInfo extends Struct {
    readonly specVersion: Compact<u32>;
    readonly specName: Text;
  }

  /** @name FrameSystemCodeUpgradeAuthorization (76) */
  interface FrameSystemCodeUpgradeAuthorization extends Struct {
    readonly codeHash: H256;
    readonly checkVersion: bool;
  }

  /** @name FrameSystemCall (77) */
  interface FrameSystemCall extends Enum {
    readonly isRemark: boolean;
    readonly asRemark: {
      readonly remark: Bytes;
    } & Struct;
    readonly isSetHeapPages: boolean;
    readonly asSetHeapPages: {
      readonly pages: u64;
    } & Struct;
    readonly isSetCode: boolean;
    readonly asSetCode: {
      readonly code: Bytes;
    } & Struct;
    readonly isSetCodeWithoutChecks: boolean;
    readonly asSetCodeWithoutChecks: {
      readonly code: Bytes;
    } & Struct;
    readonly isSetStorage: boolean;
    readonly asSetStorage: {
      readonly items: Vec<ITuple<[Bytes, Bytes]>>;
    } & Struct;
    readonly isKillStorage: boolean;
    readonly asKillStorage: {
      readonly keys_: Vec<Bytes>;
    } & Struct;
    readonly isKillPrefix: boolean;
    readonly asKillPrefix: {
      readonly prefix: Bytes;
      readonly subkeys: u32;
    } & Struct;
    readonly isRemarkWithEvent: boolean;
    readonly asRemarkWithEvent: {
      readonly remark: Bytes;
    } & Struct;
    readonly isDoTask: boolean;
    readonly asDoTask: {
      readonly task: TorusRuntimeRuntimeTask;
    } & Struct;
    readonly isAuthorizeUpgrade: boolean;
    readonly asAuthorizeUpgrade: {
      readonly codeHash: H256;
    } & Struct;
    readonly isAuthorizeUpgradeWithoutChecks: boolean;
    readonly asAuthorizeUpgradeWithoutChecks: {
      readonly codeHash: H256;
    } & Struct;
    readonly isApplyAuthorizedUpgrade: boolean;
    readonly asApplyAuthorizedUpgrade: {
      readonly code: Bytes;
    } & Struct;
    readonly type: 'Remark' | 'SetHeapPages' | 'SetCode' | 'SetCodeWithoutChecks' | 'SetStorage' | 'KillStorage' | 'KillPrefix' | 'RemarkWithEvent' | 'DoTask' | 'AuthorizeUpgrade' | 'AuthorizeUpgradeWithoutChecks' | 'ApplyAuthorizedUpgrade';
  }

  /** @name FrameSystemLimitsBlockWeights (81) */
  interface FrameSystemLimitsBlockWeights extends Struct {
    readonly baseBlock: SpWeightsWeightV2Weight;
    readonly maxBlock: SpWeightsWeightV2Weight;
    readonly perClass: FrameSupportDispatchPerDispatchClassWeightsPerClass;
  }

  /** @name FrameSupportDispatchPerDispatchClassWeightsPerClass (82) */
  interface FrameSupportDispatchPerDispatchClassWeightsPerClass extends Struct {
    readonly normal: FrameSystemLimitsWeightsPerClass;
    readonly operational: FrameSystemLimitsWeightsPerClass;
    readonly mandatory: FrameSystemLimitsWeightsPerClass;
  }

  /** @name FrameSystemLimitsWeightsPerClass (83) */
  interface FrameSystemLimitsWeightsPerClass extends Struct {
    readonly baseExtrinsic: SpWeightsWeightV2Weight;
    readonly maxExtrinsic: Option<SpWeightsWeightV2Weight>;
    readonly maxTotal: Option<SpWeightsWeightV2Weight>;
    readonly reserved: Option<SpWeightsWeightV2Weight>;
  }

  /** @name FrameSystemLimitsBlockLength (85) */
  interface FrameSystemLimitsBlockLength extends Struct {
    readonly max: FrameSupportDispatchPerDispatchClassU32;
  }

  /** @name FrameSupportDispatchPerDispatchClassU32 (86) */
  interface FrameSupportDispatchPerDispatchClassU32 extends Struct {
    readonly normal: u32;
    readonly operational: u32;
    readonly mandatory: u32;
  }

  /** @name SpWeightsRuntimeDbWeight (87) */
  interface SpWeightsRuntimeDbWeight extends Struct {
    readonly read: u64;
    readonly write: u64;
  }

  /** @name SpVersionRuntimeVersion (88) */
  interface SpVersionRuntimeVersion extends Struct {
    readonly specName: Text;
    readonly implName: Text;
    readonly authoringVersion: u32;
    readonly specVersion: u32;
    readonly implVersion: u32;
    readonly apis: Vec<ITuple<[U8aFixed, u32]>>;
    readonly transactionVersion: u32;
    readonly stateVersion: u8;
  }

  /** @name FrameSystemError (94) */
  interface FrameSystemError extends Enum {
    readonly isInvalidSpecName: boolean;
    readonly isSpecVersionNeedsToIncrease: boolean;
    readonly isFailedToExtractRuntimeVersion: boolean;
    readonly isNonDefaultComposite: boolean;
    readonly isNonZeroRefCount: boolean;
    readonly isCallFiltered: boolean;
    readonly isMultiBlockMigrationsOngoing: boolean;
    readonly isInvalidTask: boolean;
    readonly isFailedTask: boolean;
    readonly isNothingAuthorized: boolean;
    readonly isUnauthorized: boolean;
    readonly type: 'InvalidSpecName' | 'SpecVersionNeedsToIncrease' | 'FailedToExtractRuntimeVersion' | 'NonDefaultComposite' | 'NonZeroRefCount' | 'CallFiltered' | 'MultiBlockMigrationsOngoing' | 'InvalidTask' | 'FailedTask' | 'NothingAuthorized' | 'Unauthorized';
  }

  /** @name PalletTimestampCall (95) */
  interface PalletTimestampCall extends Enum {
    readonly isSet: boolean;
    readonly asSet: {
      readonly now: Compact<u64>;
    } & Struct;
    readonly type: 'Set';
  }

  /** @name SpConsensusAuraSr25519AppSr25519Public (97) */
  interface SpConsensusAuraSr25519AppSr25519Public extends U8aFixed {}

  /** @name PalletGrandpaStoredState (100) */
  interface PalletGrandpaStoredState extends Enum {
    readonly isLive: boolean;
    readonly isPendingPause: boolean;
    readonly asPendingPause: {
      readonly scheduledAt: u64;
      readonly delay: u64;
    } & Struct;
    readonly isPaused: boolean;
    readonly isPendingResume: boolean;
    readonly asPendingResume: {
      readonly scheduledAt: u64;
      readonly delay: u64;
    } & Struct;
    readonly type: 'Live' | 'PendingPause' | 'Paused' | 'PendingResume';
  }

  /** @name PalletGrandpaStoredPendingChange (101) */
  interface PalletGrandpaStoredPendingChange extends Struct {
    readonly scheduledAt: u64;
    readonly delay: u64;
    readonly nextAuthorities: Vec<ITuple<[SpConsensusGrandpaAppPublic, u64]>>;
    readonly forced: Option<u64>;
  }

  /** @name PalletGrandpaCall (105) */
  interface PalletGrandpaCall extends Enum {
    readonly isReportEquivocation: boolean;
    readonly asReportEquivocation: {
      readonly equivocationProof: SpConsensusGrandpaEquivocationProof;
      readonly keyOwnerProof: SpCoreVoid;
    } & Struct;
    readonly isReportEquivocationUnsigned: boolean;
    readonly asReportEquivocationUnsigned: {
      readonly equivocationProof: SpConsensusGrandpaEquivocationProof;
      readonly keyOwnerProof: SpCoreVoid;
    } & Struct;
    readonly isNoteStalled: boolean;
    readonly asNoteStalled: {
      readonly delay: u64;
      readonly bestFinalizedBlockNumber: u64;
    } & Struct;
    readonly type: 'ReportEquivocation' | 'ReportEquivocationUnsigned' | 'NoteStalled';
  }

  /** @name SpConsensusGrandpaEquivocationProof (106) */
  interface SpConsensusGrandpaEquivocationProof extends Struct {
    readonly setId: u64;
    readonly equivocation: SpConsensusGrandpaEquivocation;
  }

  /** @name SpConsensusGrandpaEquivocation (107) */
  interface SpConsensusGrandpaEquivocation extends Enum {
    readonly isPrevote: boolean;
    readonly asPrevote: FinalityGrandpaEquivocationPrevote;
    readonly isPrecommit: boolean;
    readonly asPrecommit: FinalityGrandpaEquivocationPrecommit;
    readonly type: 'Prevote' | 'Precommit';
  }

  /** @name FinalityGrandpaEquivocationPrevote (108) */
  interface FinalityGrandpaEquivocationPrevote extends Struct {
    readonly roundNumber: u64;
    readonly identity: SpConsensusGrandpaAppPublic;
    readonly first: ITuple<[FinalityGrandpaPrevote, SpConsensusGrandpaAppSignature]>;
    readonly second: ITuple<[FinalityGrandpaPrevote, SpConsensusGrandpaAppSignature]>;
  }

  /** @name FinalityGrandpaPrevote (109) */
  interface FinalityGrandpaPrevote extends Struct {
    readonly targetHash: H256;
    readonly targetNumber: u64;
  }

  /** @name SpConsensusGrandpaAppSignature (110) */
  interface SpConsensusGrandpaAppSignature extends U8aFixed {}

  /** @name FinalityGrandpaEquivocationPrecommit (113) */
  interface FinalityGrandpaEquivocationPrecommit extends Struct {
    readonly roundNumber: u64;
    readonly identity: SpConsensusGrandpaAppPublic;
    readonly first: ITuple<[FinalityGrandpaPrecommit, SpConsensusGrandpaAppSignature]>;
    readonly second: ITuple<[FinalityGrandpaPrecommit, SpConsensusGrandpaAppSignature]>;
  }

  /** @name FinalityGrandpaPrecommit (114) */
  interface FinalityGrandpaPrecommit extends Struct {
    readonly targetHash: H256;
    readonly targetNumber: u64;
  }

  /** @name SpCoreVoid (116) */
  type SpCoreVoid = Null;

  /** @name PalletGrandpaError (117) */
  interface PalletGrandpaError extends Enum {
    readonly isPauseFailed: boolean;
    readonly isResumeFailed: boolean;
    readonly isChangePending: boolean;
    readonly isTooSoon: boolean;
    readonly isInvalidKeyOwnershipProof: boolean;
    readonly isInvalidEquivocationProof: boolean;
    readonly isDuplicateOffenceReport: boolean;
    readonly type: 'PauseFailed' | 'ResumeFailed' | 'ChangePending' | 'TooSoon' | 'InvalidKeyOwnershipProof' | 'InvalidEquivocationProof' | 'DuplicateOffenceReport';
  }

  /** @name PalletBalancesBalanceLock (119) */
  interface PalletBalancesBalanceLock extends Struct {
    readonly id: U8aFixed;
    readonly amount: u128;
    readonly reasons: PalletBalancesReasons;
  }

  /** @name PalletBalancesReasons (120) */
  interface PalletBalancesReasons extends Enum {
    readonly isFee: boolean;
    readonly isMisc: boolean;
    readonly isAll: boolean;
    readonly type: 'Fee' | 'Misc' | 'All';
  }

  /** @name PalletBalancesReserveData (123) */
  interface PalletBalancesReserveData extends Struct {
    readonly id: U8aFixed;
    readonly amount: u128;
  }

  /** @name TorusRuntimeRuntimeHoldReason (127) */
  type TorusRuntimeRuntimeHoldReason = Null;

  /** @name FrameSupportTokensMiscIdAmount (130) */
  interface FrameSupportTokensMiscIdAmount extends Struct {
    readonly id: Null;
    readonly amount: u128;
  }

  /** @name PalletBalancesCall (132) */
  interface PalletBalancesCall extends Enum {
    readonly isTransferAllowDeath: boolean;
    readonly asTransferAllowDeath: {
      readonly dest: MultiAddress;
      readonly value: Compact<u128>;
    } & Struct;
    readonly isForceTransfer: boolean;
    readonly asForceTransfer: {
      readonly source: MultiAddress;
      readonly dest: MultiAddress;
      readonly value: Compact<u128>;
    } & Struct;
    readonly isTransferKeepAlive: boolean;
    readonly asTransferKeepAlive: {
      readonly dest: MultiAddress;
      readonly value: Compact<u128>;
    } & Struct;
    readonly isTransferAll: boolean;
    readonly asTransferAll: {
      readonly dest: MultiAddress;
      readonly keepAlive: bool;
    } & Struct;
    readonly isForceUnreserve: boolean;
    readonly asForceUnreserve: {
      readonly who: MultiAddress;
      readonly amount: u128;
    } & Struct;
    readonly isUpgradeAccounts: boolean;
    readonly asUpgradeAccounts: {
      readonly who: Vec<AccountId32>;
    } & Struct;
    readonly isForceSetBalance: boolean;
    readonly asForceSetBalance: {
      readonly who: MultiAddress;
      readonly newFree: Compact<u128>;
    } & Struct;
    readonly isForceAdjustTotalIssuance: boolean;
    readonly asForceAdjustTotalIssuance: {
      readonly direction: PalletBalancesAdjustmentDirection;
      readonly delta: Compact<u128>;
    } & Struct;
    readonly isBurn: boolean;
    readonly asBurn: {
      readonly value: Compact<u128>;
      readonly keepAlive: bool;
    } & Struct;
    readonly type: 'TransferAllowDeath' | 'ForceTransfer' | 'TransferKeepAlive' | 'TransferAll' | 'ForceUnreserve' | 'UpgradeAccounts' | 'ForceSetBalance' | 'ForceAdjustTotalIssuance' | 'Burn';
  }

  /** @name PalletBalancesAdjustmentDirection (137) */
  interface PalletBalancesAdjustmentDirection extends Enum {
    readonly isIncrease: boolean;
    readonly isDecrease: boolean;
    readonly type: 'Increase' | 'Decrease';
  }

  /** @name PalletBalancesError (138) */
  interface PalletBalancesError extends Enum {
    readonly isVestingBalance: boolean;
    readonly isLiquidityRestrictions: boolean;
    readonly isInsufficientBalance: boolean;
    readonly isExistentialDeposit: boolean;
    readonly isExpendability: boolean;
    readonly isExistingVestingSchedule: boolean;
    readonly isDeadAccount: boolean;
    readonly isTooManyReserves: boolean;
    readonly isTooManyHolds: boolean;
    readonly isTooManyFreezes: boolean;
    readonly isIssuanceDeactivated: boolean;
    readonly isDeltaZero: boolean;
    readonly type: 'VestingBalance' | 'LiquidityRestrictions' | 'InsufficientBalance' | 'ExistentialDeposit' | 'Expendability' | 'ExistingVestingSchedule' | 'DeadAccount' | 'TooManyReserves' | 'TooManyHolds' | 'TooManyFreezes' | 'IssuanceDeactivated' | 'DeltaZero';
  }

  /** @name PalletTransactionPaymentReleases (140) */
  interface PalletTransactionPaymentReleases extends Enum {
    readonly isV1Ancient: boolean;
    readonly isV2: boolean;
    readonly type: 'V1Ancient' | 'V2';
  }

  /** @name PalletSudoCall (141) */
  interface PalletSudoCall extends Enum {
    readonly isSudo: boolean;
    readonly asSudo: {
      readonly call: Call;
    } & Struct;
    readonly isSudoUncheckedWeight: boolean;
    readonly asSudoUncheckedWeight: {
      readonly call: Call;
      readonly weight: SpWeightsWeightV2Weight;
    } & Struct;
    readonly isSetKey: boolean;
    readonly asSetKey: {
      readonly new_: MultiAddress;
    } & Struct;
    readonly isSudoAs: boolean;
    readonly asSudoAs: {
      readonly who: MultiAddress;
      readonly call: Call;
    } & Struct;
    readonly isRemoveKey: boolean;
    readonly type: 'Sudo' | 'SudoUncheckedWeight' | 'SetKey' | 'SudoAs' | 'RemoveKey';
  }

  /** @name PalletMultisigCall (143) */
  interface PalletMultisigCall extends Enum {
    readonly isAsMultiThreshold1: boolean;
    readonly asAsMultiThreshold1: {
      readonly otherSignatories: Vec<AccountId32>;
      readonly call: Call;
    } & Struct;
    readonly isAsMulti: boolean;
    readonly asAsMulti: {
      readonly threshold: u16;
      readonly otherSignatories: Vec<AccountId32>;
      readonly maybeTimepoint: Option<PalletMultisigTimepoint>;
      readonly call: Call;
      readonly maxWeight: SpWeightsWeightV2Weight;
    } & Struct;
    readonly isApproveAsMulti: boolean;
    readonly asApproveAsMulti: {
      readonly threshold: u16;
      readonly otherSignatories: Vec<AccountId32>;
      readonly maybeTimepoint: Option<PalletMultisigTimepoint>;
      readonly callHash: U8aFixed;
      readonly maxWeight: SpWeightsWeightV2Weight;
    } & Struct;
    readonly isCancelAsMulti: boolean;
    readonly asCancelAsMulti: {
      readonly threshold: u16;
      readonly otherSignatories: Vec<AccountId32>;
      readonly timepoint: PalletMultisigTimepoint;
      readonly callHash: U8aFixed;
    } & Struct;
    readonly type: 'AsMultiThreshold1' | 'AsMulti' | 'ApproveAsMulti' | 'CancelAsMulti';
  }

  /** @name PalletEthereumCall (145) */
  interface PalletEthereumCall extends Enum {
    readonly isTransact: boolean;
    readonly asTransact: {
      readonly transaction: EthereumTransactionTransactionV2;
    } & Struct;
    readonly type: 'Transact';
  }

  /** @name EthereumTransactionTransactionV2 (146) */
  interface EthereumTransactionTransactionV2 extends Enum {
    readonly isLegacy: boolean;
    readonly asLegacy: EthereumTransactionLegacyTransaction;
    readonly isEip2930: boolean;
    readonly asEip2930: EthereumTransactionEip2930Transaction;
    readonly isEip1559: boolean;
    readonly asEip1559: EthereumTransactionEip1559Transaction;
    readonly type: 'Legacy' | 'Eip2930' | 'Eip1559';
  }

  /** @name EthereumTransactionLegacyTransaction (147) */
  interface EthereumTransactionLegacyTransaction extends Struct {
    readonly nonce: U256;
    readonly gasPrice: U256;
    readonly gasLimit: U256;
    readonly action: EthereumTransactionTransactionAction;
    readonly value: U256;
    readonly input: Bytes;
    readonly signature: EthereumTransactionTransactionSignature;
  }

  /** @name EthereumTransactionTransactionAction (150) */
  interface EthereumTransactionTransactionAction extends Enum {
    readonly isCall: boolean;
    readonly asCall: H160;
    readonly isCreate: boolean;
    readonly type: 'Call' | 'Create';
  }

  /** @name EthereumTransactionTransactionSignature (151) */
  interface EthereumTransactionTransactionSignature extends Struct {
    readonly v: u64;
    readonly r: H256;
    readonly s: H256;
  }

  /** @name EthereumTransactionEip2930Transaction (153) */
  interface EthereumTransactionEip2930Transaction extends Struct {
    readonly chainId: u64;
    readonly nonce: U256;
    readonly gasPrice: U256;
    readonly gasLimit: U256;
    readonly action: EthereumTransactionTransactionAction;
    readonly value: U256;
    readonly input: Bytes;
    readonly accessList: Vec<EthereumTransactionAccessListItem>;
    readonly oddYParity: bool;
    readonly r: H256;
    readonly s: H256;
  }

  /** @name EthereumTransactionAccessListItem (155) */
  interface EthereumTransactionAccessListItem extends Struct {
    readonly address: H160;
    readonly storageKeys: Vec<H256>;
  }

  /** @name EthereumTransactionEip1559Transaction (156) */
  interface EthereumTransactionEip1559Transaction extends Struct {
    readonly chainId: u64;
    readonly nonce: U256;
    readonly maxPriorityFeePerGas: U256;
    readonly maxFeePerGas: U256;
    readonly gasLimit: U256;
    readonly action: EthereumTransactionTransactionAction;
    readonly value: U256;
    readonly input: Bytes;
    readonly accessList: Vec<EthereumTransactionAccessListItem>;
    readonly oddYParity: bool;
    readonly r: H256;
    readonly s: H256;
  }

  /** @name PalletEvmCall (157) */
  interface PalletEvmCall extends Enum {
    readonly isWithdraw: boolean;
    readonly asWithdraw: {
      readonly address: H160;
      readonly value: u128;
    } & Struct;
    readonly isCall: boolean;
    readonly asCall: {
      readonly source: H160;
      readonly target: H160;
      readonly input: Bytes;
      readonly value: U256;
      readonly gasLimit: u64;
      readonly maxFeePerGas: U256;
      readonly maxPriorityFeePerGas: Option<U256>;
      readonly nonce: Option<U256>;
      readonly accessList: Vec<ITuple<[H160, Vec<H256>]>>;
    } & Struct;
    readonly isCreate: boolean;
    readonly asCreate: {
      readonly source: H160;
      readonly init: Bytes;
      readonly value: U256;
      readonly gasLimit: u64;
      readonly maxFeePerGas: U256;
      readonly maxPriorityFeePerGas: Option<U256>;
      readonly nonce: Option<U256>;
      readonly accessList: Vec<ITuple<[H160, Vec<H256>]>>;
    } & Struct;
    readonly isCreate2: boolean;
    readonly asCreate2: {
      readonly source: H160;
      readonly init: Bytes;
      readonly salt: H256;
      readonly value: U256;
      readonly gasLimit: u64;
      readonly maxFeePerGas: U256;
      readonly maxPriorityFeePerGas: Option<U256>;
      readonly nonce: Option<U256>;
      readonly accessList: Vec<ITuple<[H160, Vec<H256>]>>;
    } & Struct;
    readonly type: 'Withdraw' | 'Call' | 'Create' | 'Create2';
  }

  /** @name PalletGovernanceCall (161) */
  interface PalletGovernanceCall extends Enum {
    readonly isAddAllocator: boolean;
    readonly asAddAllocator: {
      readonly key: AccountId32;
    } & Struct;
    readonly isRemoveAllocator: boolean;
    readonly asRemoveAllocator: {
      readonly key: AccountId32;
    } & Struct;
    readonly isAddToWhitelist: boolean;
    readonly asAddToWhitelist: {
      readonly key: AccountId32;
    } & Struct;
    readonly isRemoveFromWhitelist: boolean;
    readonly asRemoveFromWhitelist: {
      readonly key: AccountId32;
    } & Struct;
    readonly isAcceptApplication: boolean;
    readonly asAcceptApplication: {
      readonly applicationId: u32;
    } & Struct;
    readonly isDenyApplication: boolean;
    readonly asDenyApplication: {
      readonly applicationId: u32;
    } & Struct;
    readonly isPenalizeAgent: boolean;
    readonly asPenalizeAgent: {
      readonly agentKey: AccountId32;
      readonly percentage: u8;
    } & Struct;
    readonly isSubmitApplication: boolean;
    readonly asSubmitApplication: {
      readonly agentKey: AccountId32;
      readonly metadata: Bytes;
      readonly removing: bool;
    } & Struct;
    readonly isAddGlobalParamsProposal: boolean;
    readonly asAddGlobalParamsProposal: {
      readonly data: PalletGovernanceProposalGlobalParamsData;
      readonly metadata: Bytes;
    } & Struct;
    readonly isAddGlobalCustomProposal: boolean;
    readonly asAddGlobalCustomProposal: {
      readonly metadata: Bytes;
    } & Struct;
    readonly isAddDaoTreasuryTransferProposal: boolean;
    readonly asAddDaoTreasuryTransferProposal: {
      readonly value: u128;
      readonly destinationKey: AccountId32;
      readonly data: Bytes;
    } & Struct;
    readonly isVoteProposal: boolean;
    readonly asVoteProposal: {
      readonly proposalId: u64;
      readonly agree: bool;
    } & Struct;
    readonly isRemoveVoteProposal: boolean;
    readonly asRemoveVoteProposal: {
      readonly proposalId: u64;
    } & Struct;
    readonly isEnableVoteDelegation: boolean;
    readonly isDisableVoteDelegation: boolean;
    readonly isAddEmissionProposal: boolean;
    readonly asAddEmissionProposal: {
      readonly recyclingPercentage: Percent;
      readonly treasuryPercentage: Percent;
      readonly incentivesRatio: Percent;
      readonly data: Bytes;
    } & Struct;
    readonly isSetEmissionParams: boolean;
    readonly asSetEmissionParams: {
      readonly recyclingPercentage: Percent;
      readonly treasuryPercentage: Percent;
    } & Struct;
    readonly isToggleAgentFreezing: boolean;
    readonly isToggleNamespaceFreezing: boolean;
    readonly type: 'AddAllocator' | 'RemoveAllocator' | 'AddToWhitelist' | 'RemoveFromWhitelist' | 'AcceptApplication' | 'DenyApplication' | 'PenalizeAgent' | 'SubmitApplication' | 'AddGlobalParamsProposal' | 'AddGlobalCustomProposal' | 'AddDaoTreasuryTransferProposal' | 'VoteProposal' | 'RemoveVoteProposal' | 'EnableVoteDelegation' | 'DisableVoteDelegation' | 'AddEmissionProposal' | 'SetEmissionParams' | 'ToggleAgentFreezing' | 'ToggleNamespaceFreezing';
  }

  /** @name PalletGovernanceProposalGlobalParamsData (162) */
  interface PalletGovernanceProposalGlobalParamsData extends Struct {
    readonly minNameLength: u16;
    readonly maxNameLength: u16;
    readonly minWeightControlFee: u8;
    readonly minStakingFee: u8;
    readonly dividendsParticipationWeight: Percent;
    readonly namespacePricingConfig: PalletTorus0NamespaceNamespacePricingConfig;
    readonly proposalCost: u128;
  }

  /** @name PalletTorus0NamespaceNamespacePricingConfig (163) */
  interface PalletTorus0NamespaceNamespacePricingConfig extends Struct {
    readonly depositPerByte: u128;
    readonly baseFee: u128;
    readonly countMidpoint: u32;
    readonly feeSteepness: Percent;
    readonly maxFeeMultiplier: u32;
  }

  /** @name PalletTorus0Call (164) */
  interface PalletTorus0Call extends Enum {
    readonly isAddStake: boolean;
    readonly asAddStake: {
      readonly agentKey: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isRemoveStake: boolean;
    readonly asRemoveStake: {
      readonly agentKey: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isTransferStake: boolean;
    readonly asTransferStake: {
      readonly agentKey: AccountId32;
      readonly newAgentKey: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isRegisterAgent: boolean;
    readonly asRegisterAgent: {
      readonly name: Bytes;
      readonly url: Bytes;
      readonly metadata: Bytes;
    } & Struct;
    readonly isDeregisterAgent: boolean;
    readonly isUpdateAgent: boolean;
    readonly asUpdateAgent: {
      readonly url: Bytes;
      readonly metadata: Option<Bytes>;
      readonly stakingFee: Option<Percent>;
      readonly weightControlFee: Option<Percent>;
    } & Struct;
    readonly isSetAgentUpdateCooldown: boolean;
    readonly asSetAgentUpdateCooldown: {
      readonly newCooldown: u64;
    } & Struct;
    readonly isCreateNamespace: boolean;
    readonly asCreateNamespace: {
      readonly path: Bytes;
    } & Struct;
    readonly isDeleteNamespace: boolean;
    readonly asDeleteNamespace: {
      readonly path: Bytes;
    } & Struct;
    readonly type: 'AddStake' | 'RemoveStake' | 'TransferStake' | 'RegisterAgent' | 'DeregisterAgent' | 'UpdateAgent' | 'SetAgentUpdateCooldown' | 'CreateNamespace' | 'DeleteNamespace';
  }

  /** @name PalletEmission0Call (167) */
  interface PalletEmission0Call extends Enum {
    readonly isSetWeights: boolean;
    readonly asSetWeights: {
      readonly weights: Vec<ITuple<[AccountId32, u16]>>;
    } & Struct;
    readonly isDelegateWeightControl: boolean;
    readonly asDelegateWeightControl: {
      readonly target: AccountId32;
    } & Struct;
    readonly isRegainWeightControl: boolean;
    readonly type: 'SetWeights' | 'DelegateWeightControl' | 'RegainWeightControl';
  }

  /** @name PalletPermission0Call (170) */
  interface PalletPermission0Call extends Enum {
    readonly isDelegateEmissionPermission: boolean;
    readonly asDelegateEmissionPermission: {
      readonly recipient: AccountId32;
      readonly allocation: PalletPermission0PermissionEmissionEmissionAllocation;
      readonly targets: BTreeMap<AccountId32, u16>;
      readonly distribution: PalletPermission0PermissionEmissionDistributionControl;
      readonly duration: PalletPermission0PermissionPermissionDuration;
      readonly revocation: PalletPermission0PermissionRevocationTerms;
      readonly enforcement: PalletPermission0PermissionEnforcementAuthority;
    } & Struct;
    readonly isRevokePermission: boolean;
    readonly asRevokePermission: {
      readonly permissionId: H256;
    } & Struct;
    readonly isExecutePermission: boolean;
    readonly asExecutePermission: {
      readonly permissionId: H256;
    } & Struct;
    readonly isTogglePermissionAccumulation: boolean;
    readonly asTogglePermissionAccumulation: {
      readonly permissionId: H256;
      readonly accumulating: bool;
    } & Struct;
    readonly isEnforcementExecutePermission: boolean;
    readonly asEnforcementExecutePermission: {
      readonly permissionId: H256;
    } & Struct;
    readonly isSetEnforcementAuthority: boolean;
    readonly asSetEnforcementAuthority: {
      readonly permissionId: H256;
      readonly enforcement: PalletPermission0PermissionEnforcementAuthority;
    } & Struct;
    readonly isDelegateCuratorPermission: boolean;
    readonly asDelegateCuratorPermission: {
      readonly recipient: AccountId32;
      readonly flags: u32;
      readonly cooldown: Option<u64>;
      readonly duration: PalletPermission0PermissionPermissionDuration;
      readonly revocation: PalletPermission0PermissionRevocationTerms;
    } & Struct;
    readonly isDelegateNamespacePermission: boolean;
    readonly asDelegateNamespacePermission: {
      readonly recipient: AccountId32;
      readonly paths: BTreeMap<Option<H256>, BTreeSet<Bytes>>;
      readonly duration: PalletPermission0PermissionPermissionDuration;
      readonly revocation: PalletPermission0PermissionRevocationTerms;
      readonly instances: u32;
    } & Struct;
    readonly isUpdateEmissionPermission: boolean;
    readonly asUpdateEmissionPermission: {
      readonly permissionId: H256;
      readonly newTargets: BTreeMap<AccountId32, u16>;
      readonly newStreams: Option<BTreeMap<H256, Percent>>;
      readonly newDistributionControl: Option<PalletPermission0PermissionEmissionDistributionControl>;
    } & Struct;
    readonly type: 'DelegateEmissionPermission' | 'RevokePermission' | 'ExecutePermission' | 'TogglePermissionAccumulation' | 'EnforcementExecutePermission' | 'SetEnforcementAuthority' | 'DelegateCuratorPermission' | 'DelegateNamespacePermission' | 'UpdateEmissionPermission';
  }

  /** @name PalletPermission0PermissionEmissionEmissionAllocation (171) */
  interface PalletPermission0PermissionEmissionEmissionAllocation extends Enum {
    readonly isStreams: boolean;
    readonly asStreams: BTreeMap<H256, Percent>;
    readonly isFixedAmount: boolean;
    readonly asFixedAmount: u128;
    readonly type: 'Streams' | 'FixedAmount';
  }

  /** @name PalletPermission0PermissionEmissionDistributionControl (178) */
  interface PalletPermission0PermissionEmissionDistributionControl extends Enum {
    readonly isManual: boolean;
    readonly isAutomatic: boolean;
    readonly asAutomatic: u128;
    readonly isAtBlock: boolean;
    readonly asAtBlock: u64;
    readonly isInterval: boolean;
    readonly asInterval: u64;
    readonly type: 'Manual' | 'Automatic' | 'AtBlock' | 'Interval';
  }

  /** @name PalletPermission0PermissionPermissionDuration (179) */
  interface PalletPermission0PermissionPermissionDuration extends Enum {
    readonly isUntilBlock: boolean;
    readonly asUntilBlock: u64;
    readonly isIndefinite: boolean;
    readonly type: 'UntilBlock' | 'Indefinite';
  }

  /** @name PalletPermission0PermissionRevocationTerms (180) */
  interface PalletPermission0PermissionRevocationTerms extends Enum {
    readonly isIrrevocable: boolean;
    readonly isRevocableByDelegator: boolean;
    readonly isRevocableByArbiters: boolean;
    readonly asRevocableByArbiters: {
      readonly accounts: Vec<AccountId32>;
      readonly requiredVotes: u32;
    } & Struct;
    readonly isRevocableAfter: boolean;
    readonly asRevocableAfter: u64;
    readonly type: 'Irrevocable' | 'RevocableByDelegator' | 'RevocableByArbiters' | 'RevocableAfter';
  }

  /** @name PalletPermission0PermissionEnforcementAuthority (182) */
  interface PalletPermission0PermissionEnforcementAuthority extends Enum {
    readonly isNone: boolean;
    readonly isControlledBy: boolean;
    readonly asControlledBy: {
      readonly controllers: Vec<AccountId32>;
      readonly requiredVotes: u32;
    } & Struct;
    readonly type: 'None' | 'ControlledBy';
  }

  /** @name PalletFaucetCall (193) */
  interface PalletFaucetCall extends Enum {
    readonly isFaucet: boolean;
    readonly asFaucet: {
      readonly blockNumber: u64;
      readonly nonce: u64;
      readonly work: Bytes;
      readonly key: MultiAddress;
    } & Struct;
    readonly type: 'Faucet';
  }

  /** @name PalletSudoError (194) */
  interface PalletSudoError extends Enum {
    readonly isRequireSudo: boolean;
    readonly type: 'RequireSudo';
  }

  /** @name PalletMultisigMultisig (196) */
  interface PalletMultisigMultisig extends Struct {
    readonly when: PalletMultisigTimepoint;
    readonly deposit: u128;
    readonly depositor: AccountId32;
    readonly approvals: Vec<AccountId32>;
  }

  /** @name PalletMultisigError (198) */
  interface PalletMultisigError extends Enum {
    readonly isMinimumThreshold: boolean;
    readonly isAlreadyApproved: boolean;
    readonly isNoApprovalsNeeded: boolean;
    readonly isTooFewSignatories: boolean;
    readonly isTooManySignatories: boolean;
    readonly isSignatoriesOutOfOrder: boolean;
    readonly isSenderInSignatories: boolean;
    readonly isNotFound: boolean;
    readonly isNotOwner: boolean;
    readonly isNoTimepoint: boolean;
    readonly isWrongTimepoint: boolean;
    readonly isUnexpectedTimepoint: boolean;
    readonly isMaxWeightTooLow: boolean;
    readonly isAlreadyStored: boolean;
    readonly type: 'MinimumThreshold' | 'AlreadyApproved' | 'NoApprovalsNeeded' | 'TooFewSignatories' | 'TooManySignatories' | 'SignatoriesOutOfOrder' | 'SenderInSignatories' | 'NotFound' | 'NotOwner' | 'NoTimepoint' | 'WrongTimepoint' | 'UnexpectedTimepoint' | 'MaxWeightTooLow' | 'AlreadyStored';
  }

  /** @name FpRpcTransactionStatus (201) */
  interface FpRpcTransactionStatus extends Struct {
    readonly transactionHash: H256;
    readonly transactionIndex: u32;
    readonly from: H160;
    readonly to: Option<H160>;
    readonly contractAddress: Option<H160>;
    readonly logs: Vec<EthereumLog>;
    readonly logsBloom: EthbloomBloom;
  }

  /** @name EthbloomBloom (204) */
  interface EthbloomBloom extends U8aFixed {}

  /** @name EthereumReceiptReceiptV3 (206) */
  interface EthereumReceiptReceiptV3 extends Enum {
    readonly isLegacy: boolean;
    readonly asLegacy: EthereumReceiptEip658ReceiptData;
    readonly isEip2930: boolean;
    readonly asEip2930: EthereumReceiptEip658ReceiptData;
    readonly isEip1559: boolean;
    readonly asEip1559: EthereumReceiptEip658ReceiptData;
    readonly type: 'Legacy' | 'Eip2930' | 'Eip1559';
  }

  /** @name EthereumReceiptEip658ReceiptData (207) */
  interface EthereumReceiptEip658ReceiptData extends Struct {
    readonly statusCode: u8;
    readonly usedGas: U256;
    readonly logsBloom: EthbloomBloom;
    readonly logs: Vec<EthereumLog>;
  }

  /** @name EthereumBlock (208) */
  interface EthereumBlock extends Struct {
    readonly header: EthereumHeader;
    readonly transactions: Vec<EthereumTransactionTransactionV2>;
    readonly ommers: Vec<EthereumHeader>;
  }

  /** @name EthereumHeader (209) */
  interface EthereumHeader extends Struct {
    readonly parentHash: H256;
    readonly ommersHash: H256;
    readonly beneficiary: H160;
    readonly stateRoot: H256;
    readonly transactionsRoot: H256;
    readonly receiptsRoot: H256;
    readonly logsBloom: EthbloomBloom;
    readonly difficulty: U256;
    readonly number: U256;
    readonly gasLimit: U256;
    readonly gasUsed: U256;
    readonly timestamp: u64;
    readonly extraData: Bytes;
    readonly mixHash: H256;
    readonly nonce: EthereumTypesHashH64;
  }

  /** @name EthereumTypesHashH64 (210) */
  interface EthereumTypesHashH64 extends U8aFixed {}

  /** @name PalletEthereumError (215) */
  interface PalletEthereumError extends Enum {
    readonly isInvalidSignature: boolean;
    readonly isPreLogExists: boolean;
    readonly type: 'InvalidSignature' | 'PreLogExists';
  }

  /** @name PalletEvmCodeMetadata (216) */
  interface PalletEvmCodeMetadata extends Struct {
    readonly size_: u64;
    readonly hash_: H256;
  }

  /** @name PalletEvmError (218) */
  interface PalletEvmError extends Enum {
    readonly isBalanceLow: boolean;
    readonly isFeeOverflow: boolean;
    readonly isPaymentOverflow: boolean;
    readonly isWithdrawFailed: boolean;
    readonly isGasPriceTooLow: boolean;
    readonly isInvalidNonce: boolean;
    readonly isGasLimitTooLow: boolean;
    readonly isGasLimitTooHigh: boolean;
    readonly isInvalidChainId: boolean;
    readonly isInvalidSignature: boolean;
    readonly isReentrancy: boolean;
    readonly isTransactionMustComeFromEOA: boolean;
    readonly isUndefined: boolean;
    readonly type: 'BalanceLow' | 'FeeOverflow' | 'PaymentOverflow' | 'WithdrawFailed' | 'GasPriceTooLow' | 'InvalidNonce' | 'GasLimitTooLow' | 'GasLimitTooHigh' | 'InvalidChainId' | 'InvalidSignature' | 'Reentrancy' | 'TransactionMustComeFromEOA' | 'Undefined';
  }

  /** @name PalletGovernanceProposal (219) */
  interface PalletGovernanceProposal extends Struct {
    readonly id: u64;
    readonly proposer: AccountId32;
    readonly expirationBlock: u64;
    readonly data: PalletGovernanceProposalProposalData;
    readonly status: PalletGovernanceProposalProposalStatus;
    readonly metadata: Bytes;
    readonly proposalCost: u128;
    readonly creationBlock: u64;
  }

  /** @name PalletGovernanceProposalProposalData (220) */
  interface PalletGovernanceProposalProposalData extends Enum {
    readonly isGlobalParams: boolean;
    readonly asGlobalParams: PalletGovernanceProposalGlobalParamsData;
    readonly isGlobalCustom: boolean;
    readonly isEmission: boolean;
    readonly asEmission: {
      readonly recyclingPercentage: Percent;
      readonly treasuryPercentage: Percent;
      readonly incentivesRatio: Percent;
    } & Struct;
    readonly isTransferDaoTreasury: boolean;
    readonly asTransferDaoTreasury: {
      readonly account: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly type: 'GlobalParams' | 'GlobalCustom' | 'Emission' | 'TransferDaoTreasury';
  }

  /** @name PalletGovernanceProposalProposalStatus (221) */
  interface PalletGovernanceProposalProposalStatus extends Enum {
    readonly isOpen: boolean;
    readonly asOpen: {
      readonly votesFor: BTreeSet<AccountId32>;
      readonly votesAgainst: BTreeSet<AccountId32>;
      readonly stakeFor: u128;
      readonly stakeAgainst: u128;
    } & Struct;
    readonly isAccepted: boolean;
    readonly asAccepted: {
      readonly block: u64;
      readonly stakeFor: u128;
      readonly stakeAgainst: u128;
    } & Struct;
    readonly isRefused: boolean;
    readonly asRefused: {
      readonly block: u64;
      readonly stakeFor: u128;
      readonly stakeAgainst: u128;
    } & Struct;
    readonly isExpired: boolean;
    readonly type: 'Open' | 'Accepted' | 'Refused' | 'Expired';
  }

  /** @name PalletGovernanceProposalUnrewardedProposal (224) */
  interface PalletGovernanceProposalUnrewardedProposal extends Struct {
    readonly block: u64;
    readonly votesFor: BTreeMap<AccountId32, u128>;
    readonly votesAgainst: BTreeMap<AccountId32, u128>;
  }

  /** @name PalletGovernanceConfigGovernanceConfiguration (229) */
  interface PalletGovernanceConfigGovernanceConfiguration extends Struct {
    readonly proposalCost: u128;
    readonly proposalExpiration: u64;
    readonly agentApplicationCost: u128;
    readonly agentApplicationExpiration: u64;
    readonly proposalRewardTreasuryAllocation: Percent;
    readonly maxProposalRewardTreasuryAllocation: u128;
    readonly proposalRewardInterval: u64;
  }

  /** @name PalletGovernanceApplicationAgentApplication (230) */
  interface PalletGovernanceApplicationAgentApplication extends Struct {
    readonly id: u32;
    readonly payerKey: AccountId32;
    readonly agentKey: AccountId32;
    readonly data: Bytes;
    readonly cost: u128;
    readonly expiresAt: u64;
    readonly action: PalletGovernanceApplicationApplicationAction;
    readonly status: PalletGovernanceApplicationApplicationStatus;
  }

  /** @name PalletGovernanceApplicationApplicationAction (231) */
  interface PalletGovernanceApplicationApplicationAction extends Enum {
    readonly isAdd: boolean;
    readonly isRemove: boolean;
    readonly type: 'Add' | 'Remove';
  }

  /** @name PalletGovernanceApplicationApplicationStatus (232) */
  interface PalletGovernanceApplicationApplicationStatus extends Enum {
    readonly isOpen: boolean;
    readonly isResolved: boolean;
    readonly asResolved: {
      readonly accepted: bool;
    } & Struct;
    readonly isExpired: boolean;
    readonly type: 'Open' | 'Resolved' | 'Expired';
  }

  /** @name FrameSupportPalletId (233) */
  interface FrameSupportPalletId extends U8aFixed {}

  /** @name PalletGovernanceError (234) */
  interface PalletGovernanceError extends Enum {
    readonly isProposalIsFinished: boolean;
    readonly isInvalidProposalFinalizationParameters: boolean;
    readonly isInvalidProposalVotingParameters: boolean;
    readonly isInvalidProposalCost: boolean;
    readonly isInvalidProposalExpiration: boolean;
    readonly isNotEnoughBalanceToPropose: boolean;
    readonly isProposalDataTooSmall: boolean;
    readonly isProposalDataTooLarge: boolean;
    readonly isModuleDelegatingForMaxStakers: boolean;
    readonly isProposalNotFound: boolean;
    readonly isProposalClosed: boolean;
    readonly isInvalidProposalData: boolean;
    readonly isInvalidCurrencyConversionValue: boolean;
    readonly isInsufficientDaoTreasuryFunds: boolean;
    readonly isAlreadyVoted: boolean;
    readonly isNotVoted: boolean;
    readonly isInsufficientStake: boolean;
    readonly isVoterIsDelegatingVotingPower: boolean;
    readonly isInternalError: boolean;
    readonly isApplicationNotOpen: boolean;
    readonly isApplicationKeyAlreadyUsed: boolean;
    readonly isNotEnoughBalanceToApply: boolean;
    readonly isNotCurator: boolean;
    readonly isApplicationNotFound: boolean;
    readonly isAlreadyWhitelisted: boolean;
    readonly isNotWhitelisted: boolean;
    readonly isCouldNotConvertToBalance: boolean;
    readonly isInvalidApplicationDataLength: boolean;
    readonly isAlreadyCurator: boolean;
    readonly isAlreadyAllocator: boolean;
    readonly isNotAllocator: boolean;
    readonly isAgentNotFound: boolean;
    readonly isInvalidPenaltyPercentage: boolean;
    readonly isInvalidMinNameLength: boolean;
    readonly isInvalidMaxNameLength: boolean;
    readonly isInvalidMaxAllowedWeights: boolean;
    readonly isInvalidMinWeightControlFee: boolean;
    readonly isInvalidMinStakingFee: boolean;
    readonly isInvalidEmissionProposalData: boolean;
    readonly type: 'ProposalIsFinished' | 'InvalidProposalFinalizationParameters' | 'InvalidProposalVotingParameters' | 'InvalidProposalCost' | 'InvalidProposalExpiration' | 'NotEnoughBalanceToPropose' | 'ProposalDataTooSmall' | 'ProposalDataTooLarge' | 'ModuleDelegatingForMaxStakers' | 'ProposalNotFound' | 'ProposalClosed' | 'InvalidProposalData' | 'InvalidCurrencyConversionValue' | 'InsufficientDaoTreasuryFunds' | 'AlreadyVoted' | 'NotVoted' | 'InsufficientStake' | 'VoterIsDelegatingVotingPower' | 'InternalError' | 'ApplicationNotOpen' | 'ApplicationKeyAlreadyUsed' | 'NotEnoughBalanceToApply' | 'NotCurator' | 'ApplicationNotFound' | 'AlreadyWhitelisted' | 'NotWhitelisted' | 'CouldNotConvertToBalance' | 'InvalidApplicationDataLength' | 'AlreadyCurator' | 'AlreadyAllocator' | 'NotAllocator' | 'AgentNotFound' | 'InvalidPenaltyPercentage' | 'InvalidMinNameLength' | 'InvalidMaxNameLength' | 'InvalidMaxAllowedWeights' | 'InvalidMinWeightControlFee' | 'InvalidMinStakingFee' | 'InvalidEmissionProposalData';
  }

  /** @name PalletTorus0Agent (235) */
  interface PalletTorus0Agent extends Struct {
    readonly key: AccountId32;
    readonly name: Bytes;
    readonly url: Bytes;
    readonly metadata: Bytes;
    readonly weightPenaltyFactor: Percent;
    readonly registrationBlock: u64;
    readonly fees: PalletTorus0FeeValidatorFee;
    readonly lastUpdateBlock: u64;
  }

  /** @name PalletTorus0FeeValidatorFee (236) */
  interface PalletTorus0FeeValidatorFee extends Struct {
    readonly stakingFee: Percent;
    readonly weightControlFee: Percent;
  }

  /** @name PalletTorus0FeeValidatorFeeConstraints (238) */
  interface PalletTorus0FeeValidatorFeeConstraints extends Struct {
    readonly minStakingFee: Percent;
    readonly minWeightControlFee: Percent;
  }

  /** @name PalletTorus0BurnBurnConfiguration (239) */
  interface PalletTorus0BurnBurnConfiguration extends Struct {
    readonly minBurn: u128;
    readonly maxBurn: u128;
    readonly adjustmentAlpha: u64;
    readonly targetRegistrationsInterval: u64;
    readonly targetRegistrationsPerInterval: u16;
    readonly maxRegistrationsPerInterval: u16;
  }

  /** @name PalletTorus0NamespaceNamespaceMetadata (241) */
  interface PalletTorus0NamespaceNamespaceMetadata extends Struct {
    readonly createdAt: u64;
    readonly deposit: u128;
  }

  /** @name PalletTorus0Error (242) */
  interface PalletTorus0Error extends Enum {
    readonly isAgentDoesNotExist: boolean;
    readonly isNotEnoughStakeToWithdraw: boolean;
    readonly isNotEnoughBalanceToStake: boolean;
    readonly isTooManyAgentRegistrationsThisBlock: boolean;
    readonly isTooManyAgentRegistrationsThisInterval: boolean;
    readonly isAgentAlreadyRegistered: boolean;
    readonly isCouldNotConvertToBalance: boolean;
    readonly isBalanceNotAdded: boolean;
    readonly isStakeNotRemoved: boolean;
    readonly isInvalidShares: boolean;
    readonly isNotEnoughBalanceToRegisterAgent: boolean;
    readonly isStakeNotAdded: boolean;
    readonly isBalanceNotRemoved: boolean;
    readonly isBalanceCouldNotBeRemoved: boolean;
    readonly isNotEnoughStakeToRegister: boolean;
    readonly isStillRegistered: boolean;
    readonly isNotEnoughBalanceToTransfer: boolean;
    readonly isInvalidAgentMetadata: boolean;
    readonly isAgentMetadataTooLong: boolean;
    readonly isAgentMetadataTooShort: boolean;
    readonly isInvalidMinBurn: boolean;
    readonly isInvalidMaxBurn: boolean;
    readonly isAgentNameTooLong: boolean;
    readonly isAgentNameTooShort: boolean;
    readonly isInvalidAgentName: boolean;
    readonly isAgentUrlTooLong: boolean;
    readonly isAgentUrlTooShort: boolean;
    readonly isInvalidAgentUrl: boolean;
    readonly isAgentNameAlreadyExists: boolean;
    readonly isStakeTooSmall: boolean;
    readonly isAgentKeyNotWhitelisted: boolean;
    readonly isInvalidAmount: boolean;
    readonly isInvalidStakingFee: boolean;
    readonly isInvalidWeightControlFee: boolean;
    readonly isAgentUpdateOnCooldown: boolean;
    readonly isInvalidNamespacePath: boolean;
    readonly isNamespaceAlreadyExists: boolean;
    readonly isNamespaceNotFound: boolean;
    readonly isParentNamespaceNotFound: boolean;
    readonly isNotNamespaceOwner: boolean;
    readonly isNamespaceHasChildren: boolean;
    readonly isNamespaceDepthExceeded: boolean;
    readonly isNamespaceBeingDelegated: boolean;
    readonly isAgentsFrozen: boolean;
    readonly isNamespacesFrozen: boolean;
    readonly type: 'AgentDoesNotExist' | 'NotEnoughStakeToWithdraw' | 'NotEnoughBalanceToStake' | 'TooManyAgentRegistrationsThisBlock' | 'TooManyAgentRegistrationsThisInterval' | 'AgentAlreadyRegistered' | 'CouldNotConvertToBalance' | 'BalanceNotAdded' | 'StakeNotRemoved' | 'InvalidShares' | 'NotEnoughBalanceToRegisterAgent' | 'StakeNotAdded' | 'BalanceNotRemoved' | 'BalanceCouldNotBeRemoved' | 'NotEnoughStakeToRegister' | 'StillRegistered' | 'NotEnoughBalanceToTransfer' | 'InvalidAgentMetadata' | 'AgentMetadataTooLong' | 'AgentMetadataTooShort' | 'InvalidMinBurn' | 'InvalidMaxBurn' | 'AgentNameTooLong' | 'AgentNameTooShort' | 'InvalidAgentName' | 'AgentUrlTooLong' | 'AgentUrlTooShort' | 'InvalidAgentUrl' | 'AgentNameAlreadyExists' | 'StakeTooSmall' | 'AgentKeyNotWhitelisted' | 'InvalidAmount' | 'InvalidStakingFee' | 'InvalidWeightControlFee' | 'AgentUpdateOnCooldown' | 'InvalidNamespacePath' | 'NamespaceAlreadyExists' | 'NamespaceNotFound' | 'ParentNamespaceNotFound' | 'NotNamespaceOwner' | 'NamespaceHasChildren' | 'NamespaceDepthExceeded' | 'NamespaceBeingDelegated' | 'AgentsFrozen' | 'NamespacesFrozen';
  }

  /** @name PalletEmission0ConsensusMember (243) */
  interface PalletEmission0ConsensusMember extends Struct {
    readonly weights: Vec<ITuple<[AccountId32, u16]>>;
    readonly lastIncentives: u16;
    readonly lastDividends: u16;
  }

  /** @name PalletEmission0Error (246) */
  interface PalletEmission0Error extends Enum {
    readonly isWeightSetTooLarge: boolean;
    readonly isAgentIsNotRegistered: boolean;
    readonly isCannotSetWeightsForSelf: boolean;
    readonly isCannotSetWeightsWhileDelegating: boolean;
    readonly isCannotDelegateWeightControlToSelf: boolean;
    readonly isAgentIsNotDelegating: boolean;
    readonly isNotEnoughStakeToSetWeights: boolean;
    readonly isWeightControlNotEnabled: boolean;
    readonly type: 'WeightSetTooLarge' | 'AgentIsNotRegistered' | 'CannotSetWeightsForSelf' | 'CannotSetWeightsWhileDelegating' | 'CannotDelegateWeightControlToSelf' | 'AgentIsNotDelegating' | 'NotEnoughStakeToSetWeights' | 'WeightControlNotEnabled';
  }

  /** @name PalletPermission0PermissionPermissionContract (247) */
  interface PalletPermission0PermissionPermissionContract extends Struct {
    readonly delegator: AccountId32;
    readonly recipient: AccountId32;
    readonly scope: PalletPermission0PermissionPermissionScope;
    readonly duration: PalletPermission0PermissionPermissionDuration;
    readonly revocation: PalletPermission0PermissionRevocationTerms;
    readonly enforcement: PalletPermission0PermissionEnforcementAuthority;
    readonly lastExecution: Option<u64>;
    readonly executionCount: u32;
    readonly maxInstances: u32;
    readonly children: BTreeSet<H256>;
    readonly createdAt: u64;
  }

  /** @name PalletPermission0PermissionPermissionScope (248) */
  interface PalletPermission0PermissionPermissionScope extends Enum {
    readonly isEmission: boolean;
    readonly asEmission: PalletPermission0PermissionEmissionEmissionScope;
    readonly isCurator: boolean;
    readonly asCurator: PalletPermission0PermissionCuratorCuratorScope;
    readonly isNamespace: boolean;
    readonly asNamespace: PalletPermission0PermissionNamespaceScope;
    readonly type: 'Emission' | 'Curator' | 'Namespace';
  }

  /** @name PalletPermission0PermissionEmissionEmissionScope (249) */
  interface PalletPermission0PermissionEmissionEmissionScope extends Struct {
    readonly allocation: PalletPermission0PermissionEmissionEmissionAllocation;
    readonly distribution: PalletPermission0PermissionEmissionDistributionControl;
    readonly targets: BTreeMap<AccountId32, u16>;
    readonly accumulating: bool;
  }

  /** @name PalletPermission0PermissionCuratorCuratorScope (250) */
  interface PalletPermission0PermissionCuratorCuratorScope extends Struct {
    readonly flags: u32;
    readonly cooldown: Option<u64>;
  }

  /** @name PalletPermission0PermissionNamespaceScope (252) */
  interface PalletPermission0PermissionNamespaceScope extends Struct {
    readonly paths: BTreeMap<Option<H256>, BTreeSet<Bytes>>;
  }

  /** @name PalletPermission0Error (267) */
  interface PalletPermission0Error extends Enum {
    readonly isNotRegisteredAgent: boolean;
    readonly isPermissionCreationOutsideExtrinsic: boolean;
    readonly isDuplicatePermissionInBlock: boolean;
    readonly isPermissionNotFound: boolean;
    readonly isSelfPermissionNotAllowed: boolean;
    readonly isInvalidPercentage: boolean;
    readonly isInvalidTargetWeight: boolean;
    readonly isNoTargetsSpecified: boolean;
    readonly isInvalidThreshold: boolean;
    readonly isNoAccumulatedAmount: boolean;
    readonly isNotAuthorizedToRevoke: boolean;
    readonly isTotalAllocationExceeded: boolean;
    readonly isNotPermissionRecipient: boolean;
    readonly isNotPermissionDelegator: boolean;
    readonly isTooManyStreams: boolean;
    readonly isTooManyTargets: boolean;
    readonly isTooManyRevokers: boolean;
    readonly isStorageError: boolean;
    readonly isInvalidAmount: boolean;
    readonly isInsufficientBalance: boolean;
    readonly isInvalidInterval: boolean;
    readonly isParentPermissionNotFound: boolean;
    readonly isInvalidDistributionMethod: boolean;
    readonly isInvalidNumberOfRevokers: boolean;
    readonly isFixedAmountCanOnlyBeTriggeredOnce: boolean;
    readonly isUnsupportedPermissionType: boolean;
    readonly isNotAuthorizedToToggle: boolean;
    readonly isTooManyControllers: boolean;
    readonly isInvalidNumberOfControllers: boolean;
    readonly isDuplicatePermission: boolean;
    readonly isPermissionInCooldown: boolean;
    readonly isInvalidCuratorPermissions: boolean;
    readonly isNamespaceDoesNotExist: boolean;
    readonly isNamespacePathIsInvalid: boolean;
    readonly isTooManyNamespaces: boolean;
    readonly isNotAuthorizedToEdit: boolean;
    readonly isNotEditable: boolean;
    readonly isNamespaceCreationDisabled: boolean;
    readonly isMultiParentForbidden: boolean;
    readonly isNotEnoughInstances: boolean;
    readonly isTooManyChildren: boolean;
    readonly isRevocationTermsTooStrong: boolean;
    readonly type: 'NotRegisteredAgent' | 'PermissionCreationOutsideExtrinsic' | 'DuplicatePermissionInBlock' | 'PermissionNotFound' | 'SelfPermissionNotAllowed' | 'InvalidPercentage' | 'InvalidTargetWeight' | 'NoTargetsSpecified' | 'InvalidThreshold' | 'NoAccumulatedAmount' | 'NotAuthorizedToRevoke' | 'TotalAllocationExceeded' | 'NotPermissionRecipient' | 'NotPermissionDelegator' | 'TooManyStreams' | 'TooManyTargets' | 'TooManyRevokers' | 'StorageError' | 'InvalidAmount' | 'InsufficientBalance' | 'InvalidInterval' | 'ParentPermissionNotFound' | 'InvalidDistributionMethod' | 'InvalidNumberOfRevokers' | 'FixedAmountCanOnlyBeTriggeredOnce' | 'UnsupportedPermissionType' | 'NotAuthorizedToToggle' | 'TooManyControllers' | 'InvalidNumberOfControllers' | 'DuplicatePermission' | 'PermissionInCooldown' | 'InvalidCuratorPermissions' | 'NamespaceDoesNotExist' | 'NamespacePathIsInvalid' | 'TooManyNamespaces' | 'NotAuthorizedToEdit' | 'NotEditable' | 'NamespaceCreationDisabled' | 'MultiParentForbidden' | 'NotEnoughInstances' | 'TooManyChildren' | 'RevocationTermsTooStrong';
  }

  /** @name PalletFaucetError (268) */
  interface PalletFaucetError extends Enum {
    readonly isInvalidWorkBlock: boolean;
    readonly isInvalidDifficulty: boolean;
    readonly isInvalidSeal: boolean;
    readonly type: 'InvalidWorkBlock' | 'InvalidDifficulty' | 'InvalidSeal';
  }

  /** @name SpRuntimeMultiSignature (270) */
  interface SpRuntimeMultiSignature extends Enum {
    readonly isEd25519: boolean;
    readonly asEd25519: U8aFixed;
    readonly isSr25519: boolean;
    readonly asSr25519: U8aFixed;
    readonly isEcdsa: boolean;
    readonly asEcdsa: U8aFixed;
    readonly type: 'Ed25519' | 'Sr25519' | 'Ecdsa';
  }

  /** @name FrameSystemExtensionsCheckNonZeroSender (273) */
  type FrameSystemExtensionsCheckNonZeroSender = Null;

  /** @name FrameSystemExtensionsCheckSpecVersion (274) */
  type FrameSystemExtensionsCheckSpecVersion = Null;

  /** @name FrameSystemExtensionsCheckTxVersion (275) */
  type FrameSystemExtensionsCheckTxVersion = Null;

  /** @name FrameSystemExtensionsCheckGenesis (276) */
  type FrameSystemExtensionsCheckGenesis = Null;

  /** @name FrameSystemExtensionsCheckNonce (279) */
  interface FrameSystemExtensionsCheckNonce extends Compact<u32> {}

  /** @name FrameSystemExtensionsCheckWeight (280) */
  type FrameSystemExtensionsCheckWeight = Null;

  /** @name PalletTransactionPaymentChargeTransactionPayment (281) */
  interface PalletTransactionPaymentChargeTransactionPayment extends Compact<u128> {}

  /** @name FrameMetadataHashExtensionCheckMetadataHash (282) */
  interface FrameMetadataHashExtensionCheckMetadataHash extends Struct {
    readonly mode: FrameMetadataHashExtensionMode;
  }

  /** @name FrameMetadataHashExtensionMode (283) */
  interface FrameMetadataHashExtensionMode extends Enum {
    readonly isDisabled: boolean;
    readonly isEnabled: boolean;
    readonly type: 'Disabled' | 'Enabled';
  }

  /** @name TorusRuntimeRuntime (286) */
  type TorusRuntimeRuntime = Null;

} // declare module
