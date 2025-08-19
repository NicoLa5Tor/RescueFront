// ============ DESACTIVADOR DE SCROLLSMOOTHER SIMPLE ============
// Solo desactiva ScrollSmoother, nada más

(function() {
    'use strict';
    
    function isDashboardView() {
        const currentPath = window.location.pathname;
        const dashboardPaths = [
            '/empresa',
            '/empresa/dashboard',
            '/admin/dashboard', 
            '/admin/super-dashboard',
            '/empresa/hardware',
            '/empresa/usuarios',
            '/empresa/alertas',
            '/admin/empresas',
            '/admin/users',
            '/admin/hardware',
            '/admin/company-types'
        ];
        
        return dashboardPaths.some(path => currentPath.startsWith(path));
    }
    
    function disableScrollSmoother() {
        if (window.GSAPMain && window.GSAPMain.smoother) {
            try {
                window.GSAPMain.smoother.kill();
                window.GSAPMain.smoother = null;
                console.log('✅ ScrollSmoother desactivado');
            } catch (error) {
                console.log('⚠️ Error desactivando ScrollSmoother:', error);
            }
        }
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
            /* Solo neutralizar GSAP ScrollSmoother */
            #gsap-smoother-wrapper,
            #gsap-smoother-content {
                overflow: visible !important;
                position: static !important;
                transform: none !important;
                height: auto !important;
            }
            
            /* Solo ajustar margin-left para no montar sobre sidebar */
            .main-content {
                margin-left: 0 !important;
                z-index: 0 !important;
                position: relative !important;
            }
            
            @media (min-width: 1024px) {
                .main-content {
                    margin-left: var(--sidebar-width, 320px) !important;
                }
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
                        
                        // Aplicar estilos básicos
                        setTimeout(() => applyDashboardStyles(), 100);
                        
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
    
    // ============ FUNCIÓN ELIMINADA ============
    // configureElementScrolling() removida para evitar conflictos
    
    // ============ INICIALIZACIÓN ============
    function init() {
        if (!isDashboardView()) {
            return;
        }
        
        console.log('🏢 DASHBOARD: Vista de dashboard detectada');
        
        // Interceptar ScrollSmoother
        preventScrollSmootherCreation();
        
        // Observar GSAPMain
        observeGSAPMain();
        
        // Aplicar estilos básicos
        applyDashboardStyles();
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
