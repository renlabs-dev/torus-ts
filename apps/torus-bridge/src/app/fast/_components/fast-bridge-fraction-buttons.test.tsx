import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FractionButtons } from "./fast-bridge-fraction-buttons";

describe("FractionButtons", () => {
  const mockHandleFractionClick = vi.fn();
  const mockHandleMaxClick = vi.fn();

  beforeEach(() => {
    mockHandleFractionClick.mockClear();
    mockHandleMaxClick.mockClear();
  });

  const defaultProps = {
    handleFractionClick: mockHandleFractionClick,
    walletsReady: true,
    isTransferInProgress: false,
    handleMaxClick: mockHandleMaxClick,
  };

  describe("rendering", () => {
    it("should render all fraction buttons with correct labels", () => {
      render(<FractionButtons {...defaultProps} />);

      expect(screen.getByRole("button", { name: "1/4" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "1/3" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "1/2" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    });

    it("should render four buttons total", () => {
      render(<FractionButtons {...defaultProps} />);

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(4);
    });
  });

  describe("user interactions", () => {
    it("should call handleFractionClick with 0.25 when 1/4 button is clicked", async () => {
      const user = userEvent.setup();
      render(<FractionButtons {...defaultProps} />);

      const button = screen.getByRole("button", { name: "1/4" });
      await user.click(button);

      expect(mockHandleFractionClick).toHaveBeenCalledWith(0.25);
      expect(mockHandleFractionClick).toHaveBeenCalledTimes(1);
    });

    it("should call handleFractionClick with 0.33 when 1/3 button is clicked", async () => {
      const user = userEvent.setup();
      render(<FractionButtons {...defaultProps} />);

      const button = screen.getByRole("button", { name: "1/3" });
      await user.click(button);

      expect(mockHandleFractionClick).toHaveBeenCalledWith(0.33);
      expect(mockHandleFractionClick).toHaveBeenCalledTimes(1);
    });

    it("should call handleFractionClick with 0.5 when 1/2 button is clicked", async () => {
      const user = userEvent.setup();
      render(<FractionButtons {...defaultProps} />);

      const button = screen.getByRole("button", { name: "1/2" });
      await user.click(button);

      expect(mockHandleFractionClick).toHaveBeenCalledWith(0.5);
      expect(mockHandleFractionClick).toHaveBeenCalledTimes(1);
    });

    it("should call handleMaxClick when All button is clicked", async () => {
      const user = userEvent.setup();
      render(<FractionButtons {...defaultProps} />);

      const button = screen.getByRole("button", { name: "All" });
      await user.click(button);

      expect(mockHandleMaxClick).toHaveBeenCalledTimes(1);
      expect(mockHandleFractionClick).not.toHaveBeenCalled();
    });

    it("should allow clicking multiple different buttons in sequence", async () => {
      const user = userEvent.setup();
      render(<FractionButtons {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: "1/4" }));
      await user.click(screen.getByRole("button", { name: "1/2" }));
      await user.click(screen.getByRole("button", { name: "1/3" }));

      expect(mockHandleFractionClick).toHaveBeenNthCalledWith(1, 0.25);
      expect(mockHandleFractionClick).toHaveBeenNthCalledWith(2, 0.5);
      expect(mockHandleFractionClick).toHaveBeenNthCalledWith(3, 0.33);
    });
  });

  describe("disabled state", () => {
    it("should disable all buttons when walletsReady is false", () => {
      render(<FractionButtons {...defaultProps} walletsReady={false} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it("should disable all buttons when isTransferInProgress is true", () => {
      render(<FractionButtons {...defaultProps} isTransferInProgress={true} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it("should disable all buttons when both walletsReady is false and isTransferInProgress is true", () => {
      render(
        <FractionButtons
          {...defaultProps}
          walletsReady={false}
          isTransferInProgress={true}
        />
      );

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it("should enable all buttons when walletsReady is true and isTransferInProgress is false", () => {
      render(<FractionButtons {...defaultProps} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).not.toBeDisabled();
      });
    });

    it("should not call handlers when clicking disabled buttons", async () => {
      const user = userEvent.setup();
      render(<FractionButtons {...defaultProps} walletsReady={false} />);

      const button = screen.getByRole("button", { name: "1/4" });
      await user.click(button);

      expect(mockHandleFractionClick).not.toHaveBeenCalled();
    });
  });

  describe("selection state", () => {
    it("should maintain selection state after clicking a button", async () => {
      const user = userEvent.setup();
      const { rerender } = render(<FractionButtons {...defaultProps} />);

      const button14 = screen.getByRole("button", { name: "1/4" });
      await user.click(button14);

      // Re-render to ensure selection is maintained
      rerender(<FractionButtons {...defaultProps} />);

      // Check that the button appears selected (has the selected styling)
      // The component uses className with bg-[#262631] when selected
      expect(button14).toHaveClass("bg-[#262631]");
    });

    it("should update selection when clicking different button", async () => {
      const user = userEvent.setup();
      render(<FractionButtons {...defaultProps} />);

      const button14 = screen.getByRole("button", { name: "1/4" });
      const button12 = screen.getByRole("button", { name: "1/2" });

      await user.click(button14);
      expect(button14).toHaveClass("bg-[#262631]");

      await user.click(button12);
      expect(button12).toHaveClass("bg-[#262631]");
      expect(button14).not.toHaveClass("bg-[#262631]");
    });

    it("should show selection styling for All button after clicking", async () => {
      const user = userEvent.setup();
      render(<FractionButtons {...defaultProps} />);

      const allButton = screen.getByRole("button", { name: "All" });
      await user.click(allButton);

      expect(allButton).toHaveClass("bg-[#262631]");
    });
  });

  describe("edge cases", () => {
    it("should handle rapid consecutive clicks on same button", async () => {
      const user = userEvent.setup();
      render(<FractionButtons {...defaultProps} />);

      const button = screen.getByRole("button", { name: "1/4" });

      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(mockHandleFractionClick).toHaveBeenCalledTimes(3);
      expect(mockHandleFractionClick).toHaveBeenNthCalledWith(1, 0.25);
      expect(mockHandleFractionClick).toHaveBeenNthCalledWith(2, 0.25);
      expect(mockHandleFractionClick).toHaveBeenNthCalledWith(3, 0.25);
    });

    it("should transition from disabled to enabled state", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <FractionButtons {...defaultProps} walletsReady={false} />
      );

      const button = screen.getByRole("button", { name: "1/4" });
      expect(button).toBeDisabled();

      rerender(<FractionButtons {...defaultProps} walletsReady={true} />);

      expect(button).not.toBeDisabled();
      await user.click(button);
      expect(mockHandleFractionClick).toHaveBeenCalledWith(0.25);
    });
  });
});
