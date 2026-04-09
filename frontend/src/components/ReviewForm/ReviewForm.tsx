import { useState } from "react";
import { createReview } from "../../api/reviews";

const T = {
  card: "#1a1a1a",
  text: "#e5e5e5",
  muted: "#9ca3af",
  border: "#404040",
  accent: "#22c55e",
  danger: "#ef4444",
};

export default function ReviewForm({
  sellerId,
  listingId,
  listingTitle,
  onSubmitted,
}: {
  sellerId: string;
  listingId?: string;
  listingTitle?: string;
  onSubmitted?: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    console.log("submitting review");

    setMessage("");
    setError("");

    try {
      await createReview({
        seller_id: sellerId,
        rating,
        comment: comment.trim(),
        ...(listingId ? { listing_id: listingId } : {}),
      });

      setMessage("Review submitted.");
      setComment("");

      if (onSubmitted) onSubmitted();
    } catch (err: unknown) {
      console.error(err);
      const detail =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { detail?: string } } }).response?.data?.detail === "string"
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      setError(detail || "Failed to submit review.");
    }
  }

  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        padding: 18,
        marginBottom: 16,
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 800 }}>Leave a Review</div>
      {listingTitle && (
        <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
          For: <strong style={{ color: T.text }}>{listingTitle}</strong>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: 13, color: T.muted }}>Rating</label>

        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          style={{
            width: "100%",
            marginTop: 6,
            marginBottom: 10,
            padding: 10,
            borderRadius: 10,
            background: "#333",
            border: `1px solid ${T.border}`,
            color: T.text,
          }}
        >
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r} stars
            </option>
          ))}
        </select>

        <label style={{ fontSize: 13, color: T.muted }}>Comment</label>

        <textarea
          placeholder="Write your review"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          style={{
            width: "100%",
            marginTop: 6,
            marginBottom: 12,
            padding: 10,
            borderRadius: 10,
            background: "#333",
            border: `1px solid ${T.border}`,
            color: T.text,
          }}
        />

        <button
          onClick={submit}
          style={{
            background: T.accent,
            color: "white",
            border: 0,
            borderRadius: 10,
            padding: "10px 14px",
            fontWeight: 700,
          }}
        >
          Submit Review
        </button>

        {message && (
          <p style={{ color: T.accent, marginTop: 10 }}>{message}</p>
        )}
        {error && (
          <p style={{ color: T.danger, marginTop: 10 }}>{error}</p>
        )}
      </div>
    </div>
  );
}