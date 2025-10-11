(function () {
  const MODAL_ID = 'viewFolderModal';
  const UPLOAD_MODAL_ID = 'uploadFolderModal';
  const CREATE_MODAL_ID = 'createFolderModal';
  const DELETE_MODAL_ID = 'deleteFolderModal';
  const ICONS = {
    info: 'fas fa-circle-info',
    loading: 'fas fa-rotate fa-spin',
    empty: 'fas fa-circle-exclamation',
    error: 'fas fa-triangle-exclamation'
  };
  const FOLDER_SLUG_PATTERN = /^[\w-]{1,50}$/;
  const FILE_BASENAME_PATTERN = /^[\w-]{1,120}$/;
  const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'];
  const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov'];
  const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.aac'];
  const PDF_EXTENSIONS = ['.pdf'];


  document.addEventListener('DOMContentLoaded', () => {
    const modalElement = document.getElementById(MODAL_ID);
    const uploadModal = document.getElementById(UPLOAD_MODAL_ID);
    const createModal = document.getElementById(CREATE_MODAL_ID);
    const openUploadButton = document.getElementById('openUploadModal');
    const openCreateFolderButton = document.getElementById('openCreateFolderModal');
    const uploadForm = document.getElementById('folderUploadForm');
    const uploadFolderSelect = document.getElementById('uploadFolderSelect');
    const uploadFileNameInput = document.getElementById('uploadFileName');
    const uploadFileInput = document.getElementById('uploadFileInput');
    const uploadSubmitButton = document.getElementById('uploadSubmitButton');
    const uploadDropzone = uploadModal ? uploadModal.querySelector('.ios-upload-dropzone') : null;
    const uploadPreview = document.getElementById('uploadPreview');
    const uploadFeedback = document.getElementById('uploadFeedback');
    const createForm = document.getElementById('folderCreateForm');
    const createDisplayInput = document.getElementById('createFolderDisplay');
    const createFeedback = document.getElementById('createFolderFeedback');
    const deleteModal = document.getElementById('deleteFolderModal');
    const deleteFolderNameLabel = document.getElementById('deleteFolderName');
    const deleteFolderFeedback = document.getElementById('deleteFolderFeedback');
    const confirmDeleteButton = document.getElementById('confirmDeleteFolderButton');
    const folderGridElement = document.querySelector('[data-folder-grid]');
    const folderCountElement = document.querySelector('[data-folder-count]');
    const folderFetchTemplate = folderGridElement ? folderGridElement.dataset.fetchTemplate || '' : '';
    const folderDeleteTemplate = folderGridElement ? folderGridElement.dataset.deleteTemplate || '' : '';
    const createFolderEndpoint = (openCreateFolderButton && openCreateFolderButton.dataset.createUrl) || (createForm && createForm.dataset.createUrl) || '';
    const uploadEndpoint = uploadForm ? uploadForm.dataset.uploadUrl || '' : '';
    let currentUploadPreviewUrl = null;
    let createSubmitting = false;
    let deleteSubmitting = false;
    let uploadSubmitting = false;
    let pendingDelete = null;

    if (!modalElement) {
      return;
    }

    const initialFolders = normalizeFoldersData(window.IMAGE_FOLDERS || []);
    window.IMAGE_FOLDERS = initialFolders;
    refreshUploadFolderOptions(initialFolders);
    updateFoldersCount(initialFolders.length);
    renderFolderGrid(initialFolders);

    const statusElement = modalElement.querySelector('#folderFilesStatus');
    const statusIcon = modalElement.querySelector('#folderFilesStatusIcon');
    const statusText = modalElement.querySelector('#folderFilesStatusText');
    const counterElement = modalElement.querySelector('#viewFolderModalCounter');
    const gridElement = modalElement.querySelector('#folderFilesGrid');
    const titleElement = modalElement.querySelector('#viewFolderModalTitle');

    if (window.modalManager && typeof window.modalManager.setupModal === 'function') {
      window.modalManager.setupModal(MODAL_ID, { closeOnBackdropClick: true });
      if (uploadModal) {
        window.modalManager.setupModal(UPLOAD_MODAL_ID, { closeOnBackdropClick: true });
      }
      if (createModal) {
        window.modalManager.setupModal(CREATE_MODAL_ID, { closeOnBackdropClick: true });
      }
      if (deleteModal) {
        window.modalManager.setupModal(DELETE_MODAL_ID, { closeOnBackdropClick: true });
      }
    }

    modalElement.querySelectorAll('[data-modal-close]').forEach((button) => {
      button.addEventListener('click', () => {
        if (window.modalManager && typeof window.modalManager.closeModal === 'function') {
          window.modalManager.closeModal(MODAL_ID);
        } else {
          modalElement.classList.add('hidden');
        }
      });
    });

    if (uploadModal) {
      uploadModal.querySelectorAll('[data-modal-close]').forEach((button) => {
        button.addEventListener('click', () => closeUploadModal());
      });
    }

    if (createModal) {
      createModal.querySelectorAll('[data-modal-close]').forEach((button) => {
        button.addEventListener('click', () => closeCreateFolderModal());
      });
    }

    if (deleteModal) {
      deleteModal.querySelectorAll('[data-modal-close]').forEach((button) => {
        button.addEventListener('click', () => closeDeleteFolderModal());
      });
    }

    if (openUploadButton && uploadModal) {
      openUploadButton.addEventListener('click', () => openUploadModal());
    }

    if (openCreateFolderButton && createModal) {
      openCreateFolderButton.addEventListener('click', () => openCreateFolderModal());
    }

    if (confirmDeleteButton) {
      confirmDeleteButton.addEventListener('click', () => submitDeleteFolder());
    }

    bindFolderButtons();

    if (uploadForm) {
      uploadForm.addEventListener('submit', (event) => {
        event.preventDefault();
        submitUploadForm();
      });
    }

    if (createForm) {
      createForm.addEventListener('submit', (event) => {
        event.preventDefault();
        submitCreateFolder();
      });
    }

    if (uploadFileInput) {
      uploadFileInput.addEventListener('change', handleFileSelection);
    }

    if (uploadDropzone) {
      ['dragenter', 'dragover'].forEach((evt) => {
        uploadDropzone.addEventListener(evt, (event) => {
          event.preventDefault();
          uploadDropzone.classList.add('dragging');
        });
      });
      ['dragleave', 'drop'].forEach((evt) => {
        uploadDropzone.addEventListener(evt, (event) => {
          event.preventDefault();
          uploadDropzone.classList.remove('dragging');
        });
      });
      uploadDropzone.addEventListener('drop', (event) => {
        const files = event.dataTransfer?.files;
        if (files && files.length > 0 && uploadFileInput) {
          uploadFileInput.files = files;
          handleFileSelection();
        }
      });
      uploadDropzone.addEventListener('click', () => {
        if (uploadFileInput) {
          uploadFileInput.click();
        }
      });
    }

    function closeUploadModal() {
      resetUploadForm();
      if (window.modalManager && typeof window.modalManager.closeModal === 'function') {
        window.modalManager.closeModal(UPLOAD_MODAL_ID);
      } else if (uploadModal) {
        uploadModal.classList.add('hidden');
      }
    }

    function closeCreateFolderModal() {
      resetCreateForm();
      if (window.modalManager && typeof window.modalManager.closeModal === 'function') {
        window.modalManager.closeModal(CREATE_MODAL_ID);
      } else if (createModal) {
        createModal.classList.add('hidden');
      }
    }

    function closeDeleteFolderModal() {
      resetDeleteModal();
      if (window.modalManager && typeof window.modalManager.closeModal === 'function') {
        window.modalManager.closeModal(DELETE_MODAL_ID);
      } else if (deleteModal) {
        deleteModal.classList.add('hidden');
      }
    }

    function openModalFor(button) {
      const folderName = button.dataset.folder || '';
      const folderDisplay = button.dataset.folderDisplay || folderName;
      const endpoint = button.dataset.fetchUrl;

      if (!endpoint) {
        return;
      }

      if (titleElement) {
        titleElement.textContent = folderDisplay || 'Carpeta seleccionada';
      }

      updateCounter();
      renderFiles([]);
      setStatus('loading', `Cargando archivos de ${folderDisplay || folderName}...`);

      if (window.modalManager && typeof window.modalManager.openModal === 'function') {
        window.modalManager.openModal(MODAL_ID, { modalClass: 'ios-modal-open' });
      } else {
        modalElement.classList.remove('hidden');
      }

      button.disabled = true;
      button.setAttribute('aria-busy', 'true');

      fetch(endpoint, { headers: { Accept: 'application/json' } })
        .then(async (response) => {
          const payload = await response.json().catch(() => ({}));
          if (!response.ok || payload.success === false) {
            const message = (payload && payload.error) || 'No se pudieron cargar los archivos de la carpeta.';
            throw new Error(message);
          }
          const files = Array.isArray(payload.files) ? payload.files : [];
          renderFiles(files);
          updateCounter(files.length);

          if (files.length === 0) {
            setStatus('empty', 'Esta carpeta no tiene archivos sincronizados todavía.');
          } else {
            clearStatus();
          }
        })
        .catch((error) => {
          console.error('Error cargando archivos del folder:', error);
          setStatus('error', error.message || 'No se pudieron cargar los archivos de la carpeta.');
          updateCounter();
        })
        .finally(() => {
          button.disabled = false;
          button.removeAttribute('aria-busy');
        });
    }

    function openUploadModal() {
      if (!uploadModal) {
        return;
      }

      resetUploadForm();

      if (uploadFolderSelect && uploadFolderSelect.options.length > 1) {
        uploadFolderSelect.selectedIndex = 1;
      }

      if (uploadFileNameInput) {
        uploadFileNameInput.focus();
      }

      if (window.modalManager && typeof window.modalManager.openModal === 'function') {
        window.modalManager.openModal(UPLOAD_MODAL_ID, { modalClass: 'ios-modal-open' });
      } else {
        uploadModal.classList.remove('hidden');
      }

      showUploadFeedback('Selecciona un archivo para generar la vista previa.');
    }


    function openCreateFolderModal() {
      if (!createModal) {
        return;
      }

      resetCreateForm();

      if (createDisplayInput) {
        createDisplayInput.focus();
      }

      if (window.modalManager && typeof window.modalManager.openModal === 'function') {
        window.modalManager.openModal(CREATE_MODAL_ID, { modalClass: 'ios-modal-open' });
      } else {
        createModal.classList.remove('hidden');
      }

      showCreateFeedback('Escribe el nombre del nuevo directorio.', 'info');
    }

    function openDeleteFolderModal(button) {
      if (!deleteModal) {
        return;
      }

      const folderName = button.dataset.folder || '';
      const folderDisplay = button.dataset.folderDisplay || folderName;
      const endpoint = button.dataset.deleteUrl || '';

      pendingDelete = {
        name: folderName,
        display: folderDisplay,
        endpoint
      };

      if (deleteFolderNameLabel) {
        deleteFolderNameLabel.textContent = folderDisplay || folderName;
      }
      if (confirmDeleteButton) {
        confirmDeleteButton.dataset.deleteUrl = endpoint;
        confirmDeleteButton.disabled = false;
      }

      showDeleteFeedback('Esta acción no se puede deshacer.', 'info');

      if (window.modalManager && typeof window.modalManager.openModal === 'function') {
        window.modalManager.openModal(DELETE_MODAL_ID, { modalClass: 'ios-modal-open' });
      } else {
        deleteModal.classList.remove('hidden');
      }
    }

    function showUploadFeedback(message, type = 'info') {
      if (!uploadFeedback) {
        return;
      }
      uploadFeedback.classList.remove('hidden');
      setFeedbackState(uploadFeedback, type);
      uploadFeedback.innerHTML = `<i class="fas fa-circle-info mr-2"></i>${message}`;
    }

    function showCreateFeedback(message, type = 'info') {
      if (!createFeedback) {
        return;
      }
      createFeedback.classList.remove('hidden');
      setFeedbackState(createFeedback, type);
      createFeedback.innerHTML = `<i class="fas fa-circle-info mr-2"></i>${message}`;
    }

    function showDeleteFeedback(message, type = 'info') {
      if (!deleteFolderFeedback) {
        return;
      }
      deleteFolderFeedback.classList.remove('hidden');
      setFeedbackState(deleteFolderFeedback, type);
      deleteFolderFeedback.innerHTML = `<i class="fas fa-circle-info mr-2"></i>${message}`;
    }

    function setFeedbackState(element, type) {
      if (!element) {
        return;
      }
      element.classList.remove('success', 'error');
      if (type === 'success') {
        element.classList.add('success');
      } else if (type === 'error') {
        element.classList.add('error');
      }
    }

    function setCreateSubmitting(isSubmitting) {
      createSubmitting = Boolean(isSubmitting);
      if (!createForm) {
        return;
      }
      const submitButton = document.getElementById('createFolderSubmitButton');
      if (submitButton) {
        submitButton.disabled = createSubmitting;
        submitButton.setAttribute('aria-busy', String(createSubmitting));
      }
      createForm.classList.toggle('is-submitting', createSubmitting);
    }

    function setDeleteSubmitting(isSubmitting) {
      deleteSubmitting = Boolean(isSubmitting);
      if (confirmDeleteButton) {
        confirmDeleteButton.disabled = deleteSubmitting;
        confirmDeleteButton.setAttribute('aria-busy', String(deleteSubmitting));
      }
    }

    function setUploadSubmitting(isSubmitting) {
      uploadSubmitting = Boolean(isSubmitting);
      if (uploadSubmitButton) {
        uploadSubmitButton.disabled = uploadSubmitting;
        uploadSubmitButton.setAttribute('aria-busy', String(uploadSubmitting));
      }
      if (uploadForm) {
        uploadForm.classList.toggle('is-submitting', uploadSubmitting);
      }
    }

    function handleFileSelection() {
      if (!uploadFileInput || uploadFileInput.files.length === 0) {
        clearUploadPreview();
        showUploadFeedback('Selecciona un archivo para generar la vista previa.', 'info');
        return;
      }
      const file = uploadFileInput.files[0];
      renderUploadPreview(file);
      showUploadFeedback(`Listo para subir: ${file.name}`, 'success');
    }

    async function submitUploadForm() {
      if (!uploadForm || uploadSubmitting) {
        return;
      }

      const folderValue = uploadFolderSelect ? uploadFolderSelect.value.trim() : '';
      const filenameValue = uploadFileNameInput ? uploadFileNameInput.value.trim() : '';
      const file = uploadFileInput && uploadFileInput.files ? uploadFileInput.files[0] : null;

      if (!folderValue) {
        showUploadFeedback('Selecciona una carpeta destino.', 'error');
        if (uploadFolderSelect) {
          uploadFolderSelect.focus();
        }
        return;
      }

      if (!FOLDER_SLUG_PATTERN.test(folderValue)) {
        showUploadFeedback('La carpeta solo acepta letras, números o guiones.', 'error');
        if (uploadFolderSelect) {
          uploadFolderSelect.focus();
        }
        return;
      }

      if (!filenameValue) {
        showUploadFeedback('Ingresa el nombre base del archivo.', 'error');
        if (uploadFileNameInput) {
          uploadFileNameInput.focus();
        }
        return;
      }

      if (!FILE_BASENAME_PATTERN.test(filenameValue)) {
        showUploadFeedback('El nombre base solo acepta letras, números o guiones.', 'error');
        if (uploadFileNameInput) {
          uploadFileNameInput.focus();
        }
        return;
      }

      if (!file) {
        showUploadFeedback('Selecciona un archivo para cargar.', 'error');
        return;
      }

      if (!uploadEndpoint) {
        showUploadFeedback('No se encontró el endpoint de carga.', 'error');
        return;
      }

      const formData = new FormData();
      formData.append('folder', folderValue);
      formData.append('filename', filenameValue);
      formData.append('file', file);

      setUploadSubmitting(true);
      showUploadFeedback('Cargando archivo...', 'info');

      try {
        const response = await fetch(uploadEndpoint, {
          method: 'POST',
          body: formData
        });
        const payload = await response.json().catch(() => ({}));
        if (response.status !== 201 || payload.success === false) {
          const message = (payload && payload.error) || 'No se pudo cargar el archivo.';
          throw new Error(message);
        }

        if (Array.isArray(payload.folders)) {
          updateStoredFolders(payload.folders);
        }

        showUploadFeedback('Archivo cargado correctamente.', 'success');
        if (uploadFileInput) {
          uploadFileInput.value = '';
        }
        setTimeout(() => {
          closeUploadModal();
        }, 800);
      } catch (error) {
        console.error('Error cargando archivo:', error);
        showUploadFeedback(error.message || 'No se pudo cargar el archivo.', 'error');
      } finally {
        setUploadSubmitting(false);
      }
    }

    async function submitCreateFolder() {
      if (!createForm || createSubmitting) {
        return;
      }

      const nameValue = createDisplayInput ? createDisplayInput.value.trim() : '';

      if (!nameValue) {
        showCreateFeedback('El nombre del directorio es obligatorio.', 'error');
        if (createDisplayInput) {
          createDisplayInput.focus();
        }
        return;
      }

      if (!createFolderEndpoint) {
        showCreateFeedback('No se encontró el endpoint de creación.', 'error');
        return;
      }

      setCreateSubmitting(true);
      showCreateFeedback('Creando directorio...', 'info');

      try {
        const response = await fetch(createFolderEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({ name: nameValue })
        });
        const payload = await response.json().catch(() => ({}));
        if (response.status !== 201 || payload.success === false) {
          const message = (payload && payload.error) || 'No se pudo crear el directorio.';
          throw new Error(message);
        }

        if (Array.isArray(payload.folders)) {
          updateStoredFolders(payload.folders);
        }

        showCreateFeedback('Directorio creado correctamente.', 'success');
        setTimeout(() => {
          closeCreateFolderModal();
        }, 800);
      } catch (error) {
        console.error('Error creando directorio:', error);
        showCreateFeedback(error.message || 'No se pudo crear el directorio.', 'error');
      } finally {
        setCreateSubmitting(false);
      }
    }

    async function submitDeleteFolder() {
      if (!pendingDelete || deleteSubmitting) {
        return;
      }

      const endpoint = confirmDeleteButton?.dataset.deleteUrl || pendingDelete.endpoint;
      const folderName = pendingDelete.name;

      if (!endpoint) {
        showDeleteFeedback('No se encontró el endpoint de eliminación.', 'error');
        return;
      }

      setDeleteSubmitting(true);
      showDeleteFeedback(`Eliminando ${pendingDelete.display || folderName}...`, 'info');

      try {
        const response = await fetch(endpoint, {
          method: 'DELETE',
          headers: { Accept: 'application/json' }
        });
        const payload = await response.json().catch(() => ({}));
        if (response.status !== 200 || payload.success === false) {
          const message = (payload && payload.error) || 'No se pudo eliminar el directorio.';
          throw new Error(message);
        }

        if (Array.isArray(payload.folders)) {
          updateStoredFolders(payload.folders);
        } else {
          const nextFolders = (window.IMAGE_FOLDERS || []).filter((folder) => folder.name !== folderName);
          updateStoredFolders(nextFolders);
        }

        showDeleteFeedback('Directorio eliminado correctamente.', 'success');
        pendingDelete = null;
        setTimeout(() => {
          closeDeleteFolderModal();
        }, 700);
      } catch (error) {
        console.error('Error eliminando directorio:', error);
        showDeleteFeedback(error.message || 'No se pudo eliminar el directorio.', 'error');
      } finally {
        setDeleteSubmitting(false);
      }
    }

    function updateStoredFolders(folders) {
      const normalized = normalizeFoldersData(folders);
      window.IMAGE_FOLDERS = normalized;
      updateFoldersCount(normalized.length);
      refreshUploadFolderOptions(normalized);
      renderFolderGrid(normalized);
    }

    function refreshUploadFolderOptions(folders) {
      if (!uploadFolderSelect) {
        return;
      }
      const normalized = normalizeFoldersData(folders);
      const previousValue = uploadFolderSelect.value;
      const placeholder = uploadFolderSelect.querySelector('option[value=""]');
      uploadFolderSelect.innerHTML = '';
      if (placeholder) {
        placeholder.selected = true;
        uploadFolderSelect.appendChild(placeholder);
      } else {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Selecciona una carpeta';
        option.disabled = true;
        option.selected = true;
        uploadFolderSelect.appendChild(option);
      }

      normalized
        .slice()
        .sort((a, b) => a.display_name.localeCompare(b.display_name, 'es'))
        .forEach((folder) => {
          const option = document.createElement('option');
          option.value = folder.name;
          option.textContent = folder.display_name;
          if (folder.name === previousValue) {
            option.selected = true;
          }
          uploadFolderSelect.appendChild(option);
        });
    }

    function updateFoldersCount(count) {
      if (!folderCountElement) {
        return;
      }
      folderCountElement.textContent = String(count);
    }

    function normalizeFoldersData(rawFolders) {
      if (!Array.isArray(rawFolders)) {
        return [];
      }
      return rawFolders.map((entry) => {
        if (typeof entry === 'object' && entry !== null) {
          const rawName = entry.name || '';
          const display = entry.display_name || formatFolderDisplayName(rawName);
          return {
            name: rawName,
            display_name: display,
            initials: entry.initials || getFolderInitials(display || rawName)
          };
        }
        const rawName = String(entry || '');
        const display = formatFolderDisplayName(rawName);
        return {
          name: rawName,
          display_name: display,
          initials: getFolderInitials(display || rawName)
        };
      });
    }

    function formatFolderDisplayName(value) {
      if (!value) {
        return 'Directorio';
      }
      const cleaned = value.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
      return cleaned
        .split(' ')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    function getFolderInitials(value) {
      const cleaned = (value || '').replace(/[_-]+/g, ' ').trim();
      const parts = cleaned.split(' ').filter(Boolean);
      if (parts.length === 0) {
        return 'FD';
      }
      const initials = parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
      return initials || 'FD';
    }

    function renderFolderGrid(folders) {
      if (!folderGridElement) {
        return;
      }

      folderGridElement.innerHTML = '';

      if (!Array.isArray(folders) || folders.length === 0) {
        folderGridElement.innerHTML = `
          <div class="col-span-full">
            <div class="ios-empty-state">
              <div class="ios-empty-icon"><i class="fas fa-folder-open"></i></div>
              <h3 class="ios-empty-title">Sin carpetas disponibles</h3>
              <p class="ios-empty-subtitle">Confirma que el servicio esté en línea y vuelve a intentarlo.</p>
            </div>
          </div>`;
        bindFolderButtons();
        return;
      }

      const fragment = document.createDocumentFragment();
      folders.forEach((folder) => {
        fragment.appendChild(buildFolderCard(folder));
      });
      folderGridElement.appendChild(fragment);
      bindFolderButtons();
    }

    function buildFolderCard(folder) {
      const card = document.createElement('article');
      card.className = 'ios-hardware-card ios-folder-card force-visible';
      card.dataset.folderCard = folder.name;

      const header = document.createElement('header');
      header.className = 'ios-folder-header';

      const avatar = document.createElement('div');
      avatar.className = 'ios-folder-avatar';
      avatar.textContent = folder.initials || getFolderInitials(folder.display_name || folder.name);

      const badge = document.createElement('div');
      badge.className = 'ios-folder-badge';
      badge.innerHTML = '<i class="fas fa-folder"></i><span>Carpeta</span>';

      header.appendChild(avatar);
      header.appendChild(badge);

      const body = document.createElement('div');
      body.className = 'ios-folder-body';
      const title = document.createElement('h3');
      title.className = 'ios-folder-title';
      title.textContent = folder.display_name;
      const subtitle = document.createElement('p');
      subtitle.className = 'ios-folder-subtitle';
      subtitle.textContent = folder.name;
      body.appendChild(title);
      body.appendChild(subtitle);

      const footer = document.createElement('footer');
      footer.className = 'ios-folder-footer';
      const actions = document.createElement('div');
      actions.className = 'ios-folder-actions';

      const viewButton = document.createElement('button');
      viewButton.type = 'button';
      viewButton.className = 'ios-action-btn ios-action-btn-secondary view-folder-btn';
      viewButton.dataset.folder = folder.name;
      viewButton.dataset.folderDisplay = folder.display_name;
      viewButton.dataset.fetchUrl = buildFolderFilesUrl(folder.name);
      viewButton.innerHTML = '<i class="fas fa-eye"></i><span>Ver archivos</span>';

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'ios-icon-btn delete-folder-btn';
      deleteButton.dataset.folder = folder.name;
      deleteButton.dataset.folderDisplay = folder.display_name;
      deleteButton.dataset.deleteUrl = buildFolderDeleteUrl(folder.name);
      deleteButton.setAttribute('aria-label', `Eliminar carpeta ${folder.display_name}`);
      deleteButton.innerHTML = '<i class="fas fa-trash"></i>';

      actions.appendChild(viewButton);
      actions.appendChild(deleteButton);
      footer.appendChild(actions);

      card.appendChild(header);
      card.appendChild(body);
      card.appendChild(footer);

      return card;
    }

    function removeFolderCard(folderName) {
      if (!folderGridElement) {
        return;
      }
      const card = folderGridElement.querySelector(`[data-folder-card="${CSS.escape(folderName)}"]`);
      if (card && card.parentElement) {
        card.parentElement.removeChild(card);
      }
    }

    function buildFolderFilesUrl(folderName) {
      if (folderFetchTemplate) {
        return folderFetchTemplate.replace('__FOLDER__', encodeURIComponent(folderName));
      }
      return `/admin/imagenes/${encodeURIComponent(folderName)}/files`;
    }

    function buildFolderDeleteUrl(folderName) {
      if (folderDeleteTemplate) {
        return folderDeleteTemplate.replace('__FOLDER__', encodeURIComponent(folderName));
      }
      return `/admin/imagenes/folders/${encodeURIComponent(folderName)}`;
    }

    function bindFolderButtons() {
      const viewButtons = document.querySelectorAll('.view-folder-btn');
      viewButtons.forEach((button) => {
        if (button.dataset.bound === 'true') {
          return;
        }
        button.addEventListener('click', () => openModalFor(button));
        button.dataset.bound = 'true';
      });

      const deleteButtons = document.querySelectorAll('.delete-folder-btn');
      deleteButtons.forEach((button) => {
        if (button.dataset.bound === 'true') {
          return;
        }
        button.addEventListener('click', () => openDeleteFolderModal(button));
        button.dataset.bound = 'true';
      });
    }

    function renderUploadPreview(file) {
      if (!uploadPreview || !file) {
        return;
      }
      clearUploadPreview();

      const category = inferUploadCategory(file);
      let previewElement = null;

      if (['image', 'video', 'audio'].includes(category)) {
        currentUploadPreviewUrl = URL.createObjectURL(file);
      }

      if (category === 'image') {
        const img = document.createElement('img');
        img.src = currentUploadPreviewUrl;
        img.alt = file.name || 'Vista previa de imagen';
        img.loading = 'lazy';
        previewElement = img;
      } else if (category === 'video') {
        const video = document.createElement('video');
        video.src = currentUploadPreviewUrl;
        video.controls = true;
        video.preload = 'metadata';
        previewElement = video;
      } else if (category === 'audio') {
        const audio = document.createElement('audio');
        audio.src = currentUploadPreviewUrl;
        audio.controls = true;
        audio.preload = 'metadata';
        previewElement = audio;
      } else {
        const iconWrapper = document.createElement('div');
        iconWrapper.className = 'ios-upload-preview-icon';
        iconWrapper.innerHTML = `<i class="fas ${getUploadPreviewIcon(category)}"></i><span>${category === 'pdf' ? 'Vista previa PDF' : 'Vista previa no disponible'}</span>`;
        previewElement = iconWrapper;
      }

      if (previewElement) {
        uploadPreview.appendChild(previewElement);
      }

      const label = document.createElement('div');
      label.className = 'ios-upload-preview-label';
      label.textContent = file.name || 'Archivo seleccionado';
      uploadPreview.appendChild(label);
      uploadPreview.classList.remove('hidden');
    }

    function clearUploadPreview() {
      if (currentUploadPreviewUrl) {
        URL.revokeObjectURL(currentUploadPreviewUrl);
        currentUploadPreviewUrl = null;
      }
      if (uploadPreview) {
        uploadPreview.classList.add('hidden');
        uploadPreview.innerHTML = '';
      }
    }

    function resetCreateForm() {
      if (createForm) {
        createForm.reset();
      }
      if (createFeedback) {
        createFeedback.classList.add('hidden');
        setFeedbackState(createFeedback, 'info');
        createFeedback.innerHTML = '<i class="fas fa-circle-info mr-2"></i>La creación de carpetas estará disponible pronto.';
      }
    }

    function resetDeleteModal() {
      pendingDelete = null;
      deleteSubmitting = false;
      if (deleteFolderFeedback) {
        deleteFolderFeedback.classList.add('hidden');
        setFeedbackState(deleteFolderFeedback, 'info');
        deleteFolderFeedback.innerHTML = '<i class="fas fa-circle-info mr-2"></i>Selecciona un directorio para eliminar.';
      }
      if (deleteFolderNameLabel) {
        deleteFolderNameLabel.textContent = 'Sin directorio';
      }
      if (confirmDeleteButton) {
        confirmDeleteButton.dataset.deleteUrl = '';
        confirmDeleteButton.disabled = false;
        confirmDeleteButton.removeAttribute('aria-busy');
      }
    }

    function resetUploadForm() {
      if (uploadForm) {
        uploadForm.reset();
      }
      if (uploadDropzone) {
        uploadDropzone.classList.remove('dragging');
      }
      clearUploadPreview();
      if (uploadFeedback) {
        uploadFeedback.classList.add('hidden');
        setFeedbackState(uploadFeedback, 'info');
        uploadFeedback.innerHTML = '<i class="fas fa-circle-info mr-2"></i>Esta acción estará disponible pronto.';
      }
    }

    function inferUploadCategory(file) {
      if (!file) {
        return 'other';
      }
      const type = (file.type || '').toLowerCase();
      if (type.startsWith('image/')) return 'image';
      if (type.startsWith('video/')) return 'video';
      if (type.startsWith('audio/')) return 'audio';
      if (type === 'application/pdf') return 'pdf';

      const name = (file.name || '').toLowerCase();
      if (hasExtension(name, IMAGE_EXTENSIONS)) return 'image';
      if (hasExtension(name, VIDEO_EXTENSIONS)) return 'video';
      if (hasExtension(name, AUDIO_EXTENSIONS)) return 'audio';
      if (hasExtension(name, PDF_EXTENSIONS)) return 'pdf';
      return 'other';
    }

    function getUploadPreviewIcon(category) {
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

    function renderFiles(files) {
      if (!gridElement) {
        return;
      }

      gridElement.innerHTML = '';

      if (!Array.isArray(files) || files.length === 0) {
        return;
      }

      const fragment = document.createDocumentFragment();

      files.forEach((file) => {
        fragment.appendChild(createFileCard(file));
      });

      gridElement.appendChild(fragment);
    }

    function createFileCard(file) {
      const card = document.createElement('article');
      card.className = 'ios-file-card';

      const category = inferFileCategory(file);
      const preview = buildFilePreview(file, category);
      if (preview) {
        card.classList.add('has-preview');
        card.appendChild(preview);
      }

      const header = document.createElement('div');
      header.className = 'ios-file-header';

      const icon = document.createElement('div');
      icon.className = 'ios-file-icon';
      icon.innerHTML = `<i class="fas ${getIconForCategory(category)}"></i>`;
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

    function buildFilePreview(file, category = inferFileCategory(file)) {
      if (!file || !file.url) {
        return null;
      }

      if (category === 'image') {
        const wrapper = document.createElement('div');
        wrapper.className = 'ios-file-preview';

        const image = document.createElement('img');
        image.src = file.url;
        image.alt = file.display_name || file.name || 'Previsualización de archivo';
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

    function inferFileCategory(file) {
      const metadataType = getMetadataType(file);
      if (metadataType) {
        if (metadataType.startsWith('image/')) return 'image';
        if (metadataType.startsWith('video/')) return 'video';
        if (metadataType.startsWith('audio/')) return 'audio';
        if (metadataType === 'application/pdf') return 'pdf';
      }

      const reference = (file && (file.name || file.url) || '').toLowerCase();

      if (hasExtension(reference, IMAGE_EXTENSIONS)) return 'image';
      if (hasExtension(reference, VIDEO_EXTENSIONS)) return 'video';
      if (hasExtension(reference, AUDIO_EXTENSIONS)) return 'audio';
      if (hasExtension(reference, PDF_EXTENSIONS)) return 'pdf';

      return 'other';
    }

    function getMetadataType(file) {
      if (!file || !file.metadata) {
        return '';
      }
      const metadata = file.metadata;
      const type = metadata.content_type || metadata.mime_type || metadata.type || metadata.mimetype;
      return typeof type === 'string' ? type.toLowerCase() : '';
    }

    function hasExtension(value, extensions) {
      return extensions.some((extension) => value.endsWith(extension));
    }


    function getIconForCategory(category) {
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

    function setStatus(type, message) {
      if (!statusElement) {
        return;
      }

      statusElement.classList.remove('hidden');
      statusElement.style.removeProperty('display');
      statusElement.classList.toggle('error', type === 'error');

      const iconClass = ICONS[type] || ICONS.info;
      if (statusIcon) {
        statusIcon.className = iconClass;
      }

      if (statusText) {
        statusText.textContent = message;
      }
    }

    function clearStatus() {
      if (!statusElement) {
        return;
      }

      statusElement.classList.add('hidden');
      statusElement.style.display = 'none';
      statusElement.classList.remove('error');
      if (statusIcon) {
        statusIcon.className = ICONS.info;
      }
      if (statusText) {
        statusText.textContent = '';
      }
    }

    function updateCounter(count) {
      if (!counterElement) {
        return;
      }

      if (typeof count !== 'number') {
        counterElement.textContent = '';
        counterElement.classList.add('hidden');
        return;
      }

      counterElement.textContent = count === 1 ? '1 archivo' : `${count} archivos`;
      counterElement.classList.remove('hidden');
    }
  });
})();
