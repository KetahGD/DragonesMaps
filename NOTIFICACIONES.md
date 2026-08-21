# Recordatorios académicos con Supabase y Web Push

El sistema está configurado en el proyecto Supabase `DragonesMaps`. No necesita Firebase ni una cuenta de facturación de Google.

## Qué incluye

- Consentimiento explícito desde `Inicio.html#notificaciones`.
- Preferencias por categoría y anticipación (7, 3, 1 o 0 días).
- Registro individual de cada navegador en `public.push_subscriptions`.
- Recepción en primer plano y en segundo plano mediante `push-sw.js`.
- Función `send-academic-reminders`, ejecutada diariamente a las 08:00, hora de Ciudad de México.
- Eliminación de suscripciones inválidas y registro de entregas para evitar duplicados.
- Avisos locales para visitantes que todavía no han iniciado sesión.

## Componentes

- `supabase/migrations/20260821005339_migrate_firebase_to_supabase.sql`: tablas, datos del calendario, permisos y políticas RLS.
- `supabase/migrations/20260821011200_schedule_academic_reminders.sql`: ejecución diaria con `pg_cron` y `pg_net`.
- `supabase/functions/send-academic-reminders/index.ts`: selección y envío de recordatorios.
- `assets/js/notifications.js`: consentimiento, preferencias y alta del dispositivo.
- `push-sw.js`: presentación de notificaciones cuando la página está en segundo plano.

## Seguridad

- Las claves privadas están cifradas como secretos de Edge Functions y de Vault; nunca deben copiarse al JavaScript público.
- Las tablas personales usan RLS por `auth.uid()`.
- La función exige un JWT válido y un secreto adicional enviado únicamente por la tarea programada.
- El permiso del navegador solo se solicita por una acción explícita del estudiante.

## Verificación periódica

1. Confirmar que la tarea `send-academic-reminders-daily` siga activa en **Integrations → Cron**.
2. Revisar el historial de la tarea y los registros de la Edge Function si un envío falla.
3. Comprobar que `calendar_events` contenga el calendario vigente antes de iniciar un nuevo ciclo escolar.
4. Probar en HTTPS con una cuenta autorizada y un navegador compatible; los archivos abiertos directamente desde disco no pueden registrar un Service Worker.
5. Rotar las claves Web Push únicamente si se pueden volver a registrar los dispositivos, ya que las suscripciones actuales dejarían de ser válidas.
