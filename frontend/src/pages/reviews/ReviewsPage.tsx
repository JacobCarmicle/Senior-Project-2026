import { useState } from "react";
import { createReview } from "../../api/reviews";
import { Navbar } from "../../components/Navbar/Navbar.tsx";

const T = {
  bg:      "#0f0f0f",
  card:    "#161616",
  text:    "#e8e8e8",
  muted:   "#8a8a8a",
  border:  "rgba(255,255,255,0.07)",
  accent:  "#22c55e",
  danger:  "#ef4444",
  surface: "#1a1a1a",
  input:   "#111",
};

export default function ReviewsPage() {
  const [sellerId, setSellerId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    setMessage("");
    setError("");
    try {
      await createReview({ seller_id: sellerId.trim(), rating, comment: comment.trim() });
      setMessage("Review submitted.");
      setComment("");
    } catch {
      setError("Failed to submit review.");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.05) 0%, #0f0f0f 55%)", color: T.text, fontFamily: "'Outfit', Arial, sans-serif" }}>
      <Navbar exclude={["reviews"]}/>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
        <a href="/" style={{ color: T.muted, textDecoration: "none", fontSize: "0.875rem" }}>← Back to Marketplace</a>

        <div style={{ marginTop: 14, background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
          <h1 style={{ margin: 0, fontSize: "1.750rem" }}>Leave a Review</h1>
          <p style={{ color: T.muted, marginTop: 8 }}>Help other buyers by sharing your experience with this seller.</p>

          <div style={{ marginTop: 16 }}>
            <label style={{ display: "block", fontSize: "0.813rem", color: T.muted, marginBottom: 6 }}>Seller ID</label>
            <input
              placeholder="Seller user id"
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              style={{ width: "100%", marginBottom: 10, padding: 10, borderRadius: 10, background: "#333", border: `1px solid ${T.border}`, color: T.text }}
            />

            <label style={{ display: "block", fontSize: "0.813rem", color: T.muted, marginBottom: 6 }}>Rating</label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              style={{ width: "100%", marginBottom: 10, padding: 10, borderRadius: 10, background: "#333", border: `1px solid ${T.border}`, color: T.text }}
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>{r} stars</option>
              ))}
            </select>

            <label style={{ display: "block", fontSize: "0.813rem", color: T.muted, marginBottom: 6 }}>Comment</label>
            <textarea
              placeholder="Write your review"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              style={{ width: "100%", marginBottom: 12, padding: 10, borderRadius: 10, background: "#333", border: `1px solid ${T.border}`, color: T.text }}
            />

            <button onClick={submit} style={{ background: T.accent, color: "white", border: 0, borderRadius: 10, padding: "10px 14px", fontWeight: 700 }}>
              Submit Review
            </button>
          </div>

          {message && <p style={{ color: T.accent, marginTop: 12 }}>{message}</p>}
          {error && <p style={{ color: T.danger, marginTop: 12 }}>{error}</p>}
        </div>
      </div>
    </div>
  );
}
