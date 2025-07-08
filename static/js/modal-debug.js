// ===== MODAL DEBUG & FIX UTILITY =====

/**
 * Utilidad para diagnosticar y corregir problemas de posicionamiento de modales
 */
class ModalDebugger {
    constructor() {
        this.isDebugMode = localStorage.getItem('modal-debug') === 'true';
        this.init();
    }

    init() {
        // Agregar métodos al objeto global para debugging
        window.modalDebugger = this;
        
        // Escuchar eventos de creación de modales
        this.observeModalCreation();
        
        // Agregar controles de debug si está habilitado
        if (this.isDebugMode) {
            this.addDebugControls();
        }
    }

    /**
     * Observar la creación de modales en el DOM
     */
    observeModalCreation() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Buscar modales recién agregados
                        const modals = this.findModals(node);
                        modals.forEach(modal => this.fixModal(modal));
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Encontrar todos los modales en un elemento
     */
    findModals(element) {
        const modalSelectors = [
            '.modal-backdrop',
            '.ios-modal-backdrop',
            '.toggle-modal-backdrop',
            '.client-update-backdrop',
            '[role="dialog"]',
            '[aria-modal="true"]',
            '.modal',
            '.popup',
            '.overlay'
        ];

        const modals = [];
        
        // Si el elemento mismo es un modal
        if (modalSelectors.some(selector => element.matches && element.matches(selector))) {
            modals.push(element);
        }
        
        // Buscar modales dentro del elemento
        modalSelectors.forEach(selector => {
            const found = element.querySelectorAll && element.querySelectorAll(selector);
            if (found) {
                modals.push(...Array.from(found));
            }
        });

        return modals;
    }

    /**
     * Aplicar correcciones a un modal específico
     */
    fixModal(modal) {
        if (!modal) return;

        this.log('Aplicando correcciones a modal:', modal);

        // Asegurar posicionamiento correcto
        this.ensurePosition(modal);
        
        // Asegurar z-index correcto
        this.ensureZIndex(modal);
        
        // Asegurar que no esté dentro de contenedores problemáticos
        this.ensureProperParent(modal);
        
        // Manejar scroll del body
        this.handleBodyScroll(modal);
    }

    /**
     * Asegurar posicionamiento fixed
     */
    ensurePosition(modal) {
        const style = window.getComputedStyle(modal);
        
        if (style.position !== 'fixed') {
            modal.style.setProperty('position', 'fixed', 'important');
            modal.style.setProperty('top', '0', 'important');
            modal.style.setProperty('left', '0', 'important');
            modal.style.setProperty('right', '0', 'important');
            modal.style.setProperty('bottom', '0', 'important');
            // NO tocar width y height - mantener tamaños originales
            
            this.log('Posición corregida para modal:', modal);
        }
    }

    /**
     * Asegurar z-index alto
     */
    ensureZIndex(modal) {
        const style = window.getComputedStyle(modal);
        const currentZIndex = parseInt(style.zIndex) || 0;
        
        if (currentZIndex < 9999) {
            modal.style.setProperty('z-index', '9999', 'important');
            this.log('Z-index corregido para modal:', modal);
        }
    }

    /**
     * Asegurar que el modal esté en el body directamente
     */
    ensureProperParent(modal) {
        if (modal.parentElement !== document.body) {
            this.log('Moviendo modal al body:', modal);
            document.body.appendChild(modal);
        }
    }

    /**
     * Manejar scroll del body cuando modal está abierto
     */
    handleBodyScroll(modal) {
        const isVisible = !modal.classList.contains('hidden') && 
                         modal.style.display !== 'none' &&
                         window.getComputedStyle(modal).display !== 'none';

        if (isVisible) {
            document.body.classList.add('modal-open');
        } else {
            // Verificar si hay otros modales abiertos
            const otherModals = this.findModals(document.body).filter(m => 
                m !== modal && 
                !m.classList.contains('hidden') && 
                m.style.display !== 'none' &&
                window.getComputedStyle(m).display !== 'none'
            );
            
            if (otherModals.length === 0) {
                document.body.classList.remove('modal-open');
            }
        }
    }

    /**
     * Diagnóstico completo de modales
     */
    diagnoseAllModals() {
        const modals = this.findModals(document.body);
        
        this.log('=== DIAGNÓSTICO DE MODALES ===');
        this.log(`Encontrados ${modals.length} modales:`);
        
        modals.forEach((modal, index) => {
            this.log(`\nModal ${index + 1}:`, modal);
            this.diagnoseModal(modal);
        });
        
        return modals;
    }

    /**
     * Diagnóstico de un modal específico
     */
    diagnoseModal(modal) {
        const style = window.getComputedStyle(modal);
        const rect = modal.getBoundingClientRect();
        
        const diagnosis = {
            element: modal,
            classes: Array.from(modal.classList),
            position: style.position,
            zIndex: style.zIndex,
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            transform: style.transform,
            parent: modal.parentElement?.tagName,
            bounds: {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
            },
            isVisible: rect.width > 0 && rect.height > 0,
            issues: []
        };

        // Detectar problemas
        if (diagnosis.position !== 'fixed') {
            diagnosis.issues.push('Posición no es fixed');
        }
        if (parseInt(diagnosis.zIndex) < 9999) {
            diagnosis.issues.push('Z-index muy bajo');
        }
        if (diagnosis.parent !== 'BODY') {
            diagnosis.issues.push('No está en body directamente');
        }
        if (!diagnosis.isVisible && !modal.classList.contains('hidden')) {
            diagnosis.issues.push('Modal no visible pero no marcado como hidden');
        }

        this.log('Diagnóstico:', diagnosis);
        return diagnosis;
    }

    /**
     * Aplicar correcciones de emergencia
     */
    emergencyFix() {
        this.log('=== APLICANDO CORRECCIONES DE EMERGENCIA ===');
        
        // Agregar clase de emergencia al body
        document.body.classList.add('force-modal-visible');
        
        // Encontrar y corregir todos los modales
        const modals = this.findModals(document.body);
        modals.forEach(modal => {
            this.fixModal(modal);
            
            // Correcciones adicionales de emergencia - SOLO posicionamiento
            modal.style.setProperty('position', 'fixed', 'important');
            modal.style.setProperty('z-index', '999999', 'important');
            modal.style.setProperty('top', '0', 'important');
            modal.style.setProperty('left', '0', 'important');
            modal.style.setProperty('right', '0', 'important');
            modal.style.setProperty('bottom', '0', 'important');
            modal.style.setProperty('display', 'flex', 'important');
            modal.style.setProperty('visibility', 'visible', 'important');
            modal.style.setProperty('opacity', '1', 'important');
            // NO tocar width, height, max-width, max-height, padding, margin
        });

        this.log('Correcciones de emergencia aplicadas');
    }

    /**
     * Habilitar modo debug
     */
    enableDebug() {
        localStorage.setItem('modal-debug', 'true');
        this.isDebugMode = true;
        this.addDebugControls();
        this.log('Modo debug habilitado');
    }

    /**
     * Deshabilitar modo debug
     */
    disableDebug() {
        localStorage.removeItem('modal-debug');
        this.isDebugMode = false;
        this.removeDebugControls();
        this.log('Modo debug deshabilitado');
    }

    /**
     * Agregar controles de debug a la página
     */
    addDebugControls() {
        if (document.getElementById('modal-debug-controls')) return;

        const controls = document.createElement('div');
        controls.id = 'modal-debug-controls';
        controls.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 999999;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
        `;

        controls.innerHTML = `
            <div>Modal Debugger</div>
            <button onclick="modalDebugger.diagnoseAllModals()">Diagnosticar</button>
            <button onclick="modalDebugger.emergencyFix()">Fix Emergencia</button>
            <button onclick="modalDebugger.disableDebug()">Cerrar</button>
        `;

        document.body.appendChild(controls);
    }

    /**
     * Remover controles de debug
     */
    removeDebugControls() {
        const controls = document.getElementById('modal-debug-controls');
        if (controls) {
            controls.remove();
        }
    }

    /**
     * Log con prefijo
     */
    log(...args) {
        if (this.isDebugMode) {
            console.log('[ModalDebugger]', ...args);
        }
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ModalDebugger();
    });
} else {
    new ModalDebugger();
}

// Funciones globales para usar en consola
window.debugModals = () => {
    if (window.modalDebugger) {
        window.modalDebugger.enableDebug();
        return window.modalDebugger.diagnoseAllModals();
    }
};

window.fixModals = () => {
    if (window.modalDebugger) {
        window.modalDebugger.emergencyFix();
    }
};
