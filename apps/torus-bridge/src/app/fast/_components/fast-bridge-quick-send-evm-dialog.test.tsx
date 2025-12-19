import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuickSendEvmDialog } from "./fast-bridge-quick-send-evm-dialog";

// Mock lucide-react icons with specific test IDs
vi.mock("lucide-react", () => ({
  AlertCircle: () => <div data-testid="alert-icon" />,
  Check: () => <div data-testid="check-icon" />,
  CheckCircle2: () => <div data-testid="check-circle-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} data-testid={`image-${alt}`} />
  ),
}));

describe("QuickSendEvmDialog", () => {
  const mockOnClose = vi.fn();
  const mockOnSendToNative = vi.fn();
  const mockOnSendToBase = vi.fn();
  const mockRefetchBalances = vi.fn().mockResolvedValue(undefined);
  const mockOnRecoverySuccess = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    evmBalance: 100n * 10n ** 18n, // 100 TORUS
    onSendToNative: mockOnSendToNative,
    onSendToBase: mockOnSendToBase,
    formatAmount: (amount: bigint) =>
      (Number(amount) / 1e18).toFixed(4).replace(/\.?0+$/, ""),
    currentEvmBalance: 100n * 10n ** 18n,
    refetchBalances: mockRefetchBalances,
    onRecoverySuccess: mockOnRecoverySuccess,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("idle state - destination selection", () => {
    it("should render dialog title with Zap icon", () => {
      render(<QuickSendEvmDialog {...defaultProps} />);

      expect(screen.getByTestId("quick-send-title")).toHaveTextContent("EVM Recover");
      expect(screen.getByTestId("zap-icon")).toBeInTheDocument();
    });

    it("should render dialog description", () => {
      render(<QuickSendEvmDialog {...defaultProps} />);

      expect(
        screen.getByText(/Recover your EVM balance by transferring/i)
      ).toBeInTheDocument();
    });

    it("should not render when isOpen is false", () => {
      const { container } = render(
        <QuickSendEvmDialog {...defaultProps} isOpen={false} />
      );

      expect(container.querySelector("[role='dialog']")).not.toBeInTheDocument();
    });

    it("should display EVM balance", () => {
      render(<QuickSendEvmDialog {...defaultProps} />);

      expect(screen.getByTestId("evm-balance-amount")).toHaveTextContent("100");
      expect(screen.getByTestId("evm-balance-currency")).toHaveTextContent("TORUS");
    });

    it("should render Torus and Base Chain destination cards", () => {
      render(<QuickSendEvmDialog {...defaultProps} />);

      expect(screen.getByTestId("destination-torus-title")).toHaveTextContent("Torus");
      expect(screen.getByTestId("destination-torus-description")).toHaveTextContent("Send to Torus chain");
      expect(screen.getByTestId("destination-base-title")).toHaveTextContent("Base Chain");
      expect(screen.getByTestId("destination-base-description")).toHaveTextContent("Send to Base mainnet");
    });

    it("should show Select buttons for both destinations", () => {
      render(<QuickSendEvmDialog {...defaultProps} />);

      const selectButtons = screen.getAllByRole("button", { name: /Select/i });
      expect(selectButtons).toHaveLength(2);
    });
  });

  describe("sending state", () => {
    it("should transition to sending state when destination is clicked", async () => {
      const user = userEvent.setup();
      mockOnSendToNative.mockResolvedValueOnce(undefined);

      render(<QuickSendEvmDialog {...defaultProps} />);

      const selectButtons = screen.getAllByRole("button", { name: /Select/i });
      await user.click(selectButtons[0]);

      // Should show sending state
      expect(screen.getByTestId("sending-title")).toHaveTextContent("Sending Transaction");
      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
    });

    it("should display loading state for Torus destination", async () => {
      const user = userEvent.setup();
      mockOnSendToNative.mockResolvedValueOnce(undefined);

      render(<QuickSendEvmDialog {...defaultProps} />);

      const selectButtons = screen.getAllByRole("button", { name: /Select/i });
      await user.click(selectButtons[0]);

      expect(screen.getByTestId("sending-title")).toHaveTextContent("Sending Transaction");
    });

    it("should display loading state for Base Chain destination", async () => {
      const user = userEvent.setup();
      mockOnSendToBase.mockResolvedValueOnce(undefined);

      render(<QuickSendEvmDialog {...defaultProps} />);

      const selectButtons = screen.getAllByRole("button", { name: /Select/i });
      await user.click(selectButtons[1]);

      expect(screen.getByTestId("sending-title")).toHaveTextContent("Sending Transaction");
    });

    it("should show formatted amount in sending state", async () => {
      const user = userEvent.setup();
      mockOnSendToNative.mockResolvedValueOnce(undefined);

      render(<QuickSendEvmDialog {...defaultProps} />);

      const selectButtons = screen.getAllByRole("button", { name: /Select/i });
      await user.click(selectButtons[0]);

      // The amount should be formatted and displayed
      expect(screen.getByText(/100(\.0*)?/)).toBeInTheDocument();
    });

    it("should call onSendToNative when Torus is selected", async () => {
      const user = userEvent.setup();
      mockOnSendToNative.mockResolvedValueOnce(undefined);

      render(<QuickSendEvmDialog {...defaultProps} />);

      const selectButtons = screen.getAllByRole("button", { name: /Select/i });
      await user.click(selectButtons[0]);

      expect(mockOnSendToNative).toHaveBeenCalledWith(100n * 10n ** 18n);
    });

    it("should call onSendToBase when Base Chain is selected", async () => {
      const user = userEvent.setup();
      mockOnSendToBase.mockResolvedValueOnce(undefined);

      render(<QuickSendEvmDialog {...defaultProps} />);

      const selectButtons = screen.getAllByRole("button", { name: /Select/i });
      await user.click(selectButtons[1]);

      expect(mockOnSendToBase).toHaveBeenCalledWith(100n * 10n ** 18n);
    });

    it("should prevent closing dialog while sending", async () => {
      const user = userEvent.setup();
      mockOnSendToNative.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 1000);
          })
      );

      render(<QuickSendEvmDialog {...defaultProps} />);

      const selectButtons = screen.getAllByRole("button", { name: /Select/i });
      await user.click(selectButtons[0]);

      // Try to close dialog (click would normally trigger onClose if allowed)
      // Dialog should still show sending state
      expect(screen.getByTestId("sending-title")).toHaveTextContent("Sending Transaction");
    });
  });

  describe("success state", () => {
    it("should transition to success state when balance decreases", async () => {
      const user = userEvent.setup();
      mockOnSendToNative.mockResolvedValueOnce(undefined);

      const { rerender } = render(
        <QuickSendEvmDialog {...defaultProps} />
      );

      const selectButtons = screen.getAllByRole("button", { name: /Select/i });
      await user.click(selectButtons[0]);

      // Simulate balance decrease (enough to trigger success - more than 80% of expected)
      const decreasedBalance = 10n * 10n ** 18n; // 10 TORUS (90% decrease)

      rerender(
        <QuickSendEvmDialog
          {...defaultProps}
          currentEvmBalance={decreasedBalance}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("success-title")).toHaveTextContent("Transfer Complete!");
      });
    });

    it("should show success icon and message", async () => {
      const user = userEvent.setup();
      mockOnSendToNative.mockResolvedValueOnce(undefined);

      const { rerender } = render(
        <QuickSendEvmDialog {...defaultProps} />
      );

      const selectButtons = screen.getAllByRole("button", { name: /Select/i });
      await user.click(selectButtons[0]);

      const decreasedBalance = 10n * 10n ** 18n; // 10 TORUS (90% decrease)

      rerender(
        <QuickSendEvmDialog
          {...defaultProps}
          currentEvmBalance={decreasedBalance}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("check-circle-icon")).toBeInTheDocument();
        expect(screen.getByText(/Successfully sent/i)).toBeInTheDocument(); // Keep regex for dynamic content
      });
    });

    it("should show Done button in success state", async () => {
      const user = userEvent.setup();
      mockOnSendToNative.mockResolvedValueOnce(undefined);

      const { rerender } = render(
        <QuickSendEvmDialog {...defaultProps} />
      );

      const selectButtons = screen.getAllByRole("button", { name: /Select/i });
      await user.click(selectButtons[0]);

      const decreasedBalance = 10n * 10n ** 18n; // 10 TORUS (90% decrease)

      rerender(
        <QuickSendEvmDialog
          {...defaultProps}
          currentEvmBalance={decreasedBalance}
        />
      );

      await waitFor(() => {
        const doneButton = screen.getByRole("button", { name: /Done/i });
        expect(doneButton).toBeInTheDocument();
      });
    });

    it("should close dialog when Done button is clicked", async () => {
      const user = userEvent.setup();
      mockOnSendToNative.mockResolvedValueOnce(undefined);

      const { rerender } = render(
        <QuickSendEvmDialog {...defaultProps} />
      );

      const selectButtons = screen.getAllByRole("button", { name: /Select/i });
      await user.click(selectButtons[0]);

      const decreasedBalance = 10n * 10n ** 18n; // 10 TORUS (90% decrease)

      rerender(
        <QuickSendEvmDialog
          {...defaultProps}
          currentEvmBalance={decreasedBalance}
        />
      );

      await waitFor(() => {
        const doneButton = screen.getByRole("button", { name: /Done/i });
        expect(doneButton).toBeInTheDocument();
      });

      const doneButton = screen.getByRole("button", { name: /Done/i });
      await user.click(doneButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should call onRecoverySuccess when balance decreases", async () => {
      const user = userEvent.setup();
      mockOnSendToNative.mockResolvedValueOnce(undefined);

      const { rerender } = render(
        <QuickSendEvmDialog {...defaultProps} />
      );

      const selectButtons = screen.getAllByRole("button", { name: /Select/i });
      await user.click(selectButtons[0]);

      const decreasedBalance = 10n * 10n ** 18n; // 10 TORUS (90% decrease)

      rerender(
        <QuickSendEvmDialog
          {...defaultProps}
          currentEvmBalance={decreasedBalance}
        />
      );

      await waitFor(() => {
        expect(mockOnRecoverySuccess).toHaveBeenCalled();
      });
    });

    it("should call refetchBalances when transfer completes", async () => {
      const user = userEvent.setup();
      mockOnSendToNative.mockResolvedValueOnce(undefined);

      const { rerender } = render(
        <QuickSendEvmDialog {...defaultProps} />
      );

      const selectButtons = screen.getAllByRole("button", { name: /Select/i });
      await user.click(selectButtons[0]);

      const decreasedBalance = 10n * 10n ** 18n; // 10 TORUS (90% decrease)

      rerender(
        <QuickSendEvmDialog
          {...defaultProps}
          currentEvmBalance={decreasedBalance}
        />
      );

      await waitFor(() => {
        expect(mockRefetchBalances).toHaveBeenCalled();
      });
    });
  });

  describe("error state", () => {
    it("should transition to error state when send fails", async () => {
      const user = userEvent.setup();
      mockOnSendToNative.mockRejectedValueOnce(new Error("Send failed"));

      render(<QuickSendEvmDialog {...defaultProps} />);

      const selectButtons = screen.getAllByRole("button", { name: /Select/i });
      await user.click(selectButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId("error-title")).toHaveTextContent("Transfer Failed");
      });
    });

    it("should show error icon and message", async () => {
      const user = userEvent.setup();
      mockOnSendToNative.mockRejectedValueOnce(new Error("Send failed"));

      render(<QuickSendEvmDialog {...defaultProps} />);

      const selectButtons = screen.getAllByRole("button", { name: /Select/i });
      await user.click(selectButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId("alert-icon")).toBeInTheDocument();
      });
    });

    it("should display error message", async () => {
      const user = userEvent.setup();
      const errorMessage = "Insufficient gas for transaction";
      const formattedErrorMessage = "Insufficient ETH for gas fees. Please add ETH to your Torus EVM wallet and try again.";
      mockOnSendToNative.mockRejectedValueOnce(new Error(errorMessage));

      render(<QuickSendEvmDialog {...defaultProps} />);

      const selectButtons = screen.getAllByRole("button", { name: /Select/i });
      await user.click(selectButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(formattedErrorMessage)).toBeInTheDocument();
      });
    });

    it("should show Cancel and Retry buttons in error state", async () => {
      const user = userEvent.setup();
      mockOnSendToNative.mockRejectedValueOnce(new Error("Send failed"));

      render(<QuickSendEvmDialog {...defaultProps} />);

      const selectButtons = screen.getAllByRole("button", { name: /Select/i });
      await user.click(selectButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
      });
    });

    it("should close dialog when Cancel is clicked", async () => {
      const user = userEvent.setup();
      mockOnSendToNative.mockRejectedValueOnce(new Error("Send failed"));

      render(<QuickSendEvmDialog {...defaultProps} />);

      const selectButtons = screen.getAllByRole("button", { name: /Select/i });
      await user.click(selectButtons[0]);

      await waitFor(() => {
        const cancelButton = screen.getByRole("button", { name: /Cancel/i });
        expect(cancelButton).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should retry when Retry button is clicked", async () => {
      const user = userEvent.setup();
      mockOnSendToNative.mockRejectedValueOnce(new Error("Send failed"));
      mockOnSendToNative.mockResolvedValueOnce(undefined);

      render(<QuickSendEvmDialog {...defaultProps} />);

      const selectButtons = screen.getAllByRole("button", { name: /Select/i });
      await user.click(selectButtons[0]);

      await waitFor(() => {
        const retryButton = screen.getByRole("button", { name: /Retry/i });
        expect(retryButton).toBeInTheDocument();
      });

      const retryButton = screen.getByRole("button", { name: /Retry/i });
      await user.click(retryButton);

      // Should attempt to send again
      expect(mockOnSendToNative).toHaveBeenCalledTimes(2);
    });

    it("should handle user rejection error gracefully", async () => {
      const user = userEvent.setup();
      const rejectionError = new Error("User rejected transaction");
      mockOnSendToNative.mockRejectedValueOnce(rejectionError);

      render(<QuickSendEvmDialog {...defaultProps} />);

      const selectButtons = screen.getAllByRole("button", { name: /Select/i });
      await user.click(selectButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId("error-title")).toHaveTextContent("Transfer Failed");
      });
    });
  });

  describe("balance monitoring", () => {
    it("should detect completion when balance becomes near zero", async () => {
      const user = userEvent.setup();
      mockOnSendToNative.mockResolvedValueOnce(undefined);

      const { rerender } = render(
        <QuickSendEvmDialog {...defaultProps} />
      );

      const selectButtons = screen.getAllByRole("button", { name: /Select/i });
      await user.click(selectButtons[0]);

      // Simulate balance becoming dust (0.001 TORUS)
      const dustBalance = 1n * 10n ** 15n;

      rerender(
        <QuickSendEvmDialog
          {...defaultProps}
          currentEvmBalance={dustBalance}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("success-title")).toHaveTextContent("Transfer Complete!");
      });
    });

    it("should detect completion when balance decreases by 80%", async () => {
      const user = userEvent.setup();
      mockOnSendToNative.mockResolvedValueOnce(undefined);

      const { rerender } = render(
        <QuickSendEvmDialog {...defaultProps} />
      );

      const selectButtons = screen.getAllByRole("button", { name: /Select/i });
      await user.click(selectButtons[0]);

      // Simulate 80% decrease (20% remaining)
      const balanceAfterDecrease = 20n * 10n ** 18n;

      rerender(
        <QuickSendEvmDialog
          {...defaultProps}
          currentEvmBalance={balanceAfterDecrease}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("success-title")).toHaveTextContent("Transfer Complete!");
      });
    });

    it("should continue monitoring until sufficient decrease", async () => {
      const user = userEvent.setup();
      mockOnSendToNative.mockResolvedValueOnce(undefined);

      const { rerender } = render(
        <QuickSendEvmDialog {...defaultProps} />
      );

      const selectButtons = screen.getAllByRole("button", { name: /Select/i });
      await user.click(selectButtons[0]);

      // Simulate small decrease (not enough yet)
      const smallDecrease = 95n * 10n ** 18n;

      rerender(
        <QuickSendEvmDialog
          {...defaultProps}
          currentEvmBalance={smallDecrease}
        />
      );

      // Should still be in sending state
      expect(screen.getByTestId("sending-title")).toHaveTextContent("Sending Transaction");
    });
  });

  describe("dialog lifecycle", () => {
    it("should reset state when closing", async () => {
      const user = userEvent.setup();
      mockOnSendToNative.mockResolvedValueOnce(undefined);

      const { rerender } = render(
        <QuickSendEvmDialog {...defaultProps} />
      );

      const selectButtons = screen.getAllByRole("button", { name: /Select/i });
      await user.click(selectButtons[0]);

      // Reopen dialog
      rerender(
        <QuickSendEvmDialog
          {...defaultProps}
          isOpen={false}
          onClose={() => {
            vi.fn();
          }}
        />
      );

      // Dialog should be closed
      expect(screen.queryByText("EVM Recover")).not.toBeInTheDocument();
    });

    it("should handle multiple open/close cycles", async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <QuickSendEvmDialog {...defaultProps} />
      );

      // First cycle
      expect(screen.getByTestId("quick-send-title")).toHaveTextContent("EVM Recover");

      rerender(
        <QuickSendEvmDialog
          {...defaultProps}
          isOpen={false}
          onClose={() => mockOnClose()}
        />
      );

      expect(screen.queryByText("EVM Recover")).not.toBeInTheDocument();

      // Second cycle
      rerender(<QuickSendEvmDialog {...defaultProps} isOpen={true} />);

      expect(screen.getByTestId("quick-send-title")).toHaveTextContent("EVM Recover");
    });
  });

  describe("display formatting", () => {
    it("should format large amounts correctly", () => {
      const largeBalance = 1000n * 10n ** 18n;

      render(
        <QuickSendEvmDialog
          {...defaultProps}
          evmBalance={largeBalance}
          currentEvmBalance={largeBalance}
          formatAmount={(amount: bigint) =>
            (Number(amount) / 1e18).toFixed(2).replace(/\.?0+$/, "")
          }
        />
      );

      expect(screen.getByTestId("evm-balance-amount")).toHaveTextContent("1000");
    });

    it("should transition to sending state for Torus destination", async () => {
      const user = userEvent.setup();
      mockOnSendToNative.mockResolvedValueOnce(undefined);

      render(<QuickSendEvmDialog {...defaultProps} />);

      const selectButtons = screen.getAllByRole("button", { name: /Select/i });
      await user.click(selectButtons[0]);

      expect(screen.getByTestId("sending-title")).toHaveTextContent("Sending Transaction");
    });

    it("should transition to sending state for Base Chain destination", async () => {
      const user = userEvent.setup();
      mockOnSendToBase.mockResolvedValueOnce(undefined);

      render(<QuickSendEvmDialog {...defaultProps} />);

      const selectButtons = screen.getAllByRole("button", { name: /Select/i });
      await user.click(selectButtons[1]);

      expect(screen.getByTestId("sending-title")).toHaveTextContent("Sending Transaction");
    });
  });
});
