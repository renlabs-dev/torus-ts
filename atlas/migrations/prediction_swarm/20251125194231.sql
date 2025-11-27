-- Create "deduplication_processed_conversations" table
CREATE TABLE "public"."deduplication_processed_conversations" (
  "conversation_id" bigint NOT NULL,
  "predictions_processed" integer NOT NULL,
  "duplicates_found" integer NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("conversation_id")
);
-- Create "prediction_duplicate_relations" table
CREATE TABLE "public"."prediction_duplicate_relations" (
  "prediction_id" uuid NOT NULL DEFAULT uuidv7(),
  "canonical_id" uuid NOT NULL DEFAULT uuidv7(),
  "similarity_score" numeric(5,4) NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  CONSTRAINT "prediction_duplicate_relations_prediction_id_canonical_id_pk" PRIMARY KEY ("prediction_id", "canonical_id"),
  CONSTRAINT "prediction_duplicate_relations_canonical_id_parsed_prediction_i" FOREIGN KEY ("canonical_id") REFERENCES "public"."parsed_prediction" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "prediction_duplicate_relations_prediction_id_parsed_prediction_" FOREIGN KEY ("prediction_id") REFERENCES "public"."parsed_prediction" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "prediction_duplicate_relations_canonical_id_idx" to table: "prediction_duplicate_relations"
CREATE INDEX "prediction_duplicate_relations_canonical_id_idx" ON "public"."prediction_duplicate_relations" ("canonical_id");
-- Create index "prediction_duplicate_relations_prediction_id_idx" to table: "prediction_duplicate_relations"
CREATE INDEX "prediction_duplicate_relations_prediction_id_idx" ON "public"."prediction_duplicate_relations" ("prediction_id");
