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
                
                // Estado inicial visible (sin reveal)
                gsap.set('.img-clamp', {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    filter: "brightness(1)"
                });
                
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
