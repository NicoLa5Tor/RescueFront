(() => {
  const menuToggle = document.querySelector('.navbar__menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!menuToggle || !sidebar || !overlay) return;

  menuToggle.setAttribute('aria-expanded', 'false');

  const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;

  const openSidebar = () => {
    if (isDesktop()) return;
    sidebar.classList.add('sidebar--open');
    sidebar.classList.remove('sidebar--closed');
    overlay.classList.add('sidebar__overlay--visible');
    menuToggle.setAttribute('aria-expanded', 'true');
  };

  const closeSidebar = () => {
    if (isDesktop()) return;
    sidebar.classList.remove('sidebar--open');
    sidebar.classList.add('sidebar--closed');
    overlay.classList.remove('sidebar__overlay--visible');
    menuToggle.setAttribute('aria-expanded', 'false');
  };

  const toggleSidebar = () => {
    if (sidebar.classList.contains('sidebar--open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  };

  menuToggle.addEventListener('click', toggleSidebar);
  overlay.addEventListener('click', closeSidebar);
  window.addEventListener('resize', () => {
    if (isDesktop()) {
      overlay.classList.remove('sidebar__overlay--visible');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-spa-view]');
    if (!link) return;
    event.preventDefault();
    const view = link.getAttribute('data-spa-view');
    if (window.empresaSpa?.setView) {
      window.empresaSpa.setView(view);
    }
    closeSidebar();
  });
})();
