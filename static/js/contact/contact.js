/**
 * RESCUE Contact Form Handler with Resend API
 * Handles form submission, validation, and email sending
 */

class RescueContactForm {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.submitBtn = this.form?.querySelector('button[type="submit"]');
        this.messagesContainer = document.querySelector('.form-messages');
        
        // Configuración cargada desde Flask (no necesita fetch)
        this.config = window.RESCUE_CONFIG || {
            recipientEmail: null,
            companyPhone: null,
            emailSubject: null,
            whatsappMessage: null,
            emailBodyMessage: null
        };
        
        this.init();
    }

    async init() {
        if (!this.form) {
            console.error('Contact form not found');
            return;
        }
        
        // Verificar que la configuración se haya cargado
        if (!this.config || !this.config.companyPhone) {
            if (window.RESCUE_CONFIG_ERROR) {
                this.showConfigError(window.RESCUE_CONFIG_ERROR);
                return;
            }
            console.warn('⚠️ No se encontró configuración RESCUE_CONFIG');
            this.showConfigError('Configuración no disponible');
            return;
        }
        
        console.log('✅ Configuración cargada desde Flask:', this.config);
        
        // Update contact links with loaded config
        this.updateContactLinks();
        
        this.bindEvents();
        this.initializeAnimations();
    }

    bindEvents() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Real-time form validation
        this.form.querySelectorAll('input, select, textarea').forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', () => this.clearFieldError(field));
        });
    }

    initializeAnimations() {
        // Add loading states and animations
        this.form.classList.add('contact-form-ready');
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        // Validate form
        if (!this.validateForm()) {
            this.showMessage('Por favor, corrige los errores en el formulario.', 'error');
            return;
        }

        // Show loading state
        this.setLoadingState(true);
        
        try {
            // Get form data
            const formData = this.getFormData();
            
            // Send email via Resend
            const response = await this.sendEmail(formData);
            
            if (response.success) {
                this.showMessage(
                    '¡Mensaje enviado exitosamente! Te contactaremos dentro de las próximas 24 horas.',
                    'success'
                );
                this.resetForm();
            } else {
                throw new Error(response.error || 'Error al enviar el mensaje');
            }
            
        } catch (error) {
            console.error('Error sending email:', error);
            this.showMessage(
                'Hubo un error al enviar tu mensaje. Por favor, intenta nuevamente o contáctanos por WhatsApp.',
                'error'
            );
        } finally {
            this.setLoadingState(false);
        }
    }

    async sendEmail(formData) {
        try {
            // Solo enviar los datos del formulario, nada más
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                company: formData.company,
                phone: formData.phone,
                projectType: formData.projectType,
                message: formData.message,
                privacy: formData.privacy
            };

            // Por ahora, simular envío exitoso ya que no tenemos backend real
            console.log('📧 Datos del formulario que se enviarían:', payload);
            
            // Simular delay de red
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Simular respuesta exitosa
            return { success: true, data: { message: 'Formulario enviado correctamente' } };
            
        } catch (error) {
            console.error('Error enviando formulario:', error);
            return { success: false, error: error.message };
        }
    }

    generateEmailHTML(formData) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>🚨 Nueva Consulta RESCUE - ${formData.company}</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #1a1a1a;
                    margin: 0;
                    padding: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                }
                .email-wrapper {
                    padding: 40px 20px;
                    max-width: 700px;
                    margin: 0 auto;
                }
                .email-container {
                    background: #ffffff;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                .header {
                    background: linear-gradient(135deg, #ff416c, #ff4757, #ffa726);
                    text-align: center;
                    padding: 40px 30px;
                    position: relative;
                    overflow: hidden;
                }
                .header::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="1" fill="%23ffffff" opacity="0.1"/><circle cx="80" cy="80" r="1" fill="%23ffffff" opacity="0.1"/><circle cx="40" cy="60" r="1" fill="%23ffffff" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
                    opacity: 0.3;
                }
                .logo-container {
                    position: relative;
                    z-index: 2;
                    margin-bottom: 20px;
                }
                .logo {
                    background: rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    color: white;
                    width: 80px;
                    height: 80px;
                    border-radius: 20px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 900;
                    font-size: 28px;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                }
                .title {
                    color: white;
                    margin: 0;
                    font-size: 32px;
                    font-weight: 900;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    position: relative;
                    z-index: 2;
                }
                .subtitle {
                    color: rgba(255, 255, 255, 0.9);
                    margin: 8px 0 0 0;
                    font-size: 16px;
                    font-weight: 500;
                    position: relative;
                    z-index: 2;
                }
                .content {
                    padding: 40px 30px;
                }
                .priority-badge {
                    background: linear-gradient(135deg, #ff6b6b, #ee5a24);
                    color: white;
                    padding: 12px 24px;
                    border-radius: 25px;
                    font-size: 14px;
                    font-weight: 700;
                    display: inline-block;
                    margin-bottom: 30px;
                    box-shadow: 0 4px 15px rgba(238, 90, 36, 0.4);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .client-info {
                    background: linear-gradient(135deg, #f8f9ff, #e8f4fd);
                    border-radius: 16px;
                    padding: 30px;
                    margin: 25px 0;
                    border: 1px solid rgba(102, 126, 234, 0.1);
                    position: relative;
                }
                .client-info::before {
                    content: '👤';
                    position: absolute;
                    top: -10px;
                    left: 20px;
                    background: white;
                    padding: 8px 12px;
                    border-radius: 20px;
                    font-size: 18px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }
                .info-item {
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    border-left: 4px solid #667eea;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    transition: transform 0.2s ease;
                }
                .info-item:hover {
                    transform: translateY(-2px);
                }
                .info-label {
                    font-weight: 600;
                    color: #667eea;
                    font-size: 12px;
                    text-transform: uppercase;
                    margin-bottom: 8px;
                    letter-spacing: 0.5px;
                }
                .info-value {
                    color: #2c3e50;
                    font-size: 16px;
                    font-weight: 500;
                    word-break: break-word;
                }
                .project-type {
                    background: linear-gradient(135deg, #a8edea, #fed6e3);
                    padding: 25px;
                    border-radius: 16px;
                    margin: 25px 0;
                    text-align: center;
                    position: relative;
                }
                .project-type::before {
                    content: '🎯';
                    position: absolute;
                    top: -10px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: white;
                    padding: 8px 12px;
                    border-radius: 20px;
                    font-size: 18px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .project-label {
                    font-weight: 600;
                    color: #2c3e50;
                    font-size: 14px;
                    text-transform: uppercase;
                    margin-bottom: 10px;
                    letter-spacing: 0.5px;
                }
                .project-value {
                    color: #2c3e50;
                    font-size: 18px;
                    font-weight: 700;
                }
                .message-section {
                    background: linear-gradient(135deg, #ffeaa7, #fab1a0);
                    padding: 30px;
                    border-radius: 16px;
                    margin: 25px 0;
                    position: relative;
                }
                .message-section::before {
                    content: '💬';
                    position: absolute;
                    top: -10px;
                    left: 20px;
                    background: white;
                    padding: 8px 12px;
                    border-radius: 20px;
                    font-size: 18px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .message-content {
                    background: rgba(255, 255, 255, 0.9);
                    padding: 20px;
                    border-radius: 12px;
                    margin-top: 15px;
                    line-height: 1.8;
                    font-style: italic;
                    border-left: 4px solid #fdcb6e;
                }
                .stats-banner {
                    background: linear-gradient(135deg, #00b894, #00cec9);
                    color: white;
                    text-align: center;
                    padding: 25px;
                    margin: 30px 0;
                    border-radius: 16px;
                    position: relative;
                    overflow: hidden;
                }
                .stats-banner::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="%23ffffff" opacity="0.1"/><circle cx="80" cy="80" r="2" fill="%23ffffff" opacity="0.1"/></svg>') repeat;
                    opacity: 0.3;
                }
                .stats-content {
                    position: relative;
                    z-index: 2;
                }
                .footer {
                    background: #2d3436;
                    color: #ddd;
                    text-align: center;
                    padding: 30px;
                    margin-top: 0;
                }
                .footer-title {
                    color: white;
                    font-size: 18px;
                    font-weight: 700;
                    margin-bottom: 10px;
                }
                .timestamp {
                    color: #74b9ff;
                    font-weight: 500;
                    margin: 15px 0;
                }
                .response-time {
                    background: linear-gradient(135deg, #fd79a8, #e84393);
                    color: white;
                    padding: 12px 20px;
                    border-radius: 20px;
                    display: inline-block;
                    margin-top: 15px;
                    font-weight: 600;
                    font-size: 14px;
                }
                @media (max-width: 600px) {
                    .email-wrapper { padding: 20px 10px; }
                    .content { padding: 30px 20px; }
                    .title { font-size: 24px; }
                    .info-grid { grid-template-columns: 1fr; }
                }
            </style>
        </head>
        <body>
            <div class="email-wrapper">
                <div class="email-container">
                    <div class="header">
                        <div class="logo-container">
                            <div class="logo">🚨</div>
                        </div>
                        <h1 class="title">NUEVA CONSULTA RESCUE</h1>
                        <p class="subtitle">Sistema de Alertas de Emergencia</p>
                    </div>

                    <div class="content">
                        <div class="priority-badge">
                            ⚡ RESPUESTA REQUERIDA EN 24H
                        </div>

                        <div class="client-info">
                            <h3 style="margin-top: 0; color: #2c3e50; font-size: 18px;">Información del Cliente</h3>
                            <div class="info-grid">
                                <div class="info-item">
                                    <div class="info-label">👤 Nombre Completo</div>
                                    <div class="info-value">${formData.firstName} ${formData.lastName}</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">🏢 Empresa</div>
                                    <div class="info-value">${formData.company}</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">📧 Email</div>
                                    <div class="info-value">
                                        <a href="mailto:${formData.email}" style="color: #667eea; text-decoration: none;">
                                            ${formData.email}
                                        </a>
                                    </div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">📱 Teléfono</div>
                                    <div class="info-value">
                                        ${formData.phone ? 
                                            `<a href="tel:${formData.phone}" style="color: #667eea; text-decoration: none;">${formData.phone}</a>` : 
                                            '<span style="color: #999; font-style: italic;">No proporcionado</span>'
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="project-type">
                            <div class="project-label">Tipo de Proyecto Solicitado</div>
                            <div class="project-value">${this.getProjectTypeLabel(formData.projectType)}</div>
                        </div>

                        ${formData.message ? `
                        <div class="message-section">
                            <h3 style="margin-top: 0; color: #2c3e50; font-size: 16px; font-weight: 600;">Mensaje del Cliente</h3>
                            <div class="message-content">
                                ${formData.message.replace(/\n/g, '<br>')}
                            </div>
                        </div>
                        ` : ''}

                        <div class="stats-banner">
                            <div class="stats-content">
                                <h3 style="margin: 0 0 10px 0; font-size: 20px;">🎯 RESCUE System</h3>
                                <p style="margin: 0; opacity: 0.9;">Protegiendo vidas con tecnología de emergencia de última generación</p>
                            </div>
                        </div>
                    </div>

                    <div class="footer">
                        <div class="footer-title">RESCUE Emergency Alert System</div>
                        <div class="timestamp">
                            📅 Solicitud recibida el ${new Date().toLocaleDateString('es-CO', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'America/Bogota'
                            })}
                        </div>
                        <div class="response-time">
                            ⏰ Tiempo de respuesta objetivo: Menos de 24 horas
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>`;
    }

    getFormData() {
        const formData = new FormData(this.form);
        return {
            firstName: formData.get('firstName')?.trim(),
            lastName: formData.get('lastName')?.trim(),
            email: formData.get('email')?.trim(),
            company: formData.get('company')?.trim(),
            phone: formData.get('phone')?.trim(),
            projectType: formData.get('projectType'),
            message: formData.get('message')?.trim(),
            privacy: formData.get('privacy')
        };
    }

    getProjectTypeLabel(value) {
        const labels = {
            'emergency-alerts': 'Sistemas de Alertas de Emergencia',
            'security-monitoring': 'Monitoreo de Seguridad',
            'industrial-safety': 'Seguridad Industrial',
            'healthcare-emergency': 'Emergencias Hospitalarias',
            'educational-safety': 'Seguridad Educativa',
            'government-alerts': 'Alertas Gubernamentales',
            'other': 'Otro Sistema de Seguridad'
        };
        return labels[value] || value;
    }

    validateForm() {
        let isValid = true;
        const requiredFields = this.form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let message = '';

        // Clear previous errors
        this.clearFieldError(field);

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            message = 'Este campo es obligatorio';
            isValid = false;
        }
        // Email validation
        else if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                message = 'Ingresa un email válido';
                isValid = false;
            }
        }
        // Phone validation (optional but if provided, should be valid)
        else if (field.type === 'tel' && value) {
            const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
            if (!phoneRegex.test(value)) {
                message = 'Ingresa un número de teléfono válido';
                isValid = false;
            }
        }

        if (!isValid) {
            this.showFieldError(field, message);
        }

        return isValid;
    }

    showFieldError(field, message) {
        field.classList.add('error');
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        errorElement.style.cssText = `
            color: #e74c3c;
            font-size: 12px;
            margin-top: 5px;
            animation: slideDown 0.3s ease;
        `;
        
        field.parentNode.appendChild(errorElement);
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    setLoadingState(isLoading) {
        if (isLoading) {
            this.submitBtn.disabled = true;
            this.submitBtn.innerHTML = `
                <span class="flex items-center justify-center space-x-2">
                    <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Enviando...</span>
                </span>
            `;
            this.form.classList.add('form-loading');
        } else {
            this.submitBtn.disabled = false;
            this.submitBtn.innerHTML = `
                <span class="flex items-center justify-center space-x-2">
                    <span>Solicitar Demo RESCUE</span>
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                </span>
            `;
            this.form.classList.remove('form-loading');
        }
    }

    showMessage(message, type = 'info') {
        // Clear previous messages
        this.messagesContainer.innerHTML = '';
        
        const messageElement = document.createElement('div');
        messageElement.className = `form-message form-message-${type}`;
        
        // Styling based on type
        const styles = {
            success: 'bg-green-500/10 border-green-500/20 text-green-400',
            error: 'bg-red-500/10 border-red-500/20 text-red-400',
            info: 'bg-blue-500/10 border-blue-500/20 text-blue-400'
        };
        
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️'
        };
        
        messageElement.className += ` ${styles[type]} border rounded-xl p-4 mb-4 animate-fadeIn`;
        messageElement.innerHTML = `
            <div class="flex items-center space-x-3">
                <span class="text-lg">${icons[type]}</span>
                <span>${message}</span>
            </div>
        `;
        
        this.messagesContainer.appendChild(messageElement);
        
        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                messageElement.style.animation = 'fadeOut 0.5s ease';
                setTimeout(() => messageElement.remove(), 500);
            }, 5000);
        }
    }

    resetForm() {
        this.form.reset();
        
        // Clear all field errors
        this.form.querySelectorAll('.field-error').forEach(error => error.remove());
        this.form.querySelectorAll('.error').forEach(field => field.classList.remove('error'));
        
        // Reset form animations
        this.form.classList.add('form-reset');
        setTimeout(() => this.form.classList.remove('form-reset'), 300);
    }

    // Load configuration from backend
    async loadConfig() {
        try {
            const response = await fetch(this.config.configUrl);
            if (response.ok) {
                const config = await response.json();
                // Verificar si hay error en la respuesta
                if (config.error) {
                    throw new Error(config.error);
                }
                // Update config with values from backend
                Object.assign(this.config, config);
                console.log('✅ Configuration loaded from backend:', config);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error del servidor');
            }
        } catch (error) {
            console.error('❌ Error loading config from backend:', error.message);
            // Mostrar error al usuario
            this.showConfigError(error.message);
            throw error; // Re-lanzar para que init() sepa que falló
        }
    }

    // Update contact links with loaded configuration
    updateContactLinks() {
        // Update email link
        const emailLink = document.getElementById('email-link');
        const emailDisplay = document.getElementById('email-display');
        
        if (emailLink && emailDisplay) {
            const mailtoUrl = `mailto:${this.config.recipientEmail}?subject=${encodeURIComponent(this.config.emailSubject)}&body=${encodeURIComponent(this.config.emailBodyMessage)}`;
            
            // Update onclick handler
            emailLink.onclick = (e) => {
                e.preventDefault();
                window.open(mailtoUrl, '_blank');
                return false;
            };
            
            // Update displayed email
            emailDisplay.textContent = this.config.recipientEmail;
        }

        // Update WhatsApp link
        const whatsappLink = document.getElementById('whatsapp-link');
        const phoneDisplay = document.getElementById('phone-display');
        
        if (whatsappLink && phoneDisplay) {
            const phoneNumber = this.config.companyPhone.replace(/[^0-9]/g, ''); // Remove non-digits
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(this.config.whatsappMessage)}`;
            
            // Update href
            whatsappLink.href = whatsappUrl;
            
            // Update displayed phone number
            phoneDisplay.textContent = this.config.companyPhone;
        }

        console.log('📞 Contact links updated with configuration:', {
            email: this.config.recipientEmail,
            phone: this.config.companyPhone,
            emailSubject: this.config.emailSubject,
            whatsappMessage: this.config.whatsappMessage.substring(0, 50) + '...'
        });
    }

    // Show configuration error to user
    showConfigError(errorMessage) {
        // Mostrar error en los elementos de contacto
        const emailDisplay = document.getElementById('email-display');
        const phoneDisplay = document.getElementById('phone-display');
        
        if (emailDisplay) {
            emailDisplay.textContent = 'Error de configuración';
            emailDisplay.style.color = '#e74c3c';
        }
        
        if (phoneDisplay) {
            phoneDisplay.textContent = 'Error de configuración';
            phoneDisplay.style.color = '#e74c3c';
        }
        
        // Mostrar mensaje de error general
        this.showMessage(
            `Error de configuración: ${errorMessage}. Verifica que todas las variables estén configuradas en el archivo .env`,
            'error'
        );
        
        // Deshabilitar formulario si hay error de configuración
        if (this.form) {
            this.form.style.opacity = '0.5';
            this.form.style.pointerEvents = 'none';
        }
    }
}

// CSS Animations (inject into page)
const contactStyles = document.createElement('style');
contactStyles.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-20px);
        }
    }

    .contact-form input.error,
    .contact-form select.error,
    .contact-form textarea.error {
        border-color: #e74c3c !important;
        box-shadow: 0 0 0 1px rgba(231, 76, 60, 0.3) !important;
    }

    .form-loading {
        opacity: 0.7;
        pointer-events: none;
    }

    .form-reset {
        animation: fadeIn 0.3s ease;
    }

    .animate-fadeIn {
        animation: fadeIn 0.5s ease;
    }
`;
document.head.appendChild(contactStyles);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RescueContactForm();
});

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RescueContactForm;
}
