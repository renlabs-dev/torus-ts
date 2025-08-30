import { createInsertSchema } from "drizzle-zod";

import {
  agentApplicationVoteSchema,
  agentDemandSignalSchema,
  agentReportSchema,
  cadreCandidateSchema,
  cadreVoteSchema,
  commentInteractionSchema,
  commentReportSchema,
  commentSchema,
  penalizeAgentVotesSchema,
  userAgentWeightSchema,
  userDiscordInfoSchema,
} from "./schema";

// Common fields to omit from insert schemas
const commonOmitFields = {
  id: true,
  updatedAt: true,
  createdAt: true,
  deletedAt: true,
} as const;

export const AGENT_REPORT_INSERT_SCHEMA = createInsertSchema(
  agentReportSchema,
).omit({
  ...commonOmitFields,
  userKey: true,
});

export const CADRE_CANDIDATE_INSERT_SCHEMA = createInsertSchema(
  cadreCandidateSchema,
).omit({
  ...commonOmitFields,
  userKey: true,
});

export const CADRE_VOTE_INSERT_SCHEMA = createInsertSchema(
  cadreVoteSchema,
).omit({
  ...commonOmitFields,
  userKey: true,
});

export const COMMENT_INTERACTION_INSERT_SCHEMA = createInsertSchema(
  commentInteractionSchema,
).omit({
  ...commonOmitFields,
  userKey: true,
});

export const COMMENT_REPORT_INSERT_SCHEMA = createInsertSchema(
  commentReportSchema,
).omit({
  ...commonOmitFields,
  userKey: true,
});

export const COMMENT_INSERT_SCHEMA = createInsertSchema(commentSchema).omit({
  ...commonOmitFields,
  userKey: true,
});

export const AGENT_APPLICATION_VOTE_INSERT_SCHEMA = createInsertSchema(
  agentApplicationVoteSchema,
).omit({
  ...commonOmitFields,
  userKey: true,
});

export const USER_AGENT_WEIGHT_INSERT_SCHEMA = createInsertSchema(
  userAgentWeightSchema,
).omit({
  ...commonOmitFields,
  userKey: true,
});

export const PENALTY_INSERT_SCHEMA = createInsertSchema(
  penalizeAgentVotesSchema,
).omit({
  ...commonOmitFields,
  cadreKey: true,
});
export const USER_DISCORD_INFO_INSERT_SCHEMA = createInsertSchema(
  userDiscordInfoSchema,
).omit(commonOmitFields);

export const AGENT_DEMAND_SIGNAL_INSERT_SCHEMA = createInsertSchema(
  agentDemandSignalSchema,
  {
    proposedAllocation: (schema) => schema.min(0, "Must be between 0 and 100"),
    title: (schema) =>
      schema
        .min(1, "Title is required")
        .max(100, "Title cannot exceed 100 characters"),
    description: (schema) =>
      schema
        .min(1, "Description is required")
        .max(8000, "Description cannot exceed 8000 characters"),
    discord: (schema) =>
      schema
        .trim()
        .regex(/^[a-zA-Z0-9._]{2,32}$/, "Invalid Discord username")
        .optional(),
    github: (schema) =>
      schema
        .optional()
        .refine(
          (val) =>
            !val ||
            /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(val),
          {
            message: "Invalid GitHub username",
          },
        ),
    telegram: (schema) =>
      schema
        .optional()
        .refine((val) => !val || /^@?[a-zA-Z0-9_]{5,32}$/.test(val), {
          message: "Invalid Telegram username",
        }),
    twitter: (schema) =>
      schema
        .optional()
        .refine((val) => !val || /^@?[a-zA-Z0-9_]{1,15}$/.test(val), {
          message: "Invalid Twitter handle",
        }),
  },
).omit({
  ...commonOmitFields,
  agentKey: true,
});
