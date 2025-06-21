/**
 * Gestor de autenticación JWT simplificado
 * Sin renovación automática - la sesión expira naturalmente
 */
class AuthManager {
    constructor() {
      this.token = null
      this.user = null
      this.tokenExpiry = null
      // Keep reference to the original fetch (bound to window) before installing the interceptor
      this.originalFetch = window.fetch.bind(window)
      this.API_BASE = window.API_BASE_URL || "http://localhost:5000"
      
      // 🔄 RESTAURAR SESIÓN AL INICIALIZAR
      this.restoreFromStorage()
      
      console.log("🔐 AuthManager inicializado (modo simple)")
    }
  
    /**
     * Almacena el token de forma segura en memoria y sessionStorage
     */
    setToken(tokenData) {
      if (!tokenData || !tokenData.token) {
        console.warn("⚠️ Token inválido recibido")
        return false
      }
  
      try {
        // Decodificar JWT para obtener información de expiración
        const payload = this.decodeJWT(tokenData.token)
        
        this.token = tokenData.token
        this.user = tokenData.user
        this.tokenExpiry = payload.exp * 1000 // Convertir a milisegundos
        
        // 🔒 PERSISTIR EN SESSIONSTORAGE (más seguro que localStorage)
        this.saveToStorage()
        
        console.log("✅ Token almacenado correctamente", {
          user: this.user?.nombre || this.user?.usuario,
          expiresAt: new Date(this.tokenExpiry).toLocaleString(),
          hoursRemaining: Math.round((this.tokenExpiry - Date.now()) / (1000 * 60 * 60))
        })
        
        return true
      } catch (error) {
        console.error("❌ Error al procesar token:", error)
        return false
      }
    }
  
    /**
     * Obtiene el token actual si es válido
     */
    getToken() {
      if (!this.token) {
        console.log("🔍 No hay token almacenado")
        return null
      }
      
      if (this.isTokenExpired()) {
        console.log("⏰ Token expirado, limpiando sesión")
        this.clearSession()
        return null
      }
      
      return this.token
    }
  
    /**
     * Verifica si el token ha expirado
     */
    isTokenExpired() {
      if (!this.tokenExpiry) return true
      
      // Considerar expirado 30 segundos antes para evitar errores de timing
      const bufferTime = 30 * 1000
      const isExpired = Date.now() >= (this.tokenExpiry - bufferTime)
      
      if (isExpired) {
        console.log("⏰ Token ha expirado")
      }
      
      return isExpired
    }
  
    /**
     * Obtiene información del usuario actual
     */
    getUser() {
      return this.user
    }
  
    /**
     * Verifica si el usuario está autenticado
     */
    isAuthenticated() {
      const hasValidToken = this.getToken() !== null
      console.log("🔐 ¿Usuario autenticado?", hasValidToken)
      return hasValidToken
    }
  
    /**
     * Cierra sesión y limpia todos los datos
     */
    logout() {
      console.log("🚪 Cerrando sesión...")
      this.clearSession()
      this.redirectToLogin()
    }
  
    /**
     * Limpia toda la información de sesión
     */
    clearSession() {
      this.token = null
      this.user = null
      this.tokenExpiry = null
      
      // 🗑️ LIMPIAR SESSIONSTORAGE
      this.clearStorage()
      
      console.log("🧹 Sesión limpiada")
    }
  
    /**
     * Guardar en sessionStorage
     */
    saveToStorage() {
      try {
        const sessionData = {
          token: this.token,
          user: this.user,
          tokenExpiry: this.tokenExpiry,
          timestamp: Date.now()
        }
        
        sessionStorage.setItem('auth_session', JSON.stringify(sessionData))
        console.log("💾 Sesión guardada en storage")
      } catch (error) {
        console.warn("⚠️ Error guardando en storage:", error)
      }
    }
  
    /**
     * Restaurar desde sessionStorage
     */
    restoreFromStorage() {
      try {
        const stored = sessionStorage.getItem('auth_session')
        if (!stored) {
          console.log("📭 No hay sesión guardada")
          return false
        }
  
        const sessionData = JSON.parse(stored)
        
        // Verificar que no haya expirado
        if (sessionData.tokenExpiry && Date.now() < sessionData.tokenExpiry) {
          this.token = sessionData.token
          this.user = sessionData.user
          this.tokenExpiry = sessionData.tokenExpiry
          
          console.log("🔄 Sesión restaurada desde storage", {
            user: this.user?.nombre || this.user?.usuario,
            timeRemaining: Math.round((this.tokenExpiry - Date.now()) / (1000 * 60)) + " minutos"
          })
          return true
        } else {
          console.log("⏰ Sesión guardada ha expirado")
          this.clearStorage()
          return false
        }
      } catch (error) {
        console.warn("⚠️ Error restaurando sesión:", error)
        this.clearStorage()
        return false
      }
    }
  
    /**
     * Limpiar sessionStorage
     */
    clearStorage() {
      try {
        sessionStorage.removeItem('auth_session')
        console.log("🗑️ Storage limpiado")
      } catch (error) {
        console.warn("⚠️ Error limpiando storage:", error)
      }
    }
  
    /**
     * Decodifica un JWT (solo la parte del payload)
     */
    decodeJWT(token) {
      try {
        const parts = token.split('.')
        if (parts.length !== 3) {
          throw new Error("Token JWT inválido")
        }
        
        const payload = parts[1]
        const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
        return decoded
      } catch (error) {
        throw new Error("No se pudo decodificar el JWT: " + error.message)
      }
    }
  
    /**
     * Realiza una petición HTTP autenticada
     */
    async makeAuthenticatedRequest(url, options = {}) {
      const token = this.getToken()
      
      if (!token) {
        throw new Error("No hay token de autenticación disponible")
      }
      
      // Preparar headers
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
      
      // Construir URL completa
      let fullUrl = url.startsWith('http') ? url : `${this.API_BASE}${url}`
      
      // 🔧 AGREGAR BARRA FINAL SI ES UNA URL DE API Y NO LA TIENE
      if (fullUrl.includes('/api/') && !fullUrl.endsWith('/') && !fullUrl.includes('?')) {
        fullUrl += '/'
      }
      
      console.log("📡 Petición autenticada:", fullUrl)
      
      // Realizar petición
      const fetchFn = this.originalFetch || fetch
      const response = await fetchFn(fullUrl, {
        ...options,
        headers
      })
      
      // Manejar respuestas de autorización
      if (response.status === 401) {
        console.warn("❌ Token rechazado por el servidor (401)")
        this.logout()
        throw new Error("Sesión expirada")
      }
      
      return response
    }
  
    /**
     * Redirige al login
     */
    redirectToLogin() {
      const currentPath = window.location.pathname
      const loginPath = '/login'
      
      if (currentPath !== loginPath) {
        console.log("🔄 Redirigiendo al login...")
        window.location.href = loginPath
      }
    }
  
    /**
     * Redirige después del login exitoso
     */
    redirectAfterLogin() {
      const redirectUrl = '/admin' // Siempre al dashboard principal
      
      // Evitar redirección si ya estamos en la página correcta
      if (window.location.pathname === redirectUrl) {
        console.log("✅ Ya estamos en la página correcta")
        return
      }
      
      console.log("🎯 Redirigiendo al dashboard:", redirectUrl)
      window.location.href = redirectUrl
    }
  
    /**
     * Intercepta todas las peticiones fetch para añadir autorización automáticamente
     */
    setupFetchInterceptor() {
      const authManager = this
      // Preserve the original fetch (bound to window) for passthrough calls
      this.originalFetch = window.fetch.bind(window)
      
      window.fetch = async function(url, options = {}) {
        // Solo interceptar peticiones a la API (no archivos estáticos ni login)
        const isApiRequest = typeof url === 'string' && 
          (url.includes('/api/') || 
           (url.includes(authManager.API_BASE) && !url.includes('/auth/login')))
        
        if (isApiRequest && authManager.isAuthenticated()) {
          console.log("🔄 Interceptando petición API:", url)
          return authManager.makeAuthenticatedRequest(url, options)
        }
        
        // Para peticiones que no son de API, usar fetch normal
        return authManager.originalFetch(url, options)
      }
      
      console.log("🎯 Interceptor de fetch configurado")
    }
  
    /**
     * Obtener tiempo restante del token en minutos
     */
    getTokenTimeRemaining() {
      if (!this.tokenExpiry) return 0
      const timeRemaining = this.tokenExpiry - Date.now()
      return Math.max(0, Math.floor(timeRemaining / (1000 * 60)))
    }
  
    /**
     * Obtener información de debug
     */
    getDebugInfo() {
      return {
        hasToken: !!this.token,
        isAuthenticated: this.isAuthenticated(),
        user: this.user,
        tokenExpiry: this.tokenExpiry ? new Date(this.tokenExpiry).toLocaleString() : null,
        timeRemaining: this.getTokenTimeRemaining() + " minutos"
      }
    }
  }
  
  // Crear instancia global
  window.authManager = new AuthManager()
  
  // Configurar interceptor
  window.authManager.setupFetchInterceptor()
  
  // Debug global (puedes llamar authManager.getDebugInfo() en consola)
  window.authDebug = () => {
    console.table(window.authManager.getDebugInfo())
  }
  
  // Exportar para uso en módulos
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager
  }
  
  console.log("🚀 AuthManager simplificado cargado correctamente")
