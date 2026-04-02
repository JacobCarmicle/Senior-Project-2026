import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { connectConversationRealtime, listMessages, listMyConversations, sendMessage } from "../../api/messaging";
import type { Conversation, Message } from "../../types/messaging";
import { Navbar } from "../../components/Navbar/Navbar.tsx";
import { useAuth } from "../../context/AuthContext";
import ReportModal from "../../components/ReportModal/ReportModal";

const T = {
  bg: "#2d2d2d",
  card: "#1a1a1a",
  text: "#e5e5e5",
  muted: "#9ca3af",
  border: "#404040",
  accent: "#22c55e",
};

function MessageRow({ message, isOwn, onReport }: {
  message: Message;
  isOwn: boolean;
  onReport: (id: string, preview: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ marginBottom: 4, background: "#2a2a2a", padding: 10, borderRadius: 10, border: `1px solid ${T.border}`, position: "relative" }}
    >
      <div style={{ fontSize: 11, color: T.muted }}>{new Date(message.sent_at).toLocaleString()}</div>
      <div style={{ marginTop: 4 }}>{message.text || "[image]"}</div>
      {!isOwn && hovered && (
        <button
          onClick={() => onReport(message.id, (message.text || "").slice(0, 60))}
          title="Report message"
          style={{
            position: "absolute", top: 8, right: 8,
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700,
            color: "#ef4444", cursor: "pointer",
          }}
        >
          Report
        </button>
      )}
    </div>
  );
}

export default function MessagingPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const preferred = params.get("conversation") || "";
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [reportTarget, setReportTarget] = useState<{ id: string; preview: string } | null>(null);

  useEffect(() => {
    listMyConversations().then((r) => {
      setConversations(r.items);
      const initial = preferred || r.items[0]?.id || "";
      setActiveId(initial);
    });
  }, [preferred]);

  useEffect(() => {
    if (!activeId) return;
    listMessages(activeId).then((r) => setMessages(r.items));
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;

    const ws = connectConversationRealtime(activeId, {
      onEvent: (event) => {
        if (event.type === "message.sent") {
          setMessages((prev) => {
            if (prev.some((m) => m.id === event.message.id)) return prev;
            return [...prev, event.message];
          });
        }

        if (event.type === "message.read") {
          setMessages((prev) =>
            prev.map((m) => (m.id === event.message.id ? event.message : m)),
          );
        }
      },
    });

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
      if (ws && ws.readyState === WebSocket.CONNECTING) ws.close();
    };
  }, [activeId]);

  async function handleSend() {
    if (!activeId || !draft.trim()) return;
    const msg = await sendMessage(activeId, draft.trim());
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
    setDraft("");
  }

  const active = useMemo(() => conversations.find((c) => c.id === activeId), [conversations, activeId]);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "Arial, sans-serif" }}>
      {reportTarget && (
        <ReportModal
          targetType="message"
          targetId={reportTarget.id}
          targetName={reportTarget.preview || "Message"}
          onClose={() => setReportTarget(null)}
        />
      )}
      <Navbar exclude={["inbox"]}/>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 20 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "300px 1fr",
            border: `1px solid ${T.border}`,
            background: T.card,
            borderRadius: 14,
            overflow: "hidden",
            minHeight: "78vh",
          }}
        >

          <aside style={{ borderRight: `1px solid ${T.border}`, padding: 12 }}>
            <h3 style={{ marginTop: 4 }}>Inbox</h3>
            {conversations.length === 0 && <p style={{ color: T.muted, fontSize: 13 }}>No conversations yet.</p>}
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  marginBottom: 8,
                  padding: 10,
                  borderRadius: 10,
                  border: c.id === activeId ? "1px solid #22c55e" : `1px solid ${T.border}`,
                  background: c.id === activeId ? "rgba(34,197,94,0.12)" : "#222",
                  color: T.text,
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                  {c.listing_title?.trim() || `Listing ${c.listing_id.slice(0, 8)}...`}
                </div>
                <div style={{ color: T.muted, fontSize: 12, marginTop: 3 }}>{c.status.toUpperCase()}</div>
              </button>
            ))}
          </aside>

          <section style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ padding: 12, borderBottom: `1px solid ${T.border}`, color: T.muted, fontSize: 13 }}>
              Conversation: {active?.id?.slice(0, 8) || "none"}
            </div>

            <div style={{ flex: 1, overflow: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {messages.length === 0 && <p style={{ color: T.muted }}>No messages yet.</p>}
              {messages.map((m) => (
                <MessageRow
                  key={m.id}
                  message={m}
                  isOwn={m.sender_id === user?.id}
                  onReport={(id, preview) => setReportTarget({ id, preview })}
                />
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, padding: 12, borderTop: `1px solid ${T.border}` }}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message..."
                style={{
                  flex: 1,
                  background: "#333",
                  border: `1px solid ${T.border}`,
                  color: T.text,
                  borderRadius: 10,
                  padding: 10,
                }}
              />
              <button onClick={handleSend} style={{ background: T.accent, color: "#fff", border: 0, borderRadius: 10, padding: "10px 14px", fontWeight: 700 }}>
                Send
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
