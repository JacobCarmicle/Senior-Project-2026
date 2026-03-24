import client from "./client";
import type { PublicUser } from "../types/auth";

export async function getUser(id: string): Promise<PublicUser> {
  const res = await client.get<PublicUser>(`/users/${id}`);
  return res.data;
}