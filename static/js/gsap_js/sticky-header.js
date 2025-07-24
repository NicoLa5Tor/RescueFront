// static/js/modules/sticky-header-module.js
(function() {
    'use strict';
    
    const StickyHeaderModule = {
        id: 'sticky-header-module',
        header: null,
        gsapContext: null,
        
        init: function(gsapMain) {
            this.gsapMain = gsapMain;
            
            // Buscar el header sticky
            this.header = document.getElementById('globalStickyHeader');
            
            if (!this.header) {
                console.warn('Header sticky no encontrado');
                return;
            }
            
            console.log('Iniciando módulo Sticky Header');
            this.setupAnimations();
        },
        
        setupAnimations: function() {
            const ctx = gsap.context(() => {
                
                // Registrar plugins
                gsap.registerPlugin(ScrollTrigger);
                
                // ScrollTrigger corregido para funcionar con ScrollSmoother
                ScrollTrigger.create({
                    trigger: this.header,
                    start: 'top 20px',
                    end: '+=99999', // Pin indefinidamente
                    pin: true,
                    pinSpacing: false,
                    scrub: false
                });
                
                // Smooth scroll para los enlaces internos
                const navLinks = this.header.querySelectorAll('.nav-link');
                
                navLinks.forEach((link) => {
                    // Smooth scroll para los enlaces internos
                    if (link.getAttribute('href').startsWith('#')) {
                        link.addEventListener('click', (e) => {
                            e.preventDefault();
                            const target = document.querySelector(link.getAttribute('href'));
                            
                            if (target) {
                                gsap.to(window, {
                                    duration: 1.5,
                                    scrollTo: {
                                        y: target,
                                        offsetY: 100
                                    },
                                    ease: "power2.inOut"
                                });
                            }
                        });
                    }
                });
                
                // Animación de respiración sutil para el logo
                gsap.to('.rescue-brand', {
                    textShadow: '0 0 40px rgba(96, 165, 250, 0.6)',
                    duration: 2,
                    ease: "sine.inOut",
                    yoyo: true,
                    repeat: -1
                });
                
            }, this.header);
            
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
            GSAPMain.registerModule(StickyHeaderModule.id, StickyHeaderModule);
        }
    });
    
    if (window.GSAPMain && window.GSAPMain.initialized) {
        GSAPMain.registerModule(StickyHeaderModule.id, StickyHeaderModule);
    }
})();
