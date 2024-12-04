// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

/* eslint-disable sort-keys */

export default {
  /**
   * Lookup3: frame_system::AccountInfo<Nonce, pallet_balances::types::AccountData<Balance>>
   **/
  FrameSystemAccountInfo: {
    nonce: 'u32',
    consumers: 'u32',
    providers: 'u32',
    sufficients: 'u32',
    data: 'PalletBalancesAccountData'
  },
  /**
   * Lookup5: pallet_balances::types::AccountData<Balance>
   **/
  PalletBalancesAccountData: {
    free: 'u64',
    reserved: 'u64',
    frozen: 'u64',
    flags: 'u128'
  },
  /**
   * Lookup10: frame_support::dispatch::PerDispatchClass<sp_weights::weight_v2::Weight>
   **/
  FrameSupportDispatchPerDispatchClassWeight: {
    normal: 'SpWeightsWeightV2Weight',
    operational: 'SpWeightsWeightV2Weight',
    mandatory: 'SpWeightsWeightV2Weight'
  },
  /**
   * Lookup11: sp_weights::weight_v2::Weight
   **/
  SpWeightsWeightV2Weight: {
    refTime: 'Compact<u64>',
    proofSize: 'Compact<u64>'
  },
  /**
   * Lookup15: sp_runtime::generic::digest::Digest
   **/
  SpRuntimeDigest: {
    logs: 'Vec<SpRuntimeDigestDigestItem>'
  },
  /**
   * Lookup17: sp_runtime::generic::digest::DigestItem
   **/
  SpRuntimeDigestDigestItem: {
    _enum: {
      Other: 'Bytes',
      __Unused1: 'Null',
      __Unused2: 'Null',
      __Unused3: 'Null',
      Consensus: '([u8;4],Bytes)',
      Seal: '([u8;4],Bytes)',
      PreRuntime: '([u8;4],Bytes)',
      __Unused7: 'Null',
      RuntimeEnvironmentUpdated: 'Null'
    }
  },
  /**
   * Lookup20: frame_system::EventRecord<node_subspace_runtime::RuntimeEvent, primitive_types::H256>
   **/
  FrameSystemEventRecord: {
    phase: 'FrameSystemPhase',
    event: 'Event',
    topics: 'Vec<H256>'
  },
  /**
   * Lookup22: frame_system::pallet::Event<T>
   **/
  FrameSystemEvent: {
    _enum: {
      ExtrinsicSuccess: {
        dispatchInfo: 'FrameSupportDispatchDispatchInfo',
      },
      ExtrinsicFailed: {
        dispatchError: 'SpRuntimeDispatchError',
        dispatchInfo: 'FrameSupportDispatchDispatchInfo',
      },
      CodeUpdated: 'Null',
      NewAccount: {
        account: 'AccountId32',
      },
      KilledAccount: {
        account: 'AccountId32',
      },
      Remarked: {
        _alias: {
          hash_: 'hash',
        },
        sender: 'AccountId32',
        hash_: 'H256',
      },
      UpgradeAuthorized: {
        codeHash: 'H256',
        checkVersion: 'bool'
      }
    }
  },
  /**
   * Lookup23: frame_support::dispatch::DispatchInfo
   **/
  FrameSupportDispatchDispatchInfo: {
    weight: 'SpWeightsWeightV2Weight',
    class: 'FrameSupportDispatchDispatchClass',
    paysFee: 'FrameSupportDispatchPays'
  },
  /**
   * Lookup24: frame_support::dispatch::DispatchClass
   **/
  FrameSupportDispatchDispatchClass: {
    _enum: ['Normal', 'Operational', 'Mandatory']
  },
  /**
   * Lookup25: frame_support::dispatch::Pays
   **/
  FrameSupportDispatchPays: {
    _enum: ['Yes', 'No']
  },
  /**
   * Lookup26: sp_runtime::DispatchError
   **/
  SpRuntimeDispatchError: {
    _enum: {
      Other: 'Null',
      CannotLookup: 'Null',
      BadOrigin: 'Null',
      Module: 'SpRuntimeModuleError',
      ConsumerRemaining: 'Null',
      NoProviders: 'Null',
      TooManyConsumers: 'Null',
      Token: 'SpRuntimeTokenError',
      Arithmetic: 'SpArithmeticArithmeticError',
      Transactional: 'SpRuntimeTransactionalError',
      Exhausted: 'Null',
      Corruption: 'Null',
      Unavailable: 'Null',
      RootNotAllowed: 'Null'
    }
  },
  /**
   * Lookup27: sp_runtime::ModuleError
   **/
  SpRuntimeModuleError: {
    index: 'u8',
    error: '[u8;4]'
  },
  /**
   * Lookup28: sp_runtime::TokenError
   **/
  SpRuntimeTokenError: {
    _enum: ['FundsUnavailable', 'OnlyProvider', 'BelowMinimum', 'CannotCreate', 'UnknownAsset', 'Frozen', 'Unsupported', 'CannotCreateHold', 'NotExpendable', 'Blocked']
  },
  /**
   * Lookup29: sp_arithmetic::ArithmeticError
   **/
  SpArithmeticArithmeticError: {
    _enum: ['Underflow', 'Overflow', 'DivisionByZero']
  },
  /**
   * Lookup30: sp_runtime::TransactionalError
   **/
  SpRuntimeTransactionalError: {
    _enum: ['LimitReached', 'NoLayer']
  },
  /**
   * Lookup31: pallet_grandpa::pallet::Event
   **/
  PalletGrandpaEvent: {
    _enum: {
      NewAuthorities: {
        authoritySet: 'Vec<(SpConsensusGrandpaAppPublic,u64)>',
      },
      Paused: 'Null',
      Resumed: 'Null'
    }
  },
  /**
   * Lookup34: sp_consensus_grandpa::app::Public
   **/
  SpConsensusGrandpaAppPublic: '[u8;32]',
  /**
   * Lookup35: pallet_balances::pallet::Event<T, I>
   **/
  PalletBalancesEvent: {
    _enum: {
      Endowed: {
        account: 'AccountId32',
        freeBalance: 'u64',
      },
      DustLost: {
        account: 'AccountId32',
        amount: 'u64',
      },
      Transfer: {
        from: 'AccountId32',
        to: 'AccountId32',
        amount: 'u64',
      },
      BalanceSet: {
        who: 'AccountId32',
        free: 'u64',
      },
      Reserved: {
        who: 'AccountId32',
        amount: 'u64',
      },
      Unreserved: {
        who: 'AccountId32',
        amount: 'u64',
      },
      ReserveRepatriated: {
        from: 'AccountId32',
        to: 'AccountId32',
        amount: 'u64',
        destinationStatus: 'FrameSupportTokensMiscBalanceStatus',
      },
      Deposit: {
        who: 'AccountId32',
        amount: 'u64',
      },
      Withdraw: {
        who: 'AccountId32',
        amount: 'u64',
      },
      Slashed: {
        who: 'AccountId32',
        amount: 'u64',
      },
      Minted: {
        who: 'AccountId32',
        amount: 'u64',
      },
      Burned: {
        who: 'AccountId32',
        amount: 'u64',
      },
      Suspended: {
        who: 'AccountId32',
        amount: 'u64',
      },
      Restored: {
        who: 'AccountId32',
        amount: 'u64',
      },
      Upgraded: {
        who: 'AccountId32',
      },
      Issued: {
        amount: 'u64',
      },
      Rescinded: {
        amount: 'u64',
      },
      Locked: {
        who: 'AccountId32',
        amount: 'u64',
      },
      Unlocked: {
        who: 'AccountId32',
        amount: 'u64',
      },
      Frozen: {
        who: 'AccountId32',
        amount: 'u64',
      },
      Thawed: {
        who: 'AccountId32',
        amount: 'u64',
      },
      TotalIssuanceForced: {
        _alias: {
          new_: 'new',
        },
        old: 'u64',
        new_: 'u64'
      }
    }
  },
  /**
   * Lookup36: frame_support::traits::tokens::misc::BalanceStatus
   **/
  FrameSupportTokensMiscBalanceStatus: {
    _enum: ['Free', 'Reserved']
  },
  /**
   * Lookup37: pallet_transaction_payment::pallet::Event<T>
   **/
  PalletTransactionPaymentEvent: {
    _enum: {
      TransactionFeePaid: {
        who: 'AccountId32',
        actualFee: 'u64',
        tip: 'u64'
      }
    }
  },
  /**
   * Lookup38: pallet_sudo::pallet::Event<T>
   **/
  PalletSudoEvent: {
    _enum: {
      Sudid: {
        sudoResult: 'Result<Null, SpRuntimeDispatchError>',
      },
      KeyChanged: {
        _alias: {
          new_: 'new',
        },
        old: 'Option<AccountId32>',
        new_: 'AccountId32',
      },
      KeyRemoved: 'Null',
      SudoAsDone: {
        sudoResult: 'Result<Null, SpRuntimeDispatchError>'
      }
    }
  },
  /**
   * Lookup42: pallet_multisig::pallet::Event<T>
   **/
  PalletMultisigEvent: {
    _enum: {
      NewMultisig: {
        approving: 'AccountId32',
        multisig: 'AccountId32',
        callHash: '[u8;32]',
      },
      MultisigApproval: {
        approving: 'AccountId32',
        timepoint: 'PalletMultisigTimepoint',
        multisig: 'AccountId32',
        callHash: '[u8;32]',
      },
      MultisigExecuted: {
        approving: 'AccountId32',
        timepoint: 'PalletMultisigTimepoint',
        multisig: 'AccountId32',
        callHash: '[u8;32]',
        result: 'Result<Null, SpRuntimeDispatchError>',
      },
      MultisigCancelled: {
        cancelling: 'AccountId32',
        timepoint: 'PalletMultisigTimepoint',
        multisig: 'AccountId32',
        callHash: '[u8;32]'
      }
    }
  },
  /**
   * Lookup43: pallet_multisig::Timepoint<BlockNumber>
   **/
  PalletMultisigTimepoint: {
    height: 'u64',
    index: 'u32'
  },
  /**
   * Lookup44: pallet_utility::pallet::Event
   **/
  PalletUtilityEvent: {
    _enum: {
      BatchInterrupted: {
        index: 'u32',
        error: 'SpRuntimeDispatchError',
      },
      BatchCompleted: 'Null',
      BatchCompletedWithErrors: 'Null',
      ItemCompleted: 'Null',
      ItemFailed: {
        error: 'SpRuntimeDispatchError',
      },
      DispatchedAs: {
        result: 'Result<Null, SpRuntimeDispatchError>'
      }
    }
  },
  /**
   * Lookup45: pallet_subspace::pallet::Event<T>
   **/
  PalletSubspaceEvent: {
    _enum: {
      NetworkAdded: '(u16,Bytes)',
      NetworkRemoved: 'u16',
      StakeAdded: '(AccountId32,AccountId32,u64)',
      StakeRemoved: '(AccountId32,AccountId32,u64)',
      WeightsSet: '(u16,u16)',
      ModuleRegistered: '(u16,u16,AccountId32)',
      ModuleDeregistered: '(u16,u16,AccountId32)',
      ModuleUpdated: '(u16,AccountId32)',
      GlobalParamsUpdated: 'PalletSubspaceParamsGlobalGlobalParams',
      SubnetParamsUpdated: 'u16',
      BridgeWithdrawn: '(AccountId32,u64)',
      Bridged: '(AccountId32,u64)'
    }
  },
  /**
   * Lookup47: pallet_subspace::params::global::GlobalParams<T>
   **/
  PalletSubspaceParamsGlobalGlobalParams: {
    maxNameLength: 'u16',
    minNameLength: 'u16',
    maxAllowedSubnets: 'u16',
    maxAllowedModules: 'u16',
    maxRegistrationsPerBlock: 'u16',
    maxAllowedWeights: 'u16',
    floorStakeDelegationFee: 'Percent',
    floorValidatorWeightFee: 'Percent',
    floorFounderShare: 'u8',
    minWeightStake: 'u64',
    curator: 'AccountId32',
    generalSubnetApplicationCost: 'u64',
    subnetImmunityPeriod: 'u64',
    governanceConfig: 'PalletGovernanceApiGovernanceConfiguration',
    kappa: 'u16',
    rho: 'u16'
  },
  /**
   * Lookup49: pallet_governance_api::GovernanceConfiguration
   **/
  PalletGovernanceApiGovernanceConfiguration: {
    proposalCost: 'u64',
    proposalExpiration: 'u32',
    voteMode: 'PalletGovernanceApiVoteMode',
    proposalRewardTreasuryAllocation: 'Percent',
    maxProposalRewardTreasuryAllocation: 'u64',
    proposalRewardInterval: 'u64'
  },
  /**
   * Lookup50: pallet_governance_api::VoteMode
   **/
  PalletGovernanceApiVoteMode: {
    _enum: ['Authority', 'Vote']
  },
  /**
   * Lookup51: pallet_governance::pallet::Event<T>
   **/
  PalletGovernanceEvent: {
    _enum: {
      ProposalCreated: 'u64',
      ProposalAccepted: 'u64',
      ProposalRefused: 'u64',
      ProposalExpired: 'u64',
      ProposalVoted: '(u64,AccountId32,bool)',
      ProposalVoteUnregistered: '(u64,AccountId32)',
      WhitelistModuleAdded: 'AccountId32',
      WhitelistModuleRemoved: 'AccountId32',
      ApplicationCreated: 'u64'
    }
  },
  /**
   * Lookup52: pallet_subnet_emission::pallet::Event<T>
   **/
  PalletSubnetEmissionEvent: {
    _enum: {
      EpochFinalized: 'u16',
      DecryptionNodeCanceled: {
        subnetId: 'u16',
        nodeId: 'AccountId32',
      },
      DecryptionNodeRotated: {
        subnetId: 'u16',
        previousNodeId: 'AccountId32',
        newNodeId: 'AccountId32',
      },
      DecryptionNodeCallbackScheduled: {
        subnetId: 'u16',
        nodeId: 'AccountId32',
        banBlock: 'u64',
      },
      DecryptionNodeBanned: {
        subnetId: 'u16',
        nodeId: 'AccountId32'
      }
    }
  },
  /**
   * Lookup53: pallet_offworker::pallet::Event<T>
   **/
  PalletOffworkerEvent: {
    _enum: {
      DecryptedWeightsSent: {
        subnetId: 'u16',
        blockNumber: 'u64',
        worker: 'AccountId32',
      },
      KeepAliveSent: {
        blockNumber: 'u64',
        worker: 'AccountId32',
      },
      AuthoritiesAdded: 'Null',
      DecryptionNodeCallbackSuccess: {
        subnetId: 'u16',
        nodeId: 'AccountId32'
      }
    }
  },
  /**
   * Lookup54: frame_system::Phase
   **/
  FrameSystemPhase: {
    _enum: {
      ApplyExtrinsic: 'u32',
      Finalization: 'Null',
      Initialization: 'Null'
    }
  },
  /**
   * Lookup58: frame_system::LastRuntimeUpgradeInfo
   **/
  FrameSystemLastRuntimeUpgradeInfo: {
    specVersion: 'Compact<u32>',
    specName: 'Text'
  },
  /**
   * Lookup61: frame_system::CodeUpgradeAuthorization<T>
   **/
  FrameSystemCodeUpgradeAuthorization: {
    codeHash: 'H256',
    checkVersion: 'bool'
  },
  /**
   * Lookup62: frame_system::pallet::Call<T>
   **/
  FrameSystemCall: {
    _enum: {
      remark: {
        remark: 'Bytes',
      },
      set_heap_pages: {
        pages: 'u64',
      },
      set_code: {
        code: 'Bytes',
      },
      set_code_without_checks: {
        code: 'Bytes',
      },
      set_storage: {
        items: 'Vec<(Bytes,Bytes)>',
      },
      kill_storage: {
        _alias: {
          keys_: 'keys',
        },
        keys_: 'Vec<Bytes>',
      },
      kill_prefix: {
        prefix: 'Bytes',
        subkeys: 'u32',
      },
      remark_with_event: {
        remark: 'Bytes',
      },
      __Unused8: 'Null',
      authorize_upgrade: {
        codeHash: 'H256',
      },
      authorize_upgrade_without_checks: {
        codeHash: 'H256',
      },
      apply_authorized_upgrade: {
        code: 'Bytes'
      }
    }
  },
  /**
   * Lookup66: frame_system::limits::BlockWeights
   **/
  FrameSystemLimitsBlockWeights: {
    baseBlock: 'SpWeightsWeightV2Weight',
    maxBlock: 'SpWeightsWeightV2Weight',
    perClass: 'FrameSupportDispatchPerDispatchClassWeightsPerClass'
  },
  /**
   * Lookup67: frame_support::dispatch::PerDispatchClass<frame_system::limits::WeightsPerClass>
   **/
  FrameSupportDispatchPerDispatchClassWeightsPerClass: {
    normal: 'FrameSystemLimitsWeightsPerClass',
    operational: 'FrameSystemLimitsWeightsPerClass',
    mandatory: 'FrameSystemLimitsWeightsPerClass'
  },
  /**
   * Lookup68: frame_system::limits::WeightsPerClass
   **/
  FrameSystemLimitsWeightsPerClass: {
    baseExtrinsic: 'SpWeightsWeightV2Weight',
    maxExtrinsic: 'Option<SpWeightsWeightV2Weight>',
    maxTotal: 'Option<SpWeightsWeightV2Weight>',
    reserved: 'Option<SpWeightsWeightV2Weight>'
  },
  /**
   * Lookup70: frame_system::limits::BlockLength
   **/
  FrameSystemLimitsBlockLength: {
    max: 'FrameSupportDispatchPerDispatchClassU32'
  },
  /**
   * Lookup71: frame_support::dispatch::PerDispatchClass<T>
   **/
  FrameSupportDispatchPerDispatchClassU32: {
    normal: 'u32',
    operational: 'u32',
    mandatory: 'u32'
  },
  /**
   * Lookup72: sp_weights::RuntimeDbWeight
   **/
  SpWeightsRuntimeDbWeight: {
    read: 'u64',
    write: 'u64'
  },
  /**
   * Lookup73: sp_version::RuntimeVersion
   **/
  SpVersionRuntimeVersion: {
    specName: 'Text',
    implName: 'Text',
    authoringVersion: 'u32',
    specVersion: 'u32',
    implVersion: 'u32',
    apis: 'Vec<([u8;8],u32)>',
    transactionVersion: 'u32',
    stateVersion: 'u8'
  },
  /**
   * Lookup78: frame_system::pallet::Error<T>
   **/
  FrameSystemError: {
    _enum: ['InvalidSpecName', 'SpecVersionNeedsToIncrease', 'FailedToExtractRuntimeVersion', 'NonDefaultComposite', 'NonZeroRefCount', 'CallFiltered', 'MultiBlockMigrationsOngoing', 'NothingAuthorized', 'Unauthorized']
  },
  /**
   * Lookup79: pallet_timestamp::pallet::Call<T>
   **/
  PalletTimestampCall: {
    _enum: {
      set: {
        now: 'Compact<u64>'
      }
    }
  },
  /**
   * Lookup81: sp_consensus_aura::sr25519::app_sr25519::Public
   **/
  SpConsensusAuraSr25519AppSr25519Public: '[u8;32]',
  /**
   * Lookup84: pallet_grandpa::StoredState<N>
   **/
  PalletGrandpaStoredState: {
    _enum: {
      Live: 'Null',
      PendingPause: {
        scheduledAt: 'u64',
        delay: 'u64',
      },
      Paused: 'Null',
      PendingResume: {
        scheduledAt: 'u64',
        delay: 'u64'
      }
    }
  },
  /**
   * Lookup85: pallet_grandpa::StoredPendingChange<N, Limit>
   **/
  PalletGrandpaStoredPendingChange: {
    scheduledAt: 'u64',
    delay: 'u64',
    nextAuthorities: 'Vec<(SpConsensusGrandpaAppPublic,u64)>',
    forced: 'Option<u64>'
  },
  /**
   * Lookup89: pallet_grandpa::pallet::Call<T>
   **/
  PalletGrandpaCall: {
    _enum: {
      report_equivocation: {
        equivocationProof: 'SpConsensusGrandpaEquivocationProof',
        keyOwnerProof: 'SpCoreVoid',
      },
      report_equivocation_unsigned: {
        equivocationProof: 'SpConsensusGrandpaEquivocationProof',
        keyOwnerProof: 'SpCoreVoid',
      },
      note_stalled: {
        delay: 'u64',
        bestFinalizedBlockNumber: 'u64'
      }
    }
  },
  /**
   * Lookup90: sp_consensus_grandpa::EquivocationProof<primitive_types::H256, N>
   **/
  SpConsensusGrandpaEquivocationProof: {
    setId: 'u64',
    equivocation: 'SpConsensusGrandpaEquivocation'
  },
  /**
   * Lookup91: sp_consensus_grandpa::Equivocation<primitive_types::H256, N>
   **/
  SpConsensusGrandpaEquivocation: {
    _enum: {
      Prevote: 'FinalityGrandpaEquivocationPrevote',
      Precommit: 'FinalityGrandpaEquivocationPrecommit'
    }
  },
  /**
   * Lookup92: finality_grandpa::Equivocation<sp_consensus_grandpa::app::Public, finality_grandpa::Prevote<primitive_types::H256, N>, sp_consensus_grandpa::app::Signature>
   **/
  FinalityGrandpaEquivocationPrevote: {
    roundNumber: 'u64',
    identity: 'SpConsensusGrandpaAppPublic',
    first: '(FinalityGrandpaPrevote,SpConsensusGrandpaAppSignature)',
    second: '(FinalityGrandpaPrevote,SpConsensusGrandpaAppSignature)'
  },
  /**
   * Lookup93: finality_grandpa::Prevote<primitive_types::H256, N>
   **/
  FinalityGrandpaPrevote: {
    targetHash: 'H256',
    targetNumber: 'u64'
  },
  /**
   * Lookup94: sp_consensus_grandpa::app::Signature
   **/
  SpConsensusGrandpaAppSignature: '[u8;64]',
  /**
   * Lookup97: finality_grandpa::Equivocation<sp_consensus_grandpa::app::Public, finality_grandpa::Precommit<primitive_types::H256, N>, sp_consensus_grandpa::app::Signature>
   **/
  FinalityGrandpaEquivocationPrecommit: {
    roundNumber: 'u64',
    identity: 'SpConsensusGrandpaAppPublic',
    first: '(FinalityGrandpaPrecommit,SpConsensusGrandpaAppSignature)',
    second: '(FinalityGrandpaPrecommit,SpConsensusGrandpaAppSignature)'
  },
  /**
   * Lookup98: finality_grandpa::Precommit<primitive_types::H256, N>
   **/
  FinalityGrandpaPrecommit: {
    targetHash: 'H256',
    targetNumber: 'u64'
  },
  /**
   * Lookup100: sp_core::Void
   **/
  SpCoreVoid: 'Null',
  /**
   * Lookup101: pallet_grandpa::pallet::Error<T>
   **/
  PalletGrandpaError: {
    _enum: ['PauseFailed', 'ResumeFailed', 'ChangePending', 'TooSoon', 'InvalidKeyOwnershipProof', 'InvalidEquivocationProof', 'DuplicateOffenceReport']
  },
  /**
   * Lookup103: pallet_balances::types::BalanceLock<Balance>
   **/
  PalletBalancesBalanceLock: {
    id: '[u8;8]',
    amount: 'u64',
    reasons: 'PalletBalancesReasons'
  },
  /**
   * Lookup104: pallet_balances::types::Reasons
   **/
  PalletBalancesReasons: {
    _enum: ['Fee', 'Misc', 'All']
  },
  /**
   * Lookup107: pallet_balances::types::ReserveData<ReserveIdentifier, Balance>
   **/
  PalletBalancesReserveData: {
    id: '[u8;8]',
    amount: 'u64'
  },
  /**
   * Lookup110: frame_support::traits::tokens::misc::IdAmount<Id, Balance>
   **/
  FrameSupportTokensMiscIdAmount: {
    id: 'Null',
    amount: 'u64'
  },
  /**
   * Lookup113: pallet_balances::pallet::Call<T, I>
   **/
  PalletBalancesCall: {
    _enum: {
      transfer_allow_death: {
        dest: 'MultiAddress',
        value: 'Compact<u64>',
      },
      __Unused1: 'Null',
      force_transfer: {
        source: 'MultiAddress',
        dest: 'MultiAddress',
        value: 'Compact<u64>',
      },
      transfer_keep_alive: {
        dest: 'MultiAddress',
        value: 'Compact<u64>',
      },
      transfer_all: {
        dest: 'MultiAddress',
        keepAlive: 'bool',
      },
      force_unreserve: {
        who: 'MultiAddress',
        amount: 'u64',
      },
      upgrade_accounts: {
        who: 'Vec<AccountId32>',
      },
      __Unused7: 'Null',
      force_set_balance: {
        who: 'MultiAddress',
        newFree: 'Compact<u64>',
      },
      force_adjust_total_issuance: {
        direction: 'PalletBalancesAdjustmentDirection',
        delta: 'Compact<u64>',
      },
      burn: {
        value: 'Compact<u64>',
        keepAlive: 'bool'
      }
    }
  },
  /**
   * Lookup118: pallet_balances::types::AdjustmentDirection
   **/
  PalletBalancesAdjustmentDirection: {
    _enum: ['Increase', 'Decrease']
  },
  /**
   * Lookup119: pallet_balances::pallet::Error<T, I>
   **/
  PalletBalancesError: {
    _enum: ['VestingBalance', 'LiquidityRestrictions', 'InsufficientBalance', 'ExistentialDeposit', 'Expendability', 'ExistingVestingSchedule', 'DeadAccount', 'TooManyReserves', 'TooManyHolds', 'TooManyFreezes', 'IssuanceDeactivated', 'DeltaZero']
  },
  /**
   * Lookup121: pallet_transaction_payment::Releases
   **/
  PalletTransactionPaymentReleases: {
    _enum: ['V1Ancient', 'V2']
  },
  /**
   * Lookup122: pallet_sudo::pallet::Call<T>
   **/
  PalletSudoCall: {
    _enum: {
      sudo: {
        call: 'Call',
      },
      sudo_unchecked_weight: {
        call: 'Call',
        weight: 'SpWeightsWeightV2Weight',
      },
      set_key: {
        _alias: {
          new_: 'new',
        },
        new_: 'MultiAddress',
      },
      sudo_as: {
        who: 'MultiAddress',
        call: 'Call',
      },
      remove_key: 'Null'
    }
  },
  /**
   * Lookup124: pallet_multisig::pallet::Call<T>
   **/
  PalletMultisigCall: {
    _enum: {
      as_multi_threshold_1: {
        otherSignatories: 'Vec<AccountId32>',
        call: 'Call',
      },
      as_multi: {
        threshold: 'u16',
        otherSignatories: 'Vec<AccountId32>',
        maybeTimepoint: 'Option<PalletMultisigTimepoint>',
        call: 'Call',
        maxWeight: 'SpWeightsWeightV2Weight',
      },
      approve_as_multi: {
        threshold: 'u16',
        otherSignatories: 'Vec<AccountId32>',
        maybeTimepoint: 'Option<PalletMultisigTimepoint>',
        callHash: '[u8;32]',
        maxWeight: 'SpWeightsWeightV2Weight',
      },
      cancel_as_multi: {
        threshold: 'u16',
        otherSignatories: 'Vec<AccountId32>',
        timepoint: 'PalletMultisigTimepoint',
        callHash: '[u8;32]'
      }
    }
  },
  /**
   * Lookup126: pallet_utility::pallet::Call<T>
   **/
  PalletUtilityCall: {
    _enum: {
      batch: {
        calls: 'Vec<Call>',
      },
      as_derivative: {
        index: 'u16',
        call: 'Call',
      },
      batch_all: {
        calls: 'Vec<Call>',
      },
      dispatch_as: {
        asOrigin: 'NodeSubspaceRuntimeOriginCaller',
        call: 'Call',
      },
      force_batch: {
        calls: 'Vec<Call>',
      },
      with_weight: {
        call: 'Call',
        weight: 'SpWeightsWeightV2Weight'
      }
    }
  },
  /**
   * Lookup128: node_subspace_runtime::OriginCaller
   **/
  NodeSubspaceRuntimeOriginCaller: {
    _enum: {
      system: 'FrameSupportDispatchRawOrigin',
      Void: 'SpCoreVoid'
    }
  },
  /**
   * Lookup129: frame_support::dispatch::RawOrigin<sp_core::crypto::AccountId32>
   **/
  FrameSupportDispatchRawOrigin: {
    _enum: {
      Root: 'Null',
      Signed: 'AccountId32',
      None: 'Null'
    }
  },
  /**
   * Lookup130: pallet_subspace::pallet::Call<T>
   **/
  PalletSubspaceCall: {
    _enum: {
      __Unused0: 'Null',
      add_stake: {
        moduleKey: 'AccountId32',
        amount: 'u64',
      },
      remove_stake: {
        moduleKey: 'AccountId32',
        amount: 'u64',
      },
      add_stake_multiple: {
        moduleKeys: 'Vec<AccountId32>',
        amounts: 'Vec<u64>',
      },
      remove_stake_multiple: {
        moduleKeys: 'Vec<AccountId32>',
        amounts: 'Vec<u64>',
      },
      transfer_stake: {
        moduleKey: 'AccountId32',
        newModuleKey: 'AccountId32',
        amount: 'u64',
      },
      transfer_multiple: {
        destinations: 'Vec<AccountId32>',
        amounts: 'Vec<u64>',
      },
      register: {
        networkName: 'Bytes',
        name: 'Bytes',
        address: 'Bytes',
        moduleKey: 'AccountId32',
        metadata: 'Option<Bytes>',
      },
      deregister: {
        netuid: 'u16',
      },
      update_module: {
        netuid: 'u16',
        name: 'Bytes',
        address: 'Bytes',
        stakeDelegationFee: 'Option<Percent>',
        validatorWeightFee: 'Option<Percent>',
        metadata: 'Option<Bytes>',
      },
      update_subnet: {
        netuid: 'u16',
        founder: 'AccountId32',
        founderShare: 'u16',
        name: 'Bytes',
        metadata: 'Option<Bytes>',
        immunityPeriod: 'u16',
        incentiveRatio: 'u16',
        maxAllowedUids: 'u16',
        maxAllowedWeights: 'u16',
        minAllowedWeights: 'u16',
        maxWeightAge: 'u64',
        tempo: 'u16',
        maximumSetWeightCallsPerEpoch: 'Option<u16>',
        voteMode: 'PalletGovernanceApiVoteMode',
        bondsMa: 'u64',
        moduleBurnConfig: 'PalletSubspaceParamsBurnGeneralBurnConfiguration',
        minValidatorStake: 'u64',
        maxAllowedValidators: 'Option<u16>',
        useWeightsEncryption: 'bool',
        copierMargin: 'SubstrateFixedFixedI128',
        maxEncryptionPeriod: 'Option<u64>',
      },
      __Unused11: 'Null',
      register_subnet: {
        name: 'Bytes',
        metadata: 'Option<Bytes>',
      },
      bridge: {
        amount: 'u64',
      },
      bridge_withdraw: {
        amount: 'u64'
      }
    }
  },
  /**
   * Lookup138: pallet_subspace::params::burn::GeneralBurnConfiguration<T>
   **/
  PalletSubspaceParamsBurnGeneralBurnConfiguration: {
    minBurn: 'u64',
    maxBurn: 'u64',
    adjustmentAlpha: 'u64',
    targetRegistrationsInterval: 'u16',
    targetRegistrationsPerInterval: 'u16',
    maxRegistrationsPerInterval: 'u16'
  },
  /**
   * Lookup139: substrate_fixed::FixedI128<typenum::uint::UInt<typenum::uint::UInt<typenum::uint::UInt<typenum::uint::UInt<typenum::uint::UInt<typenum::uint::UInt<typenum::uint::UInt<typenum::uint::UTerm, typenum::bit::B1>, typenum::bit::B0>, typenum::bit::B0>, typenum::bit::B0>, typenum::bit::B0>, typenum::bit::B0>, typenum::bit::B0>>
   **/
  SubstrateFixedFixedI128: {
    bits: 'i128'
  },
  /**
   * Lookup145: typenum::uint::UInt<typenum::uint::UInt<typenum::uint::UTerm, typenum::bit::B1>, typenum::bit::B0>
   **/
  TypenumUIntUInt: {
    msb: 'TypenumUIntUTerm',
    lsb: 'TypenumBitB0'
  },
  /**
   * Lookup146: typenum::uint::UInt<typenum::uint::UTerm, typenum::bit::B1>
   **/
  TypenumUIntUTerm: {
    msb: 'TypenumUintUTerm',
    lsb: 'TypenumBitB1'
  },
  /**
   * Lookup147: typenum::uint::UTerm
   **/
  TypenumUintUTerm: 'Null',
  /**
   * Lookup148: typenum::bit::B1
   **/
  TypenumBitB1: 'Null',
  /**
   * Lookup149: typenum::bit::B0
   **/
  TypenumBitB0: 'Null',
  /**
   * Lookup151: pallet_governance::pallet::Call<T>
   **/
  PalletGovernanceCall: {
    _enum: {
      add_global_params_proposal: {
        data: 'Bytes',
        maxNameLength: 'u16',
        minNameLength: 'u16',
        maxAllowedSubnets: 'u16',
        maxAllowedModules: 'u16',
        maxRegistrationsPerBlock: 'u16',
        maxAllowedWeights: 'u16',
        floorStakeDelegationFee: 'Percent',
        floorValidatorWeightFee: 'Percent',
        floorFounderShare: 'u8',
        minWeightStake: 'u64',
        curator: 'AccountId32',
        proposalCost: 'u64',
        proposalExpiration: 'u32',
        generalSubnetApplicationCost: 'u64',
        kappa: 'u16',
        rho: 'u16',
        subnetImmunityPeriod: 'u64',
      },
      add_subnet_params_proposal: {
        netuid: 'u16',
        data: 'Bytes',
        founder: 'AccountId32',
        founderShare: 'u16',
        name: 'Bytes',
        metadata: 'Option<Bytes>',
        immunityPeriod: 'u16',
        incentiveRatio: 'u16',
        maxAllowedUids: 'u16',
        maxAllowedWeights: 'u16',
        minAllowedWeights: 'u16',
        maxWeightAge: 'u64',
        tempo: 'u16',
        maximumSetWeightCallsPerEpoch: 'Option<u16>',
        voteMode: 'PalletGovernanceApiVoteMode',
        bondsMa: 'u64',
        moduleBurnConfig: 'PalletSubspaceParamsBurnGeneralBurnConfiguration',
        minValidatorStake: 'u64',
        maxAllowedValidators: 'Option<u16>',
        useWeightsEncryption: 'bool',
        copierMargin: 'SubstrateFixedFixedI128',
        maxEncryptionPeriod: 'Option<u64>',
      },
      add_global_custom_proposal: {
        data: 'Bytes',
      },
      add_subnet_custom_proposal: {
        netuid: 'u16',
        data: 'Bytes',
      },
      add_transfer_dao_treasury_proposal: {
        data: 'Bytes',
        value: 'u64',
        dest: 'AccountId32',
      },
      vote_proposal: {
        proposalId: 'u64',
        agree: 'bool',
      },
      remove_vote_proposal: {
        proposalId: 'u64',
      },
      enable_vote_power_delegation: 'Null',
      disable_vote_power_delegation: 'Null',
      add_dao_application: {
        applicationKey: 'AccountId32',
        data: 'Bytes',
      },
      refuse_dao_application: {
        id: 'u64',
      },
      add_to_whitelist: {
        moduleKey: 'AccountId32',
      },
      remove_from_whitelist: {
        moduleKey: 'AccountId32'
      }
    }
  },
  /**
   * Lookup152: pallet_subnet_emission::pallet::Call<T>
   **/
  PalletSubnetEmissionCall: {
    _enum: {
      set_weights: {
        netuid: 'u16',
        uids: 'Vec<u16>',
        weights: 'Vec<u16>',
      },
      set_weights_encrypted: {
        netuid: 'u16',
        encryptedWeights: 'Bytes',
        decryptedWeightsHash: 'Bytes',
      },
      delegate_weight_control: {
        netuid: 'u16',
        target: 'AccountId32',
      },
      remove_weight_control: {
        netuid: 'u16'
      }
    }
  },
  /**
   * Lookup154: pallet_offworker::pallet::Call<T>
   **/
  PalletOffworkerCall: {
    _enum: {
      send_decrypted_weights: {
        payload: 'PalletOffworkerDecryptedWeightsPayload',
        signature: 'SpRuntimeMultiSignature',
      },
      send_ping: {
        payload: 'PalletOffworkerKeepAlivePayload',
        signature: 'SpRuntimeMultiSignature',
      },
      add_authorities: {
        newAuthorities: 'Vec<(AccountId32,(Bytes,Bytes))>'
      }
    }
  },
  /**
   * Lookup155: pallet_offworker::types::DecryptedWeightsPayload<sp_runtime::MultiSigner, BlockNumber>
   **/
  PalletOffworkerDecryptedWeightsPayload: {
    subnetId: 'u16',
    decryptedWeights: 'Vec<(u64,Vec<(u16,Vec<(u16,u16)>,Bytes)>)>',
    delta: 'SubstrateFixedFixedI128',
    blockNumber: 'u64',
    public: 'SpRuntimeMultiSigner',
    forcedSendByRotation: 'bool'
  },
  /**
   * Lookup156: sp_runtime::MultiSigner
   **/
  SpRuntimeMultiSigner: {
    _enum: {
      Ed25519: '[u8;32]',
      Sr25519: '[u8;32]',
      Ecdsa: '[u8;33]'
    }
  },
  /**
   * Lookup164: sp_runtime::MultiSignature
   **/
  SpRuntimeMultiSignature: {
    _enum: {
      Ed25519: '[u8;64]',
      Sr25519: '[u8;64]',
      Ecdsa: '[u8;65]'
    }
  },
  /**
   * Lookup166: pallet_offworker::types::KeepAlivePayload<sp_runtime::MultiSigner, BlockNumber>
   **/
  PalletOffworkerKeepAlivePayload: {
    publicKey: '(Bytes,Bytes)',
    blockNumber: 'u64',
    public: 'SpRuntimeMultiSigner'
  },
  /**
   * Lookup169: pallet_sudo::pallet::Error<T>
   **/
  PalletSudoError: {
    _enum: ['RequireSudo']
  },
  /**
   * Lookup171: pallet_multisig::Multisig<BlockNumber, Balance, sp_core::crypto::AccountId32, MaxApprovals>
   **/
  PalletMultisigMultisig: {
    when: 'PalletMultisigTimepoint',
    deposit: 'u64',
    depositor: 'AccountId32',
    approvals: 'Vec<AccountId32>'
  },
  /**
   * Lookup173: pallet_multisig::pallet::Error<T>
   **/
  PalletMultisigError: {
    _enum: ['MinimumThreshold', 'AlreadyApproved', 'NoApprovalsNeeded', 'TooFewSignatories', 'TooManySignatories', 'SignatoriesOutOfOrder', 'SenderInSignatories', 'NotFound', 'NotOwner', 'NoTimepoint', 'WrongTimepoint', 'UnexpectedTimepoint', 'MaxWeightTooLow', 'AlreadyStored']
  },
  /**
   * Lookup174: pallet_utility::pallet::Error<T>
   **/
  PalletUtilityError: {
    _enum: ['TooManyCalls']
  },
  /**
   * Lookup179: pallet_subspace::pallet::MinimumFees
   **/
  PalletSubspaceMinimumFees: {
    stakeDelegationFee: 'Percent',
    validatorWeightFee: 'Percent'
  },
  /**
   * Lookup180: pallet_subspace::pallet::ValidatorFees
   **/
  PalletSubspaceValidatorFees: {
    stakeDelegationFee: 'Percent',
    validatorWeightFee: 'Percent'
  },
  /**
   * Lookup181: frame_support::PalletId
   **/
  FrameSupportPalletId: '[u8;8]',
  /**
   * Lookup182: pallet_subspace::pallet::Error<T>
   **/
  PalletSubspaceError: {
    _enum: ['NetworkDoesNotExist', 'ModuleDoesNotExist', 'NetworkIsImmuned', 'NotEnoughBalanceToRegisterSubnet', 'NotEnoughStakeToWithdraw', 'NotEnoughBalanceToStake', 'WeightVecNotEqualSize', 'DuplicateUids', 'InvalidUid', 'InvalidUidsLength', 'TooManyRegistrationsPerBlock', 'TooManyRegistrationsPerInterval', 'TooManySubnetRegistrationsPerInterval', 'AlreadyRegistered', 'CouldNotConvertToBalance', 'InvalidTempo', 'SettingWeightsTooFast', 'InvalidMaxAllowedUids', 'NetuidDoesNotExist', 'SubnetNameAlreadyExists', 'SubnetNameTooShort', 'SubnetNameTooLong', 'InvalidSubnetName', 'BalanceNotAdded', 'StakeNotRemoved', 'KeyAlreadyRegistered', 'EmptyKeys', 'TooManyKeys', 'InvalidShares', 'NotFounder', 'NotEnoughStakeToSetWeights', 'NotEnoughStakeToStartNetwork', 'NotEnoughStakePerWeight', 'NoSelfWeight', 'DifferentLengths', 'NotEnoughBalanceToRegister', 'StakeNotAdded', 'BalanceNotRemoved', 'BalanceCouldNotBeRemoved', 'NotEnoughStakeToRegister', 'StillRegistered', 'MaxAllowedModules', 'NotEnoughBalanceToTransfer', 'NotVoteMode', 'InvalidTrustRatio', 'InvalidMinAllowedWeights', 'InvalidMaxAllowedWeights', 'InvalidMinDelegationFee', 'InvalidModuleMetadata', 'ModuleMetadataTooLong', 'InvalidSubnetMetadata', 'SubnetMetadataTooLong', 'InvalidMaxNameLength', 'InvalidMinNameLenght', 'InvalidMaxAllowedSubnets', 'InvalidMaxAllowedModules', 'InvalidMaxRegistrationsPerBlock', 'InvalidMinBurn', 'InvalidMaxBurn', 'ModuleNameTooLong', 'ModuleNameTooShort', 'InvalidModuleName', 'ModuleAddressTooLong', 'InvalidModuleAddress', 'ModuleNameAlreadyExists', 'InvalidFounderShare', 'InvalidIncentiveRatio', 'InvalidGeneralSubnetApplicationCost', 'InvalidProposalExpiration', 'InvalidMaxWeightAge', 'MaxSetWeightsPerEpochReached', 'ArithmeticError', 'InvalidTargetRegistrationsPerInterval', 'InvalidMaxRegistrationsPerInterval', 'InvalidAdjustmentAlpha', 'InvalidTargetRegistrationsInterval', 'InvalidMinImmunityStake', 'ExtrinsicPanicked', 'StepPanicked', 'StakeTooSmall', 'DelegatingControl', 'NotDelegatingControl', 'RootnetSubnetNotFound', 'InvalidMinValidatorStake', 'InvalidMaxAllowedValidators', 'InvalidMaxEncryptionPeriod', 'SubnetEncrypted', 'SubnetNotEncrypted', 'UidNotWhitelisted', 'InvalidCopierMargin', 'InvalidFloorFounderShare', 'InvalidSubnetImmunityPeriod', 'InvalidKappa', 'InvalidRho', 'InvalidMaximumSetWeightCallsPerEpoch', 'InvalidModuleParams', 'InvalidMinFees', 'CannotDecreaseFee', 'NotEnoughBalance', 'NotEnoughBridgedTokens']
  },
  /**
   * Lookup183: pallet_governance::proposal::Proposal<T>
   **/
  PalletGovernanceProposal: {
    id: 'u64',
    proposer: 'AccountId32',
    expirationBlock: 'u64',
    data: 'PalletGovernanceProposalProposalData',
    status: 'PalletGovernanceProposalProposalStatus',
    metadata: 'Bytes',
    proposalCost: 'u64',
    creationBlock: 'u64'
  },
  /**
   * Lookup184: pallet_governance::proposal::ProposalData<T>
   **/
  PalletGovernanceProposalProposalData: {
    _enum: {
      GlobalCustom: 'Null',
      GlobalParams: 'PalletSubspaceParamsGlobalGlobalParams',
      SubnetCustom: {
        subnetId: 'u16',
      },
      SubnetParams: {
        subnetId: 'u16',
        params: 'PalletSubspaceParamsSubnetSubnetParams',
      },
      TransferDaoTreasury: {
        account: 'AccountId32',
        amount: 'u64'
      }
    }
  },
  /**
   * Lookup185: pallet_subspace::params::subnet::SubnetParams<T>
   **/
  PalletSubspaceParamsSubnetSubnetParams: {
    founder: 'AccountId32',
    founderShare: 'u16',
    immunityPeriod: 'u16',
    incentiveRatio: 'u16',
    maxAllowedUids: 'u16',
    maxAllowedWeights: 'u16',
    minAllowedWeights: 'u16',
    maxWeightAge: 'u64',
    name: 'Bytes',
    metadata: 'Option<Bytes>',
    tempo: 'u16',
    maximumSetWeightCallsPerEpoch: 'Option<u16>',
    bondsMa: 'u64',
    moduleBurnConfig: 'PalletSubspaceParamsBurnGeneralBurnConfiguration',
    minValidatorStake: 'u64',
    maxAllowedValidators: 'Option<u16>',
    governanceConfig: 'PalletGovernanceApiGovernanceConfiguration',
    useWeightsEncryption: 'bool',
    copierMargin: 'SubstrateFixedFixedI128',
    maxEncryptionPeriod: 'Option<u64>'
  },
  /**
   * Lookup186: pallet_governance::proposal::ProposalStatus<T>
   **/
  PalletGovernanceProposalProposalStatus: {
    _enum: {
      Open: {
        votesFor: 'BTreeSet<AccountId32>',
        votesAgainst: 'BTreeSet<AccountId32>',
        stakeFor: 'u64',
        stakeAgainst: 'u64',
      },
      Accepted: {
        block: 'u64',
        stakeFor: 'u64',
        stakeAgainst: 'u64',
      },
      Refused: {
        block: 'u64',
        stakeFor: 'u64',
        stakeAgainst: 'u64',
      },
      Expired: 'Null'
    }
  },
  /**
   * Lookup189: pallet_governance::proposal::UnrewardedProposal<T>
   **/
  PalletGovernanceProposalUnrewardedProposal: {
    subnetId: 'Option<u16>',
    block: 'u64',
    votesFor: 'BTreeMap<AccountId32, u64>',
    votesAgainst: 'BTreeMap<AccountId32, u64>'
  },
  /**
   * Lookup194: pallet_governance::dao::CuratorApplication<T>
   **/
  PalletGovernanceDaoCuratorApplication: {
    id: 'u64',
    userId: 'AccountId32',
    payingFor: 'AccountId32',
    data: 'Bytes',
    status: 'PalletGovernanceDaoApplicationStatus',
    applicationCost: 'u64',
    blockNumber: 'u64'
  },
  /**
   * Lookup195: pallet_governance::dao::ApplicationStatus
   **/
  PalletGovernanceDaoApplicationStatus: {
    _enum: ['Pending', 'Accepted', 'Refused', 'Removed']
  },
  /**
   * Lookup196: pallet_governance::pallet::Error<T>
   **/
  PalletGovernanceError: {
    _enum: ['ProposalIsFinished', 'InvalidProposalFinalizationParameters', 'InvalidProposalVotingParameters', 'InvalidProposalCost', 'InvalidProposalExpiration', 'NotEnoughBalanceToPropose', 'ProposalDataTooSmall', 'ProposalDataTooLarge', 'ModuleDelegatingForMaxStakers', 'ProposalNotFound', 'ProposalClosed', 'InvalidProposalData', 'InvalidCurrencyConversionValue', 'InsufficientDaoTreasuryFunds', 'NotVoteMode', 'AlreadyVoted', 'NotVoted', 'InsufficientStake', 'VoterIsDelegatingVotingPower', 'VoteModeIsNotAuthority', 'InternalError', 'ApplicationTooSmall', 'InvalidApplicationSize', 'ApplicationNotPending', 'ApplicationKeyAlreadyUsed', 'InvalidApplication', 'NotEnoughBalanceToApply', 'NotCurator', 'ApplicationNotFound', 'AlreadyWhitelisted', 'NotWhitelisted', 'CouldNotConvertToBalance']
  },
  /**
   * Lookup197: pallet_subnet_emission::pallet::EncryptionMechanism
   **/
  PalletSubnetEmissionEncryptionMechanism: {
    encrypted: 'Bytes',
    decryptedHashes: 'Bytes'
  },
  /**
   * Lookup198: pallet_subnet_emission::types::SubnetDecryptionInfo<node_subspace_runtime::Runtime>
   **/
  PalletSubnetEmissionSubnetDecryptionInfo: {
    nodeId: 'AccountId32',
    nodePublicKey: '(Bytes,Bytes)',
    validityBlock: 'Option<u64>',
    lastKeepAlive: 'u64',
    rotatingFrom: 'Option<AccountId32>'
  },
  /**
   * Lookup199: node_subspace_runtime::Runtime
   **/
  NodeSubspaceRuntimeRuntime: 'Null',
  /**
   * Lookup200: pallet_subnet_emission_api::SubnetConsensus
   **/
  PalletSubnetEmissionApiSubnetConsensus: {
    _enum: ['Yuma', 'Linear', 'Treasury', 'Root']
  },
  /**
   * Lookup202: pallet_subnet_emission::subnet_consensus::util::params::ConsensusParams<T>
   **/
  PalletSubnetEmissionSubnetConsensusUtilParamsConsensusParams: {
    subnetId: 'u16',
    tokenEmission: 'u64',
    modules: 'BTreeMap<AccountId32, PalletSubnetEmissionSubnetConsensusUtilParamsModuleParams>',
    kappa: 'SubstrateFixedFixedI64',
    founderKey: 'AccountId32',
    founderEmission: 'u64',
    currentBlock: 'u64',
    activityCutoff: 'u64',
    useWeightsEncryption: 'bool',
    maxAllowedValidators: 'Option<u16>',
    bondsMovingAverage: 'u64',
    alphaValues: '(SubstrateFixedFixedI64,SubstrateFixedFixedI64)',
    minValStake: 'SubstrateFixedFixedI128'
  },
  /**
   * Lookup205: pallet_subnet_emission::subnet_consensus::util::params::ModuleParams<sp_core::crypto::AccountId32>
   **/
  PalletSubnetEmissionSubnetConsensusUtilParamsModuleParams: {
    uid: 'u16',
    lastUpdate: 'u64',
    blockAtRegistration: 'u64',
    validatorPermit: 'bool',
    stakeNormalized: 'SubstrateFixedFixedI64',
    stakeOriginal: 'SubstrateFixedFixedI128',
    delegatedTo: 'Option<(AccountId32,Percent)>',
    bonds: 'Vec<(u16,u16)>',
    weightEncrypted: 'Bytes',
    weightHash: 'Bytes'
  },
  /**
   * Lookup206: substrate_fixed::FixedI64<typenum::uint::UInt<typenum::uint::UInt<typenum::uint::UInt<typenum::uint::UInt<typenum::uint::UInt<typenum::uint::UInt<typenum::uint::UTerm, typenum::bit::B1>, typenum::bit::B0>, typenum::bit::B0>, typenum::bit::B0>, typenum::bit::B0>, typenum::bit::B0>>
   **/
  SubstrateFixedFixedI64: {
    bits: 'i64'
  },
  /**
   * Lookup216: pallet_offworker::pallet::Error<T>
   **/
  PalletOffworkerError: {
    _enum: ['InvalidDecryptionKey', 'InvalidSubnetId', 'TooManyAuthorities', 'EmptyDecryptedWeights', 'DecryptedWeightsLengthMismatch']
  },
  /**
   * Lookup219: frame_system::extensions::check_non_zero_sender::CheckNonZeroSender<T>
   **/
  FrameSystemExtensionsCheckNonZeroSender: 'Null',
  /**
   * Lookup220: frame_system::extensions::check_spec_version::CheckSpecVersion<T>
   **/
  FrameSystemExtensionsCheckSpecVersion: 'Null',
  /**
   * Lookup221: frame_system::extensions::check_tx_version::CheckTxVersion<T>
   **/
  FrameSystemExtensionsCheckTxVersion: 'Null',
  /**
   * Lookup222: frame_system::extensions::check_genesis::CheckGenesis<T>
   **/
  FrameSystemExtensionsCheckGenesis: 'Null',
  /**
   * Lookup225: frame_system::extensions::check_nonce::CheckNonce<T>
   **/
  FrameSystemExtensionsCheckNonce: 'Compact<u32>',
  /**
   * Lookup226: frame_system::extensions::check_weight::CheckWeight<T>
   **/
  FrameSystemExtensionsCheckWeight: 'Null',
  /**
   * Lookup227: pallet_transaction_payment::ChargeTransactionPayment<T>
   **/
  PalletTransactionPaymentChargeTransactionPayment: 'Compact<u64>'
};
