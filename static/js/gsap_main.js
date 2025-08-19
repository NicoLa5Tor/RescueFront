
// ============ GSAP MAIN CONTROLLER - CONTROLADOR PRINCIPAL DE RENDERIZADO ============
// Este es el controlador principal que maneja todo el sistema de animaciones GSAP
// Se ejecuta después del preloader para inicializar las animaciones de la aplicación
(function() {
    'use strict';
    
    // ============ VERIFICAR SI ESTAMOS EN UNA VISTA DE DASHBOARD ============
    // Si estamos en una vista de dashboard, no crear ScrollSmoother
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
    
    // ============ NAMESPACE GLOBAL PARA GSAP ============
    // Crea un objeto global que contiene todas las funcionalidades de GSAP
    window.GSAPMain = {
        smoother: null,         // Instancia de ScrollSmoother para scroll suave
        modules: new Map(),     // Mapa para almacenar módulos de animación
        initialized: false,     // Flag para evitar doble inicialización
        
        // ============ FUNCIÓN DE INICIALIZACIÓN PRINCIPAL ============
        // Esta función se ejecuta una vez que el DOM está listo
        // Inicializa todos los plugins de GSAP y configura el sistema de animaciones
        init: function() {
            // Prevenir doble inicialización
            if (this.initialized) return;
            
            // ============ REGISTRAR PLUGINS DE GSAP ============
            // Registra todos los plugins necesarios para las animaciones
            gsap.registerPlugin(
                ScrollTrigger,    // Para animaciones basadas en scroll
                ScrollSmoother,   // Para scroll suave y efectos de parallax
                TextPlugin,       // Para animaciones de texto
                DrawSVGPlugin,    // Para animaciones de SVG (dibujo de líneas)
                MotionPathPlugin, // Para animaciones siguiendo trayectorias
                CustomEase,       // Para curvas de aceleración personalizadas
                ScrollToPlugin    // Para navegación suave a elementos
            );
            
            // ============ CONFIGURACIÓN GLOBAL DE GSAP ============
            // Configuraciones que afectan a todas las animaciones (optimizada para Chrome)
            gsap.config({
                nullTargetWarn: false,  // No mostrar warnings si un elemento no existe
                trialWarn: false,       // No mostrar warnings de versión trial
                force3D: false,         // Desactivar force3D que causa problemas en Chrome
                autoSleep: 60           // Optimización para Chrome
            });
            
            // ============ CREAR SCROLLSMOOTHER GLOBAL ============
            // ScrollSmoother proporciona scroll suave en toda la aplicación
            // Busca elementos con IDs específicos para crear el contenedor de scroll
            // PERO NO se crea en vistas de dashboard para evitar problemas de scroll
            if (isDashboardView()) {
                console.log('🚫 GSAP: ScrollSmoother NO creado - Vista de dashboard detectada');
                this.smoother = null;
            } else {
                this.smoother = ScrollSmoother.create({
                    wrapper: '#gsap-smoother-wrapper',   // Contenedor exterior (fijo)
                    content: '#gsap-smoother-content',   // Contenido que se mueve
                    smooth: 2,                           // Intensidad del suavizado (2 = medio)
                    effects: true,                       // Habilitar efectos de parallax
                    smoothTouch: 0.1,                   // Suavizado en dispositivos táctiles
                    normalizeScroll: true               // Normalizar comportamiento entre navegadores
                });
                console.log('✅ GSAP: ScrollSmoother creado para página normal');
            }
            
            // ============ CONFIGURAR LISTENERS GLOBALES ============
            this.setupGlobalListeners();
            
            // ============ MARCAR COMO INICIALIZADO ============
            this.initialized = true;
            
            // ============ DISPARAR EVENTO DE INICIALIZACIÓN ============
            // Notifica a otros módulos que GSAP está listo
            window.dispatchEvent(new CustomEvent('gsap:initialized', {
                detail: { smoother: this.smoother }
            }));
            
            console.log('✅ GSAP Main Controller inicializado - Sistema de renderizado listo');
        },
        
        // Registrar un módulo
        registerModule: function(moduleId, moduleInstance) {
            if (this.modules.has(moduleId)) {
                console.warn(`Módulo ${moduleId} ya está registrado`);
                return;
            }
            
            this.modules.set(moduleId, moduleInstance);
            
            // Si el módulo tiene método init, ejecutarlo
            if (moduleInstance.init && typeof moduleInstance.init === 'function') {
                moduleInstance.init(this);
            }
            
            console.log(`Módulo ${moduleId} registrado`);
        },
        
        // Desregistrar un módulo
        unregisterModule: function(moduleId) {
            const module = this.modules.get(moduleId);
            if (module) {
                // Si el módulo tiene método destroy, ejecutarlo
                if (module.destroy && typeof module.destroy === 'function') {
                    module.destroy();
                }
                this.modules.delete(moduleId);
                console.log(`Módulo ${moduleId} desregistrado`);
            }
        },
        
        // Obtener un módulo
        getModule: function(moduleId) {
            return this.modules.get(moduleId);
        },
        
        // Refresh ScrollTrigger y Smoother
        refresh: function() {
            if (this.smoother) {
                this.smoother.refresh();
            }
            ScrollTrigger.refresh();
            console.log('GSAP refreshed');
        },
        
        // Crear animación con contexto
        createAnimation: function(config) {
            const defaults = {
                ease: "power2.inOut",
                duration: 1
            };
            
            return gsap.to(config.target, {
                ...defaults,
                ...config.options
            });
        },
        
        // Crear ScrollTrigger con defaults
        createScrollTrigger: function(config) {
            const defaults = {
                start: "top 80%",
                end: "bottom 20%",
                toggleActions: "play none none reverse"
            };
            
            return ScrollTrigger.create({
                ...defaults,
                ...config
            });
        },
        
        // Timeline factory
        createTimeline: function(config = {}) {
            const defaults = {
                defaults: { ease: "power2.inOut", duration: 0.8 }
            };
            
            return gsap.timeline({
                ...defaults,
                ...config
            });
        },
        
        // Scroll to element
        scrollTo: function(target, options = {}) {
            const defaults = {
                duration: 1,
                ease: "power2.inOut",
                offsetY: 0
            };
            
            if (this.smoother) {
                this.smoother.scrollTo(target, true, "top top");
            } else {
                gsap.to(window, {
                    scrollTo: {
                        y: target,
                        ...defaults,
                        ...options
                    }
                });
            }
        },
        
        // Batch animations helper
        batchAnimate: function(targets, config) {
            return ScrollTrigger.batch(targets, {
                onEnter: config.onEnter || ((batch) => gsap.to(batch, config.enterAnimation)),
                onLeave: config.onLeave,
                onEnterBack: config.onEnterBack,
                onLeaveBack: config.onLeaveBack,
                ...config.options
            });
        },
        
        // Parallax helper
        createParallax: function(element, speed = 1, config = {}) {
            return gsap.to(element, {
                yPercent: -100 * speed,
                ease: "none",
                scrollTrigger: {
                    trigger: element,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true,
                    ...config
                }
            });
        },
        
        // Setup global listeners
        setupGlobalListeners: function() {
            // Resize handler con debounce
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    this.refresh();
                }, 250);
            });
            
            // Visibility change
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) {
                    this.refresh();
                }
            });
            
            // Custom events para módulos
            window.addEventListener('gsap:refresh', () => this.refresh());
            window.addEventListener('gsap:scrollTo', (e) => {
                if (e.detail && e.detail.target) {
                    this.scrollTo(e.detail.target, e.detail.options);
                }
            });
        },
        
        // Utilidades
        utils: {
            // Clamp
            clamp: function(min, val, max) {
                return Math.min(Math.max(val, min), max);
            },
            
            // Map range
            mapRange: function(inMin, inMax, outMin, outMax, value) {
                return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
            },
            
            // Get scroll progress
            getScrollProgress: function(trigger) {
                const st = ScrollTrigger.getById(trigger);
                return st ? st.progress : 0;
            },
            
            // Kill all animations in element
            killAnimations: function(element) {
                gsap.killTweensOf(element);
                ScrollTrigger.getAll().forEach(st => {
                    if (st.trigger === element || st.pin === element) {
                        st.kill();
                    }
                });
            }
        }
    };
    
    // Auto-inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => GSAPMain.init());
    } else {
        GSAPMain.init();
    }
})();
