import { BasicLogger } from "@torus-network/torus-utils/logger";
import type { ApostleSwarmDB } from "../db";
import { CheckConversionPayloadSchema } from "../types";

const log = BasicLogger.create({ name: "check-conversion" });

export interface CheckConversionContext {
  db: ApostleSwarmDB;
}

/**
 * Handles CHECK_CONVERSION jobs.
 *
 * This is a stub implementation that logs the invocation but performs no action.
 * Future implementation will check if the prospect has followed the Torus account
 * and update their claim status accordingly.
 */
export async function handleCheckConversion(
  _ctx: CheckConversionContext,
  payload: unknown,
): Promise<void> {
  const parseResult = CheckConversionPayloadSchema.safeParse(payload);
  if (!parseResult.success) {
    throw new Error(`Invalid payload: ${parseResult.error.message}`);
  }
  const { prospect_id } = parseResult.data;

  log.info(`[STUB] CHECK_CONVERSION invoked for prospect ${prospect_id}`);
  log.info("[STUB] No action taken - conversion check not yet implemented");
}
