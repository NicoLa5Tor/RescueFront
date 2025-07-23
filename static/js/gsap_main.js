document.addEventListener('DOMContentLoaded', function() {
    var loader = document.getElementById('rescue-loader');
    var progressBar = document.querySelector('.progress-fill');
    var progressPercentage = document.querySelector('.progress-percentage');
    var loadingText = document.querySelector('.loading-text');
    var body = document.body;
    var progress = 0;
    
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
                }, 1000);
            }, 800);
        }
    }, 250);
});

// Animate RESCUE letters on load
window.onload = function() {
    var letters = document.querySelectorAll('.rescue-letter');
    letters.forEach(function(letter, index) {
        setTimeout(function() {
            letter.classList.add('active');
        }, index * 400); // Stagger timing for letters
    });
};

/* CSS (In case you need to put it in CSS file instead of inline)
.rescue-letter {
    font-size: 2rem;
    font-weight: bold;
    color: white;
    opacity: 0;
    transform: translateY(100px);
    transition: transform 0.6s ease-out, opacity 0.6s ease-out;
}

.rescue-letter.active {
    opacity: 1;
    transform: translateY(0);
}
*/

// GSAP Main Controller - Instancia Global
(function() {
    'use strict';
    // Namespace global para GSAP
    window.GSAPMain = {
        smoother: null,
        modules: new Map(),
        initialized: false,
        
        // Inicializar GSAP y ScrollSmoother
        init: function() {
            if (this.initialized) return;
            
            // Registrar todos los plugins
            gsap.registerPlugin(
                ScrollTrigger,
                ScrollSmoother,
                TextPlugin,
                DrawSVGPlugin,
                MotionPathPlugin,
                CustomEase,
                ScrollToPlugin
            );
            
            // Configuración global de GSAP
            gsap.config({
                nullTargetWarn: false,
                trialWarn: false
            });
            
            // Crear ScrollSmoother global
           // En la función init(), actualizar la configuración de ScrollSmoother:
            this.smoother = ScrollSmoother.create({
                wrapper: '#gsap-smoother-wrapper',
                content: '#gsap-smoother-content',
                smooth: 2,  // Cambiado de 1.5 a 2
                effects: true,
                smoothTouch: 0.1,
                normalizeScroll: true
            });
            // Event listeners globales
            this.setupGlobalListeners();
            // Marcar como inicializado
            this.initialized = true;
            
            // Disparar evento custom
            window.dispatchEvent(new CustomEvent('gsap:initialized', {
                detail: { smoother: this.smoother }
            }));
            
            console.log('GSAP Main Controller inicializado');
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