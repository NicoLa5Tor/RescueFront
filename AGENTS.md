# Repository Guidelines

## Project Structure & Module Organization
Mantén `app.py` como punto de entrada ligero: solo define rutas y delega lógica a helpers en `utils/` (por ejemplo, `utils/config.py` centraliza variables de entorno y validaciones). Las vistas HTML residen en `templates/` siguiendo sus rutas (`templates/admin`, `templates/errors`), mientras que los assets viven en `static/`. Edita Tailwind en `static/css/input.css`, compila a `static/css/output.css`, y coloca bitácoras rotables en `logs/`. Un patrón mínimo de carpetas luce así:

```
app.py
utils/
static/css/
templates/
logs/
```

## Build, Test, and Development Commands
`python app.py` levanta el servidor en `http://localhost:5050`, cargando `.env` antes de validar claves obligatorias. Ejecuta `npm run dev` para observar cambios de Tailwind y regenerar `static/css/output.css` al vuelo. `npm run build` produce CSS minimizado para despliegues. Usa `docker compose up --build frontend` cuando necesites reproducir el entorno con assets montados y variables aprobadas.

## Coding Style & Naming Conventions
Python sigue PEP 8: identado de 4 espacios, funciones y módulos en `snake_case`, clases en `PascalCase`. JavaScript emplea módulos ES6, nombres `camelCase` en métodos y textos en español para coherencia UI. Agrupa utilidades de Tailwind en el orden layout → color → motion; documenta combinaciones inusuales con un comentario breve. Consume configuraciones siempre vía `utils/config.py`, nunca con `os.getenv` directo en vistas o templates.

## Testing Guidelines
No existe suite automatizada; realiza smoke tests manuales para login, dashboards y flujos CRUD de admin antes de cualquier push. Usa la ruta `/test-login` y los scripts de `static/js/debug/` para reproducir problemas de autenticación o modales. Documenta navegador, rol y resultado dentro de la descripción del PR.

## Commit & Pull Request Guidelines
Redacta commits con sujetos breves en español y en presente (`ajusto tipografías`, `refactor menú`). Divide cambios por tema: Tailwind, templates y utilidades Python van en commits separados. Cada PR debe incluir resumen, issue vinculado, capturas o clips para cambios UI, y mencionar nuevas variables o scripts. Avise a los reviewers de frontend y backend al tocar `utils/api_client.py` o cualquier flujo de autenticación.

## Security & Configuration Tips
Mantén `.env` fuera del repositorio; define ahí `BACKEND_API_URL`, `SECRET_KEY` y contactos críticos. Realiza peticiones HTTP a través de `g.api_client` para conservar cookies y prefijos del proxy. Antes de compartir logs, elimina o redacta secretos y tokens temporales.
