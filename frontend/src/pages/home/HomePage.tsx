import { useState, useMemo, useEffect } from "react";
import { listListings } from "../../api/listings";
import type { Listing as ApiListing } from "../../types/listings";
import { Navbar } from "../../components/Navbar/Navbar.tsx";

// ── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:      "#2d2d2d",
  card:    "#1a1a1a",
  text:    "#e5e5e5",
  muted:   "#9ca3af",
  border:  "#404040",
  accent:  "#22c55e",
  accent2: "#16a34a",
  danger:  "#ef4444",
  surface: "#2d2d2d",
  hover:   "#505050",
  input:   "#333333",
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
}

const CATEGORIES = ["All", "Electronics", "Automotive", "Furniture", "Clothing", "Sports"];
const SORT_OPTIONS = [
  { value:"newest",    label:"Newest First" },
  { value:"oldest",    label:"Oldest First" },
  { value:"price-asc", label:"Price: Low to High" },
  { value:"price-desc",label:"Price: High to Low" },
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
  };
}


// ── Category pill color ───────────────────────────────────────────────────────
function catColor(cat: string): { bg: string; color: string; border: string } {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    Electronics: { bg:"rgba(59,130,246,0.1)",  color:"#60a5fa", border:"rgba(59,130,246,0.3)" },
    Automotive:  { bg:"rgba(249,115,22,0.1)",  color:"#fb923c", border:"rgba(249,115,22,0.3)" },
    Furniture:   { bg:"rgba(168,85,247,0.1)",  color:"#c084fc", border:"rgba(168,85,247,0.3)" },
    Clothing:    { bg:"rgba(236,72,153,0.1)",  color:"#f472b6", border:"rgba(236,72,153,0.3)" },
    Sports:      { bg:"rgba(234,179,8,0.1)",   color:"#eab308", border:"rgba(234,179,8,0.3)"  },
  };
  return map[cat] ?? { bg:"rgba(156,163,175,0.1)", color:"#9ca3af", border:"rgba(156,163,175,0.3)" };
}

function ListingCard({ listing, onSave, onClick }: {
  listing: Listing;
  onSave: (id: string) => void;
  onClick: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const cc = catColor(listing.category);

  return (
    <div
      onClick={() => onClick(listing.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: T.card,
        border: `1px solid ${hovered ? T.accent : T.border}`,
        borderRadius:"14px",
        overflow:"hidden",
        cursor:"pointer",
        boxShadow: hovered ? "0 4px 20px rgba(34,197,94,0.1)" : "0 2px 10px rgba(0,0,0,0.3)",
        transition:"border-color 0.2s, box-shadow 0.2s",
        display:"flex",
        flexDirection:"column",
      }}
    >
      {/* Image Placeholder */}
      <div style={{
        height:"170px",
        background:"#222",
        border:`1px solid ${T.border}`,
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        color:"#555",
        fontSize:"13px",
        fontWeight:600,
        position:"relative",
        margin:"10px 10px 0",
        borderRadius:"10px",
        flexShrink:0,
        overflow:"hidden",
      }}>
        {listing.imageUrl && !imageFailed ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onLoad={() => {
              if (DEBUG_IMAGES) {
                console.debug("[image-debug] loaded", {
                  listingId: listing.id,
                  title: listing.title,
                  url: listing.imageUrl,
                });
              }
            }}
            onError={(e) => {
              setImageFailed(true);
              if (DEBUG_IMAGES) {
                console.error("[image-debug] failed", {
                  listingId: listing.id,
                  title: listing.title,
                  url: listing.imageUrl,
                  currentSrc: (e.currentTarget as HTMLImageElement).currentSrc,
                });
              }
            }}
          />
        ) : (
          <div style={{ textAlign: "center", padding: "0 10px" }}>
            <div>No Image</div>
            {DEBUG_IMAGES && listing.imageUrl && (
              <div style={{ fontSize: "10px", color: "#888", marginTop: "6px", wordBreak: "break-all" }}>
                {listing.imageUrl}
              </div>
            )}
          </div>
        )}
        {/* Save Button */}
        <button
          onClick={e => { e.stopPropagation(); onSave(listing.id); }}
          style={{
            position:"absolute", top:"8px", right:"8px",
            background: listing.saved ? "rgba(34,197,94,0.2)" : "rgba(0,0,0,0.5)",
            border: listing.saved ? "1px solid rgba(34,197,94,0.5)" : "1px solid rgba(255,255,255,0.15)",
            borderRadius:"8px",
            width:"32px", height:"32px",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer",
            fontSize:"16px",
            transition:"all 0.2s",
          }}
          title={listing.saved ? "Unsave" : "Save"}
        >
          {listing.saved ? "🔖" : "🏷️"}
        </button>
        {/* Sold badge */}
        {listing.status === "sold" && (
          <div style={{
            position:"absolute", top:"8px", left:"8px",
            background:"rgba(239,68,68,0.85)",
            color:"#fff", fontSize:"11px", fontWeight:700,
            padding:"3px 8px", borderRadius:"6px",
          }}>SOLD</div>
        )}
      </div>

      {/* Card Body */}
      <div style={{ padding:"12px 14px", display:"flex", flexDirection:"column", gap:"6px", flex:1 }}>
        <div style={{ fontSize:"15px", fontWeight:800, color: T.text, lineHeight:1.3 }}>{listing.title}</div>
        <div style={{ fontSize:"20px", fontWeight:900, color: T.accent }}>${listing.price.toLocaleString()}</div>

        <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginTop:"2px" }}>
          <span style={{
            fontSize:"11px", fontWeight:600, padding:"2px 8px", borderRadius:"6px",
            background: cc.bg, color: cc.color, border:`1px solid ${cc.border}`,
          }}>{listing.category}</span>
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"auto", paddingTop:"8px", borderTop:`1px solid ${T.border}` }}>
          <span style={{ fontSize:"12px", color: T.muted }}>📍 {listing.location}</span>
          <span style={{ fontSize:"12px", color: T.muted }}>{listing.postedAt}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [listingsError, setListingsError] = useState("");
  const [search,    setSearch]    = useState("");
  const [category,  setCategory]  = useState("All");
  const [minPrice,  setMinPrice]  = useState("");
  const [maxPrice,  setMaxPrice]  = useState("");
  const [sort,      setSort]      = useState("newest");
  const [page,      setPage]      = useState(1);

  useEffect(() => {
    let cancelled = false;

    listListings()
      .then((res) => {
        if (cancelled) return;
        setListings((res.items ?? []).map(toUiListing));
      })
      .catch(() => {
        if (cancelled) return;
        setListingsError("Unable to load marketplace listings.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingListings(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!DEBUG_IMAGES || listings.length === 0) return;

    const samples = listings.slice(0, 20).map((l) => ({
      id: l.id,
      title: l.title,
      imageUrl: l.imageUrl,
      hasImage: Boolean(l.imageUrl),
      isAbsoluteHttp: Boolean(l.imageUrl && /^https?:\/\//i.test(l.imageUrl)),
      isRelative: Boolean(l.imageUrl && l.imageUrl.startsWith("/")),
    }));

    console.debug("[image-debug] listings image URL sample", samples);
  }, [listings]);

  // ── Filter + Sort ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...listings];

    if (search.trim())
      result = result.filter(l => l.title.toLowerCase().includes(search.toLowerCase()));

    if (category !== "All")
      result = result.filter(l => l.category === category);

    if (minPrice !== "")
      result = result.filter(l => l.price >= Number(minPrice));

    if (maxPrice !== "")
      result = result.filter(l => l.price <= Number(maxPrice));

    result.sort((a, b) => {
      if (sort === "newest")     return b.postedAt.localeCompare(a.postedAt);
      if (sort === "oldest")     return a.postedAt.localeCompare(b.postedAt);
      if (sort === "price-asc")  return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      return 0;
    });

    return result;
  }, [listings, search, category, minPrice, maxPrice, sort]);

  // ── Pagination ──────────────────────────────────────────────────────────────
  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = () => setPage(1);
  const resetFilters = () => {
    setSearch(""); setCategory("All");
    setMinPrice(""); setMaxPrice("");
    setSort("newest"); setPage(1);
  };

  const toggleSave = (id: string) =>
    setListings(prev => prev.map(l => l.id === id ? { ...l, saved: !l.saved } : l));

  const handleCardClick = (id: string) => {
    window.location.href = `/listing/${id}`;
  };

  // ── Shared input style ──────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    background: T.input, color: T.text,
    border: `1px solid ${T.border}`, borderRadius:"10px",
    padding:"9px 14px", fontSize:"14px", outline:"none",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor:"pointer",
    appearance:"none" as const,
  };

  return (
    <div style={{ minHeight:"100vh", background: T.bg, color: T.text, fontFamily:"Arial, sans-serif" }}>

      <Navbar exclude={["marketplace"]}/>

      <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"22px 20px 40px" }}>

        {/* ── Search Bar ── */}
        <div style={{
          background: T.card, border:`1px solid ${T.border}`,
          borderRadius:"14px", padding:"18px 20px",
          marginBottom:"18px",
          boxShadow:"0 2px 10px rgba(0,0,0,0.3)",
        }}>
          <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
            {/* Keyword */}
            <input
              placeholder="Search listings..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              style={{ ...inputStyle, flex:"1", minWidth:"200px" }}
            />
            {/* Category */}
            <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} style={{ ...selectStyle, minWidth:"150px" }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>)}
            </select>
            {/* Min Price */}
            <input
              placeholder="Min $"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value.replace(/\D/g, ""))}
              style={{ ...inputStyle, width:"90px" }}
            />
            {/* Max Price */}
            <input
              placeholder="Max $"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value.replace(/\D/g, ""))}
              style={{ ...inputStyle, width:"90px" }}
            />
            {/* Search Button */}
            <button onClick={handleSearch} style={{
              background: T.accent, color:"#fff",
              border:"none", borderRadius:"10px",
              padding:"9px 22px", fontWeight:700,
              fontSize:"14px", cursor:"pointer",
            }}>Search</button>
            {/* Reset */}
            <button onClick={resetFilters} style={{
              background:"transparent", color: T.muted,
              border:`1px solid ${T.border}`, borderRadius:"10px",
              padding:"9px 16px", fontSize:"14px", cursor:"pointer",
            }}>Reset</button>
          </div>
        </div>

        {/* ── Category Pills ── */}
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"16px" }}>
          {CATEGORIES.map(c => {
            const active = category === c;
            const cc = catColor(c);
            return (
              <button key={c} onClick={() => { setCategory(c); setPage(1); }} style={{
                padding:"6px 16px", borderRadius:"99px", fontSize:"13px",
                fontWeight: active ? 700 : 400, cursor:"pointer",
                border: active ? `1.5px solid ${cc.border}` : `1px solid ${T.border}`,
                background: active ? cc.bg : T.surface,
                color: active ? cc.color : T.muted,
                transition:"all 0.15s",
              }}>{c}</button>
            );
          })}
        </div>

        {listingsError && (
          <div style={{
            marginBottom: "12px",
            padding: "10px 12px",
            borderRadius: "10px",
            border: `1px solid rgba(239,68,68,0.4)`,
            background: "rgba(239,68,68,0.1)",
            color: T.danger,
            fontSize: "13px",
            fontWeight: 600,
          }}>
            {listingsError}
          </div>
        )}

        {/* ── Results Bar ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px", flexWrap:"wrap", gap:"10px" }}>
          <span style={{ fontSize:"14px", color: T.muted }}>
            {loadingListings
              ? "Loading listings..."
              : filtered.length === 0
              ? "No listings found"
              : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length} listing${filtered.length !== 1 ? "s" : ""}`}
          </span>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={{ fontSize:"13px", color: T.muted }}>Sort:</span>
            <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }} style={{ ...selectStyle, fontSize:"13px", padding:"7px 12px" }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* ── Listing Grid ── */}
        {loadingListings ? (
          <div style={{ background: T.card, border:`1px solid ${T.border}`, borderRadius:"14px", padding:"40px 20px", textAlign:"center", color: T.muted }}>Loading listings...</div>
        ) : paginated.length > 0 ? (
          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))",
            gap:"16px",
            marginBottom:"28px",
          }}>
            {paginated.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onSave={toggleSave}
                onClick={handleCardClick}
              />
            ))}
          </div>
        ) : (
          <div style={{
            background: T.card, border:`1px solid ${T.border}`,
            borderRadius:"14px", padding:"60px 20px",
            textAlign:"center", color: T.muted,
            boxShadow:"0 2px 10px rgba(0,0,0,0.3)",
          }}>
            <div style={{ fontSize:"40px", marginBottom:"12px" }}>🔍</div>
            <div style={{ fontSize:"16px", fontWeight:700, color: T.text, marginBottom:"6px" }}>No listings found</div>
            <div style={{ fontSize:"14px" }}>Try adjusting your filters or search terms.</div>
            <button onClick={resetFilters} style={{
              marginTop:"16px", background: T.accent, color:"#fff",
              border:"none", borderRadius:"10px", padding:"10px 22px",
              fontWeight:700, fontSize:"14px", cursor:"pointer",
            }}>Clear Filters</button>
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:"6px" }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding:"8px 16px", borderRadius:"8px", fontSize:"13px", fontWeight:600, cursor: page === 1 ? "not-allowed" : "pointer",
                background: T.surface, border:`1px solid ${T.border}`,
                color: page === 1 ? T.muted : T.text, opacity: page === 1 ? 0.5 : 1,
              }}>← Prev</button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} style={{
                width:"36px", height:"36px", borderRadius:"8px",
                fontSize:"13px", fontWeight: p === page ? 700 : 400,
                cursor:"pointer",
                border: p === page ? `1.5px solid ${T.accent}` : `1px solid ${T.border}`,
                background: p === page ? "rgba(34,197,94,0.12)" : T.surface,
                color: p === page ? T.accent : T.muted,
              }}>{p}</button>
            ))}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding:"8px 16px", borderRadius:"8px", fontSize:"13px", fontWeight:600, cursor: page === totalPages ? "not-allowed" : "pointer",
                background: T.surface, border:`1px solid ${T.border}`,
                color: page === totalPages ? T.muted : T.text, opacity: page === totalPages ? 0.5 : 1,
              }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}