/**
 * ALERTAS ACTIVAS - SISTEMA PRINCIPAL
 * Sistema completo para manejo de alertas con cache inteligente y WebSocket
 */

// ========== VARIABLES GLOBALES ==========
let currentPage = 1;
let totalPages = 1;
let currentAlerts = [];
let selectedAlertId = null;
let alertsPerPage = 5;

// Variables para WebSocket
let websocket = null;
let websocketUrl = window.websocket_url || 'https://websocket.rescue.com.co'; // Usar la configuración de Flask o localhost por defecto
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 3000; // 3 segundos

// Cache silencioso de alertas por ID
let alertsCache = new Map();
let cacheMetadata = {
    lastUpdate: null,
    totalCachedAlerts: 0,
    cacheHits: 0,
    cacheMisses: 0
};

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', function() {
    ////console.log('🚨 ALERTAS: Página de alertas inicializada');
    
    // Inicializar sistema de cache silencioso
    initializeCacheSystem();
    
    // Inicializar conexión WebSocket
    connectWebSocket();
    
    // Configurar el modal manager para el modal de alertas
    if (window.modalManager) {
        window.modalManager.setupModal('alertDetailModal');
        ////console.log('✅ Modal de alertas configurado correctamente');
    } else {
        ////console.warn('⚠️ ModalManager no está disponible');
    }
    
    // Configurar contador de caracteres para el textarea de mensaje
    setupMessageCharacterCounter();
    
    // Cargar alertas iniciales
    loadActiveAlerts();

    // Actualizar alertas automáticamente cada 10 segundos
    setInterval(() => {
        refreshAlertsQuietly();
    }, 10000);

    // Verificar si debe abrir automáticamente el modal de una alerta específica
    checkForAutoOpenAlert();
    
    //console.log('✅ ALERTAS: Sistema completamente inicializado con cache inteligente y WebSocket');
});

// ========== FUNCIONES DE WEBSOCKET ==========
function connectWebSocket() {
    try {
        websocket = new WebSocket(websocketUrl);
        
        websocket.onopen = function(event) {
            //console.log('✅ WebSocket conectado:', websocketUrl);
            reconnectAttempts = 0;
            // Exponer WebSocket globalmente para otros módulos
            window.websocket = websocket;
        };
        
        websocket.onclose = function(event) {
            //console.log('🔌 WebSocket desconectado');
            websocket = null;
            // Limpiar referencia global también
            window.websocket = null;
        };
        
        websocket.onerror = function(error) {
            //console.error('❌ Error en WebSocket:', error);
        };
        
    } catch (error) {
        //console.error('💥 Error conectando WebSocket:', error);
    }
}

function sendAlertDeactivationMessage(alertData) {
    return new Promise((resolve, reject) => {
        try {
            //console.log('🚀 [DEBUG] Iniciando sendAlertDeactivationMessage');
            //console.log('🚀 [DEBUG] AlertData recibida:', alertData);
            //console.log('🚀 [DEBUG] WebSocket state:', websocket ? websocket.readyState : 'no websocket');
            //console.log('🚀 [DEBUG] WebSocket URL:', websocketUrl);
            
            // Preparar el mensaje con la información de la alerta
            const message = {
                type: 'alert_deactivated_by_empresa',
                timestamp: new Date().toISOString(),
                alert: {
                    id: alertData._id,
                    nombre: alertData.hardware_nombre || 'Alerta de Hardware',
                    empresa: alertData.empresa_nombre,
                    sede: alertData.sede,
                    prioridad: alertData.prioridad,
                    topic: alertData.topic,
                    // Lista de usuarios (contactos)
                    usuarios: (alertData.numeros_telefonicos || []).map(contacto => ({
                        nombre: contacto.nombre,
                        telefono: contacto.numero,
                        tipo: 'contacto_telefono'
                    })),
                    // Lista de hardware vinculado
                    hardware_vinculado: [
                        {
                            nombre: alertData.hardware_nombre,
                            id_origen: alertData.data?.id_origen,
                            topic: alertData.topic
                        },
                        // Otros hardware relacionados
                        ...(alertData.topics_otros_hardware || []).map(topic => ({
                            topic: topic,
                            tipo: 'hardware_relacionado'
                        }))
                    ],
                    fecha_creacion: alertData.fecha_creacion,
                    fecha_desactivacion: new Date().toISOString(),
                    desactivado_por: {
                        tipo: 'empresa',
                        id: window.currentUser?.empresa_id || window.currentUser?.id,
                        nombre: window.currentUser?.nombre_empresa || 'Empresa'
                    }
                }
            };
            
            //console.log('📤 [DEBUG] Mensaje preparado para enviar:', JSON.stringify(message, null, 2));
            
            // Si no hay conexión, intentar conectar
            if (!websocket || websocket.readyState !== WebSocket.OPEN) {
                //console.log('🔌 [DEBUG] WebSocket no conectado, estado:', websocket ? websocket.readyState : 'null');
                //console.log('🔌 [DEBUG] Estados WebSocket: CONNECTING=0, OPEN=1, CLOSING=2, CLOSED=3');
                //console.log('🔌 [DEBUG] Intentando conectar a:', websocketUrl);
                
                connectWebSocket();
                
                // Esperar un momento para la conexión y luego enviar
                setTimeout(() => {
                    //console.log('⏰ [DEBUG] Después de timeout, WebSocket state:', websocket ? websocket.readyState : 'null');
                    if (websocket && websocket.readyState === WebSocket.OPEN) {
                        //console.log('✅ [DEBUG] WebSocket conectado, enviando mensaje...');
                        websocket.send(JSON.stringify(message));
                        //console.log('✅ [DEBUG] Mensaje enviado vía WebSocket exitosamente');
                        resolve(true);
                    } else {
                        //console.warn('⚠️ [DEBUG] No se pudo establecer conexión WebSocket después de timeout');
                        //console.warn('⚠️ [DEBUG] WebSocket final state:', websocket ? websocket.readyState : 'null');
                        resolve(false);
                    }
                }, 2000); // Aumenté el timeout a 2 segundos
            } else {
                // Enviar directamente
                //console.log('✅ [DEBUG] WebSocket ya conectado, enviando mensaje directamente...');
                websocket.send(JSON.stringify(message));
                //console.log('✅ [DEBUG] Mensaje enviado vía WebSocket exitosamente');
                resolve(true);
            }
            
        } catch (error) {
            //console.error('💥 [DEBUG] Error enviando mensaje WebSocket:', error);
            //console.error('💥 [DEBUG] Stack trace:', error.stack);
            resolve(false);
        }
    });
}

// ========== FUNCIONES PRINCIPALES DE ALERTAS ==========
async function loadActiveAlerts() {
    try {
        //console.log('🚨 INICIANDO CARGA DE ALERTAS');
        showLoading(true);
        
        // Obtener empresa_id del usuario actual
        const empresaId = window.currentUser?.empresa_id || window.currentUser?.id;
        //console.log('👤 EmpresaId obtenido:', empresaId);
        
        if (!empresaId) {
            //console.error('❌ No se pudo obtener el ID de empresa');
            showNoAlerts();
            return;
        }
        
        // Construir URL para obtener alertas
        let url = `/proxy/api/mqtt-alerts/empresa/${empresaId}/active-by-sede?limit=${alertsPerPage}&offset=${(currentPage - 1) * alertsPerPage}`;
        //console.log('🔗 URL a consultar:', url);
        
        // Llamar al endpoint específico de empresa
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        //console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            //console.error('❌ Response not ok:', response.status, response.statusText);
            throw new Error('Error al cargar alertas: ' + response.status);
        }
        
        const data = await response.json();
        //console.log('📊 DATA RECIBIDA:', data);
        
        if (data.success && data.data && Array.isArray(data.data)) {
            //console.log('✅ Data válida, procesando...');
            
            const allAlerts = data.data;
            //console.log(`📋 Total alertas en esta página: ${allAlerts.length}`);
            
            // Usar la información de paginación del backend
            if (data.pagination) {
                totalPages = data.pagination.total_pages || 1;
                //console.log(`📄 Paginación: página ${currentPage} de ${totalPages}`);
            }
            
            // Guardar alertas actuales
            currentAlerts = allAlerts;
            
            // Cache silencioso: Guardar alertas por ID
            cacheAlertsById(allAlerts);
            
            // Actualizar estadísticas y renderizar
            updateStatsCards(allAlerts, data.pagination);
            renderAlerts(allAlerts);
            updatePagination();
        } else {
            //console.log('⚠️ No hay alertas disponibles');
            currentAlerts = [];
            showNoAlerts();
        }
        
    } catch (error) {
        //console.error('💥 ERROR cargando alertas:', error);
        showNoAlerts();
        throw error;
        
    } finally {
        showLoading(false);
    }
}

function updateStatsCards(alerts, pagination) {
    const totalAlerts = pagination?.total_items || alerts.length;
    const activeAlerts = alerts.filter(a => a.activo).length;
    const criticalAlerts = alerts.filter(a => a.prioridad === 'critica').length;
    
    // Calcular alertas recientes (últimas 24h)
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentCount = alerts.filter(a => {
        const alertDate = new Date(a.fecha_creacion);
        return alertDate >= oneDayAgo;
    }).length;
    
    document.getElementById('totalAlertsCount').textContent = totalAlerts;
    document.getElementById('activeAlertsCount').textContent = activeAlerts;
    document.getElementById('criticalAlertsCount').textContent = criticalAlerts;
    document.getElementById('recentAlertsCount').textContent = recentCount;
}

function renderAlerts(alerts) {
    //console.log('🎨 RENDER ALERTS: Función renderAlerts llamada con:', alerts);
    
    const container = document.getElementById('alertsContainer');
    const noAlertsMsg = document.getElementById('noAlertsMessage');
    
    if (!container) {
        //console.error('❌ Container alertsContainer no encontrado');
        return;
    }
    
    if (!alerts || alerts.length === 0) {
        //console.log('🎨 RENDER ALERTS: No hay alertas, mostrando mensaje');
        container.innerHTML = '';
        if (noAlertsMsg) {
            noAlertsMsg.classList.remove('hidden');
        }
        return;
    }
    
    //console.log('🎨 RENDER ALERTS: Ocultando mensaje de no alertas');
    if (noAlertsMsg) {
        noAlertsMsg.classList.add('hidden');
    }
    
    const alertsHTML = alerts.map(alert => {
        // Determinar el origen de la alerta con soporte para alertas de empresa
        const isUserOrigin = alert.data?.origen === 'usuario_movil' || alert.activacion_alerta?.tipo_activacion === 'usuario';
        const isHardwareOrigin = alert.data?.tipo_mensaje === 'alarma' || alert.activacion_alerta?.tipo_activacion === 'hardware';
        const isEmpresaOrigin = alert.data?.origen === 'empresa_web' || alert.activacion_alerta?.tipo_activacion === 'empresa';
        
        // Determinar el nombre de la alerta según su origen
        let alertTypeName = alert.nombre_alerta || 'Alerta';
        let originLabel = '';
        
        if (isUserOrigin) {
            originLabel = 'Usuario';
            alertTypeName = alert.nombre_alerta || 'Alerta de Usuario';
        } else if (isHardwareOrigin) {
            originLabel = 'Hardware';
            alertTypeName = alert.nombre_alerta || 'Alerta de Hardware';
        } else if (isEmpresaOrigin) {
            originLabel = 'Empresa';
            alertTypeName = alert.nombre_alerta || 'Alerta de Empresa';
        } else {
            originLabel = 'Sistema';
        }
        
        return `
        <div class="alert-card ios-hardware-card alert-priority-${alert.prioridad}" onclick="showAlertDetails('${alert._id}')">
            <div class="flex items-start space-x-4">
                <div class="flex-shrink-0">
                    <div class="w-16 h-16 rounded-xl flex items-center justify-center ${
                        isUserOrigin ? 'alert-origin-usuario' : 
                        isHardwareOrigin ? 'alert-origin-hardware' : 
                        isEmpresaOrigin ? 'alert-origin-empresa' : 
                        'alert-origin-system'
                    }">
                        <i class="fas fa-${
                            isUserOrigin ? 'user' : 
                            isHardwareOrigin ? 'microchip' : 
                            isEmpresaOrigin ? 'building' : 
                            'cog'
                        } text-white text-xl"></i>
                    </div>
                </div>
                
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-white truncate">
                            ${alertTypeName}
                        </h3>
                        <div class="flex items-center space-x-2">
                            <span class="px-2 py-1 rounded-full text-xs font-medium ${getPriorityClass(alert.prioridad)}">
                                ${alert.prioridad.toUpperCase()}
                            </span>
                            <span class="px-2 py-1 rounded-full text-xs font-medium ${alert.activo ? 'bg-green-500' : 'bg-gray-500'} text-white">
                                ${alert.activo ? 'ACTIVA' : 'INACTIVA'}
                            </span>
                            <span class="px-2 py-1 rounded-full text-xs font-medium ${
                                isUserOrigin ? 'bg-purple-500' : 
                                isHardwareOrigin ? 'bg-blue-500' : 
                                isEmpresaOrigin ? 'bg-emerald-500' : 
                                'bg-gray-500'
                            } text-white">
                                ${originLabel.toUpperCase()}
                            </span>
                        </div>
                    </div>
                    
                    <div class="mt-2">
                        <p class="text-sm text-gray-300">
                            <i class="fas fa-building mr-1"></i>
                            <strong>${alert.empresa_nombre}</strong> - ${alert.sede}
                        </p>
                        ${alert.descripcion ? `
                            <p class="text-xs text-gray-400 mt-1 truncate">
                                ${alert.descripcion}
                            </p>
                        ` : ''}
                    </div>
                    
                    <!-- Mostrar información de contactos con estados -->
                    ${alert.numeros_telefonicos && alert.numeros_telefonicos.length > 0 ? `
                        <div class="mt-2 text-xs text-gray-300 space-y-1">
                            ${alert.numeros_telefonicos.slice(0,2).map(contacto => `
                                <div class="flex justify-between items-center">
                                    <span class="font-medium">${contacto.nombre}</span>
                                    <div class="flex items-center space-x-1">
                                        <span class="w-2 h-2 rounded-full ${contacto.disponible ? 'bg-green-400' : 'bg-red-400'}"></span>
                                        <span class="text-xs">
                                            ${contacto.disponible ? 'Disponible' : 'No disponible'}
                                        </span>
                                        ${contacto.embarcado === true ? `
                                            <div class="mt-1 flex items-center text-orange-400">
                                                <i class="fas fa-route mr-1 text-xs"></i>
                                                <span class="text-orange-400 text-xs font-medium">En ruta</span>
                                            </div>
                                        ` : contacto.embarcado === false ? `
                                            <div class="mt-1 flex items-center text-gray-400">
                                                <i class="fas fa-home mr-1 text-xs"></i>
                                                <span class="text-gray-400 text-xs font-medium">En espera</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('')}
                            ${alert.numeros_telefonicos.length > 2 ? `
                                <div class="text-center text-gray-500 text-xs">
                                    +${alert.numeros_telefonicos.length - 2} contactos más
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                    
                    <div class="mt-3 flex items-center justify-between">
                        <span class="alert-timestamp text-gray-400">
                            <i class="fas fa-clock mr-1"></i>
                            ${formatDate(alert.fecha_creacion)}
                        </span>
                        
                        <div class="flex items-center space-x-2 text-xs">
                            ${alert.numeros_telefonicos && alert.numeros_telefonicos.length > 0 ? `
                                <span class="text-blue-400">
                                    <i class="fas fa-phone mr-1"></i>
                                    ${alert.numeros_telefonicos.length} contacto(s)
                                </span>
                            ` : ''}
                            ${alert.tipo_alerta ? `
                                <span class="px-2 py-1 rounded text-xs" style="background-color: ${getAlertTypeColor(alert.tipo_alerta)}20; color: ${getAlertTypeColor(alert.tipo_alerta)}">
                                    ${alert.tipo_alerta}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="ios-card-shimmer"></div>
        </div>
        `;
    }).join('');
    
    //console.log('🎨 RENDER ALERTS: Inyectando HTML en container...');
    container.innerHTML = alertsHTML;
}

// ========== FUNCIONES DE UTILIDAD ==========
function getPriorityClass(prioridad) {
    switch(prioridad) {
        case 'critica': return 'bg-red-600 text-white';
        case 'alta': return 'bg-orange-600 text-white';
        case 'media': return 'bg-yellow-600 text-white';
        case 'baja': return 'bg-green-600 text-white';
        default: return 'bg-gray-600 text-white';
    }
}

function getAlertTypeColor(tipo) {
    switch(tipo) {
        case 'ROJO': return '#dc2626';
        case 'AMARILLO': return '#eab308';
        case 'VERDE': return '#16a34a';
        case 'AZUL': return '#2563eb';
        case 'NARANJA': return '#ea580c';
        default: return '#6b7280';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `Hace ${minutes} minutos`;
    if (hours < 24) return `Hace ${hours} horas`;
    return `Hace ${days} días`;
}

// ========== FUNCIONES DE MODAL ==========
async function showAlertDetails(alertId) {
    //console.log('🔍 Intentando mostrar detalles de alerta:', alertId);
    
    const alert = await findAlertById(alertId);
    if (!alert) {
        //console.warn('❌ No se encontró la alerta con ID:', alertId);
        showSimpleNotification('No se pudo cargar la información de esta alerta', 'error');
        return;
    }
    
    //console.log('✅ Alerta encontrada:', alert);
    selectedAlertId = alertId;
    
    const modal = document.getElementById('alertDetailModal');
    if (!modal) {
        //console.error('❌ Modal alertDetailModal no encontrado en DOM');
        return;
    }
    
    if (window.modalManager && window.modalManager.isModalOpen('alertDetailModal')) {
        //console.log('🔄 Modal ya abierto, cerrándolo primero...');
        window.modalManager.closeModal('alertDetailModal');
        setTimeout(() => showAlertDetails(alertId), 100);
        return;
    }
    
    // Poblar el modal con los detalles
    const content = document.getElementById('alertDetailsContent');
    const subtitle = document.getElementById('modalAlertSubtitle');
    const toggleBtn = document.getElementById('toggleStatusBtn');
    
    if (!content || !subtitle || !toggleBtn) {
        //console.error('❌ Elementos del modal no encontrados');
        return;
    }
    
    const isUserOrigin = alert.data?.origen === 'usuario_movil' || alert.activacion_alerta?.tipo_activacion === 'usuario';
    const isHardwareOrigin = alert.data?.tipo_mensaje === 'alarma' || alert.activacion_alerta?.tipo_activacion === 'hardware';
    const isEmpresaOrigin = alert.data?.origen === 'empresa_web' || alert.activacion_alerta?.tipo_activacion === 'empresa';
    
    let displayName = '';
    if (isUserOrigin) {
        displayName = alert.activacion_alerta?.nombre || alert.data?.botonera_ubicacion?.hardware_nombre || 'Usuario Móvil';
    } else if (isHardwareOrigin) {
        displayName = alert.activacion_alerta?.nombre || alert.hardware_nombre || 'Hardware';
    } else if (isEmpresaOrigin) {
        displayName = alert.activacion_alerta?.nombre || alert.nombre_alerta || 'Alerta de Empresa';
    } else {
        displayName = alert.hardware_nombre || alert.activacion_alerta?.nombre || 'Sistema';
    }
    
    const empresaName = alert.empresa_nombre || 'Empresa';
    subtitle.textContent = `${displayName} - ${empresaName}`;
    
    // Generar contenido del modal
    content.innerHTML = generateModalContent(alert, isUserOrigin, isHardwareOrigin);
    
    // Configurar botón de toggle
    toggleBtn.innerHTML = `<i class="fas fa-${alert.activo ? 'toggle-off' : 'toggle-on'} mr-2"></i><span id="toggleStatusText">${alert.activo ? 'Desactivar' : 'Activar'}</span>`;
    
    // Abrir modal
    setTimeout(() => {
        window.modalManager.openModal('alertDetailModal');
        //console.log('✅ Modal abierto correctamente');
    }, 50);
}

async function refreshOpenAlertModal() {
    if (!window.modalManager || !window.modalManager.isModalOpen('alertDetailModal') || !selectedAlertId) {
        return;
    }

    const alert = await findAlertById(selectedAlertId);
    if (!alert) return;

    const content = document.getElementById('alertDetailsContent');
    const subtitle = document.getElementById('modalAlertSubtitle');
    const toggleBtn = document.getElementById('toggleStatusBtn');
    if (!content || !subtitle || !toggleBtn) return;

    const isUserOrigin = alert.data?.origen === 'usuario_movil' || alert.activacion_alerta?.tipo_activacion === 'usuario';
    const isHardwareOrigin = alert.data?.tipo_mensaje === 'alarma' || alert.activacion_alerta?.tipo_activacion === 'hardware';
    const isEmpresaOrigin = alert.data?.origen === 'empresa_web' || alert.activacion_alerta?.tipo_activacion === 'empresa';

    let displayName = '';
    if (isUserOrigin) {
        displayName = alert.activacion_alerta?.nombre || alert.data?.botonera_ubicacion?.hardware_nombre || 'Usuario Móvil';
    } else if (isHardwareOrigin) {
        displayName = alert.activacion_alerta?.nombre || alert.hardware_nombre || 'Hardware';
    } else if (isEmpresaOrigin) {
        displayName = alert.activacion_alerta?.nombre || alert.nombre_alerta || 'Alerta de Empresa';
    } else {
        displayName = alert.hardware_nombre || alert.activacion_alerta?.nombre || 'Sistema';
    }

    const empresaName = alert.empresa_nombre || 'Empresa';
    subtitle.textContent = `${displayName} - ${empresaName}`;

    content.innerHTML = generateModalContent(alert, isUserOrigin, isHardwareOrigin);

    toggleBtn.innerHTML = `<i class="fas fa-${alert.activo ? 'toggle-off' : 'toggle-on'} mr-2"></i><span id="toggleStatusText">${alert.activo ? 'Desactivar' : 'Activar'}</span>`;
}

function generateModalContent(alert, isUserOrigin, isHardwareOrigin) {
    //console.log('🔍 GENERANDO MODAL PARA ALERTA:', alert);
    //console.log('🔍 Topics otros hardware:', alert.topics_otros_hardware);
    //console.log('🔍 Data completa:', alert.data);
    
    return `
        <!-- Header detallado con información del origen de la alerta -->
        <div class="mb-4 p-4 rounded-lg ${
            isUserOrigin ? 'bg-gradient-to-r from-purple-600 to-indigo-700' : 
            isHardwareOrigin ? 'bg-gradient-to-r from-blue-600 to-cyan-700' : 
            'bg-gradient-to-r from-gray-600 to-gray-700'
        }">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <i class="fas fa-${
                            isUserOrigin ? 'user-shield' : 
                            isHardwareOrigin ? 'microchip' : 'cog'
                        } text-white text-lg"></i>
                    </div>
                    <div>
        <h3 class="text-white font-bold text-lg">
                            ${isUserOrigin ? '👤 Alerta de Usuario Móvil' : 
                              isHardwareOrigin ? '🔧 Alerta de Hardware' : 
                              (alert.data?.origen === 'empresa_web' || alert.activacion_alerta?.tipo_activacion === 'empresa') ? '🏢 Alerta de Empresa' :
                              '⚙️ Alerta del Sistema'}
                        </h3>
                        <p class="text-white/80 text-sm">
                            ${isUserOrigin ? 'Creada desde aplicación móvil' : 
                              isHardwareOrigin ? 'Generada automáticamente por hardware' : 
                              (alert.data?.origen === 'empresa_web' || alert.activacion_alerta?.tipo_activacion === 'empresa') ? 'Creada manualmente por la empresa' :
                              'Alerta del sistema'}
                        </p>
                    </div>
                </div>
                <div class="text-right">
                    ${isUserOrigin && alert.activacion_alerta?.nombre ? `
                        <p class="text-white text-sm font-medium">👤 ${alert.activacion_alerta.nombre}</p>
                        <p class="text-white/70 text-xs">${alert.data?.metadatos?.plataforma || 'App móvil'}</p>
                    ` : isHardwareOrigin && alert.activacion_alerta?.nombre ? `
                        <p class="text-white text-sm font-medium">🔧 ${alert.activacion_alerta.nombre}</p>
                        <p class="text-white/70 text-xs">Hardware automático</p>
                    ` : ''}
                    <div class="flex items-center space-x-2 mt-2">
                        <span class="px-2 py-1 rounded-full text-xs font-bold ${
                            isUserOrigin ? 'bg-purple-500/30 text-purple-200' : 
                            isHardwareOrigin ? 'bg-blue-500/30 text-blue-200' : 
                            'bg-gray-500/30 text-gray-200'
                        }">
                            ${isUserOrigin ? 'MÓVIL' : isHardwareOrigin ? 'AUTO' : 'SYS'}
                        </span>
                        <span class="px-2 py-1 rounded-full text-xs font-bold ${getPriorityClass(alert.prioridad)}">
                            ${alert.prioridad.toUpperCase()}
                        </span>
                        <span class="px-2 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200">
                            ${formatDate(alert.fecha_creacion)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Layout optimizado: Fila principal con imagen/estado + mapa más grande -->
        <div class="space-y-4">
            <!-- Fila superior: Imagen/Tipo + Estado y Prioridad + Información del origen (3 columnas) -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <!-- Imagen y tipo de alerta con diferenciación por origen -->
                <div class="lg:col-span-1">
                    ${alert.image_alert ? `
                        <div class="modal-section bg-gradient-to-br ${
                            isUserOrigin ? 'from-purple-500 to-pink-600' : 
                            isHardwareOrigin ? 'from-blue-500 to-cyan-600' : 
                            'from-gray-500 to-gray-600'
                        } rounded-lg p-4 text-center h-full">
                            <img src="${alert.image_alert}" 
                                 alt="${alert.nombre_alerta || 'Tipo de alerta'}" 
                                 class="w-1/2 sm:w-2/5 lg:w-1/3 xl:w-1/4 max-w-xs max-h-32 object-contain rounded-lg mb-3 border-2 border-white/20 modal-image mx-auto"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                            <div class="w-16 h-16 bg-gradient-to-br ${
                                isUserOrigin ? 'from-purple-400 to-pink-500' : 
                                isHardwareOrigin ? 'from-blue-400 to-cyan-500' : 
                                'from-gray-400 to-gray-500'
                            } rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg" style="display: none;">
                                <i class="fas fa-${
                                    isUserOrigin ? 'user-shield' : 
                                    isHardwareOrigin ? 'microchip' : 'exclamation-triangle'
                                } text-white text-xl"></i>
                            </div>
                            <h3 class="text-lg font-bold text-white mb-2">
                                ${alert.nombre_alerta || 'Alerta'}
                            </h3>
                            <div class="space-y-2">
                                <div class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold" 
                                     style="background-color: ${getAlertTypeColor(alert.tipo_alerta)}40; color: ${getAlertTypeColor(alert.tipo_alerta)}; border: 1px solid ${getAlertTypeColor(alert.tipo_alerta)}60;">
                                    ${alert.tipo_alerta || 'N/A'}
                                </div>
                                <div class="block">
                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                                        <i class="fas fa-${
                                            isUserOrigin ? 'mobile-alt' : 
                                            isHardwareOrigin ? 'microchip' : 'cog'
                                        } mr-1"></i>
                                        ${isUserOrigin ? 'Móvil' : isHardwareOrigin ? 'Hardware' : 'Sistema'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="modal-section bg-gradient-to-br ${
                            isUserOrigin ? 'from-purple-600 to-indigo-800' : 
                            isHardwareOrigin ? 'from-blue-600 to-cyan-800' : 
                            'from-gray-600 to-gray-800'
                        } rounded-lg p-4 text-center h-full flex flex-col justify-center">
                            <div class="w-16 h-16 bg-gradient-to-br ${
                                isUserOrigin ? 'from-purple-400 to-pink-500' : 
                                isHardwareOrigin ? 'from-blue-400 to-cyan-500' : 
                                'from-gray-400 to-gray-500'
                            } rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg">
                                <i class="fas fa-${
                                    isUserOrigin ? 'user-shield' : 
                                    isHardwareOrigin ? 'microchip' : 'exclamation-triangle'
                                } text-white text-xl"></i>
                            </div>
                            <h3 class="text-lg font-bold text-white mb-2">
                                ${isUserOrigin ? 'Alerta de Usuario' : 
                                  isHardwareOrigin ? 'Alerta de Hardware' : 
                                  'Alerta del Sistema'}
                            </h3>
                            <div class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                                <i class="fas fa-${
                                    isUserOrigin ? 'mobile-alt' : 
                                    isHardwareOrigin ? 'microchip' : 'cog'
                                } mr-1"></i>
                                ${isUserOrigin ? 'App Móvil' : isHardwareOrigin ? 'Automático' : 'Sistema'}
                            </div>
                        </div>
                    `}
                </div>
                
                <!-- Estado y prioridad en columna -->
                <div class="lg:col-span-1 space-y-3">
                    <div class="modal-section bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg p-3">
                        <h4 class="text-sm font-medium text-gray-300 mb-2">Estado</h4>
                        <div class="flex items-center">
                            <div class="w-3 h-3 rounded-full mr-2 ${alert.activo ? 'bg-green-400' : 'bg-red-400'}"></div>
                            <span class="text-lg font-bold ${alert.activo ? 'text-green-400' : 'text-red-400'}">
                                ${alert.activo ? 'ACTIVA' : 'INACTIVA'}
                            </span>
                        </div>
                        ${!alert.activo && alert.fecha_desactivacion ? `
                            <div class="mt-2 pt-2 border-t border-gray-600">
                                <p class="text-xs text-gray-400 mb-1">
                                    <i class="fas fa-calendar-times mr-1"></i>
                                    Desactivada: ${formatDate(alert.fecha_desactivacion)}
                                </p>
                                ${alert.desactivado_por ? `
                                    <p class="text-xs text-gray-400">
                                        <i class="fas fa-user-times mr-1"></i>
                                        Por: ${alert.desactivado_por.tipo === 'empresa' ? 'Empresa' : 'Sistema'}
                                    </p>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-section bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg p-3">
                        <h4 class="text-sm font-medium text-gray-300 mb-2">Prioridad</h4>
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${getPriorityClass(alert.prioridad)}">
                            ${alert.prioridad.toUpperCase()}
                        </span>
                    </div>
                </div>

                <!-- Información del origen (Usuario, Hardware o Empresa) -->
                <div class="lg:col-span-1">
                    ${(() => {
                        const isEmpresaOrigin = alert.data?.origen === 'empresa_web' || alert.activacion_alerta?.tipo_activacion === 'empresa';
                        
                        if (isUserOrigin) {
                            return `
                                <div class="modal-section bg-gradient-to-r from-purple-700 to-indigo-800 rounded-lg p-3 h-full">
                                    <h4 class="text-sm font-semibold text-white mb-2 flex items-center">
                                        <i class="fas fa-user-shield mr-1 text-xs"></i>Usuario Origen
                                    </h4>
                                    <div class="space-y-1 text-xs">
                                        <div class="flex justify-between">
                                            <span class="text-purple-200">Usuario:</span>
                                            <span class="text-white font-medium truncate ml-2">${alert.activacion_alerta?.nombre || 'Usuario no especificado'}</span>
                                        </div>
                                        ${alert.activacion_alerta?.id ? `
                                            <div class="flex justify-between">
                                                <span class="text-purple-200">ID:</span>
                                                <span class="text-white font-medium font-mono text-xs">${alert.activacion_alerta.id}</span>
                                            </div>
                                        ` : ''}
                                        ${alert.data?.metadatos?.plataforma ? `
                                            <div class="pt-1">
                                                <span class="text-purple-200 block mb-1">Plataforma:</span>
                                                <span class="inline-flex items-center px-2 py-1 bg-purple-600/30 text-purple-100 rounded text-xs">
                                                    <i class="fas fa-mobile-alt mr-1"></i>
                                                    ${alert.data.metadatos.plataforma === 'mobile_app' ? 'App Móvil' : alert.data.metadatos.plataforma}
                                                </span>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `;
                        } else if (isHardwareOrigin) {
                            return `
                                <div class="modal-section bg-gradient-to-r from-blue-700 to-cyan-800 rounded-lg p-3 h-full">
                                    <h4 class="text-sm font-semibold text-white mb-2 flex items-center">
                                        <i class="fas fa-microchip mr-1 text-xs"></i>Hardware Origen
                                    </h4>
                                    <div class="space-y-1 text-xs">
                                        <div class="flex justify-between">
                                            <span class="text-blue-200">Nombre:</span>
                                            <span class="text-white font-medium truncate ml-2">${alert.activacion_alerta?.nombre || alert.hardware_nombre || 'Hardware no especificado'}</span>
                                        </div>
                                        ${alert.data?.id_origen ? `
                                            <div class="flex justify-between">
                                                <span class="text-blue-200">ID Origen:</span>
                                                <span class="text-white font-medium font-mono text-xs">${alert.data.id_origen}</span>
                                            </div>
                                        ` : ''}
                                        ${alert.topic ? `
                                            <div class="pt-1">
                                                <span class="text-blue-200 block mb-1">Topic MQTT:</span>
                                                <code class="text-blue-100 font-mono text-xs bg-black/20 px-1 py-1 rounded block break-all">${alert.topic}</code>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `;
                        } else if (isEmpresaOrigin) {
                            return `
                                <div class="modal-section bg-gradient-to-r from-emerald-700 to-teal-800 rounded-lg p-3 h-full">
                                    <h4 class="text-sm font-semibold text-white mb-2 flex items-center">
                                        <i class="fas fa-building mr-1 text-xs"></i>Empresa Origen
                                    </h4>
                                    <div class="space-y-1 text-xs">
                                        <div class="flex justify-between">
                                            <span class="text-teal-200">Empresa:</span>
                                            <span class="text-white font-medium truncate ml-2">${alert.activacion_alerta?.nombre || alert.empresa_nombre || 'Empresa no especificada'}</span>
                                        </div>
                                        ${alert.activacion_alerta?.id ? `
                                            <div class="flex justify-between">
                                                <span class="text-teal-200">ID:</span>
                                                <span class="text-white font-medium font-mono text-xs">${alert.activacion_alerta.id}</span>
                                            </div>
                                        ` : ''}
                                        ${alert.data?.origen ? `
                                            <div class="pt-1">
                                                <span class="text-teal-200 block mb-1">Origen:</span>
                                                <span class="inline-flex items-center px-2 py-1 bg-teal-600/30 text-teal-100 rounded text-xs">
                                                    <i class="fas fa-globe-americas mr-1"></i>
                                                    ${alert.data.origen === 'empresa_web' ? 'Portal Web Empresa' : alert.data.origen}
                                                </span>
                                            </div>
                                        ` : ''}
                                        ${alert.data?.metadatos?.plataforma ? `
                                            <div class="pt-1">
                                                <span class="text-teal-200 block mb-1">Plataforma:</span>
                                                <span class="inline-flex items-center px-2 py-1 bg-emerald-600/30 text-emerald-100 rounded text-xs">
                                                    <i class="fas fa-desktop mr-1"></i>
                                                    ${alert.data.metadatos.plataforma === 'web_app' ? 'Aplicación Web' : alert.data.metadatos.plataforma}
                                                </span>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `;
                        } else {
                            return `
                                <div class="modal-section bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg p-3 h-full flex items-center justify-center">
                                    <div class="text-center">
                                        <i class="fas fa-question-circle text-gray-400 text-2xl mb-2"></i>
                                        <p class="text-gray-300 text-sm">Origen no especificado</p>
                                    </div>
                                </div>
                            `;
                        }
                    })()}
                </div>
            </div>
            
            <!-- Fila principal: Mapa de ancho completo -->
            <div class="space-y-4">
                <!-- Mapa y ubicación principal (ancho completo) -->
                <div class="w-full">
                    <div class="modal-section bg-gradient-to-r from-indigo-600 to-purple-700 rounded-lg p-4">
                        <h4 class="text-lg font-semibold text-white mb-3 flex items-center">
                            <i class="fas fa-map-marker-alt mr-2"></i>Ubicación Completa
                        </h4>
                        <div class="space-y-3">
                            <!-- Empresa y Sede más compactas -->
                            <div class="grid grid-cols-2 gap-4 pb-3">
                                <div>
                                    <span class="text-indigo-200 text-sm block">Empresa:</span>
                                    <span class="text-white font-medium">${alert.empresa_nombre}</span>
                                </div>
                                <div>
                                    <span class="text-indigo-200 text-sm block">Sede:</span>
                                    <span class="text-white font-medium">${alert.sede}</span>
                                </div>
                            </div>
                            
                            <!-- Dirección física y mapa más grande -->
                            ${generateLocationContent(alert)}
                        </div>
                    </div>
                </div>
                
                <!-- Información adicional de ubicación reorganizada debajo del mapa -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <!-- Ubicación específica y Hardware asociado combinados -->
                    <div class="modal-section bg-gradient-to-r from-cyan-600 to-amber-700 rounded-lg p-3">
                        <h4 class="text-sm font-semibold text-white mb-3 flex items-center">
                            <i class="fas fa-crosshairs mr-2 text-xs"></i>Ubicación y Hardware
                        </h4>
                        <div class="space-y-3">
                            ${generateSpecificLocationContent(alert)}
                            ${generateAssociatedHardwareContent(alert)}
                        </div>
                    </div>
                    
                    <!-- Topic MQTT como ubicación lógica -->
                    ${alert.topic ? `
                        <div class="modal-section bg-gradient-to-r from-teal-600 to-green-700 rounded-lg p-3">
                            <h4 class="text-sm font-semibold text-white mb-2 flex items-center">
                                <i class="fas fa-code-branch mr-1 text-xs"></i>Ubicación MQTT
                            </h4>
                            <code class="text-teal-100 font-mono text-xs bg-black/20 px-2 py-1 rounded block break-all">${alert.topic}</code>
                            <p class="text-teal-200 text-xs mt-1">Empresa/Sede/Tipo/Hardware</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
            
        <!-- Información principal -->
        <div class="space-y-4">
            <!-- Información del hardware y descripción en la misma fila -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
                ${alert.hardware_nombre ? `
                    <div class="modal-section bg-gradient-to-r from-blue-700 to-blue-800 rounded-lg p-3">
                        <h4 class="text-sm font-semibold text-white mb-2 flex items-center">
                            <i class="fas fa-microchip mr-1 text-xs"></i>Hardware Origen
                        </h4>
                        <div class="space-y-1 text-xs">
                            <div class="flex justify-between">
                                <span class="text-blue-200">Nombre:</span>
                                <span class="text-white font-medium">${alert.hardware_nombre}</span>
                            </div>
                            ${alert.data?.id_origen ? `
                                <div class="flex justify-between">
                                    <span class="text-blue-200">ID Origen:</span>
                                    <span class="text-white font-medium">${alert.data.id_origen}</span>
                                </div>
                            ` : ''}
                            ${alert.topic ? `
                                <div class="pt-1">
                                    <span class="text-blue-200 block">Topic MQTT:</span>
                                    <code class="text-blue-100 font-mono text-xs bg-black/20 px-1 py-0.5 rounded block mt-1 break-all">${alert.topic}</code>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
                
                <!-- Descripción de la alerta -->
                ${alert.data?.tipo_alarma_info?.descripcion ? `
                    <div class="modal-section bg-gradient-to-r from-orange-600 to-red-700 rounded-lg p-3">
                        <h4 class="text-sm font-semibold text-white mb-2 flex items-center">
                            <i class="fas fa-info-circle mr-1 text-xs"></i>Descripción
                        </h4>
                        <p class="text-orange-100 text-xs leading-relaxed">${alert.data.tipo_alarma_info.descripcion}</p>
                    </div>
                ` : ''}
            </div>
            
            <!-- Información del usuario y hardware relacionado en la misma fila -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <!-- Información específica según el tipo de origen -->
                ${generateOriginDetailsContent(alert, isUserOrigin, isHardwareOrigin)}
                
                <!-- Hardware Relacionado en columna 2 - DEBUGGING MEJORADO -->
                ${(() => {
                    //console.log('🔍 CHECKING TOPICS RELACIONADOS:');
                    //console.log('  - alert.topics_otros_hardware:', alert.topics_otros_hardware);
                    //console.log('  - alert.data?.topics_otros_hardware:', alert.data?.topics_otros_hardware);
                    //console.log('  - alert.data?.topics:', alert.data?.topics);
                    //console.log('  - alert.hardware_relacionado:', alert.hardware_relacionado);
                    
                    // Intentar múltiples fuentes para hardware relacionado
                    const topicsRelacionados = alert.topics_otros_hardware || 
                                             alert.data?.topics_otros_hardware || 
                                             alert.data?.topics || 
                                             alert.hardware_relacionado || 
                                             [];
                    
                    //console.log('  - topicsRelacionados final:', topicsRelacionados);
                    
                    if (topicsRelacionados && topicsRelacionados.length > 0) {
                        return `
                            <div class="modal-section bg-gradient-to-r from-slate-700 to-slate-800 rounded-lg p-3 h-full">
                                <h4 class="text-sm font-semibold text-white mb-2 flex items-center">
                                    <i class="fas fa-network-wired mr-1 text-xs"></i>Hardware Relacionado (${topicsRelacionados.length})
                                </h4>
                                <div class="space-y-1 max-h-32 overflow-y-auto text-xs custom-scrollbar">
                                    ${topicsRelacionados.slice(0, 3).map(topic => `
                                        <div class="bg-black/20 rounded p-1">
                                            <code class="text-slate-200 font-mono text-xs break-all">${topic}</code>
                                        </div>
                                    `).join('')}
                                    ${topicsRelacionados.length > 3 ? `
                                        <div class="text-center text-slate-400 text-xs pt-1">
                                            +${topicsRelacionados.length - 3} más
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    } else {
                        return `
                            <div class="modal-section bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg p-3 h-full flex items-center justify-center">
                                <div class="text-center">
                                    <i class="fas fa-server text-gray-400 text-2xl mb-2"></i>
                                    <p class="text-gray-300 text-sm">Sin hardware relacionado</p>
                                    <p class="text-gray-500 text-xs mt-1">No hay topics MQTT vinculados</p>
                                </div>
                            </div>
                        `;
                    }
                })()}
            </div>
        </div>
                
        <!-- Recomendaciones e implementos (optimizados) -->
        ${alert.data?.tipo_alarma_info?.recomendaciones || alert.data?.tipo_alarma_info?.implementos_necesarios ? `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
                ${alert.data.tipo_alarma_info.recomendaciones?.length > 0 ? `
                    <div class="modal-section bg-gradient-to-br from-green-700 to-emerald-800 rounded-lg p-3">
                        <h4 class="text-sm font-semibold text-white mb-2 flex items-center">
                            <i class="fas fa-lightbulb mr-1 text-xs"></i>Recomendaciones
                        </h4>
                        <ul class="space-y-1">
                            ${alert.data.tipo_alarma_info.recomendaciones.map(rec => `
                                <li class="flex items-start text-green-100">
                                    <i class="fas fa-check-circle text-green-300 mr-1 mt-0.5 flex-shrink-0 text-xs"></i>
                                    <span class="text-xs">${rec}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${alert.data.tipo_alarma_info.implementos_necesarios?.length > 0 ? `
                    <div class="modal-section bg-gradient-to-br from-cyan-700 to-blue-800 rounded-lg p-3">
                        <h4 class="text-sm font-semibold text-white mb-2 flex items-center">
                            <i class="fas fa-tools mr-1 text-xs"></i>Implementos Necesarios
                        </h4>
                        <ul class="space-y-1">
                            ${alert.data.tipo_alarma_info.implementos_necesarios.map(impl => `
                                <li class="flex items-start text-cyan-100">
                                    <i class="fas fa-wrench text-cyan-300 mr-1 mt-0.5 flex-shrink-0 text-xs"></i>
                                    <span class="text-xs">${impl}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        ` : ''}
        
        <!-- Mensaje de desactivación (si existe) -->
        ${!alert.activo && alert.mensaje_desactivacion ? `
            <div class="modal-section bg-gradient-to-r from-red-700 to-red-800 rounded-lg p-4 mt-3">
                <h4 class="text-lg font-semibold text-white mb-3 flex items-center">
                    <i class="fas fa-comment-times mr-2"></i>Mensaje de Desactivación
                </h4>
                <div class="bg-black/20 rounded-lg p-4">
                    <div class="flex items-start space-x-3">
                        <div class="w-10 h-10 bg-red-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-quote-left text-red-200 text-sm"></i>
                        </div>
                        <div class="flex-1">
                            <blockquote class="text-red-100 text-sm leading-relaxed italic">
                                "${alert.mensaje_desactivacion}"
                            </blockquote>
                            <footer class="mt-2 text-xs text-red-300">
                                — Mensaje proporcionado por la empresa al desactivar la alerta
                            </footer>
                        </div>
                    </div>
                </div>
            </div>
        ` : ''}
        
        <!-- Sección final: Contactos notificados (ancho completo) -->
        ${alert.numeros_telefonicos && alert.numeros_telefonicos.length > 0 ? `
            <div class="modal-section bg-gradient-to-r from-teal-700 to-green-800 rounded-lg p-4 mt-3">
                <h4 class="text-lg font-semibold text-white mb-3 flex items-center">
                    <i class="fas fa-phone mr-2"></i>Contactos Notificados (${alert.numeros_telefonicos.length})
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto custom-scrollbar">
                    ${alert.numeros_telefonicos.map(contacto => `
                        <div class="bg-black/20 rounded-lg p-3 flex items-center space-x-3 hover:bg-black/30 transition-colors modal-card">
                            <div class="w-8 h-8 ${contacto.disponible ? 'bg-teal-500' : 'bg-red-500'} rounded-full flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-user text-white text-sm"></i>
                            </div>
                            <div class="min-w-0 flex-1">
                                <p class="text-white font-medium text-sm truncate">${contacto.nombre}</p>
                                <p class="text-teal-200 text-xs">${contacto.numero}</p>
                                <div class="flex items-center space-x-2 mt-1">
                                    <span class="w-2 h-2 rounded-full ${contacto.disponible ? 'bg-green-400' : 'bg-red-400'}"></span>
                                    <span class="text-xs ${contacto.disponible ? 'text-green-300' : 'text-red-300'}">
                                        ${contacto.disponible ? 'Disponible' : 'No disponible'}
                                    </span>
                                </div>
                                ${(() => {
                                    // Lógica mejorada para estados de contactos
                                    if (contacto.embarcado === true) {
                                        return `
                                            <div class="mt-2 flex items-center text-orange-400">
                                                <i class="fas fa-map-marked-alt mr-2 text-xs"></i>
                                                <div>
                                                    <p class="text-orange-400 text-xs font-medium">En Ruta al incidente</p>
                                                    <p class="text-teal-300 text-xs italic">Desplazándose al lugar</p>
                                                </div>
                                            </div>
                                        `;
                                    } else if (contacto.embarcado === false) {
                                        // Si no está embarcado, validar disponibilidad
                                        if (contacto.disponible) {
                                            return `
                                                <div class="mt-2 flex items-center text-blue-400">
                                                    <i class="fas fa-home mr-2 text-xs"></i>
                                                    <div>
                                                        <p class="text-blue-400 text-xs font-medium">En Espera</p>
                                                        <p class="text-teal-300 text-xs italic">Disponible pero no en camino</p>
                                                    </div>
                                                </div>
                                            `;
                                        } else {
                                            return `
                                                <div class="mt-2 flex items-center text-red-400">
                                                    <i class="fas fa-times-circle mr-2 text-xs"></i>
                                                    <div>
                                                        <p class="text-red-400 text-xs font-medium">No Disponible</p>
                                                        <p class="text-gray-400 text-xs italic">No puede responder al incidente</p>
                                                    </div>
                                                </div>
                                            `;
                                        }
                                    } else {
                                        // Si no hay información de embarcado, solo mostrar disponibilidad
                                        if (contacto.disponible) {
                                            return `
                                                <div class="mt-2 flex items-center text-green-400">
                                                    <i class="fas fa-check-circle mr-2 text-xs"></i>
                                                    <div>
                                                        <p class="text-green-400 text-xs font-medium">Disponible</p>
                                                        <p class="text-teal-300 text-xs italic">Listo para responder</p>
                                                    </div>
                                                </div>
                                            `;
                                        } else {
                                            return `
                                                <div class="mt-2 flex items-center text-red-400">
                                                    <i class="fas fa-exclamation-triangle mr-2 text-xs"></i>
                                                    <div>
                                                        <p class="text-red-400 text-xs font-medium">No Disponible</p>
                                                        <p class="text-gray-400 text-xs italic">No puede responder</p>
                                                    </div>
                                                </div>
                                            `;
                                        }
                                    }
                                })()}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;
}

function closeAlertModal() {
    window.modalManager.closeModal('alertDetailModal');
    selectedAlertId = null;
}

// ========== FUNCIONES DE DESACTIVACIÓN ==========
function showDeactivateConfirmation() {
    if (!selectedAlertId) {
        //console.error('❌ No hay alerta seleccionada');
        return;
    }
    
    const alert = getAlertById(selectedAlertId);
    if (!alert) {
        //console.error('❌ No se encontró información de la alerta');
        return;
    }
    
    if (!alert.activo) {
        showSimpleNotification('Esta alerta ya fue desactivada previamente', 'warning');
        return;
    }
    
    //console.log('🔄 Mostrando modal de confirmación para desactivar alerta:', selectedAlertId);
    
    const modalMessage = document.getElementById('deactivateModalMessage');
    const mensajeTextarea = document.getElementById('mensajeDesactivacion');
    if (mensajeTextarea) {
        mensajeTextarea.value = '';
        updateCharacterCounter(); // Resetear contador
        setTimeout(() => mensajeTextarea.focus(), 100); // Enfocar después del reset
    }
    if (modalMessage) {
        modalMessage.innerHTML = `
            <p class="text-white/90 text-base mb-3">
                ¿Estás seguro de que quieres desactivar esta alerta?
            </p>
            <div class="bg-black/20 rounded-lg p-3 mb-4">
                <p class="text-yellow-200 font-semibold text-sm">${alert.hardware_nombre || 'Hardware'}</p>
                <p class="text-white/70 text-xs">${alert.empresa_nombre} - ${alert.sede}</p>
                <p class="text-orange-300 text-xs mt-1">
                    <i class="fas fa-exclamation-triangle mr-1"></i>
                    Prioridad: ${alert.prioridad.toUpperCase()}
                </p>
            </div>
            <p class="text-red-200 text-sm">
                <i class="fas fa-info-circle mr-1"></i>
                Esta acción desactivará la alerta y notificará a los contactos.
            </p>
        `;
    }
    
    if (window.modalManager) {
        window.modalManager.openModal('deactivateAlertModal');
        // Activar contador de caracteres después de abrir el modal
        setTimeout(() => {
            attachCharacterCounterListener();
        }, 100);
    }
}

function closeDeactivateModal() {
    if (window.modalManager) {
        window.modalManager.closeModal('deactivateAlertModal');
    }
}

async function confirmDeactivateAlert() {
    if (!selectedAlertId) {
        //console.error('❌ No hay alerta seleccionada');
        return;
    }
    
    //console.log('🔄 Iniciando desactivación de alerta:', selectedAlertId);
    
    const confirmBtn = document.getElementById('deactivateConfirmBtn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Desactivando...';
    }
    
    try {
        const empresaId = window.currentUser?.empresa_id || window.currentUser?.id;
        
        if (!empresaId) {
            throw new Error('No se pudo obtener el ID de empresa del usuario actual');
        }
        
        //console.log('📤 Enviando petición de desactivación');
        
        const mensajeDesactivacion = document.getElementById('mensajeDesactivacion')?.value?.trim() || '';
        
        // Validación obligatoria del mensaje
        if (!mensajeDesactivacion || mensajeDesactivacion.length === 0) {
            throw new Error('El mensaje de desactivación es obligatorio');
        }
        
        const response = await window.apiClient.deactivate_user_alert(
            selectedAlertId,
            empresaId,
            'empresa',
            mensajeDesactivacion
        );
        
        const data = await response.json();
        
        if (data.success) {
            //console.log('✅ Alerta desactivada exitosamente');
            
            const alertData = await findAlertById(selectedAlertId);
            if (alertData) {
                alertData.numeros_telefonicos = data.numeros_telefonicos || [];
                alertData.topics_otros_hardware = data.topics || [];
                
                sendAlertDeactivationMessage(alertData).then(sent => {
                    if (sent) {
                        //console.log('✅ Notificación WebSocket enviada correctamente');
                    } else {
                        //console.warn('⚠️ No se pudo enviar notificación WebSocket');
                    }
                });
            }
            
            closeDeactivateModal();
            closeAlertModal();
            clearAlertsCache(false);
            await loadActiveAlerts();
            
            showSimpleNotification(data.message || 'Alerta desactivada exitosamente', 'success');
            
        } else {
            //console.error('❌ Error en la respuesta:', data);
            throw new Error(data.error || 'Error desconocido al desactivar alerta');
        }
        
    } catch (error) {
        //console.error('💥 Error desactivando alerta:', error);
        
        closeDeactivateModal();
        
        let errorData = { success: false };
        
        if (error.message.includes('ID de la alerta es obligatorio')) {
            errorData.error = 'El ID de la alerta es obligatorio';
        } else if (error.message.includes('no está autorizada')) {
            errorData.error = 'La empresa no está autorizada para desactivar esta alerta';
        } else {
            errorData.error = 'Error al desactivar alerta';
            errorData.message = error.message || 'Ocurrió un error inesperado';
        }
        
        showSimpleNotification(errorData.error || 'Error al desactivar alerta', 'error');
        
    } finally {
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-power-off mr-2"></i>Desactivar';
        }
    }
}


// ========== FUNCIONES DE PAGINACIÓN ==========
function updatePagination() {
    const paginationContainer = document.getElementById('paginationContainer');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const pageInfo = document.getElementById('pageInfo');
    
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'flex';
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
}

function changePage(direction) {
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updatePagination();
        loadActiveAlerts();
    }
}

// ========== FUNCIONES DE UTILIDAD ==========
function showLoading(show) {
    const skeleton = document.getElementById('loadingSkeleton');
    if (skeleton) {
        if (show) {
            skeleton.classList.remove('hidden');
        } else {
            skeleton.classList.add('hidden');
        }
    }
}

function showNoAlerts() {
    const container = document.getElementById('alertsContainer');
    const noAlertsMsg = document.getElementById('noAlertsMessage');
    
    if (container) {
        container.innerHTML = '';
    }
    if (noAlertsMsg) {
        noAlertsMsg.classList.remove('hidden');
    }
}

async function refreshAlerts(skipSuccessPopup = false, preservePage = false) {
    //console.log('🔄 REFRESH: Actualizando alertas manualmente...');
    //console.log('📢 REFRESH: skipSuccessPopup =', skipSuccessPopup);
    
    // Verificar si se debe omitir el popup por flag global
    const shouldSkipPopup = skipSuccessPopup || window.skipNextSuccessPopup;
    if (window.skipNextSuccessPopup) {
        window.skipNextSuccessPopup = false; // Resetear el flag
        //console.log('🔇 REFRESH: Omitiendo popup de éxito por flag global');
    }
    
    try {
        clearAlertsCache(false);
        if (!preservePage) {
            currentPage = 1;
        }
        await loadActiveAlerts();

        await refreshOpenAlertModal();

        // Solo mostrar popup si no se debe omitir
        if (!shouldSkipPopup) {
            showUpdateSuccessPopup();
        }
        
        //console.log('✅ REFRESH: Actualización completada exitosamente');
        
    } catch (error) {
        //console.error('💥 REFRESH ERROR: Error actualizando alertas:', error);
        const friendlyMessage = getFriendlyErrorMessage(error);
        showUpdateErrorPopup(friendlyMessage);
    }
}

function refreshAlertsQuietly() {
    refreshAlerts(true, true);
}

function getFriendlyErrorMessage(error) {
    let errorMessage = '';
    
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    } else if (error && typeof error === 'object') {
        errorMessage = error.message || error.error || error.statusText || 'Error desconocido';
    } else {
        errorMessage = 'Error desconocido';
    }
    
    const errorMappings = {
        '401': 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
        '403': 'No tiene permisos para realizar esta acción.',
        '404': 'No se encontraron alertas para mostrar.',
        '500': 'Error interno del servidor. Intente más tarde.',
        'network': 'Problema de conexión a internet. Verifique su red.',
        'timeout': 'La conexión tardó demasiado. Intente nuevamente.'
    };
    
    const httpCodeMatch = errorMessage.match(/\b(\d{3})\b/);
    if (httpCodeMatch && errorMappings[httpCodeMatch[1]]) {
        return errorMappings[httpCodeMatch[1]];
    }
    
    for (const [key, friendlyMessage] of Object.entries(errorMappings)) {
        if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
            return friendlyMessage;
        }
    }
    
    return `Error de conexión: ${errorMessage.length > 100 ? errorMessage.substring(0, 100) + '...' : errorMessage}`;
}

function showUpdateSuccessPopup() {
    //console.log('✅ UPDATE POPUP: Mostrando alerta de éxito personalizada');
    
    // Crear alerta personalizada con Tailwind (estilo iOS/hardware)
    createCustomSuccessAlert();
}

function showUpdateErrorPopup(errorMessage) {
    //console.log('❌ UPDATE ERROR POPUP: Mostrando alerta de error personalizada');
    
    // Crear alerta personalizada de error con Tailwind
    createCustomErrorAlert(errorMessage);
}

/**
 * Crea una alerta de éxito personalizada con estilos Tailwind
 */
function createCustomSuccessAlert() {
    // Crear el elemento de la alerta
    const alertElement = document.createElement('div');
    alertElement.innerHTML = `
        <div class="fixed top-4 right-4 z-50 transform transition-all duration-500 ease-out" id="customSuccessAlert">
            <div class="bg-gradient-to-r from-green-500 via-emerald-600 to-green-700 text-white px-6 py-4 rounded-2xl shadow-2xl border border-green-400/30 backdrop-blur-sm max-w-sm min-w-80">
                <div class="flex items-center space-x-4">
                    <!-- Icono animado -->
                    <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                        <i class="fas fa-check-circle text-white text-xl"></i>
                    </div>
                    <!-- Contenido -->
                    <div class="flex-1">
                        <p class="font-bold text-white text-base mb-1">✅ Alertas Actualizadas</p>
                        <p class="text-green-100 text-sm">La información se ha actualizado correctamente</p>
                    </div>
                    <!-- Botón cerrar -->
                    <div class="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center cursor-pointer transition-colors flex-shrink-0" onclick="this.closest('.fixed').remove()">
                        <i class="fas fa-times text-white text-sm"></i>
                    </div>
                </div>
                <!-- Barra de progreso -->
                <div class="mt-3 bg-white/20 rounded-full h-1 overflow-hidden">
                    <div class="bg-white h-full rounded-full animate-progress" style="animation: progress 3s linear forwards;"></div>
                </div>
            </div>
        </div>
        
        <style>
        @keyframes progress {
            from { width: 100%; }
            to { width: 0%; }
        }
        </style>
    `;
    
    // Agregar al body
    document.body.appendChild(alertElement);
    
    // Animar entrada
    const alertDiv = alertElement.firstElementChild;
    alertDiv.style.transform = 'translateX(100%) scale(0.8)';
    alertDiv.style.opacity = '0';
    
    // Forzar reflow y animar
    requestAnimationFrame(() => {
        alertDiv.style.transform = 'translateX(0) scale(1)';
        alertDiv.style.opacity = '1';
    });
    
    // Auto-eliminar después de 3 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.style.transform = 'translateX(100%) scale(0.8)';
            alertDiv.style.opacity = '0';
            
            setTimeout(() => {
                if (alertElement.parentNode) {
                    alertElement.parentNode.removeChild(alertElement);
                }
            }, 500);
        }
    }, 3000);
}

/**
 * Crea una alerta de error personalizada con estilos Tailwind
 */
function createCustomErrorAlert(errorMessage) {
    const friendlyMessage = getFriendlyErrorMessage(errorMessage);
    
    // Crear el elemento de la alerta
    const alertElement = document.createElement('div');
    alertElement.innerHTML = `
        <div class="fixed top-4 right-4 z-50 transform transition-all duration-500 ease-out" id="customErrorAlert">
            <div class="bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white px-6 py-4 rounded-2xl shadow-2xl border border-red-400/30 backdrop-blur-sm max-w-sm min-w-80">
                <div class="flex items-start space-x-4">
                    <!-- Icono animado -->
                    <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 animate-bounce">
                        <i class="fas fa-exclamation-triangle text-white text-xl"></i>
                    </div>
                    <!-- Contenido -->
                    <div class="flex-1 min-w-0">
                        <p class="font-bold text-white text-base mb-2">❌ Error al Actualizar</p>
                        <p class="text-red-100 text-sm leading-relaxed break-words">${friendlyMessage}</p>
                        <div class="mt-3 flex space-x-2">
                            <button onclick="refreshAlerts()" class="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors">
                                <i class="fas fa-redo mr-1"></i>Reintentar
                            </button>
                            <button onclick="this.closest('.fixed').remove()" class="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors">
                                Cerrar
                            </button>
                        </div>
                    </div>
                    <!-- Botón cerrar -->
                    <div class="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center cursor-pointer transition-colors flex-shrink-0" onclick="this.closest('.fixed').remove()">
                        <i class="fas fa-times text-white text-sm"></i>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Agregar al body
    document.body.appendChild(alertElement);
    
    // Animar entrada
    const alertDiv = alertElement.firstElementChild;
    alertDiv.style.transform = 'translateX(100%) scale(0.8)';
    alertDiv.style.opacity = '0';
    
    // Forzar reflow y animar
    requestAnimationFrame(() => {
        alertDiv.style.transform = 'translateX(0) scale(1)';
        alertDiv.style.opacity = '1';
    });
    
    // Auto-eliminar después de 6 segundos (más tiempo para errores)
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.style.transform = 'translateX(100%) scale(0.8)';
            alertDiv.style.opacity = '0';
            
            setTimeout(() => {
                if (alertElement.parentNode) {
                    alertElement.parentNode.removeChild(alertElement);
                }
            }, 500);
        }
    }, 6000);
}

// ========== SISTEMA DE CACHE ==========
function cacheAlertsById(alerts) {
    if (!alerts || !Array.isArray(alerts)) return;
    
    alerts.forEach(alert => {
        if (alert._id) {
            alertsCache.set(alert._id, {
                _id: alert._id,
                hardware_nombre: alert.hardware_nombre,
                prioridad: alert.prioridad,
                activo: alert.activo,
                empresa_nombre: alert.empresa_nombre,
                sede: alert.sede,
                fecha_creacion: alert.fecha_creacion,
                cached_at: new Date().toISOString(),
                page_cached_from: currentPage
            });
        }
    });
    
    cacheMetadata.lastUpdate = new Date().toISOString();
    cacheMetadata.totalCachedAlerts = alertsCache.size;
}

function getAlertById(alertId) {
    const currentAlert = currentAlerts.find(a => a._id === alertId);
    if (currentAlert) {
        cacheMetadata.cacheHits++;
        return currentAlert;
    }
    
    const cachedAlert = alertsCache.get(alertId);
    if (cachedAlert) {
        cacheMetadata.cacheHits++;
        return cachedAlert;
    }
    
    cacheMetadata.cacheMisses++;
    return null;
}

async function findAlertById(alertId) {
    try {
        const cachedAlert = getAlertById(alertId);
        if (cachedAlert && cachedAlert.is_full_data) {
            return cachedAlert;
        }
        
        const response = await fetch(`/proxy/api/mqtt-alerts/${alertId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        
        if (!response.ok) return null;
        
        const data = await response.json();
        //console.log('📊 DATA COMPLETA DE ALERTA:', data); // Debug para ver qué llega
        
        if (data.success && data.alert) {
            const fullAlertData = {
                _id: data.alert._id,
                hardware_nombre: data.alert.hardware_nombre,
                prioridad: data.alert.prioridad,
                activo: data.alert.activo,
                empresa_nombre: data.alert.empresa_nombre,
                sede: data.alert.sede,
                fecha_creacion: data.alert.fecha_creacion,
                fecha_actualizacion: data.alert.fecha_actualizacion,
                fecha_desactivacion: data.alert.fecha_desactivacion,
                contactos_count: data.alert.numeros_telefonicos?.length || 0,
                numeros_telefonicos: data.alert.numeros_telefonicos || [],
                topic: data.alert.topic,
                // CRÍTICO: Probar diferentes formas de obtener topics relacionados
                topics_otros_hardware: data.alert.topics_otros_hardware || 
                                       data.topics_otros_hardware || 
                                       data.topics || 
                                       data.alert.topics || 
                                       data.alert.hardware_relacionado || 
                                       [],
                data: data.alert.data || {},
                origen_tipo: data.alert.origen_tipo,
                origen_id: data.alert.origen_id,
                usuario_id: data.alert.usuario_id,
                desactivado_por: data.alert.desactivado_por,
                mensaje_desactivacion: data.alert.mensaje_desactivacion,
                tipo_alerta: data.alert.tipo_alerta,
                nombre_alerta: data.alert.nombre_alerta,
                descripcion: data.alert.descripcion,
                image_alert: data.alert.image_alert,
                ubicacion: data.alert.ubicacion || {},
                activacion_alerta: data.alert.activacion_alerta || {},
                cached_at: new Date().toISOString(),
                fetched_from_backend: true,
                is_full_data: true
            };
            
            // Debug específico para topics relacionados
            //console.log('🔍 DEBUG TOPICS RELACIONADOS:', {
            //     'data.alert.topics_otros_hardware': data.alert.topics_otros_hardware,
            //     'data.topics_otros_hardware': data.topics_otros_hardware,
            //     'data.topics': data.topics,
            //     'data.alert.topics': data.alert.topics,
            //     'data.alert.hardware_relacionado': data.alert.hardware_relacionado,
            //     'final_topics_otros_hardware': fullAlertData.topics_otros_hardware
            // });
            
            alertsCache.set(alertId, fullAlertData);
            return fullAlertData;
        }
        
        return null;
        
    } catch (error) {
        //console.error(`Error buscando alerta ${alertId}:`, error);
        return null;
    }
}

function clearAlertsCache(keepRecent = false) {
    if (!keepRecent) {
        alertsCache.clear();
    } else {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        alertsCache.forEach((alert, id) => {
            const cachedAt = new Date(alert.cached_at);
            if (cachedAt < fiveMinutesAgo) {
                alertsCache.delete(id);
            }
        });
    }
    
    cacheMetadata.totalCachedAlerts = alertsCache.size;
}

function initializeCacheSystem() {
    setInterval(() => {
        clearAlertsCache(true);
    }, 10 * 60 * 1000); // 10 minutos
}

// ========== FUNCIONES AUXILIARES PARA EL MODAL ==========

function generateLocationContent(alert) {
    // Los datos de ubicación siempre están en la llave 'ubicacion' del nivel raíz
    let ubicacionData = null;
    let direccion = '';
    let googleUrl = '';
    let osmUrl = '';
    
    // Verificar si existe la llave ubicacion en el nivel raíz
    if (alert.ubicacion) {
        direccion = alert.ubicacion.direccion || '';
        googleUrl = alert.ubicacion.url_maps || '';
        osmUrl = alert.ubicacion.url_open_maps || '';
        ubicacionData = alert.ubicacion;
    }
    
    // Si no hay ubicación, no mostrar nada
    if (!ubicacionData || (!direccion && !googleUrl && !osmUrl)) {
        return '<p class="text-indigo-200 text-sm">📍 Sin información de ubicación disponible</p>';
    }
    
    return `
        <div>
            <span class="text-indigo-200 text-sm block mb-2">📍 Dirección Física:</span>
            <p class="text-white font-medium mb-3">${direccion || 'Dirección no especificada'}</p>
            
            <!-- Mapa embebido más grande -->
            ${generateEmbeddedMap(googleUrl, osmUrl)}
            
            <!-- Enlaces a mapas -->
            <div class="flex flex-wrap gap-2">
                ${googleUrl ? `
                    <a href="${googleUrl}" target="_blank" 
                       class="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
                        <i class="fas fa-map-marked-alt mr-2"></i>Google Maps
                    </a>
                ` : ''}
                ${osmUrl ? `
                    <a href="${osmUrl}" target="_blank" 
                       class="inline-flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors">
                        <i class="fas fa-map mr-2"></i>OpenStreetMaps
                    </a>
                ` : ''}
                ${googleUrl && osmUrl ? `
                    <button onclick="toggleMapProvider(this)" 
                            class="inline-flex items-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                            data-google-url="${googleUrl}"
                            data-osm-url="${osmUrl}">
                        <i class="fas fa-exchange-alt mr-2"></i>Cambiar Mapa
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

function generateEmbeddedMap(googleUrl, osmUrl) {
    // Extraer coordenadas de los enlaces
    let lat = null, lng = null;
    
    // Intentar extraer de Google Maps
    if (googleUrl) {
        const googleMatch = googleUrl.match(/place\/(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (googleMatch) {
            lat = parseFloat(googleMatch[1]);
            lng = parseFloat(googleMatch[2]);
        }
    }
    
    // Si no encontró coordenadas en Google, intentar con OSM
    if (!lat && osmUrl) {
        const osmMatch = osmUrl.match(/mlat=(-?\d+\.\d+).*mlon=(-?\d+\.\d+)/);
        if (osmMatch) {
            lat = parseFloat(osmMatch[1]);
            lng = parseFloat(osmMatch[2]);
        }
    }
    
    if (lat && lng) {
        return `
            <div class="mb-4">
                <div class="bg-black/20 rounded-lg overflow-hidden">
                    <iframe 
                        src="https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}"
                        width="100%" 
                        height="280" 
                        style="border-radius: 8px;"
                        loading="lazy"
                        title="Mapa de ubicación">
                    </iframe>
                    <div class="p-3 bg-black/40 text-center">
                        <span class="text-white text-sm font-mono">
                            📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }
    return '<p class="text-gray-400 text-xs mb-4">⚠️ No se pudieron extraer coordenadas de los enlaces</p>';
}

function generateSpecificLocationContent(alert) {
    // Determinar ubicación específica según el tipo de alerta
    let ubicacionEspecifica = '';
    let idOrigen = '';
    
    // Para alertas de usuario móvil
    if (alert.data?.botonera_ubicacion) {
        ubicacionEspecifica = alert.data.botonera_ubicacion.direccion || '';
        idOrigen = alert.data.botonera_ubicacion.hardware_id || '';
    }
    // Para alertas de hardware
    else if (alert.data?.ubicacion) {
        ubicacionEspecifica = alert.data.ubicacion;
        idOrigen = alert.data.id_origen || '';
    }
    
    if (ubicacionEspecifica) {
        return `
            <div class="bg-black/20 rounded p-2">
                <div class="flex items-center mb-1">
                    <i class="fas fa-map-pin text-cyan-300 mr-2 text-xs"></i>
                    <span class="text-cyan-100 font-medium text-xs">Ubicación Específica:</span>
                </div>
                <p class="text-white text-sm font-medium ml-4">${ubicacionEspecifica}</p>
                ${idOrigen && idOrigen !== ubicacionEspecifica ? `
                    <p class="text-cyan-200 text-xs mt-1 font-mono ml-4">ID: ${idOrigen}</p>
                ` : ''}
            </div>
        `;
    }
    return '';
}

function generateAssociatedHardwareContent(alert) {
    // Determinar hardware asociado según el tipo de alerta
    let hardwareName = '';
    let hardwareId = '';
    
    // Para alertas de usuario móvil
    if (alert.data?.botonera_ubicacion?.hardware_nombre) {
        hardwareName = alert.data.botonera_ubicacion.hardware_nombre;
        hardwareId = alert.data.botonera_ubicacion.hardware_id || '';
    }
    // Para alertas de hardware
    else if (alert.ubicacion?.hardware_nombre) {
        hardwareName = alert.ubicacion.hardware_nombre;
        hardwareId = alert.ubicacion.hardware_id || '';
    }
    // Fallback con hardware_nombre del nivel superior
    else if (alert.hardware_nombre) {
        hardwareName = alert.hardware_nombre;
        hardwareId = alert.data?.id_origen || '';
    }
    
    if (hardwareName) {
        return `
            <div class="bg-black/20 rounded p-2">
                <div class="flex items-center mb-1">
                    <i class="fas fa-server text-amber-300 mr-2 text-xs"></i>
                    <span class="text-amber-100 font-medium text-xs">Hardware Asociado:</span>
                </div>
                <p class="text-white text-sm font-medium ml-4">${hardwareName}</p>
                ${hardwareId ? `
                    <p class="text-amber-200 text-xs mt-1 font-mono ml-4">ID: ${hardwareId}</p>
                ` : ''}
            </div>
        `;
    }
    return '<div class="bg-black/20 rounded p-2 text-center"><p class="text-gray-300 text-xs">Sin hardware asociado específico</p></div>';
}

function generateOriginDetailsContent(alert, isUserOrigin, isHardwareOrigin) {
    const isEmpresaOrigin = alert.data?.origen === 'empresa_web' || alert.activacion_alerta?.tipo_activacion === 'empresa';
    
    if (isUserOrigin) {
        return `
            <div class="modal-section bg-gradient-to-r from-violet-700 to-purple-800 rounded-lg p-3">
                <h4 class="text-sm font-semibold text-white mb-2 flex items-center">
                    <i class="fas fa-mobile-alt mr-1 text-xs"></i>Detalles de Usuario Móvil
                </h4>
                <div class="space-y-2 text-xs">
                    <div class="bg-black/20 rounded p-2">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-purple-200">Usuario:</span>
                            <span class="text-white font-medium">${alert.activacion_alerta?.nombre || 'Usuario no especificado'}</span>
                        </div>
                        ${alert.activacion_alerta?.id ? `
                            <p class="text-purple-300 text-xs font-mono">ID: ${alert.activacion_alerta.id}</p>
                        ` : ''}
                    </div>
                    
                    ${alert.data?.metadatos ? `
                        <div class="bg-black/20 rounded p-2">
                            <p class="text-purple-200 mb-1">Metadatos:</p>
                            <div class="flex flex-wrap gap-1">
                                ${alert.data.metadatos.plataforma ? `
                                    <span class="inline-flex items-center px-2 py-1 bg-purple-600/50 text-white text-xs rounded">
                                        <i class="fas fa-mobile-alt mr-1"></i>
                                        ${alert.data.metadatos.plataforma === 'mobile_app' ? 'App Móvil' : alert.data.metadatos.plataforma}
                                    </span>
                                ` : ''}
                                ${alert.data.metadatos.tipo_procesamiento ? `
                                    <span class="inline-flex items-center px-2 py-1 bg-indigo-600/50 text-white text-xs rounded">
                                        <i class="fas fa-${alert.data.metadatos.tipo_procesamiento === 'manual' ? 'hand-paper' : 'cogs'} mr-1"></i>
                                        ${alert.data.metadatos.tipo_procesamiento === 'manual' ? 'Manual' : 'Automático'}
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${alert.data?.timestamp_creacion ? `
                        <div class="bg-black/20 rounded p-2">
                            <div class="flex justify-between">
                                <span class="text-purple-200">Timestamp:</span>
                                <span class="text-white font-mono text-xs">${new Date(alert.data.timestamp_creacion).toLocaleString()}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    } else if (isHardwareOrigin) {
        return `
            <div class="modal-section bg-gradient-to-r from-blue-700 to-cyan-800 rounded-lg p-3">
                <h4 class="text-sm font-semibold text-white mb-2 flex items-center">
                    <i class="fas fa-microchip mr-1 text-xs"></i>Detalles de Hardware
                </h4>
                <div class="space-y-2 text-xs">
                    <div class="bg-black/20 rounded p-2">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-blue-200">Hardware:</span>
                            <span class="text-white font-medium">${alert.activacion_alerta?.nombre || alert.hardware_nombre || 'Hardware no especificado'}</span>
                        </div>
                        ${alert.activacion_alerta?.id ? `
                            <p class="text-blue-300 text-xs font-mono">ID: ${alert.activacion_alerta.id}</p>
                        ` : ''}
                    </div>
                    
                    ${alert.data?.tipo_mensaje ? `
                        <div class="bg-black/20 rounded p-2">
                            <div class="flex justify-between">
                                <span class="text-blue-200">Tipo Mensaje:</span>
                                <span class="inline-flex items-center px-2 py-1 bg-blue-600/50 text-white text-xs rounded">
                                    <i class="fas fa-bolt mr-1"></i>
                                    ${alert.data.tipo_mensaje.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${alert.data?.id_origen ? `
                        <div class="bg-black/20 rounded p-2">
                            <div class="flex justify-between">
                                <span class="text-blue-200">ID Origen:</span>
                                <span class="text-white font-mono text-xs">${alert.data.id_origen}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    } else if (isEmpresaOrigin) {
        return `
            <div class="modal-section bg-gradient-to-r from-emerald-700 to-teal-800 rounded-lg p-3">
                <h4 class="text-sm font-semibold text-white mb-2 flex items-center">
                    <i class="fas fa-building mr-1 text-xs"></i>Detalles de Alerta de Empresa
                </h4>
                <div class="space-y-2 text-xs">
                    <div class="bg-black/20 rounded p-2">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-teal-200">Tipo de Activación:</span>
                            <span class="text-white font-medium">${alert.activacion_alerta?.tipo_activacion || 'Empresa'}</span>
                        </div>
                        ${alert.activacion_alerta?.nombre ? `
                            <p class="text-teal-300 text-xs font-medium">Nombre: ${alert.activacion_alerta.nombre}</p>
                        ` : ''}
                    </div>
                    
                    ${alert.data?.origen ? `
                        <div class="bg-black/20 rounded p-2">
                            <div class="flex justify-between">
                                <span class="text-teal-200">Origen:</span>
                                <span class="inline-flex items-center px-2 py-1 bg-teal-600/50 text-white text-xs rounded">
                                    <i class="fas fa-globe-americas mr-1"></i>
                                    ${alert.data.origen === 'empresa_web' ? 'Portal Web Empresa' : alert.data.origen}
                                </span>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${alert.data?.metadatos ? `
                        <div class="bg-black/20 rounded p-2">
                            <p class="text-teal-200 mb-1">Metadatos:</p>
                            <div class="flex flex-wrap gap-1">
                                ${alert.data.metadatos.plataforma ? `
                                    <span class="inline-flex items-center px-2 py-1 bg-emerald-600/50 text-white text-xs rounded">
                                        <i class="fas fa-desktop mr-1"></i>
                                        ${alert.data.metadatos.plataforma === 'web' ? 'Portal Web' : alert.data.metadatos.plataforma}
                                    </span>
                                ` : ''}
                                ${alert.data.metadatos.tipo_procesamiento ? `
                                    <span class="inline-flex items-center px-2 py-1 bg-teal-600/50 text-white text-xs rounded">
                                        <i class="fas fa-${alert.data.metadatos.tipo_procesamiento === 'manual' ? 'hand-paper' : 'cogs'} mr-1"></i>
                                        ${alert.data.metadatos.tipo_procesamiento === 'manual' ? 'Manual' : 'Automático'}
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${alert.data?.timestamp_creacion || alert.fecha_creacion ? `
                        <div class="bg-black/20 rounded p-2">
                            <div class="flex justify-between">
                                <span class="text-teal-200">Creada:</span>
                                <span class="text-white font-mono text-xs">${new Date(alert.data?.timestamp_creacion || alert.fecha_creacion).toLocaleString()}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    return `
        <div class="modal-section bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg p-3 h-full flex items-center justify-center">
            <div class="text-center">
                <i class="fas fa-question-circle text-gray-400 text-2xl mb-2"></i>
                <p class="text-gray-300 text-sm">Origen no especificado</p>
                <p class="text-gray-500 text-xs mt-1">No hay información de origen disponible</p>
            </div>
        </div>
    `;
}

// ========== FUNCIONES PARA ALTERNAR MAPAS ==========

/**
 * Alterna entre Google Maps y OpenStreetMaps en el iframe embebido
 * @param {HTMLElement} button - El botón que activó la función
 */
function toggleMapProvider(button) {
    const googleUrl = button.dataset.googleUrl;
    const osmUrl = button.dataset.osmUrl;
    
    if (!googleUrl || !osmUrl) {
        //console.warn('⚠️ TOGGLE MAP: URLs no disponibles');
        return;
    }
    
    // Buscar el iframe en la misma sección
    const iframe = button.closest('.modal-section').querySelector('iframe');
    if (!iframe) {
        //console.warn('⚠️ TOGGLE MAP: iframe no encontrado');
        return;
    }
    
    const currentSrc = iframe.src;
    let newSrc, newProvider;
    
    // Determinar qué mapa mostrar
    if (currentSrc.includes('openstreetmap.org')) {
        // Cambiar a Google Maps
        const coords = extractCoordsFromOSMEmbed(currentSrc);
        if (coords) {
            newSrc = `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=15&output=embed`;
            newProvider = 'Google Maps';
        } else {
            //console.warn('⚠️ TOGGLE MAP: No se pudieron extraer coordenadas de OSM');
            return;
        }
    } else {
        // Cambiar a OpenStreetMaps
        const coords = extractCoordsFromGoogleMapsUrl(googleUrl);
        if (coords) {
            newSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng-0.01},${coords.lat-0.01},${coords.lng+0.01},${coords.lat+0.01}&layer=mapnik&marker=${coords.lat},${coords.lng}`;
            newProvider = 'OpenStreetMaps';
        } else {
            //console.warn('⚠️ TOGGLE MAP: No se pudieron extraer coordenadas de Google Maps');
            return;
        }
    }
    
    // Cambiar el iframe y actualizar el botón
    iframe.src = newSrc;
    button.innerHTML = `<i class="fas fa-exchange-alt mr-1"></i>Cambiar a ${newProvider === 'Google Maps' ? 'OSM' : 'Google'}`;
    
    // Actualizar las coordenadas mostradas
    const coords = newProvider === 'Google Maps' ? 
        extractCoordsFromGoogleMapsUrl(googleUrl) : 
        extractCoordsFromOSMUrl(osmUrl);
    
    if (coords) {
        const coordsDisplay = button.closest('.modal-section').querySelector('.font-mono');
        if (coordsDisplay) {
            coordsDisplay.textContent = `📍 ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
        }
    }
    
    //console.log(`🗺️ MAP TOGGLE: Cambiado a ${newProvider}`);
}

/**
 * Extrae coordenadas de un URL de Google Maps
 */
function extractCoordsFromGoogleMapsUrl(url) {
    const match = url.match(/place\/(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) {
        return {
            lat: parseFloat(match[1]),
            lng: parseFloat(match[2])
        };
    }
    return null;
}

/**
 * Extrae coordenadas de un URL de OpenStreetMaps
 */
function extractCoordsFromOSMUrl(url) {
    const match = url.match(/mlat=(-?\d+\.\d+).*mlon=(-?\d+\.\d+)/);
    if (match) {
        return {
            lat: parseFloat(match[1]),
            lng: parseFloat(match[2])
        };
    }
    return null;
}

/**
 * Extrae coordenadas de un URL embed de OpenStreetMaps
 */
function extractCoordsFromOSMEmbed(embedUrl) {
    const match = embedUrl.match(/marker=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) {
        return {
            lat: parseFloat(match[1]),
            lng: parseFloat(match[2])
        };
    }
    return null;
}
// ========== FUNCIONES DE MODAL DE IMÁGENES ==========

/**
 * Muestra una imagen en modal de pantalla completa
 * @param {string} imageSrc - URL de la imagen
 * @param {string} imageTitle - Título de la imagen
 */
function showImageModal(imageSrc, imageTitle = 'Imagen') {
    //console.log('🖼️ Mostrando modal de imagen:', imageSrc);
    
    // Crear el modal de imagen si no existe
    let imageModal = document.getElementById('imageDisplayModal');
    if (!imageModal) {
        // Crear el modal dinámicamente
        const modalHTML = `
            <div id="imageDisplayModal" class="fixed inset-0 z-50 hidden flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div class="relative max-w-7xl max-h-[95vh] w-full mx-4 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
                    <!-- Header del modal -->
                    <div class="flex items-center justify-between p-4 bg-gradient-to-r from-gray-800 to-gray-700 border-b border-gray-600">
                        <h3 id="imageModalTitle" class="text-lg font-semibold text-white truncate flex-1 mr-4">Imagen de la Alerta</h3>
                        <button 
                            onclick="closeImageModal()" 
                            class="w-8 h-8 flex items-center justify-center bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-white rounded-full transition-all duration-200"
                            title="Cerrar imagen"
                        >
                            <i class="fas fa-times text-sm"></i>
                        </button>
                    </div>
                    
                    <!-- Contenedor de imagen -->
                    <div class="relative bg-gray-800 flex items-center justify-center" style="min-height: 400px; max-height: calc(95vh - 120px);">
                        <img 
                            id="modalDisplayImage" 
                            src="" 
                            alt="Imagen de alerta" 
                            class="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                            onload="hideImageLoading()"
                            onerror="showImageError()"
                        />
                        
                        <!-- Indicador de carga -->
                        <div id="imageLoadingIndicator" class="absolute inset-0 flex items-center justify-center bg-gray-800">
                            <div class="text-center text-white">
                                <i class="fas fa-spinner fa-spin text-3xl mb-3 text-blue-400"></i>
                                <p class="text-sm text-gray-300">Cargando imagen...</p>
                            </div>
                        </div>
                        
                        <!-- Mensaje de error -->
                        <div id="imageErrorIndicator" class="absolute inset-0 flex items-center justify-center bg-gray-800 hidden">
                            <div class="text-center text-white">
                                <i class="fas fa-exclamation-triangle text-3xl mb-3 text-red-400"></i>
                                <p class="text-sm text-gray-300 mb-2">Error al cargar la imagen</p>
                                <button 
                                    onclick="retryImageLoad()" 
                                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                                >
                                    <i class="fas fa-redo mr-2"></i>Reintentar
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Footer con controles -->
                    <div class="flex items-center justify-between p-4 bg-gradient-to-r from-gray-800 to-gray-700 border-t border-gray-600">
                        <div class="flex items-center space-x-2 text-gray-300 text-sm">
                            <i class="fas fa-info-circle text-blue-400"></i>
                            <span>Clic fuera de la imagen para cerrar</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <button 
                                onclick="downloadImage()" 
                                class="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex items-center"
                                title="Descargar imagen"
                            >
                                <i class="fas fa-download mr-2"></i>Descargar
                            </button>
                            <button 
                                onclick="openImageInNewTab()" 
                                class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center"
                                title="Abrir en nueva pestaña"
                            >
                                <i class="fas fa-external-link-alt mr-2"></i>Nueva Pestaña
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        imageModal = document.getElementById('imageDisplayModal');
        
        // Agregar evento de clic fuera del modal para cerrar
        imageModal.addEventListener('click', function(e) {
            if (e.target === imageModal) {
                closeImageModal();
            }
        });
        
        // Agregar evento de teclado para cerrar con ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && !imageModal.classList.contains('hidden')) {
                closeImageModal();
            }
        });
    }
    
    // Configurar y mostrar el modal
    const modalTitle = document.getElementById('imageModalTitle');
    const modalImage = document.getElementById('modalDisplayImage');
    const loadingIndicator = document.getElementById('imageLoadingIndicator');
    const errorIndicator = document.getElementById('imageErrorIndicator');
    
    if (modalTitle) modalTitle.textContent = imageTitle;
    if (modalImage) {
        modalImage.src = imageSrc;
        modalImage.style.display = 'none'; // Ocultar hasta que cargue
    }
    
    // Mostrar indicador de carga
    if (loadingIndicator) loadingIndicator.classList.remove('hidden');
    if (errorIndicator) errorIndicator.classList.add('hidden');
    
    // Mostrar el modal
    imageModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevenir scroll del body
    
    //console.log('✅ Modal de imagen mostrado correctamente');
}

/**
 * Cierra el modal de imagen
 */
function closeImageModal() {
    const imageModal = document.getElementById('imageDisplayModal');
    if (imageModal) {
        imageModal.classList.add('hidden');
        document.body.style.overflow = ''; // Restaurar scroll del body
        //console.log('🖼️ Modal de imagen cerrado');
    }
}

/**
 * Oculta el indicador de carga cuando la imagen se carga exitosamente
 */
function hideImageLoading() {
    const loadingIndicator = document.getElementById('imageLoadingIndicator');
    const modalImage = document.getElementById('modalDisplayImage');
    
    if (loadingIndicator) loadingIndicator.classList.add('hidden');
    if (modalImage) modalImage.style.display = 'block';
}

/**
 * Muestra el indicador de error cuando falla la carga de imagen
 */
function showImageError() {
    const loadingIndicator = document.getElementById('imageLoadingIndicator');
    const errorIndicator = document.getElementById('imageErrorIndicator');
    const modalImage = document.getElementById('modalDisplayImage');
    
    if (loadingIndicator) loadingIndicator.classList.add('hidden');
    if (errorIndicator) errorIndicator.classList.remove('hidden');
    if (modalImage) modalImage.style.display = 'none';
}

/**
 * Reintenta cargar la imagen
 */
function retryImageLoad() {
    const modalImage = document.getElementById('modalDisplayImage');
    const loadingIndicator = document.getElementById('imageLoadingIndicator');
    const errorIndicator = document.getElementById('imageErrorIndicator');
    
    if (modalImage && loadingIndicator && errorIndicator) {
        // Mostrar loading y ocultar error
        loadingIndicator.classList.remove('hidden');
        errorIndicator.classList.add('hidden');
        modalImage.style.display = 'none';
        
        // Reintentar carga añadiendo timestamp para evitar cache
        const currentSrc = modalImage.src;
        const newSrc = currentSrc + (currentSrc.includes('?') ? '&' : '?') + 't=' + Date.now();
        modalImage.src = newSrc;
    }
}

/**
 * Descarga la imagen actual
 */
function downloadImage() {
    const modalImage = document.getElementById('modalDisplayImage');
    if (modalImage && modalImage.src) {
        const link = document.createElement('a');
        link.href = modalImage.src;
        link.download = `alerta-imagen-${Date.now()}.jpg`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showSimpleNotification('Descarga de imagen iniciada', 'success', 3000);
    }
}

/**
 * Abre la imagen en una nueva pestaña
 */
function openImageInNewTab() {
    const modalImage = document.getElementById('modalDisplayImage');
    if (modalImage && modalImage.src) {
        window.open(modalImage.src, '_blank');
    }
}

// Hacer funciones disponibles globalmente
window.showAlertDetails = showAlertDetails;
window.closeAlertModal = closeAlertModal;
window.showDeactivateConfirmation = showDeactivateConfirmation;
window.closeDeactivateModal = closeDeactivateModal;
window.confirmDeactivateAlert = confirmDeactivateAlert;
window.refreshAlerts = refreshAlerts;
window.refreshAlertsQuietly = refreshAlertsQuietly;
window.changePage = changePage;
window.connectWebSocket = connectWebSocket;
window.showImageModal = showImageModal;
window.closeImageModal = closeImageModal;
window.hideImageLoading = hideImageLoading;
window.showImageError = showImageError;
window.retryImageLoad = retryImageLoad;
window.downloadImage = downloadImage;
window.openImageInNewTab = openImageInNewTab;

// ========== FUNCIONES PARA CONTADOR DE CARACTERES ==========
function setupMessageCharacterCounter() {
    // Esta función se ejecuta cuando se carga la página
    // El event listener se añade dinámicamente cuando el modal se abre
    //console.log('✅ Sistema de contador de caracteres configurado');
}

function updateCharacterCounter() {
    const textarea = document.getElementById('mensajeDesactivacion');
    const counter = document.getElementById('charCounter');
    const confirmBtn = document.getElementById('deactivateConfirmBtn');
    
    if (textarea && counter) {
        const currentLength = textarea.value.length;
        const maxLength = parseInt(textarea.getAttribute('maxlength')) || 500;
        const message = textarea.value.trim();
        
        counter.textContent = `${currentLength}/${maxLength}`;
        
        // Validar si el mensaje es obligatorio
        const isValid = message.length > 0;
        
        // Controlar el estado del botón de confirmación
        if (confirmBtn) {
            confirmBtn.disabled = !isValid;
            if (isValid) {
                confirmBtn.className = confirmBtn.className.replace('opacity-50 cursor-not-allowed', 'hover:bg-red-700');
                confirmBtn.title = 'Desactivar alerta con el mensaje proporcionado';
            } else {
                confirmBtn.className = confirmBtn.className.replace('hover:bg-red-700', 'opacity-50 cursor-not-allowed');
                confirmBtn.title = 'Debe escribir un mensaje para desactivar la alerta';
            }
        }
        
        // Cambiar color según el límite y validez
        if (!isValid) {
            counter.className = 'text-red-300 text-xs font-semibold';
        } else if (currentLength >= maxLength * 0.9) {
            counter.className = 'text-orange-300 text-xs font-semibold';
        } else if (currentLength >= maxLength * 0.7) {
            counter.className = 'text-yellow-300 text-xs';
        } else {
            counter.className = 'text-green-300 text-xs';
        }
    }
}

// Añadir event listener cuando el modal se abre
function attachCharacterCounterListener() {
    const textarea = document.getElementById('mensajeDesactivacion');
    if (textarea) {
        // Remover listeners anteriores para evitar duplicados
        textarea.removeEventListener('input', updateCharacterCounter);
        textarea.removeEventListener('keyup', updateCharacterCounter);
        
        // Añadir nuevos listeners
        textarea.addEventListener('input', updateCharacterCounter);
        textarea.addEventListener('keyup', updateCharacterCounter);
        
        // Inicializar contador
        updateCharacterCounter();
    }
}

// ========== FUNCIÓN DE NOTIFICACIONES SIMPLES ==========
/**
 * Muestra una notificación popup simple y elegante
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duración en milisegundos (opcional, por defecto 4000)
 */
function showSimpleNotification(message, type = 'info', duration = 4000) {
    //console.log(`📢 NOTIFICACIÓN ${type.toUpperCase()}: ${message}`);
    
    // Configuración de tipos
    const typeConfig = {
        success: {
            icon: 'fas fa-check-circle',
            bgClass: 'from-green-500 to-emerald-600',
            textClass: 'text-green-100',
            iconClass: 'text-green-200'
        },
        error: {
            icon: 'fas fa-times-circle',
            bgClass: 'from-red-500 to-red-600',
            textClass: 'text-red-100',
            iconClass: 'text-red-200'
        },
        warning: {
            icon: 'fas fa-exclamation-triangle',
            bgClass: 'from-yellow-500 to-orange-600',
            textClass: 'text-yellow-100',
            iconClass: 'text-yellow-200'
        },
        info: {
            icon: 'fas fa-info-circle',
            bgClass: 'from-blue-500 to-cyan-600',
            textClass: 'text-blue-100',
            iconClass: 'text-blue-200'
        }
    };
    
    const config = typeConfig[type] || typeConfig.info;
    
    // Crear el elemento de notificación
    const notificationId = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const notificationElement = document.createElement('div');
    notificationElement.id = notificationId;
    notificationElement.innerHTML = `
        <div class="alert-notification fixed top-4 right-4 transform transition-all duration-500 ease-out" style="transform: translateX(100%) scale(0.8); opacity: 0; z-index: 1080;">
            <div class="bg-gradient-to-r ${config.bgClass} text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-sm max-w-sm min-w-80">
                <div class="flex items-center space-x-4">
                    <!-- Icono animado -->
                    <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <i class="${config.icon} ${config.iconClass} text-lg"></i>
                    </div>
                    <!-- Contenido -->
                    <div class="flex-1 min-w-0">
                        <p class="${config.textClass} text-sm font-medium leading-relaxed break-words">${message}</p>
                    </div>
                    <!-- Botón cerrar -->
                    <div class="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center cursor-pointer transition-colors flex-shrink-0" onclick="removeNotification('${notificationId}')">
                        <i class="fas fa-times text-white text-sm"></i>
                    </div>
                </div>
                <!-- Barra de progreso -->
                <div class="mt-3 bg-white/20 rounded-full h-1 overflow-hidden">
                    <div class="bg-white h-full rounded-full animate-progress" style="animation: notificationProgress ${duration}ms linear forwards;"></div>
                </div>
            </div>
        </div>
        
        <style>
        @keyframes notificationProgress {
            from { width: 100%; }
            to { width: 0%; }
        }
        </style>
    `;
    
    // Agregar al body
    document.body.appendChild(notificationElement);
    
    // Animar entrada
    const notificationDiv = notificationElement.firstElementChild;
    requestAnimationFrame(() => {
        notificationDiv.style.transform = 'translateX(0) scale(1)';
        notificationDiv.style.opacity = '1';
    });
    
    // Auto-eliminar después del tiempo especificado
    setTimeout(() => {
        removeNotification(notificationId);
    }, duration);
}

/**
 * Remueve una notificación específica con animación
 * @param {string} notificationId - ID de la notificación a remover
 */
function removeNotification(notificationId) {
    const notification = document.getElementById(notificationId);
    if (notification) {
        const notificationDiv = notification.firstElementChild;
        if (notificationDiv) {
            notificationDiv.style.transform = 'translateX(100%) scale(0.8)';
            notificationDiv.style.opacity = '0';
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }
    }
}

// Hacer la función disponible globalmente
window.showSimpleNotification = showSimpleNotification;
window.removeNotification = removeNotification;

// ========== FUNCIÓN PARA APERTURA AUTOMÁTICA DE MODAL ==========
/**
 * Verifica si debe abrir automáticamente el modal de una alerta específica
 * Esto se activa cuando se llega desde el sistema global de alertas
 */
function checkForAutoOpenAlert() {
    // Verificar si hay un ID de alerta para abrir automáticamente
    const openAlertId = sessionStorage.getItem('openAlertId');
    
    if (openAlertId) {
        //console.log(`🎯 AUTO-OPEN: Detectado ID de alerta para abrir automáticamente: ${openAlertId}`);
        
        // Limpiar la variable de sesión
        sessionStorage.removeItem('openAlertId');
        
        // Esperar un poco para que las alertas se carguen primero
        setTimeout(async () => {
            // Intentar encontrar la alerta
            const alert = await findAlertById(openAlertId);
            
            if (alert) {
                //console.log(`✅ AUTO-OPEN: Alerta encontrada, abriendo modal...`);
                showAlertDetails(openAlertId);
            } else {
                //console.warn(`⚠️ AUTO-OPEN: No se pudo encontrar la alerta ${openAlertId}`);
                showSimpleNotification('La alerta seleccionada no se pudo cargar', 'warning');
            }
        }, 1500); // Esperar 1.5 segundos para asegurar que las alertas se carguen
    }
}

// ========== EXPOSICIÓN GLOBAL DE FUNCIONES ==========
// Exponer funciones principales para uso global
window.generateModalContent = generateModalContent;
window.getPriorityClass = getPriorityClass;
window.getAlertTypeColor = getAlertTypeColor;
window.formatDate = formatDate;
window.generateLocationContent = generateLocationContent;
window.generateEmbeddedMap = generateEmbeddedMap;
window.generateSpecificLocationContent = generateSpecificLocationContent;
window.generateAssociatedHardwareContent = generateAssociatedHardwareContent;
window.generateOriginDetailsContent = generateOriginDetailsContent;
window.toggleMapProvider = toggleMapProvider;
window.extractCoordsFromGoogleMapsUrl = extractCoordsFromGoogleMapsUrl;
window.extractCoordsFromOSMUrl = extractCoordsFromOSMUrl;
window.extractCoordsFromOSMEmbed = extractCoordsFromOSMEmbed;

// Debug tools
window.alertsDebug = {
    getCacheStats: () => cacheMetadata,
    clearCache: clearAlertsCache,
    findAlert: findAlertById,
    getCache: () => {
        const cacheObj = {};
        alertsCache.forEach((value, key) => {
            cacheObj[key] = value;
        });
        return cacheObj;
    }
};
