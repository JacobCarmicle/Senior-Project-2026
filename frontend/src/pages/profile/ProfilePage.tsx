import { useState, useEffect, useRef } from "react";
import { Navbar } from "../../components/Navbar/Navbar.tsx";
import { listSellerReviews, getSellerRatingSummary, deleteReview, getSellerTrustScore } from "../../api/reviews";
import { useAuth } from "../../context/AuthContext";
import { useParams } from "react-router-dom";
import type { Review, SellerTrustScore } from "../../types/reviews";
import ReviewForm from "../../components/ReviewForm/ReviewForm";
import ReportModal from "../../components/ReportModal/ReportModal";
import { getUser, updateAvatar } from "../../api/users";

// ── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:      "#0f0f0f",
  card:    "#161616",
  text:    "#e8e8e8",
  muted:   "#8a8a8a",
  border:  "rgba(255,255,255,0.07)",
  accent:  "#22c55e",
  accent2: "#16a34a",
  surface: "#1a1a1a",
  input:   "#111",
};

// ── Types ─────────────────────────────────────────────────────────────────────
// interface Review {
//   id: string;
//   username: string;
//   date: string;
//   rating: number; // 1–5
//   text: string;
// }

const BADGE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  "Trusted Seller":   { bg: "rgba(34,197,94,0.15)",  border: "rgba(34,197,94,0.4)",  text: "#22c55e" },
  "Reliable Seller":  { bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.4)", text: "#60a5fa" },
  "New Seller":       { bg: "rgba(234,179,8,0.15)",  border: "rgba(234,179,8,0.4)",  text: "#eab308" },
  "Limited Activity": { bg: "rgba(156,163,175,0.1)", border: "rgba(156,163,175,0.3)", text: "#9ca3af" },
};

interface UserProfile {
  username: string;
  rating: number;
  ratingCount: number;
  profilePicture?: string;
  reviews: Review[];
  trust?: SellerTrustScore;
}

// ── Star Rating Component ─────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: "2px", fontSize: "1.125rem" }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < rating ? "#facc15" : "#555" }}>
          ★
        </span>
      ))}
    </div>
  );
}

// ── Review Card ───────────────────────────────────────────────────────────────
function ReviewCard({
  review,
  username,
  canDelete,
  onDelete,
  onReport,
}: {
  review: Review;
  username: string;
  canDelete?: boolean;
  onDelete?: () => void;
  onReport?: () => void;
}) {
  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: "12px",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span style={{ fontWeight: 700 }}>{username}</span>
        <span style={{ fontSize: "0.875rem", color: T.muted }}>
          {new Date(review.created_at).toLocaleDateString()}
        </span>

        {canDelete && (
          <button
            onClick={onDelete}
            style={{
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "0.750rem",
              fontWeight: 700,
              cursor: "pointer",
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.35)",
              color: "#ef4444",
            }}
          >
            Delete
          </button>
        )}

        {onReport && (
          <button
            onClick={onReport}
            style={{
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "0.750rem",
              fontWeight: 700,
              cursor: "pointer",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444",
            }}
          >
            Report
          </button>
        )}
      </div>

      <StarRating rating={review.rating} />

      {review.listing_title && (
        <div style={{ fontSize: "0.750rem", color: T.muted }}>
          Item: <a href={review.listing_id ? `/listing/${review.listing_id}` : undefined} style={{ color: "#60a5fa", textDecoration: "none" }}>{review.listing_title}</a>
        </div>
      )}

      <div style={{ fontSize: "0.875rem", color: T.text }}>
        {review.comment}
      </div>
    </div>
  );
}

// ── Profile Header ────────────────────────────────────────────────────────────
function ProfileHeader({
  profile,
  isOwnProfile,
  onAvatarClick,
  uploading,
}: {
  profile: UserProfile;
  isOwnProfile?: boolean;
  onAvatarClick?: () => void;
  uploading?: boolean;
}) {
  const badge = profile.trust?.trust_badge;
  const badgeColors = badge ? BADGE_COLORS[badge] : null;

  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: "14px",
        padding: "20px",
        display: "flex",
        gap: "20px",
        alignItems: "center",
        marginBottom: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
      }}
    >
      {/* Profile Picture */}
      <div
        className={isOwnProfile ? "avatar-wrap" : undefined}
        onClick={isOwnProfile ? onAvatarClick : undefined}
        style={{
          width: "90px",
          height: "90px",
          borderRadius: "14px",
          overflow: "hidden",
          border: `1px solid ${T.border}`,
          background: "#222",
          flexShrink: 0,
          position: "relative",
          cursor: isOwnProfile ? "pointer" : "default",
        }}
      >
        {profile.profilePicture ? (
          <img
            src={profile.profilePicture}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#555",
              fontSize: "0.875rem",
            }}
          >
            No Image
          </div>
        )}
        {isOwnProfile && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...(uploading ? { opacity: 1 } : {}),
            }}
            className="avatar-overlay"
          >
            {uploading ? (
              <div style={{ width: 20, height: 20, border: "2px solid #22c55e", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e8e8e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: "1.375rem", fontWeight: 800 }}>{profile.username}</div>
          {badge && badgeColors && (
            <span
              style={{
                fontSize: "0.750rem",
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 999,
                background: badgeColors.bg,
                border: `1px solid ${badgeColors.border}`,
                color: badgeColors.text,
              }}
            >
              {badge}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <StarRating rating={Math.round(profile.rating)} />
          <span style={{ color: T.muted, fontSize: "0.875rem" }}>
            {profile.rating.toFixed(1)} ({profile.ratingCount} reviews)
          </span>
        </div>

        {profile.trust && (
          <div style={{ fontSize: "0.813rem", color: T.muted }}>
            Trust score: <strong style={{ color: T.text }}>{profile.trust.trust_score}</strong> / 100
          </div>
        )}
      </div>
    </div>
  );
}

function MessageCard({ message }: { message: string }) {
  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: "14px",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
        minHeight: "120px",
        fontSize: "1.000rem",
        fontWeight: 600,
        color: T.text,
      }}
    >
      {message}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UserProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [userMap, setUserMap] = useState<Record<string, string>>({});
    const [reloadKey, setReloadKey] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [reportOpen, setReportOpen] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const { user, setUser } = useAuth();
    const [reportReviewId, setReportReviewId] = useState<string | null>(null);

    const { userId } = useParams();
    const profileUserId = userId ?? user?.id;

    async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadingAvatar(true);
      try {
        const updated = await updateAvatar(file);
        setProfile((prev) => prev ? { ...prev, profilePicture: updated.profile_picture ?? "" } : prev);
        // propagate to Navbar / auth context
        setUser((prev) => prev ? { ...prev, profile_picture: updated.profile_picture ?? null } : prev);
      } catch {
        alert("Failed to upload image. Please try again.");
      } finally {
        setUploadingAvatar(false);
        if (avatarInputRef.current) avatarInputRef.current.value = "";
      }
    }

    async function handleDeleteReview(reviewId: string) {
      if (!confirm("Delete this review? This cannot be undone.")) return;

      try {
        await deleteReview(reviewId);

        // refresh reviews
        setReloadKey((k) => k + 1);
      } catch (err) {
        console.error(err);
        alert("Failed to delete review.");
      }
    }

    useEffect(() => {
      if (!profileUserId) return;

      const sellerId = profileUserId;

      let cancelled = false;

      async function loadProfile() {
        try {
          const [userRes, reviewsRes, ratingRes, trustRes] = await Promise.all([
            getUser(sellerId),
            listSellerReviews(sellerId),
            getSellerRatingSummary(sellerId),
            getSellerTrustScore(sellerId).catch(() => null),
          ]);

          if (cancelled) return;

          const reviews = reviewsRes.items ?? [];

          const uniqueUserIds = [
            ...new Set(reviews.map((r) => r.buyer_id)),
          ];

          const users = await Promise.all(
            uniqueUserIds.map((id) =>
              getUser(id).catch(() => null) // prevent crash if one fails
            )
          );

          const userLookup: Record<string, string> = {};
          users.forEach((u) => {
            if (u) userLookup[u.id] = u.full_name;
          });

          if(cancelled) return;

          setUserMap(userLookup);

          const profileData: UserProfile = {
            username: userRes.full_name,
            rating: ratingRes.average_rating ?? 0,
            ratingCount: ratingRes.review_count ?? 0,
            profilePicture: userRes.profile_picture ?? "",
            reviews: reviewsRes.items ?? [],
            trust: trustRes ?? undefined,
          };

          setProfile(profileData);
        } catch (err: unknown) {
          const status =
            typeof err === "object" &&
            err !== null &&
            "response" in err &&
            typeof (err as { response?: { status?: number } }).response?.status === "number"
              ? (err as { response?: { status?: number } }).response?.status
              : undefined;

          if (status === 404) {
            setError("User not found.");
          } else {
            setError("Failed to load profile. Please try again.");
          }
        }
      }

      loadProfile();

      return () => {
        cancelled = true;
      };
    }, [profileUserId, user, userId, reloadKey]);

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.05) 0%, #0f0f0f 55%)",
          color: T.text,
          fontFamily: "'Outfit', Arial, sans-serif",
        }}
      >
        <Navbar />

        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "22px" }}>
          <div
            style={{
              background: T.card,
              border: `1px solid rgba(239,68,68,0.4)`,
              borderRadius: "14px",
              padding: "24px",
              textAlign: "center",
              boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ fontSize: "2.500rem", marginBottom: "10px" }}>⚠️</div>

            <div style={{ fontSize: "1.125rem", fontWeight: 800, marginBottom: "6px" }}>
              Unable to load profile
            </div>

            <div style={{ fontSize: "0.875rem", color: T.muted, marginBottom: "16px" }}>
              {error}
            </div>

            <button
              onClick={() => {
                setError(null);
                setProfile(null); // triggers reload
              }}
              style={{
                background: T.accent,
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "10px 20px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    const message = "Loading profile...";

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.05) 0%, #0f0f0f 55%)",
          color: T.text,
          fontFamily: "'Outfit', Arial, sans-serif",
        }}
      >
        <Navbar />

        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "22px" }}>
          <MessageCard message={message} />
        </div>
      </div>
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
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .avatar-wrap .avatar-overlay { opacity: 0; transition: opacity 0.18s; }
        .avatar-wrap:hover .avatar-overlay { opacity: 1; }
      `}</style>
      <Navbar />

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "22px" }}>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleAvatarChange}
        />
        <ProfileHeader
          profile={profile}
          isOwnProfile={!!user && user.id === profileUserId}
          onAvatarClick={() => avatarInputRef.current?.click()}
          uploading={uploadingAvatar}
        />

        {user && profileUserId && user?.id !== profileUserId && (
          <>
            <ReviewForm
              sellerId={profileUserId}
              onSubmitted={() => setReloadKey((k) => k + 1)}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <button
                onClick={() => setReportOpen(true)}
                style={{
                  padding: "8px 16px", borderRadius: 10, fontSize: "0.813rem", fontWeight: 700, cursor: "pointer",
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444",
                }}
              >
                Report User
              </button>
            </div>
            {reportOpen && profile && (
              <ReportModal
                targetType="user"
                targetId={profileUserId}
                targetName={profile.username}
                onClose={() => setReportOpen(false)}
              />
            )}
          </>
        )}

        {reportReviewId && (
          <ReportModal
            targetType="review"
            targetId={reportReviewId}
            targetName="Review"
            onClose={() => setReportReviewId(null)}
          />
        )}

        {/* Reviews Section */}
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: "14px",
            padding: "18px",
            marginBottom: "12px",
          }}
        >
          <div style={{ fontSize: "1.125rem", fontWeight: 800 }}>
            Reviews ({profile.reviews.length})
          </div>
        </div>

        {/* Reviews List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {profile.reviews.map((review) => {
            const canReport = user && user.id !== review.buyer_id;

            return (
              <ReviewCard
                key={review.id}
                review={review}
                username={userMap[review.buyer_id] || "Loading..."}
                canDelete={user?.role === "admin" || user?.id === review.buyer_id}
                onDelete={() => handleDeleteReview(review.id)}
                onReport={canReport ? () => setReportReviewId(review.id) : undefined}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
