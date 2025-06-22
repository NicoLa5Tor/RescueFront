class ChartManager {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.charts = {};
    this.initialize();
  }

  initialize() {
    this.createActivityChart();
    this.createDistributionChart();
  }

  createActivityChart() {
    const ctx = document.getElementById('dashboardChart')?.getContext('2d');
    if (!ctx || typeof Chart === 'undefined') return;
    if (this.charts.activity) this.charts.activity.destroy();
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(147,51,234,0.4)');
    gradient.addColorStop(1, 'rgba(147,51,234,0.01)');
    this.charts.activity = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
        datasets: [{
          label: 'Usuarios Activos',
          data: [65, 78, 90, 85, 92, 88, 95],
          borderColor: 'rgb(147,51,234)',
          backgroundColor: gradient,
          tension: 0.4,
          fill: true,
          pointRadius: 3
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  createDistributionChart() {
    const ctx = document.getElementById('distributionChart')?.getContext('2d');
    if (!ctx || typeof Chart === 'undefined') return;
    if (this.charts.distribution) this.charts.distribution.destroy();
    this.charts.distribution = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Premium', 'Estándar', 'Pro', 'Básicos'],
        datasets: [{
          data: [35, 25, 25, 15],
          backgroundColor: [
            'rgba(147,51,234,0.8)',
            'rgba(59,130,246,0.8)',
            'rgba(34,197,94,0.8)',
            'rgba(251,146,60,0.8)'
          ],
          borderWidth: 1
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  refresh() {
    this.createActivityChart();
    this.createDistributionChart();
  }

  expand(chartId) { console.log('Expand chart', chartId); }
  download(chartId) { console.log('Download chart', chartId); }

  destroy() {
    Object.values(this.charts).forEach(ch => ch?.destroy());
  }
}

window.ChartManager = ChartManager;
