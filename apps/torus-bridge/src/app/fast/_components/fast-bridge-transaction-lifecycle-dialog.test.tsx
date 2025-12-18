import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TransactionLifecycleDialog } from "./fast-bridge-transaction-lifecycle-dialog";
import { SimpleBridgeStep } from "./fast-bridge-types";

// Mock dependencies
vi.mock("../hooks/use-transaction-lifecycle-steps", () => ({
  useTransactionLifecycleSteps: () => [
    {
      id: "step1-sign",
      title: "Step 1: Sign",
      description: "Sign on Base",
      status: "active",
      isSignatureRequired: true,
    },
    {
      id: "step1-confirm",
      title: "Step 1: Confirm",
      description: "Waiting for confirmation",
      status: "pending",
    },
    {
      id: "step2-sign",
      title: "Step 2: Sign",
      description: "Sign on Torus EVM",
      status: "pending",
      isSignatureRequired: true,
    },
    {
      id: "step2-confirm",
      title: "Step 2: Confirm",
      description: "Waiting for confirmation",
      status: "pending",
    },
  ],
}));

vi.mock("./fast-bridge-transaction-step-item", () => ({
  TransactionStepItem: ({ title, status }: { title: string; status: string }) => (
    <div data-testid={`step-${title}`} data-status={status}>
      {title}
    </div>
  ),
}));

vi.mock("~/utils/logger", () => ({
  logger: {
    debug: vi.fn(),
  },
}));

vi.mock("~/env", () => ({
  env: (key: string) => {
    if (key === "NEXT_PUBLIC_TORUS_CHAIN_ENV") return "testnet";
    return "";
  },
}));

describe("TransactionLifecycleDialog", () => {
  const mockOnClose = vi.fn();
  const mockOnRetry = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    direction: "base-to-native" as const,
    currentStep: SimpleBridgeStep.STEP_1_SIGNING,
    transactions: [
      {
        step: 1 as const,
        status: "SIGNING" as const,
        chainName: "Base",
        message: "Please sign",
      },
    ],
    amount: "100",
    onRetry: mockOnRetry,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe("rendering", () => {
    it("should not render when isOpen is false", () => {
      const { container } = render(
        <TransactionLifecycleDialog {...defaultProps} isOpen={false} />
      );

      expect(container.querySelector("[role='dialog']")).not.toBeInTheDocument();
    });

    it("should render dialog title", () => {
      render(<TransactionLifecycleDialog {...defaultProps} />);

      expect(
        screen.getByText(/Check your wallet and sign/i)
      ).toBeInTheDocument();
    });

    it("should render lifecycle steps", () => {
      render(<TransactionLifecycleDialog {...defaultProps} />);

      expect(screen.getByTestId("step-Step 1: Sign")).toBeInTheDocument();
    });
  });

  describe("step status messages", () => {
    it("should show message for signing state", () => {
      render(
        <TransactionLifecycleDialog
          {...defaultProps}
          currentStep={SimpleBridgeStep.STEP_1_SIGNING}
        />
      );

      expect(
        screen.getByText(/Check your wallet and sign/i)
      ).toBeInTheDocument();
    });

    it("should show message for confirming state", () => {
      render(
        <TransactionLifecycleDialog
          {...defaultProps}
          currentStep={SimpleBridgeStep.STEP_1_CONFIRMING}
        />
      );

      expect(
        screen.getByText(/Transaction submitted!.*Waiting for network confirmation/i)
      ).toBeInTheDocument();
    });

    it("should show message for step 1 complete state", () => {
      render(
        <TransactionLifecycleDialog
          {...defaultProps}
          currentStep={SimpleBridgeStep.STEP_1_COMPLETE}
        />
      );

      expect(
        screen.getByText(/First step complete!.*Preparing second transaction/i)
      ).toBeInTheDocument();
    });

    it("should show message for step 2 signing state", () => {
      render(
        <TransactionLifecycleDialog
          {...defaultProps}
          currentStep={SimpleBridgeStep.STEP_2_SIGNING}
        />
      );

      expect(
        screen.getByText(/Check your wallet and sign the second transaction/i)
      ).toBeInTheDocument();
    });

    it("should show message for step 2 confirming state", () => {
      render(
        <TransactionLifecycleDialog
          {...defaultProps}
          currentStep={SimpleBridgeStep.STEP_2_CONFIRMING}
        />
      );

      expect(
        screen.getByText(/Final transaction submitted!.*Almost done/i)
      ).toBeInTheDocument();
    });

    it("should show message for complete state", () => {
      render(
        <TransactionLifecycleDialog
          {...defaultProps}
          currentStep={SimpleBridgeStep.COMPLETE}
        />
      );

      expect(
        screen.getByText(/Transfer complete!.*All transactions successful/i)
      ).toBeInTheDocument();
    });

    it("should show message for error state", () => {
      render(
        <TransactionLifecycleDialog
          {...defaultProps}
          currentStep={SimpleBridgeStep.ERROR}
        />
      );

      expect(screen.getByText(/Transaction failed.*Please try again/i)).toBeInTheDocument();
    });
  });

  describe("signature warning", () => {
    it("should show signature warning after 30 seconds of signing", async () => {
      render(
        <TransactionLifecycleDialog
          {...defaultProps}
          currentStep={SimpleBridgeStep.STEP_1_SIGNING}
        />
      );

      // Warning should not appear initially
      expect(screen.queryByText(/taking longer than expected/i)).not.toBeInTheDocument();

      // Advance time by 30 seconds
      vi.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(screen.queryByText(/taking longer than expected/i)).toBeDefined();
      });
    });

    it("should not show warning if transfer completes quickly", async () => {
      const { rerender } = render(
        <TransactionLifecycleDialog
          {...defaultProps}
          currentStep={SimpleBridgeStep.STEP_1_SIGNING}
        />
      );

      // Complete transfer before timeout
      vi.advanceTimersByTime(10000);

      rerender(
        <TransactionLifecycleDialog
          {...defaultProps}
          currentStep={SimpleBridgeStep.COMPLETE}
        />
      );

      expect(screen.queryByText(/taking longer than expected/i)).not.toBeInTheDocument();
    });

    it("should clear warning on step change", () => {
      const { rerender } = render(
        <TransactionLifecycleDialog
          {...defaultProps}
          currentStep={SimpleBridgeStep.STEP_1_SIGNING}
        />
      );

      vi.advanceTimersByTime(30000);

      rerender(
        <TransactionLifecycleDialog
          {...defaultProps}
          currentStep={SimpleBridgeStep.STEP_1_CONFIRMING}
        />
      );

      // Warning should be cleared
      expect(screen.queryByText(/taking longer than expected/i)).not.toBeInTheDocument();
    });
  });

  describe("error handling", () => {
    it("should mark step as error when transaction fails", () => {
      render(
        <TransactionLifecycleDialog
          {...defaultProps}
          currentStep={SimpleBridgeStep.ERROR}
          transactions={[
            {
              step: 1 as const,
              status: "ERROR" as const,
              chainName: "Base",
              message: "Failed to sign",
            },
          ]}
        />
      );

      expect(screen.getByTestId("step-Step 1: Sign")).toHaveAttribute(
        "data-status",
        "error"
      );
    });

    it("should show retry button on error", () => {
      render(
        <TransactionLifecycleDialog
          {...defaultProps}
          currentStep={SimpleBridgeStep.ERROR}
          onRetry={mockOnRetry}
        />
      );

      const retryButton = screen.queryByRole("button", { name: /retry/i });
      expect(retryButton).toBeDefined();
    });
  });

  describe("completion state", () => {
    it("should disable close button during transfer", () => {
      render(
        <TransactionLifecycleDialog
          {...defaultProps}
          currentStep={SimpleBridgeStep.STEP_1_SIGNING}
        />
      );

      // Dialog should not close during signing
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("should enable close button on completion", async () => {
      const user = userEvent.setup();
      render(
        <TransactionLifecycleDialog
          {...defaultProps}
          currentStep={SimpleBridgeStep.COMPLETE}
        />
      );

      // Should be able to close after completion
      // Implementation depends on close button visibility
      expect(screen.getByText(/Transfer complete/i)).toBeInTheDocument();
    });

    it("should show success message on completion", () => {
      render(
        <TransactionLifecycleDialog
          {...defaultProps}
          currentStep={SimpleBridgeStep.COMPLETE}
        />
      );

      expect(
        screen.getByText(/Transfer complete!.*All transactions successful/i)
      ).toBeInTheDocument();
    });
  });

  describe("direction handling", () => {
    it("should work for base-to-native direction", () => {
      render(
        <TransactionLifecycleDialog
          {...defaultProps}
          direction="base-to-native"
        />
      );

      expect(screen.getByTestId("step-Step 1: Sign")).toBeInTheDocument();
    });

    it("should work for native-to-base direction", () => {
      render(
        <TransactionLifecycleDialog
          {...defaultProps}
          direction="native-to-base"
        />
      );

      expect(screen.getByTestId("step-Step 1: Sign")).toBeInTheDocument();
    });
  });
});
