/**
 * ===== HARDWARE GSAP ANIMATIONS =====
 * 
 * Animaciones específicas para el módulo de hardware usando
 * la configuración global de GSAP.
 */

// Verificar que la configuración global esté disponible
// if (typeof window.GSAPAnimations === 'undefined') {
//   console.error('❌ GSAP configuración global no encontrada. Asegúrate de cargar gsap-config.js primero.');
// }

/**
 * Animaciones específicas para hardware
 */
window.HardwareAnimations = {

  /**
   * Animación de entrada para tarjetas de hardware
   * @param {string|Element} cards - Selector o elementos de tarjetas
   * @param {object} options - Opciones adicionales
   */
  animateHardwareCards: (cards, options = {}) => {
    return window.GSAPUtils.respectMotionPreference(() => {
      const config = window.GSAPDevice.getAdaptiveConfig(
        { duration: 0.4, stagger: 0.08 }, // Mobile
        { duration: 0.5, stagger: 0.1 },  // Tablet
        { duration: 0.6, stagger: 0.12 }  // Desktop
      );
      
      return window.GSAPAnimations.staggerIn(cards, {
        ...config,
        ...options,
        delay: 0.2
      });
    });
  },

  /**
   * Animación de entrada para el header iOS
   * @param {string|Element} header - Selector del header
   * @param {object} options - Opciones adicionales
   */
  animateIOSHeader: (header, options = {}) => {
    return window.GSAPUtils.respectMotionPreference(() => {
      const tl = window.GSAPUtils.createTimeline();
      
      tl.fromTo(header, 
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power2.out", ...options }
      );
      
      return tl;
    });
  },

  /**
   * Animación para las tarjetas de estadísticas
   * @param {string|Element} statsCards - Selector de tarjetas de stats
   * @param {object} options - Opciones adicionales
   */
  animateStatsCards: (statsCards, options = {}) => {
    return window.GSAPUtils.respectMotionPreference(() => {
      const config = window.GSAPDevice.getAdaptiveConfig(
        { duration: 0.4, stagger: 0.1 },  // Mobile
        { duration: 0.5, stagger: 0.15 }, // Tablet
        { duration: 0.6, stagger: 0.2 }   // Desktop
      );
      
      return window.GSAPAnimations.fadeInScale(statsCards, {
        ...config,
        ...options,
        delay: 0.4
      });
    });
  },

  /**
   * Animación del filtro container
   * @param {string|Element} filtersContainer - Selector del contenedor de filtros
   * @param {object} options - Opciones adicionales
   */
  animateFiltersContainer: (filtersContainer, options = {}) => {
    return window.GSAPUtils.respectMotionPreference(() => {
      return window.GSAPAnimations.fadeInUp(filtersContainer, {
        duration: 0.6,
        delay: 0.6,
        ...options
      });
    });
  },

  /**
   * Animación de hover para tarjetas de hardware
   * @param {Element} card - Elemento de la tarjeta
   */
  cardHoverEnter: (card) => {
    return window.GSAPUtils.respectMotionPreference(() => {
      // Animar la tarjeta
      window.GSAPAnimations.cardHover(card);
      
      // Animar el shimmer si existe
      const shimmer = card.querySelector('.ios-card-shimmer');
      if (shimmer) {
        window.GSAPAnimations.shimmer(shimmer, {
          onComplete: () => {
            gsap.set(shimmer, { x: '-100%' });
          }
        });
      }
    });
  },

  /**
   * Resetear animación de hover para tarjetas
   * @param {Element} card - Elemento de la tarjeta
   */
  cardHoverLeave: (card) => {
    return window.GSAPUtils.respectMotionPreference(() => {
      window.GSAPAnimations.cardHoverReset(card);
      
      // Resetear shimmer
      const shimmer = card.querySelector('.ios-card-shimmer');
      if (shimmer) {
        gsap.set(shimmer, { x: '-100%' });
      }
    });
  },

  /**
   * Animación de entrada para modales de hardware
   * @param {string|Element} modal - Selector del modal
   * @param {object} options - Opciones adicionales
   */
  showHardwareModal: (modal, options = {}) => {
    return window.GSAPUtils.respectMotionPreference(() => {
      const tl = window.GSAPUtils.createTimeline();
      
      // Backdrop fade in
      const backdrop = modal.querySelector('.ios-modal-backdrop, .toggle-modal-backdrop');
      if (backdrop) {
        tl.fromTo(backdrop, 
          { opacity: 0 },
          { opacity: 1, duration: 0.3 }
        );
      }
      
      // Modal container animation
      const container = modal.querySelector('.ios-blur-modal-container, .toggle-modal-container');
      if (container) {
        tl.add(window.GSAPAnimations.modalEnter(container, options), 0.1);
      }
      
      return tl;
    });
  },

  /**
   * Animación de salida para modales de hardware
   * @param {string|Element} modal - Selector del modal
   * @param {object} options - Opciones adicionales
   */
  hideHardwareModal: (modal, options = {}) => {
    return window.GSAPUtils.respectMotionPreference(() => {
      const tl = window.GSAPUtils.createTimeline();
      
      // Modal container animation
      const container = modal.querySelector('.ios-blur-modal-container, .toggle-modal-container');
      if (container) {
        tl.add(window.GSAPAnimations.modalExit(container, options));
      }
      
      // Backdrop fade out
      const backdrop = modal.querySelector('.ios-modal-backdrop, .toggle-modal-backdrop');
      if (backdrop) {
        tl.to(backdrop, 
          { opacity: 0, duration: 0.2 }, 
          0.1
        );
      }
      
      return tl;
    });
  },

  /**
   * Animación de loading para cuando se cargan nuevas tarjetas
   * @param {string|Element} container - Contenedor donde aparecerán las tarjetas
   */
  showLoadingState: (container) => {
    return window.GSAPUtils.respectMotionPreference(() => {
      // Crear elemento de loading si no existe
      let loader = container.querySelector('.hardware-loader');
      if (!loader) {
        loader = document.createElement('div');
        loader.className = 'hardware-loader';
        loader.innerHTML = `
          <div class="loader-spinner">
            <i class="fas fa-microchip"></i>
          </div>
          <p>Cargando hardware...</p>
        `;
        container.appendChild(loader);
      }
      
      // Animar entrada del loader
      return window.GSAPAnimations.fadeInScale(loader, {
        duration: 0.4
      });
    });
  },

  /**
   * Remover animación de loading
   * @param {string|Element} container - Contenedor del loader
   */
  hideLoadingState: (container) => {
    return window.GSAPUtils.respectMotionPreference(() => {
      const loader = container.querySelector('.hardware-loader');
      if (loader) {
        return gsap.to(loader, {
          opacity: 0,
          scale: 0.8,
          duration: 0.3,
          onComplete: () => loader.remove()
        });
      }
    });
  },

  /**
   * Animación para actualizar contadores de estadísticas
   * @param {Element} counter - Elemento del contador
   * @param {number} from - Valor inicial
   * @param {number} to - Valor final
   * @param {object} options - Opciones adicionales
   */
  animateCounter: (counter, from, to, options = {}) => {
    return window.GSAPUtils.respectMotionPreference(() => {
      const obj = { count: from };
      
      return gsap.to(obj, {
        count: to,
        duration: 1.5,
        ease: "power2.out",
        onUpdate: () => {
          counter.textContent = Math.round(obj.count);
        },
        ...options
      });
    });
  },

  /**
   * Animación de pulso para notificaciones o elementos importantes
   * @param {string|Element} element - Elemento a animar
   * @param {object} options - Opciones adicionales
   */
  pulseNotification: (element, options = {}) => {
    return window.GSAPUtils.respectMotionPreference(() => {
      return window.GSAPAnimations.pulse(element, {
        scale: 1.1,
        duration: 0.6,
        repeat: 3,
        yoyo: true,
        ...options
      });
    });
  },

  /**
   * Animación para cuando se añade una nueva tarjeta dinámicamente
   * @param {Element} newCard - Nueva tarjeta añadida
   * @param {object} options - Opciones adicionales
   */
  animateNewCard: (newCard, options = {}) => {
    return window.GSAPUtils.respectMotionPreference(() => {
      // Configurar estado inicial
      gsap.set(newCard, { 
        scale: 0.8, 
        opacity: 0, 
        y: 20 
      });
      
      // Animar entrada
      return gsap.to(newCard, {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "back.out(1.7)",
        ...options
      });
    });
  },

  /**
   * Animación para remover una tarjeta
   * @param {Element} card - Tarjeta a remover
   * @param {function} onComplete - Callback al completar
   * @param {object} options - Opciones adicionales
   */
  animateRemoveCard: (card, onComplete, options = {}) => {
    return window.GSAPUtils.respectMotionPreference(() => {
      return gsap.to(card, {
        scale: 0.8,
        opacity: 0,
        y: -20,
        duration: 0.4,
        ease: "power2.in",
        onComplete,
        ...options
      });
    });
  }
};

/**
 * Utilidades específicas para hardware
 */
window.HardwareUtils = {
  
  /**
   * Inicializar todas las animaciones de hardware
   */
  initializeAnimations: () => {
    //console.log('🎬 Inicializando animaciones de hardware...');
    
    // Esperar a que GSAP esté listo
    gsap.registerPlugin && gsap.ticker.lagSmoothing(0);
    
    // Animar elementos existentes
    const header = document.querySelector('.ios-header-container');
    const statsCards = document.querySelectorAll('.ios-stat-card');
    const filtersContainer = document.querySelector('.ios-filters-container');
    const hardwareCards = document.querySelectorAll('.ios-hardware-card');
    
    // Timeline principal
    const mainTl = window.GSAPUtils.createTimeline();
    
    // Secuencia de animaciones
    if (header) {
      mainTl.add(window.HardwareAnimations.animateIOSHeader(header));
    }
    
    if (statsCards.length > 0) {
      mainTl.add(window.HardwareAnimations.animateStatsCards(statsCards), 0.2);
    }
    
    if (filtersContainer) {
      mainTl.add(window.HardwareAnimations.animateFiltersContainer(filtersContainer), 0.4);
    }
    
    if (hardwareCards.length > 0) {
      mainTl.add(window.HardwareAnimations.animateHardwareCards(hardwareCards), 0.6);
    }
    
    return mainTl;
  },

  /**
   * Configurar event listeners para hover de tarjetas
   */
  setupCardHovers: () => {
    const cards = document.querySelectorAll('.ios-hardware-card');
    
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        window.HardwareAnimations.cardHoverEnter(card);
      });
      
      card.addEventListener('mouseleave', () => {
        window.HardwareAnimations.cardHoverLeave(card);
      });
    });
  },

  /**
   * Limpiar todas las animaciones de hardware
   */
  cleanup: () => {
    // Matar todas las animaciones de elementos de hardware
    window.GSAPUtils.killAnimations('.ios-hardware-card');
    window.GSAPUtils.killAnimations('.ios-stat-card');
    window.GSAPUtils.killAnimations('.ios-header-container');
    window.GSAPUtils.killAnimations('.ios-filters-container');
    
    //console.log('🧹 Animaciones de hardware limpiadas');
  }
};

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Verificar que estemos en la página de hardware
  if (document.querySelector('.ios-hardware-grid') || document.body.classList.contains('hardware-page')) {
    setTimeout(() => {
      window.HardwareUtils.initializeAnimations();
      window.HardwareUtils.setupCardHovers();
    }, 100);
  }
});

// Limpiar al salir de la página
window.addEventListener('beforeunload', () => {
  window.HardwareUtils.cleanup();
});

// Exportar para módulos ES6 si es necesario
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HardwareAnimations, HardwareUtils };
}
