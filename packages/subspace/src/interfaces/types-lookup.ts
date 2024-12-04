// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

// import type lookup before we augment - in some environments
// this is required to allow for ambient/previous definitions
import '@polkadot/types/lookup';

import type { BTreeMap, BTreeSet, Bytes, Compact, Enum, Null, Option, Result, Struct, Text, U8aFixed, Vec, bool, i128, i64, u128, u16, u32, u64, u8 } from '@polkadot/types-codec';
import type { ITuple } from '@polkadot/types-codec/types';
import type { AccountId32, Call, H256, MultiAddress, Percent } from '@polkadot/types/interfaces/runtime';
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
    readonly asGlobalParamsUpdated: PalletSubspaceParamsGlobalGlobalParams;
    readonly isSubnetParamsUpdated: boolean;
    readonly asSubnetParamsUpdated: u16;
    readonly isBridgeWithdrawn: boolean;
    readonly asBridgeWithdrawn: ITuple<[AccountId32, u64]>;
    readonly isBridged: boolean;
    readonly asBridged: ITuple<[AccountId32, u64]>;
    readonly type: 'NetworkAdded' | 'NetworkRemoved' | 'StakeAdded' | 'StakeRemoved' | 'WeightsSet' | 'ModuleRegistered' | 'ModuleDeregistered' | 'ModuleUpdated' | 'GlobalParamsUpdated' | 'SubnetParamsUpdated' | 'BridgeWithdrawn' | 'Bridged';
  }

  /** @name PalletSubspaceParamsGlobalGlobalParams (47) */
  interface PalletSubspaceParamsGlobalGlobalParams extends Struct {
    readonly maxNameLength: u16;
    readonly minNameLength: u16;
    readonly maxAllowedSubnets: u16;
    readonly maxAllowedModules: u16;
    readonly maxRegistrationsPerBlock: u16;
    readonly maxAllowedWeights: u16;
    readonly floorStakeDelegationFee: Percent;
    readonly floorValidatorWeightFee: Percent;
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
    readonly isEpochFinalized: boolean;
    readonly asEpochFinalized: u16;
    readonly isDecryptionNodeCanceled: boolean;
    readonly asDecryptionNodeCanceled: {
      readonly subnetId: u16;
      readonly nodeId: AccountId32;
    } & Struct;
    readonly isDecryptionNodeRotated: boolean;
    readonly asDecryptionNodeRotated: {
      readonly subnetId: u16;
      readonly previousNodeId: AccountId32;
      readonly newNodeId: AccountId32;
    } & Struct;
    readonly isDecryptionNodeCallbackScheduled: boolean;
    readonly asDecryptionNodeCallbackScheduled: {
      readonly subnetId: u16;
      readonly nodeId: AccountId32;
      readonly banBlock: u64;
    } & Struct;
    readonly isDecryptionNodeBanned: boolean;
    readonly asDecryptionNodeBanned: {
      readonly subnetId: u16;
      readonly nodeId: AccountId32;
    } & Struct;
    readonly type: 'EpochFinalized' | 'DecryptionNodeCanceled' | 'DecryptionNodeRotated' | 'DecryptionNodeCallbackScheduled' | 'DecryptionNodeBanned';
  }

  /** @name PalletOffworkerEvent (53) */
  interface PalletOffworkerEvent extends Enum {
    readonly isDecryptedWeightsSent: boolean;
    readonly asDecryptedWeightsSent: {
      readonly subnetId: u16;
      readonly blockNumber: u64;
      readonly worker: AccountId32;
    } & Struct;
    readonly isKeepAliveSent: boolean;
    readonly asKeepAliveSent: {
      readonly blockNumber: u64;
      readonly worker: AccountId32;
    } & Struct;
    readonly isAuthoritiesAdded: boolean;
    readonly isDecryptionNodeCallbackSuccess: boolean;
    readonly asDecryptionNodeCallbackSuccess: {
      readonly subnetId: u16;
      readonly nodeId: AccountId32;
    } & Struct;
    readonly type: 'DecryptedWeightsSent' | 'KeepAliveSent' | 'AuthoritiesAdded' | 'DecryptionNodeCallbackSuccess';
  }

  /** @name FrameSystemPhase (54) */
  interface FrameSystemPhase extends Enum {
    readonly isApplyExtrinsic: boolean;
    readonly asApplyExtrinsic: u32;
    readonly isFinalization: boolean;
    readonly isInitialization: boolean;
    readonly type: 'ApplyExtrinsic' | 'Finalization' | 'Initialization';
  }

  /** @name FrameSystemLastRuntimeUpgradeInfo (58) */
  interface FrameSystemLastRuntimeUpgradeInfo extends Struct {
    readonly specVersion: Compact<u32>;
    readonly specName: Text;
  }

  /** @name FrameSystemCodeUpgradeAuthorization (61) */
  interface FrameSystemCodeUpgradeAuthorization extends Struct {
    readonly codeHash: H256;
    readonly checkVersion: bool;
  }

  /** @name FrameSystemCall (62) */
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

  /** @name FrameSystemLimitsBlockWeights (66) */
  interface FrameSystemLimitsBlockWeights extends Struct {
    readonly baseBlock: SpWeightsWeightV2Weight;
    readonly maxBlock: SpWeightsWeightV2Weight;
    readonly perClass: FrameSupportDispatchPerDispatchClassWeightsPerClass;
  }

  /** @name FrameSupportDispatchPerDispatchClassWeightsPerClass (67) */
  interface FrameSupportDispatchPerDispatchClassWeightsPerClass extends Struct {
    readonly normal: FrameSystemLimitsWeightsPerClass;
    readonly operational: FrameSystemLimitsWeightsPerClass;
    readonly mandatory: FrameSystemLimitsWeightsPerClass;
  }

  /** @name FrameSystemLimitsWeightsPerClass (68) */
  interface FrameSystemLimitsWeightsPerClass extends Struct {
    readonly baseExtrinsic: SpWeightsWeightV2Weight;
    readonly maxExtrinsic: Option<SpWeightsWeightV2Weight>;
    readonly maxTotal: Option<SpWeightsWeightV2Weight>;
    readonly reserved: Option<SpWeightsWeightV2Weight>;
  }

  /** @name FrameSystemLimitsBlockLength (70) */
  interface FrameSystemLimitsBlockLength extends Struct {
    readonly max: FrameSupportDispatchPerDispatchClassU32;
  }

  /** @name FrameSupportDispatchPerDispatchClassU32 (71) */
  interface FrameSupportDispatchPerDispatchClassU32 extends Struct {
    readonly normal: u32;
    readonly operational: u32;
    readonly mandatory: u32;
  }

  /** @name SpWeightsRuntimeDbWeight (72) */
  interface SpWeightsRuntimeDbWeight extends Struct {
    readonly read: u64;
    readonly write: u64;
  }

  /** @name SpVersionRuntimeVersion (73) */
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

  /** @name FrameSystemError (78) */
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

  /** @name PalletTimestampCall (79) */
  interface PalletTimestampCall extends Enum {
    readonly isSet: boolean;
    readonly asSet: {
      readonly now: Compact<u64>;
    } & Struct;
    readonly type: 'Set';
  }

  /** @name SpConsensusAuraSr25519AppSr25519Public (81) */
  interface SpConsensusAuraSr25519AppSr25519Public extends U8aFixed {}

  /** @name PalletGrandpaStoredState (84) */
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

  /** @name PalletGrandpaStoredPendingChange (85) */
  interface PalletGrandpaStoredPendingChange extends Struct {
    readonly scheduledAt: u64;
    readonly delay: u64;
    readonly nextAuthorities: Vec<ITuple<[SpConsensusGrandpaAppPublic, u64]>>;
    readonly forced: Option<u64>;
  }

  /** @name PalletGrandpaCall (89) */
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

  /** @name SpConsensusGrandpaEquivocationProof (90) */
  interface SpConsensusGrandpaEquivocationProof extends Struct {
    readonly setId: u64;
    readonly equivocation: SpConsensusGrandpaEquivocation;
  }

  /** @name SpConsensusGrandpaEquivocation (91) */
  interface SpConsensusGrandpaEquivocation extends Enum {
    readonly isPrevote: boolean;
    readonly asPrevote: FinalityGrandpaEquivocationPrevote;
    readonly isPrecommit: boolean;
    readonly asPrecommit: FinalityGrandpaEquivocationPrecommit;
    readonly type: 'Prevote' | 'Precommit';
  }

  /** @name FinalityGrandpaEquivocationPrevote (92) */
  interface FinalityGrandpaEquivocationPrevote extends Struct {
    readonly roundNumber: u64;
    readonly identity: SpConsensusGrandpaAppPublic;
    readonly first: ITuple<[FinalityGrandpaPrevote, SpConsensusGrandpaAppSignature]>;
    readonly second: ITuple<[FinalityGrandpaPrevote, SpConsensusGrandpaAppSignature]>;
  }

  /** @name FinalityGrandpaPrevote (93) */
  interface FinalityGrandpaPrevote extends Struct {
    readonly targetHash: H256;
    readonly targetNumber: u64;
  }

  /** @name SpConsensusGrandpaAppSignature (94) */
  interface SpConsensusGrandpaAppSignature extends U8aFixed {}

  /** @name FinalityGrandpaEquivocationPrecommit (97) */
  interface FinalityGrandpaEquivocationPrecommit extends Struct {
    readonly roundNumber: u64;
    readonly identity: SpConsensusGrandpaAppPublic;
    readonly first: ITuple<[FinalityGrandpaPrecommit, SpConsensusGrandpaAppSignature]>;
    readonly second: ITuple<[FinalityGrandpaPrecommit, SpConsensusGrandpaAppSignature]>;
  }

  /** @name FinalityGrandpaPrecommit (98) */
  interface FinalityGrandpaPrecommit extends Struct {
    readonly targetHash: H256;
    readonly targetNumber: u64;
  }

  /** @name SpCoreVoid (100) */
  type SpCoreVoid = Null;

  /** @name PalletGrandpaError (101) */
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

  /** @name PalletBalancesBalanceLock (103) */
  interface PalletBalancesBalanceLock extends Struct {
    readonly id: U8aFixed;
    readonly amount: u64;
    readonly reasons: PalletBalancesReasons;
  }

  /** @name PalletBalancesReasons (104) */
  interface PalletBalancesReasons extends Enum {
    readonly isFee: boolean;
    readonly isMisc: boolean;
    readonly isAll: boolean;
    readonly type: 'Fee' | 'Misc' | 'All';
  }

  /** @name PalletBalancesReserveData (107) */
  interface PalletBalancesReserveData extends Struct {
    readonly id: U8aFixed;
    readonly amount: u64;
  }

  /** @name FrameSupportTokensMiscIdAmount (110) */
  interface FrameSupportTokensMiscIdAmount extends Struct {
    readonly id: Null;
    readonly amount: u64;
  }

  /** @name PalletBalancesCall (113) */
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
    readonly isBurn: boolean;
    readonly asBurn: {
      readonly value: Compact<u64>;
      readonly keepAlive: bool;
    } & Struct;
    readonly type: 'TransferAllowDeath' | 'ForceTransfer' | 'TransferKeepAlive' | 'TransferAll' | 'ForceUnreserve' | 'UpgradeAccounts' | 'ForceSetBalance' | 'ForceAdjustTotalIssuance' | 'Burn';
  }

  /** @name PalletBalancesAdjustmentDirection (118) */
  interface PalletBalancesAdjustmentDirection extends Enum {
    readonly isIncrease: boolean;
    readonly isDecrease: boolean;
    readonly type: 'Increase' | 'Decrease';
  }

  /** @name PalletBalancesError (119) */
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

  /** @name PalletTransactionPaymentReleases (121) */
  interface PalletTransactionPaymentReleases extends Enum {
    readonly isV1Ancient: boolean;
    readonly isV2: boolean;
    readonly type: 'V1Ancient' | 'V2';
  }

  /** @name PalletSudoCall (122) */
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

  /** @name PalletMultisigCall (124) */
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

  /** @name PalletUtilityCall (126) */
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

  /** @name NodeSubspaceRuntimeOriginCaller (128) */
  interface NodeSubspaceRuntimeOriginCaller extends Enum {
    readonly isSystem: boolean;
    readonly asSystem: FrameSupportDispatchRawOrigin;
    readonly isVoid: boolean;
    readonly type: 'System' | 'Void';
  }

  /** @name FrameSupportDispatchRawOrigin (129) */
  interface FrameSupportDispatchRawOrigin extends Enum {
    readonly isRoot: boolean;
    readonly isSigned: boolean;
    readonly asSigned: AccountId32;
    readonly isNone: boolean;
    readonly type: 'Root' | 'Signed' | 'None';
  }

  /** @name PalletSubspaceCall (130) */
  interface PalletSubspaceCall extends Enum {
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
      readonly stakeDelegationFee: Option<Percent>;
      readonly validatorWeightFee: Option<Percent>;
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
      readonly maximumSetWeightCallsPerEpoch: Option<u16>;
      readonly voteMode: PalletGovernanceApiVoteMode;
      readonly bondsMa: u64;
      readonly moduleBurnConfig: PalletSubspaceParamsBurnGeneralBurnConfiguration;
      readonly minValidatorStake: u64;
      readonly maxAllowedValidators: Option<u16>;
      readonly useWeightsEncryption: bool;
      readonly copierMargin: SubstrateFixedFixedI128;
      readonly maxEncryptionPeriod: Option<u64>;
    } & Struct;
    readonly isRegisterSubnet: boolean;
    readonly asRegisterSubnet: {
      readonly name: Bytes;
      readonly metadata: Option<Bytes>;
    } & Struct;
    readonly isBridge: boolean;
    readonly asBridge: {
      readonly amount: u64;
    } & Struct;
    readonly isBridgeWithdraw: boolean;
    readonly asBridgeWithdraw: {
      readonly amount: u64;
    } & Struct;
    readonly type: 'AddStake' | 'RemoveStake' | 'AddStakeMultiple' | 'RemoveStakeMultiple' | 'TransferStake' | 'TransferMultiple' | 'Register' | 'Deregister' | 'UpdateModule' | 'UpdateSubnet' | 'RegisterSubnet' | 'Bridge' | 'BridgeWithdraw';
  }

  /** @name PalletSubspaceParamsBurnGeneralBurnConfiguration (138) */
  interface PalletSubspaceParamsBurnGeneralBurnConfiguration extends Struct {
    readonly minBurn: u64;
    readonly maxBurn: u64;
    readonly adjustmentAlpha: u64;
    readonly targetRegistrationsInterval: u16;
    readonly targetRegistrationsPerInterval: u16;
    readonly maxRegistrationsPerInterval: u16;
  }

  /** @name SubstrateFixedFixedI128 (139) */
  interface SubstrateFixedFixedI128 extends Struct {
    readonly bits: i128;
  }

  /** @name TypenumUIntUInt (145) */
  interface TypenumUIntUInt extends Struct {
    readonly msb: TypenumUIntUTerm;
    readonly lsb: TypenumBitB0;
  }

  /** @name TypenumUIntUTerm (146) */
  interface TypenumUIntUTerm extends Struct {
    readonly msb: TypenumUintUTerm;
    readonly lsb: TypenumBitB1;
  }

  /** @name TypenumUintUTerm (147) */
  type TypenumUintUTerm = Null;

  /** @name TypenumBitB1 (148) */
  type TypenumBitB1 = Null;

  /** @name TypenumBitB0 (149) */
  type TypenumBitB0 = Null;

  /** @name PalletGovernanceCall (151) */
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
      readonly floorStakeDelegationFee: Percent;
      readonly floorValidatorWeightFee: Percent;
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
      readonly maximumSetWeightCallsPerEpoch: Option<u16>;
      readonly voteMode: PalletGovernanceApiVoteMode;
      readonly bondsMa: u64;
      readonly moduleBurnConfig: PalletSubspaceParamsBurnGeneralBurnConfiguration;
      readonly minValidatorStake: u64;
      readonly maxAllowedValidators: Option<u16>;
      readonly useWeightsEncryption: bool;
      readonly copierMargin: SubstrateFixedFixedI128;
      readonly maxEncryptionPeriod: Option<u64>;
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

  /** @name PalletSubnetEmissionCall (152) */
  interface PalletSubnetEmissionCall extends Enum {
    readonly isSetWeights: boolean;
    readonly asSetWeights: {
      readonly netuid: u16;
      readonly uids: Vec<u16>;
      readonly weights: Vec<u16>;
    } & Struct;
    readonly isSetWeightsEncrypted: boolean;
    readonly asSetWeightsEncrypted: {
      readonly netuid: u16;
      readonly encryptedWeights: Bytes;
      readonly decryptedWeightsHash: Bytes;
    } & Struct;
    readonly isDelegateWeightControl: boolean;
    readonly asDelegateWeightControl: {
      readonly netuid: u16;
      readonly target: AccountId32;
    } & Struct;
    readonly isRemoveWeightControl: boolean;
    readonly asRemoveWeightControl: {
      readonly netuid: u16;
    } & Struct;
    readonly type: 'SetWeights' | 'SetWeightsEncrypted' | 'DelegateWeightControl' | 'RemoveWeightControl';
  }

  /** @name PalletOffworkerCall (154) */
  interface PalletOffworkerCall extends Enum {
    readonly isSendDecryptedWeights: boolean;
    readonly asSendDecryptedWeights: {
      readonly payload: PalletOffworkerDecryptedWeightsPayload;
      readonly signature: SpRuntimeMultiSignature;
    } & Struct;
    readonly isSendPing: boolean;
    readonly asSendPing: {
      readonly payload: PalletOffworkerKeepAlivePayload;
      readonly signature: SpRuntimeMultiSignature;
    } & Struct;
    readonly isAddAuthorities: boolean;
    readonly asAddAuthorities: {
      readonly newAuthorities: Vec<ITuple<[AccountId32, ITuple<[Bytes, Bytes]>]>>;
    } & Struct;
    readonly type: 'SendDecryptedWeights' | 'SendPing' | 'AddAuthorities';
  }

  /** @name PalletOffworkerDecryptedWeightsPayload (155) */
  interface PalletOffworkerDecryptedWeightsPayload extends Struct {
    readonly subnetId: u16;
    readonly decryptedWeights: Vec<ITuple<[u64, Vec<ITuple<[u16, Vec<ITuple<[u16, u16]>>, Bytes]>>]>>;
    readonly delta: SubstrateFixedFixedI128;
    readonly blockNumber: u64;
    readonly public: SpRuntimeMultiSigner;
    readonly forcedSendByRotation: bool;
  }

  /** @name SpRuntimeMultiSigner (156) */
  interface SpRuntimeMultiSigner extends Enum {
    readonly isEd25519: boolean;
    readonly asEd25519: U8aFixed;
    readonly isSr25519: boolean;
    readonly asSr25519: U8aFixed;
    readonly isEcdsa: boolean;
    readonly asEcdsa: U8aFixed;
    readonly type: 'Ed25519' | 'Sr25519' | 'Ecdsa';
  }

  /** @name SpRuntimeMultiSignature (164) */
  interface SpRuntimeMultiSignature extends Enum {
    readonly isEd25519: boolean;
    readonly asEd25519: U8aFixed;
    readonly isSr25519: boolean;
    readonly asSr25519: U8aFixed;
    readonly isEcdsa: boolean;
    readonly asEcdsa: U8aFixed;
    readonly type: 'Ed25519' | 'Sr25519' | 'Ecdsa';
  }

  /** @name PalletOffworkerKeepAlivePayload (166) */
  interface PalletOffworkerKeepAlivePayload extends Struct {
    readonly publicKey: ITuple<[Bytes, Bytes]>;
    readonly blockNumber: u64;
    readonly public: SpRuntimeMultiSigner;
  }

  /** @name PalletSudoError (169) */
  interface PalletSudoError extends Enum {
    readonly isRequireSudo: boolean;
    readonly type: 'RequireSudo';
  }

  /** @name PalletMultisigMultisig (171) */
  interface PalletMultisigMultisig extends Struct {
    readonly when: PalletMultisigTimepoint;
    readonly deposit: u64;
    readonly depositor: AccountId32;
    readonly approvals: Vec<AccountId32>;
  }

  /** @name PalletMultisigError (173) */
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

  /** @name PalletUtilityError (174) */
  interface PalletUtilityError extends Enum {
    readonly isTooManyCalls: boolean;
    readonly type: 'TooManyCalls';
  }

  /** @name PalletSubspaceMinimumFees (179) */
  interface PalletSubspaceMinimumFees extends Struct {
    readonly stakeDelegationFee: Percent;
    readonly validatorWeightFee: Percent;
  }

  /** @name PalletSubspaceValidatorFees (180) */
  interface PalletSubspaceValidatorFees extends Struct {
    readonly stakeDelegationFee: Percent;
    readonly validatorWeightFee: Percent;
  }

  /** @name FrameSupportPalletId (181) */
  interface FrameSupportPalletId extends U8aFixed {}

  /** @name PalletSubspaceError (182) */
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
    readonly isDelegatingControl: boolean;
    readonly isNotDelegatingControl: boolean;
    readonly isRootnetSubnetNotFound: boolean;
    readonly isInvalidMinValidatorStake: boolean;
    readonly isInvalidMaxAllowedValidators: boolean;
    readonly isInvalidMaxEncryptionPeriod: boolean;
    readonly isSubnetEncrypted: boolean;
    readonly isSubnetNotEncrypted: boolean;
    readonly isUidNotWhitelisted: boolean;
    readonly isInvalidCopierMargin: boolean;
    readonly isInvalidFloorFounderShare: boolean;
    readonly isInvalidSubnetImmunityPeriod: boolean;
    readonly isInvalidKappa: boolean;
    readonly isInvalidRho: boolean;
    readonly isInvalidMaximumSetWeightCallsPerEpoch: boolean;
    readonly isInvalidModuleParams: boolean;
    readonly isInvalidMinFees: boolean;
    readonly isCannotDecreaseFee: boolean;
    readonly isNotEnoughBalance: boolean;
    readonly isNotEnoughBridgedTokens: boolean;
    readonly type: 'NetworkDoesNotExist' | 'ModuleDoesNotExist' | 'NetworkIsImmuned' | 'NotEnoughBalanceToRegisterSubnet' | 'NotEnoughStakeToWithdraw' | 'NotEnoughBalanceToStake' | 'WeightVecNotEqualSize' | 'DuplicateUids' | 'InvalidUid' | 'InvalidUidsLength' | 'TooManyRegistrationsPerBlock' | 'TooManyRegistrationsPerInterval' | 'TooManySubnetRegistrationsPerInterval' | 'AlreadyRegistered' | 'CouldNotConvertToBalance' | 'InvalidTempo' | 'SettingWeightsTooFast' | 'InvalidMaxAllowedUids' | 'NetuidDoesNotExist' | 'SubnetNameAlreadyExists' | 'SubnetNameTooShort' | 'SubnetNameTooLong' | 'InvalidSubnetName' | 'BalanceNotAdded' | 'StakeNotRemoved' | 'KeyAlreadyRegistered' | 'EmptyKeys' | 'TooManyKeys' | 'InvalidShares' | 'NotFounder' | 'NotEnoughStakeToSetWeights' | 'NotEnoughStakeToStartNetwork' | 'NotEnoughStakePerWeight' | 'NoSelfWeight' | 'DifferentLengths' | 'NotEnoughBalanceToRegister' | 'StakeNotAdded' | 'BalanceNotRemoved' | 'BalanceCouldNotBeRemoved' | 'NotEnoughStakeToRegister' | 'StillRegistered' | 'MaxAllowedModules' | 'NotEnoughBalanceToTransfer' | 'NotVoteMode' | 'InvalidTrustRatio' | 'InvalidMinAllowedWeights' | 'InvalidMaxAllowedWeights' | 'InvalidMinDelegationFee' | 'InvalidModuleMetadata' | 'ModuleMetadataTooLong' | 'InvalidSubnetMetadata' | 'SubnetMetadataTooLong' | 'InvalidMaxNameLength' | 'InvalidMinNameLenght' | 'InvalidMaxAllowedSubnets' | 'InvalidMaxAllowedModules' | 'InvalidMaxRegistrationsPerBlock' | 'InvalidMinBurn' | 'InvalidMaxBurn' | 'ModuleNameTooLong' | 'ModuleNameTooShort' | 'InvalidModuleName' | 'ModuleAddressTooLong' | 'InvalidModuleAddress' | 'ModuleNameAlreadyExists' | 'InvalidFounderShare' | 'InvalidIncentiveRatio' | 'InvalidGeneralSubnetApplicationCost' | 'InvalidProposalExpiration' | 'InvalidMaxWeightAge' | 'MaxSetWeightsPerEpochReached' | 'ArithmeticError' | 'InvalidTargetRegistrationsPerInterval' | 'InvalidMaxRegistrationsPerInterval' | 'InvalidAdjustmentAlpha' | 'InvalidTargetRegistrationsInterval' | 'InvalidMinImmunityStake' | 'ExtrinsicPanicked' | 'StepPanicked' | 'StakeTooSmall' | 'DelegatingControl' | 'NotDelegatingControl' | 'RootnetSubnetNotFound' | 'InvalidMinValidatorStake' | 'InvalidMaxAllowedValidators' | 'InvalidMaxEncryptionPeriod' | 'SubnetEncrypted' | 'SubnetNotEncrypted' | 'UidNotWhitelisted' | 'InvalidCopierMargin' | 'InvalidFloorFounderShare' | 'InvalidSubnetImmunityPeriod' | 'InvalidKappa' | 'InvalidRho' | 'InvalidMaximumSetWeightCallsPerEpoch' | 'InvalidModuleParams' | 'InvalidMinFees' | 'CannotDecreaseFee' | 'NotEnoughBalance' | 'NotEnoughBridgedTokens';
  }

  /** @name PalletGovernanceProposal (183) */
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

  /** @name PalletGovernanceProposalProposalData (184) */
  interface PalletGovernanceProposalProposalData extends Enum {
    readonly isGlobalCustom: boolean;
    readonly isGlobalParams: boolean;
    readonly asGlobalParams: PalletSubspaceParamsGlobalGlobalParams;
    readonly isSubnetCustom: boolean;
    readonly asSubnetCustom: {
      readonly subnetId: u16;
    } & Struct;
    readonly isSubnetParams: boolean;
    readonly asSubnetParams: {
      readonly subnetId: u16;
      readonly params: PalletSubspaceParamsSubnetSubnetParams;
    } & Struct;
    readonly isTransferDaoTreasury: boolean;
    readonly asTransferDaoTreasury: {
      readonly account: AccountId32;
      readonly amount: u64;
    } & Struct;
    readonly type: 'GlobalCustom' | 'GlobalParams' | 'SubnetCustom' | 'SubnetParams' | 'TransferDaoTreasury';
  }

  /** @name PalletSubspaceParamsSubnetSubnetParams (185) */
  interface PalletSubspaceParamsSubnetSubnetParams extends Struct {
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
    readonly maximumSetWeightCallsPerEpoch: Option<u16>;
    readonly bondsMa: u64;
    readonly moduleBurnConfig: PalletSubspaceParamsBurnGeneralBurnConfiguration;
    readonly minValidatorStake: u64;
    readonly maxAllowedValidators: Option<u16>;
    readonly governanceConfig: PalletGovernanceApiGovernanceConfiguration;
    readonly useWeightsEncryption: bool;
    readonly copierMargin: SubstrateFixedFixedI128;
    readonly maxEncryptionPeriod: Option<u64>;
  }

  /** @name PalletGovernanceProposalProposalStatus (186) */
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

  /** @name PalletGovernanceProposalUnrewardedProposal (189) */
  interface PalletGovernanceProposalUnrewardedProposal extends Struct {
    readonly subnetId: Option<u16>;
    readonly block: u64;
    readonly votesFor: BTreeMap<AccountId32, u64>;
    readonly votesAgainst: BTreeMap<AccountId32, u64>;
  }

  /** @name PalletGovernanceDaoCuratorApplication (194) */
  interface PalletGovernanceDaoCuratorApplication extends Struct {
    readonly id: u64;
    readonly userId: AccountId32;
    readonly payingFor: AccountId32;
    readonly data: Bytes;
    readonly status: PalletGovernanceDaoApplicationStatus;
    readonly applicationCost: u64;
    readonly blockNumber: u64;
  }

  /** @name PalletGovernanceDaoApplicationStatus (195) */
  interface PalletGovernanceDaoApplicationStatus extends Enum {
    readonly isPending: boolean;
    readonly isAccepted: boolean;
    readonly isRefused: boolean;
    readonly isRemoved: boolean;
    readonly type: 'Pending' | 'Accepted' | 'Refused' | 'Removed';
  }

  /** @name PalletGovernanceError (196) */
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

  /** @name PalletSubnetEmissionEncryptionMechanism (197) */
  interface PalletSubnetEmissionEncryptionMechanism extends Struct {
    readonly encrypted: Bytes;
    readonly decryptedHashes: Bytes;
  }

  /** @name PalletSubnetEmissionSubnetDecryptionInfo (198) */
  interface PalletSubnetEmissionSubnetDecryptionInfo extends Struct {
    readonly nodeId: AccountId32;
    readonly nodePublicKey: ITuple<[Bytes, Bytes]>;
    readonly validityBlock: Option<u64>;
    readonly lastKeepAlive: u64;
    readonly rotatingFrom: Option<AccountId32>;
  }

  /** @name NodeSubspaceRuntimeRuntime (199) */
  type NodeSubspaceRuntimeRuntime = Null;

  /** @name PalletSubnetEmissionApiSubnetConsensus (200) */
  interface PalletSubnetEmissionApiSubnetConsensus extends Enum {
    readonly isYuma: boolean;
    readonly isLinear: boolean;
    readonly isTreasury: boolean;
    readonly isRoot: boolean;
    readonly type: 'Yuma' | 'Linear' | 'Treasury' | 'Root';
  }

  /** @name PalletSubnetEmissionSubnetConsensusUtilParamsConsensusParams (202) */
  interface PalletSubnetEmissionSubnetConsensusUtilParamsConsensusParams extends Struct {
    readonly subnetId: u16;
    readonly tokenEmission: u64;
    readonly modules: BTreeMap<AccountId32, PalletSubnetEmissionSubnetConsensusUtilParamsModuleParams>;
    readonly kappa: SubstrateFixedFixedI64;
    readonly founderKey: AccountId32;
    readonly founderEmission: u64;
    readonly currentBlock: u64;
    readonly activityCutoff: u64;
    readonly useWeightsEncryption: bool;
    readonly maxAllowedValidators: Option<u16>;
    readonly bondsMovingAverage: u64;
    readonly alphaValues: ITuple<[SubstrateFixedFixedI64, SubstrateFixedFixedI64]>;
    readonly minValStake: SubstrateFixedFixedI128;
  }

  /** @name PalletSubnetEmissionSubnetConsensusUtilParamsModuleParams (205) */
  interface PalletSubnetEmissionSubnetConsensusUtilParamsModuleParams extends Struct {
    readonly uid: u16;
    readonly lastUpdate: u64;
    readonly blockAtRegistration: u64;
    readonly validatorPermit: bool;
    readonly stakeNormalized: SubstrateFixedFixedI64;
    readonly stakeOriginal: SubstrateFixedFixedI128;
    readonly delegatedTo: Option<ITuple<[AccountId32, Percent]>>;
    readonly bonds: Vec<ITuple<[u16, u16]>>;
    readonly weightEncrypted: Bytes;
    readonly weightHash: Bytes;
  }

  /** @name SubstrateFixedFixedI64 (206) */
  interface SubstrateFixedFixedI64 extends Struct {
    readonly bits: i64;
  }

  /** @name PalletOffworkerError (216) */
  interface PalletOffworkerError extends Enum {
    readonly isInvalidDecryptionKey: boolean;
    readonly isInvalidSubnetId: boolean;
    readonly isTooManyAuthorities: boolean;
    readonly isEmptyDecryptedWeights: boolean;
    readonly isDecryptedWeightsLengthMismatch: boolean;
    readonly type: 'InvalidDecryptionKey' | 'InvalidSubnetId' | 'TooManyAuthorities' | 'EmptyDecryptedWeights' | 'DecryptedWeightsLengthMismatch';
  }

  /** @name FrameSystemExtensionsCheckNonZeroSender (219) */
  type FrameSystemExtensionsCheckNonZeroSender = Null;

  /** @name FrameSystemExtensionsCheckSpecVersion (220) */
  type FrameSystemExtensionsCheckSpecVersion = Null;

  /** @name FrameSystemExtensionsCheckTxVersion (221) */
  type FrameSystemExtensionsCheckTxVersion = Null;

  /** @name FrameSystemExtensionsCheckGenesis (222) */
  type FrameSystemExtensionsCheckGenesis = Null;

  /** @name FrameSystemExtensionsCheckNonce (225) */
  interface FrameSystemExtensionsCheckNonce extends Compact<u32> {}

  /** @name FrameSystemExtensionsCheckWeight (226) */
  type FrameSystemExtensionsCheckWeight = Null;

  /** @name PalletTransactionPaymentChargeTransactionPayment (227) */
  interface PalletTransactionPaymentChargeTransactionPayment extends Compact<u64> {}

} // declare module
