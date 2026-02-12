(() => {
  const NAME_LIMIT = 40;
  const DESCRIPTION_LIMIT = 160;

  class AdminCompanyTypesMain {
    constructor() {
      this.apiClient = null;
      this.companyTypes = [];
      this.filteredTypes = [];
      this.statusFilter = 'active';
      this.searchTerm = '';
      this.isLoading = false;
      this.isSubmitting = false;
      this.features = [];
      this.editingCompanyTypeId = null;
      this.toggleState = { id: null, name: '', activate: false };
      this.elements = {};
      this.initialized = false;

      this.init();
    }

    init() {
      if (this.initialized) {
        this.activate();
        return;
      }

      this.cacheElements();
      if (!this.elements.grid) return;

      this.bindEvents();
      this.setupApiClient();
      this.statusFilter = this.elements.statusFilter?.value || 'active';
      this.loadCompanyTypes();
      this.initialized = true;
    }

    activate() {
      this.cacheElements();
      if (this.companyTypes.length) {
        this.applyFilters();
      }
    }

    cacheElements() {
      const root = document.querySelector('[data-spa-section="company-types"]') || document;
      this.elements.sectionRoot = root;
      this.elements.grid = root.querySelector('#companyTypesGrid');
      this.elements.emptyState = root.querySelector('#companyTypesEmpty');
      this.elements.statusFilter = root.querySelector('#companyTypesStatusFilter');
      this.elements.searchInput = root.querySelector('#companyTypesSearchInput');
      this.elements.totalCount = root.querySelector('#companyTypesTotalCount');
      this.elements.activeCount = root.querySelector('#companyTypesActiveCount');
      this.elements.companiesCount = root.querySelector('#companyTypesCompaniesCount');
      this.elements.averageCount = root.querySelector('#companyTypesAverageCount');

      this.elements.modal = document.getElementById('companyTypeModal');
      this.elements.form = document.getElementById('companyTypeForm');
      this.elements.formFeedback = document.getElementById('companyTypeFormFeedback');
      this.elements.submitBtn = document.getElementById('companyTypeSubmitBtn');
      this.elements.submitText = document.getElementById('companyTypeSubmitText');
      this.elements.modalTitle = document.getElementById('companyTypeModalTitle');
      this.elements.modalSubtitle = document.getElementById('companyTypeModalSubtitle');
      this.elements.nameInput = document.getElementById('companyTypeName');
      this.elements.statusSelect = document.getElementById('companyTypeStatus');
      this.elements.descriptionInput = document.getElementById('companyTypeDescription');
      this.elements.featureInput = document.getElementById('companyTypeFeatureInput');
      this.elements.featureAddBtn = document.getElementById('companyTypeFeatureAddBtn');
      this.elements.featuresList = document.getElementById('companyTypeFeaturesList');

      this.elements.viewModal = document.getElementById('viewCompanyTypeModal');
      this.elements.viewName = document.getElementById('viewCompanyTypeName');
      this.elements.viewDescription = document.getElementById('viewCompanyTypeDescription');
      this.elements.viewStatus = document.getElementById('viewCompanyTypeStatus');
      this.elements.viewCompanies = document.getElementById('viewCompanyTypeCompanies');
      this.elements.viewCreated = document.getElementById('viewCompanyTypeCreated');
      this.elements.viewFeatures = document.getElementById('viewCompanyTypeFeatures');

      this.elements.toggleModal = document.getElementById('toggleCompanyTypeModal');
      this.elements.toggleTitle = document.getElementById('toggleCompanyTypeTitle');
      this.elements.toggleMessage = document.getElementById('toggleCompanyTypeMessage');
      this.elements.toggleFeedback = document.getElementById('companyTypeToggleFeedback');
      this.elements.toggleConfirmBtn = document.getElementById('companyTypeToggleConfirmBtn');
      this.elements.toggleConfirmIcon = document.getElementById('companyTypeToggleConfirmIcon');
      this.elements.toggleConfirmText = document.getElementById('companyTypeToggleConfirmText');
      this.elements.toggleIconWrapper = document.getElementById('toggleCompanyTypeIcon');
      this.elements.toggleIcon = document.getElementById('toggleCompanyTypeIconFa');

      this.elements.updateModal = document.getElementById('clientUpdateModal');
      this.elements.updateTitle = document.getElementById('companyTypeUpdateTitle');
      this.elements.updateMessage = document.getElementById('companyTypeUpdateMessage');
      this.elements.updateIcon = document.getElementById('companyTypeUpdateIcon');
      this.elements.updateIconFa = document.getElementById('companyTypeUpdateIconFa');
    }

    bindEvents() {
      if (this.elements.statusFilter) {
        this.elements.statusFilter.addEventListener('change', (event) => {
          this.statusFilter = event.target.value || 'active';
          this.applyFilters();
        });
      }

      if (this.elements.searchInput) {
        this.elements.searchInput.addEventListener('input', (event) => {
          this.searchTerm = (event.target.value || '').trim();
          this.applyFilters();
        });
      }

      if (this.elements.grid) {
        this.elements.grid.addEventListener('click', (event) => this.handleGridClick(event));
      }

      if (this.elements.featureAddBtn) {
        this.elements.featureAddBtn.addEventListener('click', () => this.addFeature());
      }

      if (this.elements.featureInput) {
        this.elements.featureInput.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            this.addFeature();
          }
        });
      }

      if (this.elements.featuresList) {
        this.elements.featuresList.addEventListener('click', (event) => {
          const removeBtn = event.target.closest('[data-feature-index]');
          if (!removeBtn) return;
          const index = Number(removeBtn.dataset.featureIndex);
          if (!Number.isNaN(index)) {
            this.features.splice(index, 1);
            this.renderFeatureList();
          }
        });
      }

      if (this.elements.form) {
        this.elements.form.addEventListener('submit', (event) => {
          event.preventDefault();
          this.submitForm();
        });
      }

      if (window.modalManager?.setupModal) {
        if (this.elements.modal) {
          window.modalManager.setupModal('companyTypeModal', { closeOnBackdropClick: false });
        }
        if (this.elements.viewModal) {
          window.modalManager.setupModal('viewCompanyTypeModal', { closeOnBackdropClick: true });
        }
        if (this.elements.toggleModal) {
          window.modalManager.setupModal('toggleCompanyTypeModal', { closeOnBackdropClick: false });
        }
        if (this.elements.updateModal) {
          window.modalManager.setupModal('clientUpdateModal', { closeOnBackdropClick: true });
        }
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

    async loadCompanyTypes() {
      if (this.isLoading) return;
      this.isLoading = true;
      this.renderLoadingState();

      try {
        const items = await this.fetchCompanyTypes();
        this.companyTypes = items;
        this.updateStats(items);
        this.applyFilters();
      } catch (error) {
        this.companyTypes = [];
        this.updateStats([]);
        this.renderErrorState('No se pudieron cargar los tipos de empresa.');
      } finally {
        this.isLoading = false;
      }
    }

    async fetchCompanyTypes() {
      const endpoint = '/api/tipos_empresa/dashboard/all';
      let response;
      if (window.AdminSpaApi?.request) {
        response = await window.AdminSpaApi.request(endpoint);
      } else {
        response = await fetch(this.buildApiUrl(endpoint), { credentials: 'include' });
      }

      if (!response || !response.ok) {
        throw new Error('Request failed');
      }

      const payload = await response.json();
      if (!payload || payload.success === false) {
        throw new Error(payload?.message || 'Invalid response');
      }

      const rawItems = payload.data || payload.company_types || payload.tipos_empresa || [];
      return Array.isArray(rawItems) ? rawItems.map((item) => this.mapCompanyType(item)) : [];
    }

    mapCompanyType(raw) {
      const features = Array.isArray(raw.caracteristicas)
        ? raw.caracteristicas
        : (Array.isArray(raw.features) ? raw.features : []);

      return {
        id: raw._id || raw.id || '',
        name: raw.nombre || raw.name || '',
        description: raw.descripcion || raw.description || '',
        active: raw.activo !== undefined ? Boolean(raw.activo) : (raw.active !== false),
        companiesCount: raw.empresas_count || raw.companies_count || raw.total_empresas || 0,
        features,
        createdAt: raw.fecha_creacion || raw.created_at || raw.createdAt || '',
        updatedAt: raw.fecha_actualizacion || raw.updated_at || raw.updatedAt || ''
      };
    }

    updateStats(items) {
      const total = items.length;
      const active = items.filter((item) => item.active).length;
      const totalCompanies = items.reduce((sum, item) => sum + (item.companiesCount || 0), 0);
      const avg = total ? (totalCompanies / total).toFixed(1) : '0';

      if (this.elements.totalCount) this.elements.totalCount.textContent = total;
      if (this.elements.activeCount) this.elements.activeCount.textContent = active;
      if (this.elements.companiesCount) this.elements.companiesCount.textContent = totalCompanies;
      if (this.elements.averageCount) this.elements.averageCount.textContent = avg;
    }

    applyFilters() {
      let items = [...this.companyTypes];
      const status = this.statusFilter || 'active';

      if (status === 'active') {
        items = items.filter((item) => item.active);
      } else if (status === 'inactive') {
        items = items.filter((item) => !item.active);
      }

      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        items = items.filter((item) => {
          const name = (item.name || '').toLowerCase();
          const desc = (item.description || '').toLowerCase();
          return name.includes(term) || desc.includes(term);
        });
      }

      this.filteredTypes = items;
      this.renderCompanyTypes(items);
    }

    renderLoadingState() {
      if (!this.elements.grid) return;
      this.resetGrid();
      const message = document.createElement('div');
      message.className = 'col-span-full text-center py-16';
      message.innerHTML = `
        <i class="fas fa-spinner fa-spin text-3xl text-blue-400 mb-4"></i>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Cargando tipos de empresa...</h2>
        <p class="text-gray-600 dark:text-gray-300">Sincronizando informacion</p>
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
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ocurrio un problema</h2>
        <p class="text-gray-600 dark:text-gray-300">${this.escapeHtml(message)}</p>
        <button class="ios-action-btn mt-6" type="button">
          <i class="fas fa-rotate"></i>
          Reintentar
        </button>
      `;
      const retryButton = errorBox.querySelector('button');
      if (retryButton) {
        retryButton.addEventListener('click', () => this.loadCompanyTypes());
      }
      this.elements.grid.appendChild(errorBox);
      if (this.elements.emptyState) {
        this.elements.emptyState.classList.add('hidden');
      }
    }

    renderCompanyTypes(items) {
      if (!this.elements.grid) return;
      this.resetGrid();

      if (!items.length) {
        this.renderEmptyState();
        return;
      }

      if (this.elements.emptyState) {
        this.elements.emptyState.classList.add('hidden');
      }

      const fragment = document.createDocumentFragment();
      items.forEach((item) => {
        const card = this.createCompanyTypeCard(item);
        fragment.appendChild(card);
      });
      this.elements.grid.appendChild(fragment);
    }

    renderEmptyState() {
      if (!this.elements.emptyState || !this.elements.grid) return;
      this.elements.emptyState.classList.remove('hidden');
      if (this.searchTerm || this.statusFilter !== 'all') {
        this.elements.emptyState.innerHTML = `
          <i class="fas fa-search text-4xl text-gray-400 mb-4"></i>
          <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sin resultados</h3>
          <p class="text-gray-600 dark:text-gray-300">Ajusta los filtros para ver mas tipos.</p>
        `;
      } else {
        this.elements.emptyState.innerHTML = `
          <i class="fas fa-layer-group text-4xl text-gray-400 mb-4"></i>
          <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">No hay tipos disponibles</h3>
          <p class="text-gray-600 dark:text-gray-300">Crea el primer tipo de empresa para comenzar.</p>
        `;
      }
    }

    resetGrid() {
      if (!this.elements.grid) return;
      const emptyState = this.elements.emptyState;
      this.elements.grid.innerHTML = '';
      if (emptyState) {
        this.elements.grid.appendChild(emptyState);
      }
    }

    createCompanyTypeCard(item) {
      const card = document.createElement('article');
      const statusClass = item.active ? 'ios-status-available' : 'ios-status-discontinued';
      const statusLabel = item.active ? 'Activo' : 'Inactivo';
      const features = Array.isArray(item.features) ? item.features.slice(0, 3) : [];

      card.className = 'ios-hardware-card company-type-card force-visible';
      card.dataset.typeId = item.id;
      card.dataset.status = item.active ? 'active' : 'inactive';

      const featuresMarkup = features.length
        ? `
          <div class="mt-3">
            <p class="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
              <i class="fas fa-tags mr-1"></i>Caracteristicas
            </p>
            <ul class="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              ${features.map((feature) => `<li>${this.escapeHtml(feature)}</li>`).join('')}
            </ul>
          </div>
        `
        : '';

      card.innerHTML = `
        <div class="ios-card-header">
          <div class="ios-card-icon">
            <i class="fas fa-layer-group"></i>
          </div>
          <span class="ios-status-badge ${statusClass} text-xs font-semibold">${statusLabel}</span>
        </div>
        <h3 class="ios-card-title text-xl font-semibold text-gray-900 dark:text-white">${this.escapeHtml(item.name || 'Tipo sin nombre')}</h3>
        <p class="ios-card-subtitle text-sm text-gray-600 dark:text-gray-400">${this.escapeHtml(item.description || 'Sin descripcion disponible.')}</p>

        <div class="ios-card-info">
          <div class="ios-info-item">
            <span class="ios-info-label text-xs font-medium text-gray-600 dark:text-gray-400">
              <i class="fas fa-building text-purple-400 mr-1"></i>Empresas
            </span>
            <span class="ios-info-value text-sm font-bold text-gray-900 dark:text-white">${this.escapeHtml(String(item.companiesCount || 0))}</span>
          </div>
          <div class="ios-info-item">
            <span class="ios-info-label text-xs font-medium text-gray-600 dark:text-gray-400">
              <i class="fas fa-tags text-blue-400 mr-1"></i>Caracteristicas
            </span>
            <span class="ios-info-value text-sm font-bold text-gray-900 dark:text-white">${this.escapeHtml(String(item.features?.length || 0))}</span>
          </div>
          <div class="ios-info-item full-width">
            <span class="ios-info-label text-xs font-medium text-gray-600 dark:text-gray-400">
              <i class="fas fa-calendar text-orange-400 mr-1"></i>Creacion
            </span>
            <span class="ios-info-value text-sm font-bold text-gray-900 dark:text-white">${this.escapeHtml(this.formatDate(item.createdAt))}</span>
          </div>
        </div>

        ${featuresMarkup}

        <div class="ios-card-actions">
          <button type="button" class="ios-card-btn" data-company-type-action="view" data-company-type-id="${this.escapeAttribute(item.id)}" title="Ver detalle">
            <i class="fas fa-eye"></i>
          </button>
          <button type="button" class="ios-card-btn ios-card-btn-primary" data-company-type-action="edit" data-company-type-id="${this.escapeAttribute(item.id)}" title="Editar tipo">
            <i class="fas fa-edit"></i>
          </button>
          <button type="button" class="ios-card-btn ${item.active ? 'ios-card-btn-warning' : 'ios-card-btn-success'}" data-company-type-action="toggle" data-company-type-id="${this.escapeAttribute(item.id)}" data-company-type-name="${this.escapeAttribute(item.name)}" data-company-type-active="${item.active ? 'true' : 'false'}" title="${item.active ? 'Desactivar' : 'Activar'} tipo">
            <i class="fas ${item.active ? 'fa-power-off' : 'fa-play'}"></i>
          </button>
        </div>
      `;

      return card;
    }

    handleGridClick(event) {
      const actionBtn = event.target.closest('[data-company-type-action]');
      if (!actionBtn) return;

      const action = actionBtn.dataset.companyTypeAction;
      const typeId = actionBtn.dataset.companyTypeId;
      const typeName = actionBtn.dataset.companyTypeName;
      const activeValue = actionBtn.dataset.companyTypeActive === 'true';

      if (!typeId) return;

      if (action === 'view') {
        this.openViewCompanyTypeModal(typeId);
      } else if (action === 'edit') {
        this.openEditCompanyTypeModal(typeId);
      } else if (action === 'toggle') {
        this.openToggleCompanyTypeModal(typeId, typeName || '', activeValue);
      }
    }

    openCreateCompanyTypeModal() {
      this.resetForm();
      this.setFormMode('create');
      this.editingCompanyTypeId = null;
      this.openModal('companyTypeModal');
    }

    async openEditCompanyTypeModal(typeId) {
      this.resetForm();
      this.setFormMode('edit');
      this.editingCompanyTypeId = typeId;
      this.showFormFeedback('Cargando informacion del tipo...', 'info');

      this.openModal('companyTypeModal');

      try {
        const detail = await this.fetchCompanyTypeDetail(typeId);
        this.populateForm(detail);
        this.hideFormFeedback();
      } catch (error) {
        this.showFormFeedback(error.message || 'No se pudo cargar el tipo seleccionado.');
      }
    }

    async openViewCompanyTypeModal(typeId) {
      if (!typeId) return;
      this.openModal('viewCompanyTypeModal');

      try {
        const detail = await this.fetchCompanyTypeDetail(typeId);
        this.populateView(detail);
      } catch (error) {
        if (this.elements.viewDescription) {
          this.elements.viewDescription.textContent = 'No se pudo cargar la informacion.';
        }
      }
    }

    closeViewCompanyTypeModal() {
      this.closeModal('viewCompanyTypeModal');
    }

    closeCompanyTypeModal() {
      this.closeModal('companyTypeModal');
      this.resetForm();
    }

    openToggleCompanyTypeModal(typeId, typeName, isActive) {
      if (!typeId) return;
      const activate = !isActive;
      this.toggleState = { id: typeId, name: typeName || '', activate };

      const title = activate ? 'Activar tipo' : 'Desactivar tipo';
      const message = activate
        ? `Quieres activar el tipo "${typeName || 'seleccionado'}"?`
        : `Quieres desactivar el tipo "${typeName || 'seleccionado'}"?`;

      if (this.elements.toggleTitle) this.elements.toggleTitle.textContent = title;
      if (this.elements.toggleMessage) this.elements.toggleMessage.textContent = message;

      if (this.elements.toggleIconWrapper) {
        const baseClass = 'toggle-modal-icon mx-auto mb-4';
        this.elements.toggleIconWrapper.className = `${baseClass} ${activate ? 'activate' : 'deactivate'}`;
      }
      if (this.elements.toggleIcon) {
        this.elements.toggleIcon.className = `fas ${activate ? 'fa-play-circle' : 'fa-pause-circle'} text-4xl`;
      }
      if (this.elements.toggleConfirmIcon) {
        this.elements.toggleConfirmIcon.className = `fas ${activate ? 'fa-play' : 'fa-power-off'} mr-2`;
      }
      if (this.elements.toggleConfirmText) {
        this.elements.toggleConfirmText.textContent = activate ? 'Activar' : 'Desactivar';
      }

      this.hideToggleFeedback();
      this.openModal('toggleCompanyTypeModal');
    }

    closeToggleCompanyTypeModal() {
      this.closeModal('toggleCompanyTypeModal');
      this.toggleState = { id: null, name: '', activate: false };
    }

    async confirmToggleCompanyType() {
      if (!this.toggleState.id) return;
      const originalContent = this.elements.toggleConfirmBtn?.innerHTML;

      if (this.elements.toggleConfirmBtn) {
        this.elements.toggleConfirmBtn.disabled = true;
        this.elements.toggleConfirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Procesando...';
      }

      try {
        await this.toggleCompanyTypeStatus(this.toggleState.id);
        this.closeToggleCompanyTypeModal();
        this.showUpdateModal(this.toggleState.activate ? 'El tipo de empresa se ha activado exitosamente.' : 'El tipo de empresa se ha desactivado exitosamente.');
        await this.loadCompanyTypes();
      } catch (error) {
        this.showToggleFeedback(error.message || 'No se pudo actualizar el estado.');
      } finally {
        if (this.elements.toggleConfirmBtn && originalContent) {
          this.elements.toggleConfirmBtn.disabled = false;
          this.elements.toggleConfirmBtn.innerHTML = originalContent;
        }
      }
    }

    async toggleCompanyTypeStatus(typeId) {
      const endpoint = `/api/tipos_empresa/${encodeURIComponent(typeId)}/toggle-status`;
      const response = await fetch(this.buildApiUrl(endpoint), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || payload.error || 'No se pudo actualizar el estado.');
      }
      return payload;
    }

    async fetchCompanyTypeDetail(typeId) {
      const endpoint = `/api/tipos_empresa/${encodeURIComponent(typeId)}`;
      let response;
      if (window.AdminSpaApi?.request) {
        response = await window.AdminSpaApi.request(endpoint);
      } else {
        response = await fetch(this.buildApiUrl(endpoint), { credentials: 'include' });
      }

      if (!response || !response.ok) {
        throw new Error('No se pudo cargar el detalle.');
      }

      const payload = await response.json();
      const data = payload.data || payload.tipo_empresa || payload;
      if (!data || payload.success === false) {
        throw new Error(payload.message || payload.error || 'No se pudo cargar el detalle.');
      }
      return this.mapCompanyType(data);
    }

    populateForm(detail) {
      if (this.elements.nameInput) this.elements.nameInput.value = detail.name || '';
      if (this.elements.statusSelect) this.elements.statusSelect.value = detail.active ? 'true' : 'false';
      if (this.elements.descriptionInput) this.elements.descriptionInput.value = detail.description || '';
      this.features = Array.isArray(detail.features) ? [...detail.features] : [];
      this.renderFeatureList();
    }

    populateView(detail) {
      if (this.elements.viewName) this.elements.viewName.textContent = detail.name || '-';
      if (this.elements.viewDescription) this.elements.viewDescription.textContent = detail.description || '-';
      if (this.elements.viewStatus) this.elements.viewStatus.textContent = detail.active ? 'Activo' : 'Inactivo';
      if (this.elements.viewCompanies) this.elements.viewCompanies.textContent = String(detail.companiesCount || 0);
      if (this.elements.viewCreated) this.elements.viewCreated.textContent = this.formatDate(detail.createdAt);

      if (this.elements.viewFeatures) {
        this.elements.viewFeatures.innerHTML = '';
        const features = Array.isArray(detail.features) ? detail.features : [];
        if (!features.length) {
          this.elements.viewFeatures.innerHTML = '<li class="text-white/60">Sin caracteristicas registradas.</li>';
          return;
        }
        features.forEach((feature) => {
          const li = document.createElement('li');
          li.textContent = feature;
          this.elements.viewFeatures.appendChild(li);
        });
      }
    }

    addFeature() {
      const raw = (this.elements.featureInput?.value || '').trim();
      if (!raw) return;
      if (raw.length > 80) {
        this.showFormFeedback('La caracteristica no puede superar 80 caracteres.');
        return;
      }
      const exists = this.features.some((item) => item.toLowerCase() === raw.toLowerCase());
      if (exists) {
        this.showFormFeedback('Esta caracteristica ya esta registrada.');
        return;
      }
      this.features.push(raw);
      this.renderFeatureList();
      if (this.elements.featureInput) {
        this.elements.featureInput.value = '';
      }
      this.hideFormFeedback();
    }

    renderFeatureList() {
      if (!this.elements.featuresList) return;
      this.elements.featuresList.innerHTML = '';
      this.features.forEach((feature, index) => {
        const chip = document.createElement('span');
        chip.className = 'ios-chip';
        chip.innerHTML = `
          <span>${this.escapeHtml(feature)}</span>
          <button type="button" data-feature-index="${index}" aria-label="Eliminar caracteristica">
            <i class="fas fa-times"></i>
          </button>
        `;
        this.elements.featuresList.appendChild(chip);
      });
    }

    setFormMode(mode) {
      const isEdit = mode === 'edit';
      if (this.elements.modalTitle) {
        this.elements.modalTitle.textContent = isEdit ? 'Editar tipo de empresa' : 'Nuevo tipo de empresa';
      }
      if (this.elements.modalSubtitle) {
        this.elements.modalSubtitle.textContent = isEdit
          ? 'Actualiza la configuracion del tipo'
          : 'Define las caracteristicas principales';
      }
      if (this.elements.submitText) {
        this.elements.submitText.textContent = isEdit ? 'Actualizar tipo' : 'Guardar tipo';
      }
    }

    resetForm() {
      if (this.elements.form) {
        this.elements.form.reset();
      }
      this.features = [];
      this.editingCompanyTypeId = null;
      this.renderFeatureList();
      this.hideFormFeedback();
    }

    async submitForm() {
      if (this.isSubmitting) return;

      const name = (this.elements.nameInput?.value || '').trim();
      const description = (this.elements.descriptionInput?.value || '').trim();
      const statusValue = this.elements.statusSelect?.value || 'true';

      if (!name || !description) {
        this.showFormFeedback('Completa los campos obligatorios.');
        return;
      }

      if (name.length > NAME_LIMIT) {
        this.showFormFeedback(`El nombre no puede superar ${NAME_LIMIT} caracteres.`);
        return;
      }

      if (description.length > DESCRIPTION_LIMIT) {
        this.showFormFeedback(`La descripcion no puede superar ${DESCRIPTION_LIMIT} caracteres.`);
        return;
      }

      const payload = {
        nombre: name,
        descripcion: description,
        activo: statusValue === 'true',
        caracteristicas: [...this.features]
      };

      this.isSubmitting = true;
      const originalContent = this.elements.submitBtn?.innerHTML;
      if (this.elements.submitBtn) {
        this.elements.submitBtn.disabled = true;
        this.elements.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Guardando...';
      }

      try {
        const isEdit = Boolean(this.editingCompanyTypeId);
        const endpoint = isEdit
          ? `/api/tipos_empresa/${encodeURIComponent(this.editingCompanyTypeId)}`
          : '/api/tipos_empresa';
        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetch(this.buildApiUrl(endpoint), {
          method,
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success === false) {
          const fallback = isEdit
            ? 'No se pudo actualizar el tipo.'
            : 'No se pudo crear el tipo.';
          throw new Error(data.message || data.error || fallback);
        }

        this.closeCompanyTypeModal();
        this.showUpdateModal(isEdit ? 'El tipo de empresa se ha actualizado exitosamente.' : 'El nuevo tipo de empresa se ha creado exitosamente.');
        await this.loadCompanyTypes();
      } catch (error) {
        this.showFormFeedback(error.message || 'Ocurrio un error al guardar el tipo.');
      } finally {
        this.isSubmitting = false;
        if (this.elements.submitBtn && originalContent) {
          this.elements.submitBtn.disabled = false;
          this.elements.submitBtn.innerHTML = originalContent;
        }
      }
    }

    showFormFeedback(message, variant = 'error') {
      if (!this.elements.formFeedback) return;
      this.elements.formFeedback.textContent = message;
      this.elements.formFeedback.classList.remove('hidden');
      if (variant === 'info') {
        this.elements.formFeedback.className = 'px-4 py-3 rounded-lg border border-blue-400 bg-blue-500/20 text-blue-100 text-sm';
      } else {
        this.elements.formFeedback.className = 'px-4 py-3 rounded-lg border border-red-400 bg-red-500/20 text-red-100 text-sm';
      }
    }

    hideFormFeedback() {
      if (this.elements.formFeedback) {
        this.elements.formFeedback.classList.add('hidden');
      }
    }

    showToggleFeedback(message) {
      if (!this.elements.toggleFeedback) return;
      this.elements.toggleFeedback.textContent = message;
      this.elements.toggleFeedback.classList.remove('hidden');
    }

    hideToggleFeedback() {
      if (this.elements.toggleFeedback) {
        this.elements.toggleFeedback.classList.add('hidden');
      }
    }

    openModal(modalId) {
      if (window.modalManager?.openModal) {
        window.modalManager.openModal(modalId, { modalClass: 'ios-modal-open' });
      } else {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('hidden');
      }
    }

    closeModal(modalId) {
      if (window.modalManager?.closeModal) {
        window.modalManager.closeModal(modalId);
      } else {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
      }
    }

    showUpdateModal(message) {
      if (this.elements.updateMessage) {
        this.elements.updateMessage.textContent = message || 'Operacion completada.';
      }

      if (this.elements.updateTitle) {
        const lower = (message || '').toLowerCase();
        if (lower.includes('creado')) {
          this.elements.updateTitle.textContent = 'Tipo Creado';
        } else if (lower.includes('actualizado')) {
          this.elements.updateTitle.textContent = 'Tipo Actualizado';
        } else if (lower.includes('activado')) {
          this.elements.updateTitle.textContent = 'Tipo Activado';
        } else if (lower.includes('desactivado')) {
          this.elements.updateTitle.textContent = 'Tipo Desactivado';
        } else {
          this.elements.updateTitle.textContent = 'Operacion Exitosa';
        }
      }

      if (this.elements.updateIcon && this.elements.updateIconFa) {
        this.elements.updateIcon.className = 'client-update-icon mx-auto mb-4';
        this.elements.updateIconFa.className = 'fas fa-check-circle text-4xl text-emerald-400';
      }

      this.openModal('clientUpdateModal');
    }

    formatDate(value) {
      if (!value) return '-';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return value;
      }
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      });
    }

    buildApiUrl(path = '') {
      if (window.AdminSpaApi?.buildApiUrl) {
        return window.AdminSpaApi.buildApiUrl(path);
      }
      const base = window.__APP_CONFIG && window.__APP_CONFIG.apiUrl;
      if (!base) {
        throw new Error('API URL no configurada');
      }
      const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      return `${normalizedBase}${normalizedPath}`;
    }

    escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    escapeAttribute(value) {
      return this.escapeHtml(value).replace(/`/g, '&#96;');
    }
  }

  window.initAdminCompanyTypesMain = () => {
    if (!window.adminCompanyTypesMain) {
      window.adminCompanyTypesMain = new AdminCompanyTypesMain();
    } else if (window.adminCompanyTypesMain.activate) {
      window.adminCompanyTypesMain.activate();
    }
  };

  window.openCreateCompanyTypeModal = () => window.adminCompanyTypesMain?.openCreateCompanyTypeModal();
  window.closeCompanyTypeModal = () => window.adminCompanyTypesMain?.closeCompanyTypeModal();
  window.closeViewCompanyTypeModal = () => window.adminCompanyTypesMain?.closeViewCompanyTypeModal();
  window.closeToggleCompanyTypeModal = () => window.adminCompanyTypesMain?.closeToggleCompanyTypeModal();
  window.confirmToggleCompanyType = () => window.adminCompanyTypesMain?.confirmToggleCompanyType();
  window.closeCompanyTypeUpdateModal = () => window.adminCompanyTypesMain?.closeModal('clientUpdateModal');
  window.clearCompanyTypeFilters = () => {
    if (!window.adminCompanyTypesMain) return;
    const main = window.adminCompanyTypesMain;
    if (main.elements.searchInput) main.elements.searchInput.value = '';
    if (main.elements.statusFilter) main.elements.statusFilter.value = 'active';
    main.searchTerm = '';
    main.statusFilter = 'active';
    main.applyFilters();
  };
})();
