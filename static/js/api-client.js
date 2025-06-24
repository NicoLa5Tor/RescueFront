// static/js/api-client.js

/**
 * Cliente API para comunicación con el backend
 * Maneja autenticación automática y modelos
 */
class ApiClient {
    constructor() {
      this.baseURL = window.authManager?.API_BASE || 'http://localhost:5000'
      this.selectedEmpresaId = this.getStoredEmpresaId()
    }
  
    /**
     * Realizar petición HTTP autenticada
     */
    async request(endpoint, options = {}) {
      try {
        // Usar el authManager para hacer peticiones autenticadas
        if (window.authManager && window.authManager.isAuthenticated()) {
          const response = await window.authManager.makeAuthenticatedRequest(endpoint, options)
          return response
        } else {
          throw new Error('Usuario no autenticado')
        }
      } catch (error) {
        console.error('API Request Error:', error)
        if (error.message === 'Sesión expirada' || error.message === 'Usuario no autenticado') {
          window.authManager?.logout()
        }
        throw error
      }
    }
  
    /**
     * Parsear respuesta JSON con manejo de errores
     */
    async parseResponse(response) {
      try {
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.errors?.[0] || `Error ${response.status}`)
        }
        
        if (!data.success) {
          throw new Error(data.errors?.[0] || 'Error en la operación')
        }
        
        return data
      } catch (error) {
        if (error instanceof SyntaxError) {
          throw new Error('Error de comunicación con el servidor')
        }
        throw error
      }
    }
  
    // ===== GESTIÓN DE EMPRESA SELECCIONADA =====
  
    /**
     * Establecer empresa seleccionada
     */
    setSelectedEmpresa(empresaId) {
      this.selectedEmpresaId = empresaId
      sessionStorage.setItem('selected_empresa_id', empresaId)
    }
  
    /**
     * Obtener empresa seleccionada
     */
    getSelectedEmpresaId() {
      return this.selectedEmpresaId
    }
  
    /**
     * Recuperar empresa seleccionada del storage
     */
    getStoredEmpresaId() {
      return sessionStorage.getItem('selected_empresa_id')
    }
  
    /**
     * Limpiar empresa seleccionada
     */
    clearSelectedEmpresa() {
      this.selectedEmpresaId = null
      sessionStorage.removeItem('selected_empresa_id')
    }
  
    // ===== EMPRESAS =====
  
    /**
     * Obtener todas las empresas
     */
    async getEmpresas() {
      const response = await this.request('/api/empresas')
      const data = await this.parseResponse(response)
      console.log("la data retorna: "+data)
      return ModelFactory.createEmpresas(data)
    }
  
    /**
     * Obtener empresa específica por ID
     */
    async getEmpresa(empresaId) {
      const response = await this.request(`/api/empresas/${empresaId}`)
      const data = await this.parseResponse(response)
      return ModelFactory.createEmpresa(data.data)
    }
  
    /**
     * Crear nueva empresa (solo super admin)
     */
    async createEmpresa(empresaData, password) {
      const empresa = new Empresa(empresaData)
      const validationErrors = empresa.validate()
      
      if (validationErrors.length > 0) {
        throw new Error(validationErrors[0])
      }
  
      if (!password || password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres')
      }
  
      const response = await this.request('/api/empresas/', {
        method: 'POST',
        body: JSON.stringify(empresa.toApiDataWithPassword(password))
      })
      
      const data = await this.parseResponse(response)
      return ModelFactory.createEmpresa(data.data)
    }
  
    /**
     * Actualizar empresa existente
     */
    async updateEmpresa(empresaId, empresaData, password = null) {
      const empresa = new Empresa(empresaData)
      const validationErrors = empresa.validate()
      
      if (validationErrors.length > 0) {
        throw new Error(validationErrors[0])
      }
  
      const payload = password ? 
        empresa.toApiDataWithPassword(password) : 
        empresa.toApiData()
  
      const response = await this.request(`/api/empresas/${empresaId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
      
      const data = await this.parseResponse(response)
      return ModelFactory.createEmpresa(data.data)
    }
  
    /**
     * Cambiar estado de empresa (activa/inactiva)
     */
    async toggleEmpresaStatus(empresaId, activa) {
      const response = await this.request(`/api/empresas/${empresaId}`, {
        method: 'PUT',
        body: JSON.stringify({ activa: activa })
      })
      
      const data = await this.parseResponse(response)
      return ModelFactory.createEmpresa(data.data)
    }
  
    /**
     * Buscar empresas por ubicación
     */
    async searchEmpresasByUbicacion(ubicacion) {
      try {
        const response = await this.request(`/api/empresas/buscar-por-ubicacion?ubicacion=${encodeURIComponent(ubicacion)}`)
        const data = await this.parseResponse(response)
        return ModelFactory.createEmpresas(data)
      } catch (error) {
        // Fallback to client side filtering if endpoint is missing
        console.warn('Endpoint buscar-por-ubicacion no disponible, filtrando localmente:', error)
        const empresas = await this.getEmpresas()
        return empresas.filter(empresa =>
          empresa.ubicacion.toLowerCase().includes(ubicacion.toLowerCase())
        )
      }
    }
  
    // ===== USUARIOS =====
  
    /**
     * Obtener usuarios de una empresa
     */
    async getUsuariosByEmpresa(empresaId = null) {
      const targetEmpresaId = empresaId || this.selectedEmpresaId
      
      if (!targetEmpresaId) {
        throw new Error('No hay empresa seleccionada')
      }
  
      const response = await this.request(`/empresas/${targetEmpresaId}/usuarios`)
      const data = await this.parseResponse(response)
      return ModelFactory.createUsuarios(data)
    }

    /**
     * Obtener todos los usuarios del sistema
     */
    async getAllUsers() {
      const response = await this.request('/api/users/')
      const data = await this.parseResponse(response)
      return ModelFactory.createUsuarios(data)
    }
  
    /**
     * Obtener usuario específico de una empresa
     */
    async getUsuarioByEmpresa(empresaId, usuarioId) {
      const response = await this.request(`/empresas/${empresaId}/usuarios/${usuarioId}`)
      const data = await this.parseResponse(response)
      return ModelFactory.createUsuario(data.data)
    }
  
    /**
     * Crear usuario para una empresa
     */
    async createUsuarioForEmpresa(empresaId, usuarioData, password) {
      const usuario = new Usuario(usuarioData)
      const validationErrors = usuario.validate()
      
      if (validationErrors.length > 0) {
        throw new Error(validationErrors[0])
      }
  
      if (!password || password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres')
      }
  
      const response = await this.request(`/empresas/${empresaId}/usuarios`, {
        method: 'POST',
        body: JSON.stringify(usuario.toApiDataWithPassword(password))
      })
      
      const data = await this.parseResponse(response)
      return ModelFactory.createUsuario(data.data)
    }
  
    /**
     * Actualizar usuario de una empresa
     */
    async updateUsuarioByEmpresa(empresaId, usuarioId, usuarioData) {
      const usuario = new Usuario(usuarioData)
      const validationErrors = usuario.validate()
      
      if (validationErrors.length > 0) {
        throw new Error(validationErrors[0])
      }
  
      const response = await this.request(`/empresas/${empresaId}/usuarios/${usuarioId}`, {
        method: 'PUT',
        body: JSON.stringify(usuario.toApiData())
      })
      
      const data = await this.parseResponse(response)
      return ModelFactory.createUsuario(data.data)
    }
  
    /**
     * Eliminar usuario de una empresa
     */
    async deleteUsuarioByEmpresa(empresaId, usuarioId) {
      const response = await this.request(`/empresas/${empresaId}/usuarios/${usuarioId}`, {
        method: 'DELETE'
      })
      
      const data = await this.parseResponse(response)
      return data.success
    }
  
    /**
     * Filtrar usuarios por edad en una empresa
     */
    async filterUsuariosByAge(empresaId, minAge, maxAge) {
      try {
        const response = await this.request(`/api/users/age-range?min_age=${minAge}&max_age=${maxAge}`)
        const data = await this.parseResponse(response)
        const usuarios = ModelFactory.createUsuarios(data)
        return usuarios.filter(u => u.empresa_id === empresaId)
      } catch (error) {
        console.warn('Endpoint age-range no disponible, filtrando localmente:', error)
        const usuarios = await this.getUsuariosByEmpresa(empresaId)
        return usuarios
      }
    }
  
    // ===== MÉTODOS DE COMPATIBILIDAD (para mantener el código existente) =====
  
    /**
     * Obtener usuarios (usa empresa seleccionada)
     */
    async getUsers() {
      if (this.selectedEmpresaId) {
        return this.getUsuariosByEmpresa()
      }
      return this.getAllUsers()
    }
  
    /**
     * Obtener usuario específico
     */
    async getUser(usuarioId) {
      if (!this.selectedEmpresaId) {
        throw new Error('No hay empresa seleccionada')
      }
      return this.getUsuarioByEmpresa(this.selectedEmpresaId, usuarioId)
    }
  
    /**
     * Crear usuario (usa empresa seleccionada)
     */
    async createUser(userData) {
      if (!this.selectedEmpresaId) {
        throw new Error('No hay empresa seleccionada')
      }
      
      const password = userData.password
      delete userData.password
      
      return this.createUsuarioForEmpresa(this.selectedEmpresaId, userData, password)
    }
  
    /**
     * Actualizar usuario (usa empresa seleccionada)
     */
    async updateUser(usuarioId, userData) {
      if (!this.selectedEmpresaId) {
        throw new Error('No hay empresa seleccionada')
      }
      return this.updateUsuarioByEmpresa(this.selectedEmpresaId, usuarioId, userData)
    }
  
    /**
     * Eliminar usuario (usa empresa seleccionada)
     */
    async deleteUser(usuarioId) {
      if (!this.selectedEmpresaId) {
        throw new Error('No hay empresa seleccionada')
      }
      return this.deleteUsuarioByEmpresa(this.selectedEmpresaId, usuarioId)
    }
  
    /**
     * Filtrar usuarios por edad (usa empresa seleccionada)
     */
    async getUsersByAge(minAge, maxAge) {
      if (this.selectedEmpresaId) {
        return this.filterUsuariosByAge(this.selectedEmpresaId, minAge, maxAge)
      }
      const response = await this.request(`/api/users/age-range?min_age=${minAge}&max_age=${maxAge}`)
      const data = await this.parseResponse(response)
      return ModelFactory.createUsuarios(data)
    }
  
    // ===== ESTADÍSTICAS =====
  
    /**
     * Obtener estadísticas de una empresa
     */
    async getEmpresaStats(empresaId = null) {
      const targetEmpresaId = empresaId || this.selectedEmpresaId
      
      if (!targetEmpresaId) {
        throw new Error('No hay empresa seleccionada')
      }
  
      try {
        const response = await this.request(`/api/empresas/${targetEmpresaId}/stats`)
        const data = await this.parseResponse(response)
        return ModelFactory.createEmpresaStats(data.data)
      } catch (error) {
        // Si no existe endpoint de stats, generar estadísticas básicas
        console.warn('Endpoint de estadísticas no disponible, generando datos básicos:', error)
        return this.generateBasicStats(targetEmpresaId)
      }
    }
  
    /**
     * Obtener estadísticas globales (para admins)
     */
    async getGlobalStats() {
      const endpoints = ['/api/admin/stats', '/api/empresas/estadisticas']
      for (const endpoint of endpoints) {
        try {
          const response = await this.request(endpoint)
          const data = await this.parseResponse(response)
          // /api/empresas/estadisticas devuelve el objeto directamente
          if (data.data) {
            return ModelFactory.createGlobalStats(data.data)
          }
          return ModelFactory.createGlobalStats(data)
        } catch (error) {
          console.warn(`Endpoint ${endpoint} no disponible:`, error)
        }
      }
      // Fallback a generación local
      return this.generateBasicGlobalStats()
    }

    /**
     * Obtener actividad global del sistema
     */
    async getAdminActivity() {
      const response = await this.request('/api/admin/activity')
      const data = await this.parseResponse(response)
      return data.data
    }

    /**
     * Obtener logs de actividad de empresas (solo admins)
     */
    async getAdminActivityLogs() {
      const response = await this.request('/api/admin/activity-admin')
      const data = await this.parseResponse(response)
      return data.data
    }

    /**
     * Obtener actividad de una empresa
     */
    async getEmpresaActivity(empresaId = null) {
      const targetId = empresaId || this.selectedEmpresaId
      if (!targetId) {
        throw new Error('No hay empresa seleccionada')
      }
      const response = await this.request(`/api/empresas/${targetId}/activity`)
      const data = await this.parseResponse(response)
      return data.data
    }

    /**
     * Obtener distribución de empresas
     */
    async getAdminDistribution() {
      const response = await this.request('/api/admin/distribution')
      const data = await this.parseResponse(response)
      return data.data
    }
  
    /**
     * Generar estadísticas básicas para una empresa
     */
    async generateBasicStats(empresaId) {
      try {
        const usuarios = await this.getUsuariosByEmpresa(empresaId)
        
        const stats = {
          total_usuarios: usuarios.length,
          usuarios_activos: usuarios.length, // Todos activos por defecto
          usuarios_por_rol: {},
          ultimo_usuario_creado: usuarios.length > 0 ? usuarios[usuarios.length - 1] : null,
          fecha_actualizacion: new Date().toISOString()
        }
  
        // Contar usuarios por rol
        usuarios.forEach(usuario => {
          stats.usuarios_por_rol[usuario.rol] = (stats.usuarios_por_rol[usuario.rol] || 0) + 1
        })
  
        return ModelFactory.createEmpresaStats(stats)
      } catch (error) {
        console.error('Error generando estadísticas básicas:', error)
        return ModelFactory.createEmpresaStats({})
      }
    }
  
    /**
     * Generar estadísticas globales básicas
     */
    async generateBasicGlobalStats() {
      try {
        const empresas = await this.getEmpresas()
        
        let totalUsuarios = 0
        const usuariosPorEmpresa = []
        const empresasPorUbicacion = {}
  
        // Obtener usuarios de cada empresa
        for (const empresa of empresas) {
          try {
            const usuarios = await this.getUsuariosByEmpresa(empresa.id)
            totalUsuarios += usuarios.length
            
            usuariosPorEmpresa.push({
              empresa_name: empresa.nombre,
              users_count: usuarios.length
            })
  
            // Contar por ubicación
            const ubicacion = empresa.ubicacion || 'Sin ubicación'
            empresasPorUbicacion[ubicacion] = (empresasPorUbicacion[ubicacion] || 0) + 1
          } catch (error) {
            console.warn(`Error obteniendo usuarios de empresa ${empresa.nombre}:`, error)
          }
        }
  
        const stats = {
          total_empresas: empresas.length,
          empresas_activas: empresas.filter(e => e.activa).length,
          total_usuarios: totalUsuarios,
          usuarios_por_empresa: usuariosPorEmpresa,
          empresas_por_ubicacion: Object.entries(empresasPorUbicacion).map(([ubicacion, count]) => ({
            ubicacion,
            count
          })),
          crecimiento_mensual: [] // TODO: Implementar cuando haya datos históricos
        }
  
        return ModelFactory.createGlobalStats(stats)
      } catch (error) {
        console.error('Error generando estadísticas globales básicas:', error)
        return ModelFactory.createGlobalStats({})
      }
    }
  
    // ===== USUARIO ACTUAL =====
  
    /**
     * Obtener información del usuario actual
     */
    getCurrentUser() {
      if (!window.authManager || !window.authManager.isAuthenticated()) {
        return null
      }
  
      const user = window.authManager.getUser()
      const token = window.authManager.getToken()
      
      if (token) {
        try {
          const payload = window.authManager.decodeJWT(token)
          return ModelFactory.createCurrentUser({ ...user, ...payload })
        } catch (error) {
          console.warn('Error decodificando JWT:', error)
          return ModelFactory.createCurrentUser(user)
        }
      }
  
      return ModelFactory.createCurrentUser(user)
    }
  }
  
  // Crear instancia global del cliente API
  window.apiClient = new ApiClient()
  
  // Exportar para uso en módulos
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiClient
  }
