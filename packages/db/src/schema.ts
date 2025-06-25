import { asc, eq, isNull, sql, sum } from "drizzle-orm";
import {
  boolean,
  check,
  bigint as drizzleBigint,
  timestamp as drizzleTimestamp,
  index,
  integer,
  numeric,
  pgEnum,
  pgMaterializedView,
  pgTableCreator,
  real,
  serial,
  text,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { Equals } from "tsafe";
import { assert } from "tsafe";
import { extract_pgenum_values } from "./utils";

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
    .references(() => agentSchema.key)
    .unique(),
  // Aggregated weight allocations measured in Rems
  computedWeight: numeric("computed_weight").notNull(),
  // Normalized aggregated allocations (100% sum)
  percComputedWeight: real("perc_computed_weight").notNull(),

  ...timeFields(),
});

export const applicationStatus = pgEnum("application_status", [
  "Open",
  "Accepted",
  "Rejected",
  "Expired",
]);
export const applicationStatusValues = extract_pgenum_values(applicationStatus);
assert<
  Equals<
    keyof typeof applicationStatusValues,
    "Open" | "Accepted" | "Rejected" | "Expired"
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

export const proposalSchema = createTable("proposal", {
  id: serial("id").primaryKey(),
  expirationBlock: integer("expiration_block").notNull(),
  status: applicationStatus("status").notNull(),
  proposerKey: ss58Address("proposer_key").notNull(),
  creationBlock: integer("creation_block").notNull(),
  metadataUri: text("metadata_uri").notNull(),
  proposalCost: numeric("proposal_cost").notNull(),
  notified: boolean("notified").notNull().default(false),
  proposalID: integer("proposal_id").notNull().unique(),
  ...timeFields(),
});

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
    discordId: varchar("discord_id", { length: DISCORD_ID_LENGTH })
      .notNull()
      .unique(),

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
    discordId: varchar("discord_id", { length: DISCORD_ID_LENGTH })
      .notNull()
      .unique(),
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
 * This table stores the Discord information for cadre candidates.
 */
export const userDiscordInfoSchema = createTable(
  "user_discord_info",
  {
    id: serial("id").primaryKey(),
    discordId: varchar("discord_id", { length: DISCORD_ID_LENGTH })
      .notNull()
      .unique(),
    userName: text("user_name").notNull(),
    avatarUrl: text("avatar_url"),
    ...timeFields(),
  },
  (t) => [
    check("discord_id_check", sql`LENGTH(${t.discordId}) BETWEEN 17 AND 20 `),
  ],
);

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

// ==== Permissions ====

export const permissionDurationType = pgEnum("permission_duration_type", [
  "until_block", 
  "indefinite"
]);

export const permissionRevocationType = pgEnum("permission_revocation_type", [
  "irrevocable",
  "revocable_by_grantor", 
  "revocable_by_arbiters",
  "revocable_after"
]);

export const permissionEnforcementType = pgEnum("permission_enforcement_type", [
  "none",
  "controlled_by"
]);

export const emissionAllocationType = pgEnum("emission_allocation_type", [
  "streams",
  "fixed_amount"
]);

export const emissionDistributionType = pgEnum("emission_distribution_type", [
  "manual",
  "automatic", 
  "at_block",
  "interval"
]);

/**
 * Main permissions table - stores core permission data
 */
export const permissionsSchema = createTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(), // Internal database ID
  permissionId: varchar("permission_id", { length: 66 }).notNull().unique(), // Substrate H256 hash
  grantorAccountId: ss58Address("grantor_account_id").notNull(),
  granteeAccountId: ss58Address("grantee_account_id").notNull(),
  
  durationType: permissionDurationType("duration_type").notNull(),
  durationBlockNumber: bigint("duration_block_number"), // NULL for indefinite
  
  revocationType: permissionRevocationType("revocation_type").notNull(),
  revocationBlockNumber: bigint("revocation_block_number"), // For revocable_after
  revocationRequiredVotes: bigint("revocation_required_votes"), // For revocable_by_arbiters (u32 range)
  
  enforcementType: permissionEnforcementType("enforcement_type").notNull().default("none"),
  enforcementRequiredVotes: bigint("enforcement_required_votes"), // For controlled_by (u32 range)
  
  lastExecutionBlock: bigint("last_execution_block"),
  executionCount: integer("execution_count").notNull().default(0),
  createdAtBlock: bigint("created_at_block").notNull(),
  
  ...timeFields(),
}, (t) => [
  // Constraints for valid data
  check("valid_duration", sql`
    (${t.durationType} = 'until_block' AND ${t.durationBlockNumber} IS NOT NULL) OR
    (${t.durationType} = 'indefinite' AND ${t.durationBlockNumber} IS NULL)
  `),
  check("valid_revocation_after", sql`
    (${t.revocationType} = 'revocable_after' AND ${t.revocationBlockNumber} IS NOT NULL) OR
    (${t.revocationType} != 'revocable_after' AND ${t.revocationBlockNumber} IS NULL)
  `),
  check("valid_arbiters", sql`
    (${t.revocationType} = 'revocable_by_arbiters' AND ${t.revocationRequiredVotes} IS NOT NULL) OR
    (${t.revocationType} != 'revocable_by_arbiters' AND ${t.revocationRequiredVotes} IS NULL)
  `),
  check("valid_enforcement", sql`
    (${t.enforcementType} = 'controlled_by' AND ${t.enforcementRequiredVotes} IS NOT NULL) OR
    (${t.enforcementType} = 'none' AND ${t.enforcementRequiredVotes} IS NULL)
  `),
  // Indexes for performance
  index("permissions_substrate_id_idx").on(t.permissionId), // Critical for Substrate lookups
  index("permissions_grantor_idx").on(t.grantorAccountId),
  index("permissions_grantee_idx").on(t.granteeAccountId),
  index("permissions_duration_idx").on(t.durationType, t.durationBlockNumber),
  index("permissions_created_at_idx").on(t.createdAtBlock),
]);

/**
 * Separate table for parent-child permission relationships
 */
export const permissionHierarchiesSchema = createTable("permission_hierarchies", {
  childPermissionId: varchar("child_permission_id", { length: 66 }).notNull().references(() => permissionsSchema.permissionId, { onDelete: "cascade" }),
  parentPermissionId: varchar("parent_permission_id", { length: 66 }).notNull().references(() => permissionsSchema.permissionId, { onDelete: "cascade" }),
  ...timeFields(),
}, (t) => [
  { primaryKey: { columns: [t.childPermissionId, t.parentPermissionId] } },
  unique().on(t.childPermissionId, t.parentPermissionId),
]);

/**
 * Revocation arbiters (for revocable_by_arbiters permissions)
 */
export const permissionRevocationArbitersSchema = createTable("permission_revocation_arbiters", {
  permissionId: varchar("permission_id", { length: 66 }).notNull().references(() => permissionsSchema.permissionId, { onDelete: "cascade" }),
  accountId: ss58Address("account_id").notNull(),
}, (t) => [
  { primaryKey: { columns: [t.permissionId, t.accountId] } },
  unique().on(t.permissionId, t.accountId),
]);

/**
 * Enforcement controllers (for controlled_by permissions)
 */
export const permissionEnforcementControllersSchema = createTable("permission_enforcement_controllers", {
  permissionId: varchar("permission_id", { length: 66 }).notNull().references(() => permissionsSchema.permissionId, { onDelete: "cascade" }),
  accountId: ss58Address("account_id").notNull(),
}, (t) => [
  { primaryKey: { columns: [t.permissionId, t.accountId] } },
  unique().on(t.permissionId, t.accountId),
]);

/**
 * Tracking revocation votes
 */
export const permissionRevocationVotesSchema = createTable("permission_revocation_votes", {
  permissionId: varchar("permission_id", { length: 66 }).notNull().references(() => permissionsSchema.permissionId, { onDelete: "cascade" }),
  voterAccountId: ss58Address("voter_account_id").notNull(),
  votedAt: timestampzNow("voted_at"),
}, (t) => [
  { primaryKey: { columns: [t.permissionId, t.voterAccountId] } },
  index("revocation_votes_permission_idx").on(t.permissionId),
]);

/**
 * Tracking enforcement votes/states
 */
export const permissionEnforcementTrackingSchema = createTable("permission_enforcement_tracking", {
  permissionId: varchar("permission_id", { length: 66 }).notNull().references(() => permissionsSchema.permissionId, { onDelete: "cascade" }),
  controllerAccountId: ss58Address("controller_account_id").notNull(),
  voteState: boolean("vote_state").notNull(),
  votedAt: timestampzNow("voted_at"),
}, (t) => [
  { primaryKey: { columns: [t.permissionId, t.controllerAccountId] } },
  index("enforcement_tracking_permission_idx").on(t.permissionId),
]);

/**
 * Emission permissions
 */
export const emissionPermissionsSchema = createTable("emission_permissions", {
  permissionId: varchar("permission_id", { length: 66 }).primaryKey().references(() => permissionsSchema.permissionId, { onDelete: "cascade" }),
  
  // Allocation type and data
  allocationType: emissionAllocationType("allocation_type").notNull(),
  fixedAmount: numeric("fixed_amount", { precision: 65, scale: 12 }), // For fixed_amount allocations
  
  // Distribution control
  distributionType: emissionDistributionType("distribution_type").notNull(),
  distributionThreshold: numeric("distribution_threshold", { precision: 65, scale: 12 }), // For automatic
  distributionTargetBlock: bigint("distribution_target_block"), // For at_block
  distributionIntervalBlocks: bigint("distribution_interval_blocks"), // For interval
  
  accumulating: boolean("accumulating").notNull().default(true),
  
  ...timeFields(),
}, (t) => [
  // Constraints for valid data
  check("valid_fixed_amount", sql`
    (${t.allocationType} = 'fixed_amount' AND ${t.fixedAmount} IS NOT NULL) OR
    (${t.allocationType} = 'streams' AND ${t.fixedAmount} IS NULL)
  `),
  check("valid_automatic", sql`
    (${t.distributionType} = 'automatic' AND ${t.distributionThreshold} IS NOT NULL) OR
    (${t.distributionType} != 'automatic' AND ${t.distributionThreshold} IS NULL)
  `),
  check("valid_at_block", sql`
    (${t.distributionType} = 'at_block' AND ${t.distributionTargetBlock} IS NOT NULL) OR
    (${t.distributionType} != 'at_block' AND ${t.distributionTargetBlock} IS NULL)
  `),
  check("valid_interval", sql`
    (${t.distributionType} = 'interval' AND ${t.distributionIntervalBlocks} IS NOT NULL) OR
    (${t.distributionType} != 'interval' AND ${t.distributionIntervalBlocks} IS NULL)
  `),
  // Indexes
  index("emission_allocation_type_idx").on(t.allocationType),
  index("emission_distribution_type_idx").on(t.distributionType),
  index("emission_accumulating_idx").on(t.accumulating),
]);

/**
 * Stream allocations (for stream-based permissions)
 */
export const emissionStreamAllocationsSchema = createTable("emission_stream_allocations", {
  permissionId: varchar("permission_id", { length: 66 }).notNull().references(() => emissionPermissionsSchema.permissionId, { onDelete: "cascade" }),
  streamId: varchar("stream_id", { length: 66 }).notNull(), // Substrate H256 hash, same as permission IDs
  percentage: integer("percentage").notNull(), // 0-100 (matches Substrate Percent type)
  
  ...timeFields(),
}, (t) => [
  { primaryKey: { columns: [t.permissionId, t.streamId] } },
  unique().on(t.permissionId, t.streamId),
  check("valid_percentage", sql`${t.percentage} >= 0 AND ${t.percentage} <= 100`),
]);

/**
 * Distribution targets with weights
 */
export const emissionDistributionTargetsSchema = createTable("emission_distribution_targets", {
  permissionId: varchar("permission_id", { length: 66 }).notNull().references(() => emissionPermissionsSchema.permissionId, { onDelete: "cascade" }),
  targetAccountId: ss58Address("target_account_id").notNull(),
  weight: integer("weight").notNull(), // 0-65535
  
  ...timeFields(),
}, (t) => [
  { primaryKey: { columns: [t.permissionId, t.targetAccountId] } },
  unique().on(t.permissionId, t.targetAccountId),
  check("valid_weight", sql`${t.weight} >= 0 AND ${t.weight} <= 65535`),
]);

/**
 * Accumulated stream amounts (runtime state)
 */
export const accumulatedStreamAmountsSchema = createTable("accumulated_stream_amounts", {
  grantorAccountId: ss58Address("grantor_account_id").notNull(),
  streamId: varchar("stream_id", { length: 66 }).notNull(), // Substrate H256 hash, same as permission IDs
  permissionId: varchar("permission_id", { length: 66 }).notNull().references(() => permissionsSchema.permissionId, { onDelete: "cascade" }),
  accumulatedAmount: numeric("accumulated_amount", { precision: 65, scale: 12 }).notNull().default("0"),
  lastUpdated: timestampzNow("last_updated"),
}, (t) => [
  { primaryKey: { columns: [t.grantorAccountId, t.streamId, t.permissionId] } },
  index("accumulated_streams_grantor_stream_idx").on(t.grantorAccountId, t.streamId),
]);

/**
 * Namespace permissions
 */
export const namespacePermissionsSchema = createTable("namespace_permissions", {
  permissionId: varchar("permission_id", { length: 66 }).primaryKey().references(() => permissionsSchema.permissionId, { onDelete: "cascade" }),
  
  ...timeFields(),
});

/**
 * Namespace paths for each permission
 */
export const namespacePermissionPathsSchema = createTable("namespace_permission_paths", {
  permissionId: varchar("permission_id", { length: 66 }).notNull().references(() => namespacePermissionsSchema.permissionId, { onDelete: "cascade" }),
  namespacePath: text("namespace_path").notNull(),
}, (t) => [
  { primaryKey: { columns: [t.permissionId, t.namespacePath] } },
  unique().on(t.permissionId, t.namespacePath),
]);

/**
 * Stores the body of a constraint
 */
export const constraintSchema = createTable("constraint", {
  id: serial("id").primaryKey(),
  body: text("body").notNull(),

  ...timeFields(),
});

/**
 * Stores the signaling capabilities of a agent
 */
export const agentDemandSignalSchema = createTable(
  "agent_demand_signal",
  {
    id: serial("id").primaryKey(),
    agentKey: ss58Address("agent_key").notNull(),

    // demand signal
    title: text("title").notNull(),
    description: text("description").notNull(),
    proposedAllocation: integer("proposed_allocation").notNull(),

    // contact info
    discord: text("discord"),
    github: text("github"),
    telegram: text("telegram"),
    twitter: text("twitter"),

    ...timeFields(),
  },
  (t) => [
    check(
      "percent_check",
      sql`${t.proposedAllocation} >= 0 and ${t.proposedAllocation} <= 100`,
    ),
  ],
);
