(() => {
  const NAME_LIMIT = 24;
  const DESCRIPTION_LIMIT = 65;
  const DEFAULT_COLOR = '#1d4ed8';
  const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'aac', 'm4a'];

  class AdminAlertTypesMain {
    constructor() {
      this.apiClient = null;
      this.alertTypes = [];
      this.statusFilter = 'active';
      this.initialized = false;
      this.isLoading = false;
      this.isSubmitting = false;
      this.batchSize = 3;
      this.visibleAlertTypesCount = 0;
      this.lazyObserver = null;
      this.lazySentinel = null;
      this.lazyButton = null;
      this.elements = {};

      this.editingAlertTypeId = null;
      this.editingSnapshot = null;
      this.toggleState = { id: null, mode: 'deactivate', name: '' };

      this.recommendations = [];
      this.equipment = [];

      this.companiesState = { list: [], loaded: false, loading: false };
      this.assetsState = { folders: [], loaded: false, loading: false, filesByFolder: {} };

      this.init();
    }

    init() {
      if (this.initialized) {
        this.activate();
        return;
      }

      this.cacheElements();
      if (!this.elements.grid) {
        return;
      }

      this.bindEvents();
      this.setupApiClient();
      this.statusFilter = this.elements.statusFilter?.value || 'active';
      this.updateNameCounter('');
      this.updateDescriptionCounter('');
      this.loadAlertTypes();
      this.initialized = true;
    }

    activate() {
      this.cacheElements();
      if (this.alertTypes.length) {
        this.renderAlertTypes(this.alertTypes);
      }
    }

    cacheElements() {
      const root = document.querySelector('[data-spa-section="alert-types"]') || document;
      this.elements.sectionRoot = root;
      this.elements.grid = root.querySelector('#alertTypesGrid');
      this.elements.emptyState = root.querySelector('#alertTypesEmpty');
      this.elements.statusFilter = root.querySelector('#alertTypesStatusFilter');
      this.elements.totalCount = root.querySelector('#alertTypesTotalCount');
      this.elements.activeCount = root.querySelector('#alertTypesActiveCount');
      this.elements.criticalCount = root.querySelector('#alertTypesCriticalCount');

      this.elements.modal = document.getElementById('createAlertTypeModal');
      this.elements.form = document.getElementById('createAlertTypeForm');
      this.elements.formFeedback = document.getElementById('alertTypeFormFeedback');
      this.elements.submitBtn = document.getElementById('createAlertTypeSubmit');
      this.elements.nameInput = document.getElementById('alertTypeName');
      this.elements.nameCounter = document.getElementById('alertTypeNameCounter');
      this.elements.descriptionInput = document.getElementById('alertTypeDescription');
      this.elements.descriptionCounter = document.getElementById('alertTypeDescriptionCounter');
      this.elements.severitySelect = document.getElementById('alertTypeSeverity');
      this.elements.colorInput = document.getElementById('alertTypeColor');

      this.elements.companySelect = document.getElementById('alertTypeCompanySelect');
      this.elements.scopeToggle = document.getElementById('alertTypeScopeGlobal');
      this.elements.companyGroup = document.getElementById('alertTypeCompanyGroup');
      this.elements.companyHelper = document.getElementById('alertTypeCompanyHelper');
      this.elements.scopeWrapper = document.getElementById('alertTypeScopeWrapper');
      this.elements.scopeLabel = document.getElementById('alertTypeScopeLabel');

      this.elements.imageFolderSelect = document.getElementById('alertImageFolderSelect');
      this.elements.imageFileSelect = document.getElementById('alertImageFileSelect');
      this.elements.imagePreview = document.getElementById('alertImagePreview');
      this.elements.imageHiddenInput = document.getElementById('alertTypeImage');
      this.elements.imageUrlHiddenInput = document.getElementById('alertTypeImageUrl');
      this.elements.imageNameHiddenInput = document.getElementById('alertTypeImageName');

      this.elements.soundFolderSelect = document.getElementById('alertSoundFolderSelect');
      this.elements.soundFileSelect = document.getElementById('alertSoundFileSelect');
      this.elements.soundPreview = document.getElementById('alertSoundPreview');
      this.elements.soundHiddenInput = document.getElementById('alertTypeSound');

      this.elements.recommendationInput = document.getElementById('alertRecommendationInput');
      this.elements.recommendationAddBtn = document.getElementById('alertRecommendationAddBtn');
      this.elements.recommendationsList = document.getElementById('alertRecommendationsList');

      this.elements.equipmentInput = document.getElementById('alertEquipmentInput');
      this.elements.equipmentAddBtn = document.getElementById('alertEquipmentAddBtn');
      this.elements.equipmentList = document.getElementById('alertEquipmentList');

      this.elements.toggleModal = document.getElementById('toggleAlertTypeModal');
      this.elements.toggleTitle = document.getElementById('toggleAlertTypeTitle');
      this.elements.toggleMessage = document.getElementById('toggleAlertTypeMessage');
      this.elements.toggleFeedback = document.getElementById('alertTypeDeactivateFeedback');
      this.elements.toggleConfirmBtn = document.getElementById('alertTypeDeactivateConfirmBtn');
      this.elements.toggleConfirmIcon = document.getElementById('alertTypeDeactivateConfirmIcon');
      this.elements.toggleConfirmText = document.getElementById('alertTypeDeactivateConfirmText');
      this.elements.toggleIconWrapper = document.getElementById('toggleAlertTypeIcon');
      this.elements.toggleIcon = document.getElementById('toggleAlertTypeIconFa');

      this.elements.viewModal = document.getElementById('viewAlertTypeModal');
      this.elements.viewName = document.getElementById('alertDetailName');
      this.elements.viewDescription = document.getElementById('alertDetailDescription');
      this.elements.viewSeverity = document.getElementById('alertDetailSeverity');
      this.elements.viewColorSwatch = document.getElementById('alertDetailColorSwatch');
      this.elements.viewColorValue = document.getElementById('alertDetailColorValue');
      this.elements.viewActive = document.getElementById('alertDetailActive');
      this.elements.viewCompany = document.getElementById('alertDetailCompany');
      this.elements.viewCreated = document.getElementById('alertDetailCreated');
      this.elements.viewUpdated = document.getElementById('alertDetailUpdated');
      this.elements.viewRecommendations = document.getElementById('alertDetailRecommendations');
      this.elements.viewEquipment = document.getElementById('alertDetailEquipment');
      this.elements.viewMediaContainer = document.getElementById('alertDetailMediaContainer');
      this.elements.viewImagePreview = document.getElementById('alertDetailImagePreview');
      this.elements.viewAudioContainer = document.getElementById('alertDetailAudioContainer');
      this.elements.viewFeedback = document.getElementById('alertDetailFeedback');

      this.elements.updateModal = document.getElementById('alertTypeUpdateModal');
      this.elements.updateTitle = document.getElementById('alertTypeUpdateTitle');
      this.elements.updateMessage = document.getElementById('alertTypeUpdateMessage');
      this.elements.updateIcon = document.getElementById('alertTypeUpdateIcon');
      this.elements.updateIconFa = document.getElementById('alertTypeUpdateIconFa');
    }

    bindEvents() {
      if (this.elements.statusFilter) {
        this.elements.statusFilter.addEventListener('change', () => {
          this.statusFilter = this.elements.statusFilter.value || 'active';
          this.loadAlertTypes();
        });
      }

      if (this.elements.grid) {
        this.elements.grid.addEventListener('click', (event) => {
          const button = event.target.closest('[data-alert-action]');
          if (!button) return;

          const alertId = button.dataset.alertId;
          const alertName = button.dataset.alertName || '';
          const action = button.dataset.alertAction;
          const mode = button.dataset.alertMode;

          if (!alertId) return;

          if (action === 'view') {
            this.openViewAlertTypeModal(alertId);
          } else if (action === 'edit') {
            this.openEditAlertTypeModal(alertId, alertName);
          } else if (action === 'toggle') {
            this.openToggleAlertTypeModal(alertId, alertName, mode || 'deactivate');
          } else if (action === 'delete') {
            this.openToggleAlertTypeModal(alertId, alertName, 'delete');
          }
        });
      }

      if (this.elements.form) {
        this.elements.form.addEventListener('submit', (event) => this.handleSubmit(event));
      }

      if (this.elements.nameInput) {
        this.elements.nameInput.addEventListener('input', () => {
          const value = this.elements.nameInput.value || '';
          if (value.length > NAME_LIMIT) {
            this.elements.nameInput.value = value.slice(0, NAME_LIMIT);
          }
          this.updateNameCounter(this.elements.nameInput.value || '');
        });
      }

      if (this.elements.descriptionInput) {
        this.elements.descriptionInput.addEventListener('input', () => {
          this.updateDescriptionCounter(this.elements.descriptionInput.value || '');
        });
      }

      if (this.elements.companySelect) {
        this.elements.companySelect.addEventListener('change', () => this.hideFormFeedback());
      }

      if (this.elements.scopeToggle) {
        this.elements.scopeToggle.addEventListener('change', (event) => this.handleScopeToggleChange(event));
      }

      if (this.elements.recommendationAddBtn && this.elements.recommendationInput) {
        this.elements.recommendationAddBtn.addEventListener('click', () => this.addRecommendation());
        this.elements.recommendationInput.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            this.addRecommendation();
          }
        });
      }

      if (this.elements.equipmentAddBtn && this.elements.equipmentInput) {
        this.elements.equipmentAddBtn.addEventListener('click', () => this.addEquipment());
        this.elements.equipmentInput.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            this.addEquipment();
          }
        });
      }

      if (this.elements.imageFolderSelect) {
        this.elements.imageFolderSelect.addEventListener('change', (event) => this.handleImageFolderChange(event));
      }

      if (this.elements.soundFolderSelect) {
        this.elements.soundFolderSelect.addEventListener('change', (event) => this.handleSoundFolderChange(event));
      }

      if (this.elements.imageFileSelect) {
        this.elements.imageFileSelect.addEventListener('change', (event) => this.handleImageFileChange(event));
      }

      if (this.elements.soundFileSelect) {
        this.elements.soundFileSelect.addEventListener('change', (event) => this.handleSoundFileChange(event));
      }

      if (window.modalManager?.setupModal) {
        if (this.elements.modal) {
          window.modalManager.setupModal('createAlertTypeModal', { closeOnBackdropClick: false });
        }
        if (this.elements.toggleModal) {
          window.modalManager.setupModal('toggleAlertTypeModal', { closeOnBackdropClick: false });
        }
        if (this.elements.viewModal) {
          window.modalManager.setupModal('viewAlertTypeModal', { closeOnBackdropClick: true });
        }
        if (this.elements.updateModal) {
          window.modalManager.setupModal('alertTypeUpdateModal', { closeOnBackdropClick: true });
        }
      }

      if (this.elements.viewModal) {
        this.elements.viewModal.addEventListener('click', (event) => {
          if (event.target === this.elements.viewModal) {
            this.closeViewAlertTypeModal();
          }
        });
      }
    }

    setupApiClient() {
      if (window.AdminSpaApi?.getClient) {
        const client = window.AdminSpaApi.getClient();
        if (client) {
          this.apiClient = client;
          return;
        }
      }

      if (window.apiClient) {
        this.apiClient = window.apiClient;
        return;
      }

      if (typeof window.EndpointTestClient !== 'undefined') {
        this.apiClient = new window.EndpointTestClient();
        return;
      }

      this.apiClient = null;
    }

    async loadAlertTypes() {
      if (this.isLoading) return;
      this.isLoading = true;
      this.renderLoadingState();

      try {
        const items = await this.fetchAlertTypes(this.statusFilter);
        this.alertTypes = items;
        this.updateStats(items);
        this.renderAlertTypes(items);
      } catch (error) {
        this.alertTypes = [];
        this.updateStats([]);
        this.renderErrorState('No se pudieron cargar los tipos de alerta.');
      } finally {
        this.isLoading = false;
      }
    }

    async fetchAlertTypes(status) {
      const endpointMap = {
        active: '/api/tipos-alarma/activos',
        inactive: '/api/tipos-alarma/inactivos',
        all: '/api/tipos-alarma'
      };

      const endpoint = endpointMap[status] || endpointMap.active;
      const params = new URLSearchParams({ page: '1', limit: '200' });
      const path = `${endpoint}?${params.toString()}`;

      let response;
      if (window.AdminSpaApi?.request) {
        response = await window.AdminSpaApi.request(path);
      } else {
        const url = this.buildApiUrl(path);
        response = await fetch(url, { credentials: 'include' });
      }

      if (!response || !response.ok) {
        throw new Error('Request failed');
      }

      const payload = await response.json();
      if (!payload || payload.success === false) {
        throw new Error(payload?.message || 'Invalid response');
      }

      const rawItems = payload.data || payload.alert_types || [];
      return Array.isArray(rawItems) ? rawItems.map((item) => this.mapAlertType(item)) : [];
    }

    mapAlertType(raw) {
      const companyRef = raw.empresa || raw.company || {};
      let companyName = '';
      if (companyRef && typeof companyRef === 'object') {
        companyName = companyRef.nombre || companyRef.name || '';
      } else {
        companyName = raw.empresa_nombre || raw.nombre_empresa || '';
      }

      return {
        id: raw._id || raw.id || '',
        name: raw.nombre || raw.name || '',
        description: raw.descripcion || raw.description || '',
        severity: this.mapSeverity(raw.tipo_alerta || raw.severity),
        color: (raw.color_alerta || raw.color || '').toString().trim(),
        image: raw.imagen_base64 || raw.image || '',
        sound: raw.sonido_link || raw.sound || '',
        recommendations: Array.isArray(raw.recomendaciones) ? raw.recomendaciones : (raw.recommendations || []),
        equipment: Array.isArray(raw.implementos_necesarios) ? raw.implementos_necesarios : (raw.equipment || []),
        company_id: raw.empresa_id || raw.company_id || '',
        company_name: companyName,
        active: raw.activo !== undefined ? Boolean(raw.activo) : (raw.active !== false),
        sla_minutes: raw.sla_minutos || raw.sla || raw.sla_minutes || 0,
        created_at: raw.fecha_creacion || raw.created_at || raw.createdAt || '',
        updated_at: raw.fecha_actualizacion || raw.updated_at || raw.updatedAt || ''
      };
    }

    mapSeverity(rawValue) {
      if (!rawValue) return 'desconocida';
      const normalized = rawValue.toString().trim().toUpperCase();
      const mapping = {
        ROJO: 'critica',
        NARANJA: 'alta',
        AMARILLO: 'media',
        VERDE: 'baja',
        CRITICA: 'critica',
        CRITICO: 'critica',
        ALTA: 'alta',
        MEDIA: 'media',
        BAJA: 'baja'
      };
      return mapping[normalized] || normalized.toLowerCase();
    }

    mapSeverityToRaw(severity) {
      const normalized = (severity || '').toString().trim().toLowerCase();
      const mapping = {
        critica: 'ROJO',
        alta: 'NARANJA',
        media: 'AMARILLO',
        baja: 'VERDE'
      };
      return mapping[normalized] || normalized.toUpperCase();
    }

    formatSeverityLabel(severity) {
      const normalized = (severity || '').toString().trim().toLowerCase();
      const labels = {
        critica: 'Critica',
        alta: 'Alta',
        media: 'Media',
        baja: 'Baja',
        desconocida: 'Sin prioridad'
      };
      return labels[normalized] || (severity ? severity : 'Sin prioridad');
    }

    formatStatusLabel(active) {
      return active ? 'Activa' : 'Inactiva';
    }

    updateStats(items) {
      const total = items.length;
      const active = items.filter((item) => item.active).length;
      const critical = items.filter((item) => item.severity === 'critica').length;

      if (this.elements.totalCount) this.elements.totalCount.textContent = total;
      if (this.elements.activeCount) this.elements.activeCount.textContent = active;
      if (this.elements.criticalCount) this.elements.criticalCount.textContent = critical;
    }

    renderLoadingState() {
      if (!this.elements.grid) return;
      this.resetGrid();
      const message = document.createElement('div');
      message.className = 'col-span-full text-center py-16';
      message.innerHTML = `
        <i class="fas fa-spinner fa-spin text-3xl text-blue-400 mb-4"></i>
        <h2 class="text-2xl font-bold text-white mb-2">Cargando tipos de alerta...</h2>
        <p class="text-gray-400">Sincronizando configuracion</p>
      `;
      this.elements.grid.appendChild(message);
      if (this.elements.emptyState) {
        this.elements.emptyState.classList.add('hidden');
      }
    }

    renderErrorState(message) {
      if (!this.elements.grid) return;
      this.resetGrid();
      const errorBox = document.createElement('div');
      errorBox.className = 'col-span-full text-center py-16';
      errorBox.innerHTML = `
        <i class="fas fa-triangle-exclamation text-3xl text-rose-400 mb-4"></i>
        <h2 class="text-2xl font-bold text-white mb-2">Ocurrio un problema</h2>
        <p class="text-gray-400">${this.escapeHtml(message)}</p>
        <button class="ios-action-btn mt-6" type="button">
          <i class="fas fa-rotate"></i>
          Reintentar
        </button>
      `;
      const retryButton = errorBox.querySelector('button');
      if (retryButton) {
        retryButton.addEventListener('click', () => this.loadAlertTypes());
      }
      this.elements.grid.appendChild(errorBox);
      if (this.elements.emptyState) {
        this.elements.emptyState.classList.add('hidden');
      }
    }

    renderAlertTypes(items) {
      if (!this.elements.grid) return;
      this.resetGrid();
      this.alertTypes = items;
      this.visibleAlertTypesCount = 0;
      this.removeLazySentinel();

      if (!items.length) {
        if (this.elements.emptyState) {
          this.elements.emptyState.classList.remove('hidden');
        }
        return;
      }

      if (this.elements.emptyState) {
        this.elements.emptyState.classList.add('hidden');
      }

      this.renderNextBatch();
    }

    resetGrid() {
      if (!this.elements.grid) return;
      this.removeLazySentinel();
      const emptyState = this.elements.emptyState;
      this.elements.grid.innerHTML = '';
      if (emptyState) {
        this.elements.grid.appendChild(emptyState);
      }
    }

    renderNextBatch() {
      if (!this.elements.grid) return;
      if (!this.alertTypes.length) return;

      const start = this.visibleAlertTypesCount;
      const nextItems = this.alertTypes.slice(start, start + this.batchSize);

      if (!nextItems.length) {
        this.removeLazySentinel();
        return;
      }

      const fragment = document.createDocumentFragment();
      nextItems.forEach((item) => {
        const card = this.createAlertTypeCard(item);
        fragment.appendChild(card);
      });
      this.elements.grid.appendChild(fragment);
      this.visibleAlertTypesCount += nextItems.length;

      if (this.visibleAlertTypesCount < this.alertTypes.length) {
        this.ensureLazySentinel();
      } else {
        this.removeLazySentinel();
      }
    }

    ensureLazySentinel() {
      if (!this.elements.grid) return;

      if (!this.lazySentinel) {
        const sentinel = document.createElement('div');
        sentinel.id = 'alertTypesLazySentinel';
        this.lazySentinel = sentinel;
      }

      const useManual = !('IntersectionObserver' in window);
      if (useManual) {
        this.lazySentinel.className = 'col-span-full flex justify-center py-4';
        if (!this.lazyButton) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'ios-action-btn';
          button.textContent = 'Cargar mas';
          button.addEventListener('click', () => this.renderNextBatch());
          this.lazyButton = button;
        }
        this.lazySentinel.innerHTML = '';
        this.lazySentinel.appendChild(this.lazyButton);
      } else {
        this.lazySentinel.className = 'col-span-full h-6';
        this.lazySentinel.innerHTML = '';
      }

      if (this.lazySentinel.parentElement !== this.elements.grid) {
        this.elements.grid.appendChild(this.lazySentinel);
      }

      if (!useManual) {
        this.setupLazyObserver();
      }
    }

    setupLazyObserver() {
      if (!this.lazySentinel || !('IntersectionObserver' in window)) return;

      if (this.lazyObserver) {
        this.lazyObserver.disconnect();
      }

      this.lazyObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.renderNextBatch();
          }
        });
      }, { root: null, rootMargin: '200px 0px', threshold: 0.1 });

      this.lazyObserver.observe(this.lazySentinel);
    }

    removeLazySentinel() {
      if (this.lazyObserver) {
        this.lazyObserver.disconnect();
      }
      if (this.lazySentinel && this.lazySentinel.parentElement) {
        this.lazySentinel.parentElement.removeChild(this.lazySentinel);
      }
    }

    createAlertTypeCard(item) {
      const card = document.createElement('article');
      const isGlobal = !item.company_id;
      const colorCss = this.resolveColorCss(item.color);
      const statusClass = item.active ? 'alert-status-active' : 'alert-status-inactive';
      const severityLabel = this.formatSeverityLabel(item.severity);
      const severityClass = `alert-severity-${(item.severity || 'desconocida').toString().toLowerCase()}`;

      card.className = `ios-hardware-card alert-type-card force-visible${isGlobal ? ' alert-type-card--global' : ''}`;
      card.dataset.status = item.active ? 'active' : 'inactive';
      card.dataset.severity = item.severity || 'desconocida';
      card.style.setProperty('--alert-type-color', colorCss);

      const imageMarkup = item.image
        ? `
        <figure class="alert-type-card__media">
          <img src="${this.escapeAttribute(item.image)}" alt="Imagen de ${this.escapeAttribute(item.name)}" loading="lazy">
        </figure>
        `
        : '';

      const recommendations = Array.isArray(item.recommendations) ? item.recommendations.slice(0, 4) : [];
      const equipment = Array.isArray(item.equipment) ? item.equipment.slice(0, 4) : [];

      const recommendationsMarkup = recommendations.length
        ? `
        <div class="alert-type-card__triggers">
          <p class="alert-type-card__section-title">
            <i class="fas fa-clipboard-list"></i>
            Recomendaciones
          </p>
          <ul class="alert-type-card__list">
            ${recommendations.map((rec) => `<li>${this.escapeHtml(rec)}</li>`).join('')}
          </ul>
        </div>
        `
        : '';

      const equipmentMarkup = equipment.length
        ? `
        <div class="alert-type-card__triggers">
          <p class="alert-type-card__section-title">
            <i class="fas fa-toolbox"></i>
            Implementos necesarios
          </p>
          <ul class="alert-type-card__list">
            ${equipment.map((eq) => `<li>${this.escapeHtml(eq)}</li>`).join('')}
          </ul>
        </div>
        `
        : '';

      const soundMarkup = item.sound
        ? `
        <div class="alert-type-card__sound">
          <div class="alert-type-card__sound-icon">
            <i class="fas fa-volume-up"></i>
          </div>
          <div class="alert-type-card__sound-player">
            <p class="alert-type-card__section-title">Sonido asignado</p>
            <audio controls preload="metadata" src="${this.escapeAttribute(item.sound)}" class="alert-type-card__audio"></audio>
          </div>
        </div>
        `
        : '';

      card.innerHTML = `
        <header class="alert-type-card__header">
          <div class="ios-card-icon">
            <i class="fas fa-bell"></i>
          </div>
          <div class="alert-type-card__badges">
            <span class="ios-status-badge alert-severity-badge ${severityClass}">${this.escapeHtml(severityLabel)}</span>
            <span class="ios-status-badge alert-status-badge ${statusClass}">${this.escapeHtml(this.formatStatusLabel(item.active))}</span>
            ${isGlobal ? '<span class="ios-status-badge alert-scope-badge">Global</span>' : ''}
          </div>
        </header>

        <h2 class="ios-card-title">${this.escapeHtml(item.name || 'Tipo sin nombre')}</h2>
        <p class="ios-card-subtitle">${this.escapeHtml(item.description || 'Sin descripcion disponible para este tipo de alerta.')}</p>

        <dl class="ios-card-info alert-type-card__info">
          <div class="ios-info-item">
            <dt class="ios-info-label"><i class="fas fa-stopwatch"></i> SLA</dt>
            <dd class="ios-info-value">${this.escapeHtml(String(item.sla_minutes || 0))} min</dd>
          </div>
          <div class="ios-info-item">
            <dt class="ios-info-label"><i class="fas fa-flag"></i> Prioridad</dt>
            <dd class="ios-info-value">${this.escapeHtml(severityLabel.toUpperCase())}</dd>
          </div>
          <div class="ios-info-item">
            <dt class="ios-info-label"><i class="fas fa-palette"></i> Color</dt>
            <dd class="ios-info-value">
              <span class="alert-type-color" style="background: ${this.escapeAttribute(colorCss)};"></span>
              ${this.escapeHtml(item.color || 'Sin color')}
            </dd>
          </div>
          <div class="ios-info-item">
            <dt class="ios-info-label"><i class="fas fa-clock"></i> Ultima actualizacion</dt>
            <dd class="ios-info-value">${this.escapeHtml(this.formatDate(item.updated_at || item.created_at))}</dd>
          </div>
          ${item.company_id ? `
          <div class="ios-info-item">
            <dt class="ios-info-label"><i class="fas fa-building"></i> Empresa</dt>
            <dd class="ios-info-value">${this.escapeHtml(item.company_name || item.company_id)}</dd>
          </div>
          ` : ''}
        </dl>

        ${imageMarkup}
        ${recommendationsMarkup}
        ${equipmentMarkup}
        ${soundMarkup}

        <div class="ios-card-actions alert-type-card__actions">
          <button type="button" class="ios-card-btn" data-alert-action="view" data-alert-id="${this.escapeAttribute(item.id)}" data-alert-name="${this.escapeAttribute(item.name)}" title="Ver detalle">
            <i class="fas fa-eye"></i>
          </button>
          <button type="button" class="ios-card-btn ios-card-btn-primary" data-alert-action="edit" data-alert-id="${this.escapeAttribute(item.id)}" data-alert-name="${this.escapeAttribute(item.name)}" title="Editar tipo de alerta">
            <i class="fas fa-edit"></i>
          </button>
          <button type="button" class="ios-card-btn ${item.active ? 'ios-card-btn-warning' : 'ios-card-btn-success'}" data-alert-action="toggle" data-alert-id="${this.escapeAttribute(item.id)}" data-alert-name="${this.escapeAttribute(item.name)}" data-alert-mode="${item.active ? 'deactivate' : 'activate'}" title="${item.active ? 'Desactivar' : 'Reactivar'} tipo de alerta">
            <i class="fas ${item.active ? 'fa-power-off' : 'fa-redo'}"></i>
          </button>
          <button type="button" class="ios-card-btn ios-card-btn-danger" data-alert-action="delete" data-alert-id="${this.escapeAttribute(item.id)}" data-alert-name="${this.escapeAttribute(item.name)}" title="Eliminar permanentemente">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;

      return card;
    }

    openCreateAlertTypeModal() {
      this.resetForm();
      this.editingAlertTypeId = null;
      this.editingSnapshot = null;
      this.setFormMode('create');

      if (window.modalManager) {
        window.modalManager.openModal('createAlertTypeModal', { modalClass: 'ios-modal-open' });
      } else if (this.elements.modal) {
        this.elements.modal.classList.remove('hidden');
        document.body.classList.add('ios-modal-open');
      }

      this.ensureFormResourcesLoaded();
    }

    async openEditAlertTypeModal(alertTypeId, alertTypeName) {
      if (!alertTypeId) return;
      this.resetForm();
      this.editingAlertTypeId = alertTypeId;
      this.setFormMode('edit', alertTypeName || 'el tipo seleccionado');
      this.showFormFeedback('Cargando configuracion del tipo de alerta...', 'info');

      if (window.modalManager) {
        window.modalManager.openModal('createAlertTypeModal', { modalClass: 'ios-modal-open' });
      } else if (this.elements.modal) {
        this.elements.modal.classList.remove('hidden');
        document.body.classList.add('ios-modal-open');
      }

      try {
        await this.ensureFormResourcesLoaded();
        const detail = await this.fetchAlertTypeDetail(alertTypeId);
        this.populateFormForEdit(detail || {});
        this.hideFormFeedback();
      } catch (error) {
        this.showFormFeedback(error.message || 'No se pudo cargar la informacion para editar.');
      }
    }

    closeCreateAlertTypeModal() {
      if (window.modalManager) {
        window.modalManager.closeModal('createAlertTypeModal');
      } else if (this.elements.modal) {
        this.elements.modal.classList.add('hidden');
        document.body.classList.remove('ios-modal-open');
      }
      this.resetForm();
    }

    openToggleAlertTypeModal(alertTypeId, alertTypeName, mode = 'deactivate') {
      if (!alertTypeId) return;
      this.toggleState.id = alertTypeId;
      this.toggleState.name = alertTypeName || '';
      this.toggleState.mode = mode === 'activate' ? 'activate' : (mode === 'delete' ? 'delete' : 'deactivate');

      const isActivation = this.toggleState.mode === 'activate';
      const isDeletion = this.toggleState.mode === 'delete';
      const nameFragment = this.toggleState.name ? `"${this.toggleState.name}"` : 'este tipo de alerta';

      if (this.elements.toggleMessage) {
        if (isActivation) {
          this.elements.toggleMessage.textContent = `Quieres reactivar ${nameFragment}?`;
        } else if (isDeletion) {
          this.elements.toggleMessage.textContent = `Esta accion eliminara ${nameFragment}. Deseas continuar?`;
        } else {
          this.elements.toggleMessage.textContent = `Estas seguro de que quieres desactivar ${nameFragment}?`;
        }
      }

      if (this.elements.toggleTitle) {
        if (isActivation) {
          this.elements.toggleTitle.textContent = 'Reactivar tipo de alerta';
        } else if (isDeletion) {
          this.elements.toggleTitle.textContent = 'Eliminar tipo de alerta';
        } else {
          this.elements.toggleTitle.textContent = 'Desactivar tipo de alerta';
        }
      }

      if (this.elements.toggleIconWrapper) {
        const baseClass = 'toggle-modal-icon mx-auto mb-4';
        const modifier = isActivation ? 'activate' : (isDeletion ? 'delete' : 'deactivate');
        this.elements.toggleIconWrapper.className = `${baseClass} ${modifier}`;
      }

      if (this.elements.toggleIcon) {
        if (isActivation) {
          this.elements.toggleIcon.className = 'fas fa-redo text-4xl';
        } else if (isDeletion) {
          this.elements.toggleIcon.className = 'fas fa-trash text-4xl';
        } else {
          this.elements.toggleIcon.className = 'fas fa-power-off text-4xl';
        }
      }

      if (this.elements.toggleConfirmIcon) {
        if (isActivation) {
          this.elements.toggleConfirmIcon.className = 'fas fa-redo mr-2';
        } else if (isDeletion) {
          this.elements.toggleConfirmIcon.className = 'fas fa-trash mr-2';
        } else {
          this.elements.toggleConfirmIcon.className = 'fas fa-power-off mr-2';
        }
      }

      if (this.elements.toggleConfirmText) {
        if (isActivation) {
          this.elements.toggleConfirmText.textContent = 'Reactivar';
        } else if (isDeletion) {
          this.elements.toggleConfirmText.textContent = 'Eliminar';
        } else {
          this.elements.toggleConfirmText.textContent = 'Desactivar';
        }
      }

      this.hideToggleFeedback();

      if (window.modalManager) {
        window.modalManager.openModal('toggleAlertTypeModal', { focusTrap: true, modalClass: 'ios-modal-open' });
      } else if (this.elements.toggleModal) {
        this.elements.toggleModal.classList.remove('hidden');
      }
    }

    closeDeactivateAlertTypeModal() {
      if (window.modalManager) {
        window.modalManager.closeModal('toggleAlertTypeModal');
      } else if (this.elements.toggleModal) {
        this.elements.toggleModal.classList.add('hidden');
      }
      this.toggleState = { id: null, mode: 'deactivate', name: '' };
    }

    async confirmToggleAlertType() {
      if (!this.toggleState.id || this.isSubmitting) return;

      const isActivation = this.toggleState.mode === 'activate';
      const isDeletion = this.toggleState.mode === 'delete';

      const originalContent = this.elements.toggleConfirmBtn?.innerHTML || '';
      if (this.elements.toggleConfirmBtn) {
        this.elements.toggleConfirmBtn.disabled = true;
        this.elements.toggleConfirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Procesando...';
      }

      try {
        let response;
        if (isDeletion) {
          response = await fetch(`/admin/alert-types/${encodeURIComponent(this.toggleState.id)}/delete`, {
            method: 'DELETE',
            credentials: 'include'
          });
        } else {
          const payload = { accion: isActivation ? 'activate' : 'deactivate' };
          response = await fetch(`/admin/alert-types/${encodeURIComponent(this.toggleState.id)}/toggle`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }

        const data = await response.json().catch(() => ({ success: false }));
        if (!response.ok || !data.success) {
          const fallback = isDeletion
            ? 'No se pudo eliminar el tipo de alerta.'
            : isActivation
              ? 'No se pudo reactivar el tipo de alerta.'
              : 'No se pudo desactivar el tipo de alerta.';
          throw new Error(data.message || fallback);
        }

        this.closeDeactivateAlertTypeModal();
        this.showUpdateModal(data.message || 'Operacion completada.');
        await this.loadAlertTypes();
      } catch (error) {
        const fallback = isDeletion
          ? 'Ocurrio un error al eliminar el tipo de alerta.'
          : 'Ocurrio un error al actualizar el estado del tipo de alerta.';
        this.showToggleFeedback(error.message || fallback);
      } finally {
        if (this.elements.toggleConfirmBtn) {
          this.elements.toggleConfirmBtn.disabled = false;
          this.elements.toggleConfirmBtn.innerHTML = originalContent;
        }
      }
    }

    async openViewAlertTypeModal(alertTypeId) {
      if (!alertTypeId) return;
      this.resetViewModal();
      this.showViewFeedback('Cargando detalles...', 'info');

      if (window.modalManager) {
        window.modalManager.openModal('viewAlertTypeModal', { focusTrap: true, modalClass: 'ios-modal-open' });
      } else if (this.elements.viewModal) {
        this.elements.viewModal.classList.remove('hidden');
        document.body.classList.add('ios-modal-open');
      }

      try {
        const detail = await this.fetchAlertTypeDetail(alertTypeId);
        this.populateViewModal(detail || {});
      } catch (error) {
        this.showViewFeedback(error.message || 'No se pudo cargar la informacion.');
      }
    }

    closeViewAlertTypeModal() {
      if (window.modalManager) {
        window.modalManager.closeModal('viewAlertTypeModal');
      } else if (this.elements.viewModal) {
        this.elements.viewModal.classList.add('hidden');
        document.body.classList.remove('ios-modal-open');
      }
      this.resetViewModal();
    }

    async fetchAlertTypeDetail(alertTypeId) {
      const response = await fetch(`/admin/alert-types/${encodeURIComponent(alertTypeId)}/detail`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });

      const payload = await response.json().catch(() => ({ success: false }));
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'No se pudo obtener la informacion del tipo de alerta.');
      }

      return payload.data || {};
    }

    async handleSubmit(event) {
      event.preventDefault();
      if (this.isSubmitting || !this.elements.form || !this.elements.submitBtn) return;

      this.hideFormFeedback();

      const rawName = (this.elements.nameInput?.value || '').toString().trim();
      if (rawName.length > NAME_LIMIT) {
        this.showFormFeedback(`El nombre no puede exceder ${NAME_LIMIT} caracteres.`);
        return;
      }

      const payload = {
        nombre: rawName,
        descripcion: (this.elements.descriptionInput?.value || '').toString().trim(),
        tipo_alerta: (this.elements.severitySelect?.value || '').toString().trim().toUpperCase(),
        color_alerta: (this.elements.colorInput?.value || '').toString().trim(),
        imagen_base64: this.elements.imageHiddenInput?.value || null,
        imagen_url: this.elements.imageUrlHiddenInput?.value || null,
        imagen_nombre: this.elements.imageNameHiddenInput?.value || null,
        sonido_link: this.elements.soundHiddenInput?.value || null,
        recomendaciones: [...this.recommendations],
        implementos_necesarios: [...this.equipment]
      };

      if (!payload.imagen_base64 && this.editingSnapshot?.image) {
        payload.imagen_base64 = this.editingSnapshot.image;
      }
      if (!payload.sonido_link && this.editingSnapshot?.sound) {
        payload.sonido_link = this.editingSnapshot.sound;
      }

      if (payload.descripcion.length > DESCRIPTION_LIMIT) {
        this.showFormFeedback(`La descripcion no puede exceder ${DESCRIPTION_LIMIT} caracteres.`);
        return;
      }

      const isGlobalToggle = Boolean(this.elements.scopeToggle?.checked);
      const empresaId = (this.elements.companySelect?.value || '').trim();
      const hasCompanySelection = empresaId.length > 0;

      if (!isGlobalToggle && !hasCompanySelection) {
        this.showFormFeedback('Selecciona una empresa o activa la alerta global.');
        if (this.elements.companySelect) {
          this.elements.companySelect.focus();
        }
        return;
      }

      payload.empresa_id = isGlobalToggle ? '' : empresaId;

      const missing = ['nombre', 'descripcion', 'tipo_alerta', 'color_alerta']
        .filter((field) => !payload[field]);

      if (missing.length) {
        this.showFormFeedback(`Completa los campos obligatorios: ${missing.join(', ')}`);
        return;
      }

      const originalContent = this.elements.submitBtn.innerHTML;
      this.elements.submitBtn.disabled = true;
      this.elements.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Guardando...';

      try {
        const isEditing = Boolean(this.editingAlertTypeId);
        const endpoint = isEditing
          ? `/admin/alert-types/${encodeURIComponent(this.editingAlertTypeId)}/update`
          : '/admin/alert-types/create';
        const method = isEditing ? 'PUT' : 'POST';

        const response = await fetch(endpoint, {
          method,
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({ success: false }));
        if (!response.ok || !data.success) {
          const fallback = isEditing
            ? 'No se pudo actualizar el tipo de alerta.'
            : 'No se pudo crear el tipo de alerta.';
          throw new Error(data.message || fallback);
        }

        this.closeCreateAlertTypeModal();
        const successMessage = isEditing
          ? 'El tipo de alerta se actualizo correctamente.'
          : 'El tipo de alerta se registro correctamente.';
        this.showUpdateModal(data.message || successMessage);
        await this.loadAlertTypes();
      } catch (error) {
        const fallback = this.editingAlertTypeId
          ? 'Ocurrio un error al actualizar el tipo de alerta.'
          : 'Ocurrio un error al crear el tipo de alerta.';
        this.showFormFeedback(error.message || fallback);
      } finally {
        this.elements.submitBtn.disabled = false;
        this.elements.submitBtn.innerHTML = originalContent;
      }
    }

    setFormMode(mode, name) {
      const title = document.getElementById('createAlertTypeTitle');
      const subtitle = document.getElementById('createAlertTypeSubtitle');
      const isEdit = mode === 'edit';

      if (title) {
        title.textContent = isEdit ? 'Editar tipo de alerta' : 'Nuevo tipo de alerta';
      }
      if (subtitle) {
        subtitle.textContent = isEdit
          ? `Actualiza la configuracion de ${name || 'este tipo'}`
          : 'Define los atributos basicos y las recomendaciones iniciales';
      }
      if (this.elements.submitBtn) {
        this.elements.submitBtn.innerHTML = isEdit
          ? '<i class="fas fa-sync-alt mr-2"></i>Actualizar tipo de alerta'
          : '<i class="fas fa-save mr-2"></i>Guardar tipo de alerta';
      }
    }

    resetForm() {
      if (this.elements.form) {
        this.elements.form.reset();
      }
      this.editingAlertTypeId = null;
      this.editingSnapshot = null;
      this.recommendations = [];
      this.equipment = [];
      this.renderChipList(this.elements.recommendationsList, this.recommendations, 'recomendacion');
      this.renderChipList(this.elements.equipmentList, this.equipment, 'implemento');
      this.updateNameCounter('');
      this.updateDescriptionCounter('');
      this.setAlertScope(false, { preserveCompany: false });
      if (this.elements.companySelect) this.elements.companySelect.value = '';
      this.updateImagePreview(null, '');
      this.updateSoundPreview(null, '');
      if (this.elements.imageHiddenInput) this.elements.imageHiddenInput.value = '';
      if (this.elements.imageUrlHiddenInput) this.elements.imageUrlHiddenInput.value = '';
      if (this.elements.imageNameHiddenInput) this.elements.imageNameHiddenInput.value = '';
      if (this.elements.soundHiddenInput) this.elements.soundHiddenInput.value = '';
      this.hideFormFeedback();
    }

    populateFormForEdit(detail) {
      this.editingSnapshot = detail;

      if (this.elements.nameInput) {
        this.elements.nameInput.value = detail.name || '';
        this.updateNameCounter(this.elements.nameInput.value || '');
      }
      if (this.elements.descriptionInput) {
        this.elements.descriptionInput.value = detail.description || '';
        this.updateDescriptionCounter(this.elements.descriptionInput.value || '');
      }
      if (this.elements.severitySelect) {
        this.elements.severitySelect.value = this.mapSeverityToRaw(detail.severity);
      }
      if (this.elements.colorInput) {
        this.elements.colorInput.value = detail.color || '';
      }

      const hasCompany = detail.company_id;
      this.setAlertScope(!hasCompany, { preserveCompany: true });

      if (this.elements.companySelect) {
        const match = this.companiesState.list.find((company) => company.id === detail.company_id);
        if (match) {
          this.elements.companySelect.value = match.id;
        } else if (detail.company_id) {
          const option = document.createElement('option');
          option.value = detail.company_id;
          option.textContent = detail.company_name || detail.company_id;
          this.elements.companySelect.appendChild(option);
          this.elements.companySelect.value = detail.company_id;
        } else {
          this.elements.companySelect.value = '';
        }
      }

      this.recommendations = Array.isArray(detail.recommendations) ? [...detail.recommendations] : [];
      this.equipment = Array.isArray(detail.equipment) ? [...detail.equipment] : [];
      this.renderChipList(this.elements.recommendationsList, this.recommendations, 'recomendacion');
      this.renderChipList(this.elements.equipmentList, this.equipment, 'implemento');

      if (this.elements.imageHiddenInput) {
        this.elements.imageHiddenInput.value = detail.image || '';
      }
      this.updateImagePreview(detail.image || null, detail.image ? 'Imagen seleccionada' : '');

      if (this.elements.soundHiddenInput) {
        this.elements.soundHiddenInput.value = detail.sound || '';
      }
      this.updateSoundPreview(detail.sound || null, detail.sound ? 'Sonido seleccionado' : '');
    }

    populateViewModal(detail) {
      const severity = this.mapSeverity(detail.severity || detail.tipo_alerta);
      const severityLabel = this.formatSeverityLabel(severity);
      const colorCss = this.resolveColorCss(detail.color || detail.color_alerta);

      if (this.elements.viewName) this.elements.viewName.textContent = detail.name || '-';
      if (this.elements.viewDescription) this.elements.viewDescription.textContent = detail.description || '-';
      if (this.elements.viewSeverity) {
        this.elements.viewSeverity.className = `ios-status-badge alert-severity-${severity}`;
        this.elements.viewSeverity.textContent = severityLabel;
      }
      if (this.elements.viewColorSwatch) {
        this.elements.viewColorSwatch.textContent = '';
        this.elements.viewColorSwatch.style.background = colorCss;
      }
      if (this.elements.viewColorValue) {
        this.elements.viewColorValue.textContent = detail.color || detail.color_alerta || 'Sin color';
      }
      if (this.elements.viewActive) {
        const active = detail.active !== false;
        this.elements.viewActive.textContent = this.formatStatusLabel(active);
      }
      if (this.elements.viewCompany) {
        this.elements.viewCompany.textContent = detail.company_name || detail.company_id || 'Global';
      }
      if (this.elements.viewCreated) {
        this.elements.viewCreated.textContent = this.formatDate(detail.created_at || detail.fecha_creacion);
      }
      if (this.elements.viewUpdated) {
        this.elements.viewUpdated.textContent = this.formatDate(detail.updated_at || detail.fecha_actualizacion);
      }

      this.renderDetailList(this.elements.viewRecommendations, detail.recommendations, 'Sin recomendaciones');
      this.renderDetailList(this.elements.viewEquipment, detail.equipment, 'Sin implementos');

      const hasImage = Boolean(detail.image);
      const hasSound = Boolean(detail.sound);
      if (this.elements.viewMediaContainer) {
        this.elements.viewMediaContainer.hidden = !(hasImage || hasSound);
      }

      if (this.elements.viewImagePreview) {
        this.elements.viewImagePreview.innerHTML = hasImage
          ? `<img src="${this.escapeAttribute(detail.image)}" alt="Imagen del tipo de alerta">`
          : '';
      }

      if (this.elements.viewAudioContainer) {
        this.elements.viewAudioContainer.innerHTML = hasSound
          ? `
            <p class="alert-type-card__section-title">Sonido asignado</p>
            <audio controls preload="metadata" src="${this.escapeAttribute(detail.sound)}"></audio>
          `
          : '';
      }

      this.hideViewFeedback();
    }

    resetViewModal() {
      this.hideViewFeedback();
      if (this.elements.viewRecommendations) this.elements.viewRecommendations.innerHTML = '';
      if (this.elements.viewEquipment) this.elements.viewEquipment.innerHTML = '';
      if (this.elements.viewImagePreview) this.elements.viewImagePreview.innerHTML = '';
      if (this.elements.viewAudioContainer) this.elements.viewAudioContainer.innerHTML = '';
    }

    renderDetailList(container, items, emptyMessage) {
      if (!container) return;
      const list = Array.isArray(items) ? items : [];
      container.innerHTML = '';

      if (!list.length) {
        const item = document.createElement('li');
        item.textContent = emptyMessage;
        container.appendChild(item);
        return;
      }

      list.forEach((value) => {
        const item = document.createElement('li');
        item.textContent = value;
        container.appendChild(item);
      });
    }

    updateNameCounter(value) {
      if (this.elements.nameCounter) {
        this.elements.nameCounter.textContent = `${(value || '').length}/${NAME_LIMIT}`;
      }
    }

    updateDescriptionCounter(value) {
      if (this.elements.descriptionCounter) {
        this.elements.descriptionCounter.textContent = `${(value || '').length}/${DESCRIPTION_LIMIT}`;
      }
    }

    addRecommendation() {
      const value = (this.elements.recommendationInput?.value || '').trim();
      if (!value) return;
      this.recommendations.push(value);
      this.elements.recommendationInput.value = '';
      this.renderChipList(this.elements.recommendationsList, this.recommendations, 'recomendacion');
    }

    addEquipment() {
      const value = (this.elements.equipmentInput?.value || '').trim();
      if (!value) return;
      this.equipment.push(value);
      this.elements.equipmentInput.value = '';
      this.renderChipList(this.elements.equipmentList, this.equipment, 'implemento');
    }

    renderChipList(container, list, label) {
      if (!container) return;

      if (!list || list.length === 0) {
        container.innerHTML = '<p class="text-xs text-white/60">Sin elementos</p>';
        return;
      }

      container.innerHTML = list
        .map((item, index) => `
          <span class="ios-chip">
            ${this.escapeHtml(item)}
            <button type="button" aria-label="Eliminar ${label}" data-chip-index="${index}">
              <i class="fas fa-times"></i>
            </button>
          </span>
        `)
        .join('');

      container.querySelectorAll('button[data-chip-index]').forEach((button) => {
        const index = Number(button.dataset.chipIndex);
        button.addEventListener('click', () => {
          if (container === this.elements.recommendationsList) {
            this.recommendations.splice(index, 1);
            this.renderChipList(this.elements.recommendationsList, this.recommendations, 'recomendacion');
          } else {
            this.equipment.splice(index, 1);
            this.renderChipList(this.elements.equipmentList, this.equipment, 'implemento');
          }
        });
      });
    }

    async ensureCompaniesLoaded() {
      if (this.companiesState.loaded || this.companiesState.loading || !this.elements.companySelect) {
        return this.companiesState.list;
      }

      this.companiesState.loading = true;
      this.elements.companySelect.disabled = true;
      this.renderCompanyOptions({ placeholder: 'Cargando empresas...' });

      try {
        let response;
        if (this.apiClient?.get_empresas) {
          response = await this.apiClient.get_empresas();
        } else if (window.AdminSpaApi?.request) {
          response = await window.AdminSpaApi.request('/api/empresas');
        } else {
          response = await fetch(this.buildApiUrl('/api/empresas'), { credentials: 'include' });
        }

        if (!response || !response.ok) {
          throw new Error('No se pudo sincronizar el listado de empresas.');
        }

        const data = await response.json();
        const rawList = data?.data || data?.empresas || [];

        this.companiesState.list = Array.isArray(rawList)
          ? rawList.map((entry) => {
              const company = {
                id: entry._id || entry.id || '',
                name: entry.nombre || 'Sin nombre',
                nit: entry.nit || entry.identificacion || '',
                activa: entry.activa !== false,
              };
              company.display = this.buildCompanyDisplay(company);
              return company;
            })
          : [];

        this.companiesState.loaded = true;
      } catch (error) {
        this.companiesState.list = [];
        this.showFormFeedback('No se pudieron cargar las empresas.');
      } finally {
        this.companiesState.loading = false;
        if (this.elements.companySelect) {
          this.elements.companySelect.disabled = false;
        }
        this.renderCompanyOptions();
      }

      return this.companiesState.list;
    }

    buildCompanyDisplay(company) {
      const statusBadge = company.activa ? '' : ' (Inactiva)';
      if (company.nit) {
        return `${company.name} • ${company.nit}${statusBadge}`;
      }
      return `${company.name}${statusBadge}`;
    }

    renderCompanyOptions({ placeholder } = {}) {
      if (!this.elements.companySelect) return;
      const currentValue = this.elements.companySelect.value;
      const label = placeholder || 'Selecciona una empresa';

      this.elements.companySelect.innerHTML = `<option value="">${label}</option>`;
      this.companiesState.list.forEach((company) => {
        const option = document.createElement('option');
        option.value = company.id;
        option.textContent = company.display;
        this.elements.companySelect.appendChild(option);
      });

      if (currentValue) {
        this.elements.companySelect.value = currentValue;
      }
    }

    handleScopeToggleChange(event) {
      const isGlobal = Boolean(event?.target?.checked);
      this.setAlertScope(isGlobal);
      if (isGlobal && this.elements.companySelect) {
        this.elements.companySelect.value = '';
      }
    }

    setAlertScope(isGlobal, { preserveCompany = false } = {}) {
      const globalState = Boolean(isGlobal);

      if (this.elements.scopeToggle) {
        this.elements.scopeToggle.checked = globalState;
      }

      if (this.elements.companyGroup) {
        this.elements.companyGroup.classList.toggle('is-scope-global', globalState);
      }

      if (this.elements.companySelect) {
        this.elements.companySelect.disabled = globalState;
        if (globalState && !preserveCompany) {
          this.elements.companySelect.value = '';
        }
      }

      if (this.elements.companyHelper) {
        this.elements.companyHelper.textContent = globalState
          ? 'Alerta global activada.'
          : 'Selecciona la empresa para asociar la alerta.';
      }

      if (this.elements.scopeWrapper) {
        this.elements.scopeWrapper.classList.toggle('is-active', globalState);
      }

      if (this.elements.scopeLabel) {
        this.elements.scopeLabel.textContent = globalState
          ? 'Alerta global activada'
          : 'Convertir en alerta global';
      }
    }

    async ensureMediaFoldersLoaded() {
      if (this.assetsState.loaded || this.assetsState.loading || !this.elements.imageFolderSelect || !this.elements.soundFolderSelect) {
        return this.assetsState.folders;
      }

      this.assetsState.loading = true;

      try {
        const response = await fetch('/admin/image-assets/folders', { credentials: 'include' });
        if (!response.ok) {
          throw new Error('No se pudo sincronizar el catalogo de archivos.');
        }

        const data = await response.json();
        const rawFolders = data?.folders || [];

        this.assetsState.folders = rawFolders.map((folder) => ({
          name: folder.name,
          display_name: folder.display_name || folder.name
        }));

        this.assetsState.loaded = true;
      } catch (error) {
        this.assetsState.folders = [];
        this.showFormFeedback('No se pudieron cargar los archivos multimedia.');
      } finally {
        this.assetsState.loading = false;
      }

      this.populateMediaFolderSelectors();
      return this.assetsState.folders;
    }

    populateMediaFolderSelectors() {
      this.populateFolderSelect(this.elements.imageFolderSelect, 'Selecciona una carpeta');
      this.populateFolderSelect(this.elements.soundFolderSelect, 'Selecciona una carpeta');
    }

    populateFolderSelect(selectElement, placeholder) {
      if (!selectElement) return;
      selectElement.innerHTML = `<option value="">${placeholder}</option>`;

      this.assetsState.folders.forEach((folder) => {
        const option = document.createElement('option');
        option.value = folder.name;
        option.textContent = folder.display_name;
        selectElement.appendChild(option);
      });

      selectElement.value = '';
    }

    async ensureFormResourcesLoaded() {
      await Promise.all([
        this.ensureCompaniesLoaded(),
        this.ensureMediaFoldersLoaded()
      ]);
      this.renderCompanyOptions();
      this.populateMediaFolderSelectors();
    }

    async handleImageFolderChange(event) {
      const folder = event.target.value;
      if (!folder) {
        this.resetImageSelect();
        return;
      }

      const files = await this.loadFolderFiles(folder);
      const imageFiles = this.filterFilesByType(files, IMAGE_EXTENSIONS);
      this.populateFileSelect(this.elements.imageFileSelect, imageFiles, 'Selecciona un archivo');

      if (imageFiles.length === 0) {
        this.showFormFeedback('La carpeta seleccionada no contiene imagenes compatibles.');
      }

      if (this.elements.imageHiddenInput) this.elements.imageHiddenInput.value = '';
      if (this.elements.imageUrlHiddenInput) this.elements.imageUrlHiddenInput.value = '';
      if (this.elements.imageNameHiddenInput) this.elements.imageNameHiddenInput.value = '';
      this.updateImagePreview(null, '');
    }

    async handleSoundFolderChange(event) {
      const folder = event.target.value;
      if (!folder) {
        this.resetSoundSelect();
        return;
      }

      const files = await this.loadFolderFiles(folder);
      const audioFiles = this.filterFilesByType(files, AUDIO_EXTENSIONS);
      this.populateFileSelect(this.elements.soundFileSelect, audioFiles, 'Selecciona un archivo');

      if (audioFiles.length === 0) {
        this.showFormFeedback('La carpeta seleccionada no contiene audios compatibles.');
      }

      if (this.elements.soundHiddenInput) this.elements.soundHiddenInput.value = '';
      this.updateSoundPreview(null, '');
    }

    async loadFolderFiles(folder) {
      if (!folder) return [];
      if (this.assetsState.filesByFolder[folder]) {
        return this.assetsState.filesByFolder[folder];
      }

      try {
        const response = await fetch(`/admin/image-assets/folders/${encodeURIComponent(folder)}/files`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('No se pudieron recuperar los archivos de la carpeta seleccionada.');
        }

        const data = await response.json();
        const files = Array.isArray(data?.files) ? data.files : [];
        this.assetsState.filesByFolder[folder] = files;
        return files;
      } catch (error) {
        this.assetsState.filesByFolder[folder] = [];
        this.showFormFeedback('No fue posible obtener los archivos de la carpeta seleccionada.');
        return [];
      }
    }

    filterFilesByType(files, extensions) {
      return files.filter((file) => {
        const name = (file?.name || '').toLowerCase();
        return extensions.some((ext) => name.endsWith(`.${ext}`));
      });
    }

    populateFileSelect(selectElement, files, placeholder) {
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
    }

    handleImageFileChange(event) {
      const selected = event.target.options[event.target.selectedIndex];
      const url = selected?.value || '';
      const filename = selected?.dataset?.filename || '';
      if (this.elements.imageHiddenInput) this.elements.imageHiddenInput.value = url;
      if (this.elements.imageUrlHiddenInput) this.elements.imageUrlHiddenInput.value = url;
      if (this.elements.imageNameHiddenInput) this.elements.imageNameHiddenInput.value = filename;
      this.updateImagePreview(url || null, filename);
    }

    handleSoundFileChange(event) {
      const selected = event.target.options[event.target.selectedIndex];
      const url = selected?.value || '';
      if (this.elements.soundHiddenInput) this.elements.soundHiddenInput.value = url;
      this.updateSoundPreview(url || null, '');
    }

    resetImageSelect() {
      if (this.elements.imageFileSelect) {
        this.elements.imageFileSelect.innerHTML = '<option value="">Selecciona un archivo</option>';
        this.elements.imageFileSelect.disabled = true;
      }
      if (this.elements.imageHiddenInput) this.elements.imageHiddenInput.value = '';
      if (this.elements.imageUrlHiddenInput) this.elements.imageUrlHiddenInput.value = '';
      if (this.elements.imageNameHiddenInput) this.elements.imageNameHiddenInput.value = '';
      this.updateImagePreview(null, '');
    }

    resetSoundSelect() {
      if (this.elements.soundFileSelect) {
        this.elements.soundFileSelect.innerHTML = '<option value="">Selecciona un archivo</option>';
        this.elements.soundFileSelect.disabled = true;
      }
      if (this.elements.soundHiddenInput) this.elements.soundHiddenInput.value = '';
      this.updateSoundPreview(null, '');
    }

    updateImagePreview(url, label) {
      if (!this.elements.imagePreview) return;

      if (!url) {
        this.elements.imagePreview.innerHTML = `
          <div class="ios-file-preview__placeholder">
            <i class="fas fa-image"></i>
            <span>No se ha seleccionado imagen</span>
          </div>
        `;
        return;
      }

      this.elements.imagePreview.innerHTML = `
        <img src="${this.escapeAttribute(url)}" alt="${this.escapeAttribute(label || 'Vista previa')}" loading="lazy">
      `;
    }

    updateSoundPreview(url) {
      if (!this.elements.soundPreview) return;

      if (!url) {
        this.elements.soundPreview.innerHTML = `
          <div class="ios-file-preview__placeholder">
            <i class="fas fa-volume-up"></i>
            <span>No se ha seleccionado sonido</span>
          </div>
        `;
        return;
      }

      this.elements.soundPreview.innerHTML = `
        <audio controls preload="metadata" src="${this.escapeAttribute(url)}"></audio>
      `;
    }

    showFormFeedback(message, type = 'error') {
      if (!this.elements.formFeedback) return;
      this.elements.formFeedback.textContent = message;
      this.elements.formFeedback.classList.remove('hidden');
      this.elements.formFeedback.classList.toggle('border-red-400', type === 'error');
      this.elements.formFeedback.classList.toggle('bg-red-500/20', type === 'error');
    }

    hideFormFeedback() {
      if (!this.elements.formFeedback) return;
      this.elements.formFeedback.textContent = '';
      this.elements.formFeedback.classList.add('hidden');
    }

    showToggleFeedback(message) {
      if (!this.elements.toggleFeedback) return;
      this.elements.toggleFeedback.textContent = message;
      this.elements.toggleFeedback.classList.remove('hidden');
    }

    hideToggleFeedback() {
      if (!this.elements.toggleFeedback) return;
      this.elements.toggleFeedback.textContent = '';
      this.elements.toggleFeedback.classList.add('hidden');
    }

    showViewFeedback(message, type = 'error') {
      if (!this.elements.viewFeedback) return;
      this.elements.viewFeedback.textContent = message;
      this.elements.viewFeedback.classList.remove('hidden');
      this.elements.viewFeedback.classList.toggle('border-red-400', type === 'error');
      this.elements.viewFeedback.classList.toggle('bg-red-500/20', type === 'error');
    }

    hideViewFeedback() {
      if (!this.elements.viewFeedback) return;
      this.elements.viewFeedback.textContent = '';
      this.elements.viewFeedback.classList.add('hidden');
    }

    showUpdateModal(message) {
      if (this.elements.updateMessage) {
        this.elements.updateMessage.textContent = message || 'Operacion completada.';
      }

      if (this.elements.updateTitle) {
        const lower = (message || '').toLowerCase();
        if (lower.includes('registro') || lower.includes('creo')) {
          this.elements.updateTitle.textContent = 'Tipo Registrado';
        } else if (lower.includes('actualizo')) {
          this.elements.updateTitle.textContent = 'Tipo Actualizado';
        } else if (lower.includes('reactivo') || lower.includes('activo')) {
          this.elements.updateTitle.textContent = 'Tipo Activado';
        } else if (lower.includes('desactivo')) {
          this.elements.updateTitle.textContent = 'Tipo Desactivado';
        } else if (lower.includes('elimino')) {
          this.elements.updateTitle.textContent = 'Tipo Eliminado';
        } else {
          this.elements.updateTitle.textContent = 'Operacion Exitosa';
        }
      }

      if (this.elements.updateIcon && this.elements.updateIconFa) {
        this.elements.updateIcon.className = 'client-update-icon mx-auto mb-4';
        this.elements.updateIconFa.className = 'fas fa-check-circle text-4xl text-emerald-400';
      }

      if (window.modalManager) {
        window.modalManager.openModal('alertTypeUpdateModal', { modalClass: 'ios-modal-open' });
      } else if (this.elements.updateModal) {
        this.elements.updateModal.classList.remove('hidden');
        document.body.classList.add('ios-modal-open');
      }
    }

    resolveColorCss(value) {
      const trimmed = (value || '').toString().trim();
      if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
        return trimmed;
      }
      return DEFAULT_COLOR;
    }

    formatDate(value) {
      if (!value) return 'Sin registro';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      return date.toLocaleString('es-ES');
    }

    buildApiUrl(path) {
      if (typeof window.__buildApiUrl === 'function') {
        return window.__buildApiUrl(path);
      }
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
    }

    escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    escapeAttribute(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
  }

  window.initAdminAlertTypesMain = () => {
    if (window.adminAlertTypesMain) {
      window.adminAlertTypesMain.activate();
      return window.adminAlertTypesMain;
    }
    window.adminAlertTypesMain = new AdminAlertTypesMain();
    return window.adminAlertTypesMain;
  };

  if (!window.ADMIN_SPA_MANUAL_INIT) {
    window.initAdminAlertTypesMain();
  }

  window.openCreateAlertTypeModal = () => window.adminAlertTypesMain?.openCreateAlertTypeModal();
  window.closeCreateAlertTypeModal = () => window.adminAlertTypesMain?.closeCreateAlertTypeModal();
  window.openEditAlertTypeModal = (id, name) => window.adminAlertTypesMain?.openEditAlertTypeModal(id, name);
  window.openToggleAlertTypeModal = (id, name, mode) => window.adminAlertTypesMain?.openToggleAlertTypeModal(id, name, mode);
  window.closeDeactivateAlertTypeModal = () => window.adminAlertTypesMain?.closeDeactivateAlertTypeModal();
  window.confirmToggleAlertType = () => window.adminAlertTypesMain?.confirmToggleAlertType();
  window.viewAlertType = (id) => window.adminAlertTypesMain?.openViewAlertTypeModal(id);
  window.closeViewAlertTypeModal = () => window.adminAlertTypesMain?.closeViewAlertTypeModal();
})();
