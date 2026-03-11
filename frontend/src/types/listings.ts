export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  status: string;
  images: string[];
  created_at: string;
  updated_at: string;
}

export interface ListingListResponse {
  items: Listing[];
  total: number;
  page: number;
  page_size: number;
}

export interface CreateListingRequest {
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  images: string[];
}

export interface UpdateListingRequest {
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  location?: string;
  status?: string;
  images?: string[];
}

export interface UploadedImage {
  public_url: string;
  object_key?: string;
}
