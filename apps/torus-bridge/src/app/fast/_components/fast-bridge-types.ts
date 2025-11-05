import type { SS58Address } from "@torus-network/sdk/types";

export type SimpleBridgeDirection = "base-to-native" | "native-to-base";

export interface SimpleBridgeFormValues {
  direction: SimpleBridgeDirection;
  amount: string;
}

export enum SimpleBridgeStep {
  IDLE = "idle",
  STEP_1_PREPARING = "step_1_preparing",
  STEP_1_SIGNING = "step_1_signing",
  STEP_1_CONFIRMING = "step_1_confirming",
  STEP_1_COMPLETE = "step_1_complete",
  STEP_2_PREPARING = "step_2_preparing",
  STEP_2_SWITCHING = "step_2_switching",
  STEP_2_SIGNING = "step_2_signing",
  STEP_2_CONFIRMING = "step_2_confirming",
  COMPLETE = "complete",
  ERROR = "error",
}

export interface SimpleBridgeState {
  step: SimpleBridgeStep;
  direction: SimpleBridgeDirection | null;
  amount: string;
  step1TxHash?: string;
  step2TxHash?: string;
  errorMessage?: string;
  estimatedStep1Time?: number;
  estimatedStep2Time?: number;
}

export interface WalletConnectionState {
  // Torus Native wallet (Substrate)
  torusWallet: {
    isConnected: boolean;
    address?: SS58Address;
    isConnecting?: boolean;
  };

  // EVM wallets (Base + Torus EVM)
  evmWallet: {
    isConnected: boolean;
    address?: string;
    chainId?: number;
    isConnecting?: boolean;
  };
}

export interface TransactionStepInfo {
  title: string;
  description: string;
  chainName: string;
  estimatedTime: number;
}

export interface SimpleBridgeTransaction {
  step: 1 | 2;
  txHash?: string;
  status: "STARTING" | "SIGNING" | "CONFIRMING" | "SUCCESS" | "ERROR" | null;
  message?: string;
  chainName: string;
  explorerUrl?: string;
  metadata?: { type: "switch" };
  errorDetails?: string; // User-friendly formatted error message
  errorPhase?: "sign" | "confirm"; // Phase where error occurred for step errors
}

export interface FastBridgeTransactionHistoryItem {
  id: string;
  timestamp: number;
  direction: SimpleBridgeDirection;
  amount: string;
  status: "pending" | "step1_complete" | "completed" | "error";
  currentStep: SimpleBridgeStep;

  // Transaction details
  step1TxHash?: string;
  step2TxHash?: string;
  errorMessage?: string;
  errorStep?: 1 | 2;

  // For recovery
  canRetry: boolean;

  // Metadata
  evmAddress?: string;
  nativeAddress?: string;
}

export type TransactionHistoryFilter = "all" | "completed" | "error";
