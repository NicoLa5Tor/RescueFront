(() => {
  const container = document.querySelector('[data-empresa-spa]');
  if (!container) {
    return;
  }

  const orphanSections = Array.from(document.querySelectorAll('.spa-view[data-spa-section]'))
    .filter((section) => !container.contains(section));
  orphanSections.forEach((section) => {
    container.appendChild(section);
  });

  const sections = Array.from(container.querySelectorAll('[data-spa-section]'));
  const links = Array.from(document.querySelectorAll('[data-spa-view]'));
  const store = window.EmpresaSpaStore || null;
  let activeView = null;

  const getSection = (view) =>
    sections.find((section) => section.getAttribute('data-spa-section') === view);

  const callHook = (view, hook) => {
    const registry = window.EmpresaSpaViews || {};
    const viewModule = registry[view];
    if (!viewModule) return;
    const modules = Array.isArray(viewModule) ? viewModule : [viewModule];
    modules.forEach((module) => {
      const handler = module && module[hook];
      if (typeof handler === 'function') {
        handler({ view, container, store });
      }
    });
  };

  const updateLinks = (view) => {
    links.forEach((link) => {
      const targetView = link.getAttribute('data-spa-view');
      if (link.classList.contains('sidebar__link')) {
        link.classList.toggle('sidebar__link--active', targetView === view);
      }
    });
  };

  const setView = (view) => {
    const targetSection = getSection(view);
    const resolvedView = targetSection
      ? view
      : sections[0]?.getAttribute('data-spa-section');
    if (!resolvedView || resolvedView === activeView) return;

    if (activeView) {
      callHook(activeView, 'unmount');
    }

    sections.forEach((section) => {
      const name = section.getAttribute('data-spa-section');
      section.classList.toggle('is-hidden', name !== resolvedView);
    });

    activeView = resolvedView;
    container.dataset.activeView = activeView;
    updateLinks(activeView);

    if (store && typeof store.setState === 'function') {
      store.setState({ activeView });
    }

    callHook(activeView, 'mount');

    document.dispatchEvent(new CustomEvent('empresa:spa:view-change', {
      detail: { view: activeView }
    }));
  };

  const defaultView = container.getAttribute('data-spa-default')
    || sections[0]?.getAttribute('data-spa-section');
  if (defaultView) {
    setView(defaultView);
  }

  window.empresaSpa = {
    setView,
    getContainer: () => container,
    getActiveView: () => activeView || defaultView
  };
})();
