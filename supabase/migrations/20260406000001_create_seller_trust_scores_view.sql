CREATE OR REPLACE VIEW public.seller_trust_scores AS
WITH report_counts AS (
  SELECT target_id AS seller_id, COUNT(*) AS report_count
  FROM public.reports
  WHERE target_type = 'user' AND status = 'reviewed'
  GROUP BY target_id
),
review_stats AS (
  SELECT seller_id, COUNT(*) AS review_count, AVG(rating) AS avg_rating
  FROM public.reviews
  GROUP BY seller_id
),
scores AS (
  SELECT
    u.id AS seller_id,
    COALESCE(rs.avg_rating, 0)        AS avg_rating,
    COALESCE(rs.review_count, 0)      AS review_count,
    COALESCE(rc.report_count, 0)      AS report_count,
    -- Score components
    COALESCE((rs.avg_rating / 5.0) * 40, 0)                                          AS rating_score,
    LEAST(COALESCE(rs.review_count, 0)::numeric / 10.0, 1.0) * 20                    AS review_count_score,
    LEAST(EXTRACT(EPOCH FROM (now() - u.created_at)) / (365.0 * 86400), 1.0) * 10   AS age_score,
    LEAST(COALESCE(rc.report_count, 0) * 10.0, 30.0)                                 AS report_penalty
  FROM public.users u
  LEFT JOIN review_stats rs ON rs.seller_id = u.id
  LEFT JOIN report_counts rc ON rc.seller_id = u.id
)
SELECT
  seller_id,
  ROUND(avg_rating::numeric, 2)                                                                   AS avg_rating,
  review_count,
  report_count,
  GREATEST(LEAST(ROUND((rating_score + review_count_score + age_score - report_penalty)::numeric, 1), 100), 0) AS trust_score,
  CASE
    WHEN GREATEST(LEAST(ROUND((rating_score + review_count_score + age_score - report_penalty)::numeric, 1), 100), 0) >= 80 THEN 'Trusted Seller'
    WHEN GREATEST(LEAST(ROUND((rating_score + review_count_score + age_score - report_penalty)::numeric, 1), 100), 0) >= 60 THEN 'Reliable Seller'
    WHEN GREATEST(LEAST(ROUND((rating_score + review_count_score + age_score - report_penalty)::numeric, 1), 100), 0) >= 40 THEN 'New Seller'
    ELSE 'Limited Activity'
  END AS trust_badge
FROM scores;
