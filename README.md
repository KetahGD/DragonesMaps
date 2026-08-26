# Dragones Maps

Mapa web público para orientarse dentro del campus de la Universidad Tecnológica Fidel Velázquez. Incluye búsqueda tolerante a acentos, filtros por categoría, fichas oficiales, ubicación opcional, panorámicas propias, calendario, directorio, recordatorios locales y un organizador que permanece en el dispositivo.

La aplicación no tiene registro, inicio de sesión, perfiles ni sincronización de datos personales.

## Ejecutar localmente

Los módulos JavaScript necesitan un servidor local; no abras los HTML con doble clic.

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Después visita `http://127.0.0.1:4173/`.

## Estructura

```text
Dragones-Maps-main/
├─ Inicio.html                    Portada y preferencias locales
├─ index.html                    Mapa principal
├─ calendario.html               Calendario escolar adaptable
├─ directorio.html               Directorio y accesos útiles
├─ organizador.html              Horarios, tareas y eventos locales
├─ push-sw.js                    Modo offline y avisos del dispositivo
├─ NOTIFICACIONES.md             Funcionamiento de los recordatorios
├─ assets/
│  ├─ css/                       Estilos por sección
│  ├─ data/                      Lugares, directorio y fechas académicas
│  ├─ js/                        Interfaz, mapa y funciones locales
│  └─ images/                    Identidad, fotografías y panorámicas
└─ vendor/                       Leaflet y Pannellum locales
```

## Privacidad y almacenamiento

- No se solicitan ni almacenan correos, contraseñas, nombres o fotografías de perfil.
- Las preferencias de recordatorios se guardan en `localStorage`.
- El horario, las tareas y los eventos del organizador se guardan en `localStorage`.
- Borrar los datos del sitio o cambiar de dispositivo elimina esos datos; no existe copia en la nube.
- La ubicación se solicita únicamente al pulsar **Mi ubicación** y no se conserva.

## Recordatorios

La campana muestra periodos en curso y fechas próximas sin pedir permisos. Si el estudiante activa los avisos del sistema, la aplicación revisa las fechas al abrirse, al volver al primer plano y mientras permanece activa. Los navegadores no garantizan ejecución programada cuando una aplicación web está completamente cerrada; por eso el calendario y la campana siguen siendo la referencia principal.

La fuente local de fechas es `assets/data/academic-reminders.js`. Consulta `NOTIFICACIONES.md` para actualizarla y verificarla.

## Tecnologías

HTML, CSS y JavaScript; Leaflet 1.9.4 con OpenStreetMap; Pannellum 2.5.7; Service Worker, Notification API y almacenamiento local del navegador.
