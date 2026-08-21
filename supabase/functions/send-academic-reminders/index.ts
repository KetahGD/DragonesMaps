import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.7";
import webpush from "npm:web-push@3.6.7";

type CalendarEvent = {
  id: string;
  titulo: string;
  categoria: string;
  fecha_inicio: string;
  fecha_fin: string;
};

type Preferences = {
  user_id: string;
  active: boolean;
  categories: string[];
  lead_days: number[];
};

type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
  expiration_time: number | null;
};

const VALID_LEAD_DAYS = new Set([0, 1, 3, 7]);
const TIME_ZONE = "America/Mexico_City";

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  if (leftBytes.length !== rightBytes.length) return false;
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }
  return difference === 0;
}

function localDateKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function differenceInDays(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

function messageFor(event: CalendarEvent, days: number): string {
  if (days === 0) return `Hoy inicia: ${event.titulo}. Consulta los detalles en el calendario.`;
  if (days === 1) return `Mañana inicia: ${event.titulo}. Consulta los detalles en el calendario.`;
  return `Faltan ${days} días para ${event.titulo}. Consulta los detalles en el calendario.`;
}

function deliveryKey(subscriptionId: string, eventId: string, days: number): string {
  return `${subscriptionId}:${eventId}:${days}`;
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
  }

  const configuredCronSecret = requiredEnv("CRON_SECRET");
  const receivedCronSecret = request.headers.get("x-cron-secret") ?? "";
  if (!constantTimeEqual(receivedCronSecret, configuredCronSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const sql = postgres(requiredEnv("SUPABASE_DB_URL"), { prepare: false });

  webpush.setVapidDetails(
    Deno.env.get("WEB_PUSH_SUBJECT") || "https://ketangd.github.io",
    requiredEnv("WEB_PUSH_PUBLIC_KEY"),
    requiredEnv("WEB_PUSH_PRIVATE_KEY")
  );

  const today = localDateKey();
  const [events, preferences, subscriptions] = await Promise.all([
    sql<CalendarEvent[]>`
      select id, titulo, categoria, fecha_inicio::text, fecha_fin::text
      from public.calendar_events
      where fecha_inicio >= ${today}::date
    `,
    sql<Preferences[]>`
      select user_id, active, categories, lead_days
      from public.notification_preferences
      where active = true
    `,
    sql<PushSubscriptionRow[]>`
      select id, user_id, endpoint, p256dh, auth_key, expiration_time
      from public.push_subscriptions
      where active = true
    `
  ]);

  const upcoming = events
    .map((event) => ({ event, days: differenceInDays(today, event.fecha_inicio) }))
    .filter(({ days }) => VALID_LEAD_DAYS.has(days));

  if (!upcoming.length || !subscriptions.length) {
    await sql.end({ timeout: 2 });
    return Response.json({ today, events: upcoming.length, subscriptions: subscriptions.length, sent: 0 });
  }

  const deliveries = await sql<Array<{ subscription_id: string; event_id: string; lead_days: number }>>`
    select subscription_id, event_id, lead_days
    from public.notification_deliveries
  `;

  const preferencesByUser = new Map(
    preferences.map((item) => [item.user_id, item])
  );
  const delivered = new Set(
    deliveries.map((item) => deliveryKey(item.subscription_id, item.event_id, item.lead_days))
  );

  let sent = 0;
  let removed = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    const preference = preferencesByUser.get(subscription.user_id);
    if (!preference) continue;

    for (const { event, days } of upcoming) {
      if (!preference.categories.includes(event.categoria) || !preference.lead_days.includes(days)) continue;
      const key = deliveryKey(subscription.id, event.id, days);
      if (delivered.has(key)) continue;

      try {
        await webpush.sendNotification({
          endpoint: subscription.endpoint,
          expirationTime: subscription.expiration_time,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth_key }
        }, JSON.stringify({
          title: "Recordatorio académico",
          body: messageFor(event, days),
          eventId: event.id,
          url: "calendario.html"
        }), {
          TTL: 86_400,
          urgency: days <= 1 ? "high" : "normal"
        });

        await sql`
          insert into public.notification_deliveries (subscription_id, event_id, lead_days)
          values (${subscription.id}::uuid, ${event.id}, ${days})
          on conflict (subscription_id, event_id, lead_days) do nothing
        `;
        delivered.add(key);
        sent += 1;
      } catch (error) {
        const statusCode = Number((error as { statusCode?: number }).statusCode ?? 0);
        if (statusCode === 404 || statusCode === 410) {
          await sql`delete from public.push_subscriptions where id = ${subscription.id}::uuid`;
          removed += 1;
          break;
        }
        failed += 1;
        console.error("Web Push delivery failed", { subscriptionId: subscription.id, eventId: event.id, statusCode });
      }
    }
  }

  await sql.end({ timeout: 2 });
  return Response.json({ today, events: upcoming.length, subscriptions: subscriptions.length, sent, removed, failed });
});
