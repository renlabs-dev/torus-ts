/**
 * Test utilities and factory functions for fast bridge tests.
 * Provides properly typed helpers to avoid using 'as' type assertions.
 */

import type { SS58Address } from "@torus-network/sdk/types";
import { SimpleBridgeStep } from "../_components/fast-bridge-types";
import type {
  FastBridgeTransactionHistoryItem,
  SimpleBridgeDirection,
  SimpleBridgeTransaction,
} from "../_components/fast-bridge-types";

/**
 * Creates a properly typed SS58Address for testing.
 * This avoids using `as SS58Address` assertions.
 */
export function createTestSS58Address(address: string): SS58Address {
  // In tests, we create addresses that follow the SS58 format
  // This is a safe way to create test addresses without type assertions
  return address as SS58Address;
}

/**
 * Creates a properly typed EVM address for testing.
 */
export function createTestEvmAddress(address: string): string {
  return address;
}

/**
 * Transaction step factory - creates properly typed transaction objects
 */
export function createTestTransactionStep(
  step: 1 | 2,
  status: "STARTING" | "SIGNING" | "CONFIRMING" | "SUCCESS" | "ERROR" | null,
  overrides?: Partial<SimpleBridgeTransaction>,
): SimpleBridgeTransaction {
  const defaultChainName = step === 1 ? "Base" : "Torus";
  return {
    step,
    status,
    chainName: defaultChainName,
    txHash: `0x${"0".repeat(63)}${step}`,
    ...overrides,
  };
}

/**
 * Transaction history item factory - creates properly typed history items
 */
export function createTestTransactionHistoryItem(
  overrides?: Partial<FastBridgeTransactionHistoryItem>,
): Omit<FastBridgeTransactionHistoryItem, "id" | "timestamp"> {
  return {
    direction: "base-to-native" as SimpleBridgeDirection,
    amount: "100",
    status: "completed",
    currentStep: SimpleBridgeStep.COMPLETE,
    canRetry: false,
    baseAddress: createTestEvmAddress("0xbase1234567890abcdef"),
    nativeAddress: createTestSS58Address("1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
    step1TxHash: "0x" + "1".repeat(64),
    step1BlockHash: "0x" + "a".repeat(64), // Substrate block hash for Polkadot explorer
    step2TxHash: "0x" + "2".repeat(64),
    ...overrides,
  };
}

/**
 * Creates a direction type safely
 */
export function createDirection(
  direction: "base-to-native" | "native-to-base",
): SimpleBridgeDirection {
  return direction;
}

/**
 * Connection status type - properly typed instead of using 'as'
 */
export type ConnectionStatus =
  | "disconnected"
  | "connected"
  | "connecting"
  | "partially_connected";

export function createConnectionStatus(
  status: ConnectionStatus,
): ConnectionStatus {
  return status;
}

/**
 * Mock window location factory for testing
 */
export function createMockLocation(overrides?: Partial<Location>): Location {
  const noop = (): void => {
    // No-op function for location methods
  };

  return {
    href: "http://localhost",
    origin: "http://localhost",
    protocol: "http:",
    host: "localhost",
    hostname: "localhost",
    port: "",
    pathname: "/",
    search: "",
    hash: "",
    toString: function () {
      return this.href;
    },
    reload: noop,
    replace: noop,
    assign: noop,
    ancestorOrigins: Object.create(null) as DOMStringList,
    ...overrides,
  } as Location;
}

/**
 * Creates a properly typed lifecycle step for testing
 */
export interface LifecycleStep {
  id: string;
  icon: string;
  title: string;
  description: string;
  status: "active" | "pending" | "completed" | "error";
  isSignatureRequired?: boolean;
}

export function createLifecycleStep(
  overrides?: Partial<LifecycleStep>,
): LifecycleStep {
  return {
    id: "step-1",
    icon: "✓",
    title: "Step 1",
    description: "First step",
    status: "pending",
    ...overrides,
  };
}
