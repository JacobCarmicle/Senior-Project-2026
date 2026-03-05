import { http, HttpResponse } from "msw";
import { mockAuthResponse, mockUser } from "../fixtures";

const BASE = "http://localhost:8000";

export const handlers = [
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.email === "test@example.com" && body.password === "password123") {
      return HttpResponse.json(mockAuthResponse);
    }
    return HttpResponse.json(
      { detail: "Invalid email or password" },
      { status: 401 },
    );
  }),

  http.post(`${BASE}/auth/signup`, async ({ request }) => {
    const body = (await request.json()) as { email: string };
    if (body.email === "taken@example.com") {
      return HttpResponse.json(
        { detail: "Email already registered" },
        { status: 409 },
      );
    }
    return HttpResponse.json(mockAuthResponse, { status: 201 });
  }),

  http.post(`${BASE}/auth/oauth/google`, () => {
    return HttpResponse.json(mockAuthResponse);
  }),

  http.post(`${BASE}/auth/logout`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${BASE}/auth/forgot-password`, () => {
    return HttpResponse.json({ message: "Reset link sent" });
  }),

  http.post(`${BASE}/auth/reset-password`, async ({ request }) => {
    const body = (await request.json()) as { token: string };
    if (body.token === "expired") {
      return HttpResponse.json(
        { detail: "Token expired" },
        { status: 400 },
      );
    }
    return HttpResponse.json({ message: "Password reset successful" });
  }),

  http.get(`${BASE}/auth/me`, ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (auth === "Bearer mock-jwt-token-abc123") {
      return HttpResponse.json(mockUser);
    }
    return HttpResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }),
];
