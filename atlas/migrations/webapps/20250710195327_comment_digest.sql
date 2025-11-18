-- Create materialized view "comment_digest"
CREATE MATERIALIZED VIEW "public"."comment_digest" AS
SELECT 
    comment.id,
    comment.item_type,
    comment.item_id,
    comment.user_key,
    comment.user_name,
    comment.content,
    comment.created_at,
    sum(
        CASE 
            WHEN comment_interaction.reaction_type = 'LIKE'::public.reaction_type 
            THEN 1 
            ELSE 0 
        END
    ) AS likes,
    sum(
        CASE 
            WHEN comment_interaction.reaction_type = 'DISLIKE'::public.reaction_type 
            THEN 1 
            ELSE 0 
        END
    ) AS dislikes
FROM public.comment
LEFT JOIN public.comment_interaction ON comment.id = comment_interaction.comment_id
WHERE comment.deleted_at IS NULL
GROUP BY comment.id, comment.item_type, comment.item_id, comment.user_key, comment.content, comment.created_at
ORDER BY comment.created_at;

-- Create index on comment_digest for common queries
CREATE INDEX "comment_digest_item_type_item_id_idx" ON "public"."comment_digest" ("item_type", "item_id");
CREATE INDEX "comment_digest_user_key_idx" ON "public"."comment_digest" ("user_key");
CREATE INDEX "comment_digest_created_at_idx" ON "public"."comment_digest" ("created_at");