// dashboard-core.js - Core Dashboard Management FIXED
class DashboardCore {
  constructor() {
    this.initialized = false;
    this.currentUser = null;
    this.selectedEmpresa = null;
    
    // Breakpoints
    this.breakpoints = {
      mobile: 768,
      tablet: 1024,
      desktop: 1280
    };

    // Managers
    this.sidebar = null;
    this.theme = null;
    this.charts = null;
    this.stats = null;
    this.notifications = null;

    this.init();
  }

  // ===== INITIALIZATION =====
  async init() {
    try {
      console.log('🚀 Initializing Dashboard Core...');
      
      // Setup event listeners first
      this.setupEventListeners();
      
      // Wait for authentication
      await this.waitForAuth();
      
      // Initialize managers
      await this.initializeManagers();
      
      // Setup responsive handlers
      this.setupResponsiveHandlers();
      
      // Initialize UI components
      this.initializeUI();
      
      this.initialized = true;
      console.log('✅ Dashboard Core initialized successfully');
      
      // Emit ready event and load initial data
      this.emit('dashboard:ready');
      this.loadDashboardData();
      
    } catch (error) {
      console.error('❌ Dashboard initialization error:', error);
      this.handleInitError(error);
    }
  }

  async waitForAuth() {
    return new Promise((resolve) => {
      const checkAuth = () => {
        if (window.apiClient && window.authManager) {
          this.currentUser = window.apiClient.getCurrentUser();
          resolve();
        } else {
          setTimeout(checkAuth, 100);
        }
      };
      checkAuth();
    });
  }

  async initializeManagers() {
    // Import and initialize managers dynamically
    const managers = [
      { name: 'sidebar', module: './components/sidebar-manager.js', class: 'SidebarManager' },
      { name: 'theme', module: './components/theme-manager.js', class: 'ThemeManager' },
      { name: 'charts', module: './components/chart-manager.js', class: 'ChartManager' },
      { name: 'stats', module: './components/stats-manager.js', class: 'StatsManager' },
      { name: 'notifications', module: './core/notifications.js', class: 'NotificationManager' }
    ];

    for (const manager of managers) {
      try {
        if (window[manager.class]) {
          this[manager.name] = new window[manager.class](this);
        } else {
          console.warn(`⚠️ ${manager.class} not available, using fallback`);
          this[manager.name] = this.createFallbackManager(manager.name);
        }
      } catch (error) {
        console.warn(`⚠️ Error initializing ${manager.name}:`, error);
        this[manager.name] = this.createFallbackManager(manager.name);
      }
    }
  }

  createFallbackManager(type) {
    const fallbacks = {
      sidebar: {
        toggle: () => this.toggleSidebar(),
        open: () => this.openSidebar(),
        close: () => this.closeSidebar(),
        isOpen: () => false,
        handleResize: () => {}
      },
      theme: {
        toggle: () => this.toggleTheme(),
        set: (theme) => this.setTheme(theme),
        get: () => this.getTheme()
      },
      charts: {
        create: () => {},
        update: () => {},
        destroy: () => {},
        handleResize: () => {},
        pauseAnimations: () => {},
        resumeAnimations: () => {},
        refresh: () => {}
      },
      stats: {
        update: () => {},
        animate: () => {}
      },
      notifications: {
        show: (message, type) => console.log(`${type}: ${message}`),
        hide: () => {},
        clear: () => {}
      }
    };

    return fallbacks[type] || {};
  }

  setupResponsiveHandlers() {
    this.updatePermissionsVisibility();
    this.setupEmpresaSelector();
    this.setupUserProfile();
  }

  handleInitError(error) {
    console.warn('🔄 Using fallback initialization due to error:', error);
    
    // Basic initialization without advanced features
    this.initializeUI();
    this.loadDemoData();
    
    // Show error notification if possible
    if (window.Swal) {
      Swal.fire({
        title: 'Modo Demostración',
        text: 'El dashboard está funcionando con datos de demostración.',
        icon: 'info',
        confirmButtonColor: '#8b5cf6',
        timer: 3000
      });
    }
  }

  // ===== EVENT MANAGEMENT =====
  setupEventListeners() {
    // Debounced resize handler
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => this.handleResize(), 250);
    });

    // Global click handlers
    document.addEventListener('click', this.handleGlobalClicks.bind(this));

    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboard.bind(this));

    // Visibility change (for pause/resume)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  handleGlobalClicks(e) {
    const target = e.target;
    const closest = (selector) => target.closest(selector);

    // Sidebar toggle
    if (closest('.navbar__menu-toggle')) {
      e.preventDefault();
      if (this.sidebar && this.sidebar.toggle) {
        this.sidebar.toggle();
      }
    }

    // User menu
    if (closest('.navbar__user')) {
      e.preventDefault();
      this.showUserMenu();
    }

    // Logout
    if (closest('.sidebar__logout-btn')) {
      e.preventDefault();
      this.logout();
    }

    // Theme toggle
    if (closest('.navbar__theme-toggle')) {
      e.preventDefault();
      if (this.theme && this.theme.toggle) {
        this.theme.toggle();
      }
    }

    // Stats card click (mobile)
    if (closest('.stats-card') && this.isMobile()) {
      const statId = closest('.stats-card').dataset.statId;
      if (statId) this.showStatsDetail(statId);
    }

    // Quick actions
    if (closest('[data-action]')) {
      e.preventDefault();
      const action = closest('[data-action]').dataset.action;
      this.handleQuickAction(action);
    }
  }

  handleKeyboard(e) {
    // Escape key - close modals/sidebar
    if (e.key === 'Escape') {
      if (this.sidebar && this.sidebar.close) {
        this.sidebar.close();
      }
    }

    // Ctrl/Cmd + K - Search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      this.focusSearch();
    }

    // Ctrl/Cmd + / - Toggle sidebar
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      if (this.sidebar && this.sidebar.toggle) {
        this.sidebar.toggle();
      }
    }
  }

  handleVisibilityChange() {
    if (document.hidden) {
      // Pause heavy operations
      if (this.charts && this.charts.pauseAnimations) {
        this.charts.pauseAnimations();
      }
    } else {
      // Resume operations
      if (this.charts && this.charts.resumeAnimations) {
        this.charts.resumeAnimations();
      }
      this.refreshData();
    }
  }

  // ===== RESPONSIVE UTILITIES =====
  isMobile() { 
    return window.innerWidth < this.breakpoints.mobile; 
  }
  
  isTablet() { 
    return window.innerWidth >= this.breakpoints.mobile && window.innerWidth < this.breakpoints.tablet; 
  }
  
  isDesktop() { 
    return window.innerWidth >= this.breakpoints.desktop; 
  }

  handleResize() {
    console.log('📱 Handling resize event');
    
    // Update charts for new screen size
    if (this.charts && this.charts.handleResize) {
      setTimeout(() => this.charts.handleResize(), 100);
    }

    // Update sidebar behavior
    if (this.sidebar && this.sidebar.handleResize) {
      this.sidebar.handleResize();
    }

    // Re-render responsive components
    if (this.initialized) {
      this.updateResponsiveComponents();
    }

    // Emit resize event
    this.emit('dashboard:resize');
  }

  updateResponsiveComponents() {
    // Update responsive classes
    const body = document.body;
    body.classList.remove('is-mobile', 'is-tablet', 'is-desktop');
    
    if (this.isMobile()) {
      body.classList.add('is-mobile');
    } else if (this.isTablet()) {
      body.classList.add('is-tablet');
    } else {
      body.classList.add('is-desktop');
    }

    // Update component visibility
    this.updatePermissionsVisibility();
  }

  // ===== UI INITIALIZATION =====
  initializeUI() {
    this.renderSidebarNavigation();
    this.setupUserProfile();
    this.setupEmpresaSelector();
    this.initAnimations();
  }

  renderSidebarNavigation() {
    const nav = document.getElementById('sidebarNav');
    if (!nav) return;

    const navItems = this.getNavigationItems();
    nav.innerHTML = navItems.map(item => this.createNavItem(item)).join('');

    // Add click handlers
    nav.addEventListener('click', (e) => {
      const link = e.target.closest('.sidebar__link');
      if (link && !link.href.includes('#')) {
        // Close sidebar on mobile after navigation
        if (this.isMobile() && this.sidebar && this.sidebar.close) {
          setTimeout(() => this.sidebar.close(), 200);
        }
      }
    });
  }

  getNavigationItems() {
    return [
      { 
        href: '/admin', 
        icon: 'fa-th-large', 
        label: 'Dashboard', 
        active: true, 
        badge: 'Nuevo' 
      },
      { 
        href: '/admin/empresas', 
        icon: 'fa-building', 
        label: 'Empresas', 
        adminOnly: true 
      },
      { 
        href: '/admin/users', 
        icon: 'fa-users', 
        label: 'Usuarios' 
      },
      { 
        href: '/admin/stats', 
        icon: 'fa-chart-line', 
        label: 'Estadísticas' 
      },
      { 
        href: '/admin/reports', 
        icon: 'fa-file-alt', 
        label: 'Reportes', 
        adminOnly: true 
      },
      { 
        href: '#', 
        icon: 'fa-cog', 
        label: 'Configuración', 
        separator: true 
      }
    ];
  }

  createNavItem(item) {
    const isCurrentPage = window.location.pathname === item.href;
    const classes = [
      'sidebar__link',
      isCurrentPage || item.active ? 'sidebar__link--active' : '',
      item.adminOnly ? 'admin-only' : ''
    ].filter(Boolean).join(' ');

    return `
      <a href="${item.href}" class="${classes}" ${item.href === '#' ? 'onclick="return false;"' : ''}>
        <div class="sidebar__link-icon">
          <i class="fas ${item.icon}"></i>
        </div>
        <span class="sidebar__link-text">${item.label}</span>
        ${item.badge ? `<span class="sidebar__link-badge">${item.badge}</span>` : ''}
      </a>
    `;
  }

  setupUserProfile() {
    if (!this.currentUser) return;

    // Update user information in UI
    const updates = {
      '.navbar__user-name': this.currentUser.nombre || this.currentUser.usuario || 'Usuario',
      '.navbar__user-role': this.currentUser.rol || 'Usuario',
      '.sidebar__profile-name': this.currentUser.nombre || this.currentUser.usuario || 'Usuario',
      '.sidebar__profile-role': this.currentUser.rol || 'Usuario'
    };

    Object.entries(updates).forEach(([selector, value]) => {
      document.querySelectorAll(selector).forEach(el => {
        el.textContent = value;
      });
    });

    // Update avatars
    const initials = (this.currentUser.nombre || this.currentUser.usuario || 'U').substring(0, 2).toUpperCase();
    document.querySelectorAll('.navbar__user-avatar, .sidebar__profile-avatar').forEach(el => {
      el.textContent = initials;
    });
  }

  async setupEmpresaSelector() {
    const selector = document.getElementById('sidebarEmpresaSelector');
    if (!selector || !window.apiClient) return;

    try {
      if (!this.currentUser?.isAdmin()) {
        selector.closest('.sidebar__company-selector')?.style.setProperty('display', 'none');
        return;
      }

      const empresas = await window.apiClient.getEmpresas();
      const selectedEmpresa = window.apiClient.getSelectedEmpresaId();

      selector.innerHTML = `
        <option value="">Todas las empresas</option>
        ${empresas.map(empresa => `
          <option value="${empresa.id}" ${empresa.id === selectedEmpresa ? 'selected' : ''}>
            ${empresa.nombre}
          </option>
        `).join('')}
      `;

      selector.addEventListener('change', (e) => this.handleEmpresaChange(e.target.value, empresas));

    } catch (error) {
      console.error('Error setting up empresa selector:', error);
      selector.closest('.sidebar__company-selector')?.style.setProperty('display', 'none');
    }
  }

  updatePermissionsVisibility() {
    if (!this.currentUser) return;

    const permissions = {
      '.admin-only': this.currentUser.isAdmin(),
      '.super-admin-only': this.currentUser.isSuperAdmin(),
      '.empresa-only': this.currentUser.isEmpresa()
    };

    Object.entries(permissions).forEach(([selector, show]) => {
      document.querySelectorAll(selector).forEach(el => {
        el.style.display = show ? '' : 'none';
      });
    });
  }

  initAnimations() {
    if (typeof gsap === 'undefined') {
      console.warn('GSAP not loaded, skipping animations');
      return;
    }

    // Register plugins
    gsap.registerPlugin(ScrollTrigger);

    // Simplified animations for mobile
    const animationConfig = this.isMobile() ? {
      duration: 0.6,
      stagger: 0.05,
      ease: "power2.out"
    } : {
      duration: 1,
      stagger: 0.1,
      ease: "power3.out"
    };

    // Fade in animations
    gsap.from(".gsap-fade-in", {
      opacity: 0,
      y: this.isMobile() ? 20 : 30,
      ...animationConfig,
      delay: 0.2
    });

    // Scale in animations
    gsap.from(".gsap-scale-in", {
      opacity: 0,
      scale: this.isMobile() ? 0.95 : 0.9,
      duration: this.isMobile() ? 0.5 : 0.8,
      stagger: animationConfig.stagger,
      ease: this.isMobile() ? "power2.out" : "back.out(1.7)",
      delay: 0.4
    });

    // Navbar animation
    gsap.from(".navbar", {
      y: -100,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    });
  }

  // ===== DATA MANAGEMENT =====
  async loadDashboardData() {
    try {
      this.showLoadingState();

      // Check for API client
      if (!window.apiClient) {
        console.log('API client not available, using demo data');
        this.loadDemoData();
        return;
      }

      // Try to load real data with timeout
      const timeout = this.isMobile() ? 5000 : 10000;
      const loadPromise = Promise.race([
        this.loadRealData(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);

      await loadPromise;

    } catch (error) {
      console.log('Failed to load real data, using demo data:', error);
      this.loadDemoData();
    } finally {
      setTimeout(() => {
        this.hideLoadingState();
        if (this.stats && this.stats.animate) {
          this.stats.animate();
        }
      }, 500);
    }
  }

  async loadRealData() {
    if (!this.currentUser) {
      throw new Error('No current user');
    }

    if (this.currentUser.isAdmin()) {
      await this.loadAdminData();
    } else if (this.currentUser.isEmpresa()) {
      await this.loadEmpresaData();
    }
  }

  async loadAdminData() {
    try {
      const [empresas, stats] = await Promise.all([
        window.apiClient.getEmpresas(),
        window.apiClient.getGlobalStats()
      ]);

      this.updateElement('totalEmpresasCount', empresas.length);
      this.updateElement('activeEmpresasCount', empresas.filter(e => e.activa).length);
      this.updateElement('totalUsersCount', stats.total_usuarios);
      this.updateElement('avgPerformanceCount', stats.getAverageUsersPerCompany());


    } catch (error) {
      console.error('Error loading admin data:', error);
      throw error;
    }
  }


  async loadEmpresaData() {
    try {
      const empresaId = this.currentUser.getEmpresaId();
      if (!empresaId) throw new Error('No empresa ID');

      const [usuarios, empresa, stats] = await Promise.all([
        window.apiClient.getUsuariosByEmpresa(empresaId),
        window.apiClient.getEmpresa(empresaId),
        window.apiClient.getEmpresaStats(empresaId)
      ]);

      this.updateElement('empresaInfoCount', empresa.nombre);
      this.updateElement('empresaMembersCount', usuarios.length);
      this.updateElement('totalUsersCount', stats.total_usuarios);
      this.updateElement('activeUsersCount', stats.usuarios_activos);

    } catch (error) {
      console.error('Error loading empresa data:', error);
      throw error;
    }
  }

  loadDemoData() {
    const stats = {
      totalEmpresasCount: 24,
      totalUsersCount: 156,
      activeEmpresasCount: 22,
      activeUsersCount: 142,
      empresaInfoCount: this.isMobile() ? 'Tech Solutions' : 'Tech Solutions S.A.',
      empresaMembersCount: 18,
      performanceCount: 6.5,
      avgPerformanceCount: 6.5
    };

    Object.entries(stats).forEach(([id, value]) => {
      this.updateElement(id, value);
    });
  }

  refreshData() {
    if (!this.initialized) return;
    
    console.log('🔄 Refreshing dashboard data...');
    this.loadDashboardData();
    if (this.charts && this.charts.refresh) {
      this.charts.refresh();
    }
  }

  // ===== USER ACTIONS =====
  handleQuickAction(action) {
    const actions = {
      'create-empresa': () => this.createEmpresa(),
      'create-user': () => this.createUser(),
      'generate-report': () => this.generateReport(),
      'system-info': () => this.showSystemInfo()
    };

    if (actions[action]) {
      actions[action]();
    } else {
      console.warn(`Unknown action: ${action}`);
    }
  }

  handleEmpresaChange(empresaId, empresas) {
    this.selectedEmpresa = empresaId;
    
    if (empresaId) {
      window.apiClient.setSelectedEmpresa(empresaId);
      const empresaName = empresas.find(e => e.id === empresaId)?.nombre;
      if (this.notifications && this.notifications.show) {
        this.notifications.show(`Empresa seleccionada: ${empresaName}`, 'success');
      }
    } else {
      window.apiClient.clearSelectedEmpresa();
      if (this.notifications && this.notifications.show) {
        this.notifications.show('Viendo todas las empresas', 'info');
      }
    }

    // Reload dashboard data
    this.loadDashboardData();
  }

  showUserMenu() {
    if (!this.currentUser) {
      if (this.notifications && this.notifications.show) {
        this.notifications.show('Información de usuario no disponible', 'warning');
      }
      return;
    }

    const modalWidth = this.isMobile() ? '95%' : '500px';

    if (window.Swal) {
      Swal.fire({
        title: 'Información del Usuario',
        html: this.getUserInfoHTML(),
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#8b5cf6',
        width: modalWidth
      });
    }
  }

  getUserInfoHTML() {
    const user = this.currentUser;
    const initials = (user.nombre || user.usuario || 'U').substring(0, 2).toUpperCase();

    return `
      <div class="text-left space-y-4">
        <div class="text-center mb-4">
          <div class="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <span class="text-white text-2xl font-bold">${initials}</span>
          </div>
          <h3 class="text-xl font-semibold">${user.nombre || user.usuario}</h3>
        </div>
        
        <div class="space-y-3">
          <p><strong>Usuario:</strong> ${user.usuario}</p>
          <p><strong>Email:</strong> ${user.email || 'No disponible'}</p>
          <p><strong>Rol:</strong> 
            <span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
              ${user.rol}
            </span>
          </p>
          <p><strong>Tipo:</strong> 
            <span class="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
              ${user.tipo}
            </span>
          </p>
          ${user.isEmpresa() && user.getEmpresaId() ? `
            <p><strong>Empresa ID:</strong> ${user.getEmpresaId()}</p>
          ` : ''}
        </div>
      </div>
    `;
  }

  logout() {
    if (!window.Swal) {
      if (window.authManager) {
        window.authManager.logout();
      } else {
        window.location.href = '/login';
      }
      return;
    }

    Swal.fire({
      title: '¿Cerrar Sesión?',
      text: '¿Estás seguro de que quieres cerrar tu sesión?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        if (window.authManager) {
          window.authManager.logout();
        } else {
          window.location.href = '/login';
        }
      }
    });
  }

  // ===== LOADING STATES =====
  showLoadingState() {
    const skeletons = document.querySelectorAll('.skeleton');
    skeletons.forEach(skeleton => {
      skeleton.style.display = 'block';
      skeleton.style.opacity = '1';
    });
  }

  hideLoadingState() {
    const skeletons = document.querySelectorAll('.skeleton');
    if (skeletons.length === 0) return;

    if (typeof gsap !== 'undefined') {
      gsap.to(skeletons, {
        opacity: 0,
        scale: 0.9,
        duration: 0.3,
        stagger: 0.05,
        ease: "power2.out",
        onComplete: () => {
          skeletons.forEach(el => el.remove());
        }
      });
    } else {
      skeletons.forEach(el => el.remove());
    }
  }

  // ===== UTILITY METHODS =====
  updateElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = value;
    } else {
      console.warn(`Element with ID '${elementId}' not found`);
    }
  }

  focusSearch() {
    const searchInput = document.querySelector('.navbar__search-input');
    if (searchInput) {
      searchInput.focus();
    }
  }

  emit(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail: {
        dashboard: this,
        timestamp: Date.now(),
        ...detail
      }
    });
    window.dispatchEvent(event);
  }

  // ===== FALLBACK METHODS =====
  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (!sidebar) return;

    const isOpen = !sidebar.classList.contains('sidebar--closed');
    
    if (isOpen) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  }

  openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (!sidebar || this.isDesktop()) return;

    sidebar.classList.remove('sidebar--closed');
    sidebar.classList.add('sidebar--open');
    
    if (overlay) {
      overlay.classList.add('sidebar__overlay--visible');
    }

    document.body.classList.add('body-no-scroll');
  }

  closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (!sidebar) return;

    sidebar.classList.remove('sidebar--open');
    sidebar.classList.add('sidebar--closed');
    
    if (overlay) {
      overlay.classList.remove('sidebar__overlay--visible');
    }

    document.body.classList.remove('body-no-scroll');
  }

  toggleTheme() {
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');

    if (isDark) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }

    // Update theme toggle icon
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
      if (isDark) {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
      } else {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
      }
    }

    if (this.notifications && this.notifications.show) {
      this.notifications.show(`Tema ${isDark ? 'claro' : 'oscuro'} activado`, 'success');
    }
  }

  getTheme() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }

  setTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }

  // ===== PLACEHOLDER METHODS =====
  createEmpresa() {
    console.log('Create empresa functionality not implemented');
  }

  createUser() {
    console.log('Create user functionality not implemented');
  }

  generateReport() {
    console.log('Generate report functionality not implemented');
  }

  showSystemInfo() {
    console.log('System info functionality not implemented');
  }

  showStatsDetail(statId) {
    console.log('Stats detail functionality not implemented for:', statId);
  }

  // ===== CLEANUP =====
  destroy() {
    // Clean up managers
    Object.values(this).forEach(manager => {
      if (manager && typeof manager.destroy === 'function') {
        manager.destroy();
      }
    });

    // Clean up event listeners
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('click', this.handleGlobalClicks);
    document.removeEventListener('keydown', this.handleKeyboard);

    // Clean up GSAP animations
    if (typeof gsap !== 'undefined') {
      gsap.killTweensOf("*");
      if (window.ScrollTrigger) {
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      }
    }

    console.log('Dashboard Core cleaned up');
  }
}

// Export for use
window.DashboardCore = DashboardCore;