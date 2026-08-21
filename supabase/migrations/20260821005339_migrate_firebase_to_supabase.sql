create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null check (char_length(btrim(nombre)) between 2 and 100),
  correo text not null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  active boolean not null default false,
  categories text[] not null default array[
    'evaluaciones', 'cuatrimestres', 'inscripciones', 'vacaciones', 'suspensiones'
  ]::text[],
  lead_days smallint[] not null default array[7, 3, 1]::smallint[],
  actualizado_en timestamptz not null default now(),
  constraint notification_categories_valid check (
    categories <@ array[
      'evaluaciones', 'cuatrimestres', 'inscripciones', 'vacaciones',
      'suspensiones', 'becas', 'servicioSocial', 'estadias'
    ]::text[]
    and cardinality(categories) > 0
  ),
  constraint notification_lead_days_valid check (
    lead_days <@ array[0, 1, 3, 7]::smallint[]
    and cardinality(lead_days) > 0
  )
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth_key text not null,
  expiration_time bigint,
  plataforma text not null default 'Navegador web',
  active boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index push_subscriptions_active_user_idx
  on public.push_subscriptions (user_id)
  where active = true;

create table public.calendar_events (
  id text primary key,
  titulo text not null,
  categoria text not null check (categoria = any (array[
    'evaluaciones', 'cuatrimestres', 'inscripciones', 'vacaciones',
    'suspensiones', 'becas', 'servicioSocial', 'estadias'
  ]::text[])),
  fecha_inicio date not null,
  fecha_fin date not null,
  constraint calendar_event_date_order check (fecha_fin >= fecha_inicio)
);

create index calendar_events_start_idx on public.calendar_events (fecha_inicio);

create table public.notification_deliveries (
  id bigint generated always as identity primary key,
  subscription_id uuid not null references public.push_subscriptions (id) on delete cascade,
  event_id text not null references public.calendar_events (id) on delete cascade,
  lead_days smallint not null,
  sent_at timestamptz not null default now(),
  unique (subscription_id, event_id, lead_days)
);

alter table public.profiles enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.calendar_events enable row level security;
alter table public.notification_deliveries enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.notification_preferences from anon, authenticated;
revoke all on public.push_subscriptions from anon, authenticated;
revoke all on public.calendar_events from anon, authenticated;
revoke all on public.notification_deliveries from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (nombre) on public.profiles to authenticated;
grant select, insert, update, delete on public.notification_preferences to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (
  (select auth.uid()) = id
  and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) is false
);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (
  (select auth.uid()) = id
  and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) is false
)
with check (
  (select auth.uid()) = id
  and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) is false
);

create policy "notification_preferences_select_own"
on public.notification_preferences for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "notification_preferences_insert_own"
on public.notification_preferences for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "notification_preferences_update_own"
on public.notification_preferences for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "notification_preferences_delete_own"
on public.notification_preferences for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "push_subscriptions_select_own"
on public.push_subscriptions for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "push_subscriptions_insert_own"
on public.push_subscriptions for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "push_subscriptions_update_own"
on public.push_subscriptions for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "push_subscriptions_delete_own"
on public.push_subscriptions for delete
to authenticated
using ((select auth.uid()) = user_id);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger notification_preferences_set_updated_at
before update on public.notification_preferences
for each row execute function private.set_updated_at();

create trigger push_subscriptions_set_updated_at
before update on public.push_subscriptions
for each row execute function private.set_updated_at();

create or replace function private.sync_auth_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(new.is_anonymous, false) then
    return new;
  end if;

  insert into public.profiles (id, nombre, correo, creado_en)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data->>'nombre'), ''), 'Estudiante'),
    coalesce(new.email, ''),
    coalesce(new.created_at, now())
  )
  on conflict (id) do update
    set correo = excluded.correo;

  return new;
end;
$$;

revoke all on function private.sync_auth_profile() from public, anon, authenticated;

create trigger auth_user_profile_sync
after insert or update of email on auth.users
for each row execute function private.sync_auth_profile();

insert into public.calendar_events (id, titulo, categoria, fecha_inicio, fecha_fin) values
  ('suspension-2026-08-20', 'Suspensión de labores', 'suspensiones', '2026-08-20', '2026-08-20'),
  ('recuperacion-2026-08', 'Evaluación de recuperación', 'evaluaciones', '2026-08-22', '2026-08-22'),
  ('inscripcion-2026-08', 'Periodo de inscripción y reinscripción', 'inscripciones', '2026-08-24', '2026-08-28'),
  ('fin-2026-2', 'Fin de cuatrimestre 2026-2', 'cuatrimestres', '2026-08-31', '2026-08-31'),
  ('inicio-2026-3', 'Inicio de cuatrimestre 2026-3', 'cuatrimestres', '2026-09-01', '2026-09-01'),
  ('extraordinaria-2026-09', 'Evaluación extraordinaria especial', 'evaluaciones', '2026-09-03', '2026-09-05'),
  ('estadias-2026-09', 'Último día para asignación de estadías', 'estadias', '2026-09-07', '2026-09-07'),
  ('suspension-2026-09', 'Suspensión de labores', 'suspensiones', '2026-09-15', '2026-09-16'),
  ('parciales-2026-09', 'Periodo de evaluaciones parciales', 'evaluaciones', '2026-09-24', '2026-09-30'),
  ('recuperacion-2026-10', 'Evaluación de recuperación', 'evaluaciones', '2026-10-01', '2026-10-07'),
  ('parciales-2026-10', 'Periodo de evaluaciones parciales', 'evaluaciones', '2026-10-26', '2026-10-31'),
  ('servicio-2026-10', 'Fecha límite para iniciar servicio social', 'servicioSocial', '2026-10-30', '2026-10-30'),
  ('suspension-2026-11-02', 'Suspensión de labores', 'suspensiones', '2026-11-02', '2026-11-02'),
  ('recuperacion-2026-11-a', 'Evaluación de recuperación', 'evaluaciones', '2026-11-03', '2026-11-09'),
  ('especial-2026-11', 'Aplicación de evaluación especial', 'evaluaciones', '2026-11-12', '2026-11-14'),
  ('suspension-2026-11-16', 'Suspensión de labores', 'suspensiones', '2026-11-16', '2026-11-16'),
  ('becas-2026-11', 'Entrega de expedientes para becas internas', 'becas', '2026-11-18', '2026-11-18'),
  ('parciales-2026-11', 'Periodo de evaluaciones parciales', 'evaluaciones', '2026-11-19', '2026-11-25'),
  ('recuperacion-2026-11-b', 'Evaluación de recuperación', 'evaluaciones', '2026-11-26', '2026-11-30'),
  ('ego-2026-12', 'Examen General Ordinario (EGO)', 'evaluaciones', '2026-12-01', '2026-12-02'),
  ('inscripcion-2026-12', 'Periodo de inscripción y reinscripción', 'inscripciones', '2026-12-10', '2026-12-17'),
  ('suspension-2026-12-12', 'Suspensión de labores', 'suspensiones', '2026-12-12', '2026-12-12'),
  ('fin-2026-3', 'Fin de cuatrimestre 2026-3', 'cuatrimestres', '2026-12-18', '2026-12-18'),
  ('vacaciones-2026-12', 'Periodo vacacional', 'vacaciones', '2026-12-21', '2027-01-05'),
  ('suspension-2026-12-25', 'Suspensión de labores', 'suspensiones', '2026-12-25', '2026-12-25'),
  ('suspension-2027-01-01', 'Suspensión de labores', 'suspensiones', '2027-01-01', '2027-01-01'),
  ('inicio-2027-1', 'Inicio de cuatrimestre 2027-1', 'cuatrimestres', '2027-01-06', '2027-01-06'),
  ('extraordinaria-2027-01', 'Evaluación extraordinaria especial', 'evaluaciones', '2027-01-08', '2027-01-12'),
  ('estadias-2027-01', 'Último día para asignación de estadías', 'estadias', '2027-01-11', '2027-01-11'),
  ('parciales-2027-01', 'Periodo de evaluaciones parciales', 'evaluaciones', '2027-01-25', '2027-02-02'),
  ('suspension-2027-02-01', 'Suspensión de labores', 'suspensiones', '2027-02-01', '2027-02-01'),
  ('recuperacion-2027-02', 'Evaluación de recuperación', 'evaluaciones', '2027-02-03', '2027-02-09'),
  ('parciales-2027-02', 'Periodo de evaluaciones parciales', 'evaluaciones', '2027-02-22', '2027-03-01'),
  ('servicio-2027-02', 'Fecha límite para iniciar servicio social', 'servicioSocial', '2027-02-26', '2027-02-26'),
  ('suspension-2027-03-02', 'Suspensión de labores', 'suspensiones', '2027-03-02', '2027-03-02'),
  ('recuperacion-2027-03', 'Evaluación de recuperación', 'evaluaciones', '2027-03-03', '2027-03-10'),
  ('especial-2027-03', 'Aplicación de evaluación especial', 'evaluaciones', '2027-03-12', '2027-03-17'),
  ('suspension-2027-03-15', 'Suspensión de labores', 'suspensiones', '2027-03-15', '2027-03-15'),
  ('becas-2027-03', 'Entrega de expedientes para becas internas', 'becas', '2027-03-19', '2027-03-19'),
  ('vacaciones-2027-03', 'Periodo vacacional', 'vacaciones', '2027-03-22', '2027-03-30'),
  ('suspension-2027-03-25', 'Suspensión de labores', 'suspensiones', '2027-03-25', '2027-03-26'),
  ('parciales-2027-03', 'Periodo de evaluaciones parciales', 'evaluaciones', '2027-03-31', '2027-04-07'),
  ('recuperacion-2027-04', 'Evaluación de recuperación', 'evaluaciones', '2027-04-08', '2027-04-13'),
  ('ego-2027-04', 'Examen General Ordinario (EGO)', 'evaluaciones', '2027-04-14', '2027-04-15'),
  ('inscripcion-2027-04', 'Periodo de inscripción y reinscripción', 'inscripciones', '2027-04-22', '2027-04-28'),
  ('fin-2027-1', 'Fin de cuatrimestre 2027-1', 'cuatrimestres', '2027-04-30', '2027-04-30');
