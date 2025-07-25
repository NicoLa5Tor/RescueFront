/**
 * RESCUE Contact Form Handler with Resend API
 * Handles form submission, validation, and email sending
 */

class RescueContactForm {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.submitBtn = this.form?.querySelector('button[type="submit"]');
        this.messagesContainer = document.querySelector('.form-messages');
        
        // Resend API configuration
        this.resendConfig = {
            apiKey: 're_ez4vsBnr_5nFuyLbtDfxTSsm8EkKJ7dct', // Tu API key
            apiUrl: 'https://api.resend.com/emails'
        };
        
        this.init();
    }

    init() {
        if (!this.form) {
            console.error('Contact form not found');
            return;
        }
        
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
            // Prepare email content
            const emailContent = this.generateEmailHTML(formData);
            
            const payload = {
                from: 'RESCUE System <onboarding@resend.dev>', // Cambiar por tu dominio verificado
                to: ['asesoria.rescue@gmail.com'], // Email de destino
                subject: `Nueva consulta RESCUE - ${formData.company}`,
                html: emailContent,
                // Optional: Add reply-to
                reply_to: formData.email
            };

            const response = await fetch(this.resendConfig.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.resendConfig.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Error en la API de Resend');
            }

            return { success: true, data: result };
            
        } catch (error) {
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
            <title>Nueva Consulta RESCUE</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f8f9fa;
                }
                .email-container {
                    background: white;
                    border-radius: 12px;
                    padding: 30px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 3px solid #e74c3c;
                }
                .logo {
                    background: linear-gradient(45deg, #e74c3c, #f39c12);
                    color: white;
                    width: 60px;
                    height: 60px;
                    border-radius: 12px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 18px;
                    margin-bottom: 10px;
                }
                .title {
                    color: #e74c3c;
                    margin: 0;
                    font-size: 24px;
                }
                .subtitle {
                    color: #666;
                    margin: 5px 0 0 0;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin: 20px 0;
                }
                .info-item {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    border-left: 4px solid #e74c3c;
                }
                .info-label {
                    font-weight: bold;
                    color: #e74c3c;
                    font-size: 12px;
                    text-transform: uppercase;
                    margin-bottom: 5px;
                }
                .info-value {
                    color: #333;
                    font-size: 16px;
                }
                .message-section {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    border-left: 4px solid #f39c12;
                }
                .priority-badge {
                    background: #e74c3c;
                    color: white;
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: bold;
                    display: inline-block;
                    margin-bottom: 15px;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    color: #666;
                    font-size: 14px;
                }
                @media (max-width: 600px) {
                    .info-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <div class="logo">R</div>
                    <h1 class="title">NUEVA CONSULTA RESCUE</h1>
                    <p class="subtitle">Sistema de Alertas de Emergencia</p>
                </div>

                <div class="priority-badge">⚡ RESPUESTA REQUERIDA EN 24H</div>

                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Nombre Completo</div>
                        <div class="info-value">${formData.firstName} ${formData.lastName}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Empresa</div>
                        <div class="info-value">${formData.company}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Email</div>
                        <div class="info-value">${formData.email}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Teléfono</div>
                        <div class="info-value">${formData.phone || 'No proporcionado'}</div>
                    </div>
                </div>

                <div class="info-item" style="grid-column: 1 / -1; margin: 20px 0;">
                    <div class="info-label">Tipo de Proyecto</div>
                    <div class="info-value">${this.getProjectTypeLabel(formData.projectType)}</div>
                </div>

                ${formData.message ? `
                <div class="message-section">
                    <div class="info-label">Mensaje del Cliente</div>
                    <div class="info-value">${formData.message.replace(/\n/g, '<br>')}</div>
                </div>
                ` : ''}

                <div class="footer">
                    <p><strong>RESCUE Emergency Alert System</strong></p>
                    <p>Solicitud recibida el ${new Date().toLocaleDateString('es-CO', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</p>
                    <p style="margin-top: 15px; color: #e74c3c;">
                        <strong>⏰ Tiempo de respuesta objetivo: Menos de 24 horas</strong>
                    </p>
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
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"/>
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
