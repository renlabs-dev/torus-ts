import { BigNumber } from "bignumber.js";
import { describe, expect, expectTypeOf, it } from "vitest";

import { BigNumberBrand, buildTaggedBigNumberClass } from "../bignumber.js";

/**
 * BigNumber Test Suite
 *
 * Testing guidelines:
 * 1. Always use deterministic assertions - avoid regex or OR conditions
 * 2. Always use toFixed(n) with explicit precision for string representations
 * 3. Test with diverse fractional inputs to ensure broad coverage
 * 4. Different rounding modes have specific behaviors, especially with negative numbers:
 *    - ROUND_UP: Rounds away from zero (-3.5 → -4, 3.5 → 4)
 *    - ROUND_DOWN: Rounds towards zero (-3.5 → -3, 3.5 → 3)
 *    - ROUND_CEIL: Rounds toward positive infinity (-3.5 → -3, 3.5 → 4)
 *    - ROUND_FLOOR: Rounds toward negative infinity (-3.5 → -4, 3.5 → 3)
 */

describe("BigNumberBrand", () => {
  it("should create a branded BigNumber instance with various input types", () => {
    // Integer input
    const bnInt = BigNumberBrand.from<"Test">(100, BigNumber);
    expect(bnInt.value.toString()).toBe("100");
    expect(bnInt.value).toBeInstanceOf(BigNumber);

    // Fractional input
    const bnFraction = BigNumberBrand.from<"Test">(123.456, BigNumber);
    expect(bnFraction.toFixed(3)).toBe("123.456");

    // String input with fraction
    const bnStringFraction = BigNumberBrand.from<"Test">(
      "987.654321",
      BigNumber,
    );
    expect(bnStringFraction.toFixed(6)).toBe("987.654321");

    // Very small fractional value
    const bnSmallFraction = BigNumberBrand.from<"Test">(0.0000123, BigNumber);
    expect(bnSmallFraction.toFixed(7)).toBe("0.0000123");
  });

  it("should accept bigint and other numeric types when creating instance", () => {
    // Bigint input
    const bigintValue = 1000n;
    const bnBigInt = BigNumberBrand.from<"Test">(bigintValue, BigNumber);
    expect(bnBigInt.toFixed(0)).toBe("1000");

    // Mixed fractional bigint (via string conversion)
    const mixedBigIntValue = "12345.6789";
    const bnMixed = BigNumberBrand.from<"Test">(mixedBigIntValue, BigNumber);
    expect(bnMixed.toFixed(4)).toBe("12345.6789");
  });

  it("should wrap BigNumber values correctly", () => {
    const bn = BigNumberBrand.from<"Test">(100, BigNumber);
    const wrappedBn = bn._wrap(new BigNumber(200));
    expect(wrappedBn.value.toString()).toBe("200");
    expect(wrappedBn).toBeInstanceOf(BigNumberBrand);
  });

  it("should delegate arithmetic operations to the underlying BigNumber with fractional values", () => {
    const a = BigNumberBrand.from<"Test">(100.25, BigNumber);
    const b = BigNumberBrand.from<"Test">(50.5, BigNumber);

    // Addition with fractions
    const sum = a.plus(b);
    expect(sum.toFixed(2)).toBe("150.75");

    // Addition with very small fractions
    const c = BigNumberBrand.from<"Test">(0.3333, BigNumber);
    const d = BigNumberBrand.from<"Test">(0.6667, BigNumber);
    expect(c.plus(d).toFixed(4)).toBe("1.0000");

    // Subtraction with fractions
    const diff = a.minus(b);
    expect(diff.toFixed(2)).toBe("49.75");

    // Subtraction resulting in negative fraction
    const negDiff = b.minus(a);
    expect(negDiff.toFixed(2)).toBe("-49.75");

    // Multiplication with fractions
    const product = a.multipliedBy(b);
    expect(product.toFixed(2)).toBe("5062.63");

    // Multiplication with small fractions
    const e = BigNumberBrand.from<"Test">(0.1, BigNumber);
    const f = BigNumberBrand.from<"Test">(0.2, BigNumber);
    expect(e.multipliedBy(f).toFixed(2)).toBe("0.02");

    // Division with fractions
    const quotient = a.dividedBy(b);
    expect(quotient.toFixed(4)).toBe("1.9851");

    // Division resulting in repeating decimal
    const g = BigNumberBrand.from<"Test">(1, BigNumber);
    const h = BigNumberBrand.from<"Test">(3, BigNumber);
    expect(g.dividedBy(h).toFixed(4)).toBe("0.3333");

    // Division by very small number
    const i = BigNumberBrand.from<"Test">(1, BigNumber);
    const j = BigNumberBrand.from<"Test">(0.001, BigNumber);
    expect(i.dividedBy(j).toFixed(0)).toBe("1000");
  });

  it("should handle comparison operations correctly with fractional values", () => {
    const a = BigNumberBrand.from<"Test">(100.5, BigNumber);
    const b = BigNumberBrand.from<"Test">(50.75, BigNumber);
    const c = BigNumberBrand.from<"Test">(100.5, BigNumber);
    const d = BigNumberBrand.from<"Test">(100.499, BigNumber);

    // Compare different values
    expect(a.isEqualTo(b)).toBe(false);
    expect(a.isEqualTo(c)).toBe(true);

    // Compare with tiny differences
    expect(a.isEqualTo(d)).toBe(false);
    expect(d.isLessThan(a)).toBe(true);
    expect(a.isGreaterThan(d)).toBe(true);

    // Test with negative values
    const negA = BigNumberBrand.from<"Test">(-50.5, BigNumber);
    const negB = BigNumberBrand.from<"Test">(-100.5, BigNumber);
    expect(negA.isGreaterThan(negB)).toBe(true); // -50.5 > -100.5
    expect(negB.isLessThan(negA)).toBe(true); // -100.5 < -50.5

    // Standard comparisons
    expect(a.isGreaterThan(b)).toBe(true);
    expect(b.isLessThan(a)).toBe(true);

    // Fractional values close to zero
    const smallPositive = BigNumberBrand.from<"Test">(0.0001, BigNumber);
    const smallNegative = BigNumberBrand.from<"Test">(-0.0001, BigNumber);
    expect(smallPositive.isGreaterThan(smallNegative)).toBe(true);
  });

  it("should preserve the value formatting", () => {
    const bn = BigNumberBrand.from<"Test">(12345.6789, BigNumber);
    expect(bn.toFixed(2)).toBe("12345.68");
    expect(bn.toString()).toBe("12345.6789");
  });

  it("should maintain brand type through all operations", () => {
    const a = BigNumberBrand.from<"Test">(100, BigNumber);
    const b = BigNumberBrand.from<"Test">(50, BigNumber);

    // Check that each operation returns a branded type
    expectTypeOf(a.plus(b)).toMatchTypeOf<BigNumberBrand<"Test">>();
    expectTypeOf(a.minus(b)).toMatchTypeOf<BigNumberBrand<"Test">>();
    expectTypeOf(a.multipliedBy(b)).toMatchTypeOf<BigNumberBrand<"Test">>();
    expectTypeOf(a.dividedBy(b)).toMatchTypeOf<BigNumberBrand<"Test">>();

    // Using aliases should also return branded types
    expectTypeOf(a.times(b)).toMatchTypeOf<BigNumberBrand<"Test">>();
    expectTypeOf(a.div(b)).toMatchTypeOf<BigNumberBrand<"Test">>();

    // Advanced math operations
    expectTypeOf(a.pow(2)).toMatchTypeOf<BigNumberBrand<"Test">>();
    expectTypeOf(a.sqrt()).toMatchTypeOf<BigNumberBrand<"Test">>();
    expectTypeOf(a.abs()).toMatchTypeOf<BigNumberBrand<"Test">>();

    // Check that comparisons return boolean
    expectTypeOf(a.isEqualTo(b)).toBeBoolean();
    expectTypeOf(a.gt(b)).toBeBoolean();
  });

  it("should handle edge cases properly", () => {
    // Test with zero
    const zero = BigNumberBrand.from<"Test">(0, BigNumber);
    expect(zero.isZero()).toBe(true);

    // Test with negative numbers
    const negative = BigNumberBrand.from<"Test">(-100, BigNumber);
    expect(negative.isNegative()).toBe(true);
    expect(negative.abs().isPositive()).toBe(true);

    // Test with very large numbers
    const large = BigNumberBrand.from<"Test">(1e20, BigNumber);
    expect(
      large.isGreaterThan(BigNumberBrand.from<"Test">(1e10, BigNumber)),
    ).toBe(true);

    // Test with very small numbers
    const small = BigNumberBrand.from<"Test">(1e-10, BigNumber);
    expect(small.isLessThan(BigNumberBrand.from<"Test">(1, BigNumber))).toBe(
      true,
    );
  });

  it("should handle invalid inputs appropriately", () => {
    // NaN behavior
    const nan = BigNumberBrand.from<"Test">(NaN, BigNumber);
    expect(nan.isNaN()).toBe(true);

    // Division by zero
    const result = BigNumberBrand.from<"Test">(1, BigNumber).dividedBy(
      BigNumberBrand.from<"Test">(0, BigNumber),
    );
    // Depending on BigNumber.js configuration, this might be Infinity
    expect(result.isFinite()).toBe(false);
  });

  it("should handle fractional values correctly", () => {
    // Create fractional values
    const half = BigNumberBrand.from<"Test">(0.5, BigNumber);
    const threeQuarters = BigNumberBrand.from<"Test">(0.75, BigNumber);
    const oneThird = BigNumberBrand.from<"Test">(1 / 3, BigNumber);
    const piApprox = BigNumberBrand.from<"Test">(3.14159, BigNumber);

    // Test precision
    expect(half.toString()).toBe("0.5");
    expect(threeQuarters.toString()).toBe("0.75");
    expect(oneThird.toString()).toBe("0.3333333333333333");
    expect(piApprox.toString()).toBe("3.14159");

    // Test arithmetic operations with fractions
    const sum = half.plus(threeQuarters);
    expect(sum.toString()).toBe("1.25");

    const product = half.multipliedBy(threeQuarters);
    expect(product.toString()).toBe("0.375");

    // Test division with fractions
    const quotient = oneThird.dividedBy(half);
    expect(quotient.toString()).toBe("0.6666666666666666");

    // Test rounding
    expect(piApprox.integerValue().toString()).toBe("3");
    expect(piApprox.integerValue(BigNumber.ROUND_CEIL).toString()).toBe("4");

    // Test decimal places
    expect(piApprox.toFixed(2)).toBe("3.14");
    expect(oneThird.toFixed(4)).toBe("0.3333");

    // Test very small fractions
    const small = BigNumberBrand.from<"Test">(0.0000001, BigNumber);
    // Instead of using toString() which can produce different formats,
    // always use toFixed() with appropriate precision to ensure consistent output
    expect(small.toFixed(7)).toBe("0.0000001");
    expect(small.shiftedBy(7).toFixed(0)).toBe("1");

    // This makes the test deterministic without relying on the default toString() behavior
  });

  it("should handle various rounding modes correctly", () => {
    // Test value with .5 to test rounding modes
    const testValue = BigNumberBrand.from<"Test">(3.5, BigNumber);

    // Different rounding modes
    expect(testValue.integerValue(BigNumber.ROUND_UP).toString()).toBe("4");
    expect(testValue.integerValue(BigNumber.ROUND_DOWN).toString()).toBe("3");
    expect(testValue.integerValue(BigNumber.ROUND_CEIL).toString()).toBe("4");
    expect(testValue.integerValue(BigNumber.ROUND_FLOOR).toString()).toBe("3");
    expect(testValue.integerValue(BigNumber.ROUND_HALF_UP).toString()).toBe(
      "4",
    );
    expect(testValue.integerValue(BigNumber.ROUND_HALF_DOWN).toString()).toBe(
      "3",
    );
    expect(testValue.integerValue(BigNumber.ROUND_HALF_EVEN).toString()).toBe(
      "4",
    );
    expect(testValue.integerValue(BigNumber.ROUND_HALF_CEIL).toString()).toBe(
      "4",
    );
    expect(testValue.integerValue(BigNumber.ROUND_HALF_FLOOR).toString()).toBe(
      "3",
    );

    // Test value with .1 to test different rounding modes
    const testValuePoint1 = BigNumberBrand.from<"Test">(3.1, BigNumber);
    expect(testValuePoint1.integerValue(BigNumber.ROUND_UP).toString()).toBe(
      "4",
    );
    expect(testValuePoint1.integerValue(BigNumber.ROUND_DOWN).toString()).toBe(
      "3",
    );

    // Test value with .9 to test different rounding modes
    const testValuePoint9 = BigNumberBrand.from<"Test">(3.9, BigNumber);
    expect(testValuePoint9.integerValue(BigNumber.ROUND_UP).toString()).toBe(
      "4",
    );
    expect(testValuePoint9.integerValue(BigNumber.ROUND_DOWN).toString()).toBe(
      "3",
    );

    // Test value with .49 and .51 for half rounding modes
    const testValuePoint49 = BigNumberBrand.from<"Test">(3.49, BigNumber);
    const testValuePoint51 = BigNumberBrand.from<"Test">(3.51, BigNumber);

    expect(
      testValuePoint49.integerValue(BigNumber.ROUND_HALF_UP).toString(),
    ).toBe("3");
    expect(
      testValuePoint51.integerValue(BigNumber.ROUND_HALF_UP).toString(),
    ).toBe("4");

    // Test with various fractional values, both positive and negative

    // Edge cases with .5 (halfway point)
    const posHalfway = BigNumberBrand.from<"Test">(3.5, BigNumber);
    const negHalfway = BigNumberBrand.from<"Test">(-3.5, BigNumber);

    // Test ROUND_UP: Round away from zero
    expect(posHalfway.integerValue(BigNumber.ROUND_UP).toFixed(0)).toBe("4");
    expect(negHalfway.integerValue(BigNumber.ROUND_UP).toFixed(0)).toBe("-4");

    // Test ROUND_DOWN: Round towards zero
    expect(posHalfway.integerValue(BigNumber.ROUND_DOWN).toFixed(0)).toBe("3");
    expect(negHalfway.integerValue(BigNumber.ROUND_DOWN).toFixed(0)).toBe("-3");

    // Test ROUND_CEIL: Round toward positive infinity
    expect(posHalfway.integerValue(BigNumber.ROUND_CEIL).toFixed(0)).toBe("4");
    expect(negHalfway.integerValue(BigNumber.ROUND_CEIL).toFixed(0)).toBe("-3");

    // Test ROUND_FLOOR: Round toward negative infinity
    expect(posHalfway.integerValue(BigNumber.ROUND_FLOOR).toFixed(0)).toBe("3");
    expect(negHalfway.integerValue(BigNumber.ROUND_FLOOR).toFixed(0)).toBe(
      "-4",
    );

    // Test non-.5 fractional values
    const posNonHalf = BigNumberBrand.from<"Test">(7.3, BigNumber);
    const negNonHalf = BigNumberBrand.from<"Test">(-7.3, BigNumber);

    // ROUND_UP: Round away from zero
    expect(posNonHalf.integerValue(BigNumber.ROUND_UP).toFixed(0)).toBe("8");
    expect(negNonHalf.integerValue(BigNumber.ROUND_UP).toFixed(0)).toBe("-8");

    // ROUND_DOWN: Round towards zero
    expect(posNonHalf.integerValue(BigNumber.ROUND_DOWN).toFixed(0)).toBe("7");
    expect(negNonHalf.integerValue(BigNumber.ROUND_DOWN).toFixed(0)).toBe("-7");

    // ROUND_CEIL: Round toward positive infinity
    expect(posNonHalf.integerValue(BigNumber.ROUND_CEIL).toFixed(0)).toBe("8");
    expect(negNonHalf.integerValue(BigNumber.ROUND_CEIL).toFixed(0)).toBe("-7");

    // ROUND_FLOOR: Round toward negative infinity
    expect(posNonHalf.integerValue(BigNumber.ROUND_FLOOR).toFixed(0)).toBe("7");
    expect(negNonHalf.integerValue(BigNumber.ROUND_FLOOR).toFixed(0)).toBe(
      "-8",
    );

    // Test decimal places with rounding modes
    const piValue = BigNumberBrand.from<"Test">(Math.PI, BigNumber);
    expect(piValue.toFixed(2, BigNumber.ROUND_UP)).toBe("3.15");
    expect(piValue.toFixed(2, BigNumber.ROUND_DOWN)).toBe("3.14");
    expect(piValue.toFixed(3, BigNumber.ROUND_HALF_UP)).toBe("3.142");

    // Test precision with rounding modes
    const longDecimal = BigNumberBrand.from<"Test">(
      "1.12345678901234567890",
      BigNumber,
    );
    expect(longDecimal.precision(5, BigNumber.ROUND_HALF_UP).toString()).toBe(
      "1.1235",
    );
    expect(longDecimal.sd(5, BigNumber.ROUND_DOWN).toString()).toBe("1.1234");
  });
});

describe("buildTaggedBigNumberClass", () => {
  it("should create a branded BigNumber class with the specified tag", () => {
    const TokenAmount = buildTaggedBigNumberClass("TokenAmount", BigNumber);
    expect(TokenAmount.Type._tag).toBe("TokenAmount");
  });

  it("should create instances through the make function", () => {
    const TokenAmount = buildTaggedBigNumberClass("TokenAmount", BigNumber);
    const amount = TokenAmount.make(100);

    expect(amount.value.toString()).toBe("100");
    expect(amount).toBeInstanceOf(BigNumberBrand);
  });

  it("should maintain type safety between different branded classes", () => {
    const TokenAmount = buildTaggedBigNumberClass("TokenAmount", BigNumber);
    const USDValue = buildTaggedBigNumberClass("USDValue", BigNumber);

    const tokens = TokenAmount.make(100);
    const dollars = USDValue.make(50);

    // In TypeScript, this would be a type error:
    // tokens.plus(dollars);

    // We can verify they operate independently
    const moreTokens = tokens.plus(TokenAmount.make(150));
    const moreDollars = dollars.plus(USDValue.make(25));

    expect(moreTokens.value.toString()).toBe("250");
    expect(moreDollars.value.toString()).toBe("75");

    // Test that tags are preserved in operations
    expect(TokenAmount.Type._tag).toBe("TokenAmount");
    expect(USDValue.Type._tag).toBe("USDValue");

    // Type checking
    expectTypeOf(tokens).not.toMatchTypeOf<typeof dollars>();
    expectTypeOf(tokens.plus(TokenAmount.make(10))).toMatchTypeOf<
      typeof tokens
    >();
  });

  it("should allow chaining operations", () => {
    const TokenAmount = buildTaggedBigNumberClass("TokenAmount", BigNumber);
    const amount = TokenAmount.make(100);

    const result = amount
      .plus(TokenAmount.make(50))
      .minus(TokenAmount.make(25))
      .multipliedBy(TokenAmount.make(2));

    expect(result.value.toString()).toBe("250");
  });

  it("should handle different input formats including fractional values", () => {
    const TokenAmount = buildTaggedBigNumberClass("TokenAmount", BigNumber);
    const USDValue = buildTaggedBigNumberClass("USDValue", BigNumber);

    // Test different input formats
    const fromNumber = TokenAmount.make(100.5);
    const fromString = TokenAmount.make("100.5");
    const fromBigint = TokenAmount.make(100n);

    expect(fromNumber.isEqualTo(fromString)).toBe(true);
    expect(fromNumber.value.toString()).toBe("100.5");
    expect(fromBigint.value.toString()).toBe("100");

    // Test fractional values with typed brands
    const halfToken = TokenAmount.make(0.5);
    const quarterToken = TokenAmount.make(0.25);

    // Ensure operations maintain type safety with fractions
    const tokensSum = halfToken.plus(quarterToken);
    expect(tokensSum.value.toString()).toBe("0.75");
    expectTypeOf(tokensSum).toMatchTypeOf<typeof halfToken>();

    // Test fractional division
    const tokenRatio = halfToken.dividedBy(quarterToken);
    expect(tokenRatio.value.toString()).toBe("2");
    expectTypeOf(tokenRatio).toMatchTypeOf<typeof halfToken>();

    // Test complex calculations with fractional values
    const tokenResult = halfToken
      .plus(TokenAmount.make(0.125))
      .minus(TokenAmount.make(0.0625))
      .multipliedBy(TokenAmount.make(2));

    expect(tokenResult.value.toString()).toBe("1.125");
    expectTypeOf(tokenResult).toMatchTypeOf<typeof halfToken>();

    // Test type safety between different brands with fractional values
    const _usdFraction = USDValue.make(0.75);
    expectTypeOf(halfToken).not.toMatchTypeOf<typeof _usdFraction>();

    // Test a precise decimal representation
    const thirdToken = TokenAmount.make(1).dividedBy(TokenAmount.make(3));
    expect(thirdToken.toString().startsWith("0.333333")).toBe(true);
  });

  it("should ensure proper type safety across operations", () => {
    const TokenAmount = buildTaggedBigNumberClass("TokenAmount", BigNumber);
    const USDValue = buildTaggedBigNumberClass("USDValue", BigNumber);

    const tokens = TokenAmount.make(100);
    const dollars = USDValue.make(50);

    // Runtime verification that we can't mix types (we'd get a compile error in actual code)
    expect(() => {
      // @ts-expect-error - Intentionally testing runtime behavior
      return tokens.plus(dollars);
    }).not.toThrow(); // It won't throw at runtime, but TypeScript should catch this

    // Testing type inference
    function acceptsTokenAmount(amount: typeof tokens) {
      return amount.multipliedBy(TokenAmount.make(2));
    }

    const doubledTokens = acceptsTokenAmount(tokens);
    expect(doubledTokens.value.toString()).toBe("200");

    // Testing that type errors would occur in TypeScript:
    // This would cause a type error in real code:
    // acceptsTokenAmount(dollars);
  });

  it("should maintain brand integrity through all mathematical operations", () => {
    const TokenAmount = buildTaggedBigNumberClass("TokenAmount", BigNumber);
    const token = TokenAmount.make(100);

    // Test all operations to ensure brand is preserved
    const operations = [
      token.plus(TokenAmount.make(10)),
      token.minus(TokenAmount.make(10)),
      token.times(TokenAmount.make(2)),
      token.div(TokenAmount.make(2)),
      token.pow(2),
      token.sqrt(),
      token.abs(),
      token.shiftedBy(1),
      token.integerValue(),
      token.negated(),
    ];

    operations.forEach((result) => {
      expect(result).toBeInstanceOf(BigNumberBrand);
      expectTypeOf(result).toMatchTypeOf<typeof token>();
    });
  });

  it("should prevent mixing different branded types across operations", () => {
    const TokenAmount = buildTaggedBigNumberClass("TokenAmount", BigNumber);
    const GasPrice = buildTaggedBigNumberClass("GasPrice", BigNumber);

    // At runtime, we can check that the class type doesn't match
    expect(TokenAmount.Type).not.toBe(GasPrice.Type);

    // In TypeScript, these would error:
    // TokenAmount.make(10).plus(GasPrice.make(10))
    // GasPrice.make(10).times(TokenAmount.make(10))

    // Verify operations within the same brand work correctly
    const tokenResult = TokenAmount.make(100).plus(TokenAmount.make(50));
    const gasResult = GasPrice.make(100).plus(GasPrice.make(50));

    expect(tokenResult.value.toString()).toBe("150");
    expect(gasResult.value.toString()).toBe("150");
  });

  it("should respect configured rounding modes in branded classes", () => {
    // Create a custom BigNumber constructor with specific rounding mode
    const CustomBigNumberWithRounding = BigNumber.clone({
      DECIMAL_PLACES: 2,
      ROUNDING_MODE: BigNumber.ROUND_DOWN,
    });

    // Create a branded class with this configuration
    const PriceAmount = buildTaggedBigNumberClass(
      "PriceAmount",
      CustomBigNumberWithRounding,
    );

    // Test value that needs rounding
    const value = PriceAmount.make("1.2349");

    // Always specify precision explicitly when using toFixed to ensure consistent results
    // PriceAmount appears to have a default precision of 2 decimal places
    expect(value.toFixed(2)).toBe("1.23");

    // When we need exact precision, specify it explicitly
    expect(value.toFixed(4)).toBe("1.2349");

    // Test another value with explicit precision
    const anotherValue = PriceAmount.make(9.999);
    // The actual rounding mode used by PriceAmount appears to be different than expected
    // PriceAmount may be using ROUND_DOWN instead of ROUND_HALF_UP for the default
    expect(anotherValue.toFixed(2)).toBe("9.99"); // Actual observed behavior
    expect(anotherValue.toFixed(3)).toBe("9.999"); // Full precision at 3 decimal places

    // When using a specific rounding mode, also specify exact precision
    // ROUND_UP behavior is deterministic with explicit precision
    expect(anotherValue.toFixed(3, BigNumber.ROUND_UP)).toBe("9.999"); // Already exact
    expect(anotherValue.toFixed(2, BigNumber.ROUND_UP)).toBe("10.00"); // Rounds up to 10

    // Operations should maintain the configured precision, but toString() might show full precision
    const sum = value.plus(PriceAmount.make(0.1));
    // For checking rounding behavior, use toFixed() instead of toString()
    expect(sum.toFixed(2)).toBe("1.33");

    // Division should follow the configured rounding mode (ROUND_DOWN)
    const result = PriceAmount.make(10).dividedBy(PriceAmount.make(3));
    expect(result.toString()).toBe("3.33"); // Would be 3.34 with ROUND_HALF_UP
  });

  it("should correctly apply ROUND_HALF_EVEN (banker's rounding) for TorAmount", () => {
    // Create a test configuration similar to TorBigNumberCfg from subspace.ts
    const TorBigNumberConfig = BigNumber.clone({
      DECIMAL_PLACES: 18, // DECIMALS from subspace.ts
      ROUNDING_MODE: BigNumber.ROUND_HALF_EVEN, // Banker's rounding, better for financial
    });

    // Create a branded class with this configuration
    const TorAmountTest = buildTaggedBigNumberClass(
      "TorAmountTest",
      TorBigNumberConfig,
    );

    // Test cases specifically for ROUND_HALF_EVEN (banker's rounding)
    // When the fraction is exactly 0.5, it rounds to the nearest even number

    // Value ending with .5 where preceding digit is even (2)
    const value2_5 = TorAmountTest.make("2.5");
    expect(value2_5.integerValue().toString()).toBe("2"); // Rounds to even (2)

    // Value ending with .5 where preceding digit is odd (3)
    const value3_5 = TorAmountTest.make("3.5");
    expect(value3_5.integerValue().toString()).toBe("4"); // Rounds to even (4)

    // More examples of banker's rounding
    expect(TorAmountTest.make("4.5").integerValue().toString()).toBe("4"); // Rounds to even (4)
    expect(TorAmountTest.make("5.5").integerValue().toString()).toBe("6"); // Rounds to even (6)

    // Test with different decimal places
    const precision2 = TorAmountTest.make("2.125");
    expect(precision2.toFixed(2)).toBe("2.12"); // 2.125 rounded to 2 decimals is 2.12

    const precision2b = TorAmountTest.make("2.135");
    expect(precision2b.toFixed(2)).toBe("2.14"); // 2.135 rounded to 2 decimals is 2.14

    const precision2c = TorAmountTest.make("2.155");
    expect(precision2c.toFixed(2)).toBe("2.16"); // 2.155 rounded to 2 decimals is 2.16

    // Test for 0.5 exactly at different decimal places
    const value1_25 = TorAmountTest.make("1.25");
    expect(value1_25.toFixed(1)).toBe("1.2"); // 1.25 rounded to 1 decimal with banker's rounding is 1.2

    const value1_35 = TorAmountTest.make("1.35");
    expect(value1_35.toFixed(1)).toBe("1.4"); // 1.35 rounded to 1 decimal with banker's rounding is 1.4

    // Test the bankers rounding with operations
    const dividend = TorAmountTest.make(10);

    // Test division that results in repeating fractions
    const third = dividend.dividedBy(TorAmountTest.make(3));
    expect(third.toFixed(2)).toBe("3.33"); // Standard rounding for non-tie case

    // Testing a case where banker's rounding matters (tie goes to even)
    const divideBy8 = dividend.dividedBy(TorAmountTest.make(8)); // Should be 1.25
    expect(divideBy8.toFixed(1)).toBe("1.2"); // Banker's rounding for 1.25 to 1 decimal is 1.2

    const divideBy4 = dividend.dividedBy(TorAmountTest.make(4)); // Should be 2.5
    expect(divideBy4.integerValue().toString()).toBe("2"); // Banker's rounding for 2.5 is 2
  });
});
