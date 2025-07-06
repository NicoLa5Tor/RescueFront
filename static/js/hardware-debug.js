/**
 * Script de Debug para Hardware Modal
 * Usar en consola del navegador para probar diferentes estructuras de datos
 */

// Datos de prueba con diferentes estructuras
const testHardwareData = {
  // Caso 1: Estructura completa y correcta
  complete: {
    _id: "test-complete",
    nombre: "Servidor Dell PowerEdge",
    tipo: "Servidor",
    empresa_nombre: "ACME Corp",
    sede: "Oficina Central",
    activa: true,
    fecha_creacion: "2024-01-15T10:30:00Z",
    datos: {
      brand: "Dell",
      model: "PowerEdge R740",
      price: 2500,
      stock: 5,
      status: "available",
      warranty: 24,
      description: "Servidor empresarial de alto rendimiento"
    }
  },

  // Caso 2: Datos anidados en datos.datos
  nested: {
    _id: "test-nested",
    nombre: "Laptop HP Elite",
    tipo: "Laptop",
    empresa_nombre: "Tech Solutions",
    sede: "Sucursal Norte",
    activa: true,
    fecha_creacion: "2024-02-20T14:15:00Z",
    datos: {
      datos: {
        brand: "HP",
        model: "EliteBook 850",
        price: 1200,
        stock: 3,
        status: "available",
        warranty: 12,
        description: "Laptop empresarial para ejecutivos"
      }
    }
  },

  // Caso 3: Datos como string JSON
  jsonString: {
    _id: "test-json-string",
    nombre: "Router Cisco",
    tipo: "Networking",
    empresa_nombre: "ConnectIT",
    sede: "Data Center",
    activa: false,
    fecha_creacion: "2024-03-10T09:45:00Z",
    datos: '{"brand":"Cisco","model":"ISR 4321","price":800,"stock":2,"status":"discontinued","warranty":36,"description":"Router empresarial para redes medianas"}'
  },

  // Caso 4: Datos mínimos (muchos campos faltantes)
  minimal: {
    _id: "test-minimal",
    nombre: "Hardware Desconocido",
    tipo: null,
    activa: true
  },

  // Caso 5: Datos con nombres de campos alternativos
  alternative: {
    _id: "test-alternative",
    name: "Switch Netgear", // nombre alternativo
    type: "Switch", // tipo alternativo
    company: "NetworkPro", // empresa alternativo
    location: "Sala de Servidores", // sede alternativo
    active: true, // activa alternativo
    created_at: "2024-04-05T16:20:00Z", // fecha alternativa
    datos: {
      marca: "Netgear", // brand alternativo
      modelo: "GS724T", // model alternativo
      precio: 300, // price alternativo
      stock: 8,
      estado: "disponible", // status alternativo
      garantia: 18, // warranty alternativo
      descripcion: "Switch administrable de 24 puertos" // description alternativo
    }
  },

  // Caso 6: Datos completamente vacíos
  empty: {
    _id: "test-empty"
  },

  // Caso 7: Datos con valores nulos
  nullValues: {
    _id: "test-null",
    nombre: null,
    tipo: null,
    empresa_nombre: null,
    sede: null,
    activa: null,
    fecha_creacion: null,
    datos: null
  }
};

// Función para probar diferentes casos
function testHardwareModal(testCase = 'complete') {
  console.log(`🧪 Probando caso: ${testCase}`);
  
  if (!testHardwareData[testCase]) {
    console.error('❌ Caso de prueba no encontrado:', testCase);
    console.log('📝 Casos disponibles:', Object.keys(testHardwareData));
    return;
  }

  const data = testHardwareData[testCase];
  console.log('📦 Datos de prueba:', data);

  if (typeof showHardwareDetails === 'function') {
    showHardwareDetails(data);
  } else {
    console.error('❌ Función showHardwareDetails no encontrada');
  }
}

// Función para probar todos los casos
function testAllCases() {
  console.log('🧪 Probando todos los casos de hardware...');
  
  Object.keys(testHardwareData).forEach((testCase, index) => {
    setTimeout(() => {
      console.log(`\n--- Prueba ${index + 1}: ${testCase} ---`);
      testHardwareModal(testCase);
      
      // Cerrar el modal después de 3 segundos
      setTimeout(() => {
        if (typeof closeViewModal === 'function') {
          closeViewModal();
        }
      }, 3000);
    }, index * 4000); // 4 segundos entre cada prueba
  });
}

// Función para simular error de API
function simulateAPIError() {
  console.log('🧪 Simulando error de API...');
  
  // Simular datos corruptos
  const corruptData = {
    _id: "test-corrupt",
    nombre: undefined,
    datos: "invalid json {{"
  };
  
  try {
    showHardwareDetails(corruptData);
  } catch (error) {
    console.log('✅ Error capturado correctamente:', error);
  }
}

// Exportar funciones para uso en consola
window.testHardwareModal = testHardwareModal;
window.testAllCases = testAllCases;
window.simulateAPIError = simulateAPIError;
window.testHardwareData = testHardwareData;

console.log(`
🧪 Hardware Debug Script Cargado
===============================

Funciones disponibles:
- testHardwareModal('casoDePrueba') - Probar un caso específico
- testAllCases() - Probar todos los casos automáticamente  
- simulateAPIError() - Simular error con datos corruptos

Casos de prueba disponibles:
${Object.keys(testHardwareData).map(key => `- ${key}`).join('\n')}

Ejemplo de uso:
testHardwareModal('minimal')
`);
