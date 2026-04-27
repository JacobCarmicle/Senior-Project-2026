import client from "./client";
import type { Meetup } from "../types/meetup";

function buildMeetupWsUrl(conversationId: string, token: string): string {
  const base = client.defaults.baseURL
    ? new URL(client.defaults.baseURL, window.location.origin)
    : new URL(window.location.origin);

  const protocol = base.protocol === "https:" ? "wss:" : "ws:";
  
  const wsUrl = new URL(base.toString());
  wsUrl.protocol = protocol;
  wsUrl.pathname = `/ws/meetups/${conversationId}`;
  wsUrl.searchParams.set("token", token);

  return wsUrl.toString();
}

export async function createMeetup(
  conversationId: string,
  receiverId: string,
  scheduledAt: string,
  location?: string
): Promise<Meetup> {
  const res = await client.post<Meetup>("/meetups", { 
    conversation_id: conversationId, 
    receiver_id: receiverId,
    scheduled_at: scheduledAt,
    location,
  });
  return res.data;
}

export async function getMeetup(conversationId: string): Promise<Meetup | null> {
  const res = await client.get<Meetup | null>(`/meetups/${conversationId}`);
  return res.data;
}

export async function updateMeetupStatus(meetupId: string, status: "pending" | "accepted" | "declined" | "cancelled"): Promise<Meetup> {
  const res = await client.patch<Meetup>(`/meetups/${meetupId}/status`, { status });
  return res.data;
}

export async function deleteMeetup(meetupId: string): Promise<Meetup> {
  const res = await client.delete<Meetup>(`/meetups/${meetupId}`);
  return res.data;
}

export type MeetupRealtimeEvent =
  | { type: "meetup.created"; conversation_id: string; meetup: Meetup }
  | { type: "meetup.status_changed"; conversation_id: string; meetup: Meetup }
  | { type: "meetup.deleted"; conversation_id: string; meetup: Meetup };

export function connectMeetupRealtime(
  conversationId: string,
  handlers: {
    onEvent: (event: MeetupRealtimeEvent) => void;
    onError?: () => void;
  },
): WebSocket | null {
  const token = localStorage.getItem("access_token");
  if (!token || !conversationId) return null;

  const ws = new WebSocket(buildMeetupWsUrl(conversationId, token));

  ws.onmessage = (evt) => {
    try {
      const data = JSON.parse(evt.data) as MeetupRealtimeEvent;
      handlers.onEvent(data);
    } catch {
      // Ignore malformed WebSocket payloads
    }
  };

  ws.onerror = () => {
    handlers.onError?.();
  };

  return ws;
}