# Repository Guidelines

## Project Structure & Module Organization
Usa `app.py` únicamente como orquestador de rutas ligeras; delega validaciones, carga de variables y lógica de negocio en utilidades bajo `utils/` (por ejemplo, `utils/config.py` y `utils/api_client.py`). Mantén vistas y parciales organizados en `templates/`, siguiendo subdirectorios como `templates/admin` y `templates/errors`. Coloca assets en `static/`: Tailwind parte de `static/css/input.css` y se compila a `static/css/output.css`; los scripts de depuración viven en `static/js/debug/`. Conserva bitácoras rotables en `logs/` y mantén `.env` fuera del repositorio con todas las claves obligatorias.

## Build, Test, and Development Commands
- `python app.py`: levanta el servidor en `http://localhost:5050`, carga `.env` y valida `BACKEND_API_URL`, `SECRET_KEY` y demás claves.
- `npm run dev`: mira cambios en `static/css/input.css` y recompila Tailwind en caliente para desarrollo.
- `npm run build`: produce `static/css/output.css` minimizado, listo para despliegues.
- `docker compose up --build frontend`: recrea el entorno completo con assets montados y variables aprobadas.

## Coding Style & Naming Conventions
Aplica PEP 8 en Python: indentación de 4 espacios, funciones y módulos en `snake_case`, clases en `PascalCase`, constantes en mayúsculas. En JavaScript usa módulos ES6, nombres `camelCase` y textos de UI en español. Ordena utilidades de Tailwind siguiendo layout → color → motion y comenta combinaciones fuera de lo habitual. Obtén configuraciones solo mediante `utils/config.py`; evita `os.getenv` directo en rutas o templates.

## Testing Guidelines
No hay suite automatizada: realiza smoke tests manuales sobre login, dashboards y CRUD de admin antes de cada push. Usa `/test-login` y los scripts de `static/js/debug/` para reproducir incidencias. Documenta navegador, rol ejercido y resultado en el PR.

## Commit & Pull Request Guidelines
Redacta commits en español, en presente y con sujeto breve (ej.: `ajusto tipografías`). Agrupa cambios por tema: estilos Tailwind, templates Jinja y utilidades Python deben ir separados. Cada PR requiere resumen, issue vinculado, evidencias visuales de cambios UI y mención de nuevas variables o scripts. Notifica a reviewers de frontend y backend al modificar `utils/api_client.py` o flujos de autenticación.

## Security & Configuration Tips
Resguarda secretos en `.env` y no compartas logs con tokens sin anonimizar. Realiza peticiones HTTP mediante `g.api_client` para mantener cookies y proxies. Antes de publicar artefactos, verifica que `static/css/output.css` sea la versión compilada y libre de configuraciones experimentales.
