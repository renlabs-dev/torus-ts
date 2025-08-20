import type { ApiPromise } from "@polkadot/api";
import type {
  ApiDecoration,
  SignerOptions,
  SubmittableExtrinsic,
} from "@polkadot/api/types";
import type { AccountId, Extrinsic } from "@polkadot/types/interfaces";

import type { Result } from "@torus-network/torus-utils/result";
import { makeErr, makeOk } from "@torus-network/torus-utils/result";
import { tryAsync } from "@torus-network/torus-utils/try-catch";

import { sb_balance } from "../../types/index.js";

export type Api = ApiDecoration<"promise"> | ApiPromise;

export * from "./storage-maps.js";

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

// ==== Extrinsic fees ====

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
 * @deprecated Not working. Investigate later.
 */
export async function brokenQueryExtFeeInfo(
  api: Api,
  ext: Extrinsic,
): Promise<Result<FeeInfo, SbQueryError>> {
  const encoded = ext.toU8a();
  const len = encoded.length;

  const [queryError, feeDetails] = await tryAsync(
    api.call.transactionPaymentApi.queryFeeDetails(ext, len),
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
