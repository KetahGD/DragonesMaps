drop index if exists public.profiles_career_id_idx;

create index profiles_career_level_idx
  on public.profiles (career_id, nivel)
  where career_id is not null;
