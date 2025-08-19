// ============ GESTOR DE COMPATIBILIDAD ENTRE NAVEGADORES ============
// Este módulo maneja todas las correcciones específicas para diferentes navegadores
// Mantiene la modularidad y permite activar/desactivar correcciones específicas

(function() {
    'use strict';
    
    // ============ DETECCIÓN DE NAVEGADORES ============
    const BrowserDetector = {
        isChrome: function() {
            return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
        },
        
        isFirefox: function() {
            return /Firefox/.test(navigator.userAgent);
        },
        
        isSafari: function() {
            return /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
        },
        
        isEdge: function() {
            return /Edge/.test(navigator.userAgent);
        },
        
        isMobile: function() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        },
        
        getInfo: function() {
            return {
                chrome: this.isChrome(),
                firefox: this.isFirefox(),
                safari: this.isSafari(),
                edge: this.isEdge(),
                mobile: this.isMobile(),
                userAgent: navigator.userAgent,
                vendor: navigator.vendor
            };
        }
    };
    
    // ============ REGISTRO DE MÓDULOS DE COMPATIBILIDAD ============
    const CompatibilityManager = {
        modules: new Map(),
        initialized: false,
        browserInfo: null,
        
        // Registrar un módulo de compatibilidad
        registerModule: function(moduleId, moduleConfig) {
            if (this.modules.has(moduleId)) {
                console.warn(`⚠️ COMPATIBILITY: Módulo ${moduleId} ya está registrado`);
                return false;
            }
            
            const module = {
                id: moduleId,
                name: moduleConfig.name || moduleId,
                description: moduleConfig.description || 'Sin descripción',
                targetBrowsers: moduleConfig.targetBrowsers || [],
                enabled: moduleConfig.enabled !== false, // Por defecto habilitado
                init: moduleConfig.init || null,
                cleanup: moduleConfig.cleanup || null,
                dependencies: moduleConfig.dependencies || [],
                priority: moduleConfig.priority || 0,
                instance: null
            };
            
            this.modules.set(moduleId, module);
            console.log(`📋 COMPATIBILITY: Módulo ${moduleId} registrado`);
            
            // Si ya estamos inicializados, cargar este módulo inmediatamente
            if (this.initialized) {
                this.loadModule(moduleId);
            }
            
            return true;
        },
        
        // Cargar un módulo específico
        loadModule: function(moduleId) {
            const module = this.modules.get(moduleId);
            if (!module) {
                console.error(`❌ COMPATIBILITY: Módulo ${moduleId} no encontrado`);
                return false;
            }
            
            if (!module.enabled) {
                console.log(`⏸️ COMPATIBILITY: Módulo ${moduleId} está deshabilitado`);
                return false;
            }
            
            // Verificar si el navegador necesita este módulo
            const needsModule = this.browserNeedsModule(module);
            if (!needsModule) {
                console.log(`ℹ️ COMPATIBILITY: Módulo ${moduleId} no necesario para este navegador`);
                return false;
            }
            
            // Verificar dependencias
            const dependenciesOk = this.checkDependencies(module);
            if (!dependenciesOk) {
                console.error(`❌ COMPATIBILITY: Dependencias no satisfechas para ${moduleId}`);
                return false;
            }
            
            try {
                if (typeof module.init === 'function') {
                    const instance = module.init(this.browserInfo);
                    module.instance = instance;
                    console.log(`✅ COMPATIBILITY: Módulo ${moduleId} cargado exitosamente`);
                    return true;
                }
            } catch (error) {
                console.error(`❌ COMPATIBILITY: Error cargando módulo ${moduleId}:`, error);
                return false;
            }
            
            return false;
        },
        
        // Verificar si el navegador actual necesita el módulo
        browserNeedsModule: function(module) {
            if (module.targetBrowsers.length === 0) {
                return true; // Sin restricciones, aplicar a todos
            }
            
            return module.targetBrowsers.some(browser => {
                switch (browser.toLowerCase()) {
                    case 'chrome':
                        return this.browserInfo.chrome;
                    case 'firefox':
                        return this.browserInfo.firefox;
                    case 'safari':
                        return this.browserInfo.safari;
                    case 'edge':
                        return this.browserInfo.edge;
                    case 'mobile':
                        return this.browserInfo.mobile;
                    default:
                        return false;
                }
            });
        },
        
        // Verificar dependencias de un módulo
        checkDependencies: function(module) {
            return module.dependencies.every(depId => {
                const depModule = this.modules.get(depId);
                return depModule && depModule.instance !== null;
            });
        },
        
        // Descargar un módulo
        unloadModule: function(moduleId) {
            const module = this.modules.get(moduleId);
            if (!module) {
                return false;
            }
            
            try {
                if (typeof module.cleanup === 'function' && module.instance) {
                    module.cleanup(module.instance);
                }
                module.instance = null;
                console.log(`🗑️ COMPATIBILITY: Módulo ${moduleId} descargado`);
                return true;
            } catch (error) {
                console.error(`❌ COMPATIBILITY: Error descargando módulo ${moduleId}:`, error);
                return false;
            }
        },
        
        // Habilitar/deshabilitar un módulo
        setModuleEnabled: function(moduleId, enabled) {
            const module = this.modules.get(moduleId);
            if (!module) {
                return false;
            }
            
            module.enabled = enabled;
            
            if (enabled && this.initialized) {
                this.loadModule(moduleId);
            } else if (!enabled && module.instance) {
                this.unloadModule(moduleId);
            }
            
            console.log(`🔄 COMPATIBILITY: Módulo ${moduleId} ${enabled ? 'habilitado' : 'deshabilitado'}`);
            return true;
        },
        
        // Obtener información de todos los módulos
        getModulesInfo: function() {
            const modules = [];
            this.modules.forEach((module, id) => {
                modules.push({
                    id: id,
                    name: module.name,
                    description: module.description,
                    enabled: module.enabled,
                    loaded: module.instance !== null,
                    targetBrowsers: module.targetBrowsers,
                    priority: module.priority
                });
            });
            
            // Ordenar por prioridad
            return modules.sort((a, b) => b.priority - a.priority);
        },
        
        // Inicializar el gestor
        init: function() {
            if (this.initialized) {
                console.warn('⚠️ COMPATIBILITY: Gestor ya inicializado');
                return;
            }
            
            console.log('🚀 COMPATIBILITY: Iniciando gestor de compatibilidad');
            
            // Detectar información del navegador
            this.browserInfo = BrowserDetector.getInfo();
            console.log('🔍 COMPATIBILITY: Navegador detectado:', this.browserInfo);
            
            // Cargar módulos en orden de prioridad
            const sortedModules = Array.from(this.modules.entries())
                .sort((a, b) => b[1].priority - a[1].priority);
            
            sortedModules.forEach(([moduleId, module]) => {
                this.loadModule(moduleId);
            });
            
            this.initialized = true;
            
            // Emitir evento de inicialización
            window.dispatchEvent(new CustomEvent('compatibility:initialized', {
                detail: {
                    browserInfo: this.browserInfo,
                    loadedModules: this.getModulesInfo().filter(m => m.loaded)
                }
            }));
            
            console.log('✅ COMPATIBILITY: Gestor inicializado completamente');
        },
        
        // Limpiar todos los módulos
        cleanup: function() {
            console.log('🧹 COMPATIBILITY: Limpiando todos los módulos');
            
            this.modules.forEach((module, moduleId) => {
                if (module.instance) {
                    this.unloadModule(moduleId);
                }
            });
            
            this.modules.clear();
            this.initialized = false;
        }
    };
    
    // ============ EXPONEER API GLOBAL ============
    window.CompatibilityManager = CompatibilityManager;
    window.BrowserDetector = BrowserDetector;
    
    // ============ FUNCIONES DE UTILIDAD GLOBAL ============
    window.checkBrowserCompatibility = function() {
        const info = BrowserDetector.getInfo();
        const modules = CompatibilityManager.getModulesInfo();
        
        console.table(info);
        console.table(modules);
        
        return {
            browser: info,
            modules: modules,
            recommendations: generateRecommendations(info, modules)
        };
    };
    
    function generateRecommendations(browserInfo, modules) {
        const recommendations = [];
        
        if (browserInfo.chrome) {
            const chromeModules = modules.filter(m => 
                m.targetBrowsers.includes('chrome') && !m.loaded
            );
            if (chromeModules.length > 0) {
                recommendations.push('Hay módulos específicos para Chrome disponibles pero no cargados');
            }
        }
        
        if (browserInfo.mobile) {
            recommendations.push('Navegador móvil detectado - considera optimizaciones específicas');
        }
        
        return recommendations;
    }
    
    // ============ AUTO-INICIALIZACIÓN ============
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Pequeño delay para permitir que los módulos se registren
            setTimeout(() => CompatibilityManager.init(), 100);
        });
    } else {
        setTimeout(() => CompatibilityManager.init(), 100);
    }
    
    console.log('🔧 COMPATIBILITY MANAGER: Sistema de compatibilidad cargado');
    console.log('💡 Comandos disponibles: checkBrowserCompatibility(), CompatibilityManager');
    
})();
