import { BigNumber } from "bignumber.js";
import { describe, expect, it } from "vitest";

import {
  DECIMALS,
  formatToken,
  fromRems,
  makeTorAmount,
  toRems,
} from "../torus/index.js";

describe("TorAmount", () => {
  it("should correctly apply ROUND_HALF_EVEN (banker's rounding)", () => {
    // Banker's rounding test cases for TorAmount
    // When the fraction is exactly 0.5, it rounds to the nearest even number

    // Value ending with .5 where preceding digit is even (2)
    const value2_5 = makeTorAmount("2.5");
    expect(value2_5.integerValue().toString()).toBe("2"); // Rounds to even (2)

    // Value ending with .5 where preceding digit is odd (3)
    const value3_5 = makeTorAmount("3.5");
    expect(value3_5.integerValue().toString()).toBe("4"); // Rounds to even (4)

    // More examples of banker's rounding
    expect(makeTorAmount("4.5").integerValue().toString()).toBe("4"); // Rounds to even (4)
    expect(makeTorAmount("5.5").integerValue().toString()).toBe("6"); // Rounds to even (6)

    // Testing with financial examples
    // A financial system that uses banker's rounding to avoid bias
    const transactions = [
      makeTorAmount("10.5"), // Rounds to 10
      makeTorAmount("11.5"), // Rounds to 12
      makeTorAmount("12.5"), // Rounds to 12
      makeTorAmount("13.5"), // Rounds to 14
    ];

    // Sum would be 48 with banker's rounding (10 + 12 + 12 + 14)
    const total = transactions.reduce(
      (acc, val) => acc.plus(val.integerValue()),
      makeTorAmount(0),
    );

    expect(total.toString()).toBe("48");

    // Using a different rounding mode would give 50 (ROUND_HALF_UP would round all to higher)
    const roundUpTotal = transactions.reduce(
      (acc, val) => acc.plus(val.integerValue(BigNumber.ROUND_HALF_UP)),
      makeTorAmount(0),
    );

    expect(roundUpTotal.toString()).toBe("50");
  });

  it("should properly handle DECIMALS in TorAmount", () => {
    // Verify the DECIMALS is correctly set to 18
    expect(DECIMALS).toBe(18);

    // Test that TorAmount preserves full precision with 18 decimal places
    const smallValue = makeTorAmount("0.000000000000000001"); // 1 at the 18th decimal place
    // Always use toFixed with full precision (18 decimals) to ensure deterministic output
    expect(smallValue.toFixed(18)).toBe("0.000000000000000001");

    // Test operations maintain precision
    const a = makeTorAmount("1.000000000000000001");
    const b = makeTorAmount("2.000000000000000002");
    const sum = a.plus(b);

    // Use toFixed with the full precision to ensure deterministic results
    // Mathematical operation should result in 3.000000000000000003
    expect(sum.toFixed(18)).toBe("3.000000000000000003");

    // Alternative: If we need to test a specific numeric value without string representation issues,
    // we can test a computation that gives a known result
    expect(sum.minus(a).eq(b)).toBe(true); // sum - a should equal b

    // Test with standard financial values (2 decimal places)
    const price = makeTorAmount("123.45");
    expect(price.toFixed(2)).toBe("123.45");

    // Test rounding behavior with decimals
    expect(makeTorAmount("0.1234567890123456789").toFixed(10)).toBe(
      "0.1234567890",
    );
  });

  it("should correctly convert between Rems and TorAmount", () => {
    // Test toRems function (standard units to Rems)
    expect(toRems(makeTorAmount("1")).toString()).toBe("1000000000000000000");
    expect(toRems(makeTorAmount("0.5")).toString()).toBe("500000000000000000");
    expect(toRems(makeTorAmount("0.000000000000000001")).toString()).toBe("1");

    // Test fromRems function (Rems to standard units)
    const oneToken = fromRems(1000000000000000000n);
    // Test the string representation of 1 token
    const oneTokenStr = oneToken.toString();
    expect(oneTokenStr).toBe("1");

    const halfToken = fromRems(500000000000000000n);
    const halfTokenStr = halfToken.toString();
    expect(halfTokenStr).toBe("0.5");

    const oneRem = fromRems(1n);
    // The system represents extremely small values in scientific notation
    expect(oneRem.toString()).toBe("1e-18");

    // Test roundtrip conversions
    const originalValue = makeTorAmount("123.456789");
    const remsValue = toRems(originalValue);
    const roundTrip = fromRems(remsValue);
    // Comparing TorAmount objects
    expect(roundTrip.toString()).toBe(originalValue.toString());

    // Test with negative values
    const negativeValue = fromRems(-1000000000000000000n);
    expect(negativeValue.toString()).toBe("-1");
  });

  it("should handle operations with small fractional values (1 Rem)", () => {
    // 1 Rem is the smallest unit (10^-18 TORUS)
    const oneRem = fromRems(1n); // 0.000000000000000001 TORUS

    // The system represents extremely small values in scientific notation
    expect(oneRem.toString()).toBe("1e-18");

    // Addition of small values
    const slightlyMore = oneRem.plus(oneRem);
    // Adding two small values produces a value with the same order of magnitude
    expect(slightlyMore.toString()).toBe("2e-18");

    // Converting back to rems
    const slightlyMoreRems = toRems(slightlyMore);
    expect(slightlyMoreRems.toString()).toBe("2");

    // Addition of small value to larger value
    const oneToken = makeTorAmount("1");
    const oneTokenPlusRem = oneToken.plus(oneRem);
    // When adding a small value to a large value, full precision is maintained
    expect(oneTokenPlusRem.toString()).toBe("1.000000000000000001");

    // Converting to rems should give precise value
    expect(toRems(oneTokenPlusRem).toString()).toBe("1000000000000000001");

    // Subtraction with small values
    const verySmallDiff = oneTokenPlusRem.minus(oneToken);
    // Subtracting to get a small value results in scientific notation
    expect(verySmallDiff.toString()).toBe("1e-18");

    expect(toRems(verySmallDiff).toString()).toBe("1");

    // Multiplication with small values
    const remTimes2 = oneRem.multipliedBy(makeTorAmount("2"));
    // Multiplying a small value maintains scientific notation
    expect(remTimes2.toString()).toBe("2e-18");

    // Division with small values
    const halfRem = oneRem.dividedBy(makeTorAmount("2"));
    // Dividing a small value may result in zero representation due to precision limits
    expect(halfRem.toString()).toBe("0");

    // Expected behavior for bigint conversion (should be 0)
    const halfRemBigint = toRems(halfRem);
    expect(halfRemBigint.toString()).toBe("0");

    // Testing precision limits - accumulate many small values
    let accumulated = makeTorAmount("0");
    for (let i = 0; i < 1000; i++) {
      accumulated = accumulated.plus(oneRem);
    }

    const accumulatedBigint = toRems(accumulated);
    expect(accumulatedBigint.toString()).toBe("1000");

    // After adding 1000 small values, scientific notation is used
    expect(accumulated.toString()).toBe("1e-15");
  });

  it("should handle rounding behavior with small fractional values", () => {
    // Create values that are fractions of a Rem
    const oneRem = fromRems(1n); // 0.000000000000000001 TORUS

    // Test 18 decimal place precision
    const oneRemFixed = oneRem.toFixed(18);
    expect(oneRemFixed).toBe("0.000000000000000001");

    // When working with half a Rem
    const pointFiveRem = oneRem.dividedBy(makeTorAmount("2"));
    const pointFiveRemStr = pointFiveRem.toString();
    // Half a Rem is too small to represent in standard notation
    expect(pointFiveRemStr).toBe("0");

    // Testing banker's rounding with values close to 1
    const justBelow1 = makeTorAmount("0.9999999999999999995");
    const justAbove1 = makeTorAmount("1.0000000000000000005");

    // Using banker's rounding (ROUND_HALF_EVEN)
    const roundedBelow = justBelow1.integerValue().toString();
    const roundedAbove = justAbove1.integerValue().toString();

    // Values very close to but not exactly at the midpoint should round normally
    expect(roundedBelow).toBe("1");
    expect(roundedAbove).toBe("1");

    // Test specific handling of half-values to nearest even with banker's rounding
    const twoPointFive = makeTorAmount("2.5");
    const threePointFive = makeTorAmount("3.5");

    // With banker's rounding, 2.5 should round to 2 (even), and 3.5 should round to 4 (even)
    const twoPointFiveRounded = twoPointFive.integerValue().toString();
    const threePointFiveRounded = threePointFive.integerValue().toString();

    expect(twoPointFiveRounded).toBe("2"); // Rounds to even (2)
    expect(threePointFiveRounded).toBe("4"); // Rounds to even (4)

    // Test multiple half-rem additions to see accumulated rounding effect
    let sum = makeTorAmount("0");
    for (let i = 0; i < 10; i++) {
      sum = sum.plus(pointFiveRem);
    }

    const sumRems = toRems(sum);
    // Since each half-rem is too small to represent and rounds to 0,
    // The sum of 10 should still be 0
    expect(sumRems.toString()).toBe("0");
  });

  it("should format token amounts correctly", () => {
    // Test formatToken function with various inputs using bigint literals
    expect(formatToken(1000000000000000000n)).toBe("1.00");
    expect(formatToken(1230000000000000000n)).toBe("1.23");
    expect(formatToken(1234500000000000000n)).toBe("1.23");

    // Test with higher precision (3 decimal places)
    const threeDecimalFormatted = formatToken(1234500000000000000n, 3);
    expect(threeDecimalFormatted).toBe("1.234");

    // Test with larger values to ensure thousands separators work
    const largeTokenAmount = formatToken(1234567890000000000000n);
    expect(largeTokenAmount).toBe("1,234.56");

    // Test with very small values
    expect(formatToken(1000000000000000n)).toBe("0.00");
    expect(formatToken(1000000000000000n, 4)).toBe("0.0010");
  });
});
