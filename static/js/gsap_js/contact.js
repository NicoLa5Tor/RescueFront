(function() {
    'use strict';
    
    const ContactModule = {
        id: 'contact-animations',
        container: null,
        animations: [],
        hasAnimated: false,
        
        // Inicializar módulo
        init: function(gsapMain) {
            this.gsapMain = gsapMain;
            this.container = document.querySelector('.contact-wrapper, .contact-container');
            
            if (!this.container) {
                //console.warn('Contact container no encontrado');
                return;
            }
            
            //console.log('🎬 Inicializando animaciones de contacto...');
            
            // Crear partículas de fondo
            this.createParticles();
            
            // Configurar animaciones con ScrollTrigger para que se ejecuten cuando sean visibles
            this.setupScrollTriggeredAnimations();
            this.setupInteractions();
            this.setupResponsiveHandlers();

            //console.log('✅ Animaciones de contacto inicializadas');
        },
        
        // Crear partículas como en hero
        createParticles: function() {
            const particlesContainer = this.container.querySelector('.particles-container');
            if (!particlesContainer) return;
            
            // Ajustar cantidad de partículas según el tamaño de pantalla
            const particleCount = window.innerWidth > 1024 ? 40 : 25;
            
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'contact-particle';
                particle.style.cssText = `
                    position: absolute;
                    width: 2px;
                    height: 2px;
                    background: linear-gradient(45deg, #ef4444, #f97316);
                    border-radius: 50%;
                    opacity: 0.7;
                `;
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
        
        // Configurar animaciones que se activan con scroll usando batch
        setupScrollTriggeredAnimations: function() {
            // Usar batchAnimate de GSAPMain para elementos principales
            this.gsapMain.batchAnimate(
                '.contact-title, .contact-subtitle, .contact-icon-wrapper',
                {
                    enterAnimation: {
                        opacity: 1,
                        y: 0,
                        duration: 0.8,
                        ease: "power2.out",
                        stagger: 0.2
                    },
                    options: {
                        start: "top 80%",
                        end: "bottom 20%"
                    }
                }
            );
            
            // Batch para tarjetas de contacto e información
            this.gsapMain.batchAnimate(
                '.contact-item, .glass-card, .stat-card',
                {
                    enterAnimation: {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        duration: 0.6,
                        ease: "back.out(1.7)",
                        stagger: 0.1
                    },
                    options: {
                        start: "top 85%",
                        end: "bottom 15%"
                    }
                }
            );
            
            // Batch para formulario
            this.gsapMain.batchAnimate(
                '.form-section, .contact-form',
                {
                    enterAnimation: {
                        opacity: 1,
                        x: 0,
                        duration: 0.8,
                        ease: "power2.out"
                    },
                    options: {
                        start: "top 80%",
                        end: "bottom 20%"
                    }
                }
            );
            
            // Estados iniciales para los elementos que se van a animar
            gsap.set('.contact-title, .contact-subtitle, .contact-icon-wrapper', {
                opacity: 0,
                y: 50
            });
            
            gsap.set('.contact-item, .glass-card, .stat-card', {
                opacity: 0,
                y: 30,
                scale: 0.9
            });
            
            gsap.set('.form-section, .contact-form', {
                opacity: 0,
                x: 50
            });
            
            // Animar campos del formulario con ScrollTrigger individual
            const formFields = document.querySelectorAll('.form-group');
            if (formFields.length > 0) {
                gsap.set(formFields, { opacity: 0, y: 20 });
                
                ScrollTrigger.create({
                    trigger: '.contact-form',
                    start: "top 70%",
                    onEnter: () => {
                        gsap.to(formFields, {
                            opacity: 1,
                            y: 0,
                            duration: 0.5,
                            ease: "power2.out",
                            stagger: 0.1,
                            delay: 0.3
                        });
                    }
                });
            }
        },
        
        // Setup interacciones mejoradas para táctil
        setupInteractions: function() {
            const contactItems = this.container.querySelectorAll('.contact-item, .stat-card, .glass-card');
            
            contactItems.forEach((item, index) => {
                // Eventos para mouse
                item.addEventListener('mouseenter', () => {
                    if (window.innerWidth > 768) {
                        gsap.to(item, {
                            y: -5,
                            scale: 1.02,
                            duration: 0.3,
                            ease: "power2.out"
                        });
                        
                        // Animar icono si existe
                        const icon = item.querySelector('.contact-icon, svg, i');
                        if (icon) {
                            gsap.to(icon, {
                                scale: 1.1,
                                rotation: 5,
                                duration: 0.3,
                                ease: "back.out(1.7)"
                            });
                        }
                    }
                });
                
                item.addEventListener('mouseleave', () => {
                    if (window.innerWidth > 768) {
                        gsap.to(item, {
                            y: 0,
                            scale: 1,
                            duration: 0.3,
                            ease: "power2.inOut"
                        });
                        
                        // Resetear icono
                        const icon = item.querySelector('.contact-icon, svg, i');
                        if (icon) {
                            gsap.to(icon, {
                                scale: 1,
                                rotation: 0,
                                duration: 0.3,
                                ease: "power2.out"
                            });
                        }
                    }
                });
                
                // Eventos táctiles para móviles
                item.addEventListener('touchstart', (e) => {
                    gsap.to(item, {
                        scale: 1.02,
                        duration: 0.2,
                        ease: "power2.out"
                    });
                });
                
                item.addEventListener('touchend', (e) => {
                    gsap.to(item, {
                        scale: 1,
                        duration: 0.2,
                        ease: "power2.inOut"
                    });
                });
            });
            
            // Animaciones para contadores de estadísticas
            this.animateCounters();
        },
        
        // Animar contadores de estadísticas
        animateCounters: function() {
            const statNumbers = this.container.querySelectorAll('.stat-number[data-target]');
            
            statNumbers.forEach(stat => {
                const target = parseInt(stat.getAttribute('data-target'));
                if (target) {
                    const counter = { value: 0 };
                    
                    gsap.to(counter, {
                        value: target,
                        duration: 2,
                        ease: "power2.out",
                        onUpdate: () => {
                            stat.textContent = Math.round(counter.value);
                        },
                        scrollTrigger: {
                            trigger: stat,
                            start: "top 80%",
                            once: true
                        }
                    });
                }
            });
        },
        
        // Configurar animaciones del formulario
        setupFormAnimations: function() {
            const contactForm = document.querySelector('.contact-form, #contact-form, form');
            if (!contactForm) return;
            
            // Animar entrada del formulario
            const formAnim = gsap.fromTo(contactForm, {
                x: 50,
                opacity: 0
            }, {
                x: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: contactForm,
                    start: "top 80%",
                    once: true
                }
            });
            this.animations.push(formAnim);
            
            // Animar campos del formulario con stagger
            const formFields = contactForm.querySelectorAll('.form-group, .input-group, input, textarea, select');
            if (formFields.length > 0) {
                gsap.set(formFields, { y: 20, opacity: 0 });
                
                const fieldsAnim = gsap.to(formFields, {
                    y: 0,
                    opacity: 1,
                    duration: 0.5,
                    ease: "power2.out",
                    stagger: 0.1,
                    delay: 0.3,
                    scrollTrigger: {
                        trigger: contactForm,
                        start: "top 80%",
                        once: true
                    }
                });
                this.animations.push(fieldsAnim);
            }
            
            // Animar botón de envío
            const submitButton = contactForm.querySelector('button[type="submit"], .submit-btn, .send-btn');
            if (submitButton) {
                const buttonAnim = gsap.fromTo(submitButton, {
                    scale: 0.8,
                    opacity: 0
                }, {
                    scale: 1,
                    opacity: 1,
                    duration: 0.6,
                    ease: "back.out(1.7)",
                    delay: 0.5,
                    scrollTrigger: {
                        trigger: submitButton,
                        start: "top 85%",
                        once: true
                    }
                });
                this.animations.push(buttonAnim);
            }
            
            // Configurar animaciones de interacción en los campos
            this.setupFormFieldInteractions(contactForm);
        },
        
        // Configurar interacciones de campos del formulario
        setupFormFieldInteractions: function(form) {
            const inputs = form.querySelectorAll('input, textarea, select');
            
            inputs.forEach(input => {
                // Animación de focus
                input.addEventListener('focus', () => {
                    gsap.to(input, {
                        scale: 1.02,
                        boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
                        duration: 0.3,
                        ease: "power2.out"
                    });
                    
                    // Animar label si existe
                    const label = form.querySelector(`label[for="${input.id}"]`) || 
                                 input.previousElementSibling?.tagName === 'LABEL' ? input.previousElementSibling : null;
                    if (label) {
                        gsap.to(label, {
                            color: "#3B82F6",
                            scale: 1.05,
                            duration: 0.3,
                            ease: "power2.out"
                        });
                    }
                });
                
                // Animación de blur
                input.addEventListener('blur', () => {
                    gsap.to(input, {
                        scale: 1,
                        boxShadow: "none",
                        duration: 0.3,
                        ease: "power2.out"
                    });
                    
                    // Resetear label
                    const label = form.querySelector(`label[for="${input.id}"]`) || 
                                 input.previousElementSibling?.tagName === 'LABEL' ? input.previousElementSibling : null;
                    if (label) {
                        gsap.to(label, {
                            color: "",
                            scale: 1,
                            duration: 0.3,
                            ease: "power2.out"
                        });
                    }
                });
                
                // Animación de validación en tiempo real
                input.addEventListener('input', () => {
                    if (input.checkValidity && input.checkValidity()) {
                        gsap.to(input, {
                            borderColor: "#10B981",
                            duration: 0.3
                        });
                    } else if (input.value.length > 0) {
                        gsap.to(input, {
                            borderColor: "#EF4444",
                            duration: 0.3
                        });
                    }
                });
            });
        },
        
        // Configurar animaciones de las tarjetas de contacto
        setupContactCardAnimations: function() {
            const contactCards = document.querySelectorAll('.contact-card, .info-card, .contact-method');
            
            contactCards.forEach((card, index) => {
                // Hover animations
                card.addEventListener('mouseenter', () => {
                    gsap.to(card, {
                        y: -8,
                        scale: 1.05,
                        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                        duration: 0.3,
                        ease: "power2.out"
                    });
                    
                    // Animar icono si existe
                    const icon = card.querySelector('i, .icon, svg');
                    if (icon) {
                        gsap.to(icon, {
                            scale: 1.2,
                            rotation: 5,
                            duration: 0.3,
                            ease: "back.out(1.7)"
                        });
                    }
                });
                
                card.addEventListener('mouseleave', () => {
                    gsap.to(card, {
                        y: 0,
                        scale: 1,
                        boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                        duration: 0.3,
                        ease: "power2.out"
                    });
                    
                    // Resetear icono
                    const icon = card.querySelector('i, .icon, svg');
                    if (icon) {
                        gsap.to(icon, {
                            scale: 1,
                            rotation: 0,
                            duration: 0.3,
                            ease: "power2.out"
                        });
                    }
                });
                
                // Click animation
                card.addEventListener('click', () => {
                    gsap.to(card, {
                        scale: 0.98,
                        duration: 0.1,
                        yoyo: true,
                        repeat: 1,
                        ease: "power2.inOut"
                    });
                });
            });
        },
        
        // Configurar elementos interactivos
        setupInteractiveElements: function() {
            // Animar botones con efectos especiales
            const buttons = document.querySelectorAll('.btn, button, .contact-btn');
            buttons.forEach(button => {
                button.addEventListener('mouseenter', () => {
                    gsap.to(button, {
                        scale: 1.05,
                        duration: 0.3,
                        ease: "power2.out"
                    });
                });
                
                button.addEventListener('mouseleave', () => {
                    gsap.to(button, {
                        scale: 1,
                        duration: 0.3,
                        ease: "power2.out"
                    });
                });
                
                button.addEventListener('click', () => {
                    // Efecto de ripple
                    const ripple = document.createElement('span');
                    ripple.className = 'ripple-effect';
                    ripple.style.cssText = `
                        position: absolute;
                        border-radius: 50%;
                        background: rgba(255,255,255,0.6);
                        transform: scale(0);
                        animation: ripple 0.6s linear;
                        pointer-events: none;
                    `;
                    
                    button.style.position = 'relative';
                    button.style.overflow = 'hidden';
                    button.appendChild(ripple);
                    
                    gsap.to(ripple, {
                        scale: 4,
                        opacity: 0,
                        duration: 0.6,
                        ease: "power2.out",
                        onComplete: () => ripple.remove()
                    });
                });
            });
            
            // Animar enlaces de redes sociales si existen
            const socialLinks = document.querySelectorAll('.social-link, .social-icon, .social a');
            socialLinks.forEach(link => {
                link.addEventListener('mouseenter', () => {
                    gsap.to(link, {
                        rotation: 360,
                        scale: 1.2,
                        duration: 0.5,
                        ease: "back.out(1.7)"
                    });
                });
                
                link.addEventListener('mouseleave', () => {
                    gsap.to(link, {
                        rotation: 0,
                        scale: 1,
                        duration: 0.3,
                        ease: "power2.out"
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
            
            // Ajustar animaciones según el tamaño de pantalla
            if (width <= 768) {
                // Simplificar animaciones en móvil
                gsap.globalTimeline.timeScale(1.5); // Hacer animaciones más rápidas
            } else {
                gsap.globalTimeline.timeScale(1); // Velocidad normal
            }
            
            // Refresh ScrollTrigger
            ScrollTrigger.refresh();
        },
        
        // Animar envío del formulario
        animateFormSubmission: function(form, success = true) {
            const submitButton = form.querySelector('button[type="submit"], .submit-btn');
            
            if (success) {
                // Animación de éxito
                gsap.to(form, {
                    scale: 1.02,
                    duration: 0.3,
                    yoyo: true,
                    repeat: 1,
                    ease: "power2.inOut"
                });
                
                // Cambiar botón temporalmente
                if (submitButton) {
                    const originalText = submitButton.textContent;
                    submitButton.textContent = '¡Enviado!';
                    gsap.to(submitButton, {
                        backgroundColor: "#10B981",
                        scale: 1.1,
                        duration: 0.3,
                        ease: "back.out(1.7)",
                        onComplete: () => {
                            setTimeout(() => {
                                submitButton.textContent = originalText;
                                gsap.to(submitButton, {
                                    backgroundColor: "",
                                    scale: 1,
                                    duration: 0.3
                                });
                            }, 2000);
                        }
                    });
                }
                
                // Crear partículas de celebración
                this.createSuccessParticles(form);
                
            } else {
                // Animación de error
                gsap.to(form, {
                    x: -10,
                    duration: 0.1,
                    repeat: 5,
                    yoyo: true,
                    ease: "power2.inOut",
                    onComplete: () => {
                        gsap.set(form, { x: 0 });
                    }
                });
                
                if (submitButton) {
                    gsap.to(submitButton, {
                        backgroundColor: "#EF4444",
                        duration: 0.3,
                        yoyo: true,
                        repeat: 1
                    });
                }
            }
        },
        
        // Crear partículas de éxito
        createSuccessParticles: function(container) {
            for (let i = 0; i < 20; i++) {
                const particle = document.createElement('div');
                particle.style.cssText = `
                    position: absolute;
                    width: 6px;
                    height: 6px;
                    background: #10B981;
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 1000;
                `;
                
                const rect = container.getBoundingClientRect();
                particle.style.left = (rect.left + rect.width / 2) + 'px';
                particle.style.top = (rect.top + rect.height / 2) + 'px';
                
                document.body.appendChild(particle);
                
                gsap.to(particle, {
                    x: (Math.random() - 0.5) * 200,
                    y: (Math.random() - 0.5) * 200,
                    opacity: 0,
                    scale: 0,
                    duration: 1.5,
                    ease: "power2.out",
                    delay: Math.random() * 0.5,
                    onComplete: () => particle.remove()
                });
            }
        },
        
        // Destruir módulo
        destroy: function() {
            // Limpiar todas las animaciones
            this.animations.forEach(anim => {
                if (anim.kill) anim.kill();
            });
            this.animations = [];
            
            // Limpiar ScrollTriggers específicos del contacto
            ScrollTrigger.getAll().forEach(st => {
                if (st.trigger && (
                    st.trigger.closest('.contact-container') ||
                    st.trigger.closest('#contact-section') ||
                    st.trigger.matches('.contact-*')
                )) {
                    st.kill();
                }
            });
            
            // Reset del estado
            this.hasAnimated = false;
            
            //console.log('🧹 Contact module destruido');
        }
    };
    
    // Registrar módulo cuando GSAP esté listo
    window.addEventListener('gsap:initialized', () => {
        GSAPMain.registerModule(ContactModule.id, ContactModule);
    });
    
    // Si GSAP ya está inicializado, registrar inmediatamente
    if (window.GSAPMain && window.GSAPMain.initialized) {
        GSAPMain.registerModule(ContactModule.id, ContactModule);
    }
    
    // Función global para animar envío de formulario (si se necesita desde fuera)
    window.animateContactFormSubmission = function(form, success = true) {
        const module = GSAPMain.getModule('contact-animations');
        if (module) {
            module.animateFormSubmission(form, success);
        }
    };
    
})();

// CSS adicional para efectos
const contactAnimationStyles = `
@keyframes ripple {
    to {
        transform: scale(4);
        opacity: 0;
    }
}

.contact-card, .info-card, .contact-method {
    transition: transform 0.3s ease;
}

.form-group input:focus, .form-group textarea:focus {
    outline: none;
    border-color: #3B82F6;
}

.gsap-contact-ready .contact-header,
.gsap-contact-ready .contact-description,
.gsap-contact-ready .contact-item,
.gsap-contact-ready .contact-form,
.gsap-contact-ready .map-container {
    opacity: 0;
}
`;

// Insertar estilos
if (!document.getElementById('contact-animation-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'contact-animation-styles';
    styleElement.textContent = contactAnimationStyles;
    document.head.appendChild(styleElement);
}

// Marcar como listo para animaciones
document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.classList.add('gsap-contact-ready');
});
