// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

// import type lookup before we augment - in some environments
// this is required to allow for ambient/previous definitions
import '@polkadot/types/types/registry';

import type { EthbloomBloom, EthereumBlock, EthereumHeader, EthereumLog, EthereumReceiptEip658ReceiptData, EthereumReceiptReceiptV3, EthereumTransactionAccessListItem, EthereumTransactionEip1559Transaction, EthereumTransactionEip2930Transaction, EthereumTransactionLegacyTransaction, EthereumTransactionTransactionAction, EthereumTransactionTransactionSignature, EthereumTransactionTransactionV2, EthereumTypesHashH64, EvmCoreErrorExitError, EvmCoreErrorExitFatal, EvmCoreErrorExitReason, EvmCoreErrorExitRevert, EvmCoreErrorExitSucceed, FinalityGrandpaEquivocationPrecommit, FinalityGrandpaEquivocationPrevote, FinalityGrandpaPrecommit, FinalityGrandpaPrevote, FpRpcTransactionStatus, FrameMetadataHashExtensionCheckMetadataHash, FrameMetadataHashExtensionMode, FrameSupportDispatchDispatchClass, FrameSupportDispatchDispatchInfo, FrameSupportDispatchPays, FrameSupportDispatchPerDispatchClassU32, FrameSupportDispatchPerDispatchClassWeight, FrameSupportDispatchPerDispatchClassWeightsPerClass, FrameSupportPalletId, FrameSupportTokensMiscBalanceStatus, FrameSupportTokensMiscIdAmount, FrameSystemAccountInfo, FrameSystemCall, FrameSystemCodeUpgradeAuthorization, FrameSystemError, FrameSystemEvent, FrameSystemEventRecord, FrameSystemExtensionsCheckGenesis, FrameSystemExtensionsCheckNonZeroSender, FrameSystemExtensionsCheckNonce, FrameSystemExtensionsCheckSpecVersion, FrameSystemExtensionsCheckTxVersion, FrameSystemExtensionsCheckWeight, FrameSystemLastRuntimeUpgradeInfo, FrameSystemLimitsBlockLength, FrameSystemLimitsBlockWeights, FrameSystemLimitsWeightsPerClass, FrameSystemPhase, PalletBalancesAccountData, PalletBalancesAdjustmentDirection, PalletBalancesBalanceLock, PalletBalancesCall, PalletBalancesError, PalletBalancesEvent, PalletBalancesReasons, PalletBalancesReserveData, PalletEmission0Call, PalletEmission0ConsensusMember, PalletEmission0Error, PalletEmission0Event, PalletEthereumCall, PalletEthereumError, PalletEthereumEvent, PalletEvmCall, PalletEvmCodeMetadata, PalletEvmError, PalletEvmEvent, PalletFaucetCall, PalletFaucetError, PalletFaucetEvent, PalletGovernanceApplicationAgentApplication, PalletGovernanceApplicationApplicationAction, PalletGovernanceApplicationApplicationStatus, PalletGovernanceCall, PalletGovernanceConfigGovernanceConfiguration, PalletGovernanceError, PalletGovernanceEvent, PalletGovernanceProposal, PalletGovernanceProposalGlobalParamsData, PalletGovernanceProposalProposalData, PalletGovernanceProposalProposalStatus, PalletGovernanceProposalUnrewardedProposal, PalletGrandpaCall, PalletGrandpaError, PalletGrandpaEvent, PalletGrandpaStoredPendingChange, PalletGrandpaStoredState, PalletMultisigCall, PalletMultisigError, PalletMultisigEvent, PalletMultisigMultisig, PalletMultisigTimepoint, PalletPermission0Call, PalletPermission0Error, PalletPermission0Event, PalletPermission0PermissionCuratorCuratorScope, PalletPermission0PermissionEmissionDistributionControl, PalletPermission0PermissionEmissionEmissionAllocation, PalletPermission0PermissionEmissionEmissionScope, PalletPermission0PermissionEnforcementAuthority, PalletPermission0PermissionEnforcementReferendum, PalletPermission0PermissionNamespaceScope, PalletPermission0PermissionPermissionContract, PalletPermission0PermissionPermissionDuration, PalletPermission0PermissionPermissionScope, PalletPermission0PermissionRevocationTerms, PalletSudoCall, PalletSudoError, PalletSudoEvent, PalletTimestampCall, PalletTorus0Agent, PalletTorus0BurnBurnConfiguration, PalletTorus0Call, PalletTorus0Error, PalletTorus0Event, PalletTorus0FeeValidatorFee, PalletTorus0FeeValidatorFeeConstraints, PalletTorus0NamespaceNamespaceMetadata, PalletTorus0NamespaceNamespaceOwnership, PalletTorus0NamespaceNamespacePricingConfig, PalletTransactionPaymentChargeTransactionPayment, PalletTransactionPaymentEvent, PalletTransactionPaymentReleases, SpArithmeticArithmeticError, SpConsensusAuraSr25519AppSr25519Public, SpConsensusGrandpaAppPublic, SpConsensusGrandpaAppSignature, SpConsensusGrandpaEquivocation, SpConsensusGrandpaEquivocationProof, SpCoreVoid, SpRuntimeDigest, SpRuntimeDigestDigestItem, SpRuntimeDispatchError, SpRuntimeModuleError, SpRuntimeMultiSignature, SpRuntimeTokenError, SpRuntimeTransactionalError, SpVersionRuntimeVersion, SpWeightsRuntimeDbWeight, SpWeightsWeightV2Weight, TorusRuntimeRuntime, TorusRuntimeRuntimeHoldReason, TorusRuntimeRuntimeTask } from '@polkadot/types/lookup';

declare module '@polkadot/types/types/registry' {
  interface InterfaceTypes {
    EthbloomBloom: EthbloomBloom;
    EthereumBlock: EthereumBlock;
    EthereumHeader: EthereumHeader;
    EthereumLog: EthereumLog;
    EthereumReceiptEip658ReceiptData: EthereumReceiptEip658ReceiptData;
    EthereumReceiptReceiptV3: EthereumReceiptReceiptV3;
    EthereumTransactionAccessListItem: EthereumTransactionAccessListItem;
    EthereumTransactionEip1559Transaction: EthereumTransactionEip1559Transaction;
    EthereumTransactionEip2930Transaction: EthereumTransactionEip2930Transaction;
    EthereumTransactionLegacyTransaction: EthereumTransactionLegacyTransaction;
    EthereumTransactionTransactionAction: EthereumTransactionTransactionAction;
    EthereumTransactionTransactionSignature: EthereumTransactionTransactionSignature;
    EthereumTransactionTransactionV2: EthereumTransactionTransactionV2;
    EthereumTypesHashH64: EthereumTypesHashH64;
    EvmCoreErrorExitError: EvmCoreErrorExitError;
    EvmCoreErrorExitFatal: EvmCoreErrorExitFatal;
    EvmCoreErrorExitReason: EvmCoreErrorExitReason;
    EvmCoreErrorExitRevert: EvmCoreErrorExitRevert;
    EvmCoreErrorExitSucceed: EvmCoreErrorExitSucceed;
    FinalityGrandpaEquivocationPrecommit: FinalityGrandpaEquivocationPrecommit;
    FinalityGrandpaEquivocationPrevote: FinalityGrandpaEquivocationPrevote;
    FinalityGrandpaPrecommit: FinalityGrandpaPrecommit;
    FinalityGrandpaPrevote: FinalityGrandpaPrevote;
    FpRpcTransactionStatus: FpRpcTransactionStatus;
    FrameMetadataHashExtensionCheckMetadataHash: FrameMetadataHashExtensionCheckMetadataHash;
    FrameMetadataHashExtensionMode: FrameMetadataHashExtensionMode;
    FrameSupportDispatchDispatchClass: FrameSupportDispatchDispatchClass;
    FrameSupportDispatchDispatchInfo: FrameSupportDispatchDispatchInfo;
    FrameSupportDispatchPays: FrameSupportDispatchPays;
    FrameSupportDispatchPerDispatchClassU32: FrameSupportDispatchPerDispatchClassU32;
    FrameSupportDispatchPerDispatchClassWeight: FrameSupportDispatchPerDispatchClassWeight;
    FrameSupportDispatchPerDispatchClassWeightsPerClass: FrameSupportDispatchPerDispatchClassWeightsPerClass;
    FrameSupportPalletId: FrameSupportPalletId;
    FrameSupportTokensMiscBalanceStatus: FrameSupportTokensMiscBalanceStatus;
    FrameSupportTokensMiscIdAmount: FrameSupportTokensMiscIdAmount;
    FrameSystemAccountInfo: FrameSystemAccountInfo;
    FrameSystemCall: FrameSystemCall;
    FrameSystemCodeUpgradeAuthorization: FrameSystemCodeUpgradeAuthorization;
    FrameSystemError: FrameSystemError;
    FrameSystemEvent: FrameSystemEvent;
    FrameSystemEventRecord: FrameSystemEventRecord;
    FrameSystemExtensionsCheckGenesis: FrameSystemExtensionsCheckGenesis;
    FrameSystemExtensionsCheckNonZeroSender: FrameSystemExtensionsCheckNonZeroSender;
    FrameSystemExtensionsCheckNonce: FrameSystemExtensionsCheckNonce;
    FrameSystemExtensionsCheckSpecVersion: FrameSystemExtensionsCheckSpecVersion;
    FrameSystemExtensionsCheckTxVersion: FrameSystemExtensionsCheckTxVersion;
    FrameSystemExtensionsCheckWeight: FrameSystemExtensionsCheckWeight;
    FrameSystemLastRuntimeUpgradeInfo: FrameSystemLastRuntimeUpgradeInfo;
    FrameSystemLimitsBlockLength: FrameSystemLimitsBlockLength;
    FrameSystemLimitsBlockWeights: FrameSystemLimitsBlockWeights;
    FrameSystemLimitsWeightsPerClass: FrameSystemLimitsWeightsPerClass;
    FrameSystemPhase: FrameSystemPhase;
    PalletBalancesAccountData: PalletBalancesAccountData;
    PalletBalancesAdjustmentDirection: PalletBalancesAdjustmentDirection;
    PalletBalancesBalanceLock: PalletBalancesBalanceLock;
    PalletBalancesCall: PalletBalancesCall;
    PalletBalancesError: PalletBalancesError;
    PalletBalancesEvent: PalletBalancesEvent;
    PalletBalancesReasons: PalletBalancesReasons;
    PalletBalancesReserveData: PalletBalancesReserveData;
    PalletEmission0Call: PalletEmission0Call;
    PalletEmission0ConsensusMember: PalletEmission0ConsensusMember;
    PalletEmission0Error: PalletEmission0Error;
    PalletEmission0Event: PalletEmission0Event;
    PalletEthereumCall: PalletEthereumCall;
    PalletEthereumError: PalletEthereumError;
    PalletEthereumEvent: PalletEthereumEvent;
    PalletEvmCall: PalletEvmCall;
    PalletEvmCodeMetadata: PalletEvmCodeMetadata;
    PalletEvmError: PalletEvmError;
    PalletEvmEvent: PalletEvmEvent;
    PalletFaucetCall: PalletFaucetCall;
    PalletFaucetError: PalletFaucetError;
    PalletFaucetEvent: PalletFaucetEvent;
    PalletGovernanceApplicationAgentApplication: PalletGovernanceApplicationAgentApplication;
    PalletGovernanceApplicationApplicationAction: PalletGovernanceApplicationApplicationAction;
    PalletGovernanceApplicationApplicationStatus: PalletGovernanceApplicationApplicationStatus;
    PalletGovernanceCall: PalletGovernanceCall;
    PalletGovernanceConfigGovernanceConfiguration: PalletGovernanceConfigGovernanceConfiguration;
    PalletGovernanceError: PalletGovernanceError;
    PalletGovernanceEvent: PalletGovernanceEvent;
    PalletGovernanceProposal: PalletGovernanceProposal;
    PalletGovernanceProposalGlobalParamsData: PalletGovernanceProposalGlobalParamsData;
    PalletGovernanceProposalProposalData: PalletGovernanceProposalProposalData;
    PalletGovernanceProposalProposalStatus: PalletGovernanceProposalProposalStatus;
    PalletGovernanceProposalUnrewardedProposal: PalletGovernanceProposalUnrewardedProposal;
    PalletGrandpaCall: PalletGrandpaCall;
    PalletGrandpaError: PalletGrandpaError;
    PalletGrandpaEvent: PalletGrandpaEvent;
    PalletGrandpaStoredPendingChange: PalletGrandpaStoredPendingChange;
    PalletGrandpaStoredState: PalletGrandpaStoredState;
    PalletMultisigCall: PalletMultisigCall;
    PalletMultisigError: PalletMultisigError;
    PalletMultisigEvent: PalletMultisigEvent;
    PalletMultisigMultisig: PalletMultisigMultisig;
    PalletMultisigTimepoint: PalletMultisigTimepoint;
    PalletPermission0Call: PalletPermission0Call;
    PalletPermission0Error: PalletPermission0Error;
    PalletPermission0Event: PalletPermission0Event;
    PalletPermission0PermissionCuratorCuratorScope: PalletPermission0PermissionCuratorCuratorScope;
    PalletPermission0PermissionEmissionDistributionControl: PalletPermission0PermissionEmissionDistributionControl;
    PalletPermission0PermissionEmissionEmissionAllocation: PalletPermission0PermissionEmissionEmissionAllocation;
    PalletPermission0PermissionEmissionEmissionScope: PalletPermission0PermissionEmissionEmissionScope;
    PalletPermission0PermissionEnforcementAuthority: PalletPermission0PermissionEnforcementAuthority;
    PalletPermission0PermissionEnforcementReferendum: PalletPermission0PermissionEnforcementReferendum;
    PalletPermission0PermissionNamespaceScope: PalletPermission0PermissionNamespaceScope;
    PalletPermission0PermissionPermissionContract: PalletPermission0PermissionPermissionContract;
    PalletPermission0PermissionPermissionDuration: PalletPermission0PermissionPermissionDuration;
    PalletPermission0PermissionPermissionScope: PalletPermission0PermissionPermissionScope;
    PalletPermission0PermissionRevocationTerms: PalletPermission0PermissionRevocationTerms;
    PalletSudoCall: PalletSudoCall;
    PalletSudoError: PalletSudoError;
    PalletSudoEvent: PalletSudoEvent;
    PalletTimestampCall: PalletTimestampCall;
    PalletTorus0Agent: PalletTorus0Agent;
    PalletTorus0BurnBurnConfiguration: PalletTorus0BurnBurnConfiguration;
    PalletTorus0Call: PalletTorus0Call;
    PalletTorus0Error: PalletTorus0Error;
    PalletTorus0Event: PalletTorus0Event;
    PalletTorus0FeeValidatorFee: PalletTorus0FeeValidatorFee;
    PalletTorus0FeeValidatorFeeConstraints: PalletTorus0FeeValidatorFeeConstraints;
    PalletTorus0NamespaceNamespaceMetadata: PalletTorus0NamespaceNamespaceMetadata;
    PalletTorus0NamespaceNamespaceOwnership: PalletTorus0NamespaceNamespaceOwnership;
    PalletTorus0NamespaceNamespacePricingConfig: PalletTorus0NamespaceNamespacePricingConfig;
    PalletTransactionPaymentChargeTransactionPayment: PalletTransactionPaymentChargeTransactionPayment;
    PalletTransactionPaymentEvent: PalletTransactionPaymentEvent;
    PalletTransactionPaymentReleases: PalletTransactionPaymentReleases;
    SpArithmeticArithmeticError: SpArithmeticArithmeticError;
    SpConsensusAuraSr25519AppSr25519Public: SpConsensusAuraSr25519AppSr25519Public;
    SpConsensusGrandpaAppPublic: SpConsensusGrandpaAppPublic;
    SpConsensusGrandpaAppSignature: SpConsensusGrandpaAppSignature;
    SpConsensusGrandpaEquivocation: SpConsensusGrandpaEquivocation;
    SpConsensusGrandpaEquivocationProof: SpConsensusGrandpaEquivocationProof;
    SpCoreVoid: SpCoreVoid;
    SpRuntimeDigest: SpRuntimeDigest;
    SpRuntimeDigestDigestItem: SpRuntimeDigestDigestItem;
    SpRuntimeDispatchError: SpRuntimeDispatchError;
    SpRuntimeModuleError: SpRuntimeModuleError;
    SpRuntimeMultiSignature: SpRuntimeMultiSignature;
    SpRuntimeTokenError: SpRuntimeTokenError;
    SpRuntimeTransactionalError: SpRuntimeTransactionalError;
    SpVersionRuntimeVersion: SpVersionRuntimeVersion;
    SpWeightsRuntimeDbWeight: SpWeightsRuntimeDbWeight;
    SpWeightsWeightV2Weight: SpWeightsWeightV2Weight;
    TorusRuntimeRuntime: TorusRuntimeRuntime;
    TorusRuntimeRuntimeHoldReason: TorusRuntimeRuntimeHoldReason;
    TorusRuntimeRuntimeTask: TorusRuntimeRuntimeTask;
  } // InterfaceTypes
} // declare module
