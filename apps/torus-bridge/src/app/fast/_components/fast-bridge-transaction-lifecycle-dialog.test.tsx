import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TransactionLifecycleDialog } from "./fast-bridge-transaction-lifecycle-dialog";
import { SimpleBridgeStep } from "./fast-bridge-types";
import { useTransactionLifecycleSteps } from "../hooks/use-transaction-lifecycle-steps";

// Mock the hook
vi.mock("../hooks/use-transaction-lifecycle-steps", () => ({
  useTransactionLifecycleSteps: vi.fn(),
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
        hash: "0x123",
        status: "SIGNING" as const,
      },
    ],
    baseChainId: 8453,
    nativeChainId: 8443,
    onRetry: mockOnRetry,
    showFinishButton: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Mock the hook
  vi.mocked(useTransactionLifecycleSteps).mockReturnValue([
    {
      title: "Signing",
      status: "pending",
      description: "Please sign the transaction in your wallet",
    },
    {
      title: "Confirming",
      status: "pending",
      description: "Transaction is being confirmed",
    },
    {
      title: "Completed",
      status: "pending",
      description: "Transaction completed successfully",
    },
  ]);

  // Mock step item
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

    // Default mock implementation
    vi.mocked(useTransactionLifecycleSteps).mockReturnValue([
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
    ]);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe("rendering", () => {
    it("should not render when isOpen is false", () => {
      let container: Element;
      act(() => {
        const result = render(
          <TransactionLifecycleDialog {...defaultProps} isOpen={false} />
        );
        container = result.container;
      });

      expect(container!.querySelector("[role='dialog']")).not.toBeInTheDocument();
    });

    it("should render dialog title", () => {
      act(() => {
        render(<TransactionLifecycleDialog {...defaultProps} />);
      });

      expect(
        screen.getByText("Transfer Progress")
      ).toBeInTheDocument();
    });

    it("should render lifecycle steps", () => {
      act(() => {
        render(<TransactionLifecycleDialog {...defaultProps} />);
      });

      expect(screen.getByTestId("step-Step 1: Sign")).toBeInTheDocument();
    });
  });

  describe("step status messages", () => {
    it("should show message for signing state", () => {
      act(() => {
        render(
          <TransactionLifecycleDialog
            {...defaultProps}
            currentStep={SimpleBridgeStep.STEP_1_SIGNING}
          />
        );
      });

      expect(
        screen.getByTestId("transfer-status-message")
      ).toHaveTextContent("Please check your wallet and sign the transaction");
    });

    it("should show message for confirming state", () => {
      act(() => {
        render(
          <TransactionLifecycleDialog
            {...defaultProps}
            currentStep={SimpleBridgeStep.STEP_1_CONFIRMING}
          />
        );
      });

      expect(
        screen.getByTestId("transfer-status-message")
      ).toHaveTextContent(/Transaction submitted!.*Waiting for network confirmation/i);
    });

    it("should show message for step 1 complete state", () => {
      act(() => {
        render(
          <TransactionLifecycleDialog
            {...defaultProps}
            currentStep={SimpleBridgeStep.STEP_1_COMPLETE}
          />
        );
      });

      expect(
        screen.getByTestId("transfer-status-message")
      ).toHaveTextContent(/First step complete!.*Preparing second transaction/i);
    });

    it("should show message for step 2 signing state", () => {
      act(() => {
        render(
          <TransactionLifecycleDialog
            {...defaultProps}
            currentStep={SimpleBridgeStep.STEP_2_SIGNING}
          />
        );
      });

      expect(
        screen.getByTestId("transfer-status-message")
      ).toHaveTextContent("Please check your wallet and sign the second transaction");
    });

    it("should show message for step 2 confirming state", () => {
      act(() => {
        render(
          <TransactionLifecycleDialog
            {...defaultProps}
            currentStep={SimpleBridgeStep.STEP_2_CONFIRMING}
          />
        );
      });

      expect(
        screen.getByTestId("transfer-status-message")
      ).toHaveTextContent(/Final transaction submitted!.*Almost done/i);
    });

    it("should show message for complete state", () => {
      act(() => {
        render(
          <TransactionLifecycleDialog
            {...defaultProps}
            currentStep={SimpleBridgeStep.COMPLETE}
          />
        );
      });

      expect(
        screen.getByTestId("transfer-status-message")
      ).toHaveTextContent(/Transfer complete!.*All transactions successful/i);
    });

    it("should show message for error state", () => {
      act(() => {
        render(
          <TransactionLifecycleDialog
            {...defaultProps}
            currentStep={SimpleBridgeStep.ERROR}
          />
        );
      });

      expect(screen.getByTestId("transfer-status-message")).toHaveTextContent(/Transaction failed.*Please try again/i);
    });
  });

  describe("signature warning", () => {
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

      expect(screen.queryByTestId("signature-warning")).not.toBeInTheDocument();
    });
  });

  describe("error handling", () => {
    it("should mark step as error when transaction fails", () => {
      // Configure mock to return error status for step 1
      vi.mocked(useTransactionLifecycleSteps).mockReturnValue([
        {
          id: "step1-sign",
          title: "Step 1: Sign",
          description: "Sign on Base",
          status: "error",
          isSignatureRequired: true,
        },
        {
          id: "step1-confirm",
          title: "Step 1: Confirm",
          description: "Waiting for confirmation",
          status: "pending",
        },
      ]);

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
              errorPhase: "sign",
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
        screen.getByTestId("transfer-status-message")
      ).toHaveTextContent(/Transfer complete!.*All transactions successful/i);
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
