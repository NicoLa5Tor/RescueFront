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
                console.warn(`Contenedor .hero-clamp no encontrado`);
                return;
            }
            
            console.log('Iniciando módulo Clamp');
            this.setupAnimations();
        },
        
        setupAnimations: function() {
            const ctx = gsap.context(() => {
                
                // Registrar plugins localmente (por si acaso)
                gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);
                
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
                
                // Configurar estado inicial de las imágenes
                gsap.set('.img-clamp', {
                    opacity: 0,
                    y: 120,
                    scale: 0.7,
                    rotationX: 35,
                    rotationY: 15,
                    filter: "blur(8px) brightness(0.5)"
                });
                
                // Función para ejecutar el reveal
                const executeReveal = () => {
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
                };
                
                // Ejecutar reveal después del preloader o inmediatamente si ya está en viewport
                const checkAndExecuteReveal = () => {
                    const imagesContainer = document.querySelector('.images');
                    if (!imagesContainer) return;
                    
                    const rect = imagesContainer.getBoundingClientRect();
                    const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
                    
                    if (isInViewport) {
                        // Si ya está en viewport, ejecutar inmediatamente
                        setTimeout(executeReveal, 1200);
                    } else {
                        // Si no está en viewport, usar ScrollTrigger
                        ScrollTrigger.create({
                            trigger: '.images',
                            start: "top 90%",
                            once: true,
                            onEnter: () => {
                                executeReveal();
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
                
                // Animación de flotación sutil para las imágenes (usando transform para evitar conflictos)
                gsap.to('.img-clamp', {
                    rotationZ: 2,
                    transformOrigin: "center center",
                    duration: 4,
                    ease: "power2.inOut",
                    yoyo: true,
                    repeat: -1,
                    stagger: {
                        amount: 1.2,
                        from: "random"
                    },
                    delay: 4
                });
                
                // Animación de escala respiratoria muy sutil
                gsap.to('.img-clamp', {
                    scale: 1.02,
                    duration: 5,
                    ease: "sine.inOut",
                    yoyo: true,
                    repeat: -1,
                    stagger: {
                        amount: 1.5,
                        from: "center"
                    },
                    delay: 5
                });
                
                // Animación de hover individual para cada imagen
                gsap.utils.toArray('.img-clamp').forEach((img, index) => {
                    let hoverTween;
                    
                    img.addEventListener('mouseenter', () => {
                        hoverTween = gsap.to(img, {
                            scale: 1.08,
                            rotationY: 8,
                            rotationX: -3,
                            z: 50,
                            duration: 0.6,
                            ease: "power2.out",
                            transformOrigin: "center center"
                        });
                    });
                    
                    img.addEventListener('mouseleave', () => {
                        if (hoverTween) hoverTween.kill();
                        gsap.to(img, {
                            scale: 1,
                            rotationY: 0,
                            rotationX: 0,
                            z: 0,
                            duration: 0.4,
                            ease: "power2.out"
                        });
                    });
                });
                
                
                
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
            console.log(`Módulo ${this.id} destruido`);
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