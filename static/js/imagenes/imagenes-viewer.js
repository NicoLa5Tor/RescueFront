(function () {
  const MODAL_ID = 'viewFolderModal';
  const ICONS = {
    info: 'fas fa-circle-info',
    loading: 'fas fa-rotate fa-spin',
    empty: 'fas fa-circle-exclamation',
    error: 'fas fa-triangle-exclamation'
  };
  const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'];
  const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov'];
  const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.aac'];
  const PDF_EXTENSIONS = ['.pdf'];


  document.addEventListener('DOMContentLoaded', () => {
    const modalElement = document.getElementById(MODAL_ID);
    const triggerButtons = document.querySelectorAll('.view-folder-btn');

    if (!modalElement || triggerButtons.length === 0) {
      return;
    }

    const statusElement = modalElement.querySelector('#folderFilesStatus');
    const statusIcon = modalElement.querySelector('#folderFilesStatusIcon');
    const statusText = modalElement.querySelector('#folderFilesStatusText');
    const counterElement = modalElement.querySelector('#viewFolderModalCounter');
    const gridElement = modalElement.querySelector('#folderFilesGrid');
    const titleElement = modalElement.querySelector('#viewFolderModalTitle');

    if (window.modalManager && typeof window.modalManager.setupModal === 'function') {
      window.modalManager.setupModal(MODAL_ID, { closeOnBackdropClick: true });
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

    triggerButtons.forEach((button) => {
      button.addEventListener('click', () => openModalFor(button));
    });

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
