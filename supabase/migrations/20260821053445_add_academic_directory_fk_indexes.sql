create index profiles_career_id_idx
  on public.profiles (career_id)
  where career_id is not null;

create index academic_directory_entries_career_id_idx
  on public.academic_directory_entries (career_id);

create index academic_directory_entries_reviewer_idx
  on public.academic_directory_entries (revisado_por)
  where revisado_por is not null;
