create table public.student_schedule_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject text not null check (char_length(btrim(subject)) between 1 and 120),
  teacher text check (teacher is null or char_length(teacher) <= 120),
  room text check (room is null or char_length(room) <= 80),
  day_of_week smallint not null check (day_of_week between 1 and 7),
  start_time time not null,
  end_time time not null,
  color text not null default '#0b6b3a' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_schedule_items_time_order check (end_time > start_time)
);

create table public.student_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  course text check (course is null or char_length(course) <= 120),
  due_at timestamptz,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'pending' check (status in ('pending', 'completed')),
  notes text check (notes is null or char_length(notes) <= 2000),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_tasks_completion_consistency check (
    (status = 'pending' and completed_at is null)
    or (status = 'completed' and completed_at is not null)
  )
);

create table public.student_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text check (location is null or char_length(location) <= 160),
  notes text check (notes is null or char_length(notes) <= 2000),
  color text not null default '#287fa0' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_events_time_order check (ends_at is null or ends_at >= starts_at)
);

create index student_schedule_items_user_day_time_idx
  on public.student_schedule_items (user_id, day_of_week, start_time);

create index student_tasks_user_status_due_idx
  on public.student_tasks (user_id, status, due_at);

create index student_events_user_starts_idx
  on public.student_events (user_id, starts_at);

alter table public.student_schedule_items enable row level security;
alter table public.student_tasks enable row level security;
alter table public.student_events enable row level security;

revoke all on public.student_schedule_items from anon, authenticated;
revoke all on public.student_tasks from anon, authenticated;
revoke all on public.student_events from anon, authenticated;

grant select, insert, update, delete on public.student_schedule_items to authenticated;
grant select, insert, update, delete on public.student_tasks to authenticated;
grant select, insert, update, delete on public.student_events to authenticated;

create policy "student_schedule_items_select_own"
on public.student_schedule_items for select to authenticated
using ((select auth.uid()) = user_id);

create policy "student_schedule_items_insert_own"
on public.student_schedule_items for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "student_schedule_items_update_own"
on public.student_schedule_items for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "student_schedule_items_delete_own"
on public.student_schedule_items for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "student_tasks_select_own"
on public.student_tasks for select to authenticated
using ((select auth.uid()) = user_id);

create policy "student_tasks_insert_own"
on public.student_tasks for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "student_tasks_update_own"
on public.student_tasks for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "student_tasks_delete_own"
on public.student_tasks for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "student_events_select_own"
on public.student_events for select to authenticated
using ((select auth.uid()) = user_id);

create policy "student_events_insert_own"
on public.student_events for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "student_events_update_own"
on public.student_events for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "student_events_delete_own"
on public.student_events for delete to authenticated
using ((select auth.uid()) = user_id);

create trigger student_schedule_items_set_updated_at
before update on public.student_schedule_items
for each row execute function private.set_updated_at();

create trigger student_tasks_set_updated_at
before update on public.student_tasks
for each row execute function private.set_updated_at();

create trigger student_events_set_updated_at
before update on public.student_events
for each row execute function private.set_updated_at();
