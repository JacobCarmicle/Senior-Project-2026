import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listMessages, listMyConversations, sendMessage } from "../../api/messaging";
import type { Conversation, Message } from "../../types/messaging";

export default function MessagingPage() {
  const [params] = useSearchParams();
  const preferred = params.get("conversation") || "";
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");

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

  async function handleSend() {
    if (!activeId || !draft.trim()) return;
    const msg = await sendMessage(activeId, draft.trim());
    setMessages((m) => [...m, msg]);
    setDraft("");
  }

  const active = useMemo(() => conversations.find((c) => c.id === activeId), [conversations, activeId]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", height: "calc(100vh - 64px)", color: "#e5e5e5" }}>
      <div style={{ borderRight: "1px solid #404040", padding: 12 }}>
        <h3>Inbox</h3>
        {conversations.map((c) => (
          <button key={c.id} onClick={() => setActiveId(c.id)} style={{ width: "100%", textAlign: "left", marginBottom: 8, padding: 10, borderRadius: 8, border: c.id === activeId ? "1px solid #22c55e" : "1px solid #404040", background: "#1f1f1f", color: "#e5e5e5" }}>
            Listing {c.listing_id.slice(0, 8)}...
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 12, borderBottom: "1px solid #404040" }}>Conversation: {active?.id?.slice(0, 8) || "none"}</div>
        <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
          {messages.map((m) => (
            <div key={m.id} style={{ marginBottom: 8, background: "#2d2d2d", padding: 10, borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>{new Date(m.sent_at).toLocaleString()}</div>
              <div>{m.text || "[image]"}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #404040" }}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message..." style={{ flex: 1, background: "#333", border: "1px solid #404040", color: "#e5e5e5", borderRadius: 8, padding: 10 }} />
          <button onClick={handleSend} style={{ background: "#22c55e", color: "#fff", border: 0, borderRadius: 8, padding: "10px 14px" }}>Send</button>
        </div>
      </div>
    </div>
  );
}
