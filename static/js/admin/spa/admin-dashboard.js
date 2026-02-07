class AdminSpaDashboard {
  constructor() {
    this.client = new EndpointTestClient();
    this.activityChart = null;
    this.distributionChart = null;
    this.refreshInterval = null;
    this.loadDashboardData();
    this.startAutoRefresh();
    this.observeThemeChanges();
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

      console.log('[admin-spa] Dashboard payload:', {
        stats,
        recentCompanies,
        recentUsers,
        activityChart,
        distributionChart,
        performanceMetrics
      });

      this.updateStatsSection(stats, performanceMetrics);
      this.updateRecentCompaniesSection(recentCompanies);
      this.updateRecentUsersSection(recentUsers);
      this.updateActivityChart(activityChart);
      this.updateDistributionChart(distributionChart);
      this.updatePerformanceSection(performanceMetrics, activityChart, distributionChart);
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

  updatePerformanceSection(metrics, activityChart, distributionChart) {
    if (!metrics) return;

    this.updateElement('#systemCpu', this.formatPercent(metrics.cpu_usage));
    this.updateElement('#systemMemory', this.formatPercent(metrics.memory_usage));
    this.updateElement('#systemDisk', this.formatPercent(metrics.disk_usage));
    this.updateElement('#responseTime', this.formatValue(metrics.response_time, 'ms'));
    this.updateElement('#activeSessions', this.formatNumber(metrics.active_sessions));
    this.updateElement('#requestsPerMinute', this.formatNumber(metrics.requests_per_minute));

    const activityTop = this.findTopEntry(activityChart);
    const distributionTop = this.findTopEntry(distributionChart);

    if (activityTop) {
      this.updateElement('#topActivityLabel', activityTop.label);
      this.updateElement('#topActivityValue', `${this.formatNumber(activityTop.value)} eventos`);
    } else {
      this.updateElement('#topActivityLabel', 'Sin datos');
      this.updateElement('#topActivityValue', 'Sin actividad registrada');
    }

    if (distributionTop) {
      this.updateElement('#topDistributionLabel', distributionTop.label);
      this.updateElement('#topDistributionValue', `${this.formatNumber(distributionTop.value)} registros`);
    } else {
      this.updateElement('#topDistributionLabel', 'Sin datos');
      this.updateElement('#topDistributionValue', 'Sin distribucion registrada');
    }
  }

  updateRecentCompaniesSection(companies) {
    if (!Array.isArray(companies)) return;
    const container = document.querySelector('#recentEmpresasContainer');
    if (!container) return;

    if (companies.length === 0) {
      container.innerHTML = '<p class="text-center text-gray-600 dark:text-white/70 p-4">No hay empresas recientes</p>';
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
      companyElement.className = 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_12px_30px_rgba(0,0,0,0.12)] hover:bg-white/10 transition-colors overflow-hidden mb-3';
      companyElement.innerHTML = `
        <div class="flex items-center space-x-3 w-full min-w-0 sm:w-auto">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/80 to-indigo-600/80 flex items-center justify-center flex-shrink-0 text-white">
            <i class="fas fa-building"></i>
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-black dark:text-white truncate">${companyName}</p>
            <p class="text-xs sm:text-sm text-gray-600 dark:text-white/70 truncate">${companyType} • ${userCount} usuarios</p>
          </div>
        </div>
        <div class="w-full sm:w-auto text-left sm:text-right mt-3 sm:mt-0 shrink-0">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style="${this.getStatusBadgeStyle(isActive)}">
            ${isActive ? 'Activa' : 'Inactiva'}
          </span>
          <p class="text-[11px] text-gray-500 dark:text-white/60 mt-1">${new Date(createdDate).toLocaleDateString()}</p>
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
      container.innerHTML = '<p class="text-center text-gray-600 dark:text-white/70 p-4">No hay usuarios recientes</p>';
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
      userElement.className = 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_12px_30px_rgba(0,0,0,0.12)] hover:bg-white/10 transition-colors overflow-hidden mb-3';
      userElement.innerHTML = `
        <div class="flex items-center space-x-3 w-full min-w-0 sm:w-auto">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500/80 to-blue-600/80 flex items-center justify-center flex-shrink-0 text-white">
            <span class="font-semibold">${initials}</span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-black dark:text-white truncate">${userName}</p>
            <p class="text-xs sm:text-sm text-gray-600 dark:text-white/70 truncate">${userEmail}</p>
            <p class="text-[11px] text-gray-500 dark:text-white/60 truncate">${userCompany}</p>
          </div>
        </div>
        <div class="w-full sm:w-auto text-left sm:text-right mt-3 sm:mt-0 shrink-0">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style="${this.getStatusBadgeStyle(isActive)}">
            ${userRole}
          </span>
          <p class="text-[11px] text-gray-500 dark:text-white/60 mt-1">${new Date(createdDate).toLocaleDateString()}</p>
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

    const { textPrimary, gridColor } = this.getChartThemeColors();

    this.activityChart = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: textPrimary }, grid: { color: gridColor } },
          y: { beginAtZero: true, ticks: { color: textPrimary }, grid: { color: gridColor } }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { color: textPrimary }
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

    const { textPrimary } = this.getChartThemeColors();

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
              color: textPrimary
            }
          }
        }
      }
    });
  }

  observeThemeChanges() {
    const target = document.documentElement;
    if (!target || typeof MutationObserver === 'undefined') return;
    this.themeObserver = new MutationObserver(() => {
      this.applyChartTheme();
    });
    this.themeObserver.observe(target, { attributes: true, attributeFilter: ['class'] });
  }

  getChartThemeColors() {
    const root = document.documentElement;
    const body = document.body;
    const isDark = root.classList.contains('dark') || (body && body.classList.contains('dark'));
    if (isDark) {
      return { textPrimary: '#ffffff', gridColor: 'rgba(255,255,255,0.2)' };
    }
    return { textPrimary: '#0f172a', gridColor: '#e5e7eb' };
  }

  applyChartTheme() {
    const { textPrimary, gridColor } = this.getChartThemeColors();
    if (this.activityChart) {
      if (this.activityChart.options?.scales?.x?.ticks) {
        this.activityChart.options.scales.x.ticks.color = textPrimary;
      }
      if (this.activityChart.options?.scales?.y?.ticks) {
        this.activityChart.options.scales.y.ticks.color = textPrimary;
      }
      if (this.activityChart.options?.scales?.x?.grid) {
        this.activityChart.options.scales.x.grid.color = gridColor;
      }
      if (this.activityChart.options?.scales?.y?.grid) {
        this.activityChart.options.scales.y.grid.color = gridColor;
      }
      if (this.activityChart.options?.plugins?.legend?.labels) {
        this.activityChart.options.plugins.legend.labels.color = textPrimary;
      }
      this.activityChart.update();
    }

    if (this.distributionChart) {
      if (this.distributionChart.options?.plugins?.legend?.labels) {
        this.distributionChart.options.plugins.legend.labels.color = textPrimary;
      }
      this.distributionChart.update();
    }
  }

  updateElement(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = value;
    }
  }

  getStatusBadgeStyle(isActive) {
    if (isActive) {
      return 'background-color: rgba(16,185,129,0.85); color: #f0fdf4; border: 1px solid rgba(167,243,208,0.9); box-shadow: 0 0 10px rgba(16,185,129,0.45);';
    }
    return 'background-color: rgba(244,63,94,0.85); color: #fff1f2; border: 1px solid rgba(254,205,211,0.9); box-shadow: 0 0 10px rgba(244,63,94,0.45);';
  }


  findTopEntry(chartData) {
    if (!chartData || !Array.isArray(chartData.labels) || !chartData.datasets?.length) {
      return null;
    }

    const values = chartData.datasets[0]?.data || [];
    if (!values.length) return null;

    let maxIndex = 0;
    values.forEach((value, index) => {
      if (value > values[maxIndex]) {
        maxIndex = index;
      }
    });

    const label = chartData.labels[maxIndex] || 'Sin datos';
    return { label, value: values[maxIndex] || 0 };
  }

  formatPercent(value) {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '--';
    }
    return `${Number(value).toFixed(1)}%`;
  }

  formatValue(value, suffix) {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '--';
    }
    return `${Number(value).toFixed(0)}${suffix}`;
  }

  formatNumber(value) {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '--';
    }
    return Number(value).toLocaleString('es-CO');
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
