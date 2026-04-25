import { useState, useMemo, useEffect, useRef } from "react";
import { listListings, toggleSaveListing, getSavedListings, searchListings, getForYouRecommendations } from "../../api/listings";
import type { Listing as ApiListing } from "../../types/listings";
import { Navbar } from "../../components/Navbar/Navbar.tsx";
import { useAuth } from "../../context/AuthContext";
import AnimatedSearchBar from "../../components/ui/animated-glowing-search-bar";

// ── Design Tokens ─────────────────────────────────────────────────────────────
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
  hover:   "#222",
  input:   "#111",
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface Listing {
  id: string;
  title: string;
  price: number;
  category: string;
  location: string;
  postedAt: string;
  saved: boolean;
  status: "active" | "sold";
  sellerName: string;
  sellerRating: number;
  imageUrl?: string;
  distanceMiles?: number | null;
}

const CATEGORIES = ["All", "Electronics", "Automotive", "Furniture", "Clothing", "Sports"];
const SORT_OPTIONS = [
  { value: "newest",     label: "Newest first" },
  { value: "oldest",     label: "Oldest first" },
  { value: "price-asc",  label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "distance",   label: "Distance" },
];
const PAGE_SIZE = 8;
const DEBUG_IMAGES = import.meta.env.VITE_DEBUG_IMAGES === "true";

function toUiListing(listing: ApiListing): Listing {
  return {
    id: listing.id,
    title: listing.title,
    price: Number(listing.price),
    category: listing.category,
    location: listing.location,
    postedAt: (listing.created_at || "").slice(0, 10),
    saved: false,
    status: listing.status === "sold" ? "sold" : "active",
    sellerName: "Seller",
    sellerRating: 0,
    imageUrl: listing.images?.[0],
    distanceMiles: listing.distance_miles,
  };
}

// ── Category pill color ───────────────────────────────────────────────────────
function catColor(cat: string): { bg: string; color: string; border: string } {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    Electronics: { bg: "rgba(59,130,246,0.12)",  color: "#60a5fa", border: "rgba(59,130,246,0.3)" },
    Automotive:  { bg: "rgba(249,115,22,0.12)",  color: "#fb923c", border: "rgba(249,115,22,0.3)" },
    Furniture:   { bg: "rgba(168,85,247,0.12)",  color: "#c084fc", border: "rgba(168,85,247,0.3)" },
    Clothing:    { bg: "rgba(236,72,153,0.12)",  color: "#f472b6", border: "rgba(236,72,153,0.3)" },
    Sports:      { bg: "rgba(234,179,8,0.12)",   color: "#eab308", border: "rgba(234,179,8,0.3)"  },
  };
  return map[cat] ?? { bg: "rgba(156,163,175,0.1)", color: "#9ca3af", border: "rgba(156,163,175,0.25)" };
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function IconBookmark({ filled, size = 16 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#22c55e" : "none"} stroke={filled ? "#22c55e" : "#cbd5e1"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconPin({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}


function IconEmpty() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#404040" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
      <path d="M8 11h6M11 8v6" />
    </svg>
  );
}

// ── Skeleton Card ─────────────────────────────────────────────────────────────
const shimmerStyle: React.CSSProperties = {
  background: "linear-gradient(90deg, #161616 25%, #1e1e1e 50%, #161616 75%)",
  backgroundSize: "600px 100%",
  animation: "shimmer 1.4s infinite linear",
  borderRadius: "8px",
};

function SkeletonCard() {
  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: "14px",
      overflow: "hidden",
    }}>
      <div style={{ height: "170px", margin: "10px 10px 0", borderRadius: "10px", ...shimmerStyle }} />
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ height: "14px", width: "75%", ...shimmerStyle }} />
        <div style={{ height: "20px", width: "40%", ...shimmerStyle }} />
        <div style={{ height: "11px", width: "55%", ...shimmerStyle }} />
        <div style={{ height: "1px", background: T.border, marginTop: "4px" }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ height: "11px", width: "45%", ...shimmerStyle }} />
          <div style={{ height: "11px", width: "25%", ...shimmerStyle }} />
        </div>
      </div>
    </div>
  );
}

// ── Listing Card ──────────────────────────────────────────────────────────────
function ListingCard({ listing, onSave, onClick }: {
  listing: Listing;
  onSave: (id: string) => void;
  onClick: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [saveHovered, setSaveHovered] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cc = catColor(listing.category);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={cardRef}
      onClick={() => onClick(listing.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMousePos(null); }}
      onMouseMove={handleMouseMove}
      style={{
        background: T.card,
        border: `1px solid ${hovered ? "rgba(34,197,94,0.35)" : T.border}`,
        borderRadius: "14px",
        overflow: "hidden",
        cursor: "pointer",
        position: "relative",
        boxShadow: hovered
          ? "inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 28px rgba(34,197,94,0.08), 0 2px 8px rgba(0,0,0,0.4)"
          : "inset 0 1px 0 rgba(255,255,255,0.04), 0 2px 8px rgba(0,0,0,0.25)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Spotlight border gradient */}
      {mousePos && (
        <div style={{
          position: "absolute",
          inset: 0,
          borderRadius: "14px",
          pointerEvents: "none",
          zIndex: 2,
          background: `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(34,197,94,0.07), transparent 55%)`,
        }} />
      )}
      {/* Image */}
      <div style={{
        height: "180px",
        background: "#181818",
        position: "relative",
        margin: "10px 10px 0",
        borderRadius: "10px",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        {listing.imageUrl && !imageFailed ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: hovered ? "scale(1.05)" : "scale(1)",
              transition: "transform 0.4s ease",
            }}
            onLoad={() => {
              if (DEBUG_IMAGES) console.debug("[image-debug] loaded", { listingId: listing.id, url: listing.imageUrl });
            }}
            onError={(e) => {
              setImageFailed(true);
              if (DEBUG_IMAGES) console.error("[image-debug] failed", { listingId: listing.id, url: listing.imageUrl, currentSrc: (e.currentTarget as HTMLImageElement).currentSrc });
            }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#555", fontSize: "13px", fontWeight: 600,
          }}>
            {DEBUG_IMAGES && listing.imageUrl
              ? <span style={{ fontSize: "10px", color: "#888", padding: "0 10px", wordBreak: "break-all" }}>{listing.imageUrl}</span>
              : "No image"}
          </div>
        )}

        {/* Gradient overlay at bottom of image */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: "60px",
          background: "linear-gradient(to top, rgba(26,26,26,0.85) 0%, transparent 100%)",
          pointerEvents: "none",
        }} />

        {/* Save button — fades in on hover */}
        <button
          onClick={e => { e.stopPropagation(); onSave(listing.id); }}
          onMouseEnter={() => setSaveHovered(true)}
          onMouseLeave={() => setSaveHovered(false)}
          style={{
            position: "absolute", top: "10px", right: "10px",
            background: listing.saved ? "rgba(34,197,94,0.2)" : "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            border: listing.saved ? "1px solid rgba(34,197,94,0.45)" : "1px solid rgba(255,255,255,0.12)",
            borderRadius: "8px",
            width: "34px", height: "34px",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            opacity: hovered || listing.saved ? 1 : 0,
            transform: saveHovered ? "scale(1.1)" : "scale(1)",
            transition: "opacity 0.2s, transform 0.15s, background 0.15s",
          }}
          title={listing.saved ? "Unsave" : "Save"}
        >
          <IconBookmark filled={listing.saved} size={15} />
        </button>

        {/* Sold badge */}
        {listing.status === "sold" && (
          <div style={{
            position: "absolute", top: "10px", left: "10px",
            background: "rgba(239,68,68,0.9)",
            color: "#fff", fontSize: "10px", fontWeight: 800,
            padding: "3px 8px", borderRadius: "6px",
            letterSpacing: "0.05em",
          }}>SOLD</div>
        )}
      </div>

      {/* Card Body */}
      <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
        <div style={{
          fontSize: "14px", fontWeight: 700, color: T.text,
          lineHeight: 1.35, letterSpacing: "-0.01em",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{listing.title}</div>

        <div style={{
          fontSize: "22px", fontWeight: 900, color: T.accent,
          fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em",
        }}>${listing.price.toLocaleString()}</div>

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <span style={{
            fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "5px",
            background: cc.bg, color: cc.color, border: `1px solid ${cc.border}`,
            letterSpacing: "0.01em",
          }}>{listing.category}</span>
        </div>

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: "auto", paddingTop: "10px",
          borderTop: `1px solid ${T.border}`,
          gap: "8px",
          flexWrap: "wrap",
        }}>
          <span style={{ fontSize: "12px", color: T.muted, display: "flex", alignItems: "center", gap: "4px" }}>
            <IconPin />
            {listing.location}{listing.distanceMiles != null ? ` · ${listing.distanceMiles.toFixed(1)} mi` : ""}
          </span>
          <span style={{ fontSize: "11px", color: "#a3a3a3" }}>{listing.postedAt}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [listingsError, setListingsError] = useState("");
  const [search,       setSearch]       = useState("");
  const [category,     setCategory]     = useState("All");
  const [minPrice,     setMinPrice]     = useState("");
  const [maxPrice,     setMaxPrice]     = useState("");
  const [sort,         setSort]         = useState("newest");
  const [page,         setPage]         = useState(1);
  const [radiusMiles,  setRadiusMiles]  = useState("25");
  const [geo,          setGeo]          = useState<{ lat: number; lng: number } | null>(null);

  function fetchListings(useSearch: boolean) {
    setLoadingListings(true);
    setListingsError("");
    const options = {
      keyword:      search.trim() || undefined,
      category:     category !== "All" ? category : undefined,
      min_price:    minPrice !== "" ? Number(minPrice) : undefined,
      max_price:    maxPrice !== "" ? Number(maxPrice) : undefined,
      sort:         sort as "newest" | "oldest" | "price-asc" | "price-desc" | "distance",
      user_lat:     geo?.lat,
      user_lng:     geo?.lng,
      radius_miles: geo ? Number(radiusMiles) : undefined,
    };
    const req = useSearch ? searchListings(options) : listListings(options);
    req
      .then((res) => setListings((res.items ?? []).map(toUiListing)))
      .catch(() => setListingsError("Unable to load marketplace listings."))
      .finally(() => setLoadingListings(false));
  }

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    fetchListings(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  useEffect(() => {
    if (!user) return;
    getSavedListings()
      .then((res) => {
        const savedIds = new Set((res.items ?? []).map((l) => l.id));
        setListings((prev) => prev.map((l) => ({ ...l, saved: savedIds.has(l.id) })));
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!DEBUG_IMAGES || listings.length === 0) return;
    const samples = listings.slice(0, 20).map((l) => ({
      id: l.id, title: l.title, imageUrl: l.imageUrl,
      hasImage: Boolean(l.imageUrl),
      isAbsoluteHttp: Boolean(l.imageUrl && /^https?:\/\//i.test(l.imageUrl)),
      isRelative: Boolean(l.imageUrl && l.imageUrl.startsWith("/")),
    }));
    console.debug("[image-debug] listings image URL sample", samples);
  }, [listings]);

  // ── For You ─────────────────────────────────────────────────────────────────
  const [forYou, setForYou] = useState<Listing[]>([]);

  useEffect(() => {
    getSavedListings()
      .then((res) => {
        const items = res.items ?? [];
        const freq: Record<string, number> = {};
        for (const l of items) freq[l.category] = (freq[l.category] ?? 0) + 1;
        const topCats = Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([cat]) => cat);
        return getForYouRecommendations(topCats, items.map((l) => l.id));
      })
      .catch(() => getForYouRecommendations([], []))
      .then((recs) => setForYou(recs.map(toUiListing)));
  }, [user]);

  // ── Client-side sort ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const result = [...listings];
    if (sort === "price-asc")  result.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") result.sort((a, b) => b.price - a.price);
    if (sort === "newest")     result.sort((a, b) => b.postedAt.localeCompare(a.postedAt));
    if (sort === "oldest")     result.sort((a, b) => a.postedAt.localeCompare(b.postedAt));
    if (sort === "distance")   result.sort((a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity));
    return result;
  }, [listings, sort]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = () => { setPage(1); fetchListings(true); };
  const resetFilters = () => {
    setSearch(""); setCategory("All");
    setMinPrice(""); setMaxPrice("");
    setSort("newest"); setRadiusMiles("25"); setPage(1);
    fetchListings(false);
  };

  const toggleSave = (id: string) => {
    if (!user) { window.location.href = "/login"; return; }
    setListings((prev) => prev.map((l) => l.id === id ? { ...l, saved: !l.saved } : l));
    toggleSaveListing(id).catch(() => {
      setListings((prev) => prev.map((l) => l.id === id ? { ...l, saved: !l.saved } : l));
    });
  };

  const handleCardClick = (id: string) => { window.location.href = `/listing/${id}`; };

  // ── Shared styles ─────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    background: T.input, color: T.text,
    border: `1px solid ${T.border}`, borderRadius: "10px",
    padding: "9px 14px", fontSize: "14px", outline: "none",
    fontFamily: "inherit",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none" as const,
  };

  const srOnly: React.CSSProperties = {
    position: "absolute", width: 1, height: 1, padding: 0,
    margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)",
    whiteSpace: "nowrap", border: 0,
  };

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.05) 0%, #0f0f0f 55%)", color: T.text, fontFamily: "'Outfit', Arial, sans-serif" }}>
      <Navbar exclude={["marketplace"]} />

      <main style={{ maxWidth: "1600px", margin: "0 auto", padding: isMobile ? "14px 10px 28px" : "24px 20px 48px" }}>

        {/* ── Search Bar ── */}
        <div style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: "14px", padding: "16px 18px",
          marginBottom: "16px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
        }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "stretch" }}>

            {/* Search input */}
            <label htmlFor="search-listings" style={srOnly}>Search listings</label>
            <AnimatedSearchBar
              id="search-listings"
              placeholder="Search listings..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
            />

            {/* Category */}
            <label htmlFor="category-filter" style={srOnly}>Category</label>
            <select
              id="category-filter"
              value={category}
              onChange={e => { setCategory(e.target.value); setPage(1); }}
              style={{ ...selectStyle, minWidth: isMobile ? "100%" : "150px", flex: isMobile ? "1 1 100%" : undefined }}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c === "All" ? "All categories" : c}</option>)}
            </select>

            {/* Min price */}
            <label htmlFor="min-price" style={srOnly}>Minimum price</label>
            <input
              id="min-price"
              placeholder="Min $"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value.replace(/\D/g, ""))}
              style={{ ...inputStyle, width: isMobile ? "calc(50% - 5px)" : "88px", minWidth: isMobile ? 0 : undefined }}
            />

            {/* Max price */}
            <label htmlFor="max-price" style={srOnly}>Maximum price</label>
            <input
              id="max-price"
              placeholder="Max $"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value.replace(/\D/g, ""))}
              style={{ ...inputStyle, width: isMobile ? "calc(50% - 5px)" : "88px", minWidth: isMobile ? 0 : undefined }}
            />

            {/* Near me */}
            <button
              onClick={() => {
                if (!navigator.geolocation) { setListingsError("Geolocation not supported."); return; }
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setSort("distance"); setPage(1);
                    setTimeout(() => fetchListings(true), 0);
                  },
                  () => setListingsError("Location access denied."),
                );
              }}
              style={{
                background: geo ? "rgba(34,197,94,0.15)" : "transparent",
                color: geo ? T.accent : T.muted,
                border: `1px solid ${geo ? "rgba(34,197,94,0.4)" : T.border}`,
                borderRadius: "10px", padding: "9px 13px",
                fontSize: "13px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "5px",
                fontFamily: "inherit", transition: "all 0.15s",
                width: isMobile ? "calc(50% - 5px)" : undefined,
                justifyContent: "center",
              }}
            >
              <IconPin size={13} />
              Near me
            </button>

            {geo && (
              <select
                value={radiusMiles}
                onChange={e => setRadiusMiles(e.target.value)}
                style={{ ...selectStyle, width: isMobile ? "calc(50% - 5px)" : "108px", minWidth: isMobile ? 0 : undefined }}
              >
                <option value="5">5 mi</option>
                <option value="10">10 mi</option>
                <option value="25">25 mi</option>
                <option value="50">50 mi</option>
              </select>
            )}

            {/* Search */}
            <button
              onClick={handleSearch}
              style={{
                background: T.accent, color: "#fff",
                border: "none", borderRadius: "10px",
                padding: "9px 22px", fontWeight: 700,
                fontSize: "14px", cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 0.15s, transform 0.1s",
                width: isMobile ? "calc(50% - 5px)" : undefined,
              }}
              onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
              onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              Search
            </button>

            {/* Reset */}
            <button
              onClick={resetFilters}
              style={{
                background: "transparent", color: T.muted,
                border: `1px solid ${T.border}`, borderRadius: "10px",
                padding: "9px 16px", fontSize: "14px",
                cursor: "pointer", fontFamily: "inherit",
                transition: "color 0.15s, border-color 0.15s",
                width: isMobile ? "calc(50% - 5px)" : undefined,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = "#666"; }}
              onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.border; }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* ── Category Pills ── */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
          {CATEGORIES.map(c => {
            const active = category === c;
            const cc = catColor(c);
            return (
              <button
                key={c}
                onClick={() => { setCategory(c); setPage(1); }}
                style={{
                  padding: "6px 16px", borderRadius: "99px", fontSize: "13px",
                  fontWeight: active ? 700 : 500, cursor: "pointer",
                  border: active ? `1.5px solid ${cc.border}` : "1px solid rgba(255,255,255,0.14)",
                  background: active ? cc.bg : "rgba(255,255,255,0.04)",
                  color: active ? cc.color : "#c0c0c0",
                  transition: "all 0.15s",
                  fontFamily: "inherit",
                }}
                onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
                onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* ── Error ── */}
        {listingsError && (
          <div style={{
            marginBottom: "12px", padding: "10px 14px", borderRadius: "10px",
            border: "1px solid rgba(239,68,68,0.35)",
            background: "rgba(239,68,68,0.08)",
            color: T.danger, fontSize: "13px", fontWeight: 600,
          }}>
            {listingsError}
          </div>
        )}

        {/* ── Results bar ── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: "16px", flexWrap: "wrap", gap: "10px",
        }}>
          <span style={{ fontSize: "13px", color: T.muted }}>
            {loadingListings
              ? "Loading…"
              : filtered.length === 0
              ? "No listings found"
              : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length} listing${filtered.length !== 1 ? "s" : ""}`}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label htmlFor="sort-listings" style={{ fontSize: "13px", color: T.muted }}>Sort:</label>
            <select
              id="sort-listings"
              value={sort}
              onChange={e => { setSort(e.target.value); setPage(1); }}
              style={{ ...selectStyle, fontSize: "13px", padding: "7px 12px" }}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* ── Main grid + sidebar ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : forYou.length > 0 ? "280px 1fr" : "1fr",
          gap: "16px",
          alignItems: "start",
        }}>

          {/* ── For You Sidebar ── */}
          {forYou.length > 0 && (
            <div style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: "14px", overflow: "hidden",
              boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
              position: isMobile ? "static" : "sticky", top: "80px",
            }}>
              <div style={{
                padding: "14px 16px 12px",
                borderBottom: `1px solid ${T.border}`,
                background: "rgba(34,197,94,0.04)",
              }}>
                <div style={{ fontSize: "13px", fontWeight: 800, color: T.text, letterSpacing: "-0.01em" }}>For you</div>
                <div style={{ fontSize: "11px", color: T.muted, marginTop: "2px" }}>Based on your saved listings</div>
              </div>

              {forYou.slice(0, 8).map((listing, i) => (
                <div
                  key={listing.id}
                  onClick={() => handleCardClick(listing.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: "11px",
                    padding: "11px 14px",
                    borderBottom: i < Math.min(forYou.length, 8) - 1 ? `1px solid ${T.border}` : "none",
                    cursor: "pointer", transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: "8px",
                    overflow: "hidden", background: "#222", flexShrink: 0,
                    border: `1px solid ${T.border}`,
                  }}>
                    {listing.imageUrl
                      ? <img src={listing.imageUrl} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", background: "#252525" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "3px" }}>{listing.title}</div>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: T.accent, fontVariantNumeric: "tabular-nums" }}>${listing.price.toLocaleString()}</div>
                    <div style={{ fontSize: "10px", color: T.muted, marginTop: "1px" }}>{listing.category}</div>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              ))}
            </div>
          )}

          {/* ── Listing Grid + Pagination ── */}
          <div>
            {loadingListings ? (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "16px", marginBottom: "28px",
              }}>
                {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : paginated.length > 0 ? (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "16px", marginBottom: "28px",
              }}>
                {paginated.map((listing, i) => (
                  <div
                    key={listing.id}
                    style={{
                      animation: "cardReveal 0.4s ease both",
                      animationDelay: `${i * 0.055}s`,
                    }}
                  >
                    <ListingCard
                      listing={listing}
                      onSave={toggleSave}
                      onClick={handleCardClick}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                background: T.card, border: `1px solid ${T.border}`,
                borderRadius: "14px", padding: "64px 20px",
                textAlign: "center", color: T.muted,
                boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
              }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                  <IconEmpty />
                </div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: T.text, marginBottom: "6px" }}>Nothing matched your filters</div>
                <div style={{ fontSize: "13px", color: T.muted, marginBottom: "20px" }}>Try different keywords, category, or price range.</div>
                <button
                  onClick={resetFilters}
                  style={{
                    background: T.accent, color: "#fff",
                    border: "none", borderRadius: "10px",
                    padding: "10px 24px", fontWeight: 700,
                    fontSize: "14px", cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "background 0.15s, transform 0.1s",
                  }}
                  onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
                  onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px" }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                    cursor: page === 1 ? "not-allowed" : "pointer",
                    background: page === 1 ? "#2a2a2a" : T.surface,
                    border: `1px solid ${T.border}`,
                    color: page === 1 ? "#555" : T.text,
                    fontFamily: "inherit",
                    transition: "transform 0.1s",
                  }}
                  onMouseDown={e => { if (page !== 1) e.currentTarget.style.transform = "scale(0.97)"; }}
                  onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                >← Prev</button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      width: "36px", height: "36px", borderRadius: "8px",
                      fontSize: "13px", fontWeight: p === page ? 700 : 500,
                      cursor: "pointer",
                      border: p === page ? `1.5px solid ${T.accent}` : `1px solid ${T.border}`,
                      background: p === page ? "rgba(34,197,94,0.1)" : T.surface,
                      color: p === page ? T.accent : T.muted,
                      fontFamily: "inherit",
                      transition: "transform 0.1s",
                    }}
                    onMouseDown={e => (e.currentTarget.style.transform = "scale(0.95)")}
                    onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
                    onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                  >{p}</button>
                ))}

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                    cursor: page === totalPages ? "not-allowed" : "pointer",
                    background: page === totalPages ? "#2a2a2a" : T.surface,
                    border: `1px solid ${T.border}`,
                    color: page === totalPages ? "#555" : T.text,
                    fontFamily: "inherit",
                    transition: "transform 0.1s",
                  }}
                  onMouseDown={e => { if (page !== totalPages) e.currentTarget.style.transform = "scale(0.97)"; }}
                  onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                >Next →</button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
