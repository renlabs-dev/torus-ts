import type { ApiPromise } from "@polkadot/api";
import type {
  ApiDecoration,
  SignerOptions,
  SubmittableExtrinsic,
} from "@polkadot/api/types";
import type { StorageKey } from "@polkadot/types";
import type { AccountId, Extrinsic } from "@polkadot/types/interfaces";
import type { Codec } from "@polkadot/types/types";
import type { z, ZodTypeAny } from "zod";

import { assert_error } from "@torus-network/torus-utils";
import type { Result } from "@torus-network/torus-utils/result";
import { makeErr, makeOk } from "@torus-network/torus-utils/result";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

import { sb_balance } from "../index.browser.js";

export type Api = ApiDecoration<"promise"> | ApiPromise;

// ==== Error ====

export class SbQueryError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "SbQueryError";
  }

  static from(error: Error): SbQueryError {
    return new SbQueryError(error.message, { cause: error });
  }
}

// ==== Storage maps ====

export function handleMapValues<K extends Codec, T extends ZodTypeAny>(
  rawEntries: [K, Codec][],
  schema: T,
): [z.output<T>[], Error[]] {
  type Out = z.output<T>;
  const entries: Out[] = [];
  const errors: Error[] = [];

  for (const entry of rawEntries) {
    const [, valueRaw] = entry;
    const parseResult = schema.parse(valueRaw) as Out;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    const [error, parsed] = trySync(() => parseResult);

    if (error !== undefined) {
      errors.push(error);
      assert_error(error);
      continue;
    }

    entries.push(parsed);
  }

  return [entries, errors];
}

export function handleMapEntries<K extends ZodTypeAny, V extends ZodTypeAny>(
  rawEntries: [StorageKey<[Codec]>, Codec][],
  keySchema: K,
  valueSchema: V,
): [Map<z.output<K>, z.output<V>>, Error[]] {
  type KeyOut = z.output<K>;
  type ValOut = z.output<V>;
  const entries = new Map<KeyOut, ValOut>();
  const errors: Error[] = [];

  for (const entry of rawEntries) {
    const [keysRaw, valueRaw] = entry;
    const [key1Raw] = keysRaw.args;

    const [keyError, parsedKey] = trySync(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      () => keySchema.parse(key1Raw) as KeyOut,
    );

    if (keyError !== undefined) {
      errors.push(keyError);
      continue;
    }

    const [valueError, parsedVal] = trySync(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      () => valueSchema.parse(valueRaw) as ValOut,
    );

    if (valueError !== undefined) {
      errors.push(valueError);
      continue;
    }

    entries.set(parsedKey, parsedVal);
  }

  return [entries, errors];
}

export function handleDoubleMapEntries<
  K1 extends ZodTypeAny,
  K2 extends ZodTypeAny,
  V extends ZodTypeAny,
>(
  rawEntries: [StorageKey<[Codec, Codec]>, Codec][],
  key1Schema: K1,
  key2Schema: K2,
  valueSchema: V,
): [Map<z.output<K1>, Map<z.output<K2>, z.output<V>>>, Error[]] {
  type Key1Out = z.output<K1>;
  type Key2Out = z.output<K2>;
  type ValOut = z.output<V>;
  const entries = new Map<Key1Out, Map<Key2Out, ValOut>>();
  const errors: Error[] = [];

  for (const entry of rawEntries) {
    const [keysRaw, valueRaw] = entry;
    const [key1Raw, key2Raw] = keysRaw.args;

    const [key1Error, parsedKey1] = trySync(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      () => key1Schema.parse(key1Raw) as Key1Out,
    );

    if (key1Error !== undefined) {
      errors.push(key1Error);
      continue;
    }

    const [key2Error, parsedKey2] = trySync(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      () => key2Schema.parse(key2Raw) as Key2Out,
    );

    if (key2Error !== undefined) {
      errors.push(key2Error);
      continue;
    }

    const [valueError, parsedVal] = trySync(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      () => valueSchema.parse(valueRaw) as ValOut,
    );

    if (valueError !== undefined) {
      errors.push(valueError);
      continue;
    }

    if (!entries.has(parsedKey1)) {
      entries.set(parsedKey1, new Map<Key2Out, ValOut>());
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    entries.get(parsedKey1)!.set(parsedKey2, parsedVal);
  }

  return [entries, errors];
}

/**
 * Represents the breakdown and total of inclusion fees for a Substrate extrinsic.
 */
interface FeeInfo {
  /** Fixed base fee for extrinsic inclusion. */
  baseFee: bigint;
  /** Fee based on extrinsic length. */
  lenFee: bigint;
  /** Weight-based fee, adjusted for network conditions. */
  adjustedWeightFee: bigint;
  /** Total inclusion fee (sum of the above). */
  totalFee: bigint;
}

/**
 * @deprecated Not working
 */
export async function queryExtFeeInfo(
  api: Api,
  ext: Extrinsic,
): Promise<Result<FeeInfo, SbQueryError>> {
  const encoded = ext.toU8a();
  const len = encoded.length;

  const [queryError, feeDetails] = await tryAsync(
    api.call.transactionPaymentApi.queryFeeDetails(ext, 0),
  );
  if (queryError !== undefined)
    return makeErr(
      new SbQueryError("Error querying fee details", { cause: queryError }),
    );

  const inclusionFeeOpt = feeDetails.inclusionFee;
  if (inclusionFeeOpt.isNone)
    return makeErr(new SbQueryError("No inclusion fee found in fee details"));

  const inclusionFee = inclusionFeeOpt.value;

  const baseFee = sb_balance.parse(inclusionFee.baseFee);
  const lenFee = sb_balance.parse(inclusionFee.lenFee);
  const adjustedWeightFee = sb_balance.parse(inclusionFee.adjustedWeightFee);

  const totalFee = baseFee + lenFee + adjustedWeightFee;

  const feeInfo: FeeInfo = {
    baseFee,
    lenFee,
    adjustedWeightFee,
    totalFee,
  };

  return makeOk(feeInfo);
}

export async function queryExtFee(
  ext: SubmittableExtrinsic<"promise">,
  from: AccountId | string,
  options?: Partial<SignerOptions>,
): Promise<Result<{ fee: bigint }, SbQueryError>> {
  const [queryError, payInfo] = await tryAsync(ext.paymentInfo(from, options));
  if (queryError !== undefined) {
    return makeErr(SbQueryError.from(queryError));
  }
  const fee = payInfo.partialFee.toBigInt();
  return makeOk({ fee });
}
