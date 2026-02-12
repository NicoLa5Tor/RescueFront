(() => {
  const viewName = 'multimedia';
  let observer = null;
  let animationsInitialized = false;

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
      '.ios-folder-grid .ios-hardware-card'
    ];

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.visibility = 'visible';
      });
    });
  };

  const moveMultimediaModalsToBody = () => {
    const modalIds = [
      'viewFolderModal',
      'uploadFolderModal',
      'createFolderModal',
      'deleteFolderModal',
      'multimediaUpdateModal'
    ];

    modalIds.forEach((modalId) => {
      const modal = document.getElementById(modalId);
      if (modal && modal.parentElement !== document.body) {
        document.body.appendChild(modal);
      }
    });
  };

  const mount = () => {
    moveMultimediaModalsToBody();

    if (window.initAdminMultimediaMain) {
      window.initAdminMultimediaMain();
    }

    ensureContentVisibility();

    if (!animationsInitialized && window.HardwareAnimations?.init) {
      window.HardwareAnimations.init();
      animationsInitialized = true;
    }

    const grid = document.getElementById('multimediaFolderGrid');
    if (!grid) return;

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

    observer.observe(grid, { childList: true, subtree: true });
  };

  const unmount = () => {
    if (observer) {
      observer.disconnect();
    }
  };

  window.AdminSpaViews = window.AdminSpaViews || {};
  window.AdminSpaViews[viewName] = { mount, unmount };
})();
