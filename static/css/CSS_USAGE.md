# CSS Usage Documentation

## Archivos CSS Activos y su Uso

### Core Files (Siempre necesarios)
- `main.css` - Estilos globales base
- `animations.css` - Animaciones optimizadas

### Dashboard Files (Solo para admin dashboard)
- `dashboard/variables.css` - Variables CSS del dashboard
- `dashboard/base.css` - Estilos base del dashboard
- `dashboard/main-layout.css` - Layout principal
- `dashboard/navbar.css` - Barra de navegación
- `dashboard/sidebar.css` - Barra lateral
- `dashboard/animations.css` - Animaciones específicas del dashboard
- `dashboard/cards.css` - Tarjetas y componentes

### Page-Specific Files
- `login.css` - Solo para página de login
- `index.css` - Solo para página principal
- `modals.css` - Para páginas que usan modales

### GSAP Files (Solo si la página los necesita)
⚠️ **ATENCIÓN**: Estos archivos solo deben cargarse si la página específica los utiliza
- `gsap_css/hero.css` - Solo para hero sections con GSAP
- `gsap_css/tunnel.css` - Solo para efectos tunnel
- `gsap_css/contact.css` - Solo para página de contacto
- `gsap_css/clamp.css` - Solo para efectos clamp

## Optimizaciones Aplicadas

### 1. Animaciones Shimmer
- ✅ **ANTES**: Shimmer constante en todas las tarjetas
- ✅ **DESPUÉS**: Shimmer solo en hover

### 2. Carga de GSAP
- ✅ **ANTES**: GSAP cargado en todas las páginas
- ✅ **DESPUÉS**: GSAP solo cuando es necesario

### 3. Animaciones Infinitas
- ✅ **ANTES**: Múltiples animaciones infinitas corriendo
- ✅ **DESPUÉS**: Animaciones infinitas solo para loading states

### 4. Performance en Móviles
- ✅ **DESPUÉS**: Animaciones reducidas en dispositivos móviles
- ✅ **DESPUÉS**: Respeta preferencias de movimiento reducido

## Recomendaciones de Performance

1. **No cargar GSAP** en el dashboard admin
2. **Usar shimmer solo en hover** para las tarjetas
3. **Aplicar clase `.mobile-no-animations`** en containers móviles
4. **Usar `.gpu-accelerated`** solo para animaciones pesadas
5. **Remover clases de animación** después de completarse

## Archivos que Pueden Eliminarse (Si no se usan)

- `gsap_css/*` - Si no hay páginas con GSAP activo
- `login.css` - Si se usa un sistema de auth externo
- `index.css` - Si no hay landing page
