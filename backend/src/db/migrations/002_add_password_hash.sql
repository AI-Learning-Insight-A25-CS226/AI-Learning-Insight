create extension if not exists pgcrypto;
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'password_hash'
  ) then
    alter table public.users
      add column password_hash text;
  end if;
end$$;
