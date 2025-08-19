/**
 * Super Admin Dashboard - Real Data Integration
 * Manages loading and displaying real data from backend endpoints
 */

class SuperAdminDashboard {
    constructor() {
        this.client = null;
        this.token = null;
        this.activityChart = null;
        this.distributionChart = null;
        this.initializeClient();
    }

    initializeClient() {
        // Initialize API client with proxy
        this.client = new EndpointTestClient('/proxy');
        
        // No necesitamos manejar tokens manualmente con cookies
        console.log('Using cookie-based authentication');
    }

    isAuthenticated() {
        // Check if user data exists (means authenticated)
        // We can't check HTTPOnly cookies from JavaScript
        return window.currentUser && window.currentUser.id;
    }

    async loadDashboardData() {
        console.log('🔄 Loading Super Admin Dashboard data...');
        
        // Check if user is authenticated
        if (!this.isAuthenticated()) {
            console.warn('⚠️ No valid authentication cookie found. Redirecting to login.');
            this.redirectToLogin();
            return;
        }
        
        try {
            console.log('🚀 Starting concurrent API calls...');
            
            // Load all dashboard sections concurrently
            const [
                stats,
                recentCompanies,
                recentUsers,
                activityChart,
                distributionChart,
                hardwareStats,
                performanceMetrics
            ] = await Promise.all([
                this.loadStats(),
                this.loadRecentCompanies(),
                this.loadRecentUsers(),
                this.loadActivityChart(),
                this.loadDistributionChart(),
                this.loadHardwareStats(),
                this.loadPerformanceMetrics()
            ]);

            console.log('📦 All API calls completed. Results:');
            console.log('Stats:', stats);
            console.log('Recent Companies:', recentCompanies);
            console.log('Recent Users:', recentUsers);
            console.log('Activity Chart:', activityChart);
            console.log('Distribution Chart:', distributionChart);
            console.log('Hardware Stats:', hardwareStats);
            console.log('Performance Metrics:', performanceMetrics);

            console.log('🔄 Updating UI sections...');
            
            // Update all sections
            this.updateStatsSection(stats);
            this.updateRecentCompaniesSection(recentCompanies);
            this.updateRecentUsersSection(recentUsers);
            this.updateActivityChart(activityChart);
            this.updateDistributionChart(distributionChart);
            this.updateHardwareSection(hardwareStats);
            this.updatePerformanceSection(performanceMetrics);

            // Hide login required message if it's showing
            this.hideLoginRequired();

            console.log('✅ Super Admin Dashboard data loaded successfully');
            
        } catch (error) {
            console.error('❌ Error loading dashboard data:', error);
            this.showErrorMessage('Error loading dashboard data. Please try again.');
        }
    }

    async loadStats() {
        try {
            console.log('📊 Loading dashboard stats...');
            const response = await this.client.get_super_admin_dashboard_stats();
            if (response.ok) {
                const result = await response.json();
                console.log('📊 Dashboard stats response:', result);
                // Extract data from the wrapper object
                const data = result.data || result;
                console.log('📊 Extracted stats data:', data);
                return data;
            }
            console.error('📊 Stats API error:', response.status, response.statusText);
            this.handleApiError(response, 'loadStats');
            return null;
        } catch (error) {
            console.error('📊 Error loading stats:', error);
            this.showErrorMessage('Error de conexión cargando estadísticas.');
            return null;
        }
    }

    async loadRecentCompanies() {
        try {
            console.log('🏢 Loading recent companies...');
            const response = await this.client.get_super_admin_recent_companies();
            if (response.ok) {
                const result = await response.json();
                console.log('🏢 Recent companies response:', result);
                // Extract data from the wrapper object
                const data = result.data || result;
                console.log('🏢 Extracted companies data:', data);
                return data;
            }
            console.error('🏢 Recent companies API error:', response.status, response.statusText);
            this.handleApiError(response, 'loadRecentCompanies');
            return [];
        } catch (error) {
            console.error('🏢 Error loading recent companies:', error);
            this.showErrorMessage('Error de conexión cargando empresas recientes.');
            return [];
        }
    }

    async loadRecentUsers() {
        try {
            console.log('👥 Loading recent users...');
            const response = await this.client.get_super_admin_recent_users();
            if (response.ok) {
                const result = await response.json();
                console.log('👥 Recent users response:', result);
                // Extract data from the wrapper object
                const data = result.data || result;
                console.log('👥 Extracted users data:', data);
                return data;
            }
            console.error('👥 Recent users API error:', response.status, response.statusText);
            this.handleApiError(response, 'loadRecentUsers');
            return [];
        } catch (error) {
            console.error('👥 Error loading recent users:', error);
            this.showErrorMessage('Error de conexión cargando usuarios recientes.');
            return [];
        }
    }

    async loadActivityChart() {
        try {
            console.log('📈 Loading activity chart...');
            const response = await this.client.get_super_admin_activity_chart();
            if (response.ok) {
                const result = await response.json();
                console.log('📈 Activity chart response:', result);
                // Extract data from the wrapper object
                const data = result.data || result;
                console.log('📈 Extracted activity chart data:', data);
                return data;
            }
            console.error('📈 Activity chart API error:', response.status, response.statusText);
            this.handleApiError(response, 'loadActivityChart');
            return null;
        } catch (error) {
            console.error('📈 Error loading activity chart:', error);
            this.showErrorMessage('Error de conexión cargando gráfico de actividad.');
            return null;
        }
    }

    async loadDistributionChart() {
        try {
            console.log('🍩 Loading distribution chart...');
            const response = await this.client.get_super_admin_distribution_chart();
            if (response.ok) {
                const result = await response.json();
                console.log('🍩 Distribution chart response:', result);
                // Extract data from the wrapper object
                const data = result.data || result;
                console.log('🍩 Extracted distribution chart data:', data);
                return data;
            }
            console.error('🍩 Distribution chart API error:', response.status, response.statusText);
            this.handleApiError(response, 'loadDistributionChart');
            return null;
        } catch (error) {
            console.error('🍩 Error loading distribution chart:', error);
            this.showErrorMessage('Error de conexión cargando gráfico de distribución.');
            return null;
        }
    }

    async loadHardwareStats() {
        try {
            console.log('💻 Loading hardware stats...');
            const response = await this.client.get_super_admin_hardware_stats();
            if (response.ok) {
                const result = await response.json();
                console.log('💻 Hardware stats response:', result);
                // Extract data from the wrapper object
                const data = result.data || result;
                console.log('💻 Extracted hardware stats data:', data);
                return data;
            }
            console.error('💻 Hardware stats API error:', response.status, response.statusText);
            this.handleApiError(response, 'loadHardwareStats');
            return null;
        } catch (error) {
            console.error('💻 Error loading hardware stats:', error);
            this.showErrorMessage('Error de conexión cargando estadísticas de hardware.');
            return null;
        }
    }

    async loadPerformanceMetrics() {
        try {
            console.log('⚡ Loading performance metrics...');
            const response = await this.client.get_super_admin_performance_metrics();
            if (response.ok) {
                const result = await response.json();
                console.log('⚡ Performance metrics response:', result);
                // Extract data from the wrapper object
                const data = result.data || result;
                console.log('⚡ Extracted performance metrics data:', data);
                return data;
            }
            console.error('⚡ Performance metrics API error:', response.status, response.statusText);
            this.handleApiError(response, 'loadPerformanceMetrics');
            return null;
        } catch (error) {
            console.error('⚡ Error loading performance metrics:', error);
            this.showErrorMessage('Error de conexión cargando métricas de rendimiento.');
            return null;
        }
    }

    // Update methods for each section
    updateStatsSection(stats) {
        if (!stats) return;

        console.log('Updating stats section with:', stats);

       
        // Update summary statistics - support different naming conventions
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
            0;
        const avgPerformance =
            stats.avg_performance ||
            stats.avgPerformance ||
            0;
        
      
        
        this.updateElement('#totalEmpresasCount', totalEmpresas);
        this.updateElement('#activeEmpresasCount', activeEmpresas);
        this.updateElement('#totalUsersCount', totalUsers);
        this.updateElement('#activeUsersCount', activeUsers);
        this.updateElement('#totalHardwareCount', totalHardware);
        this.updateElement('#availableHardwareCount', availableHardware);
        
        console.log('About to update performance metrics:', { performance, avgPerformance });
        this.updateElement('#performanceCount', performance);
        this.updateElement('#avgPerformanceCount', avgPerformance);
        
        console.log('Stats section update completed');
        
        // Force refresh to ensure values are visible
        setTimeout(() => {
            console.log('Checking final values:');
            console.log('performanceCount element:', document.querySelector('#performanceCount')?.textContent);
            console.log('avgPerformanceCount element:', document.querySelector('#avgPerformanceCount')?.textContent);
        }, 100);
    }

    updateRecentCompaniesSection(companies) {
        if (!companies || !Array.isArray(companies)) return;

        console.log('Updating recent companies with:', companies);

        const container = document.querySelector('#recentEmpresasContainer');
        if (!container) return;

        container.innerHTML = '';

        companies.forEach(company => {
            const companyElement = document.createElement('div');
            companyElement.className = 'flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-3';
            
            // Handle different data structures
            const companyName = company.nombre || company.name || 'Sin nombre';
            const companyType = company.tipo_empresa || company.industry || 'Sin tipo';
            const userCount = company.total_usuarios || company.members_count || 0;
            const isActive = company.activa !== undefined ? company.activa : (company.status === 'active');
            const createdDate = company.fecha_creacion || company.created_at || new Date();
            
            companyElement.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                        <i class="fas fa-building text-purple-600 dark:text-purple-400"></i>
                    </div>
                    <div>
                        <p class="font-medium text-black dark:text-white">${companyName}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">${companyType} • ${userCount} usuarios</p>
                    </div>
                </div>
                <div class="text-right">
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
        if (!users || !Array.isArray(users)) return;

        console.log('Updating recent users with:', users);

        const container = document.querySelector('#recentUsersContainer');
        if (!container) return;

        container.innerHTML = '';

        users.forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = 'flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-3';
            
            // Handle different data structures
            const userName = user.nombre || user.name || 'Sin nombre';
            const userEmail = user.email || 'Sin email';
            const userCompany = user.empresa_nombre || user.company || 'Sin empresa';
            const userRole = user.rol || user.role || 'Usuario';
            const isActive = user.activo !== undefined ? user.activo : (user.status === 'active');
            const createdDate = user.fecha_creacion || user.joined_at || new Date();
            
            // Generate initials safely
            const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase();
            
            userElement.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span class="font-medium text-blue-600 dark:text-blue-400">${initials}</span>
                    </div>
                    <div>
                        <p class="font-medium text-black dark:text-white">${userName}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">${userEmail}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">${userCompany}</p>
                    </div>
                </div>
                <div class="text-right">
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
        if (!data) return;

        console.log('Updating activity chart with:', data);

        // Update activity chart using Chart.js or similar
        const ctx = document.getElementById('dashboardChart');
        if (ctx && typeof Chart !== 'undefined') {
            // Destroy existing chart if it exists
            if (this.activityChart) {
                this.activityChart.destroy();
            }
            
            // Get theme colors
            const isDark = document.documentElement.classList.contains('dark');
            const textColor = isDark ? '#e5e7eb' : '#374151';
            const gridColor = isDark ? '#374151' : '#e5e7eb';
            
            this.activityChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: data.datasets || [{
                        label: 'Actividad',
                        data: data.values,
                        backgroundColor: 'rgba(75, 192, 192, 0.7)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            ticks: { color: textColor },
                            grid: { color: gridColor }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: { color: textColor },
                            grid: { color: gridColor }
                        }
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
            
            // Store chart reference in canvas for theme updates
            ctx.chart = this.activityChart;
        }
    }

    updateDistributionChart(data) {
        if (!data) return;

        console.log('Updating distribution chart with:', data);

        // Update distribution chart using Chart.js or similar
        const ctx = document.getElementById('distributionChart');
        if (ctx && typeof Chart !== 'undefined') {
            // Destroy existing chart if it exists
            if (this.distributionChart) {
                this.distributionChart.destroy();
            }
            
            // Get theme colors
            const isDark = document.documentElement.classList.contains('dark');
            const textColor = isDark ? '#e5e7eb' : '#374151';
            
            this.distributionChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.labels,
                    datasets: data.datasets || [{
                        data: data.values,
                        backgroundColor: [
                            '#FF6384',
                            '#36A2EB',
                            '#FFCE56',
                            '#4BC0C0',
                            '#9966FF',
                            '#FF9F40',
                            '#C9CBCF'
                        ]
                    }]
                },
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
            
            // Store chart reference in canvas for theme updates
            ctx.chart = this.distributionChart;
        }
    }

    updateHardwareSection(hardwareStats) {
        if (!hardwareStats) return;

        this.updateElement('#hardware-total', hardwareStats.total_items);
        this.updateElement('#hardware-available', hardwareStats.available_items);
        this.updateElement('#hardware-unavailable', hardwareStats.unavailable_items);
        this.updateElement('#hardware-utilization', hardwareStats.utilization_percentage + '%');
        
        // Update hardware by type
        const typesList = document.querySelector('#hardware-types-list');
        if (typesList && hardwareStats.by_type) {
            typesList.innerHTML = '';
            hardwareStats.by_type.forEach(type => {
                const typeElement = document.createElement('div');
                typeElement.className = 'hardware-type-item';
                typeElement.innerHTML = `
                    <span class="type-name">${type.nombre}</span>
                    <span class="type-count">${type.count}</span>
                `;
                typesList.appendChild(typeElement);
            });
        }
    }

    updatePerformanceSection(metrics) {
        if (!metrics) return;

        this.updateElement('#system-cpu', metrics.cpu_usage + '%');
        this.updateElement('#system-memory', metrics.memory_usage + '%');
        this.updateElement('#system-disk', metrics.disk_usage + '%');
        this.updateElement('#response-time', metrics.response_time + 'ms');
        this.updateElement('#active-sessions', metrics.active_sessions);
        this.updateElement('#requests-per-minute', metrics.requests_per_minute);
    }

    // Helper methods
    updateElement(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            console.log(`Updating ${selector} with value:`, value);
            element.textContent = value;
        } else {
            console.warn(`Element not found: ${selector}`);
        }
    }

    showErrorMessage(message) {
        const errorContainer = document.querySelector('#error-message');
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.style.display = 'block';
            setTimeout(() => {
                errorContainer.style.display = 'none';
            }, 5000);
        }
    }

    showLoginRequired() {
        const loginContainer = document.querySelector('#login-required');
        if (loginContainer) {
            loginContainer.style.display = 'block';
        }
        // Hide error message if it's showing
        const errorContainer = document.querySelector('#error-message');
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
    }

    hideLoginRequired() {
        const loginContainer = document.querySelector('#login-required');
        if (loginContainer) {
            loginContainer.style.display = 'none';
        }
    }

    redirectToLogin() {
        console.warn('🙫 Authentication required. Redirecting to login...');
        
        // Show message to user
        this.showErrorMessage('Sesión requerida. Redirigiendo al login...');
        
        // Redirect to login page after a short delay
        setTimeout(() => {
            const loginUrl = window.location.origin + '/login';
            window.location.href = loginUrl;
        }, 1500);
    }

    handleUnauthorized() {
        console.warn('🙫 Unauthorized access detected. Redirecting to login...');
        
        // Show message to user
        this.showErrorMessage('Sesión expirada. Redirigiendo al login...');
        
        // Redirect to login page after a short delay
        setTimeout(() => {
            const loginUrl = window.location.origin + '/login';
            window.location.href = loginUrl;
        }, 1500);
    }

    // Este método ya está definido arriba, eliminamos la duplicación

    // Test connection to backend
    async testConnection() {
        try {
            const response = await this.client.health();
            return response.ok;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }

    // Handle different types of API errors
    handleApiError(response, context = '') {
        switch (response.status) {
            case 401:
                console.warn(`🚫 Unauthorized access in ${context}`);
                this.handleUnauthorized();
                break;
            case 403:
                console.warn(`🚫 Forbidden access in ${context}`);
                this.showErrorMessage('No tienes permisos para acceder a esta información.');
                break;
            case 404:
                console.warn(`🔍 Resource not found in ${context}`);
                this.showErrorMessage('El recurso solicitado no fue encontrado.');
                break;
            case 500:
                console.error(`🔥 Server error in ${context}`);
                this.showErrorMessage('Error interno del servidor. Inténtalo más tarde.');
                break;
            default:
                console.error(`❌ API error ${response.status} in ${context}`);
                this.showErrorMessage(`Error del servidor (${response.status}). Inténtalo más tarde.`);
        }
    }

    // Initialize dashboard when DOM is ready
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.loadDashboardData();
            });
        } else {
            this.loadDashboardData();
        }
    }
}

// Initialize dashboard on page load
window.SuperAdminDashboard = SuperAdminDashboard;

// Auto-initialize if we're on the super admin dashboard page
if (window.location.pathname.includes('/admin/super-dashboard')) {
    const dashboard = new SuperAdminDashboard();
    dashboard.init();
    
    // Make dashboard globally available for theme manager
    window.superAdminDashboard = dashboard;
}
/**
 * Mejoras específicas para tu SuperAdminDashboard existente
 * Estas mejoras se integran con tu código actual sin cambiar la estructura
 */

// 1. MEJORA: Extend tu clase existente con mejor manejo de errores

// ============ FUNCIÓN GLOBAL PARA NAVEGACIÓN SPA ============
// Global function for SPA navigation - Igual que en empresas-main.js
window.loadDashboard = function() {
  console.log('🔄 SPA: Iniciando carga dinámica de dashboard...');
  if (window.superAdminDashboard && typeof window.superAdminDashboard.loadDashboardData === 'function') {
    console.log('✅ SPA: Usando window.superAdminDashboard.loadDashboardData()');
    window.superAdminDashboard.loadDashboardData();
  } else {
    console.error('❌ SPA: superAdminDashboard no está disponible');
    // Intentar crear instancia si no existe
    if (typeof SuperAdminDashboard !== 'undefined') {
      console.log('🔄 SPA: Creando nueva instancia de SuperAdminDashboard...');
      window.superAdminDashboard = new SuperAdminDashboard();
      window.superAdminDashboard.loadDashboardData();
    }
  }
};

console.log('📊 Super Admin Dashboard main module loaded');
console.log('✅ Función window.loadDashboard() registrada para SPA');
