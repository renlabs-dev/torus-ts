import type BigNumber from "bignumber.js";
import type { Equals } from "tsafe";
import { assert } from "tsafe";
import type { IsEqual } from "type-fest";

export type BNInput = BigNumber.Value;

type RoundingMode = BigNumber.RoundingMode;

// Symbol used as a brand to make brands nominal types
export const BN_BRAND_TAG_KEY = Symbol("BigNumberBrandTag");

type IfEquals<X, Y, A, B> = IsEqual<X, Y> extends true ? A : B;

type ReplaceBNInput<T, N> = IfEquals<T, BNInput, N, T>;

type ReplaceBigNumber<T, N> = IfEquals<T, BigNumber, N, T>;

type ReplaceBigNumberRecur<T, N> = T extends (infer U)[]
  ? ReplaceBigNumber<U, N>[]
  : ReplaceBigNumber<T, N>;

type TransformBigNumberArgs<Args, New> = {
  [I in keyof Args]: ReplaceBNInput<Args[I], New>;
};

/**
 * Transforms the methods of a given type `T` by replacing the arguments and return types
 * that are BigNumber instances with a new type `New`.
 *
 * @template T - The original type whose methods will be transformed.
 * @template New - The new type that will replace BigNumber instances in the arguments and return types.
 */
type TransformBigNumberMethods<T, New> = {
  [K in keyof T]: T[K] extends (...args: infer Args) => infer R
    ? (
        ...args: TransformBigNumberArgs<Args, New>
      ) => ReplaceBigNumberRecur<R, New>
    : T[K];
};

function _test() {
  type _Test1 = TransformBigNumberMethods<BigNumber, BigNumberBrand<"X">>;
  type _Test2 = _Test1["plus"];

  assert<
    Equals<
      _Test2,
      (n: BigNumberBrand<"X">, base?: number) => BigNumberBrand<"X">
    >
  >();

  // Test that different branded types are not compatible
  type TokenAmount = BigNumberBrand<"TokenAmount">;
  type USDValue = BigNumberBrand<"USDValue">;

  // This should fail the assertion check because they are different brands
  // @ts-expect-error - These types should be incompatible
  assert<Equals<TokenAmount, USDValue>>();
}

type BigNumberCtr = BigNumber.Constructor;

export const buildTaggedBigNumberClass = <Tag extends string>(
  tag: Tag,
  bigNumberCtr: BigNumberCtr,
) => {
  // Create a CustomBigNumberBrand class that extends BigNumberBrand with the specific tag
  class CustomBigNumberBrand extends BigNumberBrand<Tag> {
    static readonly _tag: Tag = tag;
  }

  /**
   * Creates an instance of the branded BigNumber
   */
  const make = (value: BigNumber.Value | bigint): BigNumberBrand<Tag> => {
    return CustomBigNumberBrand.from<Tag>(value, bigNumberCtr);
  };

  return {
    Type: CustomBigNumberBrand,
    make,
  };
};

/**
 * A wrapper class for BigNumber instances that adds a type-safe tag to
 * distinguish between different usages and configurations of the same
 * underlying BigNumber instance.
 *
 * @template Tag - A string literal type used to tag the BigNumber instance.
 */
export class BigNumberBrand<Tag extends string>
  implements TransformBigNumberMethods<BigNumber, BigNumberBrand<Tag>>
{
  static readonly _tag: string;

  // Using a phantom property ensures nominal typing at the TypeScript level
  readonly __tag?: Tag;

  constructor(
    public readonly value: BigNumber,
    public readonly bigNumberCtr: BigNumberCtr,
  ) {}

  /**
   * Creates a new BigNumberBrand from a primitive and BigNumber constructor.
   *
   * @param value - The primitive value to be transformed and wrapped.
   * @param bigNumberCtr - The BigNumber constructor to use for creating the BigNumber instance.
   */
  static from<Tag extends string>(
    value: BigNumber.Value | bigint,
    bigNumberCtr: BigNumberCtr,
  ): BigNumberBrand<Tag> {
    if (typeof value === "bigint") {
      value = value.toString();
    }
    const bnVal = bigNumberCtr(value);
    return new BigNumberBrand<Tag>(bnVal, bigNumberCtr);
  }

  /**
   * Wraps a BigNumber value in a new BigNumberBrand instance, without
   * changing the underlying BigNumber instance.
   *
   * The configuration of the BigNumber value should match the configuration
   * of the instance.
   *
   * @param val - The BigNumber value to be wrapped.
   */
  _wrap(val: BigNumber): BigNumberBrand<Tag> {
    return new BigNumberBrand<Tag>(val, this.bigNumberCtr);
  }

  get c(): number[] | null {
    return this.value.c;
  }

  get e(): number | null {
    return this.value.e;
  }

  get s(): number | null {
    return this.value.s;
  }

  absoluteValue(): BigNumberBrand<Tag> {
    return this._wrap(this.value.absoluteValue());
  }

  abs(): BigNumberBrand<Tag> {
    return this._wrap(this.value.abs());
  }

  comparedTo(n: BigNumberBrand<Tag>, base?: number): number {
    return this.value.comparedTo(n.value, base);
  }

  decimalPlaces(): number | null;
  decimalPlaces(
    decimalPlaces: number,
    roundingMode?: RoundingMode,
  ): BigNumberBrand<Tag>;

  decimalPlaces(
    decimalPlaces?: number,
    roundingMode?: RoundingMode,
  ): number | null | BigNumberBrand<Tag> {
    if (decimalPlaces === undefined || typeof decimalPlaces === "number") {
      return this.value.decimalPlaces();
    }
    const result = this.value.decimalPlaces(decimalPlaces, roundingMode);
    return this._wrap(result);
  }

  dp(): number | null;
  dp(decimalPlaces: number, roundingMode?: RoundingMode): BigNumberBrand<Tag>;
  dp(
    decimalPlaces?: number,
    roundingMode?: RoundingMode,
  ): null | number | BigNumberBrand<Tag> {
    if (decimalPlaces === undefined) {
      return this.value.dp();
    }
    return this.decimalPlaces(decimalPlaces, roundingMode);
  }

  plus(other: BigNumberBrand<Tag>): BigNumberBrand<Tag> {
    return this._wrap(this.value.plus(other.value));
  }

  minus(other: BigNumberBrand<Tag>): BigNumberBrand<Tag> {
    return this._wrap(this.value.minus(other.value));
  }

  multipliedBy(other: BigNumberBrand<Tag>): BigNumberBrand<Tag> {
    return this._wrap(this.value.multipliedBy(other.value));
  }

  times = (o: BigNumberBrand<Tag>) => this.multipliedBy(o);

  dividedBy(other: BigNumberBrand<Tag>): BigNumberBrand<Tag> {
    return this._wrap(this.value.dividedBy(other.value));
  }

  div = (o: BigNumberBrand<Tag>) => this.dividedBy(o);

  dividedToIntegerBy(other: BigNumberBrand<Tag>): BigNumberBrand<Tag> {
    return this._wrap(this.value.dividedToIntegerBy(other.value));
  }

  idiv = (o: BigNumberBrand<Tag>) => this.dividedToIntegerBy(o);

  modulo(other: BigNumberBrand<Tag>): BigNumberBrand<Tag> {
    return this._wrap(this.value.modulo(other.value));
  }

  mod = (o: BigNumberBrand<Tag>) => this.modulo(o);

  negated(): BigNumberBrand<Tag> {
    return this._wrap(this.value.negated());
  }

  squareRoot(): BigNumberBrand<Tag> {
    return this._wrap(this.value.squareRoot());
  }

  sqrt = () => this.squareRoot();

  exponentiatedBy(n: number | BigNumberBrand<Tag>): BigNumberBrand<Tag> {
    const value = n instanceof BigNumberBrand ? n.value : n;
    return this._wrap(this.value.exponentiatedBy(value));
  }

  pow = (n: number | BigNumberBrand<Tag>) => this.exponentiatedBy(n);

  isEqualTo(other: BigNumberBrand<Tag>): boolean {
    return this.value.isEqualTo(other.value);
  }

  eq = (o: BigNumberBrand<Tag>) => this.isEqualTo(o);

  isGreaterThan(other: BigNumberBrand<Tag>): boolean {
    return this.value.isGreaterThan(other.value);
  }

  gt = (o: BigNumberBrand<Tag>) => this.isGreaterThan(o);

  isGreaterThanOrEqualTo(other: BigNumberBrand<Tag>): boolean {
    return this.value.isGreaterThanOrEqualTo(other.value);
  }

  gte = (o: BigNumberBrand<Tag>) => this.isGreaterThanOrEqualTo(o);

  isLessThan(other: BigNumberBrand<Tag>): boolean {
    return this.value.isLessThan(other.value);
  }

  lt = (o: BigNumberBrand<Tag>) => this.isLessThan(o);

  isLessThanOrEqualTo(other: BigNumberBrand<Tag>): boolean {
    return this.value.isLessThanOrEqualTo(other.value);
  }

  lte = (o: BigNumberBrand<Tag>) => this.isLessThanOrEqualTo(o);

  isFinite(): boolean {
    return this.value.isFinite();
  }

  isInteger(): boolean {
    return this.value.isInteger();
  }

  isNaN(): boolean {
    return this.value.isNaN();
  }

  isNegative(): boolean {
    return this.value.isNegative();
  }

  isPositive(): boolean {
    return this.value.isPositive();
  }

  isZero(): boolean {
    return this.value.isZero();
  }

  toExponential(decimalPlaces?: number, roundingMode?: RoundingMode): string {
    if (decimalPlaces === undefined) {
      return this.value.toExponential();
    }
    return this.value.toExponential(decimalPlaces, roundingMode);
  }

  toFixed(decimalPlaces?: number, roundingMode?: RoundingMode): string {
    if (decimalPlaces === undefined) {
      return this.value.toFixed();
    }
    return this.value.toFixed(decimalPlaces, roundingMode);
  }

  toFormat(
    decimalPlaces: number,
    roundingMode: RoundingMode,
    format?: BigNumber.Format,
  ): string;
  toFormat(decimalPlaces: number, roundingMode?: RoundingMode): string;
  toFormat(decimalPlaces?: number): string;
  toFormat(decimalPlaces: number, format: BigNumber.Format): string;
  toFormat(format: BigNumber.Format): string;

  toFormat(...args: unknown[]): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    return this.value.toFormat(...(args as any[]));
  }

  toFraction(
    max_denominator?: BigNumber.Value,
  ): [BigNumberBrand<Tag>, BigNumberBrand<Tag>];
  toFraction(
    max_denominator?: BigNumberBrand<Tag>,
  ): [BigNumberBrand<Tag>, BigNumberBrand<Tag>] {
    const [num, denom] = this.value.toFraction(max_denominator);
    return [this._wrap(num), this._wrap(denom)];
  }

  toJSON(): string {
    return this.value.toJSON();
  }

  toNumber(): number {
    return this.value.toNumber();
  }

  toPrecision(significantDigits?: number, roundingMode?: RoundingMode): string {
    if (significantDigits === undefined) {
      return this.value.toPrecision();
    }
    return this.value.toPrecision(significantDigits, roundingMode);
  }

  toString(base?: number): string {
    return this.value.toString(base);
  }

  valueOf(): string {
    return this.value.valueOf();
  }

  shiftedBy(n: number): BigNumberBrand<Tag> {
    return this._wrap(this.value.shiftedBy(n));
  }

  integerValue(rm?: RoundingMode): BigNumberBrand<Tag> {
    return this._wrap(this.value.integerValue(rm));
  }

  precision(): number;
  precision(includeZeros: boolean): number;
  precision(
    significantDigits: number,
    roundingMode?: RoundingMode,
  ): BigNumberBrand<Tag>;

  precision(
    param?: number | boolean,
    roundingMode?: RoundingMode,
  ): number | BigNumberBrand<Tag> {
    if (param == undefined || typeof param === "boolean") {
      return this.value.precision(param);
    }
    return this._wrap(this.value.precision(param, roundingMode));
  }

  sd(): number;
  sd(includeZeros: boolean): number;
  sd(
    significantDigits: number,
    roundingMode?: RoundingMode,
  ): BigNumberBrand<Tag>;

  sd(
    param?: number | boolean,
    roundingMode?: RoundingMode,
  ): number | BigNumberBrand<Tag> {
    if (param == undefined || typeof param === "boolean") {
      return this.value.sd(param);
    }
    return this._wrap(this.value.sd(param, roundingMode));
  }
}
