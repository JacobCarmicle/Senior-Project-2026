import { useState } from "react";
import { createReport, REPORT_REASONS, type ReportReason, type ReportTargetType } from "../../api/reports";

const T = {
  card:   "#1a1a1a",
  text:   "#e5e5e5",
  muted:  "#9ca3af",
  border: "#404040",
  surface:"#2d2d2d",
  danger: "#ef4444",
  accent: "#22c55e",
};

interface Props {
  targetType: ReportTargetType;
  targetId: string;
  targetName: string;
  listingId?: string;
  onClose: () => void;
}

export default function ReportModal({ targetType, targetId, targetName, listingId, onClose }: Props) {
  const [reason, setReason]   = useState<ReportReason>(REPORT_REASONS[0]);
  const [desc, setDesc]       = useState("");
  const [working, setWorking] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit() {
    setWorking(true);
    setError("");
    try {
      await createReport({
        target_type: targetType,
        target_id:   targetId,
        listing_id:  listingId,
        reason,
        description: desc,
      });
      setDone(true);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? "Failed to submit report. Please try again.");
    } finally {
      setWorking(false);
    }
  }

  const typeLabel = targetType === "listing" ? "Listing" : targetType === "user" ? "User" : "Message";

  return (
    <div
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"28px 32px", maxWidth:420, width:"90%", boxShadow:"0 10px 40px rgba(0,0,0,0.5)" }}>

        {done ? (
          <div style={{ textAlign:"center", padding:"12px 0" }}>
            <div style={{ fontSize: "2.250rem", marginBottom:12 }}>✅</div>
            <div style={{ fontSize: "0.938rem", fontWeight:700, color: T.text, marginBottom:6 }}>Report submitted</div>
            <div style={{ fontSize: "0.813rem", color: T.muted, marginBottom:20 }}>
              Thanks for helping keep TradeForge safe. Reports are reviewed within 2–3 days.
            </div>
            <button
              onClick={onClose}
              style={{ padding:"8px 22px", borderRadius:8, border:`1px solid ${T.border}`, background: T.surface, color: T.text, cursor:"pointer", fontSize: "0.813rem" }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: "0.938rem", fontWeight:700, color: T.text, marginBottom:4 }}>
              Report {typeLabel}
            </div>
            <div style={{ fontSize: "0.813rem", color: T.muted, marginBottom:18 }}>
              Reporting: <span style={{ color: T.text, fontWeight:600 }}>{targetName}</span>
            </div>

            <label style={{ fontSize: "0.750rem", fontWeight:700, color: T.muted, display:"block", marginBottom:6 }}>REASON</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value as ReportReason)}
              style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:`1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: "0.813rem", marginBottom:14, outline:"none" }}
            >
              {REPORT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <label style={{ fontSize: "0.750rem", fontWeight:700, color: T.muted, display:"block", marginBottom:6 }}>ADDITIONAL DETAILS (optional)</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Describe the issue..."
              rows={3}
              style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:`1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: "0.813rem", resize:"vertical", outline:"none", boxSizing:"border-box" }}
            />

            {error && (
              <div style={{ marginTop:12, padding:"8px 12px", borderRadius:8, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color: T.danger, fontSize: "0.813rem" }}>
                {error}
              </div>
            )}

            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:18 }}>
              <button
                onClick={onClose}
                style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${T.border}`, background: T.surface, color: T.text, cursor:"pointer", fontSize: "0.813rem" }}
              >
                Cancel
              </button>
              <button
                disabled={working}
                onClick={handleSubmit}
                style={{ padding:"8px 18px", borderRadius:8, border:"1px solid rgba(239,68,68,0.4)", background:"rgba(239,68,68,0.15)", color: T.danger, cursor: working ? "not-allowed" : "pointer", fontSize: "0.813rem", fontWeight:700, opacity: working ? 0.6 : 1 }}
              >
                {working ? "Submitting…" : "Submit Report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
