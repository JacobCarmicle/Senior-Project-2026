import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { connectConversationRealtime, listMessages, listMyConversations, sendMessage } from "../../api/messaging";
import { createMeetup, getMeetup, updateMeetupStatus, deleteMeetup, connectMeetupRealtime } from "../../api/meetups";
import { Navbar } from "../../components/Navbar/Navbar.tsx";
import { useAuth } from "../../context/AuthContext";
import type { Conversation, Message } from "../../types/messaging";
import type { Meetup } from "../../types/meetup";

const T = {
  bg: "#2d2d2d",
  card: "#1a1a1a",
  text: "#e5e5e5",
  muted: "#9ca3af",
  border: "#404040",
  accent: "#22c55e",
};

export default function MessagingPage() {
  const [params] = useSearchParams();
  const preferred = params.get("conversation") || "";
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [meetup, setMeetup] = useState<Meetup | null>(null);
  const [showMeetupModal, setShowMeetupModal] = useState(false);
  const [meetupDate, setMeetupDate] = useState(""); // YYYY-MM-DDTHH:MM
  const [meetupLocation, setMeetupLocation] = useState("");

  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();

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
          setMessages((prev) =>
            prev.some((m) => m.id === event.message.id) ? prev : [...prev, event.message]
          );
        }
        if (event.type === "message.read") {
          setMessages((prev) =>
            prev.map((m) => (m.id === event.message.id ? event.message : m))
          );
        }
      },
    });
    return () => {
      if (ws) ws.close();
    };
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!activeId) return;
    getMeetup(activeId).then(setMeetup);
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    const ws = connectMeetupRealtime(activeId, {
      onEvent: (event) => {
        if (event.type === "meetup.created" || event.type === "meetup.status_changed") {
          setMeetup(event.meetup);
        }
        if (event.type === "meetup.deleted") {
          setMeetup(null);
        }
      },
      onError: () => console.warn("Meetup WS error"),
    });
    return () => ws?.close();
  }, [activeId]);

  const active = useMemo(() => conversations.find((c) => c.id === activeId), [conversations, activeId]);
  const otherUserId = useMemo(() => {
    if (!active || !user) return null;
    return user.id === active.seller_id ? active.buyer_id : active.seller_id;
  }, [active, user]);
  const isSeller = user?.id === active?.seller_id;

  async function handleSend() {
    if (!activeId || !draft.trim()) return;
    const msg = await sendMessage(activeId, draft.trim());
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    setDraft("");
  }

  function handleViewOtherProfile() {
    if (otherUserId) navigate(`/user/${otherUserId}`);
  }

  function handleViewListing() {
    if (active) navigate(`/listing/${active.listing_id}`);
  }

  function handleReport() {
    alert("Report flow coming soon");
  }

  async function handleScheduleMeetup() {
    if (!active || !user) return;

    if (meetup) {
      if (meetup.proposer_id === user.id && meetup.status === "pending") {
        await deleteMeetup(meetup.id);
      } else if (meetup.receiver_id === user.id && meetup.status === "pending") {
        const action = window.prompt("Type 'accept' or 'decline'")?.toLowerCase();
        if (action === "accept" || action === "decline") {
          const status: "accepted" | "declined" = action === "accept" ? "accepted" : "declined";
          await updateMeetupStatus(meetup.id, status);
        }
      } else {
        alert(`Meetup status: ${meetup.status}`);
      }
      return;
    }

    setShowMeetupModal(true);
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "Arial, sans-serif" }}>
      <Navbar exclude={["inbox"]} />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 20 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "300px 1fr",
            border: `1px solid ${T.border}`,
            background: T.card,
            borderRadius: 14,
            overflow: "hidden",
            height: "78vh",
          }}
        >
          <aside style={{ borderRight: `1px solid ${T.border}`, padding: 12 }}>
            <h3 style={{ marginTop: 4 }}>Inbox</h3>
            {conversations.length === 0 && (
              <p style={{ color: T.muted, fontSize: 13 }}>No conversations yet.</p>
            )}
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

          <section style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 12,
                borderBottom: `1px solid ${T.border}`,
                color: T.muted,
                fontSize: 13,
              }}
            >
              <div>Conversation: {active?.listing_title?.trim() || "none"}</div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                padding: "10px 12px",
                flexWrap: "wrap",
                borderTop: `1px solid ${T.border}`,
                background: "#202020",
                alignItems: "center",
              }}
            >
              {otherUserId && (
                <button
                  onClick={handleViewOtherProfile}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    background: "#333",
                    color: T.text,
                    border: `1px solid ${T.border}`,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  {isSeller ? "View Buyer Profile" : "View Seller Profile"}
                </button>
              )}

              <button
                onClick={handleViewListing}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  background: "#333",
                  color: T.text,
                  border: `1px solid ${T.border}`,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                View Listing
              </button>

              <button
                onClick={handleReport}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  background: "rgba(239,68,68,0.08)",
                  color: "#ef4444",
                  border: "1px solid rgba(239,68,68,0.3)",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Report
              </button>

              {(!meetup || meetup.status === "cancelled") && (
                <button
                  onClick={handleScheduleMeetup}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: T.accent,
                    color: "#fff",
                    border: "none",
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  Propose Meetup
                </button>
              )}
            </div>

            {meetup && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  padding: "10px 12px",
                  flexWrap: "wrap",
                  borderTop: `1px solid ${T.border}`,
                  background: "#202020",
                  alignItems: "center",
                  fontSize: 13,
                  color: T.text,
                }}
              >
                <div>
                  <strong>Meetup:</strong> {new Date(meetup.scheduled_at).toLocaleString()}
                  {meetup.location && <> | <strong>Location:</strong> {meetup.location}</>}
                  <> | <strong>Status:</strong> {meetup.status.charAt(0).toUpperCase() + meetup.status.slice(1)}</>
                </div>

                {meetup.status !== "cancelled" && (
                  (user?.id === meetup.proposer_id || (user?.id === meetup.receiver_id && meetup.status === "accepted")) && (
                    <button
                      onClick={async () => {
                        if (window.confirm("Are you sure you want to cancel this meetup?")) {
                          await deleteMeetup(meetup.id);
                          setMeetup(null);
                        }
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        background: "#ef4444",
                        color: "#fff",
                        border: "none",
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  )
                )}

                {meetup.status === "pending" && user?.id === meetup.receiver_id && (
                  <>
                    <button
                      onClick={async () => await updateMeetupStatus(meetup.id, "accepted")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        background: "#22c55e",
                        color: "#fff",
                        border: "none",
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={async () => await updateMeetupStatus(meetup.id, "declined")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        background: "#f97316",
                        color: "#fff",
                        border: "none",
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      Decline
                    </button>
                  </>
                )}
              </div>
            )}

            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflow: "auto",
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {messages.length === 0 && <p style={{ color: T.muted }}>No messages yet.</p>}
              {messages.map((m) => {
                const isMe = m.sender_id === user?.id;
                return (
                  <div key={m.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                    <div
                      style={{
                        maxWidth: "70%",
                        background: isMe ? "#22c55e" : "#2a2a2a",
                        color: isMe ? "#fff" : T.text,
                        padding: 10,
                        borderRadius: 12,
                        border: isMe ? "none" : `1px solid ${T.border}`,
                      }}
                    >
                      <div style={{ fontSize: 15, display: "flex", gap: 10 }}>
                        <div>{isMe ? "You" : m.sender_username ?? "Unknown"}</div>
                        <div>{new Date(m.sent_at).toLocaleString()}</div>
                      </div>
                      <div style={{ marginTop: 4 }}>{m.text || "[image]"}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
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
              <button
                onClick={handleSend}
                style={{
                  background: T.accent,
                  color: "#fff",
                  border: 0,
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontWeight: 700,
                }}
              >
                Send
              </button>
            </div>
          </section>
        </div>
      </div>

      {showMeetupModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowMeetupModal(false)}
        >
          <div
            style={{
              background: T.card,
              padding: 20,
              borderRadius: 12,
              minWidth: 320,
              maxWidth: 400,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 12 }}>Schedule Meetup</h3>

            <label style={{ display: "block", marginBottom: 8 }}>Date & Time:</label>
            <input
              type="datetime-local"
              value={meetupDate}
              onChange={(e) => setMeetupDate(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 6,
                border: `1px solid ${T.border}`,
                marginBottom: 12,
              }}
            />

            <label style={{ display: "block", marginBottom: 8 }}>Location (optional):</label>
            <input
              type="text"
              value={meetupLocation}
              onChange={(e) => setMeetupLocation(e.target.value)}
              placeholder="Enter location"
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 6,
                border: `1px solid ${T.border}`,
                marginBottom: 12,
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={() => setShowMeetupModal(false)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  background: "#333",
                  color: T.text,
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!active || !user) return;
                  if (!meetupDate) return alert("Please select a date & time");
                  const receiverId = user.id === active.seller_id ? active.buyer_id : active.seller_id;
                  await createMeetup(active.id, receiverId, new Date(meetupDate).toISOString(), meetupLocation);
                  setShowMeetupModal(false);
                  setMeetupDate("");
                  setMeetupLocation("");
                }}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: T.accent,
                  color: "#fff",
                }}
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}