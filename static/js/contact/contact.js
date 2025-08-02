/**
 * RESCUE Contact Form Handler with Resend API
 * Handles form submission, validation, and email sending
 */

class RescueContactForm {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.submitBtn = this.form?.querySelector('button[type="submit"]');
        this.messagesContainer = document.querySelector('.form-messages');
        this.isSubmitting = false;  // Protección contra múltiples envíos
        
        this.init();
    }

    async init() {
        if (!this.form) {
            console.error('Contact form not found');
            return;
        }
        
        this.bindEvents();
        this.initializeAnimations();
    }

    bindEvents() {
        // Form submission only
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
        
        // Prevenir múltiples envíos
        if (this.isSubmitting) {
            console.log('⚠️ Formulario ya se está enviando, ignorando envío duplicado');
            return;
        }
        
        // Validate form
        if (!this.validateForm()) {
            this.showMessage('Por favor, corrige los errores en el formulario.', 'error');
            return;
        }

        // Marcar como enviando
        this.isSubmitting = true;
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
            // Liberar el bloqueo después de un delay para evitar envíos accidentales
            setTimeout(() => {
                this.isSubmitting = false;
                this.setLoadingState(false);
            }, 1000);
        }
    }

    async sendEmail(formData) {
        try {
            // Preparar los datos del formulario
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

            console.log('📧 Enviando datos del formulario al backend:', payload);
            
            // Hacer la petición real al backend
            const response = await fetch('/proxy/api/contact/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            // Parsear la respuesta
            const responseData = await response.json();
            
            if (!response.ok) {
                throw new Error(responseData.error || `Error del servidor: ${response.status}`);
            }

            if (responseData.success) {
                console.log('✅ Email enviado exitosamente:', responseData.data);
                return {
                    success: true,
                    data: responseData.data
                };
            } else {
                throw new Error(responseData.error || 'Error desconocido al enviar el email');
            }
            
        } catch (error) {
            console.error('❌ Error enviando formulario:', error);
            
            // Proporcionar mensajes de error más específicos
            let errorMessage = 'Error al enviar el mensaje';
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
            } else if (error.message.includes('400')) {
                errorMessage = 'Datos del formulario inválidos. Verifica los campos.';
            } else if (error.message.includes('500')) {
                errorMessage = 'Error interno del servidor. Intenta nuevamente.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            return { 
                success: false, 
                error: errorMessage 
            };
        }
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
            privacy: formData.get('privacy') === 'on'  // Convertir 'on' a boolean true
        };
    }

    getProjectTypeLabel(value) {
        const labels = {
            'industria-empresas': 'Industria o empresas privadas',
            'bomberos-defensa': 'Bomberos y Defensa Civil',
            'policia-seguridad': 'Policía y cuerpos de seguridad',
            'municipios-gobernaciones': 'Municipios o Gobernaciones',
            'gestion-riesgo': 'Entidades de gestión de riesgo',
            'salud-publica': 'Entidades de salud pública',
            'otros': 'Otros'
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

// Initialize when DOM is loaded - SOLO UNA VEZ
if (!window.rescueContactFormInitialized) {
    window.rescueContactFormInitialized = true;
    document.addEventListener('DOMContentLoaded', () => {
        // Verificar que no exista ya una instancia
        if (!window.rescueContactFormInstance) {
            window.rescueContactFormInstance = new RescueContactForm();
            console.log('✅ RescueContactForm inicializado por primera vez');
        } else {
            console.log('⚠️ RescueContactForm ya existe, evitando duplicado');
        }
    });
} else {
    console.log('⚠️ Script de RescueContactForm ya cargado, evitando duplicado');
}

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RescueContactForm;
}
