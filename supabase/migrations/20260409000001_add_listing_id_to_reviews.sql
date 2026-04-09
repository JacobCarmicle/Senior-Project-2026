ALTER TABLE public.reviews
  ADD COLUMN listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL;

DROP INDEX IF EXISTS idx_reviews_unique_buyer_seller;

CREATE UNIQUE INDEX idx_reviews_unique_buyer_listing
  ON public.reviews(buyer_id, listing_id)
  WHERE listing_id IS NOT NULL;
