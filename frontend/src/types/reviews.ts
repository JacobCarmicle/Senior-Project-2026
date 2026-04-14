export interface Review {
  id: string;
  buyer_id: string;
  seller_id: string;
  rating: number;
  comment: string;
  created_at: string;
  listing_id?: string | null;
  listing_title?: string | null;
}

export interface ReviewListResponse {
  items: Review[];
  total: number;
}

export interface RatingSummary {
  seller_id: string;
  review_count: number;
  average_rating: number;
}

export interface SellerTrustScore {
  seller_id: string;
  avg_rating: number;
  review_count: number;
  report_count: number;
  trust_score: number;
  trust_badge: "Trusted Seller" | "Reliable Seller" | "New Seller" | "Limited Activity";
}
