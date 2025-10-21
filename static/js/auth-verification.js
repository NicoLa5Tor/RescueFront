
/**
 * Archivo de verificación para comprobar que la autenticación funciona correctamente
 * Este archivo ayuda a debuggear problemas de autenticación
 */

class AuthVerification {
    constructor() {
        this.init();
    }

    init() {
        // Verificar cuando el DOM esté listo
        document.addEventListener('DOMContentLoaded', () => {
            this.performChecks();
        });
    }

    performChecks() {
        ////console.log('🔍 Iniciando verificación de autenticación...');
        
        // Verificar si window.currentUser está definido
        this.checkCurrentUser();
        
        // Verificar si AuthManager está disponible
        this.checkAuthManager();
        
        // Verificar cookies
        this.checkCookies();
        
        // Verificar conectividad con backend
        this.checkBackendConnection();
        
        ////console.log('✅ Verificación de autenticación completada');
    }

    checkCurrentUser() {
        ////console.log('👤 Verificando window.currentUser...');
        
        if (window.currentUser) {
            //console.log('✅ window.currentUser está definido:', window.currentUser);
            
            // Verificar propiedades esenciales
            if (window.currentUser.id) {
                //console.log('✅ ID de usuario presente:', window.currentUser.id);
            } else {
                //console.warn('⚠️ ID de usuario no presente en window.currentUser');
            }
            
            if (window.currentUser.role) {
                //console.log('✅ Rol de usuario presente:', window.currentUser.role);
            } else {
                //console.warn('⚠️ Rol de usuario no presente en window.currentUser');
            }
            
            return true;
        } else {
            //console.warn('❌ window.currentUser no está definido');
            return false;
        }
    }

    checkAuthManager() {
        //console.log('🔧 Verificando AuthManager...');
        
        if (window.AuthManager) {
            //console.log('✅ AuthManager está disponible');
            
            if (window.authManager) {
                //console.log('✅ Instancia de authManager está disponible');
                
                // Verificar método isAuthenticated
                if (typeof window.authManager.isAuthenticated === 'function') {
                    //console.log('✅ Método isAuthenticated está disponible');
                    
                    // Intentar verificar autenticación
                    try {
                        const isAuth = window.authManager.isAuthenticated();
                        //console.log('🔐 Estado de autenticación:', isAuth);
                    } catch (error) {
                        //console.error('❌ Error al verificar autenticación:', error);
                    }
                } else {
                    //console.warn('⚠️ Método isAuthenticated no está disponible');
                }
                
                return true;
            } else {
                //console.warn('⚠️ Instancia de authManager no está disponible');
                return false;
            }
        } else {
            //console.warn('❌ AuthManager no está disponible');
            return false;
        }
    }

    checkCookies() {
        //console.log('🍪 Verificando cookies...');
        
        const cookies = document.cookie.split(';');
        //console.log('📋 Cookies disponibles:', cookies.length);
        
        cookies.forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            if (name && value) {
                //console.log(`🍪 Cookie: ${name} = ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
            }
        });
        
        // Buscar cookies relacionadas con autenticación
        const authCookies = cookies.filter(cookie => {
            const name = cookie.trim().split('=')[0];
            return name.includes('token') || name.includes('session') || name.includes('auth');
        });
        
        if (authCookies.length > 0) {
            //console.log('✅ Cookies de autenticación encontradas:', authCookies.length);
        } else {
            //console.warn('⚠️ No se encontraron cookies de autenticación');
        }
    }

    async checkBackendConnection() {
        //console.log('🌐 Verificando conectividad con backend...');
        
        try {
            const response = await fetch(window.__buildApiUrl('/health'), {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                //console.log('✅ Backend conectado correctamente');
                
                try {
                    const data = await response.json();
                    //console.log('📊 Respuesta del backend:', data);
                } catch (error) {
                    //console.log('ℹ️ Backend respondió pero no con JSON válido');
                }
            } else {
                //console.warn('⚠️ Backend respondió con error:', response.status, response.statusText);
            }
        } catch (error) {
            //console.error('❌ Error de conectividad con backend:', error);
        }
    }

    // Método para verificar si el usuario debería estar autenticado
    shouldBeAuthenticated() {
        const currentPath = window.location.pathname;
        const protectedPaths = ['/admin', '/empresa', '/dashboard'];
        
        return protectedPaths.some(path => currentPath.startsWith(path));
    }

    // Método para reportar estado general
    reportStatus() {
        //console.log('📊 Reporte de estado de autenticación:');
        //console.log('='.repeat(50));
        
        const hasCurrentUser = !!window.currentUser;
        const hasAuthManager = !!window.authManager;
        const shouldBeAuth = this.shouldBeAuthenticated();
        
        //console.log('👤 window.currentUser:', hasCurrentUser ? '✅' : '❌');
        //console.log('🔧 AuthManager:', hasAuthManager ? '✅' : '❌');
        //console.log('🔐 Debería estar autenticado:', shouldBeAuth ? '✅' : '❌');
        
        if (shouldBeAuth && !hasCurrentUser) {
            //console.warn('⚠️ PROBLEMA: Usuario debería estar autenticado pero no hay datos');
            //console.warn('💡 Sugerencia: Verificar configuración de templates y backend');
        }
        
        if (hasCurrentUser && hasAuthManager) {
            //console.log('✅ Estado óptimo: Usuario autenticado y manejador disponible');
        }
        
        //console.log('='.repeat(50));
    }
}

// Inicializar verificación automáticamente
if (typeof window !== 'undefined') {
    window.AuthVerification = AuthVerification;
    
    // Solo ejecutar en páginas de dashboard/admin
    if (window.location.pathname.includes('/admin') || window.location.pathname.includes('/dashboard')) {
        new AuthVerification();
    }
}
