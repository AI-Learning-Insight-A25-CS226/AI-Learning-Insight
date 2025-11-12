-- === extensions ===
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

create table if not exists users (
  id               bigint primary key,
  name             text,
  email            text unique,
  username         text,
  gender           text,
  born_at          date,
  created_at       timestamptz,
  updated_at       timestamptz,
  verified_at      timestamptz,
  tz               text,
  raw              jsonb default '{}'::jsonb
);

create index if not exists idx_users_email on users (email);
create index if not exists idx_users_username on users (username);

create table if not exists exams (
  id          bigserial primary key,
  code        text unique,
  title       text,
  created_at  timestamptz default now()
);

create table if not exists exam_registrations (
  id                   bigint primary key,
  user_id              bigint not null references users(id) on delete cascade,
  status               text,
  submission_status    text,
  registration_at      timestamptz,
  registration_type    text,
  is_scheduled         boolean,
  scheduled_at         timestamptz,
  exam_id              bigint,
  raw                  jsonb default '{}'::jsonb
);
create index if not exists idx_exam_reg_user on exam_registrations (user_id);
create index if not exists idx_exam_reg_status on exam_registrations (status);

create table if not exists exam_results (
  id                   bigint primary key,
  user_id              bigint not null references users(id) on delete cascade,
  final_score          numeric(6,2),
  status               text,
  duration_in_minutes  numeric(10,2),
  started_at           timestamptz,
  finished_at          timestamptz,
  submission_id        bigint,
  exam_id              bigint,
  raw                  jsonb default '{}'::jsonb
);
create index if not exists idx_exam_res_user on exam_results (user_id);
create index if not exists idx_exam_res_exam on exam_results (exam_id);

create table if not exists dev_journey_submissions (
  id             bigint primary key,
  journey_id     bigint,
  quiz_id        bigint,
  submitter_id   bigint references users(id) on delete set null,
  version_id     bigint,
  app_link       text,
  app_comment    text,
  status         text,
  reviewer_id    bigint,
  score          numeric(6,2),
  submitted_at   timestamptz,
  reviewed_at    timestamptz,
  raw            jsonb default '{}'::jsonb
);
create index if not exists idx_djs_submitter on dev_journey_submissions (submitter_id);
create index if not exists idx_djs_journey on dev_journey_submissions (journey_id);

create table if not exists dev_journey_trackings (
  id                   bigint primary key,
  journey_id           bigint,
  user_id              bigint references users(id) on delete set null,
  duration_in_minutes  numeric(10,2),
  created_at           timestamptz,
  raw                  jsonb default '{}'::jsonb
);
create index if not exists idx_djt_user on dev_journey_trackings (user_id);
create index if not exists idx_djt_journey on dev_journey_trackings (journey_id);

create table if not exists dev_journey_tutorials (
  id                   bigint primary key,
  tutorial_id          bigint,
  journey_id           bigint,
  user_id              bigint references users(id) on delete set null,
  duration_in_minutes  numeric(10,2),
  created_at           timestamptz,
  raw                  jsonb default '{}'::jsonb
);
create index if not exists idx_djtut_user on dev_journey_tutorials (user_id);
create index if not exists idx_djtut_journey on dev_journey_tutorials (journey_id);

create table if not exists metrics (
  student_id            bigint primary key references users(id) on delete cascade,
  study_hours           numeric(10,2),
  attendance            numeric(5,2),
  assignment_completion numeric(5,2),
  motivation            numeric(5,2),
  stress_level          numeric(5,2),
  discussions           numeric(10,2),
  resources             numeric(10,2),
  last_calculated_at    timestamptz default now()
);

create table if not exists insights (
  student_id  bigint primary key references users(id) on delete cascade,
  label       text not null,
  confidence  numeric(5,4) not null default 0,
  reasons     jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);

create table if not exists insight_histories (
  id           uuid primary key default gen_random_uuid(),
  student_id   bigint not null references users(id) on delete cascade,
  label        text not null,
  confidence   numeric(5,4) not null default 0,
  reasons      jsonb not null default '[]'::jsonb,
  raw_features jsonb not null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_insight_hist_student on insight_histories (student_id, created_at desc);
