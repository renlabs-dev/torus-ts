/**
 * Tests for legacy token utility functions.
 * 
 * These functions are deprecated and have several known issues documented here.
 * They are maintained only for backward compatibility.
 * 
 * ## Known Issues and Behaviors
 * 
 * ### `toNano(standardValue: number | string): bigint`
 * - Converts standard token units to nano units (smallest unit)
 * - 1 token = 10^18 nano units
 * - Does NOT truncate decimals beyond 18 places - it keeps all digits
 * - Scientific notation in strings (e.g., "1e18") will fail because it becomes "1e18000..."
 * - Handles floating point precision issues poorly (e.g., 0.1 + 0.2 !== 0.3)
 * 
 * ### `fromNano(nanoValue: number | string | bigint, roundingDecimals = 18): string`
 * - Converts nano units back to standard token units as a string
 * - Always returns full decimal precision (18 places by default)
 * - **BUG**: Negative values are handled incorrectly due to faulty modulo arithmetic
 *   - Example: fromNano(-1n) returns "0.999999999999999999" instead of "-0.000000000000000001"
 *   - Example: fromNano(-500000000000000000n) returns "0.500000000000000000" instead of "-0.500000000000000000"
 *   - Only works correctly for negative values that are exact multiples of 10^18
 * 
 * ### `formatToken(nano: number | bigint, decimalPlaces = 2): string`
 * - Formats nano units as human-readable string with thousand separators
 * - **TRUNCATES** decimal places, does NOT round (even banker's rounding)
 *   - Example: formatToken(1235500000000000000n, 2) returns "1.23" not "1.24"
 * - Inherits the negative number bugs from `fromNano`
 * - Always pads decimal places with zeros to match requested precision
 * 
 * ## Migration Guide
 * 
 * Users should migrate to the new functions:
 * - `toNano` → `toRems` with `TorAmount` type
 * - `fromNano` → `fromRems` with proper negative handling
 * - `formatToken` → `formatTorusToken` with proper rounding
 */
import { describe, expect, it } from "vitest";

import { formatToken, fromNano, toNano } from "./legacy.js";

describe("legacy token utilities", () => {
  describe("toNano", () => {
    it("converts whole numbers correctly", () => {
      expect(toNano("0")).toBe(0n);
      expect(toNano("1")).toBe(1000000000000000000n);
      expect(toNano("100")).toBe(100000000000000000000n);
      expect(toNano("999")).toBe(999000000000000000000n);
    });

    it("converts decimal numbers correctly", () => {
      expect(toNano("0.1")).toBe(100000000000000000n);
      expect(toNano("0.5")).toBe(500000000000000000n);
      expect(toNano("0.999")).toBe(999000000000000000n);
      expect(toNano("1.5")).toBe(1500000000000000000n);
      expect(toNano("123.456")).toBe(123456000000000000000n);
    });

    it("handles maximum precision (18 decimals)", () => {
      expect(toNano("0.000000000000000001")).toBe(1n);
      expect(toNano("0.123456789012345678")).toBe(123456789012345678n);
      expect(toNano("1.123456789012345678")).toBe(1123456789012345678n);
    });

    it("pads decimals when less than 18 places", () => {
      // When input has more than 18 decimal places, all digits are kept (padEnd doesn't truncate)
      expect(toNano("0.1234567890123456789")).toBe(1234567890123456789n);
      expect(toNano("0.0000000000000000019")).toBe(19n);
    });

    it("handles very large numbers", () => {
      expect(toNano("1000000")).toBe(1000000000000000000000000n);
      expect(toNano("999999999")).toBe(999999999000000000000000000n);
    });

    it("handles number inputs", () => {
      expect(toNano(0)).toBe(0n);
      expect(toNano(1)).toBe(1000000000000000000n);
      expect(toNano(0.5)).toBe(500000000000000000n);
      expect(toNano(123.456)).toBe(123456000000000000000n);
    });

    it("handles negative numbers", () => {
      expect(toNano("-1")).toBe(-1000000000000000000n);
      expect(toNano("-0.5")).toBe(-500000000000000000n);
      expect(toNano("-123.456")).toBe(-123456000000000000000n);
    });

    it("handles edge cases", () => {
      expect(toNano("0.0")).toBe(0n);
      expect(toNano(".5")).toBe(500000000000000000n);
      expect(toNano("00001")).toBe(1000000000000000000n);
      expect(toNano("001.100")).toBe(1100000000000000000n);
    });

    it("handles invalid inputs by parsing what it can", () => {
      // toNano uses toString().split(".") so it will parse what it can
      expect(toNano("")).toBe(0n);
      // Special number values convert to strings first
      expect(() => toNano(NaN)).toThrow(); // "NaN" cannot be parsed as BigInt
    });
  });

  describe("fromNano", () => {
    it("converts whole token amounts with full precision", () => {
      // fromNano always returns full 18 decimal places by default
      expect(fromNano(0n)).toBe("0.000000000000000000");
      expect(fromNano(1000000000000000000n)).toBe("1.000000000000000000");
      expect(fromNano(100000000000000000000n)).toBe("100.000000000000000000");
      expect(fromNano(999000000000000000000n)).toBe("999.000000000000000000");
    });

    it("converts fractional amounts with full precision", () => {
      expect(fromNano(100000000000000000n)).toBe("0.100000000000000000");
      expect(fromNano(500000000000000000n)).toBe("0.500000000000000000");
      expect(fromNano(999000000000000000n)).toBe("0.999000000000000000");
      expect(fromNano(1500000000000000000n)).toBe("1.500000000000000000");
      expect(fromNano(123456000000000000000n)).toBe("123.456000000000000000");
    });

    it("handles minimum units correctly", () => {
      expect(fromNano(1n)).toBe("0.000000000000000001");
      expect(fromNano(10n)).toBe("0.000000000000000010");
      expect(fromNano(100n)).toBe("0.000000000000000100");
    });

    it("preserves all 18 decimal places", () => {
      expect(fromNano(123456789012345678n)).toBe("0.123456789012345678");
      expect(fromNano(1123456789012345678n)).toBe("1.123456789012345678");
    });

    it("handles very large amounts", () => {
      expect(fromNano(1000000000000000000000000n)).toBe("1000000.000000000000000000");
      expect(fromNano(999999999000000000000000000n)).toBe("999999999.000000000000000000");
    });

    it("handles negative amounts", () => {
      // The mod function in fromNano has a bug with negative values
      expect(fromNano(-1000000000000000000n)).toBe("-1.000000000000000000");
      expect(fromNano(-500000000000000000n)).toBe("0.500000000000000000"); // Bug: should be -0.5
      expect(fromNano(-123456000000000000000n)).toBe("-123.544000000000000000"); // Bug: should be -123.456
      expect(fromNano(-1n)).toBe("0.999999999999999999"); // Bug: should be -0.000000000000000001
    });

    it("always shows full precision with trailing zeros", () => {
      expect(fromNano(1000000000000000000n)).toBe("1.000000000000000000");
      expect(fromNano(1100000000000000000n)).toBe("1.100000000000000000");
      expect(fromNano(1010000000000000000n)).toBe("1.010000000000000000");
      expect(fromNano(1001000000000000000n)).toBe("1.001000000000000000");
    });

    it("handles complex fractional amounts", () => {
      expect(fromNano(123456789123456789n)).toBe("0.123456789123456789");
      expect(fromNano(100000000000000001n)).toBe("0.100000000000000001");
      expect(fromNano(999999999999999999n)).toBe("0.999999999999999999");
    });

    it("supports custom rounding decimals", () => {
      expect(fromNano(1234567890123456789n, 0)).toBe("1.");
      expect(fromNano(1234567890123456789n, 1)).toBe("1.2");
      expect(fromNano(1234567890123456789n, 5)).toBe("1.23456");
      expect(fromNano(1234567890123456789n, 10)).toBe("1.2345678901");
    });
  });

  describe("formatToken", () => {
    it("formats whole number amounts", () => {
      expect(formatToken(0n)).toBe("0.00");
      expect(formatToken(1000000000000000000n)).toBe("1.00");
      expect(formatToken(100000000000000000000n)).toBe("100.00");
      expect(formatToken(1234000000000000000000n)).toBe("1,234.00");
    });

    it("formats decimal amounts with default 2 decimal places", () => {
      expect(formatToken(100000000000000000n)).toBe("0.10");
      expect(formatToken(500000000000000000n)).toBe("0.50");
      expect(formatToken(1500000000000000000n)).toBe("1.50");
      expect(formatToken(123456000000000000000n)).toBe("123.45");
    });

    it("formats with custom decimal places", () => {
      expect(formatToken(123456789012345678n, 0)).toBe("0.");
      expect(formatToken(123456789012345678n, 1)).toBe("0.1");
      expect(formatToken(123456789012345678n, 4)).toBe("0.1234");
      expect(formatToken(123456789012345678n, 18)).toBe("0.123456789012345678");
    });

    it("does NOT round - it truncates", () => {
      expect(formatToken(1234500000000000000n)).toBe("1.23");
      expect(formatToken(1235500000000000000n)).toBe("1.23");
      expect(formatToken(1239999999999999999n)).toBe("1.23");
      expect(formatToken(9999999999999999999n)).toBe("9.99");
      expect(formatToken(999949999999999999999n)).toBe("999.94");
    });

    it("adds thousand separators", () => {
      expect(formatToken(1000000000000000000000n)).toBe("1,000.00");
      expect(formatToken(1234567890000000000000000n)).toBe("1,234,567.89");
      expect(formatToken(999999999000000000000000000n)).toBe("999,999,999.00");
    });

    it("handles negative amounts", () => {
      expect(formatToken(-1000000000000000000n)).toBe("-1.00");
      expect(formatToken(-1234567890000000000000n)).toBe("-1,234.43");
      expect(formatToken(-500000000000000000n)).toBe("0.50"); // Bug: should be -0.50
    });

    it("handles zero with different decimal places", () => {
      expect(formatToken(0n, 0)).toBe("0.");
      expect(formatToken(0n, 2)).toBe("0.00");
      expect(formatToken(0n, 5)).toBe("0.00000");
    });

    it("handles very small amounts", () => {
      expect(formatToken(1n)).toBe("0.00");
      expect(formatToken(1n, 18)).toBe("0.000000000000000001");
      expect(formatToken(999n, 15)).toBe("0.000000000000000");
    });

    it("handles maximum safe integer range", () => {
      const maxSafeBigInt =
        BigInt(Number.MAX_SAFE_INTEGER) * 1000000000000000000n;
      const result = formatToken(maxSafeBigInt);
      expect(result).toMatch(/^9,007,199,254,740,991\.00$/);
    });

    it("formats edge cases correctly", () => {
      expect(formatToken(999999999999999999n)).toBe("0.99");
      expect(formatToken(999499999999999999n)).toBe("0.99");
      expect(formatToken(999400000000000000n)).toBe("0.99");
      expect(formatToken(500000000000000000n, 0)).toBe("0.");
      expect(formatToken(499999999999999999n, 0)).toBe("0.");
    });

    it("handles rounding vs truncation edge cases", () => {
      // formatToken truncates, not rounds
      expect(formatToken(1999999999999999999n, 1)).toBe("1.9");
      expect(formatToken(1999999999999999999n, 0)).toBe("1.");
      expect(formatToken(999999999999999999n, 0)).toBe("0.");
      expect(formatToken(9999999999999999999n, 1)).toBe("9.9");
    });
  });

  describe("round-trip conversions", () => {
    it("maintains precision for whole numbers", () => {
      // Note: fromNano adds full decimal precision
      expect(fromNano(toNano("0"))).toBe("0.000000000000000000");
      expect(fromNano(toNano("1"))).toBe("1.000000000000000000");
      expect(fromNano(toNano("100"))).toBe("100.000000000000000000");
      expect(fromNano(toNano("999999"))).toBe("999999.000000000000000000");
    });

    it("maintains precision for decimals within 18 places", () => {
      expect(fromNano(toNano("0.1"))).toBe("0.100000000000000000");
      expect(fromNano(toNano("0.123456789012345678"))).toBe("0.123456789012345678");
      expect(fromNano(toNano("123.456789012345678"))).toBe("123.456789012345678000");
      expect(fromNano(toNano("999.999999999999999"))).toBe("999.999999999999999000");
    });

    it("handles formatting round-trips", () => {
      const testCases = [
        { nano: 1000000000000000000n, decimals: 0, expected: "1." },
        { nano: 1500000000000000000n, decimals: 1, expected: "1.5" },
        { nano: 1234567890000000000000n, decimals: 2, expected: "1,234.56" },
      ];

      for (const { nano, decimals, expected } of testCases) {
        expect(formatToken(nano, decimals)).toBe(expected);
      }
    });

    it("demonstrates precision loss with fromNano custom decimals", () => {
      const original = "1.123456789012345678";
      const nano = toNano(original);
      
      // Full precision is maintained
      expect(fromNano(nano)).toBe("1.123456789012345678");
      
      // Custom decimal places truncate
      expect(fromNano(nano, 5)).toBe("1.12345");
      expect(fromNano(nano, 10)).toBe("1.1234567890");
    });
  });

  describe("error handling and edge cases", () => {
    it("toNano handles empty and invalid string inputs", () => {
      expect(toNano("")).toBe(0n);
      expect(() => toNano("abc")).toThrow(); // BigInt cannot parse "abc000..."
      expect(toNano("1.2.3")).toBe(1200000000000000000n); // Only first decimal is used
    });

    it("handles special numeric values", () => {
      expect(() => toNano(Infinity)).toThrow(); // "Infinity" cannot be parsed as BigInt
      expect(() => toNano(-Infinity)).toThrow();
      expect(() => toNano(NaN)).toThrow(); // "NaN" cannot be parsed as BigInt
    });

    it("handles floating point precision issues", () => {
      // JavaScript floating point precision can cause issues
      expect(toNano(0.1 + 0.2)).toBe(300000000000000040n); // Not exactly 0.3!
      expect(toNano("0.3")).toBe(300000000000000000n); // String input is precise
    });

    it("handles extremely large values", () => {
      const hugeValue = "999999999999999999999999999999999999";
      const hugeNano = toNano(hugeValue);
      expect(hugeNano).toBe(BigInt(hugeValue + "0".repeat(18)));
      
      // fromNano handles it correctly
      expect(fromNano(hugeNano)).toBe(hugeValue + ".000000000000000000");
    });

    it("handles precision edge cases in formatToken", () => {
      // Very small amounts with large decimal places
      expect(formatToken(123n, 10)).toBe("0.0000000000");
      expect(formatToken(123n, 3)).toBe("0.000");
      
      // Boundary values
      expect(formatToken(999n, 3)).toBe("0.000");
      expect(formatToken(1000n, 3)).toBe("0.000");
    });

    it("handles negative zero edge case", () => {
      expect(formatToken(-0n)).toBe("0.00");
      expect(fromNano(-0n)).toBe("0.000000000000000000");
      expect(toNano("-0")).toBe(0n);
    });
  });

  describe("advanced edge cases and rounding behavior", () => {
    it("demonstrates formatToken always truncates, never rounds", () => {
      // Even when the next digit is 9, it still truncates
      expect(formatToken(1999999999999999999n, 0)).toBe("1.");
      expect(formatToken(1999999999999999999n, 1)).toBe("1.9");
      expect(formatToken(1999999999999999999n, 2)).toBe("1.99");
      
      // Banker's rounding would round 0.5 to nearest even, but formatToken truncates
      expect(formatToken(1500000000000000000n, 0)).toBe("1.");
      expect(formatToken(2500000000000000000n, 0)).toBe("2.");
      expect(formatToken(3500000000000000000n, 0)).toBe("3.");
    });

    it("handles decimal places larger than 18", () => {
      // When decimal places > 18, it pads the fractional part to match
      expect(formatToken(123n, 20)).toBe("0.00000000000000012300");
      expect(formatToken(1n, 25)).toBe("0.0000000000000000010000000");
    });

    it("handles scientific notation edge cases", () => {
      // Scientific notation is converted to string first, which results in unexpected behavior
      expect(() => toNano("1e-18")).toThrow(); // "1e-18" becomes "1e-18000..." which can't be parsed
      
      // Large scientific notation also fails when the exponent is too large
      expect(() => toNano("1e1")).toThrow(); // "1e1" becomes "1e1000..." which can't be parsed
      expect(toNano(1e1)).toBe(10000000000000000000n); // But number 10 works
      expect(toNano(1e2)).toBe(100000000000000000000n); // Number 100 works
      expect(toNano(1.23e2)).toBe(123000000000000000000n); // Number 123 works
    });

    it("handles decimal truncation in toNano", () => {
      // toNano doesn't truncate - it keeps all digits after decimal when using padEnd
      expect(toNano("0.123456789012345678901234567890")).toBe(123456789012345678901234567890n);
      expect(toNano("0.999999999999999999999999999999")).toBe(999999999999999999999999999999n);
    });

    it("handles modulo arithmetic correctly in fromNano", () => {
      // The mod function in fromNano has bugs with negative values
      expect(fromNano(-1n)).toBe("0.999999999999999999"); // Bug
      expect(fromNano(-1000000000000000000n)).toBe("-1.000000000000000000"); // Works for exact multiples
      expect(fromNano(-1234567890123456789n)).toBe("-1.765432109876543211"); // Bug
    });

    it("handles formatToken with number input", () => {
      // formatToken accepts number input too
      expect(formatToken(1000000000000000000)).toBe("1.00");
      expect(formatToken(0)).toBe("0.00");
    });

    it("verifies exact truncation boundaries", () => {
      // Test exact boundaries where truncation happens
      expect(formatToken(1234999999999999999n, 2)).toBe("1.23"); // Not 1.24
      expect(formatToken(1235000000000000000n, 2)).toBe("1.23"); // Not 1.24
      expect(formatToken(1235999999999999999n, 2)).toBe("1.23"); // Not 1.24
      expect(formatToken(1236000000000000000n, 2)).toBe("1.23"); // Not 1.24
    });
  });
});