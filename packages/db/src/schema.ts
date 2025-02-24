import { extract_pgenum_values } from "./utils";
import { asc, eq, sql, isNull, sum } from "drizzle-orm";
import {
  bigint as drizzleBigint,
  boolean,
  index,
  integer,
  pgEnum,
  pgMaterializedView,
  pgTableCreator,
  serial,
  text,
  timestamp as drizzleTimestamp,
  unique,
  varchar,
  real,
  check,
  numeric,
} from "drizzle-orm/pg-core";
import type { Equals } from "tsafe";
import { assert } from "tsafe";
import { number } from "zod";
import { time } from "console";

export const createTable = pgTableCreator((name) => `${name}`);

// ==== Util ====

export const bigint = (name: string) => drizzleBigint(name, { mode: "bigint" });

export const timestampz = (name: string) =>
  drizzleTimestamp(name, { withTimezone: true, mode: "date" });

export const timestampzNow = (name: string) =>
  timestampz(name).defaultNow().notNull();

export const ss58Address = (name: string) => varchar(name, { length: 256 });

export const timeFields = () => ({
  createdAt: timestampzNow("created_at"),
  updatedAt: timestampzNow("updated_at").$onUpdate(() => new Date()),
  deletedAt: timestampz("deleted_at").default(sql`null`),
});

// ==== Agents ====

/**
 * Agents registered on the Torus chain.
 *
 * lastSeenBlock = max(atBlock)
 * atBlock == lastSeenBlock --> registered
 * atBlock <  lastSeenBlock --> deregistered
 */
export const agentSchema = createTable(
  "agent",
  {
    id: serial("id").primaryKey(),

    // Insertion timestamp
    atBlock: integer("at_block").notNull(),

    // Actual identifier
    key: ss58Address("key").notNull(),
    name: text("name"),
    apiUrl: text("api_url"),
    metadataUri: text("metadata_uri"),
    weightFactor: integer("weight_factor"),

    isWhitelisted: boolean("is_whitelisted"),
    registrationBlock: integer("registration_block"),

    totalStaked: bigint("total_staked"),
    totalStakers: integer("total_stakers"),

    ...timeFields(),
  },
  (t) => [
    unique().on(t.key),
    index("key_index").on(t.key),
    check(
      "percent_check",
      sql`${t.weightFactor} >= 0 and ${t.weightFactor} <= 100`,
    ),
  ],
);

// ==== Agent Allocator ====

/**
 * Data for the relation a user have with an specific Agent.
 * The user can set a weight allocation (vote) for an Agent.
 */
export const userAgentWeightSchema = createTable(
  "user_agent_weight",
  {
    id: serial("id").primaryKey(),

    userKey: ss58Address("user_key").notNull(),
    agentKey: ss58Address("agent_key")
      .notNull()
      .references(() => agentSchema.key),

    weight: real("weight").default(0).notNull(),

    ...timeFields(),
  },
  (t) => [unique().on(t.userKey, t.agentKey)],
);

/**
 * Aggregates the weight allocations of all users for each agent.
 */
export const computedAgentWeightSchema = createTable("computed_agent_weight", {
  id: serial("id").primaryKey(),
  atBlock: integer("at_block").notNull(),

  agentKey: ss58Address("agent_key")
    .notNull()
    .references(() => agentSchema.key),

  // Aggregated weight allocations measured in Rems
  computedWeight: numeric("computed_weight").notNull(),
  // Normalized aggregated allocations (100% sum)
  percComputedWeight: real("perc_computed_weight").notNull(),

  ...timeFields(),
});

export const applicationStatus = pgEnum("application_status", [
  "OPEN",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
]);
export const applicationStatusValues = extract_pgenum_values(applicationStatus);
assert<
  Equals<
    keyof typeof applicationStatusValues,
    "OPEN" | "ACCEPTED" | "REJECTED" | "EXPIRED"
  >
>();
export const whitelistApplicationSchema = createTable("whitelist_application", {
  id: serial("id").primaryKey(),

  agentKey: ss58Address("user_key").notNull().unique(),
  payerKey: ss58Address("payer_key").notNull(),
  data: text("data").notNull(),
  cost: numeric("cost").notNull(),
  expiresAt: integer("expires_at").notNull(), // block
  status: applicationStatus("status").notNull(),
  notified: boolean("notified").notNull().default(false), // offchain
  ...timeFields(),
});

export const penalizeAgentVotesSchema = createTable(
  "penalize_agent_votes",
  {
    id: serial("id").primaryKey(),
    agentKey: ss58Address("agent_key").notNull(),
    cadreKey: ss58Address("cadre_key")
      .notNull()
      .references(() => cadreSchema.userKey),
    penaltyFactor: integer("penalty_factor").notNull(),
    content: text("content").notNull(),
    executed: boolean("executed").notNull().default(false),
    ...timeFields(),
  },
  (t) => [
    unique().on(t.agentKey, t.cadreKey),
    check(
      "percent_check",
      sql`${t.penaltyFactor} >= 0 and ${t.penaltyFactor} <= 100`,
    ),
  ],
);

// ---- Reports ----

/**
 * A report made by an user about an Agent.
 */
export const reportReason = pgEnum("report_reason", [
  "SPAM",
  "VIOLENCE",
  "HARASSMENT",
  "HATE_SPEECH",
  "SEXUAL_CONTENT",
]);

export const agentReportSchema = createTable("agent_report", {
  id: serial("id").primaryKey(),

  userKey: ss58Address("user_key").notNull(),
  agentKey: ss58Address("agent_key")
    .references(() => agentSchema.key)
    .notNull(),

  reason: reportReason("reason").notNull(),
  content: text("content"),

  ...timeFields(),
});

// ==== Governance ====

/**
 * A comment made by a user on a Proposal or Agent Application.
 */


export const proposalSchema = createTable(
  "proposal",
  {
    id: serial("id").primaryKey(),
    expirationBlock: integer("expiration_block").notNull(),
    status: applicationStatus("status").notNull(),
    proposerKey: ss58Address("proposer_key").notNull(),
    creationBlock: integer("creation_block").notNull(),
    metadataUri: text("metadata_uri").notNull(),
    proposalCost: numeric("proposal_cost").notNull(),
    notified: boolean("notified").notNull().default(false),
    ...timeFields(),

  },
);


export const governanceItemType = pgEnum("governance_item_type", [
  "PROPOSAL",
  "AGENT_APPLICATION",
]);

export const governanceItemTypeValues =
  extract_pgenum_values(governanceItemType);

assert<
  Equals<
    keyof typeof governanceItemTypeValues,
    "PROPOSAL" | "AGENT_APPLICATION"
  >
>();

export const commentSchema = createTable(
  "comment",
  {
    id: serial("id").primaryKey(),

    itemType: governanceItemType("item_type").notNull(),
    itemId: integer("item_id").notNull(),
    userKey: ss58Address("user_key").notNull(),

    userName: text("user_name"),
    content: text("content").notNull(),

    ...timeFields(),
  },
  (t) => [index().on(t.itemType, t.itemId, t.userKey)],
);

/**
 * A vote made by a user on a comment.
 */
export const reactionType = pgEnum("reaction_type", ["LIKE", "DISLIKE"]);

export const reactionTypeValues = extract_pgenum_values(reactionType);

export const commentInteractionSchema = createTable(
  "comment_interaction",
  {
    id: serial("id").primaryKey(),

    userKey: ss58Address("user_key").notNull(),
    commentId: integer("comment_id")
      .references(() => commentSchema.id)
      .notNull(),

    reactionType: reactionType("reaction_type").notNull(),

    ...timeFields(),
  },
  (t) => [
    unique().on(t.userKey, t.commentId),
    index().on(t.userKey, t.commentId),
  ],
);

/**
 * A view that aggregates votes on comments.
 * This view computes the number of likes and dislikes for each comment at
 * write time so that we can query the data more efficiently.
 */
export const commentDigestView = pgMaterializedView("comment_digest").as(
  (qb) => {
    return qb
      .select({
        id: commentSchema.id,
        itemType: commentSchema.itemType,
        itemId: commentSchema.itemId,
        userKey: commentSchema.userKey,
        userName: commentSchema.userName,
        content: commentSchema.content,
        createdAt: commentSchema.createdAt,
        likes: sum(
          sql<number>`CASE WHEN ${commentInteractionSchema.reactionType} = ${reactionTypeValues.LIKE} THEN 1 ELSE 0 END`,
        ).as("likes"),

        dislikes: sum(
          sql<number>`CASE WHEN ${commentInteractionSchema.reactionType} = ${reactionTypeValues.DISLIKE} THEN 1 ELSE 0 END`,
        ).as("dislikes"),
      })
      .from(commentSchema)
      .where(isNull(commentSchema.deletedAt))
      .leftJoin(
        commentInteractionSchema,
        eq(commentSchema.id, commentInteractionSchema.commentId),
      )
      .groupBy(
        commentSchema.id,
        commentSchema.itemType,
        commentSchema.itemId,
        commentSchema.userKey,
        commentSchema.content,
        commentSchema.createdAt,
      )
      .orderBy(asc(commentSchema.createdAt));
  },
);

/**
 * A report made by a user about a comment.
 */
export const commentReportSchema = createTable("comment_report", {
  id: serial("id").primaryKey(),

  userKey: ss58Address("user_key").notNull(),
  commentId: integer("comment_id")
    .references(() => commentSchema.id)
    .notNull(),

  reason: reportReason("reason").notNull(),
  content: text("content"),

  ...timeFields(),
});

// ---- Cadre ----

const DISCORD_ID_LENGTH = 20;
/**
 * A groups of users that can vote on Applications.
 */
export const cadreSchema = createTable(
  "cadre",
  {
    id: serial("id").primaryKey(),

    userKey: ss58Address("user_key").notNull().unique(),
    discordId: varchar("discord_id", { length: DISCORD_ID_LENGTH }).notNull(),

    ...timeFields(),
  },
  (t) => [
    check("discord_id_check", sql`LENGTH(${t.discordId}) BETWEEN 17 AND 20 `),
  ],
);

export const candidacyStatus = pgEnum("candidacy_status", [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "REMOVED",
]);
export const candidacyStatusValues = extract_pgenum_values(candidacyStatus);

// TODO: test autoupdate on the notified field
export const cadreCandidateSchema = createTable(
  "cadre_candidate",
  {
    id: serial("id").primaryKey(),

    userKey: ss58Address("user_key").notNull().unique(),
    discordId: varchar("discord_id", { length: DISCORD_ID_LENGTH }).notNull(),
    candidacyStatus: candidacyStatus("candidacy_status")
      .notNull()
      .default(candidacyStatusValues.PENDING),
    content: text("content").notNull(),
    notified: boolean("notified").notNull().default(false),

    ...timeFields(),
  },
  (t) => [
    check("discord_id_check", sql`LENGTH(${t.discordId}) BETWEEN 17 AND 20 `),
  ],
);

export const applicationVoteType = pgEnum("agent_application_vote_type", [
  "ACCEPT",
  "REFUSE",
  "REMOVE",
]);

/**
 * This table stores votes on Cadre Candidates.
 */
export const cadreVoteSchema = createTable(
  "cadre_vote",
  {
    id: serial("id").primaryKey(),

    userKey: ss58Address("user_key")
      .references(() => cadreSchema.userKey)
      .notNull(),
    applicantKey: ss58Address("applicant_key")
      .references(() => cadreCandidateSchema.userKey)
      .notNull(),
    vote: applicationVoteType("vote").notNull(), // TODO: create a new type

    ...timeFields(),
  },
  (t) => [unique().on(t.userKey, t.applicantKey)],
);

export const cadreVoteHistory = createTable("cadre_vote_history", {
  id: serial("id").primaryKey(),
  userKey: ss58Address("user_key").notNull(),
  applicantKey: ss58Address("applicant_key").notNull(),
  vote: applicationVoteType("vote").notNull(),

  ...timeFields(),
});

/**
 * This table stores votes on Agent Applications.
 */
export const agentApplicationVoteSchema = createTable(
  "agent_application_vote",
  {
    id: serial("id").primaryKey(),

    // We have no guarantees that the applicationId is valid.
    applicationId: integer("application_id").notNull(),
    userKey: ss58Address("user_key")
      .references(() => cadreSchema.userKey)
      .notNull(),

    vote: applicationVoteType("vote").notNull(),

    ...timeFields(),
  },
  (t) => [unique().on(t.applicationId, t.userKey)],
);

/**
 * Auxiliary table to store the notification of a governance proposals / DAOs.
 */
export const governanceNotificationSchema = createTable(
  "governance_notification",
  {
    id: serial("id").primaryKey(),
    itemType: governanceItemType("item_type").notNull(),
    itemId: integer("item_id").notNull(),
    notifiedAt: timestampz("notified_at").defaultNow(),
    ...timeFields(),
  },
);
