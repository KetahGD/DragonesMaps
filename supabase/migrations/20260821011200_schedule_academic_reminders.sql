create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

select cron.schedule(
  'send-academic-reminders-daily',
  '0 14 * * *',
  $job$
  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'dragonesmaps_project_url'
    ) || '/functions/v1/send-academic-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'dragonesmaps_publishable_key'
      ),
      'x-cron-secret', (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'dragonesmaps_cron_secret'
      )
    ),
    body := jsonb_build_object(
      'source', 'pg_cron',
      'scheduled_at', now()
    ),
    timeout_milliseconds := 30000
  ) as request_id;
  $job$
);
