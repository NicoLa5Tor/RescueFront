(() => {
  const viewName = 'dashboard';
  let instance = null;

  const mount = () => {
    if (instance) return;
    if (typeof window.AdminSpaDashboard !== 'function') return;
    instance = new window.AdminSpaDashboard();
    window.adminSpaDashboard = instance;
  };

  const unmount = () => {
    if (instance && typeof instance.destroy === 'function') {
      instance.destroy();
    }
    instance = null;
    if (window.adminSpaDashboard) {
      window.adminSpaDashboard = null;
    }
  };

  window.AdminSpaViews = window.AdminSpaViews || {};
  window.AdminSpaViews[viewName] = { mount, unmount };
})();
