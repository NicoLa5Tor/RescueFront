(() => {
  const container = document.querySelector('[data-admin-spa]');
  if (!container) return;

  const sections = Array.from(container.querySelectorAll('[data-spa-section]'));
  const links = Array.from(document.querySelectorAll('[data-spa-view]'));
  const store = window.AdminSpaStore || null;
  let activeView = null;

  const getSection = (view) =>
    sections.find((section) => section.getAttribute('data-spa-section') === view);

  const callHook = (view, hook) => {
    const viewRegistry = window.AdminSpaViews || {};
    const viewModule = viewRegistry[view];
    if (!viewModule) return;
    const handler = viewModule[hook];
    if (typeof handler === 'function') {
      handler({ view, container, store });
    }
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
    updateLinks(activeView);

    if (store && typeof store.setState === 'function') {
      store.setState({ activeView });
    }

    callHook(activeView, 'mount');

    document.dispatchEvent(new CustomEvent('admin:spa:view-change', {
      detail: { view: activeView }
    }));
  };

  const defaultView = container.getAttribute('data-spa-default')
    || sections[0]?.getAttribute('data-spa-section');
  if (defaultView) {
    setView(defaultView);
  }

  window.adminSpa = {
    setView,
    getActiveView: () => activeView
  };

  if (window.initAdminHardwareNotifications) {
    window.initAdminHardwareNotifications().start();
  }
})();
