alter table public.users
  add column if not exists status text not null default 'active'
    check (status in ('active', 'disabled'));

create index if not exists idx_users_status on public.users(status);
