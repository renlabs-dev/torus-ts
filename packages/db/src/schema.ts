import { asc, eq, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTableCreator,
  pgView,
  real,
  serial,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `${name}`);

export const ss58Address = (name: string) => varchar(name, { length: 256 });

/**
 * Modules registered on the torus chain.
 *
 * lastSeenBlock = max(atBlock)
 * atBlock == lastSeenBlock         --> registered
 * atBlock <  lastSeenBlock         --> deregistered
 */
export const moduleData = createTable(
  "module_data",
  {
    id: serial("id").primaryKey(),

    // TODO: SOLVE THE CASE FOR SUBNETS DIFFERENT FROM ZERO
    netuid: integer("netuid").notNull(),

    moduleId: integer("module_id").notNull(),
    moduleKey: ss58Address("module_key").notNull(),

    atBlock: integer("at_block").notNull(),

    name: text("name"),

    registrationBlock: integer("registration_block"),
    addressUri: text("address_uri"),
    metadataUri: text("metadata_uri"),

    emission: bigint("emission", { mode: "bigint" }),
    incentive: bigint("incentive", { mode: "bigint" }),
    dividend: bigint("dividend", { mode: "bigint" }),
    delegationFee: integer("delegation_fee"),

    totalStaked: bigint("total_staked", { mode: "bigint" }),
    totalStakers: integer("total_stakers"),
    totalRewards: bigint("total_rewards", { mode: "bigint" }),

    isWhitelisted: boolean("is_whitelisted").default(false),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
      mode: "date",
    }).default(sql`null`),
  },
  (t) => ({
    unq: unique().on(t.netuid, t.moduleKey),
  }),
);

/**
 * Data for the relation a user have with a specific module.
 * The user can set a weight (vote) for a module, and favorite it.
 *
 * This MUST store only modules for subnet 2.
 */
export const userModuleData = createTable(
  "user_module_data",
  {
    id: serial("id").primaryKey(),
    userKey: ss58Address("user_key").notNull(),
    /* actually points to moduleDataId instead of 
    the module id (of the network), 
    but for legacy reasons we keep the name wrong.
    */
    moduleId: integer("module_id")
      .references(() => moduleData.id)
      .notNull(),
    weight: integer("weight").default(0).notNull(),
  },
  (t) => ({
    unq: unique().on(t.userKey, t.moduleId),
  }),
);

/**
 * Subnets registered on the torus chain.
 */
export const subnetDataSchema = createTable("subnet_data", {
  id: serial("id").primaryKey(),
  netuid: integer("netuid").notNull().unique(),
  name: text("name").notNull(),
  atBlock: integer("at_block").notNull(),
  tempo: integer("tempo").notNull(),
  minAllowedWeights: integer("min_allowed_weights").notNull(),
  maxAllowedWeights: integer("max_allowed_weights").notNull(),
  maxAllowedUids: integer("max_allowed_uids").notNull(),
  maxWeightAge: numeric("max_weight_age", {
    precision: 20,
    scale: 0,
  }).notNull(),
  trustRatio: integer("trust_ratio").notNull(),
  founderShare: integer("founder_share").notNull(),
  incentiveRatio: integer("incentive_ratio").notNull(),
  founder: ss58Address("founder").notNull(),
  maximumSetWeightCallsPerEpoch: integer("maximum_set_weight_calls_per_epoch"),
  subnetEmission: bigint("subnet_emission", { mode: "bigint" }).notNull(),
  bondsMa: integer("bonds_ma"),
  immunityPeriod: integer("immunity_period").notNull(),
  subnetMetadata: text("subnet_metadata"),
  // GovernanceConfiguration fields
  proposalCost: bigint("proposal_cost", { mode: "bigint" }).notNull(),
  proposalExpiration: integer("proposal_expiration").notNull(),
  voteMode: text("vote_mode").notNull(),
  proposalRewardTreasuryAllocation: real(
    "proposal_reward_treasury_allocation",
  ).notNull(),
  maxProposalRewardTreasuryAllocation: bigint(
    "max_proposal_reward_treasury_allocation",
    { mode: "bigint" },
  ).notNull(),
  proposalRewardInterval: integer("proposal_reward_interval").notNull(),
  // BurnConfiguration fields
  minBurn: bigint("min_burn", { mode: "bigint" }).notNull(),
  maxBurn: bigint("max_burn", { mode: "bigint" }).notNull(),
  adjustmentAlpha: numeric("adjustment_alpha", {
    precision: 20,
    scale: 0,
  }).notNull(),
  targetRegistrationsInterval: integer(
    "target_registrations_interval",
  ).notNull(),
  targetRegistrationsPerInterval: integer(
    "target_registrations_per_interval",
  ).notNull(),
  maxRegistrationsPerInterval: integer(
    "max_registrations_per_interval",
  ).notNull(),
  // Additional fields
  minValidatorStake: bigint("min_validator_stake", { mode: "bigint" }),
  maxAllowedValidators: integer("max_allowed_validators"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at").default(sql`null`),
});

export const userSubnetDataSchema = createTable(
  "user_subnet_data",
  {
    id: serial("id").primaryKey(),
    userKey: ss58Address("user_key").notNull(),
    netuid: integer("netuid")
      .references(() => subnetDataSchema.netuid)
      .notNull(),
    weight: integer("weight").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at").default(sql`null`),
  },
  (t) => ({
    unq: unique().on(t.userKey, t.netuid),
  }),
);

/**
 * A report made by a user about a module.
 */
export const ReportReasonEnum = pgEnum("reason", [
  "SPAM",
  "VIOLENCE",
  "HARASSMENT",
  "HATE_SPEECH",
  "SEXUAL_CONTENT",
]);

export const moduleReport = createTable("module_report", {
  id: serial("id").primaryKey(),
  userKey: ss58Address("user_key"),
  moduleId: integer("module_id")
    .references(() => moduleData.id)
    .notNull(),
  content: text("content"),
  reason: ReportReasonEnum("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * A comment made by a user on a proposal or DAO.
 */
export const governanceModelEnum = pgEnum("governance_model", [
  "PROPOSAL",
  "DAO",
  "FORUM",
]);

export const proposalCommentSchema = createTable(
  "proposal_comment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    proposalId: integer("proposal_id").notNull(),
    governanceModel: governanceModelEnum("governance_model"),
    userKey: ss58Address("user_key").notNull(),
    userName: text("user_name"),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at").default(sql`null`),
  },
  (t) => ({
    proposalIdIndex: index("proposal_comment_proposal_id_index").on(
      t.proposalId,
    ),
  }),
);

/**
 * A vote made by a user on a comment.
 */
export enum VoteType {
  UP = "UP",
  DOWN = "DOWN",
}

export const commentInteractionSchema = createTable(
  "comment_interaction",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    commentId: uuid("comment_id")
      .references(() => proposalCommentSchema.id)
      .notNull(),
    userKey: ss58Address("user_key").notNull(),
    voteType: varchar("vote_type", { length: 4 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    unq: unique().on(t.commentId, t.userKey),
    commentIdIndex: index("comment_interaction_comment_id_index").on(
      t.commentId,
    ),
    commentVoteIndex: index("comment_interaction_comment_vote_index").on(
      t.commentId,
      t.voteType,
    ),
  }),
);

/**
 * A view that aggregates votes on comments.
 * This view computes the number of upvotes and downvotes for each comment at write time.
 * so that we can query the data more efficiently.
 */
export const proposalCommentDigestView = pgView("comment_digest").as((qb) =>
  qb
    .select({
      id: proposalCommentSchema.id,
      proposalId: proposalCommentSchema.proposalId,
      userKey: proposalCommentSchema.userKey,
      governanceModel: proposalCommentSchema.governanceModel,
      userName: proposalCommentSchema.userName,
      content: proposalCommentSchema.content,
      createdAt: proposalCommentSchema.createdAt,
      upvotes:
        sql<number>`SUM(CASE WHEN ${commentInteractionSchema.voteType} = "UP" THEN 1 ELSE 0 END)`
          .mapWith(Number)
          .as("upvotes"),
      downvotes:
        sql<number>`SUM(CASE WHEN ${commentInteractionSchema.voteType} = ${VoteType.DOWN} THEN 1 ELSE 0 END)`
          .mapWith(Number)
          .as("downvotes"),
    })
    .from(proposalCommentSchema)
    .where(sql`${proposalCommentSchema.deletedAt} IS NULL`)
    .leftJoin(
      commentInteractionSchema,
      eq(proposalCommentSchema.id, commentInteractionSchema.commentId),
    )
    .groupBy(
      proposalCommentSchema.id,
      proposalCommentSchema.proposalId,
      proposalCommentSchema.userKey,
      proposalCommentSchema.governanceModel,
      proposalCommentSchema.content,
      proposalCommentSchema.createdAt,
    )
    .orderBy(asc(proposalCommentSchema.createdAt)),
);

/**
 * A report made by a user about comment.
 */
export const commentReportSchema = createTable("comment_report", {
  id: serial("id").primaryKey(),
  userKey: ss58Address("user_key"),
  commentId: uuid("comment_id")
    .references(() => proposalCommentSchema.id)
    .notNull(),
  content: text("content"),
  reason: ReportReasonEnum("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * A DAO (Decentralized Autonomous Organization) is a group of users that can vote on proposals.
 */
export const cadreSchema = createTable("cadre", {
  id: serial("id").primaryKey(),
  userKey: ss58Address("user_key").notNull().unique(),
  discordId: varchar("discord_id", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at").default(sql`null`),
});

/**
 * Users can apply to join the DAO Cadre.
 */
export const cadreCandidatesSchema = createTable("cadre_candidates", {
  id: serial("id").primaryKey(),
  userKey: ss58Address("user_key").notNull().unique(),
  discordId: varchar("discord_id", { length: 64 }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at").default(sql`null`),
});

export const cadreVoteTypeEnum = pgEnum("cadre_vote_type", [
  "ACCEPT",
  "REFUSE",
]);

export const cadreVoteSchema = createTable("cadre_vote", {
  id: serial("id").primaryKey(),
  userKey: ss58Address("user_key")
    .references(() => cadreSchema.userKey)
    .notNull(),
  applicantKey: ss58Address("applicant_key")
    .references(() => cadreCandidatesSchema.userKey)
    .notNull(),
  vote: cadreVoteTypeEnum("vote").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at").default(sql`null`),
});

/**
 * This table stores votes on S2 DAOs Applications.
 */
export const daoVoteTypeEnum = pgEnum("dao_vote_type", [
  "ACCEPT",
  "REFUSE",
  "REMOVE",
]);

export const daoVoteSchema = createTable(
  "dao_vote",
  {
    id: serial("id").primaryKey(),
    daoId: integer("dao_id").notNull(),
    userKey: ss58Address("user_key")
      .references(() => cadreSchema.userKey)
      .notNull(),
    daoVoteType: daoVoteTypeEnum("dao_vote_type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at").default(sql`null`),
  },
  (t) => ({
    unq: unique().on(t.id, t.userKey, t.daoId),
  }),
);

/**
 * Auxiliary table to store the notification of a governance proposals / DAOs.
 */
export const governanceNotificationSchema = createTable(
  "governance_notification",
  {
    id: serial("id").primaryKey(),
    governanceModel: governanceModelEnum("governance_model").notNull(),
    proposalId: integer("proposal_id").notNull(),
    notifiedAt: timestamp("notified_at").defaultNow(),
  },
);

/**
 * This MUST store only info for modules on subnet 2.
 */
// TODO: append SCHEMA to name

export const computedModuleWeightsSchema = createTable(
  "computed_module_weights",
  {
    id: serial("id").primaryKey(),

    atBlock: integer("at_block").notNull(),

    // TODO: add moduleId
    moduleId: integer("module_id")
      .notNull()
      .references(() => moduleData.id),

    // Aggregated weights measured in nanos
    stakeWeight: bigint("stake_weight", { mode: "bigint" }).notNull(),
    // Normalized aggregated weights (100% sum)
    percWeight: real("perc_weight").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
);

export const computedSubnetWeights = createTable("computed_subnet_weights", {
  id: serial("id").primaryKey(),

  atBlock: integer("at_block").notNull(),

  netuid: integer("netuid")
    .notNull()
    .references(() => subnetDataSchema.netuid),

  // Aggregated weights measured in nanos
  stakeWeight: bigint("stake_weight", { mode: "bigint" }).notNull(),
  // Normalized aggregated weights (100% sum)
  percWeight: real("perc_weight").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ----- FORUM SCHEMAS -------

export const forumVoteType = pgEnum("forum_vote_type_enum", [
  "UPVOTE",
  "DOWNVOTE",
]);

export const forumCategoriesSchema = createTable("forum_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at").default(sql`null`),
});

export const forumPostSchema = createTable(
  "forum_post",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: integer("category_id")
      .references(() => forumCategoriesSchema.id)
      .notNull(),
    userKey: ss58Address("user_key").notNull(),
    isAnonymous: boolean("is_anonymous").default(false).notNull(),
    isPinned: boolean("is_pinned").default(false).notNull(),
    title: text("title").notNull(),
    content: text("content"),
    href: text("href"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at").default(sql`null`),
  },
  (t) => ({
    contentOrHrefCheck: check(
      "content_or_href_check",
      sql`(content IS NOT NULL AND href IS NULL) OR (content IS NULL AND href IS NOT NULL)`,
    ),
    categoryIdIndex: index("forum_post_category_id_index").on(t.categoryId),
    userKeyIndex: index("forum_post_user_key_index").on(t.userKey),
  }),
);

export const forumPostViewCountSchema = createTable("forum_post_view_count", {
  postId: uuid("post_id")
    .references(() => forumPostSchema.id)
    .notNull()
    .primaryKey(),
  viewCount: integer("view_count").default(0).notNull(),
});

export const forumCommentSchema = createTable(
  "forum_comment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .references(() => forumPostSchema.id)
      .notNull(),
    userKey: ss58Address("user_key").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at").default(sql`null`),
  },
  (t) => ({
    postIdIndex: index("forum_comment_post_id_index").on(t.postId),
  }),
);

export const forumPostVotesSchema = createTable(
  "forum_post_votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .references(() => forumPostSchema.id)
      .notNull(),
    userKey: ss58Address("user_key").notNull(),
    voteType: forumVoteType("vote_type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    unq: unique().on(t.postId, t.userKey),
    postIdIndex: index("forum_post_votes_post_id_index").on(t.postId),
    postVoteIndex: index("forum_post_votes_post_vote_index").on(
      t.postId,
      t.voteType,
    ),
    userKeyIndex: index("forum_post_votes_user_key_index").on(t.userKey),
  }),
);

export const forumCommentVotesSchema = createTable(
  "forum_comment_votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    commentId: uuid("comment_id")
      .references(() => forumCommentSchema.id)
      .notNull(),
    userKey: ss58Address("user_key").notNull(),
    voteType: forumVoteType("vote_type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    uniqueVote: unique().on(t.commentId, t.userKey),
    commentIdIndex: index("forum_comment_votes_comment_id_index").on(
      t.commentId,
    ),
    voteTypeIndex: index("forum_comment_votes_vote_type_index").on(t.voteType),
    userKeyIndex: index("forum_comment_votes_user_key_index").on(t.userKey),
  }),
);

export const reportedTypeEnum = pgEnum("reportedType", ["POST", "COMMENT"]);

export const forumReportSchema = createTable("forum_report", {
  id: serial("id").primaryKey(),
  userKey: ss58Address("user_key").notNull(),
  reportedId: uuid("reported_id").notNull(),
  reportedType: reportedTypeEnum("reported_type").notNull(),
  content: text("content").notNull(),
  reason: ReportReasonEnum("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const forumCommentDigestView = pgView("forum_comment_digest").as((qb) =>
  qb
    .select({
      id: forumCommentSchema.id,
      postId: forumCommentSchema.postId,
      userKey: forumCommentSchema.userKey,
      content: forumCommentSchema.content,
      createdAt: forumCommentSchema.createdAt,
      updatedAt: forumCommentSchema.updatedAt,
      upvotes: sql<number>`
        COALESCE(
          (SELECT COUNT(*) FROM ${forumCommentVotesSchema}
           WHERE ${forumCommentVotesSchema.commentId} = ${forumCommentSchema.id}
             AND ${forumCommentVotesSchema.voteType} = 'UPVOTE'),
          0
        )
      `
        .mapWith(Number)
        .as("upvotes"),
      downvotes: sql<number>`
        COALESCE(
          (SELECT COUNT(*) FROM ${forumCommentVotesSchema}
           WHERE ${forumCommentVotesSchema.commentId} = ${forumCommentSchema.id}
             AND ${forumCommentVotesSchema.voteType} = 'DOWNVOTE'),
          0
        )
      `
        .mapWith(Number)
        .as("downvotes"),
    })
    .from(forumCommentSchema)
    .where(sql`${forumCommentSchema.deletedAt} IS NULL`),
);

export const forumPostDigestView = pgView("forum_post_digest").as((qb) =>
  qb
    .select({
      id: forumPostSchema.id,
      userKey: forumPostSchema.userKey,
      title: forumPostSchema.title,
      content: forumPostSchema.content,
      createdAt: forumPostSchema.createdAt,
      updatedAt: forumPostSchema.updatedAt,
      isAnonymous: forumPostSchema.isAnonymous,
      isPinned: forumPostSchema.isPinned,
      href: forumPostSchema.href,
      categoryId: forumPostSchema.categoryId,
      categoryName: forumCategoriesSchema.name,
      upvotes: sql<number>`
        COALESCE(
          (SELECT COUNT(*) FROM ${forumPostVotesSchema}
           WHERE ${forumPostVotesSchema.postId} = ${forumPostSchema.id}
             AND ${forumPostVotesSchema.voteType} = 'UPVOTE'),
          0
        )
      `
        .mapWith(Number)
        .as("upvotes"),
      downvotes: sql<number>`
        COALESCE(
          (SELECT COUNT(*) FROM ${forumPostVotesSchema}
           WHERE ${forumPostVotesSchema.postId} = ${forumPostSchema.id}
             AND ${forumPostVotesSchema.voteType} = 'DOWNVOTE'),
          0
        )
      `
        .mapWith(Number)
        .as("downvotes"),
      commentCount: sql<number>`
        COALESCE(
          (SELECT COUNT(*) FROM ${forumCommentSchema}
           WHERE ${forumCommentSchema.postId} = ${forumPostSchema.id}
             AND ${forumCommentSchema.deletedAt} IS NULL),
          0
        )
      `
        .mapWith(Number)
        .as("commentCount"),
    })
    .from(forumPostSchema)
    .leftJoin(
      forumCategoriesSchema,
      eq(forumPostSchema.categoryId, forumCategoriesSchema.id),
    )
    .where(sql`${forumPostSchema.deletedAt} IS NULL`),
);
