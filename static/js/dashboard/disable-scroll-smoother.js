// ============ DESACTIVADOR DE SCROLLSMOOTHER PARA DASHBOARDS ============
// Este script desactiva GSAP ScrollSmoother en las vistas de dashboard
// para permitir que el scroll funcione correctamente en el área de contenido

(function() {
    'use strict';
    
    // ============ DETECTAR SI ESTAMOS EN UNA VISTA DE DASHBOARD ============
    function isDashboardView() {
        const currentPath = window.location.pathname;
        const dashboardPaths = [
            '/empresa/dashboard',
            '/admin/dashboard', 
            '/admin/super_admin_dashboard',
            '/empresa/hardware',
            '/empresa/usuarios',
            '/empresa/alertas',
            '/admin/empresas',
            '/admin/users',
            '/admin/hardware',
            '/admin/company_types'
        ];
        
        return dashboardPaths.some(path => currentPath.startsWith(path));
    }
    
    // ============ CONFIGURACIÓN PARA DASHBOARDS ============
    function configureDashboardLayout() {
        console.log('🏢 DASHBOARD: Configurando layout sin ScrollSmoother');
        
        // Desactivar ScrollSmoother si existe
        if (window.GSAPMain && window.GSAPMain.smoother) {
            try {
                window.GSAPMain.smoother.kill();
                window.GSAPMain.smoother = null;
                console.log('✅ DASHBOARD: ScrollSmoother desactivado');
            } catch (error) {
                console.log('⚠️ DASHBOARD: Error desactivando ScrollSmoother:', error);
            }
        }
        
        // Restaurar scroll normal del body
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        
        // Asegurar que los contenedores de GSAP no interfieran
        const gsapWrapper = document.getElementById('gsap-smoother-wrapper');
        const gsapContent = document.getElementById('gsap-smoother-content');
        
        if (gsapWrapper && gsapContent) {
            // Remover estilos de GSAP que puedan interferir
            gsapWrapper.style.overflow = '';
            gsapWrapper.style.position = '';
            gsapWrapper.style.height = '';
            
            gsapContent.style.overflow = '';
            gsapContent.style.position = '';
            gsapContent.style.transform = '';
            gsapContent.style.height = '';
            
            console.log('✅ DASHBOARD: Contenedores GSAP neutralizados');
        }
        
        // Aplicar estilos específicos para layout de dashboard
        applyDashboardStyles();
    }
    
    // ============ APLICAR ESTILOS DE DASHBOARD ============
    function applyDashboardStyles() {
        // Crear o actualizar estilos específicos para dashboard
        let dashboardStyles = document.getElementById('dashboard-layout-styles');
        if (!dashboardStyles) {
            dashboardStyles = document.createElement('style');
            dashboardStyles.id = 'dashboard-layout-styles';
            document.head.appendChild(dashboardStyles);
        }
        
        dashboardStyles.textContent = `
            /* ============ LAYOUT FIJO PARA DASHBOARDS ============ */
            
            /* Estructura principal */
            html, body {
                height: 100vh;
                overflow: hidden;
                margin: 0;
                padding: 0;
            }
            
            /* Contenedores GSAP no deben interferir */
            #gsap-smoother-wrapper,
            #gsap-smoother-content {
                height: 100vh !important;
                overflow: visible !important;
                position: static !important;
                transform: none !important;
            }
            
            /* Navbar fijo arriba */
            .navbar {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                z-index: 1000 !important;
                height: var(--navbar-height, 60px) !important;
            }
            
            /* Sidebar fijo a la izquierda */
            .sidebar {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                bottom: 0 !important;
                width: var(--sidebar-width-mobile, 280px) !important;
                z-index: 999 !important;
                overflow-y: auto !important;
            }
            
            @media (min-width: 1024px) {
                .sidebar {
                    width: var(--sidebar-width, 320px) !important;
                    transform: translateX(0) !important;
                }
            }
            
            /* Área de contenido principal - CON SCROLL PROPIO */
            .main-content {
                position: fixed !important;
                top: var(--navbar-height, 60px) !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                overflow-y: auto !important;
                overflow-x: hidden !important;
                padding: var(--space-6, 1.5rem) !important;
                -webkit-overflow-scrolling: touch !important;
            }
            
            @media (min-width: 1024px) {
                .main-content {
                    left: var(--sidebar-width, 320px) !important;
                }
            }
            
            /* Asegurar que el contenido interno no expanda la vista */
            .main-content > * {
                max-width: 100% !important;
                box-sizing: border-box !important;
            }
            
            /* Grids y contenido no deben expandir más allá del contenedor */
            .stats-grid,
            .charts-grid,
            .activity-grid,
            .quick-actions-grid,
            #statsGrid,
            #quickActionsGrid {
                width: 100% !important;
                max-width: 100% !important;
            }
            
            /* Cards no deben causar overflow horizontal */
            .glass-card,
            .ios-hardware-card,
            .ios-stat-card {
                max-width: 100% !important;
                box-sizing: border-box !important;
            }
            
            /* Tablas responsivas dentro del contenedor */
            .table-responsive {
                max-width: 100% !important;
                overflow-x: auto !important;
            }
            
            /* Debug: mostrar límites del contenedor */
            .debug-dashboard .main-content {
                border: 2px solid #ff0000 !important;
                background: rgba(255, 0, 0, 0.05) !important;
            }
        `;
        
        console.log('✅ DASHBOARD: Estilos de layout aplicados');
    }
    
    // ============ INTERCEPTAR GSAP SCROLLSMOOTHER ============
    function preventScrollSmootherCreation() {
        // Interceptar la creación de ScrollSmoother
        if (window.ScrollSmoother && window.ScrollSmoother.create) {
            const originalCreate = window.ScrollSmoother.create;
            
            window.ScrollSmoother.create = function(config) {
                if (isDashboardView()) {
                    console.log('🚫 DASHBOARD: ScrollSmoother.create() bloqueado en vista de dashboard');
                    return {
                        // Mock object para evitar errores
                        kill: () => {},
                        refresh: () => {},
                        scrollTo: () => {}
                    };
                }
                return originalCreate.call(this, config);
            };
            
            console.log('✅ DASHBOARD: ScrollSmoother.create() interceptado');
        }
    }
    
    // ============ OBSERVAR CAMBIOS EN GSAP MAIN ============
    function observeGSAPMain() {
        // Observar cuando GSAPMain se inicialice
        const checkGSAPMain = () => {
            if (window.GSAPMain && window.GSAPMain.init) {
                const originalInit = window.GSAPMain.init;
                
                window.GSAPMain.init = function() {
                    if (isDashboardView()) {
                        console.log('🏢 DASHBOARD: Interceptando inicialización de GSAPMain');
                        
                        // Llamar init original pero sin ScrollSmoother
                        const originalSmoother = window.GSAPMain.smoother;
                        window.GSAPMain.smoother = null;
                        
                        // Ejecutar init
                        originalInit.call(this);
                        
                        // Asegurar que no se cree ScrollSmoother
                        if (this.smoother) {
                            this.smoother.kill();
                            this.smoother = null;
                        }
                        
                        // Configurar layout
                        setTimeout(() => configureDashboardLayout(), 100);
                        
                        return;
                    }
                    
                    // En páginas normales (index), permitir funcionamiento normal
                    return originalInit.call(this);
                };
            }
        };
        
        // Verificar inmediatamente
        checkGSAPMain();
        
        // Verificar cuando GSAPMain esté disponible
        const interval = setInterval(() => {
            if (window.GSAPMain) {
                checkGSAPMain();
                clearInterval(interval);
            }
        }, 50);
        
        // Limpiar después de 5 segundos
        setTimeout(() => clearInterval(interval), 5000);
    }
    
    // ============ CONFIGURAR SCROLL EN ELEMENTOS ESPECÍFICOS ============
    function configureElementScrolling() {
        // Asegurar que solo .main-content tenga scroll CON ALTURA FIJA
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.style.overflowY = 'auto';
            mainContent.style.overflowX = 'hidden';
            mainContent.style.height = '100vh';
            mainContent.style.paddingBottom = '5vh';
            mainContent.style.boxSizing = 'border-box';
            console.log('✅ DASHBOARD: Scroll configurado en .main-content con altura fija');
        }
        
        // El contenedor interno debe expandirse según el contenido - ANULAR TAILWIND
        const mainContainer = document.querySelector('.main-content > div');
        if (mainContainer) {
            mainContainer.style.minHeight = 'auto !important';
            mainContainer.style.height = 'auto !important';
            mainContainer.style.maxHeight = 'none !important';
            mainContainer.style.width = '100% !important';
            mainContainer.style.overflow = 'visible !important';
            // Anular py-8 de Tailwind que puede limitar altura
            mainContainer.style.paddingTop = '2rem !important';
            mainContainer.style.paddingBottom = '2rem !important';
            console.log('✅ DASHBOARD: Contenedor interno configurado para expandirse (Tailwind anulado)');
        }
        
        // Prevenir scroll en body y html
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        
        // Desactivar scroll en los contenedores GSAP
        const gsapWrapper = document.getElementById('gsap-smoother-wrapper');
        const gsapContent = document.getElementById('gsap-smoother-content');
        
        if (gsapWrapper) {
            gsapWrapper.style.overflow = 'visible';
            gsapWrapper.style.height = '100vh';
        }
        
        if (gsapContent) {
            gsapContent.style.overflow = 'visible';
            gsapContent.style.height = 'auto';
        }
    }
    
    // ============ FUNCIONES PÚBLICAS PARA DEBUG ============
    window.DashboardScrollManager = {
        configure: configureDashboardLayout,
        applyStyles: applyDashboardStyles,
        configureScroll: configureElementScrolling,
        isDashboard: isDashboardView,
        
        // Función para activar debug visual
        enableDebug: function() {
            document.body.classList.add('debug-dashboard');
            console.log('🔍 DASHBOARD: Modo debug activado');
        },
        
        // Función para desactivar debug
        disableDebug: function() {
            document.body.classList.remove('debug-dashboard');
            console.log('🔍 DASHBOARD: Modo debug desactivado');
        }
    };
    
    // ============ INICIALIZACIÓN ============
    function init() {
        if (!isDashboardView()) {
            console.log('ℹ️ DASHBOARD: No es una vista de dashboard, saltando configuración');
            return;
        }
        
        console.log('🏢 DASHBOARD: Detectada vista de dashboard, configurando layout');
        
        // Interceptar ScrollSmoother antes de que se cree
        preventScrollSmootherCreation();
        
        // Observar GSAPMain
        observeGSAPMain();
        
        // Configurar inmediatamente
        configureDashboardLayout();
        
        // Configurar scroll después de que el DOM esté listo
        setTimeout(() => {
            configureElementScrolling();
        }, 500);
    }
    
    // ============ AUTO-INICIALIZACIÓN ============
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // También ejecutar en load para asegurar
    window.addEventListener('load', () => {
        if (isDashboardView()) {
            setTimeout(init, 200);
        }
    });
    
    console.log('📋 DASHBOARD SCROLL MANAGER: Cargado - Comandos disponibles: DashboardScrollManager');
    
})();
