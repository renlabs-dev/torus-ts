import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import {
  cadreCandidatesSchema,
  cadreSchema,
  cadreVoteSchema,
  commentInteractionSchema,
  commentReportSchema,
  daoVoteSchema,
  moduleReport,
  proposalCommentSchema,
  userModuleData,
} from "./schema";

export const PROPOSAL_COMMENT_INSERT_SCHEMA = createInsertSchema(
  proposalCommentSchema,
).omit({
  id: true,
  createdAt: true,
  deletedAt: true,
  userKey: true,
});
export const COMMENT_INTERACTION_INSERT_SCHEMA = createInsertSchema(
  commentInteractionSchema,
).omit({
  id: true,
  createdAt: true,
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
  moduleReport,
).omit({
  id: true,
  userKey: true,
  createdAt: true,
});

export const USER_MODULE_DATA_INSERT_SCHEMA = createInsertSchema(
  userModuleData,
  {
    weight: z.number().positive(),
  },
).omit({
  id: true,
});

export const DAO_VOTE_INSERT_SCHEMA = createInsertSchema(daoVoteSchema).omit({
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

export const CADRE_CANDIDATES_INSERT_SCHEMA = createInsertSchema(
  cadreCandidatesSchema,
).omit({
  id: true,
  createdAt: true,
  deletedAt: true,
  userKey: true,
});

export const CADRE_VOTE_INSERT_SCHEMA = createInsertSchema(
  cadreVoteSchema,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  userKey: true,
});
