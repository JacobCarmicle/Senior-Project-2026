import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getListing } from "../../api/listings";
import { openConversationFromListing } from "../../api/messaging";
import { getSellerRatingSummary } from "../../api/reviews";
import type { Listing } from "../../types/listings";

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [rating, setRating] = useState<{ average_rating: number; review_count: number } | null>(null);
  const [error, setError] = useState("");

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
      .catch(() => setError("Unable to load listing."));
  }, [id]);

  async function handleMessageSeller() {
    if (!listing) return;
    const convo = await openConversationFromListing(listing.id);
    navigate(`/messages?conversation=${convo.id}`);
  }

  if (error) return <div style={{ padding: 24, color: "#ef4444" }}>{error}</div>;
  if (!listing) return <div style={{ padding: 24, color: "#9ca3af" }}>Loading listing...</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24, color: "#e5e5e5" }}>
      <h1>{listing.title}</h1>
      <p style={{ color: "#9ca3af" }}>{listing.location}</p>
      <h2>${Number(listing.price).toLocaleString()}</h2>
      {listing.images?.[0] && <img src={listing.images[0]} alt={listing.title} style={{ width: "100%", maxHeight: 420, objectFit: "cover", borderRadius: 12 }} />}
      <p style={{ marginTop: 16 }}>{listing.description}</p>
      <p style={{ color: "#9ca3af" }}>Seller rating: {rating?.average_rating ?? 0} ({rating?.review_count ?? 0} reviews)</p>
      <button onClick={handleMessageSeller} style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8, background: "#22c55e", color: "white", border: 0 }}>Message Seller</button>
    </div>
  );
}
