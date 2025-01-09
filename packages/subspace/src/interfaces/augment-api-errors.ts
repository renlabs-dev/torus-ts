// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

// import type lookup before we augment - in some environments
// this is required to allow for ambient/previous definitions
import '@polkadot/api-base/types/errors';

import type { ApiTypes, AugmentedError } from '@polkadot/api-base/types';

export type __AugmentedError<ApiType extends ApiTypes> = AugmentedError<ApiType>;

declare module '@polkadot/api-base/types/errors' {
  interface AugmentedErrors<ApiType extends ApiTypes> {
    balances: {
      /**
       * Beneficiary account must pre-exist.
       **/
      DeadAccount: AugmentedError<ApiType>;
      /**
       * The delta cannot be zero.
       **/
      DeltaZero: AugmentedError<ApiType>;
      /**
       * Value too low to create account due to existential deposit.
       **/
      ExistentialDeposit: AugmentedError<ApiType>;
      /**
       * A vesting schedule already exists for this account.
       **/
      ExistingVestingSchedule: AugmentedError<ApiType>;
      /**
       * Transfer/payment would kill account.
       **/
      Expendability: AugmentedError<ApiType>;
      /**
       * Balance too low to send value.
       **/
      InsufficientBalance: AugmentedError<ApiType>;
      /**
       * The issuance cannot be modified since it is already deactivated.
       **/
      IssuanceDeactivated: AugmentedError<ApiType>;
      /**
       * Account liquidity restrictions prevent withdrawal.
       **/
      LiquidityRestrictions: AugmentedError<ApiType>;
      /**
       * Number of freezes exceed `MaxFreezes`.
       **/
      TooManyFreezes: AugmentedError<ApiType>;
      /**
       * Number of holds exceed `VariantCountOf<T::RuntimeHoldReason>`.
       **/
      TooManyHolds: AugmentedError<ApiType>;
      /**
       * Number of named reserves exceed `MaxReserves`.
       **/
      TooManyReserves: AugmentedError<ApiType>;
      /**
       * Vesting balance too high to send value.
       **/
      VestingBalance: AugmentedError<ApiType>;
      /**
       * Generic error
       **/
      [key: string]: AugmentedError<ApiType>;
    };
    emission0: {
      /**
       * Tried regaining weight control without delegating it.
       **/
      AgentIsNotDelegating: AugmentedError<ApiType>;
      /**
       * Tried setting weights for an agent that does not exist.
       **/
      AgentIsNotRegistered: AugmentedError<ApiType>;
      /**
       * Tried delegating weight control to itself.
       **/
      CannotDelegateWeightControlToSelf: AugmentedError<ApiType>;
      /**
       * Tried setting weights for itself.
       **/
      CannotSetWeightsForSelf: AugmentedError<ApiType>;
      /**
       * Tried setting weights while delegating weight control.
       **/
      CannotSetWeightsWhileDelegating: AugmentedError<ApiType>;
      /**
       * Agent does not have enough stake to set weights.
       **/
      NotEnoughStakeToSetWeights: AugmentedError<ApiType>;
      /**
       * Agent tried setting more than 2 ^ 32 weights.
       **/
      WeightSetTooLarge: AugmentedError<ApiType>;
      /**
       * Generic error
       **/
      [key: string]: AugmentedError<ApiType>;
    };
    ethereum: {
      /**
       * Signature is invalid.
       **/
      InvalidSignature: AugmentedError<ApiType>;
      /**
       * Pre-log is present, therefore transact is not allowed.
       **/
      PreLogExists: AugmentedError<ApiType>;
      /**
       * Generic error
       **/
      [key: string]: AugmentedError<ApiType>;
    };
    evm: {
      /**
       * Not enough balance to perform action
       **/
      BalanceLow: AugmentedError<ApiType>;
      /**
       * Calculating total fee overflowed
       **/
      FeeOverflow: AugmentedError<ApiType>;
      /**
       * Gas limit is too high.
       **/
      GasLimitTooHigh: AugmentedError<ApiType>;
      /**
       * Gas limit is too low.
       **/
      GasLimitTooLow: AugmentedError<ApiType>;
      /**
       * Gas price is too low.
       **/
      GasPriceTooLow: AugmentedError<ApiType>;
      /**
       * The chain id is invalid.
       **/
      InvalidChainId: AugmentedError<ApiType>;
      /**
       * Nonce is invalid
       **/
      InvalidNonce: AugmentedError<ApiType>;
      /**
       * the signature is invalid.
       **/
      InvalidSignature: AugmentedError<ApiType>;
      /**
       * Calculating total payment overflowed
       **/
      PaymentOverflow: AugmentedError<ApiType>;
      /**
       * EVM reentrancy
       **/
      Reentrancy: AugmentedError<ApiType>;
      /**
       * EIP-3607,
       **/
      TransactionMustComeFromEOA: AugmentedError<ApiType>;
      /**
       * Undefined error.
       **/
      Undefined: AugmentedError<ApiType>;
      /**
       * Withdraw fee failed
       **/
      WithdrawFailed: AugmentedError<ApiType>;
      /**
       * Generic error
       **/
      [key: string]: AugmentedError<ApiType>;
    };
    governance: {
      /**
       * Agent not found
       **/
      AgentNotFound: AugmentedError<ApiType>;
      /**
       * The key is already an allocator.
       **/
      AlreadyAllocator: AugmentedError<ApiType>;
      /**
       * The key is already a curator.
       **/
      AlreadyCurator: AugmentedError<ApiType>;
      /**
       * Key has already voted on given Proposal.
       **/
      AlreadyVoted: AugmentedError<ApiType>;
      /**
       * The account is already whitelisted and cannot be added again.
       **/
      AlreadyWhitelisted: AugmentedError<ApiType>;
      /**
       * The application key is already used in another application.
       **/
      ApplicationKeyAlreadyUsed: AugmentedError<ApiType>;
      /**
       * The application with the given ID was not found.
       **/
      ApplicationNotFound: AugmentedError<ApiType>;
      /**
       * The application is not in a pending state.
       **/
      ApplicationNotPending: AugmentedError<ApiType>;
      /**
       * The application data is too small or empty.
       **/
      ApplicationTooSmall: AugmentedError<ApiType>;
      /**
       * Tried revoking a removal application.
       **/
      CannotRevokeRemoveApplication: AugmentedError<ApiType>;
      /**
       * Tried revoking an application that is not resolved.
       **/
      CannotRevokeUnresolvedApplication: AugmentedError<ApiType>;
      /**
       * Failed to convert the given value to a balance.
       **/
      CouldNotConvertToBalance: AugmentedError<ApiType>;
      /**
       * Dao Treasury doesn't have enough funds to be transferred.
       **/
      InsufficientDaoTreasuryFunds: AugmentedError<ApiType>;
      /**
       * Key doesn't have enough stake to vote.
       **/
      InsufficientStake: AugmentedError<ApiType>;
      /**
       * An internal error occurred, probably relating to the size of the bounded sets.
       **/
      InternalError: AugmentedError<ApiType>;
      /**
       * The penalty percentage provided does not meet the maximum requirement
       **/
      InvalidAgentPenaltyPercentage: AugmentedError<ApiType>;
      /**
       * The application data is invalid or malformed.
       **/
      InvalidApplication: AugmentedError<ApiType>;
      /**
       * The application data provided does not meet the length requirement
       **/
      InvalidApplicationDataLength: AugmentedError<ApiType>;
      /**
       * The application data is too large, exceeding the maximum allowed size.
       **/
      InvalidApplicationSize: AugmentedError<ApiType>;
      /**
       * Invalid value given when transforming a u64 into T::Currency.
       **/
      InvalidCurrencyConversionValue: AugmentedError<ApiType>;
      /**
       * Invalid params given to Emission proposal
       **/
      InvalidEmissionProposalData: AugmentedError<ApiType>;
      /**
       * Invalid maximum allowed agents in proposal
       **/
      InvalidMaxAllowedAgents: AugmentedError<ApiType>;
      /**
       * Invalid maximum allowed weights in proposal
       **/
      InvalidMaxAllowedWeights: AugmentedError<ApiType>;
      /**
       * Invalid maximum name length in proposal
       **/
      InvalidMaxNameLength: AugmentedError<ApiType>;
      /**
       * Invalid minimum name length in proposal
       **/
      InvalidMinNameLength: AugmentedError<ApiType>;
      /**
       * Invalid minimum staking fee in proposal
       **/
      InvalidMinStakingFee: AugmentedError<ApiType>;
      /**
       * Invalid minimum weight control fee in proposal
       **/
      InvalidMinWeightControlFee: AugmentedError<ApiType>;
      /**
       * Invalid agent penalty percentage
       **/
      InvalidPenaltyPercentage: AugmentedError<ApiType>;
      /**
       * Negative proposal cost when setting global or subnet governance configuration.
       **/
      InvalidProposalCost: AugmentedError<ApiType>;
      /**
       * Proposal data isn't composed by valid UTF-8 characters.
       **/
      InvalidProposalData: AugmentedError<ApiType>;
      /**
       * Negative expiration when setting global or subnet governance configuration.
       **/
      InvalidProposalExpiration: AugmentedError<ApiType>;
      /**
       * Invalid parameters were provided to the finalization process.
       **/
      InvalidProposalFinalizationParameters: AugmentedError<ApiType>;
      /**
       * Invalid parameters were provided to the voting process.
       **/
      InvalidProposalVotingParameters: AugmentedError<ApiType>;
      /**
       * The staked module is already delegating for 2 ^ 32 keys.
       **/
      ModuleDelegatingForMaxStakers: AugmentedError<ApiType>;
      /**
       * The key is not an allocator.
       **/
      NotAllocator: AugmentedError<ApiType>;
      /**
       * The operation can only be performed by the curator.
       **/
      NotCurator: AugmentedError<ApiType>;
      /**
       * The account doesn't have enough balance to submit an application.
       **/
      NotEnoughBalanceToApply: AugmentedError<ApiType>;
      /**
       * Key doesn't have enough tokens to create a proposal.
       **/
      NotEnoughBalanceToPropose: AugmentedError<ApiType>;
      /**
       * The operation can only be performed by the root curator.
       **/
      NotRootCurator: AugmentedError<ApiType>;
      /**
       * Key hasn't voted on given Proposal.
       **/
      NotVoted: AugmentedError<ApiType>;
      /**
       * The account is not whitelisted and cannot be removed from the whitelist.
       **/
      NotWhitelisted: AugmentedError<ApiType>;
      /**
       * Proposal was either accepted, refused or expired and cannot accept votes.
       **/
      ProposalClosed: AugmentedError<ApiType>;
      /**
       * Proposal data is bigger than 256 characters.
       **/
      ProposalDataTooLarge: AugmentedError<ApiType>;
      /**
       * Proposal data is empty.
       **/
      ProposalDataTooSmall: AugmentedError<ApiType>;
      /**
       * The proposal is already finished. Do not retry.
       **/
      ProposalIsFinished: AugmentedError<ApiType>;
      /**
       * Proposal with given id doesn't exist.
       **/
      ProposalNotFound: AugmentedError<ApiType>;
      /**
       * The voter is delegating its voting power to their staked modules. Disable voting power
       * delegation.
       **/
      VoterIsDelegatingVotingPower: AugmentedError<ApiType>;
      /**
       * Generic error
       **/
      [key: string]: AugmentedError<ApiType>;
    };
    grandpa: {
      /**
       * Attempt to signal GRANDPA change with one already pending.
       **/
      ChangePending: AugmentedError<ApiType>;
      /**
       * A given equivocation report is valid but already previously reported.
       **/
      DuplicateOffenceReport: AugmentedError<ApiType>;
      /**
       * An equivocation proof provided as part of an equivocation report is invalid.
       **/
      InvalidEquivocationProof: AugmentedError<ApiType>;
      /**
       * A key ownership proof provided as part of an equivocation report is invalid.
       **/
      InvalidKeyOwnershipProof: AugmentedError<ApiType>;
      /**
       * Attempt to signal GRANDPA pause when the authority set isn't live
       * (either paused or already pending pause).
       **/
      PauseFailed: AugmentedError<ApiType>;
      /**
       * Attempt to signal GRANDPA resume when the authority set isn't paused
       * (either live or already pending resume).
       **/
      ResumeFailed: AugmentedError<ApiType>;
      /**
       * Cannot signal forced change so soon after last.
       **/
      TooSoon: AugmentedError<ApiType>;
      /**
       * Generic error
       **/
      [key: string]: AugmentedError<ApiType>;
    };
    multisig: {
      /**
       * Call is already approved by this signatory.
       **/
      AlreadyApproved: AugmentedError<ApiType>;
      /**
       * The data to be stored is already stored.
       **/
      AlreadyStored: AugmentedError<ApiType>;
      /**
       * The maximum weight information provided was too low.
       **/
      MaxWeightTooLow: AugmentedError<ApiType>;
      /**
       * Threshold must be 2 or greater.
       **/
      MinimumThreshold: AugmentedError<ApiType>;
      /**
       * Call doesn't need any (more) approvals.
       **/
      NoApprovalsNeeded: AugmentedError<ApiType>;
      /**
       * Multisig operation not found when attempting to cancel.
       **/
      NotFound: AugmentedError<ApiType>;
      /**
       * No timepoint was given, yet the multisig operation is already underway.
       **/
      NoTimepoint: AugmentedError<ApiType>;
      /**
       * Only the account that originally created the multisig is able to cancel it.
       **/
      NotOwner: AugmentedError<ApiType>;
      /**
       * The sender was contained in the other signatories; it shouldn't be.
       **/
      SenderInSignatories: AugmentedError<ApiType>;
      /**
       * The signatories were provided out of order; they should be ordered.
       **/
      SignatoriesOutOfOrder: AugmentedError<ApiType>;
      /**
       * There are too few signatories in the list.
       **/
      TooFewSignatories: AugmentedError<ApiType>;
      /**
       * There are too many signatories in the list.
       **/
      TooManySignatories: AugmentedError<ApiType>;
      /**
       * A timepoint was given, yet no multisig operation is underway.
       **/
      UnexpectedTimepoint: AugmentedError<ApiType>;
      /**
       * A different timepoint was given to the multisig operation that is underway.
       **/
      WrongTimepoint: AugmentedError<ApiType>;
      /**
       * Generic error
       **/
      [key: string]: AugmentedError<ApiType>;
    };
    sudo: {
      /**
       * Sender must be the Sudo account.
       **/
      RequireSudo: AugmentedError<ApiType>;
      /**
       * Generic error
       **/
      [key: string]: AugmentedError<ApiType>;
    };
    system: {
      /**
       * The origin filter prevent the call to be dispatched.
       **/
      CallFiltered: AugmentedError<ApiType>;
      /**
       * The specified [`Task`] failed during execution.
       **/
      FailedTask: AugmentedError<ApiType>;
      /**
       * Failed to extract the runtime version from the new runtime.
       * 
       * Either calling `Core_version` or decoding `RuntimeVersion` failed.
       **/
      FailedToExtractRuntimeVersion: AugmentedError<ApiType>;
      /**
       * The name of specification does not match between the current runtime
       * and the new runtime.
       **/
      InvalidSpecName: AugmentedError<ApiType>;
      /**
       * The specified [`Task`] is not valid.
       **/
      InvalidTask: AugmentedError<ApiType>;
      /**
       * A multi-block migration is ongoing and prevents the current code from being replaced.
       **/
      MultiBlockMigrationsOngoing: AugmentedError<ApiType>;
      /**
       * Suicide called when the account has non-default composite data.
       **/
      NonDefaultComposite: AugmentedError<ApiType>;
      /**
       * There is a non-zero reference count preventing the account from being purged.
       **/
      NonZeroRefCount: AugmentedError<ApiType>;
      /**
       * No upgrade authorized.
       **/
      NothingAuthorized: AugmentedError<ApiType>;
      /**
       * The specification version is not allowed to decrease between the current runtime
       * and the new runtime.
       **/
      SpecVersionNeedsToIncrease: AugmentedError<ApiType>;
      /**
       * The submitted code is not authorized.
       **/
      Unauthorized: AugmentedError<ApiType>;
      /**
       * Generic error
       **/
      [key: string]: AugmentedError<ApiType>;
    };
    torus0: {
      /**
       * The agent is already registered in the active set.
       **/
      AgentAlreadyRegistered: AugmentedError<ApiType>;
      /**
       * The specified agent does not exist.
       **/
      AgentDoesNotExist: AugmentedError<ApiType>;
      /**
       * Key is not present in Whitelist, it needs to be whitelisted by a Curator
       **/
      AgentKeyNotWhitelisted: AugmentedError<ApiType>;
      /**
       * The agent metadata is too long.
       **/
      AgentMetadataTooLong: AugmentedError<ApiType>;
      /**
       * The agent metadata is too long.
       **/
      AgentMetadataTooShort: AugmentedError<ApiType>;
      /**
       * A agent with this name already exists in the subnet.
       **/
      AgentNameAlreadyExists: AugmentedError<ApiType>;
      /**
       * The agent name is too long.
       **/
      AgentNameTooLong: AugmentedError<ApiType>;
      /**
       * The agent name is too short.
       **/
      AgentNameTooShort: AugmentedError<ApiType>;
      /**
       * The agent url is too long.
       **/
      AgentUrlTooLong: AugmentedError<ApiType>;
      /**
       * The agent url is too short.
       **/
      AgentUrlTooShort: AugmentedError<ApiType>;
      /**
       * An arithmetic error occurred during calculation.
       **/
      ArithmeticError: AugmentedError<ApiType>;
      /**
       * Balance could not be removed from the account.
       **/
      BalanceCouldNotBeRemoved: AugmentedError<ApiType>;
      /**
       * Failed to add balance to the account.
       **/
      BalanceNotAdded: AugmentedError<ApiType>;
      /**
       * Failed to remove balance from the account.
       **/
      BalanceNotRemoved: AugmentedError<ApiType>;
      /**
       * Failed to convert between u128 and T::Balance.
       **/
      CouldNotConvertToBalance: AugmentedError<ApiType>;
      /**
       * The extrinsic panicked during execution.
       **/
      ExtrinsicPanicked: AugmentedError<ApiType>;
      /**
       * The agent metadata is invalid.
       **/
      InvalidAgentMetadata: AugmentedError<ApiType>;
      /**
       * The agent name is invalid. It must be a UTF-8 encoded string.
       **/
      InvalidAgentName: AugmentedError<ApiType>;
      /**
       * The agent ur; is invalid.
       **/
      InvalidAgentUrl: AugmentedError<ApiType>;
      /**
       * The amount given is 0
       **/
      InvalidAmount: AugmentedError<ApiType>;
      /**
       * The maximum burn value is invalid.
       **/
      InvalidMaxBurn: AugmentedError<ApiType>;
      /**
       * The minimum burn value is invalid, likely too small.
       **/
      InvalidMinBurn: AugmentedError<ApiType>;
      /**
       * Invalid shares distribution.
       **/
      InvalidShares: AugmentedError<ApiType>;
      /**
       * The staking fee given is lower than the minimum fee
       **/
      InvalidStakingFee: AugmentedError<ApiType>;
      /**
       * The weight control fee given is lower than the minimum fee
       **/
      InvalidWeightControlFee: AugmentedError<ApiType>;
      /**
       * Attempted to set max allowed agents to a value less than the current number of
       * registered agents.
       **/
      MaxAllowedAgents: AugmentedError<ApiType>;
      /**
       * Insufficient balance to register.
       **/
      NotEnoughBalanceToRegisterAgent: AugmentedError<ApiType>;
      /**
       * Insufficient balance in the cold key account to stake the requested amount.
       **/
      NotEnoughBalanceToStake: AugmentedError<ApiType>;
      /**
       * Insufficient balance to transfer.
       **/
      NotEnoughBalanceToTransfer: AugmentedError<ApiType>;
      /**
       * Insufficient stake to register.
       **/
      NotEnoughStakeToRegister: AugmentedError<ApiType>;
      /**
       * Insufficient stake to withdraw the requested amount.
       **/
      NotEnoughStakeToWithdraw: AugmentedError<ApiType>;
      /**
       * Failed to add stake to the account.
       **/
      StakeNotAdded: AugmentedError<ApiType>;
      /**
       * Failed to remove stake from the account.
       **/
      StakeNotRemoved: AugmentedError<ApiType>;
      /**
       * The stake amount to add or remove is too small. Minimum is 0.5 unit.
       **/
      StakeTooSmall: AugmentedError<ApiType>;
      /**
       * A step in the process panicked.
       **/
      StepPanicked: AugmentedError<ApiType>;
      /**
       * The entity is still registered and cannot be modified.
       **/
      StillRegistered: AugmentedError<ApiType>;
      /**
       * The number of agent registrations in this block exceeds the allowed limit.
       **/
      TooManyAgentRegistrationsThisBlock: AugmentedError<ApiType>;
      /**
       * The number of agent registrations in this interval exceeds the allowed limit.
       **/
      TooManyAgentRegistrationsThisInterval: AugmentedError<ApiType>;
      /**
       * Generic error
       **/
      [key: string]: AugmentedError<ApiType>;
    };
  } // AugmentedErrors
} // declare module
