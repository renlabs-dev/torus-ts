// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

// import type lookup before we augment - in some environments
// this is required to allow for ambient/previous definitions
import '@polkadot/types/lookup';

import type { BTreeMap, BTreeSet, Bytes, Compact, Enum, Null, Option, Result, Struct, Text, U256, U8aFixed, Vec, bool, u128, u16, u32, u64, u8 } from '@polkadot/types-codec';
import type { ITuple } from '@polkadot/types-codec/types';
import type { AccountId32, Call, H160, H256, MultiAddress, Percent, Permill } from '@polkadot/types/interfaces/runtime';
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
    readonly free: u64;
    readonly reserved: u64;
    readonly frozen: u64;
    readonly flags: u128;
  }

  /** @name FrameSupportDispatchPerDispatchClassWeight (10) */
  interface FrameSupportDispatchPerDispatchClassWeight extends Struct {
    readonly normal: SpWeightsWeightV2Weight;
    readonly operational: SpWeightsWeightV2Weight;
    readonly mandatory: SpWeightsWeightV2Weight;
  }

  /** @name SpWeightsWeightV2Weight (11) */
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
    readonly isUpgradeAuthorized: boolean;
    readonly asUpgradeAuthorized: {
      readonly codeHash: H256;
      readonly checkVersion: bool;
    } & Struct;
    readonly type: 'ExtrinsicSuccess' | 'ExtrinsicFailed' | 'CodeUpdated' | 'NewAccount' | 'KilledAccount' | 'Remarked' | 'UpgradeAuthorized';
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

  /** @name PalletGrandpaEvent (31) */
  interface PalletGrandpaEvent extends Enum {
    readonly isNewAuthorities: boolean;
    readonly asNewAuthorities: {
      readonly authoritySet: Vec<ITuple<[SpConsensusGrandpaAppPublic, u64]>>;
    } & Struct;
    readonly isPaused: boolean;
    readonly isResumed: boolean;
    readonly type: 'NewAuthorities' | 'Paused' | 'Resumed';
  }

  /** @name SpConsensusGrandpaAppPublic (34) */
  interface SpConsensusGrandpaAppPublic extends U8aFixed {}

  /** @name PalletBalancesEvent (35) */
  interface PalletBalancesEvent extends Enum {
    readonly isEndowed: boolean;
    readonly asEndowed: {
      readonly account: AccountId32;
      readonly freeBalance: u64;
    } & Struct;
    readonly isDustLost: boolean;
    readonly asDustLost: {
      readonly account: AccountId32;
      readonly amount: u64;
    } & Struct;
    readonly isTransfer: boolean;
    readonly asTransfer: {
      readonly from: AccountId32;
      readonly to: AccountId32;
      readonly amount: u64;
    } & Struct;
    readonly isBalanceSet: boolean;
    readonly asBalanceSet: {
      readonly who: AccountId32;
      readonly free: u64;
    } & Struct;
    readonly isReserved: boolean;
    readonly asReserved: {
      readonly who: AccountId32;
      readonly amount: u64;
    } & Struct;
    readonly isUnreserved: boolean;
    readonly asUnreserved: {
      readonly who: AccountId32;
      readonly amount: u64;
    } & Struct;
    readonly isReserveRepatriated: boolean;
    readonly asReserveRepatriated: {
      readonly from: AccountId32;
      readonly to: AccountId32;
      readonly amount: u64;
      readonly destinationStatus: FrameSupportTokensMiscBalanceStatus;
    } & Struct;
    readonly isDeposit: boolean;
    readonly asDeposit: {
      readonly who: AccountId32;
      readonly amount: u64;
    } & Struct;
    readonly isWithdraw: boolean;
    readonly asWithdraw: {
      readonly who: AccountId32;
      readonly amount: u64;
    } & Struct;
    readonly isSlashed: boolean;
    readonly asSlashed: {
      readonly who: AccountId32;
      readonly amount: u64;
    } & Struct;
    readonly isMinted: boolean;
    readonly asMinted: {
      readonly who: AccountId32;
      readonly amount: u64;
    } & Struct;
    readonly isBurned: boolean;
    readonly asBurned: {
      readonly who: AccountId32;
      readonly amount: u64;
    } & Struct;
    readonly isSuspended: boolean;
    readonly asSuspended: {
      readonly who: AccountId32;
      readonly amount: u64;
    } & Struct;
    readonly isRestored: boolean;
    readonly asRestored: {
      readonly who: AccountId32;
      readonly amount: u64;
    } & Struct;
    readonly isUpgraded: boolean;
    readonly asUpgraded: {
      readonly who: AccountId32;
    } & Struct;
    readonly isIssued: boolean;
    readonly asIssued: {
      readonly amount: u64;
    } & Struct;
    readonly isRescinded: boolean;
    readonly asRescinded: {
      readonly amount: u64;
    } & Struct;
    readonly isLocked: boolean;
    readonly asLocked: {
      readonly who: AccountId32;
      readonly amount: u64;
    } & Struct;
    readonly isUnlocked: boolean;
    readonly asUnlocked: {
      readonly who: AccountId32;
      readonly amount: u64;
    } & Struct;
    readonly isFrozen: boolean;
    readonly asFrozen: {
      readonly who: AccountId32;
      readonly amount: u64;
    } & Struct;
    readonly isThawed: boolean;
    readonly asThawed: {
      readonly who: AccountId32;
      readonly amount: u64;
    } & Struct;
    readonly isTotalIssuanceForced: boolean;
    readonly asTotalIssuanceForced: {
      readonly old: u64;
      readonly new_: u64;
    } & Struct;
    readonly type: 'Endowed' | 'DustLost' | 'Transfer' | 'BalanceSet' | 'Reserved' | 'Unreserved' | 'ReserveRepatriated' | 'Deposit' | 'Withdraw' | 'Slashed' | 'Minted' | 'Burned' | 'Suspended' | 'Restored' | 'Upgraded' | 'Issued' | 'Rescinded' | 'Locked' | 'Unlocked' | 'Frozen' | 'Thawed' | 'TotalIssuanceForced';
  }

  /** @name FrameSupportTokensMiscBalanceStatus (36) */
  interface FrameSupportTokensMiscBalanceStatus extends Enum {
    readonly isFree: boolean;
    readonly isReserved: boolean;
    readonly type: 'Free' | 'Reserved';
  }

  /** @name PalletTransactionPaymentEvent (37) */
  interface PalletTransactionPaymentEvent extends Enum {
    readonly isTransactionFeePaid: boolean;
    readonly asTransactionFeePaid: {
      readonly who: AccountId32;
      readonly actualFee: u64;
      readonly tip: u64;
    } & Struct;
    readonly type: 'TransactionFeePaid';
  }

  /** @name PalletSudoEvent (38) */
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

  /** @name PalletMultisigEvent (42) */
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

  /** @name PalletMultisigTimepoint (43) */
  interface PalletMultisigTimepoint extends Struct {
    readonly height: u64;
    readonly index: u32;
  }

  /** @name PalletUtilityEvent (44) */
  interface PalletUtilityEvent extends Enum {
    readonly isBatchInterrupted: boolean;
    readonly asBatchInterrupted: {
      readonly index: u32;
      readonly error: SpRuntimeDispatchError;
    } & Struct;
    readonly isBatchCompleted: boolean;
    readonly isBatchCompletedWithErrors: boolean;
    readonly isItemCompleted: boolean;
    readonly isItemFailed: boolean;
    readonly asItemFailed: {
      readonly error: SpRuntimeDispatchError;
    } & Struct;
    readonly isDispatchedAs: boolean;
    readonly asDispatchedAs: {
      readonly result: Result<Null, SpRuntimeDispatchError>;
    } & Struct;
    readonly type: 'BatchInterrupted' | 'BatchCompleted' | 'BatchCompletedWithErrors' | 'ItemCompleted' | 'ItemFailed' | 'DispatchedAs';
  }

  /** @name PalletSubspaceEvent (45) */
  interface PalletSubspaceEvent extends Enum {
    readonly isNetworkAdded: boolean;
    readonly asNetworkAdded: ITuple<[u16, Bytes]>;
    readonly isNetworkRemoved: boolean;
    readonly asNetworkRemoved: u16;
    readonly isStakeAdded: boolean;
    readonly asStakeAdded: ITuple<[AccountId32, AccountId32, u64]>;
    readonly isStakeRemoved: boolean;
    readonly asStakeRemoved: ITuple<[AccountId32, AccountId32, u64]>;
    readonly isWeightsSet: boolean;
    readonly asWeightsSet: ITuple<[u16, u16]>;
    readonly isModuleRegistered: boolean;
    readonly asModuleRegistered: ITuple<[u16, u16, AccountId32]>;
    readonly isModuleDeregistered: boolean;
    readonly asModuleDeregistered: ITuple<[u16, u16, AccountId32]>;
    readonly isModuleUpdated: boolean;
    readonly asModuleUpdated: ITuple<[u16, AccountId32]>;
    readonly isGlobalParamsUpdated: boolean;
    readonly asGlobalParamsUpdated: PalletSubspaceGlobalParams;
    readonly isSubnetParamsUpdated: boolean;
    readonly asSubnetParamsUpdated: u16;
    readonly type: 'NetworkAdded' | 'NetworkRemoved' | 'StakeAdded' | 'StakeRemoved' | 'WeightsSet' | 'ModuleRegistered' | 'ModuleDeregistered' | 'ModuleUpdated' | 'GlobalParamsUpdated' | 'SubnetParamsUpdated';
  }

  /** @name PalletSubspaceGlobalParams (47) */
  interface PalletSubspaceGlobalParams extends Struct {
    readonly maxNameLength: u16;
    readonly minNameLength: u16;
    readonly maxAllowedSubnets: u16;
    readonly maxAllowedModules: u16;
    readonly maxRegistrationsPerBlock: u16;
    readonly maxAllowedWeights: u16;
    readonly floorDelegationFee: Percent;
    readonly floorFounderShare: u8;
    readonly minWeightStake: u64;
    readonly curator: AccountId32;
    readonly generalSubnetApplicationCost: u64;
    readonly subnetImmunityPeriod: u64;
    readonly governanceConfig: PalletGovernanceApiGovernanceConfiguration;
    readonly kappa: u16;
    readonly rho: u16;
  }

  /** @name PalletGovernanceApiGovernanceConfiguration (49) */
  interface PalletGovernanceApiGovernanceConfiguration extends Struct {
    readonly proposalCost: u64;
    readonly proposalExpiration: u32;
    readonly voteMode: PalletGovernanceApiVoteMode;
    readonly proposalRewardTreasuryAllocation: Percent;
    readonly maxProposalRewardTreasuryAllocation: u64;
    readonly proposalRewardInterval: u64;
  }

  /** @name PalletGovernanceApiVoteMode (50) */
  interface PalletGovernanceApiVoteMode extends Enum {
    readonly isAuthority: boolean;
    readonly isVote: boolean;
    readonly type: 'Authority' | 'Vote';
  }

  /** @name PalletGovernanceEvent (51) */
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
    readonly isWhitelistModuleAdded: boolean;
    readonly asWhitelistModuleAdded: AccountId32;
    readonly isWhitelistModuleRemoved: boolean;
    readonly asWhitelistModuleRemoved: AccountId32;
    readonly isApplicationCreated: boolean;
    readonly asApplicationCreated: u64;
    readonly type: 'ProposalCreated' | 'ProposalAccepted' | 'ProposalRefused' | 'ProposalExpired' | 'ProposalVoted' | 'ProposalVoteUnregistered' | 'WhitelistModuleAdded' | 'WhitelistModuleRemoved' | 'ApplicationCreated';
  }

  /** @name PalletSubnetEmissionEvent (52) */
  interface PalletSubnetEmissionEvent extends Enum {
    readonly isEpochFinished: boolean;
    readonly asEpochFinished: u16;
    readonly type: 'EpochFinished';
  }

  /** @name PalletEvmEvent (53) */
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

  /** @name EthereumLog (54) */
  interface EthereumLog extends Struct {
    readonly address: H160;
    readonly topics: Vec<H256>;
    readonly data: Bytes;
  }

  /** @name PalletEthereumEvent (58) */
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

  /** @name EvmCoreErrorExitReason (59) */
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

  /** @name EvmCoreErrorExitSucceed (60) */
  interface EvmCoreErrorExitSucceed extends Enum {
    readonly isStopped: boolean;
    readonly isReturned: boolean;
    readonly isSuicided: boolean;
    readonly type: 'Stopped' | 'Returned' | 'Suicided';
  }

  /** @name EvmCoreErrorExitError (61) */
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

  /** @name EvmCoreErrorExitRevert (65) */
  interface EvmCoreErrorExitRevert extends Enum {
    readonly isReverted: boolean;
    readonly type: 'Reverted';
  }

  /** @name EvmCoreErrorExitFatal (66) */
  interface EvmCoreErrorExitFatal extends Enum {
    readonly isNotSupported: boolean;
    readonly isUnhandledInterrupt: boolean;
    readonly isCallErrorAsFatal: boolean;
    readonly asCallErrorAsFatal: EvmCoreErrorExitError;
    readonly isOther: boolean;
    readonly asOther: Text;
    readonly type: 'NotSupported' | 'UnhandledInterrupt' | 'CallErrorAsFatal' | 'Other';
  }

  /** @name PalletBaseFeeEvent (67) */
  interface PalletBaseFeeEvent extends Enum {
    readonly isNewBaseFeePerGas: boolean;
    readonly asNewBaseFeePerGas: {
      readonly fee: U256;
    } & Struct;
    readonly isBaseFeeOverflow: boolean;
    readonly isNewElasticity: boolean;
    readonly asNewElasticity: {
      readonly elasticity: Permill;
    } & Struct;
    readonly type: 'NewBaseFeePerGas' | 'BaseFeeOverflow' | 'NewElasticity';
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
    readonly type: 'Remark' | 'SetHeapPages' | 'SetCode' | 'SetCodeWithoutChecks' | 'SetStorage' | 'KillStorage' | 'KillPrefix' | 'RemarkWithEvent' | 'AuthorizeUpgrade' | 'AuthorizeUpgradeWithoutChecks' | 'ApplyAuthorizedUpgrade';
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

  /** @name FrameSystemError (93) */
  interface FrameSystemError extends Enum {
    readonly isInvalidSpecName: boolean;
    readonly isSpecVersionNeedsToIncrease: boolean;
    readonly isFailedToExtractRuntimeVersion: boolean;
    readonly isNonDefaultComposite: boolean;
    readonly isNonZeroRefCount: boolean;
    readonly isCallFiltered: boolean;
    readonly isMultiBlockMigrationsOngoing: boolean;
    readonly isNothingAuthorized: boolean;
    readonly isUnauthorized: boolean;
    readonly type: 'InvalidSpecName' | 'SpecVersionNeedsToIncrease' | 'FailedToExtractRuntimeVersion' | 'NonDefaultComposite' | 'NonZeroRefCount' | 'CallFiltered' | 'MultiBlockMigrationsOngoing' | 'NothingAuthorized' | 'Unauthorized';
  }

  /** @name PalletTimestampCall (94) */
  interface PalletTimestampCall extends Enum {
    readonly isSet: boolean;
    readonly asSet: {
      readonly now: Compact<u64>;
    } & Struct;
    readonly type: 'Set';
  }

  /** @name SpConsensusAuraSr25519AppSr25519Public (96) */
  interface SpConsensusAuraSr25519AppSr25519Public extends U8aFixed {}

  /** @name PalletGrandpaStoredState (99) */
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

  /** @name PalletGrandpaStoredPendingChange (100) */
  interface PalletGrandpaStoredPendingChange extends Struct {
    readonly scheduledAt: u64;
    readonly delay: u64;
    readonly nextAuthorities: Vec<ITuple<[SpConsensusGrandpaAppPublic, u64]>>;
    readonly forced: Option<u64>;
  }

  /** @name PalletGrandpaCall (104) */
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

  /** @name SpConsensusGrandpaEquivocationProof (105) */
  interface SpConsensusGrandpaEquivocationProof extends Struct {
    readonly setId: u64;
    readonly equivocation: SpConsensusGrandpaEquivocation;
  }

  /** @name SpConsensusGrandpaEquivocation (106) */
  interface SpConsensusGrandpaEquivocation extends Enum {
    readonly isPrevote: boolean;
    readonly asPrevote: FinalityGrandpaEquivocationPrevote;
    readonly isPrecommit: boolean;
    readonly asPrecommit: FinalityGrandpaEquivocationPrecommit;
    readonly type: 'Prevote' | 'Precommit';
  }

  /** @name FinalityGrandpaEquivocationPrevote (107) */
  interface FinalityGrandpaEquivocationPrevote extends Struct {
    readonly roundNumber: u64;
    readonly identity: SpConsensusGrandpaAppPublic;
    readonly first: ITuple<[FinalityGrandpaPrevote, SpConsensusGrandpaAppSignature]>;
    readonly second: ITuple<[FinalityGrandpaPrevote, SpConsensusGrandpaAppSignature]>;
  }

  /** @name FinalityGrandpaPrevote (108) */
  interface FinalityGrandpaPrevote extends Struct {
    readonly targetHash: H256;
    readonly targetNumber: u64;
  }

  /** @name SpConsensusGrandpaAppSignature (109) */
  interface SpConsensusGrandpaAppSignature extends U8aFixed {}

  /** @name FinalityGrandpaEquivocationPrecommit (112) */
  interface FinalityGrandpaEquivocationPrecommit extends Struct {
    readonly roundNumber: u64;
    readonly identity: SpConsensusGrandpaAppPublic;
    readonly first: ITuple<[FinalityGrandpaPrecommit, SpConsensusGrandpaAppSignature]>;
    readonly second: ITuple<[FinalityGrandpaPrecommit, SpConsensusGrandpaAppSignature]>;
  }

  /** @name FinalityGrandpaPrecommit (113) */
  interface FinalityGrandpaPrecommit extends Struct {
    readonly targetHash: H256;
    readonly targetNumber: u64;
  }

  /** @name SpCoreVoid (115) */
  type SpCoreVoid = Null;

  /** @name PalletGrandpaError (116) */
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

  /** @name PalletBalancesBalanceLock (118) */
  interface PalletBalancesBalanceLock extends Struct {
    readonly id: U8aFixed;
    readonly amount: u64;
    readonly reasons: PalletBalancesReasons;
  }

  /** @name PalletBalancesReasons (119) */
  interface PalletBalancesReasons extends Enum {
    readonly isFee: boolean;
    readonly isMisc: boolean;
    readonly isAll: boolean;
    readonly type: 'Fee' | 'Misc' | 'All';
  }

  /** @name PalletBalancesReserveData (122) */
  interface PalletBalancesReserveData extends Struct {
    readonly id: U8aFixed;
    readonly amount: u64;
  }

  /** @name PalletBalancesIdAmount (125) */
  interface PalletBalancesIdAmount extends Struct {
    readonly id: Null;
    readonly amount: u64;
  }

  /** @name PalletBalancesCall (128) */
  interface PalletBalancesCall extends Enum {
    readonly isTransferAllowDeath: boolean;
    readonly asTransferAllowDeath: {
      readonly dest: MultiAddress;
      readonly value: Compact<u64>;
    } & Struct;
    readonly isForceTransfer: boolean;
    readonly asForceTransfer: {
      readonly source: MultiAddress;
      readonly dest: MultiAddress;
      readonly value: Compact<u64>;
    } & Struct;
    readonly isTransferKeepAlive: boolean;
    readonly asTransferKeepAlive: {
      readonly dest: MultiAddress;
      readonly value: Compact<u64>;
    } & Struct;
    readonly isTransferAll: boolean;
    readonly asTransferAll: {
      readonly dest: MultiAddress;
      readonly keepAlive: bool;
    } & Struct;
    readonly isForceUnreserve: boolean;
    readonly asForceUnreserve: {
      readonly who: MultiAddress;
      readonly amount: u64;
    } & Struct;
    readonly isUpgradeAccounts: boolean;
    readonly asUpgradeAccounts: {
      readonly who: Vec<AccountId32>;
    } & Struct;
    readonly isForceSetBalance: boolean;
    readonly asForceSetBalance: {
      readonly who: MultiAddress;
      readonly newFree: Compact<u64>;
    } & Struct;
    readonly isForceAdjustTotalIssuance: boolean;
    readonly asForceAdjustTotalIssuance: {
      readonly direction: PalletBalancesAdjustmentDirection;
      readonly delta: Compact<u64>;
    } & Struct;
    readonly type: 'TransferAllowDeath' | 'ForceTransfer' | 'TransferKeepAlive' | 'TransferAll' | 'ForceUnreserve' | 'UpgradeAccounts' | 'ForceSetBalance' | 'ForceAdjustTotalIssuance';
  }

  /** @name PalletBalancesAdjustmentDirection (132) */
  interface PalletBalancesAdjustmentDirection extends Enum {
    readonly isIncrease: boolean;
    readonly isDecrease: boolean;
    readonly type: 'Increase' | 'Decrease';
  }

  /** @name PalletBalancesError (133) */
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

  /** @name PalletTransactionPaymentReleases (135) */
  interface PalletTransactionPaymentReleases extends Enum {
    readonly isV1Ancient: boolean;
    readonly isV2: boolean;
    readonly type: 'V1Ancient' | 'V2';
  }

  /** @name PalletSudoCall (136) */
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

  /** @name PalletMultisigCall (138) */
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

  /** @name PalletUtilityCall (140) */
  interface PalletUtilityCall extends Enum {
    readonly isBatch: boolean;
    readonly asBatch: {
      readonly calls: Vec<Call>;
    } & Struct;
    readonly isAsDerivative: boolean;
    readonly asAsDerivative: {
      readonly index: u16;
      readonly call: Call;
    } & Struct;
    readonly isBatchAll: boolean;
    readonly asBatchAll: {
      readonly calls: Vec<Call>;
    } & Struct;
    readonly isDispatchAs: boolean;
    readonly asDispatchAs: {
      readonly asOrigin: NodeSubspaceRuntimeOriginCaller;
      readonly call: Call;
    } & Struct;
    readonly isForceBatch: boolean;
    readonly asForceBatch: {
      readonly calls: Vec<Call>;
    } & Struct;
    readonly isWithWeight: boolean;
    readonly asWithWeight: {
      readonly call: Call;
      readonly weight: SpWeightsWeightV2Weight;
    } & Struct;
    readonly type: 'Batch' | 'AsDerivative' | 'BatchAll' | 'DispatchAs' | 'ForceBatch' | 'WithWeight';
  }

  /** @name NodeSubspaceRuntimeOriginCaller (142) */
  interface NodeSubspaceRuntimeOriginCaller extends Enum {
    readonly isSystem: boolean;
    readonly asSystem: FrameSupportDispatchRawOrigin;
    readonly isVoid: boolean;
    readonly isEthereum: boolean;
    readonly asEthereum: PalletEthereumRawOrigin;
    readonly type: 'System' | 'Void' | 'Ethereum';
  }

  /** @name FrameSupportDispatchRawOrigin (143) */
  interface FrameSupportDispatchRawOrigin extends Enum {
    readonly isRoot: boolean;
    readonly isSigned: boolean;
    readonly asSigned: AccountId32;
    readonly isNone: boolean;
    readonly type: 'Root' | 'Signed' | 'None';
  }

  /** @name PalletEthereumRawOrigin (144) */
  interface PalletEthereumRawOrigin extends Enum {
    readonly isEthereumTransaction: boolean;
    readonly asEthereumTransaction: H160;
    readonly type: 'EthereumTransaction';
  }

  /** @name PalletSubspaceCall (145) */
  interface PalletSubspaceCall extends Enum {
    readonly isSetWeights: boolean;
    readonly asSetWeights: {
      readonly netuid: u16;
      readonly uids: Vec<u16>;
      readonly weights: Vec<u16>;
    } & Struct;
    readonly isAddStake: boolean;
    readonly asAddStake: {
      readonly moduleKey: AccountId32;
      readonly amount: u64;
    } & Struct;
    readonly isRemoveStake: boolean;
    readonly asRemoveStake: {
      readonly moduleKey: AccountId32;
      readonly amount: u64;
    } & Struct;
    readonly isAddStakeMultiple: boolean;
    readonly asAddStakeMultiple: {
      readonly moduleKeys: Vec<AccountId32>;
      readonly amounts: Vec<u64>;
    } & Struct;
    readonly isRemoveStakeMultiple: boolean;
    readonly asRemoveStakeMultiple: {
      readonly moduleKeys: Vec<AccountId32>;
      readonly amounts: Vec<u64>;
    } & Struct;
    readonly isTransferStake: boolean;
    readonly asTransferStake: {
      readonly moduleKey: AccountId32;
      readonly newModuleKey: AccountId32;
      readonly amount: u64;
    } & Struct;
    readonly isTransferMultiple: boolean;
    readonly asTransferMultiple: {
      readonly destinations: Vec<AccountId32>;
      readonly amounts: Vec<u64>;
    } & Struct;
    readonly isRegister: boolean;
    readonly asRegister: {
      readonly networkName: Bytes;
      readonly name: Bytes;
      readonly address: Bytes;
      readonly moduleKey: AccountId32;
      readonly metadata: Option<Bytes>;
    } & Struct;
    readonly isDeregister: boolean;
    readonly asDeregister: {
      readonly netuid: u16;
    } & Struct;
    readonly isUpdateModule: boolean;
    readonly asUpdateModule: {
      readonly netuid: u16;
      readonly name: Bytes;
      readonly address: Bytes;
      readonly delegationFee: Option<Percent>;
      readonly metadata: Option<Bytes>;
    } & Struct;
    readonly isUpdateSubnet: boolean;
    readonly asUpdateSubnet: {
      readonly netuid: u16;
      readonly founder: AccountId32;
      readonly founderShare: u16;
      readonly name: Bytes;
      readonly metadata: Option<Bytes>;
      readonly immunityPeriod: u16;
      readonly incentiveRatio: u16;
      readonly maxAllowedUids: u16;
      readonly maxAllowedWeights: u16;
      readonly minAllowedWeights: u16;
      readonly maxWeightAge: u64;
      readonly tempo: u16;
      readonly trustRatio: u16;
      readonly maximumSetWeightCallsPerEpoch: u16;
      readonly voteMode: PalletGovernanceApiVoteMode;
      readonly bondsMa: u64;
      readonly moduleBurnConfig: PalletSubspaceGlobalGeneralBurnConfiguration;
      readonly minValidatorStake: u64;
      readonly maxAllowedValidators: Option<u16>;
    } & Struct;
    readonly isDelegateRootnetControl: boolean;
    readonly asDelegateRootnetControl: {
      readonly target: AccountId32;
    } & Struct;
    readonly isRegisterSubnet: boolean;
    readonly asRegisterSubnet: {
      readonly name: Bytes;
      readonly metadata: Option<Bytes>;
    } & Struct;
    readonly type: 'SetWeights' | 'AddStake' | 'RemoveStake' | 'AddStakeMultiple' | 'RemoveStakeMultiple' | 'TransferStake' | 'TransferMultiple' | 'Register' | 'Deregister' | 'UpdateModule' | 'UpdateSubnet' | 'DelegateRootnetControl' | 'RegisterSubnet';
  }

  /** @name PalletSubspaceGlobalGeneralBurnConfiguration (153) */
  interface PalletSubspaceGlobalGeneralBurnConfiguration extends Struct {
    readonly minBurn: u64;
    readonly maxBurn: u64;
    readonly adjustmentAlpha: u64;
    readonly targetRegistrationsInterval: u16;
    readonly targetRegistrationsPerInterval: u16;
    readonly maxRegistrationsPerInterval: u16;
  }

  /** @name PalletGovernanceCall (155) */
  interface PalletGovernanceCall extends Enum {
    readonly isAddGlobalParamsProposal: boolean;
    readonly asAddGlobalParamsProposal: {
      readonly data: Bytes;
      readonly maxNameLength: u16;
      readonly minNameLength: u16;
      readonly maxAllowedSubnets: u16;
      readonly maxAllowedModules: u16;
      readonly maxRegistrationsPerBlock: u16;
      readonly maxAllowedWeights: u16;
      readonly floorDelegationFee: Percent;
      readonly floorFounderShare: u8;
      readonly minWeightStake: u64;
      readonly curator: AccountId32;
      readonly proposalCost: u64;
      readonly proposalExpiration: u32;
      readonly generalSubnetApplicationCost: u64;
      readonly kappa: u16;
      readonly rho: u16;
      readonly subnetImmunityPeriod: u64;
    } & Struct;
    readonly isAddSubnetParamsProposal: boolean;
    readonly asAddSubnetParamsProposal: {
      readonly netuid: u16;
      readonly data: Bytes;
      readonly founder: AccountId32;
      readonly founderShare: u16;
      readonly name: Bytes;
      readonly metadata: Option<Bytes>;
      readonly immunityPeriod: u16;
      readonly incentiveRatio: u16;
      readonly maxAllowedUids: u16;
      readonly maxAllowedWeights: u16;
      readonly minAllowedWeights: u16;
      readonly maxWeightAge: u64;
      readonly tempo: u16;
      readonly trustRatio: u16;
      readonly maximumSetWeightCallsPerEpoch: u16;
      readonly voteMode: PalletGovernanceApiVoteMode;
      readonly bondsMa: u64;
      readonly moduleBurnConfig: PalletSubspaceGlobalGeneralBurnConfiguration;
      readonly minValidatorStake: u64;
      readonly maxAllowedValidators: Option<u16>;
    } & Struct;
    readonly isAddGlobalCustomProposal: boolean;
    readonly asAddGlobalCustomProposal: {
      readonly data: Bytes;
    } & Struct;
    readonly isAddSubnetCustomProposal: boolean;
    readonly asAddSubnetCustomProposal: {
      readonly netuid: u16;
      readonly data: Bytes;
    } & Struct;
    readonly isAddTransferDaoTreasuryProposal: boolean;
    readonly asAddTransferDaoTreasuryProposal: {
      readonly data: Bytes;
      readonly value: u64;
      readonly dest: AccountId32;
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
    readonly isEnableVotePowerDelegation: boolean;
    readonly isDisableVotePowerDelegation: boolean;
    readonly isAddDaoApplication: boolean;
    readonly asAddDaoApplication: {
      readonly applicationKey: AccountId32;
      readonly data: Bytes;
    } & Struct;
    readonly isRefuseDaoApplication: boolean;
    readonly asRefuseDaoApplication: {
      readonly id: u64;
    } & Struct;
    readonly isAddToWhitelist: boolean;
    readonly asAddToWhitelist: {
      readonly moduleKey: AccountId32;
    } & Struct;
    readonly isRemoveFromWhitelist: boolean;
    readonly asRemoveFromWhitelist: {
      readonly moduleKey: AccountId32;
    } & Struct;
    readonly type: 'AddGlobalParamsProposal' | 'AddSubnetParamsProposal' | 'AddGlobalCustomProposal' | 'AddSubnetCustomProposal' | 'AddTransferDaoTreasuryProposal' | 'VoteProposal' | 'RemoveVoteProposal' | 'EnableVotePowerDelegation' | 'DisableVotePowerDelegation' | 'AddDaoApplication' | 'RefuseDaoApplication' | 'AddToWhitelist' | 'RemoveFromWhitelist';
  }

  /** @name PalletEvmCall (156) */
  interface PalletEvmCall extends Enum {
    readonly isWithdraw: boolean;
    readonly asWithdraw: {
      readonly address: H160;
      readonly value: u64;
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

  /** @name PalletEthereumCall (160) */
  interface PalletEthereumCall extends Enum {
    readonly isTransact: boolean;
    readonly asTransact: {
      readonly transaction: EthereumTransactionTransactionV2;
    } & Struct;
    readonly type: 'Transact';
  }

  /** @name EthereumTransactionTransactionV2 (161) */
  interface EthereumTransactionTransactionV2 extends Enum {
    readonly isLegacy: boolean;
    readonly asLegacy: EthereumTransactionLegacyTransaction;
    readonly isEip2930: boolean;
    readonly asEip2930: EthereumTransactionEip2930Transaction;
    readonly isEip1559: boolean;
    readonly asEip1559: EthereumTransactionEip1559Transaction;
    readonly type: 'Legacy' | 'Eip2930' | 'Eip1559';
  }

  /** @name EthereumTransactionLegacyTransaction (162) */
  interface EthereumTransactionLegacyTransaction extends Struct {
    readonly nonce: U256;
    readonly gasPrice: U256;
    readonly gasLimit: U256;
    readonly action: EthereumTransactionTransactionAction;
    readonly value: U256;
    readonly input: Bytes;
    readonly signature: EthereumTransactionTransactionSignature;
  }

  /** @name EthereumTransactionTransactionAction (163) */
  interface EthereumTransactionTransactionAction extends Enum {
    readonly isCall: boolean;
    readonly asCall: H160;
    readonly isCreate: boolean;
    readonly type: 'Call' | 'Create';
  }

  /** @name EthereumTransactionTransactionSignature (164) */
  interface EthereumTransactionTransactionSignature extends Struct {
    readonly v: u64;
    readonly r: H256;
    readonly s: H256;
  }

  /** @name EthereumTransactionEip2930Transaction (166) */
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

  /** @name EthereumTransactionAccessListItem (168) */
  interface EthereumTransactionAccessListItem extends Struct {
    readonly address: H160;
    readonly storageKeys: Vec<H256>;
  }

  /** @name EthereumTransactionEip1559Transaction (169) */
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

  /** @name PalletBaseFeeCall (170) */
  interface PalletBaseFeeCall extends Enum {
    readonly isSetBaseFeePerGas: boolean;
    readonly asSetBaseFeePerGas: {
      readonly fee: U256;
    } & Struct;
    readonly isSetElasticity: boolean;
    readonly asSetElasticity: {
      readonly elasticity: Permill;
    } & Struct;
    readonly type: 'SetBaseFeePerGas' | 'SetElasticity';
  }

  /** @name PalletDynamicFeeCall (171) */
  interface PalletDynamicFeeCall extends Enum {
    readonly isNoteMinGasPriceTarget: boolean;
    readonly asNoteMinGasPriceTarget: {
      readonly target: U256;
    } & Struct;
    readonly type: 'NoteMinGasPriceTarget';
  }

  /** @name PalletSudoError (172) */
  interface PalletSudoError extends Enum {
    readonly isRequireSudo: boolean;
    readonly type: 'RequireSudo';
  }

  /** @name PalletMultisigMultisig (174) */
  interface PalletMultisigMultisig extends Struct {
    readonly when: PalletMultisigTimepoint;
    readonly deposit: u64;
    readonly depositor: AccountId32;
    readonly approvals: Vec<AccountId32>;
  }

  /** @name PalletMultisigError (176) */
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

  /** @name PalletUtilityError (177) */
  interface PalletUtilityError extends Enum {
    readonly isTooManyCalls: boolean;
    readonly type: 'TooManyCalls';
  }

  /** @name FrameSupportPalletId (184) */
  interface FrameSupportPalletId extends U8aFixed {}

  /** @name PalletSubspaceError (185) */
  interface PalletSubspaceError extends Enum {
    readonly isNetworkDoesNotExist: boolean;
    readonly isModuleDoesNotExist: boolean;
    readonly isNetworkIsImmuned: boolean;
    readonly isNotEnoughBalanceToRegisterSubnet: boolean;
    readonly isNotEnoughStakeToWithdraw: boolean;
    readonly isNotEnoughBalanceToStake: boolean;
    readonly isWeightVecNotEqualSize: boolean;
    readonly isDuplicateUids: boolean;
    readonly isInvalidUid: boolean;
    readonly isInvalidUidsLength: boolean;
    readonly isTooManyRegistrationsPerBlock: boolean;
    readonly isTooManyRegistrationsPerInterval: boolean;
    readonly isTooManySubnetRegistrationsPerInterval: boolean;
    readonly isAlreadyRegistered: boolean;
    readonly isCouldNotConvertToBalance: boolean;
    readonly isInvalidTempo: boolean;
    readonly isSettingWeightsTooFast: boolean;
    readonly isInvalidMaxAllowedUids: boolean;
    readonly isNetuidDoesNotExist: boolean;
    readonly isSubnetNameAlreadyExists: boolean;
    readonly isSubnetNameTooShort: boolean;
    readonly isSubnetNameTooLong: boolean;
    readonly isInvalidSubnetName: boolean;
    readonly isBalanceNotAdded: boolean;
    readonly isStakeNotRemoved: boolean;
    readonly isKeyAlreadyRegistered: boolean;
    readonly isEmptyKeys: boolean;
    readonly isTooManyKeys: boolean;
    readonly isInvalidShares: boolean;
    readonly isNotFounder: boolean;
    readonly isNotEnoughStakeToSetWeights: boolean;
    readonly isNotEnoughStakeToStartNetwork: boolean;
    readonly isNotEnoughStakePerWeight: boolean;
    readonly isNoSelfWeight: boolean;
    readonly isDifferentLengths: boolean;
    readonly isNotEnoughBalanceToRegister: boolean;
    readonly isStakeNotAdded: boolean;
    readonly isBalanceNotRemoved: boolean;
    readonly isBalanceCouldNotBeRemoved: boolean;
    readonly isNotEnoughStakeToRegister: boolean;
    readonly isStillRegistered: boolean;
    readonly isMaxAllowedModules: boolean;
    readonly isNotEnoughBalanceToTransfer: boolean;
    readonly isNotVoteMode: boolean;
    readonly isInvalidTrustRatio: boolean;
    readonly isInvalidMinAllowedWeights: boolean;
    readonly isInvalidMaxAllowedWeights: boolean;
    readonly isInvalidMinDelegationFee: boolean;
    readonly isInvalidModuleMetadata: boolean;
    readonly isModuleMetadataTooLong: boolean;
    readonly isInvalidSubnetMetadata: boolean;
    readonly isSubnetMetadataTooLong: boolean;
    readonly isInvalidMaxNameLength: boolean;
    readonly isInvalidMinNameLenght: boolean;
    readonly isInvalidMaxAllowedSubnets: boolean;
    readonly isInvalidMaxAllowedModules: boolean;
    readonly isInvalidMaxRegistrationsPerBlock: boolean;
    readonly isInvalidMinBurn: boolean;
    readonly isInvalidMaxBurn: boolean;
    readonly isModuleNameTooLong: boolean;
    readonly isModuleNameTooShort: boolean;
    readonly isInvalidModuleName: boolean;
    readonly isModuleAddressTooLong: boolean;
    readonly isInvalidModuleAddress: boolean;
    readonly isModuleNameAlreadyExists: boolean;
    readonly isInvalidFounderShare: boolean;
    readonly isInvalidIncentiveRatio: boolean;
    readonly isInvalidGeneralSubnetApplicationCost: boolean;
    readonly isInvalidProposalExpiration: boolean;
    readonly isInvalidMaxWeightAge: boolean;
    readonly isMaxSetWeightsPerEpochReached: boolean;
    readonly isArithmeticError: boolean;
    readonly isInvalidTargetRegistrationsPerInterval: boolean;
    readonly isInvalidMaxRegistrationsPerInterval: boolean;
    readonly isInvalidAdjustmentAlpha: boolean;
    readonly isInvalidTargetRegistrationsInterval: boolean;
    readonly isInvalidMinImmunityStake: boolean;
    readonly isExtrinsicPanicked: boolean;
    readonly isStepPanicked: boolean;
    readonly isStakeTooSmall: boolean;
    readonly isTargetIsDelegatingControl: boolean;
    readonly isRootnetSubnetNotFound: boolean;
    readonly isInvalidMinValidatorStake: boolean;
    readonly isInvalidMaxAllowedValidators: boolean;
    readonly isUidNotWhitelisted: boolean;
    readonly type: 'NetworkDoesNotExist' | 'ModuleDoesNotExist' | 'NetworkIsImmuned' | 'NotEnoughBalanceToRegisterSubnet' | 'NotEnoughStakeToWithdraw' | 'NotEnoughBalanceToStake' | 'WeightVecNotEqualSize' | 'DuplicateUids' | 'InvalidUid' | 'InvalidUidsLength' | 'TooManyRegistrationsPerBlock' | 'TooManyRegistrationsPerInterval' | 'TooManySubnetRegistrationsPerInterval' | 'AlreadyRegistered' | 'CouldNotConvertToBalance' | 'InvalidTempo' | 'SettingWeightsTooFast' | 'InvalidMaxAllowedUids' | 'NetuidDoesNotExist' | 'SubnetNameAlreadyExists' | 'SubnetNameTooShort' | 'SubnetNameTooLong' | 'InvalidSubnetName' | 'BalanceNotAdded' | 'StakeNotRemoved' | 'KeyAlreadyRegistered' | 'EmptyKeys' | 'TooManyKeys' | 'InvalidShares' | 'NotFounder' | 'NotEnoughStakeToSetWeights' | 'NotEnoughStakeToStartNetwork' | 'NotEnoughStakePerWeight' | 'NoSelfWeight' | 'DifferentLengths' | 'NotEnoughBalanceToRegister' | 'StakeNotAdded' | 'BalanceNotRemoved' | 'BalanceCouldNotBeRemoved' | 'NotEnoughStakeToRegister' | 'StillRegistered' | 'MaxAllowedModules' | 'NotEnoughBalanceToTransfer' | 'NotVoteMode' | 'InvalidTrustRatio' | 'InvalidMinAllowedWeights' | 'InvalidMaxAllowedWeights' | 'InvalidMinDelegationFee' | 'InvalidModuleMetadata' | 'ModuleMetadataTooLong' | 'InvalidSubnetMetadata' | 'SubnetMetadataTooLong' | 'InvalidMaxNameLength' | 'InvalidMinNameLenght' | 'InvalidMaxAllowedSubnets' | 'InvalidMaxAllowedModules' | 'InvalidMaxRegistrationsPerBlock' | 'InvalidMinBurn' | 'InvalidMaxBurn' | 'ModuleNameTooLong' | 'ModuleNameTooShort' | 'InvalidModuleName' | 'ModuleAddressTooLong' | 'InvalidModuleAddress' | 'ModuleNameAlreadyExists' | 'InvalidFounderShare' | 'InvalidIncentiveRatio' | 'InvalidGeneralSubnetApplicationCost' | 'InvalidProposalExpiration' | 'InvalidMaxWeightAge' | 'MaxSetWeightsPerEpochReached' | 'ArithmeticError' | 'InvalidTargetRegistrationsPerInterval' | 'InvalidMaxRegistrationsPerInterval' | 'InvalidAdjustmentAlpha' | 'InvalidTargetRegistrationsInterval' | 'InvalidMinImmunityStake' | 'ExtrinsicPanicked' | 'StepPanicked' | 'StakeTooSmall' | 'TargetIsDelegatingControl' | 'RootnetSubnetNotFound' | 'InvalidMinValidatorStake' | 'InvalidMaxAllowedValidators' | 'UidNotWhitelisted';
  }

  /** @name PalletGovernanceProposal (186) */
  interface PalletGovernanceProposal extends Struct {
    readonly id: u64;
    readonly proposer: AccountId32;
    readonly expirationBlock: u64;
    readonly data: PalletGovernanceProposalProposalData;
    readonly status: PalletGovernanceProposalProposalStatus;
    readonly metadata: Bytes;
    readonly proposalCost: u64;
    readonly creationBlock: u64;
  }

  /** @name PalletGovernanceProposalProposalData (187) */
  interface PalletGovernanceProposalProposalData extends Enum {
    readonly isGlobalCustom: boolean;
    readonly isGlobalParams: boolean;
    readonly asGlobalParams: PalletSubspaceGlobalParams;
    readonly isSubnetCustom: boolean;
    readonly asSubnetCustom: {
      readonly subnetId: u16;
    } & Struct;
    readonly isSubnetParams: boolean;
    readonly asSubnetParams: {
      readonly subnetId: u16;
      readonly params: PalletSubspaceSubnetParams;
    } & Struct;
    readonly isTransferDaoTreasury: boolean;
    readonly asTransferDaoTreasury: {
      readonly account: AccountId32;
      readonly amount: u64;
    } & Struct;
    readonly type: 'GlobalCustom' | 'GlobalParams' | 'SubnetCustom' | 'SubnetParams' | 'TransferDaoTreasury';
  }

  /** @name PalletSubspaceSubnetParams (188) */
  interface PalletSubspaceSubnetParams extends Struct {
    readonly founder: AccountId32;
    readonly founderShare: u16;
    readonly immunityPeriod: u16;
    readonly incentiveRatio: u16;
    readonly maxAllowedUids: u16;
    readonly maxAllowedWeights: u16;
    readonly minAllowedWeights: u16;
    readonly maxWeightAge: u64;
    readonly name: Bytes;
    readonly metadata: Option<Bytes>;
    readonly tempo: u16;
    readonly trustRatio: u16;
    readonly maximumSetWeightCallsPerEpoch: u16;
    readonly bondsMa: u64;
    readonly moduleBurnConfig: PalletSubspaceGlobalGeneralBurnConfiguration;
    readonly minValidatorStake: u64;
    readonly maxAllowedValidators: Option<u16>;
    readonly governanceConfig: PalletGovernanceApiGovernanceConfiguration;
  }

  /** @name PalletGovernanceProposalProposalStatus (189) */
  interface PalletGovernanceProposalProposalStatus extends Enum {
    readonly isOpen: boolean;
    readonly asOpen: {
      readonly votesFor: BTreeSet<AccountId32>;
      readonly votesAgainst: BTreeSet<AccountId32>;
      readonly stakeFor: u64;
      readonly stakeAgainst: u64;
    } & Struct;
    readonly isAccepted: boolean;
    readonly asAccepted: {
      readonly block: u64;
      readonly stakeFor: u64;
      readonly stakeAgainst: u64;
    } & Struct;
    readonly isRefused: boolean;
    readonly asRefused: {
      readonly block: u64;
      readonly stakeFor: u64;
      readonly stakeAgainst: u64;
    } & Struct;
    readonly isExpired: boolean;
    readonly type: 'Open' | 'Accepted' | 'Refused' | 'Expired';
  }

  /** @name PalletGovernanceProposalUnrewardedProposal (192) */
  interface PalletGovernanceProposalUnrewardedProposal extends Struct {
    readonly subnetId: Option<u16>;
    readonly block: u64;
    readonly votesFor: BTreeMap<AccountId32, u64>;
    readonly votesAgainst: BTreeMap<AccountId32, u64>;
  }

  /** @name PalletGovernanceDaoCuratorApplication (197) */
  interface PalletGovernanceDaoCuratorApplication extends Struct {
    readonly id: u64;
    readonly userId: AccountId32;
    readonly payingFor: AccountId32;
    readonly data: Bytes;
    readonly status: PalletGovernanceDaoApplicationStatus;
    readonly applicationCost: u64;
    readonly blockNumber: u64;
  }

  /** @name PalletGovernanceDaoApplicationStatus (198) */
  interface PalletGovernanceDaoApplicationStatus extends Enum {
    readonly isPending: boolean;
    readonly isAccepted: boolean;
    readonly isRefused: boolean;
    readonly isRemoved: boolean;
    readonly type: 'Pending' | 'Accepted' | 'Refused' | 'Removed';
  }

  /** @name PalletGovernanceError (199) */
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
    readonly isNotVoteMode: boolean;
    readonly isAlreadyVoted: boolean;
    readonly isNotVoted: boolean;
    readonly isInsufficientStake: boolean;
    readonly isVoterIsDelegatingVotingPower: boolean;
    readonly isVoteModeIsNotAuthority: boolean;
    readonly isInternalError: boolean;
    readonly isApplicationTooSmall: boolean;
    readonly isInvalidApplicationSize: boolean;
    readonly isApplicationNotPending: boolean;
    readonly isApplicationKeyAlreadyUsed: boolean;
    readonly isInvalidApplication: boolean;
    readonly isNotEnoughBalanceToApply: boolean;
    readonly isNotCurator: boolean;
    readonly isApplicationNotFound: boolean;
    readonly isAlreadyWhitelisted: boolean;
    readonly isNotWhitelisted: boolean;
    readonly isCouldNotConvertToBalance: boolean;
    readonly type: 'ProposalIsFinished' | 'InvalidProposalFinalizationParameters' | 'InvalidProposalVotingParameters' | 'InvalidProposalCost' | 'InvalidProposalExpiration' | 'NotEnoughBalanceToPropose' | 'ProposalDataTooSmall' | 'ProposalDataTooLarge' | 'ModuleDelegatingForMaxStakers' | 'ProposalNotFound' | 'ProposalClosed' | 'InvalidProposalData' | 'InvalidCurrencyConversionValue' | 'InsufficientDaoTreasuryFunds' | 'NotVoteMode' | 'AlreadyVoted' | 'NotVoted' | 'InsufficientStake' | 'VoterIsDelegatingVotingPower' | 'VoteModeIsNotAuthority' | 'InternalError' | 'ApplicationTooSmall' | 'InvalidApplicationSize' | 'ApplicationNotPending' | 'ApplicationKeyAlreadyUsed' | 'InvalidApplication' | 'NotEnoughBalanceToApply' | 'NotCurator' | 'ApplicationNotFound' | 'AlreadyWhitelisted' | 'NotWhitelisted' | 'CouldNotConvertToBalance';
  }

  /** @name PalletSubnetEmissionApiSubnetConsensus (200) */
  interface PalletSubnetEmissionApiSubnetConsensus extends Enum {
    readonly isYuma: boolean;
    readonly isLinear: boolean;
    readonly isTreasury: boolean;
    readonly isRoot: boolean;
    readonly type: 'Yuma' | 'Linear' | 'Treasury' | 'Root';
  }

  /** @name PalletEvmCodeMetadata (201) */
  interface PalletEvmCodeMetadata extends Struct {
    readonly size_: u64;
    readonly hash_: H256;
  }

  /** @name PalletEvmError (203) */
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

  /** @name FpRpcTransactionStatus (206) */
  interface FpRpcTransactionStatus extends Struct {
    readonly transactionHash: H256;
    readonly transactionIndex: u32;
    readonly from: H160;
    readonly to: Option<H160>;
    readonly contractAddress: Option<H160>;
    readonly logs: Vec<EthereumLog>;
    readonly logsBloom: EthbloomBloom;
  }

  /** @name EthbloomBloom (209) */
  interface EthbloomBloom extends U8aFixed {}

  /** @name EthereumReceiptReceiptV3 (211) */
  interface EthereumReceiptReceiptV3 extends Enum {
    readonly isLegacy: boolean;
    readonly asLegacy: EthereumReceiptEip658ReceiptData;
    readonly isEip2930: boolean;
    readonly asEip2930: EthereumReceiptEip658ReceiptData;
    readonly isEip1559: boolean;
    readonly asEip1559: EthereumReceiptEip658ReceiptData;
    readonly type: 'Legacy' | 'Eip2930' | 'Eip1559';
  }

  /** @name EthereumReceiptEip658ReceiptData (212) */
  interface EthereumReceiptEip658ReceiptData extends Struct {
    readonly statusCode: u8;
    readonly usedGas: U256;
    readonly logsBloom: EthbloomBloom;
    readonly logs: Vec<EthereumLog>;
  }

  /** @name EthereumBlock (213) */
  interface EthereumBlock extends Struct {
    readonly header: EthereumHeader;
    readonly transactions: Vec<EthereumTransactionTransactionV2>;
    readonly ommers: Vec<EthereumHeader>;
  }

  /** @name EthereumHeader (214) */
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

  /** @name EthereumTypesHashH64 (215) */
  interface EthereumTypesHashH64 extends U8aFixed {}

  /** @name PalletEthereumError (220) */
  interface PalletEthereumError extends Enum {
    readonly isInvalidSignature: boolean;
    readonly isPreLogExists: boolean;
    readonly type: 'InvalidSignature' | 'PreLogExists';
  }

  /** @name SpRuntimeMultiSignature (222) */
  interface SpRuntimeMultiSignature extends Enum {
    readonly isEd25519: boolean;
    readonly asEd25519: U8aFixed;
    readonly isSr25519: boolean;
    readonly asSr25519: U8aFixed;
    readonly isEcdsa: boolean;
    readonly asEcdsa: U8aFixed;
    readonly type: 'Ed25519' | 'Sr25519' | 'Ecdsa';
  }

  /** @name FrameSystemExtensionsCheckNonZeroSender (225) */
  type FrameSystemExtensionsCheckNonZeroSender = Null;

  /** @name FrameSystemExtensionsCheckSpecVersion (226) */
  type FrameSystemExtensionsCheckSpecVersion = Null;

  /** @name FrameSystemExtensionsCheckTxVersion (227) */
  type FrameSystemExtensionsCheckTxVersion = Null;

  /** @name FrameSystemExtensionsCheckGenesis (228) */
  type FrameSystemExtensionsCheckGenesis = Null;

  /** @name FrameSystemExtensionsCheckNonce (231) */
  interface FrameSystemExtensionsCheckNonce extends Compact<u32> {}

  /** @name FrameSystemExtensionsCheckWeight (232) */
  type FrameSystemExtensionsCheckWeight = Null;

  /** @name PalletTransactionPaymentChargeTransactionPayment (233) */
  interface PalletTransactionPaymentChargeTransactionPayment extends Compact<u64> {}

  /** @name NodeSubspaceRuntimeRuntime (235) */
  type NodeSubspaceRuntimeRuntime = Null;

} // declare module
