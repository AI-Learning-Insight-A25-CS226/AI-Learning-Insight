create table if not exists developers (
  id bigint primary key,
  name text not null,
  email text unique not null,
  password text not null,
  created_at timestamp with time zone default now()
);

create table if not exists learning_metrics (
  developer_id bigint primary key
    references developers(id) on delete cascade,

  total_active_days integer default 0,
  avg_completion_time_hours double precision default 0,
  total_journeys_completed integer default 0,
  total_submissions integer default 0,
  rejected_submissions integer default 0,
  avg_exam_score double precision default 0,
  rejection_ratio double precision default 0,

  cluster_label integer,

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists insights (
  developer_id bigint primary key references developers(id) on delete cascade,
  learning_style text,
  confidence_score double precision default 0,
  insight_text text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists insight_histories (
  id bigserial primary key,
  developer_id bigint not null references developers(id) on delete cascade,
  learning_style text,
  confidence_score double precision default 0,
  insight_text text,
  created_at timestamp with time zone default now()
);