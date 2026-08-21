alter table public.academic_careers
  add constraint academic_careers_id_level_unique unique (id, nivel);

alter table public.profiles
  add column nivel text check (nivel is null or nivel in ('tsu', 'licenciatura', 'ingenieria')),
  add constraint profiles_career_level_match foreign key (career_id, nivel)
    references public.academic_careers (id, nivel);

revoke update on public.profiles from authenticated;
grant update (nombre, avatar_path, universidad, nivel, career_id, cuatrimestre, edificio)
  on public.profiles to authenticated;
