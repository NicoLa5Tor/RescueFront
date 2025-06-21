// static/js/models.js

/**
 * Modelo de Usuario
 */
class Usuario {
    constructor(data = {}) {
      this.id = data._id || data.id || null
      this.nombre = data.nombre || ''
      this.cedula = data.cedula || ''
      this.rol = data.rol || ''
      this.empresa_id = data.empresa_id || null
      this.empresa = data.empresa || null
      this.fecha_creacion = data.fecha_creacion || null
      this.fecha_actualizacion = data.fecha_actualizacion || null
    }
  
    /**
     * Validar datos del usuario
     */
    validate() {
      const errors = []
      
      if (!this.nombre || this.nombre.trim().length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres')
      }
      
      if (!this.cedula || this.cedula.trim().length < 6) {
        errors.push('La cédula debe tener al menos 6 caracteres')
      }
      
      if (!this.rol || this.rol.trim().length < 2) {
        errors.push('El rol es obligatorio')
      }
      
      return errors
    }
  
    /**
     * Convertir a objeto para API
     */
    toApiData() {
      return {
        nombre: this.nombre,
        cedula: this.cedula,
        rol: this.rol
      }
    }
  
    /**
     * Convertir a objeto para API con password
     */
    toApiDataWithPassword(password) {
      return {
        ...this.toApiData(),
        password: password
      }
    }
  
    /**
     * Obtener iniciales para avatar
     */
    getInitials() {
      if (!this.nombre) return 'U'
      return this.nombre.split(' ')
        .map(word => word.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase()
    }
  
    /**
     * Formatear fecha de creación
     */
    getFormattedCreationDate() {
      if (!this.fecha_creacion) return 'N/A'
      return new Date(this.fecha_creacion).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }
  
  /**
   * Modelo de Empresa
   */
  class Empresa {
    constructor(data = {}) {
      this.id = data._id || data.id || null
      this.nombre = data.nombre || ''
      this.descripcion = data.descripcion || ''
      this.ubicacion = data.ubicacion || ''
      this.email = data.email || ''
      this.activa = data.activa !== undefined ? data.activa : true
      this.creado_por = data.creado_por || null
      this.fecha_creacion = data.fecha_creacion || null
      this.fecha_actualizacion = data.fecha_actualizacion || null
      this.usuarios_count = data.usuarios_count || 0
    }
  
    /**
     * Validar datos de la empresa
     */
    validate() {
      const errors = []
      
      if (!this.nombre || this.nombre.trim().length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres')
      }
      
      if (!this.descripcion || this.descripcion.trim().length < 10) {
        errors.push('La descripción debe tener al menos 10 caracteres')
      }
      
      if (!this.ubicacion || this.ubicacion.trim().length < 3) {
        errors.push('La ubicación debe tener al menos 3 caracteres')
      }
      
      if (!this.email || !this.isValidEmail(this.email)) {
        errors.push('Debe proporcionar un email válido')
      }
      
      return errors
    }
  
    /**
     * Validar email
     */
    isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }
  
    /**
     * Convertir a objeto para API
     */
    toApiData() {
      return {
        nombre: this.nombre,
        descripcion: this.descripcion,
        ubicacion: this.ubicacion,
        email: this.email,
        activa: this.activa
      }
    }
  
    /**
     * Convertir a objeto para API con password
     */
    toApiDataWithPassword(password) {
      return {
        ...this.toApiData(),
        password: password
      }
    }
  
    /**
     * Obtener badge de estado
     */
    getStatusBadge() {
      return {
        class: this.activa ? 'bg-success' : 'bg-secondary',
        text: this.activa ? 'Activa' : 'Inactiva'
      }
    }
  
    /**
     * Obtener iniciales para avatar
     */
    getInitials() {
      if (!this.nombre) return 'E'
      return this.nombre.split(' ')
        .map(word => word.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase()
    }
  
    /**
     * Formatear fecha de creación
     */
    getFormattedCreationDate() {
      if (!this.fecha_creacion) return 'N/A'
      return new Date(this.fecha_creacion).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  
    /**
     * Formatear última actualización
     */
    getFormattedUpdateDate() {
      if (!this.fecha_actualizacion) return 'N/A'
      return new Date(this.fecha_actualizacion).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
  
  /**
   * Modelo de Estadísticas de Empresa
   */
  class EmpresaStats {
    constructor(data = {}) {
      this.total_usuarios = data.total_usuarios || 0
      this.usuarios_activos = data.usuarios_activos || 0
      this.usuarios_por_rol = data.usuarios_por_rol || {}
      this.ultimo_usuario_creado = data.ultimo_usuario_creado || null
      this.fecha_actualizacion = data.fecha_actualizacion || null
    }
  
    /**
     * Obtener porcentaje de usuarios activos
     */
    getActiveUsersPercentage() {
      if (this.total_usuarios === 0) return 0
      return Math.round((this.usuarios_activos / this.total_usuarios) * 100)
    }
  
    /**
     * Obtener roles más comunes
     */
    getTopRoles(limit = 3) {
      const roles = Object.entries(this.usuarios_por_rol)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
      
      return roles.map(([rol, count]) => ({ rol, count }))
    }
  }
  
  /**
   * Modelo de Estadísticas Globales (para admins)
   */
  class GlobalStats {
    constructor(data = {}) {
      this.total_empresas = data.total_empresas || 0
      this.empresas_activas = data.empresas_activas || 0
      this.total_usuarios = data.total_usuarios || 0
      this.usuarios_por_empresa = data.usuarios_por_empresa || []
      this.empresas_por_ubicacion = data.empresas_por_ubicacion || []
      this.crecimiento_mensual = data.crecimiento_mensual || []
    }
  
    /**
     * Obtener porcentaje de empresas activas
     */
    getActiveCompaniesPercentage() {
      if (this.total_empresas === 0) return 0
      return Math.round((this.empresas_activas / this.total_empresas) * 100)
    }
  
    /**
     * Obtener promedio de usuarios por empresa
     */
    getAverageUsersPerCompany() {
      if (this.total_empresas === 0) return 0
      return Math.round(this.total_usuarios / this.total_empresas)
    }
  
    /**
     * Obtener ubicaciones más populares
     */
    getTopLocations(limit = 5) {
      return this.empresas_por_ubicacion
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
    }
  }
  
  /**
   * Modelo de Usuario Actual (del JWT)
   */
  class CurrentUser {
    constructor(data = {}) {
      this.id = data.user_id || data.id || null
      this.usuario = data.usuario || ''
      this.nombre = data.nombre || ''
      this.email = data.email || ''
      this.rol = data.rol || ''
      this.tipo = data.tipo || ''
      this.empresa_id = data.empresa_id || null
      this.permisos = data.permisos || []
      this.exp = data.exp || null
      this.iat = data.iat || null
    }
  
    /**
     * Verificar si es super admin
     */
    isSuperAdmin() {
      return this.rol === 'super_admin' && this.tipo === 'admin'
    }
  
    /**
     * Verificar si es admin
     */
    isAdmin() {
      return this.tipo === 'admin'
    }
  
    /**
     * Verificar si es empresa
     */
    isEmpresa() {
      return this.tipo === 'empresa'
    }
  
    /**
     * Verificar si tiene un permiso específico
     */
    hasPermission(permission) {
      return this.permisos.includes(permission)
    }
  
    /**
     * Obtener empresa ID (para usuarios tipo empresa)
     */
    getEmpresaId() {
      return this.empresa_id
    }
  
    /**
     * Verificar si el token está próximo a expirar (30 minutos antes)
     */
    isTokenExpiringSoon() {
      if (!this.exp) return false
      const expirationTime = this.exp * 1000 // Convertir a milisegundos
      const warningTime = 30 * 60 * 1000 // 30 minutos en milisegundos
      return (expirationTime - Date.now()) <= warningTime
    }
  
    /**
     * Obtener tiempo restante del token en minutos
     */
    getTokenTimeRemaining() {
      if (!this.exp) return 0
      const expirationTime = this.exp * 1000
      const timeRemaining = expirationTime - Date.now()
      return Math.max(0, Math.floor(timeRemaining / (1000 * 60)))
    }
  }
  
  /**
   * Factory para crear modelos desde respuestas de API
   */
  class ModelFactory {
    /**
     * Crear usuario desde respuesta de API
     */
    static createUsuario(apiData) {
      return new Usuario(apiData)
    }
  
    /**
     * Crear lista de usuarios desde respuesta de API
     */
    static createUsuarios(apiResponse) {
      if (!apiResponse.success || !Array.isArray(apiResponse.data)) {
        return []
      }
      return apiResponse.data.map(userData => new Usuario(userData))
    }
  
    /**
     * Crear empresa desde respuesta de API
     */
    static createEmpresa(apiData) {
      return new Empresa(apiData)
    }
  
    /**
     * Crear lista de empresas desde respuesta de API
     */
    static createEmpresas(apiResponse) {
      if (!apiResponse.success || !Array.isArray(apiResponse.data)) {
        return []
      }
      return apiResponse.data.map(empresaData => new Empresa(empresaData))
    }
  
    /**
     * Crear usuario actual desde JWT payload
     */
    static createCurrentUser(jwtPayload) {
      return new CurrentUser(jwtPayload)
    }
  
    /**
     * Crear estadísticas de empresa
     */
    static createEmpresaStats(apiData) {
      return new EmpresaStats(apiData)
    }
  
    /**
     * Crear estadísticas globales
     */
    static createGlobalStats(apiData) {
      return new GlobalStats(apiData)
    }
  }
  
  // Exportar modelos para uso global
  window.Usuario = Usuario
  window.Empresa = Empresa
  window.EmpresaStats = EmpresaStats
  window.GlobalStats = GlobalStats
  window.CurrentUser = CurrentUser
  window.ModelFactory = ModelFactory