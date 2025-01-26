import type BigNumber from "bignumber.js";
import type { IsEqual } from "type-fest";

type BNInput = BigNumber.Value;
type RoundingMode = BigNumber.RoundingMode;

type IfEquals<X, Y, A, B> = IsEqual<X, Y> extends true ? A : B;

type ReplaceBNInput<T, N> = IfEquals<T, BNInput, N, T>;

type ReplaceBigNumber<T, N> = IfEquals<T, BigNumber, N, T>;

type ReplaceBigNumberRecur<T, N> = T extends (infer U)[]
  ? ReplaceBigNumber<U, N>[]
  : ReplaceBigNumber<T, N>;

type TransformBigNumberMethods<T, New> = {
  [K in keyof T]: T[K] extends (...args: infer Args) => infer R
    ? (
        ...args: TransformBigNumberArgs<Args, New>
      ) => ReplaceBigNumberRecur<R, New>
    : T[K];
};

type TransformBigNumberArgs<Args, New> = {
  [I in keyof Args]: ReplaceBNInput<Args[I], New>;
};

// type _Test1 = TransformBigNumberMethods<BigNumber, BigNumberBrand<"X">>;
// type _Test2 = _Test1["plus"];

export const BN_BRAND_TAG_KEY: unique symbol = Symbol("BN_BRAND_TAG_KEY");

type BigNumberCtr = BigNumber.Constructor;

export function TaggedBigNumber<Brand extends string>(
  brand: Brand,
  bigNumberCtr: BigNumberCtr,
) {
  class CustomTaggedBigNumber extends BaseTaggedBigNumber<CustomTaggedBigNumber> {
    static readonly [BN_BRAND_TAG_KEY] = brand;
    static readonly bigNumberCtr = bigNumberCtr;
  }
  return CustomTaggedBigNumber;
}

// TODO: FIXME: remove recursive type
export class BaseTaggedBigNumber<Self extends BaseTaggedBigNumber<Self>>
  implements TransformBigNumberMethods<BigNumber, BaseTaggedBigNumber<Self>>
{
  static readonly bigNumberCtr: BigNumberCtr;

  static readonly [BN_BRAND_TAG_KEY]: string;

  constructor(public readonly value: BigNumber) {}

  static from<Self extends BaseTaggedBigNumber<Self>>(
    value: BigNumber.Value | bigint,
    bigNumberCtr?: BigNumberCtr,
  ): BaseTaggedBigNumber<Self> {
    if (typeof value === "bigint") {
      value = value.toString();
    }
    if (bigNumberCtr == null) {
      bigNumberCtr = this.bigNumberCtr;
    }
    return new BaseTaggedBigNumber<Self>(bigNumberCtr(value));
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

  absoluteValue(): BaseTaggedBigNumber<Self> {
    return BaseTaggedBigNumber.from(this.value.absoluteValue());
  }

  abs(): BaseTaggedBigNumber<Self> {
    return BaseTaggedBigNumber.from(this.value.abs());
  }

  comparedTo(n: BaseTaggedBigNumber<Self>, base?: number): number {
    return this.value.comparedTo(n.value, base);
  }

  decimalPlaces(): number | null;
  decimalPlaces(
    decimalPlaces: number,
    roundingMode?: RoundingMode,
  ): BaseTaggedBigNumber<Self>;

  decimalPlaces(
    decimalPlaces?: number,
    roundingMode?: RoundingMode,
  ): number | null | BaseTaggedBigNumber<Self> {
    if (decimalPlaces === undefined || typeof decimalPlaces === "number") {
      return this.value.decimalPlaces();
    }
    const result = this.value.decimalPlaces(decimalPlaces, roundingMode);
    return BaseTaggedBigNumber.from(result);
  }

  dp(): number | null;
  dp(
    decimalPlaces: number,
    roundingMode?: RoundingMode,
  ): BaseTaggedBigNumber<Self>;
  dp(
    decimalPlaces?: number,
    roundingMode?: RoundingMode,
  ): null | number | BaseTaggedBigNumber<Self> {
    if (decimalPlaces === undefined) {
      return this.value.dp();
    }
    return this.decimalPlaces(decimalPlaces, roundingMode);
  }

  plus(other: BaseTaggedBigNumber<Self>): BaseTaggedBigNumber<Self> {
    return BaseTaggedBigNumber.from(this.value.plus(other.value));
  }

  minus(other: BaseTaggedBigNumber<Self>): BaseTaggedBigNumber<Self> {
    return BaseTaggedBigNumber.from(this.value.minus(other.value));
  }

  multipliedBy(other: BaseTaggedBigNumber<Self>): BaseTaggedBigNumber<Self> {
    return BaseTaggedBigNumber.from(this.value.multipliedBy(other.value));
  }

  times = (o: BaseTaggedBigNumber<Self>) => this.multipliedBy(o);

  dividedBy(other: BaseTaggedBigNumber<Self>): BaseTaggedBigNumber<Self> {
    return BaseTaggedBigNumber.from(this.value.dividedBy(other.value));
  }

  div = (o: BaseTaggedBigNumber<Self>) => this.dividedBy(o);

  dividedToIntegerBy(
    other: BaseTaggedBigNumber<Self>,
  ): BaseTaggedBigNumber<Self> {
    return BaseTaggedBigNumber.from(this.value.dividedToIntegerBy(other.value));
  }

  idiv = (o: BaseTaggedBigNumber<Self>) => this.dividedToIntegerBy(o);

  modulo(other: BaseTaggedBigNumber<Self>): BaseTaggedBigNumber<Self> {
    return BaseTaggedBigNumber.from(this.value.modulo(other.value));
  }

  mod = (o: BaseTaggedBigNumber<Self>) => this.modulo(o);

  negated(): BaseTaggedBigNumber<Self> {
    return BaseTaggedBigNumber.from(this.value.negated());
  }

  squareRoot(): BaseTaggedBigNumber<Self> {
    return BaseTaggedBigNumber.from(this.value.squareRoot());
  }

  sqrt = () => this.squareRoot();

  exponentiatedBy(
    n: number | BaseTaggedBigNumber<Self>,
  ): BaseTaggedBigNumber<Self> {
    const value = n instanceof BaseTaggedBigNumber ? n.value : n;
    return BaseTaggedBigNumber.from(this.value.exponentiatedBy(value));
  }

  pow = (n: number | BaseTaggedBigNumber<Self>) => this.exponentiatedBy(n);

  isEqualTo(other: BaseTaggedBigNumber<Self>): boolean {
    return this.value.isEqualTo(other.value);
  }

  eq = (o: BaseTaggedBigNumber<Self>) => this.isEqualTo(o);

  isGreaterThan(other: BaseTaggedBigNumber<Self>): boolean {
    return this.value.isGreaterThan(other.value);
  }

  gt = (o: BaseTaggedBigNumber<Self>) => this.isGreaterThan(o);

  isGreaterThanOrEqualTo(other: BaseTaggedBigNumber<Self>): boolean {
    return this.value.isGreaterThanOrEqualTo(other.value);
  }

  gte = (o: BaseTaggedBigNumber<Self>) => this.isGreaterThanOrEqualTo(o);

  isLessThan(other: BaseTaggedBigNumber<Self>): boolean {
    return this.value.isLessThan(other.value);
  }

  lt = (o: BaseTaggedBigNumber<Self>) => this.isLessThan(o);

  isLessThanOrEqualTo(other: BaseTaggedBigNumber<Self>): boolean {
    return this.value.isLessThanOrEqualTo(other.value);
  }

  lte = (o: BaseTaggedBigNumber<Self>) => this.isLessThanOrEqualTo(o);

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
  ): [BaseTaggedBigNumber<Self>, BaseTaggedBigNumber<Self>];
  toFraction(
    max_denominator?: BaseTaggedBigNumber<Self>,
  ): [BaseTaggedBigNumber<Self>, BaseTaggedBigNumber<Self>] {
    const [num, denom] = this.value.toFraction(max_denominator);
    return [BaseTaggedBigNumber.from(num), BaseTaggedBigNumber.from(denom)];
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

  shiftedBy(n: number): BaseTaggedBigNumber<Self> {
    return BaseTaggedBigNumber.from(this.value.shiftedBy(n));
  }

  integerValue(rm?: RoundingMode): BaseTaggedBigNumber<Self> {
    return BaseTaggedBigNumber.from(this.value.integerValue(rm));
  }

  precision(): number;
  precision(includeZeros: boolean): number;
  precision(
    significantDigits: number,
    roundingMode?: RoundingMode,
  ): BaseTaggedBigNumber<Self>;

  precision(
    param?: number | boolean,
    roundingMode?: RoundingMode,
  ): number | BaseTaggedBigNumber<Self> {
    if (param == undefined || typeof param === "boolean") {
      return this.value.precision(param);
    }
    return BaseTaggedBigNumber.from(this.value.precision(param, roundingMode));
  }

  sd(): number;
  sd(includeZeros: boolean): number;
  sd(
    significantDigits: number,
    roundingMode?: RoundingMode,
  ): BaseTaggedBigNumber<Self>;

  sd(
    param?: number | boolean,
    roundingMode?: RoundingMode,
  ): number | BaseTaggedBigNumber<Self> {
    if (param == undefined || typeof param === "boolean") {
      return this.value.sd(param);
    }
    return BaseTaggedBigNumber.from(this.value.sd(param, roundingMode));
  }
}
