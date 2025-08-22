/**
 * SCRIPT FINAL DE LIMPIEZA DE TOKENS
 * 
 * Este script elimina TODOS los tokens residuales y verifica que la configuración
 * de cookies HTTPOnly funcione correctamente.
 */

(function() {
    'use strict';
    
    ////console.log('🔒 INICIANDO LIMPIEZA FINAL DE TOKENS...');
    
    // Función para limpiar todos los tokens residuales
    function eliminateAllTokens() {
        ////console.log('🧹 Eliminando TODOS los tokens residuales...');
        
        // 1. Eliminar de localStorage
        const localStorageKeysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
                key.includes('token') || 
                key.includes('auth') || 
                key.includes('jwt') || 
                key.includes('session') ||
                key.includes('Token') ||
                key.includes('AUTH') ||
                key.includes('JWT') ||
                key.includes('SESSION')
            )) {
                localStorageKeysToRemove.push(key);
            }
        }
        
        localStorageKeysToRemove.forEach(key => {
            ////console.warn(`🗑️ Eliminando de localStorage: ${key}`);
            localStorage.removeItem(key);
        });
        
        // 2. Eliminar de sessionStorage
        const sessionStorageKeysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && (
                key.includes('token') || 
                key.includes('auth') || 
                key.includes('jwt') || 
                key.includes('session') ||
                key.includes('Token') ||
                key.includes('AUTH') ||
                key.includes('JWT') ||
                key.includes('SESSION')
            )) {
                sessionStorageKeysToRemove.push(key);
            }
        }
        
        sessionStorageKeysToRemove.forEach(key => {
            ////console.warn(`🗑️ Eliminando de sessionStorage: ${key}`);
            sessionStorage.removeItem(key);
        });
        
        // 3. Eliminar variables globales de window
        const windowPropertiesToRemove = [];
        for (let prop in window) {
            if (prop && typeof window[prop] === 'string' && (
                prop.includes('token') || 
                prop.includes('auth') || 
                prop.includes('jwt') || 
                prop.includes('session') ||
                prop.includes('Token') ||
                prop.includes('AUTH') ||
                prop.includes('JWT') ||
                prop.includes('SESSION')
            )) {
                windowPropertiesToRemove.push(prop);
            }
        }
        
        windowPropertiesToRemove.forEach(prop => {
            ////console.warn(`🗑️ Eliminando de window: ${prop}`);
            delete window[prop];
        });
        
        // 4. Eliminar específicamente sessionToken
        if (window.sessionToken) {
            ////console.warn('🗑️ Eliminando window.sessionToken (CRÍTICO)');
            delete window.sessionToken;
        }
        
        // 5. Reportar resultado
        const totalRemoved = localStorageKeysToRemove.length + sessionStorageKeysToRemove.length + windowPropertiesToRemove.length;
        if (totalRemoved > 0) {
            ////console.warn(`🧹 LIMPIEZA COMPLETADA: ${totalRemoved} tokens eliminados`);
        } else {
            ////console.log('✅ No se encontraron tokens residuales');
        }
    }
    
    // Función para verificar que no hay tokens accesibles
    function verifyNoAccessibleTokens() {
        //console.log('🔍 Verificando que no haya tokens accesibles...');
        
        let tokensFound = [];
        
        // Verificar localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('token') || key.includes('auth') || key.includes('jwt'))) {
                tokensFound.push(`localStorage.${key}`);
            }
        }
        
        // Verificar sessionStorage
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && (key.includes('token') || key.includes('auth') || key.includes('jwt'))) {
                tokensFound.push(`sessionStorage.${key}`);
            }
        }
        
        // Verificar window
        if (window.sessionToken) {
            tokensFound.push('window.sessionToken');
        }
        
        // Verificar cookies accesibles
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            if (name && value && (name.includes('token') || name.includes('auth'))) {
                tokensFound.push(`cookie.${name}`);
            }
        });
        
        if (tokensFound.length > 0) {
            //console.error('❌ ¡TOKENS ACCESIBLES ENCONTRADOS!');
            //console.error('Los siguientes tokens son accesibles desde JavaScript:');
            tokensFound.forEach(token => {
                //console.error(`  - ${token}`);
            });
            return false;
        } else {
            //console.log('✅ No se encontraron tokens accesibles desde JavaScript');
            return true;
        }
    }
    
    // Función para verificar cookies HTTPOnly
    function verifyHTTPOnlyCookies() {
        //console.log('🍪 Verificando cookies HTTPOnly...');
        
        // Intentar hacer una petición para verificar que las cookies se envían automáticamente
        fetch('/proxy/health', {
            method: 'GET',
            credentials: 'include'
        })
        .then(response => {
            if (response.ok) {
                //console.log('✅ Las cookies HTTPOnly funcionan correctamente');
                //console.log('✅ El backend puede leer las cookies de autenticación');
            } else {
                //console.warn('⚠️ Problema con las cookies HTTPOnly o sesión expirada');
            }
        })
        .catch(error => {
            //console.error('❌ Error verificando cookies HTTPOnly:', error);
        });
    }
    
    // Función principal
    function finalCleanup() {
        //console.log('🔒 === LIMPIEZA FINAL DE TOKENS ===');
        
        // Paso 1: Eliminar todos los tokens
        eliminateAllTokens();
        
        // Paso 2: Verificar que no hay tokens accesibles
        const isClean = verifyNoAccessibleTokens();
        
        // Paso 3: Verificar cookies HTTPOnly
        verifyHTTPOnlyCookies();
        
        // Paso 4: Reportar estado final
        if (isClean) {
            //console.log('🎉 CONFIGURACIÓN SEGURA COMPLETADA');
            //console.log('✅ No hay tokens accesibles desde JavaScript');
            //console.log('✅ La autenticación funciona exclusivamente con cookies HTTPOnly');
        } else {
            //console.error('❌ CONFIGURACIÓN INSEGURA DETECTADA');
            //console.error('⚠️ HAY TOKENS ACCESIBLES DESDE JAVASCRIPT');
        }
        
        //console.log('🔒 === FIN DE LIMPIEZA FINAL ===');
    }
    
    // Función para mostrar estado actual
    function showCurrentState() {
        //console.log('\n📊 ESTADO ACTUAL DE AUTENTICACIÓN:');
        //console.log('='.repeat(50));
        
        //console.log('🔍 Verificaciones:');
        //console.log(`  - localStorage tokens: ${localStorage.length > 0 ? 'Verificando...' : 'Vacío'}`);
        //console.log(`  - sessionStorage tokens: ${sessionStorage.length > 0 ? 'Verificando...' : 'Vacío'}`);
        //console.log(`  - window.sessionToken: ${window.sessionToken ? '❌ PRESENTE' : '✅ No presente'}`);
        //console.log(`  - window.currentUser: ${window.currentUser ? '✅ Presente' : '❌ No presente'}`);
        
        const cookies = document.cookie.split(';').filter(c => c.trim());
        //console.log(`  - Cookies visibles: ${cookies.length} encontradas`);
        
        //console.log('='.repeat(50));
    }
    
    // Ejecutar limpieza automáticamente
    finalCleanup();
    
    // Mostrar estado después de la limpieza
    setTimeout(() => {
        showCurrentState();
    }, 1000);
    
    // Hacer funciones disponibles globalmente para debugging
    window.eliminateAllTokens = eliminateAllTokens;
    window.verifyNoAccessibleTokens = verifyNoAccessibleTokens;
    window.finalCleanup = finalCleanup;
    window.showCurrentState = showCurrentState;
    
})();
