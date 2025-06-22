class ChartManager {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.charts = {};
    this.loadCharts();
  }

  async loadCharts() {
    await Promise.all([
      this.createActivityChart(),
      this.createDistributionChart()
    ]);
  }

  async createActivityChart() {
    const ctx = document.getElementById('dashboardChart')?.getContext('2d');
    if (!ctx || typeof Chart === 'undefined') return;
    if (this.charts.activity) this.charts.activity.destroy();

    try {
      const empresaId = this.dashboard.currentUser?.getEmpresaId?.();
      const data = await window.apiClient.getActivityData(empresaId);

      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, 'rgba(147,51,234,0.4)');
      gradient.addColorStop(1, 'rgba(147,51,234,0.01)');

      this.charts.activity = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.labels || [],
          datasets: [{
            label: data.label || 'Actividad',
            data: data.values || [],
            borderColor: 'rgb(147,51,234)',
            backgroundColor: gradient,
            tension: 0.4,
            fill: true,
            pointRadius: 3
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    } catch (error) {
      console.error('Activity chart error:', error);
    }
  }

  async createDistributionChart() {
    const ctx = document.getElementById('distributionChart')?.getContext('2d');
    if (!ctx || typeof Chart === 'undefined') return;
    if (this.charts.distribution) this.charts.distribution.destroy();

    try {
      const data = await window.apiClient.getDistributionData();
      this.charts.distribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: data.labels || ['Empresas Registradas'],
          datasets: [{
            data: data.values || [data.total || 0],
            backgroundColor: ['rgba(147,51,234,0.8)'],
            borderWidth: 1
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    } catch (error) {
      console.error('Distribution chart error:', error);
    }
  }

  refresh() {
    this.loadCharts();
  }

  expand(chartId) { console.log('Expand chart', chartId); }
  download(chartId) { console.log('Download chart', chartId); }

  destroy() {
    Object.values(this.charts).forEach(ch => ch?.destroy());
  }
}

window.ChartManager = ChartManager;
