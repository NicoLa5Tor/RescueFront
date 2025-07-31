/**
 * HARDWARE ANIMATIONS - Animaciones específicas para el módulo hardware
 * Utiliza la configuración global de GSAP para implementar animaciones
 * específicas de hardware como tarjetas, modales, contadores, etc.
 */

// Verificar que GSAP esté disponible
if (typeof gsap === 'undefined') {
  console.error('❌ GSAP no está disponible. Asegúrate de que se cargue antes que este archivo.');
} else {
  console.log('✅ GSAP disponible - Inicializando animaciones de hardware...');
}

// Namespace para las animaciones de hardware
window.HardwareAnimations = {
  
  // Inicializar todas las animaciones al cargar la página
  init: function() {
    console.log('🎬 Inicializando animaciones de hardware...');
    
    this.animateStatsCards();
    this.animateHardwareCards();
    this.animateHeader();
    this.animateFilters();
    this.setupScrollAnimations();
    
    console.log('✅ Animaciones de hardware inicializadas');
  },

  // Animar tarjetas de estadísticas (optimizado)
  animateStatsCards: function() {
    const statCards = document.querySelectorAll('.ios-stat-card:not(.gsap-animated)');
    
    if (statCards.length === 0) return;
    
    // Verificar si el usuario prefiere animaciones reducidas
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      statCards.forEach(card => {
        card.style.opacity = '1';
        card.classList.add('gsap-animated');
      });
      return;
    }
    
    // Animar solo las primeras 4 tarjetas inmediatamente, el resto con delay
    const visibleCards = Array.from(statCards).slice(0, 4);
    const deferredCards = Array.from(statCards).slice(4);
    
    gsap.fromTo(visibleCards, 
      {
        opacity: 0,
        y: 15,
        scale: 0.95
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.4,
        ease: "power2.out",
        stagger: 0.08,
        onComplete: function() {
          visibleCards.forEach(card => card.classList.add('gsap-animated'));
        }
      }
    );
    
    // Animar las tarjetas diferidas con delay
    if (deferredCards.length > 0) {
      gsap.fromTo(deferredCards, 
        {
          opacity: 0,
          y: 15,
          scale: 0.95
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.3,
          ease: "power2.out",
          stagger: 0.06,
          delay: 0.5,
          onComplete: function() {
            deferredCards.forEach(card => card.classList.add('gsap-animated'));
          }
        }
      );
    }
    
    console.log(`📊 Animando ${statCards.length} tarjetas de estadísticas (optimizado)`);
  },

  // Animar tarjetas de hardware (optimizado)
  animateHardwareCards: function() {
    const hardwareCards = document.querySelectorAll('.ios-hardware-card:not(.gsap-animated)');
    
    if (hardwareCards.length === 0) return;
    
    // Verificar si el usuario prefiere animaciones reducidas
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      hardwareCards.forEach(card => {
        card.style.opacity = '1';
        card.classList.add('gsap-animated');
      });
      return;
    }
    
    // Dividir en lotes para evitar sobrecargar el renderizado
    const batchSize = 6;
    const batches = [];
    
    for (let i = 0; i < hardwareCards.length; i += batchSize) {
      batches.push(Array.from(hardwareCards).slice(i, i + batchSize));
    }
    
    // Animar cada lote con delay progresivo
    batches.forEach((batch, batchIndex) => {
      gsap.fromTo(batch, 
        {
          opacity: 0,
          y: 20,
          scale: 0.96
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.08,
          delay: batchIndex * 0.2,
          onComplete: function() {
            batch.forEach(card => card.classList.add('gsap-animated'));
          }
        }
      );
    });
    
    console.log(`🔧 Animando ${hardwareCards.length} tarjetas de hardware en ${batches.length} lotes`);
  },

  // Animar header
  animateHeader: function() {
    const header = document.querySelector('.ios-header');
    if (!header) return;
    
    gsap.fromTo(header, 
      {
        opacity: 0,
        y: -20
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power2.out"
      }
    );
    
    console.log('📱 Animando header iOS');
  },

  // Animar filtros
  animateFilters: function() {
    const filters = document.querySelectorAll('.ios-filter-container, .ios-search-container');
    if (filters.length === 0) return;
    
    gsap.fromTo(filters, 
      {
        opacity: 0,
        y: 10
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power1.out",
        stagger: 0.1,
        delay: 0.2
      }
    );
    
    console.log(`🔍 Animando ${filters.length} filtros`);
  },

  // Configurar animaciones al hacer scroll
  setupScrollAnimations: function() {
    if (typeof ScrollTrigger === 'undefined') {
      console.warn('⚠️ ScrollTrigger no disponible, saltando animaciones de scroll');
      return;
    }
    
    // Animar elementos al entrar en vista
    gsap.utils.toArray('.ios-hardware-card, .ios-stat-card').forEach(card => {
      gsap.fromTo(card, 
        {
          opacity: 0,
          y: 20
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            end: "bottom 15%",
            toggleActions: "play none none reverse"
          }
        }
      );
    });
    
    console.log('📜 Configuradas animaciones de scroll');
  },

  // Animar nueva tarjeta (para tarjetas añadidas dinámicamente)
  animateNewCard: function(cardElement) {
    if (!cardElement) return;
    
    gsap.fromTo(cardElement, 
      {
        opacity: 0,
        y: 30,
        scale: 0.9
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "back.out(1.7)",
        onComplete: function() {
          cardElement.classList.add('gsap-animated');
        }
      }
    );
    
    console.log('🆕 Animando nueva tarjeta');
  },

  // Animar modal
  animateModal: function(modalElement, show = true) {
    if (!modalElement) return;
    
    if (show) {
      gsap.fromTo(modalElement, 
        {
          opacity: 0,
          scale: 0.8,
          y: 20
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.3,
          ease: "back.out(1.7)"
        }
      );
    } else {
      gsap.to(modalElement, {
        opacity: 0,
        scale: 0.8,
        y: 20,
        duration: 0.2,
        ease: "power2.in"
      });
    }
    
    console.log(`🔲 Animando modal - ${show ? 'mostrar' : 'ocultar'}`);
  },

  // Animar contador con efecto de números
  animateCounter: function(element, finalValue, duration = 2) {
    if (!element) return;
    
    const startValue = 0;
    const counter = { value: startValue };
    
    gsap.to(counter, {
      value: finalValue,
      duration: duration,
      ease: "power2.out",
      onUpdate: function() {
        element.textContent = Math.round(counter.value);
      },
      onComplete: function() {
        element.textContent = finalValue;
      }
    });
    
    console.log(`🔢 Animando contador de ${startValue} a ${finalValue}`);
  }
};

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  // Pequeño delay para asegurar que todo esté cargado
  setTimeout(function() {
    if (window.HardwareAnimations) {
      window.HardwareAnimations.init();
    }
  }, 100);
});

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.HardwareAnimations;
}
