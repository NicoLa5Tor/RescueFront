(function() {
  'use strict';

  window.__ALERT_TYPES_MODAL_VERSION__ = 'no-reload-v2';

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

  const modalId = 'createAlertTypeModal';
  const form = document.getElementById('createAlertTypeForm');
  const feedbackEl = document.getElementById('alertTypeFormFeedback');
  const submitBtn = document.getElementById('createAlertTypeSubmit');
  const colorInput = document.getElementById('alertTypeColor');
  const severitySelect = document.getElementById('alertTypeSeverity');
  const deactivateModalId = 'toggleAlertTypeModal';
  const deactivateFeedback = document.getElementById('alertTypeDeactivateFeedback');
  const deactivateConfirmBtn = document.getElementById('alertTypeDeactivateConfirmBtn');
  const deactivateMessage = document.getElementById('toggleAlertTypeMessage');
  const deactivateTitle = document.getElementById('toggleAlertTypeTitle');
  const deactivateIconWrapper = document.getElementById('toggleAlertTypeIcon');
  const deactivateIcon = document.getElementById('toggleAlertTypeIconFa');
  const companyInput = document.getElementById('alertTypeCompanyInput');
  const companyHiddenInput = document.getElementById('alertTypeCompanyId');
  const companyDatalist = document.getElementById('alertTypeCompanyList');
  const scopeToggle = document.getElementById('alertTypeScopeGlobal');
  const companyGroup = document.getElementById('alertTypeCompanyGroup');
  const companyLabelSuffix = document.getElementById('alertTypeCompanyLabelSuffix');
  const companyHelper = document.getElementById('alertTypeCompanyHelper');
  const scopeWrapper = document.getElementById('alertTypeScopeWrapper');
  const scopeLabel = document.getElementById('alertTypeScopeLabel');

  const imageFolderSelect = document.getElementById('alertImageFolderSelect');
  const imageFileSelect = document.getElementById('alertImageFileSelect');
  const imagePreview = document.getElementById('alertImagePreview');
  const imageHiddenInput = document.getElementById('alertTypeImage');
  const imageUrlHiddenInput = document.getElementById('alertTypeImageUrl');
  const imageNameHiddenInput = document.getElementById('alertTypeImageName');

  const soundFolderSelect = document.getElementById('alertSoundFolderSelect');
  const soundFileSelect = document.getElementById('alertSoundFileSelect');
  const soundPreview = document.getElementById('alertSoundPreview');
  const soundHiddenInput = document.getElementById('alertTypeSound');

  const recommendationInput = document.getElementById('alertRecommendationInput');
  const recommendationAddBtn = document.getElementById('alertRecommendationAddBtn');
  const recommendationsList = document.getElementById('alertRecommendationsList');

  const equipmentInput = document.getElementById('alertEquipmentInput');
  const equipmentAddBtn = document.getElementById('alertEquipmentAddBtn');
  const equipmentList = document.getElementById('alertEquipmentList');
  const statusFilter = document.getElementById('alertTypesStatusFilter');
  const createModalTitle = document.getElementById('createAlertTypeTitle');
  const createModalSubtitle = document.getElementById('createAlertTypeSubtitle');
  const submitBtnDefaultHTML = submitBtn ? submitBtn.innerHTML : '';
  let formMode = 'create';
  let editingAlertTypeId = null;
  let editingAlertTypeSnapshot = null;
  const viewAlertModalId = 'viewAlertTypeModal';
  let pendingRefreshTimeout = null;
  const viewAlertElements = {
    modal: () => document.getElementById(viewAlertModalId),
    title: document.getElementById('viewAlertTypeTitle'),
    subtitle: document.getElementById('viewAlertTypeSubtitle'),
    name: document.getElementById('alertDetailName'),
    description: document.getElementById('alertDetailDescription'),
    severity: document.getElementById('alertDetailSeverity'),
    colorSwatch: document.getElementById('alertDetailColorSwatch'),
    colorValue: document.getElementById('alertDetailColorValue'),
    active: document.getElementById('alertDetailActive'),
    company: document.getElementById('alertDetailCompany'),
    created: document.getElementById('alertDetailCreated'),
    updated: document.getElementById('alertDetailUpdated'),
    recommendations: document.getElementById('alertDetailRecommendations'),
    equipment: document.getElementById('alertDetailEquipment'),
    imagePreview: document.getElementById('alertDetailImagePreview'),
    audioContainer: document.getElementById('alertDetailAudioContainer'),
    feedback: document.getElementById('alertDetailFeedback'),
  };

  const deactivateState = {
    id: null,
    name: '',
    mode: 'deactivate',
  };
  const toggleButtons = document.querySelectorAll('[data-alert-type-toggle]');
  const editButtons = document.querySelectorAll('[data-alert-type-edit="true"]');

  const companiesState = {
    list: [],
    loaded: false,
    loading: false,
  };

  const assetsState = {
    folders: [],
    loaded: false,
    loading: false,
    filesByFolder: {},
  };

  const recommendationsState = [];
  const equipmentState = [];

  const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'aac', 'm4a'];

  if (window.modalManager && typeof window.modalManager.setupModal === 'function') {
    window.modalManager.setupModal(modalId, { closeOnBackdropClick: true });
    window.modalManager.setupModal(deactivateModalId, { closeOnBackdropClick: false });
  }

  function setAlertScope(isGlobal, { preserveCompany = false } = {}) {
    const globalState = Boolean(isGlobal);

    if (scopeToggle) {
      scopeToggle.checked = globalState;
    }

    if (companyGroup) {
      companyGroup.classList.toggle('is-scope-global', globalState);
    }

    if (companyInput) {
      companyInput.disabled = globalState;
      companyInput.placeholder = globalState
        ? 'Alerta global (sin empresa)'
        : 'Selecciona una empresa';

      if (globalState) {
        companyInput.setCustomValidity('');
        if (!preserveCompany) {
          companyInput.value = '';
        }
      }
    }

    if (companyHiddenInput && !preserveCompany && globalState) {
      companyHiddenInput.value = '';
    }

    if (companyLabelSuffix) {
      companyLabelSuffix.textContent = '(opcional)';
    }

    if (companyHelper) {
      companyHelper.textContent = globalState
        ? 'La alerta se aplicará a todas las empresas. No necesitas seleccionar una.'
        : 'Selecciona una empresa para asociarla o deja el campo vacío para que sea global.';
    }

    if (scopeWrapper) {
      scopeWrapper.classList.toggle('is-active', globalState);
    }

    if (scopeLabel) {
      scopeLabel.textContent = globalState
        ? 'Alerta global activada'
        : 'Convertir en alerta global';
    }
  }

  function resetForm() {
    if (!form) return;

    editingAlertTypeId = null;
    editingAlertTypeSnapshot = null;
    setFormMode('create');

    form.reset();
    setAlertScope(false);

    if (colorInput) {
      colorInput.value = '';
    }
    if (severitySelect) {
      severitySelect.value = '';
    }
    if (companyInput) {
      companyInput.value = '';
      companyInput.placeholder = 'Selecciona una empresa';
    }
    if (companyHiddenInput) {
      companyHiddenInput.value = '';
    }

    syncHiddenCompany('');

    resetMediaSelectors();
    updateImagePreview(null, '');
    updateSoundPreview(null, '');
    resetChipLists();
    hideFeedback();
  }

  function resetMediaSelectors() {
    if (imageFolderSelect) {
      imageFolderSelect.value = '';
    }
    if (imageFileSelect) {
      imageFileSelect.innerHTML = '<option value="">Selecciona un archivo</option>';
      imageFileSelect.disabled = true;
    }

    if (soundFolderSelect) {
      soundFolderSelect.value = '';
    }
    if (soundFileSelect) {
      soundFileSelect.innerHTML = '<option value="">Selecciona un archivo</option>';
      soundFileSelect.disabled = true;
    }

    if (imageHiddenInput) {
      imageHiddenInput.value = '';
    }
    if (imageUrlHiddenInput) {
      imageUrlHiddenInput.value = '';
    }
    if (imageNameHiddenInput) {
      imageNameHiddenInput.value = '';
    }
    if (soundHiddenInput) {
      soundHiddenInput.value = '';
    }
  }

  function showFeedback(message, options = {}) {
    const { type = 'error', useToast = true } = options;

    if (feedbackEl) {
      if (useToast) {
        feedbackEl.textContent = '';
        feedbackEl.classList.add('hidden');
      } else {
        feedbackEl.textContent = message;
        feedbackEl.classList.remove('hidden');
      }
    }

    if (useToast && message) {
      renderHardwareStyleToast(message, type);
    }
  }

  function scheduleAlertTypesRefresh(delay = 600) {
    if (typeof window === 'undefined') {
      return;
    }
    if (pendingRefreshTimeout) {
      window.clearTimeout(pendingRefreshTimeout);
    }
    pendingRefreshTimeout = window.setTimeout(() => {
      pendingRefreshTimeout = null;
      window.location.reload();
    }, Math.max(delay, 0));
  }

  function hideFeedback() {
    if (!feedbackEl) return;
    feedbackEl.textContent = '';
    feedbackEl.classList.add('hidden');
  }

  function getColorValue() {
    return (colorInput?.value || '').toString().trim();
  }

  function showDeactivateFeedback(message, options = {}) {
    const { type = 'error', useToast = true } = options;

    if (deactivateFeedback) {
      if (useToast) {
        deactivateFeedback.textContent = '';
        deactivateFeedback.classList.add('hidden');
      } else {
        deactivateFeedback.textContent = message;
        deactivateFeedback.classList.remove('hidden');
      }
    }

    if (useToast && message) {
      renderHardwareStyleToast(message, type);
    }
  }

  function hideDeactivateFeedback() {
    if (!deactivateFeedback) return;
    deactivateFeedback.textContent = '';
    deactivateFeedback.classList.add('hidden');
  }

  function setFormMode(mode, displayName = '') {
    const normalized = mode === 'edit' ? 'edit' : 'create';
    formMode = normalized;

    const isEdit = normalized === 'edit';
    if (createModalTitle) {
      createModalTitle.textContent = isEdit ? 'Editar tipo de alerta' : 'Nuevo tipo de alerta';
    }
    if (createModalSubtitle) {
      createModalSubtitle.textContent = isEdit
        ? (displayName ? `Modifica la configuración de ${displayName}` : 'Actualiza la configuración existente')
        : 'Define los atributos básicos y las recomendaciones iniciales';
    }
    if (submitBtn) {
      submitBtn.innerHTML = isEdit
        ? '<i class="fas fa-sync-alt mr-2"></i>Actualizar tipo de alerta'
        : (submitBtnDefaultHTML || '<i class="fas fa-save mr-2"></i>Guardar tipo de alerta');
    }
  }

  function mapSeverityToCode(value) {
    if (!value) return '';
    const normalized = value.toString().trim().toLowerCase();
    const mapping = {
      critica: 'ROJO',
      alta: 'NARANJA',
      media: 'AMARILLO',
      baja: 'VERDE',
    };
    return mapping[normalized] || value.toString().trim().toUpperCase();
  }

  function updateDeactivateControls() {
    if (!deactivateConfirmBtn) return;

    const hasId = Boolean(deactivateState.id);
    deactivateConfirmBtn.disabled = !hasId;
  }

  function getDeactivateConfirmIcon() {
    return document.getElementById('alertTypeDeactivateConfirmIcon');
  }

  function getDeactivateConfirmText() {
    return document.getElementById('alertTypeDeactivateConfirmText');
  }

  function setDetailText(element, value, fallback = '-') {
    if (!element) return;
    const normalized = (value ?? '').toString().trim();
    element.textContent = normalized || fallback;
  }

  function formatDateTime(value) {
    if (!value) return '-';
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        throw new Error('invalid date');
      }
      return date.toLocaleString('es-ES', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch (error) {
      return value;
    }
  }

  function renderDetailList(container, items, emptyMessage) {
    if (!container) return;
    container.innerHTML = '';
    const list = Array.isArray(items) ? items.filter((entry) => !!(entry ?? '').toString().trim()) : [];

    if (list.length === 0) {
      const placeholder = document.createElement('li');
      placeholder.textContent = emptyMessage;
      placeholder.style.listStyle = 'none';
      placeholder.style.color = 'rgba(148, 163, 184, 0.7)';
      placeholder.style.fontStyle = 'italic';
      container.appendChild(placeholder);
      return;
    }

    list.forEach((entry) => {
      const li = document.createElement('li');
      li.textContent = entry;
      container.appendChild(li);
    });
  }

  function resetAlertTypeModal() {
    setDetailText(viewAlertElements.name, '-');
    setDetailText(viewAlertElements.description, '-');
    setDetailText(viewAlertElements.severity, '-');
    setDetailText(viewAlertElements.colorSwatch, '-');
    setDetailText(viewAlertElements.colorValue, '-');
    setDetailText(viewAlertElements.active, '-');
    setDetailText(viewAlertElements.company, 'Global');
    setDetailText(viewAlertElements.created, '-');
    setDetailText(viewAlertElements.updated, '-');
    renderDetailList(viewAlertElements.recommendations, [], 'No hay recomendaciones registradas.');
    renderDetailList(viewAlertElements.equipment, [], 'No hay implementos configurados.');
    if (viewAlertElements.colorSwatch) {
      viewAlertElements.colorSwatch.style.color = '#ffffff';
    }
    if (viewAlertElements.severity) {
      viewAlertElements.severity.className = 'ios-status-badge';
    }
    if (viewAlertElements.imagePreview) {
      viewAlertElements.imagePreview.classList.remove('has-image');
      viewAlertElements.imagePreview.innerHTML = '';
    }
    if (viewAlertElements.audioContainer) {
      viewAlertElements.audioContainer.classList.remove('has-audio');
      viewAlertElements.audioContainer.innerHTML = '';
    }
    if (viewAlertElements.feedback) {
      viewAlertElements.feedback.textContent = '';
      viewAlertElements.feedback.classList.add('hidden');
    }
  }

  function showAlertTypeFeedback(message, options = {}) {
    const { type = 'error', useToast = true } = options;
    const feedback = viewAlertElements.feedback;

    if (feedback) {
      if (useToast) {
        feedback.textContent = '';
        feedback.classList.add('hidden');
      } else {
        feedback.textContent = message;
        feedback.classList.remove('hidden');
      }
    }

    if (useToast && message) {
      renderHardwareStyleToast(message, type);
    }
  }

  function hideAlertTypeFeedback() {
    if (!viewAlertElements.feedback) return;
    viewAlertElements.feedback.textContent = '';
    viewAlertElements.feedback.classList.add('hidden');
  }

  function populateAlertTypeModal(data) {
    resetAlertTypeModal();
    hideAlertTypeFeedback();

    if (!data || typeof data !== 'object') {
      showAlertTypeFeedback('No se obtuvo información del tipo de alerta.');
    } else {
      setDetailText(viewAlertElements.name, data.name, 'Tipo sin nombre');
      setDetailText(viewAlertElements.description, data.description, 'Sin descripción disponible.');

      if (viewAlertElements.subtitle) {
        setDetailText(viewAlertElements.subtitle, data.id ? `ID: ${data.id}` : 'Sin identificador');
      }

      if (viewAlertElements.severity) {
        const severity = (data.severity || 'desconocida').toLowerCase();
        const severityText = severity.charAt(0).toUpperCase() + severity.slice(1);
        viewAlertElements.severity.className = `ios-status-badge alert-severity-${severity}`;
        viewAlertElements.severity.textContent = severityText;
      }

      const colorValue = (data.color || '').trim();
      setDetailText(viewAlertElements.colorValue, colorValue || 'Sin color definido');
      if (viewAlertElements.colorSwatch) {
        viewAlertElements.colorSwatch.textContent = colorValue || 'Sin color';
        if (colorValue) {
          viewAlertElements.colorSwatch.style.color = colorValue;
        } else {
          viewAlertElements.colorSwatch.style.color = '#94a3b8';
        }
      }

      const isActive = data.active !== false;
      setDetailText(viewAlertElements.active, isActive ? 'Activa' : 'Inactiva');
      if (viewAlertElements.active) {
        viewAlertElements.active.style.color = isActive ? '#34d399' : '#f87171';
      }

      const companyName = (data.company_name || '').toString().trim();
      const companyId = (data.company_id || '').toString().trim();
      const companyLabel = companyName || (companyId ? `ID: ${companyId}` : 'Global');
      setDetailText(viewAlertElements.company, companyLabel || 'Global', 'Global');
      setDetailText(viewAlertElements.created, formatDateTime(data.created_at));
      setDetailText(viewAlertElements.updated, formatDateTime(data.updated_at));

      renderDetailList(viewAlertElements.recommendations, data.recommendations, 'No hay recomendaciones registradas.');
      renderDetailList(viewAlertElements.equipment, data.equipment, 'No hay implementos configurados.');

      const imageValue = data.image;
      if (viewAlertElements.imagePreview) {
        if (imageValue) {
          viewAlertElements.imagePreview.classList.add('has-image');
          viewAlertElements.imagePreview.innerHTML = `<img src="${imageValue}" alt="Imagen del tipo de alerta">`;
        } else {
          viewAlertElements.imagePreview.classList.remove('has-image');
          viewAlertElements.imagePreview.innerHTML = '';
        }
      }

      if (viewAlertElements.audioContainer) {
        if (data.sound) {
          viewAlertElements.audioContainer.classList.add('has-audio');
          viewAlertElements.audioContainer.innerHTML = `<audio controls preload="metadata" src="${data.sound}"></audio>`;
        } else {
          viewAlertElements.audioContainer.classList.remove('has-audio');
          viewAlertElements.audioContainer.innerHTML = '';
        }
      }
    }
  }

  function resetDeactivateModal() {
    deactivateState.id = null;
    deactivateState.name = '';
    deactivateState.mode = 'deactivate';

    hideDeactivateFeedback();
    if (deactivateConfirmBtn) {
      deactivateConfirmBtn.disabled = true;
    }
    if (deactivateIconWrapper) {
      deactivateIconWrapper.className = 'toggle-modal-icon deactivate mx-auto mb-4';
    }
    if (deactivateIcon) {
      deactivateIcon.className = 'fas fa-power-off text-4xl';
    }
    if (deactivateTitle) {
      deactivateTitle.textContent = 'Desactivar tipo de alerta';
    }
    if (deactivateMessage) {
      deactivateMessage.textContent = '¿Estás seguro de que quieres desactivar este tipo de alerta?';
    }
    const confirmIconEl = getDeactivateConfirmIcon();
    if (confirmIconEl) {
      confirmIconEl.className = 'fas fa-power-off mr-2';
    }
    const confirmTextEl = getDeactivateConfirmText();
    if (confirmTextEl) {
      confirmTextEl.textContent = 'Desactivar';
    }
    updateDeactivateControls();
  }

  function resetChipLists() {
    recommendationsState.length = 0;
    equipmentState.length = 0;
    renderChipList(recommendationsState, recommendationsList, 'recomendación');
    renderChipList(equipmentState, equipmentList, 'implemento');
  }

  function populateFormForEdit(data) {
    if (!form) return;

    const safeData = data || {};
    const displayName = (safeData.name || '').toString().trim();

    editingAlertTypeId = safeData.id || null;
    editingAlertTypeSnapshot = safeData;
    setFormMode('edit', displayName || 'el tipo seleccionado');

    const nameField = form.elements.namedItem('nombre');
    if (nameField) {
      nameField.value = displayName;
    }

    if (severitySelect) {
      severitySelect.value = mapSeverityToCode(safeData.severity);
    }

    if (colorInput) {
      colorInput.value = (safeData.color || '').toString();
    }

    const descriptionField = form.elements.namedItem('descripcion');
    if (descriptionField) {
      descriptionField.value = (safeData.description || '').toString();
    }

    const isGlobal = !safeData.company_id;
    setAlertScope(isGlobal, { preserveCompany: Boolean(safeData.company_id) });

    if (isGlobal) {
      selectCompanyById('');
      syncHiddenCompany('');
    } else {
      selectCompanyById(safeData.company_id || '');
    }

    recommendationsState.length = 0;
    if (Array.isArray(safeData.recommendations)) {
      safeData.recommendations
        .map((item) => (item ?? '').toString().trim())
        .filter(Boolean)
        .forEach((item) => recommendationsState.push(item));
    }
    renderChipList(recommendationsState, recommendationsList, 'recomendación');

    equipmentState.length = 0;
    if (Array.isArray(safeData.equipment)) {
      safeData.equipment
        .map((item) => (item ?? '').toString().trim())
        .filter(Boolean)
        .forEach((item) => equipmentState.push(item));
    }
    renderChipList(equipmentState, equipmentList, 'implemento');

    if (imageHiddenInput) {
      imageHiddenInput.value = safeData.image || '';
    }
    if (imageUrlHiddenInput) {
      imageUrlHiddenInput.value = '';
    }
    if (imageNameHiddenInput) {
      imageNameHiddenInput.value = safeData.image ? 'Imagen actual' : '';
    }
    updateImagePreview(safeData.image || null, safeData.image ? 'Imagen actual' : '');

    if (soundHiddenInput) {
      soundHiddenInput.value = safeData.sound || '';
    }
    updateSoundPreview(safeData.sound || null, safeData.sound ? 'Sonido actual' : '');

    hideFeedback();
  }

  function addRecommendation() {
    const value = recommendationInput?.value.trim();
    if (!value) return;
    if (recommendationsState.includes(value)) {
      showFeedback('Esta recomendación ya fue agregada.');
      return;
    }
    recommendationsState.push(value);
    recommendationInput.value = '';
    renderChipList(recommendationsState, recommendationsList, 'recomendación');
  }

  function removeRecommendation(index) {
    recommendationsState.splice(index, 1);
    renderChipList(recommendationsState, recommendationsList, 'recomendación');
  }

  function addEquipment() {
    const value = equipmentInput?.value.trim();
    if (!value) return;
    if (equipmentState.includes(value)) {
      showFeedback('Este implemento ya fue agregado.');
      return;
    }
    equipmentState.push(value);
    equipmentInput.value = '';
    renderChipList(equipmentState, equipmentList, 'implemento');
  }

  function removeEquipment(index) {
    equipmentState.splice(index, 1);
    renderChipList(equipmentState, equipmentList, 'implemento');
  }

  function renderChipList(list, container, label) {
    if (!container) return;
    if (!Array.isArray(list) || list.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = list
      .map((item, index) => `
        <span class="ios-chip">
          ${item}
          <button type="button" aria-label="Eliminar ${label}" data-chip-index="${index}">
            <i class="fas fa-times"></i>
          </button>
        </span>
      `)
      .join('');

    container.querySelectorAll('button[data-chip-index]').forEach((button) => {
      const index = Number(button.dataset.chipIndex);
      if (container === recommendationsList) {
        button.addEventListener('click', () => removeRecommendation(index));
      } else {
        button.addEventListener('click', () => removeEquipment(index));
      }
    });
  }

  async function ensureCompaniesLoaded() {
    if (companiesState.loaded || companiesState.loading || !companyInput || !companyDatalist) {
      return companiesState.list;
    }

    companiesState.loading = true;
    companyInput.placeholder = 'Cargando empresas...';

    try {
      let response;
      if (window.EndpointTestClient) {
        const client = new window.EndpointTestClient();
        response = await client.get_empresas();
      } else {
        response = await fetch(buildApiUrl('/api/empresas'), { credentials: 'include' });
      }

      if (!response || !response.ok) {
        throw new Error('No se pudo sincronizar el listado de empresas.');
      }

      const data = await response.json();
      const rawList = data?.data || data?.empresas || [];

      companiesState.list = Array.isArray(rawList)
        ? rawList.map((entry) => {
            const company = {
              id: entry._id || entry.id || '',
              name: entry.nombre || 'Sin nombre',
              nit: entry.nit || entry.identificacion || '',
              activa: entry.activa !== false,
            };
            company.display = buildCompanyDisplay(company);
            company.displayLower = company.display.toLowerCase();
            return company;
          })
        : [];

      renderCompanyDatalist(companiesState.list);
      companyInput.placeholder = 'Selecciona una empresa';
      companiesState.loaded = true;
    } catch (error) {
      console.error('Error loading companies for alert types:', error);
      showFeedback('No se pudieron cargar las empresas. Intenta nuevamente.');
      companiesState.list = [];
      renderCompanyDatalist(companiesState.list);
      companyInput.placeholder = 'Selecciona una empresa';
    } finally {
      companiesState.loading = false;
    }

    return companiesState.list;
  }

  function buildCompanyDisplay(company) {
    const statusBadge = company.activa ? '' : ' (Inactiva)';
    if (company.nit) {
      return `${company.name} • ${company.nit}${statusBadge}`;
    }
    return `${company.name}${statusBadge}`;
  }

  function renderCompanyDatalist(list) {
    if (!companyDatalist) return;
    companyDatalist.innerHTML = '';
    list.forEach((company) => {
      const option = document.createElement('option');
      option.value = company.display;
      companyDatalist.appendChild(option);
    });
  }

  function selectCompanyById(companyId) {
    if (!companyHiddenInput || !companyInput) return;
    if (!companyId) {
      companyHiddenInput.value = '';
      companyInput.value = '';
      syncHiddenCompany('');
      return;
    }
    const match = companiesState.list.find((company) => company.id === companyId);
    if (match) {
      companyInput.value = match.display;
      companyHiddenInput.value = match.id;
    } else {
      companyInput.value = '';
      companyHiddenInput.value = '';
    }

    syncHiddenCompany(companyInput.value || '');
  }

  function syncHiddenCompany(value) {
    if (!companyHiddenInput) return;
    if (scopeToggle?.checked) {
      companyHiddenInput.value = '';
      if (companyInput) {
        companyInput.setCustomValidity('');
      }
      return;
    }
    const normalized = value.trim().toLowerCase();
    const hasValue = normalized.length > 0;
    const match = companiesState.list.find((company) => company.displayLower === normalized);
    companyHiddenInput.value = match ? match.id : '';

    if (companyInput) {
      const validityMessage = match ? '' : (hasValue ? 'Selecciona una empresa válida' : '');
      companyInput.setCustomValidity(validityMessage);
    }
  }

  function handleCompanyInputChange(event) {
    syncHiddenCompany(event.target.value || '');
  }

  function handleCompanyInputBlur(event) {
    if (scopeToggle?.checked) {
      event.target.value = '';
      syncHiddenCompany('');
      return;
    }
    const value = event.target.value || '';
    const normalized = value.trim().toLowerCase();
    const match = companiesState.list.find((company) => company.displayLower === normalized);
    if (!match) {
      event.target.value = '';
      syncHiddenCompany('');
    }
  }

  function handleScopeToggleChange(event) {
    const isGlobal = Boolean(event?.target?.checked);
    setAlertScope(isGlobal);
    if (isGlobal) {
      syncHiddenCompany('');
    } else if (companyInput) {
      syncHiddenCompany(companyInput.value || '');
      companyInput.focus();
    }
  }

  async function ensureMediaFoldersLoaded() {
    if (assetsState.loaded || assetsState.loading || !imageFolderSelect || !soundFolderSelect) {
      return assetsState.folders;
    }

    assetsState.loading = true;

    try {
      const response = await fetch('/admin/image-assets/folders', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('No se pudo sincronizar el catálogo de archivos.');
      }

      const data = await response.json();
      const rawFolders = data?.folders || [];

      assetsState.folders = rawFolders.map((folder) => ({
        name: folder.name,
        display_name: folder.display_name || folder.name,
      }));

      assetsState.loaded = true;
    } catch (error) {
      console.error('Error loading media folders for alert types:', error);
      showFeedback('No se pudieron cargar los archivos multimedia.');
      assetsState.folders = [];
    } finally {
      assetsState.loading = false;
    }

    populateMediaFolderSelectors();
    return assetsState.folders;
  }

  function populateMediaFolderSelectors() {
    populateFolderSelect(imageFolderSelect, 'Selecciona una carpeta');
    populateFolderSelect(soundFolderSelect, 'Selecciona una carpeta');
  }

  function populateFolderSelect(selectElement, placeholder) {
    if (!selectElement) return;
    selectElement.innerHTML = `<option value="">${placeholder}</option>`;

    assetsState.folders.forEach((folder) => {
      const option = document.createElement('option');
      option.value = folder.name;
      option.textContent = folder.display_name;
      selectElement.appendChild(option);
    });

    selectElement.value = '';
  }

  async function ensureFormResourcesLoaded() {
    await Promise.all([
      ensureCompaniesLoaded(),
      ensureMediaFoldersLoaded(),
    ]);

    renderCompanyDatalist(companiesState.list);
    populateMediaFolderSelectors();
  }

  async function handleImageFolderChange(event) {
    const folder = event.target.value;
    if (!folder) {
      if (imageFileSelect) {
        imageFileSelect.innerHTML = '<option value="">Selecciona un archivo</option>';
        imageFileSelect.disabled = true;
      }
      if (imageHiddenInput) {
        imageHiddenInput.value = '';
      }
      updateImagePreview(null, '');
      return;
    }

    const files = await loadFolderFiles(folder);
    const imageFiles = filterFilesByType(files, IMAGE_EXTENSIONS);
    populateFileSelect(imageFileSelect, imageFiles, 'Selecciona un archivo');

    if (imageFiles.length === 0) {
      showFeedback('La carpeta seleccionada no contiene imágenes compatibles.');
    }

    if (imageHiddenInput) {
      imageHiddenInput.value = '';
    }
    if (imageUrlHiddenInput) {
      imageUrlHiddenInput.value = '';
    }
    updateImagePreview(null, '');
  }

  async function handleSoundFolderChange(event) {
    const folder = event.target.value;
    if (!folder) {
      if (soundFileSelect) {
        soundFileSelect.innerHTML = '<option value="">Selecciona un archivo</option>';
        soundFileSelect.disabled = true;
      }
      if (soundHiddenInput) {
        soundHiddenInput.value = '';
      }
      updateSoundPreview(null, '');
      return;
    }

    const files = await loadFolderFiles(folder);
    const audioFiles = filterFilesByType(files, AUDIO_EXTENSIONS);
    populateFileSelect(soundFileSelect, audioFiles, 'Selecciona un archivo');

    if (audioFiles.length === 0) {
      showFeedback('La carpeta seleccionada no contiene archivos de audio compatibles.');
    }

    if (soundHiddenInput) {
      soundHiddenInput.value = '';
    }
    updateSoundPreview(null, '');
  }

  async function loadFolderFiles(folder) {
    if (!folder) return [];
    if (assetsState.filesByFolder[folder]) {
      return assetsState.filesByFolder[folder];
    }

    try {
      const response = await fetch(`/admin/image-assets/folders/${encodeURIComponent(folder)}/files`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('No se pudieron recuperar los archivos de la carpeta seleccionada.');
      }

      const data = await response.json();
      const files = Array.isArray(data?.files) ? data.files : [];
      assetsState.filesByFolder[folder] = files;
      return files;
    } catch (error) {
      console.error(`Error fetching files for folder ${folder}:`, error);
      showFeedback('No fue posible obtener los archivos de la carpeta seleccionada.');
      assetsState.filesByFolder[folder] = [];
      return [];
    }
  }

  function filterFilesByType(files, extensions) {
    return files.filter((file) => {
      const name = (file?.name || '').toLowerCase();
      return extensions.some((ext) => name.endsWith(`.${ext}`));
    });
  }

  function populateFileSelect(selectElement, files, placeholder) {
    if (!selectElement) return;

    if (!Array.isArray(files) || files.length === 0) {
      selectElement.innerHTML = `<option value="">${placeholder} (sin archivos)</option>`;
      selectElement.disabled = true;
      return;
    }

    selectElement.disabled = false;
    selectElement.innerHTML = `<option value="">${placeholder}</option>`;

    files.forEach((file) => {
      const option = document.createElement('option');
      option.value = file.url;
      option.textContent = file.display_name || file.name;
      option.dataset.filename = file.name || file.display_name || '';
      selectElement.appendChild(option);
    });

    selectElement.value = '';
  }

  function handleImageFileChange(event) {
    const selectedOption = event.target.selectedOptions[0];
    const url = selectedOption?.value || '';
    const name = selectedOption?.dataset.filename || selectedOption?.textContent || '';

    if (imageUrlHiddenInput) {
      imageUrlHiddenInput.value = url || '';
    }
    if (imageNameHiddenInput) {
      imageNameHiddenInput.value = name || '';
    }

    updateImagePreview(url, name);

    if (imageHiddenInput) {
      imageHiddenInput.value = url || '';
    }
  }

  function handleSoundFileChange(event) {
    const selectedOption = event.target.selectedOptions[0];
    const url = selectedOption?.value || '';
    const name = selectedOption?.dataset.filename || selectedOption?.textContent || '';

    if (soundHiddenInput) {
      soundHiddenInput.value = url || '';
    }

    updateSoundPreview(url, name);
  }

  function updateImagePreview(url, name) {
    if (!imagePreview) return;

    imagePreview.classList.toggle('has-media', Boolean(url));

    if (!url) {
      imagePreview.innerHTML = `
        <div class="ios-file-preview__placeholder">
          <i class="fas fa-image"></i>
          <span>No se ha seleccionado imagen</span>
        </div>`;
      return;
    }

    imagePreview.innerHTML = `
      <img src="${url}" alt="${name || 'Imagen seleccionada'}" class="ios-file-preview__thumb" loading="lazy">
    `;
  }

  function updateSoundPreview(url, name) {
    if (!soundPreview) return;

    soundPreview.classList.toggle('has-media', Boolean(url));

    if (!url) {
      soundPreview.innerHTML = `
        <div class="ios-file-preview__placeholder">
          <i class="fas fa-volume-up"></i>
          <span>No se ha seleccionado sonido</span>
        </div>`;
      return;
    }

    soundPreview.innerHTML = `
      <div class="ios-file-preview__content">
        <div class="ios-file-preview__content-icon">
          <i class="fas fa-volume-up"></i>
        </div>
        <div class="ios-file-preview__content-body">
          <p class="ios-file-preview__title">${name || 'Sonido seleccionado'}</p>
          <audio controls preload="metadata" src="${url}"></audio>
        </div>
      </div>`;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form || !submitBtn) return;

    hideFeedback();

    const payload = {
      nombre: (form.elements.namedItem('nombre')?.value || '').toString().trim(),
      descripcion: (form.elements.namedItem('descripcion')?.value || '').toString().trim(),
      tipo_alerta: (severitySelect?.value || '').toString().trim().toUpperCase(),
      color_alerta: getColorValue(),
      imagen_base64: imageHiddenInput?.value || null,
      imagen_url: imageUrlHiddenInput?.value || null,
      imagen_nombre: imageNameHiddenInput?.value || null,
      sonido_link: soundHiddenInput?.value || null,
      recomendaciones: [...recommendationsState],
      implementos_necesarios: [...equipmentState],
    };

    if (!payload.imagen_base64 && editingAlertTypeSnapshot?.image) {
      payload.imagen_base64 = editingAlertTypeSnapshot.image;
    }
    if (!payload.sonido_link && editingAlertTypeSnapshot?.sound) {
      payload.sonido_link = editingAlertTypeSnapshot.sound;
    }

    const isGlobalToggle = Boolean(scopeToggle?.checked);
    const empresaId = (companyHiddenInput?.value || '').trim();
    const companyDisplay = (companyInput?.value || '').trim();
    const hasCompanySelection = empresaId.length > 0;
    const typedButNoMatch = !isGlobalToggle && !hasCompanySelection && companyDisplay.length > 0;

    if (typedButNoMatch) {
      showFeedback('Selecciona una empresa válida o marca el alcance global.');
      if (companyInput) {
        companyInput.focus();
        companyInput.setCustomValidity('Selecciona una empresa válida');
        companyInput.reportValidity();
      }
      return;
    }

    if (companyInput) {
      companyInput.setCustomValidity('');
    }

    payload.empresa_id = (isGlobalToggle || !hasCompanySelection) ? '' : empresaId;

    const missing = ['nombre', 'descripcion', 'tipo_alerta', 'color_alerta']
      .filter((field) => !payload[field]);

    if (missing.length > 0) {
      showFeedback(`Completa los campos obligatorios: ${missing.join(', ')}`);
      return;
    }

    const originalContent = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Guardando...';

    try {
      const isEditing = Boolean(editingAlertTypeId);
      const endpoint = isEditing
        ? `/admin/alert-types/${encodeURIComponent(editingAlertTypeId)}/update`
        : '/admin/alert-types/create';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({ success: false, message: 'Error al interpretar la respuesta del servidor.' }));

      if (!response.ok || !data.success) {
        const fallbackMessage = isEditing
          ? 'No se pudo actualizar el tipo de alerta.'
          : 'No se pudo crear el tipo de alerta.';
        throw new Error(data.message || fallbackMessage);
      }

      closeCreateAlertTypeModal();
      const defaultSuccess = isEditing
        ? 'El tipo de alerta se actualizó correctamente.'
        : 'El tipo de alerta se registró correctamente.';
      showSuccessToast(data.message || defaultSuccess);
      scheduleAlertTypesRefresh();
    } catch (error) {
      console.error('Error creating alert type:', error);
      const fallback = Boolean(editingAlertTypeId)
        ? 'Ocurrió un error al actualizar el tipo de alerta.'
        : 'Ocurrió un error al crear el tipo de alerta.';
      showFeedback(error.message || fallback);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalContent;
    }
  }

  if (form) {
    form.addEventListener('submit', handleSubmit);
  }

  if (colorInput) {
    colorInput.addEventListener('input', () => {
      hideFeedback();
    });
  }

  updateDeactivateControls();

  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      const params = new URLSearchParams(window.location.search);
      const value = (statusFilter.value || 'active').toLowerCase();
      params.set('status', value);
      params.delete('page');
      const query = params.toString();
      const target = query ? `${window.location.pathname}?${query}` : window.location.pathname;
      window.location.href = target;
    });
  }

  if (toggleButtons.length > 0) {
    toggleButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        const target = event.currentTarget;
        const alertTypeId = target?.dataset?.alertTypeId;
        const alertTypeName = target?.dataset?.alertTypeName || '';
        const toggleMode = (target?.dataset?.alertTypeToggle || 'deactivate').toLowerCase();
        const normalizedMode = toggleMode === 'activate' ? 'activate' : 'deactivate';
        window.openToggleAlertTypeModal(alertTypeId, alertTypeName, normalizedMode);
      });
    });
  }

  if (editButtons.length > 0) {
    editButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        const target = event.currentTarget;
        const alertTypeId = target?.dataset?.alertTypeId;
        const alertTypeName = target?.dataset?.alertTypeName || '';
        window.openEditAlertTypeModal(alertTypeId, alertTypeName);
      });
    });
  }

  if (companyInput) {
    companyInput.addEventListener('input', handleCompanyInputChange);
    companyInput.addEventListener('change', handleCompanyInputChange);
    companyInput.addEventListener('blur', handleCompanyInputBlur);
  }

  if (scopeToggle) {
    scopeToggle.addEventListener('change', handleScopeToggleChange);
  }

  if (recommendationAddBtn && recommendationInput) {
    recommendationAddBtn.addEventListener('click', addRecommendation);
    recommendationInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        addRecommendation();
      }
    });
  }

  if (equipmentAddBtn && equipmentInput) {
    equipmentAddBtn.addEventListener('click', addEquipment);
    equipmentInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        addEquipment();
      }
    });
  }

  if (imageFolderSelect) {
    imageFolderSelect.addEventListener('change', handleImageFolderChange);
  }

  if (soundFolderSelect) {
    soundFolderSelect.addEventListener('change', handleSoundFolderChange);
  }

  if (imageFileSelect) {
    imageFileSelect.addEventListener('change', handleImageFileChange);
  }

  if (soundFileSelect) {
    soundFileSelect.addEventListener('change', handleSoundFileChange);
  }

  window.openCreateAlertTypeModal = async function() {
    resetForm();

    if (window.modalManager) {
      window.modalManager.openModal(modalId, { modalClass: 'ios-modal-open' });
    } else {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
      }
    }

    await ensureFormResourcesLoaded();
  };

  window.openEditAlertTypeModal = async function(alertTypeId, alertTypeName) {
    if (!alertTypeId) return;

    const displayName = (alertTypeName || '').toString().trim();

    resetForm();
    editingAlertTypeId = alertTypeId;
    setFormMode('edit', displayName || 'el tipo seleccionado');
    showFeedback('Cargando configuración del tipo de alerta...', { type: 'info', useToast: false });

    if (window.modalManager) {
      window.modalManager.openModal(modalId, { modalClass: 'ios-modal-open' });
    } else {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
      }
    }

    try {
      await ensureFormResourcesLoaded();
      const detail = await fetchAlertTypeDetail(alertTypeId);
      populateFormForEdit(detail || {});
      hideFeedback();
    } catch (error) {
      console.error('Error loading alert type for editing:', error);
      showFeedback(error.message || 'No se pudo cargar la información para editar este tipo de alerta.');
    }
  };

  window.closeCreateAlertTypeModal = function() {
    if (window.modalManager) {
      window.modalManager.closeModal(modalId);
    } else {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
      }
    }
    resetForm();
  };

  window.openToggleAlertTypeModal = function(alertTypeId, alertTypeName, mode = 'deactivate') {
    if (!alertTypeId) return;

    deactivateState.id = alertTypeId;
    deactivateState.name = (alertTypeName || '').toString();
    deactivateState.mode = mode === 'activate' ? 'activate' : 'deactivate';

    const isActivation = deactivateState.mode === 'activate';
    const nameFragment = deactivateState.name ? `"${deactivateState.name}"` : 'este tipo de alerta';

    if (deactivateMessage) {
      deactivateMessage.textContent = isActivation
        ? `¿Quieres reactivar ${nameFragment}?`
        : `¿Estás seguro de que quieres desactivar ${nameFragment}?`;
    }
    if (deactivateTitle) {
      deactivateTitle.textContent = isActivation ? 'Reactivar tipo de alerta' : 'Desactivar tipo de alerta';
    }
    if (deactivateIconWrapper) {
      const baseClass = 'toggle-modal-icon mx-auto mb-4';
      deactivateIconWrapper.className = `${baseClass} ${isActivation ? 'activate' : 'deactivate'}`;
    }
    if (deactivateIcon) {
      deactivateIcon.className = isActivation ? 'fas fa-redo text-4xl' : 'fas fa-power-off text-4xl';
    }
    const confirmIconEl = getDeactivateConfirmIcon();
    if (confirmIconEl) {
      confirmIconEl.className = isActivation ? 'fas fa-redo mr-2' : 'fas fa-power-off mr-2';
    }
    const confirmTextEl = getDeactivateConfirmText();
    if (confirmTextEl) {
      confirmTextEl.textContent = isActivation ? 'Reactivar' : 'Desactivar';
    }

    hideDeactivateFeedback();
    updateDeactivateControls();

    if (window.modalManager) {
      window.modalManager.openModal(deactivateModalId, { focusTrap: true });
    } else {
      const modal = document.getElementById(deactivateModalId);
      if (modal) {
        modal.classList.remove('hidden');
      }
    }
  };

  window.openDeactivateAlertTypeModal = function(alertTypeId, alertTypeName) {
    window.openToggleAlertTypeModal(alertTypeId, alertTypeName, 'deactivate');
  };

  window.closeDeactivateAlertTypeModal = function() {
    if (window.modalManager) {
      window.modalManager.closeModal(deactivateModalId);
    } else {
      const modal = document.getElementById(deactivateModalId);
      if (modal) {
        modal.classList.add('hidden');
      }
    }
    resetDeactivateModal();
  };

  window.confirmToggleAlertType = async function() {
    if (!deactivateState.id || !deactivateConfirmBtn) {
      return;
    }

    const isActivation = deactivateState.mode === 'activate';

    const originalContent = deactivateConfirmBtn.innerHTML;
    deactivateConfirmBtn.disabled = true;
    deactivateConfirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Procesando...';

    const endpoint = `/admin/alert-types/${encodeURIComponent(deactivateState.id)}/toggle`;

    const payload = {
      accion: isActivation ? 'activate' : 'deactivate',
    };

    const fetchOptions = {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    try {
      const response = await fetch(endpoint, fetchOptions);
      const data = await response.json().catch(() => ({ success: false }));

      if (!response.ok || !data.success) {
        const fallbackMessage = isActivation
          ? 'No se pudo reactivar el tipo de alerta.'
          : 'No se pudo desactivar el tipo de alerta.';
        throw new Error(data.message || fallbackMessage);
      }

      deactivateConfirmBtn.innerHTML = originalContent;
      closeDeactivateAlertTypeModal();
      const defaultSuccess = isActivation
        ? 'Tipo de alerta reactivado correctamente.'
        : 'Tipo de alerta desactivado correctamente.';
      showSuccessToast(data.message || defaultSuccess);
      scheduleAlertTypesRefresh();
    } catch (error) {
      showDeactivateFeedback(error.message || 'Ocurrió un error al actualizar el estado del tipo de alerta.');
      deactivateConfirmBtn.disabled = false;
      deactivateConfirmBtn.innerHTML = originalContent;
      updateDeactivateControls();
    }
  };

  window.confirmDeactivateAlertType = window.confirmToggleAlertType;

  if (!companyInput) {
    companiesState.loaded = true;
  }

  if (!imageFolderSelect || !soundFolderSelect) {
    assetsState.loaded = true;
  }

  function openAlertTypeModalShell() {
    const modal = viewAlertElements.modal();
    if (!modal) return;
    if (window.modalManager) {
      window.modalManager.openModal(viewAlertModalId, { focusTrap: true });
    } else {
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
      document.body.classList.add('modal-open');
    }
  }

  function closeAlertTypeModalShell() {
    const modal = viewAlertElements.modal();
    if (!modal) return;
    if (window.modalManager) {
      window.modalManager.closeModal(viewAlertModalId);
    } else {
      modal.classList.add('hidden');
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
    }
  }

  async function fetchAlertTypeDetail(alertTypeId) {
    const response = await fetch(`/admin/alert-types/${encodeURIComponent(alertTypeId)}/detail`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });

    const payload = await response.json().catch(() => ({ success: false }));
    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'No se pudo obtener la información del tipo de alerta.');
    }

    return payload.data;
  }

  window.viewAlertType = async function(alertTypeId) {
    if (!alertTypeId) {
      return;
    }

    resetAlertTypeModal();
    showAlertTypeFeedback('Cargando detalles...', { type: 'info', useToast: false });
    openAlertTypeModalShell();

    try {
      const detail = await fetchAlertTypeDetail(alertTypeId);
      populateAlertTypeModal(detail);
    } catch (error) {
      showAlertTypeFeedback(error.message || 'No se pudo cargar la información.');
    }
  };

  window.closeViewAlertTypeModal = function() {
    closeAlertTypeModalShell();
    resetAlertTypeModal();
  };

  const viewAlertModalElement = viewAlertElements.modal();
  if (viewAlertModalElement) {
    viewAlertModalElement.addEventListener('click', (event) => {
      if (event.target === viewAlertModalElement) {
        window.closeViewAlertTypeModal();
      }
    });
  }

  function showSuccessToast(message) {
    renderHardwareStyleToast(message, 'success');
  }

  function renderHardwareStyleToast(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.enhanced-notification');
    existingNotifications.forEach((toast) => toast.remove());

    const toast = document.createElement('div');
    toast.className = 'enhanced-notification fixed top-4 right-4 z-50 max-w-sm w-full';

    let iconClass = 'fas fa-info-circle';
    let bgClass = 'bg-blue-500';
    let borderClass = 'border-blue-600';

    if (type === 'success') {
      iconClass = 'fas fa-check-circle';
      bgClass = 'bg-green-500';
      borderClass = 'border-green-600';
    } else if (type === 'error') {
      iconClass = 'fas fa-exclamation-circle';
      bgClass = 'bg-red-500';
      borderClass = 'border-red-600';
    }

    toast.innerHTML = `
      <div class="${bgClass} ${borderClass} border-l-4 text-white p-4 rounded-lg shadow-xl backdrop-blur-sm">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <i class="${iconClass} text-xl"></i>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium">${message}</p>
          </div>
          <div class="ml-auto pl-3">
            <button type="button" data-toast-close aria-label="Cerrar notificación" class="text-white/80 hover:text-white transition-colors">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    toast.querySelector('[data-toast-close]').addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      toast.remove();
    });

    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 4000);
  }

})();
