import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getListing } from "../../api/listings";
import { openConversationFromListing } from "../../api/messaging";
import { getSellerRatingSummary } from "../../api/reviews";
import type { Listing } from "../../types/listings";

const T = {
  bg: "#2d2d2d",
  card: "#1a1a1a",
  text: "#e5e5e5",
  muted: "#9ca3af",
  border: "#404040",
  accent: "#22c55e",
  danger: "#ef4444",
};

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [rating, setRating] = useState<{ average_rating: number; review_count: number } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    getListing(id)
      .then(async (l) => {
        setListing(l);
        try {
          const summary = await getSellerRatingSummary(l.seller_id);
          setRating(summary);
        } catch {
          setRating({ average_rating: 0, review_count: 0 });
        }
      })
      .catch(() => setError("Unable to load listing."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleMessageSeller() {
    if (!listing) return;
    const convo = await openConversationFromListing(listing.id);
    navigate(`/messages?conversation=${convo.id}`);
  }

  if (error) {
    return <div style={{ minHeight: "100vh", background: T.bg, padding: 24, color: T.danger }}>{error}</div>;
  }

  if (loading || !listing) {
    return <div style={{ minHeight: "100vh", background: T.bg, padding: 24, color: T.muted }}>Loading listing...</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
        <a href="/" style={{ color: T.muted, textDecoration: "none", fontSize: 14 }}>← Back to Marketplace</a>

        <div
          style={{
            marginTop: 14,
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          }}
        >
          {listing.images?.[0] && (
            <img
              src={listing.images[0]}
              alt={listing.title}
              style={{ width: "100%", maxHeight: 460, objectFit: "cover", borderBottom: `1px solid ${T.border}` }}
            />
          )}

          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900 }}>{listing.title}</h1>
                <p style={{ margin: "8px 0 0", color: T.muted }}>📍 {listing.location}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: T.accent }}>${Number(listing.price).toLocaleString()}</div>
                <div style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>{listing.category}</div>
              </div>
            </div>

            <p style={{ marginTop: 18, lineHeight: 1.55, color: "#d4d4d4" }}>{listing.description}</p>

            <div
              style={{
                marginTop: 18,
                padding: "12px 14px",
                borderRadius: 10,
                border: `1px solid ${T.border}`,
                background: "#222",
                color: T.muted,
                fontSize: 14,
              }}
            >
              Seller rating: <strong style={{ color: T.text }}>{rating?.average_rating ?? 0}</strong> / 5 ({rating?.review_count ?? 0} reviews)
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
              <button
                onClick={handleMessageSeller}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: T.accent,
                  color: "white",
                  border: 0,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Message Seller
              </button>
              <a
                href={`/edit-listing/${listing.id}`}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "#333",
                  color: T.text,
                  border: `1px solid ${T.border}`,
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                Edit Listing
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
