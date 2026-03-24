import client from "./client";
import type {
  CreateListingRequest,
  Listing,
  ListingListResponse,
  UpdateListingRequest,
  UploadedImage,
} from "../types/listings";

export async function createListing(payload: CreateListingRequest): Promise<Listing> {
  const res = await client.post<Listing>("/listings", payload);
  return res.data;
}

export async function updateListing(id: string, payload: UpdateListingRequest): Promise<Listing> {
  const res = await client.patch<Listing>(`/listings/${id}`, payload);
  return res.data;
}

export async function getListing(id: string): Promise<Listing> {
  const res = await client.get<Listing>(`/listings/${id}`);
  return res.data;
}

export async function listListings(): Promise<ListingListResponse> {
  const res = await client.get<ListingListResponse>("/listings");
  return res.data;
}

export async function deleteListing(id: string): Promise<void> {
  await client.delete(`/listings/${id}`);
}

export async function uploadListingImages(files: File[]): Promise<UploadedImage[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const res = await client.post<{ items: UploadedImage[] }>("/uploads/images", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data.items;
}
