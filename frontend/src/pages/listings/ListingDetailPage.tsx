import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteListing, getListing, updateListing, getSimilarListings } from "../../api/listings";
import { openConversationFromListing } from "../../api/messaging";
import { getSellerRatingSummary, getSellerTrustScore } from "../../api/reviews";
import type { SellerTrustScore } from "../../types/reviews";
import { Navbar } from "../../components/Navbar/Navbar";
import ReportModal from "../../components/ReportModal/ReportModal";
import type { Listing } from "../../types/listings";
import { useAuth } from "../../context/AuthContext";

const BADGE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  "Trusted Seller":   { bg: "rgba(34,197,94,0.15)",  border: "rgba(34,197,94,0.4)",  text: "#22c55e" },
  "Reliable Seller":  { bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.4)", text: "#60a5fa" },
  "New Seller":       { bg: "rgba(234,179,8,0.15)",  border: "rgba(234,179,8,0.4)",  text: "#eab308" },
  "Limited Activity": { bg: "rgba(156,163,175,0.1)", border: "rgba(156,163,175,0.3)", text: "#9ca3af" },
};

const T = {
  bg:      "#0f0f0f",
  card:    "#161616",
  text:    "#e8e8e8",
  muted:   "#8a8a8a",
  border:  "rgba(255,255,255,0.07)",
  accent:  "#22c55e",
  accent2: "#16a34a",
  danger:  "#ef4444",
  surface: "#1a1a1a",
  input:   "#111",
};

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [rating, setRating] = useState<{ average_rating: number; review_count: number } | null>(null);
  const [trust, setTrust] = useState<SellerTrustScore | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [adminConfirm, setAdminConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [adminWorking, setAdminWorking] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [similar, setSimilar] = useState<import("../../types/listings").Listing[]>([]);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!id) return;

    getListing(id)
      .then(async (l) => {
        setListing(l);
        setSelectedImageIndex(0);
        try {
          const [summary, trustScore] = await Promise.all([
            getSellerRatingSummary(l.seller_id),
            getSellerTrustScore(l.seller_id).catch(() => null),
          ]);
          setRating(summary);
          setTrust(trustScore);
        } catch {
          setRating({ average_rating: 0, review_count: 0 });
        }
      })
      .catch(() => setError("Unable to load listing."))
      .finally(() => setLoading(false));

    getSimilarListings(id).then(setSimilar).catch(() => {});
  }, [id]);

  const imageCount = listing?.images?.length ?? 0;

  const goToPreviousImage = useCallback(() => {
    if (!listing?.images?.length) return;
    setSelectedImageIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length);
  }, [listing?.images]);

  const goToNextImage = useCallback(() => {
    if (!listing?.images?.length) return;
    setSelectedImageIndex((prev) => (prev + 1) % listing.images.length);
  }, [listing?.images]);

  useEffect(() => {
    if (!listing?.images?.length || listing.images.length <= 1) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPreviousImage();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNextImage();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goToNextImage, goToPreviousImage, listing]);

  async function handleMessageSeller() {
    if (!listing) return;
    const convo = await openConversationFromListing(listing.id);
    navigate(`/messages?conversation=${convo.id}`);
  }

  function handleViewSellerProfile() {
    if (!listing) return;
    navigate(`/user/${listing.seller_id}`);
  }

  function adminAsk(message: string, onConfirm: () => void) {
    setAdminConfirm({ message, onConfirm });
  }

  async function adminRemoveListing() {
    if (!listing) return;
    setAdminWorking(true);
    try {
      await deleteListing(listing.id);
      navigate("/");
    } finally {
      setAdminWorking(false);
    }
  }

  async function adminMarkSold() {
    if (!listing) return;
    setAdminWorking(true);
    try {
      const updated = await updateListing(listing.id, { status: "sold" });
      setListing(updated);
    } finally {
      setAdminWorking(false);
    }
  }

  async function adminMarkActive() {
    if (!listing) return;
    setAdminWorking(true);
    try {
      const updated = await updateListing(listing.id, { status: "active" });
      setListing(updated);
    } finally {
      setAdminWorking(false);
    }
  }

if (error) {
    return <div style={{ minHeight: "100vh", background: T.bg, padding: 24, color: T.danger }}>{error}</div>;
  }

  if (loading || !listing) {
    return <div style={{ minHeight: "100vh", background: T.bg, padding: 24, color: T.muted }}>Loading listing...</div>;
  }

  const isAdmin = user?.role === "admin";
  const isOwnListing = user?.id === listing?.seller_id;

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.05) 0%, #0f0f0f 55%)", color: T.text, fontFamily: "'Outfit', Arial, sans-serif" }}>
      <Navbar />

      {/* Admin Confirm Modal */}
      {adminConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#1a1a1a", border: "1px solid #404040", borderRadius: 14, padding: "28px 32px", maxWidth: 380, width: "90%", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: "0.938rem", color: T.text, marginBottom: 22, lineHeight: 1.6 }}>{adminConfirm.message}</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setAdminConfirm(null)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #404040", background: "#2d2d2d", color: T.text, cursor: "pointer", fontSize: "0.813rem" }}>Cancel</button>
              <button onClick={() => { adminConfirm.onConfirm(); setAdminConfirm(null); }} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.15)", color: "#ef4444", cursor: "pointer", fontSize: "0.813rem", fontWeight: 700 }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {reportOpen && listing && (
        <ReportModal
          targetType="listing"
          targetId={listing.id}
          targetName={listing.title}
          listingId={listing.id}
          onClose={() => setReportOpen(false)}
        />
      )}

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: isMobile? 10 : 24 }}>
        <div
          style={{
            marginTop: 14,
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <a href="/" style={{ color: T.muted, textDecoration: "none", fontSize: "0.875rem", marginLeft: "20px", marginTop: "10px"}}>← Back to Marketplace</a>
          {listing.images?.length ? (
            <div style={{ borderBottom: `1px solid ${T.border}`, padding: 12 }}>
              <div style={{ position: "relative" }}>
                <img
                  src={listing.images[selectedImageIndex] ?? listing.images[0]}
                  alt={`${listing.title} image ${selectedImageIndex + 1}`}
                  style={{ width: "100%", maxHeight: isMobile ? 300 : 460, objectFit: "cover", borderRadius: 10 }}
                />

                {imageCount > 1 && (
                  <>
                    <button
                      onClick={goToPreviousImage}
                      aria-label="Previous image"
                      style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 38,
                        height: 38,
                        borderRadius: 999,
                        border: `1px solid ${T.border}`,
                        background: "rgba(0,0,0,0.5)",
                        color: "#fff",
                        fontSize: "1.250rem",
                        cursor: "pointer",
                      }}
                    >
                      ‹
                    </button>

                    <button
                      onClick={goToNextImage}
                      aria-label="Next image"
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 38,
                        height: 38,
                        borderRadius: 999,
                        border: `1px solid ${T.border}`,
                        background: "rgba(0,0,0,0.5)",
                        color: "#fff",
                        fontSize: "1.250rem",
                        cursor: "pointer",
                      }}
                    >
                      ›
                    </button>

                    <div
                      style={{
                        position: "absolute",
                        right: 12,
                        bottom: 12,
                        padding: "4px 8px",
                        borderRadius: 8,
                        fontSize: "0.750rem",
                        fontWeight: 700,
                        background: "rgba(0,0,0,0.55)",
                        color: "#fff",
                      }}
                    >
                      {selectedImageIndex + 1} / {imageCount}
                    </div>
                  </>
                )}
              </div>

              {listing.images.length > 1 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))",
                    gap: 8,
                    marginTop: 10,
                  }}
                >
                  {listing.images.map((imageUrl, index) => {
                    const active = index === selectedImageIndex;
                    return (
                      <button
                        key={`${imageUrl}-${index}`}
                        onClick={() => setSelectedImageIndex(index)}
                        style={{
                          padding: 0,
                          borderRadius: 8,
                          border: active ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
                          background: "transparent",
                          cursor: "pointer",
                          overflow: "hidden",
                        }}
                        aria-label={`View image ${index + 1}`}
                      >
                        <img
                          src={imageUrl}
                          alt={`${listing.title} thumbnail ${index + 1}`}
                          style={{ width: "100%", height: 64, objectFit: "cover", display: "block" }}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          <div style={{ padding: isMobile ? 14 : 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <h1 style={{ margin: 0, fontSize: "clamp(1.4rem, 6vw, 1.9rem)", fontWeight: 900 }}>{listing.title}</h1>
                <p style={{ margin: "8px 0 0", color: T.muted }}>📍 {listing.location}</p>
              </div>
              <div style={{ textAlign: isMobile ? "left" : "right" }}>
                <div style={{ fontSize: "2.000rem", fontWeight: 900, color: T.accent }}>${Number(listing.price).toLocaleString()}</div>
                <div style={{ color: T.muted, fontSize: "0.813rem", marginTop: 4 }}>{listing.category}</div>
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
                fontSize: "0.875rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span>Posted by: <a href={`/user/${listing.seller_id}`} style={{ color: T.accent, fontWeight: 700, textDecoration: "none" }}>{listing.seller_name ?? "Unknown"}</a></span>
                {trust?.trust_badge && (() => {
                  const c = BADGE_COLORS[trust.trust_badge];
                  return (
                    <span style={{ fontSize: "0.688rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
                      {trust.trust_badge}
                    </span>
                  );
                })()}
              </div>
              <div style={{ marginTop: 6 }}>
                Seller rating: <strong style={{ color: T.text }}>{rating?.average_rating ?? 0}</strong> / 5 ({rating?.review_count ?? 0} reviews)
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
              {user && !isOwnListing && !isAdmin && (
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
                    width: isMobile ? "100%" : undefined,
                  }}
                >
                  Message Seller
                </button>
              )}
                <button
                onClick={handleViewSellerProfile}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "#333",
                  color: T.text,
                  border: `1px solid ${T.border}`,
                  fontWeight: 700,
                  cursor: "pointer",
                  width: isMobile ? "100%" : undefined,
                }}
              >
                View Seller Profile
              </button>
              {isOwnListing && !isAdmin && (
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
                    width: isMobile ? "100%" : undefined,
                    textAlign: "center",
                  }}
                >
                  Edit Listing
                </a>
              )}
              {user && !isOwnListing && !isAdmin && (
                <button
                  onClick={() => setReportOpen(true)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 10,
                    background: "rgba(239,68,68,0.08)",
                    color: "#ef4444",
                    border: "1px solid rgba(239,68,68,0.3)",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    marginLeft: isMobile? 0 : "auto",
                    width: isMobile? "100%" : undefined,
                  }}
                >
                  Report Listing
                </button>
              )}
            </div>

            {/* ── Admin Controls Panel ── */}
            {isAdmin && (
              <div style={{
                marginTop: 22,
                border: "1px solid rgba(168,85,247,0.4)",
                borderRadius: 12,
                overflow: "hidden",
              }}>
                <div style={{
                  background: "rgba(168,85,247,0.1)",
                  borderBottom: "1px solid rgba(168,85,247,0.3)",
                  padding: "10px 16px",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ fontSize: "0.813rem", fontWeight: 700, color: "#c084fc" }}>Admin Controls</span>
                  <span style={{ fontSize: "0.688rem", color: "#9ca3af" }}>— Seller: {listing.seller_name ?? listing.seller_id}</span>
                </div>
                <div style={{ padding: "14px 16px", background: "rgba(168,85,247,0.04)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>

                  {/* Edit */}
                  <a href={`/edit-listing/${listing.id}`} style={{
                    padding: "8px 14px", borderRadius: 8, fontSize: "0.813rem", fontWeight: 700,
                    background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.35)",
                    color: "#c084fc", textDecoration: "none",
                  }}>Edit Listing</a>

                  {/* Mark Sold / Restore Active */}
                  {listing.status === "active" && (
                    <button
                      disabled={adminWorking}
                      onClick={() => adminAsk("Mark this listing as sold?", adminMarkSold)}
                      style={{ padding: "8px 14px", borderRadius: 8, fontSize: "0.813rem", fontWeight: 700, cursor: "pointer", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.35)", color: "#60a5fa" }}
                    >Mark as Sold</button>
                  )}
                  {listing.status === "sold" && (
                    <button
                      disabled={adminWorking}
                      onClick={() => adminAsk("Restore this listing to active?", adminMarkActive)}
                      style={{ padding: "8px 14px", borderRadius: 8, fontSize: "0.813rem", fontWeight: 700, cursor: "pointer", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.35)", color: "#22c55e" }}
                    >Restore to Active</button>
                  )}

                  {/* View Seller Profile */}
                  <a href={`/profile/${listing.seller_id}`} style={{
                    padding: "8px 14px", borderRadius: 8, fontSize: "0.813rem", fontWeight: 700,
                    background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)",
                    color: "#eab308", textDecoration: "none",
                  }}>View Seller Profile</a>

                  {/* Message Seller */}
                  <button
                    onClick={handleMessageSeller}
                    style={{ padding: "8px 14px", borderRadius: 8, fontSize: "0.813rem", fontWeight: 700, cursor: "pointer", background: "rgba(156,163,175,0.1)", border: "1px solid rgba(156,163,175,0.3)", color: "#9ca3af" }}
                  >Message Seller</button>

                  {/* Remove */}
                  <button
                    disabled={adminWorking}
                    onClick={() => adminAsk(`Permanently remove "${listing.title}"? This cannot be undone.`, adminRemoveListing)}
                    style={{ padding: "8px 14px", borderRadius: 8, fontSize: "0.813rem", fontWeight: 700, cursor: "pointer", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#ef4444", marginLeft: "auto" }}
                  >Remove Listing</button>

                </div>
              </div>
            )}
          </div>
        </div>
        {/* ── More Like This ── */}
        {similar.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div style={{ fontSize: "1.000rem", fontWeight: 800, color: T.text, marginBottom: 14 }}>
              More like this
            </div>
            <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 6 }}>
              {similar.map((item) => (
                <a
                  key={item.id}
                  href={`/listing/${item.id}`}
                  style={{
                    flexShrink: 0,
                    width: isMobile ? 160 : 190,
                    background: T.card,
                    border: `1px solid ${T.border}`,
                    borderRadius: 12,
                    overflow: "hidden",
                    textDecoration: "none",
                    display: "block",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = T.accent;
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 16px rgba(34,197,94,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = T.border;
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
                  }}
                >
                  <div style={{ height: 110, background: "#222", position: "relative", overflow: "hidden" }}>
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontSize: "0.750rem" }}>No Image</div>
                    )}
                    {item.status === "sold" && (
                      <div style={{ position: "absolute", top: 6, left: 6, background: "rgba(239,68,68,0.85)", color: "#fff", fontSize: "0.625rem", fontWeight: 700, padding: "2px 7px", borderRadius: 5 }}>SOLD</div>
                    )}
                  </div>
                  <div style={{ padding: "10px 12px" }}>
                    <div style={{ fontSize: "0.813rem", fontWeight: 700, color: T.text, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                    <div style={{ fontSize: "0.938rem", fontWeight: 900, color: T.accent }}>${Number(item.price).toLocaleString()}</div>
                    <div style={{ fontSize: "0.688rem", color: T.muted, marginTop: 3 }}>{item.location}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
