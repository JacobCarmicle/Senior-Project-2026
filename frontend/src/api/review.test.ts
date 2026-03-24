import {
  createReview,
  listSellerReviews,
  getSellerRatingSummary,
} from "./reviews";

describe("reviews API service", () => {
  const sellerId = "seller1";

  it("creates review", async () => {
    localStorage.setItem("access_token", "mock-jwt-token-abc123");

    const res = await createReview({
      seller_id: sellerId,
      rating: 5,
      comment: "Great seller, fast shipping!",
    });

    expect(res.id).toBeDefined();
    expect(res.rating).toBe(5);
    expect(res.comment).toBe("Great seller, fast shipping!");
  });

  it("lists seller reviews", async () => {
    const res = await listSellerReviews(sellerId);

    expect(res.items).toBeDefined();
    expect(Array.isArray(res.items)).toBe(true);
  });

  it("gets seller rating summary", async () => {
    const res = await getSellerRatingSummary(sellerId);

    expect(res.seller_id).toBe(sellerId);
    expect(res.review_count).toBeGreaterThanOrEqual(0);
    expect(res.average_rating).toBeGreaterThanOrEqual(0);
  });
});