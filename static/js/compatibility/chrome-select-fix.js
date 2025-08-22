// ============ MÓDULO DE CORRECCIÓN DE SELECT PARA CHROME ============
// Este módulo se integra con el sistema de compatibilidad para corregir
// problemas de visibilidad de elementos select en Chrome

(function() {
    'use strict';
    
    // ============ CONFIGURACIÓN DEL MÓDULO ============
    const MODULE_CONFIG = {
        name: 'Chrome Select Fix',
        description: 'Corrige problemas de visibilidad en elementos select de Chrome',
        targetBrowsers: ['chrome'],
        priority: 10,
        enabled: true
    };
    
    // Función para aplicar correcciones a un elemento select
    function fixSelectElement(selectElement) {
        if (!selectElement) return;
        
        // Detectar si estamos en modo oscuro
        const isDarkMode = document.documentElement.classList.contains('dark') || 
                          document.body.classList.contains('dark');
        
        // Aplicar estilos directamente al select
        if (!isDarkMode) {
            // Modo claro - forzar colores visibles
            selectElement.style.color = '#1e293b';
            selectElement.style.backgroundColor = '#ffffff';
            selectElement.style.setProperty('color', '#1e293b', 'important');
            selectElement.style.setProperty('background-color', '#ffffff', 'important');
            
            // Aplicar estilos a todas las opciones
            const options = selectElement.querySelectorAll('option');
            options.forEach(option => {
                option.style.color = '#1e293b';
                option.style.backgroundColor = '#ffffff';
                option.style.setProperty('color', '#1e293b', 'important');
                option.style.setProperty('background-color', '#ffffff', 'important');
            });
        } else {
            // Modo oscuro
            selectElement.style.color = '#f1f5f9';
            selectElement.style.backgroundColor = '#334155';
            selectElement.style.setProperty('color', '#f1f5f9', 'important');
            selectElement.style.setProperty('background-color', '#334155', 'important');
            
            // Aplicar estilos a todas las opciones
            const options = selectElement.querySelectorAll('option');
            options.forEach(option => {
                option.style.color = '#f1f5f9';
                option.style.backgroundColor = '#334155';
                option.style.setProperty('color', '#f1f5f9', 'important');
                option.style.setProperty('background-color', '#334155', 'important');
            });
        }
        
        //console.log(`🔧 SELECT FIX: Corrección aplicada a select (modo ${isDarkMode ? 'oscuro' : 'claro'})`);
    }
    
    // Función para aplicar correcciones a todos los selects
    function fixAllSelects() {
        const selects = document.querySelectorAll('select.form-select, select[class*="form-"], select[class*="select-"]');
        let fixedCount = 0;
        
        selects.forEach(select => {
            fixSelectElement(select);
            fixedCount++;
        });
        
        //console.log(`✅ SELECT FIX: ${fixedCount} elementos select corregidos`);
    }
    
    // Observador para detectar cambios en el tema
    function observeThemeChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    // El tema ha cambiado, volver a aplicar correcciones
                    setTimeout(fixAllSelects, 100);
                }
            });
        });
        
        // Observar cambios en las clases del documentElement y body
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
        
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });
        
        //console.log('👀 SELECT FIX: Observer de tema activado');
    }
    
    // Observador para detectar nuevos selects añadidos dinámicamente
    function observeNewSelects() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Verificar si el nodo añadido es un select
                        if (node.tagName === 'SELECT' && 
                            (node.classList.contains('form-select') || 
                             node.className.includes('form-') || 
                             node.className.includes('select-'))) {
                            fixSelectElement(node);
                        }
                        
                        // Verificar si hay selects dentro del nodo añadido
                        const selects = node.querySelectorAll && node.querySelectorAll('select.form-select, select[class*="form-"], select[class*="select-"]');
                        if (selects && selects.length > 0) {
                            selects.forEach(fixSelectElement);
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        //console.log('🔍 SELECT FIX: Observer de nuevos elementos activado');
    }
    
    // Función para detectar si estamos en Chrome
    function isChrome() {
        return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    }
    
    // Función para corregir selects específicamente en eventos
    function addEventListeners() {
        // Escuchar eventos de change en selects para asegurar visibilidad
        document.addEventListener('change', function(event) {
            if (event.target.tagName === 'SELECT') {
                setTimeout(() => fixSelectElement(event.target), 10);
            }
        });
        
        // Escuchar eventos de focus
        document.addEventListener('focus', function(event) {
            if (event.target.tagName === 'SELECT') {
                fixSelectElement(event.target);
            }
        }, true);
        
        // Escuchar cuando se abren modales
        document.addEventListener('modal:opened', function() {
            setTimeout(fixAllSelects, 200);
        });
        
        //console.log('🎯 SELECT FIX: Event listeners añadidos');
    }
    
    // ============ INTEGRACIÓN CON EL SISTEMA MODULAR ============
    
    // Crear instancia del módulo
    const ChromeSelectFixModule = {
        observers: [],
        eventListeners: [],
        
        // Función de inicialización del módulo
        init: function(browserInfo) {
            //console.log('🚀 CHROME SELECT FIX: Iniciando como módulo de compatibilidad');
            
            // Aplicar correcciones iniciales
            fixAllSelects();
            
            // Configurar observadores
            this.setupObservers();
            
            // Añadir event listeners
            this.setupEventListeners();
            
            // Programar re-aplicaciones
            this.scheduleRefreshes();
            
            //console.log('✅ CHROME SELECT FIX: Módulo inicializado correctamente');
            
            return this;
        },
        
        // Configurar observadores
        setupObservers: function() {
            // Observer para cambios de tema
            const themeObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        setTimeout(fixAllSelects, 100);
                    }
                });
            });
            
            themeObserver.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['class']
            });
            
            themeObserver.observe(document.body, {
                attributes: true,
                attributeFilter: ['class']
            });
            
            this.observers.push(themeObserver);
            
            // Observer para nuevos elementos
            const newElementsObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.tagName === 'SELECT' && 
                                (node.classList.contains('form-select') || 
                                 node.className.includes('form-') || 
                                 node.className.includes('select-'))) {
                                fixSelectElement(node);
                            }
                            
                            const selects = node.querySelectorAll && node.querySelectorAll('select.form-select, select[class*="form-"], select[class*="select-"]');
                            if (selects && selects.length > 0) {
                                selects.forEach(fixSelectElement);
                            }
                        }
                    });
                });
            });
            
            newElementsObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            this.observers.push(newElementsObserver);
            
            //console.log('👀 CHROME SELECT FIX: Observers configurados');
        },
        
        // Configurar event listeners
        setupEventListeners: function() {
            const changeHandler = (event) => {
                if (event.target.tagName === 'SELECT') {
                    setTimeout(() => fixSelectElement(event.target), 10);
                }
            };
            
            const focusHandler = (event) => {
                if (event.target.tagName === 'SELECT') {
                    fixSelectElement(event.target);
                }
            };
            
            const modalHandler = () => {
                setTimeout(fixAllSelects, 200);
            };
            
            document.addEventListener('change', changeHandler);
            document.addEventListener('focus', focusHandler, true);
            document.addEventListener('modal:opened', modalHandler);
            
            // Guardar referencias para limpieza
            this.eventListeners.push(
                { element: document, event: 'change', handler: changeHandler },
                { element: document, event: 'focus', handler: focusHandler, options: true },
                { element: document, event: 'modal:opened', handler: modalHandler }
            );
            
            //console.log('🎯 CHROME SELECT FIX: Event listeners configurados');
        },
        
        // Programar actualizaciones automáticas
        scheduleRefreshes: function() {
            // Re-aplicar correcciones después de carga completa
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(fixAllSelects, 500);
                });
            } else {
                setTimeout(fixAllSelects, 500);
            }
            
            // Re-aplicar cuando la ventana termine de cargar
            window.addEventListener('load', () => {
                setTimeout(fixAllSelects, 1000);
            });
        },
        
        // Función de limpieza del módulo
        cleanup: function() {
            //console.log('🧹 CHROME SELECT FIX: Limpiando módulo');
            
            // Limpiar observers
            this.observers.forEach(observer => {
                observer.disconnect();
            });
            this.observers = [];
            
            // Limpiar event listeners
            this.eventListeners.forEach(({ element, event, handler, options }) => {
                element.removeEventListener(event, handler, options);
            });
            this.eventListeners = [];
            
            //console.log('✅ CHROME SELECT FIX: Módulo limpiado');
        },
        
        // Función para corrección manual
        fixManually: function() {
            fixAllSelects();
            const selectCount = document.querySelectorAll('select.form-select, select[class*="form-"], select[class*="select-"]').length;
            //console.log(`🔧 CHROME SELECT FIX: Corrección manual aplicada a ${selectCount} selects`);
            return selectCount;
        }
    };
    
    // ============ REGISTRO EN EL SISTEMA DE COMPATIBILIDAD ============
    function registerModule() {
        if (typeof window.CompatibilityManager !== 'undefined') {
            window.CompatibilityManager.registerModule('chrome-select-fix', {
                ...MODULE_CONFIG,
                init: ChromeSelectFixModule.init.bind(ChromeSelectFixModule),
                cleanup: ChromeSelectFixModule.cleanup.bind(ChromeSelectFixModule)
            });
            //console.log('📋 CHROME SELECT FIX: Módulo registrado en CompatibilityManager');
        } else {
            // Fallback: ejecutar directamente si CompatibilityManager no está disponible
            //console.warn('⚠️ CHROME SELECT FIX: CompatibilityManager no disponible, ejecutando directamente');
            if (isChrome()) {
                ChromeSelectFixModule.init({ chrome: true });
            }
        }
    }
    
    // ============ FUNCIONES GLOBALES ============
    window.fixSelectsManually = function() {
        if (window.CompatibilityManager) {
            const module = window.CompatibilityManager.modules.get('chrome-select-fix');
            if (module && module.instance) {
                return module.instance.fixManually();
            }
        }
        // Fallback
        fixAllSelects();
        return document.querySelectorAll('select.form-select, select[class*="form-"], select[class*="select-"]').length;
    };
    
    // ============ AUTO-REGISTRO ============
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', registerModule);
    } else {
        registerModule();
    }
    
})();

// Mensaje de confirmación
//console.log('📋 CHROME SELECT FIX: Script cargado - Comando disponible: fixSelectsManually()');
