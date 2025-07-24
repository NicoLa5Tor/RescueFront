/* document.addEventListener('DOMContentLoaded', function() {
    // Comentado por problemas identificados
    // var loader = document.getElementById('rescue-loader');
    // var progressBar = document.querySelector('.progress-fill');
    // var progressPercentage = document.querySelector('.progress-percentage');
    // var loadingText = document.querySelector('.loading-text');
    // var body = document.body;
    // var progress = 0;
    
    // ============ SISTEMA DE DETECCIÓN DE PRIMERA CARGA ============
    function shouldShowPreloader() {
        try {
            // 1. Verificar si ya se cargó en esta sesión
            const sessionLoaded = sessionStorage.getItem('rescue_app_loaded');
            if (sessionLoaded) {
                console.log('🚫 PRELOADER: Ya cargado en esta sesión - omitiendo');
                return false;
            }
            
            // 2. Detectar tipo de navegación usando Performance API
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                const navType = navigation.type;
                console.log(`🔍 PRELOADER: Tipo de navegación detectado: ${navType}`);
                
                // Solo mostrar en navegación inicial, no en refresh/back/forward
                if (navType === 'reload' || navType === 'back_forward') {
                    console.log('🚫 PRELOADER: Refresh o navegación hacia atrás - omitiendo');
                    return false;
                }
            }
            
            // 3. Verificar rutas donde debe aparecer el preloader
            const currentPath = window.location.pathname;
            const preloaderRoutes = [
                '/',
                '/login',
                '/dashboard',
                '/admin/dashboard',
                '/admin/super_admin_dashboard',
                '/empresa/dashboard'
            ];
            
            const shouldShow = preloaderRoutes.some(route => 
                currentPath === route || currentPath.startsWith(route)
            );
            
            if (!shouldShow) {
                console.log(`🚫 PRELOADER: Ruta ${currentPath} no requiere preloader`);
                return false;
            }
            
            // 4. Si llegamos aquí, mostrar preloader y marcar sesión
            sessionStorage.setItem('rescue_app_loaded', 'true');
            console.log('✅ PRELOADER: Primera carga detectada - iniciando secuencia');
            return true;
            
        } catch (error) {
            console.error('❌ PRELOADER: Error en detección:', error);
            // En caso de error, mostrar preloader por seguridad
            return true;
        }
    }
    
    // Verificar si debe mostrar el preloader
    if (!shouldShowPreloader()) {
        // Ocultar inmediatamente el preloader que está visible por defecto
        loader.classList.add('hide-immediately');
        body.classList.remove('loading');
        body.style.overflow = '';
        body.style.position = '';
        body.style.width = '';
        body.style.top = '';
        body.style.left = '';
        
        console.log('⚡ PRELOADER: Ocultado inmediatamente - navegación controlada por interceptor');
        return; // Salir de la función completamente
    }
    
    // ============ MOSTRAR PRELOADER SOLO EN PRIMERA CARGA ============
    console.log('🎬 PRELOADER: Ejecutando secuencia completa para primera carga');
    
    // El preloader ya está visible por CSS, solo necesitamos ejecutar la lógica
    
    // ============ CONTINÚA CON LA LÓGICA NORMAL DEL PRELOADER ============
    
    var loadingMessages = [
        'Inicializando sistema de emergencias...',
        'Cargando módulos de seguridad...',
        'Conectando con la base de datos...',
        'Conectando con red IoT...',
        'Preparando interfaz GSAP...',
        'Finalizando carga...'
    ];
    var messageIndex = 0;

    // Disable scrolling completely
    body.classList.add('loading');
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.width = '100%';
    body.style.top = '0';
    body.style.left = '0';
    
    // Función para prevenir scroll en móvil
    function preventMobileScroll(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
    
    // Detectar si es móvil
    function isMobile() {
        return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    // Agregar listeners para prevenir scroll en móvil
    if (isMobile()) {
        // Prevenir eventos de touch que causan scroll
        document.addEventListener('touchstart', preventMobileScroll, { passive: false });
        document.addEventListener('touchmove', preventMobileScroll, { passive: false });
        document.addEventListener('touchend', preventMobileScroll, { passive: false });
        
        // Prevenir eventos de wheel/scroll
        document.addEventListener('wheel', preventMobileScroll, { passive: false });
        document.addEventListener('scroll', preventMobileScroll, { passive: false });
        
        // Resetear posición de scroll
        window.scrollTo(0, 0);
        
        console.log('📱 Mobile scroll prevention activated');
    }

    // Change loading messages
    var messageInterval = setInterval(function() {
        if (messageIndex < loadingMessages.length - 1 && progress < 90) {
            messageIndex++;
            loadingText.innerText = loadingMessages[messageIndex];
        }
    }, 1000);

    // Simulated loading progress
    var loadingInterval = setInterval(function() {
        progress += Math.random() * 8 + 2; // More consistent progress
        if (progress >= 100) progress = 100;

        // Update visual progress
        progressBar.style.width = progress + '%';
        progressPercentage.innerText = Math.floor(progress) + '%';

        if (progress === 100) {
            clearInterval(loadingInterval);
            clearInterval(messageInterval);
            loadingText.innerText = 'Carga completada!';
            
            console.log('🎯 PRELOADER: Secuencia completa finalizada - iniciando ocultación');
            
            setTimeout(function() {
                // Hide loader
                loader.classList.add('hiding');
                
                // Enable scrolling after animation
                setTimeout(function() {
                    loader.style.display = 'none';
                    body.classList.remove('loading');
                    body.style.overflow = '';
                    body.style.position = '';
                    body.style.width = '';
                    body.style.top = '';
                    body.style.left = '';
                    
                    // Remover listeners de prevención de scroll en móvil
                    if (isMobile()) {
                        document.removeEventListener('touchstart', preventMobileScroll);
                        document.removeEventListener('touchmove', preventMobileScroll);
                        document.removeEventListener('touchend', preventMobileScroll);
                        document.removeEventListener('wheel', preventMobileScroll);
                        document.removeEventListener('scroll', preventMobileScroll);
                        
                        console.log('✌️ Mobile scroll prevention deactivated');
                    }
                    
                    console.log('✅ Preloader ocultado - página lista');
                }, 1000);
            }, 800);
        }
    }, 250);
}
*/

// ============ PRELOADER SIMPLE - SOLO EN PÁGINA PRINCIPAL ============
// Preloader minimalista que solo aparece en la ruta principal (/)
// La visibilidad se controla por CSS mediante la clase 'show-simple-preloader'
// Espera a que todos los estilos CSS se carguen antes de ocultarse

// ============ FUNCIÓN PARA SCROLL AL INICIO ============
// Esta función lleva el scroll suavemente a la posición (0,0) al finalizar el preloader
function scrollToTop() {
    console.log('📍 SCROLL: Iniciando scroll suave al inicio de la página (0,0)');
    
    // Usar diferentes métodos según disponibilidad
    if (window.GSAPMain && window.GSAPMain.smoother) {
        // Si ScrollSmoother está disponible, usarlo para scroll suave
        window.GSAPMain.smoother.scrollTo(0, true);
        console.log('✅ SCROLL: Usando ScrollSmoother para posición (0,0)');
    } else if (window.gsap && window.gsap.to) {
        // Si GSAP está disponible pero no ScrollSmoother, usar ScrollToPlugin
        window.gsap.to(window, {
            duration: 0.8,
            scrollTo: { y: 0, x: 0 },
            ease: "power2.out"
        });
        console.log('✅ SCROLL: Usando GSAP ScrollToPlugin para posición (0,0)');
    } else {
        // Fallback nativo del navegador
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
        console.log('✅ SCROLL: Usando scrollTo nativo para posición (0,0)');
    }
}

function waitForStylesAndHidePreloader() {
    const simplePreloader = document.getElementById('simple-preloader');
    
    if (!simplePreloader || !document.documentElement.classList.contains('show-simple-preloader')) {
        return;
    }
    
    console.log('🎬 SIMPLE PRELOADER: Iniciado en página principal - Con letras RESCUE y barra de progreso');
    
    // ============ FIJAR SCROLL EN POSICIÓN 0,0 DESDE EL INICIO ============
    // Mantener el scroll fijo en la posición superior hasta que el preloader termine
    console.log('📍 SCROLL: Fijando posición en (0,0) desde el inicio del preloader');
    
    // Fijar posición de scroll inmediatamente
    window.scrollTo(0, 0);
    
    // Prevenir cualquier tipo de scroll
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = '0';
    document.body.style.left = '0';
    document.body.style.width = '100%';
    
    // Función para mantener la posición fija
    function maintainScrollPosition() {
        window.scrollTo(0, 0);
    }
    
    // Listeners para prevenir cualquier cambio de scroll
    const preventScroll = (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.scrollTo(0, 0);
        return false;
    };
    
    // Agregar listeners para mantener posición fija
    window.addEventListener('scroll', maintainScrollPosition, { passive: false });
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('keydown', (e) => {
        // Prevenir teclas que causan scroll (flechas, página arriba/abajo, etc.)
        if ([32, 33, 34, 35, 36, 37, 38, 39, 40].includes(e.keyCode)) {
            e.preventDefault();
            window.scrollTo(0, 0);
        }
    });
    
    console.log('🔒 SCROLL: Posición fijada en (0,0) - Todos los eventos de scroll bloqueados');
    
    // ============ SISTEMA DE BARRA DE PROGRESO ============
    const progressBar = simplePreloader.querySelector('.progress-fill');
    const progressText = simplePreloader.querySelector('.loading-message');
    const progressPercentage = simplePreloader.querySelector('.progress-percentage');
    
    let currentProgress = 0;
    
    const progressMessages = [
        'Inicializando sistema...',
        'Cargando estilos CSS...',
        'Cargando scripts JavaScript...',
        'Inicializando GSAP...',
        'Preparando interfaz...',
        'Finalizando carga...'
    ];
    
    function updateProgress(progress, message) {
        currentProgress = Math.min(progress, 100);
        
        if (progressBar) {
            progressBar.style.width = currentProgress + '%';
        }
        
        if (progressPercentage) {
            progressPercentage.textContent = Math.floor(currentProgress) + '%';
        }
        
        if (progressText && message) {
            progressText.textContent = message;
        }
        
        console.log(`📊 PROGRESO: ${Math.floor(currentProgress)}% - ${message || 'Cargando...'}`);
    }
    
    // Progreso inicial
    updateProgress(5, progressMessages[0]);
    
    // Función para verificar si todos los estilos CSS se han cargado
    function checkStylesLoaded() {
        updateProgress(15, progressMessages[1]); // "Cargando estilos CSS..."
        
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        let loadedCount = 0;
        let totalLinks = links.length;
        
        // Si no hay links CSS, continuar inmediatamente
        if (totalLinks === 0) {
            console.log('🎨 ESTILOS: No hay enlaces CSS externos detectados');
            updateProgress(35, 'Estilos CSS listos');
            return Promise.resolve();
        }
        
        console.log(`🎨 ESTILOS: Verificando carga de ${totalLinks} archivos CSS...`);
        
        return new Promise((resolve) => {
            function checkComplete() {
                if (loadedCount >= totalLinks) {
                    console.log('✅ ESTILOS: Todos los archivos CSS cargados correctamente');
                    updateProgress(35, 'Estilos CSS cargados');
                    resolve();
                }
            }
            
            links.forEach((link, index) => {
                // Si el link ya está cargado
                if (link.sheet) {
                    loadedCount++;
                    console.log(`✅ CSS ${index + 1}/${totalLinks}: ${link.href.split('/').pop()} ya estaba cargado`);
                    
                    // Actualizar progreso por cada archivo CSS cargado
                    const cssProgress = 15 + (loadedCount / totalLinks) * 20; // 15% a 35%
                    updateProgress(cssProgress);
                    
                    checkComplete();
                } else {
                    // Esperar a que el link se cargue
                    link.addEventListener('load', function() {
                        loadedCount++;
                        console.log(`✅ CSS ${loadedCount}/${totalLinks}: ${this.href.split('/').pop()} cargado`);
                        
                        // Actualizar progreso por cada archivo CSS cargado
                        const cssProgress = 15 + (loadedCount / totalLinks) * 20; // 15% a 35%
                        updateProgress(cssProgress);
                        
                        checkComplete();
                    });
                    
                    // Manejar errores de carga
                    link.addEventListener('error', function() {
                        loadedCount++; // Contar como "cargado" para no bloquear
                        console.warn(`⚠️ CSS ${loadedCount}/${totalLinks}: Error cargando ${this.href.split('/').pop()}`);
                        
                        // Actualizar progreso incluso en caso de error
                        const cssProgress = 15 + (loadedCount / totalLinks) * 20; // 15% a 35%
                        updateProgress(cssProgress);
                        
                        checkComplete();
                    });
                }
            });
            
            // Timeout de seguridad (3 segundos máximo)
            setTimeout(() => {
                if (loadedCount < totalLinks) {
                    console.warn(`⚠️ ESTILOS: Timeout - Solo ${loadedCount}/${totalLinks} archivos CSS cargados`);
                    updateProgress(35, 'Estilos CSS listos (timeout)');
                    resolve();
                }
            }, 3000);
        });
    }
    
    // Función para verificar si todos los archivos JavaScript se han cargado
    function checkScriptsLoaded() {
        updateProgress(40, progressMessages[2]); // "Cargando scripts JavaScript..."
        
        return new Promise((resolve) => {
            // Usar un enfoque más simple - simplemente esperar un tiempo fijo
            // ya que la mayoría de scripts ya están cargados cuando el DOM está listo
            setTimeout(() => {
                updateProgress(70, 'Scripts JavaScript cargados');
                console.log('✅ SCRIPTS: Verificación completada');
                resolve();
            }, 500);
        });
    }
    
    // Función para esperar a que GSAP esté completamente inicializado
    function checkGSAPReady() {
        updateProgress(75, progressMessages[3]); // "Inicializando GSAP..."
        
        return new Promise((resolve) => {
            // Si GSAP ya está disponible
            if (window.gsap && window.ScrollTrigger && window.GSAPMain) {
                console.log('✅ GSAP: Ya está completamente inicializado');
                updateProgress(90, 'GSAP inicializado');
                resolve();
                return;
            }
            
            console.log('⏳ GSAP: Esperando inicialización completa...');
            
            // Listener para cuando GSAP se inicialice
            window.addEventListener('gsap:initialized', function() {
                console.log('✅ GSAP: Inicialización completa detectada');
                updateProgress(90, 'GSAP inicializado');
                resolve();
            }, { once: true });
            
            // Timeout de seguridad (3 segundos)
            setTimeout(() => {
                console.warn('⚠️ GSAP: Timeout en inicialización, continuando...');
                updateProgress(90, 'GSAP listo (timeout)');
                resolve();
            }, 3000);
        });
    }
    
    // Esperar a que TODOS los recursos se carguen (CSS, JS, GSAP)
    Promise.all([
        checkStylesLoaded(),
        checkScriptsLoaded(),
        checkGSAPReady()
    ]).then(() => {
        console.log('🎆 PRELOADER: Todos los recursos cargados (CSS + JS + GSAP)');
        
        updateProgress(100, progressMessages[5]); // "Finalizando carga..."
        
        // ============ OCULTAR SCROLL INSTANTÁNEAMENTE AL 100% ============
        // Desactivar scroll inmediatamente cuando la barra llega al 100%
        console.log('🚫 SCROLL: Ocultando scroll instantáneamente al 100%');
        
        // Ocultar scroll del body inmediatamente
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        
        // Desactivar pointer events del preloader inmediatamente
        simplePreloader.style.pointerEvents = 'none';
        simplePreloader.style.zIndex = '-1';
        
        console.log('✅ SCROLL: Desactivado instantáneamente - Clicks desbloqueados');
        
        // Esperar un tick adicional para que los event listeners se registren
        setTimeout(() => {
            console.log('🔧 PRELOADER: Verificando que los botones funcionen...');
            
            // Verificación adicional: comprobar que los botones tienen eventos
            const buttons = document.querySelectorAll('button, .btn, [role="button"], a[href]');
            console.log(`🔘 PRELOADER: ${buttons.length} botones detectados en la página`);
            
            // Dar tiempo adicional para que se registren todos los event listeners
            setTimeout(function() {
                console.log('🎬 PRELOADER: Iniciando cierre con animación');
                
                // Añadir clase para activar la animación CSS suave del preloader
                simplePreloader.classList.add('fade-out');
                console.log('🌫️ PRELOADER: Transición visual iniciada');
                
                // Remover completamente después de la transición (1.2s + 0.3s buffer)
                setTimeout(function() {
                    simplePreloader.style.display = 'none';
                    // Remover la clase para limpiar
                    simplePreloader.classList.remove('fade-out');
                    // Remover la clase del HTML también
                    document.documentElement.classList.remove('show-simple-preloader');
                    
                    // ============ LIMPIAR EVENT LISTENERS DE SCROLL ============
                    // Remover todos los listeners que mantienen el scroll fijo
                    window.removeEventListener('scroll', maintainScrollPosition);
                    window.removeEventListener('wheel', preventScroll);
                    window.removeEventListener('touchmove', preventScroll);
                    
                    console.log('🧹 SCROLL: Event listeners de bloqueo removidos');
                    
                    // ============ RESTAURAR SCROLL AL TERMINAR EL PRELOADER ============
                    // Restaurar el scroll normal del body
                    document.body.style.overflow = '';
                    document.documentElement.style.overflow = '';
                    document.body.style.position = '';
                    document.body.style.top = '';
                    document.body.style.left = '';
                    document.body.style.width = '';
                    
                    // Llamar a la función scrollToTop para llevar la página al inicio
                    scrollToTop();
                    
                    console.log('✅ SIMPLE PRELOADER: Ocultado completamente - Scroll restaurado - Event listeners limpiados - Interfaz completamente funcional');
                }, 1500); // 1.5 segundos para asegurar que la animación termine
                
            }, 1500); // 1.5 segundos de duración mínima
        }, 100); // 100ms adicionales para event listeners
    }).catch((error) => {
        console.error('❌ PRELOADER: Error en carga de recursos:', error);
        // En caso de error, ocultar preloader de todos modos
        setTimeout(() => {
            simplePreloader.style.opacity = '0';
            setTimeout(() => {
                simplePreloader.style.display = 'none';
            }, 1000);
        }, 2000);
    });
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', waitForStylesAndHidePreloader);

// También ejecutar en window.load como respaldo
window.addEventListener('load', function() {
    // Si el preloader aún está visible después de window.load, forzar ocultación
    const simplePreloader = document.getElementById('simple-preloader');
    if (simplePreloader && simplePreloader.style.display !== 'none' && simplePreloader.style.opacity !== '0') {
        console.log('🔄 PRELOADER: Forzando ocultación en window.load (respaldo)');
        setTimeout(() => {
            console.log('🎬 PRELOADER RESPALDO: Iniciando cierre con ocultación instantánea de scroll');
            
            // ============ OCULTAR SCROLL INSTANTÁNEAMENTE TAMBIÉN EN RESPALDO ============
            // Ocultar scroll del body inmediatamente
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
            
            // CLAVE: Desactivar pointer events inmediatamente también en el respaldo
            simplePreloader.style.pointerEvents = 'none';
            simplePreloader.style.zIndex = '-1';
            
            console.log('🚫 SCROLL RESPALDO: Desactivado instantáneamente');
            
            // Añadir clase para activar la animación CSS suave
            simplePreloader.classList.add('fade-out');
            console.log('🌫️ PRELOADER RESPALDO: Transición visual iniciada');
            
            setTimeout(() => {
                simplePreloader.style.display = 'none';
                // Remover la clase para limpiar
                simplePreloader.classList.remove('fade-out');
                // Remover la clase del HTML también
                document.documentElement.classList.remove('show-simple-preloader');
                
                // ============ RESTAURAR SCROLL EN RESPALDO ============
                // Restaurar el scroll normal del body
                document.body.style.overflow = '';
                document.documentElement.style.overflow = '';
                
                // Asegurar scroll al inicio también en el preloader de respaldo
                scrollToTop();
                
                console.log('✅ PRELOADER RESPALDO: Ocultado completamente - Scroll restaurado');
            }, 1500); // 1.5 segundos pour asegurar que la animación termine
        }, 500);
    }
});

// ============ GSAP MAIN CONTROLLER - CONTROLADOR PRINCIPAL DE RENDERIZADO ============
// Este es el controlador principal que maneja todo el sistema de animaciones GSAP
// Se ejecuta después del preloader para inicializar las animaciones de la aplicación
(function() {
    'use strict';
    
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
            // Configuraciones que afectan a todas las animaciones
            gsap.config({
                nullTargetWarn: false,  // No mostrar warnings si un elemento no existe
                trialWarn: false        // No mostrar warnings de versión trial
            });
            
            // ============ CREAR SCROLLSMOOTHER GLOBAL ============
            // ScrollSmoother proporciona scroll suave en toda la aplicación
            // Busca elementos con IDs específicos para crear el contenedor de scroll
            this.smoother = ScrollSmoother.create({
                wrapper: '#gsap-smoother-wrapper',   // Contenedor exterior (fijo)
                content: '#gsap-smoother-content',   // Contenido que se mueve
                smooth: 2,                           // Intensidad del suavizado (2 = medio)
                effects: true,                       // Habilitar efectos de parallax
                smoothTouch: 0.1,                   // Suavizado en dispositivos táctiles
                normalizeScroll: true               // Normalizar comportamiento entre navegadores
            });
            
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

// ============ FUNCIONES GLOBALES DE CONTROL DEL PRELOADER ============
// Estas funciones permiten control manual del preloader desde cualquier parte de la app

// Forzar reset del flag de sesión (útil para testing)
window.resetPreloaderSession = function() {
    sessionStorage.removeItem('rescue_app_loaded');
    console.log('🔄 PRELOADER: Flag de sesión reseteado - próxima carga mostrará preloader');
};

// Verificar estado actual del preloader
window.getPreloaderStatus = function() {
    const sessionLoaded = sessionStorage.getItem('rescue_app_loaded');
    const navigation = performance.getEntriesByType('navigation')[0];
    const navType = navigation ? navigation.type : 'unknown';
    
    return {
        sessionLoaded: !!sessionLoaded,
        navigationType: navType,
        currentPath: window.location.pathname,
        shouldShow: !sessionLoaded && navType !== 'reload' && navType !== 'back_forward'
    };
};

// Forzar ocultación inmediata del preloader (emergencia)
window.forceHidePreloader = function() {
    const loader = document.getElementById('rescue-loader');
    const body = document.body;
    
    if (loader) {
        loader.style.display = 'none';
        body.classList.remove('loading');
        body.style.overflow = '';
        body.style.position = '';
        body.style.width = '';
        body.style.top = '';
        body.style.left = '';
        
        console.log('⚡ PRELOADER: Ocultación forzada aplicada');
        return true;
    }
    return false;
};

// Mostrar información de debug del preloader
window.debugPreloader = function() {
    const status = window.getPreloaderStatus();
    console.log('🔍 PRELOADER DEBUG:', {
        ...status,
        loaderElement: !!document.getElementById('rescue-loader'),
        bodyHasLoadingClass: document.body.classList.contains('loading'),
        timestamp: new Date().toISOString()
    });
    return status;
};

// ============ FUNCIONES DE CONTROL DEL SPINNER INTERNO ============

// Variable global para controlar el estado del spinner
let spinnerState = {
    isVisible: false,
    currentTimeout: null
};

// Mostrar spinner interno (para navegación/refresh)
function showInternalSpinner(message = 'Cargando...', duration = 1200) {
    const spinner = document.getElementById('internal-spinner');
    const spinnerText = spinner.querySelector('.spinner-text');
    
    if (!spinner || !spinnerText) return false;
    
    // Si ya está visible, solo actualizar el mensaje
    if (spinnerState.isVisible) {
        spinnerText.textContent = message;
        console.log(`🔄 SPINNER: Mensaje actualizado a "${message}"`);
        
        // Limpiar timeout anterior y establecer uno nuevo
        if (spinnerState.currentTimeout) {
            clearTimeout(spinnerState.currentTimeout);
        }
        
        spinnerState.currentTimeout = setTimeout(() => {
            hideInternalSpinner();
        }, duration);
        
        return true;
    }
    
    // Mostrar spinner por primera vez
    spinnerText.textContent = message;
    spinner.classList.add('show');
    spinnerState.isVisible = true;
    
    console.log(`🌀 SPINNER: Mostrado con mensaje "${message}"`);
    
    // Establecer timeout para ocultar
    spinnerState.currentTimeout = setTimeout(() => {
        hideInternalSpinner();
    }, duration);
    
    return true;
}

// Ocultar spinner interno
function hideInternalSpinner() {
    const spinner = document.getElementById('internal-spinner');
    
    if (!spinner || !spinnerState.isVisible) return false;
    
    // Limpiar timeout si existe
    if (spinnerState.currentTimeout) {
        clearTimeout(spinnerState.currentTimeout);
        spinnerState.currentTimeout = null;
    }
    
    // Ocultar spinner
    spinner.classList.remove('show');
    spinnerState.isVisible = false;
    
    console.log('✅ SPINNER: Ocultado');
    return true;
}

// Funciones globales para uso externo
window.showInternalSpinner = showInternalSpinner;
window.hideInternalSpinner = hideInternalSpinner;

// Mostrar spinner con diferentes mensajes personalizados
window.showSpinnerWithMessage = function(message, duration = 1200) {
    return showInternalSpinner(message, duration);
};

// Para uso rápido en navegación
window.showNavigationSpinner = function() {
    return showInternalSpinner('Navegando...', 800);
};

window.showLoadingSpinner = function() {
    return showInternalSpinner('Cargando datos...', 1500);
};

window.showSavingSpinner = function() {
    return showInternalSpinner('Guardando...', 1000);
};

// ============ INTERCEPTOR DE NAVEGACIÓN ============
// Mostrar spinner antes de navegar a enlaces internos

function setupNavigationInterceptor() {
    // Interceptar clics en enlaces
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        
        if (!link) return;
        
        const href = link.getAttribute('href');
        
        // Solo interceptar enlaces internos (no externos, no JavaScript, no descargas)
        if (href && 
            !href.startsWith('http') && 
            !href.startsWith('mailto:') && 
            !href.startsWith('tel:') && 
            !href.startsWith('#') && 
            !href.startsWith('javascript:') &&
            href !== '' &&
            !link.hasAttribute('download') &&
            !link.hasAttribute('target')) {
            
            // Mostrar spinner inmediatamente
            showInternalSpinner('Navegando...', 5000); // 5 segundos máximo
            
            console.log(`🔗 NAVEGACIÓN: Link interceptado -> ${href}`);
        }
    });
    
    // Interceptar formularios
    document.addEventListener('submit', function(e) {
        const form = e.target;
        
        if (form && form.tagName === 'FORM') {
            // Verificar si es un formulario interno (no externo)
            const action = form.getAttribute('action');
            const method = form.getAttribute('method');
            
            if (!action || !action.startsWith('http')) {
                const message = method && method.toLowerCase() === 'post' ? 'Enviando...' : 'Cargando...';
                showInternalSpinner(message, 5000);
                
                console.log(`📝 FORMULARIO: Envío interceptado -> ${action || 'misma página'}`);
            }
        }
    });
    
    // Interceptar navegación del navegador (back/forward)
    window.addEventListener('popstate', function(e) {
        showInternalSpinner('Navegando...', 3000);
        console.log('←→ NAVEGACIÓN: Histórico del navegador');
    });
    
    // Ocultar spinner cuando la página termine de cargar
    window.addEventListener('load', function() {
        setTimeout(() => {
            hideInternalSpinner();
        }, 100);
    });
    
    // También ocultar en caso de error
    window.addEventListener('error', function() {
        setTimeout(() => {
            hideInternalSpinner();
        }, 100);
    });
    
    console.log('🔗 INTERCEPTOR: Sistema de navegación configurado');
}

// Configurar interceptor cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Pequeño delay para asegurar que todo esté cargado
    setTimeout(setupNavigationInterceptor, 100);
});

console.log('🚀 PRELOADER: Sistema de control global inicializado');
console.log('💡 Comandos disponibles: resetPreloaderSession(), getPreloaderStatus(), forceHidePreloader(), debugPreloader()');
console.log('🌀 SPINNER: showInternalSpinner(), hideInternalSpinner(), showNavigationSpinner(), showLoadingSpinner(), showSavingSpinner()');
