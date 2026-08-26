# Recordatorios académicos locales

El sistema funciona sin registro, inicio de sesión, base de datos de usuarios ni servicios push externos.

## Qué incluye

- Campana con fechas en curso y próximas en las páginas principales.
- Preferencias por categoría y anticipación: 7, 3, 1 o 0 días.
- Guardado exclusivo en el navegador del dispositivo.
- Aviso discreto dentro de la aplicación una vez al día.
- Notificaciones del sistema opcionales cuando la página se abre, vuelve al primer plano o permanece activa.
- Funcionamiento offline para páginas y recursos visitados.

## Limitación del navegador

Una aplicación web sin servidor push no puede garantizar avisos a una hora exacta cuando está totalmente cerrada. Dragones Maps comprueba los recordatorios al abrirse y durante su uso. Esta decisión evita almacenar identificadores del dispositivo o vincular avisos con una cuenta.

## Componentes

- `assets/data/academic-reminders.js`: fuente de fechas.
- `assets/js/reminder-preferences.js`: preferencias, filtros y control de avisos ya mostrados.
- `assets/js/notifications.js`: formulario de configuración y permiso explícito.
- `assets/js/local-notifications.js`: campana y notificaciones del sistema.
- `push-sw.js`: caché offline y apertura del calendario al tocar un aviso.

## Actualización del calendario

1. Actualizar primero el calendario visible.
2. Sincronizar las fechas relevantes en `assets/data/academic-reminders.js`.
3. Verificar categorías, rangos y títulos.
4. Probar al menos un evento temporal cercano cambiando la fecha únicamente en un entorno local.
5. Confirmar que la campana y la configuración funcionen con permisos concedidos y denegados.

## Privacidad

- El permiso de notificaciones se solicita solo al pulsar **Activar recordatorios**.
- No se registra una suscripción push ni un identificador de usuario.
- Las preferencias se eliminan al borrar los datos del sitio.
