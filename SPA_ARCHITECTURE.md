# SPA Architecture (Empresa)

Objetivo: mantener `navbar` y `sidebar` estaticos y cargar el contenido de vistas dentro de un contenedor SPA, sin recargar la pagina.

## Estructura propuesta

templates/empresa/spa/
  shell.html          - estructura estatica (navbar + sidebar + contenedor)
  container.html      - wrapper del contenedor SPA
  views/
    dashboard.html    - vista dashboard
    usuarios.html     - vista usuarios
    hardware.html     - vista hardware
    stats.html        - vista estadisticas
    alertas.html      - vista alertas

static/js/portal-empresa/spa/
  router.js           - router SPA y montaje de vistas
  store.js            - estado compartido del SPA
  api.js              - wrapper de endpoints (usa __buildApiUrl)
  views/
    dashboard.js      - init/mount de dashboard
    usuarios.js       - init/mount de usuarios
    hardware.js       - init/mount de hardware
    stats.js          - init/mount de stats
    alertas.js        - init/mount de alertas

## Reglas

- El shell (navbar + sidebar) no cambia entre vistas.
- Solo cambia el contenido del contenedor `[data-empresa-spa]`.
- Cada vista tiene:
  - Template HTML en `templates/empresa/spa/views/`.
  - JS de montaje en `static/js/portal-empresa/spa/views/`.
- El router decide que vista mostrar y actualiza el contenedor.
- El store guarda estado cross-view (ej. empresaId, filtros).
- `api.js` centraliza llamadas a backend (no usar fetch directo en vistas).

## Integracion en templates

- `templates/empresa/dashboard.html` (base) monta el contenedor SPA.
- El router se inicializa despues de cargar el shell.
- Cada link de navegación usa `data-spa-view="<view>"`.

## Flujo

1) Router detecta la vista inicial.
2) Renderiza template en el contenedor.
3) Llama al init de la vista correspondiente.
4) Si la vista se desmonta, debe limpiar listeners y timers propios.

## Convenciones de nombres

- `view` = nombre de vista (dashboard, usuarios, hardware, stats, alertas).
- Template id: `empresa-view-<view>`.
- Metodo de montaje: `initEmpresa<CapView>()` o `views/<view>.js` export.

## Proximo paso

- Crear `templates/empresa/spa/views/dashboard.html`.
- Crear `static/js/portal-empresa/spa/router.js`.
- Montar el dashboard como primera vista.
