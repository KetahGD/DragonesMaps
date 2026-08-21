create table public.academic_careers (
  id text primary key,
  nivel text not null check (nivel in ('tsu', 'licenciatura', 'ingenieria')),
  nombre text not null check (char_length(btrim(nombre)) between 2 and 160),
  orden smallint not null,
  active boolean not null default true,
  unique (nivel, nombre)
);

alter table public.academic_careers enable row level security;
revoke all on public.academic_careers from anon, authenticated;
grant select on public.academic_careers to anon, authenticated;

create policy "academic_careers_read_public"
on public.academic_careers for select
to anon, authenticated
using (active = true);

insert into public.academic_careers (id, nivel, nombre, orden) values
  ('tsu-capital-humano', 'tsu', 'Gestión del Capital Humano', 10),
  ('tsu-emprendimiento-proyectos', 'tsu', 'Emprendimiento, Formulación y Evaluación de Proyectos', 20),
  ('tsu-mercadotecnia', 'tsu', 'Mercadotecnia', 30),
  ('tsu-contaduria', 'tsu', 'Contaduría', 40),
  ('tsu-diseno-animacion-digital', 'tsu', 'Diseño y Animación Digital', 50),
  ('tsu-ciencias-datos', 'tsu', 'Ciencias de Datos', 60),
  ('tsu-biotecnologia', 'tsu', 'Biotecnología', 70),
  ('tsu-transporte-movilidad', 'tsu', 'Transporte y Movilidad', 80),
  ('tsu-cadena-suministro', 'tsu', 'Cadena de Suministro', 90),
  ('tsu-automotriz', 'tsu', 'Automotriz', 100),
  ('tsu-mantenimiento-industrial', 'tsu', 'Mantenimiento Industrial', 110),
  ('tsu-manufactura-flexible', 'tsu', 'Sistemas de Manufactura Flexible', 120),
  ('tsu-desarrollo-software', 'tsu', 'Desarrollo de Software Multiplataforma', 130),
  ('tsu-redes-digitales', 'tsu', 'Infraestructura de Redes Digitales', 140),
  ('tsu-nanotecnologia', 'tsu', 'Nanotecnología', 150),
  ('tsu-gestion-ambiental', 'tsu', 'Gestión Ambiental', 160),
  ('lic-administracion', 'licenciatura', 'Administración', 210),
  ('lic-negocios-mercadotecnia', 'licenciatura', 'Negocios y Mercadotecnia', 220),
  ('lic-contaduria', 'licenciatura', 'Contaduría', 230),
  ('lic-diseno-produccion-audiovisual', 'licenciatura', 'Diseño Digital y Producción Audiovisual', 240),
  ('lic-enfermeria', 'licenciatura', 'Enfermería', 250),
  ('lic-terapia-fisica', 'licenciatura', 'Terapia Física', 260),
  ('ing-datos-inteligencia-artificial', 'ingenieria', 'Datos e Inteligencia Artificial', 310),
  ('ing-biotecnologia', 'ingenieria', 'Biotecnología', 320),
  ('ing-logistica', 'ingenieria', 'Logística', 330),
  ('ing-industrial', 'ingenieria', 'Industrial', 340),
  ('ing-mantenimiento-industrial', 'ingenieria', 'Mantenimiento Industrial', 350),
  ('ing-mecatronica', 'ingenieria', 'Mecatrónica', 360),
  ('ing-ti-innovacion-digital', 'ingenieria', 'Tecnologías de la Información e Innovación Digital', 370),
  ('ing-nanotecnologia', 'ingenieria', 'Nanotecnología', 380),
  ('ing-ambiental-sustentabilidad', 'ingenieria', 'Ambiental y Sustentabilidad', 390);

alter table public.profiles
  add column avatar_path text,
  add column universidad text not null default 'Universidad Tecnológica Fidel Velázquez',
  add column career_id text references public.academic_careers (id),
  add column cuatrimestre smallint,
  add column edificio text;

alter table public.profiles
  add constraint profiles_avatar_path_own check (
    avatar_path is null or avatar_path = id::text || '/avatar'
  ),
  add constraint profiles_universidad_length check (
    char_length(btrim(universidad)) between 2 and 160
  ),
  add constraint profiles_cuatrimestre_range check (
    cuatrimestre is null or cuatrimestre between 1 and 12
  ),
  add constraint profiles_edificio_length check (
    edificio is null or char_length(edificio) <= 160
  );

revoke update on public.profiles from authenticated;
grant update (nombre, avatar_path, universidad, career_id, cuatrimestre, edificio)
  on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  false,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "profile_avatars_select_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "profile_avatars_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "profile_avatars_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "profile_avatars_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create or replace function private.is_directory_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users
    where id = (select auth.uid())
      and lower(coalesce(email, '')) = 'rolandosilvavique@gmail.com'
      and coalesce(is_anonymous, false) is false
  );
$$;

revoke all on function private.is_directory_admin() from public, anon, authenticated, service_role;

create table public.academic_directory_entries (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(btrim(nombre)) between 2 and 140),
  career_id text not null references public.academic_careers (id),
  correo_institucional text not null check (
    lower(btrim(correo_institucional)) ~ '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@utfv[.]edu[.]mx$'
  ),
  enviado_por uuid not null references auth.users (id) on delete cascade,
  estado text not null default 'pending' check (estado in ('pending', 'approved', 'rejected')),
  revisado_por uuid references auth.users (id) on delete set null,
  revisado_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint academic_directory_review_consistency check (
    (estado = 'pending' and revisado_por is null and revisado_en is null)
    or (estado in ('approved', 'rejected') and revisado_por is not null and revisado_en is not null)
  )
);

create index academic_directory_entries_submitter_idx
  on public.academic_directory_entries (enviado_por, creado_en desc);

create index academic_directory_entries_status_career_idx
  on public.academic_directory_entries (estado, career_id, nombre);

create unique index academic_directory_entries_approved_email_idx
  on public.academic_directory_entries (lower(correo_institucional))
  where estado = 'approved';

alter table public.academic_directory_entries enable row level security;
revoke all on public.academic_directory_entries from anon, authenticated;
grant select on public.academic_directory_entries to authenticated;
grant insert (nombre, career_id, correo_institucional, enviado_por)
  on public.academic_directory_entries to authenticated;
grant update (estado, revisado_por, revisado_en)
  on public.academic_directory_entries to authenticated;

create policy "academic_directory_select_allowed"
on public.academic_directory_entries for select
to authenticated
using (
  estado = 'approved'
  or enviado_por = (select auth.uid())
  or (select private.is_directory_admin())
);

create policy "academic_directory_submit_own"
on public.academic_directory_entries for insert
to authenticated
with check (
  enviado_por = (select auth.uid())
  and estado = 'pending'
  and revisado_por is null
  and revisado_en is null
);

create policy "academic_directory_admin_review"
on public.academic_directory_entries for update
to authenticated
using ((select private.is_directory_admin()))
with check (
  (select private.is_directory_admin())
  and estado in ('approved', 'rejected')
  and revisado_por = (select auth.uid())
  and revisado_en is not null
);

create trigger academic_directory_entries_set_updated_at
before update on public.academic_directory_entries
for each row execute function private.set_updated_at();
