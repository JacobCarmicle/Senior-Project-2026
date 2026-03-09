create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null,
  seller_id uuid not null,
  rating int not null check (rating between 1 and 5),
  comment text not null,
  created_at timestamptz not null default now(),
  constraint reviews_no_self check (buyer_id <> seller_id)
);

create unique index if not exists idx_reviews_unique_buyer_seller on public.reviews(buyer_id, seller_id);
create index if not exists idx_reviews_seller_created_at on public.reviews(seller_id, created_at desc);
