import { asc, eq, sql } from "drizzle-orm";
import {
  bigint as drizzleBigint,
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgMaterializedView,
  pgTableCreator,
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
export const bigint = (name: string) => drizzleBigint(name, { mode: "bigint" });

/**
 * Modules registered on the Torus chain.
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

    emission: bigint("emission"),
    incentive: bigint("incentive"),
    dividend: bigint("dividend"),
    delegationFee: integer("delegation_fee"),

    totalStaked: bigint("total_staked"),
    totalStakers: integer("total_stakers"),
    totalRewards: bigint("total_rewards"),

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
  (t) => [unique().on(t.netuid, t.moduleKey)],
);

export const agentData = createTable("agent_data", {
  atBlock: integer("at_block").notNull(),

  key: ss58Address("key").primaryKey(),
  name: text("name"),
  addressUri: text("address_uri"),
  metadataUri: text("metadata_uri"),
  weightFactor: integer("weight_factor"), // percentage

  isWhitelisted: boolean("is_whitelisted"),
  registrationBlock: integer("registration_block"),

  totalStaked: bigint("total_staked"),
  totalStakers: integer("total_stakers"),

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
});

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
  (t) => [unique().on(t.userKey, t.moduleId)],
);

/**
 * Data for the relation a user have with an specific Agent.
 * The user can set a weight (vote) for an Agent, and favorite it.
 */
export const userDataForAgent = createTable(
  "user_data_for_agent",
  {
    id: serial("id").primaryKey(),
    userKey: ss58Address("user_key").notNull(),
    agentKey: ss58Address("agent_key")
      .notNull()
      .references(() => agentData.key),
  },
  (t) => [unique().on(t.userKey, t.agentKey)],
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
  (t) => [index("proposal_comment_proposal_id_index").on(t.proposalId)],
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
  (t) => [
    unique().on(t.commentId, t.userKey),
    index("comment_interaction_comment_id_index").on(t.commentId),
    index("comment_interaction_comment_vote_index").on(t.commentId, t.voteType),
  ],
);

/**
 * A view that aggregates votes on comments.
 * This view computes the number of upvotes and downvotes for each comment at write time.
 * so that we can query the data more efficiently.
 */
export const proposalCommentDigestView = pgMaterializedView(
  "comment_digest",
).as((qb) =>
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
        sql<number>`SUM(CASE WHEN ${commentInteractionSchema.voteType} = 'UP' THEN 1 ELSE 0 END)`
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
  (t) => [unique().on(t.id, t.userKey, t.daoId)],
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
    stakeWeight: bigint("stake_weight").notNull(),
    // Normalized aggregated weights (100% sum)
    percWeight: real("perc_weight").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
);

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
  (t) => [
    check(
      "content_or_href_check",
      sql`(content IS NOT NULL AND href IS NULL) OR (content IS NULL AND href IS NOT NULL)`,
    ),
    index("forum_post_category_id_index").on(t.categoryId),
    index("forum_post_user_key_index").on(t.userKey),
  ],
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
  (t) => [index("forum_comment_post_id_index").on(t.postId)],
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
  (t) => [
    unique().on(t.postId, t.userKey),
    index("forum_post_votes_post_id_index").on(t.postId),
    index("forum_post_votes_post_vote_index").on(t.postId, t.voteType),
    index("forum_post_votes_user_key_index").on(t.userKey),
  ],
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
  (t) => [
    unique().on(t.commentId, t.userKey),
    index("forum_comment_votes_comment_id_index").on(t.commentId),
    index("forum_comment_votes_vote_type_index").on(t.voteType),
    index("forum_comment_votes_user_key_index").on(t.userKey),
  ],
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

export const forumCommentDigestView = pgMaterializedView(
  "forum_comment_digest",
).as((qb) =>
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

export const forumPostDigestView = pgMaterializedView("forum_post_digest").as(
  (qb) =>
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
