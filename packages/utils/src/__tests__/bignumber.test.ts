import { BigNumberBrand, buildTaggedBigNumberClass } from "../bignumber";
import BigNumber from "bignumber.js";
import { describe, it, expect, expectTypeOf } from "vitest";

describe("BigNumberBrand", () => {
  it("should create a branded BigNumber instance", () => {
    const bn = BigNumberBrand.from<"Test">(100, BigNumber);
    expect(bn.value.toString()).toBe("100");
    expect(bn.value).toBeInstanceOf(BigNumber);
  });

  it("should convert bigint to string when creating instance", () => {
    const bigintValue = 1000n;
    const bn = BigNumberBrand.from<"Test">(bigintValue, BigNumber);
    expect(bn.value.toString()).toBe("1000");
  });

  it("should wrap BigNumber values correctly", () => {
    const bn = BigNumberBrand.from<"Test">(100, BigNumber);
    const wrappedBn = bn._wrap(new BigNumber(200));
    expect(wrappedBn.value.toString()).toBe("200");
    expect(wrappedBn).toBeInstanceOf(BigNumberBrand);
  });

  it("should delegate arithmetic operations to the underlying BigNumber", () => {
    const a = BigNumberBrand.from<"Test">(100, BigNumber);
    const b = BigNumberBrand.from<"Test">(50, BigNumber);

    const sum = a.plus(b);
    expect(sum.value.toString()).toBe("150");

    const diff = a.minus(b);
    expect(diff.value.toString()).toBe("50");

    const product = a.multipliedBy(b);
    expect(product.value.toString()).toBe("5000");

    const quotient = a.dividedBy(b);
    expect(quotient.value.toString()).toBe("2");
  });

  it("should handle comparison operations correctly", () => {
    const a = BigNumberBrand.from<"Test">(100, BigNumber);
    const b = BigNumberBrand.from<"Test">(50, BigNumber);
    const c = BigNumberBrand.from<"Test">(100, BigNumber);

    expect(a.isEqualTo(b)).toBe(false);
    expect(a.isEqualTo(c)).toBe(true);

    expect(a.isGreaterThan(b)).toBe(true);
    expect(b.isLessThan(a)).toBe(true);
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
    // Some configurations may output this in exponential notation
    expect(small.toString()).toMatch(/^(0\.0000001|1e-7)$/);
    expect(small.shiftedBy(7).toString()).toBe("1");

    // We can force non-exponential notation with toFixed
    expect(small.toFixed()).toBe("0.0000001");
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
});
