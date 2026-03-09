import client from "./client";
import type { RatingSummary, Review, ReviewListResponse } from "../types/reviews";

export async function createReview(payload: { seller_id: string; rating: number; comment: string }): Promise<Review> {
  const res = await client.post<Review>("/reviews", payload);
  return res.data;
}

export async function listSellerReviews(sellerId: string): Promise<ReviewListResponse> {
  const res = await client.get<ReviewListResponse>(`/reviews/seller/${sellerId}`);
  return res.data;
}

export async function getSellerRatingSummary(sellerId: string): Promise<RatingSummary> {
  const res = await client.get<RatingSummary>(`/reviews/seller/${sellerId}/rating-summary`);
  return res.data;
}
