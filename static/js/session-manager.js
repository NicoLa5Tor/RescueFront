/**
 * SESSION MANAGER - Gestión de sesiones activas
 * Componente opcional para visualizar y gestionar sesiones de usuario
 */

class SessionManager {
    constructor() {
        this.apiClient = window.apiClient || new window.EndpointTestClient();
        this.sessions = [];
        this.currentSessionId = null;
    }

    /**
     * Cargar sesiones activas del usuario
     */
    async loadSessions() {
        try {
            const response = await this.apiClient.getSessions();
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.sessions) {
                    this.sessions = data.sessions;
                    this.currentSessionId = data.current_session_id;
                    return this.sessions;
                }
            }
            return [];
        } catch (error) {
            console.error('Error loading sessions:', error);
            return [];
        }
    }

    /**
     * Cerrar una sesión específica
     */
    async closeSession(sessionId) {
        try {
            const response = await this.apiClient.closeSession(sessionId);
            if (response.ok) {
                // Actualizar la lista local
                this.sessions = this.sessions.filter(s => s.session_id !== sessionId);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error closing session:', error);
            return false;
        }
    }

    /**
     * Cerrar todas las demás sesiones (mantener solo la actual)
     */
    async closeAllOtherSessions() {
        try {
            const response = await this.apiClient.logoutAll();
            if (response.ok) {
                // Mantener solo la sesión actual
                this.sessions = this.sessions.filter(s => s.session_id === this.currentSessionId);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error closing all sessions:', error);
            return false;
        }
    }

    /**
     * Renderizar el componente de sesiones
     */
    renderSessionsWidget(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Container not found:', containerId);
            return;
        }

        const widget = `
            <div class="session-manager-widget">
                <div class="session-header">
                    <h3>
                        <i class="fas fa-shield-alt"></i>
                        Sesiones Activas
                    </h3>
                    <button class="refresh-sessions-btn" onclick="sessionManager.refreshSessions()">
                        <i class="fas fa-sync-alt"></i>
                        Actualizar
                    </button>
                </div>
                <div id="sessionsList" class="sessions-list">
                    <div class="loading-sessions">
                        <i class="fas fa-spinner fa-spin"></i>
                        Cargando sesiones...
                    </div>
                </div>
                <div class="session-actions">
                    <button class="btn-danger" onclick="sessionManager.confirmCloseAllSessions()">
                        <i class="fas fa-sign-out-alt"></i>
                        Cerrar Todas las Demás Sesiones
                    </button>
                </div>
            </div>

            <style>
                .session-manager-widget {
                    background: rgba(17, 24, 39, 0.95);
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 20px;
                    color: white;
                }
                
                .session-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .session-header h3 {
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: white;
                    font-size: 18px;
                }
                
                .refresh-sessions-btn {
                    background: rgba(59, 130, 246, 0.2);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    color: #60a5fa;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s;
                }
                
                .refresh-sessions-btn:hover {
                    background: rgba(59, 130, 246, 0.3);
                }
                
                .sessions-list {
                    min-height: 120px;
                    margin-bottom: 16px;
                }
                
                .loading-sessions {
                    text-align: center;
                    color: rgba(255, 255, 255, 0.6);
                    padding: 40px;
                }
                
                .session-item {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 8px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-left: 3px solid transparent;
                }
                
                .session-item.current {
                    border-left-color: #10b981;
                    background: rgba(16, 185, 129, 0.1);
                }
                
                .session-info {
                    flex: 1;
                }
                
                .session-device {
                    font-weight: 600;
                    margin-bottom: 4px;
                }
                
                .session-details {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.7);
                }
                
                .session-current-badge {
                    background: #10b981;
                    color: white;
                    font-size: 10px;
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-weight: bold;
                    margin-left: 8px;
                }
                
                .close-session-btn {
                    background: rgba(239, 68, 68, 0.2);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #f87171;
                    padding: 6px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 11px;
                    transition: all 0.2s;
                }
                
                .close-session-btn:hover {
                    background: rgba(239, 68, 68, 0.3);
                }
                
                .session-actions {
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    padding-top: 16px;
                }
                
                .btn-danger {
                    background: linear-gradient(135deg, #dc2626, #b91c1c);
                    border: none;
                    color: white;
                    padding: 10px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 13px;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    width: 100%;
                    justify-content: center;
                }
                
                .btn-danger:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
                }
            </style>
        `;

        container.innerHTML = widget;
        this.refreshSessions();
    }

    /**
     * Actualizar la lista de sesiones
     */
    async refreshSessions() {
        const sessionsList = document.getElementById('sessionsList');
        if (!sessionsList) return;

        sessionsList.innerHTML = `
            <div class="loading-sessions">
                <i class="fas fa-spinner fa-spin"></i>
                Cargando sesiones...
            </div>
        `;

        const sessions = await this.loadSessions();
        
        if (sessions.length === 0) {
            sessionsList.innerHTML = `
                <div class="loading-sessions">
                    <i class="fas fa-info-circle"></i>
                    No hay sesiones activas
                </div>
            `;
            return;
        }

        const sessionsHTML = sessions.map(session => {
            const isCurrent = session.session_id === this.currentSessionId;
            const deviceInfo = this.getDeviceInfo(session.user_agent || '');
            const lastActivity = new Date(session.last_activity).toLocaleString();
            
            return `
                <div class="session-item ${isCurrent ? 'current' : ''}">
                    <div class="session-info">
                        <div class="session-device">
                            <i class="${deviceInfo.icon}"></i>
                            ${deviceInfo.name}
                            ${isCurrent ? '<span class="session-current-badge">ACTUAL</span>' : ''}
                        </div>
                        <div class="session-details">
                            IP: ${session.ip_address || 'Desconocida'} • 
                            Última actividad: ${lastActivity}
                        </div>
                    </div>
                    ${!isCurrent ? `
                        <button class="close-session-btn" onclick="sessionManager.closeSessionConfirm('${session.session_id}')">
                            <i class="fas fa-times"></i>
                            Cerrar
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');

        sessionsList.innerHTML = sessionsHTML;
    }

    /**
     * Obtener información del dispositivo basado en User-Agent
     */
    getDeviceInfo(userAgent) {
        const ua = userAgent.toLowerCase();
        
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
            return { icon: 'fas fa-mobile-alt', name: 'Dispositivo Móvil' };
        } else if (ua.includes('tablet') || ua.includes('ipad')) {
            return { icon: 'fas fa-tablet-alt', name: 'Tablet' };
        } else if (ua.includes('chrome')) {
            return { icon: 'fab fa-chrome', name: 'Chrome' };
        } else if (ua.includes('firefox')) {
            return { icon: 'fab fa-firefox', name: 'Firefox' };
        } else if (ua.includes('safari')) {
            return { icon: 'fab fa-safari', name: 'Safari' };
        } else if (ua.includes('edge')) {
            return { icon: 'fab fa-edge', name: 'Edge' };
        } else {
            return { icon: 'fas fa-desktop', name: 'Navegador de Escritorio' };
        }
    }

    /**
     * Confirmar cierre de sesión específica
     */
    closeSessionConfirm(sessionId) {
        if (confirm('¿Estás seguro de que quieres cerrar esta sesión?')) {
            this.closeSession(sessionId).then(success => {
                if (success) {
                    this.refreshSessions();
                    this.showNotification('Sesión cerrada correctamente', 'success');
                } else {
                    this.showNotification('Error al cerrar la sesión', 'error');
                }
            });
        }
    }

    /**
     * Confirmar cierre de todas las sesiones
     */
    confirmCloseAllSessions() {
        if (confirm('¿Estás seguro de que quieres cerrar todas las demás sesiones?\n\nEsto cerrará la sesión en todos los otros dispositivos.')) {
            this.closeAllOtherSessions().then(success => {
                if (success) {
                    this.refreshSessions();
                    this.showNotification('Todas las demás sesiones han sido cerradas', 'success');
                } else {
                    this.showNotification('Error al cerrar las sesiones', 'error');
                }
            });
        }
    }

    /**
     * Mostrar notificación simple
     */
    showNotification(message, type) {
        // Usar sistema de notificaciones existente si está disponible
        if (typeof showSimpleNotification === 'function') {
            showSimpleNotification(message, type);
        } else {
            // Fallback simple
            alert(message);
        }
    }
}

// Instanciar globalmente si no existe
if (typeof window.sessionManager === 'undefined') {
    window.sessionManager = new SessionManager();
}

// Exportar para uso como módulo si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionManager;
}