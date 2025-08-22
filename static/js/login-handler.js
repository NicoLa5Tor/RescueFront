/**
 * Login Handler
 * Maneja el formulario de login con autenticación basada en cookies
 */

class LoginHandler {
    constructor() {
        this.authManager = new AuthManager();
        this.form = document.getElementById('loginForm');
        this.submitBtn = document.getElementById('submitBtn');
        this.loginIcon = document.getElementById('loginIcon');
        this.btnText = document.getElementById('btnText');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        
        this.init();
    }

    init() {
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }

        // Comentado temporalmente - puede causar redirecciones prematuras
        // Si ya está autenticado, redirigir al dashboard
        // if (this.authManager.isAuthenticated()) {
        //     this.redirectToDashboard();
        // }
        
        //console.log('LoginHandler inicializado');
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        //console.log('📝 Formulario enviado');

        const formData = new FormData(this.form);
        const usuario = formData.get('usuario');
        const password = formData.get('password');
        
        //console.log('📝 Datos del formulario:', { usuario, password: password ? '[PRESENTE]' : '[VACIO]' });

        // Validación básica
        if (!usuario || !password) {
            this.showError('Por favor ingresa usuario y contraseña');
            return;
        }

        // Mostrar estado de carga
        this.setLoading(true);

        try {
            //console.log('🚀 Iniciando proceso de login...');
            // Intentar login
            const result = await this.authManager.login(usuario, password);
            //console.log('📝 Resultado del login:', result);

            if (result.success) {
                this.showSuccess('¡Login exitoso! Redirigiendo...');
                
                // Redirigir después de un breve delay
                setTimeout(() => {
                    this.redirectToDashboard(result.user);
                }, 1000);
            } else {
                const errorMessage = Array.isArray(result.errors) ? result.errors.join(', ') : 'Error de autenticación';
                this.showError(errorMessage);
            }
        } catch (error) {
            //console.error('❌ Error en login:', error);
            this.showError('Error de conexión. Inténtalo de nuevo.');
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(loading) {
        if (!this.submitBtn) return;

        if (loading) {
            this.submitBtn.disabled = true;
            if (this.loginIcon) this.loginIcon.style.display = 'none';
            if (this.btnText) this.btnText.textContent = 'Iniciando sesión...';
            if (this.loadingSpinner) this.loadingSpinner.classList.remove('hidden');
        } else {
            this.submitBtn.disabled = false;
            if (this.loginIcon) this.loginIcon.style.display = 'inline';
            if (this.btnText) this.btnText.textContent = 'Iniciar Sesión';
            if (this.loadingSpinner) this.loadingSpinner.classList.add('hidden');
        }
    }

    showError(message) {
        this.clearMessages();
        const errorDiv = this.createMessageDiv(message, 'error');
        this.insertMessage(errorDiv);
    }

    showSuccess(message) {
        this.clearMessages();
        const successDiv = this.createMessageDiv(message, 'success');
        this.insertMessage(successDiv);
    }

    createMessageDiv(message, type) {
        const div = document.createElement('div');
        div.className = `mt-4 p-3 rounded-lg text-sm font-medium ${
            type === 'error' 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                : 'bg-green-500/20 text-green-400 border border-green-500/30'
        }`;
        div.textContent = message;
        return div;
    }

    insertMessage(messageDiv) {
        const form = this.form;
        if (form) {
            form.appendChild(messageDiv);
            
            // Animar entrada
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateY(-10px)';
            messageDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            
            setTimeout(() => {
                messageDiv.style.opacity = '1';
                messageDiv.style.transform = 'translateY(0)';
            }, 10);
        }
    }

    clearMessages() {
        const messages = this.form?.querySelectorAll('.bg-red-500\\/20, .bg-green-500\\/20');
        messages?.forEach(msg => msg.remove());
    }

    redirectToDashboard(user) {
        // Determinar a dónde redirigir basado en el rol del usuario
        ////console.log('🔄 Redirigiendo usuario:', user);
        
        if (user && user.role) {
            const role = user.role;
            //console.log('👤 Rol del usuario:', role);
            
            switch(role) {
                case 'super_admin':
                    //console.log('🛡️ Redirigiendo a Super Admin Dashboard');
                    window.location.href = '/admin/super-dashboard';
                    break;
                case 'empresa':
                    //console.log('🏢 Redirigiendo a Dashboard de Empresa');
                    window.location.href = '/empresa';
                    break;
                default:
                    //console.warn('⚠️ Rol desconocido, redirigiendo a dashboard por defecto');
                    window.location.href = '/admin/super-dashboard';
            }
        } else {
            //console.warn('⚠️ No se encontró información de usuario/rol, redirigiendo por defecto');
            window.location.href = '/admin/super-dashboard';
        }
    }

    // Métodos de validación
    validateInput(input, rules) {
        const value = input.value.trim();
        const errors = [];

        if (rules.required && !value) {
            errors.push('Este campo es requerido');
        }

        if (rules.minLength && value.length < rules.minLength) {
            errors.push(`Mínimo ${rules.minLength} caracteres`);
        }

        if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(`Máximo ${rules.maxLength} caracteres`);
        }

        return errors;
    }

    showInputError(input, errors) {
        const formGroup = input.closest('.form-group');
        const errorDiv = formGroup?.querySelector('.error-message');
        
        if (errorDiv) {
            if (errors.length > 0) {
                errorDiv.style.display = 'flex';
                errorDiv.querySelector('span').textContent = errors[0];
                input.classList.add('border-red-500');
            } else {
                errorDiv.style.display = 'none';
                input.classList.remove('border-red-500');
            }
        }
    }

    addInputValidation() {
        const usuarioInput = document.getElementById('usuario');
        const passwordInput = document.getElementById('password');

        if (usuarioInput) {
            usuarioInput.addEventListener('blur', () => {
                const errors = this.validateInput(usuarioInput, { required: true, minLength: 3 });
                this.showInputError(usuarioInput, errors);
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('blur', () => {
                const errors = this.validateInput(passwordInput, { required: true, minLength: 4 });
                this.showInputError(passwordInput, errors);
            });
        }
    }
}

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Solo inicializar en la página de login
    if (window.location.pathname.includes('/login')) {
        window.loginHandler = new LoginHandler();
    }
});
