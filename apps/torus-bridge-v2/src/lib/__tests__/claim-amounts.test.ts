import {
  getNativeWithdrawAmount,
  MIN_NATIVE_WITHDRAW_AMOUNT,
  shouldOfferNativeWithdrawal,
  WITHDRAW_GAS_BUFFER,
} from "~/lib/claim-amounts";
import { describe, expect, it } from "vitest";

describe("claim amounts", () => {
  it("reserves gas before computing the native withdrawal amount", () => {
    expect(getNativeWithdrawAmount(WITHDRAW_GAS_BUFFER)).toBe(0n);
    expect(getNativeWithdrawAmount(WITHDRAW_GAS_BUFFER + 1n)).toBe(1n);
  });

  it("offers native withdrawal only above the minimum withdrawable amount", () => {
    expect(
      shouldOfferNativeWithdrawal(
        WITHDRAW_GAS_BUFFER + MIN_NATIVE_WITHDRAW_AMOUNT,
      ),
    ).toBe(false);
    expect(
      shouldOfferNativeWithdrawal(
        WITHDRAW_GAS_BUFFER + MIN_NATIVE_WITHDRAW_AMOUNT + 1n,
      ),
    ).toBe(true);
  });
});
