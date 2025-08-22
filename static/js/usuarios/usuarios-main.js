// ===== JS EXTRAÍDO EXACTO DEL TEMPLATE HTML =====
// Este archivo contiene SOLO el JavaScript que estaba en el template,
// sin tocar el sistema de modales existente (usuarios-modals.js)

// Load usuarios data from Python backend
try {
    const usuariosDataElement = document.getElementById('usuariosData');
    const usuariosDataText = usuariosDataElement.textContent;
    window.USUARIOS_DATA = usuariosDataText && usuariosDataText !== 'null' ? JSON.parse(usuariosDataText) : null;
    ////console.log('👥 Usuarios data loaded:', window.USUARIOS_DATA);
  } catch (error) {
    ////console.warn('⚠️ Error loading usuarios data:', error);
    window.USUARIOS_DATA = null;
  }
  
  // Performance optimizer específico para usuarios
  function applyCardOptimizations(card) {
    // Usar las animaciones GSAP globales ya disponibles
    if (window.HardwareAnimations) {
      //console.log('🔧 Optimizaciones GSAP aplicadas a tarjeta individual');
      return;
    }
    
    // Fallback para compatibilidad si GSAP no está disponible
    const shimmer = card.querySelector('.ios-card-shimmer');
    if (shimmer && !window.GSAPUtils?.prefersReducedMotion()) {
      shimmer.style.opacity = '0';
      shimmer.style.transform = 'rotate(45deg) translateX(-100%)';
      //console.log('🔧 Fallback aplicado a tarjeta individual');
    }
  }
  
  // Función para aplicar optimizaciones a tarjetas ya existentes
  function applyOptimizationsToExistingCards() {
    const existingCards = document.querySelectorAll('.ios-hardware-card');
    existingCards.forEach(card => {
      applyCardOptimizations(card);
    });
    //console.log(`🔧 Optimizaciones aplicadas a ${existingCards.length} tarjetas existentes`);
  }
  
  // Global functions for backward compatibility
  function openCreateUsuarioModal() {
    // Si es usuario tipo empresa, ya tiene empresa seleccionada automáticamente
    if (window.userRole === 'empresa' || (window.usuariosMain && window.usuariosMain.currentEmpresa)) {
      if (window.usuariosModals) {
        window.usuariosModals.openCreateModal();
      } else {
        alert('Sistema de modales no disponible');
      }
    } else {
      alert('Selecciona una empresa primero');
    }
  }
  
  function exportUsuarios() {
    // Si es usuario tipo empresa, ya tiene empresa seleccionada automáticamente
    if (window.userRole === 'empresa' || (window.usuariosMain && window.usuariosMain.currentEmpresa)) {
      alert('Funcionalidad de exportación en desarrollo');
    } else {
      alert('Selecciona una empresa primero');
    }
  }
  
  // Aplicar optimizaciones a tarjetas existentes cuando sea necesario
  applyOptimizationsToExistingCards();
  
  // Configurar modalManager para modales de usuarios
  if (window.modalManager) {
    const userModals = ['viewUserModal', 'editUserModal', 'toggleUserModal', 'createUserModal', 'userUpdateModal'];
    userModals.forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (modal) {
        window.modalManager.setupModal(modalId);
        //console.log('🔧 Modal configurado con modalManager:', modalId);
      }
    });
    //console.log('✅ Todos los modales de usuarios configurados con modalManager');
  } else {
    //console.warn('⚠️ modalManager no disponible');
  }
  
  //console.log('📻 Usuarios main module loaded');
  
  // Definir variables globales para el rol y empresa
  window.userRole = '{{ user_role or "" }}';
  window.empresaId = '{{ empresa_id or "" }}';
  window.empresaNombre = '{{ empresa_username or "" }}';
  
  // console.log('🔧 Variables globales definidas:', {
  //   userRole: window.userRole,
  //   empresaId: window.empresaId,
  //   empresaNombre: window.empresaNombre
  // });
  
  // Funciones para el selector de país personalizado
  function toggleCountryDropdown(selector) {
    const dropdown = selector.querySelector('.phone-country-dropdown');
    const isVisible = dropdown.classList.contains('show');
    
    // Cerrar todos los dropdowns abiertos
    document.querySelectorAll('.phone-country-dropdown.show').forEach(d => {
      d.classList.remove('show');
    });
    
    // Mostrar/ocultar el dropdown actual
    if (!isVisible) {
      dropdown.classList.add('show');
    }
  }
  
  function selectCountry(option, event) {
    // Prevenir que el evento se propague
    if (event) {
      event.stopPropagation();
    }
    
    const country = option.dataset.country;
    const code = option.dataset.code;
    const text = option.textContent.trim();
    
    // Actualizar el selector
    const selector = option.closest('.phone-country-selector');
    const flagSpan = selector.querySelector('.country-flag');
    const codeSpan = selector.querySelector('.country-code');
    
    // Extraer la bandera y el código del texto
    const parts = text.split(' ');
    const flag = parts[0]; // La bandera es el primer elemento
    flagSpan.textContent = flag;
    codeSpan.textContent = code;
    
    // Marcar como seleccionado
    selector.querySelectorAll('.phone-country-option').forEach(opt => {
      opt.classList.remove('selected');
    });
    option.classList.add('selected');
    
    // Cerrar el dropdown
    const dropdown = selector.querySelector('.phone-country-dropdown');
    dropdown.classList.remove('show');
    
    //console.log('País seleccionado:', { country, code, flag, text });
  }
  
  // Cerrar dropdowns al hacer click fuera
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.phone-country-selector')) {
      document.querySelectorAll('.phone-country-dropdown.show').forEach(dropdown => {
        dropdown.classList.remove('show');
      });
    }
  });