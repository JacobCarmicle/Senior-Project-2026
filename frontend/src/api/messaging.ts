import client from "./client";
import type { Conversation, ConversationListResponse, Message, MessageListResponse } from "../types/messaging";

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
