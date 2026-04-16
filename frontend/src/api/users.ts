import client from "./client";
import type { PublicUser } from "../types/auth";

export async function getUser(id: string): Promise<PublicUser> {
  const res = await client.get<PublicUser>(`/users/${id}`);
  return res.data;
}

export async function updateAvatar(file: File): Promise<PublicUser> {
  const form = new FormData();
  form.append("file", file);
  const res = await client.patch<PublicUser>("/users/me/avatar", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}