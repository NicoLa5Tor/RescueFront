(() => {
  const FOLDER_SLUG_PATTERN = /^[\w-]{1,50}$/;
  const FILE_BASENAME_PATTERN = /^[\w-]{1,120}$/;
  const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'];
  const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov'];
  const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.aac'];
  const PDF_EXTENSIONS = ['.pdf'];
  const STATUS_ICONS = {
    info: 'fa-circle-info',
    loading: 'fa-spinner fa-spin',
    empty: 'fa-circle-exclamation',
    error: 'fa-triangle-exclamation',
    success: 'fa-circle-check'
  };

  class AdminMultimediaMain {
    constructor() {
      this.initialized = false;
      this.isLoading = false;
      this.isCreating = false;
      this.isDeleting = false;
      this.isUploading = false;
      this.currentUploadPreviewUrl = null;
      this.folders = [];
      this.pendingDelete = null;
      this.currentFolder = null;
      this.endpoints = {};
      this.elements = {};

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
      this.setupModals();
      this.loadFolders();
      this.initialized = true;
    }

    activate() {
      this.cacheElements();
      if (this.folders.length) {
        this.renderFolderGrid(this.folders);
      }
    }

    cacheElements() {
      const root = document.querySelector('[data-spa-section="multimedia"]') || document;
      const view = root.querySelector('#multimediaView') || root;

      this.elements.root = root;
      this.elements.view = view;
      this.elements.grid = root.querySelector('#multimediaFolderGrid');
      this.elements.emptyState = root.querySelector('#multimediaEmptyState');
      this.elements.folderCount = root.querySelector('#multimediaFolderCount');
      this.elements.errorBox = root.querySelector('#multimediaError');
      this.elements.errorText = root.querySelector('#multimediaErrorText');
      this.elements.servicePill = root.querySelector('#multimediaServicePill');
      this.elements.serviceLink = root.querySelector('#multimediaServiceLink');
      this.elements.openCreateButton = root.querySelector('#openCreateFolderModal');
      this.elements.openUploadButton = root.querySelector('#openUploadModal');
      this.elements.refreshButton = root.querySelector('#multimediaRefreshButton');

      this.elements.viewModal = document.getElementById('viewFolderModal');
      this.elements.viewModalTitle = document.getElementById('viewFolderModalTitle');
      this.elements.viewModalCounter = document.getElementById('viewFolderModalCounter');
      this.elements.folderFilesGrid = document.getElementById('folderFilesGrid');
      this.elements.folderFilesStatus = document.getElementById('folderFilesStatus');
      this.elements.folderFilesStatusIcon = document.getElementById('folderFilesStatusIcon');
      this.elements.folderFilesStatusText = document.getElementById('folderFilesStatusText');

      this.elements.uploadModal = document.getElementById('uploadFolderModal');
      this.elements.uploadForm = document.getElementById('folderUploadForm');
      this.elements.uploadFolderSelect = document.getElementById('uploadFolderSelect');
      this.elements.uploadFileName = document.getElementById('uploadFileName');
      this.elements.uploadFileInput = document.getElementById('uploadFileInput');
      this.elements.uploadSubmitButton = document.getElementById('uploadSubmitButton');
      this.elements.uploadDropzone = this.elements.uploadModal
        ? this.elements.uploadModal.querySelector('.ios-upload-dropzone')
        : null;
      this.elements.uploadPreview = document.getElementById('uploadPreview');
      this.elements.uploadFeedback = document.getElementById('uploadFeedback');

      this.elements.createModal = document.getElementById('createFolderModal');
      this.elements.createForm = document.getElementById('folderCreateForm');
      this.elements.createDisplayInput = document.getElementById('createFolderDisplay');
      this.elements.createFeedback = document.getElementById('createFolderFeedback');
      this.elements.createSubmitButton = document.getElementById('createFolderSubmitButton');

      this.elements.deleteModal = document.getElementById('deleteFolderModal');
      this.elements.deleteFolderName = document.getElementById('deleteFolderName');
      this.elements.deleteFeedback = document.getElementById('deleteFolderFeedback');
      this.elements.deleteConfirmButton = document.getElementById('confirmDeleteFolderButton');

      this.elements.updateModal = document.getElementById('multimediaUpdateModal');
      this.elements.updateTitle = document.getElementById('multimediaUpdateTitle');
      this.elements.updateMessage = document.getElementById('multimediaUpdateMessage');
      this.elements.updateIcon = document.getElementById('multimediaUpdateIcon');
      this.elements.updateIconFa = document.getElementById('multimediaUpdateIconFa');

      this.endpoints.foldersUrl = view.dataset.foldersUrl || '';
      this.endpoints.filesTemplate = view.dataset.filesTemplate || '';
      this.endpoints.createUrl = view.dataset.createUrl || '';
      this.endpoints.deleteTemplate = view.dataset.deleteTemplate || '';
      this.endpoints.uploadUrl = view.dataset.uploadUrl || '';
    }

    bindEvents() {
      if (this.elements.openCreateButton) {
        this.elements.openCreateButton.addEventListener('click', () => this.openCreateModal());
      }

      if (this.elements.openUploadButton) {
        this.elements.openUploadButton.addEventListener('click', () => this.openUploadModal());
      }

      if (this.elements.refreshButton) {
        this.elements.refreshButton.addEventListener('click', () => this.loadFolders());
      }

      if (this.elements.grid) {
        this.elements.grid.addEventListener('click', (event) => {
          const viewButton = event.target.closest('.view-folder-btn');
          if (viewButton) {
            const folder = viewButton.dataset.folder || '';
            const display = viewButton.dataset.folderDisplay || folder;
            const endpoint = viewButton.dataset.fetchUrl || '';
            this.openFolderModal({ name: folder, display_name: display, endpoint });
            return;
          }

          const deleteButton = event.target.closest('.delete-folder-btn');
          if (deleteButton) {
            const folder = deleteButton.dataset.folder || '';
            const display = deleteButton.dataset.folderDisplay || folder;
            const endpoint = deleteButton.dataset.deleteUrl || '';
            this.openDeleteModal({ name: folder, display_name: display, endpoint });
          }
        });
      }

      this.bindModalCloseHandlers(this.elements.viewModal);
      this.bindModalCloseHandlers(this.elements.uploadModal);
      this.bindModalCloseHandlers(this.elements.createModal);
      this.bindModalCloseHandlers(this.elements.deleteModal);

      if (this.elements.uploadForm) {
        this.elements.uploadForm.addEventListener('submit', (event) => {
          event.preventDefault();
          this.submitUpload();
        });
      }

      if (this.elements.createForm) {
        this.elements.createForm.addEventListener('submit', (event) => {
          event.preventDefault();
          this.submitCreateFolder();
        });
      }

      if (this.elements.uploadFileInput) {
        this.elements.uploadFileInput.addEventListener('change', () => this.handleFileSelection());
      }

      if (this.elements.uploadDropzone) {
        ['dragenter', 'dragover'].forEach((evt) => {
          this.elements.uploadDropzone.addEventListener(evt, (event) => {
            event.preventDefault();
            this.elements.uploadDropzone.classList.add('dragging');
          });
        });
        ['dragleave', 'drop'].forEach((evt) => {
          this.elements.uploadDropzone.addEventListener(evt, (event) => {
            event.preventDefault();
            this.elements.uploadDropzone.classList.remove('dragging');
          });
        });
        this.elements.uploadDropzone.addEventListener('drop', (event) => {
          const files = event.dataTransfer?.files;
          if (files && files.length > 0 && this.elements.uploadFileInput) {
            this.elements.uploadFileInput.files = files;
            this.handleFileSelection();
          }
        });
        this.elements.uploadDropzone.addEventListener('click', () => {
          if (this.elements.uploadFileInput) {
            this.elements.uploadFileInput.click();
          }
        });
      }

      if (this.elements.deleteConfirmButton) {
        this.elements.deleteConfirmButton.addEventListener('click', () => this.submitDeleteFolder());
      }
    }

    bindModalCloseHandlers(modal) {
      if (!modal) return;
      modal.querySelectorAll('[data-modal-close]').forEach((button) => {
        button.addEventListener('click', () => this.closeModal(modal.id));
      });
    }

    setupModals() {
      if (!window.modalManager?.setupModal) return;
      ['viewFolderModal', 'uploadFolderModal', 'createFolderModal', 'deleteFolderModal', 'multimediaUpdateModal']
        .forEach((modalId) => {
          window.modalManager.setupModal(modalId, { closeOnBackdropClick: true });
        });
    }

    openModal(modalId) {
      if (!modalId) return;
      if (window.modalManager?.openModal) {
        window.modalManager.openModal(modalId, { modalClass: 'ios-modal-open' });
        return;
      }
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('hidden');
        document.body.classList.add('ios-modal-open');
      }
    }

    closeModal(modalId) {
      if (!modalId) return;
      if (window.modalManager?.closeModal) {
        window.modalManager.closeModal(modalId);
        return;
      }
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('ios-modal-open');
      }
    }

    async loadFolders() {
      if (this.isLoading || !this.endpoints.foldersUrl) return;
      this.isLoading = true;
      this.hideError();
      this.renderLoadingState();

      try {
        const response = await fetch(this.endpoints.foldersUrl, { credentials: 'include' });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok || payload.success === false) {
          const message = payload.error || 'No se pudo sincronizar el servicio multimedia.';
          throw new Error(message);
        }

        const folders = Array.isArray(payload.folders) ? payload.folders : [];
        this.folders = folders.map((folder) => this.normalizeFolder(folder));
        this.updateServiceLink(payload.service_url || '');
        this.renderFolderGrid(this.folders);
        this.updateFolderCount(this.folders.length);
        this.populateUploadFolders();
        this.hideError();
      } catch (error) {
        this.folders = [];
        this.renderFolderGrid([]);
        this.updateFolderCount(0);
        this.updateServiceLink('');
        this.showError(error.message || 'No se pudo cargar la informacion del servicio multimedia.');
      } finally {
        this.isLoading = false;
      }
    }

    normalizeFolder(folder) {
      if (typeof folder === 'string') {
        return {
          name: folder,
          display_name: this.formatFolderDisplay(folder),
          initials: this.buildInitials(folder)
        };
      }

      const name = folder.name || '';
      const display = folder.display_name || this.formatFolderDisplay(name);
      return {
        name,
        display_name: display,
        initials: this.buildInitials(display || name)
      };
    }

    formatFolderDisplay(value) {
      return (value || '')
        .replace(/[_-]+/g, ' ')
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    buildInitials(value) {
      const parts = (value || '').split(' ').filter(Boolean);
      const initials = parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('');
      return initials || 'FD';
    }

    updateFolderCount(count) {
      if (this.elements.folderCount) {
        this.elements.folderCount.textContent = String(count || 0);
      }
    }

    updateServiceLink(serviceUrl) {
      if (!this.elements.serviceLink || !this.elements.servicePill) return;
      if (serviceUrl) {
        this.elements.serviceLink.href = serviceUrl;
        this.elements.serviceLink.textContent = 'origen del servicio';
        this.elements.servicePill.classList.remove('hidden');
      } else {
        this.elements.serviceLink.href = '#';
        this.elements.serviceLink.textContent = 'servicio multimedia';
        this.elements.servicePill.classList.add('hidden');
      }
    }

    showError(message) {
      if (!this.elements.errorBox || !this.elements.errorText) return;
      this.elements.errorText.textContent = message;
      this.elements.errorBox.classList.remove('hidden');
      this.elements.errorBox.style.display = 'flex';
    }

    hideError() {
      if (this.elements.errorBox) {
        this.elements.errorBox.classList.add('hidden');
        this.elements.errorBox.style.display = 'none';
      }
    }

    renderLoadingState() {
      if (!this.elements.grid) return;
      this.resetGrid();
      const message = document.createElement('div');
      message.className = 'col-span-full text-center py-16';
      message.innerHTML = `
        <i class="fas fa-spinner fa-spin text-3xl text-blue-400 mb-4"></i>
        <h2 class="text-2xl font-bold text-white mb-2">Cargando multimedia...</h2>
        <p class="text-gray-400">Sincronizando carpetas</p>
      `;
      this.elements.grid.appendChild(message);
      if (this.elements.emptyState) {
        this.elements.emptyState.classList.add('hidden');
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

    renderFolderGrid(folders) {
      if (!this.elements.grid) return;
      this.resetGrid();

      if (!folders.length) {
        if (this.elements.emptyState) {
          this.elements.emptyState.classList.remove('hidden');
        }
        return;
      }

      if (this.elements.emptyState) {
        this.elements.emptyState.classList.add('hidden');
      }

      const fragment = document.createDocumentFragment();
      folders.forEach((folder) => {
        fragment.appendChild(this.createFolderCard(folder));
      });
      this.elements.grid.appendChild(fragment);
    }

    createFolderCard(folder) {
      const card = document.createElement('article');
      card.className = 'ios-hardware-card ios-folder-card force-visible';
      card.dataset.folderCard = folder.name;

      const filesUrl = this.buildTemplateUrl(this.endpoints.filesTemplate, folder.name);
      const deleteUrl = this.buildTemplateUrl(this.endpoints.deleteTemplate, folder.name);

      card.innerHTML = `
        <header class="ios-folder-header">
          <div class="ios-folder-avatar">${this.escapeHtml(folder.initials)}</div>
          <div class="ios-folder-badge">
            <i class="fas fa-folder"></i>
            <span>Carpeta</span>
          </div>
        </header>
        <div class="ios-folder-body">
          <h3 class="ios-folder-title">${this.escapeHtml(folder.display_name || 'Carpeta')}</h3>
          <p class="ios-folder-subtitle">${this.escapeHtml(folder.name)}</p>
        </div>
        <footer class="ios-folder-footer">
          <div class="ios-folder-actions">
            <button
              type="button"
              class="ios-action-btn ios-action-btn-secondary view-folder-btn"
              data-folder="${this.escapeAttribute(folder.name)}"
              data-folder-display="${this.escapeAttribute(folder.display_name || folder.name)}"
              data-fetch-url="${this.escapeAttribute(filesUrl)}"
            >
              <i class="fas fa-eye"></i>
              <span>Ver archivos</span>
            </button>
            <button
              type="button"
              class="ios-icon-btn delete-folder-btn"
              aria-label="Eliminar carpeta ${this.escapeAttribute(folder.display_name || folder.name)}"
              data-folder="${this.escapeAttribute(folder.name)}"
              data-folder-display="${this.escapeAttribute(folder.display_name || folder.name)}"
              data-delete-url="${this.escapeAttribute(deleteUrl)}"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </footer>
      `;

      return card;
    }

    buildTemplateUrl(template, folderName) {
      if (!template) return '';
      return template.replace('__FOLDER__', encodeURIComponent(folderName || ''));
    }

    openFolderModal(folder) {
      if (!folder || !folder.name) return;
      this.currentFolder = folder;

      if (this.elements.viewModalTitle) {
        this.elements.viewModalTitle.textContent = folder.display_name || folder.name;
      }

      this.updateFolderCounter(0);
      this.renderFiles([]);
      this.setFolderStatus('loading', `Cargando archivos de ${folder.display_name || folder.name}...`);
      this.openModal('viewFolderModal');
      this.loadFolderFiles(folder);
    }

    async loadFolderFiles(folder) {
      const endpoint = folder.endpoint || this.buildTemplateUrl(this.endpoints.filesTemplate, folder.name);
      if (!endpoint) {
        this.setFolderStatus('error', 'No se encontro el endpoint para cargar archivos.');
        return;
      }

      try {
        const response = await fetch(endpoint, { credentials: 'include' });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok || payload.success === false) {
          const message = payload.error || 'No se pudieron cargar los archivos.';
          throw new Error(message);
        }

        const files = Array.isArray(payload.files) ? payload.files : [];
        this.renderFiles(files);
        this.updateFolderCounter(files.length);

        if (files.length === 0) {
          this.setFolderStatus('empty', 'No hay archivos en esta carpeta.');
        } else {
          this.setFolderStatus('info', `Se encontraron ${files.length} archivos.`);
        }
      } catch (error) {
        this.renderFiles([]);
        this.updateFolderCounter(0);
        this.setFolderStatus('error', error.message || 'No se pudieron cargar los archivos.');
      }
    }

    setFolderStatus(type, message) {
      if (!this.elements.folderFilesStatus) return;
      const statusIcon = STATUS_ICONS[type] || STATUS_ICONS.info;
      this.elements.folderFilesStatus.classList.remove('hidden');
      this.elements.folderFilesStatus.classList.toggle('error', type === 'error');
      if (this.elements.folderFilesStatusIcon) {
        this.elements.folderFilesStatusIcon.className = `fas ${statusIcon}`;
      }
      if (this.elements.folderFilesStatusText) {
        this.elements.folderFilesStatusText.textContent = message || '';
      }
    }

    updateFolderCounter(count) {
      if (!this.elements.viewModalCounter) return;
      if (!count) {
        this.elements.viewModalCounter.classList.add('hidden');
        this.elements.viewModalCounter.textContent = '';
        return;
      }
      this.elements.viewModalCounter.classList.remove('hidden');
      this.elements.viewModalCounter.textContent = `${count} archivos disponibles`;
    }

    renderFiles(files) {
      if (!this.elements.folderFilesGrid) return;
      this.elements.folderFilesGrid.innerHTML = '';

      if (!Array.isArray(files) || files.length === 0) {
        return;
      }

      const fragment = document.createDocumentFragment();
      files.forEach((file) => {
        fragment.appendChild(this.createFileCard(file));
      });
      this.elements.folderFilesGrid.appendChild(fragment);
    }

    createFileCard(file) {
      const card = document.createElement('article');
      card.className = 'ios-file-card';

      const category = this.inferFileCategory(file);
      const preview = this.buildFilePreview(file, category);
      if (preview) {
        card.classList.add('has-preview');
        card.appendChild(preview);
      }

      const header = document.createElement('div');
      header.className = 'ios-file-header';

      const icon = document.createElement('div');
      icon.className = 'ios-file-icon';
      icon.innerHTML = `<i class="fas ${this.getIconForCategory(category)}"></i>`;
      header.appendChild(icon);

      const titleWrap = document.createElement('div');
      titleWrap.className = 'ios-file-title-wrap';
      titleWrap.setAttribute('tabindex', '0');

      const displayLabel = (file.display_name || file.name || 'Archivo disponible').trim();
      const nameLabel = (file.name || '').trim();

      const title = document.createElement('h4');
      title.className = 'ios-file-title';
      title.textContent = displayLabel || 'Archivo disponible';
      titleWrap.appendChild(title);
      titleWrap.title = displayLabel || 'Archivo disponible';

      header.appendChild(titleWrap);
      card.appendChild(header);

      if (nameLabel && nameLabel.toLowerCase() !== displayLabel.toLowerCase()) {
        const subtitle = document.createElement('p');
        subtitle.className = 'ios-file-subtitle';
        subtitle.textContent = nameLabel;
        card.appendChild(subtitle);
      }

      if (file.url) {
        const actions = document.createElement('div');
        actions.className = 'ios-file-actions';

        const link = document.createElement('a');
        link.href = file.url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.innerHTML = '<i class="fas fa-arrow-up-right-from-square"></i><span>Abrir</span>';

        actions.appendChild(link);
        card.appendChild(actions);
      }

      return card;
    }

    buildFilePreview(file, category) {
      if (!file || !file.url) return null;

      if (category === 'image') {
        const wrapper = document.createElement('div');
        wrapper.className = 'ios-file-preview';
        const image = document.createElement('img');
        image.src = file.url;
        image.alt = file.display_name || file.name || 'Previsualizacion de archivo';
        image.loading = 'lazy';
        wrapper.appendChild(image);
        return wrapper;
      }

      if (category === 'video') {
        const wrapper = document.createElement('div');
        wrapper.className = 'ios-file-preview video';
        const video = document.createElement('video');
        video.src = file.url;
        video.controls = true;
        video.preload = 'metadata';
        wrapper.appendChild(video);
        return wrapper;
      }

      if (category === 'audio') {
        const wrapper = document.createElement('div');
        wrapper.className = 'ios-file-preview audio';
        const audio = document.createElement('audio');
        audio.src = file.url;
        audio.controls = true;
        audio.preload = 'metadata';
        wrapper.appendChild(audio);
        return wrapper;
      }

      if (category === 'pdf') {
        const wrapper = document.createElement('div');
        wrapper.className = 'ios-file-preview pdf';
        wrapper.innerHTML = '<i class="fas fa-file-pdf"></i>';
        return wrapper;
      }

      return null;
    }

    inferFileCategory(file) {
      const metadataType = this.getMetadataType(file);
      if (metadataType) {
        if (metadataType.startsWith('image/')) return 'image';
        if (metadataType.startsWith('video/')) return 'video';
        if (metadataType.startsWith('audio/')) return 'audio';
        if (metadataType === 'application/pdf') return 'pdf';
      }

      const reference = (file && (file.name || file.url) || '').toLowerCase();
      if (this.hasExtension(reference, IMAGE_EXTENSIONS)) return 'image';
      if (this.hasExtension(reference, VIDEO_EXTENSIONS)) return 'video';
      if (this.hasExtension(reference, AUDIO_EXTENSIONS)) return 'audio';
      if (this.hasExtension(reference, PDF_EXTENSIONS)) return 'pdf';
      return 'other';
    }

    getMetadataType(file) {
      if (!file || !file.metadata) return '';
      const metadata = file.metadata;
      const type = metadata.content_type || metadata.mime_type || metadata.type || metadata.mimetype;
      return typeof type === 'string' ? type.toLowerCase() : '';
    }

    hasExtension(value, extensions) {
      return extensions.some((extension) => value.endsWith(extension));
    }

    getIconForCategory(category) {
      switch (category) {
        case 'image':
          return 'fa-file-image';
        case 'video':
          return 'fa-file-video';
        case 'audio':
          return 'fa-file-audio';
        case 'pdf':
          return 'fa-file-pdf';
        default:
          return 'fa-file';
      }
    }

    openUploadModal() {
      this.resetUploadForm();
      this.openModal('uploadFolderModal');
    }

    openCreateModal() {
      this.resetCreateForm();
      this.openModal('createFolderModal');
    }

    openDeleteModal(folder) {
      if (!folder || !folder.name) return;
      this.pendingDelete = folder;

      if (this.elements.deleteFolderName) {
        this.elements.deleteFolderName.textContent = folder.display_name || folder.name;
      }

      if (this.elements.deleteConfirmButton) {
        this.elements.deleteConfirmButton.dataset.deleteUrl = folder.endpoint || '';
      }

      this.showDeleteFeedback('Confirma la eliminacion del directorio seleccionado.', 'info');
      this.openModal('deleteFolderModal');
    }

    resetUploadForm() {
      if (this.elements.uploadForm) {
        this.elements.uploadForm.reset();
      }
      if (this.elements.uploadDropzone) {
        this.elements.uploadDropzone.classList.remove('dragging');
      }
      this.clearUploadPreview();
      this.showUploadFeedback('Completa los campos para subir el archivo.', 'info');
    }

    resetCreateForm() {
      if (this.elements.createForm) {
        this.elements.createForm.reset();
      }
      this.showCreateFeedback('Completa el nombre del directorio.', 'info');
    }

    clearUploadPreview() {
      if (!this.elements.uploadPreview) return;
      if (this.currentUploadPreviewUrl) {
        URL.revokeObjectURL(this.currentUploadPreviewUrl);
        this.currentUploadPreviewUrl = null;
      }
      this.elements.uploadPreview.classList.add('hidden');
      this.elements.uploadPreview.innerHTML = '';
    }

    handleFileSelection() {
      if (!this.elements.uploadFileInput || this.elements.uploadFileInput.files.length === 0) {
        this.clearUploadPreview();
        this.showUploadFeedback('Selecciona un archivo para generar la vista previa.', 'info');
        return;
      }
      const file = this.elements.uploadFileInput.files[0];
      this.renderUploadPreview(file);
      this.showUploadFeedback(`Listo para subir: ${file.name}`, 'success');
    }

    renderUploadPreview(file) {
      if (!this.elements.uploadPreview || !file) return;
      this.elements.uploadPreview.innerHTML = '';
      if (this.currentUploadPreviewUrl) {
        URL.revokeObjectURL(this.currentUploadPreviewUrl);
        this.currentUploadPreviewUrl = null;
      }

      const category = this.inferUploadCategory(file);
      this.currentUploadPreviewUrl = URL.createObjectURL(file);

      if (category === 'image') {
        const img = document.createElement('img');
        img.src = this.currentUploadPreviewUrl;
        img.alt = file.name || 'Vista previa de imagen';
        this.elements.uploadPreview.appendChild(img);
      } else if (category === 'video') {
        const video = document.createElement('video');
        video.src = this.currentUploadPreviewUrl;
        video.controls = true;
        video.preload = 'metadata';
        this.elements.uploadPreview.appendChild(video);
      } else if (category === 'audio') {
        const audio = document.createElement('audio');
        audio.src = this.currentUploadPreviewUrl;
        audio.controls = true;
        audio.preload = 'metadata';
        this.elements.uploadPreview.appendChild(audio);
      } else {
        const icon = document.createElement('div');
        icon.className = 'ios-upload-preview-icon';
        icon.innerHTML = `<i class="fas ${this.getUploadIcon(category)}"></i>`;
        this.elements.uploadPreview.appendChild(icon);
      }

      const label = document.createElement('p');
      label.className = 'ios-upload-preview-label';
      label.textContent = file.name || 'Archivo seleccionado';
      this.elements.uploadPreview.appendChild(label);

      this.elements.uploadPreview.classList.remove('hidden');
    }

    inferUploadCategory(file) {
      if (!file) return 'other';
      const type = (file.type || '').toLowerCase();
      if (type.startsWith('image/')) return 'image';
      if (type.startsWith('video/')) return 'video';
      if (type.startsWith('audio/')) return 'audio';
      if (type === 'application/pdf') return 'pdf';

      const name = (file.name || '').toLowerCase();
      if (this.hasExtension(name, IMAGE_EXTENSIONS)) return 'image';
      if (this.hasExtension(name, VIDEO_EXTENSIONS)) return 'video';
      if (this.hasExtension(name, AUDIO_EXTENSIONS)) return 'audio';
      if (this.hasExtension(name, PDF_EXTENSIONS)) return 'pdf';
      return 'other';
    }

    getUploadIcon(category) {
      switch (category) {
        case 'pdf':
          return 'fa-file-pdf';
        case 'image':
          return 'fa-file-image';
        case 'video':
          return 'fa-file-video';
        case 'audio':
          return 'fa-file-audio';
        default:
          return 'fa-file';
      }
    }

    showUploadFeedback(message, type) {
      if (!this.elements.uploadFeedback) return;
      this.elements.uploadFeedback.classList.remove('hidden');
      this.elements.uploadFeedback.innerHTML = `<i class="fas ${STATUS_ICONS[type] || STATUS_ICONS.info} mr-2"></i>${this.escapeHtml(message)}`;
      this.setFeedbackState(this.elements.uploadFeedback, type);
    }

    showCreateFeedback(message, type) {
      if (!this.elements.createFeedback) return;
      this.elements.createFeedback.classList.remove('hidden');
      this.elements.createFeedback.innerHTML = `<i class="fas ${STATUS_ICONS[type] || STATUS_ICONS.info} mr-2"></i>${this.escapeHtml(message)}`;
      this.setFeedbackState(this.elements.createFeedback, type);
    }

    showDeleteFeedback(message, type) {
      if (!this.elements.deleteFeedback) return;
      this.elements.deleteFeedback.classList.remove('hidden');
      this.elements.deleteFeedback.innerHTML = `<i class="fas ${STATUS_ICONS[type] || STATUS_ICONS.info} mr-2"></i>${this.escapeHtml(message)}`;
      this.setFeedbackState(this.elements.deleteFeedback, type);
    }

    setFeedbackState(element, type) {
      if (!element) return;
      element.classList.remove('success', 'error');
      if (type === 'success') {
        element.classList.add('success');
      }
      if (type === 'error') {
        element.classList.add('error');
      }
    }

    async submitUpload() {
      if (!this.elements.uploadForm || this.isUploading) return;

      const folderValue = (this.elements.uploadFolderSelect?.value || '').trim();
      const filenameValue = (this.elements.uploadFileName?.value || '').trim();
      const file = this.elements.uploadFileInput?.files?.[0] || null;

      if (!folderValue) {
        this.showUploadFeedback('Selecciona una carpeta destino.', 'error');
        this.elements.uploadFolderSelect?.focus();
        return;
      }

      if (!FOLDER_SLUG_PATTERN.test(folderValue)) {
        this.showUploadFeedback('La carpeta solo acepta letras, numeros o guiones.', 'error');
        this.elements.uploadFolderSelect?.focus();
        return;
      }

      if (!filenameValue) {
        this.showUploadFeedback('Ingresa el nombre base del archivo.', 'error');
        this.elements.uploadFileName?.focus();
        return;
      }

      if (!FILE_BASENAME_PATTERN.test(filenameValue)) {
        this.showUploadFeedback('El nombre base solo acepta letras, numeros o guiones.', 'error');
        this.elements.uploadFileName?.focus();
        return;
      }

      if (!file) {
        this.showUploadFeedback('Selecciona un archivo para cargar.', 'error');
        return;
      }

      if (!this.endpoints.uploadUrl) {
        this.showUploadFeedback('No se encontro el endpoint de carga.', 'error');
        return;
      }

      const formData = new FormData();
      formData.append('folder', folderValue);
      formData.append('filename', filenameValue);
      formData.append('file', file);

      this.setUploadSubmitting(true);
      this.showUploadFeedback('Cargando archivo...', 'info');

      try {
        const response = await fetch(this.endpoints.uploadUrl, {
          method: 'POST',
          body: formData
        });
        const payload = await response.json().catch(() => ({}));
        if (response.status !== 201 || payload.success === false) {
          const message = payload.detail || payload.error || 'No se pudo cargar el archivo.';
          throw new Error(message);
        }

        this.showUploadFeedback('Archivo cargado correctamente.', 'success');
        this.loadFolders();
        setTimeout(() => {
          this.closeModal('uploadFolderModal');
          this.showUpdateModal('Archivo cargado correctamente.');
        }, 500);
      } catch (error) {
        this.showUploadFeedback(error.message || 'No se pudo cargar el archivo.', 'error');
      } finally {
        this.setUploadSubmitting(false);
      }
    }

    async submitCreateFolder() {
      if (!this.elements.createForm || this.isCreating) return;
      const nameValue = (this.elements.createDisplayInput?.value || '').trim();

      if (!nameValue) {
        this.showCreateFeedback('El nombre del directorio es obligatorio.', 'error');
        this.elements.createDisplayInput?.focus();
        return;
      }

      if (!this.endpoints.createUrl) {
        this.showCreateFeedback('No se encontro el endpoint de creacion.', 'error');
        return;
      }

      this.setCreateSubmitting(true);
      this.showCreateFeedback('Creando directorio...', 'info');

      try {
        const response = await fetch(this.endpoints.createUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({ name: nameValue })
        });
        const payload = await response.json().catch(() => ({}));
        if (response.status !== 201 || payload.success === false) {
          const message = payload.error || 'No se pudo crear el directorio.';
          throw new Error(message);
        }

        this.showCreateFeedback('Directorio creado correctamente.', 'success');
        this.loadFolders();
        setTimeout(() => {
          this.closeModal('createFolderModal');
          this.showUpdateModal('Directorio creado correctamente.');
        }, 500);
      } catch (error) {
        this.showCreateFeedback(error.message || 'No se pudo crear el directorio.', 'error');
      } finally {
        this.setCreateSubmitting(false);
      }
    }

    async submitDeleteFolder() {
      if (!this.pendingDelete || this.isDeleting) return;
      const endpoint = this.pendingDelete.endpoint || this.elements.deleteConfirmButton?.dataset.deleteUrl || '';

      if (!endpoint) {
        this.showDeleteFeedback('No se encontro el endpoint de eliminacion.', 'error');
        return;
      }

      this.setDeleteSubmitting(true);
      this.showDeleteFeedback(`Eliminando ${this.pendingDelete.display_name || this.pendingDelete.name}...`, 'info');

      try {
        const response = await fetch(endpoint, {
          method: 'DELETE',
          headers: { Accept: 'application/json' }
        });
        const payload = await response.json().catch(() => ({}));
        if (response.status !== 200 || payload.success === false) {
          const message = payload.error || 'No se pudo eliminar el directorio.';
          throw new Error(message);
        }

        this.showDeleteFeedback('Directorio eliminado correctamente.', 'success');
        this.pendingDelete = null;
        this.loadFolders();
        setTimeout(() => {
          this.closeModal('deleteFolderModal');
          this.showUpdateModal('Directorio eliminado correctamente.');
        }, 450);
      } catch (error) {
        this.showDeleteFeedback(error.message || 'No se pudo eliminar el directorio.', 'error');
      } finally {
        this.setDeleteSubmitting(false);
      }
    }

    populateUploadFolders() {
      if (!this.elements.uploadFolderSelect) return;
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Selecciona una carpeta';
      placeholder.disabled = true;
      placeholder.selected = true;

      this.elements.uploadFolderSelect.innerHTML = '';
      this.elements.uploadFolderSelect.appendChild(placeholder);

      this.folders.forEach((folder) => {
        const option = document.createElement('option');
        option.value = folder.name;
        option.textContent = folder.display_name || folder.name;
        this.elements.uploadFolderSelect.appendChild(option);
      });
    }

    setCreateSubmitting(isSubmitting) {
      this.isCreating = Boolean(isSubmitting);
      if (this.elements.createSubmitButton) {
        this.elements.createSubmitButton.disabled = this.isCreating;
        this.elements.createSubmitButton.setAttribute('aria-busy', String(this.isCreating));
      }
      if (this.elements.createForm) {
        this.elements.createForm.classList.toggle('is-submitting', this.isCreating);
      }
    }

    setDeleteSubmitting(isSubmitting) {
      this.isDeleting = Boolean(isSubmitting);
      if (this.elements.deleteConfirmButton) {
        this.elements.deleteConfirmButton.disabled = this.isDeleting;
        this.elements.deleteConfirmButton.setAttribute('aria-busy', String(this.isDeleting));
      }
    }

    setUploadSubmitting(isSubmitting) {
      this.isUploading = Boolean(isSubmitting);
      if (this.elements.uploadSubmitButton) {
        this.elements.uploadSubmitButton.disabled = this.isUploading;
        this.elements.uploadSubmitButton.setAttribute('aria-busy', String(this.isUploading));
      }
      if (this.elements.uploadForm) {
        this.elements.uploadForm.classList.toggle('is-submitting', this.isUploading);
      }
    }

    showUpdateModal(message) {
      if (this.elements.updateMessage) {
        this.elements.updateMessage.textContent = message || 'Operacion completada.';
      }

      if (this.elements.updateTitle) {
        const lower = (message || '').toLowerCase();
        if (lower.includes('cargado')) {
          this.elements.updateTitle.textContent = 'Archivo Cargado';
        } else if (lower.includes('creado')) {
          this.elements.updateTitle.textContent = 'Directorio Creado';
        } else if (lower.includes('eliminado')) {
          this.elements.updateTitle.textContent = 'Directorio Eliminado';
        } else {
          this.elements.updateTitle.textContent = 'Operacion Exitosa';
        }
      }

      if (this.elements.updateIcon && this.elements.updateIconFa) {
        this.elements.updateIcon.className = 'client-update-icon mx-auto mb-4';
        this.elements.updateIconFa.className = 'fas fa-check-circle text-4xl text-emerald-400';
      }

      this.openModal('multimediaUpdateModal');
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

  window.initAdminMultimediaMain = () => {
    if (!window.adminMultimediaMain) {
      window.adminMultimediaMain = new AdminMultimediaMain();
    } else if (window.adminMultimediaMain.activate) {
      window.adminMultimediaMain.activate();
    }
  };

  window.closeMultimediaUpdateModal = () => window.adminMultimediaMain?.closeModal('multimediaUpdateModal');
})();
