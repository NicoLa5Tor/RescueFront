/**
 * ===== GSAP GLOBAL CONFIGURATION =====
 * 
 * Configuración centralizada para todas las animaciones GSAP del sistema.
 * Este archivo se carga después de GSAP y proporciona configuraciones
 * reutilizables para todos los módulos.
 */

// Verificar que GSAP esté disponible
if (typeof gsap === 'undefined') {
  console.error('❌ GSAP no está disponible. Asegúrate de que se carga antes de este archivo.');
} else {
  console.log('✅ GSAP configuración global iniciada');
}

// ===== CONFIGURACIONES GLOBALES =====

// Configuración por defecto para ScrollTrigger
if (gsap.registerPlugin && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
  
  // Configuración global de ScrollTrigger
  ScrollTrigger.config({
    autoRefreshEvents: "visibilitychange,DOMContentLoaded,load",
    ignoreMobileResize: true
  });
  
  console.log('✅ ScrollTrigger configurado');
}

// Configuración global de duración y ease optimizada para Chrome
gsap.defaults({
  duration: 0.6,
  ease: "power2.out"
});

// Configuración específica para Chrome
gsap.config({
  force3D: false, // Desactivar force3D que causa problemas en Chrome
  nullTargetWarn: false,
  trialWarn: false,
  autoSleep: 60
});

// ===== ANIMACIONES GLOBALES REUTILIZABLES =====

/**
 * Colección de animaciones predefinidas reutilizables
 */
window.GSAPAnimations = {
  
  /**
   * Animación de fade in con slide up
   * @param {string|Element} target - Selector o elemento
   * @param {object} options - Opciones adicionales
   */
  fadeInUp: (target, options = {}) => {
    const defaults = {
      y: 30,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out"
    };
    
    return gsap.fromTo(target, 
      { y: defaults.y, opacity: 0 },
      { ...defaults, ...options, y: 0, opacity: 1 }
    );
  },

  /**
   * Animación de fade in con scale
   * @param {string|Element} target - Selector o elemento
   * @param {object} options - Opciones adicionales
   */
  fadeInScale: (target, options = {}) => {
    const defaults = {
      scale: 0.8,
      opacity: 0,
      duration: 0.5,
      ease: "back.out(1.7)"
    };
    
    return gsap.fromTo(target,
      { scale: defaults.scale, opacity: 0 },
      { ...defaults, ...options, scale: 1, opacity: 1 }
    );
  },

  /**
   * Animación de shimmer effect
   * @param {string|Element} target - Selector o elemento
   * @param {object} options - Opciones adicionales
   */
  shimmer: (target, options = {}) => {
    const defaults = {
      x: '-100%',
      duration: 0.8,
      ease: "power2.inOut"
    };
    
    return gsap.fromTo(target,
      { x: '-100%' },
      { ...defaults, ...options, x: '100%' }
    );
  },

  /**
   * Animación de pulse/heartbeat
   * @param {string|Element} target - Selector o elemento
   * @param {object} options - Opciones adicionales
   */
  pulse: (target, options = {}) => {
    const defaults = {
      scale: 1.05,
      duration: 0.8,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true
    };
    
    return gsap.to(target, { ...defaults, ...options });
  },

  /**
   * Animación de entrada de modal
   * @param {string|Element} target - Selector o elemento del modal
   * @param {object} options - Opciones adicionales
   */
  modalEnter: (target, options = {}) => {
    const defaults = {
      scale: 0.8,
      opacity: 0,
      duration: 0.4,
      ease: "power2.out"
    };
    
    return gsap.fromTo(target,
      { scale: defaults.scale, opacity: 0 },
      { ...defaults, ...options, scale: 1, opacity: 1 }
    );
  },

  /**
   * Animación de salida de modal
   * @param {string|Element} target - Selector o elemento del modal
   * @param {object} options - Opciones adicionales
   */
  modalExit: (target, options = {}) => {
    const defaults = {
      scale: 0.8,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in"
    };
    
    return gsap.to(target, { ...defaults, ...options });
  },

  /**
   * Animación de hover para tarjetas
   * @param {string|Element} target - Selector o elemento
   * @param {object} options - Opciones adicionales
   */
  cardHover: (target, options = {}) => {
    const defaults = {
      y: -8,
      scale: 1.02,
      duration: 0.3,
      ease: "power2.out"
    };
    
    return gsap.to(target, { ...defaults, ...options });
  },

  /**
   * Resetear animación de hover para tarjetas
   * @param {string|Element} target - Selector o elemento
   * @param {object} options - Opciones adicionales
   */
  cardHoverReset: (target, options = {}) => {
    const defaults = {
      y: 0,
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    };
    
    return gsap.to(target, { ...defaults, ...options });
  },

  /**
   * Animación de loading spinner
   * @param {string|Element} target - Selector o elemento
   * @param {object} options - Opciones adicionales
   */
  spinner: (target, options = {}) => {
    const defaults = {
      rotation: 360,
      duration: 1,
      ease: "none",
      repeat: -1
    };
    
    return gsap.to(target, { ...defaults, ...options });
  },

  /**
   * Animación staggered para listas
   * @param {string|Element} targets - Selector o elementos (múltiples)
   * @param {object} options - Opciones adicionales
   */
  staggerIn: (targets, options = {}) => {
    const defaults = {
      y: 30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.out"
    };
    
    return gsap.fromTo(targets,
      { y: defaults.y, opacity: 0 },
      { ...defaults, ...options, y: 0, opacity: 1 }
    );
  }
};

// ===== UTILIDADES GSAP =====

/**
 * Utilidades para trabajar con GSAP
 */
window.GSAPUtils = {
  
  /**
   * Verificar si un elemento está en el viewport
   * @param {Element} element - Elemento a verificar
   * @returns {boolean}
   */
  isInViewport: (element) => {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  /**
   * Crear timeline con configuración predeterminada
   * @param {object} options - Opciones del timeline
   * @returns {gsap.timeline}
   */
  createTimeline: (options = {}) => {
    const defaults = {
      ease: "power2.out",
      paused: false
    };
    
    return gsap.timeline({ ...defaults, ...options });
  },

  /**
   * Matar todas las animaciones de un elemento
   * @param {string|Element} target - Selector o elemento
   */
  killAnimations: (target) => {
    gsap.killTweensOf(target);
  },

  /**
   * Configurar animaciones con scroll trigger
   * @param {string|Element} trigger - Elemento trigger
   * @param {function} animation - Función que devuelve la animación
   * @param {object} options - Opciones de ScrollTrigger
   */
  scrollAnimation: (trigger, animation, options = {}) => {
    if (typeof ScrollTrigger === 'undefined') {
      console.warn('ScrollTrigger no está disponible');
      return;
    }

    const defaults = {
      trigger: trigger,
      start: "top 80%",
      end: "bottom 20%",
      toggleActions: "play none none reverse"
    };

    return ScrollTrigger.create({
      ...defaults,
      ...options,
      animation: animation()
    });
  },

  /**
   * Detectar preferencias de movimiento reducido
   * @returns {boolean}
   */
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /**
   * Aplicar animación solo si no hay preferencia de movimiento reducido
   * @param {function} animationFn - Función de animación
   * @param {function} fallbackFn - Función alternativa (opcional)
   */
  respectMotionPreference: (animationFn, fallbackFn = null) => {
    if (window.GSAPUtils.prefersReducedMotion()) {
      if (fallbackFn) fallbackFn();
      return;
    }
    animationFn();
  }
};

// ===== CONFIGURACIONES ESPECÍFICAS POR DISPOSITIVO =====

/**
 * Configuraciones adaptativas según el dispositivo
 */
window.GSAPDevice = {
  
  isMobile: () => window.innerWidth <= 768,
  isTablet: () => window.innerWidth <= 1024 && window.innerWidth > 768,
  isDesktop: () => window.innerWidth > 1024,
  
  /**
   * Obtener configuración adaptativa
   * @param {object} mobile - Configuración para móvil
   * @param {object} tablet - Configuración para tablet
   * @param {object} desktop - Configuración para desktop
   * @returns {object}
   */
  getAdaptiveConfig: (mobile = {}, tablet = {}, desktop = {}) => {
    if (window.GSAPDevice.isMobile()) return mobile;
    if (window.GSAPDevice.isTablet()) return tablet;
    return desktop;
  }
};

// ===== INICIALIZACIÓN =====

document.addEventListener('DOMContentLoaded', () => {
  console.log('🎬 GSAP configuración global lista');
  
  // Configurar refresh de ScrollTrigger en resize
  const debounceResize = (() => {
    let timeout;
    return (func, wait) => {
      clearTimeout(timeout);
      timeout = setTimeout(func, wait);
    };
  })();
  
  window.addEventListener('resize', () => {
    debounceResize(() => {
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
    }, 250);
  });
  
  // Aplicar clase para CSS que depende de GSAP
  document.documentElement.classList.add('gsap-ready');
});

// Exportar para módulos ES6 si es necesario
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GSAPAnimations, GSAPUtils, GSAPDevice };
}
