export type Meetup = {
  id: string;
  conversation_id: string;
  proposer_id: string;
  receiver_id: string;
  scheduled_at: string;
  location?: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  created_at: string;
};