(() => {
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

  document.addEventListener('DOMContentLoaded', () => {
    applyOptimizationsToExistingCards();
    configureUsuariosModals();
  });
})();
