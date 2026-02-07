(() => {
  const container = document.querySelector('[data-admin-spa]');
  if (!container) return;

  const sections = Array.from(container.querySelectorAll('[data-spa-section]'));
  const links = Array.from(document.querySelectorAll('[data-spa-view]'));

  const setView = (view) => {
    sections.forEach((section) => {
      const name = section.getAttribute('data-spa-section');
      section.classList.toggle('is-hidden', name !== view);
    });

    links.forEach((link) => {
      const targetView = link.getAttribute('data-spa-view');
      if (link.classList.contains('sidebar__link')) {
        link.classList.toggle('sidebar__link--active', targetView === view);
      }
    });

    document.dispatchEvent(new CustomEvent('admin:spa:view-change', {
      detail: { view }
    }));
  };

  const defaultView = container.getAttribute('data-spa-default') || sections[0]?.getAttribute('data-spa-section');
  if (defaultView) {
    setView(defaultView);
  }

  window.adminSpa = { setView };
})();
