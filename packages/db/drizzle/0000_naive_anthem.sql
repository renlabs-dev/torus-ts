-- Custom SQL migration file, put you code below! --

-- Drop the existing view
DROP VIEW IF EXISTS forum_post_digest;

-- Create the updated view
CREATE VIEW forum_post_digest AS
SELECT
  fp.id,
  fp.user_key,
  fp.title,
  fp.content,
  fp.created_at,
  fp.updated_at,
  fp.is_anonymous,
  fp.is_pinned,
  fp.href,
  fp.category_id,
  fc.name,
  COALESCE(
    (SELECT COUNT(*) FROM forum_post_votes fpv
     WHERE fpv.post_id = fp.id
       AND fpv.vote_type = 'UPVOTE'),
    0
  ) AS "upvotes",
  COALESCE(
    (SELECT COUNT(*) FROM forum_post_votes fpv
     WHERE fpv.post_id = fp.id
       AND fpv.vote_type = 'DOWNVOTE'),
    0
  ) AS "downvotes",
  COALESCE(
    (SELECT COUNT(*) FROM forum_comment fcmt
     WHERE fcmt.post_id = fp.id
       AND fcmt.deleted_at IS NULL),
    0
  ) AS "commentCount"
FROM forum_post fp
LEFT JOIN forum_categories fc ON fp.category_id = fc.id
WHERE fp.deleted_at IS NULL;

INSERT INTO forum_categories (id, name, description) VALUES
(1, 'GENERAL', 'Broad discussions related to the community''s interests.'),
(2, 'NEWS', 'Official updates and news from administrators.'),
(3, 'TECH', 'In-depth technical topics, including web-related discussions.'),
(4, 'META', 'Discussions about the forum itself.'),
(5, 'OFF-TOPIC', 'General conversations not related to specific topics');
(6, 'OTHERS', 'Posts without a specific category');