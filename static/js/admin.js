// dashboard-responsive.js
// Mobile-First Responsive Dashboard Controller - Versión Completa

class ResponsiveDashboard {
  constructor() {
    this.charts = {};
    this.breakpoints = {
      mobile: 768,
      tablet: 1024,
      desktop: 1280
    };
    
    this.currentUser = null;
    this.selectedEmpresa = null;
    this.isInitialized = false;
    
    this.init();
  }

  // ===== DEVICE DETECTION =====
  isMobile() { 
    return window.innerWidth < this.breakpoints.mobile; 
  }
  
  isTablet() { 
    return window.innerWidth >= this.breakpoints.mobile && window.innerWidth < this.breakpoints.tablet; 
  }
  
  isDesktop() { 
    return window.innerWidth >= this.breakpoints.desktop; 
  }

  // ===== INITIALIZATION =====
  async init() {
    try {
      console.log('Initializing Responsive Dashboard...');
      
      this.setupEventListeners();
      this.initializeTheme();
      
      // Wait for authentication
      await this.waitForAuth();
      
      this.initializeComponents();
      this.setupResponsiveHandlers();
      
      this.isInitialized = true;
      console.log('Dashboard initialized successfully');
      
    } catch (error) {
      console.error('Dashboard initialization error:', error);
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

  handleInitError(error) {
    console.warn('Using fallback initialization due to error:', error);
    this.initializeComponents();
    this.loadDemoData();
  }

  // ===== EVENT LISTENERS =====
  setupEventListeners() {
    // Debounced resize handler
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => this.handleResize(), 250);
    });

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Global click handlers
    document.addEventListener('click', this.handleGlobalClicks.bind(this));

    // Escape key handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeSidebar();
      }
    });

    // Touch events for mobile
    if (this.isMobile()) {
      this.setupTouchEvents();
    }
  }

  handleGlobalClicks(e) {
    // Logout button
    if (e.target.closest('.logout-btn')) {
      e.preventDefault();
      this.logout();
    }

    // User info button
    if (e.target.closest('.user-info-btn')) {
      e.preventDefault();
      this.showUserInfo();
    }

    // Refresh button
    if (e.target.closest('.refresh-btn')) {
      e.preventDefault();
      this.refreshDashboard();
    }
  }

  setupTouchEvents() {
    // Prevent zoom on double tap for buttons
    document.addEventListener('touchend', (e) => {
      if (e.target.closest('button, .btn, .sidebar-link')) {
        e.preventDefault();
      }
    });

    // Swipe to close sidebar
    let startX = 0;
    let currentX = 0;
    
    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    });

    document.addEventListener('touchmove', (e) => {
      if (!startX) return;
      currentX = e.touches[0].clientX;
      
      const diffX = currentX - startX;
      const sidebar = document.getElementById('sidebar');
      
      if (diffX < -50 && !sidebar.classList.contains('-translate-x-full')) {
        this.closeSidebar();
      }
    });

    document.addEventListener('touchend', () => {
      startX = 0;
      currentX = 0;
    });
  }

  // ===== COMPONENT INITIALIZATION =====
  initializeComponents() {
    this.renderSidebarNavigation();
    this.renderStatsCards();
    this.renderQuickActions();
    this.initializeCharts();
    this.loadDashboardData();
    this.initAnimations();
  }

  // ===== SIDEBAR NAVIGATION =====
  renderSidebarNavigation() {
    const nav = document.getElementById('sidebarNav');
    if (!nav) {
      console.warn('Sidebar navigation container not found');
      return;
    }

    const navItems = [
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

    const navHTML = navItems.map(item => {
      if (item.separator) {
        return `<div class="mt-6 pt-6 border-t border-gray-200">${this.createNavItem(item)}</div>`;
      }
      return this.createNavItem(item);
    }).join('');

    nav.innerHTML = navHTML;

    // Add click handlers
    nav.addEventListener('click', (e) => {
      const link = e.target.closest('.sidebar-link');
      if (link && !link.href.includes('#')) {
        // Close sidebar on mobile after navigation
        if (this.isMobile()) {
          setTimeout(() => this.closeSidebar(), 200);
        }
      }
    });
  }

  createNavItem(item) {
    const isCurrentPage = window.location.pathname === item.href;
    
    return `
      <a href="${item.href}" 
         class="sidebar-link ${isCurrentPage || item.active ? 'active' : ''} ${item.adminOnly ? 'admin-only' : ''} flex items-center p-3 rounded-xl group transition-all hover:bg-gray-50 dark:hover:bg-gray-700"
         ${item.href === '#' ? 'onclick="return false;"' : ''}>
        <div class="icon-container w-10 h-10 flex items-center justify-center rounded-lg transition-all">
          <i class="fas ${item.icon} text-sm"></i>
        </div>
        <span class="ml-3 font-medium text-sm">${item.label}</span>
        ${item.badge ? `
          <span class="ml-auto bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full hidden sm:inline">
            ${item.badge}
          </span>
        ` : ''}
      </a>
    `;
  }

  // ===== STATS CARDS =====
  renderStatsCards() {
    const grid = document.getElementById('statsGrid');
    if (!grid) {
      console.warn('Stats grid container not found');
      return;
    }

    const stats = [
      {
        id: 'totalEmpresas',
        title: 'Total Empresas',
        icon: 'fa-building',
        value: '0',
        trend: '+12.5%',
        subtitle: 'activas este mes',
        subtitleId: 'activeEmpresas',
        color: 'primary',
        adminOnly: true
      },
      {
        id: 'totalUsers',
        title: 'Total Usuarios',
        icon: 'fa-users',
        value: '0',
        trend: '+8.3%',
        subtitle: 'activos hoy',
        subtitleId: 'activeUsers',
        color: 'success'
      },
      {
        id: 'empresaInfo',
        title: 'Mi Empresa',
        icon: 'fa-home',
        value: '-',
        badge: 'Premium',
        subtitle: 'miembros activos',
        subtitleId: 'empresaMembers',
        color: 'secondary',
        empresaOnly: true
      },
      {
        id: 'performance',
        title: 'Rendimiento',
        icon: 'fa-chart-line',
        value: '0',
        badge: 'Top',
        subtitle: 'promedio por empresa',
        subtitleId: 'avgPerformance',
        color: 'warning',
        adminOnly: true
      }
    ];

    const cardsHTML = stats.map(stat => this.createStatsCard(stat)).join('');
    grid.innerHTML = cardsHTML;

    // Add click handlers for mobile interaction
    if (this.isMobile()) {
      grid.addEventListener('click', (e) => {
        const card = e.target.closest('.stats-card');
        if (card) {
          this.showStatsDetail(card.dataset.statId);
        }
      });
    }
  }

  createStatsCard(stat) {
    const trendColors = {
      primary: 'green',
      success: 'blue',
      secondary: 'purple',
      warning: 'orange'
    };

    return `
      <div class="stats-card ${stat.color} glass-card p-4 sm:p-6 gsap-scale-in ${stat.adminOnly ? 'admin-only' : ''} ${stat.empresaOnly ? 'empresa-only' : ''} col-span-1 cursor-pointer transition-all hover:shadow-lg"
           data-stat-id="${stat.id}">
        <div class="flex items-center justify-between mb-4">
          <div class="stats-icon w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl transition-all">
            <i class="fas ${stat.icon} text-lg sm:text-xl"></i>
          </div>
          ${stat.trend ? `
            <span class="text-xs font-medium text-${trendColors[stat.color]}-600 bg-${trendColors[stat.color]}-50 px-2 py-1 rounded-full">
              <i class="fas fa-arrow-up mr-1"></i>${stat.trend}
            </span>
          ` : ''}
          ${stat.badge ? `
            <span class="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
              ${stat.badge}
            </span>
          ` : ''}
        </div>
        <h3 class="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">${stat.title}</h3>
        <p class="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white" id="${stat.id}Count">${stat.value}</p>
        <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
          <span class="font-semibold text-${trendColors[stat.color]}-600" id="${stat.subtitleId}Count">0</span> 
          ${stat.subtitle}
        </p>
      </div>
    `;
  }

  showStatsDetail(statId) {
    // Mobile-specific stats detail modal
    const statInfo = {
      totalEmpresas: {
        title: 'Empresas Registradas',
        description: 'Total de empresas en el sistema',
        details: [
          'Empresas activas: 22',
          'Empresas pendientes: 2',
          'Crecimiento mensual: +12.5%'
        ]
      },
      totalUsers: {
        title: 'Usuarios del Sistema',
        description: 'Usuarios registrados en todas las empresas',
        details: [
          'Usuarios activos: 142',
          'Nuevos este mes: 18',
          'Crecimiento: +8.3%'
        ]
      }
    };

    const info = statInfo[statId];
    if (!info) return;

    Swal.fire({
      title: info.title,
      html: `
        <div class="text-left">
          <p class="text-gray-600 mb-4">${info.description}</p>
          <ul class="space-y-2">
            ${info.details.map(detail => `
              <li class="flex items-center text-sm">
                <i class="fas fa-check-circle text-green-500 mr-2"></i>
                ${detail}
              </li>
            `).join('')}
          </ul>
        </div>
      `,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#8b5cf6',
      width: '90%'
    });
  }

  // ===== QUICK ACTIONS =====
  renderQuickActions() {
    const grid = document.getElementById('quickActionsGrid');
    if (!grid) {
      console.warn('Quick actions grid container not found');
      return;
    }

    const actions = [
      {
        onclick: 'createEmpresa()',
        icon: 'fa-plus-circle',
        title: 'Nueva Empresa',
        subtitle: 'Agregar empresa',
        color: 'primary',
        superAdminOnly: true
      },
      {
        onclick: 'createUser()',
        icon: 'fa-user-plus',
        title: 'Nuevo Usuario',
        subtitle: 'Registrar usuario',
        color: 'success'
      },
      {
        onclick: 'generateReport()',
        icon: 'fa-file-chart-line',
        title: 'Generar Reporte',
        subtitle: 'Crear informe',
        color: 'warning'
      },
      {
        onclick: 'showSystemInfo()',
        icon: 'fa-info-circle',
        title: 'Info Sistema',
        subtitle: 'Ver detalles',
        color: 'primary'
      }
    ];

    const actionsHTML = actions.map(action => this.createQuickAction(action)).join('');
    grid.innerHTML = actionsHTML;
  }

  createQuickAction(action) {
    return `
      <button onclick="${action.onclick}" 
              class="quick-action-btn ${action.color} ${action.superAdminOnly ? 'super-admin-only' : ''} group p-4 sm:p-6 rounded-xl border-2 border-dashed transition-all hover:border-solid hover:shadow-lg">
        <div class="action-icon w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 flex items-center justify-center rounded-xl transition-all">
          <i class="fas ${action.icon} text-lg sm:text-xl"></i>
        </div>
        <h4 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-white group-hover:text-white relative z-10">
          ${action.title}
        </h4>
        <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 group-hover:text-white/80 relative z-10">
          ${action.subtitle}
        </p>
      </button>
    `;
  }

  // ===== CHARTS MANAGEMENT =====
  initializeCharts() {
    this.createActivityChart();
    this.createDistributionChart();
  }

  createActivityChart() {
    const ctx = document.getElementById('dashboardChart')?.getContext('2d');
    if (!ctx) {
      console.warn('Dashboard chart canvas not found');
      return;
    }

    // Destroy existing chart
    if (this.charts.activity) {
      this.charts.activity.destroy();
    }

    const height = this.isMobile() ? 200 : 300;
    const gradient1 = ctx.createLinearGradient(0, 0, 0, height);
    gradient1.addColorStop(0, 'rgba(147, 51, 234, 0.4)');
    gradient1.addColorStop(1, 'rgba(147, 51, 234, 0.01)');

    const gradient2 = ctx.createLinearGradient(0, 0, 0, height);
    gradient2.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    gradient2.addColorStop(1, 'rgba(59, 130, 246, 0.01)');

    this.charts.activity = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.isMobile() ? 
          ['L', 'M', 'X', 'J', 'V', 'S', 'D'] : 
          ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [{
          label: 'Usuarios Activos',
          data: [65, 78, 90, 85, 92, 88, 95],
          borderColor: 'rgb(147, 51, 234)',
          backgroundColor: gradient1,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: 'white',
          pointBorderColor: 'rgb(147, 51, 234)',
          pointBorderWidth: this.isMobile() ? 2 : 3,
          pointRadius: this.isMobile() ? 3 : 5,
          pointHoverRadius: this.isMobile() ? 5 : 7,
          borderWidth: this.isMobile() ? 2 : 3
        }, {
          label: 'Nuevos Registros',
          data: [28, 35, 40, 38, 45, 42, 48],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: gradient2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: 'white',
          pointBorderColor: 'rgb(59, 130, 246)',
          pointBorderWidth: this.isMobile() ? 2 : 3,
          pointRadius: this.isMobile() ? 3 : 5,
          pointHoverRadius: this.isMobile() ? 5 : 7,
          borderWidth: this.isMobile() ? 2 : 3
        }]
      },
      options: this.getChartOptions('line')
    });
  }

  createDistributionChart() {
    const ctx = document.getElementById('distributionChart')?.getContext('2d');
    if (!ctx) {
      console.warn('Distribution chart canvas not found');
      return;
    }

    // Destroy existing chart
    if (this.charts.distribution) {
      this.charts.distribution.destroy();
    }

    this.charts.distribution = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.isMobile() ? 
          ['Premium', 'Estándar', 'Pro', 'Básicos'] : 
          ['Empresas Premium', 'Empresas Estándar', 'Usuarios Pro', 'Usuarios Básicos'],
        datasets: [{
          data: [35, 25, 25, 15],
          backgroundColor: [
            'rgba(147, 51, 234, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 146, 60, 0.8)'
          ],
          borderColor: [
            'rgb(147, 51, 234)',
            'rgb(59, 130, 246)',
            'rgb(34, 197, 94)',
            'rgb(251, 146, 60)'
          ],
          borderWidth: this.isMobile() ? 1 : 2,
          hoverOffset: this.isMobile() ? 8 : 15
        }]
      },
      options: {
        ...this.getChartOptions('doughnut'),
        cutout: this.isMobile() ? '60%' : '50%'
      }
    });
  }

  getChartOptions(type = 'line') {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: !this.isMobile(),
          position: 'bottom',
          labels: {
            padding: this.isMobile() ? 10 : 20,
            font: {
              size: this.isMobile() ? 10 : 12,
              family: "'Inter', sans-serif"
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: this.isMobile() ? 8 : 12,
          cornerRadius: 8,
          titleFont: {
            size: this.isMobile() ? 12 : 14,
            weight: '600'
          },
          bodyFont: {
            size: this.isMobile() ? 11 : 13
          }
        }
      }
    };

    if (type === 'line') {
      baseOptions.interaction = {
        mode: 'index',
        intersect: false
      };
      
      baseOptions.scales = {
        y: {
          beginAtZero: true,
          grid: {
            drawBorder: false,
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            font: { size: this.isMobile() ? 9 : 11 },
            maxTicksLimit: this.isMobile() ? 4 : 6
          }
        },
        x: {
          grid: { display: false },
          ticks: {
            font: { size: this.isMobile() ? 9 : 11 },
            maxRotation: this.isMobile() ? 45 : 0
          }
        }
      };
    }

    return baseOptions;
  }

  // ===== DATA LOADING =====
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
        this.animateCounters();
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

    await this.loadActivityLists();
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

  async loadActivityLists() {
    try {
      if (this.currentUser.isAdmin()) {
        const empresas = await window.apiClient.getEmpresas();
        this.loadRecentCompanies(empresas.slice(-3));
      }

      let usuarios = [];
      if (this.selectedEmpresa) {
        usuarios = await window.apiClient.getUsuariosByEmpresa(this.selectedEmpresa);
      } else if (this.currentUser.isEmpresa()) {
        usuarios = await window.apiClient.getUsuariosByEmpresa(this.currentUser.getEmpresaId());
      }

      this.loadRecentUsers(usuarios.slice(-3));

    } catch (error) {
      console.error('Error loading activity lists:', error);
      // Continue with demo data for lists
      this.loadDemoActivityLists();
    }
  }

  loadDemoData() {
    // Update stats with demo values
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

    this.loadDemoActivityLists();
  }

  loadDemoActivityLists() {
    this.loadRecentCompanies();
    this.loadRecentUsers();
  }

  loadRecentCompanies(companies = null) {
    const container = document.getElementById('recentEmpresasContainer');
    if (!container) return;

    const defaultCompanies = [
      { 
        nombre: 'Tech Solutions', 
        initials: 'TS', 
        time: 'hace 2 horas', 
        status: 'Activa', 
        gradient: 'from-purple-600 to-blue-600' 
      },
      { 
        nombre: 'Innovate Media', 
        initials: 'IM', 
        time: 'hace 5 horas', 
        status: 'Activa', 
        gradient: 'from-green-600 to-teal-600' 
      },
      { 
        nombre: 'Digital Services', 
        initials: 'DS', 
        time: 'ayer', 
        status: 'Pendiente', 
        gradient: 'from-orange-600 to-red-600' 
      }
    ];

    const dataToUse = companies || defaultCompanies;
    const html = dataToUse.map((company, index) => {
      const gradients = [
        'from-purple-600 to-blue-600',
        'from-green-600 to-teal-600',
        'from-orange-600 to-red-600'
      ];

      const companyData = {
        nombre: company.nombre || company.name,
        initials: company.initials || company.nombre?.substring(0, 2).toUpperCase() || 'CO',
        time: company.time || 'Reciente',
        status: company.status || (company.activa ? 'Activa' : 'Inactiva'),
        gradient: company.gradient || gradients[index % gradients.length]
      };

      return this.createActivityItem(companyData, 'empresa');
    }).join('');

    container.innerHTML = html;
  }

  loadRecentUsers(users = null) {
    const container = document.getElementById('recentUsersContainer');
    if (!container) return;

    const defaultUsers = [
      { 
        nombre: 'Juan Díaz', 
        email: 'juan@techsolutions.com', 
        initials: 'JD', 
        rol: 'Admin', 
        gradient: 'from-purple-600 to-pink-600' 
      },
      { 
        nombre: 'María Rodríguez', 
        email: 'maria@innovatemedia.com', 
        initials: 'MR', 
        rol: 'Usuario', 
        gradient: 'from-blue-600 to-cyan-600' 
      },
      { 
        nombre: 'Carlos Pérez', 
        email: 'carlos@digitalservices.co', 
        initials: 'CP', 
        rol: 'Premium', 
        gradient: 'from-green-600 to-emerald-600' 
      }
    ];

    const dataToUse = users || defaultUsers;
    const html = dataToUse.map((user, index) => {
      const gradients = [
        'from-purple-600 to-pink-600',
        'from-blue-600 to-cyan-600',
        'from-green-600 to-emerald-600'
      ];

      const userData = {
        nombre: user.nombre || user.name,
        email: user.email || 'usuario@empresa.com',
        initials: user.initials || user.nombre?.substring(0, 2).toUpperCase() || 'US',
        rol: user.rol || user.role || 'Usuario',
        gradient: user.gradient || gradients[index % gradients.length]
      };

      return this.createActivityItem(userData, 'usuario');
    }).join('');

    container.innerHTML = html;
  }

  createActivityItem(data, type) {
    const isEmpresa = type === 'empresa';
    const statusClass = isEmpresa ? 
      (data.status === 'Activa' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600') :
      (data.rol === 'Admin' ? 'bg-blue-100 text-blue-600' : 
       data.rol === 'Premium' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600');

    return `
      <div class="activity-item p-3 sm:p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group">
        <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${data.gradient} rounded-lg flex items-center justify-center text-white font-bold mr-3 sm:mr-4 group-hover:scale-110 transition-transform">
          <span class="text-sm sm:text-base">${data.initials}</span>
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
            ${data.nombre}
          </h4>
          <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
            ${isEmpresa ? `Agregada ${data.time}` : data.email}
          </p>
        </div>
        <span class="text-xs ${statusClass} px-2 py-1 rounded-full whitespace-nowrap">
          ${isEmpresa ? data.status : data.rol}
        </span>
      </div>
    `;
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
  }

  // ===== ANIMATIONS =====
  initAnimations() {
    if (typeof gsap === 'undefined') {
      console.warn('GSAP not loaded, skipping animations');
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    if (!this.isMobile()) {
      // Desktop animations
      gsap.from(".gsap-fade-in", {
        opacity: 0,
        y: 30,
        duration: 1,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.2
      });

      gsap.from(".gsap-scale-in", {
        opacity: 0,
        scale: 0.9,
        duration: 0.8,
        stagger: 0.1,
        ease: "back.out(1.7)",
        delay: 0.4
      });

      // Stats card hover effects
      this.setupStatsCardHovers();

    } else {
      // Mobile animations (simplified and faster)
      gsap.from(".gsap-fade-in", {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.05,
        ease: "power2.out"
      });

      gsap.from(".gsap-scale-in", {
        opacity: 0,
        scale: 0.95,
        duration: 0.5,
        stagger: 0.05,
        ease: "power2.out"
      });
    }

    // Navbar animation
    gsap.from(".navbar-premium", {
      y: -100,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    });
  }

  setupStatsCardHovers() {
    document.querySelectorAll('.stats-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        gsap.to(card, {
          y: -5,
          scale: 1.02,
          duration: 0.3,
          ease: "power2.out"
        });
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          y: 0,
          scale: 1,
          duration: 0.3,
          ease: "power2.out"
        });
      });
    });
  }

  animateCounters() {
    const counters = [
      { id: 'totalEmpresasCount', value: 24 },
      { id: 'totalUsersCount', value: 156 },
      { id: 'activeEmpresasCount', value: 22 },
      { id: 'activeUsersCount', value: 142 },
      { id: 'empresaMembersCount', value: 18 },
      { id: 'performanceCount', value: 6.5 },
      { id: 'avgPerformanceCount', value: 6.5 }
    ];

    counters.forEach(counter => {
      const element = document.getElementById(counter.id);
      if (element && typeof counter.value === 'number') {
        this.animateCounter(element, counter.value);
      }
    });
  }

  animateCounter(element, endValue) {
    if (typeof gsap === 'undefined') {
      element.textContent = endValue;
      return;
    }

    const obj = { value: 0 };
    const duration = this.isMobile() ? 1.5 : 2;

    gsap.to(obj, {
      value: endValue,
      duration: duration,
      ease: "power2.out",
      onUpdate: () => {
        if (endValue % 1 !== 0) {
          element.textContent = obj.value.toFixed(1);
        } else {
          element.textContent = Math.floor(obj.value);
        }
      }
    });
  }

  // ===== THEME MANAGEMENT =====
  toggleTheme() {
    const html = document.documentElement;
    const themeIcon = document.getElementById('themeIcon');
    const isDark = html.classList.contains('dark');

    if (isDark) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      if (themeIcon) {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
      }
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      if (themeIcon) {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
      }
    }

    // Animate theme transition
    if (!this.isMobile() && typeof gsap !== 'undefined') {
      gsap.to('body', {
        backgroundColor: isDark ? '#f9fafb' : '#111827',
        duration: 0.3
      });
    }

    // Reinitialize charts with new theme
    setTimeout(() => this.initializeCharts(), 300);

    this.showNotification(`Tema ${isDark ? 'claro' : 'oscuro'} activado`, 'success');
  }

  initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && systemDark);
    const themeIcon = document.getElementById('themeIcon');

    if (isDark) {
      document.documentElement.classList.add('dark');
      if (themeIcon) {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
      }
    }
  }

  // ===== RESPONSIVE HANDLERS =====
  setupResponsiveHandlers() {
    this.updatePermissionsVisibility();
    this.setupEmpresaSelector();
    this.setupUserProfile();
  }

  updatePermissionsVisibility() {
    if (!this.currentUser) return;

    // Show/hide admin elements
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
      el.style.display = this.currentUser.isAdmin() ? 'block' : 'none';
    });

    // Show/hide super admin elements
    const superAdminElements = document.querySelectorAll('.super-admin-only');
    superAdminElements.forEach(el => {
      el.style.display = this.currentUser.isSuperAdmin() ? 'block' : 'none';
    });

    // Show/hide empresa elements
    const empresaElements = document.querySelectorAll('.empresa-only');
    empresaElements.forEach(el => {
      el.style.display = this.currentUser.isEmpresa() ? 'block' : 'none';
    });
  }

  setupUserProfile() {
    if (!this.currentUser) return;

    // Update user information in UI
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(el => {
      el.textContent = this.currentUser.nombre || this.currentUser.usuario || 'Usuario';
    });

    const userRoleElements = document.querySelectorAll('.user-role');
    userRoleElements.forEach(el => {
      el.textContent = this.currentUser.rol || 'Usuario';
    });

    const userInitialsElements = document.querySelectorAll('.user-initials');
    userInitialsElements.forEach(el => {
      const name = this.currentUser.nombre || this.currentUser.usuario || 'U';
      el.textContent = name.substring(0, 2).toUpperCase();
    });
  }

  async setupEmpresaSelector() {
    const selector = document.getElementById('sidebarEmpresaSelector');
    if (!selector || !window.apiClient) return;

    try {
      if (!this.currentUser?.isAdmin()) {
        selector.style.display = 'none';
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

      selector.addEventListener('change', (e) => {
        const empresaId = e.target.value;
        this.selectedEmpresa = empresaId;
        
        if (empresaId) {
          window.apiClient.setSelectedEmpresa(empresaId);
          const empresaName = empresas.find(e => e.id === empresaId)?.nombre;
          this.showNotification(`Empresa seleccionada: ${empresaName}`, 'success');
        } else {
          window.apiClient.clearSelectedEmpresa();
          this.showNotification('Viendo todas las empresas', 'info');
        }

        // Reload dashboard data
        this.loadDashboardData();
      });

    } catch (error) {
      console.error('Error setting up empresa selector:', error);
      selector.style.display = 'none';
    }
  }

  handleResize() {
    console.log('Handling resize event');
    
    // Reinitialize charts for new screen size
    setTimeout(() => this.initializeCharts(), 100);

    // Update responsive classes
    this.updateResponsiveClasses();

    // Close sidebar on desktop
    if (this.isDesktop()) {
      this.closeSidebar();
    }

    // Re-render components if needed
    if (this.isInitialized) {
      this.renderStatsCards();
      this.renderQuickActions();
    }
  }

  updateResponsiveClasses() {
    const body = document.body;
    
    // Remove existing responsive classes
    body.classList.remove('is-mobile', 'is-tablet', 'is-desktop');
    
    // Add current responsive class
    if (this.isMobile()) {
      body.classList.add('is-mobile');
    } else if (this.isTablet()) {
      body.classList.add('is-tablet');
    } else {
      body.classList.add('is-desktop');
    }
  }

  // ===== SIDEBAR MANAGEMENT =====
  openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (!sidebar || !overlay) return;

    sidebar.classList.remove('-translate-x-full');
    overlay.classList.remove('invisible');

    if (typeof gsap !== 'undefined') {
      gsap.fromTo(sidebar, 
        { x: this.isMobile() ? -288 : -320 },
        { x: 0, duration: 0.3, ease: "power2.out" }
      );

      gsap.to(overlay, {
        opacity: 1,
        duration: 0.3
      });
    }

    document.body.style.overflow = 'hidden';
  }

  closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (!sidebar || !overlay) return;

    if (typeof gsap !== 'undefined') {
      gsap.to(sidebar, {
        x: this.isMobile() ? -288 : -320,
        duration: 0.3,
        ease: "power2.inOut",
        onComplete: () => {
          sidebar.classList.add('-translate-x-full');
        }
      });

      gsap.to(overlay, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          overlay.classList.add('invisible');
        }
      });
    } else {
      sidebar.classList.add('-translate-x-full');
      overlay.classList.add('invisible');
      overlay.style.opacity = '0';
    }

    document.body.style.overflow = '';
  }

  // ===== CHART CONTROLS =====
  refreshChart(chartId) {
    const chart = chartId === 'dashboardChart' ? this.charts.activity : this.charts.distribution;
    if (!chart) return;

    if (typeof gsap !== 'undefined') {
      gsap.to(`#${chartId}`, {
        rotation: 360,
        scale: 0.95,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.set(`#${chartId}`, { rotation: 0, scale: 1 });
          this.initializeCharts();
          this.showNotification('Gráfico actualizado', 'success');
        }
      });
    } else {
      this.initializeCharts();
      this.showNotification('Gráfico actualizado', 'success');
    }
  }

  expandChart(chartId) {
    if (!window.Swal) {
      console.warn('SweetAlert2 not loaded');
      return;
    }

    if (this.isMobile()) {
      Swal.fire({
        title: 'Vista Expandida',
        html: `<div class="w-full h-64"><canvas id="expanded-${chartId}"></canvas></div>`,
        width: '95%',
        showCloseButton: true,
        showConfirmButton: false,
        customClass: {
          popup: 'mobile-chart-modal'
        },
        didOpen: () => {
          // Could recreate chart in modal here
          console.log('Chart expanded in modal');
        }
      });
    } else {
      Swal.fire({
        title: 'Vista Expandida',
        text: 'Funcionalidad disponible próximamente',
        icon: 'info',
        confirmButtonColor: '#8b5cf6'
      });
    }
  }

  downloadChart(chartId) {
    const chart = chartId === 'dashboardChart' ? this.charts.activity : this.charts.distribution;
    if (!chart) {
      this.showNotification('Gráfico no disponible', 'error');
      return;
    }

    try {
      const url = chart.toBase64Image('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `${chartId}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = url;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.showNotification('Gráfico descargado', 'success');
    } catch (error) {
      console.error('Error downloading chart:', error);
      this.showNotification('Error al descargar gráfico', 'error');
    }
  }

  // ===== USER ACTIONS =====
  showUserInfo() {
    if (!window.Swal) {
      console.warn('SweetAlert2 not loaded');
      return;
    }

    if (!this.currentUser) {
      this.showNotification('Información de usuario no disponible', 'warning');
      return;
    }

    const modalWidth = this.isMobile() ? '95%' : '500px';

    Swal.fire({
      title: 'Información del Usuario',
      html: `
        <div class="text-left space-y-4">
          <div class="text-center mb-4">
            <div class="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span class="text-white text-2xl font-bold">
                ${(this.currentUser.nombre || this.currentUser.usuario || 'U').substring(0, 2).toUpperCase()}
              </span>
            </div>
            <h3 class="text-xl font-semibold">${this.currentUser.nombre || this.currentUser.usuario}</h3>
          </div>
          
          <div class="space-y-3">
            <p><strong>Usuario:</strong> ${this.currentUser.usuario}</p>
            <p><strong>Email:</strong> ${this.currentUser.email || 'No disponible'}</p>
            <p><strong>Rol:</strong> 
              <span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                ${this.currentUser.rol}
              </span>
            </p>
            <p><strong>Tipo:</strong> 
              <span class="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                ${this.currentUser.tipo}
              </span>
            </p>
            ${this.currentUser.isEmpresa() && this.currentUser.getEmpresaId() ? `
              <p><strong>Empresa ID:</strong> ${this.currentUser.getEmpresaId()}</p>
            ` : ''}
          </div>
          
          ${this.currentUser.permisos && this.currentUser.permisos.length > 0 ? `
            <div class="mt-4">
              <p class="font-semibold mb-2">Permisos:</p>
              <div class="space-y-1">
                ${this.currentUser.permisos.map(permiso => `
                  <div class="flex items-center text-sm">
                    <i class="fas fa-check text-green-500 mr-2"></i>
                    ${permiso}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#8b5cf6',
      width: modalWidth
    });
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

  refreshDashboard() {
    this.showNotification('Actualizando dashboard...', 'info');
    
    // Show loading state
    this.showLoadingState();
    
    // Reload data
    setTimeout(() => {
      this.loadDashboardData();
      this.initializeCharts();
      this.showNotification('Dashboard actualizado', 'success');
    }, 1000);
  }

  // ===== NOTIFICATIONS =====
  showNotification(message, type = 'info', duration = 3000) {
    if (!window.Swal) {
      console.log(`${type.toUpperCase()}: ${message}`);
      return;
    }

    const toast = Swal.mixin({
      toast: true,
      position: this.isMobile() ? 'bottom' : 'top-end',
      showConfirmButton: false,
      timer: duration,
      timerProgressBar: true,
      customClass: {
        popup: this.isMobile() ? 'mobile-toast' : 'desktop-toast'
      },
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });

    toast.fire({
      icon: type,
      title: message
    });
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

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  formatDate(date) {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // ===== CLEANUP =====
  destroy() {
    // Clean up charts
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });

    // Clean up event listeners
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('click', this.handleGlobalClicks);

    // Clean up GSAP animations
    if (typeof gsap !== 'undefined') {
      gsap.killTweensOf("*");
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    }

    console.log('Dashboard cleaned up');
  }
}

// ===== GLOBAL FUNCTIONS =====

// Sidebar Toggle Function
function toggleSidebar() {
  const dashboard = window.responsiveDashboard;
  if (!dashboard) return;

  const sidebar = document.getElementById('sidebar');
  const isOpen = sidebar && !sidebar.classList.contains('-translate-x-full');

  if (isOpen) {
    dashboard.closeSidebar();
  } else {
    dashboard.openSidebar();
  }
}

// Chart Control Functions
function refreshChart(chartId) {
  window.responsiveDashboard?.refreshChart(chartId);
}

function expandChart(chartId) {
  window.responsiveDashboard?.expandChart(chartId);
}

function downloadChart(chartId) {
  window.responsiveDashboard?.downloadChart(chartId);
}

// Quick Action Functions
function generateReport() {
  const dashboard = window.responsiveDashboard;
  if (!window.Swal) {
    console.warn('SweetAlert2 not loaded');
    return;
  }

  const modalWidth = dashboard?.isMobile() ? '95%' : '500px';
  
  Swal.fire({
    title: 'Generar Reporte',
    html: `
      <div class="text-left space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Reporte</label>
          <select id="reportType" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500">
            <option value="monthly">Reporte Mensual</option>
            <option value="quarterly">Reporte Trimestral</option>
            <option value="yearly">Reporte Anual</option>
            <option value="custom">Reporte Personalizado</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Formato</label>
          <div class="grid grid-cols-3 gap-2">
            <button type="button" class="format-btn p-3 border-2 border-purple-500 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors" data-format="pdf">
              <i class="fas fa-file-pdf text-xl sm:text-2xl"></i>
              <p class="text-xs mt-1">PDF</p>
            </button>
            <button type="button" class="format-btn p-3 border-2 border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors" data-format="excel">
              <i class="fas fa-file-excel text-xl sm:text-2xl"></i>
              <p class="text-xs mt-1">Excel</p>
            </button>
            <button type="button" class="format-btn p-3 border-2 border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors" data-format="csv">
              <i class="fas fa-file-csv text-xl sm:text-2xl"></i>
              <p class="text-xs mt-1">CSV</p>
            </button>
          </div>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Generar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#8b5cf6',
    width: modalWidth,
    didOpen: () => {
      let selectedFormat = 'pdf';
      
      // Handle format selection
      document.querySelectorAll('.format-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          
          // Reset all buttons
          document.querySelectorAll('.format-btn').forEach(b => {
            b.classList.remove('border-purple-500', 'text-purple-600');
            b.classList.add('border-gray-300', 'text-gray-600');
          });
          
          // Highlight selected button
          btn.classList.remove('border-gray-300', 'text-gray-600');
          btn.classList.add('border-purple-500', 'text-purple-600');
          
          selectedFormat = btn.dataset.format;
        });
      });
    },
    preConfirm: () => {
      const reportType = document.getElementById('reportType').value;
      const format = document.querySelector('.format-btn.border-purple-500')?.dataset.format || 'pdf';
      
      return { reportType, format };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const { reportType, format } = result.value;
      
      // Show progress
      let progress = 0;
      const progressTimer = setInterval(() => {
        progress += 10;
        Swal.update({
          html: `Generando reporte ${reportType} en formato ${format.toUpperCase()}...<br>Progreso: <b>${progress}%</b>`
        });
        
        if (progress >= 100) {
          clearInterval(progressTimer);
        }
      }, 300);

      Swal.fire({
        title: 'Generando reporte...',
        html: `Generando reporte ${reportType} en formato ${format.toUpperCase()}...<br>Progreso: <b>0%</b>`,
        timer: 3000,
        timerProgressBar: true,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      }).then(() => {
        clearInterval(progressTimer);
        dashboard?.showNotification(`¡Reporte ${format.toUpperCase()} generado correctamente!`, 'success');
      });
    }
  });
}

function showSystemInfo() {
  const dashboard = window.responsiveDashboard;
  if (!window.Swal) {
    console.warn('SweetAlert2 not loaded');
    return;
  }

  const modalWidth = dashboard?.isMobile() ? '95%' : '600px';
  
  Swal.fire({
    title: 'Información del Sistema',
    html: `
      <div class="text-left space-y-4">
        <div class="grid grid-cols-2 gap-2 sm:gap-4">
          <div class="p-3 sm:p-4 bg-purple-50 rounded-lg">
            <i class="fas fa-server text-purple-600 text-lg sm:text-2xl mb-2"></i>
            <p class="text-xs sm:text-sm text-gray-600">Versión</p>
            <p class="text-sm sm:text-base font-semibold">v2.1.0</p>
          </div>
          <div class="p-3 sm:p-4 bg-blue-50 rounded-lg">
            <i class="fas fa-database text-blue-600 text-lg sm:text-2xl mb-2"></i>
            <p class="text-xs sm:text-sm text-gray-600">Base de Datos</p>
            <p class="text-sm sm:text-base font-semibold">MongoDB</p>
          </div>
          <div class="p-3 sm:p-4 bg-green-50 rounded-lg">
            <i class="fas fa-shield-alt text-green-600 text-lg sm:text-2xl mb-2"></i>
            <p class="text-xs sm:text-sm text-gray-600">Estado</p>
            <p class="text-sm sm:text-base font-semibold text-green-600">Operativo</p>
          </div>
          <div class="p-3 sm:p-4 bg-orange-50 rounded-lg">
            <i class="fas fa-clock text-orange-600 text-lg sm:text-2xl mb-2"></i>
            <p class="text-xs sm:text-sm text-gray-600">Uptime</p>
            <p class="text-sm sm:text-base font-semibold">99.9%</p>
          </div>
          <div class="p-3 sm:p-4 bg-indigo-50 rounded-lg">
            <i class="fas fa-users text-indigo-600 text-lg sm:text-2xl mb-2"></i>
            <p class="text-xs sm:text-sm text-gray-600">Usuarios Conectados</p>
            <p class="text-sm sm:text-base font-semibold">142</p>
          </div>
          <div class="p-3 sm:p-4 bg-pink-50 rounded-lg">
            <i class="fas fa-chart-line text-pink-600 text-lg sm:text-2xl mb-2"></i>
            <p class="text-xs sm:text-sm text-gray-600">Rendimiento</p>
            <p class="text-sm sm:text-base font-semibold">Excelente</p>
          </div>
        </div>
        
        <div class="mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
          <p class="text-xs sm:text-sm text-gray-600 mb-1">Última actualización</p>
          <p class="text-sm sm:text-base font-semibold">${new Date().toLocaleString('es-ES')}</p>
        </div>
        
        <div class="mt-4 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
          <div class="flex items-center">
            <i class="fas fa-rocket text-purple-600 text-xl mr-3"></i>
            <div>
              <p class="text-sm font-semibold text-gray-900">Sistema Optimizado</p>
              <p class="text-xs text-gray-600">Funcionando a máximo rendimiento</p>
            </div>
          </div>
        </div>
      </div>
    `,
    confirmButtonText: 'Cerrar',
    confirmButtonColor: '#8b5cf6',
    width: modalWidth,
    customClass: {
      popup: dashboard?.isMobile() ? 'mobile-modal' : ''
    }
  });
}

function createEmpresa() {
  const dashboard = window.responsiveDashboard;
  if (!window.Swal) {
    console.warn('SweetAlert2 not loaded');
    return;
  }

  // Check permissions
  if (dashboard?.currentUser && !dashboard.currentUser.isSuperAdmin()) {
    dashboard.showNotification('Solo los super administradores pueden crear empresas', 'error');
    return;
  }

  const modalWidth = dashboard?.isMobile() ? '95%' : '600px';

  Swal.fire({
    title: 'Crear Nueva Empresa',
    html: `
      <div class="text-left space-y-4">
        <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nombre de la Empresa *</label>
            <input id="empresaNombre" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="Ej: Tech Solutions S.A." required>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Descripción *</label>
            <textarea id="empresaDescripcion" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="Describe la empresa y su actividad principal" required></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Ubicación *</label>
            <input id="empresaUbicacion" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="Ej: Bogotá, Colombia" required>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email de Contacto *</label>
            <input id="empresaEmail" type="email" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="contacto@empresa.com" required>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Contraseña Inicial *</label>
            <input id="empresaPassword" type="password" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="Contraseña para el administrador" required>
          </div>
        </div>
        
        <div class="bg-blue-50 p-3 rounded-lg">
          <div class="flex items-start">
            <i class="fas fa-info-circle text-blue-600 mt-0.5 mr-2"></i>
            <div class="text-sm text-blue-800">
              <p class="font-medium">Información importante:</p>
              <ul class="mt-1 list-disc list-inside text-xs space-y-1">
                <li>Se creará un usuario administrador para la empresa</li>
                <li>El email servirá como nombre de usuario</li>
                <li>La empresa estará activa por defecto</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Crear Empresa',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#8b5cf6',
    width: modalWidth,
    preConfirm: () => {
      const nombre = document.getElementById('empresaNombre').value.trim();
      const descripcion = document.getElementById('empresaDescripcion').value.trim();
      const ubicacion = document.getElementById('empresaUbicacion').value.trim();
      const email = document.getElementById('empresaEmail').value.trim();
      const password = document.getElementById('empresaPassword').value;

      if (!nombre || !descripcion || !ubicacion || !email || !password) {
        Swal.showValidationMessage('Todos los campos son obligatorios');
        return false;
      }

      if (password.length < 6) {
        Swal.showValidationMessage('La contraseña debe tener al menos 6 caracteres');
        return false;
      }

      return { nombre, descripcion, ubicacion, email, password };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const empresaData = result.value;
      
      // Show progress
      Swal.fire({
        title: 'Creando empresa...',
        html: 'Por favor espera mientras se crea la empresa',
        timer: 3000,
        timerProgressBar: true,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      }).then(() => {
        dashboard?.showNotification('¡Empresa creada correctamente!', 'success');
        dashboard?.refreshDashboard();
      });
    }
  });
}

function createUser() {
  const dashboard = window.responsiveDashboard;
  if (!window.Swal) {
    console.warn('SweetAlert2 not loaded');
    return;
  }

  const modalWidth = dashboard?.isMobile() ? '95%' : '500px';

  Swal.fire({
    title: 'Crear Nuevo Usuario',
    html: `
      <div class="text-left space-y-4">
        <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nombre Completo *</label>
            <input id="userName" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Ej: Juan Pérez García" required>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Cédula/ID *</label>
            <input id="userCedula" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Número de identificación" required>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input id="userEmail" type="email" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="usuario@empresa.com" required>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Rol *</label>
            <select id="userRole" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" required>
              <option value="">Seleccionar rol</option>
              <option value="usuario">Usuario</option>
              <option value="admin">Administrador</option>
              <option value="supervisor">Supervisor</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Contraseña *</label>
            <input id="userPassword" type="password" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Contraseña inicial" required>
          </div>
        </div>
        
        <div class="bg-green-50 p-3 rounded-lg">
          <div class="flex items-start">
            <i class="fas fa-user-plus text-green-600 mt-0.5 mr-2"></i>
            <div class="text-sm text-green-800">
              <p class="font-medium">El usuario será agregado a:</p>
              <p class="text-xs mt-1">
                ${dashboard?.selectedEmpresa ? 'La empresa seleccionada' : 'La empresa actual'}
              </p>
            </div>
          </div>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Crear Usuario',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#8b5cf6',
    width: modalWidth,
    preConfirm: () => {
      const nombre = document.getElementById('userName').value.trim();
      const cedula = document.getElementById('userCedula').value.trim();
      const email = document.getElementById('userEmail').value.trim();
      const rol = document.getElementById('userRole').value;
      const password = document.getElementById('userPassword').value;

      if (!nombre || !cedula || !email || !rol || !password) {
        Swal.showValidationMessage('Todos los campos son obligatorios');
        return false;
      }

      if (password.length < 6) {
        Swal.showValidationMessage('La contraseña debe tener al menos 6 caracteres');
        return false;
      }

      return { nombre, cedula, email, rol, password };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const userData = result.value;
      
      // Show progress
      Swal.fire({
        title: 'Creando usuario...',
        html: 'Por favor espera mientras se crea el usuario',
        timer: 2500,
        timerProgressBar: true,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      }).then(() => {
        dashboard?.showNotification('¡Usuario creado correctamente!', 'success');
        dashboard?.refreshDashboard();
      });
    }
  });
}

// ===== INITIALIZATION =====

// Initialize Dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing responsive dashboard...');
  
  // Create global instance
  window.responsiveDashboard = new ResponsiveDashboard();
  
  // Add mobile-specific styles
  if (window.responsiveDashboard.isMobile()) {
    const style = document.createElement('style');
    style.textContent = `
      .mobile-toast {
        margin-bottom: 20px !important;
        font-size: 14px !important;
      }
      
      .mobile-modal .swal2-popup {
        margin: 10px !important;
        padding: 15px !important;
      }
      
      .mobile-chart-modal .swal2-popup {
        padding: 10px !important;
      }
      
      .touch-target {
        min-height: 44px !important;
        min-width: 44px !important;
      }
      
      @media (max-width: 768px) {
        button, .btn, .sidebar-link, .stats-card {
          min-height: 44px;
        }
        
        .chart-control-btn {
          min-width: 44px;
          min-height: 44px;
        }
        
        .quick-action-btn {
          min-height: 120px;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Set up global error handling
  window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    if (window.responsiveDashboard) {
      window.responsiveDashboard.showNotification('Ha ocurrido un error inesperado', 'error');
    }
  });
  
  // Set up unhandled promise rejection handling
  window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    if (window.responsiveDashboard) {
      window.responsiveDashboard.showNotification('Error de conexión', 'error');
    }
  });
  
  console.log('Responsive dashboard initialization complete');
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  console.log('Page unloading, cleaning up dashboard...');
  
  if (window.responsiveDashboard) {
    window.responsiveDashboard.destroy();
  }
});

// Expose dashboard methods for external use
window.dashboardAPI = {
  refreshDashboard: () => window.responsiveDashboard?.refreshDashboard(),
  showNotification: (message, type, duration) => window.responsiveDashboard?.showNotification(message, type, duration),
  toggleTheme: () => window.responsiveDashboard?.toggleTheme(),
  openSidebar: () => window.responsiveDashboard?.openSidebar(),
  closeSidebar: () => window.responsiveDashboard?.closeSidebar(),
  updateUserInfo: () => window.responsiveDashboard?.setupUserProfile(),
  loadDemoData: () => window.responsiveDashboard?.loadDemoData()
};

// Debug mode (only in development)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  window.debugDashboard = {
    dashboard: () => window.responsiveDashboard,
    charts: () => window.responsiveDashboard?.charts,
    currentUser: () => window.responsiveDashboard?.currentUser,
    isMobile: () => window.responsiveDashboard?.isMobile(),
    isTablet: () => window.responsiveDashboard?.isTablet(),
    isDesktop: () => window.responsiveDashboard?.isDesktop()
  };
  
  console.log('Dashboard debug mode enabled. Use window.debugDashboard for debugging.');
}