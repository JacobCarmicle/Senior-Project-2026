import client from "./client";
import type { Conversation, ConversationListResponse, Message, MessageListResponse } from "../types/messaging";

function buildConversationWsUrl(conversationId: string, token: string): string {
  const base = client.defaults.baseURL
    ? new URL(client.defaults.baseURL, window.location.origin)
    : new URL(window.location.origin);

  const protocol = base.protocol === "https:" ? "wss:" : "ws:";
  
  const wsUrl = new URL(base.toString());
  wsUrl.protocol = protocol;
  wsUrl.pathname = `/ws/conversations/${conversationId}`;
  wsUrl.searchParams.set("token", token);

  return wsUrl.toString();
}

export async function openConversationFromListing(listingId: string): Promise<Conversation> {
  const res = await client.post<Conversation>("/conversations", { listing_id: listingId });
  return res.data;
}

export async function listMyConversations(): Promise<ConversationListResponse> {
  const res = await client.get<ConversationListResponse>("/conversations");
  return res.data;
}

export async function listMessages(conversationId: string): Promise<MessageListResponse> {
  const res = await client.get<MessageListResponse>(`/conversations/${conversationId}/messages`);
  return res.data;
}

export async function sendMessage(conversationId: string, text: string): Promise<Message> {
  const res = await client.post<Message>(`/conversations/${conversationId}/messages`, { text });
  return res.data;
}

export async function markRead(conversationId: string, messageId: string): Promise<Message> {
  const res = await client.patch<Message>(`/conversations/${conversationId}/messages/${messageId}/read`);
  return res.data;
}

export type ConversationRealtimeEvent =
  | { type: "message.sent"; conversation_id: string; message: Message }
  | { type: "message.read"; conversation_id: string; message: Message }
  | { type: "conversation.updated"; conversation_id: string; conversation: Conversation };

export function connectConversationRealtime(
  conversationId: string,
  handlers: {
    onEvent: (event: ConversationRealtimeEvent) => void;
    onError?: () => void;
  },
): WebSocket | null {
  const token = localStorage.getItem("access_token");
  if (!token || !conversationId) return null;

  const ws = new WebSocket(buildConversationWsUrl(conversationId, token));

  ws.onmessage = (evt) => {
    try {
      const data = JSON.parse(evt.data) as ConversationRealtimeEvent;
      handlers.onEvent(data);
    } catch {
      // Ignore malformed payloads.
    }
  };

  ws.onerror = () => {
    handlers.onError?.();
  };

  return ws;
}
