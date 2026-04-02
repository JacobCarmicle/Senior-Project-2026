import client from "./client";

export const REPORT_REASONS = [
  "Inappropriate content",
  "Misrepresentation",
  "Spam",
  "Prohibited item",
  "Suspected scam",
  "Other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];
export type ReportTargetType = "listing" | "user" | "message";

export interface Report {
  id: string;
  reporter_id: string;
  reporter_name: string;
  target_type: ReportTargetType;
  target_id: string;
  target_name: string;
  listing_id: string | null;
  listing_title: string;
  reason: string;
  description: string;
  status: "pending" | "reviewed" | "dismissed";
  created_at: string;
}

export async function createReport(payload: {
  target_type: ReportTargetType;
  target_id: string;
  listing_id?: string;
  reason: ReportReason;
  description?: string;
}): Promise<Report> {
  const res = await client.post<Report>("/reports", payload);
  return res.data;
}

export async function listAdminReports(): Promise<Report[]> {
  const res = await client.get<Report[]>("/admin/reports");
  return res.data;
}

export async function patchReport(id: string, status: "reviewed" | "dismissed"): Promise<Report> {
  const res = await client.patch<Report>(`/admin/reports/${id}`, { status });
  return res.data;
}
