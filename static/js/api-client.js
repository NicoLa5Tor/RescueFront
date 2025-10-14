
if (typeof window.EndpointTestClient === 'undefined') {
class EndpointTestClient {
    constructor(baseUrl = '/proxy', token = null) {
        this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        this.token = token;
        this.isRefreshing = false;
        this.failedQueue = [];
    }
    _headers() {
        const headers = {
            'Content-Type': 'application/json',
        };
        const token = this.getCookie('auth_token') || this.token;
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }
    getStoredToken() {

        return window.currentUser ? 'cookie_auth' : null;
    }
    getCookie(name) {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [cookieName, cookieValue] = cookie.trim().split('=');
            if (cookieName === name) {
                return cookieValue;
            }
        }
        return null;
    }
    async _request(method, endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            method,
            headers: this._headers(),
            credentials: 'include', 
            ...options
        };
        if (options.data) {
            config.body = JSON.stringify(options.data);
        }
        return this._requestWithTokenRefresh(url, config);
    }
    processQueue(error, token = null) {
        this.failedQueue.forEach(prom => {
            if (error) {
                prom.reject(error);
            } else {
                prom.resolve(token);
            }
        });
        this.failedQueue = [];
    }
    async _requestWithTokenRefresh(url, config) {
        try {
            const response = await fetch(url, config);
            if (response.ok || response.status !== 401) {
                return response;
            }
            if (response.status === 401 && !config._retry) {
                // Check error message to differentiate between invalid session and expired token
                try {
                    const errorData = await response.clone().json();
                    const errorMessage = errorData?.message || '';
                    
                    // NUEVO: Detectar si es sesión inválida vs token expirado
                    if (errorMessage.includes('Sesión inválida') || errorMessage.includes('Invalid session')) {
                        console.log('❌ Invalid session detected, redirecting to login');
                        this.processQueue(new Error('Invalid session'));
                        this._redirectToLogin();
                        return Promise.reject(new Error('Invalid session'));
                    }
                } catch (parseError) {
                    // If can't parse response, continue with normal flow
                    console.log('⚠️ Could not parse 401 response, continuing with token refresh');
                }
                
                console.log('🔄 Access token expired, attempting refresh...');
                if (this.isRefreshing) {
                    return new Promise((resolve, reject) => {
                        this.failedQueue.push({ resolve, reject });
                    }).then(() => {
                        // Retry this queued request after refresh completes
                        console.log('🔄 Executing queued request after refresh');
                        return fetch(url, config);
                    }).catch(err => {
                        return Promise.reject(err);
                    });
                }
                config._retry = true;
                this.isRefreshing = true;
                try {
                    // Try to refresh token
                    const refreshResponse = await fetch(`${this.baseUrl}/auth/refresh`, {
                        method: 'POST',
                        headers: this._headers(),
                        credentials: 'include'
                    });

                    if (refreshResponse.ok) {
                        console.log('✅ Token refreshed successfully');
                        this.processQueue(null);
                        this.isRefreshing = false;
                        
                        // Retry the original request with fresh token
                        console.log('🔄 Retrying original request after refresh');
                        return fetch(url, config);
                    } else {
                        // Check if refresh failed due to invalid session
                        try {
                            const refreshErrorData = await refreshResponse.clone().json();
                            const refreshErrorMessage = refreshErrorData?.message || '';
                            
                            if (refreshErrorMessage.includes('Sesión inválida') || refreshErrorMessage.includes('Invalid session')) {
                                console.log('❌ Session invalidated, redirecting to login');
                                this.processQueue(new Error('Session invalidated'));
                            } else {
                                console.log('❌ Token refresh failed, redirecting to login');
                                this.processQueue(new Error('Token refresh failed'));
                            }
                        } catch (parseError) {
                            console.log('❌ Token refresh failed, redirecting to login');
                            this.processQueue(new Error('Token refresh failed'));
                        }
                        
                        this.isRefreshing = false;
                        this._redirectToLogin();
                        return Promise.reject(new Error('Authentication failed'));
                    }
                } catch (error) {
                    console.error('❌ Error during token refresh:', error);
                    this.processQueue(error);
                    this.isRefreshing = false;
                    
                    // NO redirigir a login si es error de red durante refresh
                    if (this._isNetworkError(error)) {
                        console.log('🌐 Network error during refresh - tokens may still be valid');
                        return Promise.reject(new Error('Sin conexión durante refresh - revisa tu internet'));
                    }
                    
                    this._redirectToLogin();
                    return Promise.reject(error);
                }
            }

            return response;
        } catch (error) {
            console.error('❌ Request failed:', error);
            
            // NO redirigir a login si es error de red
            if (this._isNetworkError(error)) {
                console.log('🌐 Network error - tokens still valid');
                throw new Error('Sin conexión - revisa tu internet');
            }
            
            throw error;
        }
    }

    /**
     * Detectar si es error de red vs error de autenticación
     */
    _isNetworkError(error) {
        return error.name === 'TypeError' && error.message.includes('fetch') ||
               error.message.includes('Failed to fetch') ||
               error.message.includes('NetworkError') ||
               !navigator.onLine;
    }

    _redirectToLogin() {
        // Clear any user data
        if (window.currentUser) {
            delete window.currentUser;
        }
        
        // Redirect to login
        if (window.location.pathname !== '/login') {
            console.log('🔄 Redirecting to login due to authentication failure');
            window.location.href = '/login';
        }
    }

    // Authentication and health endpoints
    async login(usuario, password) {
        return this._request('POST', '/auth/login', {
            data: { usuario, password }
        });
    }

    async logout() {
        return this._request('POST', '/auth/logout');
    }

    // NUEVO: Logout de todas las sesiones
    async logoutAll() {
        return this._request('POST', '/auth/logout-all');
    }

    // NUEVO: Ver sesiones activas del usuario
    async getSessions() {
        return this._request('GET', '/auth/sessions');
    }

    // NUEVO: Cerrar sesión específica
    async closeSession(sessionId) {
        return this._request('DELETE', `/auth/sessions/${sessionId}`);
    }

    async health() {
        return this._request('GET', '/health');
    }

    // Hardware endpoints
    async create_hardware(data) {
        return this._request('POST', '/api/hardware', { data });
    }

    async get_hardware_list() {
        return this._request('GET', '/api/hardware');
    }

    async get_hardware_details(hardwareId) {
        return this._request('GET', `/api/hardware/${hardwareId}`);
    }

    async get_hardware(hardwareId) {
        return this._request('GET', `/api/hardware/${hardwareId}`);
    }

    async update_hardware(hardwareId, data) {
        return this._request('PUT', `/api/hardware/${hardwareId}`, { data });
    }

    async delete_hardware(hardwareId) {
        return this._request('DELETE', `/api/hardware/${hardwareId}`);
    }
    
    async toggle_hardware_status(hardwareId, activa) {
        return this._request('PATCH', `/api/hardware/${hardwareId}/toggle-status`, { data: { activa } });
    }

    async get_hardware_by_empresa(empresaId) {
        return this._request('GET', `/api/hardware/empresa/${empresaId}`);
    }

    // New endpoints for hardware including inactive
    async get_hardware_list_including_inactive() {
        return this._request('GET', '/api/hardware/all-including-inactive');
    }

    async get_hardware_by_empresa_including_inactive(empresaId) {
        return this._request('GET', `/api/hardware/empresa/${empresaId}/including-inactive`);
    }

    // Hardware types endpoints
    async get_hardware_types() {
        return this._request('GET', '/api/hardware-types');
    }

    async create_hardware_type(data) {
        return this._request('POST', '/api/hardware-types', { data });
    }

    async update_hardware_type(typeId, data) {
        return this._request('PUT', `/api/hardware-types/${typeId}`, { data });
    }

    async delete_hardware_type(typeId) {
        return this._request('DELETE', `/api/hardware-types/${typeId}`);
    }

    // Company endpoints
    async get_empresas() {
        return this._request('GET', '/api/empresas');
    }

    // Dashboard endpoint for all companies (active and inactive)
    async get_empresas_dashboard() {
        return this._request('GET', '/api/empresas/dashboard/all');
    }

    async get_empresa(empresaId) {
        return this._request('GET', `/api/empresas/${empresaId}`);
    }

    async create_empresa(data) {
        return this._request('POST', '/api/empresas', { data });
    }

    async update_empresa(empresaId, data) {
        return this._request('PUT', `/api/empresas/${empresaId}`, { data });
    }

    async delete_empresa(empresaId) {
        return this._request('DELETE', `/api/empresas/${empresaId}`);
    }

    async toggle_empresa_status(empresaId, activa) {
        return this._request('PATCH', `/api/empresas/${empresaId}/toggle-status`, { data: { activa } });
    }

    // Multi-tenant (Usuarios por Empresa) endpoints
async get_usuarios_by_empresa(empresaId) {
    return this._request('GET', `/empresas/${empresaId}/usuarios`);
}

async get_usuarios_including_inactive(empresaId) {
    return this._request('GET', `/empresas/${empresaId}/usuarios/including-inactive`);
}

async get_usuario(empresaId, usuarioId) {
    return this._request('GET', `/empresas/${empresaId}/usuarios/${usuarioId}`);
}

async create_usuario(empresaId, data) {
    return this._request('POST', `/empresas/${empresaId}/usuarios`, { data });
}

async update_usuario(empresaId, usuarioId, data) {
    return this._request('PUT', `/empresas/${empresaId}/usuarios/${usuarioId}`, { data });
}

async delete_usuario(empresaId, usuarioId) {
    return this._request('DELETE', `/empresas/${empresaId}/usuarios/${usuarioId}`);
}

async toggle_usuario_status(empresaId, usuarioId, activo) {
    return this._request('PATCH', `/empresas/${empresaId}/usuarios/${usuarioId}/toggle-status`, { data: { activo } });
}

async get_all_usuarios() {
    return this._request('GET', '/api/usuarios');
}

async get_all_usuarios_including_inactive() {
    return this._request('GET', '/api/usuarios/including-inactive');
}

    // Company types endpoints
    async get_tipos_empresa() {
        return this._request('GET', '/api/tipos_empresa');
    }

    // Get active company types for dropdowns/selects
    async get_tipos_empresa_activos() {
        return this._request('GET', '/api/tipos_empresa/activos');
    }

    // Dashboard endpoint for all company types (active and inactive)
    async get_tipos_empresa_dashboard() {
        return this._request('GET', '/api/tipos_empresa/dashboard/all');
    }

    // Super Admin Dashboard endpoints
    async get_super_admin_dashboard_stats() {
        return this._request('GET', '/api/dashboard/stats');
    }

    async get_super_admin_recent_companies() {
        return this._request('GET', '/api/dashboard/recent-companies');
    }

    async get_super_admin_recent_users() {
        return this._request('GET', '/api/dashboard/recent-users');
    }

    async get_super_admin_activity_chart() {
        return this._request('GET', '/api/dashboard/activity-chart');
    }

    async get_super_admin_distribution_chart() {
        return this._request('GET', '/api/dashboard/distribution-chart');
    }

    async get_super_admin_hardware_stats() {
        return this._request('GET', '/api/dashboard/hardware-stats');
    }

    async get_super_admin_performance_metrics() {
        return this._request('GET', '/api/dashboard/system-performance');
    }

    // MQTT Alerts endpoints
    async get_active_alerts_by_empresa(empresaId, limit = 5, offset = 0) {
        return this._request('GET', `/api/mqtt-alerts/empresa/${empresaId}/active-by-sede?limit=${limit}&offset=${offset}`);
    }

    async get_inactive_alerts_by_empresa(empresaId, limit = 5, offset = 0) {
        return this._request('GET', `/api/mqtt-alerts/inactive?empresaId=${empresaId}&limit=${limit}&offset=${offset}`);
    }

    async deactivate_user_alert(alertId, desactivadoPorId, desactivadoPorTipo, mensajeDesactivacion = '') {
        return this._request('PUT', '/api/mqtt-alerts/user-alert/deactivate', {
            data: {
                alert_id: alertId,
                desactivado_por_id: desactivadoPorId,
                desactivado_por_tipo: desactivadoPorTipo,
                mensaje_desactivacion: mensajeDesactivacion
            }
        });
    }

    async create_empresa_alert(alertData) {
        return this._request('POST', '/api/mqtt-alerts/user-alert', {
            data: alertData
        });
    }

    async toggle_alert_status(alertId) {
        return this._request('PATCH', `/api/mqtt-alerts/${alertId}/toggle-status`);
    }
    async pretty_response(response) {
        try {
            const data = await response.json();
            return JSON.stringify(data, null, 2);
        } catch (error) {
            return response.text();
        }
    }
}
// Make it available globally
window.EndpointTestClient = EndpointTestClient;
}
