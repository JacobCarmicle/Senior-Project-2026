export interface Notification {
  id: string;
  user_id: string;
  type: "new_review" | "listing_removed" | "suggestion";
  title: string;
  body: string;
  link?: string | null;
  read_at?: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  items: Notification[];
  unread_count: number;
}
