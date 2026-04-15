DROP VIEW IF EXISTS public.seller_trust_scores;

CREATE VIEW public.seller_trust_scores AS
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
sold_stats AS (
  SELECT seller_id, COUNT(*) AS sold_count
  FROM public.listings
  WHERE status = 'sold'
  GROUP BY seller_id
),
scores AS (
  SELECT
    u.id AS seller_id,
    COALESCE(rs.avg_rating, 0)   AS avg_rating,
    COALESCE(rs.review_count, 0) AS review_count,
    COALESCE(rc.report_count, 0) AS report_count,
    COALESCE(ss.sold_count, 0)   AS sold_count,
    -- Rating weighted by review count: 1 review ≠ full score. Max 40 with 10+ reviews at 5★
    COALESCE((rs.avg_rating / 5.0) * LEAST(COALESCE(rs.review_count,0), 10) * 4, 0) AS rating_score,
    -- Volume bonus (max 20)
    LEAST(COALESCE(rs.review_count, 0)::numeric / 10.0, 1.0) * 20                   AS review_count_score,
    -- Account age (max 10)
    LEAST(EXTRACT(EPOCH FROM (now() - u.created_at)) / (365.0 * 86400), 1.0) * 10   AS age_score,
    -- First sale: 5 pts — enough to unlock New Seller alone
    CASE WHEN COALESCE(ss.sold_count, 0) >= 1 THEN 5 ELSE 0 END                     AS sold_score,
    LEAST(COALESCE(rc.report_count, 0) * 10.0, 30.0)                                AS report_penalty
  FROM public.users u
  LEFT JOIN review_stats rs ON rs.seller_id = u.id
  LEFT JOIN report_counts rc ON rc.seller_id = u.id
  LEFT JOIN sold_stats ss ON ss.seller_id = u.id
)
SELECT
  seller_id,
  ROUND(avg_rating::numeric, 2) AS avg_rating,
  review_count,
  report_count,
  sold_count,
  GREATEST(LEAST(ROUND((rating_score + review_count_score + age_score + sold_score - report_penalty)::numeric, 1), 100), 0) AS trust_score,
  CASE
    WHEN GREATEST(LEAST(ROUND((rating_score + review_count_score + age_score + sold_score - report_penalty)::numeric, 1), 100), 0) >= 65 THEN 'Trusted Seller'
    WHEN GREATEST(LEAST(ROUND((rating_score + review_count_score + age_score + sold_score - report_penalty)::numeric, 1), 100), 0) >= 32 THEN 'Reliable Seller'
    WHEN GREATEST(LEAST(ROUND((rating_score + review_count_score + age_score + sold_score - report_penalty)::numeric, 1), 100), 0) >= 4  THEN 'New Seller'
    ELSE 'Limited Activity'
  END AS trust_badge
FROM scores;
