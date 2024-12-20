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
    id_: serial("id").primaryKey(),

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
 * The user can set a allocation (vote) for an Agent.
 */
export const userAgentAllocationSchema = createTable(
  "user_agent_allocation",
  {
    id_: serial("id").primaryKey(),

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
 * Aggregates the allocations of each user for each agent.
 */
export const computedAgentAllocationSchema = createTable(
  "computed_agent_allocation",
  {
    id_: serial("id").primaryKey(),
    atBlock: integer("at_block").notNull(),

    agentKey: ss58Address("agent_key")
      .notNull()
      .references(() => agentSchema.key),

    // Aggregated allocations measured in nanos
    stakeAllocation: bigint("stake_allocation").notNull(),
    // Normalized aggregated Allocations (100% sum)
    percAllocation: real("perc_allocation").notNull(),

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
  id_: serial("id").primaryKey(),

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

export const governanceItemTypeValues =
  extract_pgenum_values(governanceItemType);

export const commentSchema = createTable(
  "comment",
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
  (t) => [
    unique().on(t.itemType, t.itemId, t.userKey),
    index().on(t.itemType, t.itemId),
  ],
);

/**
 * A vote made by a user on a comment.
 */
export const voteType = pgEnum("governance_item_type", ["UP", "DOWN"]);

const voteTypeValues = extract_pgenum_values(voteType);

export const commentInteractionSchema = createTable(
  "comment_interaction",
  {
    id_: serial("id").primaryKey(),

    userKey: ss58Address("user_key").notNull(),
    commentId: integer("comment_id")
      .references(() => commentSchema.id)
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
      id: commentSchema.id,
      itemType: commentSchema.itemType,
      itemId: commentSchema.itemId,
      userKey: commentSchema.userKey,
      userName: commentSchema.userName,
      content: commentSchema.content,
      createdAt: commentSchema.createdAt,
      upvotes:
        sql<number>`SUM(CASE WHEN ${commentInteractionSchema.voteType} = ${voteTypeValues.UP} THEN 1 ELSE 0 END)`
          .mapWith(Number)
          .as("upvotes"),
      downvotes:
        sql<number>`SUM(CASE WHEN ${commentInteractionSchema.voteType} = ${voteTypeValues.DOWN} THEN 1 ELSE 0 END)`
          .mapWith(Number)
          .as("downvotes"),
    })
    .from(commentSchema)
    .where(sql`${commentSchema.deletedAt} IS NULL`)
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
});

/**
 * A report made by a user about a comment.
 */
export const commentReportSchema = createTable("comment_report", {
  id_: serial("id").primaryKey(),

  userKey: ss58Address("user_key"),
  commentId: integer("comment_id")
    .references(() => commentSchema.id)
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
  id_: serial("id").primaryKey(),

  userKey: ss58Address("user_key").notNull().unique(),
  discordId: varchar("discord_id", { length: 64 }),

  createdAt: timestampzNow("created_at"),
  updatedAt: timestampzNow("updated_at").$onUpdateFn(() => sql`now()`),
  deletedAt: timestampz("deleted_at").default(sql`null`),
});

/**
 * Users can apply to join the Cadre.
 */
export const cadreCandidateSchema = createTable("cadre_candidate", {
  id_: serial("id").primaryKey(),

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
  id_: serial("id").primaryKey(),

  userKey: ss58Address("user_key")
    .references(() => cadreSchema.userKey)
    .notNull(),
  applicantKey: ss58Address("applicant_key")
    .references(() => cadreCandidateSchema.userKey)
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
    id_: serial("id").primaryKey(),

    applicationId: integer("application_id").notNull(),
    userKey: ss58Address("user_key")
      .references(() => cadreSchema.userKey)
      .notNull(),

    vote: applicationVoteType("vote").notNull(),

    createdAt: timestampzNow("created_at"),
    updatedAt: timestampzNow("updated_at").$onUpdateFn(() => sql`now()`),
    deletedAt: timestampz("deleted_at").default(sql`null`),
  },
  (t) => [unique().on(t.applicationId, t.userKey)],
);

/**
 * Auxiliary table to store the notification of a governance proposals / DAOs.
 */
export const governanceNotificationSchema = createTable(
  "governance_notification",
  {
    id_: serial("id").primaryKey(),
    itemType: governanceItemType("item_type").notNull(),
    itemId: integer("item_id").notNull(),
    notifiedAt: timestampz("notified_at").defaultNow(),
  },
);
