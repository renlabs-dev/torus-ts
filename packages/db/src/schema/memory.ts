import { integer, jsonb, serial, text } from "drizzle-orm/pg-core";
import { createTable } from "./base";
import { timeFields } from "./utils";

export const predictionTopicSchema = createTable("prediction_topic", {
  id: serial("id").primaryKey(),

  parentId: integer("parent_id"),
  name: text("name").notNull(),

  contextSchema: jsonb("context_schema").notNull(), // the JSONB schema for predictions

  ...timeFields(),
});

export const parsedPredictionSchema = createTable("parsed_prediction", {
  predId: serial("pred_id").primaryKey(),

  topicId: integer("topic_id")
    .references(() => predictionTopicSchema.id, { onDelete: "cascade" })
    .notNull(),

  goalStart: integer("goal_start").notNull(),
  goalEnd: integer("goal_end").notNull(),
  timeframeStart: integer("timeframe_start").notNull(),
  timeframeEnd: integer("timeframe_end").notNull(),

  context: jsonb("context").notNull(), // whatever the filter agent thinks is relevant

  ...timeFields(),
});
