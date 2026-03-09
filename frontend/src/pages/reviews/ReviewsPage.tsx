import { useState } from "react";
import { createReview } from "../../api/reviews";

export default function ReviewsPage() {
  const [sellerId, setSellerId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");

  async function submit() {
    try {
      await createReview({ seller_id: sellerId, rating, comment });
      setMessage("Review submitted.");
      setComment("");
    } catch {
      setMessage("Failed to submit review.");
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: 24, color: "#e5e5e5" }}>
      <h1>Leave a Review</h1>
      <input placeholder="Seller ID" value={sellerId} onChange={(e) => setSellerId(e.target.value)} style={{ width: "100%", marginBottom: 8, padding: 10, borderRadius: 8, background: "#333", border: "1px solid #404040", color: "#e5e5e5" }} />
      <select value={rating} onChange={(e) => setRating(Number(e.target.value))} style={{ width: "100%", marginBottom: 8, padding: 10, borderRadius: 8, background: "#333", border: "1px solid #404040", color: "#e5e5e5" }}>
        {[5,4,3,2,1].map((r) => <option key={r} value={r}>{r} stars</option>)}
      </select>
      <textarea placeholder="Write your review" value={comment} onChange={(e) => setComment(e.target.value)} rows={5} style={{ width: "100%", marginBottom: 8, padding: 10, borderRadius: 8, background: "#333", border: "1px solid #404040", color: "#e5e5e5" }} />
      <button onClick={submit} style={{ background: "#22c55e", color: "white", border: 0, borderRadius: 8, padding: "10px 14px" }}>Submit Review</button>
      {message && <p style={{ color: "#9ca3af" }}>{message}</p>}
    </div>
  );
}
