create or replace function private.sync_auth_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  display_name text;
begin
  if coalesce(new.is_anonymous, false) then
    return new;
  end if;

  display_name := coalesce(
    nullif(btrim(new.raw_user_meta_data->>'nombre'), ''),
    nullif(btrim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data->>'name'), ''),
    nullif(btrim(split_part(coalesce(new.email, ''), '@', 1)), '')
  );

  if display_name is null or char_length(display_name) < 2 then
    display_name := 'Estudiante';
  end if;

  insert into public.profiles (id, nombre, correo, creado_en)
  values (
    new.id,
    left(display_name, 100),
    coalesce(new.email, ''),
    coalesce(new.created_at, now())
  )
  on conflict (id) do update
    set correo = excluded.correo;

  return new;
end;
$$;

revoke all on function private.sync_auth_profile() from public, anon, authenticated;
