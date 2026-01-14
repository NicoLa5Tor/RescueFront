/**
 * ===== HARDWARE TEST UTILITIES =====
 * 
 * Script para probar las funcionalidades de hardware y detectar errores
 */

class HardwareTestSuite {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  /**
   * Add a test case
   */
  addTest(name, testFunction) {
    this.tests.push({
      name,
      testFunction
    });
  }

  /**
   * Run all tests
   */
  async runTests() {
    ////console.log('🧪 Ejecutando pruebas de hardware...');
    
    for (const test of this.tests) {
      try {
        ////console.log(`\n🔬 Ejecutando: ${test.name}`);
        const result = await test.testFunction();
        if (result) {
          //console.log(`✅ PASÓ: ${test.name}`);
          this.results.passed++;
        } else {
          //console.log(`❌ FALLÓ: ${test.name}`);
          this.results.failed++;
        }
      } catch (error) {
        //console.error(`💥 ERROR en ${test.name}:`, error);
        this.results.failed++;
      }
      this.results.total++;
    }

    this.showResults();
  }

  /**
   * Show test results
   */
  showResults() {
    //console.log('\n📊 RESULTADOS DE PRUEBAS:');
    //console.log(`Total: ${this.results.total}`);
    //console.log(`Pasaron: ${this.results.passed}`);
    //console.log(`Fallaron: ${this.results.failed}`);
    //console.log(`Porcentaje de éxito: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
  }

  /**
   * Test empresa validation
   */
  testEmpresaValidation() {
    if (!window.hardwareValidator) {
      //console.warn('Validator no disponible');
      return false;
    }

    // Test valid empresa
    const validResult = window.hardwareValidator.validateEmpresa('test-id', 'Test Company');
    if (!validResult.isValid) {
      //console.error('Validación de empresa válida falló');
      return false;
    }

    // Test invalid empresa - no ID
    const invalidResult1 = window.hardwareValidator.validateEmpresa('', 'Test Company');
    if (invalidResult1.isValid) {
      //console.error('Validación debería fallar con ID vacío');
      return false;
    }

    // Test invalid empresa - no name
    const invalidResult2 = window.hardwareValidator.validateEmpresa('test-id', '');
    if (invalidResult2.isValid) {
      //console.error('Validación debería fallar con nombre vacío');
      return false;
    }

    return true;
  }

  /**
   * Test sede validation
   */
  testSedeValidation() {
    if (!window.hardwareValidator) {
      //console.warn('Validator no disponible');
      return false;
    }

    // Test valid sede
    const validResult = window.hardwareValidator.validateSede('Principal', 'test-empresa-id');
    if (!validResult.isValid) {
      //console.error('Validación de sede válida falló');
      return false;
    }

    // Test invalid sede - no value
    const invalidResult1 = window.hardwareValidator.validateSede('', 'test-empresa-id');
    if (invalidResult1.isValid) {
      //console.error('Validación debería fallar con sede vacía');
      return false;
    }

    // Test invalid sede - no empresa
    const invalidResult2 = window.hardwareValidator.validateSede('Principal', '');
    if (invalidResult2.isValid) {
      //console.error('Validación debería fallar sin empresa');
      return false;
    }

    return true;
  }

  /**
   * Test form elements exist
   */
  testFormElements() {
    const requiredElements = [
      'hardwareEmpresa',
      'hardwareSede',
      'hardwareName',
      'hardwareType'
    ];

    for (const elementId of requiredElements) {
      const element = document.getElementById(elementId);
      if (!element) {
        //console.error(`Elemento requerido no encontrado: ${elementId}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Test empresa dropdown population
   */
  testEmpresaDropdown() {
    const empresaSelect = document.getElementById('hardwareEmpresa');
    if (!empresaSelect) {
      //console.error('Dropdown de empresa no encontrado');
      return false;
    }

    // Check if it has options
    if (empresaSelect.options.length < 2) { // At least default + one empresa
      //console.warn('Dropdown de empresa no tiene suficientes opciones');
      return false;
    }

    // Check if options have proper dataset
    for (let i = 1; i < empresaSelect.options.length; i++) {
      const option = empresaSelect.options[i];
      if (!option.value || !option.dataset.nombre) {
        //console.error('Opción de empresa mal configurada:', option);
        return false;
      }
    }

    return true;
  }

  /**
   * Test loadSedesByEmpresa function
   */
  testLoadSedesByEmpresa() {
    if (typeof window.loadSedesByEmpresa !== 'function') {
      //console.error('Función loadSedesByEmpresa no disponible');
      return false;
    }

    // Test that it doesn't throw errors
    try {
      window.loadSedesByEmpresa();
      return true;
    } catch (error) {
      //console.error('Error al ejecutar loadSedesByEmpresa:', error);
      return false;
    }
  }

  /**
   * Test hardware core instance
   */
  testHardwareCoreInstance() {
    if (!window.hardwareCore) {
      //console.error('Instancia de hardwareCore no disponible');
      return false;
    }

    // Check required methods
    const requiredMethods = [
      'loadHardwareDataIntoForm',
      'handleFormSubmit',
      'editHardware',
      'viewHardware'
    ];

    for (const method of requiredMethods) {
      if (typeof window.hardwareCore[method] !== 'function') {
        //console.error(`Método requerido no encontrado: ${method}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Test empresas data structure
   */
  testEmpresasData() {
    if (!window.empresas) {
      //console.warn('window.empresas no disponible');
      return false;
    }

    if (!Array.isArray(window.empresas)) {
      //console.error('window.empresas no es un array');
      return false;
    }

    // Check structure of first empresa if available
    if (window.empresas.length > 0) {
      const empresa = window.empresas[0];
      const requiredFields = ['_id', 'nombre'];
      
      for (const field of requiredFields) {
        if (!empresa[field]) {
          //console.error(`Campo requerido faltante en empresa: ${field}`);
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Test complete form submission flow (mock)
   */
  testFormSubmissionFlow() {
    if (!window.hardwareCore) {
      //console.error('hardwareCore no disponible');
      return false;
    }

    // Mock form data
    const mockFormData = {
      nombre: 'Test Hardware',
      tipo: 'Test Type',
      empresa_id: 'test-empresa-id',
      empresa_nombre: 'Test Empresa',
      sede: 'Principal',
      datos: {
        datos: {
          brand: 'Test Brand',
          model: 'Test Model',
          price: 100,
          stock: 5
        }
      }
    };

    // Test validation if available
    if (window.hardwareValidator) {
      const validation = window.hardwareValidator.validateHardwareData(mockFormData);
      if (!validation.isValid) {
        //console.error('Validación de datos mock falló:', validation.errors);
        return false;
      }
    }

    return true;
  }
}

// Initialize test suite when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Wait a bit for all modules to load
  setTimeout(() => {
    if (window.location.search.includes('test=true')) {
      const testSuite = new HardwareTestSuite();
      
      // Add all tests
      testSuite.addTest('Validación de empresa', () => testSuite.testEmpresaValidation());
      testSuite.addTest('Validación de sede', () => testSuite.testSedeValidation());
      testSuite.addTest('Elementos de formulario', () => testSuite.testFormElements());
      testSuite.addTest('Dropdown de empresa', () => testSuite.testEmpresaDropdown());
      testSuite.addTest('Función loadSedesByEmpresa', () => testSuite.testLoadSedesByEmpresa());
      testSuite.addTest('Instancia de hardwareCore', () => testSuite.testHardwareCoreInstance());
      testSuite.addTest('Datos de empresas', () => testSuite.testEmpresasData());
      testSuite.addTest('Flujo de envío de formulario', () => testSuite.testFormSubmissionFlow());
      
      // Run tests
      testSuite.runTests();
      
      // Make test suite available globally for manual testing
      window.hardwareTestSuite = testSuite;
    }
  }, 2000);
});

//console.log('🧪 Suite de pruebas de hardware cargada. Añade ?test=true a la URL para ejecutar.');
