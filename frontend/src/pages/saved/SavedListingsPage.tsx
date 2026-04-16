import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getSavedListings, toggleSaveListing } from "../../api/listings";
import { Navbar } from "../../components/Navbar/Navbar";
import type { Listing } from "../../types/listings";

const T = {
  bg:     "#0f0f0f",
  card:   "#161616",
  text:   "#e8e8e8",
  muted:  "#8a8a8a",
  border: "rgba(255,255,255,0.07)",
  accent: "#22c55e",
  danger: "#ef4444",
  input:  "#111",
  surface: "#1a1a1a",
};

function SavedListingCard({
  listing,
  onUnsave,
  onClick,
}: {
  listing: Listing;
  onUnsave: (id: string) => void;
  onClick: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [unsaving, setUnsaving] = useState(false);

  async function handleUnsave(e: React.MouseEvent) {
    e.stopPropagation();
    setUnsaving(true);
    try {
      await toggleSaveListing(listing.id);
      onUnsave(listing.id);
    } finally {
      setUnsaving(false);
    }
  }

  return (
    <div
      onClick={() => onClick(listing.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: T.card,
        border: `1px solid ${hovered ? T.accent : T.border}`,
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: hovered
          ? "0 4px 20px rgba(34,197,94,0.1)"
          : "0 2px 10px rgba(0,0,0,0.3)",
        transition: "border-color 0.2s, box-shadow 0.2s",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Image */}
      <div
        style={{
          height: 170,
          background: "#222",
          border: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: T.muted,
          fontSize: 13,
          fontWeight: 600,
          position: "relative",
          margin: "10px 10px 0",
          borderRadius: 10,
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {listing.images?.[0] && !imageFailed ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div>No Image</div>
        )}

        {listing.status === "sold" && (
          <div
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              background: "rgba(239,68,68,0.85)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 6,
            }}
          >
            SOLD
          </div>
        )}
      </div>

      {/* Body */}
      <div
        style={{
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          flex: 1,
        }}
      >
        <div
          style={{ fontSize: 15, fontWeight: 800, color: T.text, lineHeight: 1.3 }}
        >
          {listing.title}
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, color: T.accent }}>
          ${Number(listing.price).toLocaleString()}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "auto",
            paddingTop: 8,
            borderTop: `1px solid ${T.border}`,
          }}
        >
          <span style={{ fontSize: 12, color: T.muted }}>
            📍 {listing.location}
          </span>

          <button
            onClick={handleUnsave}
            disabled={unsaving}
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 8,
              padding: "4px 10px",
              fontSize: 12,
              fontWeight: 700,
              color: T.danger,
              cursor: unsaving ? "not-allowed" : "pointer",
              opacity: unsaving ? 0.6 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {unsaving ? "Removing…" : "Unsave"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SavedListingsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    getSavedListings()
      .then((res) => setListings(res.items ?? []))
      .catch(() => setError("Unable to load saved listings."))
      .finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

  function handleUnsave(id: string) {
    setListings((prev) => prev.filter((l) => l.id !== id));
  }

  function handleCardClick(id: string) {
    navigate(`/listing/${id}`);
  }

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f0f" }} />
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.05) 0%, #0f0f0f 55%)",
        color: T.text,
        fontFamily: "'Outfit', Arial, sans-serif",
      }}
    >
      <Navbar exclude={["saved"]} />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "22px 20px 40px" }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.text }}>
            Saved Listings
          </h1>
          {!loading && !error && (
            <p style={{ margin: "5px 0 0", fontSize: 13, color: T.muted }}>
              {listings.length} saved listing{listings.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {error && (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(239,68,68,0.4)",
              background: "rgba(239,68,68,0.1)",
              color: T.danger,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 14,
              padding: "40px 20px",
              textAlign: "center",
              color: T.muted,
            }}
          >
            Loading saved listings…
          </div>
        ) : listings.length === 0 && !error ? (
          <div
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 14,
              padding: "60px 20px",
              textAlign: "center",
              color: T.muted,
              boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔖</div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: T.text,
                marginBottom: 6,
              }}
            >
              No saved listings yet
            </div>
            <div style={{ fontSize: 14, marginBottom: 20 }}>
              You don't have any saved listings. Browse the marketplace to save
              items you're interested in.
            </div>
            <button
              onClick={() => navigate("/")}
              style={{
                background: T.accent,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 22px",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Browse Marketplace
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            {listings.map((listing) => (
              <SavedListingCard
                key={listing.id}
                listing={listing}
                onUnsave={handleUnsave}
                onClick={handleCardClick}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
