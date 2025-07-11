/**
 * Script de limpieza de seguridad
 * Elimina tokens residuales y verifica configuración correcta
 */

class SecurityCleanup {
    constructor() {
        this.init();
    }

    init() {
        console.log('🔒 Iniciando limpieza de seguridad...');
        
        // Limpiar tokens residuales
        this.cleanupTokens();
        
        // Verificar configuración
        this.verifySecurityConfig();
        
        console.log('✅ Limpieza de seguridad completada');
    }

    cleanupTokens() {
        console.log('🧹 Limpiando tokens residuales...');
        
        // Limpiar localStorage
        const localStorageKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('token') || key.includes('auth') || key.includes('jwt'))) {
                localStorageKeys.push(key);
            }
        }
        
        localStorageKeys.forEach(key => {
            console.warn(`🗑️ Eliminando token residual de localStorage: ${key}`);
            localStorage.removeItem(key);
        });
        
        // Limpiar sessionStorage
        const sessionStorageKeys = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && (key.includes('token') || key.includes('auth') || key.includes('jwt'))) {
                sessionStorageKeys.push(key);
            }
        }
        
        sessionStorageKeys.forEach(key => {
            console.warn(`🗑️ Eliminando token residual de sessionStorage: ${key}`);
            sessionStorage.removeItem(key);
        });
        
        // Reportar limpieza
        if (localStorageKeys.length === 0 && sessionStorageKeys.length === 0) {
            console.log('✅ No se encontraron tokens residuales');
        } else {
            console.log(`🧹 Eliminados ${localStorageKeys.length + sessionStorageKeys.length} tokens residuales`);
        }
    }

    verifySecurityConfig() {
        console.log('🔍 Verificando configuración de seguridad...');
        
        // Verificar cookies
        this.checkCookies();
        
        // Verificar autenticación
        this.checkAuthentication();
        
        // Verificar configuración de ventana
        this.checkWindowConfig();
    }

    checkCookies() {
        console.log('🍪 Verificando cookies...');
        
        const cookies = document.cookie.split(';');
        const authCookies = cookies.filter(cookie => {
            const name = cookie.trim().split('=')[0];
            return name.includes('auth') || name.includes('token');
        });
        
        if (authCookies.length > 0) {
            console.log('✅ Cookies de autenticación encontradas:');
            authCookies.forEach(cookie => {
                const [name, value] = cookie.trim().split('=');
                console.log(`  🍪 ${name}: ${value ? '[PRESENTE]' : '[VACÍA]'}`);
            });
            
            // Verificar si son accesibles desde JavaScript
            authCookies.forEach(cookie => {
                const [name] = cookie.trim().split('=');
                try {
                    const cookieValue = this.getCookie(name);
                    if (cookieValue) {
                        console.warn(`⚠️ PROBLEMA DE SEGURIDAD: Cookie '${name}' es accesible desde JavaScript`);
                        console.warn(`   💡 Esta cookie debería ser HTTPOnly para mayor seguridad`);
                    }
                } catch (error) {
                    console.log(`✅ Cookie '${name}' parece estar correctamente protegida`);
                }
            });
        } else {
            console.log('ℹ️ No se encontraron cookies de autenticación visibles');
        }
    }

    checkAuthentication() {
        console.log('🔐 Verificando estado de autenticación...');
        
        // Verificar window.currentUser
        if (window.currentUser) {
            console.log('✅ window.currentUser configurado correctamente');
            console.log('👤 Datos de usuario:', {
                id: window.currentUser.id ? '✅' : '❌',
                role: window.currentUser.role ? '✅' : '❌',
                email: window.currentUser.email ? '✅' : '❌'
            });
        } else {
            console.warn('⚠️ window.currentUser no está configurado');
            console.warn('   💡 Esto puede causar problemas de autenticación');
        }
        
        // Verificar AuthManager
        if (window.AuthManager && window.authManager) {
            console.log('✅ AuthManager configurado correctamente');
            
            // Verificar método de autenticación
            if (typeof window.authManager.isAuthenticated === 'function') {
                try {
                    const isAuth = window.authManager.isAuthenticated();
                    console.log(`🔐 Estado de autenticación: ${isAuth ? '✅ Autenticado' : '❌ No autenticado'}`);
                } catch (error) {
                    console.error('❌ Error verificando autenticación:', error);
                }
            }
        } else {
            console.warn('⚠️ AuthManager no está disponible');
        }
    }

    checkWindowConfig() {
        console.log('🪟 Verificando configuración de ventana...');
        
        const requiredGlobals = [
            'currentUser',
            'AuthManager',
            'authManager',
            'API_BASE_URL'
        ];
        
        requiredGlobals.forEach(global => {
            if (window[global]) {
                console.log(`✅ window.${global} está configurado`);
            } else {
                console.warn(`⚠️ window.${global} no está configurado`);
            }
        });
    }

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

    // Método para verificar si una cookie es HTTPOnly
    checkHttpOnlyCookie(name) {
        // No podemos verificar directamente si una cookie es HTTPOnly desde JavaScript
        // Pero podemos verificar si podemos acceder a ella
        try {
            const value = this.getCookie(name);
            if (value) {
                return {
                    accessible: true,
                    warning: 'Cookie accesible desde JavaScript - podría no ser HTTPOnly'
                };
            } else {
                return {
                    accessible: false,
                    info: 'Cookie no accesible desde JavaScript - probablemente HTTPOnly'
                };
            }
        } catch (error) {
            return {
                accessible: false,
                info: 'Cookie protegida correctamente'
            };
        }
    }

    // Método para generar reporte de seguridad
    generateSecurityReport() {
        console.log('\n📊 === REPORTE DE SEGURIDAD ===');
        console.log('='.repeat(50));
        
        const report = {
            timestamp: new Date().toISOString(),
            tokens_in_storage: this.countTokensInStorage(),
            auth_cookies: this.countAuthCookies(),
            window_config: this.checkWindowConfigStatus(),
            security_issues: []
        };
        
        // Analizar problemas de seguridad
        if (report.tokens_in_storage > 0) {
            report.security_issues.push('Tokens encontrados en localStorage/sessionStorage');
        }
        
        if (!window.currentUser) {
            report.security_issues.push('window.currentUser no configurado');
        }
        
        if (!window.authManager) {
            report.security_issues.push('AuthManager no disponible');
        }
        
        console.log('📊 Reporte:', report);
        console.log('='.repeat(50));
        
        return report;
    }

    countTokensInStorage() {
        let count = 0;
        
        // Contar en localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('token') || key.includes('auth') || key.includes('jwt'))) {
                count++;
            }
        }
        
        // Contar en sessionStorage
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && (key.includes('token') || key.includes('auth') || key.includes('jwt'))) {
                count++;
            }
        }
        
        return count;
    }

    countAuthCookies() {
        const cookies = document.cookie.split(';');
        return cookies.filter(cookie => {
            const name = cookie.trim().split('=')[0];
            return name.includes('auth') || name.includes('token');
        }).length;
    }

    checkWindowConfigStatus() {
        const requiredGlobals = ['currentUser', 'AuthManager', 'authManager', 'API_BASE_URL'];
        const configured = requiredGlobals.filter(global => window[global]).length;
        return `${configured}/${requiredGlobals.length}`;
    }
}

// Función global para limpiar manualmente
window.cleanupSecurity = () => {
    new SecurityCleanup();
};

// Función global para generar reporte
window.securityReport = () => {
    const cleanup = new SecurityCleanup();
    return cleanup.generateSecurityReport();
};

// Inicializar automáticamente en páginas de dashboard
if (typeof window !== 'undefined' && 
    (window.location.pathname.includes('/admin') || 
     window.location.pathname.includes('/dashboard'))) {
    
    // Ejecutar después de que otros scripts se hayan cargado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => new SecurityCleanup(), 1000);
        });
    } else {
        setTimeout(() => new SecurityCleanup(), 1000);
    }
}
