/**
 * Performance Optimizer
 * Detecta dispositivos de bajo rendimiento y optimiza animaciones automáticamente
 */

class PerformanceOptimizer {
    constructor() {
        this.isLowEndDevice = false;
        this.isMobile = false;
        this.prefersReducedMotion = false;
        
        this.init();
    }

    init() {
        this.detectDeviceCapabilities();
        this.checkUserPreferences();
        this.applyOptimizations();
        this.setupShimmerOptimization();
        this.setupAnimationCleanup();
    }

    detectDeviceCapabilities() {
        // Detectar dispositivos móviles
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
        
        // Detectar dispositivos de bajo rendimiento
        const hardwareConcurrency = navigator.hardwareConcurrency || 1;
        const deviceMemory = navigator.deviceMemory || 1;
        const connectionSpeed = navigator.connection?.effectiveType || '4g';
        
        // Criterios para dispositivos de bajo rendimiento
        this.isLowEndDevice = (
            hardwareConcurrency <= 2 ||
            deviceMemory <= 2 ||
            connectionSpeed === 'slow-2g' ||
            connectionSpeed === '2g' ||
            connectionSpeed === '3g'
        );

        console.log('🔍 Device Detection:', {
            isMobile: this.isMobile,
            isLowEndDevice: this.isLowEndDevice,
            cores: hardwareConcurrency,
            memory: deviceMemory,
            connection: connectionSpeed
        });
    }

    checkUserPreferences() {
        // Verificar preferencias de movimiento reducido
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Verificar preferencias de datos reducidos
        this.prefersReducedData = window.matchMedia('(prefers-reduced-data: reduce)').matches;

        console.log('👤 User Preferences:', {
            prefersReducedMotion: this.prefersReducedMotion,
            prefersReducedData: this.prefersReducedData
        });
    }

    applyOptimizations() {
        const body = document.body;

        if (this.isMobile) {
            body.classList.add('mobile-device');
            console.log('📱 Mobile optimizations applied');
        }

        if (this.isLowEndDevice) {
            body.classList.add('low-end-device');
            // Deshabilitar animaciones pesadas
            body.classList.add('mobile-no-animations');
            console.log('⚡ Low-end device optimizations applied');
        }

        if (this.prefersReducedMotion) {
            body.classList.add('reduced-motion');
            console.log('🎭 Reduced motion preferences applied');
        }

        if (this.prefersReducedData) {
            body.classList.add('reduced-data');
            console.log('📊 Reduced data preferences applied');
        }
    }

    setupShimmerOptimization() {
        // Optimizar efectos shimmer para que solo se activen en hover
        const shimmerElements = document.querySelectorAll('.ios-card-shimmer, .ios-stat-shimmer');
        
        shimmerElements.forEach(element => {
            const card = element.closest('.ios-hardware-card, .ios-stat-card');
            if (card) {
                // Pausar animación por defecto
                element.style.animationPlayState = 'paused';
                
                // Activar solo en hover
                card.addEventListener('mouseenter', () => {
                    if (!this.isLowEndDevice && !this.prefersReducedMotion) {
                        element.style.animationPlayState = 'running';
                    }
                });
                
                card.addEventListener('mouseleave', () => {
                    element.style.animationPlayState = 'paused';
                });
            }
        });

        console.log('✨ Shimmer optimization applied to', shimmerElements.length, 'elements');
    }

    setupAnimationCleanup() {
        // Limpiar will-change después de las animaciones
        const animatedElements = document.querySelectorAll('[class*="animate-"], [class*="gsap-"]');
        
        animatedElements.forEach(element => {
            // Detectar fin de animación CSS
            element.addEventListener('animationend', () => {
                element.classList.add('animation-complete');
                if (element.style.willChange) {
                    element.style.willChange = 'auto';
                }
            });

            // Detectar fin de transición
            element.addEventListener('transitionend', () => {
                element.classList.add('animation-complete');
                if (element.style.willChange) {
                    element.style.willChange = 'auto';
                }
            });
        });

        console.log('🧹 Animation cleanup applied to', animatedElements.length, 'elements');
    }

    // Método para deshabilitar temporalmente las animaciones
    disableAnimations() {
        document.body.classList.add('no-animation');
        console.log('⏸️ Animations disabled');
    }

    // Método para rehabilitar las animaciones
    enableAnimations() {
        document.body.classList.remove('no-animation');
        console.log('▶️ Animations enabled');
    }

    // Método para obtener el estado actual
    getOptimizationStatus() {
        return {
            isMobile: this.isMobile,
            isLowEndDevice: this.isLowEndDevice,
            prefersReducedMotion: this.prefersReducedMotion,
            prefersReducedData: this.prefersReducedData
        };
    }
}

// CSS adicional para las optimizaciones
const optimizationStyles = `
    .low-end-device .ios-card-shimmer,
    .low-end-device .ios-stat-shimmer {
        display: none !important;
    }
    
    .reduced-motion .ios-card-shimmer,
    .reduced-motion .ios-stat-shimmer {
        display: none !important;
    }
    
    .mobile-device .complex-animation {
        animation-duration: 0.2s !important;
    }
    
    .no-animation * {
        animation: none !important;
        transition: none !important;
    }
`;

// Añadir estilos al head
const styleSheet = document.createElement('style');
styleSheet.textContent = optimizationStyles;
document.head.appendChild(styleSheet);

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.performanceOptimizer = new PerformanceOptimizer();
    });
} else {
    window.performanceOptimizer = new PerformanceOptimizer();
}

// Exportar para uso global
window.PerformanceOptimizer = PerformanceOptimizer;
