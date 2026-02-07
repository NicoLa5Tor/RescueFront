class AdminSpaDashboard {
  constructor() {
    this.client = new EndpointTestClient();
    this.activityChart = null;
    this.distributionChart = null;
    this.refreshInterval = null;
    this.loadDashboardData();
    this.startAutoRefresh();
  }

  isAuthenticated() {
    return Boolean(window.currentUser && window.currentUser.id);
  }

  startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      this.loadDashboardData();
    }, 30000);
  }

  async loadDashboardData() {
    if (!this.isAuthenticated()) {
      this.showLoginRequired();
      return;
    }

    this.setConnectionStatus('loading');

    try {
      const [
        stats,
        recentCompanies,
        recentUsers,
        activityChart,
        distributionChart,
        performanceMetrics
      ] = await Promise.all([
        this.loadStats(),
        this.loadRecentCompanies(),
        this.loadRecentUsers(),
        this.loadActivityChart(),
        this.loadDistributionChart(),
        this.loadPerformanceMetrics()
      ]);

      this.updateStatsSection(stats, performanceMetrics);
      this.updateRecentCompaniesSection(recentCompanies);
      this.updateRecentUsersSection(recentUsers);
      this.updateActivityChart(activityChart);
      this.updateDistributionChart(distributionChart);
      this.hideLoginRequired();
      this.setConnectionStatus('ok');
    } catch (error) {
      this.showErrorMessage('Error cargando datos del dashboard.');
      this.setConnectionStatus('error');
    }
  }

  async loadStats() {
    const response = await this.client.get_super_admin_dashboard_stats();
    if (!response.ok) {
      this.handleApiError(response);
      return null;
    }
    const result = await response.json();
    return result.data || result;
  }

  async loadRecentCompanies() {
    const response = await this.client.get_super_admin_recent_companies();
    if (!response.ok) {
      this.handleApiError(response);
      return [];
    }
    const result = await response.json();
    return result.data || result;
  }

  async loadRecentUsers() {
    const response = await this.client.get_super_admin_recent_users();
    if (!response.ok) {
      this.handleApiError(response);
      return [];
    }
    const result = await response.json();
    return result.data || result;
  }

  async loadActivityChart() {
    const response = await this.client.get_super_admin_activity_chart();
    if (!response.ok) {
      this.handleApiError(response);
      return null;
    }
    const result = await response.json();
    return result.data || result;
  }

  async loadDistributionChart() {
    const response = await this.client.get_super_admin_distribution_chart();
    if (!response.ok) {
      this.handleApiError(response);
      return null;
    }
    const result = await response.json();
    return result.data || result;
  }

  async loadPerformanceMetrics() {
    const response = await this.client.get_super_admin_performance_metrics();
    if (!response.ok) {
      this.handleApiError(response);
      return null;
    }
    const result = await response.json();
    return result.data || result;
  }

  updateStatsSection(stats, performanceMetrics) {
    if (!stats) return;

    const totalEmpresas =
      stats.total_empresas ||
      stats.totalEmpresas ||
      stats.total_companies ||
      0;
    const activeEmpresas =
      stats.active_empresas ||
      stats.activeEmpresas ||
      stats.active_companies ||
      0;
    const totalUsers =
      stats.total_users ||
      stats.totalUsers ||
      stats.total_usuarios ||
      0;
    const activeUsers =
      stats.active_users ||
      stats.activeUsers ||
      stats.usuarios_activos ||
      0;
    const totalHardware =
      stats.total_hardware ||
      stats.totalHardware ||
      0;
    const availableHardware =
      stats.available_hardware ||
      stats.availableHardware ||
      0;
    const performance =
      stats.performance ||
      stats.performanceValue ||
      (performanceMetrics && performanceMetrics.performance) ||
      0;
    const avgPerformance =
      stats.avg_performance ||
      stats.avgPerformance ||
      (performanceMetrics && performanceMetrics.avg_performance) ||
      0;

    this.updateElement('#totalEmpresasCount', totalEmpresas);
    this.updateElement('#activeEmpresasCount', activeEmpresas);
    this.updateElement('#totalUsersCount', totalUsers);
    this.updateElement('#activeUsersCount', activeUsers);
    this.updateElement('#totalHardwareCount', totalHardware);
    this.updateElement('#availableHardwareCount', availableHardware);
    this.updateElement('#performanceCount', performance);
    this.updateElement('#avgPerformanceCount', avgPerformance);
  }

  updateRecentCompaniesSection(companies) {
    if (!Array.isArray(companies)) return;
    const container = document.querySelector('#recentEmpresasContainer');
    if (!container) return;

    if (companies.length === 0) {
      container.innerHTML = '<p class="text-center text-gray-500 p-4">No hay empresas recientes</p>';
      return;
    }

    container.innerHTML = '';
    companies.forEach(company => {
      const companyName = company.nombre || company.name || 'Sin nombre';
      const companyType = company.tipo_empresa || company.industry || 'Sin tipo';
      const userCount = company.total_usuarios || company.members_count || 0;
      const isActive = company.activa !== undefined ? company.activa : (company.status === 'active');
      const createdDate = company.fecha_creacion || company.created_at || new Date();

      const companyElement = document.createElement('div');
      companyElement.className = 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-3';
      companyElement.innerHTML = `
        <div class="flex items-center space-x-3 w-full sm:w-auto">
          <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
            <i class="fas fa-building text-purple-600 dark:text-purple-400"></i>
          </div>
          <div class="min-w-0">
            <p class="font-medium text-black dark:text-white truncate">${companyName}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">${companyType} • ${userCount} usuarios</p>
          </div>
        </div>
        <div class="w-full sm:w-auto text-left sm:text-right mt-3 sm:mt-0">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isActive
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }">
            ${isActive ? 'Activa' : 'Inactiva'}
          </span>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${new Date(createdDate).toLocaleDateString()}</p>
        </div>
      `;
      container.appendChild(companyElement);
    });
  }

  updateRecentUsersSection(users) {
    if (!Array.isArray(users)) return;
    const container = document.querySelector('#recentUsersContainer');
    if (!container) return;

    if (users.length === 0) {
      container.innerHTML = '<p class="text-center text-gray-500 p-4">No hay usuarios recientes</p>';
      return;
    }

    container.innerHTML = '';
    users.forEach(user => {
      const userName = user.nombre || user.name || 'Sin nombre';
      const userEmail = user.email || 'Sin email';
      const userCompany = user.empresa_nombre || user.company || 'Sin empresa';
      const userRole = user.rol || user.role || 'Usuario';
      const isActive = user.activo !== undefined ? user.activo : (user.status === 'active');
      const createdDate = user.fecha_creacion || user.joined_at || new Date();
      const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase();

      const userElement = document.createElement('div');
      userElement.className = 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-3';
      userElement.innerHTML = `
        <div class="flex items-center space-x-3 w-full sm:w-auto">
          <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
            <span class="font-medium text-blue-600 dark:text-blue-400">${initials}</span>
          </div>
          <div class="min-w-0">
            <p class="font-medium text-black dark:text-white truncate">${userName}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 truncate">${userEmail}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">${userCompany}</p>
          </div>
        </div>
        <div class="w-full sm:w-auto text-left sm:text-right mt-3 sm:mt-0">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isActive
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }">
            ${userRole}
          </span>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${new Date(createdDate).toLocaleDateString()}</p>
        </div>
      `;
      container.appendChild(userElement);
    });
  }

  updateActivityChart(data) {
    const ctx = document.getElementById('dashboardChart');
    if (!ctx || typeof Chart === 'undefined' || !data) return;

    const labels = data.labels || [];
    const datasets = data.datasets || [{
      label: 'Actividad',
      data: data.values || [],
      backgroundColor: 'rgba(75, 192, 192, 0.7)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1
    }];

    if (this.activityChart) {
      this.activityChart.destroy();
    }

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const gridColor = isDark ? '#374151' : '#e5e7eb';

    this.activityChart = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: textColor }, grid: { color: gridColor } },
          y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { color: textColor }
          }
        }
      }
    });
  }

  updateDistributionChart(data) {
    const ctx = document.getElementById('distributionChart');
    if (!ctx || typeof Chart === 'undefined' || !data) return;

    const labels = data.labels || [];
    const datasets = data.datasets || [{
      data: data.values || [],
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF',
        '#FF9F40',
        '#C9CBCF'
      ]
    }];

    if (this.distributionChart) {
      this.distributionChart.destroy();
    }

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#e5e7eb' : '#374151';

    this.distributionChart = new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              color: textColor
            }
          }
        }
      }
    });
  }

  updateElement(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = value;
    }
  }

  setConnectionStatus(state) {
    const indicator = document.getElementById('connectionIndicator');
    const text = document.getElementById('connectionText');
    const time = document.getElementById('lastUpdateTime');

    if (!indicator || !text || !time) return;

    if (state === 'ok') {
      indicator.className = 'w-2 h-2 rounded-full bg-green-500';
      text.textContent = 'Conectado';
    } else if (state === 'error') {
      indicator.className = 'w-2 h-2 rounded-full bg-red-500';
      text.textContent = 'Sin conexion';
    } else {
      indicator.className = 'w-2 h-2 rounded-full bg-yellow-400';
      text.textContent = 'Sincronizando';
    }

    time.textContent = new Date().toLocaleTimeString();
  }

  showErrorMessage(message) {
    const errorContainer = document.querySelector('#error-message');
    const errorText = document.querySelector('#error-message-text');
    if (!errorContainer) return;
    if (errorText) {
      errorText.textContent = message;
    }
    errorContainer.style.display = 'block';
    setTimeout(() => {
      errorContainer.style.display = 'none';
    }, 5000);
  }

  showLoginRequired() {
    const loginContainer = document.querySelector('#login-required');
    if (loginContainer) {
      loginContainer.style.display = 'block';
    }
  }

  hideLoginRequired() {
    const loginContainer = document.querySelector('#login-required');
    if (loginContainer) {
      loginContainer.style.display = 'none';
    }
  }

  handleApiError(response) {
    if (response.status === 401 || response.status === 403) {
      this.showLoginRequired();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('[data-admin-spa]');
  if (!container) return;
  window.adminSpaDashboard = new AdminSpaDashboard();
});
