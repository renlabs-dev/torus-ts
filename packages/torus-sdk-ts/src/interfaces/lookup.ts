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
    free: 'u128',
    reserved: 'u128',
    frozen: 'u128',
    flags: 'u128'
  },
  /**
   * Lookup9: frame_support::dispatch::PerDispatchClass<sp_weights::weight_v2::Weight>
   **/
  FrameSupportDispatchPerDispatchClassWeight: {
    normal: 'SpWeightsWeightV2Weight',
    operational: 'SpWeightsWeightV2Weight',
    mandatory: 'SpWeightsWeightV2Weight'
  },
  /**
   * Lookup10: sp_weights::weight_v2::Weight
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
   * Lookup20: frame_system::EventRecord<torus_runtime::RuntimeEvent, primitive_types::H256>
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
      TaskStarted: {
        task: 'TorusRuntimeRuntimeTask',
      },
      TaskCompleted: {
        task: 'TorusRuntimeRuntimeTask',
      },
      TaskFailed: {
        task: 'TorusRuntimeRuntimeTask',
        err: 'SpRuntimeDispatchError',
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
   * Lookup31: torus_runtime::RuntimeTask
   **/
  TorusRuntimeRuntimeTask: 'Null',
  /**
   * Lookup32: pallet_grandpa::pallet::Event
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
   * Lookup35: sp_consensus_grandpa::app::Public
   **/
  SpConsensusGrandpaAppPublic: '[u8;32]',
  /**
   * Lookup36: pallet_balances::pallet::Event<T, I>
   **/
  PalletBalancesEvent: {
    _enum: {
      Endowed: {
        account: 'AccountId32',
        freeBalance: 'u128',
      },
      DustLost: {
        account: 'AccountId32',
        amount: 'u128',
      },
      Transfer: {
        from: 'AccountId32',
        to: 'AccountId32',
        amount: 'u128',
      },
      BalanceSet: {
        who: 'AccountId32',
        free: 'u128',
      },
      Reserved: {
        who: 'AccountId32',
        amount: 'u128',
      },
      Unreserved: {
        who: 'AccountId32',
        amount: 'u128',
      },
      ReserveRepatriated: {
        from: 'AccountId32',
        to: 'AccountId32',
        amount: 'u128',
        destinationStatus: 'FrameSupportTokensMiscBalanceStatus',
      },
      Deposit: {
        who: 'AccountId32',
        amount: 'u128',
      },
      Withdraw: {
        who: 'AccountId32',
        amount: 'u128',
      },
      Slashed: {
        who: 'AccountId32',
        amount: 'u128',
      },
      Minted: {
        who: 'AccountId32',
        amount: 'u128',
      },
      Burned: {
        who: 'AccountId32',
        amount: 'u128',
      },
      Suspended: {
        who: 'AccountId32',
        amount: 'u128',
      },
      Restored: {
        who: 'AccountId32',
        amount: 'u128',
      },
      Upgraded: {
        who: 'AccountId32',
      },
      Issued: {
        amount: 'u128',
      },
      Rescinded: {
        amount: 'u128',
      },
      Locked: {
        who: 'AccountId32',
        amount: 'u128',
      },
      Unlocked: {
        who: 'AccountId32',
        amount: 'u128',
      },
      Frozen: {
        who: 'AccountId32',
        amount: 'u128',
      },
      Thawed: {
        who: 'AccountId32',
        amount: 'u128',
      },
      TotalIssuanceForced: {
        _alias: {
          new_: 'new',
        },
        old: 'u128',
        new_: 'u128'
      }
    }
  },
  /**
   * Lookup37: frame_support::traits::tokens::misc::BalanceStatus
   **/
  FrameSupportTokensMiscBalanceStatus: {
    _enum: ['Free', 'Reserved']
  },
  /**
   * Lookup38: pallet_transaction_payment::pallet::Event<T>
   **/
  PalletTransactionPaymentEvent: {
    _enum: {
      TransactionFeePaid: {
        who: 'AccountId32',
        actualFee: 'u128',
        tip: 'u128'
      }
    }
  },
  /**
   * Lookup39: pallet_sudo::pallet::Event<T>
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
   * Lookup43: pallet_multisig::pallet::Event<T>
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
   * Lookup44: pallet_multisig::Timepoint<BlockNumber>
   **/
  PalletMultisigTimepoint: {
    height: 'u64',
    index: 'u32'
  },
  /**
   * Lookup45: pallet_ethereum::pallet::Event
   **/
  PalletEthereumEvent: {
    _enum: {
      Executed: {
        from: 'H160',
        to: 'H160',
        transactionHash: 'H256',
        exitReason: 'EvmCoreErrorExitReason',
        extraData: 'Bytes'
      }
    }
  },
  /**
   * Lookup48: evm_core::error::ExitReason
   **/
  EvmCoreErrorExitReason: {
    _enum: {
      Succeed: 'EvmCoreErrorExitSucceed',
      Error: 'EvmCoreErrorExitError',
      Revert: 'EvmCoreErrorExitRevert',
      Fatal: 'EvmCoreErrorExitFatal'
    }
  },
  /**
   * Lookup49: evm_core::error::ExitSucceed
   **/
  EvmCoreErrorExitSucceed: {
    _enum: ['Stopped', 'Returned', 'Suicided']
  },
  /**
   * Lookup50: evm_core::error::ExitError
   **/
  EvmCoreErrorExitError: {
    _enum: {
      StackUnderflow: 'Null',
      StackOverflow: 'Null',
      InvalidJump: 'Null',
      InvalidRange: 'Null',
      DesignatedInvalid: 'Null',
      CallTooDeep: 'Null',
      CreateCollision: 'Null',
      CreateContractLimit: 'Null',
      OutOfOffset: 'Null',
      OutOfGas: 'Null',
      OutOfFund: 'Null',
      PCUnderflow: 'Null',
      CreateEmpty: 'Null',
      Other: 'Text',
      MaxNonce: 'Null',
      InvalidCode: 'u8'
    }
  },
  /**
   * Lookup54: evm_core::error::ExitRevert
   **/
  EvmCoreErrorExitRevert: {
    _enum: ['Reverted']
  },
  /**
   * Lookup55: evm_core::error::ExitFatal
   **/
  EvmCoreErrorExitFatal: {
    _enum: {
      NotSupported: 'Null',
      UnhandledInterrupt: 'Null',
      CallErrorAsFatal: 'EvmCoreErrorExitError',
      Other: 'Text'
    }
  },
  /**
   * Lookup56: pallet_evm::pallet::Event<T>
   **/
  PalletEvmEvent: {
    _enum: {
      Log: {
        log: 'EthereumLog',
      },
      Created: {
        address: 'H160',
      },
      CreatedFailed: {
        address: 'H160',
      },
      Executed: {
        address: 'H160',
      },
      ExecutedFailed: {
        address: 'H160'
      }
    }
  },
  /**
   * Lookup57: ethereum::log::Log
   **/
  EthereumLog: {
    address: 'H160',
    topics: 'Vec<H256>',
    data: 'Bytes'
  },
  /**
   * Lookup59: pallet_governance::pallet::Event<T>
   **/
  PalletGovernanceEvent: {
    _enum: {
      ProposalCreated: 'u64',
      ProposalAccepted: 'u64',
      ProposalRefused: 'u64',
      ProposalExpired: 'u64',
      ProposalVoted: '(u64,AccountId32,bool)',
      ProposalVoteUnregistered: '(u64,AccountId32)',
      WhitelistAdded: 'AccountId32',
      WhitelistRemoved: 'AccountId32',
      ApplicationCreated: 'u32',
      ApplicationAccepted: 'u32',
      ApplicationDenied: 'u32',
      ApplicationExpired: 'u32',
      PenaltyApplied: {
        curator: 'AccountId32',
        agent: 'AccountId32',
        penalty: 'Percent',
      },
      AgentFreezingToggled: {
        curator: 'AccountId32',
        newState: 'bool',
      },
      NamespaceFreezingToggled: {
        curator: 'AccountId32',
        newState: 'bool'
      }
    }
  },
  /**
   * Lookup61: pallet_torus0::pallet::Event<T>
   **/
  PalletTorus0Event: {
    _enum: {
      StakeAdded: '(AccountId32,AccountId32,u128)',
      StakeRemoved: '(AccountId32,AccountId32,u128)',
      AgentRegistered: 'AccountId32',
      AgentUnregistered: 'AccountId32',
      AgentUpdated: 'AccountId32',
      NamespaceCreated: {
        owner: 'PalletTorus0NamespaceNamespaceOwnership',
        path: 'Bytes',
      },
      NamespaceDeleted: {
        owner: 'PalletTorus0NamespaceNamespaceOwnership',
        path: 'Bytes'
      }
    }
  },
  /**
   * Lookup62: pallet_torus0::namespace::NamespaceOwnership<T>
   **/
  PalletTorus0NamespaceNamespaceOwnership: {
    _enum: {
      System: 'Null',
      Account: 'AccountId32'
    }
  },
  /**
   * Lookup65: pallet_emission0::pallet::Event<T>
   **/
  PalletEmission0Event: {
    _enum: {
      WeightsSet: 'AccountId32',
      DelegatedWeightControl: '(AccountId32,AccountId32)'
    }
  },
  /**
   * Lookup66: pallet_permission0::pallet::Event<T>
   **/
  PalletPermission0Event: {
    _enum: {
      PermissionGranted: {
        grantor: 'AccountId32',
        grantee: 'AccountId32',
        permissionId: 'H256',
      },
      PermissionRevoked: {
        grantor: 'AccountId32',
        grantee: 'AccountId32',
        revokedBy: 'Option<AccountId32>',
        permissionId: 'H256',
      },
      PermissionExecuted: {
        grantor: 'AccountId32',
        grantee: 'AccountId32',
        permissionId: 'H256',
        streamId: 'Option<H256>',
        amount: 'u128',
      },
      AutoDistributionExecuted: {
        grantor: 'AccountId32',
        grantee: 'AccountId32',
        permissionId: 'H256',
        streamId: 'Option<H256>',
        amount: 'u128',
      },
      PermissionExpired: {
        grantor: 'AccountId32',
        grantee: 'AccountId32',
        permissionId: 'H256',
      },
      PermissionAccumulationToggled: {
        permissionId: 'H256',
        accumulating: 'bool',
        toggledBy: 'Option<AccountId32>',
      },
      PermissionEnforcementExecuted: {
        permissionId: 'H256',
        executedBy: 'Option<AccountId32>',
      },
      EnforcementVoteCast: {
        permissionId: 'H256',
        voter: 'AccountId32',
        referendum: 'PalletPermission0PermissionEnforcementReferendum',
      },
      EnforcementAuthoritySet: {
        permissionId: 'H256',
        controllersCount: 'u32',
        requiredVotes: 'u32'
      }
    }
  },
  /**
   * Lookup68: pallet_permission0::permission::EnforcementReferendum
   **/
  PalletPermission0PermissionEnforcementReferendum: {
    _enum: {
      EmissionAccumulation: 'bool',
      Execution: 'Null'
    }
  },
  /**
   * Lookup69: pallet_faucet::pallet::Event<T>
   **/
  PalletFaucetEvent: {
    _enum: {
      Faucet: '(AccountId32,u128)'
    }
  },
  /**
   * Lookup70: frame_system::Phase
   **/
  FrameSystemPhase: {
    _enum: {
      ApplyExtrinsic: 'u32',
      Finalization: 'Null',
      Initialization: 'Null'
    }
  },
  /**
   * Lookup73: frame_system::LastRuntimeUpgradeInfo
   **/
  FrameSystemLastRuntimeUpgradeInfo: {
    specVersion: 'Compact<u32>',
    specName: 'Text'
  },
  /**
   * Lookup75: frame_system::CodeUpgradeAuthorization<T>
   **/
  FrameSystemCodeUpgradeAuthorization: {
    codeHash: 'H256',
    checkVersion: 'bool'
  },
  /**
   * Lookup76: frame_system::pallet::Call<T>
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
      do_task: {
        task: 'TorusRuntimeRuntimeTask',
      },
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
   * Lookup80: frame_system::limits::BlockWeights
   **/
  FrameSystemLimitsBlockWeights: {
    baseBlock: 'SpWeightsWeightV2Weight',
    maxBlock: 'SpWeightsWeightV2Weight',
    perClass: 'FrameSupportDispatchPerDispatchClassWeightsPerClass'
  },
  /**
   * Lookup81: frame_support::dispatch::PerDispatchClass<frame_system::limits::WeightsPerClass>
   **/
  FrameSupportDispatchPerDispatchClassWeightsPerClass: {
    normal: 'FrameSystemLimitsWeightsPerClass',
    operational: 'FrameSystemLimitsWeightsPerClass',
    mandatory: 'FrameSystemLimitsWeightsPerClass'
  },
  /**
   * Lookup82: frame_system::limits::WeightsPerClass
   **/
  FrameSystemLimitsWeightsPerClass: {
    baseExtrinsic: 'SpWeightsWeightV2Weight',
    maxExtrinsic: 'Option<SpWeightsWeightV2Weight>',
    maxTotal: 'Option<SpWeightsWeightV2Weight>',
    reserved: 'Option<SpWeightsWeightV2Weight>'
  },
  /**
   * Lookup84: frame_system::limits::BlockLength
   **/
  FrameSystemLimitsBlockLength: {
    max: 'FrameSupportDispatchPerDispatchClassU32'
  },
  /**
   * Lookup85: frame_support::dispatch::PerDispatchClass<T>
   **/
  FrameSupportDispatchPerDispatchClassU32: {
    normal: 'u32',
    operational: 'u32',
    mandatory: 'u32'
  },
  /**
   * Lookup86: sp_weights::RuntimeDbWeight
   **/
  SpWeightsRuntimeDbWeight: {
    read: 'u64',
    write: 'u64'
  },
  /**
   * Lookup87: sp_version::RuntimeVersion
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
   * Lookup93: frame_system::pallet::Error<T>
   **/
  FrameSystemError: {
    _enum: ['InvalidSpecName', 'SpecVersionNeedsToIncrease', 'FailedToExtractRuntimeVersion', 'NonDefaultComposite', 'NonZeroRefCount', 'CallFiltered', 'MultiBlockMigrationsOngoing', 'InvalidTask', 'FailedTask', 'NothingAuthorized', 'Unauthorized']
  },
  /**
   * Lookup94: pallet_timestamp::pallet::Call<T>
   **/
  PalletTimestampCall: {
    _enum: {
      set: {
        now: 'Compact<u64>'
      }
    }
  },
  /**
   * Lookup96: sp_consensus_aura::sr25519::app_sr25519::Public
   **/
  SpConsensusAuraSr25519AppSr25519Public: '[u8;32]',
  /**
   * Lookup99: pallet_grandpa::StoredState<N>
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
   * Lookup100: pallet_grandpa::StoredPendingChange<N, Limit>
   **/
  PalletGrandpaStoredPendingChange: {
    scheduledAt: 'u64',
    delay: 'u64',
    nextAuthorities: 'Vec<(SpConsensusGrandpaAppPublic,u64)>',
    forced: 'Option<u64>'
  },
  /**
   * Lookup104: pallet_grandpa::pallet::Call<T>
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
   * Lookup105: sp_consensus_grandpa::EquivocationProof<primitive_types::H256, N>
   **/
  SpConsensusGrandpaEquivocationProof: {
    setId: 'u64',
    equivocation: 'SpConsensusGrandpaEquivocation'
  },
  /**
   * Lookup106: sp_consensus_grandpa::Equivocation<primitive_types::H256, N>
   **/
  SpConsensusGrandpaEquivocation: {
    _enum: {
      Prevote: 'FinalityGrandpaEquivocationPrevote',
      Precommit: 'FinalityGrandpaEquivocationPrecommit'
    }
  },
  /**
   * Lookup107: finality_grandpa::Equivocation<sp_consensus_grandpa::app::Public, finality_grandpa::Prevote<primitive_types::H256, N>, sp_consensus_grandpa::app::Signature>
   **/
  FinalityGrandpaEquivocationPrevote: {
    roundNumber: 'u64',
    identity: 'SpConsensusGrandpaAppPublic',
    first: '(FinalityGrandpaPrevote,SpConsensusGrandpaAppSignature)',
    second: '(FinalityGrandpaPrevote,SpConsensusGrandpaAppSignature)'
  },
  /**
   * Lookup108: finality_grandpa::Prevote<primitive_types::H256, N>
   **/
  FinalityGrandpaPrevote: {
    targetHash: 'H256',
    targetNumber: 'u64'
  },
  /**
   * Lookup109: sp_consensus_grandpa::app::Signature
   **/
  SpConsensusGrandpaAppSignature: '[u8;64]',
  /**
   * Lookup112: finality_grandpa::Equivocation<sp_consensus_grandpa::app::Public, finality_grandpa::Precommit<primitive_types::H256, N>, sp_consensus_grandpa::app::Signature>
   **/
  FinalityGrandpaEquivocationPrecommit: {
    roundNumber: 'u64',
    identity: 'SpConsensusGrandpaAppPublic',
    first: '(FinalityGrandpaPrecommit,SpConsensusGrandpaAppSignature)',
    second: '(FinalityGrandpaPrecommit,SpConsensusGrandpaAppSignature)'
  },
  /**
   * Lookup113: finality_grandpa::Precommit<primitive_types::H256, N>
   **/
  FinalityGrandpaPrecommit: {
    targetHash: 'H256',
    targetNumber: 'u64'
  },
  /**
   * Lookup115: sp_core::Void
   **/
  SpCoreVoid: 'Null',
  /**
   * Lookup116: pallet_grandpa::pallet::Error<T>
   **/
  PalletGrandpaError: {
    _enum: ['PauseFailed', 'ResumeFailed', 'ChangePending', 'TooSoon', 'InvalidKeyOwnershipProof', 'InvalidEquivocationProof', 'DuplicateOffenceReport']
  },
  /**
   * Lookup118: pallet_balances::types::BalanceLock<Balance>
   **/
  PalletBalancesBalanceLock: {
    id: '[u8;8]',
    amount: 'u128',
    reasons: 'PalletBalancesReasons'
  },
  /**
   * Lookup119: pallet_balances::types::Reasons
   **/
  PalletBalancesReasons: {
    _enum: ['Fee', 'Misc', 'All']
  },
  /**
   * Lookup122: pallet_balances::types::ReserveData<ReserveIdentifier, Balance>
   **/
  PalletBalancesReserveData: {
    id: 'Null',
    amount: 'u128'
  },
  /**
   * Lookup126: torus_runtime::RuntimeHoldReason
   **/
  TorusRuntimeRuntimeHoldReason: 'Null',
  /**
   * Lookup129: frame_support::traits::tokens::misc::IdAmount<Id, Balance>
   **/
  FrameSupportTokensMiscIdAmount: {
    id: 'Null',
    amount: 'u128'
  },
  /**
   * Lookup131: pallet_balances::pallet::Call<T, I>
   **/
  PalletBalancesCall: {
    _enum: {
      transfer_allow_death: {
        dest: 'MultiAddress',
        value: 'Compact<u128>',
      },
      __Unused1: 'Null',
      force_transfer: {
        source: 'MultiAddress',
        dest: 'MultiAddress',
        value: 'Compact<u128>',
      },
      transfer_keep_alive: {
        dest: 'MultiAddress',
        value: 'Compact<u128>',
      },
      transfer_all: {
        dest: 'MultiAddress',
        keepAlive: 'bool',
      },
      force_unreserve: {
        who: 'MultiAddress',
        amount: 'u128',
      },
      upgrade_accounts: {
        who: 'Vec<AccountId32>',
      },
      __Unused7: 'Null',
      force_set_balance: {
        who: 'MultiAddress',
        newFree: 'Compact<u128>',
      },
      force_adjust_total_issuance: {
        direction: 'PalletBalancesAdjustmentDirection',
        delta: 'Compact<u128>',
      },
      burn: {
        value: 'Compact<u128>',
        keepAlive: 'bool'
      }
    }
  },
  /**
   * Lookup136: pallet_balances::types::AdjustmentDirection
   **/
  PalletBalancesAdjustmentDirection: {
    _enum: ['Increase', 'Decrease']
  },
  /**
   * Lookup137: pallet_balances::pallet::Error<T, I>
   **/
  PalletBalancesError: {
    _enum: ['VestingBalance', 'LiquidityRestrictions', 'InsufficientBalance', 'ExistentialDeposit', 'Expendability', 'ExistingVestingSchedule', 'DeadAccount', 'TooManyReserves', 'TooManyHolds', 'TooManyFreezes', 'IssuanceDeactivated', 'DeltaZero']
  },
  /**
   * Lookup139: pallet_transaction_payment::Releases
   **/
  PalletTransactionPaymentReleases: {
    _enum: ['V1Ancient', 'V2']
  },
  /**
   * Lookup140: pallet_sudo::pallet::Call<T>
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
   * Lookup142: pallet_multisig::pallet::Call<T>
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
   * Lookup144: pallet_ethereum::pallet::Call<T>
   **/
  PalletEthereumCall: {
    _enum: {
      transact: {
        transaction: 'EthereumTransactionTransactionV2'
      }
    }
  },
  /**
   * Lookup145: ethereum::transaction::TransactionV2
   **/
  EthereumTransactionTransactionV2: {
    _enum: {
      Legacy: 'EthereumTransactionLegacyTransaction',
      EIP2930: 'EthereumTransactionEip2930Transaction',
      EIP1559: 'EthereumTransactionEip1559Transaction'
    }
  },
  /**
   * Lookup146: ethereum::transaction::LegacyTransaction
   **/
  EthereumTransactionLegacyTransaction: {
    nonce: 'U256',
    gasPrice: 'U256',
    gasLimit: 'U256',
    action: 'EthereumTransactionTransactionAction',
    value: 'U256',
    input: 'Bytes',
    signature: 'EthereumTransactionTransactionSignature'
  },
  /**
   * Lookup149: ethereum::transaction::TransactionAction
   **/
  EthereumTransactionTransactionAction: {
    _enum: {
      Call: 'H160',
      Create: 'Null'
    }
  },
  /**
   * Lookup150: ethereum::transaction::TransactionSignature
   **/
  EthereumTransactionTransactionSignature: {
    v: 'u64',
    r: 'H256',
    s: 'H256'
  },
  /**
   * Lookup152: ethereum::transaction::EIP2930Transaction
   **/
  EthereumTransactionEip2930Transaction: {
    chainId: 'u64',
    nonce: 'U256',
    gasPrice: 'U256',
    gasLimit: 'U256',
    action: 'EthereumTransactionTransactionAction',
    value: 'U256',
    input: 'Bytes',
    accessList: 'Vec<EthereumTransactionAccessListItem>',
    oddYParity: 'bool',
    r: 'H256',
    s: 'H256'
  },
  /**
   * Lookup154: ethereum::transaction::AccessListItem
   **/
  EthereumTransactionAccessListItem: {
    address: 'H160',
    storageKeys: 'Vec<H256>'
  },
  /**
   * Lookup155: ethereum::transaction::EIP1559Transaction
   **/
  EthereumTransactionEip1559Transaction: {
    chainId: 'u64',
    nonce: 'U256',
    maxPriorityFeePerGas: 'U256',
    maxFeePerGas: 'U256',
    gasLimit: 'U256',
    action: 'EthereumTransactionTransactionAction',
    value: 'U256',
    input: 'Bytes',
    accessList: 'Vec<EthereumTransactionAccessListItem>',
    oddYParity: 'bool',
    r: 'H256',
    s: 'H256'
  },
  /**
   * Lookup156: pallet_evm::pallet::Call<T>
   **/
  PalletEvmCall: {
    _enum: {
      withdraw: {
        address: 'H160',
        value: 'u128',
      },
      call: {
        source: 'H160',
        target: 'H160',
        input: 'Bytes',
        value: 'U256',
        gasLimit: 'u64',
        maxFeePerGas: 'U256',
        maxPriorityFeePerGas: 'Option<U256>',
        nonce: 'Option<U256>',
        accessList: 'Vec<(H160,Vec<H256>)>',
      },
      create: {
        source: 'H160',
        init: 'Bytes',
        value: 'U256',
        gasLimit: 'u64',
        maxFeePerGas: 'U256',
        maxPriorityFeePerGas: 'Option<U256>',
        nonce: 'Option<U256>',
        accessList: 'Vec<(H160,Vec<H256>)>',
      },
      create2: {
        source: 'H160',
        init: 'Bytes',
        salt: 'H256',
        value: 'U256',
        gasLimit: 'u64',
        maxFeePerGas: 'U256',
        maxPriorityFeePerGas: 'Option<U256>',
        nonce: 'Option<U256>',
        accessList: 'Vec<(H160,Vec<H256>)>'
      }
    }
  },
  /**
   * Lookup160: pallet_governance::pallet::Call<T>
   **/
  PalletGovernanceCall: {
    _enum: {
      __Unused0: 'Null',
      __Unused1: 'Null',
      add_allocator: {
        key: 'AccountId32',
      },
      remove_allocator: {
        key: 'AccountId32',
      },
      add_to_whitelist: {
        key: 'AccountId32',
      },
      remove_from_whitelist: {
        key: 'AccountId32',
      },
      accept_application: {
        applicationId: 'u32',
      },
      deny_application: {
        applicationId: 'u32',
      },
      penalize_agent: {
        agentKey: 'AccountId32',
        percentage: 'u8',
      },
      submit_application: {
        agentKey: 'AccountId32',
        metadata: 'Bytes',
        removing: 'bool',
      },
      add_global_params_proposal: {
        data: 'PalletGovernanceProposalGlobalParamsData',
        metadata: 'Bytes',
      },
      add_global_custom_proposal: {
        metadata: 'Bytes',
      },
      add_dao_treasury_transfer_proposal: {
        value: 'u128',
        destinationKey: 'AccountId32',
        data: 'Bytes',
      },
      vote_proposal: {
        proposalId: 'u64',
        agree: 'bool',
      },
      remove_vote_proposal: {
        proposalId: 'u64',
      },
      enable_vote_delegation: 'Null',
      disable_vote_delegation: 'Null',
      add_emission_proposal: {
        recyclingPercentage: 'Percent',
        treasuryPercentage: 'Percent',
        incentivesRatio: 'Percent',
        data: 'Bytes',
      },
      set_emission_params: {
        recyclingPercentage: 'Percent',
        treasuryPercentage: 'Percent',
      },
      toggle_agent_freezing: 'Null',
      toggle_namespace_freezing: 'Null'
    }
  },
  /**
   * Lookup161: pallet_governance::proposal::GlobalParamsData<T>
   **/
  PalletGovernanceProposalGlobalParamsData: {
    minNameLength: 'u16',
    maxNameLength: 'u16',
    minWeightControlFee: 'u8',
    minStakingFee: 'u8',
    dividendsParticipationWeight: 'Percent',
    namespacePricingConfig: 'PalletTorus0NamespaceNamespacePricingConfig',
    proposalCost: 'u128'
  },
  /**
   * Lookup162: pallet_torus0::namespace::NamespacePricingConfig<T>
   **/
  PalletTorus0NamespaceNamespacePricingConfig: {
    depositPerByte: 'u128',
    baseFee: 'u128',
    countMidpoint: 'u32',
    feeSteepness: 'Percent',
    maxFeeMultiplier: 'u32'
  },
  /**
   * Lookup163: pallet_torus0::pallet::Call<T>
   **/
  PalletTorus0Call: {
    _enum: {
      add_stake: {
        agentKey: 'AccountId32',
        amount: 'u128',
      },
      remove_stake: {
        agentKey: 'AccountId32',
        amount: 'u128',
      },
      transfer_stake: {
        agentKey: 'AccountId32',
        newAgentKey: 'AccountId32',
        amount: 'u128',
      },
      register_agent: {
        agentKey: 'AccountId32',
        name: 'Bytes',
        url: 'Bytes',
        metadata: 'Bytes',
      },
      unregister_agent: 'Null',
      update_agent: {
        url: 'Bytes',
        metadata: 'Option<Bytes>',
        stakingFee: 'Option<Percent>',
        weightControlFee: 'Option<Percent>',
      },
      set_agent_update_cooldown: {
        newCooldown: 'u64',
      },
      create_namespace: {
        path: 'Bytes',
      },
      delete_namespace: {
        path: 'Bytes'
      }
    }
  },
  /**
   * Lookup166: pallet_emission0::pallet::Call<T>
   **/
  PalletEmission0Call: {
    _enum: {
      set_weights: {
        weights: 'Vec<(AccountId32,u16)>',
      },
      delegate_weight_control: {
        target: 'AccountId32',
      },
      regain_weight_control: 'Null'
    }
  },
  /**
   * Lookup169: pallet_permission0::pallet::Call<T>
   **/
  PalletPermission0Call: {
    _enum: {
      grant_emission_permission: {
        grantee: 'AccountId32',
        allocation: 'PalletPermission0PermissionEmissionEmissionAllocation',
        targets: 'BTreeMap<AccountId32, u16>',
        distribution: 'PalletPermission0PermissionEmissionDistributionControl',
        duration: 'PalletPermission0PermissionPermissionDuration',
        revocation: 'PalletPermission0PermissionRevocationTerms',
        enforcement: 'PalletPermission0PermissionEnforcementAuthority',
      },
      revoke_permission: {
        permissionId: 'H256',
      },
      execute_permission: {
        permissionId: 'H256',
      },
      toggle_permission_accumulation: {
        permissionId: 'H256',
        accumulating: 'bool',
      },
      enforcement_execute_permission: {
        permissionId: 'H256',
      },
      set_enforcement_authority: {
        permissionId: 'H256',
        enforcement: 'PalletPermission0PermissionEnforcementAuthority',
      },
      grant_curator_permission: {
        grantee: 'AccountId32',
        flags: 'u32',
        cooldown: 'Option<u64>',
        duration: 'PalletPermission0PermissionPermissionDuration',
        revocation: 'PalletPermission0PermissionRevocationTerms',
      },
      grant_namespace_permission: {
        grantee: 'AccountId32',
        paths: 'BTreeSet<Bytes>',
        duration: 'PalletPermission0PermissionPermissionDuration',
        revocation: 'PalletPermission0PermissionRevocationTerms',
      },
      update_emission_permission: {
        permissionId: 'H256',
        newTargets: 'BTreeMap<AccountId32, u16>',
        newStreams: 'Option<BTreeMap<H256, Percent>>',
        newDistributionControl: 'Option<PalletPermission0PermissionEmissionDistributionControl>'
      }
    }
  },
  /**
   * Lookup170: pallet_permission0::permission::emission::EmissionAllocation<T>
   **/
  PalletPermission0PermissionEmissionEmissionAllocation: {
    _enum: {
      Streams: 'BTreeMap<H256, Percent>',
      FixedAmount: 'u128'
    }
  },
  /**
   * Lookup177: pallet_permission0::permission::emission::DistributionControl<T>
   **/
  PalletPermission0PermissionEmissionDistributionControl: {
    _enum: {
      Manual: 'Null',
      Automatic: 'u128',
      AtBlock: 'u64',
      Interval: 'u64'
    }
  },
  /**
   * Lookup178: pallet_permission0::permission::PermissionDuration<T>
   **/
  PalletPermission0PermissionPermissionDuration: {
    _enum: {
      UntilBlock: 'u64',
      Indefinite: 'Null'
    }
  },
  /**
   * Lookup179: pallet_permission0::permission::RevocationTerms<T>
   **/
  PalletPermission0PermissionRevocationTerms: {
    _enum: {
      Irrevocable: 'Null',
      RevocableByGrantor: 'Null',
      RevocableByArbiters: {
        accounts: 'Vec<AccountId32>',
        requiredVotes: 'u32',
      },
      RevocableAfter: 'u64'
    }
  },
  /**
   * Lookup181: pallet_permission0::permission::EnforcementAuthority<T>
   **/
  PalletPermission0PermissionEnforcementAuthority: {
    _enum: {
      None: 'Null',
      ControlledBy: {
        controllers: 'Vec<AccountId32>',
        requiredVotes: 'u32'
      }
    }
  },
  /**
   * Lookup188: pallet_faucet::pallet::Call<T>
   **/
  PalletFaucetCall: {
    _enum: {
      __Unused0: 'Null',
      faucet: {
        blockNumber: 'u64',
        nonce: 'u64',
        work: 'Bytes',
        key: 'MultiAddress'
      }
    }
  },
  /**
   * Lookup189: pallet_sudo::pallet::Error<T>
   **/
  PalletSudoError: {
    _enum: ['RequireSudo']
  },
  /**
   * Lookup191: pallet_multisig::Multisig<BlockNumber, Balance, sp_core::crypto::AccountId32, MaxApprovals>
   **/
  PalletMultisigMultisig: {
    when: 'PalletMultisigTimepoint',
    deposit: 'u128',
    depositor: 'AccountId32',
    approvals: 'Vec<AccountId32>'
  },
  /**
   * Lookup193: pallet_multisig::pallet::Error<T>
   **/
  PalletMultisigError: {
    _enum: ['MinimumThreshold', 'AlreadyApproved', 'NoApprovalsNeeded', 'TooFewSignatories', 'TooManySignatories', 'SignatoriesOutOfOrder', 'SenderInSignatories', 'NotFound', 'NotOwner', 'NoTimepoint', 'WrongTimepoint', 'UnexpectedTimepoint', 'MaxWeightTooLow', 'AlreadyStored']
  },
  /**
   * Lookup196: fp_rpc::TransactionStatus
   **/
  FpRpcTransactionStatus: {
    transactionHash: 'H256',
    transactionIndex: 'u32',
    from: 'H160',
    to: 'Option<H160>',
    contractAddress: 'Option<H160>',
    logs: 'Vec<EthereumLog>',
    logsBloom: 'EthbloomBloom'
  },
  /**
   * Lookup199: ethbloom::Bloom
   **/
  EthbloomBloom: '[u8;256]',
  /**
   * Lookup201: ethereum::receipt::ReceiptV3
   **/
  EthereumReceiptReceiptV3: {
    _enum: {
      Legacy: 'EthereumReceiptEip658ReceiptData',
      EIP2930: 'EthereumReceiptEip658ReceiptData',
      EIP1559: 'EthereumReceiptEip658ReceiptData'
    }
  },
  /**
   * Lookup202: ethereum::receipt::EIP658ReceiptData
   **/
  EthereumReceiptEip658ReceiptData: {
    statusCode: 'u8',
    usedGas: 'U256',
    logsBloom: 'EthbloomBloom',
    logs: 'Vec<EthereumLog>'
  },
  /**
   * Lookup203: ethereum::block::Block<ethereum::transaction::TransactionV2>
   **/
  EthereumBlock: {
    header: 'EthereumHeader',
    transactions: 'Vec<EthereumTransactionTransactionV2>',
    ommers: 'Vec<EthereumHeader>'
  },
  /**
   * Lookup204: ethereum::header::Header
   **/
  EthereumHeader: {
    parentHash: 'H256',
    ommersHash: 'H256',
    beneficiary: 'H160',
    stateRoot: 'H256',
    transactionsRoot: 'H256',
    receiptsRoot: 'H256',
    logsBloom: 'EthbloomBloom',
    difficulty: 'U256',
    number: 'U256',
    gasLimit: 'U256',
    gasUsed: 'U256',
    timestamp: 'u64',
    extraData: 'Bytes',
    mixHash: 'H256',
    nonce: 'EthereumTypesHashH64'
  },
  /**
   * Lookup205: ethereum_types::hash::H64
   **/
  EthereumTypesHashH64: '[u8;8]',
  /**
   * Lookup210: pallet_ethereum::pallet::Error<T>
   **/
  PalletEthereumError: {
    _enum: ['InvalidSignature', 'PreLogExists']
  },
  /**
   * Lookup211: pallet_evm::CodeMetadata
   **/
  PalletEvmCodeMetadata: {
    _alias: {
      size_: 'size',
      hash_: 'hash'
    },
    size_: 'u64',
    hash_: 'H256'
  },
  /**
   * Lookup213: pallet_evm::pallet::Error<T>
   **/
  PalletEvmError: {
    _enum: ['BalanceLow', 'FeeOverflow', 'PaymentOverflow', 'WithdrawFailed', 'GasPriceTooLow', 'InvalidNonce', 'GasLimitTooLow', 'GasLimitTooHigh', 'InvalidChainId', 'InvalidSignature', 'Reentrancy', 'TransactionMustComeFromEOA', 'Undefined']
  },
  /**
   * Lookup214: pallet_governance::proposal::Proposal<T>
   **/
  PalletGovernanceProposal: {
    id: 'u64',
    proposer: 'AccountId32',
    expirationBlock: 'u64',
    data: 'PalletGovernanceProposalProposalData',
    status: 'PalletGovernanceProposalProposalStatus',
    metadata: 'Bytes',
    proposalCost: 'u128',
    creationBlock: 'u64'
  },
  /**
   * Lookup215: pallet_governance::proposal::ProposalData<T>
   **/
  PalletGovernanceProposalProposalData: {
    _enum: {
      GlobalParams: 'PalletGovernanceProposalGlobalParamsData',
      GlobalCustom: 'Null',
      Emission: {
        recyclingPercentage: 'Percent',
        treasuryPercentage: 'Percent',
        incentivesRatio: 'Percent',
      },
      TransferDaoTreasury: {
        account: 'AccountId32',
        amount: 'u128'
      }
    }
  },
  /**
   * Lookup216: pallet_governance::proposal::ProposalStatus<T>
   **/
  PalletGovernanceProposalProposalStatus: {
    _enum: {
      Open: {
        votesFor: 'BTreeSet<AccountId32>',
        votesAgainst: 'BTreeSet<AccountId32>',
        stakeFor: 'u128',
        stakeAgainst: 'u128',
      },
      Accepted: {
        block: 'u64',
        stakeFor: 'u128',
        stakeAgainst: 'u128',
      },
      Refused: {
        block: 'u64',
        stakeFor: 'u128',
        stakeAgainst: 'u128',
      },
      Expired: 'Null'
    }
  },
  /**
   * Lookup219: pallet_governance::proposal::UnrewardedProposal<T>
   **/
  PalletGovernanceProposalUnrewardedProposal: {
    block: 'u64',
    votesFor: 'BTreeMap<AccountId32, u128>',
    votesAgainst: 'BTreeMap<AccountId32, u128>'
  },
  /**
   * Lookup224: pallet_governance::config::GovernanceConfiguration<T>
   **/
  PalletGovernanceConfigGovernanceConfiguration: {
    proposalCost: 'u128',
    proposalExpiration: 'u64',
    agentApplicationCost: 'u128',
    agentApplicationExpiration: 'u64',
    proposalRewardTreasuryAllocation: 'Percent',
    maxProposalRewardTreasuryAllocation: 'u128',
    proposalRewardInterval: 'u64'
  },
  /**
   * Lookup225: pallet_governance::application::AgentApplication<T>
   **/
  PalletGovernanceApplicationAgentApplication: {
    id: 'u32',
    payerKey: 'AccountId32',
    agentKey: 'AccountId32',
    data: 'Bytes',
    cost: 'u128',
    expiresAt: 'u64',
    action: 'PalletGovernanceApplicationApplicationAction',
    status: 'PalletGovernanceApplicationApplicationStatus'
  },
  /**
   * Lookup226: pallet_governance::application::ApplicationAction
   **/
  PalletGovernanceApplicationApplicationAction: {
    _enum: ['Add', 'Remove']
  },
  /**
   * Lookup227: pallet_governance::application::ApplicationStatus
   **/
  PalletGovernanceApplicationApplicationStatus: {
    _enum: {
      Open: 'Null',
      Resolved: {
        accepted: 'bool',
      },
      Expired: 'Null'
    }
  },
  /**
   * Lookup228: frame_support::PalletId
   **/
  FrameSupportPalletId: '[u8;8]',
  /**
   * Lookup229: pallet_governance::pallet::Error<T>
   **/
  PalletGovernanceError: {
    _enum: ['ProposalIsFinished', 'InvalidProposalFinalizationParameters', 'InvalidProposalVotingParameters', 'InvalidProposalCost', 'InvalidProposalExpiration', 'NotEnoughBalanceToPropose', 'ProposalDataTooSmall', 'ProposalDataTooLarge', 'ModuleDelegatingForMaxStakers', 'ProposalNotFound', 'ProposalClosed', 'InvalidProposalData', 'InvalidCurrencyConversionValue', 'InsufficientDaoTreasuryFunds', 'AlreadyVoted', 'NotVoted', 'InsufficientStake', 'VoterIsDelegatingVotingPower', 'InternalError', 'ApplicationNotOpen', 'ApplicationKeyAlreadyUsed', 'NotEnoughBalanceToApply', 'NotCurator', 'ApplicationNotFound', 'AlreadyWhitelisted', 'NotWhitelisted', 'CouldNotConvertToBalance', 'InvalidApplicationDataLength', 'AlreadyCurator', 'AlreadyAllocator', 'NotAllocator', 'AgentNotFound', 'InvalidPenaltyPercentage', 'InvalidMinNameLength', 'InvalidMaxNameLength', 'InvalidMaxAllowedWeights', 'InvalidMinWeightControlFee', 'InvalidMinStakingFee', 'InvalidEmissionProposalData']
  },
  /**
   * Lookup230: pallet_torus0::agent::Agent<T>
   **/
  PalletTorus0Agent: {
    key: 'AccountId32',
    name: 'Bytes',
    url: 'Bytes',
    metadata: 'Bytes',
    weightPenaltyFactor: 'Percent',
    registrationBlock: 'u64',
    fees: 'PalletTorus0FeeValidatorFee',
    lastUpdateBlock: 'u64'
  },
  /**
   * Lookup231: pallet_torus0::fee::ValidatorFee<T>
   **/
  PalletTorus0FeeValidatorFee: {
    stakingFee: 'Percent',
    weightControlFee: 'Percent'
  },
  /**
   * Lookup233: pallet_torus0::fee::ValidatorFeeConstraints<T>
   **/
  PalletTorus0FeeValidatorFeeConstraints: {
    minStakingFee: 'Percent',
    minWeightControlFee: 'Percent'
  },
  /**
   * Lookup234: pallet_torus0::burn::BurnConfiguration<T>
   **/
  PalletTorus0BurnBurnConfiguration: {
    minBurn: 'u128',
    maxBurn: 'u128',
    adjustmentAlpha: 'u64',
    targetRegistrationsInterval: 'u64',
    targetRegistrationsPerInterval: 'u16',
    maxRegistrationsPerInterval: 'u16'
  },
  /**
   * Lookup236: pallet_torus0::namespace::NamespaceMetadata<T>
   **/
  PalletTorus0NamespaceNamespaceMetadata: {
    createdAt: 'u64',
    deposit: 'u128'
  },
  /**
   * Lookup237: pallet_torus0::pallet::Error<T>
   **/
  PalletTorus0Error: {
    _enum: ['AgentDoesNotExist', 'NotEnoughStakeToWithdraw', 'NotEnoughBalanceToStake', 'TooManyAgentRegistrationsThisBlock', 'TooManyAgentRegistrationsThisInterval', 'AgentAlreadyRegistered', 'CouldNotConvertToBalance', 'BalanceNotAdded', 'StakeNotRemoved', 'InvalidShares', 'NotEnoughBalanceToRegisterAgent', 'StakeNotAdded', 'BalanceNotRemoved', 'BalanceCouldNotBeRemoved', 'NotEnoughStakeToRegister', 'StillRegistered', 'NotEnoughBalanceToTransfer', 'InvalidAgentMetadata', 'AgentMetadataTooLong', 'AgentMetadataTooShort', 'InvalidMinBurn', 'InvalidMaxBurn', 'AgentNameTooLong', 'AgentNameTooShort', 'InvalidAgentName', 'AgentUrlTooLong', 'AgentUrlTooShort', 'InvalidAgentUrl', 'AgentNameAlreadyExists', 'StakeTooSmall', 'AgentKeyNotWhitelisted', 'InvalidAmount', 'InvalidStakingFee', 'InvalidWeightControlFee', 'AgentUpdateOnCooldown', 'InvalidNamespacePath', 'NamespaceAlreadyExists', 'NamespaceNotFound', 'ParentNamespaceNotFound', 'NotNamespaceOwner', 'NamespaceHasChildren', 'NamespaceDepthExceeded', 'NamespaceBeingDelegated', 'AgentsFrozen', 'NamespacesFrozen']
  },
  /**
   * Lookup238: pallet_emission0::ConsensusMember<T>
   **/
  PalletEmission0ConsensusMember: {
    weights: 'Vec<(AccountId32,u16)>',
    lastIncentives: 'u16',
    lastDividends: 'u16'
  },
  /**
   * Lookup241: pallet_emission0::pallet::Error<T>
   **/
  PalletEmission0Error: {
    _enum: ['WeightSetTooLarge', 'AgentIsNotRegistered', 'CannotSetWeightsForSelf', 'CannotSetWeightsWhileDelegating', 'CannotDelegateWeightControlToSelf', 'AgentIsNotDelegating', 'NotEnoughStakeToSetWeights', 'WeightControlNotEnabled']
  },
  /**
   * Lookup242: pallet_permission0::permission::PermissionContract<T>
   **/
  PalletPermission0PermissionPermissionContract: {
    grantor: 'AccountId32',
    grantee: 'AccountId32',
    scope: 'PalletPermission0PermissionPermissionScope',
    duration: 'PalletPermission0PermissionPermissionDuration',
    revocation: 'PalletPermission0PermissionRevocationTerms',
    enforcement: 'PalletPermission0PermissionEnforcementAuthority',
    lastExecution: 'Option<u64>',
    executionCount: 'u32',
    parent: 'Option<H256>',
    createdAt: 'u64'
  },
  /**
   * Lookup243: pallet_permission0::permission::PermissionScope<T>
   **/
  PalletPermission0PermissionPermissionScope: {
    _enum: {
      Emission: 'PalletPermission0PermissionEmissionEmissionScope',
      Curator: 'PalletPermission0PermissionCuratorCuratorScope',
      Namespace: 'PalletPermission0PermissionNamespaceScope'
    }
  },
  /**
   * Lookup244: pallet_permission0::permission::emission::EmissionScope<T>
   **/
  PalletPermission0PermissionEmissionEmissionScope: {
    allocation: 'PalletPermission0PermissionEmissionEmissionAllocation',
    distribution: 'PalletPermission0PermissionEmissionDistributionControl',
    targets: 'BTreeMap<AccountId32, u16>',
    accumulating: 'bool'
  },
  /**
   * Lookup245: pallet_permission0::permission::curator::CuratorScope<T>
   **/
  PalletPermission0PermissionCuratorCuratorScope: {
    flags: 'u32',
    cooldown: 'Option<u64>'
  },
  /**
   * Lookup247: pallet_permission0::permission::NamespaceScope<T>
   **/
  PalletPermission0PermissionNamespaceScope: {
    paths: 'BTreeSet<Bytes>'
  },
  /**
   * Lookup256: pallet_permission0::pallet::Error<T>
   **/
  PalletPermission0Error: {
    _enum: ['NotRegisteredAgent', 'PermissionCreationOutsideExtrinsic', 'DuplicatePermissionInBlock', 'PermissionNotFound', 'SelfPermissionNotAllowed', 'InvalidPercentage', 'InvalidTargetWeight', 'NoTargetsSpecified', 'InvalidThreshold', 'NoAccumulatedAmount', 'NotAuthorizedToRevoke', 'TotalAllocationExceeded', 'NotPermissionGrantee', 'NotPermissionGrantor', 'TooManyStreams', 'TooManyTargets', 'TooManyRevokers', 'StorageError', 'InvalidAmount', 'InsufficientBalance', 'InvalidInterval', 'ParentPermissionNotFound', 'InvalidDistributionMethod', 'InvalidNumberOfRevokers', 'FixedAmountCanOnlyBeTriggeredOnce', 'UnsupportedPermissionType', 'NotAuthorizedToToggle', 'TooManyControllers', 'InvalidNumberOfControllers', 'DuplicatePermission', 'PermissionInCooldown', 'InvalidCuratorPermissions', 'NamespaceDoesNotExist', 'NamespacePathIsInvalid', 'TooManyNamespaces', 'NotAuthorizedToEdit', 'NotEditable', 'NamespaceCreationDisabled']
  },
  /**
   * Lookup257: pallet_faucet::pallet::Error<T>
   **/
  PalletFaucetError: {
    _enum: ['InvalidWorkBlock', 'InvalidDifficulty', 'InvalidSeal']
  },
  /**
   * Lookup259: sp_runtime::MultiSignature
   **/
  SpRuntimeMultiSignature: {
    _enum: {
      Ed25519: '[u8;64]',
      Sr25519: '[u8;64]',
      Ecdsa: '[u8;65]'
    }
  },
  /**
   * Lookup262: frame_system::extensions::check_non_zero_sender::CheckNonZeroSender<T>
   **/
  FrameSystemExtensionsCheckNonZeroSender: 'Null',
  /**
   * Lookup263: frame_system::extensions::check_spec_version::CheckSpecVersion<T>
   **/
  FrameSystemExtensionsCheckSpecVersion: 'Null',
  /**
   * Lookup264: frame_system::extensions::check_tx_version::CheckTxVersion<T>
   **/
  FrameSystemExtensionsCheckTxVersion: 'Null',
  /**
   * Lookup265: frame_system::extensions::check_genesis::CheckGenesis<T>
   **/
  FrameSystemExtensionsCheckGenesis: 'Null',
  /**
   * Lookup268: frame_system::extensions::check_nonce::CheckNonce<T>
   **/
  FrameSystemExtensionsCheckNonce: 'Compact<u32>',
  /**
   * Lookup269: frame_system::extensions::check_weight::CheckWeight<T>
   **/
  FrameSystemExtensionsCheckWeight: 'Null',
  /**
   * Lookup270: pallet_transaction_payment::ChargeTransactionPayment<T>
   **/
  PalletTransactionPaymentChargeTransactionPayment: 'Compact<u128>',
  /**
   * Lookup271: frame_metadata_hash_extension::CheckMetadataHash<T>
   **/
  FrameMetadataHashExtensionCheckMetadataHash: {
    mode: 'FrameMetadataHashExtensionMode'
  },
  /**
   * Lookup272: frame_metadata_hash_extension::Mode
   **/
  FrameMetadataHashExtensionMode: {
    _enum: ['Disabled', 'Enabled']
  },
  /**
   * Lookup275: torus_runtime::Runtime
   **/
  TorusRuntimeRuntime: 'Null'
};
