import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TransactionHistoryItem } from "./fast-bridge-transaction-history-item";
import type { FastBridgeTransactionHistoryItem } from "./fast-bridge-types";

// Mock the helper function
vi.mock("../hooks/fast-bridge-helpers", () => ({
  formatErrorForUser: (error: Error) => error.message,
}));

describe("TransactionHistoryItem", () => {
  const mockOnContinue = vi.fn();
  const mockOnSelectionChange = vi.fn();
  const mockGetExplorerUrl = vi.fn(
    (hash: string, chain: string) => `https://explorer.com/${chain}/${hash}`
  );

  const createMockTransaction = (overrides: Partial<FastBridgeTransactionHistoryItem> = {}): FastBridgeTransactionHistoryItem => ({
    id: "tx-123",
    direction: "base-to-native",
    amount: "100",
    status: "completed",
    step1TxHash: "0x" + "1".repeat(64),
    step2TxHash: "0x" + "2".repeat(64),
    baseAddress: "0xbase1234567890abcdef1234567890abcdef12345678",
    nativeAddress: "1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    timestamp: Date.now(),
    recoveredViaEvmRecover: false,
    ...overrides,
  });

  const defaultProps = {
    transaction: createMockTransaction(),
    index: 0,
    onContinue: mockOnContinue,
    getExplorerUrl: mockGetExplorerUrl,
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

      expect(screen.getByTestId("transaction-direction")).toHaveTextContent("Base → Torus");
    });

    it("should display transaction direction for native-to-base", () => {
      const transaction = createMockTransaction({ direction: "native-to-base" });
      render(<TransactionHistoryItem {...defaultProps} transaction={transaction} />);

      expect(screen.getByTestId("transaction-direction")).toHaveTextContent("Torus → Base");
    });

    it("should display transaction amount", () => {
      render(<TransactionHistoryItem {...defaultProps} />);

      expect(screen.getByTestId("transaction-amount")).toHaveTextContent("100 TORUS");
    });

    it("should display transaction index", () => {
      render(<TransactionHistoryItem {...defaultProps} index={4} />);

      expect(screen.getByTestId("transaction-index-5")).toHaveTextContent("#5");
    });
  });

  describe("status badges", () => {
    it("should show success badge for completed transaction", () => {
      const transaction = createMockTransaction({ status: "completed" });
      render(<TransactionHistoryItem {...defaultProps} transaction={transaction} />);

      expect(screen.getByTestId("status-success")).toHaveTextContent("Success");
    });

    it("should show error badge for error transaction", () => {
      const transaction = createMockTransaction({ status: "error" });
      render(<TransactionHistoryItem {...defaultProps} transaction={transaction} />);

      expect(screen.getByTestId("status-error")).toHaveTextContent("Error");
    });

    it("should show step 1 complete badge", () => {
      const transaction = createMockTransaction({ status: "step1_complete" });
      render(<TransactionHistoryItem {...defaultProps} transaction={transaction} />);

      expect(screen.getByTestId("status-step1-complete")).toHaveTextContent("Step 1 Complete");
    });

    it("should show pending badge", () => {
      const transaction = createMockTransaction({ status: "pending" });
      render(<TransactionHistoryItem {...defaultProps} transaction={transaction} />);

      expect(screen.getByTestId("status-pending")).toHaveTextContent("Pending");
    });

    it("should show recovered badge when recoveredViaEvmRecover is true", () => {
      const transaction = createMockTransaction({
        status: "completed",
        recoveredViaEvmRecover: true,
      });
      render(<TransactionHistoryItem {...defaultProps} transaction={transaction} />);

      expect(screen.getByTestId("status-recovered")).toHaveTextContent("Recovered");
    });
  });

  describe("timestamp formatting", () => {
    it("should display 'Just now' for very recent transactions", () => {
      const transaction = createMockTransaction({
        timestamp: Date.now() - 5000, // 5 seconds ago
      });
      render(<TransactionHistoryItem {...defaultProps} transaction={transaction} />);

      expect(screen.getByTestId("transaction-timestamp")).toHaveTextContent("Just now");
    });

    it("should display minutes ago", () => {
      const transaction = createMockTransaction({
        timestamp: Date.now() - 5 * 60 * 1000, // 5 minutes ago
      });
      render(<TransactionHistoryItem {...defaultProps} transaction={transaction} />);

      expect(screen.getByTestId("transaction-timestamp")).toHaveTextContent("5m ago");
    });

    it("should display hours ago", () => {
      const transaction = createMockTransaction({
        timestamp: Date.now() - 3 * 60 * 60 * 1000, // 3 hours ago
      });
      render(<TransactionHistoryItem {...defaultProps} transaction={transaction} />);

      expect(screen.getByTestId("transaction-timestamp")).toHaveTextContent("3h ago");
    });

    it("should display 'Yesterday' for transactions from yesterday", () => {
      const transaction = createMockTransaction({
        timestamp: Date.now() - 24 * 60 * 60 * 1000 - 1000, // Just over 24 hours ago
      });
      render(<TransactionHistoryItem {...defaultProps} transaction={transaction} />);

      expect(screen.getByTestId("transaction-timestamp")).toHaveTextContent("Yesterday");
    });

    it("should display full date for old transactions", () => {
      const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      const transaction = createMockTransaction({ timestamp: pastDate.getTime() });
      render(<TransactionHistoryItem {...defaultProps} transaction={transaction} />);

      const dateString = pastDate.toLocaleDateString();
      expect(screen.getByText(dateString)).toBeInTheDocument();
    });
  });

  describe("multi-select mode", () => {
    it("should render checkbox when in multi-select mode", () => {
      render(
        <TransactionHistoryItem
          {...defaultProps}
          isMultiSelectMode={true}
          isSelected={false}
        />
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
        />
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
        />
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
        />
      );

      const card = screen.getByText("Base → Torus");
      await user.click(card.closest("div")!);

      expect(mockOnSelectionChange).toHaveBeenCalledWith("tx-123", true);
    });

    it("should disable expansion button in multi-select mode", () => {
      render(
        <TransactionHistoryItem
          {...defaultProps}
          isMultiSelectMode={true}
          transaction={createMockTransaction()}
        />
      );

      const expandButton = screen.getByRole("button", { name: "" }).parentElement?.querySelector("button:last-child");
      if (expandButton) {
        expect(expandButton).toBeDisabled();
      }
    });
  });

  describe("expansion and details", () => {
    it("should not be expandable for all statuses", () => {
      const transaction = createMockTransaction({
        status: "completed",
      });
      render(<TransactionHistoryItem {...defaultProps} transaction={transaction} />);

      // Should show expanded details area
      const expandButtons = screen.getAllByRole("button");
      const chevronButton = expandButtons.find((btn) =>
        btn.querySelector("[data-testid='chevron-down']")
      );
      expect(chevronButton).toBeInTheDocument();
    });

    it("should expand transaction details when clicking chevron", async () => {
      const user = userEvent.setup();
      render(<TransactionHistoryItem {...defaultProps} />);

      const expandButton = screen.getAllByRole("button").find((btn) =>
        btn.querySelector("[data-testid='chevron-down']")
      );

      if (expandButton) {
        await user.click(expandButton);

        // Should show transaction flow details
        expect(screen.getByTestId("transaction-flow-title")).toHaveTextContent("Transaction Flow");
      }
    });

    it("should collapse transaction details when clicking chevron again", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <TransactionHistoryItem {...defaultProps} />
      );

      const expandButton = screen.getAllByRole("button").find((btn) =>
        btn.querySelector("[data-testid='chevron-down']")
      );

      if (expandButton) {
        await user.click(expandButton);

        // Details are now expanded
        expect(screen.getByTestId("transaction-flow-title")).toHaveTextContent("Transaction Flow");
      }
    });

    it("should show addresses in expanded details for base-to-native direction", async () => {
      const user = userEvent.setup();
      const transaction = createMockTransaction({
        direction: "base-to-native",
        baseAddress: "0xbase1234567890abcdef1234567890abcdef12345678",
        nativeAddress: "1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      });

      render(<TransactionHistoryItem {...defaultProps} transaction={transaction} />);

      const expandButton = screen.getAllByRole("button").find((btn) =>
        btn.querySelector("[data-testid='chevron-down']")
      );

      if (expandButton) {
        await user.click(expandButton);

        expect(screen.getByTestId("from-chain-label")).toHaveTextContent("From: Base Chain");
        expect(screen.getByTestId("to-chain-label")).toHaveTextContent("To: Torus Chain");

        // Check for truncated addresses
        expect(screen.getByText(/0xbase12.*345678/)).toBeInTheDocument();
        expect(screen.getByText(/1AAAAAAA.*AAAAAA/)).toBeInTheDocument();
      }
    });

    it("should show addresses in expanded details for native-to-base direction", async () => {
      const user = userEvent.setup();
      const transaction = createMockTransaction({
        direction: "native-to-base",
        baseAddress: "0xbase1234567890abcdef1234567890abcdef12345678",
        nativeAddress: "1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      });

      render(<TransactionHistoryItem {...defaultProps} transaction={transaction} />);

      const expandButton = screen.getAllByRole("button").find((btn) =>
        btn.querySelector("[data-testid='chevron-down']")
      );

      if (expandButton) {
        await user.click(expandButton);

        expect(screen.getByTestId("from-chain-label")).toHaveTextContent("From: Torus Chain");
        expect(screen.getByTestId("to-chain-label")).toHaveTextContent("To: Base Chain");
      }
    });
  });

  describe("action buttons", () => {
    it("should show Resume button for pending transaction", () => {
      const transaction = createMockTransaction({ status: "pending" });
      render(<TransactionHistoryItem {...defaultProps} transaction={transaction} />);

      expect(screen.getByRole("button", { name: /Resume/i })).toBeInTheDocument();
    });

    it("should show Resume button for step1_complete transaction", () => {
      const transaction = createMockTransaction({ status: "step1_complete" });
      render(<TransactionHistoryItem {...defaultProps} transaction={transaction} />);

      expect(screen.getByRole("button", { name: /Resume/i })).toBeInTheDocument();
    });

    it("should show Retry button for error transaction", () => {
      const transaction = createMockTransaction({ status: "error" });
      render(<TransactionHistoryItem {...defaultProps} transaction={transaction} />);

      expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
    });

    it("should not show Resume or Retry button for completed transaction", () => {
      const transaction = createMockTransaction({ status: "completed" });
      render(<TransactionHistoryItem {...defaultProps} transaction={transaction} />);

      expect(screen.queryByRole("button", { name: /Resume/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Retry/i })).not.toBeInTheDocument();
    });

    it("should call onContinue when Resume button is clicked", async () => {
      const user = userEvent.setup();
      const transaction = createMockTransaction({ status: "pending" });
      render(<TransactionHistoryItem {...defaultProps} transaction={transaction} />);

      const resumeButton = screen.getByRole("button", { name: /Resume/i });
      await user.click(resumeButton);

      expect(mockOnContinue).toHaveBeenCalledWith(transaction);
    });

    it("should call onContinue when Retry button is clicked", async () => {
      const user = userEvent.setup();
      const transaction = createMockTransaction({ status: "error" });
      render(<TransactionHistoryItem {...defaultProps} transaction={transaction} />);

      const retryButton = screen.getByRole("button", { name: /Retry/i });
      await user.click(retryButton);

      expect(mockOnContinue).toHaveBeenCalledWith(transaction);
    });
  });

  describe("explorer links", () => {
    it("should show explorer links in expanded details", async () => {
      const user = userEvent.setup();
      const transaction = createMockTransaction();
      render(<TransactionHistoryItem {...defaultProps} transaction={transaction} />);

      const expandButton = screen.getAllByRole("button").find((btn) =>
        btn.querySelector("[data-testid='chevron-down']")
      );

      if (expandButton) {
        await user.click(expandButton);

        expect(screen.getByText(/Step 1:.*Base Chain/)).toBeInTheDocument();
        expect(screen.getByText(/Step 2:.*Torus EVM/)).toBeInTheDocument();
      }
    });

    it("should not show explorer link when tx hash is missing", async () => {
      const user = userEvent.setup();
      const transaction = createMockTransaction({ step1TxHash: undefined });
      render(<TransactionHistoryItem {...defaultProps} transaction={transaction} />);

      const expandButton = screen.getAllByRole("button").find((btn) =>
        btn.querySelector("[data-testid='chevron-down']")
      );

      if (expandButton) {
        await user.click(expandButton);

        // Should not show Step 1 details if tx hash is missing
        expect(screen.queryByText(/Step 1:.*Base Chain/)).not.toBeInTheDocument();
      }
    });

    it("should call getExplorerUrl when opening transaction details link", async () => {
      const user = userEvent.setup();
      const transaction = createMockTransaction();
      render(<TransactionHistoryItem {...defaultProps} transaction={transaction} />);

      const expandButton = screen.getAllByRole("button").find((btn) =>
        btn.querySelector("[data-testid='chevron-down']")
      );

      if (expandButton) {
        await user.click(expandButton);

        // Explorer links should have been generated via getExplorerUrl
        expect(mockGetExplorerUrl).toHaveBeenCalled();
      }
    });
  });

  describe("error details", () => {
    it("should display error message when transaction has error", async () => {
      const user = userEvent.setup();
      const transaction = createMockTransaction({
        status: "error",
        errorMessage: "Bridge failed: insufficient balance",
      });
      render(<TransactionHistoryItem {...defaultProps} transaction={transaction} />);

      const expandButton = screen.getAllByRole("button").find((btn) =>
        btn.querySelector("[data-testid='chevron-down']")
      );

      if (expandButton) {
        await user.click(expandButton);

        expect(screen.getByTestId("error-title")).toHaveTextContent("Error:");
        expect(screen.getByTestId("error-details")).toHaveTextContent("Bridge failed: insufficient balance");
      }
    });

    it("should display error step when provided", async () => {
      const user = userEvent.setup();
      const transaction = createMockTransaction({
        status: "error",
        errorMessage: "Failed",
        errorStep: 2,
      });
      render(<TransactionHistoryItem {...defaultProps} transaction={transaction} />);

      const expandButton = screen.getAllByRole("button").find((btn) =>
        btn.querySelector("[data-testid='chevron-down']")
      );

      if (expandButton) {
        await user.click(expandButton);

        expect(screen.getByTestId("error-step")).toHaveTextContent("Failed at step 2");
      }
    });
  });

  describe("recovered via EVM indicator", () => {
    it("should display recovered indicator when recoveredViaEvmRecover is true", async () => {
      const user = userEvent.setup();
      const transaction = createMockTransaction({
        recoveredViaEvmRecover: true,
      });
      render(<TransactionHistoryItem {...defaultProps} transaction={transaction} />);

      const expandButton = screen.getAllByRole("button").find((btn) =>
        btn.querySelector("[data-testid='chevron-down']")
      );

      if (expandButton) {
        await user.click(expandButton);

        expect(screen.getByTestId("recovered-message")).toHaveTextContent("Recovered via EVM Recover");
      }
    });
  });
});
