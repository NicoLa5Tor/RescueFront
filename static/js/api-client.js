/**
 * JavaScript API Client for Frontend
 * Mirrors the Python client but for browser usage
 */
if (typeof window.EndpointTestClient === 'undefined') {
class EndpointTestClient {
    constructor(baseUrl = '/proxy', token = null) {
        this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        this.token = token;
    }

    // Internal utilities
    _headers() {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        // No agregamos header Authorization porque el token viene en cookies
        // Las cookies se envían automáticamente
        
        return headers;
    }
    
    // Obtener token almacenado
    getStoredToken() {
        // El token viene en cookie segura, no necesitamos acceder a él directamente
        // Solo verificamos si tenemos datos de usuario
        return window.currentUser ? 'cookie_auth' : null;
    }
    
    // Obtener cookie
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
            credentials: 'include',  // Incluir cookies en solicitudes cross-origin
            ...options
        };

        if (options.data) {
            config.body = JSON.stringify(options.data);
        }

        return fetch(url, config);
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

// Endpoints para cargar todos los usuarios de todas las empresas
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

    // Utility methods
    // set_token(token) {
    //     // Ya no necesitamos establecer tokens manualmente
    //     // Las cookies se manejan automáticamente
    //     console.log('Note: Tokens are now handled via secure cookies');
    // }

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
