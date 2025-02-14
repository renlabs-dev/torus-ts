import type BigNumber from "bignumber.js";
import { assert, Equals } from "tsafe";
import type { IsEqual } from "type-fest";

export type BNInput = BigNumber.Value;

type RoundingMode = BigNumber.RoundingMode;

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
  type _Test1 = TransformBigNumberMethods<BigNumber, TaggedBigNumber<"X">>;
  type _Test2 = _Test1["plus"];

  assert<
    Equals<
      _Test2,
      (n: TaggedBigNumber<"X">, base?: number) => TaggedBigNumber<"X">
    >
  >();
}

type BigNumberCtr = BigNumber.Constructor;

export const buildTaggedBigNumberClass = <Tag extends string>(
  brand: Tag,
  bigNumberCtr: BigNumberCtr,
) =>
  class CustomTaggedBigNumber extends TaggedBigNumber<Tag> {
    static readonly bigNumberCtr = bigNumberCtr;
    static readonly _brand = brand;
  };

export class TaggedBigNumber<Tag extends string>
  implements TransformBigNumberMethods<BigNumber, TaggedBigNumber<Tag>>
{
  static readonly bigNumberCtr: BigNumberCtr;
  static readonly _brand: string;

  constructor(public readonly value: BigNumber) {}

  static from<Tag extends string>(
    value: BigNumber.Value | bigint,
    bigNumberCtr?: BigNumberCtr,
  ): TaggedBigNumber<Tag> {
    if (typeof value === "bigint") {
      value = value.toString();
    }
    if (bigNumberCtr == null) {
      bigNumberCtr = this.bigNumberCtr;
    }
    debugger; // TODO: BUG, bigNumberCtr is undefined
    return new TaggedBigNumber<Tag>(bigNumberCtr(value));
  }

  _isBigNumber = true;

  get c(): number[] | null {
    return this.value.c;
  }
  get e(): number | null {
    return this.value.e;
  }
  get s(): number | null {
    return this.value.s;
  }

  absoluteValue(): TaggedBigNumber<Tag> {
    return TaggedBigNumber.from(this.value.absoluteValue());
  }

  abs(): TaggedBigNumber<Tag> {
    return TaggedBigNumber.from(this.value.abs());
  }

  comparedTo(n: TaggedBigNumber<Tag>, base?: number): number {
    return this.value.comparedTo(n.value, base);
  }

  decimalPlaces(): number | null;
  decimalPlaces(
    decimalPlaces: number,
    roundingMode?: RoundingMode,
  ): TaggedBigNumber<Tag>;

  decimalPlaces(
    decimalPlaces?: number,
    roundingMode?: RoundingMode,
  ): number | null | TaggedBigNumber<Tag> {
    if (decimalPlaces === undefined || typeof decimalPlaces === "number") {
      return this.value.decimalPlaces();
    }
    const result = this.value.decimalPlaces(decimalPlaces, roundingMode);
    return TaggedBigNumber.from(result);
  }

  dp(): number | null;
  dp(decimalPlaces: number, roundingMode?: RoundingMode): TaggedBigNumber<Tag>;
  dp(
    decimalPlaces?: number,
    roundingMode?: RoundingMode,
  ): null | number | TaggedBigNumber<Tag> {
    if (decimalPlaces === undefined) {
      return this.value.dp();
    }
    return this.decimalPlaces(decimalPlaces, roundingMode);
  }

  plus(other: TaggedBigNumber<Tag>): TaggedBigNumber<Tag> {
    return TaggedBigNumber.from(this.value.plus(other.value));
  }

  minus(other: TaggedBigNumber<Tag>): TaggedBigNumber<Tag> {
    return TaggedBigNumber.from(this.value.minus(other.value));
  }

  multipliedBy(other: TaggedBigNumber<Tag>): TaggedBigNumber<Tag> {
    return TaggedBigNumber.from(this.value.multipliedBy(other.value));
  }

  times = (o: TaggedBigNumber<Tag>) => this.multipliedBy(o);

  dividedBy(other: TaggedBigNumber<Tag>): TaggedBigNumber<Tag> {
    return TaggedBigNumber.from(this.value.dividedBy(other.value));
  }

  div = (o: TaggedBigNumber<Tag>) => this.dividedBy(o);

  dividedToIntegerBy(other: TaggedBigNumber<Tag>): TaggedBigNumber<Tag> {
    return TaggedBigNumber.from(this.value.dividedToIntegerBy(other.value));
  }

  idiv = (o: TaggedBigNumber<Tag>) => this.dividedToIntegerBy(o);

  modulo(other: TaggedBigNumber<Tag>): TaggedBigNumber<Tag> {
    return TaggedBigNumber.from(this.value.modulo(other.value));
  }

  mod = (o: TaggedBigNumber<Tag>) => this.modulo(o);

  negated(): TaggedBigNumber<Tag> {
    return TaggedBigNumber.from(this.value.negated());
  }

  squareRoot(): TaggedBigNumber<Tag> {
    return TaggedBigNumber.from(this.value.squareRoot());
  }

  sqrt = () => this.squareRoot();

  exponentiatedBy(n: number | TaggedBigNumber<Tag>): TaggedBigNumber<Tag> {
    const value = n instanceof TaggedBigNumber ? n.value : n;
    return TaggedBigNumber.from(this.value.exponentiatedBy(value));
  }

  pow = (n: number | TaggedBigNumber<Tag>) => this.exponentiatedBy(n);

  isEqualTo(other: TaggedBigNumber<Tag>): boolean {
    return this.value.isEqualTo(other.value);
  }

  eq = (o: TaggedBigNumber<Tag>) => this.isEqualTo(o);

  isGreaterThan(other: TaggedBigNumber<Tag>): boolean {
    return this.value.isGreaterThan(other.value);
  }

  gt = (o: TaggedBigNumber<Tag>) => this.isGreaterThan(o);

  isGreaterThanOrEqualTo(other: TaggedBigNumber<Tag>): boolean {
    return this.value.isGreaterThanOrEqualTo(other.value);
  }

  gte = (o: TaggedBigNumber<Tag>) => this.isGreaterThanOrEqualTo(o);

  isLessThan(other: TaggedBigNumber<Tag>): boolean {
    return this.value.isLessThan(other.value);
  }

  lt = (o: TaggedBigNumber<Tag>) => this.isLessThan(o);

  isLessThanOrEqualTo(other: TaggedBigNumber<Tag>): boolean {
    return this.value.isLessThanOrEqualTo(other.value);
  }

  lte = (o: TaggedBigNumber<Tag>) => this.isLessThanOrEqualTo(o);

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
  ): [TaggedBigNumber<Tag>, TaggedBigNumber<Tag>];
  toFraction(
    max_denominator?: TaggedBigNumber<Tag>,
  ): [TaggedBigNumber<Tag>, TaggedBigNumber<Tag>] {
    const [num, denom] = this.value.toFraction(max_denominator);
    return [TaggedBigNumber.from(num), TaggedBigNumber.from(denom)];
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

  shiftedBy(n: number): TaggedBigNumber<Tag> {
    return TaggedBigNumber.from(this.value.shiftedBy(n));
  }

  integerValue(rm?: RoundingMode): TaggedBigNumber<Tag> {
    return TaggedBigNumber.from(this.value.integerValue(rm));
  }

  precision(): number;
  precision(includeZeros: boolean): number;
  precision(
    significantDigits: number,
    roundingMode?: RoundingMode,
  ): TaggedBigNumber<Tag>;

  precision(
    param?: number | boolean,
    roundingMode?: RoundingMode,
  ): number | TaggedBigNumber<Tag> {
    if (param == undefined || typeof param === "boolean") {
      return this.value.precision(param);
    }
    return TaggedBigNumber.from(this.value.precision(param, roundingMode));
  }

  sd(): number;
  sd(includeZeros: boolean): number;
  sd(
    significantDigits: number,
    roundingMode?: RoundingMode,
  ): TaggedBigNumber<Tag>;

  sd(
    param?: number | boolean,
    roundingMode?: RoundingMode,
  ): number | TaggedBigNumber<Tag> {
    if (param == undefined || typeof param === "boolean") {
      return this.value.sd(param);
    }
    return TaggedBigNumber.from(this.value.sd(param, roundingMode));
  }
}
