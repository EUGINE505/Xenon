-- Xenon Code Supabase/PostgreSQL schema
create type role_type as enum ('none', 'student', 'teacher');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  first_name text not null,
  username text not null unique,
  role role_type not null default 'none',
  avatar_url text not null default '',
  headline text not null default '',
  about_me text not null default '',
  favorite_topic text not null default '',
  profile_visibility boolean not null default true,
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

create table if not exists class_announcements (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  teacher_id uuid not null references profiles(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

alter table class_announcements enable row level security;

create policy "Teachers manage their own announcements"
on class_announcements for all
using (teacher_id = auth.uid())
with check (teacher_id = auth.uid());

create policy "Students read announcements for their class"
on class_announcements for select
using (
  class_id in (
    select class_id from class_members where student_id = auth.uid()
  )
);

create table if not exists class_assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  teacher_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  question_goal integer,
  due_date date,
  created_at timestamptz not null default now()
);

alter table class_assignments enable row level security;

create policy "Teachers manage their own assignments"
on class_assignments for all
using (teacher_id = auth.uid())
with check (teacher_id = auth.uid());

create policy "Students read assignments for their class"
on class_assignments for select
using (
  class_id in (
    select class_id from class_members where student_id = auth.uid()
  )
);

create table if not exists assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references class_assignments(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  notes text not null default '',
  submitted_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

alter table assignment_submissions enable row level security;

create policy "Students manage their own submissions"
on assignment_submissions for all
using (student_id = auth.uid())
with check (student_id = auth.uid());

create policy "Teachers read submissions for their assignments"
on assignment_submissions for select
using (
  assignment_id in (
    select id from class_assignments where teacher_id = auth.uid()
  )
);

create table if not exists user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  achievement_key text not null,
  earned_at timestamptz not null default now(),
  unique (user_id, achievement_key)
);

alter table user_achievements enable row level security;

create policy "Users read their own achievements"
on user_achievements for select
using (user_id = auth.uid());

create policy "Users insert their own achievements"
on user_achievements for insert
with check (user_id = auth.uid());

create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles(id) on delete cascade,
  addressee_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);

create unique index if not exists idx_friendships_pair
on friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

alter table friendships enable row level security;

create policy "Students can view their friendships"
on friendships for select
using (requester_id = auth.uid() or addressee_id = auth.uid());

create policy "Students can send friend requests"
on friendships for insert
with check (requester_id = auth.uid());

create policy "Students can respond to their friendships"
on friendships for update
using (requester_id = auth.uid() or addressee_id = auth.uid())
with check (requester_id = auth.uid() or addressee_id = auth.uid());

create policy "Students can remove their friendships"
on friendships for delete
using (requester_id = auth.uid() or addressee_id = auth.uid());
