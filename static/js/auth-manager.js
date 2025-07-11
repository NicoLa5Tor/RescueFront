/**
 * Authentication Manager
 * Maneja autenticación basada en cookies seguras
 */

if (typeof window.AuthManager === 'undefined') {
class AuthManager {
    constructor() {
        this.client = new EndpointTestClient('http://localhost:5002');
    }

    /**
     * Verifica si el usuario está autenticado haciendo una petición al backend
     * (No podemos leer cookies HttpOnly desde JavaScript)
     */
    async isAuthenticated() {
        try {
            // Hacer una petición simple para verificar si estamos autenticados
            const response = await this.client._request('GET', '/health');
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Obtiene el valor de una cookie
     */
    getCookie(name) {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [cookieName, cookieValue] = cookie.trim().split('=');
            if (cookieName === name) {
                return cookieValue;
            }
        }
        return null;
    }

    /**
     * Sincroniza sesión con Flask
     */
    async syncSession(user) {
        try {
            console.log('🔄 Sincronizando sesión con Flask:', user);
            const response = await fetch('/api/sync-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user })
            });
            
            const result = await response.json();
            if (response.ok && result.success) {
                console.log('✅ Sesión Flask sincronizada');
                return true;
            } else {
                console.error('❌ Error sincronizando sesión:', result.error);
                return false;
            }
        } catch (error) {
            console.error('❌ Error de conexión en sync:', error);
            return false;
        }
    }

    /**
     * Realiza login del usuario
     */
    async login(usuario, password) {
        try {
            console.log('🚀 Iniciando login para:', usuario);
            const response = await this.client.login(usuario, password);
            console.log('🌐 Respuesta del servidor:', response.status, response.statusText);
            
            const result = await response.json();
            console.log('📝 Datos de respuesta:', result);

            if (response.ok && result.success) {
                console.log('✅ Login exitoso - cookie establecida automáticamente por el browser');

                const userInfo = result.user || result.data;
                // Sincronizar sesión con Flask
                const syncSuccess = await this.syncSession(userInfo);
                if (syncSuccess) {
                    return { success: true, user: userInfo };
                } else {
                    return { success: false, errors: ['Error sincronizando sesión'] };
                }
            } else {
                console.error('❌ Error en login:', result.errors || result.message);
                return { success: false, errors: result.errors || [result.message] || ['Error de autenticación'] };
            }
        } catch (error) {
            console.error('❌ Error de conexión:', error);
            return { success: false, errors: ['Error de conexión'] };
        }
    }

    /**
     * Realiza logout del usuario
     */
    async logout() {
        try {
            const response = await this.client.logout();
            const result = await response.json();
            
            if (response.ok && result.success) {
                console.log('✅ Logout exitoso');
                // Redirigir al login después del logout
                setTimeout(() => {
                    window.location.href = '/login';
                }, 500);
                return { success: true };
            } else {
                console.error('❌ Error en logout:', result.errors);
                return { success: false, errors: result.errors || ['Error al cerrar sesión'] };
            }
        } catch (error) {
            console.error('❌ Error de conexión:', error);
            return { success: false, errors: ['Error de conexión'] };
        }
    }

    /**
     * Redirige al usuario al login si no está autenticado
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            this.redirectToLogin();
            return false;
        }
        return true;
    }

    /**
     * Redirige al login
     */
    redirectToLogin() {
        console.log('🔄 Redirigiendo al login...');
        window.location.href = '/login';
    }

    /**
     * Maneja errores de autenticación
     */
    handleAuthError(response) {
        if (response.status === 401) {
            console.warn('🚫 Token expirado o inválido');
            this.showMessage('Sesión expirada. Redirigiendo al login...', 'error');
            setTimeout(() => {
                this.redirectToLogin();
            }, 2000);
        }
    }

    /**
     * Muestra mensajes al usuario
     */
    showMessage(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg text-white max-w-sm ${
            type === 'error' ? 'bg-red-500' : 
            type === 'success' ? 'bg-green-500' : 
            'bg-blue-500'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animación de entrada
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'transform 0.3s ease-in-out';
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Remover después de 5 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    /**
     * Inicializa botones de logout
     */
    initializeLogoutButtons() {
        const logoutButtons = document.querySelectorAll('[data-logout]');
        logoutButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                
                // Mostrar confirmación
                if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                    this.showMessage('Cerrando sesión...', 'info');
                    const result = await this.logout();
                    
                    if (!result.success) {
                        this.showMessage('Error al cerrar sesión', 'error');
                    }
                }
            });
        });
    }

    /**
     * Verifica autenticación con el backend
     */
    async verifyAuthWithBackend() {
        try {
            // Hacer una petición simple para verificar si las cookies funcionan
            const response = await this.client._request('GET', '/health');
            return response.ok;
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            return false;
        }
    }

    /**
     * Test de conectividad directo
     */
    async testConnection() {
        try {
            console.log('📌 Probando conexión directa al backend...');
            const response = await fetch('http://localhost:5002/health', {
                method: 'GET',
                credentials: 'include'
            });
            console.log('🌐 Respuesta de conexión:', response.status, response.statusText);
            const data = await response.json();
            console.log('📝 Datos de health:', data);
            return response.ok;
        } catch (error) {
            console.error('❌ Error de conexión:', error);
            return false;
        }
    }

    /**
     * Inicializa el manejador de autenticación
     */
    async init() {
        this.initializeLogoutButtons();
        
        // Probar conexión al backend
        const connected = await this.testConnection();
        if (connected) {
            console.log('✅ AuthManager inicializado - Backend conectado');
        } else {
            console.warn('⚠️ AuthManager inicializado - Backend NO conectado');
        }
    }
}

// Hacer disponible globalmente
window.AuthManager = AuthManager;

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    if (!window.authManager) {
        window.authManager = new AuthManager();
        window.authManager.init();
    }
});
}
