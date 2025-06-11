(function() {
    'use strict';
    
    const HeroModule = {
        id: 'smoother-draw-hero',
        container: null,
        animations: [],
        hasAnimated: false,
        
        // Inicializar módulo
        init: function(gsapMain) {
            this.gsapMain = gsapMain;
            this.container = document.querySelector('#hero');
            
            if (!this.container) {
                console.warn('Hero container no encontrado');
                return;
            }
            
            // Crear partículas solo si la pantalla es lo suficientemente grande
            if (window.innerWidth > 768) {
                this.createParticles();
            }
            
            // Configurar animaciones con ScrollTrigger para que se ejecuten cuando sean visibles
            this.setupScrollTriggeredAnimations();
            this.setupInteractions();
            this.setupResponsiveHandlers();
        },
        
        // Crear partículas con cantidad adaptativa
        createParticles: function() {
            const particlesContainer = this.container.querySelector('.particles-container');
            if (!particlesContainer) return;
            
            // Ajustar cantidad de partículas según el tamaño de pantalla
            const particleCount = window.innerWidth > 1024 ? 50 : 30;
            
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                particlesContainer.appendChild(particle);
                
                // Usar GSAP global para animar
                const anim = gsap.to(particle, {
                    y: -window.innerHeight,
                    x: (Math.random() - 0.5) * 200,
                    opacity: 0,
                    duration: 10 + Math.random() * 10,
                    repeat: -1,
                    ease: "none",
                    delay: Math.random() * 5
                });
                
                this.animations.push(anim);
            }
        },
        
        // Configurar animaciones que se activan con scroll
        setupScrollTriggeredAnimations: function() {
            // Timeline principal que se activa cuando el hero es visible
            const mainTl = this.gsapMain.createTimeline({
                scrollTrigger: {
                    trigger: '#hero',
                    start: 'top 80%', // Empieza cuando el top del hero está al 80% del viewport
                    end: 'center center',
                    once: true, // Solo se ejecuta una vez
                    onEnter: () => {
                        if (!this.hasAnimated) {
                            this.animateContent();
                            this.hasAnimated = true;
                        }
                    }
                }
            });
            
            // Parallax mejorado para móviles
            if (window.innerWidth > 768) {
                this.gsapMain.createParallax('.gradient-orbs > div', 0.5, {
                    trigger: '#hero'
                });
            }
            
            // Fade out en scroll con mejor rendimiento
            const fadeOutAnim = gsap.to('.hero-content', {
                opacity: 0.1,
                y: -50,
                ease: "power2.inOut"
            });
            
            ScrollTrigger.create({
                trigger: '#hero',
                start: 'center center',
                end: 'bottom center',
                scrub: 1,
                animation: fadeOutAnim
            });
            
            this.animations.push(fadeOutAnim);
        },
        
        // Animar contenido
        animateContent: function() {
            // Timeline para las animaciones de entrada
            const tl = this.gsapMain.createTimeline();
            
            // Resetear estados iniciales
            gsap.set(['.title-word', '.status-badge', '.hero-description', '.hero-buttons button', '.hero-stats', '.hero-visual'], {
                clearProps: "all"
            });
            
            tl.to('.title-word', {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.1,
                ease: "power3.out"
            })
            .from('.status-badge', {
                scale: 0,
                opacity: 0,
                duration: 0.6,
                ease: "back.out(1.7)"
            }, "-=0.5")
            .from('.hero-description', {
                y: 20,
                opacity: 0,
                duration: 0.8,
                ease: "power2.out"
            }, "-=0.3")
            .from('.hero-buttons button', {
                y: 20,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: "power2.out"
            }, "-=0.4")
            .to('.hero-stats', {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power2.out"
            }, "-=0.2")
            .to('.hero-visual', {
                scale: 1,
                opacity: 1,
                duration: 1,
                ease: "back.out(1.7)"
            }, "-=0.8");
            
            this.animations.push(tl);
            
            // Animación continua del hub solo en desktop
            if (window.innerWidth > 768) {
                const hubAnim = gsap.to('.hub-core', {
                    boxShadow: '0 0 80px rgba(239, 68, 68, 0.5), inset 0 0 40px rgba(239, 68, 68, 0.2)',
                    duration: 2,
                    repeat: -1,
                    yoyo: true,
                    ease: "power1.inOut"
                });
                
                this.animations.push(hubAnim);
            }
        },
        
        // Setup interacciones mejoradas para táctil
        setupInteractions: function() {
            const devices = this.container.querySelectorAll('.orbit-device');
            
            devices.forEach((device, index) => {
                // Eventos para mouse
                device.addEventListener('mouseenter', () => {
                    if (window.innerWidth > 768) {
                        gsap.to(device, {
                            scale: 1.2,
                            duration: 0.3,
                            ease: "power2.out"
                        });
                    }
                });
                
                device.addEventListener('mouseleave', () => {
                    if (window.innerWidth > 768) {
                        gsap.to(device, {
                            scale: 1,
                            duration: 0.3,
                            ease: "power2.inOut"
                        });
                    }
                });
                
                // Eventos táctiles para móviles
                device.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    gsap.to(device, {
                        scale: 1.2,
                        duration: 0.3,
                        ease: "power2.out"
                    });
                });
                
                device.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    gsap.to(device, {
                        scale: 1,
                        duration: 0.3,
                        ease: "power2.inOut"
                    });
                });
            });
        },
        
        // Configurar manejadores responsive
        setupResponsiveHandlers: function() {
            let resizeTimer;
            
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    this.handleResize();
                }, 250);
            });
        },
        
        // Manejar cambios de tamaño
        handleResize: function() {
            const width = window.innerWidth;
            
            // Ajustar partículas
            const particlesContainer = this.container.querySelector('.particles-container');
            if (particlesContainer) {
                if (width <= 768 && particlesContainer.children.length > 0) {
                    // Remover partículas en móvil
                    particlesContainer.innerHTML = '';
                    // Matar animaciones de partículas
                    this.animations = this.animations.filter(anim => {
                        if (anim._targets && anim._targets[0] && anim._targets[0].classList && anim._targets[0].classList.contains('particle')) {
                            anim.kill();
                            return false;
                        }
                        return true;
                    });
                } else if (width > 768 && particlesContainer.children.length === 0) {
                    // Recrear partículas en desktop
                    this.createParticles();
                }
            }
            
            // Ajustar animaciones según el tamaño
            if (width <= 768) {
                // Simplificar animaciones en móvil
                gsap.set('.ring', { animationDuration: '0s' });
            } else {
                // Restaurar animaciones en desktop
                gsap.set('.ring-1', { animationDuration: '20s' });
                gsap.set('.ring-2', { animationDuration: '30s' });
                gsap.set('.ring-3', { animationDuration: '40s' });
            }
        },
        
        // Destruir módulo
        destroy: function() {
            // Limpiar todas las animaciones
            this.animations.forEach(anim => {
                if (anim.kill) anim.kill();
            });
            this.animations = [];
            
            // Limpiar ScrollTriggers específicos
            ScrollTrigger.getAll().forEach(st => {
                if (st.trigger && st.trigger.closest('#hero')) {
                    st.kill();
                }
            });
            
            // Limpiar partículas
            const particlesContainer = this.container.querySelector('.particles-container');
            if (particlesContainer) {
                particlesContainer.innerHTML = '';
            }
            
            // Reset del estado
            this.hasAnimated = false;
            
            console.log('Hero module destruido');
        }
    };
    
    // Registrar módulo cuando GSAP esté listo
    window.addEventListener('gsap:initialized', () => {
        GSAPMain.registerModule(HeroModule.id, HeroModule);
    });
    
    // Si GSAP ya está inicializado, registrar inmediatamente
    if (window.GSAPMain && window.GSAPMain.initialized) {
        GSAPMain.registerModule(HeroModule.id, HeroModule);
    }
})();

// Inicializar GSAP cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Registrar plugins
    gsap.registerPlugin(ScrollTrigger);
    
    // Configuración global de GSAP para mejor rendimiento
    gsap.config({
        force3D: true,
        nullTargetWarn: false
    });
    
    // Refrescar ScrollTrigger en cambios de orientación
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            ScrollTrigger.refresh();
        }, 100);
    });
    
    // Inicializar GSAPMain
    GSAPMain.init();

    // Transición suave hacia el módulo Tunnel
    const hero = document.querySelector('#hero');
    const tunnel = document.querySelector('#tunnel');
    if (hero && tunnel) {
        gsap.set(tunnel, { opacity: 0 });
        gsap.timeline({
            scrollTrigger: {
                trigger: tunnel,
                start: 'top bottom',
                end: 'top top',
                scrub: true
            }
        })
        .to(tunnel, { opacity: 1, ease: 'none' }, 0)
        .to(hero, { opacity: 0, ease: 'none' }, 0);
    }
});

// Optimización de rendimiento para móviles
if ('ontouchstart' in window) {
    document.addEventListener('touchstart', function() {}, { passive: true });
    document.addEventListener('touchmove', function() {}, { passive: true });
}
