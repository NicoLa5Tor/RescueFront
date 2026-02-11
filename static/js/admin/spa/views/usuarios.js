(() => {
  const viewName = 'usuarios';
  let observer = null;

  const applyCardOptimizations = (card) => {
    if (window.HardwareAnimations && window.HardwareAnimations.animateNewCard) {
      window.HardwareAnimations.animateNewCard(card);
      return;
    }

    const shimmer = card.querySelector('.ios-card-shimmer');
    if (shimmer && !window.GSAPUtils?.prefersReducedMotion?.()) {
      shimmer.style.opacity = '0';
      shimmer.style.transform = 'rotate(45deg) translateX(-100%)';
    }
  };

  const ensureContentVisibility = () => {
    const selectors = [
      '.ios-header-container',
      '.ios-stats-grid .ios-stat-card',
      '.ios-hardware-grid .ios-hardware-card',
      '.usuario-item'
    ];

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.visibility = 'visible';
      });
    });
  };

  const moveUsuariosModalsToBody = () => {
    const modalIds = [
      'viewUserModal',
      'editUserModal',
      'toggleUserModal',
      'userDeleteModal',
      'createUserModal',
      'userUpdateModal'
    ];

    modalIds.forEach((modalId) => {
      const modal = document.getElementById(modalId);
      if (modal && modal.parentElement !== document.body) {
        document.body.appendChild(modal);
      }
    });
  };

  const mount = () => {
    moveUsuariosModalsToBody();

    if (window.initUsuariosMain) {
      window.initUsuariosMain();
    }

    if (window.initUsuariosModals) {
      window.initUsuariosModals();
    }

    ensureContentVisibility();

    const usuariosGrid = document.getElementById('usuariosGrid');
    if (!usuariosGrid) return;

    if (!observer) {
      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.classList.contains('ios-hardware-card')) {
              applyCardOptimizations(node);
            }
          });
        });
      });
    } else {
      observer.disconnect();
    }

    observer.observe(usuariosGrid, { childList: true, subtree: true });
  };

  const unmount = () => {
    if (observer) {
      observer.disconnect();
    }
  };

  window.AdminSpaViews = window.AdminSpaViews || {};
  window.AdminSpaViews[viewName] = { mount, unmount };
})();
