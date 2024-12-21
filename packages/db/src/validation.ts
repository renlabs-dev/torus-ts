import { createInsertSchema } from "drizzle-zod";

import {
  cadreCandidateSchema,
  cadreSchema,
  cadreVoteSchema,
  commentInteractionSchema,
  commentReportSchema,
  agentReportSchema,
  commentSchema,
  userAgentAllocationSchema,
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

// OLD

export const PROPOSAL_COMMENT_INSERT_SCHEMA = createInsertSchema(
  commentSchema,
).omit({
  id: true,
  createdAt: true,
  deletedAt: true,
  userKey: true,
});

export const COMMENT_REPORT_INSERT_SCHEMA = createInsertSchema(
  commentReportSchema,
).omit({
  id: true,
  createdAt: true,
  userKey: true,
});

export const MODULE_REPORT_INSERT_SCHEMA = createInsertSchema(
  agentReportSchema,
).omit({
  id: true,
  userKey: true,
  createdAt: true,
});

export const USER_MODULE_DATA_INSERT_SCHEMA = createInsertSchema(
  userAgentAllocationSchema,
).omit({
  id: true,
});

export const DAO_VOTE_INSERT_SCHEMA = createInsertSchema(cadreVoteSchema).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  userKey: true,
});

export const CADRE_INSERT_SCHEMA = createInsertSchema(cadreSchema).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
