
// Variables globales para la creación de alertas
let empresaData = null;
let createModalManager = null;
let alertTypesCache = [];
let alertTypesLoading = false;
let alertasCreateInitialized = false;

const initAlertasCreate = () => {
    if (alertasCreateInitialized) return;
    alertasCreateInitialized = true;

    ////console.log('🚨 Inicializando sistema de creación de alertas...');
    
    // Configurar modal manager
    if (window.modalManager) {
        createModalManager = window.modalManager;
        createModalManager.setupModal('createAlertModal');
    }
    
    // Cargar datos de la empresa
    loadEmpresaDataForAlert();

    // Cargar tipos de alerta disponibles para la empresa
    loadAlertTypesForAlert(true);
    
    // Configurar event listeners
    setupCreateAlertEventListeners();
    
    //console.log('✅ Sistema de creación de alertas inicializado');
};

(() => {
    const viewName = 'alertas';
    const mount = () => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAlertasCreate, { once: true });
            return;
        }
        initAlertasCreate();
    };
    const unmount = () => {};

    window.EmpresaSpaViews = window.EmpresaSpaViews || {};
    const existing = window.EmpresaSpaViews[viewName];
    if (Array.isArray(existing)) {
        existing.push({ mount, unmount });
    } else if (existing) {
        window.EmpresaSpaViews[viewName] = [existing, { mount, unmount }];
    } else {
        window.EmpresaSpaViews[viewName] = [{ mount, unmount }];
    }

    if (!window.EMPRESA_SPA_MANUAL_INIT) {
        mount();
    }
})();


function showCreateAlertModal() {
    //console.log('📝 Abriendo modal de crear alerta...');
    
    // Resetear formulario
    resetCreateAlertForm();

    // Cargar datos frescos de la empresa
    loadEmpresaDataForAlert();

    // Garantizar que el listado de tipos esté actualizado
    loadAlertTypesForAlert();
    
    // Mostrar modal
    if (createModalManager) {
        createModalManager.openModal('createAlertModal');
    } else {
        // Fallback
        const modal = document.getElementById('createAlertModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }
    
    // Actualizar fecha
    updateAlertDateTime();
    
    //console.log('✅ Modal de crear alerta abierto');
}

/**
 * Cerrar modal de crear alerta
 */
function closeCreateAlertModal() {
    //console.log('❌ Cerrando modal de crear alerta...');
    
    if (createModalManager) {
        createModalManager.closeModal('createAlertModal');
    } else {
        // Fallback
        const modal = document.getElementById('createAlertModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    // Resetear formulario después de cerrar
    setTimeout(() => {
        resetCreateAlertForm();
    }, 300);
}

/**
 * Resetear el formulario de crear alerta
 */
function resetCreateAlertForm() {
    const form = document.getElementById('createAlertForm');
    if (form) {
        form.reset();
    }
    
    // Resetear contadores de caracteres
    const charCounter = document.getElementById('createAlertCharCounter');
    if (charCounter) {
        charCounter.textContent = '0/500';
    }
    
    const direccionCharCounter = document.getElementById('direccionCharCounter');
    if (direccionCharCounter) {
        direccionCharCounter.textContent = '0/200';
    }
    
    // Resetear botón de submit
    const submitBtn = document.getElementById('createAlertSubmitBtn');
    const submitText = document.getElementById('createAlertSubmitText');
    if (submitBtn && submitText) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitText.textContent = 'Crear Alerta';
    }
}

// ========== CARGA DE DATOS ==========

/**
 * Cargar datos de la empresa para el formulario
 */
async function loadEmpresaDataForAlert() {
    try {
        //console.log('🏢 Cargando datos de empresa para alerta...');
        
        // Obtener empresa actual desde el contexto global
        const empresaId = window.currentUser?.empresa_id || window.currentUser?.id;
        const empresaUsername = window.currentUser?.username;
        
        if (!empresaId) {
            //console.error('❌ No se pudo obtener ID de empresa');
            return;
        }
        
        // Actualizar información en el modal
        const alertEmpresaInfo = document.getElementById('alertEmpresaInfo');
        if (alertEmpresaInfo) {
            alertEmpresaInfo.textContent = empresaUsername || 'Empresa actual';
        }
        
        // Si ya tenemos datos de empresa cached, usarlos
        if (empresaData && empresaData._id === empresaId) {
            populateSedesDropdown(empresaData.sedes);
            return;
        }
        
        // Cargar datos de la empresa desde API
        if (window.apiClient) {
            try {
                const response = await window.apiClient.get_empresa(empresaId);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                        empresaData = data.data;
                        populateSedesDropdown(empresaData.sedes);
                        //console.log('✅ Datos de empresa cargados:', empresaData);
                    }
                }
            } catch (apiError) {
                //console.error('❌ Error cargando datos de empresa:', apiError);
                // Fallback: sedes por defecto
                populateSedesDropdown(['Principal']);
            }
        } else {
            // Fallback si no hay API client
            populateSedesDropdown(['Principal']);
        }
        
    } catch (error) {
        //console.error('💥 Error cargando datos de empresa:', error);
        // Fallback
        populateSedesDropdown(['Principal']);
    }
}

/**
 * Poblar dropdown de sedes
 */
function populateSedesDropdown(sedes) {
    const sedeSelect = document.getElementById('sedeAlerta');
    if (!sedeSelect) return;
    
    // Limpiar opciones existentes (excepto la primera)
    while (sedeSelect.children.length > 1) {
        sedeSelect.removeChild(sedeSelect.lastChild);
    }
    
    // Agregar sedes
    if (sedes && Array.isArray(sedes) && sedes.length > 0) {
        sedes.forEach(sede => {
            const option = document.createElement('option');
            option.value = sede;
            option.textContent = sede;
            sedeSelect.appendChild(option);
        });
        //console.log(`✅ ${sedes.length} sedes cargadas en dropdown`);
    } else {
        // Agregar sede por defecto si no hay sedes
        const option = document.createElement('option');
        option.value = 'Principal';
        option.textContent = 'Principal';
        sedeSelect.appendChild(option);
        //console.log('⚠️ No hay sedes definidas, usando "Principal" por defecto');
    }
}

// ========== TIPOS DE ALERTA ==========

async function loadAlertTypesForAlert(forceReload = false) {
    if (alertTypesLoading) {
        return;
    }

    const { select, helper } = getAlertTypeSelectElements();
    if (!select) {
        return;
    }

    const empresaId = window.currentUser?.empresa_id || window.currentUser?.id;
    if (!empresaId) {
        populateAlertTypesDropdown([]);
        return;
    }

    if (alertTypesCache.length > 0 && !forceReload) {
        populateAlertTypesDropdown(alertTypesCache);
        return;
    }

    const apiClient = window.apiClient || (window.EndpointTestClient ? new window.EndpointTestClient() : null);
    if (!apiClient || typeof apiClient.get_alert_types_for_empresa !== 'function') {
        handleAlertTypesError(new Error('Cliente API no disponible para tipos de alerta por empresa'));
        populateAlertTypesDropdown([]);
        return;
    }

    alertTypesLoading = true;
    setAlertTypeSelectLoading(true);

    try {
        const response = await apiClient.get_alert_types_for_empresa(empresaId, { soloActivos: true });
        if (!response || !response.ok) {
            const statusText = response ? `${response.status} ${response.statusText}` : 'sin respuesta';
            throw new Error(`Error al obtener tipos de alerta activos (${statusText})`);
        }

        const payload = await response.json().catch(() => ({}));
        const normalizedTypes = normalizeEmpresaAlertTypesPayload(payload, empresaId);

        alertTypesCache = normalizedTypes;
        populateAlertTypesDropdown(alertTypesCache);

        if (!alertTypesCache.length) {
            handleAlertTypesError(new Error('No se encontraron tipos de alerta activos'));
        }
    } catch (error) {
        console.error('Error cargando tipos de alerta activos para empresa:', error);
        alertTypesCache = [];
        populateAlertTypesDropdown([]);
        handleAlertTypesError(error);
    } finally {
        alertTypesLoading = false;
        setAlertTypeSelectLoading(false);
    }
}

function populateAlertTypesDropdown(types) {
    const { select, helper } = getAlertTypeSelectElements();
    if (!select) {
        return;
    }

    while (select.options.length > 1) {
        select.remove(1);
    }

    if (!types || types.length === 0) {
        if (helper) {
            helper.classList.remove('hidden');
        }
        select.disabled = true;
        return;
    }

    const normalizedTypes = [...types]
        .map((type) => normalizeSingleAlertType(type))
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));

    if (normalizedTypes.length === 0) {
        if (helper) {
            helper.classList.remove('hidden');
        }
        select.disabled = true;
        return;
    }

    normalizedTypes.forEach((type) => {
        const option = document.createElement('option');
        option.value = type.id || '';
        const isGlobal = !(type.empresaId || '').trim();
        const baseLabel = type.code ? `${type.name} (${type.code})` : type.name;
        option.textContent = isGlobal ? `${baseLabel} · Global` : baseLabel;
        option.dataset.typeId = type.id;
        option.dataset.typeName = type.name;
        option.dataset.typeCode = type.code || '';
        option.dataset.typeSeverity = type.severity || '';
        option.dataset.typeColor = type.color || '';
        option.dataset.typeEmpresaId = type.empresaId || '';
        option.dataset.typeEmpresaNombre = type.empresaNombre || '';
        option.dataset.typeDescription = type.description || '';
        option.dataset.typeScope = isGlobal ? 'global' : 'empresa';

        select.appendChild(option);
    });

    if (helper) {
        helper.classList.add('hidden');
    }

    select.disabled = false;
    select.value = '';
}

function setAlertTypeSelectLoading(loading) {
    const { select } = getAlertTypeSelectElements();
    if (!select) {
        return;
    }

    const placeholder = select.querySelector('option[value=""]');
    if (placeholder) {
        placeholder.textContent = loading ? 'Cargando tipos de alerta...' : 'Seleccionar tipo de alerta...';
    }

    if (loading) {
        select.disabled = true;
    } else if (alertTypesCache.length > 0) {
        select.disabled = false;
    }
}

function handleAlertTypesError(error) {
    if (error) {
        console.warn('Tipos de alerta: using fallback state', error);
    }
    const { helper } = getAlertTypeSelectElements();
    if (helper) {
        helper.classList.remove('hidden');
    }

    if (typeof showSimpleNotification === 'function') {
        showSimpleNotification('No pudimos cargar los tipos de alerta activos. Intenta nuevamente.', 'warning', 6000);
    }
}

function getAlertTypeSelectElements() {
    return {
        select: document.getElementById('tipoAlerta'),
        helper: document.getElementById('tipoAlertaHelper')
    };
}

function getSelectedAlertTypeInfo() {
    const { select } = getAlertTypeSelectElements();
    if (!select) {
        return {};
    }

    const option = select.selectedOptions && select.selectedOptions[0];
    if (!option) {
        return {};
    }

    return {
        id: (option.dataset.typeId || '').trim(),
        code: (option.dataset.typeCode || '').trim(),
        name: (option.dataset.typeName || '').trim(),
        color: (option.dataset.typeColor || '').trim(),
        severity: (option.dataset.typeSeverity || '').trim(),
        description: (option.dataset.typeDescription || '').trim(),
        empresaId: (option.dataset.typeEmpresaId || '').trim(),
        empresaNombre: (option.dataset.typeEmpresaNombre || '').trim()
    };
}

/**
 * Actualizar fecha y hora actual
 */
function updateAlertDateTime() {
    const alertFechaInfo = document.getElementById('alertFechaInfo');
    if (alertFechaInfo) {
        const now = new Date();
        alertFechaInfo.textContent = formatDateTimeForUser(now.toISOString());
    }
}

// ========== EVENT LISTENERS ==========

/**
 * Configurar event listeners del formulario
 */
function setupCreateAlertEventListeners() {
    // Contador de caracteres para descripción
    const descripcionTextarea = document.getElementById('descripcionAlerta');
    const charCounter = document.getElementById('createAlertCharCounter');
    
    if (descripcionTextarea && charCounter) {
        descripcionTextarea.addEventListener('input', function() {
            const length = this.value.length;
            charCounter.textContent = `${length}/500`;
            
            // Cambiar color según proximidad al límite
            if (length > 450) {
                charCounter.style.color = '#ef4444'; // Rojo
            } else if (length > 350) {
                charCounter.style.color = '#f59e0b'; // Amarillo
            } else {
                charCounter.style.color = ''; // Por defecto
            }
        });
    }
    
    // Contador de caracteres para dirección
    const direccionInput = document.getElementById('direccionAlerta');
    const direccionCharCounter = document.getElementById('direccionCharCounter');
    
    if (direccionInput && direccionCharCounter) {
        direccionInput.addEventListener('input', function() {
            const length = this.value.length;
            direccionCharCounter.textContent = `${length}/200`;
            
            // Cambiar color según proximidad al límite
            if (length > 180) {
                direccionCharCounter.style.color = '#ef4444'; // Rojo
            } else if (length > 150) {
                direccionCharCounter.style.color = '#f59e0b'; // Amarillo
            } else {
                direccionCharCounter.style.color = ''; // Por defecto
            }
        });
    }
    
    // Submit del formulario
    const form = document.getElementById('createAlertForm');
    if (form) {
        form.addEventListener('submit', handleCreateAlertSubmit);
    }
}

// ========== ENVÍO DE FORMULARIO ==========

/**
 * Manejar envío del formulario de crear alerta
 */
async function handleCreateAlertSubmit(event) {
    event.preventDefault();
    
    //console.log('📤 Enviando formulario de crear alerta...');
    
    try {
        // Obtener datos del formulario
        const formData = getCreateAlertFormData();
        
        // Validar datos
        const validationErrors = validateCreateAlertData(formData);
        if (validationErrors.length > 0) {
            showValidationErrors(validationErrors);
            return;
        }
        
        // Mostrar estado de carga
        setCreateAlertLoadingState(true);
        
        // Enviar alerta
        const result = await sendCreateAlertRequest(formData);
        
        if (result.success) {
            // Mostrar éxito
            showCreateAlertSuccess(result);
            
            // Cerrar modal después de un momento
            setTimeout(() => {
                closeCreateAlertModal();
                
                // Refrescar lista de alertas SIN mostrar popup de éxito (ya se mostró uno)
                if (typeof refreshAlertsQuietly === 'function') {
                    refreshAlertsQuietly();
                } else if (typeof refreshAlerts === 'function') {
                    // Fallback: marcar que no debe mostrar popup
                    window.skipNextSuccessPopup = true;
                    refreshAlerts();
                }
            }, 2000);
            
        } else {
            // Mostrar error
            showCreateAlertError(result.error || 'Error desconocido');
        }
        
    } catch (error) {
        //console.error('💥 Error al crear alerta:', error);
        showCreateAlertError('Error de conexión. Inténtalo de nuevo.');
    } finally {
        setCreateAlertLoadingState(false);
    }
}

/**
 * Obtener datos del formulario
 */
function getCreateAlertFormData() {
    const empresaId = window.currentUser?.empresa_id || window.currentUser?.id;
    const sedeSeleccionada = document.getElementById('sedeAlerta').value;
    const direccionIngresada = document.getElementById('direccionAlerta').value.trim();
    const selectedType = getSelectedAlertTypeInfo();

    const payload = {
        creador: {
            empresa_id: empresaId,
            tipo: "empresa",
            sede: sedeSeleccionada,
            direccion: direccionIngresada
        },
        descripcion: document.getElementById('descripcionAlerta').value,
        prioridad: document.getElementById('prioridadAlerta').value
    };

    if (selectedType.id) {
        payload.tipo_alerta_id = selectedType.id;
    }
    if (selectedType.code) {
        payload.tipo_alerta_codigo = selectedType.code;
        payload.tipo_alerta = selectedType.code;
    }
    if (selectedType.name) {
        payload.tipo_alerta_nombre = selectedType.name;
    }
    if (selectedType.color) {
        payload.tipo_alerta_color = selectedType.color;
    }
    if (selectedType.severity) {
        payload.tipo_alerta_severidad = selectedType.severity;
    }
    if (selectedType.description) {
        payload.tipo_alerta_descripcion = selectedType.description;
    }
    if (selectedType.empresaId) {
        payload.tipo_alerta_empresa_id = selectedType.empresaId;
    }
    if (selectedType.empresaNombre) {
        payload.tipo_alerta_empresa_nombre = selectedType.empresaNombre;
    }

    if (!payload.tipo_alerta && selectedType.name) {
        payload.tipo_alerta = selectedType.name;
    }
    if (!payload.tipo_alerta && selectedType.id) {
        payload.tipo_alerta = selectedType.id;
    }

    return payload;
}

function resolveScalarValue(value) {
    if (value == null) {
        return '';
    }

    if (typeof value === 'object') {
        if (Array.isArray(value)) {
            for (const item of value) {
                const resolved = resolveScalarValue(item);
                if (resolved) {
                    return resolved;
                }
            }
            return '';
        }

        const oidLikeKeys = ['$oid', '$id', '_id', 'id', 'value', '$value', '$numberInt', '$numberLong'];
        for (const key of oidLikeKeys) {
            if (value[key] != null) {
                const resolved = resolveScalarValue(value[key]);
                if (resolved) {
                    return resolved;
                }
            }
        }

        // Si es un objeto con clave "empresa" o similar, intentar profundizar
        const empresaKeys = ['empresa', 'company'];
        for (const key of empresaKeys) {
            if (value[key] != null) {
                const resolved = resolveScalarValue(value[key]);
                if (resolved) {
                    return resolved;
                }
            }
        }

        return '';
    }

    const text = `${value}`.trim();
    const objectIdMatch = text.match(/^ObjectId\((['\"]?)([0-9a-fA-F]{24})\1\)$/);
    if (objectIdMatch) {
        return objectIdMatch[2];
    }

    return text === '[object Object]' ? '' : text;
}

function normalizeEmpresaAlertTypesPayload(payload, empresaId) {
    if (!payload) {
        return [];
    }

    const collections = [];

    if (Array.isArray(payload?.data)) {
        collections.push(payload.data);
    }
    if (Array.isArray(payload?.alert_types)) {
        collections.push(payload.alert_types);
    }
    if (Array.isArray(payload)) {
        collections.push(payload);
    }

    if (collections.length === 0) {
        collectArrayValues(payload, collections, new Set());
    }

    const normalized = collections
        .flat()
        .map((item) => normalizeSingleAlertType(item, empresaId))
        .filter(Boolean);

    const normalizedEmpresaId = resolveScalarValue(empresaId);

    return uniqueAlertTypes(normalized).filter((type) => {
        if (!normalizedEmpresaId) {
            return true;
        }
        const typeEmpresaId = resolveScalarValue(type.empresaId);
        return typeEmpresaId === normalizedEmpresaId || typeEmpresaId === '';
    });
}

function normalizeSingleAlertType(raw, fallbackEmpresaId = '') {
    if (!raw) {
        return null;
    }

    const source = extractTypeSource(raw);

    const code = [
        source.tipo_alerta_codigo,
        source.alert_type_code,
        source.codigo,
        source.code,
        source.tipo_alerta,
    ].map(resolveScalarValue).find(Boolean);

    const name = [
        source.tipo_alerta_nombre,
        source.nombre_tipo_alerta,
        source.nombre_alerta,
        source.nombre,
        source.name,
        source.display_name,
        source.label,
        code,
    ].map(resolveScalarValue).find(Boolean);

    const id = [
        source.tipo_alerta_id,
        source.alert_type_id,
        source._id,
        source.id,
        raw._id,
        raw.id,
        code,
        name,
    ].map(resolveScalarValue).find(Boolean);

    const color = [
        source.tipo_alerta_color,
        source.color_alerta,
        source.color,
        source.color_hex,
        source.hex_color,
    ].map(resolveScalarValue).find(Boolean);

    const severity = [
        source.tipo_alerta_severidad,
        source.severity,
        source.prioridad,
        source.priority,
    ].map(resolveScalarValue).find(Boolean);

    const description = [
        source.descripcion,
        source.description,
        source.detalle,
        source.detail,
        source.comentarios,
    ].map(resolveScalarValue).find(Boolean);

    const empresaIdSource = [
        source.empresa_id,
        source.empresaId,
        raw.empresa_id,
        raw.empresaId,
        raw.empresa,
    ].map(resolveScalarValue).find(Boolean);

    const empresaId = (empresaIdSource !== undefined && empresaIdSource !== null)
        ? empresaIdSource
        : resolveScalarValue(source.es_global) === true || resolveScalarValue(raw.es_global) === true
            ? ''
            : resolveScalarValue(fallbackEmpresaId);

    const empresaNombre = [
        source.empresa_nombre,
        source.empresa,
        raw.empresa_nombre,
        raw.empresa,
        source.nombre_empresa,
        raw.nombre_empresa,
    ].map(resolveScalarValue).find(Boolean);

    if (!id && !code && !name) {
        return null;
    }

    const resolvedId = (id || code || name).toString().trim();
    const resolvedName = (name || code || resolvedId).toString().trim();

    const resolvedEmpresaId = resolveScalarValue(empresaId);

    return {
        id: resolvedId,
        code: code || '',
        name: resolvedName,
        nombre: resolvedName,
        color: color || '',
        severity: severity || '',
        description: description || '',
        empresaId: resolvedEmpresaId || '',
        empresaNombre: empresaNombre || '',
        scope: (resolvedEmpresaId || '') ? 'empresa' : 'global',
    };
}

function extractTypeSource(item) {
    if (!item) {
        return {};
    }

    const base = { ...item };

    const nestedCandidates = [
        item.tipo_alerta,
        item.alert_type,
        item.tipoAlerta,
        item.alertType,
        item.data,
        item.data?.mensaje_original,
        item.data?.metadatos,
    ];

    nestedCandidates.forEach((candidate) => {
        if (candidate && typeof candidate === 'object') {
            Object.assign(base, candidate);
        }
    });

    return base;
}

function uniqueAlertTypes(types) {
    const unique = new Map();

    types.filter(Boolean).forEach((type) => {
        const keyParts = [
            resolveScalarValue(type.id),
            resolveScalarValue(type.code),
            resolveScalarValue(type.name),
            resolveScalarValue(type.empresaId)
        ];
        const key = keyParts.filter(Boolean).join('::');
        const mapKey = key || JSON.stringify(type);
        if (!unique.has(mapKey)) {
            unique.set(mapKey, type);
        }
    });

    return Array.from(unique.values());
}

function collectArrayValues(value, collections, visited) {
    if (!value || typeof value !== 'object') {
        return;
    }

    if (visited.has(value)) {
        return;
    }
    visited.add(value);

    if (Array.isArray(value)) {
        if (!collections.includes(value)) {
            collections.push(value);
        }
        value.forEach((item) => collectArrayValues(item, collections, visited));
        return;
    }

    Object.values(value).forEach((nested) => {
        if (nested && typeof nested === 'object') {
            collectArrayValues(nested, collections, visited);
        }
    });
}

/**
 * Validar datos del formulario
 */
function validateCreateAlertData(data) {
    const errors = [];
    
    // Validar datos del creador
    if (!data.creador) {
        errors.push('Datos del creador no válidos');
    } else {
        if (!data.creador.empresa_id) {
            errors.push('No se pudo obtener el ID de la empresa');
        }
        
        if (!data.creador.sede || data.creador.sede.trim() === '') {
            errors.push('Debe seleccionar una sede');
        }
        
        if (!data.creador.direccion || data.creador.direccion.trim() === '') {
            errors.push('Debe proporcionar una dirección de la emergencia');
        } else if (data.creador.direccion.trim().length < 10) {
            errors.push('La dirección debe tener al menos 10 caracteres');
        }
    }
    
    if (!data.tipo_alerta_id) {
        errors.push('Debe seleccionar un tipo de alerta disponible');
    }

    if (!data.descripcion || data.descripcion.trim() === '') {
        errors.push('Debe proporcionar una descripción de la emergencia');
    } else if (data.descripcion.trim().length < 10) {
        errors.push('La descripción debe tener al menos 10 caracteres');
    }
    
    if (!data.prioridad || data.prioridad.trim() === '') {
        errors.push('Debe seleccionar una prioridad');
    }
    
    return errors;
}

/**
 * Enviar solicitud de crear alerta al backend usando el cliente API
 */
async function sendCreateAlertRequest(alertData) {
    try {
        console.log('📡 Payload enviado para crear alerta:', alertData);
        
        // Verificar que tenemos el cliente API disponible
        if (!window.apiClient) {
            //console.error('❌ API Client no está disponible');
            return {
                success: false,
                error: 'Sistema de comunicación no disponible'
            };
        }
        
        //console.log('📤 Enviando petición usando API Client...');
        //console.log('📤 Datos a enviar:', JSON.stringify(alertData, null, 2));
        
        // Usar el cliente API para enviar la petición
        const response = await window.apiClient.create_empresa_alert(alertData);
        
        //console.log('📨 Respuesta recibida:', response.status, response.statusText);
        
        // Procesar respuesta
        if (!response.ok) {
            let errorMessage = `Error HTTP ${response.status}: ${response.statusText}`;
            
            try {
                // Intentar parsear la respuesta como JSON para obtener el mensaje específico
                const errorData = await response.json();
                //console.error('❌ Error JSON del backend:', errorData);
                
                // Extraer mensaje específico del backend
                if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else {
                    errorMessage = `Error ${response.status}: ${response.statusText}`;
                }
                
            } catch (jsonError) {
                // Si no es JSON válido, usar respuesta como texto
                try {
                    const errorText = await response.text();
                    //console.error('❌ Error texto del backend:', errorText);
                    errorMessage = errorText || `Error HTTP ${response.status}: ${response.statusText}`;
                } catch (textError) {
                    //console.error('❌ No se pudo leer respuesta de error:', textError);
                    errorMessage = `Error HTTP ${response.status}: ${response.statusText}`;
                }
            }
            
            return {
                success: false,
                error: errorMessage
            };
        }
        
        const responseData = await response.json();
        //console.log('✅ Respuesta JSON procesada:', responseData);
        
        // Verificar si la respuesta indica éxito
        if (responseData.success) {
            // Enviar notificación por WebSocket si la alerta se creó exitosamente
            // El backend devuelve la alerta en responseData.alert
            const alertData = responseData.alert || responseData.data || responseData;
            sendAlertCreatedWebSocketMessage(alertData);

            return {
                success: true,
                message: responseData.message || 'Alerta creada exitosamente',
                data: {
                    id: alertData._id || alertData.id || null,
                    tipo_alerta_id: alertData.tipo_alerta_id || alertData.alert_type_id || null,
                    tipo_alerta: alertData.tipo_alerta || alertData.tipo_alerta_codigo || null,
                    tipo_alerta_nombre: alertData.tipo_alerta_nombre || alertData.nombre_tipo_alerta || null,
                    sede: alertData.sede || null,
                    prioridad: alertData.prioridad || null,
                    fecha_creacion: alertData.fecha_creacion || alertData.created_at || null
                }
            };
        } else {
            return {
                success: false,
                error: responseData.error || responseData.message || 'Error desconocido del servidor'
            };
        }
        
    } catch (error) {
        //console.error('💥 Error en petición API:', error);
        
        // Determinar tipo de error
        let errorMessage = 'Error de conexión';
        
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            errorMessage = 'No se pudo conectar con el servidor. Verifique su conexión a internet.';
        } else if (error.name === 'AbortError') {
            errorMessage = 'La petición fue cancelada o tardó demasiado tiempo.';
        } else if (error.message) {
            errorMessage = error.message;
        } else {
            errorMessage = 'Error desconocido de red';
        }
        
        return {
            success: false,
            error: errorMessage
        };
    }
}

// ========== FUNCIONES WEBSOCKET ==========

/**
 * Enviar notificación por WebSocket cuando se crea una alerta exitosamente
 */
function sendAlertCreatedWebSocketMessage(alertDataFromBackend) {
    try {
        //console.log('📡 Enviando notificación de alerta creada por WebSocket...');
        //console.log('📡 Datos recibidos del backend:', alertDataFromBackend);
        
        // Verificar que tenemos WebSocket disponible
        if (!window.websocket || window.websocket.readyState !== WebSocket.OPEN) {
            //console.warn('⚠️ WebSocket no está conectado, omitiendo notificación');
            return;
        }
        
        // Preparar mensaje simple con el nuevo formato
        const message = {
            type: "create_empresa_alert",
            alert_data: alertDataFromBackend // El JSON limpio que devuelve el backend
        };
        
        //console.log('📤 Mensaje WebSocket a enviar:', JSON.stringify(message, null, 2));
        
        // Enviar por WebSocket
        window.websocket.send(JSON.stringify(message));
        //console.log('✅ Notificación WebSocket enviada exitosamente');
        
    } catch (error) {
        //console.error('💥 Error enviando notificación WebSocket:', error);
        // No fallar la creación de la alerta por un error de WebSocket
    }
}

// ========== UI FEEDBACK ==========

/**
 * Mostrar/ocultar estado de carga
 */
function setCreateAlertLoadingState(loading) {
    const submitBtn = document.getElementById('createAlertSubmitBtn');
    const submitText = document.getElementById('createAlertSubmitText');
    
    if (!submitBtn || !submitText) return;
    
    if (loading) {
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitText.textContent = 'Creando...';
        
        // Agregar spinner si no existe
        if (!submitBtn.querySelector('.spinner')) {
            const spinner = document.createElement('i');
            spinner.className = 'fas fa-spinner fa-spin spinner mr-2';
            submitBtn.insertBefore(spinner, submitText);
        }
    } else {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitText.textContent = 'Crear Alerta';
        
        // Remover spinner
        const spinner = submitBtn.querySelector('.spinner');
        if (spinner) {
            spinner.remove();
        }
    }
}

/**
 * Mostrar errores de validación
 */
function showValidationErrors(errors) {
    const errorMessage = errors.join('\n• ');
    showSimpleNotification(`Errores en el formulario:\n• ${errorMessage}`, 'error', 8000);
}

/**
 * Mostrar éxito al crear alerta
 */
function showCreateAlertSuccess(result) {
    const selectedType = getSelectedAlertTypeInfo();
    const tipoLabel = selectedType.name || result.data?.tipo_alerta_nombre || result.data?.tipo_alerta || 'N/A';
    const successMessage = `¡Alerta creada exitosamente!\n\n• Tipo: ${tipoLabel}\n• Sede: ${result.data?.sede || 'N/A'}\n• Prioridad: ${result.data?.prioridad || 'N/A'}\n\nSe han notificado los contactos de emergencia correspondientes.`;
    showSimpleNotification(successMessage, 'success', 5000);
}

/**
 * Mostrar error al crear alerta
 */
function showCreateAlertError(errorMessage) {
    showSimpleNotification(`Error al crear alerta: ${errorMessage}`, 'error', 6000);
}

// ========== FUNCIONES GLOBALES ==========

// Exponer funciones necesarias al scope global
window.showCreateAlertModal = showCreateAlertModal;
window.closeCreateAlertModal = closeCreateAlertModal;

//console.log('📁 Módulo de creación de alertas cargado');
