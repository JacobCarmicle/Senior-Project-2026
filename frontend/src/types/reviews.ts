export interface Review {
  id: string;
  buyer_id: string;
  seller_id: string;
  rating: number;
  comment: string;
  created_at: string;
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
