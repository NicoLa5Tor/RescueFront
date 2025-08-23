
// Verificar que GSAP esté disponible
if (typeof gsap === 'undefined') {
  //console.error('❌ GSAP no está disponible. Asegúrate de que se cargue antes que este archivo.');
} else {
  //console.log('✅ GSAP disponible - Inicializando animaciones de super dashboard...');
}

// Namespace para las animaciones de super dashboard
window.SuperDashboardAnimations = {
  
  // Inicializar todas las animaciones al cargar la página
  init: function() {
    //console.log('🎬 Inicializando animaciones de super dashboard...');
    
    this.animateStatsCards();
    this.animateDashboardCards();
    this.animateHeader();
    this.animateFilters();
    this.setupScrollAnimations();
    
    //console.log('✅ Animaciones de super dashboard inicializadas');
  },

  // Animar tarjetas de estadísticas
  animateStatsCards: function() {
    const statCards = document.querySelectorAll('.ios-stat-card:not(.gsap-animated)');
    
    if (statCards.length === 0) return;
    
    gsap.fromTo(statCards, 
      {
        opacity: 0,
        y: 20,
        scale: 0.9
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "back.out(1.7)",
        stagger: 0.1,
        onComplete: function() {
          // Marcar como animadas
          statCards.forEach(card => {
            card.classList.add('gsap-animated');
          });
        }
      }
    );
    
    //console.log(`📊 Animando ${statCards.length} tarjetas de estadísticas`);
  },

  // Animar tarjetas de dashboard (empresas recientes, usuarios, etc.)
  animateDashboardCards: function() {
    const dashboardCards = document.querySelectorAll('.ios-dashboard-card:not(.gsap-animated), .glass-card:not(.gsap-animated)');
    
    if (dashboardCards.length === 0) return;
    
    gsap.fromTo(dashboardCards, 
      {
        opacity: 0,
        y: 30,
        scale: 0.95
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.15,
        onComplete: function() {
          // Marcar como animadas
          dashboardCards.forEach(card => {
            card.classList.add('gsap-animated');
          });
        }
      }
    );
    
    //console.log(`🔧 Animando ${dashboardCards.length} tarjetas de dashboard`);
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
    
    //console.log('📱 Animando header iOS');
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
    
    //console.log(`🔍 Animando ${filters.length} filtros`);
  },

  // Configurar animaciones al hacer scroll
  setupScrollAnimations: function() {
    if (typeof ScrollTrigger === 'undefined') {
      //console.warn('⚠️ ScrollTrigger no disponible, saltando animaciones de scroll');
      return;
    }
    
    // Animar elementos al entrar en vista
    gsap.utils.toArray('.ios-dashboard-card, .ios-stat-card, .glass-card').forEach(card => {
      // Omitir scroll reveal en tarjetas de empresas y usuarios recientes
      if (card.querySelector('#recentEmpresasContainer') || card.querySelector('#recentUsersContainer')) {
        return;
      }

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
    
    //console.log('📜 Configuradas animaciones de scroll');
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
    
    //console.log('🆕 Animando nueva tarjeta');
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
    
    //console.log(`🔲 Animando modal - ${show ? 'mostrar' : 'ocultar'}`);
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
    
    //console.log(`🔢 Animando contador de ${startValue} a ${finalValue}`);
  },

  // Animar gráficos cuando se cargan datos
  animateChartUpdate: function(chartElement) {
    if (!chartElement) return;
    
    gsap.fromTo(chartElement, 
      {
        opacity: 0,
        scale: 0.9
      },
      {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        ease: "power2.out"
      }
    );
    
    //console.log('📈 Animando actualización de gráfico');
  },

  // Animar empresa/usuario cards en las listas recientes
  animateRecentItems: function(itemsContainer) {
    if (!itemsContainer) return;
    
    const items = itemsContainer.querySelectorAll('.bg-gray-50, .bg-white');
    
    gsap.fromTo(items, 
      {
        opacity: 0,
        x: -20
      },
      {
        opacity: 1,
        x: 0,
        duration: 0.4,
        ease: "power2.out",
        stagger: 0.1
      }
    );
    
    //console.log(`👥 Animando ${items.length} items recientes`);
  }
};

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  // Pequeño delay para asegurar que todo esté cargado
  setTimeout(function() {
    if (window.SuperDashboardAnimations) {
      window.SuperDashboardAnimations.init();
    }
  }, 100);
});

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.SuperDashboardAnimations;
}
