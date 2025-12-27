import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TransactionStepItem } from "./fast-bridge-transaction-step-item";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  AlertCircle: () => <div data-testid="alert-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  ExternalLink: () => <div data-testid="external-link-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  Wallet: () => <div data-testid="wallet-icon" />,
}));

// Mock Accordion component
vi.mock("@torus-ts/ui/components/accordion", () => ({
  Accordion: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="accordion">{children}</div>
  ),
  AccordionItem: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="accordion-item">{children}</div>
  ),
  AccordionTrigger: ({ children }: { children: React.ReactNode }) => (
    <button data-testid="accordion-trigger">{children}</button>
  ),
  AccordionContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="accordion-content">{children}</div>
  ),
}));

vi.mock("@torus-ts/ui/components/button", () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick} data-testid="button">
      {children}
    </button>
  ),
}));

describe("TransactionStepItem", () => {
  const defaultProps = {
    id: "step1-sign",
    title: "Step 1: Sign Transaction",
    description: "Approve the transfer on Base Chain",
    status: "active" as const,
    isLast: false,
  };

  describe("rendering", () => {
    it("should render step title", () => {
      render(<TransactionStepItem {...defaultProps} />);

      expect(screen.getByText("Step 1: Sign Transaction")).toBeInTheDocument();
    });

    it("should render step description", () => {
      render(<TransactionStepItem {...defaultProps} />);

      expect(
        screen.getByText("Approve the transfer on Base Chain")
      ).toBeInTheDocument();
    });

    it("should render accordion structure when transaction details are available", () => {
      render(
        <TransactionStepItem
          {...defaultProps}
          status="completed"
          txHash="0x123"
          explorerUrl="https://example.com"
        />
      );

      expect(screen.getByTestId("accordion")).toBeInTheDocument();
      expect(screen.getByTestId("accordion-item")).toBeInTheDocument();
    });
  });

  describe("status icons", () => {
    it("should show completed status icon", () => {
      render(
        <TransactionStepItem
          {...defaultProps}
          status="completed"
        />
      );

      expect(screen.getByTestId("check-circle-icon")).toBeInTheDocument();
    });

    it("should show active status icon (spinning loader)", () => {
      render(
        <TransactionStepItem {...defaultProps} status="active" />
      );

      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
    });

    it("should show waiting status icon (clock)", () => {
      render(
        <TransactionStepItem {...defaultProps} status="waiting" />
      );

      // Should have two clock icons: one for status and one for non-signature required
      expect(screen.getAllByTestId("clock-icon")).toHaveLength(2);
    });

    it("should show error status icon", () => {
      render(
        <TransactionStepItem {...defaultProps} status="error" />
      );

      expect(screen.getByTestId("alert-icon")).toBeInTheDocument();
    });

    it("should show pending status icon (empty circle)", () => {
      render(
        <TransactionStepItem {...defaultProps} status="pending" />
      );

      // Pending has a border circle, no specific icon, and no accordion
      expect(screen.queryByTestId("accordion")).not.toBeInTheDocument();
    });
  });

  describe("transaction details", () => {
    it("should display transaction hash when provided and completed", () => {
      render(
        <TransactionStepItem
          {...defaultProps}
          status="completed"
          txHash="0x1234567890abcdef"
          explorerUrl="https://example.com"
        />
      );

      expect(screen.getByText(/0x12345678\.\.\.90abcdef/i)).toBeInTheDocument();
    });

    it("should display explorer link when both txHash and explorerUrl provided", () => {
      render(
        <TransactionStepItem
          {...defaultProps}
          status="completed"
          txHash="0x1234567890abcdef"
          explorerUrl="https://explorer.test/tx/0x1234567890abcdef"
        />
      );

      const link = screen.getByRole("button", { name: /View on Explorer/i });
      expect(link).toBeInTheDocument();
    });

    it("should show external link icon", () => {
      render(
        <TransactionStepItem
          {...defaultProps}
          status="completed"
          txHash="0x1234567890abcdef"
          explorerUrl="https://explorer.test/tx/0x1234567890abcdef"
        />
      );

      expect(screen.getAllByTestId("external-link-icon")).toHaveLength(2);
    });

    it("should display amount when provided", () => {
      render(
        <TransactionStepItem
          {...defaultProps}
          status="completed"
          txHash="0x123"
          explorerUrl="https://example.com"
          amount="100 TORUS"
        />
      );

      expect(screen.getByText(/100 TORUS/i)).toBeInTheDocument();
    });

    it("should display estimated time when provided", () => {
      render(
        <TransactionStepItem
          {...defaultProps}
          estimatedTime="2 minutes"
        />
      );

      expect(screen.getByText(/2 minutes/i)).toBeInTheDocument();
    });
  });

  describe("signature requirement indicator", () => {
    it("should show wallet icon when signature is required", () => {
      render(
        <TransactionStepItem
          {...defaultProps}
          isSignatureRequired={true}
        />
      );

      expect(screen.getByTestId("wallet-icon")).toBeInTheDocument();
    });

    it("should show clock icon when signature is not required", () => {
      render(
        <TransactionStepItem
          {...defaultProps}
          isSignatureRequired={false}
        />
      );

      expect(screen.getByTestId("clock-icon")).toBeInTheDocument();
    });

    it("should indicate signature required in step context", () => {
      render(
        <TransactionStepItem
          {...defaultProps}
          isSignatureRequired={true}
          title="Step 1: Sign and Submit"
        />
      );

      expect(screen.getByText("Step 1: Sign and Submit")).toBeInTheDocument();
      expect(screen.getByTestId("wallet-icon")).toBeInTheDocument();
    });
  });

  describe("error handling", () => {
    it("should display error details when provided", () => {
      render(
        <TransactionStepItem
          {...defaultProps}
          status="error"
          errorDetails="Network connection failed"
        />
      );

      expect(screen.getByText("Network connection failed")).toBeInTheDocument();
    });

    it("should show error in red color", () => {
      render(
        <TransactionStepItem
          {...defaultProps}
          status="error"
          errorDetails="Network connection failed"
        />
      );

      expect(screen.getByTestId("alert-icon")).toBeInTheDocument();
    });

    it("should display formatted error messages", () => {
      const errorMsg = "Transaction reverted: Insufficient balance";
      render(
        <TransactionStepItem
          {...defaultProps}
          status="error"
          errorDetails={errorMsg}
        />
      );

      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });
  });

  describe("signature warning", () => {
    it("should display signature warning when flag is true", () => {
      render(
        <TransactionStepItem
          {...defaultProps}
          status="active"
          isSignatureRequired={true}
          showSignatureWarning={true}
        />
      );

      // Warning should be visible when showSignatureWarning is true and status is active
      expect(screen.getByText(/check your wallet and approve/i)).toBeInTheDocument();
      expect(screen.queryByTestId("accordion")).not.toBeInTheDocument();
    });

    it("should not display signature warning when flag is false", () => {
      render(
        <TransactionStepItem
          {...defaultProps}
          status="active"
          isSignatureRequired={true}
          showSignatureWarning={false}
        />
      );

      // Should not show warning when showSignatureWarning is false
      expect(screen.queryByText(/check your wallet and approve/i)).not.toBeInTheDocument();
      expect(screen.queryByTestId("accordion")).not.toBeInTheDocument();
    });
  });

  describe("step connector styling", () => {
    it("should mark last step appropriately", () => {
      render(
        <TransactionStepItem
          {...defaultProps}
          isLast={true}
        />
      );

      // Should not have connector line when isLast is true
      expect(screen.queryByTestId("accordion-item")).not.toBeInTheDocument();
    });

    it("should mark non-last step appropriately", () => {
      render(
        <TransactionStepItem
          {...defaultProps}
          isLast={false}
        />
      );

      // Should not have accordion when not completed with details
      expect(screen.queryByTestId("accordion-item")).not.toBeInTheDocument();
    });
  });

  describe("different step types", () => {
    it("should work for signing steps", () => {
      render(
        <TransactionStepItem
          {...defaultProps}
          id="step1-sign"
          title="Sign Transaction"
          description="Waiting for your signature"
          isSignatureRequired={true}
        />
      );

      expect(screen.getByText("Sign Transaction")).toBeInTheDocument();
      expect(screen.getByTestId("wallet-icon")).toBeInTheDocument();
    });

    it("should work for confirmation steps", () => {
      render(
        <TransactionStepItem
          {...defaultProps}
          id="step1-confirm"
          title="Waiting for Confirmation"
          description="Waiting for network confirmation"
          status="waiting"
          isSignatureRequired={false}
        />
      );

      expect(screen.getByText("Waiting for Confirmation")).toBeInTheDocument();
      // Should have two clock icons: one for status and one for display icon
      expect(screen.getAllByTestId("clock-icon")).toHaveLength(2);
    });

    it("should display network-specific titles", () => {
      render(
        <TransactionStepItem
          {...defaultProps}
          title="Step 1: Transfer from Base"
          description="Sign on Base Chain"
        />
      );

      expect(screen.getByText("Step 1: Transfer from Base")).toBeInTheDocument();
      expect(screen.getByText("Sign on Base Chain")).toBeInTheDocument();
    });
  });

  describe("status flow", () => {
    it("should handle status transitions from pending to active", () => {
      const { rerender } = render(
        <TransactionStepItem {...defaultProps} status="pending" />
      );

      // Should not have accordion initially
      expect(screen.queryByTestId("accordion")).not.toBeInTheDocument();

      rerender(
        <TransactionStepItem {...defaultProps} status="active" />
      );

      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
    });

    it("should handle status transitions from active to completed", () => {
      const { rerender } = render(
        <TransactionStepItem {...defaultProps} status="active" />
      );

      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();

      rerender(
        <TransactionStepItem {...defaultProps} status="completed" />
      );

      expect(screen.getByTestId("check-circle-icon")).toBeInTheDocument();
    });

    it("should handle status transitions from active to error", () => {
      const { rerender } = render(
        <TransactionStepItem {...defaultProps} status="active" />
      );

      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();

      rerender(
        <TransactionStepItem
          {...defaultProps}
          status="error"
          errorDetails="Transaction failed"
        />
      );

      expect(screen.getByTestId("alert-icon")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper accordion trigger for expandable content", () => {
      render(
        <TransactionStepItem
          {...defaultProps}
          status="completed"
          txHash="0x123"
          explorerUrl="https://example.com"
        />
      );

      expect(screen.getByTestId("accordion-trigger")).toBeInTheDocument();
    });

    it("should display external link with target blank", () => {
      render(
        <TransactionStepItem
          {...defaultProps}
          status="completed"
          txHash="0xhash"
          explorerUrl="https://explorer.test/tx/0xhash"
        />
      );

      const button = screen.getByRole("button", { name: /View on Explorer/i });
      expect(button).toBeInTheDocument();
    });
  });
});
