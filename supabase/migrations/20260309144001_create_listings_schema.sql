create extension if not exists pgcrypto;

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null,
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 10 and 5000),
  price numeric(10,2) not null check (price >= 0),
  category text not null,
  location text not null,
  status text not null default 'active' check (status in ('active','sold','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_listings_status_created_at on public.listings(status, created_at desc);
create index if not exists idx_listings_category on public.listings(category);
create index if not exists idx_listings_price on public.listings(price);

create table if not exists public.listing_media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  public_url text not null,
  object_key text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_listing_media_listing_id on public.listing_media(listing_id);
