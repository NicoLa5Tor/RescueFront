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
    //console.log('🚫 ALERTAS INACTIVAS: Página de alertas inactivas inicializada');
    
    // Inicializar sistema de cache
    initializeInactiveCacheSystem();
    
    // Configurar el modal manager (reutilizando modales existentes)
    if (window.modalManager) {
        window.modalManager.setupModal('alertDetailModal');
        //console.log('✅ Modal de alertas configurado para alertas inactivas');
    } else {
        //console.warn('⚠️ ModalManager no está disponible');
    }
    
    // Cargar alertas inactivas iniciales
    loadInactiveAlerts();
    
    // Verificar si debe abrir automáticamente una alerta específica
    setTimeout(() => {
        if (typeof window.checkForAutoOpenInactiveAlert === 'function') {
            window.checkForAutoOpenInactiveAlert();
        }
    }, 1500);
    
    //console.log('✅ ALERTAS INACTIVAS: Sistema completamente inicializado');
});

// ========== FUNCIONES PRINCIPALES DE ALERTAS INACTIVAS ==========
async function loadInactiveAlerts() {
    try {
        //console.log('🚫 INICIANDO CARGA DE ALERTAS INACTIVAS');
        showInactiveLoading(true);
        
        // Obtener empresa_id del usuario actual
        const empresaId = window.currentUser?.empresa_id || window.currentUser?.id;
        //console.log('👤 EmpresaId obtenido:', empresaId);
        
        if (!empresaId) {
            //console.error('❌ No se pudo obtener el ID de empresa');
            showNoInactiveAlerts();
            return;
        }
        
        // Inicializar cliente API si no existe
        if (!window.apiClient) {
            window.apiClient = new EndpointTestClient();
        }
        
        //console.log('🔗 Consultando alertas inactivas usando API client');
        
        // Calcular el offset como en las alertas activas
        const offset = (currentInactivePage - 1) * inactiveAlertsPerPage;
        
        // Llamar al endpoint de alertas inactivas usando el cliente API
        const response = await window.apiClient.get_inactive_alerts_by_empresa(
            empresaId, 
            inactiveAlertsPerPage, 
            offset
        );
        
        //console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            //console.error('❌ Response not ok:', response.status, response.statusText);
            throw new Error('Error al cargar alertas inactivas: ' + response.status);
        }
        
        const data = await response.json();
        //console.log('📊 DATA RECIBIDA (INACTIVAS):', data);
        
        if (data.success === true && data.data && Array.isArray(data.data) && data.data.length > 0) {
            ////console.log('✅ Data válida, procesando alertas inactivas...');
            
            const allInactiveAlerts = data.data;
            ////console.log(`📋 Total alertas inactivas en esta página: ${allInactiveAlerts.length}`);
            
            // Usar la información de paginación del backend - los datos vienen en data.pagination
            if (data.pagination) {
                totalInactivePages = data.pagination.total_pages || 1;
                ////console.log(`📄 Paginación: página ${currentInactivePage} de ${totalInactivePages}`);
                //console.log(`📊 Total alertas: ${data.pagination.total_items}, Página actual: ${data.pagination.current_page}`);
            } else {
                totalInactivePages = 1;
                //console.log('⚠️ No se recibió información de paginación del backend');
            }
            
            // Guardar alertas inactivas actuales
            currentInactiveAlerts = allInactiveAlerts;
            
            // Cache: Guardar alertas por ID
            cacheInactiveAlertsById(allInactiveAlerts);
            
            // Renderizar alertas inactivas
            renderInactiveAlerts(allInactiveAlerts);
            updateInactivePagination();
        } else {
            //console.log('⚠️ No hay alertas inactivas disponibles');
            currentInactiveAlerts = [];
            showNoInactiveAlerts();
        }
        
    } catch (error) {
        //console.error('💥 ERROR cargando alertas inactivas:', error);
        showNoInactiveAlerts();
        throw error;
        
    } finally {
        showInactiveLoading(false);
    }
}

function renderInactiveAlerts(alerts) {
    //console.log('🎨 RENDER INACTIVE ALERTS: Función renderInactiveAlerts llamada con:', alerts);
    
    const container = document.getElementById('inactiveAlertsContainer');
    const noAlertsMsg = document.getElementById('noInactiveAlertsMessage');
    
    if (!container) {
        //console.error('❌ Container inactiveAlertsContainer no encontrado');
        return;
    }
    
    if (!alerts || alerts.length === 0) {
        //console.log('🎨 RENDER INACTIVE ALERTS: No hay alertas inactivas, mostrando mensaje');
        container.innerHTML = '';
        if (noAlertsMsg) {
            noAlertsMsg.classList.remove('hidden');
        }
        return;
    }
    
    //console.log('🎨 RENDER INACTIVE ALERTS: Ocultando mensaje de no alertas');
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
        <div class="alert-card ios-hardware-card alert-priority-${alert.prioridad} alert-status-inactive" onclick="window.showInactiveAlertDetails('${alert._id}');">
            <div class="flex items-start space-x-4">
                <div class="flex-shrink-0">
                    <div class="w-16 h-16 rounded-xl flex items-center justify-center ${
                        isUserOrigin ? 'alert-origin-usuario' : 
                        isHardwareOrigin ? 'alert-origin-hardware' : 
                        isEmpresaOrigin ? 'alert-origin-empresa' : 'alert-origin-hardware'
                    } opacity-60">
                        <i class="fas fa-${
                            isUserOrigin ? 'user' : 
                            isHardwareOrigin ? 'microchip' : 
                            isEmpresaOrigin ? 'building' : 'microchip'
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
                            <span class="px-2 py-1 rounded-full text-xs font-medium bg-gray-500 text-white">
                                INACTIVA
                            </span>
                            <span class="px-2 py-1 rounded-full text-xs font-medium ${
                                isUserOrigin ? 'bg-purple-500' : 
                                isHardwareOrigin ? 'bg-blue-500' : 
                                isEmpresaOrigin ? 'bg-green-500' : 'bg-gray-500'
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
    
    //console.log('🎨 RENDER INACTIVE ALERTS: Inyectando HTML en container...');
    container.innerHTML = alertsHTML;
}

// ========== FUNCIONES DE CACHE PARA ALERTAS INACTIVAS ==========
function initializeInactiveCacheSystem() {
    //console.log('💾 CACHE INACTIVO: Inicializando sistema de cache para alertas inactivas...');
    inactiveAlertsCache.clear();
    inactiveCacheMetadata = {
        lastUpdate: new Date(),
        totalCachedAlerts: 0,
        cacheHits: 0,
        cacheMisses: 0
    };
    //console.log('✅ CACHE INACTIVO: Sistema de cache inicializado');
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
        //console.log(`💾 CACHE INACTIVO: ${newCacheCount} nuevas alertas inactivas guardadas en cache. Total: ${inactiveCacheMetadata.totalCachedAlerts}`);
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
        //console.log('🔍 CACHE INACTIVO: Buscando alerta inactiva por ID:', alertId);
        
        const cachedAlert = getInactiveAlertById(alertId);
        if (cachedAlert && cachedAlert.is_full_data) {
            //console.log('✅ CACHE HIT: Datos completos encontrados en cache');
            return cachedAlert;
        }
        
        //console.log('📡 Haciendo petición al backend para alerta específica:', alertId);
        const response = await fetch(`/proxy/api/mqtt-alerts/${alertId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        
        if (!response.ok) {
            //console.error(`❌ Error en petición: ${response.status} ${response.statusText}`);
            return null;
        }
        
        const data = await response.json();
        //console.log('📊 DATA COMPLETA DE ALERTA INACTIVA:', data);
        
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
                mensaje_desactivacion: data.alert.mensaje_desactivacion,
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
            
            //console.log('🔍 DEBUG ALERTA INACTIVA COMPLETA:', fullAlertData);
            //console.log('🔍 DEBUG DESACTIVADO POR:', fullAlertData.desactivado_por);
            
            inactiveAlertsCache.set(alertId, fullAlertData);
            return fullAlertData;
        }
        
        return null;
        
    } catch (error) {
        //console.error(`💥 Error buscando alerta inactiva ${alertId}:`, error);
        return null;
    }
}

// Enrich alert object with human-readable deactivator name
async function enrichDeactivatorInfo(alert) {
    try {
        if (!alert?.desactivado_por || alert.desactivado_por.nombre || !alert.desactivado_por.id) {
            return;
        }

        if (!window.apiClient) {
            window.apiClient = new EndpointTestClient();
        }

        const tipo = alert.desactivado_por.tipo;
        if (tipo === 'usuario') {
            let nombre = null;

            const empresaId = alert.empresa_id || window.currentUser?.empresa_id || window.currentUser?.id;
            if (empresaId) {
                const resp = await window.apiClient.get_usuario(empresaId, alert.desactivado_por.id);
                if (resp.ok) {
                    const result = await resp.json();
                    nombre = result.data?.nombre;
                }
            }

            if (!nombre && Array.isArray(alert.numeros_telefonicos)) {
                const contact = alert.numeros_telefonicos.find(c => c.usuario_id === alert.desactivado_por.id);
                if (contact?.nombre) {
                    nombre = contact.nombre;
                }
            }

            if (nombre) {
                alert.desactivado_por.nombre = nombre;
            }
        } else if (tipo === 'empresa') {
            let nombre = null;

            const resp = await window.apiClient.get_empresa(alert.desactivado_por.id);
            if (resp.ok) {
                const result = await resp.json();
                nombre = result.data?.nombre;
            }

            if (!nombre && alert.empresa_nombre) {
                nombre = alert.empresa_nombre;
            }

            if (nombre) {
                alert.desactivado_por.nombre = nombre;
            }
        }
    } catch (err) {
        //console.error('Error obteniendo nombre del desactivador:', err);
    }
}

// ========== FUNCIONES DE MODAL PARA ALERTAS INACTIVAS ==========
async function showInactiveAlertDetails(alertId) {
    //console.log('🔍 Intentando mostrar detalles de alerta inactiva:', alertId);

    const alert = await findInactiveAlertById(alertId);
    if (!alert) {
        //console.warn('❌ No se encontró la alerta inactiva con ID:', alertId);
        showSimpleNotification('No se pudo cargar la información de esta alerta inactiva', 'error');
        return;
    }

    await enrichDeactivatorInfo(alert);
    inactiveAlertsCache.set(alertId, alert);

    //console.log('✅ Alerta inactiva encontrada:', alert);
    selectedInactiveAlertId = alertId;
    
    const modal = document.getElementById('alertDetailModal');
    if (!modal) {
        //console.error('❌ Modal alertDetailModal no encontrado en DOM');
        return;
    }
    
    if (window.modalManager && window.modalManager.isModalOpen('alertDetailModal')) {
        //console.log('🔄 Modal ya abierto, cerrándolo primero...');
        window.modalManager.closeModal('alertDetailModal');
        setTimeout(() => showInactiveAlertDetails(alertId), 100);
        return;
    }
    
    // Poblar el modal con los detalles (reutilizando función existente)
    const content = document.getElementById('alertDetailsContent');
    const subtitle = document.getElementById('modalAlertSubtitle');
    const toggleBtn = document.getElementById('toggleStatusBtn');
    
    if (!content || !subtitle || !toggleBtn) {
        //console.error('❌ Elementos del modal no encontrados');
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
    
    // Para alertas inactivas, ocultar el botón de reactivar
    toggleBtn.style.display = 'none';
    
    // Abrir modal
    setTimeout(() => {
        window.modalManager.openModal('alertDetailModal');
        //console.log('✅ Modal de alerta inactiva abierto correctamente');
    }, 50);
}
function generateInactiveModalContent(alert, isUserOrigin, isHardwareOrigin) {
    //console.log('🔍 GENERANDO MODAL PARA ALERTA INACTIVA:', alert);
    
    return `
        <!-- GRILLA 1: HEADER DE ALERTA INACTIVA -->
        <div class="mb-6 p-4 rounded-xl ${
            isUserOrigin ? 'bg-gradient-to-r from-purple-600 to-indigo-700' : 
            isHardwareOrigin ? 'bg-gradient-to-r from-blue-600 to-cyan-700' : 
            'bg-gradient-to-r from-gray-600 to-gray-700'
        }">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <i class="fas fa-power-off text-white text-lg"></i>
                    </div>
                    <div>
                        <h3 class="text-white font-bold text-lg">🚫 Alerta Inactiva</h3>
                        <p class="text-white/80 text-sm">Esta alerta ha sido desactivada</p>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2">
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${getPriorityClass(alert.prioridad)}">
                        ${alert.prioridad.toUpperCase()}
                    </span>
                </div>
            </div>
        </div>

        <!-- GRILLA 2: INFORMACIÓN DE DESACTIVACIÓN -->
        <div class="mb-6">
            <div class="modal-section bg-red-600/10 border border-red-500/20 rounded-xl p-4">
                <h4 class="text-red-300 font-semibold mb-4 flex items-center">
                    <i class="fas fa-power-off mr-2"></i>Información de Desactivación
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-black/20 rounded-lg p-3">
                        <span class="text-red-200 text-sm block mb-1">Fecha de Desactivación:</span>
                        <span class="text-white font-medium">${alert.fecha_desactivacion ? formatDate(alert.fecha_desactivacion) : 'No disponible'}</span>
                        ${alert.desactivado_por?.fecha_desactivacion ? `
                            <p class="text-red-300 text-xs mt-1 font-mono">${new Date(alert.desactivado_por.fecha_desactivacion).toLocaleString()}</p>
                        ` : ''}
                    </div>
                    <div class="bg-black/20 rounded-lg p-3">
                        <span class="text-red-200 text-sm block mb-1">Desactivado por:</span>
                        ${(() => {
                            if (alert.desactivado_por?.tipo) {
                                const tipo = alert.desactivado_por.tipo;
                                const isEmpresa = tipo === 'empresa';
                                const isUsuario = tipo === 'usuario';

                                return `
                                    <div class="flex items-center space-x-2">
                                        <div class="w-6 h-6 ${isEmpresa ? 'bg-blue-500' : isUsuario ? 'bg-purple-500' : 'bg-gray-500'} rounded-full flex items-center justify-center">
                                            <i class="fas fa-${isEmpresa ? 'building' : isUsuario ? 'user' : 'cog'} text-white text-xs"></i>
                                        </div>
                                        <div>
                                            <span class="text-white font-medium capitalize">${tipo}</span>
                                            ${alert.desactivado_por.nombre ? `
                                                <p class="text-red-200 text-xs">${alert.desactivado_por.nombre}</p>
                                            ` : ''}
                                            ${alert.desactivado_por.id ? `
                                                <p class="text-red-300 text-xs font-mono">ID: ${alert.desactivado_por.id}</p>
                                            ` : ''}
                                        </div>
                                    </div>
                                `;
                            } else {
                                return '<span class="text-white font-medium">Sistema</span>';
                            }
                        })()}
                    </div>
                    <div class="bg-black/20 rounded-lg p-3">
                        <span class="text-red-200 text-sm block mb-1">Estado Actual:</span>
                        <div class="flex items-center">
                            <span class="w-2 h-2 rounded-full bg-red-400 mr-2"></span>
                            <span class="text-red-300 font-medium">INACTIVA</span>
                        </div>
                        <div class="mt-2">
                            <span class="inline-flex items-center px-2 py-1 bg-red-600/30 text-red-200 text-xs rounded-full">
                                <i class="fas fa-clock mr-1"></i>
                                Desactivada ${alert.fecha_desactivacion ? formatDate(alert.fecha_desactivacion) : ''}
                            </span>
                        </div>
                    </div>
                </div>
                
                <!-- Información adicional de desactivación si existe -->
                ${alert.desactivado_por?.tipo ? `
                    <div class="mt-4 p-3 bg-red-900/20 border border-red-500/10 rounded-lg">
                        <div class="flex items-start space-x-3">
                            <div class="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-info-circle text-red-300 text-sm"></i>
                            </div>
                            <div class="flex-1">
                                <h5 class="text-red-200 font-medium text-sm mb-1">Detalles de Desactivación</h5>
                                <p class="text-red-300 text-xs leading-relaxed">
                                    Esta alerta fue desactivada por <strong>${alert.desactivado_por.tipo === 'empresa' ? 'la empresa' : alert.desactivado_por.tipo === 'usuario' ? 'un usuario' : 'el sistema'}</strong>
                                    ${alert.fecha_desactivacion ? ` el ${new Date(alert.fecha_desactivacion).toLocaleDateString()} a las ${new Date(alert.fecha_desactivacion).toLocaleTimeString()}` : ''}.
                                    ${alert.desactivado_por.tipo === 'empresa' ? ' La desactivación fue realizada desde el panel de administración de la empresa.' : 
                                      alert.desactivado_por.tipo === 'usuario' ? ' Un usuario autorizado desactivó manualmente esta alerta.' : 
                                      ' La alerta fue desactivada automáticamente por el sistema.'}
                                </p>
                                ${alert.mensaje_desactivacion && alert.mensaje_desactivacion.trim() !== '' ? `
                                    <div class="mt-3 p-2 bg-red-800/20 border border-red-400/20 rounded-md">
                                        <h6 class="text-red-200 font-medium text-xs mb-1 flex items-center">
                                            <i class="fas fa-comment-alt mr-1"></i>Mensaje de desactivación:
                                        </h6>
                                        <p class="text-red-100 text-xs leading-relaxed italic">"${alert.mensaje_desactivacion}"</p>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>

        <!-- GRILLA 3: PRINCIPAL (3 COLUMNAS) -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            
            <!-- Columna 1: Imagen/Tipo -->
            <div class="modal-section ${
                isUserOrigin ? 'bg-gradient-to-br from-purple-500 to-pink-600' : 
                isHardwareOrigin ? 'bg-gradient-to-br from-blue-500 to-cyan-600' : 
                'bg-gradient-to-br from-gray-500 to-gray-600'
            } rounded-xl p-4 text-center">
                ${alert.image_alert ? `
                    <img src="${alert.image_alert}" alt="${alert.nombre_alerta}" 
                         class="w-1/2 sm:w-2/5 lg:w-1/3 xl:w-1/4 max-w-xs max-h-32 object-contain rounded-lg mb-3 border-2 border-white/20 mx-auto"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                ` : `
                    <div class="w-16 h-16 bg-gradient-to-br ${
                        isUserOrigin ? 'from-purple-400 to-pink-500' : 
                        isHardwareOrigin ? 'from-blue-400 to-cyan-500' : 
                        'from-gray-400 to-gray-500'
                    } rounded-full mx-auto mb-3 flex items-center justify-center">
                        <i class="fas fa-${isUserOrigin ? 'user-shield' : isHardwareOrigin ? 'microchip' : 'exclamation-triangle'} text-white text-2xl"></i>
                    </div>
                `}
                <h3 class="text-lg font-bold text-white">${alert.nombre_alerta || 'Alerta'}</h3>
                ${alert.tipo_alerta ? `
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold" 
                         style="background-color: ${getAlertTypeColor(alert.tipo_alerta)}40; color: ${getAlertTypeColor(alert.tipo_alerta)};">
                        ${alert.tipo_alerta}
                    </span>
                ` : ''}
            </div>

            <!-- Columna 2: Info básica -->
            <div class="modal-section bg-white/5 rounded-xl p-4">
                <h4 class="text-white font-semibold mb-4">
                    <i class="fas fa-info-circle mr-2"></i>Información
                </h4>
                <div class="space-y-3 text-sm">
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
                    <div class="flex justify-between">
                        <span class="text-gray-400">Prioridad:</span>
                        <span class="px-2 py-1 rounded-full text-xs font-bold ${getPriorityClass(alert.prioridad)}">
                            ${alert.prioridad.toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Columna 3: Origen -->
            <div class="modal-section ${
                isUserOrigin ? 'bg-gradient-to-br from-purple-600 to-indigo-700' : 
                isHardwareOrigin ? 'bg-gradient-to-br from-blue-600 to-cyan-700' : 
                'bg-gradient-to-br from-gray-600 to-gray-700'
            } rounded-xl p-4">
                <div class="flex items-center mb-3">
                    <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                        <i class="fas fa-${isUserOrigin ? 'user-shield' : isHardwareOrigin ? 'microchip' : 'question-circle'} text-white"></i>
                    </div>
                    <h4 class="text-white font-bold">
                        ${isUserOrigin ? 'Usuario Origen' : isHardwareOrigin ? 'Hardware Origen' : 'Sistema'}
                    </h4>
                </div>
                <div class="space-y-2 text-sm">
                    <div class="bg-black/20 rounded-lg p-3">
                        <p class="text-white font-medium">${alert.activacion_alerta?.nombre || alert.hardware_nombre || 'No especificado'}</p>
                        ${alert.activacion_alerta?.id || alert.data?.id_origen ? `
                            <code class="text-white/80 font-mono text-xs">${alert.activacion_alerta?.id || alert.data?.id_origen}</code>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>

        <!-- Ubicación: Ancho completo -->
        <div class="modal-section bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl p-6 mb-6">
            <h4 class="text-xl font-bold text-white mb-4 flex items-center">
                <i class="fas fa-map-marker-alt mr-3"></i>Ubicación Completa
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div class="bg-white/10 rounded-lg p-3">
                    <span class="text-indigo-200 text-sm block mb-1">Empresa:</span>
                    <span class="text-white font-medium">${alert.empresa_nombre}</span>
                </div>
                <div class="bg-white/10 rounded-lg p-3">
                    <span class="text-indigo-200 text-sm block mb-1">Sede:</span>
                    <span class="text-white font-medium">${alert.sede}</span>
                </div>
                ${alert.ubicacion || alert.data?.botonera_ubicacion ? `
                    <div class="bg-white/10 rounded-lg p-3">
                        <span class="text-indigo-200 text-sm block mb-1">Ubicación Específica:</span>
                        <span class="text-white font-medium text-sm">${alert.data?.botonera_ubicacion?.direccion || alert.ubicacion?.direccion || 'No especificada'}</span>
                    </div>
                    <div class="bg-white/10 rounded-lg p-3">
                        <span class="text-indigo-200 text-sm block mb-1">Hardware Asociado:</span>
                        <span class="text-white font-medium text-sm">${alert.data?.botonera_ubicacion?.hardware_nombre || alert.ubicacion?.hardware_nombre || alert.hardware_nombre || 'No especificado'}</span>
                    </div>
                ` : `
                    <div class="md:col-span-2 bg-white/10 rounded-lg p-3 flex items-center justify-center">
                        <span class="text-indigo-200 text-sm">Sin ubicación específica disponible</span>
                    </div>
                `}
            </div>
            ${generateLocationContent(alert)}
        </div>

        <!-- Grid inferior: 2 columnas -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            
            <!-- Descripción -->
            <div class="space-y-4">
                ${alert.data?.tipo_alarma_info?.descripcion ? `
                    <div class="modal-section bg-orange-600/10 border border-orange-500/20 rounded-xl p-4">
                        <h4 class="text-orange-300 font-semibold mb-3 flex items-center">
                            <i class="fas fa-info-circle mr-2"></i>Descripción
                        </h4>
                        <p class="text-orange-200 text-sm leading-relaxed">${alert.data.tipo_alarma_info.descripcion}</p>
                    </div>
                ` : ''}
                
                ${alert.topic ? `
                    <div class="modal-section bg-teal-600/10 border border-teal-500/20 rounded-xl p-4">
                        <h4 class="text-teal-300 font-semibold mb-3 flex items-center">
                            <i class="fas fa-code-branch mr-2"></i>Topic MQTT
                        </h4>
                        <code class="text-teal-100 font-mono text-sm bg-black/20 px-3 py-2 rounded-lg block break-all">${alert.topic}</code>
                        <p class="text-teal-200 text-xs mt-2">Empresa/Sede/Tipo/Hardware</p>
                    </div>
                ` : ''}
            </div>

            <!-- Hardware relacionado -->
            <div class="modal-section bg-slate-700/20 border border-slate-500/20 rounded-xl p-4">
                <h4 class="text-slate-300 font-semibold mb-3 flex items-center justify-between">
                    <span><i class="fas fa-network-wired mr-2"></i>Hardware Relacionado</span>
                    ${(() => {
                        const topics = alert.topics_otros_hardware || alert.data?.topics_otros_hardware || [];
                        return topics.length > 0 ? `<span class="bg-slate-600 text-white px-2 py-1 rounded-full text-xs">${topics.length}</span>` : '';
                    })()}
                </h4>
                ${(() => {
                    const topics = alert.topics_otros_hardware || alert.data?.topics_otros_hardware || [];
                    if (topics.length > 0) {
                        return `
                            <div class="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                ${topics.slice(0, 5).map(topic => `
                                    <div class="bg-black/20 rounded-lg p-2">
                                        <code class="text-slate-200 font-mono text-xs break-all">${topic}</code>
                                    </div>
                                `).join('')}
                                ${topics.length > 5 ? `
                                    <div class="text-center text-slate-400 text-xs pt-2 border-t border-slate-600/30">
                                        +${topics.length - 5} elementos más
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }
                    return `
                        <div class="text-center py-8">
                            <i class="fas fa-server text-gray-400 text-3xl mb-3"></i>
                            <p class="text-gray-300 text-sm font-medium">Sin hardware relacionado</p>
                            <p class="text-gray-500 text-xs mt-1">No hay topics MQTT vinculados</p>
                        </div>
                    `;
                })()}
            </div>
        </div>

        <!-- Contactos: Grid responsivo -->
        ${alert.numeros_telefonicos?.length > 0 ? `
            <div class="modal-section bg-teal-600/10 border border-teal-500/20 rounded-xl p-6">
                <h4 class="text-teal-300 font-semibold mb-4 flex items-center justify-between">
                    <span><i class="fas fa-phone mr-2"></i>Contactos Notificados</span>
                    <span class="bg-teal-600 text-white px-3 py-1 rounded-full text-sm">${alert.numeros_telefonicos.length}</span>
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    ${alert.numeros_telefonicos.map(contacto => `
                        <div class="bg-white/5 border border-teal-500/10 rounded-lg p-4 flex items-center space-x-3">
                            <div class="w-10 h-10 ${contacto.disponible ? 'bg-teal-500' : 'bg-red-500'} rounded-full flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-user text-white"></i>
                            </div>
                            <div class="min-w-0 flex-1">
                                <p class="text-white font-medium truncate">${contacto.nombre}</p>
                                <p class="text-teal-200 text-sm">${contacto.numero}</p>
                                <div class="flex items-center space-x-2 mt-1">
                                    <span class="w-2 h-2 rounded-full ${contacto.disponible ? 'bg-green-400' : 'bg-red-400'}"></span>
                                    <span class="text-xs ${contacto.disponible ? 'text-green-300' : 'text-red-300'}">
                                        ${contacto.disponible ? 'Disponible' : 'No disponible'}
                                    </span>
                                </div>
                                ${(() => {
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

        <!-- Recomendaciones e Implementos -->
        ${alert.data?.tipo_alarma_info?.recomendaciones || alert.data?.tipo_alarma_info?.implementos_necesarios ? `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                ${alert.data.tipo_alarma_info.recomendaciones?.length > 0 ? `
                    <div class="modal-section bg-green-600/10 border border-green-500/20 rounded-xl p-4">
                        <h4 class="text-green-300 font-semibold mb-3 flex items-center">
                            <i class="fas fa-lightbulb mr-2"></i>Recomendaciones
                        </h4>
                        <ul class="space-y-2">
                            ${alert.data.tipo_alarma_info.recomendaciones.map(rec => `
                                <li class="flex items-start text-green-100">
                                    <i class="fas fa-check-circle text-green-400 mr-2 mt-0.5 flex-shrink-0"></i>
                                    <span class="text-sm">${rec}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${alert.data.tipo_alarma_info.implementos_necesarios?.length > 0 ? `
                    <div class="modal-section bg-cyan-600/10 border border-cyan-500/20 rounded-xl p-4">
                        <h4 class="text-cyan-300 font-semibold mb-3 flex items-center">
                            <i class="fas fa-tools mr-2"></i>Implementos Necesarios
                        </h4>
                        <ul class="space-y-2">
                            ${alert.data.tipo_alarma_info.implementos_necesarios.map(impl => `
                                <li class="flex items-start text-cyan-100">
                                    <i class="fas fa-wrench text-cyan-400 mr-2 mt-0.5 flex-shrink-0"></i>
                                    <span class="text-sm">${impl}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        ` : ''}
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
        //console.warn('⚠️ Elementos de paginación no encontrados');
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
    //console.log('✅ Modal de alerta cerrado');
}

function showDeactivateConfirmation() {
    //console.log('🚫 Esta función no está disponible para alertas inactivas');
    showSimpleNotification('Esta función no está disponible para alertas inactivas', 'info');
}

// ========== FUNCIONES AUXILIARES PARA MODAL ==========
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
    }
    return '';
}

function generateContactsContent(alert) {
    if (!alert.numeros_telefonicos || alert.numeros_telefonicos.length === 0) {
        return '';
    }
    
    return `
        <div class="modal-section bg-teal-600/5 rounded-lg p-4">
            <h4 class="text-teal-300 font-semibold mb-3">
                <i class="fas fa-phone mr-2"></i>Contactos Notificados (${alert.numeros_telefonicos.length})
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto custom-scrollbar">
                ${alert.numeros_telefonicos.map(contacto => `
                    <div class="bg-black/20 rounded-lg p-3 flex items-center space-x-3">
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
    `;
}

// ========== FUNCIONES AUXILIARES ADICIONALES ==========
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
            
            <!-- Mapa embebido -->
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


// ========== FUNCIÓN PARA APERTURA AUTOMÁTICA DE MODAL ==========
/**
 * Verifica si debe abrir automáticamente el modal de una alerta inactiva
 * Esto se activa cuando se llega desde el sistema global de alertas
 */
function checkForAutoOpenInactiveAlert() {
    // Obtener ID de alerta almacenado para apertura automática
    const openAlertId = sessionStorage.getItem("openAlertId");

    if (openAlertId) {
        // Limpiar la variable de sesión para evitar reaperturas
        sessionStorage.removeItem("openAlertId");

        // Esperar a que las alertas se carguen antes de abrir
        setTimeout(async () => {
            const alert = await findInactiveAlertById(openAlertId);
            if (alert) {
                showInactiveAlertDetails(openAlertId);
            } else if (typeof window.showSimpleNotification === "function") {
                // Notificar si la alerta no se pudo cargar
                window.showSimpleNotification("La alerta seleccionada no se pudo cargar", "warning");
            }
        }, 1500);
    }
}

// Hacer funciones disponibles globalmente
window.showInactiveAlertDetails = showInactiveAlertDetails;
window.closeAlertModal = closeAlertModal;
window.showDeactivateConfirmation = showDeactivateConfirmation;
window.changePageInactive = changePageInactive;
window.checkForAutoOpenInactiveAlert = checkForAutoOpenInactiveAlert;
