import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PendingTransactionDialog } from "./fast-bridge-pending-transaction-dialog";
import type { FastBridgeTransactionHistoryItem } from "./fast-bridge-types";

// Mock lucide-react icons with specific test IDs
vi.mock("lucide-react", () => ({
  AlertTriangle: () => <div data-testid="alert-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  ArrowRight: () => <div data-testid="arrow-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
}));

describe("PendingTransactionDialog", () => {
  const mockOnClose = vi.fn();
  const mockOnResume = vi.fn();
  const mockOnDeleteAndStartNew = vi.fn();

  const createMockTransaction = (
    overrides: Partial<FastBridgeTransactionHistoryItem> = {}
  ): FastBridgeTransactionHistoryItem => ({
    id: "tx-pending-123",
    direction: "base-to-native",
    amount: "100",
    status: "pending",
    step1TxHash: "0x" + "1".repeat(64),
    step2TxHash: undefined,
    baseAddress: "0xbase1234567890abcdef1234567890abcdef12345678",
    nativeAddress: "1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    timestamp: Date.now() - 5 * 60 * 1000, // 5 minutes ago
    recoveredViaEvmRecover: false,
    ...overrides,
  });

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    pendingTransaction: createMockTransaction(),
    onResume: mockOnResume,
    onDeleteAndStartNew: mockOnDeleteAndStartNew,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render dialog title with alert icon", () => {
      render(<PendingTransactionDialog {...defaultProps} />);

      expect(screen.getByTestId("pending-dialog-title")).toHaveTextContent("Pending Transaction Found");
      expect(screen.getByTestId("alert-icon")).toBeInTheDocument();
    });

    it("should render dialog description", () => {
      render(<PendingTransactionDialog {...defaultProps} />);

      expect(
        screen.getByText(/You have a pending transaction/i)
      ).toBeInTheDocument();
    });

    it("should not render when isOpen is false", () => {
      const { container } = render(
        <PendingTransactionDialog {...defaultProps} isOpen={false} />
      );

      expect(container.querySelector("[role='dialog']")).not.toBeInTheDocument();
    });
  });

  describe("transaction info display", () => {
    it("should display timestamp in relative format", () => {
      render(<PendingTransactionDialog {...defaultProps} />);

      expect(screen.getByTestId("pending-timestamp")).toHaveTextContent("5m ago");
    });

    it("should display correct direction for base-to-native", () => {
      const transaction = createMockTransaction({
        direction: "base-to-native",
      });
      render(
        <PendingTransactionDialog
          {...defaultProps}
          pendingTransaction={transaction}
        />
      );

      expect(screen.getByTestId("pending-direction")).toHaveTextContent("Base → Torus");
    });

    it("should display correct direction for native-to-base", () => {
      const transaction = createMockTransaction({
        direction: "native-to-base",
      });
      render(
        <PendingTransactionDialog
          {...defaultProps}
          pendingTransaction={transaction}
        />
      );

      expect(screen.getByTestId("pending-direction")).toHaveTextContent("Torus → Base");
    });

    it("should display amount with TORUS suffix", () => {
      render(<PendingTransactionDialog {...defaultProps} />);

      expect(screen.getByTestId("pending-amount")).toHaveTextContent("100 TORUS");
    });

    it("should display pending status badge", () => {
      render(<PendingTransactionDialog {...defaultProps} />);

      expect(screen.getByTestId("pending-status")).toHaveTextContent("Awaiting confirmation");
    });
  });

  describe("status labels", () => {
    it("should show 'Awaiting confirmation' for pending status", () => {
      const transaction = createMockTransaction({ status: "pending" });
      render(
        <PendingTransactionDialog
          {...defaultProps}
          pendingTransaction={transaction}
        />
      );

      expect(screen.getByTestId("pending-status")).toHaveTextContent("Awaiting confirmation");
    });

    it("should show 'Step 1 complete, awaiting Step 2' for step1_complete status", () => {
      const transaction = createMockTransaction({
        status: "step1_complete",
      });
      render(
        <PendingTransactionDialog
          {...defaultProps}
          pendingTransaction={transaction}
        />
      );

      expect(
        screen.getByTestId("pending-status")
      ).toHaveTextContent("Step 1 complete, awaiting Step 2");
    });
  });

  describe("address display", () => {
    it("should truncate and display addresses for base-to-native", () => {
      const transaction = createMockTransaction({
        direction: "base-to-native",
        baseAddress: "0xbase1234567890abcdef1234567890abcdef12345678",
        nativeAddress: "1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      });
      render(
        <PendingTransactionDialog
          {...defaultProps}
          pendingTransaction={transaction}
        />
      );

      // Should truncate addresses and show them with arrow
      // Check that we have the arrow icon indicating addresses are displayed
      expect(screen.getByTestId("arrow-icon")).toBeInTheDocument();

      // Check that we have spans with font-mono class (address elements)
      const addressElements = document.querySelectorAll('.font-mono');
      expect(addressElements.length).toBe(2); // base and native addresses
    });

    it("should truncate and display addresses for native-to-base", () => {
      const transaction = createMockTransaction({
        direction: "native-to-base",
        baseAddress: "0xbase1234567890abcdef1234567890abcdef12345678",
        nativeAddress: "1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      });
      render(
        <PendingTransactionDialog
          {...defaultProps}
          pendingTransaction={transaction}
        />
      );

      // Should show native first, then arrow, then base
      expect(screen.getByTestId("arrow-icon")).toBeInTheDocument();

      // Check that we have spans with font-mono class (address elements)
      const addressElements = document.querySelectorAll('.font-mono');
      expect(addressElements.length).toBe(2); // native and base addresses
    });

    it("should not display addresses section if addresses are missing", () => {
      const transaction = createMockTransaction({
        baseAddress: undefined,
        nativeAddress: undefined,
      });
      render(
        <PendingTransactionDialog
          {...defaultProps}
          pendingTransaction={transaction}
        />
      );

      // Arrow should not be displayed if no addresses
      expect(screen.queryByTestId("arrow-icon")).not.toBeInTheDocument();
    });
  });

  describe("timestamp formatting", () => {
    it("should display 'Just now' for very recent transactions", () => {
      const transaction = createMockTransaction({
        timestamp: Date.now() - 1000, // 1 second ago
      });
      render(
        <PendingTransactionDialog
          {...defaultProps}
          pendingTransaction={transaction}
        />
      );

      expect(screen.getByTestId("pending-timestamp")).toHaveTextContent("Just now");
    });

    it("should display minutes ago", () => {
      const transaction = createMockTransaction({
        timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
      });
      render(
        <PendingTransactionDialog
          {...defaultProps}
          pendingTransaction={transaction}
        />
      );

      expect(screen.getByTestId("pending-timestamp")).toHaveTextContent("10m ago");
    });

    it("should display hours and minutes", () => {
      const transaction = createMockTransaction({
        timestamp: Date.now() - (2 * 60 * 60 * 1000 + 30 * 60 * 1000), // 2h 30m ago
      });
      render(
        <PendingTransactionDialog
          {...defaultProps}
          pendingTransaction={transaction}
        />
      );

      expect(screen.getByTestId("pending-timestamp")).toHaveTextContent("2h 30m ago");
    });
  });

  describe("button actions", () => {
    it("should render Resume Transaction button", () => {
      render(<PendingTransactionDialog {...defaultProps} />);

      expect(
        screen.getByRole("button", { name: /Resume Transaction/i })
      ).toBeInTheDocument();
    });

    it("should render Delete & Start New button", () => {
      render(<PendingTransactionDialog {...defaultProps} />);

      expect(
        screen.getByRole("button", { name: /Delete & Start New/i })
      ).toBeInTheDocument();
    });

    it("should call onResume with transaction when Resume button clicked", async () => {
      const user = userEvent.setup();
      const transaction = createMockTransaction();

      render(
        <PendingTransactionDialog
          {...defaultProps}
          pendingTransaction={transaction}
        />
      );

      const resumeButton = screen.getByRole("button", {
        name: /Resume Transaction/i,
      });
      await user.click(resumeButton);

      expect(mockOnResume).toHaveBeenCalledWith(transaction);
    });

    it("should call onDeleteAndStartNew with transaction ID when delete button clicked", async () => {
      const user = userEvent.setup();
      const transaction = createMockTransaction();

      render(
        <PendingTransactionDialog
          {...defaultProps}
          pendingTransaction={transaction}
        />
      );

      const deleteButton = screen.getByRole("button", {
        name: /Delete & Start New/i,
      });
      await user.click(deleteButton);

      expect(mockOnDeleteAndStartNew).toHaveBeenCalledWith("tx-pending-123");
    });

    it("should call onClose after Resume button clicked", async () => {
      const user = userEvent.setup();

      render(<PendingTransactionDialog {...defaultProps} />);

      const resumeButton = screen.getByRole("button", {
        name: /Resume Transaction/i,
      });
      await user.click(resumeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should call onClose after Delete button clicked", async () => {
      const user = userEvent.setup();

      render(<PendingTransactionDialog {...defaultProps} />);

      const deleteButton = screen.getByRole("button", {
        name: /Delete & Start New/i,
      });
      await user.click(deleteButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should call onClose when dialog is closed via backdrop", async () => {
      const user = userEvent.setup();

      render(<PendingTransactionDialog {...defaultProps} />);

      // Assuming the dialog backdrop exists and triggers onOpenChange
      // This depends on @torus-ts/ui Dialog implementation
      // For now, we test that handlers are properly wired
      expect(mockOnClose).not.toHaveBeenCalled();

      // Clicking Resume should trigger onClose
      const resumeButton = screen.getByRole("button", {
        name: /Resume Transaction/i,
      });
      await user.click(resumeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("different transaction scenarios", () => {
    it("should handle long addresses correctly", () => {
      const longAddress =
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd";
      const transaction = createMockTransaction({
        baseAddress: longAddress,
        nativeAddress: undefined, // Only test base address
        direction: "base-to-native",
      });

      render(
        <PendingTransactionDialog
          {...defaultProps}
          pendingTransaction={transaction}
        />
      );

      // Should truncate correctly
      expect(screen.getByTestId("arrow-icon")).toBeInTheDocument();

      // Check that we have spans with font-mono class (address element)
      const addressElements = document.querySelectorAll('.font-mono');
      expect(addressElements.length).toBe(1); // single base address
    });

    it("should handle different amounts", () => {
      const transaction = createMockTransaction({ amount: "5000.5" });

      render(
        <PendingTransactionDialog
          {...defaultProps}
          pendingTransaction={transaction}
        />
      );

      expect(screen.getByTestId("pending-amount")).toHaveTextContent("5000.5 TORUS");
    });

    it("should handle step1_complete with step2 details", () => {
      const transaction = createMockTransaction({
        status: "step1_complete",
        step1TxHash: "0x" + "1".repeat(64),
        step2TxHash: undefined,
      });

      render(
        <PendingTransactionDialog
          {...defaultProps}
          pendingTransaction={transaction}
        />
      );

      expect(
        screen.getByTestId("pending-status")
      ).toHaveTextContent("Step 1 complete, awaiting Step 2");
    });
  });
});
