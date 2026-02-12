(() => {
  const getApiUrl = (path = '') => {
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
  };

  class HardwareModalScrollManager {
    constructor() {
      this.openModals = new Set();
      this.openStack = [];
      this.isLocked = false;
    }

    open(modalId) {
      if (!this.openModals.has(modalId)) {
        this.openModals.add(modalId);
        this.openStack.push(modalId);
      }
      if (this.openModals.size === 1) {
        this.lockScroll();
      }
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('hidden');
      }
    }

    close(modalId) {
      if (this.openModals.has(modalId)) {
        this.openModals.delete(modalId);
        this.openStack = this.openStack.filter((id) => id !== modalId);
      }
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('hidden');
      }
      if (this.openModals.size === 0) {
        this.unlockScroll();
      }
    }

    closeTop(closeById) {
      const last = this.openStack[this.openStack.length - 1];
      if (!last) return;
      closeById(last);
    }

    lockScroll() {
      if (this.isLocked) return;
      document.body.classList.add('ios-modal-open');
      this.isLocked = true;
    }

    unlockScroll() {
      if (!this.isLocked) return;
      document.body.classList.remove('ios-modal-open');
      this.isLocked = false;
    }
  }

  class AdminHardwareModals {
    constructor() {
      this.apiClient = null;
      this.editingHardwareId = null;
      this.viewingHardware = null;
      this.toggleState = null;
      this.currentLocationUrl = '';
      this.modalManager = new HardwareModalScrollManager();
      this.leafletLoaded = false;
      this.leafletPromise = null;
      this.currentMap = null;
      this.currentMarker = null;
      this.isSubmitting = false;
      this.eventsBound = false;

      this.setupApiClient();
      this.bindEvents();
    }

    setupApiClient() {
      if (window.AdminSpaApi?.getClient) {
        const apiClient = window.AdminSpaApi.getClient();
        if (apiClient) {
          this.apiClient = apiClient;
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

      this.apiClient = {
        create_hardware: (data) =>
          fetch(getApiUrl('/api/hardware'), {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          }),
        update_hardware: (id, data) =>
          fetch(getApiUrl(`/api/hardware/${id}`), {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          }),
        get_hardware_details: (id) =>
          fetch(getApiUrl(`/api/hardware/${id}`), {
            method: 'GET',
            credentials: 'include'
          }),
        toggle_hardware_status: (id, activa) =>
          fetch(getApiUrl(`/api/hardware/${id}/toggle-status`), {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activa })
          })
      };
    }

    bindEvents() {
      if (this.eventsBound) return;
      this.eventsBound = true;

      const form = document.getElementById('hardwareForm');
      if (form) {
        form.addEventListener('submit', (event) => this.handleFormSubmit(event));
      }

      const modalIds = [
        'hardwareModal',
        'viewHardwareModal',
        'toggleHardwareModal',
        'locationModal',
        'clientUpdateModal'
      ];

      modalIds.forEach((modalId) => {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.addEventListener('click', (event) => {
          if (event.target === modal) {
            this.closeModalById(modalId);
          }
        });
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          this.modalManager.closeTop((modalId) => this.closeModalById(modalId));
        }
      });
    }

    closeModalById(modalId) {
      switch (modalId) {
        case 'hardwareModal':
          this.closeHardwareModal();
          break;
        case 'viewHardwareModal':
          this.closeHardwareViewModal();
          break;
        case 'toggleHardwareModal':
          this.closeHardwareToggleModal();
          break;
        case 'locationModal':
          this.closeHardwareLocationModal();
          break;
        case 'clientUpdateModal':
          this.closeHardwareUpdateModal();
          break;
        default:
          this.modalManager.close(modalId);
      }
    }

    getMain() {
      if (window.adminHardwareMain) return window.adminHardwareMain;
      if (window.initAdminHardwareMain) {
        return window.initAdminHardwareMain();
      }
      return null;
    }

    openHardwareCreateModal() {
      this.editingHardwareId = null;
      this.setModalText('modalTitle', 'Nuevo Hardware');
      this.setModalText('submitButtonText', 'Crear Hardware');
      this.resetForm();
      this.modalManager.open('hardwareModal');
    }

    async openHardwareEditModal(id) {
      if (!id) {
        this.showUpdateModal('Hardware no encontrado.', 'error');
        return;
      }
      this.editingHardwareId = id;
      this.setModalText('modalTitle', 'Editar Hardware');
      this.setModalText('submitButtonText', 'Actualizar Hardware');

      const loaded = await this.loadHardwareForEdit(id);
      if (!loaded) return;
      this.modalManager.open('hardwareModal');
    }

    closeHardwareModal() {
      this.modalManager.close('hardwareModal');
      this.editingHardwareId = null;
      this.resetForm();
    }

    async openHardwareViewModal(id) {
      if (!id) {
        this.showUpdateModal('Hardware no encontrado.', 'error');
        return;
      }
      const hardware = await this.fetchHardwareDetails(id);
      if (!hardware) {
        this.showUpdateModal('No se pudo cargar el hardware.', 'error');
        return;
      }
      this.showHardwareDetails(hardware);
      this.modalManager.open('viewHardwareModal');
    }

    closeHardwareViewModal() {
      this.modalManager.close('viewHardwareModal');
      this.viewingHardware = null;
    }

    openHardwareToggleModal(id, activa) {
      if (!id) return;

      const hardware = this.getHardwareFromCache(id);
      const currentActive = hardware?.activa !== false;
      const targetActive = typeof activa === 'boolean'
        ? (activa === currentActive ? !activa : activa)
        : !currentActive;

      this.toggleState = { id, activa: targetActive };

      const name = hardware?.nombre || 'este hardware';

      const title = targetActive ? 'Activar Hardware' : 'Desactivar Hardware';
      const message = targetActive
        ? `Estas seguro de que quieres activar ${name}?`
        : `Estas seguro de que quieres desactivar ${name}?`;

      this.setModalText('toggleModalTitle', title);
      this.setModalText('toggleModalMessage', message);
      const toggleModal = document.getElementById('toggleHardwareModal');
      const confirmText = toggleModal
        ? toggleModal.querySelector('#toggleConfirmText')
        : document.getElementById('toggleConfirmText');
      if (confirmText) {
        confirmText.textContent = targetActive ? 'Activar' : 'Desactivar';
      }

      const icon = document.getElementById('toggleModalIconFa');
      if (icon) {
        icon.className = `fas ${targetActive ? 'fa-play' : 'fa-power-off'} text-4xl`;
      }

      const confirmIcon = toggleModal
        ? toggleModal.querySelector('#toggleConfirmIcon')
        : document.getElementById('toggleConfirmIcon');
      if (confirmIcon) {
        confirmIcon.className = `fas ${targetActive ? 'fa-check' : 'fa-power-off'} mr-2`;
      }

      this.modalManager.open('toggleHardwareModal');
    }

    closeHardwareToggleModal() {
      this.modalManager.close('toggleHardwareModal');
      this.toggleState = null;
    }

    async confirmHardwareToggle() {
      if (!this.toggleState || !this.apiClient) return;

      const { id, activa } = this.toggleState;
      try {
        const response = await this.apiClient.toggle_hardware_status(id, activa);
        const data = await response.json();
        if (!response.ok || !data.success) {
          const message = data?.error || (data?.errors || []).join(', ') || 'No se pudo actualizar el estado.';
          this.showUpdateModal(message, 'error');
          return;
        }

        this.closeHardwareToggleModal();
        const main = this.getMain();
        if (main?.loadHardware) {
          await main.loadHardware();
        }
        const successMessage = activa
          ? 'Hardware activado correctamente.'
          : 'Hardware desactivado correctamente.';
        this.showUpdateModal(successMessage, 'success');
      } catch (error) {
        this.showUpdateModal('Error al actualizar el estado del hardware.', 'error');
      }
    }

    async openHardwareLocationModal(id, locationUrl) {
      this.currentLocationUrl = locationUrl || '';
      const hardware = this.getHardwareFromCache(id);
      const name = hardware?.nombre || 'Hardware';

      const subtitle = document.getElementById('locationModalSubtitle');
      if (subtitle) {
        subtitle.textContent = `Ubicacion para ${name}`;
      }

      const openBtn = document.getElementById('openInNewTabBtn');
      if (openBtn) {
        openBtn.disabled = !this.currentLocationUrl;
        openBtn.classList.toggle('opacity-60', !this.currentLocationUrl);
      }

      this.modalManager.open('locationModal');
      await this.renderLocationMap(name);
    }

    closeHardwareLocationModal() {
      this.modalManager.close('locationModal');
      this.currentLocationUrl = '';
      if (this.currentMap) {
        try {
          this.currentMap.remove();
        } catch (error) {
          // ignore
        }
        this.currentMap = null;
        this.currentMarker = null;
      }
      const mapContainer = document.getElementById('locationMap');
      if (mapContainer) {
        mapContainer.innerHTML = '';
      }
    }

    openHardwareLocationInNewTab() {
      if (!this.currentLocationUrl) return;
      const url = this.currentLocationUrl.startsWith('http')
        ? this.currentLocationUrl
        : `https://www.google.com/maps/search/${encodeURIComponent(this.currentLocationUrl)}`;
      window.open(url, '_blank', 'noopener');
    }

    closeHardwareUpdateModal() {
      this.modalManager.close('clientUpdateModal');
    }

    async loadHardwareForEdit(id) {
      const hardware = await this.fetchHardwareDetails(id);
      if (!hardware) {
        this.showUpdateModal('No se pudo cargar el hardware.', 'error');
        return false;
      }
      this.fillHardwareForm(hardware);
      return true;
    }

    async fetchHardwareDetails(id) {
      try {
        if (this.apiClient?.get_hardware_details) {
          const response = await this.apiClient.get_hardware_details(id);
          if (!response.ok) {
            return this.getHardwareFromCache(id);
          }
          const data = await response.json();
          if (data && data.success && data.data) {
            return data.data;
          }
        }
      } catch (error) {
        return this.getHardwareFromCache(id);
      }

      return this.getHardwareFromCache(id);
    }

    getHardwareFromCache(id) {
      const main = this.getMain();
      if (!main || !Array.isArray(main.hardware)) return null;
      return main.hardware.find((item) => item && item._id === id) || null;
    }

    fillHardwareForm(hardware) {
      const datos = this.extractDatos(hardware);

      this.setInputValue('hardwareName', hardware.nombre || '');
      this.setInputValue('hardwareType', hardware.tipo || '');

      const empresaId = hardware.empresa_id || '';
      const empresaSelect = document.getElementById('hardwareEmpresa');
      if (empresaSelect) {
        empresaSelect.value = empresaId;
      }

      const main = this.getMain();
      if (main?.loadSedesByEmpresa) {
        main.loadSedesByEmpresa();
      }

      const sede = hardware.sede || '';
      const sedeSelect = document.getElementById('hardwareSede');
      if (sedeSelect) {
        sedeSelect.value = sede;
        sedeSelect.disabled = false;
      }

      this.setInputValue('hardwareDireccion', hardware.direccion || '');

      this.setInputValue('hardwareBrand', datos.brand || datos.marca || hardware.marca || '');
      this.setInputValue('hardwareModel', datos.model || datos.modelo || hardware.modelo || '');

      const price = datos.price || datos.precio || hardware.precio || '';
      this.setInputValue('hardwarePrice', price);

      const stock = datos.stock || hardware.stock || '';
      this.setInputValue('hardwareStock', stock);

      const status = datos.status || datos.estado || hardware.status || hardware.estado || 'available';
      this.setInputValue('hardwareStatus', status);

      const warranty = datos.warranty || datos.garantia || hardware.warranty || hardware.garantia || '12';
      this.setInputValue('hardwareWarranty', warranty);

      const description = datos.description || datos.descripcion || hardware.descripcion || '';
      this.setInputValue('hardwareDescription', description);
    }

    resetForm() {
      const form = document.getElementById('hardwareForm');
      if (form) {
        form.reset();
      }

      const sedeSelect = document.getElementById('hardwareSede');
      if (sedeSelect) {
        sedeSelect.innerHTML = '<option value="">Seleccionar sede</option>';
        sedeSelect.disabled = true;
      }
    }

    async handleFormSubmit(event) {
      event.preventDefault();
      if (this.isSubmitting) return;

      const empresaSelect = document.getElementById('hardwareEmpresa');
      const sedeSelect = document.getElementById('hardwareSede');
      const direccionInput = document.getElementById('hardwareDireccion');

      if (!empresaSelect?.value) {
        this.showUpdateModal('Selecciona una empresa.', 'error');
        empresaSelect?.focus();
        return;
      }

      if (!sedeSelect?.value) {
        this.showUpdateModal('Selecciona una sede.', 'error');
        sedeSelect?.focus();
        return;
      }

      if (!direccionInput?.value.trim()) {
        this.showUpdateModal('Ingresa una direccion.', 'error');
        direccionInput?.focus();
        return;
      }

      const empresaNombre = this.getEmpresaNombre(empresaSelect.value, empresaSelect);
      if (!empresaNombre) {
        this.showUpdateModal('No se pudo obtener el nombre de la empresa.', 'error');
        return;
      }

      const isEditing = Boolean(this.editingHardwareId);
      const payload = this.buildPayload({
        empresaId: empresaSelect.value,
        empresaNombre,
        sede: sedeSelect.value
      });

      this.setSubmittingState(true);

      try {
        let response;
        if (isEditing) {
          response = await this.apiClient.update_hardware(this.editingHardwareId, payload);
        } else {
          response = await this.apiClient.create_hardware(payload);
        }

        const data = await response.json();
        if (!response.ok || !data.success) {
          const message = data?.error || (data?.errors || []).join(', ') || 'No se pudo guardar el hardware.';
          this.showUpdateModal(message, 'error');
          return;
        }

        this.closeHardwareModal();
        const main = this.getMain();
        if (main?.loadHardware) {
          await main.loadHardware();
        }

        const successMessage = isEditing
          ? 'Hardware actualizado correctamente.'
          : 'Hardware creado correctamente.';
        this.showUpdateModal(successMessage, 'success');
      } catch (error) {
        this.showUpdateModal('Error al guardar el hardware.', 'error');
      } finally {
        this.setSubmittingState(false);
      }
    }

    buildPayload({ empresaId, empresaNombre, sede }) {
      const price = this.parseNumber(this.getInputValue('hardwarePrice'), 0);
      const stock = this.parseNumber(this.getInputValue('hardwareStock'), 0, true);
      const warranty = this.parseNumber(this.getInputValue('hardwareWarranty'), 12, true);

      return {
        nombre: this.getInputValue('hardwareName'),
        tipo: this.getInputValue('hardwareType'),
        empresa_id: empresaId,
        empresa_nombre: empresaNombre,
        sede: sede,
        direccion: this.getInputValue('hardwareDireccion'),
        datos: {
          datos: {
            brand: this.getInputValue('hardwareBrand'),
            model: this.getInputValue('hardwareModel'),
            price: price,
            stock: stock,
            status: this.getInputValue('hardwareStatus'),
            warranty: warranty,
            description: this.getInputValue('hardwareDescription')
          }
        }
      };
    }

    showHardwareDetails(hardware) {
      this.viewingHardware = hardware;
      const datos = this.extractDatos(hardware);

      this.setModalText('viewHardwareName', hardware.nombre || 'N/A');
      this.setModalText('viewHardwareType', hardware.tipo || 'N/A');

      const empresaNombre = hardware.empresa_nombre
        || this.getEmpresaNombre(hardware.empresa_id)
        || 'N/A';
      this.setModalText('viewHardwareEmpresa', empresaNombre);

      this.setModalText('viewHardwareSede', hardware.sede || 'N/A');
      this.setModalText('viewHardwareDireccion', hardware.direccion || 'N/A');

      this.setModalText('viewHardwareTopic', this.formatTopic(hardware.topic));

      this.setModalText('viewHardwareBrand', datos.brand || datos.marca || hardware.marca || 'N/A');
      this.setModalText('viewHardwareModel', datos.model || datos.modelo || hardware.modelo || 'N/A');

      const price = datos.price || datos.precio || hardware.precio;
      this.setModalText('viewHardwarePrice', price ? `$${price}` : 'N/A');

      const stock = datos.stock || hardware.stock;
      this.setModalText('viewHardwareStock', stock !== undefined ? `${stock} unidades` : 'N/A');

      this.setModalText('viewHardwareStatus', this.formatStatus(datos, hardware));

      const warranty = datos.warranty || datos.garantia || hardware.warranty || hardware.garantia;
      this.setModalText('viewHardwareWarranty', warranty ? `${warranty} meses` : 'N/A');

      this.setModalText('viewHardwareActive', this.formatActiveStatus(hardware.activa));
      this.setModalText('viewHardwareCreated', this.formatCreationDate(hardware));

      const description = datos.description || datos.descripcion || hardware.descripcion || 'Sin descripcion';
      this.setModalText('viewHardwareDescription', description);

      const physicalStatus = hardware.physical_status
        || hardware.physicalStatus
        || hardware.estado_fisico
        || datos.physical_status
        || datos.physicalStatus
        || datos.estado_fisico;

      this.renderPhysicalStatus(physicalStatus);
    }

    renderPhysicalStatus(physicalStatus) {
      const container = document.getElementById('viewHardwarePhysicalStatus');
      if (!container) return;

      const card = container.closest('[data-physical-status-card]');
      container.innerHTML = '';

      const hiddenKeys = new Set(['tipo_mensaje', 'id_dispositivo']);

      let statusData = physicalStatus;
      if (typeof statusData === 'string') {
        try {
          statusData = JSON.parse(statusData);
        } catch (error) {
          statusData = null;
        }
      }

      if (!statusData || typeof statusData !== 'object' || Array.isArray(statusData)) {
        const empty = document.createElement('em');
        empty.className = 'text-gray-200';
        empty.textContent = 'Sin estado fisico disponible';
        container.appendChild(empty);
        if (card) card.classList.add('hidden');
        return;
      }

      const entries = Object.entries(statusData).filter(([key]) => !hiddenKeys.has(key));
      if (!entries.length) {
        const empty = document.createElement('em');
        empty.className = 'text-gray-200';
        empty.textContent = 'Sin estado fisico disponible';
        container.appendChild(empty);
        if (card) card.classList.add('hidden');
        return;
      }

      if (card) card.classList.remove('hidden');

      entries.forEach(([key, value]) => {
        const row = document.createElement('div');
        row.className = 'flex flex-wrap items-start justify-between gap-2 rounded-lg bg-white/10 px-3 py-2';

        const label = document.createElement('span');
        label.className = 'text-white/90 font-semibold';
        label.textContent = this.formatPhysicalLabel(key);

        const content = document.createElement('span');
        content.className = 'text-white/90';
        if (key === 'updated_at') {
          content.textContent = this.formatDateTime(value);
        } else {
          content.textContent = this.formatPhysicalValue(value);
        }

        row.appendChild(label);
        row.appendChild(content);
        container.appendChild(row);
      });
    }

    async renderLocationMap(hardwareName) {
      const mapContainer = document.getElementById('locationMap');
      if (!mapContainer) return;

      mapContainer.innerHTML = this.getMapLoadingMarkup();

      if (!this.currentLocationUrl) {
        mapContainer.innerHTML = this.getMapErrorMarkup('No hay una ubicacion disponible.');
        return;
      }

      const coords = this.extractCoordinates(this.currentLocationUrl);
      if (!coords) {
        mapContainer.innerHTML = this.getMapErrorMarkup('No se pudieron extraer coordenadas.');
        return;
      }

      try {
        await this.ensureLeafletLoaded();
      } catch (error) {
        mapContainer.innerHTML = this.getMapErrorMarkup('Error al cargar el mapa.');
        return;
      }

      if (this.currentMap) {
        try {
          this.currentMap.remove();
        } catch (error) {
          // ignore
        }
        this.currentMap = null;
        this.currentMarker = null;
      }

      mapContainer.innerHTML = '';

      this.currentMap = L.map(mapContainer, {
        center: [coords.lat, coords.lng],
        zoom: coords.zoom,
        zoomControl: true,
        attributionControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '(c) OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(this.currentMap);

      this.currentMarker = L.marker([coords.lat, coords.lng], {
        title: hardwareName
      }).addTo(this.currentMap);

      this.currentMarker.bindPopup(
        `<div style="text-align:center; padding:4px;">
          <strong>${this.escapeHtml(hardwareName)}</strong><br>
          <small>Lat: ${coords.lat.toFixed(6)}, Lng: ${coords.lng.toFixed(6)}</small>
        </div>`
      ).openPopup();

      setTimeout(() => {
        if (this.currentMap) {
          this.currentMap.invalidateSize(true);
          this.currentMap.setView([coords.lat, coords.lng], coords.zoom);
        }
      }, 200);
    }

    ensureLeafletLoaded() {
      if (this.leafletLoaded && typeof L !== 'undefined') {
        return Promise.resolve();
      }

      if (this.leafletPromise) return this.leafletPromise;

      this.leafletPromise = new Promise((resolve, reject) => {
        if (!document.querySelector('link[data-leaflet="true"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          link.dataset.leaflet = 'true';
          document.head.appendChild(link);
        }

        if (typeof L !== 'undefined') {
          this.leafletLoaded = true;
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => {
          this.leafletLoaded = true;
          resolve();
        };
        script.onerror = () => reject(new Error('Leaflet load error'));
        document.head.appendChild(script);
      });

      return this.leafletPromise;
    }

    extractCoordinates(url) {
      if (!url) return null;

      let match = url.match(/#map=(\d+)\/([-\d.]+)\/([-\d.]+)/);
      if (match) {
        return { lat: parseFloat(match[2]), lng: parseFloat(match[3]), zoom: parseInt(match[1], 10) };
      }

      match = url.match(/@([-\d.]+),([-\d.]+),(\d+)z/);
      if (match) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]), zoom: parseInt(match[3], 10) };
      }

      match = url.match(/search\/([-\d.]+),([-\d.]+)/);
      if (match) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]), zoom: 15 };
      }

      match = url.match(/([-\d.]+),([-\d.]+)/);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return { lat, lng, zoom: 15 };
        }
      }

      return null;
    }

    getMapLoadingMarkup() {
      return `
        <div class="w-full h-full min-h-[400px] flex items-center justify-center">
          <div class="text-center">
            <i class="fas fa-spinner fa-spin text-3xl text-blue-400 mb-4"></i>
            <p class="text-white/80">Cargando mapa...</p>
          </div>
        </div>
      `;
    }

    getMapErrorMarkup(message) {
      return `
        <div class="w-full h-full min-h-[400px] flex items-center justify-center">
          <div class="text-center">
            <i class="fas fa-triangle-exclamation text-3xl text-rose-400 mb-4"></i>
            <p class="text-white/80">${this.escapeHtml(message)}</p>
          </div>
        </div>
      `;
    }

    setModalText(id, value) {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    }

    setInputValue(id, value) {
      const input = document.getElementById(id);
      if (input) {
        input.value = value !== undefined && value !== null ? value : '';
      }
    }

    getInputValue(id) {
      const input = document.getElementById(id);
      if (!input) return '';
      return input.value?.trim ? input.value.trim() : input.value;
    }

    getEmpresaNombre(empresaId, empresaSelect = null) {
      const select = empresaSelect || document.getElementById('hardwareEmpresa');
      if (select) {
        const option = select.options[select.selectedIndex];
        if (option?.dataset?.nombre) {
          return option.dataset.nombre;
        }
        if (option?.textContent) {
          return option.textContent.trim();
        }
      }

      const main = this.getMain();
      if (main && Array.isArray(main.empresas)) {
        const empresa = main.empresas.find((item) => item && item._id === empresaId);
        if (empresa?.nombre) {
          return empresa.nombre;
        }
      }
      return '';
    }

    setSubmittingState(isSubmitting) {
      this.isSubmitting = isSubmitting;
      const submitButton = document.getElementById('submitButton');
      const submitButtonText = document.getElementById('submitButtonText');
      if (submitButton) {
        submitButton.disabled = isSubmitting;
        submitButton.classList.toggle('opacity-60', isSubmitting);
      }
      if (submitButtonText) {
        submitButtonText.textContent = isSubmitting
          ? 'Guardando...'
          : (this.editingHardwareId ? 'Actualizar Hardware' : 'Crear Hardware');
      }
    }

    parseNumber(value, fallback, integer = false) {
      const numberValue = integer ? parseInt(value, 10) : parseFloat(value);
      if (Number.isNaN(numberValue)) return fallback;
      return integer ? Math.max(0, numberValue) : Math.max(0, numberValue);
    }

    extractDatos(hardware) {
      if (!hardware || !hardware.datos) return {};

      const normalize = (data) => {
        let current = data;
        let depth = 0;
        while (current && typeof current === 'object' && current.datos && depth < 3) {
          current = current.datos;
          depth += 1;
        }
        return current || {};
      };

      if (typeof hardware.datos === 'object') {
        return normalize(hardware.datos);
      }

      if (typeof hardware.datos === 'string') {
        try {
          const parsed = JSON.parse(hardware.datos);
          return normalize(parsed);
        } catch (error) {
          return {};
        }
      }

      return {};
    }

    formatStatus(datos, hardware) {
      const raw = (datos.status || datos.estado || hardware.status || hardware.estado || 'available').toString().toLowerCase();
      if (raw === 'available' || raw === 'disponible') return 'Disponible';
      if (raw === 'out_of_stock' || raw === 'sin_stock') return 'Sin Stock';
      if (raw === 'discontinued' || raw === 'descontinuado') return 'Descontinuado';
      return raw;
    }

    formatActiveStatus(activa) {
      if (activa === false || activa === 'false' || activa === 0) {
        return 'Inactivo';
      }
      return 'Activo';
    }

    formatCreationDate(hardware) {
      const raw = hardware.fecha_creacion || hardware.created_at || hardware.createdAt;
      if (!raw) return 'N/A';
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) return raw;
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    formatTopic(topic) {
      if (!topic) return 'empresas/No generado';
      const trimmed = String(topic).trim();
      if (trimmed.startsWith('empresas/')) return trimmed;
      return `empresas/${trimmed}`;
    }

    formatPhysicalLabel(key) {
      const map = {
        updated_at: 'Ultima verificacion',
        estado: 'Estado',
        RAM: 'RAM',
        buff: 'Buffer',
        ip: 'IP',
        out: 'Salida'
      };
      if (map[key]) return map[key];
      const cleaned = String(key).replace(/_/g, ' ');
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    formatPhysicalValue(value) {
      if (value === null || value === undefined) return 'N/A';
      if (typeof value === 'boolean') return value ? 'Si' : 'No';
      if (Array.isArray(value)) return value.length ? value.join(', ') : 'N/A';
      if (typeof value === 'object') {
        const entries = Object.entries(value);
        if (!entries.length) return 'N/A';
        return entries
          .map(([key, nestedValue]) => `${key}: ${this.formatPhysicalValue(nestedValue)}`)
          .join(' - ');
      }
      return String(value);
    }

    formatDateTime(value) {
      if (!value) return 'N/A';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      return date.toLocaleString('es-ES');
    }

    showUpdateModal(message, type = 'success') {
      const modal = document.getElementById('clientUpdateModal');
      if (!modal) return;

      const title = document.getElementById('updateModalTitle');
      const text = document.getElementById('updateModalMessage');
      const icon = document.getElementById('updateModalIconFa');

      if (title) {
        title.textContent = type === 'error' ? 'Error' : 'Proceso completado';
      }
      if (text) {
        text.textContent = message;
      }
      if (icon) {
        icon.className = type === 'error'
          ? 'fas fa-triangle-exclamation text-4xl text-rose-400'
          : 'fas fa-check text-4xl text-emerald-400';
      }

      this.modalManager.open('clientUpdateModal');
    }

    escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  }

  const initAdminHardwareModals = () => {
    if (window.adminHardwareModals) {
      return window.adminHardwareModals;
    }
    window.adminHardwareModals = new AdminHardwareModals();
    return window.adminHardwareModals;
  };

  window.initAdminHardwareModals = initAdminHardwareModals;

  if (!window.ADMIN_SPA_MANUAL_INIT) {
    initAdminHardwareModals();
  }

  const ensureHardwareContext = () => {
    if (window.initAdminHardwareMain) {
      window.initAdminHardwareMain();
    }
    return window.adminHardwareModals || initAdminHardwareModals();
  };

  window.openHardwareCreateModal = () => ensureHardwareContext()?.openHardwareCreateModal();
  window.openHardwareEditModal = (id) => ensureHardwareContext()?.openHardwareEditModal(id);
  window.closeHardwareModal = () => ensureHardwareContext()?.closeHardwareModal();

  window.openHardwareViewModal = (id) => ensureHardwareContext()?.openHardwareViewModal(id);
  window.closeHardwareViewModal = () => ensureHardwareContext()?.closeHardwareViewModal();

  window.openHardwareToggleModal = (id, activa) => ensureHardwareContext()?.openHardwareToggleModal(id, activa);
  window.closeHardwareToggleModal = () => ensureHardwareContext()?.closeHardwareToggleModal();
  window.confirmHardwareToggle = () => ensureHardwareContext()?.confirmHardwareToggle();

  window.openHardwareLocationModal = (id, url) => ensureHardwareContext()?.openHardwareLocationModal(id, url);
  window.closeHardwareLocationModal = () => ensureHardwareContext()?.closeHardwareLocationModal();
  window.openHardwareLocationInNewTab = () => ensureHardwareContext()?.openHardwareLocationInNewTab();

  window.closeHardwareUpdateModal = () => ensureHardwareContext()?.closeHardwareUpdateModal();
})();
