import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
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
export const USER_DISCORD_INFO_INSERT_SCHEMA = createInsertSchema(
  userDiscordInfoSchema,
).omit({
  id: true,
  updatedAt: true,
  createdAt: true,
  deletedAt: true,
});

export const AGENT_DEMAND_SIGNAL_INSERT_SCHEMA = createInsertSchema(
  agentDemandSignalSchema,
)
  .omit({
    id: true,
    agentKey: true,
    updatedAt: true,
    createdAt: true,
    deletedAt: true,
  })
  .extend({
    proposedAllocation: z.number().int().min(0, "Must be between 0 and 100"),
    title: z
      .string()
      .min(1, "Title is required")
      .max(100, "Title cannot exceed 100 characters"),
    description: z
      .string()
      .min(1, "Description is required")
      .max(8000, "Description cannot exceed 8000 characters"),
    discord: z
      .string()
      .trim()
      .regex(/^[a-zA-Z0-9._]{2,32}$/, "Invalid Discord username")
      .optional(),
    github: z
      .string()
      .optional()
      .refine(
        (val) =>
          !val ||
          /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(val),
        {
          message: "Invalid GitHub username",
        },
      ),
    telegram: z
      .string()
      .optional()
      .refine((val) => !val || /^@?[a-zA-Z0-9_]{5,32}$/.test(val), {
        message: "Invalid Telegram username",
      }),
    twitter: z
      .string()
      .optional()
      .refine((val) => !val || /^@?[a-zA-Z0-9_]{1,15}$/.test(val), {
        message: "Invalid Twitter handle",
      }),
  });
