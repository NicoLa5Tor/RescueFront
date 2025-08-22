/**
 * SCRIPT PARA DESACTIVAR TODOS LOS EFECTOS DE SCROLL PROBLEMÁTICOS
 * Este script se ejecuta al cargar la página y desactiva cualquier cosa que pueda causar bordes blancos
 */

(function() {
    'use strict';
    
    ////console.log('🚫 ACTIVANDO DESACTIVADOR DE EFECTOS DE SCROLL PROBLEMÁTICOS');
    
    /**
     * Función para aplicar estilos anti-overscroll al body y html
     */
    function applyAntiOverscrollStyles() {
        const body = document.body;
        const html = document.documentElement;
        
        // Aplicar estilos CSS directamente
        const styles = {
            'overscroll-behavior': 'none',
            'overscroll-behavior-x': 'none', 
            'overscroll-behavior-y': 'none',
            '-webkit-overflow-scrolling': 'touch'
        };
        
        Object.entries(styles).forEach(([property, value]) => {
            body.style.setProperty(property, value, 'important');
            html.style.setProperty(property, value, 'important');
        });
        
        ////console.log('✅ Estilos anti-overscroll aplicados al body y html');
    }
    
    /**
     * Función para interceptar y neutralizar manipulaciones problemáticas del DOM
     */
    function interceptProblematicDOMManipulations() {
        // Interceptar manipulaciones del overflow del body
        const originalBodyOverflowDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style') ||
                                                Object.getOwnPropertyDescriptor(Element.prototype, 'style') ||
                                                Object.getOwnPropertyDescriptor(document.body, 'style');
        
        // Interceptar document.body.style.overflow
        if (document.body) {
            const originalSetProperty = document.body.style.setProperty;
            const originalSetAttribute = document.body.setAttribute;
            
            document.body.style.setProperty = function(property, value, priority) {
                if (property === 'overflow' || property === 'position') {
                    ////console.log(`🚫 INTERCEPTADO: Intento de cambiar ${property} del body a "${value}" - BLOQUEADO`);
                    // Aplicar nuestros estilos seguros en lugar de los problemáticos
                    applyAntiOverscrollStyles();
                    return;
                }
                return originalSetProperty.call(this, property, value, priority);
            };
            
            document.body.setAttribute = function(name, value) {
                if (name === 'style' && (value.includes('overflow') || value.includes('position'))) {
                    ////console.log(`🚫 INTERCEPTADO: Intento de cambiar style del body a "${value}" - BLOQUEADO`);
                    applyAntiOverscrollStyles();
                    return;
                }
                return originalSetAttribute.call(this, name, value);
            };
        }
        
        ////console.log('✅ Interceptores de DOM activados');
    }
    
    /**
     * Función para desactivar event listeners problemáticos relacionados con scroll
     */
    function disableProblematicScrollListeners() {
        // Interceptar addEventListener para bloquear ciertos eventos
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        
        EventTarget.prototype.addEventListener = function(type, listener, options) {
            // Bloquear eventos que pueden causar problemas de scroll
            const problematicEvents = ['touchmove', 'wheel', 'scroll'];
            
            if (problematicEvents.includes(type) && 
                (this === document || this === window || this === document.body || this === document.documentElement)) {
                
                // Solo permitir si el listener no intenta prevenir el comportamiento predeterminado agresivamente
                if (listener && listener.toString().includes('preventDefault')) {
                    ////console.log(`🚫 INTERCEPTADO: Event listener problemático para "${type}" - BLOQUEADO`);
                    return;
                }
            }
            
            return originalAddEventListener.call(this, type, listener, options);
        };
        
        ////console.log('✅ Interceptores de eventos activados');
    }
    
    /**
     * Función para forzar estilos anti-overscroll periódicamente
     */
    function forceAntiOverscrollPeriodically() {
        setInterval(() => {
            // Verificar si los estilos siguen aplicados
            const body = document.body;
            const html = document.documentElement;
            
            if (body.style.overscrollBehavior !== 'none' || 
                html.style.overscrollBehavior !== 'none') {
                ////console.log('⚠️ Estilos anti-overscroll perdidos, reaplícando...');
                applyAntiOverscrollStyles();
            }
        }, 1000);
        
        ////console.log('✅ Monitor periódico de estilos activado');
    }
    
    /**
     * Función para desactivar animaciones de GSAP que puedan interferir
     */
    function disableProblematicGSAPAnimations() {
        // Si GSAP está presente, configurarlo para no interferir
        if (typeof gsap !== 'undefined') {
            // Desactivar cualquier animación que pueda manipular el scroll del body
            gsap.config({
                nullTargetWarn: false,
                trialWarn: false
            });
            
            ////console.log('✅ GSAP configurado para no interferir');
        }
    }
    
    /**
     * Función principal de inicialización
     */
    function init() {
        ////console.log('🚀 Inicializando desactivador de efectos de scroll...');
        
        // Aplicar estilos inmediatamente
        applyAntiOverscrollStyles();
        
        // Configurar interceptores
        interceptProblematicDOMManipulations();
        disableProblematicScrollListeners();
        
        // Configurar monitor periódico
        forceAntiOverscrollPeriodically();
        
        // Configurar GSAP si está presente
        disableProblematicGSAPAnimations();
        
        ////console.log('✅ Desactivador de efectos de scroll completamente inicializado');
        //console.log('🎯 Los bordes blancos deberían estar COMPLETAMENTE eliminados');
    }
    
    // Ejecutar inmediatamente si el DOM ya está listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // También ejecutar cuando la ventana se carga completamente
    window.addEventListener('load', () => {
        setTimeout(init, 100); // Un pequeño delay para asegurar que todo esté listo
    });
    
})();
