create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  class text,
  created_at timestamptz default now()
);

create table if not exists metrics (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  date date not null,
  study_hours numeric,
  attendance int,
  assignment_completion int,
  motivation int,
  stress_level int,
  discussions int,
  resources int
);

create table if not exists insights (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  label text not null,  -- fast | consistent | reflective
  confidence numeric default 0.0,
  reasons jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);

create index if not exists idx_metrics_student_date on metrics(student_id, date);