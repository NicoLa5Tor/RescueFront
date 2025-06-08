// rescue.js - JavaScript encapsulado
(function() {
  'use strict';
  
  // Namespace para evitar conflictos
  const RescueModule = {
    smoother: null,
    
    init: function() {
      // Verificar que GSAP esté cargado
      if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || typeof ScrollSmoother === 'undefined') {
        console.error('RESCUE Module: GSAP, ScrollTrigger o ScrollSmoother no están cargados');
        return;
      }
      
      // Registrar plugins
      gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
      
      this.smoother = ScrollSmoother.create({
        wrapper: '#rescue-smooth-wrapper',
        content: '#rescue-smooth-content',
        smooth: 2,
        effects: true,
        smoothTouch: 0.1
      });
      
      // Animación del SVG
      gsap.from('.rescue-7x9k-draw', {
        drawSVG: "0%",
        ease: "expo.out",
        scrollTrigger: {
          trigger: '.rescue-7x9k-heading',
          start: "clamp(top center)",
          scrub: true,
          pin: '.rescue-7x9k-pin',
          pinSpacing: false,
          markers: false,
          id: 'rescue-svg-trigger'
        }
      });
      
      // Parallax effect para las imágenes
      gsap.utils.toArray('.rescue-7x9k-img').forEach((img, i) => {
        const speed = img.getAttribute('data-speed');
        gsap.to(img, {
          yPercent: -30 * (i + 1),
          ease: "none",
          scrollTrigger: {
            trigger: '.rescue-7x9k-images',
            start: "top bottom",
            end: "bottom top",
            scrub: speed,
            id: `rescue-img-${i}`
          }
        });
      });
      
      // Fade in inicial
      gsap.fromTo('.rescue-7x9k-module',
        { opacity: 0 },
        { opacity: 1, duration: 1, ease: "power2.out" }
      );
    },
    
    destroy: function() {
      // Limpiar ScrollTriggers específicos del módulo
      ScrollTrigger.getAll().forEach(st => {
        if (st.vars.id && st.vars.id.startsWith('rescue-')) {
          st.kill();
        }
      });
      
      // Destruir smoother
      if (this.smoother) {
        this.smoother.kill();
        this.smoother = null;
      }
    },
    
    refresh: function() {
      if (this.smoother) {
        this.smoother.refresh();
      }
      ScrollTrigger.refresh();
    }
  };
  
  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => RescueModule.init());
  } else {
    RescueModule.init();
  }
  
  // Exponer API pública si es necesario
  window.RescueModule = {
    refresh: () => RescueModule.refresh(),
    destroy: () => RescueModule.destroy()
   
  };
  window.smoother.kill();
  window.smoother = null;
})();