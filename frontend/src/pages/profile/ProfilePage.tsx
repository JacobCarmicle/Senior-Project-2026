import { useState, useEffect } from "react";
import { Navbar } from "../../components/Navbar/Navbar.tsx";
import { listSellerReviews, getSellerRatingSummary } from "../../api/reviews";
import { useAuth } from "../../context/AuthContext";
import { useParams } from "react-router-dom";
import type { Review } from "../../types/reviews";
import ReviewForm from "../../components/ReviewForm/ReviewForm";
import { getUser } from "../../api/users";

// ── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  bg: "#2d2d2d",
  card: "#1a1a1a",
  text: "#e5e5e5",
  muted: "#9ca3af",
  border: "#404040",
  accent: "#22c55e",
  accent2: "#16a34a",
  surface: "#2d2d2d",
};

// ── Types ─────────────────────────────────────────────────────────────────────
// interface Review {
//   id: string;
//   username: string;
//   date: string;
//   rating: number; // 1–5
//   text: string;
// }

interface UserProfile {
  username: string;
  rating: number;
  ratingCount: number;
  profilePicture?: string;
  reviews: Review[];
}

// ── Star Rating Component ─────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: "2px", fontSize: "18px" }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < rating ? "#facc15" : "#555" }}>
          ★
        </span>
      ))}
    </div>
  );
}

// ── Review Card ───────────────────────────────────────────────────────────────
function ReviewCard({ review, username }: { review: Review; username: string; }) {
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
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${T.border}`,
          paddingBottom: "6px",
        }}
      >
        <span style={{ fontWeight: 700 }}>{username}</span>

        <span style={{ fontSize: "12px", color: T.muted }}>
          {new Date(review.created_at).toLocaleDateString()}
        </span>
      </div>

      <StarRating rating={review.rating} />

      <div style={{ fontSize: "14px", color: T.text }}>
        {review.comment}
      </div>
    </div>
  );
}

// ── Profile Header ────────────────────────────────────────────────────────────
function ProfileHeader({ profile }: { profile: UserProfile }) {
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
        style={{
          width: "90px",
          height: "90px",
          borderRadius: "14px",
          overflow: "hidden",
          border: `1px solid ${T.border}`,
          background: "#222",
          flexShrink: 0,
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
              fontSize: "14px",
            }}
          >
            No Image
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ fontSize: "22px", fontWeight: 800 }}>{profile.username}</div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <StarRating rating={Math.round(profile.rating)} />
          <span style={{ color: T.muted, fontSize: "14px" }}>
            {profile.rating.toFixed(1)} ({profile.ratingCount} reviews)
          </span>
        </div>
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
        fontSize: "16px",
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
    const { user } = useAuth();

    const { userId } = useParams();
    const profileUserId = userId ?? user?.id;

    useEffect(() => {
      if (!profileUserId) return;

      const sellerId = profileUserId;

      let cancelled = false;

      async function loadProfile() {
        try {
          const [userRes, reviewsRes, ratingRes] = await Promise.all([
            getUser(sellerId),
            listSellerReviews(sellerId),
            getSellerRatingSummary(sellerId),
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
            profilePicture: "",
            reviews: reviewsRes.items ?? [],
          };

          setProfile(profileData);
        }catch (err: any) {
          if (err?.response?.status === 404) {
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
          background: T.bg,
          color: T.text,
          fontFamily: "Arial, sans-serif",
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
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>⚠️</div>

            <div style={{ fontSize: "18px", fontWeight: 800, marginBottom: "6px" }}>
              Unable to load profile
            </div>

            <div style={{ fontSize: "14px", color: T.muted, marginBottom: "16px" }}>
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
          background: T.bg,
          color: T.text,
          fontFamily: "Arial, sans-serif",
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
        background: T.bg,
        color: T.text,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Navbar />

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "22px" }}>
        <ProfileHeader profile={profile} />

        {user && profileUserId && user?.id !== profileUserId && (
          <ReviewForm
            sellerId={profileUserId}
            onSubmitted={() => {
              setReloadKey((k) => k + 1);
            }}
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
          <div style={{ fontSize: "18px", fontWeight: 800 }}>
            Reviews ({profile.reviews.length})
          </div>
        </div>

        {/* Reviews List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {profile.reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              username={userMap[review.buyer_id] || "Loading..."}
            />
          ))}
        </div>
      </div>
    </div>
  );
}