# Repository Guidelines

## Project Structure & Module Organization
- `app.py` expone la app Flask y enruta vistas hacia plantillas Jinja.
- `templates/` aloja vistas por dominio (`admin/`, `empresa/`, `errors/`) reutilizando `base.html`.
- `static/css` contiene `input.css` base de Tailwind y el `output.css` compilado; `static/js` agrupa controladores Vanilla JS por feature (auth, dashboards, animaciones).
- `utils/` centraliza configuración (`config.py`) y el cliente HTTP (`api_client.py`).
- `logs/` se monta al contenedor para conservar trazas; mantén archivos rotados y livianos.

## Build, Test, and Development Commands
- Configura el entorno: `python -m venv .venv && source .venv/bin/activate` seguido de `pip install -r requirements.txt`.
- Compila Tailwind en desarrollo con `npm install` y `npm run dev`; usa `npm run build` para assets minificados previos a un release.
- Levanta la app localmente con `python app.py` (escucha en `http://localhost:5050`).
- Entorno contenedorizado: `npm run docker:build` + `docker compose up -d` reutiliza el `Dockerfile` multi-stage.

## Coding Style & Naming Conventions
- Python sigue PEP 8 con indentación de 4 espacios; documenta helpers con docstrings y mantiene cadenas en español como en el resto del código.
- JavaScript en `static/js` prioriza clases y módulos IIFE; usa nombres descriptivos en `kebab-case` para archivos y `camelCase` para funciones.
- Tailwind: extiende tokens en `tailwind.config.js`; evita CSS manual salvo utilidades pequeñas en `input.css`.
- Plantillas Jinja deben apoyarse en bloques desde `base.html` y limitar lógica a condicionales simples.

## Testing Guidelines
- Aún no existe suite automatizada; agrega pruebas con `pytest` bajo `tests/` replicando la estructura de `utils/` y vistas críticas.
- Nombra archivos `test_<modulo>.py` y cubre integración ligera consultando rutas con `flask.testing.FlaskClient`.
- Ejecuta `pytest` antes de abrir PR y adjunta cobertura o justifica huecos si no aplica.

## Commit & Pull Request Guidelines
- El historial usa mensajes cortos en español (`mejoras en colores`); continúa en modo imperativo, mencionando la feature principal y contexto breve.
- Cada PR debe incluir: resumen funcional, variables de entorno requeridas, pasos de prueba manual y capturas cuando cambie UI.
- Vincula issues o tareas y solicita revisión de quien tocó la vista/API más reciente.

## Configuration & Security Tips
- Gestiona secretos vía `.env` (e.g. `BACKEND_API_URL`, `SECRET_KEY`, `WEBSOCKET_URL`); nunca los subas al repo.
- Ejecuta `python utils/config.py` tras cambios de entorno para validar que las variables obligatorias estén presentes.
- Mantén `SESSION_COOKIE_SECURE` activo en producción y valida CORS actualizando `CORS_ORIGINS`.
