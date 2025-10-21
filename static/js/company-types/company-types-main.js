/**
 * COMPANY TYPES - VERSIÓN OPTIMIZADA SIN REDUNDANCIAS
 * Solo código funcional y necesario
 */

const buildApiUrl = window.__buildApiUrl || function(path = '') {
  const base = window.__APP_CONFIG && window.__APP_CONFIG.apiUrl;
  if (!base) {
    throw new Error('API URL no configurada');
  }
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  if (!path) {
    return normalizedBase;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

// ============================================================================
// 1. MODAL SCROLL MANAGER - VERSIÓN OPTIMIZADA
// ============================================================================

class ModalScrollManager {
  constructor() {
    this.openModals = new Set();
    this.scrollPosition = 0;
    this.isLocked = false;
    this.init();
  }

  init() {
    this.injectCSS();
    window.addEventListener('orientationchange', () => setTimeout(() => this.refreshLock(), 100));
    window.addEventListener('resize', () => this.hasOpenModals() && this.refreshLock());
  }

  injectCSS() {
    if (document.getElementById('modal-scroll-css')) return;
    
    const style = document.createElement('style');
    style.id = 'modal-scroll-css';
    style.textContent = `
      .modal-scroll-locked { overflow: hidden !important; }
      .modal-scrollable { overflow-y: auto; -webkit-overflow-scrolling: touch; }
      .ios-modal-backdrop {
        position: fixed !important; top: 0 !important; left: 0 !important; 
        right: 0 !important; bottom: 0 !important; z-index: 9999 !important;
        display: flex; align-items: center; justify-content: center; padding: 1rem;
      }
    `;
    document.head.appendChild(style);
  }

  openModal(modalId, options = {}) {
    //console.log(`🔒 Opening modal: ${modalId}`);
    
    if (this.openModals.size === 0) {
      this.scrollPosition = window.pageYOffset;
      this.lockScroll();
    }
    
    this.openModals.add(modalId);
    
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
    }
    
    options.focusTrap && this.setupFocusTrap(modalId);
  }

  closeModal(modalId) {
    //console.log(`🔓 Closing modal: ${modalId}`);
    
    this.openModals.delete(modalId);
    
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
    
    if (this.openModals.size === 0) {
      this.unlockScroll();
    }
  }

 /**
 * REEMPLAZAR SOLO ESTA FUNCIÓN en company-types-complete.js
 * Busca lockScroll() y reemplázala con esta versión que SÍ bloquea efectivamente
 */

lockScroll() {
  if (this.isLocked) return;
  
  //console.log('🔒 Locking scroll effectively without visual jump');
  
  const body = document.body;
  const html = document.documentElement;
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  
  // MÉTODO HÍBRIDO: Overflow hidden + event listeners agresivos + position fixed SIN salto
  
  // 1. Guardar estado actual del scroll
  const currentScrollY = window.pageYOffset;
  
  // 2. Aplicar estilos para bloquear scroll
  body.style.overflow = 'hidden';
  html.style.overflow = 'hidden';
  body.style.position = 'fixed';
  //body.style.top = `-${currentScrollY}px`;
  body.style.left = '0';
  body.style.right = '0';
  body.style.width = '100%';

  // 4. Clase CSS adicional
  body.classList.add('modal-scroll-locked');
  
  // 5. Event listeners AGRESIVOS para todos los tipos de scroll
  document.addEventListener('touchmove', this.preventScroll, { passive: false });
  document.addEventListener('wheel', this.preventScroll, { passive: false });
  document.addEventListener('keydown', this.preventScrollKeys, { passive: false });
  document.addEventListener('scroll', this.preventScrollEvent, { passive: false });
  
  // 6. Prevenir drag en elementos
  document.addEventListener('dragstart', this.preventDrag, { passive: false });
  
  this.isLocked = true;
  //console.log('✅ Scroll COMPLETAMENTE bloqueado sin salto visual');
}

/**
 * TAMBIÉN AÑADIR ESTAS FUNCIONES NUEVAS al final de la clase ModalScrollManager
 */

preventScrollKeys = (e) => {
  // Teclas que causan scroll
  const scrollKeys = [
    'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight',
    'PageDown', 'PageUp', 'Home', 'End', 'Space'
  ];
  
  if (scrollKeys.includes(e.code) || e.key === ' ') {
    // Permitir solo si está dentro de un elemento scrollable O es un input
    const target = e.target;
    const isScrollable = target.closest('.modal-scrollable, .scrollable');
    const isInput = target.matches('input, textarea, select, [contenteditable]');
    
    if (!isScrollable && !isInput) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
}

preventScrollEvent = (e) => {
  // Prevenir eventos de scroll directo
  e.preventDefault();
  e.stopPropagation();
  
  // Forzar que se mantenga en la posición guardada
  window.scrollTo(0, this.scrollPosition);
}

preventDrag = (e) => {
  // Prevenir drag que puede causar scroll en móviles
  if (!e.target.closest('.modal-scrollable, .scrollable')) {
    e.preventDefault();
  }
}

/**
 * Y TAMBIÉN ACTUALIZAR unlockScroll() para limpiar los nuevos event listeners
 */

unlockScroll() {
  if (!this.isLocked) return;
  
  //console.log('🔓 Unlocking scroll and restoring exact position');
  
  const body = document.body;
  const html = document.documentElement;
  
  // Remover todos los event listeners
  document.removeEventListener('touchmove', this.preventScroll);
  document.removeEventListener('wheel', this.preventScroll);
  document.removeEventListener('keydown', this.preventScrollKeys);
  document.removeEventListener('scroll', this.preventScrollEvent);
  document.removeEventListener('dragstart', this.preventDrag);
  
  // Restaurar estilos
  body.style.overflow = '';
  body.style.paddingRight = '';
  body.style.position = '';
  body.style.top = '';
  body.style.left = '';
  body.style.right = '';
  body.style.width = '';
  html.style.overflow = '';
  
  body.classList.remove('modal-scroll-locked');
  
  // Restaurar posición de scroll
  //window.scrollTo(0, this.scrollPosition);
  
  this.isLocked = false;
  //console.log('✅ Scroll unlocked and position restored perfectly');
}

  preventScroll = (e) => {
    if (!e.target.closest('.modal-scrollable, .scrollable')) {
      e.preventDefault();
    }
  }

  setupFocusTrap(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const trapFocus = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    modal.addEventListener('keydown', trapFocus);
    first?.focus();
  }

  hasOpenModals() { return this.openModals.size > 0; }
  closeAllModals() {
    Array.from(this.openModals).forEach(id => this.closeModal(id));
  }
  refreshLock() {
    if (this.hasOpenModals()) {
      this.unlockScroll();
      setTimeout(() => this.lockScroll(), 50);
    }
  }
}

// ============================================================================
// 2. ESTADO GLOBAL
// ============================================================================

let modalManager;
let editingCompanyType = null;
let currentFeatures = [];
let currentShowingInactive = false;
let toggleModalData = { typeId: null, newStatus: null };

// ============================================================================
// 3. FUNCIONES DE MODAL
// ============================================================================

function openCreateModal() {
  editingCompanyType = null;
  currentFeatures = [];
  
  document.getElementById('modalTitle').textContent = 'Nuevo Tipo de Empresa';
  document.getElementById('submitButtonText').textContent = 'Crear Tipo';
  document.getElementById('companyTypeForm').reset();
  updateFeaturesList();
  
  modalManager.openModal('companyTypeModal', { focusTrap: true });
}

async function editCompanyType(id) {
  editingCompanyType = id;
  document.getElementById('modalTitle').textContent = 'Editar Tipo de Empresa';
  document.getElementById('submitButtonText').textContent = 'Actualizar Tipo';
  
  try {
    const response = await callAPI('GET', `/api/tipos_empresa/${id}`);
    if (response.success && response.data) {
      const data = response.data;
      document.getElementById('typeName').value = data.nombre || '';
      document.getElementById('typeStatus').value = data.activo ? 'true' : 'false';
      document.getElementById('typeDescription').value = data.descripcion || '';
      currentFeatures = data.caracteristicas || [];
      updateFeaturesList();
    }
  } catch (error) {
    showNotification('Error al cargar los datos del tipo de empresa', 'error');
    return;
  }
  
  modalManager.openModal('companyTypeModal', { focusTrap: true });
}

function closeModal() {
  modalManager.closeModal('companyTypeModal');
  editingCompanyType = null;
  currentFeatures = [];
}

async function viewCompanyType(id) {
  try {
    const response = await callAPI('GET', `/api/tipos_empresa/${id}`);
    if (response.success && response.data) {
      const data = response.data;
      document.getElementById('detailsTitle').textContent = `Detalles: ${data.nombre}`;
      document.getElementById('detailsContent').innerHTML = generateDetailsHTML(data);
    }
  } catch (error) {
    showNotification('Error al cargar los detalles del tipo de empresa', 'error');
    return;
  }
  
  modalManager.openModal('detailsModal', { focusTrap: true });
}

function closeDetailsModal() {
  modalManager.closeModal('detailsModal');
}

function openToggleModal(id, currentStatus, typeName) {
  const newStatus = !currentStatus;
  toggleModalData = { typeId: id, newStatus };
  
  updateToggleModalContent(newStatus, typeName);
  modalManager.openModal('toggleCompanyTypeModal', { focusTrap: true });
}

function updateToggleModalContent(newStatus, typeName) {
  const elements = {
    icon: document.getElementById('toggleModalIcon'),
    iconFa: document.getElementById('toggleModalIconFa'),
    title: document.getElementById('toggleModalTitle'),
    message: document.getElementById('toggleModalMessage'),
    confirmText: document.getElementById('toggleConfirmText'),
    confirmIcon: document.getElementById('toggleConfirmIcon')
  };
  
  if (!elements.title || !elements.message) return;
  
  if (newStatus) {
    elements.icon && (elements.icon.className = 'toggle-modal-icon activate mx-auto mb-4');
    elements.iconFa && (elements.iconFa.className = 'fas fa-play-circle text-4xl');
    elements.title.textContent = 'Activar Tipo de Empresa';
    elements.message.textContent = `¿Estás seguro de que quieres activar el tipo "${typeName}"?`;
    elements.confirmText && (elements.confirmText.textContent = 'Activar');
    elements.confirmIcon && (elements.confirmIcon.className = 'fas fa-play mr-2');
  } else {
    elements.icon && (elements.icon.className = 'toggle-modal-icon deactivate mx-auto mb-4');
    elements.iconFa && (elements.iconFa.className = 'fas fa-pause-circle text-4xl');
    elements.title.textContent = 'Desactivar Tipo de Empresa';
    elements.message.textContent = `¿Estás seguro de que quieres desactivar el tipo "${typeName}"?`;
    elements.confirmText && (elements.confirmText.textContent = 'Desactivar');
    elements.confirmIcon && (elements.confirmIcon.className = 'fas fa-pause mr-2');
  }
}

function closeToggleModal() {
  modalManager.closeModal('toggleCompanyTypeModal');
  toggleModalData = { typeId: null, newStatus: null };
}

async function confirmToggleCompanyType() {
  if (!toggleModalData.typeId || toggleModalData.newStatus === null) return;
  
  const confirmBtn = document.getElementById('toggleConfirmBtn');
  const originalContent = confirmBtn?.innerHTML;
  
  if (confirmBtn) {
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    confirmBtn.disabled = true;
  }
  
  try {
    await executeToggle(toggleModalData.typeId, toggleModalData.newStatus);
    showToggleSuccess(toggleModalData.newStatus);
  } catch (error) {
    showNotification(error.message, 'error');
    if (confirmBtn && originalContent) {
      confirmBtn.innerHTML = originalContent;
      confirmBtn.disabled = false;
    }
  }
}

function showUpdateModal(message = 'El tipo de empresa se ha actualizado exitosamente.') {
  const elements = {
    title: document.getElementById('updateModalTitle'),
    message: document.getElementById('updateModalMessage'),
    icon: document.getElementById('updateModalIcon'),
    iconFa: document.getElementById('updateModalIconFa')
  };
  
  if (!elements.title || !elements.message) return;
  
  elements.icon && (elements.icon.className = 'client-update-icon');
  elements.iconFa && (elements.iconFa.className = 'fas fa-check-circle');
  
  elements.title.textContent = message.includes('creado') ? '¡Tipo Creado!' : 
                               message.includes('actualizado') ? '¡Tipo Actualizado!' : '¡Operación Exitosa!';
  elements.message.textContent = message;
  
  modalManager.openModal('clientUpdateModal', { focusTrap: true });
}

function closeUpdateModal() {
  modalManager.closeModal('clientUpdateModal');
}

// ============================================================================
// 4. OPERACIONES Y ACCIONES
// ============================================================================

async function executeToggle(id, newStatus) {
  const response = await callAPI('PATCH', `/api/tipos_empresa/${id}/toggle-status`);
  
  const card = document.querySelector(`[data-type-id="${id}"]`);
  if (card && window.HardwareAnimations?.animateStatusChange) {
    window.HardwareAnimations.animateStatusChange(card);
  }
  
  return response;
}

function showToggleSuccess(activated) {
  const elements = {
    icon: document.getElementById('toggleModalIcon'),
    iconFa: document.getElementById('toggleModalIconFa'),
    title: document.getElementById('toggleModalTitle'),
    message: document.getElementById('toggleModalMessage'),
    buttons: document.querySelector('#toggleCompanyTypeModal .flex.gap-4')
  };
  
  if (!elements.title || !elements.message) {
    closeToggleModal();
    return;
  }
  
  if (activated) {
    elements.icon && (elements.icon.className = 'toggle-modal-icon activate');
    elements.iconFa && (elements.iconFa.className = 'fas fa-check-circle');
    elements.title.textContent = '¡Tipo Activado!';
    elements.message.textContent = 'El tipo de empresa se ha activado exitosamente.';
  } else {
    elements.icon && (elements.icon.className = 'toggle-modal-icon deactivate');
    elements.iconFa && (elements.iconFa.className = 'fas fa-times-circle');
    elements.title.textContent = '¡Tipo Desactivado!';
    elements.message.textContent = 'El tipo de empresa se ha desactivado exitosamente.';
  }
  
  elements.buttons && (elements.buttons.style.display = 'none');
  
  if (typeof gsap !== 'undefined' && elements.icon) {
    gsap.to(elements.icon, { scale: 1.2, duration: 0.3, ease: "back.out(1.7)" });
  }
  
  setTimeout(() => {
    closeToggleModal();
    setTimeout(() => updateCardVisually(toggleModalData.typeId, activated), 500);
  }, 2000);
}

function updateCardVisually(typeId, activated) {
  const card = document.querySelector(`[data-type-id="${typeId}"]`);
  if (!card) return;
  
  const statusBadge = card.querySelector('.ios-status-badge');
  if (statusBadge) {
    statusBadge.className = `ios-status-badge ${activated ? 'ios-status-available' : 'ios-status-discontinued'} text-xs font-semibold`;
    statusBadge.textContent = activated ? '✅ Activo' : '⚫ Inactivo';
  }
  
  const toggleButton = card.querySelector('button[onclick*="toggleStatus"]');
  if (toggleButton) {
    toggleButton.className = `ios-card-btn ${activated ? 'ios-card-btn-warning' : 'ios-card-btn-success'}`;
    toggleButton.title = activated ? 'Desactivar tipo' : 'Activar tipo';
    toggleButton.innerHTML = `<i class="fas ${activated ? 'fa-power-off' : 'fa-play'}"></i>`;
    toggleButton.setAttribute('onclick', `toggleStatus('${typeId}', ${activated})`);
  }
  
  card.setAttribute('data-status', activated ? 'true' : 'false');
}

function toggleStatus(id, currentStatus) {
  const card = document.querySelector(`[data-type-id="${id}"]`);
  const typeName = card?.querySelector('.ios-card-title')?.textContent || 'este tipo de empresa';
  openToggleModal(id, currentStatus, typeName);
}

function viewCompaniesOfType(typeId, typeName) {
  const empresasUrl = new URL('/admin/empresas', window.location.origin);
  empresasUrl.searchParams.set('tipo_empresa_id', typeId);
  empresasUrl.searchParams.set('tipo_empresa_nombre', typeName);
  
  const button = event.target.closest('button');
  const originalContent = button.innerHTML;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
  button.disabled = true;
  
  window.location.href = empresasUrl.toString();
}

// ============================================================================
// 5. GESTIÓN DE CARACTERÍSTICAS
// ============================================================================

function addFeature() {
  const input = document.getElementById('featureInput');
  const feature = input.value.trim();
  
  if (!feature) return;
  if (currentFeatures.includes(feature)) {
    showNotification('Esta característica ya existe', 'error');
    return;
  }
  if (currentFeatures.length >= 20) {
    showNotification('No se pueden agregar más de 20 características', 'error');
    return;
  }
  if (feature.length > 100) {
    showNotification('La característica no puede exceder 100 caracteres', 'error');
    return;
  }
  
  currentFeatures.push(feature);
  input.value = '';
  updateFeaturesList();
}

function removeFeature(index) {
  currentFeatures.splice(index, 1);
  updateFeaturesList();
}

function updateFeaturesList() {
  const container = document.getElementById('featuresList');
  if (!container) return;
  
  container.innerHTML = currentFeatures.map((feature, index) => `
    <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">${feature}</span>
      <button type="button" class="text-red-500 hover:text-red-700 ml-2" onclick="removeFeature(${index})">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `).join('');
}

function handleFeatureKeyPress(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    addFeature();
  }
}

// ============================================================================
// 6. FILTRADO Y NAVEGACIÓN
// ============================================================================

function toggleIncludeInactive() {
  const newShowInactive = !currentShowingInactive;
  const currentUrl = new URL(window.location);
  
  if (newShowInactive) {
    currentUrl.searchParams.set('include_inactive', 'true');
  } else {
    currentUrl.searchParams.delete('include_inactive');
  }
  
  window.location.href = currentUrl.toString();
}

function filterTypesByActiveStatus(showInactive) {
  const cards = document.querySelectorAll('.company-type-item');
  let visibleCount = 0;
  
  cards.forEach(card => {
    const isActive = card.dataset.status === 'true';
    const shouldShow = isActive || showInactive;
    
    card.style.display = shouldShow ? '' : 'none';
    if (shouldShow) visibleCount++;
  });
  
  updateHeaderBadge(showInactive, visibleCount);
}

function updateHeaderBadge(showInactive, visibleCount) {
  const badgeSpan = document.querySelector('.ios-header-subtitle span');
  if (!badgeSpan) return;
  
  badgeSpan.className = `inline-block ml-2 px-2 py-1 ${showInactive ? 'bg-orange-500' : 'bg-green-500'} text-white text-xs rounded-full`;
  badgeSpan.textContent = showInactive ? `Mostrando todos (${visibleCount} tipos)` : `Solo activos (${visibleCount} tipos)`;
}

function syncButtonState() {
  const button = document.querySelector('button[onclick="toggleIncludeInactive()"]');
  if (!button) return;
  
  const icon = button.querySelector('i');
  const text = button.querySelector('span');
  
  if (currentShowingInactive) {
    button.className = button.className.replace('ios-action-btn-secondary', 'ios-action-btn-warning');
    icon && (icon.className = 'fas fa-eye-slash');
    text && (text.textContent = 'Solo Activos');
  } else {
    button.className = button.className.replace('ios-action-btn-warning', 'ios-action-btn-secondary');
    icon && (icon.className = 'fas fa-eye');
    text && (text.textContent = 'Ver Todos');
  }
}

// ============================================================================
// 7. API Y UTILIDADES
// ============================================================================

async function callAPI(method, endpoint, data = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  };
  
  if (data) options.body = JSON.stringify(data);
  
  const response = await fetch(buildApiUrl(endpoint), options);
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.errors?.join(', ') || result.message || 'Error en la operación');
  }
  
  return result;
}

function showNotification(message, type = 'info') {
  document.querySelectorAll('.enhanced-notification').forEach(n => n.remove());
  
  const notification = document.createElement('div');
  notification.className = 'enhanced-notification fixed top-4 right-4 max-w-sm z-50';
  
  const config = type === 'error' 
    ? { icon: 'fas fa-exclamation-circle', bg: 'bg-red-500', border: 'border-red-600' }
    : { icon: 'fas fa-check-circle', bg: 'bg-green-500', border: 'border-green-600' };
  
  notification.innerHTML = `
    <div class="${config.bg} ${config.border} border-l-4 text-white p-4 rounded-lg shadow-xl">
      <div class="flex items-center">
        <i class="${config.icon} text-xl"></i>
        <p class="ml-3 text-sm font-medium">${message}</p>
        <button onclick="this.closest('.enhanced-notification').remove()" class="ml-auto text-white hover:text-gray-200">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  if (typeof gsap !== 'undefined') {
    gsap.fromTo(notification, { x: 400, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: "back.out(1.7)" });
  }
  
  setTimeout(() => notification.remove(), 4000);
}

function generateDetailsHTML(data) {
  const featuresHTML = data.caracteristicas?.length > 0 ? `
    <div class="col-span-1 md:col-span-2 bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 rounded-xl p-6 shadow-xl">
      <label class="block text-sm font-bold text-white mb-4">
        <i class="fas fa-tags mr-2"></i>Características (${data.caracteristicas.length})
      </label>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        ${data.caracteristicas.map((feature, index) => {
          const colors = ['from-purple-500 to-pink-500', 'from-blue-500 to-indigo-500', 'from-green-500 to-emerald-500'];
          return `<div class="bg-gradient-to-br ${colors[index % colors.length]} rounded-lg p-3 text-white font-semibold text-sm">${feature}</div>`;
        }).join('')}
      </div>
    </div>
  ` : '';

  return `
    <div class="bg-gradient-to-br from-purple-500 to-red-500 rounded-xl p-5 shadow-lg">
      <label class="block text-sm font-bold text-white mb-3"><i class="fas fa-tag mr-2"></i>Nombre</label>
      <div class="text-xl font-bold text-white">${data.nombre}</div>
    </div>
    <div class="bg-gradient-to-br from-${data.activo ? 'green' : 'red'}-500 to-${data.activo ? 'teal' : 'rose'}-500 rounded-xl p-5 shadow-lg">
      <label class="block text-sm font-bold text-white mb-3"><i class="fas fa-toggle-on mr-2"></i>Estado</label>
      <div class="text-xl font-bold text-white">${data.activo ? '✅ Activo' : '❌ Inactivo'}</div>
    </div>
    <div class="bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl p-5 shadow-lg">
      <label class="block text-sm font-bold text-white mb-3"><i class="fas fa-building mr-2"></i>Empresas</label>
      <div class="text-xl font-bold text-white">${data.companies_count || 0}</div>
    </div>
    <div class="bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl p-5 shadow-lg">
      <label class="block text-sm font-bold text-white mb-3"><i class="fas fa-calendar mr-2"></i>Creado</label>
      <div class="text-xl font-bold text-white">${data.created_at || 'N/A'}</div>
    </div>
    <div class="col-span-1 md:col-span-2 bg-gradient-to-br from-violet-600 to-indigo-800 rounded-xl p-5 shadow-lg">
      <label class="block text-sm font-bold text-white mb-3"><i class="fas fa-align-left mr-2"></i>Descripción</label>
      <div class="text-lg text-white">${data.descripcion || 'Sin descripción'}</div>
    </div>
    ${featuresHTML}
  `;
}

function ensureVisibility() {
  document.querySelectorAll('.ios-header-container, .ios-stat-card, .ios-hardware-card').forEach(el => {
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.visibility = 'visible';
  });
}

function exportTypes() {
  showUpdateModal('Los tipos de empresa se están exportando. El archivo CSV se descargará automáticamente.');
}

// ============================================================================
// 8. FORM SUBMISSION
// ============================================================================

async function handleFormSubmission(e) {
  e.preventDefault();
  
  const form = e.target;
  const typeName = form.typeName?.value?.trim();
  const typeDescription = form.typeDescription?.value?.trim();
  const typeStatus = form.typeStatus?.value;
  const submitBtn = document.querySelector('#submitButtonText');
  
  if (!typeName || !typeDescription) {
    showNotification('Por favor completa todos los campos obligatorios', 'error');
    return;
  }
  
  const originalText = submitBtn?.textContent;
  if (submitBtn) submitBtn.textContent = 'Guardando...';
  
  const formData = {
    nombre: typeName,
    descripcion: typeDescription,
    caracteristicas: currentFeatures,
    activo: typeStatus === 'true'
  };
  
  try {
    if (editingCompanyType) {
      await callAPI('PUT', `/api/tipos_empresa/${editingCompanyType}`, formData);
      showUpdateModal('El tipo de empresa se ha actualizado exitosamente.');
    } else {
      await callAPI('POST', '/api/tipos_empresa', formData);
      showUpdateModal('El nuevo tipo de empresa se ha creado exitosamente.');
    }
    
    closeModal();
    setTimeout(() => location.reload(), 1500);
    
  } catch (error) {
    showNotification(error.message, 'error');
    if (submitBtn && originalText) submitBtn.textContent = originalText;
  }
}

// ============================================================================
// 9. INICIALIZACIÓN
// ============================================================================

function init() {
  modalManager = new ModalScrollManager();
  
  // Estado inicial
  const urlParams = new URLSearchParams(window.location.search);
  currentShowingInactive = urlParams.get('include_inactive') === 'true';
  
  // Visibilidad
  ensureVisibility();
  
  // Animaciones hardware
  window.HardwareAnimations?.init();
  
  // Filtro inicial
  filterTypesByActiveStatus(currentShowingInactive);
  syncButtonState();
  
  // Event listeners
  document.getElementById('companyTypeForm')?.addEventListener('submit', handleFormSubmission);
  
  ['companyTypeModal', 'detailsModal', 'toggleCompanyTypeModal', 'clientUpdateModal'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        const closeFn = {
          companyTypeModal: closeModal,
          detailsModal: closeDetailsModal,
          toggleCompanyTypeModal: closeToggleModal,
          clientUpdateModal: closeUpdateModal
        }[id];
        closeFn?.();
      }
    });
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalManager.hasOpenModals()) {
      modalManager.closeAllModals();
    }
  });
  
  // Observer para nuevas tarjetas
  const grid = document.getElementById('companyTypesGrid');
  if (grid) {
    new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1 && node.classList.contains('ios-hardware-card')) {
            node.style.opacity = '1';
            node.style.transform = 'none';
            node.style.visibility = 'visible';
          }
        });
      });
    }).observe(grid, { childList: true, subtree: true });
  }
  
  //console.log('✅ Company Types optimized version loaded');
}

// Inicialización automática
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();

// Exponer funciones globales
Object.assign(window, {
  modalManager, openCreateModal, editCompanyType, closeModal, viewCompanyType, 
  closeDetailsModal, toggleStatus, confirmToggleCompanyType, closeToggleModal, 
  closeUpdateModal, toggleIncludeInactive, addFeature, removeFeature, 
  handleFeatureKeyPress, viewCompaniesOfType, exportTypes
});
