// /**
//  * COMPANY TYPES ANIMATIONS - Animaciones específicas para tipos de empresa
//  * Utiliza la configuración global de GSAP para implementar animaciones
//  * específicas como tarjetas, modales, contadores, etc.
//  */

// // Verificar que GSAP esté disponible
// if (typeof gsap === 'undefined') {
//   ////console.error('❌ GSAP no está disponible. Asegúrate de que se cargue antes que este archivo.');
// } else {
//   //console.log('✅ GSAP disponible - Inicializando animaciones de tipos de empresa...');
// }

// // Namespace para las animaciones de tipos de empresa
// window.CompanyTypesAnimations = {
  
//   // Inicializar todas las animaciones al cargar la página
//   init: function() {
//     //console.log('🎬 Inicializando animaciones de tipos de empresa...');
    
//     this.animateHeader();
//     this.animateStatsCards();
//     this.animateCompanyTypeCards();
//     this.setupScrollAnimations();
//     this.initializeModalListeners();
    
//     //console.log('✅ Animaciones de tipos de empresa inicializadas');
//   },

//   // Animar header
//   animateHeader: function() {
//     const header = document.querySelector('.ios-ct-header');
//     if (!header) return;
    
//     gsap.fromTo(header, 
//       {
//         opacity: 0,
//         y: -30,
//         scale: 0.95
//       },
//       {
//         opacity: 1,
//         y: 0,
//         scale: 1,
//         duration: 0.8,
//         ease: "power2.out",
//         delay: 0.1
//       }
//     );
    
//     //console.log('📱 Animando header iOS');
//   },

//   // Animar tarjetas de estadísticas
//   animateStatsCards: function() {
//     const statCards = document.querySelectorAll('.ios-ct-stat-card:not(.gsap-animated)');
    
//     if (statCards.length === 0) return;
    
//     gsap.fromTo(statCards, 
//       {
//         opacity: 0,
//         y: 20,
//         scale: 0.9
//       },
//       {
//         opacity: 1,
//         y: 0,
//         scale: 1,
//         duration: 0.6,
//         ease: "back.out(1.7)",
//         stagger: 0.1,
//         delay: 0.3,
//         onComplete: function() {
//           // Marcar como animadas
//           statCards.forEach(card => {
//             card.classList.add('gsap-animated');
//           });
//         }
//       }
//     );
    
//     // Animar contadores
//     this.animateCounters();
    
//     //console.log(`📊 Animando ${statCards.length} tarjetas de estadísticas`);
//   },

//   // Animar contadores de estadísticas
//   animateCounters: function() {
//     const counters = [
//       { element: document.getElementById('totalTypesCount'), target: parseInt(document.getElementById('totalTypesCount')?.textContent) || 0 },
//       { element: document.getElementById('activeTypesCount'), target: parseInt(document.getElementById('activeTypesCount')?.textContent) || 0 },
//       { element: document.getElementById('totalCompaniesCount'), target: parseInt(document.getElementById('totalCompaniesCount')?.textContent) || 0 },
//       { element: document.getElementById('avgCompaniesCount'), target: parseInt(document.getElementById('avgCompaniesCount')?.textContent) || 0 }
//     ];

//     counters.forEach(counter => {
//       if (counter.element && counter.target > 0) {
//         const startValue = 0;
//         const counterObj = { value: startValue };
        
//         gsap.to(counterObj, {
//           value: counter.target,
//           duration: 1.5,
//           ease: "power2.out",
//           delay: 0.8,
//           onUpdate: function() {
//             counter.element.textContent = Math.round(counterObj.value);
//           },
//           onComplete: function() {
//             counter.element.textContent = counter.target;
//           }
//         });
//       }
//     });
//   },

//   // Animar tarjetas de tipos de empresa (SIN scroll reveal como hardware)
//   animateCompanyTypeCards: function() {
//     const typeCards = document.querySelectorAll('.ios-ct-card:not(.gsap-animated)');
    
//     if (typeCards.length === 0) return;
    
//     // SIN animación inicial - mostrar directamente como hardware
//     typeCards.forEach(card => {
//       card.style.opacity = '1';
//       card.style.transform = 'none';
//       card.classList.add('gsap-animated');
//     });
    
//     //console.log(`🔧 Tarjetas de tipos mostradas directamente (sin scroll reveal como hardware): ${typeCards.length}`);
//   },

//   // Animar nueva tarjeta (para tarjetas añadidas dinámicamente)
//   animateNewCard: function(cardElement) {
//     if (!cardElement) return;
    
//     gsap.fromTo(cardElement, 
//       {
//         opacity: 0,
//         y: 30,
//         scale: 0.9
//       },
//       {
//         opacity: 1,
//         y: 0,
//         scale: 1,
//         duration: 0.6,
//         ease: "back.out(1.7)",
//         onComplete: function() {
//           cardElement.classList.add('gsap-animated');
//         }
//       }
//     );
    
//     //console.log('🆕 Animando nueva tarjeta de tipo');
//   },

//   // Animar modal
//   animateModal: function(modalElement, show = true) {
//     if (!modalElement) return;
    
//     if (show) {
//       gsap.fromTo(modalElement, 
//         {
//           opacity: 0,
//           scale: 0.8,
//           y: 20
//         },
//         {
//           opacity: 1,
//           scale: 1,
//           y: 0,
//           duration: 0.3,
//           ease: "back.out(1.7)"
//         }
//       );
//     } else {
//       gsap.to(modalElement, {
//         opacity: 0,
//         scale: 0.8,
//         y: 20,
//         duration: 0.2,
//         ease: "power2.in"
//       });
//     }
    
//     //console.log(`🔲 Animando modal - ${show ? 'mostrar' : 'ocultar'}`);
//   },

//   // Animar tag de característica
//   animateFeatureTag: function(tagElement) {
//     if (!tagElement) return;
    
//     gsap.fromTo(tagElement, 
//       {
//         opacity: 0,
//         scale: 0.8,
//         y: 10
//       },
//       {
//         opacity: 1,
//         scale: 1,
//         y: 0,
//         duration: 0.3,
//         ease: "back.out(1.7)"
//       }
//     );
//   },

//   // Animar eliminación de tarjeta
//   animateCardDelete: function(cardElement) {
//     if (!cardElement) return;
    
//     gsap.to(cardElement, {
//       opacity: 0,
//       x: -100,
//       scale: 0.8,
//       duration: 0.5,
//       ease: "power2.in",
//       onComplete: function() {
//         cardElement.remove();
//       }
//     });
    
//     //console.log('🗑️ Animando eliminación de tarjeta');
//   },

//   // Animar cambio de estado
//   animateStatusChange: function(cardElement) {
//     if (!cardElement) return;
    
//     gsap.to(cardElement, {
//       scale: 1.05,
//       duration: 0.2,
//       ease: "power2.out",
//       yoyo: true,
//       repeat: 1
//     });
    
//     //console.log('🔄 Animando cambio de estado');
//   },

//   // Configurar animaciones al hacer scroll (DESHABILITADO como hardware)
//   setupScrollAnimations: function() {
//     //console.log('📜 Animaciones de scroll deshabilitadas (como hardware)');
//     // NO hacer scroll reveal - dejar las tarjetas visibles desde el inicio
//     return;
//   },

//   // Inicializar listeners de modales
//   initializeModalListeners: function() {
//     // Cerrar modal al hacer clic fuera
//     const modalBackdrop = document.getElementById('companyTypeModal');
//     if (modalBackdrop) {
//       modalBackdrop.addEventListener('click', (e) => {
//         if (e.target === modalBackdrop) {
//           if (typeof closeCompanyTypeModal === 'function') {
//             closeCompanyTypeModal();
//           }
//         }
//       });
//     }

//     // Cerrar modal con ESC
//     document.addEventListener('keydown', (e) => {
//       if (e.key === 'Escape') {
//         const modal = document.getElementById('companyTypeModal');
//         if (modal && modal.classList.contains('active')) {
//           if (typeof closeCompanyTypeModal === 'function') {
//             closeCompanyTypeModal();
//           }
//         }
//       }
//     });
    
//     //console.log('🎧 Listeners de modal configurados');
//   },

//   // Función para refrescar animaciones al añadir contenido dinámico
//   refreshAnimations: function() {
//     this.animateCompanyTypeCards();
//     this.animateStatsCards();
//   }
// };

// // Auto-inicializar cuando el DOM esté listo
// document.addEventListener('DOMContentLoaded', function() {
//   // Pequeño delay para asegurar que todo esté cargado
//   setTimeout(function() {
//     if (window.CompanyTypesAnimations) {
//       window.CompanyTypesAnimations.init();
//     }
//   }, 100);
// });

// // Exportar para uso global
// if (typeof module !== 'undefined' && module.exports) {
//   module.exports = window.CompanyTypesAnimations;
// }
