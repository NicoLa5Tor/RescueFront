(() => {
  const container = document.querySelector('[data-empresa-spa]');
  if (!container) {
    return;
  }

  const sections = Array.from(container.querySelectorAll('[data-spa-section]'));

  const setActiveView = (view) => {
    if (!view) return;
    let resolved = view;

    sections.forEach(section => {
      const name = section.getAttribute('data-spa-section');
      const isActive = name === view;
      section.classList.toggle('is-hidden', !isActive);
      if (isActive) {
        resolved = name;
      }
    });

    container.dataset.activeView = resolved;

    document.querySelectorAll('[data-spa-view]').forEach(target => {
      const targetView = target.getAttribute('data-spa-view');
      const isActive = targetView === resolved;

      if (target.classList.contains('sidebar__link')) {
        target.classList.toggle('sidebar__link--active', isActive);
      }
    });
  };

  const defaultView = container.getAttribute('data-spa-default') || sections[0]?.getAttribute('data-spa-section');
  if (defaultView) {
    setActiveView(defaultView);
  }

  window.empresaSpa = {
    setView: setActiveView,
    getContainer: () => container,
    getActiveView: () => container.dataset.activeView || defaultView
  };
})();
