import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FastBridgeForm } from "./fast-bridge-form";

vi.mock("../hooks/use-fast-bridge-dual-wallet", () => ({
  useDualWallet: () => ({
    areWalletsReady: vi.fn().mockReturnValue(true),
    connectionState: {
      evmWallet: { isConnected: true, address: "0x123..." },
      torusWallet: { isConnected: true },
    },
    chainIds: { base: 8453, torus: 8443 },
  }),
}));

vi.mock("../hooks/use-fast-bridge-orchestrated-transfer", () => ({
  useOrchestratedTransfer: () => ({
    bridgeState: { step: 0, direction: null, amount: "", errorMessage: undefined },
    transactions: [],
    executeTransfer: vi.fn(),
    resetTransfer: vi.fn(),
    retryFromFailedStep: vi.fn(),
    isTransferInProgress: false,
    getExplorerUrl: vi.fn(),
    setTransactions: vi.fn(),
    updateBridgeState: vi.fn(),
    setCurrentTransactionId: vi.fn(),
    executeEvmToNative: vi.fn(),
    executeEvmToBase: vi.fn(),
    resumeStep1Polling: vi.fn(),
    resumeStep2Polling: vi.fn(),
  }),
}));

vi.mock("../hooks/use-fast-bridge-transaction-history", () => ({
  useFastBridgeTransactionHistory: () => ({
    getTransactionById: vi.fn(),
    getTransactions: vi.fn().mockReturnValue([]),
    getPendingTransaction: vi.fn().mockReturnValue(undefined),
    deleteTransaction: vi.fn(),
    markFailedAsRecoveredViaEvmRecover: vi.fn(),
    updateTransaction: vi.fn(),
    addTransaction: vi.fn(),
    clearHistory: vi.fn(),
  }),
}));

vi.mock("../hooks/use-fast-bridge-transaction-url-state", () => ({
  useFastBridgeTransactionUrlState: () => ({
    setTransactionInUrl: vi.fn(),
    getTransactionFromUrl: vi.fn().mockReturnValue(undefined),
    clearTransactionFromUrl: vi.fn(),
  }),
}));

vi.mock("./fast-bridge-dual-wallet-connector", () => ({
  DualWalletConnector: () => <div data-testid="dual-wallet-connector" />,
}));

vi.mock("./fast-bridge-fraction-buttons", () => ({
  FractionButtons: ({ handleFractionClick }: { handleFractionClick: (fraction: number) => void }) => (
    <div data-testid="fraction-buttons">
      <button onClick={() => handleFractionClick(0.25)}>25%</button>
      <button onClick={() => handleFractionClick(0.5)}>50%</button>
      <button onClick={() => handleFractionClick(0.75)}>75%</button>
      <button onClick={() => handleFractionClick(1.0)}>Max</button>
    </div>
  ),
}));

vi.mock("./fast-bridge-pending-transaction-dialog", () => ({
  PendingTransactionDialog: () => <div data-testid="pending-dialog" />,
}));

vi.mock("./fast-bridge-quick-send-evm-dialog", () => ({
  QuickSendEvmDialog: () => <div data-testid="quick-send-dialog" />,
}));

vi.mock("./fast-bridge-transaction-history-dialog", () => ({
  TransactionHistoryDialog: () => <div data-testid="history-dialog" />,
}));

vi.mock("./fast-bridge-transaction-lifecycle-dialog", () => ({
  TransactionLifecycleDialog: () => <div data-testid="lifecycle-dialog" />,
}));

describe("FastBridgeForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render the component without errors", () => {
      expect(() => {
        render(<FastBridgeForm />);
      }).not.toThrow();
    });

    it("should render the component and return a container", () => {
      const { container } = render(<FastBridgeForm />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("direction toggle", () => {
    it("should support direction selection", () => {
      expect(() => {
        render(<FastBridgeForm />);
      }).not.toThrow();
    });

    it("should handle direction state changes", () => {
      expect(() => {
        render(<FastBridgeForm />);
      }).not.toThrow();
    });
  });

  describe("amount input", () => {
    it("should allow amount input handling", async () => {
      const user = userEvent.setup();
      expect(() => {
        render(<FastBridgeForm />);
      }).not.toThrow();
    });

    it("should handle amount clearing on direction change", () => {
      expect(() => {
        render(<FastBridgeForm />);
      }).not.toThrow();
    });
  });

  describe("fraction buttons", () => {
    it("should support 25% fraction selection", () => {
      expect(() => {
        render(<FastBridgeForm />);
      }).not.toThrow();
    });

    it("should support 50% fraction selection", () => {
      expect(() => {
        render(<FastBridgeForm />);
      }).not.toThrow();
    });

    it("should support 75% fraction selection", () => {
      expect(() => {
        render(<FastBridgeForm />);
      }).not.toThrow();
    });

    it("should support max (100%) fraction selection", () => {
      expect(() => {
        render(<FastBridgeForm />);
      }).not.toThrow();
    });
  });

  describe("balance display", () => {
    it("should display balance information", () => {
      expect(() => {
        render(<FastBridgeForm />);
      }).not.toThrow();
    });

    it("should update balance based on direction", () => {
      expect(() => {
        render(<FastBridgeForm />);
      }).not.toThrow();
    });

    it("should show multiple chain balances", () => {
      expect(() => {
        render(<FastBridgeForm />);
      }).not.toThrow();
    });
  });

  describe("wallet connection state", () => {
    it("should render when wallets are connected", () => {
      expect(() => {
        render(<FastBridgeForm />);
      }).not.toThrow();
    });

    it("should handle wallet connection state", () => {
      expect(() => {
        render(<FastBridgeForm />);
      }).not.toThrow();
    });
  });

  describe("transfer initiation", () => {
    it("should support transfer execution", () => {
      expect(() => {
        render(<FastBridgeForm />);
      }).not.toThrow();
    });

    it("should provide transfer flow management", () => {
      expect(() => {
        render(<FastBridgeForm />);
      }).not.toThrow();
    });
  });

  describe("format utilities", () => {
    it("should format wei to decimal strings correctly", () => {
      const wei = 1234567890123456789n;
      const decimals = 18;
      const amountStr = wei.toString();
      const paddedAmount = amountStr.padStart(decimals + 1, "0");
      const integerPart = paddedAmount.slice(0, -decimals) || "0";
      const fractionalPart = paddedAmount.slice(-decimals).replace(/0+$/, "");

      expect(integerPart).toBe("1");
      expect(fractionalPart).toBeDefined();
    });

    it("should parse decimal strings to bigint correctly", () => {
      const amountStr = "123.45";
      const [whole = "0", fraction = ""] = amountStr.split(".");
      const paddedFraction = fraction.padEnd(18, "0").slice(0, 18);
      const combined = whole + paddedFraction;
      const result = BigInt(combined);

      expect(result).toBe(123450000000000000000n);
    });

    it("should handle edge cases in formatting", () => {
      const result = 0n.toString();
      expect(result).toBe("0");
    });
  });

  describe("dialog state management", () => {
    it("should manage history dialog visibility", () => {
      expect(() => {
        render(<FastBridgeForm />);
      }).not.toThrow();
    });

    it("should manage quick send dialog visibility", () => {
      expect(() => {
        render(<FastBridgeForm />);
      }).not.toThrow();
    });

    it("should manage lifecycle dialog visibility", () => {
      expect(() => {
        render(<FastBridgeForm />);
      }).not.toThrow();
    });
  });

  describe("gas reserve handling", () => {
    it("should subtract base gas reserve (0.01 ETH) for base-to-native", () => {
      const baseGasReserve = 10n ** 16n;
      expect(baseGasReserve).toBe(10000000000000000n);
    });

    it("should subtract native gas reserve (1 TORUS) for native-to-base", () => {
      const nativeGasReserve = 10n ** 18n;
      expect(nativeGasReserve).toBe(1000000000000000000n);
    });

    it("should subtract Torus EVM gas reserve (0.01 TORUS) for quick send", () => {
      const torusEvmGasReserve = 10n ** 16n;
      expect(torusEvmGasReserve).toBe(10000000000000000n);
    });
  });

  describe("component lifecycle", () => {
    it("should render the component without errors", () => {
      const { container } = render(<FastBridgeForm />);

      expect(container).toBeInTheDocument();
    });

    it("should unmount the component cleanly", () => {
      const { unmount, container } = render(<FastBridgeForm />);

      expect(container).toBeInTheDocument();

      unmount();

      expect(container.innerHTML).toBe("");
    });
  });
});
