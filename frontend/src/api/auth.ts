import client from "./client";
import type {
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  User,
} from "../types/auth";

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await client.post<AuthResponse>("/auth/login", data);
  return res.data;
}

export async function signup(data: RegisterRequest): Promise<AuthResponse> {
  const res = await client.post<AuthResponse>("/auth/signup", data);
  return res.data;
}

export async function googleOAuth(token: string): Promise<AuthResponse> {
  const res = await client.post<AuthResponse>("/auth/oauth/google", { token });
  return res.data;
}

export async function logout(): Promise<void> {
  await client.post("/auth/logout");
}

export async function forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
  const res = await client.post<{ message: string }>("/auth/forgot-password", data);
  return res.data;
}

export async function resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
  const res = await client.post<{ message: string }>("/auth/reset-password", data);
  return res.data;
}

export async function getMe(): Promise<User> {
  const res = await client.get<User>("/auth/me");
  return res.data;
}
