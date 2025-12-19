import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFastBridgeTransactionHistory } from "../hooks/use-fast-bridge-transaction-history";
import { TransactionHistoryDialog } from "./fast-bridge-transaction-history-dialog";

// Mock the hook
vi.mock("../hooks/use-fast-bridge-transaction-history");

const mockUseFastBridgeTransactionHistory = vi.mocked(
  useFastBridgeTransactionHistory
);

// Mock the transaction history item component
vi.mock("./fast-bridge-transaction-history-item", () => ({
  TransactionHistoryItem: ({ transaction, isMultiSelectMode, onSelectionChange, isSelected }: any) => (
    <div data-testid={`transaction-item-${transaction.id}`} data-selected={isSelected}>
      <span>{transaction.id}</span>
      {isMultiSelectMode && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelectionChange(transaction.id, e.target.checked)}
          data-testid={`checkbox-${transaction.id}`}
        />
      )}
    </div>
  ),
}));

describe("TransactionHistoryDialog", () => {
  const mockClearHistory = vi.fn();
  const mockDeleteTransaction = vi.fn();
  const mockOnClose = vi.fn();
  const mockOnContinue = vi.fn();
  const mockGetExplorerUrl = vi.fn((hash, chain) => `https://explorer.com/${chain}/${hash}`);

  const createMockTransactions = (count: number = 1) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `tx-${i}`,
      direction: i % 2 === 0 ? "base-to-native" : "native-to-base",
      amount: `${100 + i}`,
      status: i % 3 === 0 ? "error" : "completed",
      step1TxHash: `0x${"1".repeat(64)}`,
      step2TxHash: `0x${"2".repeat(64)}`,
      baseAddress: "0xbase",
      nativeAddress: "native",
      timestamp: Date.now() - i * 1000,
      recoveredViaEvmRecover: false,
    }));
  };

  const setupMockHook = (transactions: any[]) => {
    mockUseFastBridgeTransactionHistory.mockImplementation(
      (selector: any) => {
        const state = {
          transactions,
          clearHistory: mockClearHistory,
          deleteTransaction: mockDeleteTransaction,
        };
        return selector(state);
      }
    );
  };

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onContinue: mockOnContinue,
    getExplorerUrl: mockGetExplorerUrl,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setupMockHook(createMockTransactions(3));
  });

  describe("rendering and basic state", () => {
    it("should render transaction history dialog when open", () => {
      render(<TransactionHistoryDialog {...defaultProps} />);

      expect(screen.getByText("Transaction History")).toBeInTheDocument();
      expect(
        screen.getByText("View and manage your Fast Bridge transaction history")
      ).toBeInTheDocument();
    });

    it("should render all transactions", () => {
      render(<TransactionHistoryDialog {...defaultProps} />);

      expect(screen.getByTestId("transaction-item-tx-0")).toBeInTheDocument();
      expect(screen.getByTestId("transaction-item-tx-1")).toBeInTheDocument();
      expect(screen.getByTestId("transaction-item-tx-2")).toBeInTheDocument();
    });

    it("should render close button", () => {
      render(<TransactionHistoryDialog {...defaultProps} />);

      // Get all Close buttons and check that at least one exists (the main dialog close button)
      const closeButtons = screen.getAllByRole("button", { name: "Close" });
      expect(closeButtons.length).toBeGreaterThan(0);
    });

    it("should call onClose when close button is clicked", async () => {
      const user = userEvent.setup();
      render(<TransactionHistoryDialog {...defaultProps} />);

      // Click the first Close button (main dialog close button)
      const closeButtons = screen.getAllByRole("button", { name: "Close" });
      await user.click(closeButtons[0]);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("filtering by transaction status", () => {
    it("should render all filter tab showing transaction count", () => {
      render(<TransactionHistoryDialog {...defaultProps} />);

      expect(screen.getByRole("tab", { name: /All \(3\)/ })).toBeInTheDocument();
    });

    it("should render completed filter tab with count", () => {
      render(<TransactionHistoryDialog {...defaultProps} />);

      expect(
        screen.getByRole("tab", { name: /Completed \(2\)/ })
      ).toBeInTheDocument();
    });

    it("should render failed filter tab with count", () => {
      render(<TransactionHistoryDialog {...defaultProps} />);

      expect(
        screen.getByRole("tab", { name: /Failed \(1\)/ })
      ).toBeInTheDocument();
    });

    it("should filter to completed transactions when clicking completed tab", async () => {
      const user = userEvent.setup();
      render(<TransactionHistoryDialog {...defaultProps} />);

      const completedTab = screen.getByRole("tab", { name: /Completed/ });
      await user.click(completedTab);

      // Should show only completed transactions (tx-1 and tx-2)
      expect(screen.getByTestId("transaction-item-tx-1")).toBeInTheDocument();
      expect(screen.getByTestId("transaction-item-tx-2")).toBeInTheDocument();
      expect(screen.queryByTestId("transaction-item-tx-0")).not.toBeInTheDocument();
    });

    it("should filter to failed transactions when clicking failed tab", async () => {
      const user = userEvent.setup();
      render(<TransactionHistoryDialog {...defaultProps} />);

      const failedTab = screen.getByRole("tab", { name: /Failed/ });
      await user.click(failedTab);

      // Should show only failed transaction (tx-0)
      expect(screen.getByTestId("transaction-item-tx-0")).toBeInTheDocument();
      expect(screen.queryByTestId("transaction-item-tx-1")).not.toBeInTheDocument();
      expect(screen.queryByTestId("transaction-item-tx-2")).not.toBeInTheDocument();
    });

    it("should show all transactions again when clicking all tab", async () => {
      const user = userEvent.setup();
      render(<TransactionHistoryDialog {...defaultProps} />);

      const completedTab = screen.getByRole("tab", { name: /Completed/ });
      await user.click(completedTab);

      const allTab = screen.getByRole("tab", { name: /All/ });
      await user.click(allTab);

      // Should show all transactions again
      expect(screen.getByTestId("transaction-item-tx-0")).toBeInTheDocument();
      expect(screen.getByTestId("transaction-item-tx-1")).toBeInTheDocument();
      expect(screen.getByTestId("transaction-item-tx-2")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("should show empty state message when no transactions exist", () => {
      setupMockHook([]);
      render(<TransactionHistoryDialog {...defaultProps} />);

      expect(screen.getByText("No transactions yet")).toBeInTheDocument();
    });

    it("should show empty state for completed filter when no completed transactions", async () => {
      const user = userEvent.setup();
      setupMockHook([{ ...createMockTransactions(1)[0], status: "error" }]);
      render(<TransactionHistoryDialog {...defaultProps} />);

      const completedTab = screen.getByRole("tab", { name: /Completed/ });
      await user.click(completedTab);

      expect(screen.getByText("No completed transactions")).toBeInTheDocument();
    });

    it("should show empty state for failed filter when no failed transactions", async () => {
      const user = userEvent.setup();
      setupMockHook([{ ...createMockTransactions(1)[0], status: "completed" }]);
      render(<TransactionHistoryDialog {...defaultProps} />);

      const failedTab = screen.getByRole("tab", { name: /Failed/ });
      await user.click(failedTab);

      expect(screen.getByText("No failed transactions")).toBeInTheDocument();
    });
  });

  describe("normal mode - delete actions", () => {
    it("should render Select button in normal mode", () => {
      render(<TransactionHistoryDialog {...defaultProps} />);

      expect(
        screen.getByRole("button", { name: /Select/i })
      ).toBeInTheDocument();
    });

    it("should render Delete All button in normal mode", () => {
      render(<TransactionHistoryDialog {...defaultProps} />);

      expect(
        screen.getByRole("button", { name: /Delete All/i })
      ).toBeInTheDocument();
    });

    it("should disable Select and Delete All buttons when no transactions", () => {
      setupMockHook([]);
      render(<TransactionHistoryDialog {...defaultProps} />);

      expect(
        screen.getByRole("button", { name: /Select/i })
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: /Delete All/i })
      ).toBeDisabled();
    });

    it("should show delete all confirmation dialog when Delete All is clicked", async () => {
      const user = userEvent.setup();
      render(<TransactionHistoryDialog {...defaultProps} />);

      const deleteAllButton = screen.getByRole("button", { name: /Delete All/i });
      await user.click(deleteAllButton);

      await waitFor(() => {
        expect(
          screen.getByText("Delete all transactions?")
        ).toBeInTheDocument();
      });
    });

    it("should confirm delete all when confirming", async () => {
      const user = userEvent.setup();
      render(<TransactionHistoryDialog {...defaultProps} />);

      const deleteAllButton = screen.getByRole("button", { name: /Delete All/i });
      await user.click(deleteAllButton);

      const confirmButton = await screen.findByRole("button", { name: /Delete All/i });
      await user.click(confirmButton);

      expect(mockClearHistory).toHaveBeenCalledTimes(1);
    });

    it("should cancel delete all when canceling", async () => {
      const user = userEvent.setup();
      render(<TransactionHistoryDialog {...defaultProps} />);

      const deleteAllButton = screen.getByRole("button", { name: /Delete All/i });
      await user.click(deleteAllButton);

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockClearHistory).not.toHaveBeenCalled();
      expect(screen.queryByText("Delete all transactions?")).not.toBeInTheDocument();
    });
  });

  describe("multi-select mode", () => {
    it("should enter multi-select mode when Select button is clicked", async () => {
      const user = userEvent.setup();
      render(<TransactionHistoryDialog {...defaultProps} />);

      const selectButton = screen.getByRole("button", { name: /Select/i });
      await user.click(selectButton);

      // Should show checkboxes for transactions
      expect(screen.getByTestId("checkbox-tx-0")).toBeInTheDocument();
      expect(screen.getByTestId("checkbox-tx-1")).toBeInTheDocument();
      expect(screen.getByTestId("checkbox-tx-2")).toBeInTheDocument();
    });

    it("should show Select All and Delete buttons in multi-select mode", async () => {
      const user = userEvent.setup();
      render(<TransactionHistoryDialog {...defaultProps} />);

      const selectButton = screen.getByRole("button", { name: /Select/i });
      await user.click(selectButton);

      expect(
        screen.getByRole("button", { name: /Select All/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Delete \(0\)/i })
      ).toBeInTheDocument();
    });

    it("should allow selecting individual transactions", async () => {
      const user = userEvent.setup();
      render(<TransactionHistoryDialog {...defaultProps} />);

      const selectButton = screen.getByRole("button", { name: /Select/i });
      await user.click(selectButton);

      const checkbox = screen.getByTestId("checkbox-tx-0");
      await user.click(checkbox);

      expect(
        screen.getByRole("button", { name: /Delete \(1\)/i })
      ).toBeInTheDocument();
    });

    it("should allow selecting all visible transactions", async () => {
      const user = userEvent.setup();
      render(<TransactionHistoryDialog {...defaultProps} />);

      const selectButton = screen.getByRole("button", { name: /Select/i });
      await user.click(selectButton);

      const selectAllButton = screen.getByRole("button", { name: /Select All/i });
      await user.click(selectAllButton);

      // All 3 transactions should be selected
      expect(screen.getByTestId("checkbox-tx-0")).toBeChecked();
      expect(screen.getByTestId("checkbox-tx-1")).toBeChecked();
      expect(screen.getByTestId("checkbox-tx-2")).toBeChecked();
    });

    it("should update delete count when selecting/deselecting transactions", async () => {
      const user = userEvent.setup();
      render(<TransactionHistoryDialog {...defaultProps} />);

      const selectButton = screen.getByRole("button", { name: /Select/i });
      await user.click(selectButton);

      await user.click(screen.getByTestId("checkbox-tx-0"));
      expect(
        screen.getByRole("button", { name: /Delete \(1\)/i })
      ).toBeInTheDocument();

      await user.click(screen.getByTestId("checkbox-tx-1"));
      expect(
        screen.getByRole("button", { name: /Delete \(2\)/i })
      ).toBeInTheDocument();

      await user.click(screen.getByTestId("checkbox-tx-0"));
      expect(
        screen.getByRole("button", { name: /Delete \(1\)/i })
      ).toBeInTheDocument();
    });

    it("should show bulk delete confirmation when Delete button is clicked", async () => {
      const user = userEvent.setup();
      render(<TransactionHistoryDialog {...defaultProps} />);

      const selectButton = screen.getByRole("button", { name: /Select/i });
      await user.click(selectButton);

      await user.click(screen.getByTestId("checkbox-tx-0"));
      await user.click(screen.getByTestId("checkbox-tx-1"));

      const deleteButton = screen.getByRole("button", { name: /Delete \(2\)/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(
          screen.getByText("Delete selected transactions?")
        ).toBeInTheDocument();
      });
    });

    it("should delete selected transactions when confirmed", async () => {
      const user = userEvent.setup();
      render(<TransactionHistoryDialog {...defaultProps} />);

      const selectButton = screen.getByRole("button", { name: /Select/i });
      await user.click(selectButton);

      await user.click(screen.getByTestId("checkbox-tx-0"));
      await user.click(screen.getByTestId("checkbox-tx-1"));

      const deleteButton = screen.getByRole("button", { name: /Delete \(2\)/i });
      await user.click(deleteButton);

      const confirmButton = await screen.findByRole("button", { name: /Delete Selected/i });
      await user.click(confirmButton);

      expect(mockDeleteTransaction).toHaveBeenCalledWith("tx-0");
      expect(mockDeleteTransaction).toHaveBeenCalledWith("tx-1");
      expect(mockDeleteTransaction).toHaveBeenCalledTimes(2);
    });

    it("should exit multi-select mode when Cancel button is clicked", async () => {
      const user = userEvent.setup();
      render(<TransactionHistoryDialog {...defaultProps} />);

      const selectButton = screen.getByRole("button", { name: /Select/i });
      await user.click(selectButton);

      expect(screen.getByTestId("checkbox-tx-0")).toBeInTheDocument();

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      await user.click(cancelButton);

      // Checkboxes should be gone
      expect(screen.queryByTestId("checkbox-tx-0")).not.toBeInTheDocument();
      // Back to normal mode
      expect(
        screen.getByRole("button", { name: /Select/i })
      ).toBeInTheDocument();
    });

    it("should clear selection when exiting multi-select mode", async () => {
      const user = userEvent.setup();
      render(<TransactionHistoryDialog {...defaultProps} />);

      const selectButton = screen.getByRole("button", { name: /Select/i });
      await user.click(selectButton);

      await user.click(screen.getByTestId("checkbox-tx-0"));
      expect(
        screen.getByRole("button", { name: /Delete \(1\)/i })
      ).toBeInTheDocument();

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      await user.click(cancelButton);

      // Re-enter multi-select mode
      await user.click(selectButton);

      // Delete count should be 0 (selection was cleared)
      expect(
        screen.getByRole("button", { name: /Delete \(0\)/i })
      ).toBeInTheDocument();
    });
  });

  describe("pagination with infinite scroll", () => {
    it("should show first batch of transactions", () => {
      setupMockHook(createMockTransactions(25));
      render(<TransactionHistoryDialog {...defaultProps} />);

      // First 10 should be visible
      for (let i = 0; i < 10; i++) {
        expect(screen.getByTestId(`transaction-item-tx-${i}`)).toBeInTheDocument();
      }

      // 11-25 should not be visible yet
      expect(screen.queryByTestId("transaction-item-tx-10")).not.toBeInTheDocument();
    });

    it("should reset pagination when changing filters", async () => {
      const user = userEvent.setup();
      const transactions = Array.from({ length: 20 }, (_, i) => ({
        ...createMockTransactions(1)[0],
        id: `tx-${i}`,
        status: i < 10 ? "completed" : "error",
      }));
      setupMockHook(transactions);

      render(<TransactionHistoryDialog {...defaultProps} />);

      const failedTab = screen.getByRole("tab", { name: /Failed/ });
      await user.click(failedTab);

      // Should show first 10 failed transactions
      expect(screen.getByTestId("transaction-item-tx-10")).toBeInTheDocument();
      expect(screen.queryByTestId("transaction-item-tx-20")).not.toBeInTheDocument();
    });
  });
});
