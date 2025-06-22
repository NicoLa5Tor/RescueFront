// dashboard.js - Main Dashboard Initialization
(function() {
    'use strict';
  
    // Dashboard initialization
    let dashboard = null;
    let initializationAttempts = 0;
    const maxAttempts = 3;
  
    // Initialize dashboard when DOM is ready
    function initializeDashboard() {
      if (dashboard) return; // Already initialized
  
      try {
        console.log('🚀 Initializing Dashboard System...');
        
        // Check if core class is available
        if (typeof DashboardCore === 'undefined') {
          throw new Error('DashboardCore class not found');
        }
  
        // Create dashboard instance
        dashboard = new DashboardCore();
        
        // Make globally available
        window.dashboard = dashboard;
  
        // Setup global error handling
        setupErrorHandling();
  
        // Setup performance monitoring
        setupPerformanceMonitoring();
  
        console.log('✅ Dashboard System initialized successfully');
  
      } catch (error) {
        initializationAttempts++;
        console.error(`❌ Dashboard initialization failed (attempt ${initializationAttempts}):`, error);
        
        if (initializationAttempts < maxAttempts) {
          console.log(`🔄 Retrying initialization in 1 second...`);
          setTimeout(initializeDashboard, 1000);
        } else {
          console.error('❌ Max initialization attempts reached, using fallback mode');
          initializeFallbackMode();
        }
      }
    }
  
    // Fallback mode for when main initialization fails
    function initializeFallbackMode() {
      console.log('🔧 Initializing fallback dashboard mode...');
      
      // Create minimal dashboard object
      window.dashboard = {
        initialized: false,
        fallbackMode: true,
        
        // Basic sidebar control
        sidebar: {
          toggle: () => toggleSidebarFallback(),
          open: () => openSidebarFallback(),
          close: () => closeSidebarFallback(),
          isOpen: () => !document.getElementById('sidebar')?.classList.contains('sidebar--closed')
        },
        
        // Basic theme control
        theme: {
          toggle: () => toggleThemeFallback(),
          set: (theme) => setThemeFallback(theme),
          get: () => document.documentElement.classList.contains('dark') ? 'dark' : 'light'
        },
        
        // Basic notifications
        notifications: {
          show: (message, type = 'info') => {
            if (window.Swal) {
              const toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
              });
              toast.fire({ icon: type, title: message });
            } else {
              console.log(`${type.toUpperCase()}: ${message}`);
            }
          }
        },
        
        // Basic actions
        handleQuickAction: (action) => {
          console.log(`Quick action: ${action}`);
          window.dashboard.notifications.show('Funcionalidad disponible próximamente', 'info');
        }
      };
  
      // Initialize basic functionality
      initializeBasicSidebar();
      initializeBasicTheme();
      loadDemoDataFallback();
      
      console.log('✅ Fallback dashboard mode initialized');
    }
  
    // Basic sidebar functionality
    function initializeBasicSidebar() {
      const menuToggle = document.querySelector('.navbar__menu-toggle');
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebarOverlay');
  
      if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', (e) => {
          e.preventDefault();
          toggleSidebarFallback();
        });
      }
  
      if (overlay) {
        overlay.addEventListener('click', () => {
          closeSidebarFallback();
        });
      }
  
      // Close on escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeSidebarFallback();
        }
      });
    }
  
    function toggleSidebarFallback() {
      const sidebar = document.getElementById('sidebar');
      if (!sidebar) return;
  
      const isOpen = !sidebar.classList.contains('sidebar--closed');
      if (isOpen) {
        closeSidebarFallback();
      } else {
        openSidebarFallback();
      }
    }
  
    function openSidebarFallback() {
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebarOverlay');
      
      if (!sidebar || window.innerWidth >= 1024) return;
  
      sidebar.classList.remove('sidebar--closed');
      sidebar.classList.add('sidebar--open');
      
      if (overlay) {
        overlay.classList.add('sidebar__overlay--visible');
      }
  
      document.body.classList.add('body-no-scroll');
    }
  
    function closeSidebarFallback() {
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
  
    // Basic theme functionality
    function initializeBasicTheme() {
      const themeToggle = document.getElementById('themeToggle');
      if (themeToggle) {
        themeToggle.addEventListener('click', () => {
          toggleThemeFallback();
        });
      }
  
      // Initialize theme icon
      updateThemeIconFallback();
    }
  
    function toggleThemeFallback() {
      const html = document.documentElement;
      const isDark = html.classList.contains('dark');
  
      if (isDark) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      }
  
      updateThemeIconFallback();
      
      if (window.dashboard?.notifications) {
        window.dashboard.notifications.show(`Tema ${isDark ? 'claro' : 'oscuro'} activado`, 'success');
      }
    }
  
    function setThemeFallback(theme) {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', theme);
      updateThemeIconFallback();
    }
  
    function updateThemeIconFallback() {
      const themeIcon = document.getElementById('themeIcon');
      if (!themeIcon) return;
  
      const isDark = document.documentElement.classList.contains('dark');
      if (isDark) {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
      } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
      }
    }
  
    // Load demo data in fallback mode
    function loadDemoDataFallback() {
      // Remove skeletons
      setTimeout(() => {
        document.querySelectorAll('.skeleton').forEach(el => el.remove());
      }, 1000);
  
      // Basic stats
      const stats = {
        totalEmpresasCount: 24,
        totalUsersCount: 156,
        activeEmpresasCount: 22,
        activeUsersCount: 142,
        empresaMembersCount: 18,
        avgPerformanceCount: 6.5
      };
  
      Object.entries(stats).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
          element.textContent = value;
        }
      });
  
      // Basic navigation
      const nav = document.getElementById('sidebarNav');
      if (nav) {
        nav.innerHTML = `
          <a href="/admin" class="sidebar__link sidebar__link--active">
            <div class="sidebar__link-icon"><i class="fas fa-th-large"></i></div>
            <span class="sidebar__link-text">Dashboard</span>
          </a>
          <a href="/admin/users" class="sidebar__link">
            <div class="sidebar__link-icon"><i class="fas fa-users"></i></div>
            <span class="sidebar__link-text">Usuarios</span>
          </a>
          <a href="/admin/stats" class="sidebar__link">
            <div class="sidebar__link-icon"><i class="fas fa-chart-line"></i></div>
            <span class="sidebar__link-text">Estadísticas</span>
          </a>
        `;
      }
  
      // Basic quick actions
      const quickActions = document.getElementById('quickActionsGrid');
      if (quickActions) {
        quickActions.innerHTML = `
          <button onclick="window.dashboard?.handleQuickAction('create-user')" class="quick-action-btn p-4 rounded-xl border-2 border-dashed border-purple-300 hover:border-purple-500 transition-all">
            <div class="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <i class="fas fa-user-plus text-xl"></i>
            </div>
            <h4 class="font-semibold">Nuevo Usuario</h4>
            <p class="text-xs text-gray-500 mt-1">Registrar usuario</p>
          </button>
          <button onclick="window.dashboard?.handleQuickAction('generate-report')" class="quick-action-btn p-4 rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-500 transition-all">
            <div class="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <i class="fas fa-file-chart-line text-xl"></i>
            </div>
            <h4 class="font-semibold">Generar Reporte</h4>
            <p class="text-xs text-gray-500 mt-1">Crear informe</p>
          </button>
          <button onclick="window.dashboard?.handleQuickAction('system-info')" class="quick-action-btn p-4 rounded-xl border-2 border-dashed border-green-300 hover:border-green-500 transition-all">
            <div class="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-xl bg-green-100 text-green-600">
              <i class="fas fa-info-circle text-xl"></i>
            </div>
            <h4 class="font-semibold">Info Sistema</h4>
            <p class="text-xs text-gray-500 mt-1">Ver detalles</p>
          </button>
          <button onclick="window.dashboard?.handleQuickAction('settings')" class="quick-action-btn p-4 rounded-xl border-2 border-dashed border-orange-300 hover:border-orange-500 transition-all">
            <div class="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <i class="fas fa-cog text-xl"></i>
            </div>
            <h4 class="font-semibold">Configuración</h4>
            <p class="text-xs text-gray-500 mt-1">Ajustes</p>
          </button>
        `;
      }
    }
  
    // Error handling setup
    function setupErrorHandling() {
      // Global error handler
      window.addEventListener('error', (e) => {
        console.error('💥 Global error:', e.error);
        
        if (dashboard?.notifications) {
          dashboard.notifications.show('Ha ocurrido un error inesperado', 'error');
        }
      });
  
      // Unhandled promise rejection handler
      window.addEventListener('unhandledrejection', (e) => {
        console.error('💥 Unhandled promise rejection:', e.reason);
        
        if (dashboard?.notifications) {
          dashboard.notifications.show('Error de conexión', 'error');
        }
      });
    }
  
    // Performance monitoring
    function setupPerformanceMonitoring() {
      if (!window.performance) return;
  
      // Monitor page load performance
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0];
          if (perfData) {
            console.log('📊 Page Performance:', {
              'DOM Content Loaded': Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart) + 'ms',
              'Load Complete': Math.round(perfData.loadEventEnd - perfData.fetchStart) + 'ms',
              'First Paint': Math.round(perfData.loadEventEnd - perfData.fetchStart) + 'ms'
            });
          }
        }, 0);
      });
  
      // Monitor memory usage (if available)
      if (performance.memory) {
        setInterval(() => {
          const memory = performance.memory;
          if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
            console.warn('⚠️ High memory usage detected');
          }
        }, 30000); // Check every 30 seconds
      }
    }
  
    // Resize handler for responsive behavior
    function setupResponsiveHandlers() {
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          // Close sidebar on desktop
          if (window.innerWidth >= 1024) {
            closeSidebarFallback();
          }
  
          // Emit resize event
          window.dispatchEvent(new CustomEvent('dashboard:resize', {
            detail: {
              width: window.innerWidth,
              height: window.innerHeight,
              isMobile: window.innerWidth < 768,
              isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
              isDesktop: window.innerWidth >= 1024
            }
          }));
        }, 250);
      });
    }
  
    // Cleanup function
    function cleanup() {
      if (dashboard && typeof dashboard.destroy === 'function') {
        dashboard.destroy();
      }
      
      // Clean up global variables
      window.dashboard = null;
      dashboard = null;
      
      console.log('🧹 Dashboard cleanup completed');
    }
  
    // Expose global functions for backward compatibility
    window.toggleSidebar = () => window.dashboard?.sidebar?.toggle() || toggleSidebarFallback();
    window.openSidebar = () => window.dashboard?.sidebar?.open() || openSidebarFallback();
    window.closeSidebar = () => window.dashboard?.sidebar?.close() || closeSidebarFallback();
  
    // Debug functions (development only)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      window.debugDashboard = {
        instance: () => window.dashboard,
        reinitialize: () => {
          cleanup();
          initializeDashboard();
        },
        fallbackMode: () => {
          cleanup();
          initializeFallbackMode();
        },
        performance: () => {
          if (performance.getEntriesByType) {
            return {
              navigation: performance.getEntriesByType('navigation')[0],
              resources: performance.getEntriesByType('resource'),
              memory: performance.memory
            };
          }
        }
      };
      console.log('🐛 Debug mode enabled. Use window.debugDashboard for debugging.');
    }
  
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeDashboard);
    } else {
      // DOM is already ready
      initializeDashboard();
    }
  
    // Setup responsive handlers
    setupResponsiveHandlers();
  
    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
  
    // Expose main initialization function
    window.initializeDashboard = initializeDashboard;
  
  })();