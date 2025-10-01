import { z } from "zod";
import { RFC3339DateTimeSchema } from "./common.js";

/**
 * Task status enum
 */
export const TaskStatusSchema = z.enum([
  "Pending",
  "Claimed",
  "Started",
  "Completed",
]);

/**
 * Task type enum
 */
export const TaskTypeSchema = z.enum([
  "FindAllPredictionsOfUser",
  "FindAllPredictionsOfTopic",
  "ScrapeAllTweetsOfUser",
  "ScrapeAllTweetsOfCashtag",
]);

/**
 * Schema for a task item from the SwarmMemory API
 * Based on actual API response structure
 */
export const TaskSchema = z.object({
  id: z.number(),
  inserted_at: RFC3339DateTimeSchema,
  priority: z.number(),
  status: TaskStatusSchema,
  task_type: TaskTypeSchema,
  value: z
    .string()
    .describe(
      "The user's Twitter ID/username for user tasks, or topic/cashtag for topic tasks",
    ),
  claimed_at: RFC3339DateTimeSchema.nullable().optional(),
  completed_at: RFC3339DateTimeSchema.nullable().optional(),
});

/**
 * Schema for task list response
 */
export const ListTasksResponseSchema = z.array(TaskSchema);

/**
 * Type definitions derived from schemas
 */
export type Task = z.infer<typeof TaskSchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type TaskType = z.infer<typeof TaskTypeSchema>;
export type ListTasksResponse = z.infer<typeof ListTasksResponseSchema>;
