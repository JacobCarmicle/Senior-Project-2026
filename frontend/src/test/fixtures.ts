import type { AuthResponse, User } from "../types/auth";

export const mockUser: User = {
  id: "user-1",
  email: "test@example.com",
  full_name: "Test User",
  role: "user",
  created_at: "2026-01-01T00:00:00Z",
};

export const mockAuthResponse: AuthResponse = {
  access_token: "mock-jwt-token-abc123",
  token_type: "bearer",
  user: mockUser,
};
