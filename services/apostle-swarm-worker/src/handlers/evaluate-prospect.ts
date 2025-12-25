import { BasicLogger } from "@torus-network/torus-utils/logger";
import type { ApostleSwarmDB } from "../db";
import { EvaluateProspectPayloadSchema } from "../types";

const log = BasicLogger.create({ name: "evaluate-prospect" });

export interface EvaluateProspectContext {
  db: ApostleSwarmDB;
}

/**
 * Handles EVALUATE_PROSPECT jobs.
 *
 * This is a stub implementation that logs the invocation but performs no action.
 * Future implementation will use AI to evaluate the prospect's resonance score
 * and generate an evaluation profile.
 */
export async function handleEvaluateProspect(
  _ctx: EvaluateProspectContext,
  payload: unknown,
): Promise<void> {
  const parseResult = EvaluateProspectPayloadSchema.safeParse(payload);
  if (!parseResult.success) {
    throw new Error(`Invalid payload: ${parseResult.error.message}`);
  }
  const { prospect_id } = parseResult.data;

  log.info(`[STUB] EVALUATE_PROSPECT invoked for prospect ${prospect_id}`);
  log.info("[STUB] No action taken - AI evaluation not yet implemented");
}
