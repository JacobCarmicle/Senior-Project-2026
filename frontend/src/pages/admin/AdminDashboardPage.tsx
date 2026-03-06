import { useState } from "react";

// ── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:       "#2d2d2d",
  card:     "#1a1a1a",
  text:     "#e5e5e5",
  muted:    "#9ca3af",
  border:   "#404040",
  accent:   "#22c55e",
  accent2:  "#16a34a",
  danger:   "#ef4444",
  surface:  "#2d2d2d",
  hover:    "#505050",
  input:    "#333333",
};

// ── Types ─────────────────────────────────────────────────────────────────────
type ReportStatus  = "pending" | "reviewed" | "dismissed";
type UserStatus    = "active"  | "suspended" | "banned";
type ListingStatus = "active"  | "sold"      | "deleted";
type TabId         = "overview" | "reports"  | "users" | "listings";

interface Report {
  id: string; type: "listing" | "user" | "message";
  reason: string; description: string;
  reporter: string; target: string;
  status: ReportStatus; createdAt: string;
}
interface ManagedUser {
  id: string; fullName: string; email: string;
  role: "user" | "admin"; status: UserStatus;
  listings: number; reports: number; joinedAt: string;
}
interface ManagedListing {
  id: string; title: string; seller: string;
  category: string; price: number;
  status: ListingStatus; reports: number; createdAt: string;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_REPORTS: Report[] = [
  { id:"r1", type:"listing", reason:"Inappropriate content", description:"Listing contains prohibited items per platform rules.", reporter:"alice@example.com", target:"Hunting Rifle Listing", status:"pending", createdAt:"2026-03-04" },
  { id:"r2", type:"user",    reason:"Harassment",            description:"User sent threatening messages repeatedly.", reporter:"bob@example.com", target:"john_doe", status:"pending", createdAt:"2026-03-04" },
  { id:"r3", type:"message", reason:"Spam",                  description:"User is flooding conversations with spam.", reporter:"carol@example.com", target:"Message #4821", status:"pending", createdAt:"2026-03-03" },
  { id:"r4", type:"listing", reason:"Misrepresentation",     description:"Item condition does not match description.", reporter:"dave@example.com", target:"iPhone 14 Pro", status:"reviewed", createdAt:"2026-03-02" },
  { id:"r5", type:"user",    reason:"No-show",               description:"Seller did not attend confirmed meetup.", reporter:"eve@example.com", target:"seller_mike", status:"dismissed", createdAt:"2026-03-01" },
];
const MOCK_USERS: ManagedUser[] = [
  { id:"u1", fullName:"John Doe",     email:"john@example.com",  role:"user",  status:"active",    listings:5,  reports:2, joinedAt:"2026-01-10" },
  { id:"u2", fullName:"Sarah Miller", email:"sarah@example.com", role:"admin", status:"active",    listings:0,  reports:0, joinedAt:"2026-01-01" },
  { id:"u3", fullName:"Mike Torres",  email:"mike@example.com",  role:"user",  status:"suspended", listings:3,  reports:5, joinedAt:"2026-02-14" },
  { id:"u4", fullName:"Lisa Chen",    email:"lisa@example.com",  role:"user",  status:"active",    listings:12, reports:0, joinedAt:"2026-01-22" },
  { id:"u5", fullName:"Ravi Patel",   email:"ravi@example.com",  role:"user",  status:"banned",    listings:1,  reports:8, joinedAt:"2026-02-05" },
];
const MOCK_LISTINGS: ManagedListing[] = [
  { id:"l1", title:"2019 Honda Civic",      seller:"john@example.com",  category:"Automotive",  price:14500, status:"active",  reports:0, createdAt:"2026-03-01" },
  { id:"l2", title:"iPhone 14 Pro 256GB",   seller:"lisa@example.com",  category:"Electronics", price:750,   status:"active",  reports:1, createdAt:"2026-03-02" },
  { id:"l3", title:"Vintage Leather Couch", seller:"mike@example.com",  category:"Furniture",   price:300,   status:"deleted", reports:3, createdAt:"2026-02-20" },
  { id:"l4", title:"Trek Mountain Bike",    seller:"ravi@example.com",  category:"Sports",      price:480,   status:"active",  reports:0, createdAt:"2026-03-03" },
  { id:"l5", title:"MacBook Pro M3",        seller:"lisa@example.com",  category:"Electronics", price:1800,  status:"sold",    reports:0, createdAt:"2026-02-28" },
];

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ value }: { value: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    active:    { bg:"rgba(34,197,94,0.1)",  color:"#22c55e", border:"rgba(34,197,94,0.3)"  },
    suspended: { bg:"rgba(234,179,8,0.1)",  color:"#eab308", border:"rgba(234,179,8,0.3)"  },
    banned:    { bg:"rgba(239,68,68,0.1)",  color:"#ef4444", border:"rgba(239,68,68,0.3)"  },
    sold:      { bg:"rgba(59,130,246,0.1)", color:"#60a5fa", border:"rgba(59,130,246,0.3)" },
    deleted:   { bg:"rgba(156,163,175,0.1)",color:"#9ca3af", border:"rgba(156,163,175,0.3)"},
    pending:   { bg:"rgba(234,179,8,0.1)",  color:"#eab308", border:"rgba(234,179,8,0.3)"  },
    reviewed:  { bg:"rgba(34,197,94,0.1)",  color:"#22c55e", border:"rgba(34,197,94,0.3)"  },
    dismissed: { bg:"rgba(156,163,175,0.1)",color:"#9ca3af", border:"rgba(156,163,175,0.3)"},
    admin:     { bg:"rgba(168,85,247,0.1)", color:"#c084fc", border:"rgba(168,85,247,0.3)" },
    user:      { bg:"rgba(156,163,175,0.1)",color:"#9ca3af", border:"rgba(156,163,175,0.3)"},
    listing:   { bg:"rgba(249,115,22,0.1)", color:"#fb923c", border:"rgba(249,115,22,0.3)" },
    message:   { bg:"rgba(34,197,94,0.1)",  color:"#22c55e", border:"rgba(34,197,94,0.3)"  },
  };
  const s = map[value] ?? map["user"];
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontSize:"11px", fontWeight:600, padding:"3px 9px",
      borderRadius:"6px", textTransform:"capitalize", letterSpacing:"0.03em",
    }}>{value}</span>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius:"14px", padding:"20px 22px",
      boxShadow:"0 2px 10px rgba(0,0,0,0.3)",
    }}>
      <div style={{ fontSize:"28px", fontWeight:900, color: accent }}>{value}</div>
      <div style={{ fontSize:"13px", color: T.muted, marginTop:"5px" }}>{label}</div>
    </div>
  );
}

// ── Action Buttons ────────────────────────────────────────────────────────────
function Btn({ label, color, onClick }: { label: string; color: "green"|"yellow"|"red"|"purple"|"muted"; onClick: () => void }) {
  const colors = {
    green:  { bg:"rgba(34,197,94,0.12)",  border:"rgba(34,197,94,0.35)",  text:"#22c55e" },
    yellow: { bg:"rgba(234,179,8,0.12)",  border:"rgba(234,179,8,0.35)",  text:"#eab308" },
    red:    { bg:"rgba(239,68,68,0.12)",  border:"rgba(239,68,68,0.35)",  text:"#ef4444" },
    purple: { bg:"rgba(168,85,247,0.12)", border:"rgba(168,85,247,0.35)", text:"#c084fc" },
    muted:  { bg:"rgba(156,163,175,0.1)", border:"rgba(156,163,175,0.3)", text:"#9ca3af" },
  };
  const c = colors[color];
  return (
    <button onClick={onClick} style={{
      padding:"4px 10px", fontSize:"12px", fontWeight:600,
      borderRadius:"6px", border:`1px solid ${c.border}`,
      background: c.bg, color: c.text, cursor:"pointer", whiteSpace:"nowrap",
    }}>{label}</button>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50 }}>
      <div style={{ background: T.card, border:`1px solid ${T.border}`, borderRadius:"14px", padding:"28px 32px", maxWidth:"380px", width:"90%", boxShadow:"0 10px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize:"15px", color: T.text, marginBottom:"22px", lineHeight:1.6 }}>{message}</div>
        <div style={{ display:"flex", gap:"10px", justifyContent:"flex-end" }}>
          <button onClick={onCancel} style={{ padding:"8px 16px", borderRadius:"8px", border:`1px solid ${T.border}`, background: T.surface, color: T.text, cursor:"pointer", fontSize:"13px" }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding:"8px 18px", borderRadius:"8px", border:"1px solid rgba(239,68,68,0.4)", background:"rgba(239,68,68,0.15)", color:"#ef4444", cursor:"pointer", fontSize:"13px", fontWeight:700 }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ── Search Input ──────────────────────────────────────────────────────────────
function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{
        marginBottom:"16px", padding:"9px 14px",
        border:`1px solid ${T.border}`, borderRadius:"10px",
        fontSize:"13px", width:"280px", outline:"none",
        background: T.input, color: T.text,
      }} />
  );
}

// ── Table Shell ───────────────────────────────────────────────────────────────
function Table({ headers, children, empty }: { headers: string[]; children: React.ReactNode; empty: boolean }) {
  return (
    <div style={{ border:`1px solid ${T.border}`, borderRadius:"14px", overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.3)" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"13px" }}>
        <thead>
          <tr style={{ background: T.card, borderBottom:`1px solid ${T.border}` }}>
            {headers.map(h => (
              <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontWeight:700, color: T.muted, fontSize:"11px", textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty && <div style={{ padding:"40px", textAlign:"center", color: T.muted, fontSize:"14px", background: T.card }}>No results found.</div>}
    </div>
  );
}

function TR({ children, i }: { children: React.ReactNode; i: number }) {
  return <tr style={{ borderBottom:`1px solid #333`, background: i % 2 === 0 ? T.card : "#1f1f1f" }}>{children}</tr>;
}

function TD({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return <td style={{ padding:"12px 14px", color: muted ? T.muted : T.text }}>{children}</td>;
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab() {
  const pendingReports  = MOCK_REPORTS.filter(r => r.status === "pending").length;
  const activeUsers     = MOCK_USERS.filter(u => u.status === "active").length;
  const activeListings  = MOCK_LISTINGS.filter(l => l.status === "active").length;
  const flaggedListings = MOCK_LISTINGS.filter(l => l.reports > 0).length;

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:"14px", marginBottom:"28px" }}>
        <StatCard label="Pending Reports"  value={pendingReports}       accent="#ef4444" />
        <StatCard label="Active Users"     value={activeUsers}          accent="#22c55e" />
        <StatCard label="Active Listings"  value={activeListings}       accent="#22c55e" />
        <StatCard label="Flagged Listings" value={flaggedListings}      accent="#eab308" />
        <StatCard label="Total Users"      value={MOCK_USERS.length}    accent="#c084fc" />
        <StatCard label="Total Reports"    value={MOCK_REPORTS.length}  accent="#9ca3af" />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
        {/* Pending Reports Panel */}
        <div style={{ background: T.card, border:`1px solid ${T.border}`, borderRadius:"14px", overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.3)" }}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, fontWeight:700, fontSize:"14px", color: T.text }}>
            Recent Pending Reports
          </div>
          {MOCK_REPORTS.filter(r => r.status === "pending").map(r => (
            <div key={r.id} style={{ padding:"13px 18px", borderBottom:`1px solid #333`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:"13px", fontWeight:600, color: T.text }}>{r.reason}</div>
                <div style={{ fontSize:"12px", color: T.muted, marginTop:"2px" }}>Target: {r.target}</div>
              </div>
              <Badge value={r.type} />
            </div>
          ))}
        </div>

        {/* Flagged Users Panel */}
        <div style={{ background: T.card, border:`1px solid ${T.border}`, borderRadius:"14px", overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.3)" }}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, fontWeight:700, fontSize:"14px", color: T.text }}>
            Users with Reports
          </div>
          {MOCK_USERS.filter(u => u.reports > 0).map(u => (
            <div key={u.id} style={{ padding:"13px 18px", borderBottom:`1px solid #333`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:"13px", fontWeight:600, color: T.text }}>{u.fullName}</div>
                <div style={{ fontSize:"12px", color: T.muted, marginTop:"2px" }}>{u.email}</div>
              </div>
              <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                <span style={{ fontSize:"12px", color: u.reports > 3 ? "#ef4444" : T.muted, fontWeight:700 }}>{u.reports} reports</span>
                <Badge value={u.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Reports Tab ───────────────────────────────────────────────────────────────
function ReportsTab() {
  const [reports,  setReports]  = useState<Report[]>(MOCK_REPORTS);
  const [filter,   setFilter]   = useState<ReportStatus | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = filter === "all" ? reports : reports.filter(r => r.status === filter);
  const update   = (id: string, status: ReportStatus) =>
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));

  return (
    <div>
      {/* Filter Pills */}
      <div style={{ display:"flex", gap:"8px", marginBottom:"16px" }}>
        {(["all","pending","reviewed","dismissed"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:"6px 14px", borderRadius:"8px", fontSize:"13px", cursor:"pointer",
            border: filter === f ? "1.5px solid #22c55e" : `1px solid ${T.border}`,
            background: filter === f ? "rgba(34,197,94,0.12)" : T.surface,
            color: filter === f ? "#22c55e" : T.muted,
            fontWeight: filter === f ? 700 : 400,
          }}>
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== "all" && (
              <span style={{ marginLeft:"6px", background:"#333", borderRadius:"99px", padding:"1px 6px", fontSize:"11px", color: T.muted }}>
                {reports.filter(r => r.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <Table headers={["Type","Reason","Target","Reporter","Date","Status","Actions"]} empty={filtered.length === 0}>
        {filtered.map((r, i) => (
          <>
            <TR key={r.id} i={i}>
              <TD><Badge value={r.type} /></TD>
              <TD>{r.reason}</TD>
              <TD muted>{r.target}</TD>
              <TD muted>{r.reporter}</TD>
              <TD muted>{r.createdAt}</TD>
              <TD><Badge value={r.status} /></TD>
              <TD>
                <div style={{ display:"flex", gap:"6px" }}>
                  <Btn label={expanded === r.id ? "Hide" : "View"} color="muted" onClick={() => setExpanded(expanded === r.id ? null : r.id)} />
                  {r.status === "pending" && (
                    <>
                      <Btn label="Resolve" color="green"  onClick={() => update(r.id, "reviewed")}  />
                      <Btn label="Dismiss" color="muted"  onClick={() => update(r.id, "dismissed")} />
                    </>
                  )}
                </div>
              </TD>
            </TR>
            {expanded === r.id && (
              <tr key={`${r.id}-exp`} style={{ background:"rgba(34,197,94,0.05)", borderBottom:`1px solid ${T.border}` }}>
                <td colSpan={7} style={{ padding:"12px 20px", color: T.text, fontSize:"13px" }}>
                  <span style={{ color: T.muted }}>Description: </span>{r.description}
                </td>
              </tr>
            )}
          </>
        ))}
      </Table>
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users,   setUsers]   = useState<ManagedUser[]>(MOCK_USERS);
  const [search,  setSearch]  = useState("");
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const filtered = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const ask       = (msg: string, fn: () => void) => setConfirm({ message: msg, onConfirm: () => { fn(); setConfirm(null); } });
  const setStatus = (id: string, s: UserStatus)         => setUsers(prev => prev.map(u => u.id === id ? { ...u, status: s } : u));
  const setRole   = (id: string, r: "user" | "admin")   => setUsers(prev => prev.map(u => u.id === id ? { ...u, role: r }   : u));

  return (
    <div>
      {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
      <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email..." />

      <Table headers={["Name","Email","Role","Status","Listings","Reports","Joined","Actions"]} empty={filtered.length === 0}>
        {filtered.map((u, i) => (
          <TR key={u.id} i={i}>
            <td style={{ padding:"12px 14px", fontWeight:700, color: T.text }}>{u.fullName}</td>
            <TD muted>{u.email}</TD>
            <TD><Badge value={u.role} /></TD>
            <TD><Badge value={u.status} /></TD>
            <TD muted>{u.listings}</TD>
            <td style={{ padding:"12px 14px", color: u.reports > 3 ? "#ef4444" : T.muted, fontWeight: u.reports > 3 ? 700 : 400 }}>{u.reports}</td>
            <TD muted>{u.joinedAt}</TD>
            <TD>
              <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
                {u.status === "active" && (
                  <>
                    <Btn label="Suspend"    color="yellow" onClick={() => ask(`Suspend ${u.fullName}?`, () => setStatus(u.id, "suspended"))} />
                    <Btn label="Ban"        color="red"    onClick={() => ask(`Ban ${u.fullName}? This is a severe action.`, () => setStatus(u.id, "banned"))} />
                  </>
                )}
                {(u.status === "suspended" || u.status === "banned") && (
                  <Btn label="Reinstate" color="green"  onClick={() => ask(`Reinstate ${u.fullName}?`, () => setStatus(u.id, "active"))} />
                )}
                {u.role === "user"  && <Btn label="Make Admin" color="purple" onClick={() => ask(`Promote ${u.fullName} to Admin?`,   () => setRole(u.id, "admin"))} />}
                {u.role === "admin" && <Btn label="Demote"     color="muted"  onClick={() => ask(`Demote ${u.fullName} to User?`,      () => setRole(u.id, "user"))}  />}
              </div>
            </TD>
          </TR>
        ))}
      </Table>
    </div>
  );
}

// ── Listings Tab ──────────────────────────────────────────────────────────────
function ListingsTab() {
  const [listings, setListings] = useState<ManagedListing[]>(MOCK_LISTINGS);
  const [search,   setSearch]   = useState("");
  const [confirm,  setConfirm]  = useState<{ message: string; onConfirm: () => void } | null>(null);

  const filtered = listings.filter(l =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.seller.toLowerCase().includes(search.toLowerCase())
  );
  const ask     = (msg: string, fn: () => void) => setConfirm({ message: msg, onConfirm: () => { fn(); setConfirm(null); } });
  const remove  = (id: string) => setListings(prev => prev.map(l => l.id === id ? { ...l, status: "deleted"  as ListingStatus } : l));
  const restore = (id: string) => setListings(prev => prev.map(l => l.id === id ? { ...l, status: "active"   as ListingStatus } : l));

  return (
    <div>
      {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
      <SearchInput value={search} onChange={setSearch} placeholder="Search by title or seller..." />

      <Table headers={["Title","Seller","Category","Price","Status","Reports","Created","Actions"]} empty={filtered.length === 0}>
        {filtered.map((l, i) => (
          <TR key={l.id} i={i}>
            <td style={{ padding:"12px 14px", fontWeight:700, color: T.text }}>{l.title}</td>
            <TD muted>{l.seller}</TD>
            <TD muted>{l.category}</TD>
            <TD>${l.price.toLocaleString()}</TD>
            <TD><Badge value={l.status} /></TD>
            <td style={{ padding:"12px 14px", color: l.reports > 1 ? "#ef4444" : T.muted, fontWeight: l.reports > 1 ? 700 : 400 }}>{l.reports}</td>
            <TD muted>{l.createdAt}</TD>
            <TD>
              <div style={{ display:"flex", gap:"5px" }}>
                {l.status !== "deleted" && <Btn label="Delete"  color="red"   onClick={() => ask(`Delete listing "${l.title}"?`,   () => remove(l.id))}  />}
                {l.status === "deleted" && <Btn label="Restore" color="green" onClick={() => ask(`Restore listing "${l.title}"?`,  () => restore(l.id))} />}
              </div>
            </TD>
          </TR>
        ))}
      </Table>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id:"overview",  label:"Overview" },
    { id:"reports",   label:"Reports",  count: MOCK_REPORTS.filter(r => r.status === "pending").length },
    { id:"users",     label:"Users",    count: MOCK_USERS.length },
    { id:"listings",  label:"Listings", count: MOCK_LISTINGS.length },
  ];

  return (
    <div style={{ minHeight:"100vh", background: T.bg, color: T.text, fontFamily:"Arial, sans-serif" }}>

      {/* ── Header ── */}
      <header style={{ background: T.card, borderBottom:`1px solid ${T.border}`, padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{ fontWeight:800, color: T.accent, fontSize:"1.2rem", letterSpacing:"0.2px" }}>
            <span style={{ width:10, height:10, borderRadius:"50%", background: T.accent, display:"inline-block", marginRight:8 }}></span>
            TradeForge
          </span>
          <span style={{ fontSize:"12px", background:"rgba(168,85,247,0.15)", color:"#c084fc", border:"1px solid rgba(168,85,247,0.3)", padding:"2px 10px", borderRadius:"6px", fontWeight:700 }}>
            Admin
          </span>
        </div>
        <span style={{ fontSize:"13px", color: T.muted }}>Moderation Dashboard</span>
      </header>

      <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"28px 20px" }}>

        {/* Page Title */}
        <div style={{ marginBottom:"24px" }}>
          <h1 style={{ fontSize:"22px", fontWeight:800, color: T.text, margin:0 }}>Admin Dashboard</h1>
          <p style={{ fontSize:"13px", color: T.muted, marginTop:"5px" }}>Manage reports, users, and listings across TradeForge.</p>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:"6px", marginBottom:"24px", borderBottom:`1px solid ${T.border}`, paddingBottom:"0" }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding:"9px 18px", border:"none", fontSize:"13px", cursor:"pointer",
              fontWeight: activeTab === tab.id ? 700 : 400,
              background:"transparent",
              color: activeTab === tab.id ? T.accent : T.muted,
              borderBottom: activeTab === tab.id ? `2px solid ${T.accent}` : "2px solid transparent",
              marginBottom:"-1px",
              display:"flex", alignItems:"center", gap:"7px",
              transition:"color 0.15s",
            }}>
              {tab.label}
              {tab.count !== undefined && (
                <span style={{
                  background: activeTab === tab.id ? "rgba(34,197,94,0.15)" : "#333",
                  border: activeTab === tab.id ? "1px solid rgba(34,197,94,0.3)" : `1px solid ${T.border}`,
                  color: activeTab === tab.id ? T.accent : T.muted,
                  borderRadius:"99px", padding:"0px 7px", fontSize:"11px", fontWeight:700,
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "overview"  && <OverviewTab />}
        {activeTab === "reports"   && <ReportsTab />}
        {activeTab === "users"     && <UsersTab />}
        {activeTab === "listings"  && <ListingsTab />}
      </div>
    </div>
  );
}