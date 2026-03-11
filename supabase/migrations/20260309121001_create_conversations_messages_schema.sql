create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  buyer_id uuid not null,
  seller_id uuid not null,
  status text not null default 'open' check (status in ('open','closed','blocked')),
  blocked_by_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_no_self check (buyer_id <> seller_id)
);

create unique index if not exists idx_conversations_listing_buyer_seller_unique
  on public.conversations(listing_id, buyer_id, seller_id);

create index if not exists idx_conversations_buyer on public.conversations(buyer_id, updated_at desc);
create index if not exists idx_conversations_seller on public.conversations(seller_id, updated_at desc);
create index if not exists idx_conversations_status on public.conversations(status);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null,
  text text,
  image_url text,
  kind text not null default 'text' check (kind in ('text','image','system')),
  sent_at timestamptz not null default now(),
  read_at timestamptz,
  check (text is not null or image_url is not null)
);

create index if not exists idx_messages_conversation_sent_at
  on public.messages(conversation_id, sent_at);

create index if not exists idx_messages_sender_sent_at
  on public.messages(sender_id, sent_at desc);
