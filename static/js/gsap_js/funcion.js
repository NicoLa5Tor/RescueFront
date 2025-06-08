// TIMELINE MODULE - JAVASCRIPT COMPLETAMENTE ENCAPSULADO
(function() {
    'use strict';
    
    // Función para inicializar el módulo timeline
    function initTimelineModule() {
        // Buscar todos los módulos timeline en la página
        const modules = document.querySelectorAll('[class^="timeline-module-wrapper-"]');
        
        modules.forEach(moduleElement => {
            // Obtener el ID único del módulo
            const moduleId = moduleElement.getAttribute('data-module-id') || 'default';
            const moduleClass = `.timeline-module-wrapper-${moduleId}`;
            
            // Verificar que GSAP esté cargado
            if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
                console.warn('GSAP o ScrollTrigger no están cargados para el módulo:', moduleId);
                return;
            }
            
            // Registrar plugins
            gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, MotionPathPlugin);
            
            // Crear contexto para este módulo específico
            const ctx = gsap.context(() => {
                
                // Configuración de GSAP para este contexto
                gsap.defaults({ ease: "power2.inOut" });
                
                // Selectores específicos del módulo
                const sel = {
                    module: moduleClass,
                    svg: `${moduleClass} .timeline-svg-element`,
                    balls: `${moduleClass} .tl-ball`,
                    icons: `${moduleClass} .tl-node-icon`,
                    cards: `${moduleClass} .tl-card`,
                    connectionLines: `${moduleClass} .tl-connection-line`,
                    mainLine: `${moduleClass} .tl-main-line`,
                    nodeGroups: `${moduleClass} .tl-node-group`,
                    pulseRings: `${moduleClass} .tl-pulse-ring`,
                    nodeRings: `${moduleClass} .tl-node-ring`,
                    travelingParticle: `${moduleClass} .tl-traveling-particle`,
                    particles: `${moduleClass} .timeline-particle`,
                    title: `${moduleClass} .timeline-title-gradient`,
                    subtitle: `${moduleClass} .timeline-subtitle, ${moduleClass} .timeline-description`
                };
                
                // Inicializar elementos
                gsap.set(sel.balls + ", " + sel.icons, { visibility: "visible", scale: 0 });
                gsap.set(sel.cards, { opacity: 0, y: 40, scale: 0.95 });
                gsap.set(sel.connectionLines, { drawSVG: "0%" });
                
                // Timeline principal con scroll
                const mainTimeline = gsap.timeline({
                    scrollTrigger: {
                        trigger: sel.svg,
                        start: "top 75%",
                        end: "bottom 25%",
                        scrub: 1.5,
                        pin: false,
                        onUpdate: (self) => {
                            updateParticlePosition(self.progress);
                        }
                    }
                });
                
                // Animación de la línea principal
                mainTimeline
                    .fromTo(sel.mainLine, 
                        { drawSVG: "0%", opacity: 0 },
                        { drawSVG: "100%", opacity: 0.8, duration: 2, ease: "none" }
                    )
                    .to(sel.connectionLines, {
                        drawSVG: "100%",
                        opacity: 1,
                        duration: 1,
                        stagger: 0.2,
                        ease: "power2.out"
                    }, "-=1.5");
                
                // Animación de los nodos
                const nodeTimeline = gsap.timeline({
                    scrollTrigger: {
                        trigger: sel.svg,
                        start: "top 60%",
                        end: "bottom 40%",
                        scrub: 1
                    }
                });
                
                // Secuencia de aparición de nodos
                for (let i = 1; i <= 5; i++) {
                    nodeTimeline.to(`${moduleClass} .tl-ball-0${i}, ${moduleClass} .tl-icon-0${i}`, {
                        scale: 1,
                        duration: 0.5,
                        ease: "back.out(1.7)"
                    }, i === 1 ? 0 : "-=0.3");
                }
                
                // Animación de las cards
                ScrollTrigger.batch(sel.cards, {
                    onEnter: (batch) => {
                        gsap.to(batch, {
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            duration: 0.8,
                            stagger: 0.15,
                            ease: "power3.out",
                            onComplete: function() {
                                batch.forEach(card => card.classList.add('active'));
                            }
                        });
                    },
                    start: "top 85%"
                });
                
                // Función para actualizar posición de partícula
                function updateParticlePosition(progress) {
                    const path = moduleElement.querySelector('.tl-main-line');
                    const particle = moduleElement.querySelector('.tl-traveling-particle');
                    if (!path || !particle) return;
                    
                    const length = path.getTotalLength();
                    const point = path.getPointAtLength(length * progress);
                    
                    gsap.set(particle, {
                        cx: point.x,
                        cy: point.y,
                        opacity: progress > 0 && progress < 1 ? 1 : 0
                    });
                }
                
                // Animación de rotación para los anillos
                gsap.to(sel.nodeRings, {
                    rotation: 360,
                    duration: 20,
                    repeat: -1,
                    ease: "none",
                    transformOrigin: "center"
                });
                
                // Efecto de brillo en la línea principal
                gsap.to(sel.mainLine, {
                    strokeDasharray: "10 5",
                    strokeDashoffset: -15,
                    duration: 2,
                    repeat: -1,
                    ease: "none"
                });
                
                // Animación del título
                gsap.from(sel.title, {
                    y: 100,
                    opacity: 0,
                    duration: 1.2,
                    ease: "power4.out",
                    scrollTrigger: {
                        trigger: `${moduleClass} .timeline-title`,
                        start: "top 80%",
                        once: true
                    }
                });
                
                gsap.from(sel.subtitle, {
                    y: 30,
                    opacity: 0,
                    duration: 0.8,
                    stagger: 0.1,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: `${moduleClass} .timeline-header`,
                        start: "top 80%",
                        once: true
                    }
                });
                
                // Hover effects para los nodos
                moduleElement.querySelectorAll('.tl-node-group').forEach((node, index) => {
                    node.addEventListener('mouseenter', () => {
                        gsap.to(node.querySelector('.tl-ball'), {
                            scale: 1.2,
                            duration: 0.3,
                            ease: "power2.out"
                        });
                        
                        gsap.to(node.querySelector('.tl-node-bg'), {
                            scale: 1.2,
                            opacity: 0.3,
                            duration: 0.3
                        });
                        
                        const card = moduleElement.querySelector(`.tl-card-0${index + 1}`);
                        if (card) {
                            gsap.to(card, {
                                y: -10,
                                scale: 1.02,
                                duration: 0.3,
                                ease: "power2.out"
                            });
                        }
                    });
                    
                    node.addEventListener('mouseleave', () => {
                        gsap.to(node.querySelector('.tl-ball'), {
                            scale: 1,
                            duration: 0.3,
                            ease: "power2.out"
                        });
                        
                        gsap.to(node.querySelector('.tl-node-bg'), {
                            scale: 1,
                            opacity: 0.1,
                            duration: 0.3
                        });
                        
                        const card = moduleElement.querySelector(`.tl-card-0${index + 1}`);
                        if (card && card.classList.contains('active')) {
                            gsap.to(card, {
                                y: 0,
                                scale: 1,
                                duration: 0.3,
                                ease: "power2.out"
                            });
                        }
                    });
                });
                
                // Efecto parallax para las partículas (solo dentro del módulo)
                moduleElement.addEventListener('mousemove', (e) => {
                    const rect = moduleElement.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / rect.width;
                    const y = (e.clientY - rect.top) / rect.height;
                    
                    moduleElement.querySelectorAll('.timeline-particle').forEach((particle, index) => {
                        const speed = (index + 1) * 20;
                        gsap.to(particle, {
                            x: (x - 0.5) * speed,
                            y: (y - 0.5) * speed,
                            duration: 1,
                            ease: "power2.out"
                        });
                    });
                });
                
                // Animación de pulso continuo
                function createPulses() {
                    moduleElement.querySelectorAll('.tl-pulse-ring').forEach((ring, index) => {
                        gsap.to(ring, {
                            scale: 2,
                            opacity: 0,
                            duration: 2,
                            repeat: -1,
                            ease: "power2.out",
                            delay: index * 0.2
                        });
                    });
                }
                
                createPulses();
                
                // Efecto de respiración para los iconos
                gsap.to(sel.icons, {
                    scale: 1.1,
                    duration: 2,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                    stagger: {
                        each: 0.2,
                        from: "start"
                    }
                });
                
                // Animación inicial del SVG
                gsap.from(sel.svg, {
                    opacity: 0,
                    scale: 0.8,
                    duration: 1.5,
                    ease: "power4.out",
                    delay: 0.2
                });
                
            }, moduleElement); // Contexto limitado a este módulo
            
            // Guardar el contexto para poder limpiarlo después si es necesario
            moduleElement._gsapContext = ctx;
        });
    }
    
    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTimelineModule);
    } else {
        initTimelineModule();
    }
    
    // Refresh ScrollTrigger on resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            ScrollTrigger.refresh();
        }, 250);
    });
    
})();