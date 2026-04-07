export interface Conversation {
  id: string;
  listing_id: string;
  listing_title?: string | null;
  buyer_id: string;
  seller_id: string;
  status: "open" | "closed" | "blocked";
  blocked_by_user_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationListResponse {
  items: Conversation[];
  total: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_username: string,
  text?: string | null;
  image_url?: string | null;
  kind: "text" | "image" | "system";
  sent_at: string;
  read_at?: string | null;
}

export interface MessageListResponse {
  items: Message[];
  total: number;
}
