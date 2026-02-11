(() => {
  const viewName = 'usuarios';
  let initialized = false;

  const applyCardOptimizations = (card) => {
    if (window.HardwareAnimations) {
      return;
    }

    const shimmer = card.querySelector('.ios-card-shimmer');
    if (shimmer && !window.GSAPUtils?.prefersReducedMotion?.()) {
      shimmer.style.opacity = '0';
      shimmer.style.transform = 'rotate(45deg) translateX(-100%)';
    }
  };

  const applyOptimizationsToExistingCards = () => {
    const existingCards = document.querySelectorAll('.ios-hardware-card');
    existingCards.forEach(card => {
      applyCardOptimizations(card);
    });
  };

  window.openCreateUsuarioModal = () => {
    if (window.userRole === 'empresa' || (window.usuariosMain && window.usuariosMain.currentEmpresa)) {
      if (window.usuariosModals) {
        window.usuariosModals.openCreateModal();
      } else {
        alert('Sistema de modales no disponible');
      }
    } else {
      alert('Selecciona una empresa primero');
    }
  };

  window.exportUsuarios = () => {
    if (window.userRole === 'empresa' || (window.usuariosMain && window.usuariosMain.currentEmpresa)) {
      alert('Funcionalidad de exportación en desarrollo');
    } else {
      alert('Selecciona una empresa primero');
    }
  };

  const configureUsuariosModals = () => {
    if (!window.modalManager) {
      return;
    }

    const userModals = ['viewUserModal', 'editUserModal', 'toggleUserModal', 'createUserModal', 'userUpdateModal'];
    userModals.forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (modal) {
        window.modalManager.setupModal(modalId);
      }
    });
  };

  const init = () => {
    if (initialized) return;
    initialized = true;
    applyOptimizationsToExistingCards();
    configureUsuariosModals();
  };

  const mount = () => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init, { once: true });
      return;
    }
    init();
  };

  const unmount = () => {};

  window.EmpresaSpaViews = window.EmpresaSpaViews || {};
  const existing = window.EmpresaSpaViews[viewName];
  if (Array.isArray(existing)) {
    existing.push({ mount, unmount });
  } else if (existing) {
    window.EmpresaSpaViews[viewName] = [existing, { mount, unmount }];
  } else {
    window.EmpresaSpaViews[viewName] = [{ mount, unmount }];
  }

  if (!window.EMPRESA_SPA_MANUAL_INIT) {
    mount();
  }
})();
