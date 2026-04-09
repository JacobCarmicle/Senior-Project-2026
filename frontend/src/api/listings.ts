import client from "./client";
import type {
  CreateListingRequest,
  Listing,
  ListingListResponse,
  UpdateListingRequest,
  UploadedImage,
} from "../types/listings";

function normalizeImageUrl(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;

  const base = (client.defaults.baseURL || "").replace(/\/$/, "");
  if (!base) return url;

  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

function normalizeListing(item: Listing): Listing {
  return {
    ...item,
    images: (item.images || []).map(normalizeImageUrl),
  };
}

export async function createListing(payload: CreateListingRequest): Promise<Listing> {
  const res = await client.post<Listing>("/listings", payload);
  return normalizeListing(res.data);
}

export async function updateListing(id: string, payload: UpdateListingRequest): Promise<Listing> {
  const res = await client.patch<Listing>(`/listings/${id}`, payload);
  return normalizeListing(res.data);
}

export async function getListing(id: string): Promise<Listing> {
  const res = await client.get<Listing>(`/listings/${id}`);
  return normalizeListing(res.data);
}

export interface ListingQueryOptions {
  user_lat?: number;
  user_lng?: number;
  radius_miles?: number;
  sort?: "newest" | "oldest" | "price-asc" | "price-desc" | "distance";
}

export interface SearchListingOptions extends ListingQueryOptions {
  keyword?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
}

export async function listListings(options: ListingQueryOptions = {}): Promise<ListingListResponse> {
  const res = await client.get<ListingListResponse>("/listings", { params: options });
  return {
    ...res.data,
    items: (res.data.items || []).map(normalizeListing),
  };
}

export async function searchListings(options: SearchListingOptions = {}): Promise<ListingListResponse> {
  const res = await client.get<ListingListResponse>("/listings/search", { params: options });
  return {
    ...res.data,
    items: (res.data.items || []).map(normalizeListing),
  };
}

export async function deleteListing(id: string): Promise<void> {
  await client.delete(`/listings/${id}`);
}

export async function getSavedListings(): Promise<ListingListResponse> {
  const res = await client.get<ListingListResponse>("/user/me/saved");
  return {
    ...res.data,
    items: (res.data.items || []).map(normalizeListing),
  };
}

export async function toggleSaveListing(listingId: string): Promise<void> {
  await client.post(`/listings/${listingId}/save`);
}

export async function uploadListingImages(files: File[]): Promise<UploadedImage[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const res = await client.post<{ items: UploadedImage[] }>("/uploads/images", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data.items;
}
