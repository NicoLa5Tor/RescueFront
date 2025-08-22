/**
 * ===== LOCATION MODAL ANIMATIONS =====
 * Animaciones profesionales para el modal de ubicación usando GSAP
 * Incluye secuencias suaves de apertura, carga del mapa y cierre
 */

window.LocationModalAnimations = {
  
  /**
   * Abrir modal con animación profesional
   * @param {HTMLElement} modal - Elemento del modal
   * @param {Function} onComplete - Callback cuando termine la animación
   */
  openModal: function(modal, onComplete) {
if (!modal) {
      ////console.warn('⚠️ Modal no encontrado');
      if (onComplete) onComplete();
      return;
    }

    const backdrop = modal.querySelector('.ios-blur-modal-backdrop') || modal;
    const container = modal.querySelector('.ios-blur-modal-container');
    const mapContainer = modal.querySelector('#locationMap');
    
    ////console.log('🎬 Iniciando animación de apertura del modal de ubicación');
    
    // Timeline principal
    const tl = gsap.timeline({
      onComplete: () => {
        modal.classList.add('modal-opening');
        if (onComplete) onComplete();
        //console.log('✅ Animación de apertura completada');
      }
    });
    
    // Configurar estados iniciales
    gsap.set(modal, { 
      display: 'flex',
      opacity: 0,
      pointerEvents: 'none'
    });
    
    gsap.set(backdrop, { 
      opacity: 0 
    });
    
    gsap.set(container, { 
      opacity: 0,
      scale: 0.8,
      y: 30
    });
    
    if (mapContainer) {
      gsap.set(mapContainer, { 
        opacity: 0,
        scale: 0.95
      });
    }
    
    // Secuencia de animación
    tl
      // Fade in del modal principal
      .to(modal, {
        opacity: 1,
        pointerEvents: 'all',
        duration: 0.1,
        ease: "power2.out"
      })
      // Fade in del backdrop
      .to(backdrop, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out"
      }, 0.1)
      // Animación del contenedor con efecto spring
      .to(container, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.5,
        ease: "back.out(1.7)"
      }, 0.2);
  },
  
  /**
   * Mostrar loading del mapa con animación
   * @param {HTMLElement} mapContainer - Contenedor del mapa
   */
  showMapLoading: function(mapContainer) {
if (!mapContainer) return;
    
    //console.log('🔄 Mostrando loading del mapa');
    
    // Crear elementos de loading si no existen
    let loadingContainer = mapContainer.querySelector('.map-loading-container');
    if (!loadingContainer) {
      loadingContainer = document.createElement('div');
      loadingContainer.className = 'map-loading-container';
      loadingContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        border-radius: 12px;
        overflow: hidden;
      `;
      
      // Spinner de loading
      const spinner = document.createElement('div');
      spinner.className = 'map-loading-spinner';
      spinner.innerHTML = `
        <div class="spinner"></div>
        <div class="loading-text">Cargando mapa...</div>
      `;
      
      // Shimmer effect
      const shimmer = document.createElement('div');
      shimmer.className = 'map-loading-shimmer';
      
      loadingContainer.appendChild(shimmer);
      loadingContainer.appendChild(spinner);
      mapContainer.appendChild(loadingContainer);
    }
    
    // Animar entrada del loading
    gsap.fromTo(loadingContainer, 
      {
        opacity: 0,
        scale: 0.9
      },
      {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      }
    );
  },
  
  /**
   * Ocultar loading y mostrar mapa con animación
   * @param {HTMLElement} mapContainer - Contenedor del mapa
   * @param {Function} onComplete - Callback cuando termine la animación
   */
  showMapLoaded: function(mapContainer, onComplete) {
if (!mapContainer) {
      if (onComplete) onComplete();
      return;
    }
    
    //console.log('🗺️ Mostrando mapa cargado');
    
    const loadingContainer = mapContainer.querySelector('.map-loading-container');
    
    const tl = gsap.timeline({
      onComplete: () => {
        if (loadingContainer) {
          loadingContainer.remove();
        }
        mapContainer.classList.add('map-loaded');
        if (onComplete) onComplete();
        //console.log('✅ Mapa cargado y animación completada');
      }
    });
    
    // Secuencia de transición
    if (loadingContainer) {
      tl.to(loadingContainer, {
        opacity: 0,
        scale: 0.9,
        duration: 0.3,
        ease: "power2.in"
      });
    }
    
    // Mostrar mapa
    tl.to(mapContainer, {
      opacity: 1,
      scale: 1,
      duration: 0.4,
      ease: "back.out(1.2)"
    }, loadingContainer ? 0.2 : 0);
  },
  
  /**
   * Cerrar modal con animación profesional
   * @param {HTMLElement} modal - Elemento del modal
   * @param {Function} onComplete - Callback cuando termine la animación
   */
  closeModal: function(modal, onComplete) {
if (!modal) {
      //console.warn('⚠️ Modal no encontrado');
      if (onComplete) onComplete();
      return;
    }
    
    const backdrop = modal.querySelector('.ios-blur-modal-backdrop') || modal;
    const container = modal.querySelector('.ios-blur-modal-container');
    
    //console.log('🎬 Iniciando animación de cierre del modal de ubicación');
    
    // Timeline de cierre
    const tl = gsap.timeline({
      onComplete: () => {
        modal.classList.remove('modal-opening');
        gsap.set(modal, { display: 'none' });
        if (onComplete) onComplete();
        //console.log('✅ Animación de cierre completada');
      }
    });
    
    // Secuencia de cierre
    tl
      // Ocultar contenedor con efecto spring inverso
      .to(container, {
        opacity: 0,
        scale: 0.8,
        y: 30,
        duration: 0.3,
        ease: "back.in(1.7)"
      })
      // Fade out del backdrop
      .to(backdrop, {
        opacity: 0,
        duration: 0.2,
        ease: "power2.in"
      }, 0.1)
      // Fade out del modal principal
      .to(modal, {
        opacity: 0,
        pointerEvents: 'none',
        duration: 0.1,
        ease: "power2.in"
      }, 0.2);
  },
  
  /**
   * Animación de error del mapa
   * @param {HTMLElement} mapContainer - Contenedor del mapa
   * @param {string} errorMessage - Mensaje de error
   */
  showMapError: function(mapContainer, errorMessage = 'Error al cargar el mapa') {
if (!mapContainer) return;
    
    //console.log('❌ Mostrando error del mapa');
    
    // Crear contenedor de error
    const errorContainer = document.createElement('div');
    errorContainer.className = 'iframe-error';
    errorContainer.innerHTML = `
      <div style="text-align: center;">
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
        <div style="font-weight: 600; margin-bottom: 0.5rem;">Error al cargar mapa</div>
        <div style="font-size: 0.875rem; opacity: 0.8;">${errorMessage}</div>
      </div>
    `;
    
    // Limpiar contenedor y agregar error
    mapContainer.innerHTML = '';
    mapContainer.appendChild(errorContainer);
    
    // Animar entrada del error
    gsap.fromTo(errorContainer, 
      {
        opacity: 0,
        scale: 0.9,
        y: 20
      },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.4,
        ease: "back.out(1.2)"
      }
    );
  },
  
  /**
   * Animación de pulso para botones de ubicación
   * @param {HTMLElement} button - Elemento del botón
   */
  pulseLocationButton: function(button) {
if (!button) return;
    
    gsap.fromTo(button, 
      {
        scale: 1,
        boxShadow: "0 6px 18px rgba(16, 185, 129, 0.4)"
      },
      {
        scale: 1.05,
        boxShadow: "0 8px 25px rgba(16, 185, 129, 0.7)",
        duration: 0.6,
        ease: "power2.inOut",
        yoyo: true,
        repeat: 1
      }
    );
  },
  
  /**
   * Animación de éxito al cargar ubicación
   * @param {HTMLElement} button - Botón que activó la acción
   */
  showLocationSuccess: function(button) {
if (!button) return;
    
    // Crear elemento de éxito temporal
    const successIcon = document.createElement('i');
    successIcon.className = 'fas fa-check';
    successIcon.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #10b981;
      font-size: 1.2rem;
      opacity: 0;
      pointer-events: none;
      z-index: 1000;
    `;
    
    button.style.position = 'relative';
    button.appendChild(successIcon);
    
    // Animación de éxito
    const tl = gsap.timeline({
      onComplete: () => {
        successIcon.remove();
      }
    });
    
    tl
      .to(successIcon, {
        opacity: 1,
        scale: 1.2,
        duration: 0.2,
        ease: "back.out(2)"
      })
      .to(successIcon, {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        ease: "power2.in"
      }, 0.8);
  }
};

// Hacer disponible globalmente
window.locationModalAnimations = window.LocationModalAnimations;

//console.log('🎬 Location Modal Animations cargado correctamente');
