revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "notification_deliveries_no_client_access"
on public.notification_deliveries
for all
to anon, authenticated
using (false)
with check (false);

create index notification_deliveries_event_idx
  on public.notification_deliveries (event_id);
