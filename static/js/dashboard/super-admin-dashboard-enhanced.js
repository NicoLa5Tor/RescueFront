class SuperAdminDashboardEnhanced extends SuperAdminDashboard {
    constructor() {
        super();
        this.retryAttempts = 3;
        this.retryDelay = 1000;
        this.isLoading = false;
    }
    
    // 1. MEJORA: Validación de autenticación robusta
    async isAuthenticated() {
        try {
            // Verificar si tenemos datos de usuario
            if (!window.currentUser) {
                console.log('❌ No hay datos de usuario');
                return false;
            }
            
            // Verificar si la sesión es válida haciendo una petición al backend
            // Las cookies se envían automáticamente
            const response = await fetch('/proxy/health', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            
            const isValid = response.ok;
            if (!isValid) {
                console.log('❌ Sesión inválida o expirada');
                this.clearStoredAuth();
            }
            
            return isValid;
        } catch (error) {
            console.error('❌ Error verificando autenticación:', error);
            return false;
        }
    }
    
    // Método para limpiar autenticación
    clearStoredAuth() {
        console.log('🧹 Limpiando datos de autenticación almacenados');
        
        // Limpiar variables globales
        delete window.currentUser;
    }

    // 2. MEJORA: Mejor método de obtención de token
    getSessionToken() {
        // El token viene en cookie segura, no necesitamos acceder a él directamente
        // Solo verificamos si tenemos datos de usuario
        if (window.currentUser) {
            return 'cookie_auth';
        }
        
        console.warn('No session token found.');
        return null;
    }

    // 3. MEJORA: Carga con reintentos automáticos
    async loadWithRetry(loadFunction, maxRetries = this.retryAttempts) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Attempt ${attempt}/${maxRetries} for ${loadFunction.name}`);
                const result = await loadFunction();
                return result;
            } catch (error) {
                console.warn(`❌ Attempt ${attempt}/${maxRetries} failed:`, error.message);
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // Espera progresiva entre reintentos
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
            }
        }
    }

    // 4. MEJORA: Carga paralela mejorada
    async loadDashboardData() {
        if (this.isLoading) {
            console.log('⏳ Dashboard already loading, skipping...');
            return;
        }

        this.isLoading = true;
        console.log('🔄 Loading Super Admin Dashboard data...');
        
        // Check if user is authenticated
        const isAuth = await this.isAuthenticated();
        if (!isAuth) {
            console.warn('⚠️ No valid authentication token found. Redirecting to login.');
            this.showLoginRequired();
            this.isLoading = false;
            // Redirigir al login después de un breve delay
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
            return;
        }
        
        // Mostrar spinners en las tarjetas de estadísticas
        this.showLoadingSpinners();

        try {
            console.log('🚀 Starting concurrent API calls...');
            
            // Usar Promise.allSettled para manejar fallos parciales mejor
            const promises = [
                { name: 'stats', fn: () => this.loadWithRetry(() => this.loadStats()) },
                { name: 'companies', fn: () => this.loadWithRetry(() => this.loadRecentCompanies()) },
                { name: 'users', fn: () => this.loadWithRetry(() => this.loadRecentUsers()) },
                { name: 'activity', fn: () => this.loadWithRetry(() => this.loadActivityChart()) },
                { name: 'distribution', fn: () => this.loadWithRetry(() => this.loadDistributionChart()) },
                { name: 'hardware', fn: () => this.loadWithRetry(() => this.loadHardwareStats()) },
                { name: 'performance', fn: () => this.loadWithRetry(() => this.loadPerformanceMetrics()) }
            ];

            const results = await Promise.allSettled(promises.map(p => p.fn()));

            // Procesar resultados
            results.forEach((result, index) => {
                const { name } = promises[index];
                
                if (result.status === 'fulfilled') {
                    console.log(`✅ ${name} loaded successfully:`, result.value);
                    this.processLoadedData(name, result.value);
                } else {
                    console.error(`❌ ${name} failed:`, result.reason);
                    this.handlePartialFailure(name, result.reason);
                }
            });

            // Hide login required message if it's showing
            this.hideLoginRequired();
            this.hideLoadingSpinners();

            console.log('✅ Super Admin Dashboard data loading completed');
            
        } catch (error) {
            console.error('❌ Critical error loading dashboard:', error);
            this.showErrorMessage('Error crítico cargando el dashboard. Por favor, recarga la página.');
            this.hideLoadingSpinners();
        } finally {
            this.isLoading = false;
        }
    }

    // 5. MEJORA: Procesar datos cargados de forma modular
    processLoadedData(dataType, data) {
        switch (dataType) {
            case 'stats':
                this.updateStatsSection(data);
                break;
            case 'companies':
                this.updateRecentCompaniesSection(data);
                break;
            case 'users':
                this.updateRecentUsersSection(data);
                break;
            case 'activity':
                this.updateActivityChart(data);
                break;
            case 'distribution':
                this.updateDistributionChart(data);
                break;
            case 'hardware':
                this.updateHardwareSection(data);
                break;
            case 'performance':
                this.updatePerformanceSection(data);
                break;
        }
    }

    // 6. MEJORA: Manejo específico de fallos parciales
    handlePartialFailure(dataType, error) {
        const failureMessages = {
            'stats': 'Error cargando estadísticas principales',
            'companies': 'Error cargando empresas recientes',
            'users': 'Error cargando usuarios recientes',
            'activity': 'Error cargando gráfico de actividad',
            'distribution': 'Error cargando gráfico de distribución',
            'hardware': 'Error cargando datos de hardware',
            'performance': 'Error cargando métricas de rendimiento'
        };

        const message = failureMessages[dataType] || `Error cargando ${dataType}`;
        this.showToast(message, 'warning');
    }

    // 7. MEJORA: Sistema de spinners en las tarjetas
    showLoadingSpinners() {
        const spinnerElements = [
            '#totalEmpresasCount',
            '#totalUsersCount',
            '#totalHardwareCount',
            '#performanceCount'
        ];

        spinnerElements.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.innerHTML = '<i class="fas fa-spinner fa-spin text-gray-400"></i>';
            }
        });

        // Skeleton para las listas
        this.showSkeleton('#recentEmpresasContainer');
        this.showSkeleton('#recentUsersContainer');
    }

    hideLoadingSpinners() {
        // Los valores reales ya se habrán actualizado por updateStatsSection
        // Solo removemos skeletons si aún están presentes
        const containers = ['#recentEmpresasContainer', '#recentUsersContainer'];
        containers.forEach(selector => {
            const container = document.querySelector(selector);
            if (container && container.innerHTML.includes('skeleton')) {
                container.innerHTML = '<p class="text-center text-gray-500 p-4">No hay datos disponibles</p>';
            }
        });
    }

    // 8. MEJORA: Skeleton loading
    showSkeleton(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (container) {
            container.innerHTML = `
                <div class="space-y-3">
                    ${Array(3).fill().map(() => `
                        <div class="skeleton-item flex items-center space-x-3 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse">
                            <div class="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                            <div class="flex-1 space-y-2">
                                <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                                <div class="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    // 9. MEJORA: Sistema de toast notifications
    showToast(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        const typeClasses = {
            success: 'bg-green-100 border-green-400 text-green-800',
            warning: 'bg-yellow-100 border-yellow-400 text-yellow-800',
            error: 'bg-red-100 border-red-400 text-red-800',
            info: 'bg-blue-100 border-blue-400 text-blue-800'
        };

        toast.className = `fixed top-4 right-4 max-w-sm p-4 border rounded-lg shadow-lg z-50 transition-all duration-300 ${typeClasses[type]}`;
        toast.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
                    <span class="text-sm font-medium">${message}</span>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(toast);

        // Auto-remove
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    }

    // 10. MEJORA: Validación robusta de datos stats
    updateStatsSection(stats) {
        if (!stats || typeof stats !== 'object') {
            console.warn('Invalid stats data received:', stats);
            this.showToast('Datos de estadísticas inválidos', 'warning');
            return;
        }

        console.log('Updating stats section with:', stats);

        // Mapeo robusto con múltiples posibles nombres de campos
        const statMappings = [
            { 
                keys: ['total_empresas', 'totalEmpresas', 'total_companies'], 
                selector: '#totalEmpresasCount',
                defaultValue: 0
            },
            { 
                keys: ['active_empresas', 'activeEmpresas', 'active_companies'], 
                selector: '#activeEmpresasCount',
                defaultValue: 0
            },
            { 
                keys: ['total_users', 'totalUsers', 'total_usuarios'], 
                selector: '#totalUsersCount',
                defaultValue: 0
            },
            { 
                keys: ['active_users', 'activeUsers', 'usuarios_activos'], 
                selector: '#activeUsersCount',
                defaultValue: 0
            },
            { 
                keys: ['total_hardware', 'totalHardware'], 
                selector: '#totalHardwareCount',
                defaultValue: 0
            },
            { 
                keys: ['available_hardware', 'availableHardware'], 
                selector: '#availableHardwareCount',
                defaultValue: 0
            },
            { 
                keys: ['performance', 'performanceValue'], 
                selector: '#performanceCount',
                defaultValue: 0,
                suffix: '%'
            },
            { 
                keys: ['avg_performance', 'avgPerformance'], 
                selector: '#avgPerformanceCount',
                defaultValue: 0,
                suffix: '%'
            }
        ];

        statMappings.forEach(({ keys, selector, defaultValue, suffix = '' }) => {
            let value = defaultValue;
            
            // Buscar valor en las claves posibles
            for (const key of keys) {
                if (stats[key] !== undefined && stats[key] !== null) {
                    value = stats[key];
                    break;
                }
            }

            // Validar y formatear valor
            if (typeof value !== 'number') {
                value = parseInt(value) || defaultValue;
            }

            this.updateElementWithAnimation(selector, value + suffix);
        });

        console.log('Stats section updated successfully');
    }

    // 11. MEJORA: Actualización de elementos con animación
    updateElementWithAnimation(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            // Aplicar valor
            element.textContent = value;
            
            // Añadir animación de highlight
            element.classList.add('stat-updated');
            setTimeout(() => element.classList.remove('stat-updated'), 1000);
        } else {
            console.warn(`Element not found: ${selector}`);
        }
    }

    // 12. MEJORA: Auto-refresh inteligente
    enableAutoRefresh(intervalMinutes = 5) {
        setInterval(() => {
            // Solo refrescar si la página está visible
            if (!document.hidden && this.isAuthenticated() && !this.isLoading) {
                console.log('🔄 Auto-refreshing dashboard data...');
                this.loadDashboardData();
            }
        }, intervalMinutes * 60 * 1000);
    }
}

// 13. MEJORA: CSS adicional para animaciones (agregar al final del HTML)
const enhancedCSS = `
<style>
.stat-updated {
    animation: statHighlight 1s ease-in-out;
}

@keyframes statHighlight {
    0% { 
        background-color: rgba(59, 130, 246, 0.1);
        transform: scale(1);
    }
    50% { 
        background-color: rgba(59, 130, 246, 0.2);
        transform: scale(1.05);
    }
    100% { 
        background-color: transparent;
        transform: scale(1);
    }
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.skeleton-item {
    animation: skeleton-loading 1.5s ease-in-out infinite alternate;
}

@keyframes skeleton-loading {
    0% { opacity: 0.6; }
    100% { opacity: 1; }
}
</style>
`;

// 14. MEJORA: Inicialización mejorada 
document.addEventListener('DOMContentLoaded', function () {
    // Inyectar CSS mejorado
    document.head.insertAdjacentHTML('beforeend', enhancedCSS);
    
    // Reemplazar la instancia global con la versión mejorada
    if (window.location.pathname.includes('/admin/super-dashboard')) {
        window.superAdminDashboard = new SuperAdminDashboardEnhanced();
        window.superAdminDashboard.enableAutoRefresh();
        
        // También mantener compatibilidad con el código existente
        window.SuperAdminDashboard = SuperAdminDashboardEnhanced;
    }
});

// 15. MEJORA: Función auxiliar para refrescar manualmente desde la UI
function refreshDashboard() {
    if (window.superAdminDashboard && !window.superAdminDashboard.isLoading) {
        window.superAdminDashboard.loadDashboardData();
    } else {
        console.log('Dashboard is already loading or not initialized');
    }
}

// 16. MEJORA: Función para verificar estado de conexión
function checkConnectionStatus() {
    if (window.superAdminDashboard) {
        window.superAdminDashboard.testConnection()
            .then(isConnected => {
                const status = isConnected ? 'online' : 'offline';
                console.log(`Connection status: ${status}`);
                return status;
            })
            .catch(error => {
                console.error('Connection test failed:', error);
                return 'offline';
            });
    }
}
