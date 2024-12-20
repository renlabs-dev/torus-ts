import { asc, eq, sql } from "drizzle-orm";
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
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `${name}`);

import { extract_pgenum_values } from "./utils";

// ==== Util ====

export const bigint = (name: string) => drizzleBigint(name, { mode: "bigint" });

export const timestampz = (name: string) =>
  drizzleTimestamp(name, { withTimezone: true, mode: "date" });

export const timestampzNow = (name: string) =>
  timestampz(name).defaultNow().notNull();

export const ss58Address = (name: string) => varchar(name, { length: 256 });
export const bigint = (name: string) => drizzleBigint(name, { mode: "bigint" });

// ==== Agents ====

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
    key: ss58Address("key"),
    name: text("name"),
    apiUrl: text("api_url"),
    metadataUri: text("metadata_uri"),
    weightFactor: integer("weight_factor"), // percentage

    isWhitelisted: boolean("is_whitelisted"),
    registrationBlock: integer("registration_block"),

    totalStaked: bigint("total_staked"),
    totalStakers: integer("total_stakers"),

    createdAt: timestampzNow("created_at"),
    updatedAt: timestampzNow("updated_at").$onUpdateFn(() => sql`now()`),
    deletedAt: timestampz("deleted_at").default(sql`null`),
  },
  (t) => [unique().on(t.key), index("key_index").on(t.key)],
);

// ==== Agent Allocator ====

/**
 * Data for the relation a user have with an specific Agent.
 * The user can set a weight (vote) for an Agent.
 */
export const userAgentAllocationSchema = createTable(
  "user_agent_allocation",
  {
    id: serial("id").primaryKey(),
    userKey: ss58Address("user_key").notNull(),
    agentKey: ss58Address("agent_key")
      .notNull()
      .references(() => agentSchema.key),

    allocation: integer("allocation").default(0).notNull(),

    createdAt: timestampzNow("created_at"),
    updatedAt: timestampzNow("updated_at").$onUpdateFn(() => sql`now()`),
    deletedAt: timestampz("deleted_at").default(sql`null`),
  },
  (t) => [unique().on(t.userKey, t.agentKey)],
);

/**
 * Aggregates the weights of each user for each agent.
 */
export const computedAgentWeightsSchema = createTable(
  "computed_agent_weights",
  {
    id: serial("id").primaryKey(),
    atBlock: integer("at_block").notNull(),

    agentId: integer("agent_id")
      .notNull()
      .references(() => agentSchema.id),

    // Aggregated weights measured in nanos
    stakeWeight: bigint("stake_weight").notNull(),
    // Normalized aggregated weights (100% sum)
    percWeight: real("perc_weight").notNull(),

    createdAt: timestampzNow("created_at"),
    updatedAt: timestampzNow("updated_at").$onUpdateFn(() => sql`now()`),
    deletedAt: timestampz("deleted_at").default(sql`null`),
  },
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

  userKey: ss58Address("user_key"),
  agentKey: ss58Address("agent_key")
    .references(() => agentSchema.key)
    .notNull(),

  reason: reportReason("reason").notNull(),
  content: text("content"),

  createdAt: timestampzNow("created_at"),
  updatedAt: timestampzNow("updated_at").$onUpdateFn(() => sql`now()`),
  deletedAt: timestampz("deleted_at").default(sql`null`),
});

// ==== Governance ====

/**
 * A comment made by a user on a Proposal or Agent Application.
 */
export const governanceItemType = pgEnum("governance_item_type", [
  "PROPOSAL",
  "AGENT_APPLICATION",
]);

export const governanceCommentSchema = createTable(
  "governance_comment",
  {
    id: serial("id").primaryKey(),

    itemType: governanceItemType("item_type").notNull(),
    itemId: integer("item_id").notNull(),

    userKey: ss58Address("user_key").notNull(),
    userName: text("user_name"),
    content: text("content").notNull(),

    createdAt: timestampzNow("created_at"),
    deletedAt: timestampz("deleted_at").default(sql`null`),
  },
  (t) => [unique().on(t.itemType, t.itemId), index().on(t.itemType, t.itemId)],
);

/**
 * A vote made by a user on a comment.
 */
export const voteType = pgEnum("governance_item_type", ["UP", "DOWN"]);

const voteTypeValues = extract_pgenum_values(voteType);

export const commentInteractionSchema = createTable(
  "comment_interaction",
  {
    id: serial("id").primaryKey(),

    userKey: ss58Address("user_key").notNull(),
    commentId: integer("comment_id")
      .references(() => governanceCommentSchema.id)
      .notNull(),

    voteType: voteType("vote_type").notNull(),

    createdAt: timestampzNow("created_at"),
  },
  (t) => [
    unique().on(t.userKey, t.commentId),
    index().on(t.userKey, t.commentId),
  ],
);

/**
 * A view that aggregates votes on comments.
 * This view computes the number of upvotes and downvotes for each comment at
 * write time so that we can query the data more efficiently.
 */
export const proposalCommentDigestView = pgMaterializedView(
  "comment_digest",
).as((qb) => {
  return qb
    .select({
      id: governanceCommentSchema.id,
      itemType: governanceCommentSchema.itemType,
      itemId: governanceCommentSchema.itemId,
      userKey: governanceCommentSchema.userKey,
      userName: governanceCommentSchema.userName,
      content: governanceCommentSchema.content,
      createdAt: governanceCommentSchema.createdAt,
      upvotes:
        sql<number>`SUM(CASE WHEN ${commentInteractionSchema.voteType} = ${voteTypeValues.UP} THEN 1 ELSE 0 END)`
          .mapWith(Number)
          .as("upvotes"),
      downvotes:
        sql<number>`SUM(CASE WHEN ${commentInteractionSchema.voteType} = ${voteTypeValues.DOWN} THEN 1 ELSE 0 END)`
          .mapWith(Number)
          .as("downvotes"),
    })
    .from(governanceCommentSchema)
    .where(sql`${governanceCommentSchema.deletedAt} IS NULL`)
    .leftJoin(
      commentInteractionSchema,
      eq(governanceCommentSchema.id, commentInteractionSchema.commentId),
    )
    .groupBy(
      governanceCommentSchema.id,
      governanceCommentSchema.itemType,
      governanceCommentSchema.itemId,
      governanceCommentSchema.userKey,
      governanceCommentSchema.content,
      governanceCommentSchema.createdAt,
    )
    .orderBy(asc(governanceCommentSchema.createdAt));
});

/**
 * A report made by a user about a comment.
 */
export const commentReportSchema = createTable("comment_report", {
  id: serial("id").primaryKey(),

  userKey: ss58Address("user_key"),
  commentId: integer("comment_id")
    .references(() => governanceCommentSchema.id)
    .notNull(),

  reason: reportReason("reason").notNull(),
  content: text("content"),

  createdAt: timestampzNow("created_at"),
});

// ---- Cadre ----

/**
 * A groups of users that can vote on Applications.
 */
export const cadreSchema = createTable("cadre", {
  id: serial("id").primaryKey(),

  userKey: ss58Address("user_key").notNull().unique(),
  discordId: varchar("discord_id", { length: 64 }),

  createdAt: timestampzNow("created_at"),
  updatedAt: timestampzNow("updated_at").$onUpdateFn(() => sql`now()`),
  deletedAt: timestampz("deleted_at").default(sql`null`),
});

/**
 * Users can apply to join the Cadre.
 */
export const cadreCandidatesSchema = createTable("cadre_candidates", {
  id: serial("id").primaryKey(),

  userKey: ss58Address("user_key").notNull().unique(),
  discordId: varchar("discord_id", { length: 64 }),

  content: text("content").notNull(),

  createdAt: timestampzNow("created_at"),
  deletedAt: timestampz("deleted_at").default(sql`null`),
});

export const cadreVoteTypeEnum = pgEnum("cadre_vote_type", [
  "ACCEPT",
  "REFUSE",
]);

/**
 * This table stores votes on Cadre Candidates.
 */
export const cadreVoteSchema = createTable("cadre_vote", {
  id: serial("id").primaryKey(),

  userKey: ss58Address("user_key")
    .references(() => cadreSchema.userKey)
    .notNull(),
  applicantKey: ss58Address("applicant_key")
    .references(() => cadreCandidatesSchema.userKey)
    .notNull(),
  vote: cadreVoteTypeEnum("vote").notNull(),

  createdAt: timestampzNow("created_at"),
  updatedAt: timestampzNow("updated_at").$onUpdateFn(() => sql`now()`),
  deletedAt: timestampz("deleted_at").default(sql`null`),
});

/**
 * this doesn't make sense wtf
 */
export const applicationVoteType = pgEnum("agent_application_vote_type", [
  "ACCEPT",
  "REFUSE",
  "REMOVE",
]);

/**
 * This table stores votes on Agent Applications.
 */
export const agentApplicationVoteSchema = createTable(
  "agent_application_vote",
  {
    id: serial("id").primaryKey(),

    applicationId: integer("application_id").notNull(),
    userKey: ss58Address("user_key")
      .references(() => cadreSchema.userKey)
      .notNull(),

    vote: applicationVoteType("vote").notNull(),

    createdAt: timestampzNow("created_at"),
    updatedAt: timestampzNow("updated_at").$onUpdateFn(() => sql`now()`),
    deletedAt: timestampz("deleted_at").default(sql`null`),
  },
  (t) => [unique().on(t.id, t.applicationId, t.userKey)],
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
  },
);
