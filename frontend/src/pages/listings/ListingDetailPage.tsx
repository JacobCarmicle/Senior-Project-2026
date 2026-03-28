import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteListing, getListing, updateListing } from "../../api/listings";
import { openConversationFromListing } from "../../api/messaging";
import { getSellerRatingSummary } from "../../api/reviews";
import { Navbar } from "../../components/Navbar/Navbar";
import { createReport, REPORT_REASONS, type ReportReason } from "../../api/reports";
import type { Listing } from "../../types/listings";
import { useAuth } from "../../context/AuthContext";

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
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [rating, setRating] = useState<{ average_rating: number; review_count: number } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [adminConfirm, setAdminConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [adminWorking, setAdminWorking] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>(REPORT_REASONS[0]);
  const [reportDesc, setReportDesc] = useState("");
  const [reportWorking, setReportWorking] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [reportError, setReportError] = useState("");

  useEffect(() => {
    if (!id) return;

    getListing(id)
      .then(async (l) => {
        setListing(l);
        setSelectedImageIndex(0);
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

  const imageCount = listing?.images?.length ?? 0;

  function goToPreviousImage() {
    if (!listing?.images?.length) return;
    setSelectedImageIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length);
  }

  function goToNextImage() {
    if (!listing?.images?.length) return;
    setSelectedImageIndex((prev) => (prev + 1) % listing.images.length);
  }

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
  }, [listing]);

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

  async function handleReport() {
    if (!listing) return;
    setReportWorking(true);
    setReportError("");
    try {
      await createReport({ listing_id: listing.id, reason: reportReason, description: reportDesc });
      setReportOpen(false);
      setReportDesc("");
      setReportDone(true);
      setTimeout(() => setReportDone(false), 6000);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setReportError(detail ?? "Failed to submit report. Please try again.");
    } finally {
      setReportWorking(false);
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
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "Arial, sans-serif" }}>
      <Navbar />

      {/* Admin Confirm Modal */}
      {adminConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#1a1a1a", border: "1px solid #404040", borderRadius: 14, padding: "28px 32px", maxWidth: 380, width: "90%", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: 15, color: T.text, marginBottom: 22, lineHeight: 1.6 }}>{adminConfirm.message}</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setAdminConfirm(null)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #404040", background: "#2d2d2d", color: T.text, cursor: "pointer", fontSize: 13 }}>Cancel</button>
              <button onClick={() => { adminConfirm.onConfirm(); setAdminConfirm(null); }} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.15)", color: "#ef4444", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Report Toast */}
      {reportDone && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 60, background: "#1a1a1a", border: "1px solid rgba(34,197,94,0.4)", borderRadius: 12, padding: "14px 22px", boxShadow: "0 8px 30px rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-start", gap: 12, maxWidth: 420, width: "90%" }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>✅</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Your report was submitted successfully!</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>Reports take 2–3 days to review. Thank you for helping keep TradeForge safe.</div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#1a1a1a", border: "1px solid #404040", borderRadius: 14, padding: "28px 32px", maxWidth: 420, width: "90%", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4 }}>Report Listing</div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 18 }}>Let us know what's wrong with this listing.</div>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.muted, display: "block", marginBottom: 6 }}>REASON</label>
            <select
              value={reportReason}
              onChange={e => setReportReason(e.target.value as ReportReason)}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #404040", background: "#2d2d2d", color: T.text, fontSize: 13, marginBottom: 14, outline: "none" }}
            >
              {REPORT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.muted, display: "block", marginBottom: 6 }}>ADDITIONAL DETAILS (optional)</label>
            <textarea
              value={reportDesc}
              onChange={e => setReportDesc(e.target.value)}
              placeholder="Describe the issue..."
              rows={3}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #404040", background: "#2d2d2d", color: T.text, fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box" }}
            />
            {reportError && (
              <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: 13 }}>
                {reportError}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
              <button onClick={() => setReportOpen(false)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #404040", background: "#2d2d2d", color: T.text, cursor: "pointer", fontSize: 13 }}>Cancel</button>
              <button
                disabled={reportWorking}
                onClick={handleReport}
                style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.15)", color: "#ef4444", cursor: "pointer", fontSize: 13, fontWeight: 700, opacity: reportWorking ? 0.6 : 1 }}
              >{reportWorking ? "Submitting…" : "Submit Report"}</button>
            </div>
          </div>
        </div>
      )}

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
          {listing.images?.length ? (
            <div style={{ borderBottom: `1px solid ${T.border}`, padding: 12 }}>
              <div style={{ position: "relative" }}>
                <img
                  src={listing.images[selectedImageIndex] ?? listing.images[0]}
                  alt={`${listing.title} image ${selectedImageIndex + 1}`}
                  style={{ width: "100%", maxHeight: 460, objectFit: "cover", borderRadius: 10 }}
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
                        fontSize: 20,
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
                        fontSize: 20,
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
                        fontSize: 12,
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
              <div>Posted by: <strong style={{ color: T.text }}>{listing.seller_name ?? "Unknown"}</strong></div>
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
                    fontSize: 14,
                    marginLeft: "auto",
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
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#c084fc" }}>Admin Controls</span>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>— Seller: {listing.seller_name ?? listing.seller_id}</span>
                </div>
                <div style={{ padding: "14px 16px", background: "rgba(168,85,247,0.04)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>

                  {/* Edit */}
                  <a href={`/edit-listing/${listing.id}`} style={{
                    padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                    background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.35)",
                    color: "#c084fc", textDecoration: "none",
                  }}>Edit Listing</a>

                  {/* Mark Sold / Restore Active */}
                  {listing.status === "active" && (
                    <button
                      disabled={adminWorking}
                      onClick={() => adminAsk("Mark this listing as sold?", adminMarkSold)}
                      style={{ padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.35)", color: "#60a5fa" }}
                    >Mark as Sold</button>
                  )}
                  {listing.status === "sold" && (
                    <button
                      disabled={adminWorking}
                      onClick={() => adminAsk("Restore this listing to active?", adminMarkActive)}
                      style={{ padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.35)", color: "#22c55e" }}
                    >Restore to Active</button>
                  )}

                  {/* View Seller Profile */}
                  <a href={`/profile/${listing.seller_id}`} style={{
                    padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                    background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)",
                    color: "#eab308", textDecoration: "none",
                  }}>View Seller Profile</a>

                  {/* Message Seller */}
                  <button
                    onClick={handleMessageSeller}
                    style={{ padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", background: "rgba(156,163,175,0.1)", border: "1px solid rgba(156,163,175,0.3)", color: "#9ca3af" }}
                  >Message Seller</button>

                  {/* Remove */}
                  <button
                    disabled={adminWorking}
                    onClick={() => adminAsk(`Permanently remove "${listing.title}"? This cannot be undone.`, adminRemoveListing)}
                    style={{ padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#ef4444", marginLeft: "auto" }}
                  >Remove Listing</button>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
