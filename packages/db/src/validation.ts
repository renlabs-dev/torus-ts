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
  userSubnetDataSchema,
  VoteType,
} from "./schema";

const MAX_CHARACTERS = 300;

export const PROPOSAL_COMMENT_INSERT_SCHEMA = createInsertSchema(
  proposalCommentSchema,
  {
    content: z
      .string()
      .min(1, "Comment cannot be empty")
      .max(
        MAX_CHARACTERS,
        `Comment must be ${MAX_CHARACTERS} characters or less`,
      )
      .refine(
        (value) => !/https?:\/\/\S+/i.test(value),
        "Links are not allowed in comments",
      )
      .refine(
        (value) => !/[<>{}[\]\\/]/g.test(value),
        "Special characters are not allowed",
      ),
    userName: z
      .string()
      .max(MAX_CHARACTERS, `Name must be ${MAX_CHARACTERS} characters or less`)
      .optional()
      .refine(
        (value) => !value || !/[<>{}[\]\\/]/g.test(value),
        "Special characters are not allowed in the name",
      ),
  },
).omit({
  id: true,
  createdAt: true,
  deletedAt: true,
  userKey: true,
});

export const COMMENT_INTERACTION_INSERT_SCHEMA = createInsertSchema(
  commentInteractionSchema,
  {
    voteType: z.nativeEnum(VoteType),
  },
).omit({
  id: true,
  createdAt: true,
  userKey: true,
});

export const COMMENT_REPORT_INSERT_SCHEMA = createInsertSchema(
  commentReportSchema,
  {
    content: z
      .string()
      .min(1)
      .max(512)
      .transform((v) => v.trim())
      .refine((s) => s.length, "Comment should not be blank"),
  },
).omit({
  id: true,
  createdAt: true,
  userKey: true,
});

export const MODULE_REPORT_INSERT_SCHEMA = createInsertSchema(moduleReport, {
  content: z
    .string()
    .min(1)
    .max(512)
    .transform((v) => v.trim())
    .refine((s) => s.length, "Comment should not be blank"),
}).omit({
  id: true,
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

export const USER_SUBNET_DATA_INSERT_SCHEMA = createInsertSchema(
  userSubnetDataSchema,
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
