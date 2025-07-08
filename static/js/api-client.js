/**
 * JavaScript API Client for Frontend
 * Mirrors the Python client but for browser usage
 */
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
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async _request(method, endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            method,
            headers: this._headers(),
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

async toggle_usuario_status(empresaId, usuarioId, activa) {
    return this._request('PATCH', `/empresas/${empresaId}/usuarios/${usuarioId}/toggle-status`, { data: { activa } });
}

// Company types endpoints
    async get_tipos_empresa() {
        return this._request('GET', '/api/tipos_empresa');
    }

    // Dashboard endpoint for all company types (active and inactive)
    async get_tipos_empresa_dashboard() {
        return this._request('GET', '/api/tipos_empresa/dashboard/all');
    }

    // Utility methods
    set_token(token) {
        this.token = token;
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
