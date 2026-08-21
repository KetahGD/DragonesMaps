grant select on public.calendar_events to anon, authenticated;

create policy "calendar_events_read_public"
on public.calendar_events for select
to anon, authenticated
using (true);
