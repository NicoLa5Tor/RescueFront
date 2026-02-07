/**
 * SISTEMA GLOBAL DE ALERTAS PARA EMPRESA
 * Se carga automáticamente en TODAS las vistas cuando el usuario es empresa
 */

class EmpresaAlertsGlobal {
    constructor() {
        this.empresaId = null;
        this.isActive = false;
        this.alertsCache = new Map();
        this.hardwareCache = new Map();
        this.refreshInterval = null;
        this.notificationBadge = null;
        this.alertsPanel = null;
        this.alertsCount = 0;
        this.hardwareCount = 0;
        this.currentAlertIds = new Set(); // IDs de alertas actuales/activas
        this.seenAlertIds = new Set(); // Histórico de TODOS los IDs que hemos visto
        this.shownAlertIds = new Set(); // IDs de alertas YA MOSTRADAS (persistente)
        this.currentHardwareIds = new Set();
        this.shownHardwareIds = new Set();
        this.activePanelTab = 'alerts';
        this.newAlertModalOpen = false; // Para evitar múltiples modales
        this.isFirstLoad = true; // Flag para saber si es la primera carga
        this.isHardwareFirstLoad = true;
        this.localStorageKey = 'empresa_alerts_shown'; // Clave localStorage
        this.hardwareStorageKey = 'empresa_hardware_shown';
        this.badgeInitAttempts = 0;
        this.maxBadgeInitAttempts = 10;
        
        this.initializeSystem();
    }
    
    async initializeSystem() {
        ////console.log('🏢 GLOBAL ALERTS: Inicializando sistema global de alertas para empresa...');
        
        // Verificar si el usuario es empresa
        if (!this.isEmpresaUser()) {
            //console.log('🏢 GLOBAL ALERTS: Usuario no es empresa, omitiendo inicialización');
            return;
        }
        
        this.empresaId = window.currentUser?.empresa_id || window.currentUser?.id;
        
        if (!this.empresaId) {
            //console.error('🏢 GLOBAL ALERTS: No se pudo obtener ID de empresa');
            return;
        }
        
        //console.log(`🏢 GLOBAL ALERTS: Sistema iniciado para empresa ${this.empresaId}`);
        this.isActive = true;
        
        // Cargar alertas ya mostradas desde localStorage
        this.loadShownAlertsFromStorage();
        this.loadShownHardwareFromStorage();
        
        // Crear elementos UI globales
        await this.createGlobalUI();
        
        // Cargar alertas iniciales
        await this.loadAlerts();
        await this.loadHardwareStatus();
        this.removeHardwarePopupElements();
        
        // Configurar auto-refresh cada 30 segundos
        this.startAutoRefresh();
        
        // Configurar listeners globales
        this.setupGlobalListeners();
        
        //console.log('✅ GLOBAL ALERTS: Sistema completamente inicializado');
    }
    
    isEmpresaUser() {
        return window.currentUser?.role === 'empresa' || 
               window.EMPRESA_ROLE === 'empresa' ||
               window.location.pathname.startsWith('/empresa');
    }
    
    async createGlobalUI() {
        // Crear badge de notificación global
        this.createNotificationBadge();
        
        // Crear panel flotante de alertas
        this.createFloatingAlertsPanel();
        
        // Inyectar estilos CSS
        this.injectStyles();
    }
    
    createNotificationBadge() {
        if (this.headerButton || this.notificationBadge) {
            return;
        }
        // Buscar el botón de notificaciones del header
        const headerNotificationBtn = document.querySelector('.navbar__action[aria-label="Notifications"]');
        const notificationBadge = document.querySelector('.navbar__notification-badge');
        
        if (!headerNotificationBtn || !notificationBadge) {
            this.badgeInitAttempts += 1;
            if (this.badgeInitAttempts <= this.maxBadgeInitAttempts) {
                setTimeout(() => this.createNotificationBadge(), 300);
            }
            return;
        }
        
        // Configurar el botón del header para que abra el panel
        headerNotificationBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleAlertsPanel();
        });
        
        // Agregar ID al badge para poder actualizarlo
        notificationBadge.id = 'alertsCount';
        
        // Configurar estilos del badge
        notificationBadge.style.display = 'none'; // Oculto por defecto
        notificationBadge.style.position = 'absolute';
        notificationBadge.style.top = '-5px';
        notificationBadge.style.right = '-5px';
        notificationBadge.style.backgroundColor = '#ef4444';
        notificationBadge.style.color = 'white';
        notificationBadge.style.borderRadius = '50%';
        notificationBadge.style.minWidth = '18px';
        notificationBadge.style.height = '18px';
        notificationBadge.style.fontSize = '11px';
        notificationBadge.style.fontWeight = 'bold';
        notificationBadge.style.textAlign = 'center';
        notificationBadge.style.lineHeight = '18px';
        notificationBadge.style.zIndex = '10';
        
        // Guardar referencia
        this.notificationBadge = notificationBadge;
        this.headerNotificationBtn = headerNotificationBtn;
        
        //console.log('✅ GLOBAL ALERTS: Icono de notificaciones del header configurado');
    }
    
    createFloatingAlertsPanel() {
        const panelHTML = `
            <div id="globalAlertsPanel" class="empresa-alerts-panel hidden">
                <div class="empresa-alerts-panel__header">
                    <div class="empresa-alerts-panel__title">
                        <i class="fas fa-bell"></i>
                        Centro de alertas
                    </div>
                    <button class="empresa-alerts-panel__close" onclick="window.empresaAlertsGlobal.closeAlertsPanel()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="empresa-alerts-panel__tabs">
                    <button class="empresa-alerts-panel__tab active" data-tab="alerts" onclick="window.empresaAlertsGlobal.switchPanelTab('alerts')">
                        Alertas
                        <span class="empresa-alerts-panel__tab-count" id="alertsTabCount">0</span>
                    </button>
                    <button class="empresa-alerts-panel__tab" data-tab="hardware" onclick="window.empresaAlertsGlobal.switchPanelTab('hardware')">
                        Hardware
                        <span class="empresa-alerts-panel__tab-count" id="hardwareTabCount">0</span>
                    </button>
                </div>
                
                <div class="empresa-alerts-panel__body" id="globalAlertsList">
                    <div class="empresa-alerts-panel__loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span>Cargando alertas...</span>
                    </div>
                </div>

                <div class="empresa-alerts-panel__body hidden" id="globalHardwareList">
                    <div class="empresa-alerts-panel__loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span>Verificando hardware...</span>
                    </div>
                </div>
                
                <div class="empresa-alerts-panel__footer">
                    <a href="/empresa/alertas" class="empresa-alerts-panel__action">
                        <i class="fas fa-list"></i>
                        Ver Todas las Alertas
                    </a>
                    <button class="empresa-alerts-panel__action empresa-alerts-panel__action--secondary" onclick="window.empresaAlertsGlobal.refreshAlerts()">
                        <i class="fas fa-sync-alt"></i>
                        Actualizar
                    </button>
                </div>
            </div>
            
            <div id="globalAlertsPanelOverlay" class="empresa-alerts-overlay hidden" onclick="window.empresaAlertsGlobal.closeAlertsPanel()"></div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', panelHTML);
        this.alertsPanel = document.getElementById('globalAlertsPanel');
        this.switchPanelTab('alerts');
        
        //console.log('✅ GLOBAL ALERTS: Panel flotante de alertas creado');
    }
    
    injectStyles() {
        const styles = `
            <style id="empresaAlertsGlobalStyles">
                /* Animación de brillo para el badge del header */
                @keyframes alertGlow {
                    0%, 100% {
                        transform: scale(1);
                        box-shadow: 0 0 0 rgba(239, 68, 68, 0.4), 0 0 0 rgba(255, 255, 255, 0.2);
                    }
                    50% {
                        transform: scale(1.1);
                        box-shadow: 0 0 8px rgba(239, 68, 68, 0.8), 0 0 12px rgba(239, 68, 68, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.6);
                    }
                }
                
                /* Panel flotante */
                .empresa-alerts-panel {
                    position: fixed;
                    top: 50%;
                    right: 20px;
                    transform: translateY(-50%);
                    width: 420px;
                    max-height: 80vh;
                    background: rgba(17, 24, 39, 0.95);
                    backdrop-filter: blur(20px);
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                    z-index: 1001;
                    display: flex;
                    flex-direction: column;
                    transition: all 0.3s ease;
                }
                
                .empresa-alerts-panel.hidden {
                    opacity: 0;
                    transform: translateY(-50%) translateX(100%);
                    pointer-events: none;
                }
                
                .empresa-alerts-panel__header {
                    padding: 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .empresa-alerts-panel__tabs {
                    display: flex;
                    gap: 8px;
                    padding: 12px 16px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                }

                .empresa-alerts-panel__tab {
                    flex: 1;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    color: rgba(255, 255, 255, 0.7);
                    border-radius: 10px;
                    padding: 8px 10px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                }

                .empresa-alerts-panel__tab.active {
                    background: rgba(59, 130, 246, 0.25);
                    color: #ffffff;
                    border-color: rgba(59, 130, 246, 0.45);
                }

                .empresa-alerts-panel__tab-count {
                    min-width: 20px;
                    height: 20px;
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.15);
                    color: #ffffff;
                    font-size: 11px;
                    font-weight: 700;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .empresa-alerts-panel__title {
                    color: white;
                    font-weight: 600;
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex: 1;
                }
                
                .empresa-alerts-panel__title i {
                    color: #fbbf24;
                }
                
                .empresa-alerts-panel__close {
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 18px;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                }
                
                .empresa-alerts-panel__close:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }
                
                .empresa-alerts-panel__body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 0;
                    max-height: 400px;
                }

                .empresa-alerts-panel__body.hidden {
                    display: none;
                }
                
                .empresa-alerts-panel__loading {
                    padding: 40px 20px;
                    text-align: center;
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 14px;
                }
                
                .empresa-alerts-panel__loading i {
                    font-size: 24px;
                    margin-bottom: 12px;
                    display: block;
                }
                
                .empresa-alerts-panel__item {
                    padding: 16px 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    transition: all 0.2s ease;
                    cursor: pointer;
                }
                
                .empresa-alerts-panel__item:hover {
                    background: rgba(255, 255, 255, 0.05);
                }
                
                .empresa-alerts-panel__item:last-child {
                    border-bottom: none;
                }
                
                .empresa-alerts-panel__item-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }
                
                .empresa-alerts-panel__item-title {
                    color: white;
                    font-weight: 600;
                    font-size: 14px;
                    flex: 1;
                }
                
                .empresa-alerts-panel__priority {
                    font-size: 10px;
                    font-weight: 700;
                    padding: 2px 8px;
                    border-radius: 10px;
                    text-transform: uppercase;
                }
                
                .empresa-alerts-panel__priority.critica {
                    background: #dc2626;
                    color: white;
                }
                
                .empresa-alerts-panel__priority.alta {
                    background: #ea580c;
                    color: white;
                }
                
                .empresa-alerts-panel__priority.media {
                    background: #eab308;
                    color: #1f2937;
                }
                
                .empresa-alerts-panel__priority.baja {
                    background: #16a34a;
                    color: white;
                }
                
                .empresa-alerts-panel__item-info {
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 12px;
                    line-height: 1.4;
                }
                
                .empresa-alerts-panel__item-meta {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 11px;
                    margin-top: 4px;
                }
                
                .empresa-alerts-panel__footer {
                    padding: 16px 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    gap: 8px;
                }
                
                .empresa-alerts-panel__action {
                    flex: 1;
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: white;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 8px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-decoration: none;
                    text-align: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                }
                
                .empresa-alerts-panel__action--secondary {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .empresa-alerts-panel__action:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }
                
                .empresa-alerts-panel__action--secondary:hover {
                    background: rgba(255, 255, 255, 0.2);
                    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
                }
                
                .empresa-alerts-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.3);
                    z-index: 1000;
                }
                
                .no-alerts-state {
                    padding: 40px 20px;
                    text-align: center;
                    color: rgba(255, 255, 255, 0.6);
                }
                
                .no-alerts-state i {
                    font-size: 48px;
                    margin-bottom: 16px;
                    display: block;
                    color: #16a34a;
                }
                
                /* Responsivo */
                @media (max-width: 768px) {
                    .empresa-alerts-panel {
                        width: calc(100vw - 40px);
                        right: 20px;
                        left: 20px;
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    async loadAlerts() {
        if (!this.isActive) return;
        
        //console.log('🏢 GLOBAL ALERTS: Cargando alertas...');
        
        try {
            // Usar el api-client para obtener alertas con refresh automático
            const apiClient = window.apiClient || new window.EndpointTestClient();
            const response = await apiClient.get_active_alerts_by_empresa(this.empresaId, 10, 0);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success && data.data && Array.isArray(data.data)) {
                    const alerts = data.data;
                    
                    // Detectar alertas nuevas
                    this.checkForNewAlerts(alerts);
                    
                    this.alertsCache.set('current', {
                        alerts: alerts,
                        timestamp: Date.now()
                    });
                    
                    this.updateUI(alerts);
                    //console.log(`✅ GLOBAL ALERTS: ${alerts.length} alertas cargadas`);
                } else {
                    this.updateUI([]);
                    //console.log('🏢 GLOBAL ALERTS: No hay alertas activas');
                }
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
        } catch (error) {
            //console.error('💥 GLOBAL ALERTS: Error cargando alertas:', error);
            this.showError();
        }
    }

    async loadHardwareStatus() {
        if (!this.isActive) return;

        try {
            const base = typeof window.__buildApiUrl === 'function'
                ? window.__buildApiUrl('')
                : (window.__APP_CONFIG?.apiUrl || '');
            const baseUrl = base.endsWith('/') ? base.slice(0, -1) : base;
            const url = `${baseUrl}/api/hardware/physical-status/check`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const items = this.normalizeHardwareItems(data);

            this.checkForNewHardware(items);
            this.hardwareCache.set('current', {
                items,
                timestamp: Date.now()
            });
            this.updateHardwarePanel(items);
            this.hardwareCount = items.length;
            this.updateNotificationBadge();
            this.updateTabCounts(null, items.length);
        } catch (error) {
            this.showHardwareError();
        }
    }
    
    updateUI(alerts) {
        const alertsCount = alerts.length;
        this.alertsCount = alertsCount;
        this.updateNotificationBadge();
        
        // Actualizar panel
        this.updateAlertsPanel(alerts);
        this.updateTabCounts(alertsCount, null);
    }

    updateNotificationBadge() {
        if (!this.notificationBadge) return;

        const total = this.alertsCount + this.hardwareCount;
        this.notificationBadge.textContent = total;

        if (total > 0) {
            this.notificationBadge.style.display = 'flex';
            this.notificationBadge.style.animation = 'alertGlow 2s infinite';
        } else {
            this.notificationBadge.style.display = 'none';
            this.notificationBadge.style.animation = 'none';
        }
    }
    
    updateAlertsPanel(alerts) {
        const panel = document.getElementById('globalAlertsList');
        if (!panel) return;
        
        if (alerts.length === 0) {
            panel.innerHTML = `
                <div class="no-alerts-state">
                    <i class="fas fa-check-circle"></i>
                    <h3 style="color: white; margin-bottom: 8px; font-size: 16px;">¡Todo en orden!</h3>
                    <p style="font-size: 14px;">No hay alertas activas en este momento</p>
                </div>
            `;
            return;
        }
        
        const alertsHTML = alerts.map(alert => {
            const timeAgo = getTimeAgo(alert.fecha_creacion);
            const priorityClass = alert.prioridad || 'media';
            
            return `
                <div class="empresa-alerts-panel__item" onclick="window.empresaAlertsGlobal.goToAlertDetails('${alert._id}')">
                    <div class="empresa-alerts-panel__item-header">
                        <div class="empresa-alerts-panel__item-title">
                            ${alert.hardware_nombre || alert.nombre_alerta || 'Alerta de Sistema'}
                        </div>
                        <span class="empresa-alerts-panel__priority ${priorityClass}">${priorityClass}</span>
                    </div>
                    <div class="empresa-alerts-panel__item-info">
                        <div><strong>${alert.empresa_nombre}</strong> - ${alert.sede}</div>
                        ${alert.descripcion ? `<div>${alert.descripcion.substring(0, 80)}...</div>` : ''}
                    </div>
                    <div class="empresa-alerts-panel__item-meta">${timeAgo}</div>
                </div>
            `;
        }).join('');
        
        panel.innerHTML = alertsHTML;
    }

    updateHardwarePanel(items) {
        const panel = document.getElementById('globalHardwareList');
        if (!panel) return;

        if (!items || items.length === 0) {
            panel.innerHTML = `
                <div class="no-alerts-state">
                    <i class="fas fa-check-circle"></i>
                    <h3 style="color: white; margin-bottom: 8px; font-size: 16px;">Todo en orden</h3>
                    <p style="font-size: 14px;">No hay incidencias fisicas en este momento</p>
                </div>
            `;
            return;
        }

        const itemsHTML = items.map(item => `
            <div class="empresa-alerts-panel__item" role="button" tabindex="0" onclick="window.empresaAlertsGlobal.goToHardwareDetails('${item.hardwareId || ''}')">
                <div class="empresa-alerts-panel__item-title">
                    ${item.hardwareName}
                </div>
                <div class="empresa-alerts-panel__item-info">
                    <div><strong>${item.empresaName}</strong> - ${item.sedeName}</div>
                </div>
                ${item.hardwareId ? `<div class="empresa-alerts-panel__item-meta">ID: ${item.hardwareId}</div>` : ''}
            </div>
        `).join('');

        panel.innerHTML = itemsHTML;
    }

    updateTabCounts(alertsCount, hardwareCount) {
        const alertsBadge = document.getElementById('alertsTabCount');
        const hardwareBadge = document.getElementById('hardwareTabCount');

        if (alertsBadge && typeof alertsCount === 'number') {
            alertsBadge.textContent = alertsCount;
        }
        if (hardwareBadge && typeof hardwareCount === 'number') {
            hardwareBadge.textContent = hardwareCount;
        }
    }

    switchPanelTab(tab) {
        const alertsList = document.getElementById('globalAlertsList');
        const hardwareList = document.getElementById('globalHardwareList');
        const tabs = this.alertsPanel ? this.alertsPanel.querySelectorAll('.empresa-alerts-panel__tab') : [];

        if (!alertsList || !hardwareList) return;

        tabs.forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tab);
        });

        alertsList.classList.toggle('hidden', tab !== 'alerts');
        hardwareList.classList.toggle('hidden', tab !== 'hardware');
        this.activePanelTab = tab;
    }

    normalizeHardwareItems(data) {
        if (!data) return [];
        if (Array.isArray(data)) return data.map(item => this.normalizeHardwareItem(item));

        const candidates = [
            data.data,
            data.items,
            data.hardware,
            data.result,
            data.results
        ];

        const list = candidates.find(Array.isArray) || [];
        return list.map(item => this.normalizeHardwareItem(item));
    }

    normalizeHardwareItem(item) {
        const hardwareId = item?.hardware_id || item?.hardwareId || item?.id || item?._id || '';
        const hardwareName = item?.hardware_nombre || item?.hardwareName || item?.nombre_hardware || item?.nombre || 'Hardware sin nombre';
        const empresaName = item?.empresa_nombre || item?.empresaName || item?.empresa || item?.company_name || 'Empresa sin nombre';
        const sedeName = item?.sede || item?.sede_nombre || item?.site || item?.location || 'Sede no especificada';
        const stableId = hardwareId || `${hardwareName}-${empresaName}-${sedeName}`.replace(/\\s+/g, '_').toLowerCase();

        return {
            id: stableId,
            hardwareId,
            hardwareName,
            empresaName,
            sedeName
        };
    }
    
    showError() {
        const panel = document.getElementById('globalAlertsList');
        if (panel) {
            panel.innerHTML = `
                <div class="empresa-alerts-panel__loading" style="color: #f87171;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Error cargando alertas</span>
                </div>
            `;
        }
    }

    showHardwareError() {
        const panel = document.getElementById('globalHardwareList');
        if (panel) {
            panel.innerHTML = `
                <div class="empresa-alerts-panel__loading" style="color: #f87171;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Error cargando estado fisico</span>
                </div>
            `;
        }
    }

    checkForNewHardware(items) {
        if (!items || items.length === 0) {
            this.currentHardwareIds.clear();
            return;
        }

        const newIds = new Set(items.map(item => item.id));
        const newlyAppeared = [...newIds].filter(id => !this.currentHardwareIds.has(id));

        if (this.isHardwareFirstLoad) {
            if (newIds.size > 0) {
                this.removeHardwarePopupElements();
                this.openAlertsPanel();
                this.switchPanelTab('hardware');
                this.markHardwareAsShown(newlyAppeared.length ? newlyAppeared : Array.from(newIds));
            }
        } else if (newlyAppeared.length > 0) {
            this.removeHardwarePopupElements();
            this.openAlertsPanel();
            this.switchPanelTab('hardware');
            this.markHardwareAsShown(newlyAppeared);
        }

        this.currentHardwareIds = new Set(newIds);
        this.isHardwareFirstLoad = false;
    }

    removeHardwarePopupElements() {
        document.querySelectorAll('.hardware-popup').forEach(el => el.remove());
    }
    
    startAutoRefresh() {
        // Actualizar cada 10 segundos
        this.refreshInterval = setInterval(() => {
            //console.log('🔄 AUTO-REFRESH: Cargando alertas automáticamente...');
            this.loadAlerts();
            this.loadHardwareStatus();
        }, 10000);
        
        //console.log('🔄 GLOBAL ALERTS: Auto-refresh configurado (10s)');
    }
    
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
    
    setupGlobalListeners() {
        // Listener para cambios de página
        window.addEventListener('beforeunload', () => {
            this.stopAutoRefresh();
        });
        
        // Listener para visibilidad de página (pausar cuando no está visible)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAutoRefresh();
            } else {
                this.startAutoRefresh();
                this.loadAlerts(); // Cargar inmediatamente cuando regresa
                this.loadHardwareStatus();
            }
        });

        document.addEventListener('click', (event) => {
            const target = event.target.closest('.navbar__action[aria-label="Notifications"]');
            if (target) {
                event.preventDefault();
                this.toggleAlertsPanel();
            }
        });
    }
    
    // Métodos públicos para interacción UI
    toggleAlertsPanel() {
        const panel = this.alertsPanel;
        const overlay = document.getElementById('globalAlertsPanelOverlay');
        
        if (panel && overlay) {
            const isHidden = panel.classList.contains('hidden');
            
            if (isHidden) {
                panel.classList.remove('hidden');
                overlay.classList.remove('hidden');
                // Cargar alertas frescas al abrir
                this.loadAlerts();
                this.loadHardwareStatus();
            } else {
                panel.classList.add('hidden');
                overlay.classList.add('hidden');
            }
        }
    }
    
    openAlertsPanel() {
        //console.log('🚨 DEBUG: openAlertsPanel() llamado');
        const panel = this.alertsPanel;
        const overlay = document.getElementById('globalAlertsPanelOverlay');
        
        //console.log('🚨 DEBUG: elementos encontrados:', {
        //     panel: !!panel,
        //     overlay: !!overlay,
        //     panelHidden: panel ? panel.classList.contains('hidden') : 'N/A'
        // });
        
        if (panel && overlay) {
            //console.log('🚨 ABRIENDO PANEL DE ALERTAS AUTOMÁTICAMENTE');
            panel.classList.remove('hidden');
            overlay.classList.remove('hidden');
            
            // Verificar si se abrió correctamente
            setTimeout(() => {
                const isStillHidden = panel.classList.contains('hidden');
                //console.log('🚨 DEBUG: Panel abierto correctamente:', !isStillHidden);
            }, 100);
            
            // No necesita cargar alertas porque ya están actualizadas
        } else {
            //console.error('🚨 ERROR: No se encontraron elementos del panel');
        }
    }
    
    closeAlertsPanel() {
        const panel = this.alertsPanel;
        const overlay = document.getElementById('globalAlertsPanelOverlay');
        
        if (panel && overlay) {
            panel.classList.add('hidden');
            overlay.classList.add('hidden');
        }
    }
    
    async refreshAlerts() {
        const refreshBtn = document.querySelector('.empresa-alerts-panel__action--secondary');
        if (refreshBtn) {
            const originalHTML = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
            refreshBtn.disabled = true;
            
            await this.loadAlerts();
            await this.loadHardwareStatus();
            
            setTimeout(() => {
                refreshBtn.innerHTML = originalHTML;
                refreshBtn.disabled = false;
            }, 1000);
        } else {
            await this.loadAlerts();
            await this.loadHardwareStatus();
        }
    }
    
    // Método para detectar alertas nuevas usando histórico de IDs
    checkForNewAlerts(currentAlerts) {
        //console.log('🔍 DEBUG: checkForNewAlerts llamado', {
        //     currentAlerts: currentAlerts,
        //     alertsLength: currentAlerts?.length,
        //     currentAlertIdsSize: this.currentAlertIds.size,
        //     seenAlertIdsSize: this.seenAlertIds.size,
        //     isFirstLoad: this.isFirstLoad
        // });
        
        // Si no hay alertas actuales, actualizar currentAlertIds pero mantener seenAlertIds
        if (!currentAlerts || currentAlerts.length === 0) {
            //console.log('🔍 DEBUG: No hay alertas actuales, limpiando solo currentAlertIds');
            this.currentAlertIds.clear();
            // NO limpiar seenAlertIds - mantener el histórico
            return;
        }
        
        const newCurrentAlertIds = new Set(currentAlerts.map(alert => alert._id));
        //console.log('🔍 DEBUG: IDs actuales:', Array.from(newCurrentAlertIds));
        //console.log('🔍 DEBUG: IDs histórico completo:', Array.from(this.seenAlertIds));
        //console.log('🔍 DEBUG: IDs activos previos:', Array.from(this.currentAlertIds));
        
        // Primera carga: solo mostrar alertas que NUNCA hemos mostrado antes
        if (this.isFirstLoad) {
            //console.log('🔍 PRIMERA CARGA: Procesando alertas existentes');
            
            // Filtrar solo alertas que NUNCA fueron mostradas
            const neverShownAlerts = [...newCurrentAlertIds].filter(id => !this.shownAlertIds.has(id));
            //console.log('🔍 DEBUG: Alertas nunca mostradas:', neverShownAlerts);
            
            if (neverShownAlerts.length > 0) {
                //console.log(`🚨 PRIMERA CARGA: ${neverShownAlerts.length} alerta(s) nueva(s) - ABRIENDO PANEL`);
                this.openAlertsPanel();
                this.switchPanelTab('alerts');
                // Marcar como mostradas
                this.markAlertsAsShown(neverShownAlerts);
            } else {
                //console.log('ℹ️ PRIMERA CARGA: Todas las alertas ya fueron mostradas antes');
            }
            
            // Registrar todas las alertas existentes como conocidas
            this.currentAlertIds = new Set(newCurrentAlertIds);
            this.seenAlertIds = new Set([...this.seenAlertIds, ...newCurrentAlertIds]);
            this.isFirstLoad = false;
            //console.log('🔍 DEBUG: Primera carga procesada');
            return;
        }
        
        // Buscar alertas REALMENTE nuevas: están en current pero NUNCA las hemos mostrado
        const trueNewAlertIds = [...newCurrentAlertIds].filter(id => !this.shownAlertIds.has(id));
        //console.log('🔍 DEBUG: Alertas REALMENTE nuevas (nunca mostradas):', trueNewAlertIds);
        
        if (trueNewAlertIds.length > 0) {
            //console.log(`🚨 NUEVA ALERTA DETECTADA: ${trueNewAlertIds.length} nueva(s) alerta(s)`, trueNewAlertIds);
            
            // Abrir el panel de alertas automáticamente
            //console.log('🚨 ABRIENDO PANEL DE ALERTAS PARA NUEVA ALERTA');
            this.openAlertsPanel();
            this.switchPanelTab('alerts');
            
            // Marcar como mostradas
            this.markAlertsAsShown(trueNewAlertIds);
        } else {
            //console.log('ℹ️ No se encontraron alertas nuevas (todas ya mostradas)');
        }
        
        // Actualizar conjuntos:
        // 1. Actualizar alertas activas actuales
        this.currentAlertIds = new Set(newCurrentAlertIds);
        // 2. Añadir cualquier ID nuevo al histórico
        this.seenAlertIds = new Set([...this.seenAlertIds, ...newCurrentAlertIds]);
        
        //console.log('🔍 DEBUG: IDs activos actualizados:', Array.from(this.currentAlertIds));
        //console.log('🔍 DEBUG: Histórico actualizado:', Array.from(this.seenAlertIds));
    }
    
    // ===== FUNCIONES DEL MODAL POPUP =====
    // Método para mostrar modal de nueva alerta
    showNewAlertModal(alert) {
        if (this.newAlertModalOpen) {
            //console.log('⏳ Modal de nueva alerta ya abierto, omitiendo...');
            return;
        }
        
        //console.log('🚨 MOSTRANDO MODAL DE NUEVA ALERTA:', alert);
        this.newAlertModalOpen = true;
        
        // Crear overlay y modal
        this.createNewAlertModal(alert);
        
        // Mostrar con animación
        setTimeout(() => {
            const modal = document.getElementById('newAlertNotificationModal');
            const overlay = document.getElementById('newAlertNotificationOverlay');
            
            if (modal && overlay) {
                overlay.classList.remove('hidden');
                modal.classList.remove('scale-95', 'opacity-0');
                modal.classList.add('scale-100', 'opacity-100');
            }
        }, 100);
    }
    
    // Crear el modal de nueva alerta
    createNewAlertModal(alert) {
        // Eliminar modal existente si existe
        const existingModal = document.getElementById('newAlertNotificationModal');
        const existingOverlay = document.getElementById('newAlertNotificationOverlay');
        if (existingModal) existingModal.remove();
        if (existingOverlay) existingOverlay.remove();
        
        const isUserOrigin = alert.data?.origen === 'usuario_movil' || alert.activacion_alerta?.tipo_activacion === 'usuario';
        const isHardwareOrigin = alert.data?.tipo_mensaje === 'alarma' || alert.activacion_alerta?.tipo_activacion === 'hardware';
        const isEmpresaOrigin = alert.data?.origen === 'empresa_web' || alert.activacion_alerta?.tipo_activacion === 'empresa';
        
        let originIcon, originText, originColor;
        
        if (isUserOrigin) {
            originIcon = 'fas fa-user-shield';
            originText = 'Usuario Móvil';
            originColor = 'from-purple-600 to-indigo-700';
        } else if (isHardwareOrigin) {
            originIcon = 'fas fa-microchip';
            originText = 'Hardware';
            originColor = 'from-blue-600 to-cyan-700';
        } else if (isEmpresaOrigin) {
            originIcon = 'fas fa-building';
            originText = 'Empresa';
            originColor = 'from-emerald-600 to-teal-700';
        } else {
            originIcon = 'fas fa-exclamation-triangle';
            originText = 'Sistema';
            originColor = 'from-gray-600 to-gray-700';
        }
        
        const modalHTML = `
            <!-- Overlay -->
            <div id="newAlertNotificationOverlay" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] hidden transition-all duration-300"></div>
            
            <!-- Modal -->
            <div id="newAlertNotificationModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 scale-95 opacity-0">
                <div class="bg-gradient-to-br ${originColor} rounded-3xl shadow-2xl max-w-md w-full mx-auto border border-white/20 backdrop-blur-lg">
                    <!-- Header con animación -->
                    <div class="text-center pt-8 pb-4">
                        <div class="relative mx-auto w-20 h-20 mb-4">
                            <!-- Círculo animado -->
                            <div class="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                            <div class="absolute inset-0 bg-white/30 rounded-full animate-pulse"></div>
                            <div class="relative w-20 h-20 bg-white/40 rounded-full flex items-center justify-center">
                                <i class="${originIcon} text-white text-3xl"></i>
                            </div>
                        </div>
                        
                        <h2 class="text-2xl font-bold text-white mb-2">🚨 ¡Nueva Alerta!</h2>
                        <p class="text-white/80 text-sm">Se ha detectado una nueva alerta en tu empresa</p>
                    </div>
                    
                    <!-- Contenido de la alerta -->
                    <div class="px-6 pb-6">
                        <div class="bg-black/20 rounded-2xl p-4 mb-4 border border-white/10">
                            <!-- Título y origen -->
                            <div class="flex items-center justify-between mb-3">
                                <h3 class="text-white font-semibold text-lg truncate flex-1">
                                    ${alert.hardware_nombre || alert.nombre_alerta || 'Alerta de Sistema'}
                                </h3>
                                <span class="ml-2 px-2 py-1 rounded-full text-xs font-bold bg-white/20 text-white flex items-center gap-1">
                                    <i class="${originIcon} text-xs"></i>
                                    ${originText}
                                </span>
                            </div>
                            
                            <!-- Información principal -->
                            <div class="space-y-2 text-sm">
                                <div class="flex items-center text-white/90">
                                    <i class="fas fa-building w-5 text-white/70"></i>
                                    <span><strong>${alert.empresa_nombre}</strong> - ${alert.sede}</span>
                                </div>
                                
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center text-white/90">
                                        <i class="fas fa-clock w-5 text-white/70"></i>
                                        <span>${getTimeAgo(alert.fecha_creacion)}</span>
                                    </div>
                                    
                                    <span class="px-2 py-1 rounded-full text-xs font-bold ${
                                        alert.prioridad === 'critica' ? 'bg-red-500' :
                                        alert.prioridad === 'alta' ? 'bg-orange-500' :
                                        alert.prioridad === 'media' ? 'bg-yellow-500' :
                                        'bg-green-500'
                                    } text-white">
                                        ${(alert.prioridad || 'media').toUpperCase()}
                                    </span>
                                </div>
                                
                                ${alert.descripcion ? `
                                    <div class="text-white/80 text-xs bg-black/20 rounded p-2 mt-2">
                                        <i class="fas fa-info-circle w-4 text-white/60"></i>
                                        ${alert.descripcion.length > 100 ? alert.descripcion.substring(0, 100) + '...' : alert.descripcion}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <!-- Botones de acción -->
                        <div class="flex gap-3">
                            <button 
                                onclick="window.empresaAlertsGlobal.dismissNewAlertModal()" 
                                class="flex-1 bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 border border-white/30">
                                <i class="fas fa-times mr-2"></i>
                                Cerrar
                            </button>
                            
                            <button 
                                onclick="window.empresaAlertsGlobal.goToAlertDetails('${alert._id}')" 
                                class="flex-1 bg-white hover:bg-white/90 text-gray-800 font-bold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl">
                                <i class="fas fa-eye mr-2"></i>
                                Ver Detalles
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Añadir al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Cerrar modal de nueva alerta
    dismissNewAlertModal() {
        const modal = document.getElementById('newAlertNotificationModal');
        const overlay = document.getElementById('newAlertNotificationOverlay');
        
        if (modal && overlay) {
            modal.classList.remove('scale-100', 'opacity-100');
            modal.classList.add('scale-95', 'opacity-0');
            overlay.classList.add('hidden');
            
            setTimeout(() => {
                if (modal.parentNode) modal.parentNode.removeChild(modal);
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }, 300);
        }
        
        this.newAlertModalOpen = false;
    }
    
    // ===== FIN FUNCIONES DEL MODAL POPUP =====
    
    // Ir a detalles de la alerta
    goToAlertDetails(alertId) {
        //console.log('🔗 DEBUG: goToAlertDetails llamado con ID:', alertId);
        
        // Cerrar modal si está abierto
        this.dismissNewAlertModal();
        
        // Cerrar el panel de alertas antes de redirigir
        this.closeAlertsPanel();
        
        // Guardar el ID de la alerta para abrir automáticamente
        sessionStorage.setItem('openAlertId', alertId);
        //console.log('🔗 DEBUG: ID guardado en sessionStorage:', alertId);

        if (window.empresaSpa && typeof window.empresaSpa.setView === 'function') {
            this.openAlertInSpa(alertId);
            return;
        }
        
        // Redirigir a la vista de alertas
        //console.log('🔗 DEBUG: Redirigiendo a /empresa/alertas');
        window.location.href = '/empresa/alertas';
    }

    goToHardwareDetails(hardwareId) {
        this.closeAlertsPanel();
        if (hardwareId) {
            sessionStorage.setItem('openHardwareId', hardwareId);
        }

        if (window.empresaSpa && typeof window.empresaSpa.setView === 'function') {
            this.openHardwareInSpa(hardwareId);
            return;
        }

        window.location.href = '/empresa/hardware';
    }

    openAlertInSpa(alertId) {
        const triggerOpen = () => {
            setTimeout(() => {
                if (typeof window.showAlertDetails === 'function') {
                    window.showAlertDetails(alertId);
                }
            }, 700);
        };

        if (window.empresaSpa?.getActiveView && window.empresaSpa.getActiveView() === 'alertas') {
            triggerOpen();
            return;
        }

        const onViewChange = (event) => {
            if (event?.detail?.view === 'alertas') {
                document.removeEventListener('empresa:spa:view-change', onViewChange);
                triggerOpen();
            }
        };

        document.addEventListener('empresa:spa:view-change', onViewChange);
        window.empresaSpa.setView('alertas');
    }

    openHardwareInSpa(hardwareId) {
        const triggerOpen = () => {
            if (!hardwareId) return;
            setTimeout(() => {
                if (typeof window.viewHardware === 'function') {
                    window.viewHardware(hardwareId);
                }
            }, 700);
        };

        if (window.empresaSpa?.getActiveView && window.empresaSpa.getActiveView() === 'hardware') {
            triggerOpen();
            return;
        }

        const onViewChange = (event) => {
            if (event?.detail?.view === 'hardware') {
                document.removeEventListener('empresa:spa:view-change', onViewChange);
                triggerOpen();
            }
        };

        document.addEventListener('empresa:spa:view-change', onViewChange);
        window.empresaSpa.setView('hardware');
    }
    
    // MÉTODOS DE TESTING/DEBUGGING
    testNewAlert() {
        //console.log('🧪 TEST: Simulando nueva alerta...');
        
        // Crear una alerta falsa
        const fakeAlert = {
            _id: 'fake_alert_' + Date.now(),
            hardware_nombre: 'Sensor de Prueba',
            empresa_nombre: 'Empresa Test',
            sede: 'Sede Central',
            prioridad: 'alta',
            fecha_creacion: new Date().toISOString(),
            descripcion: 'Esta es una alerta de prueba para verificar el funcionamiento del sistema.',
            data: {
                origen: 'hardware',
                tipo_mensaje: 'alarma'
            },
            activacion_alerta: {
                tipo_activacion: 'hardware',
                nombre: 'Sensor Hardware'
            }
        };
        
        //console.log('🧪 TEST: Mostrando modal directamente...');
        this.showNewAlertModal(fakeAlert);
    }
    
    // Función para probar el modal popup directamente
    testModalPopup() {
        //console.log('🧪 TEST MODAL: Probando modal popup de nueva alerta...');
        this.testNewAlert();
    }
    
    testOpenPanel() {
        //console.log('🧪 TEST: Abriendo panel manualmente...');
        this.openAlertsPanel();
    }
    
    clearLastAlertIds() {
        //console.log('🧪 TEST: Limpiando IDs previos para forzar detección...');
        this.seenAlertIds.clear();
        this.currentAlertIds.clear();
        this.clearShownAlerts(); // Limpiar también el historial persistente
        //console.log('🧪 TEST: TODOS los IDs limpiados');
    }
    
    // Función para simular que llega una nueva alerta via WebSocket/refresh
    simulateNewAlert() {
        //console.log('🧪 TEST: Simulando llegada de nueva alerta...');
        
        // Limpiar IDs para forzar detección
        this.clearLastAlertIds();
        
        // Crear una alerta falsa con datos más realistas
        const fakeAlert = {
            _id: 'fake_alert_' + Date.now(),
            hardware_nombre: 'Sensor Crítico',
            empresa_nombre: 'Mi Empresa',
            sede: 'Sede Principal', 
            prioridad: 'critica',
            fecha_creacion: new Date().toISOString(),
            descripcion: 'Alerta de emergencia detectada por el sensor principal.',
            data: {
                origen: 'hardware',
                tipo_mensaje: 'alarma',
                id_origen: 'sensor_001'
            },
            activacion_alerta: {
                tipo_activacion: 'hardware',
                nombre: 'Sensor Principal',
                id: 'hw_sensor_001'
            },
            numeros_telefonicos: [
                { nombre: 'Administrador', numero: '+57 300 123 4567', disponible: true }
            ]
        };
        
        // Simular que esta alerta viene en la siguiente carga
        setTimeout(() => {
            //console.log('🧪 TEST: Ejecutando checkForNewAlerts con alerta simulada...');
            this.checkForNewAlerts([fakeAlert]);
        }, 1000);
    }
    
    // ===== FUNCIONES DE localStorage =====
    
    // Cargar alertas ya mostradas desde localStorage
    loadShownAlertsFromStorage() {
        try {
            const stored = localStorage.getItem(this.localStorageKey);
            if (stored) {
                const shownIds = JSON.parse(stored);
                this.shownAlertIds = new Set(shownIds);
                //console.log('💾 STORAGE: Alertas ya mostradas cargadas:', Array.from(this.shownAlertIds));
            } else {
                //console.log('💾 STORAGE: No hay historial de alertas mostradas');
            }
        } catch (error) {
            //console.error('💥 STORAGE: Error cargando historial:', error);
            this.shownAlertIds = new Set();
        }
    }
    
    // Guardar alertas mostradas en localStorage
    saveShownAlertsToStorage() {
        try {
            const shownIds = Array.from(this.shownAlertIds);
            localStorage.setItem(this.localStorageKey, JSON.stringify(shownIds));
            //console.log('💾 STORAGE: Historial guardado:', shownIds.length);
        } catch (error) {
            //console.error('💥 STORAGE: Error guardando historial:', error);
        }
    }
    
    // Marcar alertas como ya mostradas
    markAlertsAsShown(alertIds) {
        //console.log('✅ MARCANDO COMO MOSTRADAS:', alertIds);
        alertIds.forEach(id => {
            this.shownAlertIds.add(id);
        });
        this.saveShownAlertsToStorage();
    }

    // Cargar hardware ya mostrado desde localStorage
    loadShownHardwareFromStorage() {
        try {
            const stored = localStorage.getItem(this.hardwareStorageKey);
            if (stored) {
                const shownIds = JSON.parse(stored);
                this.shownHardwareIds = new Set(shownIds);
            }
        } catch (error) {
            this.shownHardwareIds = new Set();
        }
    }

    // Guardar hardware mostrado en localStorage
    saveShownHardwareToStorage() {
        try {
            const shownIds = Array.from(this.shownHardwareIds);
            localStorage.setItem(this.hardwareStorageKey, JSON.stringify(shownIds));
        } catch (error) {
            return;
        }
    }

    // Marcar hardware como ya mostrado
    markHardwareAsShown(hardwareIds) {
        hardwareIds.forEach(id => {
            this.shownHardwareIds.add(id);
        });
        this.saveShownHardwareToStorage();
    }
    
    // Limpiar historial (para testing)
    clearShownAlerts() {
        //console.log('🧹 LIMPIANDO HISTORIAL DE ALERTAS MOSTRADAS');
        this.shownAlertIds.clear();
        localStorage.removeItem(this.localStorageKey);
        //console.log('🧹 HISTORIAL LIMPIADO');
    }
    
    // ===== FIN FUNCIONES localStorage =====
    
    // Método para destruir el sistema
    destroy() {
        this.stopAutoRefresh();
        
        // Remover elementos UI
        const panel = document.getElementById('globalAlertsPanel');
        const overlay = document.getElementById('globalAlertsPanelOverlay');
        const styles = document.getElementById('empresaAlertsGlobalStyles');
        const newAlertModal = document.getElementById('newAlertNotificationModal');
        const newAlertOverlay = document.getElementById('newAlertNotificationOverlay');
        
        if (panel) panel.remove();
        if (overlay) overlay.remove();
        if (styles) styles.remove();
        if (newAlertModal) newAlertModal.remove();
        if (newAlertOverlay) newAlertOverlay.remove();
        
        this.isActive = false;
        
        //console.log('🏢 GLOBAL ALERTS: Sistema destruido');
    }
}

// Inicializar automáticamente cuando se carga el DOM
document.addEventListener('DOMContentLoaded', function() {
    // Solo inicializar si es usuario empresa
    if (window.currentUser?.role === 'empresa' || 
        window.EMPRESA_ROLE === 'empresa' ||
        window.location.pathname.startsWith('/empresa')) {
        
        // Delay pequeño para asegurar que todo el DOM esté listo
        setTimeout(() => {
            window.empresaAlertsGlobal = new EmpresaAlertsGlobal();
        }, 500);
    }
});

window.openEmpresaAlertsPanel = function () {
    if (typeof EmpresaAlertsGlobal === 'undefined') return;
    if (!window.empresaAlertsGlobal) {
        window.empresaAlertsGlobal = new EmpresaAlertsGlobal();
    }
    if (window.empresaAlertsGlobal) {
        window.empresaAlertsGlobal.openAlertsPanel();
        window.empresaAlertsGlobal.switchPanelTab('alerts');
    }
};
