import { createInsertSchema } from "drizzle-zod";

import {
  cadreCandidateSchema,
  cadreVoteSchema,
  commentInteractionSchema,
  commentReportSchema,
  agentReportSchema,
  commentSchema,
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
