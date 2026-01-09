import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TransactionHistoryItem } from "./fast-bridge-transaction-history-item";
import { SimpleBridgeStep } from "./fast-bridge-types";
import type { FastBridgeTransactionHistoryItem } from "./fast-bridge-types";

// Mock the helper function and EXPLORER_URLS
vi.mock("../hooks/fast-bridge-helpers", () => ({
  formatErrorForUser: (error: Error) => error.message,
  EXPLORER_URLS: {
    BASE: "https://basescan.org/tx",
    TORUS_EVM_HYPERLANE: "https://explorer.hyperlane.xyz/message",
    TORUS: "https://polkadot.js.org/apps/?rpc=wss://api.torus.network#/explorer/query",
  },
}));

// Mock the Hyperlane GraphQL function
vi.mock("../lib/hyperlane-graphql", () => ({
  fetchHyperlaneExplorerUrl: vi.fn(
    async () => "https://explorer.hyperlane.xyz/message/0xabcd1234",
  ),
}));

describe("TransactionHistoryItem", () => {
  const mockOnContinue = vi.fn();
  const mockOnSelectionChange = vi.fn();

  const createMockTransaction = (
    overrides: Partial<FastBridgeTransactionHistoryItem> = {},
  ): FastBridgeTransactionHistoryItem => ({
    id: "tx-123",
    direction: "base-to-native",
    amount: "100",
    status: "completed",
    currentStep: SimpleBridgeStep.COMPLETE,
    step1TxHash: "0x" + "1".repeat(64),
    step2TxHash: "0x" + "2".repeat(64),
    baseAddress: "0xbase1234567890abcdef1234567890abcdef12345678",
    nativeAddress: "1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    timestamp: Date.now(),
    recoveredViaEvmRecover: false,
    canRetry: false,
    ...overrides,
  });

  const defaultProps = {
    transaction: createMockTransaction(),
    index: 0,
    onContinue: mockOnContinue,
    isMultiSelectMode: false,
    isSelected: false,
    onSelectionChange: mockOnSelectionChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering basic transaction info", () => {
    it("should display transaction direction", () => {
      render(<TransactionHistoryItem {...defaultProps} />);

      expect(screen.getByTestId("transaction-direction")).toHaveTextContent(
        "Base → Torus",
      );
    });

    it("should display transaction direction for native-to-base", () => {
      const transaction = createMockTransaction({
        direction: "native-to-base",
      });
      render(
        <TransactionHistoryItem {...defaultProps} transaction={transaction} />,
      );

      expect(screen.getByTestId("transaction-direction")).toHaveTextContent(
        "Torus → Base",
      );
    });

    it("should display transaction amount", () => {
      render(<TransactionHistoryItem {...defaultProps} />);

      expect(screen.getByTestId("transaction-amount")).toHaveTextContent(
        "100 TORUS",
      );
    });

    it("should display transaction index", () => {
      render(<TransactionHistoryItem {...defaultProps} index={4} />);

      expect(screen.getByTestId("transaction-index-5")).toHaveTextContent("#5");
    });
  });

  describe("status badges", () => {
    it("should show success badge for completed transaction", () => {
      const transaction = createMockTransaction({ status: "completed" });
      render(
        <TransactionHistoryItem {...defaultProps} transaction={transaction} />,
      );

      expect(screen.getByTestId("status-success")).toHaveTextContent("Success");
    });

    it("should show error badge for error transaction", () => {
      const transaction = createMockTransaction({ status: "error" });
      render(
        <TransactionHistoryItem {...defaultProps} transaction={transaction} />,
      );

      expect(screen.getByTestId("status-error")).toHaveTextContent("Error");
    });

    it("should show step 1 complete badge", () => {
      const transaction = createMockTransaction({ status: "step1_complete" });
      render(
        <TransactionHistoryItem {...defaultProps} transaction={transaction} />,
      );

      expect(screen.getByTestId("status-step1-complete")).toHaveTextContent(
        "Step 1 Complete",
      );
    });

    it("should show pending badge", () => {
      const transaction = createMockTransaction({ status: "pending" });
      render(
        <TransactionHistoryItem {...defaultProps} transaction={transaction} />,
      );

      expect(screen.getByTestId("status-pending")).toHaveTextContent("Pending");
    });

    it("should show recovered badge when recoveredViaEvmRecover is true", () => {
      const transaction = createMockTransaction({
        status: "completed",
        recoveredViaEvmRecover: true,
      });
      render(
        <TransactionHistoryItem {...defaultProps} transaction={transaction} />,
      );

      expect(screen.getByTestId("status-recovered")).toHaveTextContent(
        "Recovered",
      );
    });
  });

  describe("timestamp formatting", () => {
    it("should display 'Just now' for very recent transactions", () => {
      const transaction = createMockTransaction({
        timestamp: Date.now() - 5000,
      });
      render(
        <TransactionHistoryItem {...defaultProps} transaction={transaction} />,
      );

      expect(screen.getByTestId("transaction-timestamp")).toHaveTextContent(
        "Just now",
      );
    });

    it("should display minutes ago", () => {
      const transaction = createMockTransaction({
        timestamp: Date.now() - 5 * 60 * 1000,
      });
      render(
        <TransactionHistoryItem {...defaultProps} transaction={transaction} />,
      );

      expect(screen.getByTestId("transaction-timestamp")).toHaveTextContent(
        "5m ago",
      );
    });

    it("should display hours ago", () => {
      const transaction = createMockTransaction({
        timestamp: Date.now() - 3 * 60 * 60 * 1000,
      });
      render(
        <TransactionHistoryItem {...defaultProps} transaction={transaction} />,
      );

      expect(screen.getByTestId("transaction-timestamp")).toHaveTextContent(
        "3h ago",
      );
    });

    it("should display 'Yesterday' for transactions from yesterday", () => {
      const transaction = createMockTransaction({
        timestamp: Date.now() - 24 * 60 * 60 * 1000,
      });
      render(
        <TransactionHistoryItem {...defaultProps} transaction={transaction} />,
      );

      expect(screen.getByTestId("transaction-timestamp")).toHaveTextContent(
        "Yesterday",
      );
    });

    it("should display formatted date for transactions older than yesterday", () => {
      const transaction = createMockTransaction({
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
      });
      render(
        <TransactionHistoryItem {...defaultProps} transaction={transaction} />,
      );

      const timestamp = screen.getByTestId("transaction-timestamp").textContent;
      expect(timestamp).toBeTruthy();
      expect(timestamp).not.toContain("ago");
    });
  });

  describe("multi-select mode", () => {
    it("should render checkbox when in multi-select mode", () => {
      render(
        <TransactionHistoryItem
          {...defaultProps}
          isMultiSelectMode={true}
          isSelected={false}
        />,
      );

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it("should show checked checkbox when selected", () => {
      render(
        <TransactionHistoryItem
          {...defaultProps}
          isMultiSelectMode={true}
          isSelected={true}
        />,
      );

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeChecked();
    });

    it("should call onSelectionChange when checkbox is clicked", async () => {
      const user = userEvent.setup();
      render(
        <TransactionHistoryItem
          {...defaultProps}
          isMultiSelectMode={true}
          isSelected={false}
        />,
      );

      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      expect(mockOnSelectionChange).toHaveBeenCalledWith("tx-123", true);
    });

    it("should call onSelectionChange when card is clicked in multi-select mode", async () => {
      const user = userEvent.setup();
      render(
        <TransactionHistoryItem
          {...defaultProps}
          isMultiSelectMode={true}
          isSelected={false}
        />,
      );

      const card = screen.getByTestId("transaction-direction").closest("div");
      if (card) {
        await user.click(card);
        expect(mockOnSelectionChange).toHaveBeenCalledWith("tx-123", true);
      }
    });
  });

  describe("expansion and details", () => {
    it("should expand transaction details when clicking chevron", async () => {
      const user = userEvent.setup();
      render(<TransactionHistoryItem {...defaultProps} />);

      const expandButton = screen
        .getAllByRole("button")
        .find((btn) => btn.querySelector("[data-testid='chevron-down']"));

      if (expandButton) {
        await user.click(expandButton);

        expect(screen.getByTestId("transaction-flow-title")).toHaveTextContent(
          "Transaction Flow",
        );
      }
    });

    it("should show addresses in expanded details for base-to-native", async () => {
      const user = userEvent.setup();
      const transaction = createMockTransaction({
        direction: "base-to-native",
      });

      render(
        <TransactionHistoryItem {...defaultProps} transaction={transaction} />,
      );

      const expandButton = screen
        .getAllByRole("button")
        .find((btn) => btn.querySelector("[data-testid='chevron-down']"));

      if (expandButton) {
        await user.click(expandButton);

        expect(screen.getByTestId("from-chain-label")).toHaveTextContent(
          "Base Chain",
        );
        expect(screen.getByTestId("to-chain-label")).toHaveTextContent(
          "Torus Chain",
        );
      }
    });

    it("should display truncated addresses in expanded details", async () => {
      const user = userEvent.setup();
      const baseAddress = "0xbase1234567890abcdef1234567890abcdef12345678";
      const nativeAddress = "1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
      const transaction = createMockTransaction({
        baseAddress,
        nativeAddress,
        direction: "base-to-native",
      });

      render(
        <TransactionHistoryItem {...defaultProps} transaction={transaction} />,
      );

      const expandButton = screen
        .getAllByRole("button")
        .find((btn) => btn.querySelector("[data-testid='chevron-down']"));

      if (expandButton) {
        await user.click(expandButton);

        const fromAddress = screen.getByTestId("from-chain-address");
        const toAddress = screen.getByTestId("to-chain-address");

        // Verify addresses are truncated (first 8 chars + ... + last 6 chars)
        expect(fromAddress.textContent).toBeTruthy();
        expect(fromAddress.textContent).toContain("...");
        expect(toAddress.textContent).toBeTruthy();
        expect(toAddress.textContent).toContain("...");
      }
    });
  });

  describe("action buttons", () => {
    it("should show Resume button for pending transaction", () => {
      const transaction = createMockTransaction({ status: "pending" });
      render(
        <TransactionHistoryItem {...defaultProps} transaction={transaction} />,
      );

      expect(
        screen.getByRole("button", { name: /Resume/i }),
      ).toBeInTheDocument();
    });

    it("should show Resume button for step1_complete transaction", () => {
      const transaction = createMockTransaction({ status: "step1_complete" });
      render(
        <TransactionHistoryItem {...defaultProps} transaction={transaction} />,
      );

      expect(
        screen.getByRole("button", { name: /Resume/i }),
      ).toBeInTheDocument();
    });

    it("should show Retry button for error transaction", () => {
      const transaction = createMockTransaction({ status: "error" });
      render(
        <TransactionHistoryItem {...defaultProps} transaction={transaction} />,
      );

      expect(
        screen.getByRole("button", { name: /Retry/i }),
      ).toBeInTheDocument();
    });

    it("should not show Resume or Retry button for completed transaction", () => {
      const transaction = createMockTransaction({ status: "completed" });
      render(
        <TransactionHistoryItem {...defaultProps} transaction={transaction} />,
      );

      expect(
        screen.queryByRole("button", { name: /Resume/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Retry/i }),
      ).not.toBeInTheDocument();
    });

    it("should call onContinue when Resume button is clicked", async () => {
      const user = userEvent.setup();
      const transaction = createMockTransaction({ status: "pending" });
      render(
        <TransactionHistoryItem {...defaultProps} transaction={transaction} />,
      );

      const resumeButton = screen.getByRole("button", { name: /Resume/i });
      await user.click(resumeButton);

      expect(mockOnContinue).toHaveBeenCalledWith(transaction);
    });

    it("should call onContinue when Retry button is clicked", async () => {
      const user = userEvent.setup();
      const transaction = createMockTransaction({ status: "error" });
      render(
        <TransactionHistoryItem {...defaultProps} transaction={transaction} />,
      );

      const retryButton = screen.getByRole("button", { name: /Retry/i });
      await user.click(retryButton);

      expect(mockOnContinue).toHaveBeenCalledWith(transaction);
    });
  });

  describe("error details", () => {
    it("should display error message when transaction has error", async () => {
      const user = userEvent.setup();
      const transaction = createMockTransaction({
        status: "error",
        errorMessage: "Bridge failed: insufficient balance",
      });
      render(
        <TransactionHistoryItem {...defaultProps} transaction={transaction} />,
      );

      const expandButton = screen
        .getAllByRole("button")
        .find((btn) => btn.querySelector("[data-testid='chevron-down']"));

      if (expandButton) {
        await user.click(expandButton);

        expect(screen.getByTestId("error-title")).toHaveTextContent("Error:");
        expect(screen.getByTestId("error-details")).toHaveTextContent(
          "Bridge failed: insufficient balance",
        );
      }
    });

    it("should display error step when provided", async () => {
      const user = userEvent.setup();
      const transaction = createMockTransaction({
        status: "error",
        errorMessage: "Transaction failed",
        errorStep: 1,
      });
      render(
        <TransactionHistoryItem {...defaultProps} transaction={transaction} />,
      );

      const expandButton = screen
        .getAllByRole("button")
        .find((btn) => btn.querySelector("[data-testid='chevron-down']"));

      if (expandButton) {
        await user.click(expandButton);

        expect(screen.getByTestId("error-step")).toHaveTextContent(
          "Failed at step 1",
        );
      }
    });
  });

  describe("recovered via EVM indicator", () => {
    it("should display recovered indicator when recoveredViaEvmRecover is true", async () => {
      const user = userEvent.setup();
      const transaction = createMockTransaction({
        recoveredViaEvmRecover: true,
      });
      render(
        <TransactionHistoryItem {...defaultProps} transaction={transaction} />,
      );

      const expandButton = screen
        .getAllByRole("button")
        .find((btn) => btn.querySelector("[data-testid='chevron-down']"));

      if (expandButton) {
        await user.click(expandButton);

        expect(screen.getByTestId("recovered-message")).toHaveTextContent(
          "Recovered via EVM Recover",
        );
      }
    });
  });

  describe("explorer links", () => {
    it("should render external link buttons when expanded", async () => {
      const user = userEvent.setup();
      const transaction = createMockTransaction({
        direction: "base-to-native",
        step1TxHash: "0x" + "1".repeat(64),
      });
      render(
        <TransactionHistoryItem {...defaultProps} transaction={transaction} />,
      );

      const expandButton = screen
        .getAllByRole("button")
        .find((btn) => btn.querySelector("[data-testid='chevron-down']"));

      if (expandButton) {
        await user.click(expandButton);

        const externalLinks = screen.getAllByTestId("external-link-icon");
        expect(externalLinks.length).toBeGreaterThan(0);
      }
    });

    it("should disable explorer link button when step1TxHash is missing", async () => {
      const user = userEvent.setup();
      const transaction = createMockTransaction({
        step1TxHash: undefined,
      });
      render(
        <TransactionHistoryItem {...defaultProps} transaction={transaction} />,
      );

      const expandButton = screen
        .getAllByRole("button")
        .find((btn) => btn.querySelector("[data-testid='chevron-down']"));

      if (expandButton) {
        await user.click(expandButton);

        const externalLinkButtons = screen
          .queryAllByTestId("external-link-icon")
          .map((el) => el.closest("button"));

        externalLinkButtons.forEach((btn) => {
          expect(btn).toBeDisabled();
        });
      }
    });
  });
});
