/**
 * ALERTAS INACTIVAS - SISTEMA PRINCIPAL
 * Sistema completo para manejo de alertas inactivas con paginación
 */

// ========== VARIABLES GLOBALES ==========
let currentInactivePage = 1;
let totalInactivePages = 1;
let currentInactiveAlerts = [];
let selectedInactiveAlertId = null;
let inactiveAlertsPerPage = 5; // Igual que las alertas activas

// Cache de alertas inactivas por ID
let inactiveAlertsCache = new Map();
let inactiveCacheMetadata = {
    lastUpdate: null,
    totalCachedAlerts: 0,
    cacheHits: 0,
    cacheMisses: 0
};

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚫 ALERTAS INACTIVAS: Página de alertas inactivas inicializada');
    
    // Inicializar sistema de cache
    initializeInactiveCacheSystem();
    
    // Configurar el modal manager (reutilizando modales existentes)
    if (window.modalManager) {
        window.modalManager.setupModal('alertDetailModal');
        console.log('✅ Modal de alertas configurado para alertas inactivas');
    } else {
        console.warn('⚠️ ModalManager no está disponible');
    }
    
    // Cargar alertas inactivas iniciales
    loadInactiveAlerts();
    
    console.log('✅ ALERTAS INACTIVAS: Sistema completamente inicializado');
});

// ========== FUNCIONES PRINCIPALES DE ALERTAS INACTIVAS ==========
async function loadInactiveAlerts() {
    try {
        console.log('🚫 INICIANDO CARGA DE ALERTAS INACTIVAS');
        showInactiveLoading(true);
        
        // Obtener empresa_id del usuario actual
        const empresaId = window.currentUser?.empresa_id || window.currentUser?.id;
        console.log('👤 EmpresaId obtenido:', empresaId);
        
        if (!empresaId) {
            console.error('❌ No se pudo obtener el ID de empresa');
            showNoInactiveAlerts();
            return;
        }
        
        // Inicializar cliente API si no existe
        if (!window.apiClient) {
            window.apiClient = new EndpointTestClient();
        }
        
        console.log('🔗 Consultando alertas inactivas usando API client');
        
        // Calcular el offset como en las alertas activas
        const offset = (currentInactivePage - 1) * inactiveAlertsPerPage;
        
        // Llamar al endpoint de alertas inactivas usando el cliente API
        const response = await window.apiClient.get_inactive_alerts_by_empresa(
            empresaId, 
            inactiveAlertsPerPage, 
            offset
        );
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            console.error('❌ Response not ok:', response.status, response.statusText);
            throw new Error('Error al cargar alertas inactivas: ' + response.status);
        }
        
        const data = await response.json();
        console.log('📊 DATA RECIBIDA (INACTIVAS):', data);
        
        if (data.success && data.alerts && Array.isArray(data.alerts)) {
            console.log('✅ Data válida, procesando alertas inactivas...');
            
            const allInactiveAlerts = data.alerts;
            console.log(`📋 Total alertas inactivas en esta página: ${allInactiveAlerts.length}`);
            
            // Usar la información de paginación del backend - los datos vienen directamente en el objeto data
            totalInactivePages = data.total_pages || 1;
            console.log(`📄 Paginación: página ${currentInactivePage} de ${totalInactivePages}`);
            console.log(`📊 Total alertas: ${data.total}, Límite: ${data.limit}, Página actual: ${data.page}`);
            
            // Guardar alertas inactivas actuales
            currentInactiveAlerts = allInactiveAlerts;
            
            // Cache: Guardar alertas por ID
            cacheInactiveAlertsById(allInactiveAlerts);
            
            // Renderizar alertas inactivas
            renderInactiveAlerts(allInactiveAlerts);
            updateInactivePagination();
        } else {
            console.log('⚠️ No hay alertas inactivas disponibles');
            currentInactiveAlerts = [];
            showNoInactiveAlerts();
        }
        
    } catch (error) {
        console.error('💥 ERROR cargando alertas inactivas:', error);
        showNoInactiveAlerts();
        throw error;
        
    } finally {
        showInactiveLoading(false);
    }
}

function renderInactiveAlerts(alerts) {
    console.log('🎨 RENDER INACTIVE ALERTS: Función renderInactiveAlerts llamada con:', alerts);
    
    const container = document.getElementById('inactiveAlertsContainer');
    const noAlertsMsg = document.getElementById('noInactiveAlertsMessage');
    
    if (!container) {
        console.error('❌ Container inactiveAlertsContainer no encontrado');
        return;
    }
    
    if (!alerts || alerts.length === 0) {
        console.log('🎨 RENDER INACTIVE ALERTS: No hay alertas inactivas, mostrando mensaje');
        container.innerHTML = '';
        if (noAlertsMsg) {
            noAlertsMsg.classList.remove('hidden');
        }
        return;
    }
    
    console.log('🎨 RENDER INACTIVE ALERTS: Ocultando mensaje de no alertas');
    if (noAlertsMsg) {
        noAlertsMsg.classList.add('hidden');
    }
    
    const alertsHTML = alerts.map(alert => {
        // Determinar el origen de la alerta
        const isUserOrigin = alert.data?.origen === 'usuario_movil' || alert.activacion_alerta?.tipo_activacion === 'usuario';
        const isHardwareOrigin = alert.data?.tipo_mensaje === 'alarma' || alert.activacion_alerta?.tipo_activacion === 'hardware';
        
        // Determinar el nombre de la alerta según su origen
        let alertTypeName = alert.nombre_alerta || 'Alerta';
        let originLabel = '';
        
        if (isUserOrigin) {
            originLabel = 'Usuario';
            alertTypeName = alert.nombre_alerta || 'Alerta de Usuario';
        } else if (isHardwareOrigin) {
            originLabel = 'Hardware';
            alertTypeName = alert.nombre_alerta || 'Alerta de Hardware';
        } else {
            originLabel = 'Sistema';
        }
        
        return `
        <div class="alert-card ios-hardware-card alert-priority-${alert.prioridad} alert-status-inactive" onclick="console.log('🖱️ CLICK en alerta:', '${alert._id}'); window.showInactiveAlertDetails('${alert._id}');">
            <div class="flex items-start space-x-4">
                <div class="flex-shrink-0">
                    <div class="w-16 h-16 rounded-xl flex items-center justify-center ${isUserOrigin ? 'alert-origin-usuario' : 'alert-origin-hardware'} opacity-60">
                        <i class="fas fa-${isUserOrigin ? 'user' : 'microchip'} text-white text-xl"></i>
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
                            <span class="px-2 py-1 rounded-full text-xs font-medium bg-gray-500 text-white">
                                INACTIVA
                            </span>
                            <span class="px-2 py-1 rounded-full text-xs font-medium ${
                                isUserOrigin ? 'bg-purple-500' : 
                                isHardwareOrigin ? 'bg-blue-500' : 'bg-gray-500'
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
                    
                    <!-- Fecha de desactivación si existe -->
                    ${alert.fecha_desactivacion ? `
                        <div class="mt-2 text-xs text-red-300">
                            <i class="fas fa-power-off mr-1"></i>
                            Desactivada: ${formatDate(alert.fecha_desactivacion)}
                        </div>
                    ` : ''}
                    
                    <div class="mt-3 flex items-center justify-between">
                        <span class="alert-timestamp text-gray-400">
                            <i class="fas fa-clock mr-1"></i>
                            Creada: ${formatDate(alert.fecha_creacion)}
                        </span>
                        
                        <div class="flex items-center space-x-2 text-xs">
                            ${alert.numeros_telefonicos && alert.numeros_telefonicos.length > 0 ? `
                                <span class="text-blue-400">
                                    <i class="fas fa-phone mr-1"></i>
                                    ${alert.numeros_telefonicos.length} contacto(s)
                                </span>
                            ` : ''}
                            ${alert.tipo_alerta ? `
                                <span class="px-2 py-1 rounded text-xs opacity-70" style="background-color: ${getAlertTypeColor(alert.tipo_alerta)}20; color: ${getAlertTypeColor(alert.tipo_alerta)}">
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
    
    console.log('🎨 RENDER INACTIVE ALERTS: Inyectando HTML en container...');
    container.innerHTML = alertsHTML;
}

// ========== FUNCIONES DE CACHE PARA ALERTAS INACTIVAS ==========
function initializeInactiveCacheSystem() {
    console.log('💾 CACHE INACTIVO: Inicializando sistema de cache para alertas inactivas...');
    inactiveAlertsCache.clear();
    inactiveCacheMetadata = {
        lastUpdate: new Date(),
        totalCachedAlerts: 0,
        cacheHits: 0,
        cacheMisses: 0
    };
    console.log('✅ CACHE INACTIVO: Sistema de cache inicializado');
}

function cacheInactiveAlertsById(alerts) {
    if (!Array.isArray(alerts)) return;
    
    let newCacheCount = 0;
    alerts.forEach(alert => {
        if (alert._id && !inactiveAlertsCache.has(alert._id)) {
            // Guardar toda la información de la alerta en cache
            const fullAlertData = {
                ...alert,
                // Asegurar que se incluyan todos los campos necesarios
                activacion_alerta: alert.activacion_alerta || null,
                nombre_alerta: alert.nombre_alerta || null,
                descripcion: alert.descripcion || null,
                image_alert: alert.image_alert || null,
                cached_at: new Date().toISOString()
            };
            
            inactiveAlertsCache.set(alert._id, fullAlertData);
            newCacheCount++;
        }
    });
    
    inactiveCacheMetadata.totalCachedAlerts = inactiveAlertsCache.size;
    inactiveCacheMetadata.lastUpdate = new Date();
    
    if (newCacheCount > 0) {
        console.log(`💾 CACHE INACTIVO: ${newCacheCount} nuevas alertas inactivas guardadas en cache. Total: ${inactiveCacheMetadata.totalCachedAlerts}`);
    }
}

function getInactiveAlertById(alertId) {
    const currentAlert = currentInactiveAlerts.find(a => a._id === alertId);
    if (currentAlert) {
        inactiveCacheMetadata.cacheHits++;
        return currentAlert;
    }
    
    const cachedAlert = inactiveAlertsCache.get(alertId);
    if (cachedAlert) {
        inactiveCacheMetadata.cacheHits++;
        return cachedAlert;
    }
    
    inactiveCacheMetadata.cacheMisses++;
    return null;
}

async function findInactiveAlertById(alertId) {
    try {
        console.log('🔍 CACHE INACTIVO: Buscando alerta inactiva por ID:', alertId);
        
        const cachedAlert = getInactiveAlertById(alertId);
        if (cachedAlert && cachedAlert.is_full_data) {
            console.log('✅ CACHE HIT: Datos completos encontrados en cache');
            return cachedAlert;
        }
        
        console.log('📡 Haciendo petición al backend para alerta específica:', alertId);
        const response = await fetch(`/proxy/api/mqtt-alerts/${alertId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        
        if (!response.ok) {
            console.error(`❌ Error en petición: ${response.status} ${response.statusText}`);
            return null;
        }
        
        const data = await response.json();
        console.log('📊 DATA COMPLETA DE ALERTA INACTIVA:', data);
        
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
                tipo_alerta: data.alert.tipo_alerta,
                nombre_alerta: data.alert.nombre_alerta,
                descripcion: data.alert.descripcion,
                image_alert: data.alert.image_alert,
                ubicacion: data.alert.ubicacion || {},
                activacion_alerta: data.alert.activacion_alerta || {},
                elementos_necesarios: data.alert.elementos_necesarios || [],
                instrucciones: data.alert.instrucciones || [],
                cached_at: new Date().toISOString(),
                fetched_from_backend: true,
                is_full_data: true
            };
            
            console.log('🔍 DEBUG ALERTA INACTIVA COMPLETA:', fullAlertData);
            console.log('🔍 DEBUG DESACTIVADO POR:', fullAlertData.desactivado_por);
            
            inactiveAlertsCache.set(alertId, fullAlertData);
            return fullAlertData;
        }
        
        return null;
        
    } catch (error) {
        console.error(`💥 Error buscando alerta inactiva ${alertId}:`, error);
        return null;
    }
}

// ========== FUNCIONES DE MODAL PARA ALERTAS INACTIVAS ==========
async function showInactiveAlertDetails(alertId) {
    console.log('🔍 Intentando mostrar detalles de alerta inactiva:', alertId);
    
    const alert = await findInactiveAlertById(alertId);
    if (!alert) {
        console.warn('❌ No se encontró la alerta inactiva con ID:', alertId);
        if (window.Swal) {
            Swal.fire({
                icon: 'error',
                title: 'Alerta no encontrada',
                text: 'No se pudo cargar la información de esta alerta inactiva.',
                timer: 3000,
                showConfirmButton: false
            });
        }
        return;
    }
    
    console.log('✅ Alerta inactiva encontrada:', alert);
    selectedInactiveAlertId = alertId;
    
    const modal = document.getElementById('alertDetailModal');
    if (!modal) {
        console.error('❌ Modal alertDetailModal no encontrado en DOM');
        return;
    }
    
    if (window.modalManager && window.modalManager.isModalOpen('alertDetailModal')) {
        console.log('🔄 Modal ya abierto, cerrándolo primero...');
        window.modalManager.closeModal('alertDetailModal');
        setTimeout(() => showInactiveAlertDetails(alertId), 100);
        return;
    }
    
    // Poblar el modal con los detalles (reutilizando función existente)
    const content = document.getElementById('alertDetailsContent');
    const subtitle = document.getElementById('modalAlertSubtitle');
    const toggleBtn = document.getElementById('toggleStatusBtn');
    
    if (!content || !subtitle || !toggleBtn) {
        console.error('❌ Elementos del modal no encontrados');
        return;
    }
    
    const isUserOrigin = alert.data?.origen === 'usuario_movil' || alert.activacion_alerta?.tipo_activacion === 'usuario';
    const isHardwareOrigin = alert.data?.tipo_mensaje === 'alarma' || alert.activacion_alerta?.tipo_activacion === 'hardware';
    
    let displayName = '';
    if (isUserOrigin) {
        displayName = alert.activacion_alerta?.nombre || alert.data?.botonera_ubicacion?.hardware_nombre || 'Usuario Móvil';
    } else if (isHardwareOrigin) {
        displayName = alert.activacion_alerta?.nombre || alert.hardware_nombre || 'Hardware';
    } else {
        displayName = alert.hardware_nombre || alert.activacion_alerta?.nombre || 'Sistema';
    }
    
    const empresaName = alert.empresa_nombre || 'Empresa';
    subtitle.textContent = `${displayName} - ${empresaName} (INACTIVA)`;
    
    // Generar contenido del modal (reutilizando función existente si está disponible)
    if (typeof generateModalContent === 'function') {
        content.innerHTML = generateModalContent(alert, isUserOrigin, isHardwareOrigin);
    } else {
        content.innerHTML = generateInactiveModalContent(alert, isUserOrigin, isHardwareOrigin);
    }
    
    // Para alertas inactivas, el botón podría ser "Reactivar" o estar deshabilitado
    toggleBtn.innerHTML = `<i class="fas fa-toggle-on mr-2"></i><span id="toggleStatusText">Reactivar</span>`;
    toggleBtn.disabled = true; // Por ahora deshabilitado para alertas inactivas
    
    // Abrir modal
    setTimeout(() => {
        window.modalManager.openModal('alertDetailModal');
        console.log('✅ Modal de alerta inactiva abierto correctamente');
    }, 50);
}

function generateInactiveModalContent(alert, isUserOrigin, isHardwareOrigin) {
    return `
        <!-- Header para alerta inactiva -->
        <div class="mb-4 p-4 rounded-lg bg-gradient-to-r from-gray-600 to-gray-700 opacity-80">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <i class="fas fa-power-off text-white text-lg"></i>
                    </div>
                    <div>
                        <h3 class="text-white font-bold text-lg">
                            🚫 Alerta Inactiva
                        </h3>
                        <p class="text-white/80 text-sm">
                            Esta alerta ha sido desactivada
                        </p>
                    </div>
                </div>
                <div class="text-right">
                    <div class="flex items-center space-x-2 mt-2">
                        <span class="px-2 py-1 rounded-full text-xs font-bold bg-gray-500/30 text-gray-200">
                            INACTIVA
                        </span>
                        <span class="px-2 py-1 rounded-full text-xs font-bold ${getPriorityClass(alert.prioridad)}">
                            ${alert.prioridad.toUpperCase()}
                        </span>
                        ${alert.fecha_desactivacion ? `
                            <span class="px-2 py-1 rounded-full text-xs font-bold bg-red-500/30 text-red-200">
                                ${formatDate(alert.fecha_desactivacion)}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Contenido básico de información -->
        <div class="space-y-4">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div class="modal-section bg-white/5 rounded-lg p-4">
                    <h4 class="text-white font-semibold mb-2">
                        <i class="fas fa-info-circle mr-2"></i>Información General
                    </h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-400">Nombre:</span>
                            <span class="text-white">${alert.nombre_alerta || 'N/A'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Empresa:</span>
                            <span class="text-white">${alert.empresa_nombre || 'N/A'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Sede:</span>
                            <span class="text-white">${alert.sede || 'N/A'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Tipo:</span>
                            <span class="text-white">${alert.tipo_alerta || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="modal-section bg-white/5 rounded-lg p-4">
                    <h4 class="text-white font-semibold mb-2">
                        <i class="fas fa-calendar mr-2"></i>Fechas
                    </h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-400">Creada:</span>
                            <span class="text-white">${formatDate(alert.fecha_creacion)}</span>
                        </div>
                        ${alert.fecha_desactivacion ? `
                            <div class="flex justify-between">
                                <span class="text-gray-400">Desactivada:</span>
                                <span class="text-red-300">${formatDate(alert.fecha_desactivacion)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            ${alert.descripcion ? `
                <div class="modal-section bg-white/5 rounded-lg p-4">
                    <h4 class="text-white font-semibold mb-2">
                        <i class="fas fa-align-left mr-2"></i>Descripción
                    </h4>
                    <p class="text-gray-300 text-sm">${alert.descripcion}</p>
                </div>
            ` : ''}
        </div>
    `;
}

// ========== FUNCIONES DE PAGINACIÓN ==========
function changePageInactive(direction) {
    const newPage = currentInactivePage + direction;
    if (newPage >= 1 && newPage <= totalInactivePages) {
        currentInactivePage = newPage;
        loadInactiveAlerts();
    }
}

function updateInactivePagination() {
    const paginationContainer = document.getElementById('paginationContainerInactive');
    const prevBtn = document.getElementById('prevPageBtnInactive');
    const nextBtn = document.getElementById('nextPageBtnInactive');
    const pageInfo = document.getElementById('pageInfoInactive');
    
    if (!paginationContainer || !prevBtn || !nextBtn || !pageInfo) {
        console.warn('⚠️ Elementos de paginación no encontrados');
        return;
    }
    
    // Mostrar paginación solo si hay más de una página
    if (totalInactivePages > 1) {
        paginationContainer.style.display = 'flex';
        
        // Actualizar botones
        prevBtn.disabled = currentInactivePage <= 1;
        nextBtn.disabled = currentInactivePage >= totalInactivePages;
        
        // Actualizar información de página
        pageInfo.textContent = `Página ${currentInactivePage} de ${totalInactivePages}`;
    } else {
        paginationContainer.style.display = 'none';
    }
}

// ========== FUNCIONES DE UTILIDAD ==========
function showInactiveLoading(show) {
    const skeleton = document.getElementById('loadingSkeletonInactive');
    const container = document.getElementById('inactiveAlertsContainer');
    
    if (show) {
        if (skeleton) skeleton.classList.remove('hidden');
    } else {
        if (skeleton) skeleton.classList.add('hidden');
    }
}

function showNoInactiveAlerts() {
    const container = document.getElementById('inactiveAlertsContainer');
    const noAlertsMsg = document.getElementById('noInactiveAlertsMessage');
    
    if (container) container.innerHTML = '';
    if (noAlertsMsg) noAlertsMsg.classList.remove('hidden');
    
    // Ocultar paginación
    const paginationContainer = document.getElementById('paginationContainerInactive');
    if (paginationContainer) paginationContainer.style.display = 'none';
}

// Reutilizar funciones de utilidad existentes si están disponibles
if (typeof getPriorityClass === 'undefined') {
    function getPriorityClass(prioridad) {
        switch(prioridad) {
            case 'critica': return 'bg-red-600 text-white';
            case 'alta': return 'bg-orange-600 text-white';
            case 'media': return 'bg-yellow-600 text-white';
            case 'baja': return 'bg-green-600 text-white';
            default: return 'bg-gray-600 text-white';
        }
    }
}

if (typeof getAlertTypeColor === 'undefined') {
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
}

if (typeof formatDate === 'undefined') {
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
}

// ========== FUNCIONES GLOBALES DE MODAL ==========
function closeAlertModal() {
    if (window.modalManager) {
        window.modalManager.closeModal('alertDetailModal');
    }
    console.log('✅ Modal de alerta cerrado');
}

function showDeactivateConfirmation() {
    console.log('🚫 Esta función no está disponible para alertas inactivas');
    if (window.Swal) {
        Swal.fire({
            icon: 'info',
            title: 'Acción no disponible',
            text: 'Esta función no está disponible para alertas inactivas.',
            timer: 2000,
            showConfirmButton: false
        });
    }
}

// Hacer funciones disponibles globalmente
window.showInactiveAlertDetails = showInactiveAlertDetails;
window.closeAlertModal = closeAlertModal;
window.showDeactivateConfirmation = showDeactivateConfirmation;
window.changePageInactive = changePageInactive;
