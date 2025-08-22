// static/js/modules/clamp-module.js
(function() {
    'use strict';
    
    const ClampModule = {
        id: 'clamp-module',
        container: null,
        gsapContext: null,
        
        init: function(gsapMain) {
            this.gsapMain = gsapMain;
            
            // Buscar el contenedor con la sección hero-clamp
            this.container = document.querySelector('.hero-clamp');
            
            if (!this.container) {
                //console.warn(`Contenedor .hero-clamp no encontrado`);
                return;
            }
            
            //console.log('Iniciando módulo Clamp');
            this.setupAnimations();
        },
        
        setupAnimations: function() {
            const ctx = gsap.context(() => {
                
                // Registrar plugins localmente (por si acaso)
                gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);
                
                // ScrollTrigger para header sticky (pin)
                ScrollTrigger.create({
                    trigger: '.sticky',
                    start: 'top 20px',
                    end: 'max',
                    pin: true,
                    pinSpacing: false
                });
                
                // NO crear ScrollSmoother - usar el global de GSAPMain
                
                // Animación DrawSVG con ScrollTrigger
                gsap.from('.draw', {
                    drawSVG: "0%",
                    ease: "expo.out",
                    scrollTrigger: {
                        trigger: '.heading',
                        start: "clamp(top center)",
                        scrub: true,
                        pin: '.pin',
                        pinSpacing: false,
                        markers: false,
                        // ScrollSmoother maneja el scroller automáticamente
                    }
                });
                
                // Animación de entrada para el título
                gsap.from('.h1-clamp', {
                    opacity: 0,
                    y: 50,
                    duration: 1.5,
                    ease: "power3.out"
                });
                
                // Detectar si es móvil
                const isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                
                // Configurar estado inicial de las imágenes (simplificado para móvil)
                if (isMobile) {
                    gsap.set('.img-clamp', {
                        opacity: 0,
                        y: 60,
                        scale: 0.9,
                        filter: "brightness(0.8)"
                    });
                } else {
                    gsap.set('.img-clamp', {
                        opacity: 0,
                        y: 120,
                        scale: 0.7,
                        rotationX: 35,
                        rotationY: 15,
                        filter: "blur(8px) brightness(0.5)"
                    });
                }
                
                // Función para ejecutar el reveal
                const executeReveal = () => {
                    if (isMobile) {
                        // Animación simplificada para móvil
                        gsap.to('.img-clamp', {
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            filter: "brightness(1)",
                            duration: 1.8,
                            ease: "power2.out",
                            stagger: {
                                amount: 1,
                                from: "start"
                            }
                        });
                    } else {
                        // Animación completa para desktop
                        gsap.to('.img-clamp', {
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            rotationX: 0,
                            rotationY: 0,
                            filter: "blur(0px) brightness(1)",
                            duration: 2.5,
                            ease: "power3.out",
                            stagger: {
                                amount: 1.5,
                                from: "start",
                                grid: "auto"
                            }
                        });
                    }
                };
                
                // Variable para controlar si ya se ejecutó el reveal
                let revealExecuted = false;
                
                // Ejecutar reveal después del preloader o inmediatamente si ya está en viewport
                const checkAndExecuteReveal = () => {
                    if (revealExecuted) return; // Evitar ejecuciones múltiples
                    
                    const imagesContainer = document.querySelector('.images');
                    if (!imagesContainer) return;
                    
                    const rect = imagesContainer.getBoundingClientRect();
                    const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
                    
                    if (isInViewport || isMobile) {
                        // En móvil siempre ejecutar inmediatamente para evitar bugs de scroll
                        revealExecuted = true;
                        setTimeout(executeReveal, isMobile ? 800 : 1200);
                    } else {
                        // Solo usar ScrollTrigger en desktop
                        ScrollTrigger.create({
                            trigger: '.images',
                            start: "top 90%",
                            once: true,
                            onEnter: () => {
                                if (!revealExecuted) {
                                    revealExecuted = true;
                                    executeReveal();
                                }
                            }
                        });
                    }
                };
                
                // Ejecutar después de un pequeño delay para asegurar que todo esté listo
                setTimeout(checkAndExecuteReveal, 500);
                
                // También escuchar eventos del preloader si existen
                window.addEventListener('preloader:complete', () => {
                    setTimeout(checkAndExecuteReveal, 800);
                });
                
                // Escuchar cuando la página esté completamente cargada
                if (document.readyState === 'complete') {
                    setTimeout(checkAndExecuteReveal, 300);
                } else {
                    window.addEventListener('load', () => {
                        setTimeout(checkAndExecuteReveal, 300);
                    });
                }
                
                // Animaciones continuas removidas para mejorar performance del ScrollTrigger
                
                // Animaciones hover removidas para mejorar performance
                
                
                
                // Efectos de parallax solo para desktop (evitar bugs en móvil)
                if (!isMobile) {
                    // Efecto parallax adicional en el heading
                    gsap.to('.heading', {
                        yPercent: -50,
                        ease: "none",
                        scrollTrigger: {
                            trigger: '.hero-clamp',
                            start: "top top",
                            end: "bottom top",
                            scrub: 1
                        }
                    });
                    
                    // Rotación sutil del SVG al hacer scroll
                    gsap.to('.clamp svg', {
                        rotation: 5,
                        ease: "none",
                        scrollTrigger: {
                            trigger: '.heading',
                            start: "top center",
                            end: "bottom center",
                            scrub: 2
                        }
                    });
                }
                
                // Asegurar que el logo SVG sea visible si existe
                if (document.querySelector('.logo svg')) {
                    gsap.set('.logo svg', { opacity: 1 });
                }
                
            }, this.container);
            
            this.gsapContext = ctx;
        },
        
        destroy: function() {
            if (this.gsapContext) {
                this.gsapContext.revert();
            }
            //console.log(`Módulo ${this.id} destruido`);
        }
    };
    
    // Registro del módulo
    window.addEventListener('gsap:initialized', () => {
        if (window.GSAPMain) {
            GSAPMain.registerModule(ClampModule.id, ClampModule);
        }
    });
    
    if (window.GSAPMain && window.GSAPMain.initialized) {
        GSAPMain.registerModule(ClampModule.id, ClampModule);
    }
})();