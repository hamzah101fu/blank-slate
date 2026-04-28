-- ─── Enable UUID extension ─────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── CONTENT TABLES ────────────────────────────────────────────────────────

create table if not exists languages (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null unique,
  code         text not null unique,
  created_at   timestamptz default now()
);

create table if not exists courses (
  id           uuid primary key default uuid_generate_v4(),
  language_id  uuid not null references languages(id) on delete cascade,
  name         text not null,
  description  text,
  order_index  int not null default 0,
  created_at   timestamptz default now()
);

create table if not exists units (
  id           uuid primary key default uuid_generate_v4(),
  course_id    uuid not null references courses(id) on delete cascade,
  name         text not null,
  order_index  int not null default 0,
  created_at   timestamptz default now()
);

create table if not exists stages (
  id           uuid primary key default uuid_generate_v4(),
  unit_id      uuid not null references units(id) on delete cascade,
  name         text not null,
  stage_type   text not null,
  stage_number int not null,
  order_index  int not null default 0,
  created_at   timestamptz default now()
);

create table if not exists questions (
  id             uuid primary key default uuid_generate_v4(),
  stage_id       uuid not null references stages(id) on delete cascade,
  question_type  text not null,
  content        jsonb not null default '{}',
  order_index    int not null default 0,
  created_at     timestamptz default now()
);

-- ─── USER TABLES ───────────────────────────────────────────────────────────

create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now()
);

create table if not exists user_progress (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  stage_id     uuid not null references stages(id) on delete cascade,
  completed    boolean not null default false,
  score        int default 0,
  completed_at timestamptz,
  created_at   timestamptz default now(),
  constraint user_progress_user_stage_unique unique (user_id, stage_id)
);

create table if not exists user_question_attempts (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  question_id  uuid not null references questions(id) on delete cascade,
  correct      boolean not null,
  attempted_at timestamptz default now()
);

create table if not exists user_xp (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  total_xp   int not null default 0,
  updated_at timestamptz default now(),
  constraint user_xp_user_unique unique (user_id)
);

create table if not exists user_streaks (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_activity  date,
  constraint user_streaks_user_unique unique (user_id)
);

-- ─── ROW LEVEL SECURITY ────────────────────────────────────────────────────

alter table languages              enable row level security;
alter table courses                enable row level security;
alter table units                  enable row level security;
alter table stages                 enable row level security;
alter table questions              enable row level security;
alter table profiles               enable row level security;
alter table user_progress          enable row level security;
alter table user_question_attempts enable row level security;
alter table user_xp                enable row level security;
alter table user_streaks           enable row level security;

-- Drop all existing policies first so re-running is safe
do $$ declare r record;
begin
  for r in (
    select policyname, tablename from pg_policies
    where tablename in (
      'languages','courses','units','stages','questions',
      'profiles','user_progress','user_question_attempts',
      'user_xp','user_streaks'
    )
  )
  loop
    execute format('drop policy if exists %I on %I', r.policyname, r.tablename);
  end loop;
end $$;

-- Content: authenticated users can read
create policy "Authenticated read languages"
  on languages for select to authenticated using (true);

create policy "Authenticated read courses"
  on courses for select to authenticated using (true);

create policy "Authenticated read units"
  on units for select to authenticated using (true);

create policy "Authenticated read stages"
  on stages for select to authenticated using (true);

create policy "Authenticated read questions"
  on questions for select to authenticated using (true);

-- Content: only admins can write
create policy "Admins write languages"
  on languages for all to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
  with check ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

create policy "Admins write courses"
  on courses for all to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
  with check ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

create policy "Admins write units"
  on units for all to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
  with check ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

create policy "Admins write stages"
  on stages for all to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
  with check ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

create policy "Admins write questions"
  on questions for all to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
  with check ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- User data: each user owns their own rows
create policy "Users manage own profile"
  on profiles for all to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users manage own progress"
  on user_progress for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own attempts"
  on user_question_attempts for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own xp"
  on user_xp for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own streaks"
  on user_streaks for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── AUTO-CREATE PROFILE ON SIGNUP ────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── STORAGE BUCKETS ───────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('guftugu-audio', 'guftugu-audio', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('guftugu-images', 'guftugu-images', true)
on conflict (id) do nothing;

drop policy if exists "Admins upload audio"  on storage.objects;
drop policy if exists "Admins upload images" on storage.objects;
drop policy if exists "Public read audio"    on storage.objects;
drop policy if exists "Public read images"   on storage.objects;

create policy "Admins upload audio" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'guftugu-audio'
    and (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

create policy "Admins upload images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'guftugu-images'
    and (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

create policy "Public read audio" on storage.objects
  for select to authenticated
  using (bucket_id = 'guftugu-audio');

create policy "Public read images" on storage.objects
  for select to authenticated
  using (bucket_id = 'guftugu-images');
