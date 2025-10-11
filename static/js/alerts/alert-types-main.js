(function() {
  'use strict';

  const modalId = 'createAlertTypeModal';
  const form = document.getElementById('createAlertTypeForm');
  const feedbackEl = document.getElementById('alertTypeFormFeedback');
  const submitBtn = document.getElementById('createAlertTypeSubmit');
  const colorInput = document.getElementById('alertTypeColor');
  const colorPicker = document.getElementById('alertTypeColorPicker');
  const severitySelect = document.getElementById('alertTypeSeverity');

  if (window.modalManager && typeof window.modalManager.setupModal === 'function') {
    window.modalManager.setupModal(modalId, { closeOnBackdropClick: true });
  }

  function resetForm() {
    if (!form) return;
    form.reset();
    if (colorInput) {
      colorInput.value = '#FF0000';
    }
    if (colorPicker) {
      colorPicker.value = '#FF0000';
    }
    if (severitySelect) {
      severitySelect.value = '';
    }
    hideFeedback();
  }

  function showFeedback(message) {
    if (!feedbackEl) return;
    feedbackEl.textContent = message;
    feedbackEl.classList.remove('hidden');
  }

  function hideFeedback() {
    if (!feedbackEl) return;
    feedbackEl.textContent = '';
    feedbackEl.classList.add('hidden');
  }

  function parseMultiline(value) {
    if (!value) return [];
    return value
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form || !submitBtn) return;

    hideFeedback();

    const formData = new FormData(form);
    const payload = {
      nombre: (formData.get('nombre') || '').toString().trim(),
      descripcion: (formData.get('descripcion') || '').toString().trim(),
      tipo_alerta: (formData.get('tipo_alerta') || '').toString().trim().toUpperCase(),
      color_alerta: (formData.get('color_alerta') || '').toString().trim(),
      imagen_base64: (formData.get('imagen_base64') || '').toString().trim() || null,
      sonido_link: (formData.get('sonido_link') || '').toString().trim() || null,
      recomendaciones: parseMultiline(document.getElementById('alertTypeRecommendations')?.value || ''),
      implementos_necesarios: parseMultiline(document.getElementById('alertTypeEquipment')?.value || ''),
    };

    const empresaId = (formData.get('empresa_id') || '').toString().trim();
    if (empresaId) {
      payload.empresa_id = empresaId;
    }

    const missing = ['nombre', 'descripcion', 'tipo_alerta', 'color_alerta']
      .filter(field => !payload[field]);

    if (missing.length > 0) {
      showFeedback(`Completa los campos obligatorios: ${missing.join(', ')}`);
      return;
    }

    const originalContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Guardando...';

    try {
      const response = await fetch('/admin/alert-types/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({ success: false, message: 'Error al interpretar la respuesta del servidor.' }));

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No se pudo crear el tipo de alerta.');
      }

      // Cerrar modal y avisar
      closeCreateAlertTypeModal();
      if (window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: 'Tipo creado',
          text: data.message || 'El tipo de alerta se registró correctamente.',
          confirmButtonText: 'Aceptar'
        }).then(() => window.location.reload());
      } else {
        alert(data.message || 'Tipo de alerta creado');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error creating alert type:', error);
      showFeedback(error.message || 'Ocurrió un error al crear el tipo de alerta.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalContent;
    }
  }

  window.openCreateAlertTypeModal = function() {
    resetForm();
    if (window.modalManager) {
      window.modalManager.openModal(modalId, { modalClass: 'ios-modal-open' });
    }
  };

  window.closeCreateAlertTypeModal = function() {
    if (window.modalManager) {
      window.modalManager.closeModal(modalId);
    }
  };

  if (form) {
    form.addEventListener('submit', handleSubmit);
  }

  if (colorPicker && colorInput) {
    colorPicker.addEventListener('input', (e) => {
      colorInput.value = e.target.value;
    });
    colorInput.addEventListener('input', (e) => {
      const value = e.target.value.trim();
      if (/^#?[0-9A-Fa-f]{6}$/.test(value)) {
        colorPicker.value = value.startsWith('#') ? value : `#${value}`;
      }
    });
  }
})();
