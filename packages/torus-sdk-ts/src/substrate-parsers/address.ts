import { GenericAccountId } from "@polkadot/types";
import { z } from "zod";
import { SS58_SCHEMA } from "../types/address.js";

// ==== Address ====

/**
 * Schema validator for Substrate `GenericAccountId` types.
 */
export const GenericAccountId_schema = z.custom<GenericAccountId>(
  (val) => val instanceof GenericAccountId,
  "not a substrate GenericAccountId",
);

/**
 * Parser that converts Substrate `GenericAccountId` to a branded SS58 address
 * string `SS58Address`.
 */
export const sb_address = GenericAccountId_schema.transform((val) =>
  val.toString(),
).pipe(SS58_SCHEMA);
