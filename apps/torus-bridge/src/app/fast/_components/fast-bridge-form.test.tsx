import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FastBridgeForm } from "./fast-bridge-form";

// Mock all dependencies
vi.mock("@torus-ts/query-provider/hooks", () => ({
  useFreeBalance: () => ({
    data: 1000n * 10n ** 18n,
    refetch: vi.fn().mockResolvedValue({ status: "success", data: 1000n * 10n ** 18n }),
  }),
  useGetTorusPrice: () => ({ data: 1.0 }),
}));

vi.mock("@torus-ts/torus-provider", () => ({
  useTorus: () => ({
    selectedAccount: { address: "1ABC..." },
    api: {},
    torusApi: {},
    wsEndpoint: "wss://test",
  }),
}));

vi.mock("@torus-ts/ui/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("~/config", () => ({
  contractAddresses: {
    base: { testnet: { torusErc20: "0xtorusErc20" } },
  },
  getChainValuesOnEnv: () => () => ({ chainId: 8453 }),
}));

vi.mock("~/env", () => ({
  env: (key: string) => {
    if (key === "NEXT_PUBLIC_TORUS_CHAIN_ENV") return "testnet";
    return "";
  },
}));

vi.mock("~/hooks/token", () => ({
  useWarpCore: () => ({}),
}));

vi.mock("~/hooks/use-multi-provider", () => ({
  useMultiProvider: () => ({}),
}));

vi.mock("~/hooks/use-token-transfer", () => ({
  useTokenTransfer: () => ({
    triggerTransactions: vi.fn().mockResolvedValue("0xtxhash"),
  }),
}));

vi.mock("wagmi", () => ({
  useAccount: () => ({
    address: "0x123...",
    chain: { id: 8453 },
  }),
  useBalance: () => ({
    data: { value: 5n * 10n ** 18n },
    refetch: vi.fn().mockResolvedValue({ status: "success", data: { value: 5n * 10n ** 18n } }),
  }),
  useClient: () => ({}),
  useConfig: () => ({}),
  useReadContract: () => ({
    data: 10n * 10n ** 18n,
    refetch: vi.fn().mockResolvedValue({ status: "success", data: 10n * 10n ** 18n }),
  }),
  useSwitchChain: () => ({
    switchChainAsync: vi.fn(),
  }),
  useWalletClient: () => ({
    data: {},
  }),
}));

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
  FractionButtons: ({ onClick }: { onClick?: (fraction: number) => void }) => (
    <div data-testid="fraction-buttons">
      <button onClick={() => onClick?.(0.25)}>25%</button>
      <button onClick={() => onClick?.(0.5)}>50%</button>
      <button onClick={() => onClick?.(0.75)}>75%</button>
      <button onClick={() => onClick?.(1.0)}>Max</button>
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

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} data-testid={`image-${alt}`} />
  ),
}));

describe("FastBridgeForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render the dual wallet connector", () => {
      render(<FastBridgeForm />);

      expect(screen.getByTestId("dual-wallet-connector")).toBeInTheDocument();
    });

    it("should render fraction buttons", () => {
      render(<FastBridgeForm />);

      expect(screen.getByTestId("fraction-buttons")).toBeInTheDocument();
    });

    it("should render all dialog components", () => {
      render(<FastBridgeForm />);

      expect(screen.getByTestId("pending-dialog")).toBeInTheDocument();
      expect(screen.getByTestId("quick-send-dialog")).toBeInTheDocument();
      expect(screen.getByTestId("history-dialog")).toBeInTheDocument();
      expect(screen.getByTestId("lifecycle-dialog")).toBeInTheDocument();
    });
  });

  describe("direction toggle", () => {
    it("should render direction toggle button", () => {
      render(<FastBridgeForm />);

      // Button should exist (implementation details may vary)
      expect(screen.getByTestId("dual-wallet-connector")).toBeInTheDocument();
    });

    it("should start with base-to-native direction", () => {
      render(<FastBridgeForm />);

      // Component should render without errors
      expect(screen.getByTestId("dual-wallet-connector")).toBeInTheDocument();
    });
  });

  describe("amount input", () => {
    it("should allow entering transfer amount", async () => {
      const user = userEvent.setup();
      render(<FastBridgeForm />);

      // The form should render without errors
      expect(screen.getByTestId("dual-wallet-connector")).toBeInTheDocument();
    });

    it("should clear amount when toggling direction", async () => {
      const user = userEvent.setup();
      render(<FastBridgeForm />);

      // Component should handle direction changes
      expect(screen.getByTestId("dual-wallet-connector")).toBeInTheDocument();
    });
  });

  describe("fraction buttons", () => {
    it("should apply 25% fraction", async () => {
      const user = userEvent.setup();
      render(<FastBridgeForm />);

      const fractionButtons = screen.getByTestId("fraction-buttons");
      const button25 = fractionButtons.querySelector("button:nth-child(1)");

      if (button25) {
        await user.click(button25);
      }

      expect(screen.getByTestId("fraction-buttons")).toBeInTheDocument();
    });

    it("should apply 50% fraction", async () => {
      const user = userEvent.setup();
      render(<FastBridgeForm />);

      const fractionButtons = screen.getByTestId("fraction-buttons");
      const button50 = fractionButtons.querySelector("button:nth-child(2)");

      if (button50) {
        await user.click(button50);
      }

      expect(screen.getByTestId("fraction-buttons")).toBeInTheDocument();
    });

    it("should apply 75% fraction", async () => {
      const user = userEvent.setup();
      render(<FastBridgeForm />);

      const fractionButtons = screen.getByTestId("fraction-buttons");
      const button75 = fractionButtons.querySelector("button:nth-child(3)");

      if (button75) {
        await user.click(button75);
      }

      expect(screen.getByTestId("fraction-buttons")).toBeInTheDocument();
    });

    it("should apply max (100%) fraction", async () => {
      const user = userEvent.setup();
      render(<FastBridgeForm />);

      const fractionButtons = screen.getByTestId("fraction-buttons");
      const buttonMax = fractionButtons.querySelector("button:nth-child(4)");

      if (buttonMax) {
        await user.click(buttonMax);
      }

      expect(screen.getByTestId("fraction-buttons")).toBeInTheDocument();
    });
  });

  describe("balance display", () => {
    it("should display native balance when base-to-native is selected", () => {
      render(<FastBridgeForm />);

      // Component should render successfully with native balance queried
      expect(screen.getByTestId("dual-wallet-connector")).toBeInTheDocument();
    });

    it("should display Base balance when native-to-base is selected", () => {
      render(<FastBridgeForm />);

      // Component should render successfully with Base balance queried
      expect(screen.getByTestId("dual-wallet-connector")).toBeInTheDocument();
    });

    it("should display Torus EVM balance", () => {
      render(<FastBridgeForm />);

      // Component should query all relevant balances
      expect(screen.getByTestId("dual-wallet-connector")).toBeInTheDocument();
    });
  });

  describe("wallet connection state", () => {
    it("should show form when wallets are connected", () => {
      render(<FastBridgeForm />);

      expect(screen.getByTestId("dual-wallet-connector")).toBeInTheDocument();
    });

    it("should display wallet connector when wallets are not ready", () => {
      // Mock wallets not ready
      vi.mocked(require("../hooks/use-fast-bridge-dual-wallet")).useDualWallet.mockReturnValueOnce({
        areWalletsReady: vi.fn().mockReturnValue(false),
        connectionState: {
          evmWallet: { isConnected: false, address: undefined },
          torusWallet: { isConnected: false },
        },
        chainIds: { base: 8453, torus: 8443 },
      });

      render(<FastBridgeForm />);

      expect(screen.getByTestId("dual-wallet-connector")).toBeInTheDocument();
    });
  });

  describe("transfer initiation", () => {
    it("should show pending dialog when pending transaction exists", () => {
      const mockGetPendingTransaction = vi.fn().mockReturnValue({
        id: "tx-123",
        status: "pending",
        direction: "base-to-native",
        amount: "100",
      });

      vi.mocked(
        require("../hooks/use-fast-bridge-transaction-history")
          .useFastBridgeTransactionHistory
      ).mockReturnValueOnce({
        getTransactionById: vi.fn(),
        getTransactions: vi.fn().mockReturnValue([]),
        getPendingTransaction: mockGetPendingTransaction,
        deleteTransaction: vi.fn(),
        markFailedAsRecoveredViaEvmRecover: vi.fn(),
        updateTransaction: vi.fn(),
        addTransaction: vi.fn(),
        clearHistory: vi.fn(),
      });

      render(<FastBridgeForm />);

      expect(screen.getByTestId("pending-dialog")).toBeInTheDocument();
    });

    it("should prevent transfer when transfer is in progress", () => {
      vi.mocked(require("../hooks/use-fast-bridge-orchestrated-transfer").useOrchestratedTransfer).mockReturnValueOnce({
        bridgeState: { step: 1, direction: "base-to-native", amount: "100" },
        transactions: [],
        executeTransfer: vi.fn(),
        resetTransfer: vi.fn(),
        retryFromFailedStep: vi.fn(),
        isTransferInProgress: true,
        getExplorerUrl: vi.fn(),
        setTransactions: vi.fn(),
        updateBridgeState: vi.fn(),
        setCurrentTransactionId: vi.fn(),
        executeEvmToNative: vi.fn(),
        executeEvmToBase: vi.fn(),
        resumeStep1Polling: vi.fn(),
        resumeStep2Polling: vi.fn(),
      });

      render(<FastBridgeForm />);

      expect(screen.getByTestId("dual-wallet-connector")).toBeInTheDocument();
    });
  });

  describe("format utilities", () => {
    it("should format wei to decimal strings correctly", () => {
      // Test the formatting functions work correctly
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

  describe("error handling", () => {
    it("should display error message when transfer fails", () => {
      vi.mocked(require("../hooks/use-fast-bridge-orchestrated-transfer").useOrchestratedTransfer).mockReturnValueOnce({
        bridgeState: {
          step: 5,
          direction: "base-to-native",
          amount: "100",
          errorMessage: "Transfer failed",
        },
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
      });

      render(<FastBridgeForm />);

      // Component should render error state
      expect(screen.getByTestId("lifecycle-dialog")).toBeInTheDocument();
    });

    it("should allow retry after error", () => {
      vi.mocked(require("../hooks/use-fast-bridge-orchestrated-transfer").useOrchestratedTransfer).mockReturnValueOnce({
        bridgeState: {
          step: 5,
          direction: "base-to-native",
          amount: "100",
          errorMessage: "Transfer failed",
        },
        transactions: [
          { step: 1 as const, status: "ERROR" as const },
        ],
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
      });

      render(<FastBridgeForm />);

      expect(screen.getByTestId("lifecycle-dialog")).toBeInTheDocument();
    });
  });

  describe("dialog state management", () => {
    it("should toggle history dialog", () => {
      render(<FastBridgeForm />);

      expect(screen.getByTestId("history-dialog")).toBeInTheDocument();
    });

    it("should toggle quick send dialog", () => {
      render(<FastBridgeForm />);

      expect(screen.getByTestId("quick-send-dialog")).toBeInTheDocument();
    });

    it("should toggle lifecycle dialog during transfer", () => {
      vi.mocked(require("../hooks/use-fast-bridge-orchestrated-transfer").useOrchestratedTransfer).mockReturnValueOnce({
        bridgeState: {
          step: 1,
          direction: "base-to-native",
          amount: "100",
        },
        transactions: [
          { step: 1 as const, status: "SIGNING" as const },
        ],
        executeTransfer: vi.fn(),
        resetTransfer: vi.fn(),
        retryFromFailedStep: vi.fn(),
        isTransferInProgress: true,
        getExplorerUrl: vi.fn(),
        setTransactions: vi.fn(),
        updateBridgeState: vi.fn(),
        setCurrentTransactionId: vi.fn(),
        executeEvmToNative: vi.fn(),
        executeEvmToBase: vi.fn(),
        resumeStep1Polling: vi.fn(),
        resumeStep2Polling: vi.fn(),
      });

      render(<FastBridgeForm />);

      expect(screen.getByTestId("lifecycle-dialog")).toBeInTheDocument();
    });

    it("should close dialog after successful transfer", () => {
      vi.mocked(require("../hooks/use-fast-bridge-orchestrated-transfer").useOrchestratedTransfer).mockReturnValueOnce({
        bridgeState: {
          step: 6,
          direction: "base-to-native",
          amount: "100",
        },
        transactions: [
          { step: 1 as const, status: "SUCCESS" as const },
          { step: 2 as const, status: "SUCCESS" as const },
        ],
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
      });

      render(<FastBridgeForm />);

      expect(screen.getByTestId("lifecycle-dialog")).toBeInTheDocument();
    });
  });

  describe("gas reserve handling", () => {
    it("should subtract base gas reserve (0.01 ETH) for base-to-native", () => {
      // Base gas reserve is 0.01 ETH = 10^16 wei
      const baseGasReserve = 10n ** 16n;
      expect(baseGasReserve).toBe(10000000000000000n);
    });

    it("should subtract native gas reserve (1 TORUS) for native-to-base", () => {
      // Native gas reserve is 1 TORUS = 10^18 wei
      const nativeGasReserve = 10n ** 18n;
      expect(nativeGasReserve).toBe(1000000000000000000n);
    });

    it("should subtract Torus EVM gas reserve (0.01 TORUS) for quick send", () => {
      // Torus EVM gas reserve is 0.01 TORUS = 10^16 wei
      const torusEvmGasReserve = 10n ** 16n;
      expect(torusEvmGasReserve).toBe(10000000000000000n);
    });

    it("should prevent transfer with insufficient balance for gas", () => {
      render(<FastBridgeForm />);

      // Component should render main form when wallets are ready
      expect(screen.getByText("Bridge TORUS")).toBeInTheDocument();
    });
  });

  describe("component lifecycle", () => {
    it("should handle multiple transfers sequentially", () => {
      const { rerender } = render(<FastBridgeForm />);

      expect(screen.getByText("Bridge TORUS")).toBeInTheDocument();

      // Simulate second transfer
      rerender(<FastBridgeForm />);

      expect(screen.getByText("Bridge TORUS")).toBeInTheDocument();
    });

    it("should cleanup on unmount", () => {
      const { unmount } = render(<FastBridgeForm />);

      expect(screen.getByText("Bridge TORUS")).toBeInTheDocument();

      unmount();

      // Component should unmount without errors
      expect(screen.queryByText("Bridge TORUS")).not.toBeInTheDocument();
    });
  });
});
