import { useState, useMemo, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

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
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_LISTINGS: Listing[] = [
  { id:"l1",  title:"iPhone 13 – Blue (128GB)",      price:550,   category:"Electronics", location:"Louisville, KY",   postedAt:"2026-03-04", saved:false, status:"active", sellerName:"Alex L.",   sellerRating:4.6 },
  { id:"l2",  title:"2019 Honda Civic LX",            price:14500, category:"Automotive",  location:"Bowling Green, KY", postedAt:"2026-03-03", saved:false, status:"active", sellerName:"Mark T.",   sellerRating:4.8 },
  { id:"l3",  title:"IKEA MALM Dresser – White",      price:80,    category:"Furniture",   location:"Nashville, TN",    postedAt:"2026-03-03", saved:false, status:"active", sellerName:"Sara M.",   sellerRating:4.2 },
  { id:"l4",  title:"Trek Mountain Bike 29\"",        price:480,   category:"Sports",      location:"Bowling Green, KY", postedAt:"2026-03-02", saved:false, status:"active", sellerName:"Ravi P.",   sellerRating:5.0 },
  { id:"l5",  title:"MacBook Pro M3 14\" 512GB",      price:1800,  category:"Electronics", location:"Franklin, TN",     postedAt:"2026-03-02", saved:true,  status:"active", sellerName:"Lisa C.",   sellerRating:4.9 },
  { id:"l6",  title:"Vintage Leather Sofa",           price:320,   category:"Furniture",   location:"Louisville, KY",   postedAt:"2026-03-01", saved:false, status:"active", sellerName:"Dana R.",   sellerRating:3.8 },
  { id:"l7",  title:"Nike Air Jordan 1 Retro – Sz10", price:210,   category:"Clothing",    location:"Bowling Green, KY", postedAt:"2026-03-01", saved:false, status:"active", sellerName:"Jay W.",    sellerRating:4.5 },
  { id:"l8",  title:"PS5 Console + 2 Controllers",   price:450,   category:"Electronics", location:"Owensboro, KY",    postedAt:"2026-02-28", saved:false, status:"active", sellerName:"Chris K.",  sellerRating:4.7 },
  { id:"l9",  title:"2017 Subaru Outback AWD",        price:18000, category:"Automotive",  location:"Nashville, TN",    postedAt:"2026-02-28", saved:false, status:"active", sellerName:"Tom B.",    sellerRating:4.3 },
  { id:"l10", title:"Dining Table + 4 Chairs",        price:250,   category:"Furniture",   location:"Bowling Green, KY", postedAt:"2026-02-27", saved:false, status:"active", sellerName:"Nina S.",   sellerRating:4.1 },
  { id:"l11", title:"Canon EOS R50 Camera Kit",       price:680,   category:"Electronics", location:"Louisville, KY",   postedAt:"2026-02-27", saved:false, status:"active", sellerName:"Priya N.",  sellerRating:4.8 },
  { id:"l12", title:"North Face Jacket – Sz M",       price:95,    category:"Clothing",    location:"Franklin, TN",     postedAt:"2026-02-26", saved:false, status:"active", sellerName:"Ethan J.",  sellerRating:4.4 },
  { id:"l13", title:"Bowflex SelectTech Dumbbells",   price:300,   category:"Sports",      location:"Louisville, KY",   postedAt:"2026-02-26", saved:false, status:"active", sellerName:"Cole M.",   sellerRating:4.6 },
  { id:"l14", title:"2020 Toyota Camry SE",           price:22500, category:"Automotive",  location:"Bowling Green, KY", postedAt:"2026-02-25", saved:false, status:"active", sellerName:"Fiona R.",  sellerRating:4.9 },
  { id:"l15", title:"iPad Pro 11\" M2 + Apple Pencil",price:750,   category:"Electronics", location:"Owensboro, KY",    postedAt:"2026-02-25", saved:false, status:"active", sellerName:"Sam H.",    sellerRating:4.7 },
  { id:"l16", title:"Levi's 501 Jeans – Sz 32x32",   price:45,    category:"Clothing",    location:"Nashville, TN",    postedAt:"2026-02-24", saved:false, status:"active", sellerName:"Mia L.",    sellerRating:4.0 },
];

const CATEGORIES = ["All", "Electronics", "Automotive", "Furniture", "Clothing", "Sports"];
const SORT_OPTIONS = [
  { value:"newest",    label:"Newest First" },
  { value:"oldest",    label:"Oldest First" },
  { value:"price-asc", label:"Price: Low to High" },
  { value:"price-desc",label:"Price: High to Low" },
];
const PAGE_SIZE = 8;

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

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get initials from full_name
  const initials = user?.full_name
    ? user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <header style={{
      background: T.card, borderBottom: `1px solid ${T.border}`,
      padding: "12px 20px", display: "flex", alignItems: "center",
      justifyContent: "space-between", gap: "12px",
      position: "sticky", top: 0, zIndex: 10,
    }}>
      {/* Brand */}
      <a href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", fontWeight: 800, color: T.accent, fontSize: "1.2rem" }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: T.accent, display: "inline-block" }}></span>
        TradeForge
      </a>

      {/* Nav Links + Auth */}
      <nav style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        {[
          { label: "Marketplace", href: "/" },
          { label: "Inbox",       href: "/messages" },
          { label: "Saved",       href: "/saved" },
        ].map(link => (
          <a key={link.href} href={link.href} style={{
            textDecoration: "none", color: T.text,
            background: "#404040", padding: "8px 12px",
            borderRadius: "10px", border: `1px solid ${T.border}`,
            fontSize: "0.95rem",
          }}>{link.label}</a>
        ))}

        <a href="/create-listing" style={{
          textDecoration: "none", color: "#fff",
          background: T.accent, padding: "8px 12px",
          borderRadius: "10px", border: `1px solid ${T.accent}`,
          fontSize: "0.95rem", fontWeight: 700,
        }}>+ Create Listing</a>

        {/* ── Logged Out: Login Button ── */}
        {!user && (
          <a href="/login" style={{
            textDecoration: "none", color: T.text,
            background: "#404040", padding: "8px 12px",
            borderRadius: "10px", border: `1px solid ${T.border}`,
            fontSize: "0.95rem", fontWeight: 600,
          }}>Login</a>
        )}

        {/* ── Logged In: Avatar + Dropdown ── */}
        {user && (
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              style={{
                width: "38px", height: "38px", borderRadius: "10px",
                background: "rgba(34,197,94,0.15)",
                border: `1px solid rgba(34,197,94,0.35)`,
                color: T.accent, fontWeight: 900, fontSize: "14px",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
              title={user.full_name}
            >{initials}</button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div style={{
                position: "absolute", top: "46px", right: 0,
                background: T.card, border: `1px solid ${T.border}`,
                borderRadius: "12px", minWidth: "200px",
                boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
                overflow: "hidden", zIndex: 100,
              }}>
                {/* User Info */}
                <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontWeight: 700, color: T.text, fontSize: "14px" }}>{user.full_name}</div>
                  <div style={{ fontSize: "12px", color: T.muted, marginTop: "2px" }}>{user.email}</div>
                  {user.role === "admin" && (
                    <span style={{
                      marginTop: "6px", display: "inline-block",
                      fontSize: "11px", background: "rgba(168,85,247,0.15)",
                      color: "#c084fc", border: "1px solid rgba(168,85,247,0.3)",
                      padding: "2px 8px", borderRadius: "6px", fontWeight: 700,
                    }}>Admin</span>
                  )}
                </div>

                {/* Menu Items */}
                {[
                  { label: "My Listings",  href: "/my-listings" },
                  { label: "Saved",        href: "/saved" },
                  { label: "Inbox",        href: "/messages" },
                  ...(user.role === "admin" ? [{ label: "Admin Dashboard", href: "/admin" }] : []),
                ].map(item => (
                  <a key={item.href} href={item.href} style={{
                    display: "block", padding: "11px 16px",
                    textDecoration: "none", color: T.text, fontSize: "14px",
                    borderBottom: `1px solid #2a2a2a`,
                    transition: "background 0.15s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#252525")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >{item.label}</a>
                ))}

                {/* Logout */}
                <button onClick={() => { logout(); setDropdownOpen(false); }} style={{
                  width: "100%", padding: "11px 16px", textAlign: "left",
                  background: "transparent", border: "none",
                  color: T.danger, fontSize: "14px", fontWeight: 600,
                  cursor: "pointer",
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >Logout</button>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}


function ListingCard({ listing, onSave, onClick }: {
  listing: Listing;
  onSave: (id: string) => void;
  onClick: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
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
      }}>
        No Image
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
  const [listings,  setListings]  = useState<Listing[]>(MOCK_LISTINGS);
  const [search,    setSearch]    = useState("");
  const [category,  setCategory]  = useState("All");
  const [minPrice,  setMinPrice]  = useState("");
  const [maxPrice,  setMaxPrice]  = useState("");
  const [sort,      setSort]      = useState("newest");
  const [page,      setPage]      = useState(1);

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
    // Will navigate to listing detail page once built
    alert(`Navigate to listing ${id} — detail page coming soon!`);
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

      <Navbar />

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

        {/* ── Results Bar ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px", flexWrap:"wrap", gap:"10px" }}>
          <span style={{ fontSize:"14px", color: T.muted }}>
            {filtered.length === 0
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
        {paginated.length > 0 ? (
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