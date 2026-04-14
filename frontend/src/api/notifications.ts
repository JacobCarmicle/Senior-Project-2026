import client from "./client";
import type { Notification, NotificationListResponse } from "../types/notifications";

export async function listNotifications(): Promise<NotificationListResponse> {
  const res = await client.get<NotificationListResponse>("/notifications");
  return res.data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await client.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await client.post("/notifications/read-all");
}

export type { Notification };
