# Dragones Maps

Mapa web público para orientarse dentro del campus de la Universidad Tecnológica Fidel Velázquez. Incluye búsqueda tolerante a acentos, filtros por categoría, fichas oficiales, ubicación opcional, panorámicas propias, calendario, directorio, cuentas opcionales y recordatorios académicos locales y con Supabase.

## Ejecutar localmente

Los módulos JavaScript necesitan un servidor local; no abras los HTML con doble clic.

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Después visita `http://127.0.0.1:4173/`.

## Estructura

```text
Dragones-Maps-main/
├─ index.html                     Mapa principal
├─ Inicio.html                    Portada y estado de sesión
├─ InicioIniciarSesion.html       Acceso
├─ InicioCrearCuenta.html         Registro
├─ RestablecerPassword.html       Nueva contraseña después de recuperar la cuenta
├─ calendario.html
├─ directorio.html
├─ push-sw.js                     Recepción Web Push en segundo plano
├─ NOTIFICACIONES.md              Operación de los recordatorios
├─ supabase/
│  ├─ migrations/                 Tablas, RLS, calendario y tarea diaria
│  └─ functions/                  Envío seguro de Web Push
├─ assets/
│  ├─ css/                        Estilos por sección
│  ├─ data/places.js              Fuente central de lugares
│  ├─ js/                         Mapa, búsqueda, cuenta y componentes
│  └─ images/
│     ├─ branding/                Logotipos e icono oficial
│     ├─ panoramas/               Panorámicas públicas identificadas
│     ├─ places/                  Originales y fotografías WebP
│     └─ archive/                 Panorámicas y calendarios anteriores conservados
└─ vendor/                        Leaflet y Pannellum locales
```

Los HTML permanecen en la raíz para conservar enlaces simples y compatibilidad con GitHub Pages. `InicioInciarSesion.html` solo mantiene compatibilidad con la dirección antigua mal escrita y redirige al archivo correcto.

## Lugares y panorámicas

`assets/data/places.js` contiene 26 ubicaciones públicas. Los edificios C a P usan los nombres oficiales proporcionados, junto con alias cortos para búsqueda. Centro de Investigación se unificó con CCAI; Biblioteca, Canchas, CCAI, Rectoría, Salones de Idiomas, La Velaria y la conexión D–E ya están georreferenciados.

Las 23 vistas panorámicas disponibles se encuentran en `assets/images/panoramas`. Cuando un lugar tiene más de una vista, la ficha muestra un botón para cada una. Las versiones sustituidas se conservan en `assets/images/archive` y no se cargan públicamente.

El calendario escolar 2026–2027 se genera como HTML adaptable desde `assets/js/calendar.js`. Las tres imágenes anteriores se conservan únicamente en `assets/images/archive/calendars-old`.

## Supabase

La aplicación usa Supabase Auth por correo y contraseña. El perfil mínimo se guarda en `public.profiles` y contiene `nombre`, `correo` y las fechas de creación y actualización. Las contraseñas se administran exclusivamente mediante Supabase Auth.

Todas las tablas personales tienen Row Level Security. Cada estudiante solo puede consultar o cambiar su perfil, preferencias y dispositivos. El calendario es público y solo el servidor puede modificarlo.

Los recordatorios automáticos son optativos. La app solicita permiso únicamente al pulsar **Activar recordatorios**, registra la suscripción Web Push y conserva preferencias por categoría y anticipación. La Edge Function `send-academic-reminders` se ejecuta diariamente a las 08:00, hora de Ciudad de México, mediante Supabase Cron.

La campana también muestra a cualquier visitante los periodos en curso y las fechas de los siguientes 30 días. Estos avisos locales no requieren cuenta ni permisos y muestran una alerta discreta una vez al día por dispositivo. Su fuente se encuentra en `assets/data/academic-reminders.js`.

Los valores privados de Web Push y de la tarea programada están cifrados en Supabase y no se guardan en el repositorio. Consulta `NOTIFICACIONES.md` para mantenimiento y verificación.

## Tecnologías

HTML, CSS y JavaScript; Leaflet 1.9.4 con OpenStreetMap; Pannellum 2.5.7; Supabase JavaScript 2.112.3; Web Push estándar.
