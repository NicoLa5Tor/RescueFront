/**
 * Modal Utilities - Sistema de Gestión de Modales
 * Proporciona funciones globales para el manejo consistente de modales
 */

class ModalManager {
    constructor() {
        this.openModals = new Set();
        this.scrollPosition = 0;
        this.initialized = false;
        
        this.init();
    }
    
    init() {
        if (this.initialized) return;
        
        // Event listener global para tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTopModal();
            }
        });
        
        this.initialized = true;
    }
    
    /**
     * Abre un modal
     * @param {string} modalId - ID del modal a abrir
     * @param {Object} options - Opciones adicionales
     */
    openModal(modalId, options = {}) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.warn(`Modal with ID "${modalId}" not found`);
            return;
        }
        
        // Prevenir scroll del body
        this.preventBodyScroll();
        
        // Agregar modal a la lista de modales abiertos
        this.openModals.add(modalId);
        
        // Mostrar modal
        modal.classList.remove('hidden');
        
        // Focus management
        this.focusModal(modal);
        
        // Callback opcional
        if (options.onOpen && typeof options.onOpen === 'function') {
            options.onOpen(modal);
        }
        
        console.log(`Modal "${modalId}" opened`);
    }
    
    /**
     * Cierra un modal específico
     * @param {string} modalId - ID del modal a cerrar
     * @param {Object} options - Opciones adicionales
     */
    closeModal(modalId, options = {}) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.warn(`Modal with ID "${modalId}" not found`);
            return;
        }
        
        // Remover modal de la lista de modales abiertos
        this.openModals.delete(modalId);
        
        // Ocultar modal
        modal.classList.add('hidden');
        
        // Restaurar scroll del body si no hay más modales abiertos
        if (this.openModals.size === 0) {
            this.restoreBodyScroll();
        }
        
        // Callback opcional
        if (options.onClose && typeof options.onClose === 'function') {
            options.onClose(modal);
        }
        
        console.log(`Modal "${modalId}" closed`);
    }
    
    /**
     * Cierra el modal superior (último abierto)
     */
    closeTopModal() {
        if (this.openModals.size === 0) return;
        
        // Convertir Set a Array y tomar el último elemento
        const modalsArray = Array.from(this.openModals);
        const topModalId = modalsArray[modalsArray.length - 1];
        
        this.closeModal(topModalId);
    }
    
    /**
     * Cierra todos los modales abiertos
     */
    closeAllModals() {
        const modalsToClose = Array.from(this.openModals);
        modalsToClose.forEach(modalId => {
            this.closeModal(modalId);
        });
    }
    
    /**
     * Previene el scroll del body
     */
    preventBodyScroll() {
        if (this.openModals.size === 0) {
            // Solo guardar posición y aplicar estilos en el primer modal
            this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
            
            // Aplicar estilos para prevenir scroll sin mover la página
            document.body.style.position = 'fixed';
            document.body.style.top = `-${this.scrollPosition}px`;
            document.body.style.left = '0';
            document.body.style.right = '0';
            document.body.style.overflow = 'hidden';
            document.body.classList.add('modal-open');
        }
    }
    
    /**
     * Restaura el scroll del body
     */
    restoreBodyScroll() {
        // Restaurar estilos del body
        document.body.classList.remove('modal-open');
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        
        // Restaurar posición del scroll sin animación
        window.scrollTo(0, this.scrollPosition);
    }
    
    /**
     * Gestiona el focus en el modal
     * @param {Element} modal - Elemento del modal
     */
    focusModal(modal) {
        // Buscar el primer elemento focusable en el modal
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            // Focus en el primer input o en el primer botón si no hay inputs
            const firstInput = modal.querySelector('input, select, textarea');
            const firstButton = modal.querySelector('button');
            
            if (firstInput) {
                firstInput.focus();
            } else if (firstButton) {
                firstButton.focus();
            } else {
                focusableElements[0].focus();
            }
        }
    }
    
    /**
     * Configura event listeners para un modal específico
     * @param {string} modalId - ID del modal
     * @param {Object} options - Opciones de configuración
     */
    setupModal(modalId, options = {}) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.warn(`Modal with ID "${modalId}" not found`);
            return;
        }
        
        // Click fuera del modal para cerrar
        if (options.closeOnBackdropClick !== false) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modalId);
                }
            });
        }
        
        // Botones de cerrar
        const closeButtons = modal.querySelectorAll('.modal-close, [data-modal-close]');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.closeModal(modalId);
            });
        });
        
        console.log(`Modal "${modalId}" configured`);
    }
    
    /**
     * Verifica si un modal está abierto
     * @param {string} modalId - ID del modal
     * @returns {boolean}
     */
    isModalOpen(modalId) {
        return this.openModals.has(modalId);
    }
    
    /**
     * Obtiene la lista de modales abiertos
     * @returns {Array}
     */
    getOpenModals() {
        return Array.from(this.openModals);
    }
}

// Crear instancia global del gestor de modales
window.modalManager = new ModalManager();

// Funciones globales para compatibilidad con código existente
window.openModal = (modalId, options) => window.modalManager.openModal(modalId, options);
window.closeModal = (modalId, options) => window.modalManager.closeModal(modalId, options);
window.closeAllModals = () => window.modalManager.closeAllModals();

// Funciones de utilidad adicionales
window.modalUtils = {
    /**
     * Configura un modal con opciones predeterminadas
     */
    setupModal: (modalId, options = {}) => {
        window.modalManager.setupModal(modalId, options);
    },
    
    /**
     * Abre un modal de confirmación simple
     */
    confirm: (message, onConfirm, onCancel) => {
        // Esta funcionalidad se puede implementar más adelante
        // Por ahora usar confirm() nativo
        if (confirm(message)) {
            if (onConfirm) onConfirm();
        } else {
            if (onCancel) onCancel();
        }
    },
    
    /**
     * Muestra un modal de alerta
     */
    alert: (message, onClose) => {
        // Esta funcionalidad se puede implementar más adelante
        // Por ahora usar alert() nativo
        alert(message);
        if (onClose) onClose();
    }
};

// Inicialización automática cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('Modal Manager initialized');
    
    // Auto-configurar modales existentes en la página
    const modals = document.querySelectorAll('.modal-backdrop');
    modals.forEach(modal => {
        window.modalManager.setupModal(modal.id);
    });
});

// Exportar para uso en módulos ES6 si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModalManager, modalManager: window.modalManager };
}
