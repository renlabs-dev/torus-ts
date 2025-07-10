import { pgTable, unique, check, serial, varchar, text, timestamp, boolean, numeric, integer, index, bigint, foreignKey, real, pgMaterializedView, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const agentApplicationVoteType = pgEnum("agent_application_vote_type", ['ACCEPT', 'REFUSE', 'REMOVE'])
export const applicationStatus = pgEnum("application_status", ['OPEN', 'ACCEPTED', 'REJECTED', 'EXPIRED'])
export const candidacyStatus = pgEnum("candidacy_status", ['PENDING', 'ACCEPTED', 'REJECTED', 'REMOVED'])
export const governanceItemType = pgEnum("governance_item_type", ['PROPOSAL', 'AGENT_APPLICATION'])
export const reactionType = pgEnum("reaction_type", ['LIKE', 'DISLIKE'])
export const reportReason = pgEnum("report_reason", ['SPAM', 'VIOLENCE', 'HARASSMENT', 'HATE_SPEECH', 'SEXUAL_CONTENT'])


export const cadreCandidate = pgTable("cadre_candidate", {
	id: serial().primaryKey().notNull(),
	userKey: varchar("user_key", { length: 256 }).notNull(),
	discordId: varchar("discord_id", { length: 20 }).notNull(),
	candidacyStatus: candidacyStatus("candidacy_status").default('PENDING').notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	notified: boolean().default(false),
}, (table) => [
	unique("cadre_candidate_user_key_unique").on(table.userKey),
	unique("cadre_candidate_discord_id_unique").on(table.discordId),
	check("discord_id_check", sql`(length((discord_id)::text) >= 17) AND (length((discord_id)::text) <= 20)`),
]);

export const whitelistApplication = pgTable("whitelist_application", {
	id: serial().primaryKey().notNull(),
	userKey: varchar("user_key", { length: 256 }).notNull(),
	payerKey: varchar("payer_key", { length: 256 }).notNull(),
	data: text().notNull(),
	cost: numeric().notNull(),
	expiresAt: integer("expires_at").notNull(),
	status: applicationStatus().notNull(),
	notified: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("whitelist_application_user_key_unique").on(table.userKey),
]);

export const agent = pgTable("agent", {
	id: serial().primaryKey().notNull(),
	atBlock: integer("at_block").notNull(),
	key: varchar({ length: 256 }).notNull(),
	name: text(),
	apiUrl: text("api_url"),
	metadataUri: text("metadata_uri"),
	weightFactor: integer("weight_factor"),
	isWhitelisted: boolean("is_whitelisted"),
	registrationBlock: integer("registration_block"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalStaked: bigint("total_staked", { mode: "number" }),
	totalStakers: integer("total_stakers"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("key_index").using("btree", table.key.asc().nullsLast().op("text_ops")),
	unique("agent_key_unique").on(table.key),
	check("percent_check", sql`(weight_factor >= 0) AND (weight_factor <= 100)`),
]);

export const cadre = pgTable("cadre", {
	id: serial().primaryKey().notNull(),
	userKey: varchar("user_key", { length: 256 }).notNull(),
	discordId: varchar("discord_id", { length: 20 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("cadre_user_key_unique").on(table.userKey),
	unique("cadre_discord_id_unique").on(table.discordId),
	check("discord_id_check", sql`(length((discord_id)::text) >= 17) AND (length((discord_id)::text) <= 20)`),
]);

export const proposal = pgTable("proposal", {
	id: serial().primaryKey().notNull(),
	expirationBlock: integer("expiration_block").notNull(),
	status: applicationStatus().notNull(),
	proposerKey: varchar("proposer_key", { length: 256 }).notNull(),
	creationBlock: integer("creation_block").notNull(),
	metadataUri: text("metadata_uri").notNull(),
	proposalCost: numeric("proposal_cost").notNull(),
	notified: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	proposalId: integer("proposal_id").notNull(),
}, (table) => [
	unique("proposal_proposal_id_unique").on(table.proposalId),
]);

export const userDiscordInfo = pgTable("user_discord_info", {
	id: serial().primaryKey().notNull(),
	discordId: varchar("discord_id", { length: 20 }).notNull(),
	userName: text("user_name").notNull(),
	avatarUrl: text("avatar_url"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("user_discord_info_discord_id_unique").on(table.discordId),
	check("discord_id_check", sql`(length((discord_id)::text) >= 17) AND (length((discord_id)::text) <= 20)`),
]);

export const penalizeAgentVotes = pgTable("penalize_agent_votes", {
	id: serial().primaryKey().notNull(),
	agentKey: varchar("agent_key", { length: 256 }).notNull(),
	cadreKey: varchar("cadre_key", { length: 256 }).notNull(),
	penaltyFactor: integer("penalty_factor").notNull(),
	content: text().notNull(),
	executed: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.cadreKey],
			foreignColumns: [cadre.userKey],
			name: "penalize_agent_votes_cadre_key_cadre_user_key_fk"
		}),
	unique("penalize_agent_votes_agent_key_cadre_key_unique").on(table.agentKey, table.cadreKey),
	check("percent_check", sql`(penalty_factor >= 0) AND (penalty_factor <= 100)`),
]);

export const governanceNotification = pgTable("governance_notification", {
	id: serial().primaryKey().notNull(),
	itemType: governanceItemType("item_type").notNull(),
	itemId: integer("item_id").notNull(),
	notifiedAt: timestamp("notified_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
});

export const computedAgentWeight = pgTable("computed_agent_weight", {
	id: serial().primaryKey().notNull(),
	atBlock: integer("at_block").notNull(),
	agentKey: varchar("agent_key", { length: 256 }).notNull(),
	computedWeight: numeric("computed_weight").notNull(),
	percComputedWeight: real("perc_computed_weight").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.agentKey],
			foreignColumns: [agent.key],
			name: "computed_agent_weight_agent_key_agent_key_fk"
		}),
	unique("computed_agent_weight_agent_key_unique").on(table.agentKey),
]);

export const userAgentWeight = pgTable("user_agent_weight", {
	id: serial().primaryKey().notNull(),
	userKey: varchar("user_key", { length: 256 }).notNull(),
	agentKey: varchar("agent_key", { length: 256 }).notNull(),
	weight: real().default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.agentKey],
			foreignColumns: [agent.key],
			name: "user_agent_weight_agent_key_agent_key_fk"
		}),
	unique("user_agent_weight_user_key_agent_key_unique").on(table.userKey, table.agentKey),
]);

export const agentApplicationVote = pgTable("agent_application_vote", {
	id: serial().primaryKey().notNull(),
	applicationId: integer("application_id").notNull(),
	userKey: varchar("user_key", { length: 256 }).notNull(),
	vote: agentApplicationVoteType().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userKey],
			foreignColumns: [cadre.userKey],
			name: "agent_application_vote_user_key_cadre_user_key_fk"
		}),
	unique("agent_application_vote_application_id_user_key_unique").on(table.applicationId, table.userKey),
]);

export const commentInteraction = pgTable("comment_interaction", {
	id: serial().primaryKey().notNull(),
	userKey: varchar("user_key", { length: 256 }).notNull(),
	commentId: integer("comment_id").notNull(),
	reactionType: reactionType("reaction_type").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index().using("btree", table.userKey.asc().nullsLast().op("int4_ops"), table.commentId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.commentId],
			foreignColumns: [comment.id],
			name: "comment_interaction_comment_id_comment_id_fk"
		}),
	unique("comment_interaction_user_key_comment_id_unique").on(table.userKey, table.commentId),
]);

export const agentReport = pgTable("agent_report", {
	id: serial().primaryKey().notNull(),
	userKey: varchar("user_key", { length: 256 }).notNull(),
	agentKey: varchar("agent_key", { length: 256 }).notNull(),
	reason: reportReason().notNull(),
	content: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.agentKey],
			foreignColumns: [agent.key],
			name: "agent_report_agent_key_agent_key_fk"
		}),
]);

export const cadreVoteHistory = pgTable("cadre_vote_history", {
	id: serial().primaryKey().notNull(),
	userKey: varchar("user_key", { length: 256 }).notNull(),
	applicantKey: varchar("applicant_key", { length: 256 }).notNull(),
	vote: agentApplicationVoteType().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
});

export const commentReport = pgTable("comment_report", {
	id: serial().primaryKey().notNull(),
	userKey: varchar("user_key", { length: 256 }).notNull(),
	commentId: integer("comment_id").notNull(),
	reason: reportReason().notNull(),
	content: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.commentId],
			foreignColumns: [comment.id],
			name: "comment_report_comment_id_comment_id_fk"
		}),
]);

export const cadreVote = pgTable("cadre_vote", {
	id: serial().primaryKey().notNull(),
	userKey: varchar("user_key", { length: 256 }).notNull(),
	applicantKey: varchar("applicant_key", { length: 256 }).notNull(),
	vote: agentApplicationVoteType().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.applicantKey],
			foreignColumns: [cadreCandidate.userKey],
			name: "cadre_vote_applicant_key_cadre_candidate_user_key_fk"
		}),
	foreignKey({
			columns: [table.userKey],
			foreignColumns: [cadre.userKey],
			name: "cadre_vote_user_key_cadre_user_key_fk"
		}),
	unique("cadre_vote_user_key_applicant_key_unique").on(table.userKey, table.applicantKey),
]);

export const comment = pgTable("comment", {
	id: serial().primaryKey().notNull(),
	itemType: governanceItemType("item_type").notNull(),
	itemId: integer("item_id").notNull(),
	userKey: varchar("user_key", { length: 256 }).notNull(),
	userName: text("user_name"),
	content: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index().using("btree", table.itemType.asc().nullsLast().op("enum_ops"), table.itemId.asc().nullsLast().op("int4_ops"), table.userKey.asc().nullsLast().op("enum_ops")),
]);
export const commentDigest = pgMaterializedView("comment_digest", {	id: integer(),
	// TODO: failed to parse database type 'public.governance_item_type'
	itemId: integer("item_id"),
	userKey: varchar("user_key", { length: 256 }),
	userName: text("user_name"),
	content: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	likes: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	dislikes: bigint({ mode: "number" }),
}).as(sql`SELECT comment.id, comment.item_type, comment.item_id, comment.user_key, comment.user_name, comment.content, comment.created_at, sum( CASE WHEN comment_interaction.reaction_type = 'LIKE'::public.reaction_type THEN 1 ELSE 0 END) AS likes, sum( CASE WHEN comment_interaction.reaction_type = 'DISLIKE'::public.reaction_type THEN 1 ELSE 0 END) AS dislikes FROM public.comment LEFT JOIN public.comment_interaction ON comment.id = comment_interaction.comment_id WHERE comment.deleted_at IS NULL GROUP BY comment.id, comment.item_type, comment.item_id, comment.user_key, comment.content, comment.created_at ORDER BY comment.created_at`);