-- Xenon Code Supabase/PostgreSQL schema
create type role_type as enum ('none', 'student', 'teacher');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  first_name text not null,
  username text not null unique,
  role role_type not null default 'none',
  has_seen_init boolean not null default false,
  joined_app timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  code text not null default '',
  snippet text not null default '',
  updated_at timestamptz not null default now()
);

create table classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text not null,
  class_code varchar(6) not null unique,
  created_at timestamptz not null default now()
);

create table class_members (
  class_id uuid not null references classes(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  total_time_seconds integer not null default 0,
  total_projects integer not null default 0,
  practice_questions_correct integer not null default 0,
  enrolled_at timestamptz not null default now(),
  primary key (class_id, student_id)
);

-- Auto-create profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_name text;
  raw_first text;
  raw_username text;
  chosen_role role_type;
begin
  raw_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  raw_first := coalesce(new.raw_user_meta_data->>'first_name', split_part(raw_name, ' ', 1), 'User');
  raw_username := regexp_replace(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), '[^a-zA-Z0-9_]', '', 'g');
  chosen_role := case
    when new.raw_user_meta_data->>'role' in ('none', 'student', 'teacher') then (new.raw_user_meta_data->>'role')::role_type
    else 'none'::role_type
  end;

  insert into public.profiles (id, full_name, first_name, username, role)
  values (
    new.id,
    raw_name,
    raw_first,
    left(coalesce(nullif(raw_username, ''), 'xenonuser') || floor(random() * 900 + 100)::text, 24),
    chosen_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Immutable role rule: student/teacher cannot revert or change.
create or replace function enforce_role_immutability()
returns trigger language plpgsql as $$
begin
  if old.role in ('student', 'teacher') and new.role <> old.role then
    raise exception 'Role is immutable once set to Student or Teacher.';
  end if;
  if old.role = 'none' and new.role not in ('none', 'student', 'teacher') then
    raise exception 'Invalid role.';
  end if;
  return new;
end;
$$;

create trigger trg_enforce_role_immutability
before update on profiles
for each row
execute function enforce_role_immutability();

-- Suggested indexes for low-resource server footprint.
create index idx_projects_owner_updated on projects(owner_id, updated_at desc);
create index idx_classes_teacher on classes(teacher_id);
create index idx_class_members_student on class_members(student_id);
