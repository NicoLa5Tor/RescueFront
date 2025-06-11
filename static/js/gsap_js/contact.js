(function() {
    'use strict';

    // Email Configuration (Replace with your credentials)
    const EMAIL_CONFIG = {
        serviceId: 'YOUR_EMAILJS_SERVICE_ID',
        templateId: 'YOUR_EMAILJS_TEMPLATE_ID',
        publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',
        recipientEmail: 'tu-email@ejemplo.com'
    };

    const ContactModule = {
        id: 'contact-module',
        container: null,
        rocketPath: null,
        particleSystem: null,
        
        init: function(gsapMain) {
            this.gsapMain = gsapMain;
            this.container = document.querySelector('#contact-us');
            if (!this.container) return;
            
            // Initialize EmailJS
            this.initEmailJS();
            
            // Build the contact section
            this.buildContactSection();
            
            // Setup all features
            this.setupRocketAnimation();
            this.createParticleSystem();
            this.setupForm();
            this.setupAnimations();
            this.setupIntersectionObserver();
        },

        initEmailJS: function() {
            // Load EmailJS SDK
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
            script.onload = () => {
                emailjs.init(EMAIL_CONFIG.publicKey);
            };
            document.head.appendChild(script);
        },

        buildContactSection: function() {
            this.container.innerHTML = `
                <div class="contact-bg absolute inset-0"></div>
                <div class="grid-overlay absolute inset-0 opacity-20"></div>
                
                <!-- Rocket Canvas -->
                <canvas id="rocketCanvas" class="absolute inset-0 pointer-events-none"></canvas>
                
                <!-- Particle System -->
                <div class="particle-system absolute inset-0"></div>
                
                <!-- Main Content -->
                <div class="relative z-10 min-h-screen flex items-center justify-center px-4 py-16">
                    <div class="contact-container max-w-7xl w-full">
                        
                        <!-- Header -->
                        <div class="text-center mb-16 relative">
                            <div class="rocket-container inline-block mb-8 relative">
                                <div class="rocket-icon text-6xl lg:text-8xl transform transition-all duration-300">🚀</div>
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <div class="w-32 h-32 rounded-full bg-cyan-500/20 blur-xl animate-pulse"></div>
                                </div>
                            </div>
                            
                            <h2 class="contact-title text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6">
                                <span class="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent neon-text">
                                    Revoluciona tu Sistema IoT
                                </span>
                            </h2>
                            
                            <p class="contact-subtitle text-lg sm:text-xl lg:text-2xl text-gray-400 max-w-4xl mx-auto">
                                Tecnología de emergencia que salva vidas. Conecta con nosotros y transforma tu infraestructura.
                            </p>
                        </div>

                        <!-- Grid Layout -->
                        <div class="grid lg:grid-cols-2 gap-8 lg:gap-12">
                            
                            <!-- Contact Form -->
                            <div class="form-section">
                                <div class="glass-card rounded-3xl p-8 lg:p-10">
                                    <h3 class="text-2xl lg:text-3xl font-bold text-white mb-2">Solicita tu Demo</h3>
                                    <p class="text-gray-500 mb-8">Respuesta garantizada en menos de 24 horas</p>
                                    
                                    <form id="contactForm" class="space-y-6">
                                        <!-- Name Fields -->
                                        <div class="grid sm:grid-cols-2 gap-4">
                                            <div class="form-group">
                                                <label class="block text-sm font-medium text-gray-400 mb-2">
                                                    Nombre *
                                                </label>
                                                <input 
                                                    type="text" 
                                                    name="firstName"
                                                    required
                                                    class="form-input w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-cyan-500 transition-all duration-300"
                                                    placeholder="Tu nombre"
                                                />
                                            </div>
                                            <div class="form-group">
                                                <label class="block text-sm font-medium text-gray-400 mb-2">
                                                    Apellido *
                                                </label>
                                                <input 
                                                    type="text" 
                                                    name="lastName"
                                                    required
                                                    class="form-input w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-cyan-500 transition-all duration-300"
                                                    placeholder="Tu apellido"
                                                />
                                            </div>
                                        </div>

                                        <!-- Email -->
                                        <div class="form-group">
                                            <label class="block text-sm font-medium text-gray-400 mb-2">
                                                Email Corporativo *
                                            </label>
                                            <input 
                                                type="email" 
                                                name="email"
                                                required
                                                class="form-input w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-cyan-500 transition-all duration-300"
                                                placeholder="email@empresa.com"
                                            />
                                        </div>

                                        <!-- Company & Phone -->
                                        <div class="grid sm:grid-cols-2 gap-4">
                                            <div class="form-group">
                                                <label class="block text-sm font-medium text-gray-400 mb-2">
                                                    Empresa *
                                                </label>
                                                <input 
                                                    type="text" 
                                                    name="company"
                                                    required
                                                    class="form-input w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-cyan-500 transition-all duration-300"
                                                    placeholder="Nombre de empresa"
                                                />
                                            </div>
                                            <div class="form-group">
                                                <label class="block text-sm font-medium text-gray-400 mb-2">
                                                    Teléfono
                                                </label>
                                                <input 
                                                    type="tel" 
                                                    name="phone"
                                                    class="form-input w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-cyan-500 transition-all duration-300"
                                                    placeholder="+57 300 123 4567"
                                                />
                                            </div>
                                        </div>

                                        <!-- Project Type -->
                                        <div class="form-group">
                                            <label class="block text-sm font-medium text-gray-400 mb-2">
                                                Tipo de Proyecto *
                                            </label>
                                            <select 
                                                name="projectType"
                                                required
                                                class="form-select w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 transition-all duration-300"
                                            >
                                                <option value="">Selecciona una opción</option>
                                                <option value="emergency">Sistemas de Emergencia</option>
                                                <option value="smart-city">Ciudad Inteligente</option>
                                                <option value="industrial">IoT Industrial</option>
                                                <option value="healthcare">Salud y Hospitales</option>
                                                <option value="education">Educación</option>
                                                <option value="other">Otro</option>
                                            </select>
                                        </div>

                                        <!-- Message -->
                                        <div class="form-group">
                                            <label class="block text-sm font-medium text-gray-400 mb-2">
                                                Mensaje
                                            </label>
                                            <textarea 
                                                name="message"
                                                rows="4"
                                                class="form-textarea w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-cyan-500 transition-all duration-300 resize-none"
                                                placeholder="Cuéntanos sobre tu proyecto..."
                                            ></textarea>
                                        </div>

                                        <!-- Privacy -->
                                        <div class="form-group">
                                            <label class="flex items-start space-x-3 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    name="privacy"
                                                    required
                                                    class="mt-1 w-5 h-5 bg-black/50 border-gray-800 rounded text-cyan-500 focus:ring-cyan-500"
                                                />
                                                <span class="text-sm text-gray-500">
                                                    Acepto la política de privacidad y el tratamiento de mis datos personales *
                                                </span>
                                            </label>
                                        </div>

                                        <!-- Submit Button -->
                                        <button 
                                            type="submit" 
                                            class="submit-btn w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-4 px-8 rounded-xl hover:from-cyan-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 cyan-glow"
                                        >
                                            <span class="flex items-center justify-center space-x-2">
                                                <span>Enviar Solicitud</span>
                                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                                                </svg>
                                            </span>
                                        </button>
                                    </form>

                                    <!-- Success Message -->
                                    <div class="success-message hidden mt-6">
                                        <div class="glass-card bg-green-500/10 border-green-500/30 rounded-xl p-6">
                                            <div class="flex items-center space-x-3">
                                                <svg class="w-8 h-8 text-green-400 success-checkmark" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-dasharray="100">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                                </svg>
                                                <div>
                                                    <h4 class="text-green-400 font-bold text-lg">¡Mensaje enviado!</h4>
                                                    <p class="text-green-300 text-sm">Te contactaremos pronto.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Contact Info -->
                            <div class="info-section space-y-8">
                                <!-- Quick Contact -->
                                <div class="glass-card rounded-3xl p-8">
                                    <h3 class="text-2xl font-bold text-white mb-6">Contacto Directo</h3>
                                    
                                    <div class="space-y-6">
                                        <!-- Email -->
                                        <div class="contact-item group">
                                            <div class="flex items-center space-x-4">
                                                <div class="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h4 class="text-white font-semibold">Email</h4>
                                                    <p class="text-cyan-400">contacto@iot-emergency.com</p>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- WhatsApp -->
                                        <div class="contact-item group">
                                            <div class="flex items-center space-x-4">
                                                <div class="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h4 class="text-white font-semibold">WhatsApp</h4>
                                                    <p class="text-green-400">+57 320 123 4567</p>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Location -->
                                        <div class="contact-item group">
                                            <div class="flex items-center space-x-4">
                                                <div class="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h4 class="text-white font-semibold">Ubicación</h4>
                                                    <p class="text-purple-400">Neiva, Huila, Colombia</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Stats -->
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="glass-card rounded-2xl p-6 text-center group hover:scale-105 transition-transform duration-300">
                                        <div class="text-4xl font-bold text-cyan-400 mb-2">24h</div>
                                        <div class="text-sm text-gray-500">Respuesta</div>
                                    </div>
                                    <div class="glass-card rounded-2xl p-6 text-center group hover:scale-105 transition-transform duration-300">
                                        <div class="text-4xl font-bold text-blue-400 mb-2">100+</div>
                                        <div class="text-sm text-gray-500">Proyectos</div>
                                    </div>
                                    <div class="glass-card rounded-2xl p-6 text-center group hover:scale-105 transition-transform duration-300">
                                        <div class="text-4xl font-bold text-purple-400 mb-2">99%</div>
                                        <div class="text-sm text-gray-500">Satisfacción</div>
                                    </div>
                                    <div class="glass-card rounded-2xl p-6 text-center group hover:scale-105 transition-transform duration-300">
                                        <div class="text-4xl font-bold text-pink-400 mb-2">5★</div>
                                        <div class="text-sm text-gray-500">Calificación</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        setupRocketAnimation: function() {
            const canvas = document.getElementById('rocketCanvas');
            const ctx = canvas.getContext('2d');
            const rocket = this.container.querySelector('.rocket-icon');
            
            // Set canvas size
            const resizeCanvas = () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            };
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);

            // Create rocket path
            this.rocketPath = {
                points: [],
                currentIndex: 0
            };

            // Generate curved path
            const generatePath = () => {
                const points = [];
                const steps = 100;
                const startX = -100;
                const endX = canvas.width + 100;
                const centerY = canvas.height / 2;
                
                for (let i = 0; i <= steps; i++) {
                    const t = i / steps;
                    const x = startX + (endX - startX) * t;
                    const y = centerY + Math.sin(t * Math.PI * 2) * 150 * Math.cos(t * Math.PI);
                    points.push({ x, y });
                }
                
                return points;
            };

            // Animate rocket on scroll
            gsap.timeline({
                scrollTrigger: {
                    trigger: this.container,
                    start: "top 80%",
                    end: "bottom 20%",
                    scrub: 1,
                    onUpdate: (self) => {
                        const progress = self.progress;
                        const pathPoints = generatePath();
                        const index = Math.floor(progress * (pathPoints.length - 1));
                        const point = pathPoints[index];
                        
                        if (point) {
                            // Move rocket
                            gsap.set(rocket, {
                                x: point.x - window.innerWidth / 2,
                                y: point.y - window.innerHeight / 2,
                                rotation: Math.atan2(
                                    pathPoints[Math.min(index + 1, pathPoints.length - 1)].y - point.y,
                                    pathPoints[Math.min(index + 1, pathPoints.length - 1)].x - point.x
                                ) * 180 / Math.PI
                            });

                            // Draw trail
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            ctx.beginPath();
                            ctx.strokeStyle = `rgba(6, 182, 212, ${0.5 * (1 - progress)})`;
                            ctx.lineWidth = 3;
                            
                            for (let i = 0; i <= index; i++) {
                                if (i === 0) {
                                    ctx.moveTo(pathPoints[i].x, pathPoints[i].y);
                                } else {
                                    ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
                                }
                            }
                            ctx.stroke();

                            // Add glow effect
                            ctx.shadowBlur = 20;
                            ctx.shadowColor = 'rgba(6, 182, 212, 0.8)';
                            ctx.stroke();
                        }
                    }
                }
            });
        },

        createParticleSystem: function() {
            const particleContainer = this.container.querySelector('.particle-system');
            const particleCount = window.innerWidth < 768 ? 20 : 40;

            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'cyber-particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                particleContainer.appendChild(particle);

                // Animate each particle
                gsap.to(particle, {
                    x: () => (Math.random() - 0.5) * 200,
                    y: () => -window.innerHeight - 100,
                    duration: () => Math.random() * 10 + 10,
                    repeat: -1,
                    delay: () => Math.random() * 10,
                    ease: "none",
                    modifiers: {
                        y: (y) => {
                            const numY = parseFloat(y);
                            if (numY < -100) {
                                return window.innerHeight + 100 + "px";
                            }
                            return y;
                        }
                    }
                });
            }
        },

        setupForm: function() {
            const form = document.getElementById('contactForm');
            const submitBtn = form.querySelector('.submit-btn');
            const successMessage = this.container.querySelector('.success-message');

            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                // Get form data
                const formData = new FormData(form);
                const data = Object.fromEntries(formData);

                // Show loading state
                const originalContent = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = `
                    <span class="flex items-center justify-center space-x-2">
                        <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span class="loading-pulse">Enviando...</span>
                    </span>
                `;

                try {
                    // Send email using EmailJS
                    if (typeof emailjs !== 'undefined') {
                        await emailjs.send(
                            EMAIL_CONFIG.serviceId,
                            EMAIL_CONFIG.templateId,
                            {
                                to_email: EMAIL_CONFIG.recipientEmail,
                                from_name: `${data.firstName} ${data.lastName}`,
                                from_email: data.email,
                                company: data.company,
                                phone: data.phone || 'No proporcionado',
                                project_type: data.projectType,
                                message: data.message || 'Sin mensaje adicional',
                                reply_to: data.email
                            }
                        );
                    } else {
                        // Fallback: simulate sending
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        console.log('Email would be sent with data:', data);
                    }

                    // Show success
                    form.style.display = 'none';
                    successMessage.classList.remove('hidden');
                    
                    // Animate success message
                    gsap.from(successMessage, {
                        scale: 0.8,
                        opacity: 0,
                        duration: 0.5,
                        ease: "back.out(1.7)"
                    });

                    // Reset form after 5 seconds
                    setTimeout(() => {
                        form.style.display = 'block';
                        successMessage.classList.add('hidden');
                        form.reset();
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalContent;
                    }, 5000);

                } catch (error) {
                    console.error('Error sending email:', error);
                    
                    // Show error message
                    submitBtn.innerHTML = `
                        <span class="flex items-center justify-center space-x-2 text-red-400">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                            <span>Error al enviar</span>
                        </span>
                    `;
                    
                    setTimeout(() => {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalContent;
                    }, 3000);
                }
            });

            // Enhanced input interactions
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('focus', function() {
                    this.parentElement.classList.add('focused');
                    
                    // Add glow effect
                    gsap.to(this, {
                        boxShadow: '0 0 30px rgba(6, 182, 212, 0.4)',
                        duration: 0.3
                    });
                });

                input.addEventListener('blur', function() {
                    this.parentElement.classList.remove('focused');
                    
                    // Remove glow effect
                    gsap.to(this, {
                        boxShadow: 'none',
                        duration: 0.3
                    });
                });
            });
        },

        setupAnimations: function() {
            // Main timeline
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: this.container,
                    start: "top 80%",
                    end: "bottom 20%",
                    toggleActions: "play none none reverse"
                }
            });

            // Animate header elements
            tl.from('.contact-title', {
                y: 100,
                opacity: 0,
                duration: 1,
                ease: "power3.out"
            })
            .from('.contact-subtitle', {
                y: 50,
                opacity: 0,
                duration: 0.8,
                ease: "power3.out"
            }, "-=0.5")
            .from('.glass-card', {
                scale: 0.9,
                opacity: 0,
                duration: 0.8,
                stagger: 0.2,
                ease: "power2.out"
            }, "-=0.4");

            // Continuous animations
            gsap.to('.rocket-container', {
                y: -20,
                duration: 3,
                ease: "power1.inOut",
                yoyo: true,
                repeat: -1
            });

            // Hover animations for contact items
            this.container.querySelectorAll('.contact-item').forEach(item => {
                item.addEventListener('mouseenter', () => {
                    gsap.to(item, {
                        x: 10,
                        duration: 0.3,
                        ease: "power2.out"
                    });
                });

                item.addEventListener('mouseleave', () => {
                    gsap.to(item, {
                        x: 0,
                        duration: 0.3,
                        ease: "power2.out"
                    });
                });
            });

            // Stats counter animation
            const stats = this.container.querySelectorAll('.glass-card .text-4xl');
            stats.forEach(stat => {
                const value = stat.textContent;
                const isPercentage = value.includes('%');
                const isRating = value.includes('★');
                const numericValue = parseInt(value) || 0;

                if (numericValue > 0 && !isRating) {
                    stat.textContent = '0' + (isPercentage ? '%' : value.replace(/[0-9]/g, ''));
                    
                    ScrollTrigger.create({
                        trigger: stat,
                        start: "top 80%",
                        onEnter: () => {
                            gsap.to(stat, {
                                textContent: numericValue + (isPercentage ? '%' : value.replace(/[0-9]/g, '')),
                                duration: 2,
                                ease: "power2.out",
                                snap: { textContent: 1 }
                            });
                        }
                    });
                }
            });
        },

        setupIntersectionObserver: function() {
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in-view');
                        
                        // Special animation for glass cards
                        if (entry.target.classList.contains('glass-card')) {
                            gsap.from(entry.target, {
                                y: 30,
                                opacity: 0,
                                duration: 0.8,
                                ease: "power2.out"
                            });
                        }
                    }
                });
            }, observerOptions);

            // Observe all animatable elements
            this.container.querySelectorAll('.glass-card, .contact-item').forEach(el => {
                observer.observe(el);
            });
        },

        destroy: function() {
            // Cleanup
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
            gsap.killTweensOf("*");
        }
    };

    // Initialize module when GSAP is ready
    if (typeof gsap !== 'undefined' && gsap.registerPlugin) {
        gsap.registerPlugin(ScrollTrigger);
        ContactModule.init();
    }

    // Register with main system if available
    if (window.GSAPMain) {
        window.GSAPMain.registerModule(ContactModule.id, ContactModule);
    }

    // Listen for activation events
    window.addEventListener('contact:activate', function(e) {
        console.log('Contact module activated:', e.detail);
        
        // Add visual feedback
        const container = document.querySelector('#contact-us');
        if (container) {
            container.classList.add('active');
            
            // Trigger entrance animations
            gsap.from(container, {
                opacity: 0,
                duration: 1,
                ease: "power2.out"
            });
        }
    });

})();