import { http, HttpResponse } from "msw";
import { mockAuthResponse, mockUser } from "../fixtures";

let listings = [
  {
    id: "l1",
    seller_id: "u1",
    title: "Existing listing",
    description: "Existing listing description",
    price: 50,
    category: "Electronics",
    location: "Wichita, KS",
    status: "active",
    images: ["https://img.test/existing.jpg"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

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

  http.post(`${BASE}/uploads/images`, async ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth) return HttpResponse.json({ detail: "Not authenticated" }, { status: 401 });

    const form = await request.formData();
    const files = form.getAll("files") as File[];
    if (files.length === 0) {
      return HttpResponse.json({ detail: "No files uploaded" }, { status: 400 });
    }

    const bad = files.find((f) => !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type));
    if (bad) {
      return HttpResponse.json({ detail: "Unsupported file type" }, { status: 400 });
    }

    return HttpResponse.json({
      items: files.map((_, i) => ({
        public_url: `https://img.test/upload-${i + 1}.jpg`,
        object_key: `test-user/upload-${i + 1}.jpg`,
      })),
    }, { status: 201 });
  }),

  http.post(`${BASE}/listings`, async ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth) return HttpResponse.json({ detail: "Not authenticated" }, { status: 401 });

    const body = (await request.json()) as {
      title: string;
      description: string;
      price: number;
      category: string;
      location: string;
      images: string[];
    };

    const item = {
      id: `l${listings.length + 1}`,
      seller_id: "u1",
      title: body.title,
      description: body.description,
      price: body.price,
      category: body.category,
      location: body.location,
      status: "active",
      images: body.images,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    listings = [item, ...listings];
    return HttpResponse.json(item, { status: 201 });
  }),

  http.patch(`${BASE}/listings/:id`, async ({ params, request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth) return HttpResponse.json({ detail: "Not authenticated" }, { status: 401 });

    const id = String(params.id);
    const patch = (await request.json()) as Record<string, unknown>;
    const idx = listings.findIndex((x) => x.id === id);
    if (idx < 0) return HttpResponse.json({ detail: "Listing not found" }, { status: 404 });

    const updated = { ...listings[idx], ...patch, updated_at: new Date().toISOString() };
    listings[idx] = updated;
    return HttpResponse.json(updated);
  }),

  http.get(`${BASE}/listings/:id`, ({ params }) => {
    const id = String(params.id);
    const item = listings.find((x) => x.id === id);
    if (!item) return HttpResponse.json({ detail: "Listing not found" }, { status: 404 });
    return HttpResponse.json(item);
  }),
];
