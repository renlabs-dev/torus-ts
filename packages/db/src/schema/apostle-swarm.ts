import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  jsonb,
  numeric,
  pgEnum,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { Equals } from "tsafe";
import { assert } from "tsafe";
import { extract_pgenum_values } from "../utils";
import {
  createTable,
  ss58Address,
  timeFields,
  timestampz,
  uuidv7,
} from "./utils";

// ==== Enums ====

export const apostleOriginEnum = pgEnum("apostle_origin", [
  "COMMUNITY",
  "APOSTLE_MANUAL",
]);
export const apostleOriginValues = extract_pgenum_values(apostleOriginEnum);
assert<
  Equals<keyof typeof apostleOriginValues, "COMMUNITY" | "APOSTLE_MANUAL">
>();

export const approvalStatusEnum = pgEnum("approval_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);
export const approvalStatusValues = extract_pgenum_values(approvalStatusEnum);
assert<
  Equals<keyof typeof approvalStatusValues, "PENDING" | "APPROVED" | "REJECTED">
>();

export const claimStatusEnum = pgEnum("claim_status", [
  "UNCLAIMED",
  "CLAIMED",
  "FAILED",
  "CONVERTED",
]);
export const claimStatusValues = extract_pgenum_values(claimStatusEnum);
assert<
  Equals<
    keyof typeof claimStatusValues,
    "UNCLAIMED" | "CLAIMED" | "FAILED" | "CONVERTED"
  >
>();

export const qualityTagEnum = pgEnum("quality_tag", [
  "UNRATED",
  "HIGH_POTENTIAL",
  "MID_POTENTIAL",
  "LOW_POTENTIAL",
  "BAD_PROSPECT",
]);
export const qualityTagValues = extract_pgenum_values(qualityTagEnum);
assert<
  Equals<
    keyof typeof qualityTagValues,
    | "UNRATED"
    | "HIGH_POTENTIAL"
    | "MID_POTENTIAL"
    | "LOW_POTENTIAL"
    | "BAD_PROSPECT"
  >
>();

export const conversionEventTypeEnum = pgEnum("conversion_event_type", [
  "CONVERTED",
  "FAILED",
]);
export const conversionEventTypeValues = extract_pgenum_values(
  conversionEventTypeEnum,
);
assert<
  Equals<keyof typeof conversionEventTypeValues, "CONVERTED" | "FAILED">
>();

export const conversionSourceEnum = pgEnum("conversion_source", [
  "AUTO_FOLLOW_CHECK",
  "MANUAL_MARK",
]);
export const conversionSourceValues =
  extract_pgenum_values(conversionSourceEnum);
assert<
  Equals<
    keyof typeof conversionSourceValues,
    "AUTO_FOLLOW_CHECK" | "MANUAL_MARK"
  >
>();

export const jobTypeEnum = pgEnum("job_type", [
  "SCRAPE_PROSPECT",
  "EVALUATE_PROSPECT",
  "GENERATE_STRATEGY",
  "CHECK_CONVERSION",
]);
export const jobTypeValues = extract_pgenum_values(jobTypeEnum);
assert<
  Equals<
    keyof typeof jobTypeValues,
    | "SCRAPE_PROSPECT"
    | "EVALUATE_PROSPECT"
    | "GENERATE_STRATEGY"
    | "CHECK_CONVERSION"
  >
>();

export const jobStatusEnum = pgEnum("job_status", [
  "PENDING",
  "RUNNING",
  "FAILED",
  "COMPLETED",
]);
export const jobStatusValues = extract_pgenum_values(jobStatusEnum);
assert<
  Equals<
    keyof typeof jobStatusValues,
    "PENDING" | "RUNNING" | "FAILED" | "COMPLETED"
  >
>();

// ==== Tables ====

/**
 * Authorized apostles in the swarm.
 * Apostles are vetted participants with onchain-gated access.
 */
export const apostlesSchema = createTable(
  "apostles",
  {
    id: uuidv7("id").primaryKey(),
    walletAddress: ss58Address("wallet_address").notNull().unique(),
    xHandle: text("x_handle"),
    displayName: text("display_name"),
    isAdmin: boolean("is_admin").notNull().default(false),
    weight: numeric("weight").notNull().default("1"),
    ...timeFields(),
  },
  (t) => [
    index("apostles_wallet_address_idx").on(t.walletAddress),
    index("apostles_is_admin_idx").on(t.isAdmin),
  ],
);

export type Apostle = typeof apostlesSchema.$inferSelect;
export type ApostleInsert = typeof apostlesSchema.$inferInsert;

/**
 * Prospects - X profiles progressing through claim and conversion states.
 *
 * Origin determines how a prospect entered the system:
 * - COMMUNITY: Submitted by community member with stake
 * - APOSTLE_MANUAL: Added directly by an apostle
 *
 * Approval flow: PENDING → APPROVED → available for claiming
 * Claim flow: UNCLAIMED → CLAIMED → CONVERTED or FAILED
 * Quality tagging helps apostles prioritize effort on unclaimed prospects.
 */
export const prospectsSchema = createTable(
  "prospects",
  {
    id: uuidv7("id").primaryKey(),

    // Identity
    xHandle: varchar("x_handle", { length: 256 }).notNull().unique(),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),

    // Origin & proposal
    origin: apostleOriginEnum("origin").notNull(),
    proposerWalletAddress: ss58Address("proposer_wallet_address"),
    proposerStakeSnapshot: numeric("proposer_stake_snapshot"),
    approvalStatus: approvalStatusEnum("approval_status")
      .notNull()
      .default("PENDING"),

    // Claim & outcome
    claimStatus: claimStatusEnum("claim_status").notNull().default("UNCLAIMED"),
    claimedByApostleId: uuid("claimed_by_apostle_id").references(
      () => apostlesSchema.id,
      { onDelete: "set null" },
    ),
    claimedAt: timestampz("claimed_at"),
    qualityTag: qualityTagEnum("quality_tag").notNull().default("UNRATED"),

    // Evaluation
    resonanceScore: numeric("resonance_score"),
    lastConversionCheckAt: timestampz("last_conversion_check_at"),

    // Metadata
    ...timeFields(),
  },
  (t) => [
    index("prospects_x_handle_idx").on(t.xHandle),
    index("prospects_claim_status_idx").on(t.claimStatus),
    index("prospects_approval_status_idx").on(t.approvalStatus),
    index("prospects_claimed_by_apostle_id_idx").on(t.claimedByApostleId),
    index("prospects_quality_tag_idx").on(t.qualityTag),
    index("prospects_resonance_score_idx").on(t.resonanceScore),
    check(
      "resonance_score_range",
      sql`${t.resonanceScore} IS NULL OR (${t.resonanceScore} >= 0 AND ${t.resonanceScore} <= 10)`,
    ),
  ],
);

export type Prospect = typeof prospectsSchema.$inferSelect;
export type ProspectInsert = typeof prospectsSchema.$inferInsert;

/**
 * Audit trail for conversion and failure events.
 * Tracks the source of status changes (automatic detection or manual marking).
 */
export const conversionLogsSchema = createTable(
  "conversion_logs",
  {
    id: uuidv7("id").primaryKey(),
    prospectId: uuid("prospect_id")
      .notNull()
      .references(() => prospectsSchema.id, { onDelete: "cascade" }),
    apostleId: uuid("apostle_id").references(() => apostlesSchema.id, {
      onDelete: "set null",
    }),
    eventType: conversionEventTypeEnum("event_type").notNull(),
    source: conversionSourceEnum("source").notNull(),
    details: jsonb("details"),
    createdAt: timestampz("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("conversion_logs_prospect_id_idx").on(t.prospectId),
    index("conversion_logs_apostle_id_idx").on(t.apostleId),
    index("conversion_logs_event_type_idx").on(t.eventType),
    index("conversion_logs_created_at_idx").on(t.createdAt),
  ],
);

export type ConversionLog = typeof conversionLogsSchema.$inferSelect;
export type ConversionLogInsert = typeof conversionLogsSchema.$inferInsert;

/**
 * Raw scraped data and generated AI outputs for each prospect.
 * Stores Twitter bio, recent tweets, evaluation profile, and approach strategy.
 * Each prospect has at most one memory record.
 */
export const memoryStoreSchema = createTable(
  "memory_store",
  {
    id: uuidv7("id").primaryKey(),
    prospectId: uuid("prospect_id")
      .notNull()
      .unique()
      .references(() => prospectsSchema.id, { onDelete: "cascade" }),

    // Scraped data
    xBio: text("x_bio"),
    xTweetsRaw: jsonb("x_tweets_raw"),

    // Generated outputs
    evaluationProfile: jsonb("evaluation_profile"),
    approachStrategy: jsonb("approach_strategy"),

    // Timing
    lastScrapedAt: timestampz("last_scraped_at"),
    lastEvaluatedAt: timestampz("last_evaluated_at"),
    lastStrategyAt: timestampz("last_strategy_at"),

    ...timeFields(),
  },
  (t) => [
    index("memory_store_prospect_id_idx").on(t.prospectId),
    index("memory_store_last_scraped_at_idx").on(t.lastScrapedAt),
    index("memory_store_last_evaluated_at_idx").on(t.lastEvaluatedAt),
  ],
);

export type MemoryStore = typeof memoryStoreSchema.$inferSelect;
export type MemoryStoreInsert = typeof memoryStoreSchema.$inferInsert;

/**
 * Job queue for the prospect pipeline.
 * Supports: scraping, evaluation, strategy generation, and conversion checks.
 * Jobs are picked up by workers and status is tracked with optional error details.
 */
export const jobsQueueSchema = createTable(
  "jobs_queue",
  {
    id: uuidv7("id").primaryKey(),
    jobType: jobTypeEnum("job_type").notNull(),
    payload: jsonb("payload").notNull(),
    status: jobStatusEnum("status").notNull().default("PENDING"),
    runAt: timestampz("run_at").notNull().defaultNow(),
    lastError: text("last_error"),
    ...timeFields(),
  },
  (t) => [
    index("jobs_queue_status_idx").on(t.status),
    index("jobs_queue_job_type_idx").on(t.jobType),
    index("jobs_queue_run_at_idx").on(t.runAt),
    index("jobs_queue_status_run_at_idx").on(t.status, t.runAt),
  ],
);

export type JobsQueue = typeof jobsQueueSchema.$inferSelect;
export type JobsQueueInsert = typeof jobsQueueSchema.$inferInsert;
