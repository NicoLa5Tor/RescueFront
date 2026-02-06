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
                //console.warn('Hero container no encontrado');
                return;
            }
            
            // IMPORTANTE: Establecer estados iniciales INMEDIATAMENTE para evitar flash
            this.setInitialStates();
            
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
        
        // Establecer estados iniciales inmediatamente
        setInitialStates: function() {
            //console.log('🎭 HERO: Estableciendo estados iniciales');
            
            // Ocultar elementos que se van a animar INMEDIATAMENTE
            gsap.set(['.title-word'], {
                y: 30, // Reducido a 30px para coherencia con el espaciado aumentado
                opacity: 0
            });
            
            gsap.set(['.status-badge'], {
                scale: 0,
                opacity: 0
            });
            
            gsap.set(['.hero-description'], {
                y: 30,
                opacity: 0
            });
            
            // BOTONES CTA COMENTADOS - No animar elementos que no existen
            // gsap.set(['.hero-buttons button'], {
            //     y: 30,
            //     opacity: 0
            // });
            
            gsap.set(['.hero-stats'], {
                y: 20,
                opacity: 0
            });
            
            gsap.set(['.hero-visual'], {
                scale: 0.8,
                opacity: 0
            });
            
            
            
            //console.log('✅ HERO: Estados iniciales establecidos');
        },
        
        // Configurar animaciones que se activan con scroll
        setupScrollTriggeredAnimations: function() {
            // Timeline principal que se activa cuando el hero es visible
            ScrollTrigger.create({
                trigger: '#hero',
                start: 'top 80%', // Empieza cuando el top del hero está al 80% del viewport
                once: true, // Solo se ejecuta una vez
                onEnter: () => {
                    if (!this.hasAnimated) {
                        //console.log('🎬 HERO: Iniciando animaciones de entrada');
                        this.animateContent();
                        this.hasAnimated = true;
                    }
                }
            });
            
            // Parallax y fade-out desactivados para aliviar carga
            
            
        },
        
        // Animar contenido
        animateContent: function() {
            //console.log('🎨 HERO: Creando timeline de animaciones');
            
            // Timeline para las animaciones de entrada
            const tl = gsap.timeline();
            
            // NO resetear propiedades - usar los estados ya establecidos
            
            // Animar títulos palabra por palabra
            tl.to('.title-word', {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.15,
                ease: "power3.out"
            })
            
            // Status badge
            .to('.status-badge', {
                scale: 1,
                opacity: 1,
                duration: 0.6,
                ease: "back.out(1.7)"
            }, "-=0.4")
            
            // Descripción
            .to('.hero-description', {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power2.out"
            }, "-=0.2")
            
            // Botones CTA - COMENTADO (botones removidos del HTML)
            // .to('.hero-buttons button', {
            //     y: 0,
            //     opacity: 1,
            //     duration: 0.6,
            //     stagger: 0.1,
            //     ease: "power2.out"
            // }, "-=0.3")
            
            // Estadísticas
            .to('.hero-stats', {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power2.out"
            }, "-=0.2")
            
            // Visualización final
            .to('.hero-visual', {
                scale: 1,
                opacity: 1,
                duration: 1,
                ease: "back.out(1.7)"
            }, "-=0.6");
            
            this.animations.push(tl);
            
            // Animación continua del hub desactivada para aliviar carga
            
            //console.log('✅ HERO: Timeline de animaciones creado');
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
            
            //console.log('Hero module destruido');
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
    
    // Configuración global de GSAP para mejor rendimiento (optimizada para Chrome)
    gsap.config({
        force3D: false, // Desactivado para evitar problemas en Chrome
        nullTargetWarn: false,
        trialWarn: false
    });
    
    // Refrescar ScrollTrigger en cambios de orientación
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            ScrollTrigger.refresh();
        }, 100);
    });
    
    // Inicializar GSAPMain
    GSAPMain.init();

    
});

// Optimización de rendimiento para móviles
if ('ontouchstart' in window) {
    document.addEventListener('touchstart', function() {}, { passive: true });
    document.addEventListener('touchmove', function() {}, { passive: true });
}
