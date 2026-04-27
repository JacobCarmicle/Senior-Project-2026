import { useEffect, useState } from "react";
import { listUsers, patchUser, listAllListings, adminDeleteListing, adminRestoreListing, type AdminUser } from "../../api/admin";
import { listAdminReports, patchReport, type Report } from "../../api/reports";
import type { Listing } from "../../types/listings";
import { useFontScale } from "../../FontScale";
import FontSizeControl from "../../components/Navbar/Navbar";
import styles from "../../components/Navbar/Navbar.module.css";
import { useRef } from "react";

// ── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:       "#0f0f0f",
  card:     "#161616",
  text:     "#e8e8e8",
  muted:    "#8a8a8a",
  border:   "rgba(255,255,255,0.07)",
  accent:   "#22c55e",
  accent2:  "#16a34a",
  danger:   "#ef4444",
  surface:  "#1a1a1a",
  hover:    "#222",
  input:    "#111",
};

// ── Types ─────────────────────────────────────────────────────────────────────
type ReportStatus  = "pending" | "reviewed" | "dismissed";
type UserStatus    = "active"  | "disabled";
type TabId         = "overview" | "reports"  | "users" | "listings";

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ value }: { value: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    active:   { bg:"rgba(34,197,94,0.1)",  color:"#22c55e", border:"rgba(34,197,94,0.3)"  },
    disabled: { bg:"rgba(239,68,68,0.1)",  color:"#ef4444", border:"rgba(239,68,68,0.3)"  },
    sold:      { bg:"rgba(59,130,246,0.1)", color:"#60a5fa", border:"rgba(59,130,246,0.3)" },
    deleted:   { bg:"rgba(156,163,175,0.1)",color:"#9ca3af", border:"rgba(156,163,175,0.3)"},
    pending:   { bg:"rgba(234,179,8,0.1)",  color:"#eab308", border:"rgba(234,179,8,0.3)"  },
    reviewed:  { bg:"rgba(34,197,94,0.1)",  color:"#22c55e", border:"rgba(34,197,94,0.3)"  },
    dismissed: { bg:"rgba(156,163,175,0.1)",color:"#9ca3af", border:"rgba(156,163,175,0.3)"},
    admin:     { bg:"rgba(168,85,247,0.1)", color:"#c084fc", border:"rgba(168,85,247,0.3)" },
    user:      { bg:"rgba(156,163,175,0.1)",color:"#9ca3af", border:"rgba(156,163,175,0.3)"},
    listing:   { bg:"rgba(249,115,22,0.1)", color:"#fb923c", border:"rgba(249,115,22,0.3)" },
    message:   { bg:"rgba(34,197,94,0.1)",  color:"#22c55e", border:"rgba(34,197,94,0.3)"  },
    review:    { bg:"rgba(239,68,68,0.1)",  color:"#ef4444", border:"rgba(239,68,68,0.3)"   },
  };
  const s = map[value] ?? map["user"];
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontSize: "0.688rem", fontWeight:600, padding:"3px 9px",
      borderRadius:"6px", textTransform:"capitalize", letterSpacing:"0.03em",
    }}>{value}</span>
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
      padding:"4px 10px", fontSize: "0.750rem", fontWeight:600,
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
        <div style={{ fontSize: "0.938rem", color: T.text, marginBottom:"22px", lineHeight:1.6 }}>{message}</div>
        <div style={{ display:"flex", gap:"10px", justifyContent:"flex-end" }}>
          <button onClick={onCancel} style={{ padding:"8px 16px", borderRadius:"8px", border:`1px solid ${T.border}`, background: T.surface, color: T.text, cursor:"pointer", fontSize: "0.813rem" }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding:"8px 18px", borderRadius:"8px", border:"1px solid rgba(239,68,68,0.4)", background:"rgba(239,68,68,0.15)", color:"#ef4444", cursor:"pointer", fontSize: "0.813rem", fontWeight:700 }}>Confirm</button>
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
        fontSize: "0.813rem", width:"280px", outline:"none",
        background: T.input, color: T.text,
      }} />
  );
}

// ── Table Shell ───────────────────────────────────────────────────────────────
function Table({ headers, children, empty }: { headers: string[]; children: React.ReactNode; empty: boolean }) {
  return (
    <div style={{ border:`1px solid ${T.border}`, borderRadius:"14px", overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.3)" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize: "0.813rem" }}>
        <thead>
          <tr style={{ background: T.card, borderBottom:`1px solid ${T.border}` }}>
            {headers.map(h => (
              <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontWeight:700, color: T.muted, fontSize: "0.688rem", textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty && <div style={{ padding:"40px", textAlign:"center", color: T.muted, fontSize: "0.875rem", background: T.card }}>No results found.</div>}
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
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:"16px" }}>

        {/* Placeholder for future reports-by-user panel */}
        <div style={{ background: T.card, border:`1px solid ${T.border}`, borderRadius:"14px", overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.3)" }}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, fontWeight:700, fontSize: "0.875rem", color: T.text }}>
            User Management
          </div>
          <div style={{ padding:"16px 18px", color: T.muted, fontSize: "0.813rem" }}>
            Go to the <strong style={{ color: T.text }}>Users</strong> tab to manage accounts, disable users, and assign admin roles.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Target type badge ─────────────────────────────────────────────────────────
function TargetTypeBadge({ type }: { type: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    listing: { bg:"rgba(59,130,246,0.1)",  color:"#60a5fa", border:"rgba(59,130,246,0.3)"  },
    user:    { bg:"rgba(168,85,247,0.1)",  color:"#c084fc", border:"rgba(168,85,247,0.3)"  },
    message: { bg:"rgba(234,179,8,0.1)",   color:"#eab308", border:"rgba(234,179,8,0.3)"   },
  };
  const s = map[type] ?? map["listing"];
  return (
    <span style={{ background: s.bg, color: s.color, border:`1px solid ${s.border}`, fontSize: "0.688rem", fontWeight:600, padding:"3px 9px", borderRadius:"6px", textTransform:"capitalize" }}>
      {type}
    </span>
  );
}

// ── Reports Tab ───────────────────────────────────────────────────────────────
function ReportsTab() {
  const [reports,    setReports]    = useState<Report[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "listing" | "user" | "message" | "review">("all");
  const [expanded,   setExpanded]   = useState<string | null>(null);

  useEffect(() => {
    listAdminReports()
      .then(setReports)
      .catch(e => setError(e?.response?.data?.detail ?? e?.message ?? "Failed to load reports"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = reports.filter(r =>
    (statusFilter === "all" || r.status === statusFilter) &&
    (typeFilter   === "all" || r.target_type === typeFilter)
  );

  const update = (id: string, s: "reviewed" | "dismissed") =>
    patchReport(id, s).then(updated =>
      setReports(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r))
    );

  if (loading) return <div style={{ color: T.muted, padding: 16 }}>Loading reports...</div>;
  if (error)   return <div style={{ color: "#ef4444", padding: 16 }}>Error: {error}</div>;

  return (
    <div>
      {/* Type filter pills */}
      <div style={{ display:"flex", gap:"8px", marginBottom:"12px", flexWrap:"wrap" }}>
        {(["all","listing","user","message","review"] as const).map(f => {
          const typeColors: Record<string, string> = { listing:"#60a5fa", user:"#c084fc", message:"#eab308", review:"#ef4444", all:"#22c55e" };
          const active = typeFilter === f;
          const col = typeColors[f];
          return (
            <button key={f} onClick={() => setTypeFilter(f)} style={{
              padding:"5px 13px", borderRadius:"8px", fontSize: "0.750rem", cursor:"pointer",
              border: active ? `1.5px solid ${col}` : `1px solid ${T.border}`,
              background: active ? `${col}1a` : T.surface,
              color: active ? col : T.muted,
              fontWeight: active ? 700 : 400,
            }}>
              {f === "all" ? "All Types" : f.charAt(0).toUpperCase() + f.slice(1) + "s"}
              {f !== "all" && (
                <span style={{ marginLeft:"5px", background:"#333", borderRadius:"99px", padding:"1px 5px", fontSize: "0.625rem", color: T.muted }}>
                  {reports.filter(r => r.target_type === f).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Status filter pills */}
      <div style={{ display:"flex", gap:"8px", marginBottom:"16px", flexWrap:"wrap" }}>
        {(["all","pending","reviewed","dismissed"] as const).map(f => (
          <button key={f} onClick={() => setStatusFilter(f)} style={{
            padding:"5px 13px", borderRadius:"8px", fontSize: "0.750rem", cursor:"pointer",
            border: statusFilter === f ? "1.5px solid #22c55e" : `1px solid ${T.border}`,
            background: statusFilter === f ? "rgba(34,197,94,0.12)" : T.surface,
            color: statusFilter === f ? "#22c55e" : T.muted,
            fontWeight: statusFilter === f ? 700 : 400,
          }}>
            {f === "all" ? "All Statuses" : f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== "all" && (
              <span style={{ marginLeft:"5px", background:"#333", borderRadius:"99px", padding:"1px 5px", fontSize: "0.625rem", color: T.muted }}>
                {reports.filter(r => r.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <Table headers={["Type","Target","Reporter","Reason","Date","Status","Actions"]} empty={filtered.length === 0}>
        {filtered.map((r, i) => (
          <>
            <TR key={r.id} i={i}>
              <TD><TargetTypeBadge type={r.target_type} /></TD>
              <TD>
                {r.target_type === "listing" ? (
                  <a
                    href={`/listing/${r.target_id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: T.text,
                      fontWeight: 600,
                      textDecoration: "none",
                      borderBottom: "1px solid #555",
                    }}
                  >
                    {r.target_name}
                  </a>
                ) : r.target_type === "user" ? (
                  <a
                    href={`/user/${r.target_id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: T.text,
                      fontWeight: 600,
                      textDecoration: "none",
                      borderBottom: "1px solid #555",
                    }}
                  >
                    {r.target_name}
                  </a>
                ) : r.target_type === "review" ? (
                  <a
                    href={`/user/${r.target_id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: T.text,
                      fontWeight: 600,
                      textDecoration: "none",
                      borderBottom: "1px solid #555",
                    }}
                  >
                    View Review
                  </a>
                ) : (
                  <span style={{ fontWeight: 600 }}>{r.target_name}</span>
                )}
              </TD>
              <TD muted>{r.reporter_name}</TD>
              <TD muted>{r.reason}</TD>
              <TD muted>{r.created_at.slice(0, 10)}</TD>
              <TD><Badge value={r.status} /></TD>
              <TD>
                <div style={{ display:"flex", gap:"6px" }}>
                  <Btn label={expanded === r.id ? "Hide" : "View"} color="muted" onClick={() => setExpanded(expanded === r.id ? null : r.id)} />
                  {r.status === "pending" && (
                    <>
                      <Btn label="Resolve" color="green" onClick={() => update(r.id, "reviewed")}  />
                      <Btn label="Dismiss" color="muted" onClick={() => update(r.id, "dismissed")} />
                    </>
                  )}
                </div>
              </TD>
            </TR>
            {expanded === r.id && (
              <tr key={`${r.id}-exp`} style={{ background:"rgba(34,197,94,0.05)", borderBottom:`1px solid ${T.border}` }}>
                <td colSpan={7} style={{ padding:"12px 20px", color: T.text, fontSize: "0.813rem" }}>
                  <span style={{ color: T.muted }}>Description: </span>{r.description || <em style={{ color: T.muted }}>No details provided.</em>}
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
  const [users,   setUsers]   = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [search,  setSearch]  = useState("");
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    listUsers()
      .then(setUsers)
      .catch((e) => setError(e?.response?.data?.detail ?? e?.message ?? "Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const ask = (msg: string, fn: () => void) =>
    setConfirm({ message: msg, onConfirm: () => { fn(); setConfirm(null); } });

  const applyStatus = (id: string, s: UserStatus) =>
    patchUser(id, { status: s }).then(updated =>
      setUsers(prev => prev.map(u => u.id === id ? updated : u))
    );

  const applyRole = (id: string, r: "user" | "admin") =>
    patchUser(id, { role: r }).then(updated =>
      setUsers(prev => prev.map(u => u.id === id ? updated : u))
    );

  if (loading) return <div style={{ color: T.muted, padding: 16 }}>Loading users...</div>;
  if (error)   return <div style={{ color: "#ef4444", padding: 16 }}>Error: {error}</div>;

  return (
    <div>
      {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
      <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email..." />

      <Table headers={["Name","Email","Role","Status","Joined","Actions"]} empty={filtered.length === 0}>
        {filtered.map((u, i) => (
          <TR key={u.id} i={i}>
            <td style={{ padding:"12px 14px", fontWeight:700, color: T.text }}>{u.full_name}</td>
            <TD muted>{u.email}</TD>
            <TD><Badge value={u.role} /></TD>
            <TD><Badge value={u.status} /></TD>
            <TD muted>{u.created_at.slice(0, 10)}</TD>
            <TD>
              <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
                {u.status === "active" && (
                  <Btn label="Disable" color="red" onClick={() => ask(`Disable ${u.full_name}? They won't be able to log in.`, () => applyStatus(u.id, "disabled"))} />
                )}
                {u.status === "disabled" && (
                  <Btn label="Enable" color="green" onClick={() => ask(`Re-enable ${u.full_name}?`, () => applyStatus(u.id, "active"))} />
                )}
                {u.role === "user"  && <Btn label="Make Admin" color="purple" onClick={() => ask(`Promote ${u.full_name} to Admin?`, () => applyRole(u.id, "admin"))} />}
                {u.role === "admin" && <Btn label="Demote"     color="muted"  onClick={() => ask(`Demote ${u.full_name} to User?`,   () => applyRole(u.id, "user"))}  />}
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
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [search,   setSearch]   = useState("");
  const [confirm,  setConfirm]  = useState<{ message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    listAllListings()
      .then(setListings)
      .catch((e) => setError(e?.response?.data?.detail ?? e?.message ?? "Failed to load listings"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = listings.filter(l =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    (l.seller_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const ask = (msg: string, fn: () => void) =>
    setConfirm({ message: msg, onConfirm: () => { fn(); setConfirm(null); } });

  const applyDelete = (id: string) =>
    adminDeleteListing(id).then(() =>
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: "deleted" } : l))
    );

  const applyRestore = (id: string) =>
    adminRestoreListing(id).then(updated =>
      setListings(prev => prev.map(l => l.id === id ? updated : l))
    );

  if (loading) return <div style={{ color: T.muted, padding: 16 }}>Loading listings...</div>;
  if (error)   return <div style={{ color: "#ef4444", padding: 16 }}>Error: {error}</div>;

  return (
    <div>
      {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
      <SearchInput value={search} onChange={setSearch} placeholder="Search by title or seller..." />

      <Table headers={["Title","Seller","Category","Price","Status","Created","Actions"]} empty={filtered.length === 0}>
        {filtered.map((l, i) => (
          <TR key={l.id} i={i}>
            <td style={{ padding:"12px 14px", fontWeight:700, color: T.text }}>{l.title}</td>
            <TD muted>{l.seller_name ?? l.seller_id}</TD>
            <TD muted>{l.category}</TD>
            <TD>${Number(l.price).toLocaleString()}</TD>
            <TD><Badge value={l.status} /></TD>
            <TD muted>{l.created_at.slice(0, 10)}</TD>
            <TD>
              <div style={{ display:"flex", gap:"5px" }}>
                <a href={`/listing/${l.id}`} style={{ padding:"4px 10px", fontSize: "0.750rem", fontWeight:600, borderRadius:"6px", border:"1px solid rgba(156,163,175,0.3)", background:"rgba(156,163,175,0.1)", color:"#9ca3af", textDecoration:"none" }}>View</a>
                {l.status !== "deleted" && <Btn label="Delete"  color="red"   onClick={() => ask(`Delete "${l.title}"?`,  () => applyDelete(l.id))}  />}
                {l.status === "deleted" && <Btn label="Restore" color="green" onClick={() => ask(`Restore "${l.title}"?`, () => applyRestore(l.id))} />}
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
  const [fontOpen, setFontOpen] = useState(false);
  const fontRef = useRef<HTMLDivElement>(null);

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id:"overview",  label:"Overview" },
    { id:"reports",   label:"Reports" },
    { id:"users",     label:"Users" },
    { id:"listings",  label:"Listings" },
  ];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (fontRef.current && !fontRef.current.contains(e.target as Node)) {
        setFontOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={{ minHeight:"100vh", background: "radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.05) 0%, #0f0f0f 55%)", color: T.text, fontFamily:"'Outfit', Arial, sans-serif" }}>

      {/* ── Header ── */}
      <header style={{
        background: T.card,
        borderBottom:`1px solid ${T.border}`,
        padding:"12px 20px",
        display:"flex",
        alignItems:"center",
        justifyContent:"space-between",
        position:"sticky",
        top:0,
        zIndex:10
      }}>

        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <a href="/" style={{
            fontSize: "1.125rem",
            fontWeight: 700,
            color: T.accent,
            textDecoration: "none"
          }}>
            TradeForge
          </a>

          <span style={{
            fontSize: "0.750rem",
            background:"rgba(168,85,247,0.15)",
            color:"#c084fc",
            border:"1px solid rgba(168,85,247,0.3)",
            padding:"2px 10px",
            borderRadius:"6px",
            fontWeight:700
          }}>
            Admin
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>

          <div ref={fontRef} className={styles.dropdownWrapper}>
            <button
              className={styles.avatarBtn}
              onClick={() => setFontOpen((o) => !o)}
              title="Font size"
            >
              Aa
            </button>

            {fontOpen && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownSection}>
                  <FontSizeControl />
                </div>
              </div>
            )}
          </div>

          <span style={{ fontSize: "0.813rem", color: T.muted }}>
            Moderation Dashboard
          </span>

        </div>
      </header>

      <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"28px 20px" }}>

        {/* Page Title */}
        <div style={{ marginBottom:"24px" }}>
          <h1 style={{ fontSize: "1.375rem", fontWeight:800, color: T.text, margin:0 }}>Admin Dashboard</h1>
          <p style={{ fontSize: "0.813rem", color: T.muted, marginTop:"5px" }}>Manage reports, users, and listings across TradeForge.</p>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:"6px", marginBottom:"24px", borderBottom:`1px solid ${T.border}`, paddingBottom:"0" }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding:"9px 18px", border:"none", fontSize: "0.813rem", cursor:"pointer",
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
                  borderRadius:"99px", padding:"0px 7px", fontSize: "0.688rem", fontWeight:700,
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
