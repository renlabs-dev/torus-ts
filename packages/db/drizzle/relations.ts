import { relations } from "drizzle-orm/relations";
import { cadreCandidate, cadreVote, cadre, comment, commentInteraction, agent, agentReport, computedAgentWeight, penalizeAgentVotes, agentApplicationVote, userAgentWeight, commentReport } from "./schema";

export const cadreVoteRelations = relations(cadreVote, ({one}) => ({
	cadreCandidate: one(cadreCandidate, {
		fields: [cadreVote.applicantKey],
		references: [cadreCandidate.userKey]
	}),
	cadre: one(cadre, {
		fields: [cadreVote.userKey],
		references: [cadre.userKey]
	}),
}));

export const cadreCandidateRelations = relations(cadreCandidate, ({many}) => ({
	cadreVotes: many(cadreVote),
}));

export const cadreRelations = relations(cadre, ({many}) => ({
	cadreVotes: many(cadreVote),
	penalizeAgentVotes: many(penalizeAgentVotes),
	agentApplicationVotes: many(agentApplicationVote),
}));

export const commentInteractionRelations = relations(commentInteraction, ({one}) => ({
	comment: one(comment, {
		fields: [commentInteraction.commentId],
		references: [comment.id]
	}),
}));

export const commentRelations = relations(comment, ({many}) => ({
	commentInteractions: many(commentInteraction),
	commentReports: many(commentReport),
}));

export const agentReportRelations = relations(agentReport, ({one}) => ({
	agent: one(agent, {
		fields: [agentReport.agentKey],
		references: [agent.key]
	}),
}));

export const agentRelations = relations(agent, ({many}) => ({
	agentReports: many(agentReport),
	computedAgentWeights: many(computedAgentWeight),
	userAgentWeights: many(userAgentWeight),
}));

export const computedAgentWeightRelations = relations(computedAgentWeight, ({one}) => ({
	agent: one(agent, {
		fields: [computedAgentWeight.agentKey],
		references: [agent.key]
	}),
}));

export const penalizeAgentVotesRelations = relations(penalizeAgentVotes, ({one}) => ({
	cadre: one(cadre, {
		fields: [penalizeAgentVotes.cadreKey],
		references: [cadre.userKey]
	}),
}));

export const agentApplicationVoteRelations = relations(agentApplicationVote, ({one}) => ({
	cadre: one(cadre, {
		fields: [agentApplicationVote.userKey],
		references: [cadre.userKey]
	}),
}));

export const userAgentWeightRelations = relations(userAgentWeight, ({one}) => ({
	agent: one(agent, {
		fields: [userAgentWeight.agentKey],
		references: [agent.key]
	}),
}));

export const commentReportRelations = relations(commentReport, ({one}) => ({
	comment: one(comment, {
		fields: [commentReport.commentId],
		references: [comment.id]
	}),
}));