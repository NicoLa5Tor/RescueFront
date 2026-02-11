(() => {
  const viewName = 'hardware';
  let observer = null;
  let hardwareInitialized = false;

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
      '.ios-hardware-grid .ios-hardware-card'
    ];

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.visibility = 'visible';
      });
    });
  };

  const moveHardwareModalsToBody = () => {
    const modalIds = [
      'hardwareModal',
      'viewHardwareModal',
      'toggleHardwareModal',
      'locationModal',
      'clientUpdateModal'
    ];

    modalIds.forEach((modalId) => {
      const modal = document.getElementById(modalId);
      if (modal && modal.parentElement !== document.body) {
        document.body.appendChild(modal);
      }
    });
  };

  const mount = () => {
    moveHardwareModalsToBody();

    if (window.initAdminHardwareMain) {
      window.initAdminHardwareMain();
    }

    if (window.initAdminHardwareModals) {
      window.initAdminHardwareModals();
    }

    ensureContentVisibility();

    if (!hardwareInitialized && window.HardwareAnimations?.init) {
      window.HardwareAnimations.init();
      hardwareInitialized = true;
    }

    const hardwareGrid = document.getElementById('hardwareGrid');
    if (!hardwareGrid) return;

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

    observer.observe(hardwareGrid, { childList: true, subtree: true });
  };

  const unmount = () => {
    if (observer) {
      observer.disconnect();
    }
  };

  window.AdminSpaViews = window.AdminSpaViews || {};
  window.AdminSpaViews[viewName] = { mount, unmount };
})();
