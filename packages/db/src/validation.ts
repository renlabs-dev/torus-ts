import { createInsertSchema } from "drizzle-zod";

import {
  agentApplicationVoteSchema,
  agentReportSchema,
  cadreCandidateSchema,
  cadreVoteSchema,
  commentInteractionSchema,
  commentReportSchema,
  commentSchema,
  penalizeAgentVotesSchema,
  userAgentWeightSchema,
} from "./schema";

export const AGENT_REPORT_INSERT_SCHEMA = createInsertSchema(
  agentReportSchema,
).omit({
  id: true,
  userKey: true,
  updatedAt: true,
  createdAt: true,
  deletedAt: true,
});

export const CADRE_CANDIDATE_INSERT_SCHEMA = createInsertSchema(
  cadreCandidateSchema,
).omit({
  id: true,
  userKey: true,
  updatedAt: true,
  createdAt: true,
  deletedAt: true,
});

export const CADRE_VOTE_INSERT_SCHEMA = createInsertSchema(
  cadreVoteSchema,
).omit({
  id: true,
  userKey: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const COMMENT_INTERACTION_INSERT_SCHEMA = createInsertSchema(
  commentInteractionSchema,
).omit({
  id: true,
  userKey: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const COMMENT_REPORT_INSERT_SCHEMA = createInsertSchema(
  commentReportSchema,
).omit({
  id: true,
  userKey: true,
  updatedAt: true,
  createdAt: true,
  deletedAt: true,
});

export const COMMENT_INSERT_SCHEMA = createInsertSchema(commentSchema).omit({
  id: true,
  userKey: true,
  updatedAt: true,
  createdAt: true,
  deletedAt: true,
});

export const AGENT_APPLICATION_VOTE_INSERT_SCHEMA = createInsertSchema(
  agentApplicationVoteSchema,
).omit({
  id: true,
  userKey: true,
  updatedAt: true,
  createdAt: true,
  deletedAt: true,
});

export const USER_AGENT_WEIGHT_INSERT_SCHEMA = createInsertSchema(
  userAgentWeightSchema,
).omit({
  id: true,
  userKey: true,
  updatedAt: true,
  createdAt: true,
  deletedAt: true,
});

export const PENALTY_INSERT_SCHEMA = createInsertSchema(
  penalizeAgentVotesSchema,
).omit({
  id: true,
  cadreKey: true,
  updatedAt: true,
  createdAt: true,
  deletedAt: true,
});
