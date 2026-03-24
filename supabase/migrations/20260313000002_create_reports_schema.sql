create table if not exists public.reports (
  id          uuid        primary key default gen_random_uuid(),
  reporter_id uuid        not null references public.users(id),
  listing_id  uuid        references public.listings(id),
  reason      text        not null,
  description text,
  status      text        not null default 'pending'
                check (status in ('pending', 'reviewed', 'dismissed')),
  created_at  timestamptz not null default now()
);

create index if not exists idx_reports_status      on public.reports(status);
create index if not exists idx_reports_listing_id  on public.reports(listing_id);
create index if not exists idx_reports_reporter_id on public.reports(reporter_id);
