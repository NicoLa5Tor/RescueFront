# Repository Guidelines

## Project Structure & Module Organization
- `app.py` arranca el servidor Flask; mantiene las rutas livianas y mueve lógica compartida a `utils/` (p. ej., `utils/config.py` para variables de entorno).
- Vistas HTML viven en `templates/` con subcarpetas que siguen la ruta (`templates/admin`, `templates/errors`).
- Assets estáticos residen en `static/`; Tailwind se edita en `static/css/input.css` y su salida se genera en `static/css/output.css`.
- Coloca logs en `logs/` y rota o redáctalos antes de subirlos.

## Build, Test, and Development Commands
- `python app.py` levanta la app en `http://localhost:5050` cargando `.env` para que `utils/config.py` valide claves requeridas.
- `npm run dev` observa cambios en Tailwind y recompila `static/css/output.css` durante el desarrollo UI.
- `npm run build` genera el CSS minimizado listo para producción.
- `docker compose up --build frontend` reproduce el entorno con assets montados y variables de `.env`.

## Coding Style & Naming Conventions
- Python usa identado de 4 espacios y nombres `snake_case`; clases en `PascalCase` según PEP 8.
- JavaScript sigue módulos ES6, métodos `camelCase` y nombres en español coherentes con la interfaz.
- Agrupa utilidades Tailwind como layout → color → motion; documenta combinaciones atípicas con comentarios breves.
- Consume configuraciones vía `utils/config.py`; evita `os.getenv` directo en vistas o templates.

## Testing Guidelines
- No hay suite automatizada; realiza smoke tests de login, dashboards y flujos CRUD admin en navegador antes de cualquier push.
- Usa `/test-login` y `static/js/debug/` para reproducir problemas de autenticación o modales.
- Registra en la descripción del PR el navegador, rol y resultado de cada prueba manual.

## Commit & Pull Request Guidelines
- Mensajes de commit deben ser sujetos concisos en español y en presente (`mejoras en colores`, `refactor navegación`).
- Divide cambios por tema: Tailwind, templates y helpers Python van en commits separados.
- PRs requieren resumen, issue asociado, capturas o clips para cambios UI, y mención de nuevas variables o scripts.
- Notifica a reviewers de frontend y backend cuando edites `utils/api_client.py` o flujos de autenticación.

## Security & Configuration Tips
- Mantén `.env` fuera del repositorio; incluye `BACKEND_API_URL`, `SECRET_KEY` y contactos.
- Haz peticiones API mediante `g.api_client` para preservar cookies y prefijos proxy.
- Depura logs antes de compartirlos; redacta secretos en issues y PRs.
