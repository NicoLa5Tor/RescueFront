// static/js/modules/sticky-header-module.js
(function() {
    'use strict';
    
    const StickyHeaderModule = {
        id: 'sticky-header-module',
        header: null,
        loginButton: null,
        clampElement: null,
        gsapContext: null,
        
        init: function(gsapMain) {
            this.gsapMain = gsapMain;
            
            // Buscar elementos
            this.header = document.getElementById('globalStickyHeader');
            this.loginButton = document.getElementById('loginbutton');
            this.clampElement = document.getElementById('clamp');
            
            if (!this.header) {
                console.warn('Header sticky no encontrado');
                return;
            }
            
            console.log('Iniciando módulo Sticky Header');
            this.setupAnimations();
            this.setupLoginButton();
        },
        
        setupAnimations: function() {
            const ctx = gsap.context(() => {
                
                // Registrar plugins
                gsap.registerPlugin(ScrollTrigger);
                
                // ScrollTrigger para el header
                ScrollTrigger.create({
                    trigger: this.header,
                    start: 'top 20px',
                    end: '+=99999',
                    pin: true,
                    pinSpacing: false,
                    scrub: false
                });
                
                // Smooth scroll para los enlaces internos
                const navLinks = this.header.querySelectorAll('.nav-link');
                
                navLinks.forEach((link) => {
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
        
        setupLoginButton: function() {
            if (!this.loginButton) {
                console.warn('Botón de login no encontrado en sticky-header');
                return;
            }
            
            console.log('📌 STICKY-HEADER: Botón de login encontrado, delegando control al sistema global');
            
            // Delegar el control de visibilidad al sistema global
            // El sistema en base.html ya maneja la visibilidad
            
            // Solo configurar el evento click
            this.loginButton.addEventListener('click', this.handleLoginClick.bind(this));
            
            // Emitir eventos GSAP para integración con el sistema global
            this.setupGSAPEvents();
        },
        
        setupGSAPEvents: function() {
            // Emitir eventos cuando detectemos cambios en las animaciones
            if (this.clampElement) {
                // Observer para detectar cambios en clamp
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'attributes' && 
                            (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                            
                            const rect = this.clampElement.getBoundingClientRect();
                            const visible = rect.top < window.innerHeight && rect.bottom > 0;
                            
                            if (visible) {
                                document.dispatchEvent(new CustomEvent('gsap:clamp:visible'));
                            } else {
                                document.dispatchEvent(new CustomEvent('gsap:clamp:hidden'));
                            }
                        }
                    });
                });
                
                observer.observe(this.clampElement, {
                    attributes: true,
                    attributeFilter: ['style', 'class']
                });
                
                this.clampObserver = observer;
            }
            
            // Observer para detectar animaciones del túnel
            const tunnelElement = document.getElementById('tunnel');
            if (tunnelElement) {
                const tunnelObserver = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                            if (tunnelElement.classList.contains('active')) {
                                document.dispatchEvent(new CustomEvent('gsap:tunnel:start'));
                            } else {
                                document.dispatchEvent(new CustomEvent('gsap:tunnel:end'));
                            }
                        }
                    });
                });
                
                tunnelObserver.observe(tunnelElement, {
                    attributes: true,
                    attributeFilter: ['class']
                });
                
                this.tunnelObserver = tunnelObserver;
            }
        },
        
        handleLoginClick: function() {
            // Animación de click con feedback
            gsap.to(this.loginButton, {
                scale: 0.95,
                duration: 0.1,
                ease: "power2.out",
                onComplete: () => {
                    gsap.to(this.loginButton, {
                        scale: 1,
                        duration: 0.2,
                        ease: "back.out(2)"
                    });
                }
            });
            
            // Aquí puedes agregar la lógica del login
            console.log('Botón de login clickeado');
            
            // Ejemplo: abrir modal o redirigir
            // window.location.href = '/login';
            // o this.openLoginModal();
        },
        
        // Método para testear el botón manualmente (para debugging)
        testLoginButton: function() {
            console.log('Testeando botón de login...');
            this.showLoginButton();
            setTimeout(() => {
                console.log('Intenta hacer click ahora');
            }, 500);
        },
        showLoginButton: function() {
            gsap.to(this.loginButton, {
                opacity: 1,
                scale: 1,
                duration: 0.4,
                ease: "back.out(1.7)"
            });
            gsap.set(this.loginButton, { pointerEvents: 'auto' });
        },
        
        // Método para ocultar el botón manualmente
        hideLoginButton: function() {
            gsap.to(this.loginButton, {
                opacity: 0,
                scale: 0.95,
                duration: 0.3,
                ease: "power2.out"
            });
            gsap.set(this.loginButton, { pointerEvents: 'none' });
        },
        
        destroy: function() {
            if (this.gsapContext) {
                this.gsapContext.revert();
            }
            
            // Limpiar interval
            if (this.buttonInterval) {
                clearInterval(this.buttonInterval);
            }
            
            // Limpiar event listeners
            if (this.loginButton) {
                this.loginButton.removeEventListener('click', this.handleLoginClick.bind(this));
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