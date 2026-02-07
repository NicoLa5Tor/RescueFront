(() => {
  const empresasGrid = document.getElementById('empresasGrid');
  if (!empresasGrid) return;

  const ensureContentVisibility = () => {
    const selectors = [
      '.ios-header-container',
      '.ios-stats-grid .ios-stat-card',
      '.ios-hardware-grid .ios-hardware-card',
      '.ios-empresas-grid .ios-empresa-card'
    ];

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.visibility = 'visible';
      });
    });
  };

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

  ensureContentVisibility();

  if (window.HardwareAnimations?.init) {
    window.HardwareAnimations.init();
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1 && (node.classList.contains('ios-hardware-card') || node.classList.contains('ios-empresa-card'))) {
          applyCardOptimizations(node);
        }
      });
    });
  });

  observer.observe(empresasGrid, { childList: true, subtree: true });
})();
