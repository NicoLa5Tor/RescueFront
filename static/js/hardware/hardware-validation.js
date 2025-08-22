/**
 * ===== HARDWARE VALIDATION UTILITIES =====
 * 
 * Este archivo contiene utilidades para validar datos de hardware,
 * especialmente los relacionados con empresa y sede.
 */

class HardwareValidator {
  constructor() {
    this.validationRules = {
      empresa: {
        required: true,
        validator: this.validateEmpresa.bind(this)
      },
      sede: {
        required: true,
        validator: this.validateSede.bind(this)
      },
      nombre: {
        required: true,
        minLength: 3,
        validator: this.validateNombre.bind(this)
      }
    };
  }

  /**
   * Validate empresa data
   */
  validateEmpresa(empresaId, empresaNombre) {
    const validation = {
      isValid: true,
      errors: []
    };

    // Check if empresa ID is provided
    if (!empresaId) {
      validation.isValid = false;
      validation.errors.push('ID de empresa es requerido');
      return validation;
    }

    // Check if empresa name is provided
    if (!empresaNombre || empresaNombre.trim() === '') {
      validation.isValid = false;
      validation.errors.push('Nombre de empresa es requerido');
      return validation;
    }

    // Check if empresa exists in the available list
    if (window.empresas && window.empresas.length > 0) {
      const empresaExists = window.empresas.find(emp => emp._id === empresaId);
      if (!empresaExists) {
        validation.isValid = false;
        validation.errors.push(`Empresa con ID ${empresaId} no existe en el sistema`);
        return validation;
      }

      // Validate that the name matches
      if (empresaExists.nombre !== empresaNombre) {
        ////////console.warn(`⚠️ Nombre de empresa no coincide: esperado "${empresaExists.nombre}", recibido "${empresaNombre}"`);
        // Update the name to match the system
        empresaNombre = empresaExists.nombre;
      }
    }

    return validation;
  }

  /**
   * Validate sede data
   */
  validateSede(sedeValue, empresaId) {
    const validation = {
      isValid: true,
      errors: []
    };

    // Check if sede is provided
    if (!sedeValue || sedeValue.trim() === '') {
      validation.isValid = false;
      validation.errors.push('Sede es requerida');
      return validation;
    }

    // Check if empresa is provided first
    if (!empresaId) {
      validation.isValid = false;
      validation.errors.push('Empresa debe estar seleccionada antes de validar sede');
      return validation;
    }

    // Validate sede exists for the selected empresa
    if (window.empresas && window.empresas.length > 0) {
      const empresa = window.empresas.find(emp => emp._id === empresaId);
      if (empresa) {
        if (empresa.sedes && empresa.sedes.length > 0) {
          const sedeExists = empresa.sedes.includes(sedeValue);
          if (!sedeExists) {
            validation.isValid = false;
            validation.errors.push(`Sede "${sedeValue}" no existe para la empresa seleccionada`);
          }
        } else {
          // If no sedes defined, only "Principal" is valid
          if (sedeValue !== 'Principal') {
            validation.isValid = false;
            validation.errors.push('Solo se permite la sede "Principal" para esta empresa');
          }
        }
      }
    }

    return validation;
  }

  /**
   * Validate hardware name
   */
  validateNombre(nombre) {
    const validation = {
      isValid: true,
      errors: []
    };

    if (!nombre || nombre.trim() === '') {
      validation.isValid = false;
      validation.errors.push('Nombre de hardware es requerido');
      return validation;
    }

    if (nombre.length < 3) {
      validation.isValid = false;
      validation.errors.push('Nombre de hardware debe tener al menos 3 caracteres');
      return validation;
    }

    return validation;
  }

  /**
   * Validate complete hardware form data
   */
  validateHardwareData(formData) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validate empresa
    const empresaValidation = this.validateEmpresa(formData.empresa_id, formData.empresa_nombre);
    if (!empresaValidation.isValid) {
      validation.isValid = false;
      validation.errors.push(...empresaValidation.errors);
    }

    // Validate sede
    const sedeValidation = this.validateSede(formData.sede, formData.empresa_id);
    if (!sedeValidation.isValid) {
      validation.isValid = false;
      validation.errors.push(...sedeValidation.errors);
    }

    // Validate nombre
    const nombreValidation = this.validateNombre(formData.nombre);
    if (!nombreValidation.isValid) {
      validation.isValid = false;
      validation.errors.push(...nombreValidation.errors);
    }

    // Additional business logic validations
    if (formData.datos && formData.datos.datos) {
      const datos = formData.datos.datos;
      
      // Validate price
      if (!datos.price || datos.price <= 0) {
        validation.warnings.push('Precio debe ser mayor a 0');
      }

      // Validate stock
      if (datos.stock < 0) {
        validation.errors.push('Stock no puede ser negativo');
        validation.isValid = false;
      }
    }

    return validation;
  }

  /**
   * Get safe empresa data from form
   */
  getSafeEmpresaData(empresaSelect) {
    const empresaData = {
      empresaId: '',
      empresaNombre: '',
      isValid: false,
      error: null
    };

    try {
      if (!empresaSelect || !empresaSelect.value) {
        empresaData.error = 'No hay empresa seleccionada';
        return empresaData;
      }

      empresaData.empresaId = empresaSelect.value;

      // Try to get nombre from dataset first
      const selectedOption = empresaSelect.options[empresaSelect.selectedIndex];
      if (selectedOption && selectedOption.dataset.nombre) {
        empresaData.empresaNombre = selectedOption.dataset.nombre;
      } else if (selectedOption) {
        empresaData.empresaNombre = selectedOption.textContent;
      }

      // Fallback to window.empresas if needed
      if (!empresaData.empresaNombre || empresaData.empresaNombre === 'Seleccionar empresa') {
        const empresa = window.empresas?.find(emp => emp._id === empresaData.empresaId);
        if (empresa) {
          empresaData.empresaNombre = empresa.nombre;
        }
      }

      // Final validation
      if (!empresaData.empresaNombre) {
        empresaData.error = 'No se pudo obtener el nombre de la empresa';
        return empresaData;
      }

      empresaData.isValid = true;
      return empresaData;

    } catch (error) {
      empresaData.error = `Error al obtener datos de empresa: ${error.message}`;
      return empresaData;
    }
  }

  /**
   * Check if empresa data is consistent
   */
  isEmpresaDataConsistent(empresaId, empresaNombre) {
    if (!window.empresas || window.empresas.length === 0) {
      ////////console.warn('⚠️ No hay empresas cargadas para validar consistencia');
      return true; // Assume consistent if no data to compare
    }

    const empresa = window.empresas.find(emp => emp._id === empresaId);
    if (!empresa) {
      ////////console.error('❌ Empresa no encontrada para validar consistencia:', empresaId);
      return false;
    }

    const isConsistent = empresa.nombre === empresaNombre;
    return isConsistent;
  }
}

// Create global instance
window.hardwareValidator = new HardwareValidator();

//////console.log('✅ Hardware validation utilities loaded');
