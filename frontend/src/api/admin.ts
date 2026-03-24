import client from "./client";
import type { Listing } from "../types/listings";

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: "user" | "admin";
  status: "active" | "disabled";
  created_at: string;
}

export async function listUsers(): Promise<AdminUser[]> {
  const res = await client.get<AdminUser[]>("/admin/users");
  return res.data;
}

export async function patchUser(
  id: string,
  payload: { role?: string; status?: string },
): Promise<AdminUser> {
  const res = await client.patch<AdminUser>(`/admin/users/${id}`, payload);
  return res.data;
}

export async function listAllListings(): Promise<Listing[]> {
  const res = await client.get<Listing[]>("/admin/listings");
  return res.data;
}

export async function adminDeleteListing(id: string): Promise<void> {
  await client.delete(`/admin/listings/${id}`);
}

export async function adminRestoreListing(id: string): Promise<Listing> {
  const res = await client.patch<Listing>(`/admin/listings/${id}`, { status: "active" });
  return res.data;
}
