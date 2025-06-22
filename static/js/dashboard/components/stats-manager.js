class StatsManager {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.grid = document.getElementById('statsGrid');
    this.renderStatsCards();
  }

  renderStatsCards() {
    if (!this.grid) return;
    const stats = [
      { id: 'totalEmpresas', title: 'Total Empresas', icon: 'fa-building', subtitle: 'activas', subtitleId: 'activeEmpresas', adminOnly: true },
      { id: 'totalUsers', title: 'Total Usuarios', icon: 'fa-users', subtitle: 'activos', subtitleId: 'activeUsers' },
      { id: 'empresaInfo', title: 'Mi Empresa', icon: 'fa-home', subtitle: 'miembros', subtitleId: 'empresaMembers', empresaOnly: true },
      { id: 'performance', title: 'Rendimiento', icon: 'fa-chart-line', subtitle: 'promedio por empresa', subtitleId: 'avgPerformance', adminOnly: true }
    ];
    this.grid.innerHTML = stats.map(s => this.createStatsCard(s)).join('');
  }

  createStatsCard(stat) {
    return `
      <div class="stats-card glass-card p-4 sm:p-6 ${stat.adminOnly ? 'admin-only' : ''} ${stat.empresaOnly ? 'empresa-only' : ''}" data-stat-id="${stat.id}">
        <div class="flex items-center justify-between mb-2">
          <div class="stats-icon w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <i class="fas ${stat.icon}"></i>
          </div>
        </div>
        <h3 class="text-xs font-medium text-gray-500">${stat.title}</h3>
        <p class="text-xl font-bold text-gray-900" id="${stat.id}Count">0</p>
        <p class="text-xs text-gray-500">
          <span class="font-semibold text-purple-600" id="${stat.subtitleId}Count">0</span>
          ${stat.subtitle}
        </p>
      </div>`;
  }

  update(data) {
    Object.entries(data).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });
  }

  animate() {
    if (typeof gsap !== 'undefined') {
      gsap.fromTo('.stats-card', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 });
    }
  }
}

window.StatsManager = StatsManager;
