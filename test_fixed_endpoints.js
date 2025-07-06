// test_fixed_endpoints.js - Probar endpoints corregidos de tipos de empresa
const http = require('http');

// Función para hacer peticiones HTTP
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5002,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testEndpoints() {
  console.log('🧪 TESTING ENDPOINTS CORREGIDOS');
  console.log('================================\n');

  try {
    // Test 1: Endpoint solo activos
    console.log('1️⃣ Testing endpoint SOLO ACTIVOS: /api/tipos_empresa');
    const activosResponse = await makeRequest('/api/tipos_empresa');
    
    if (activosResponse.status === 200 && activosResponse.data.success) {
      const activos = activosResponse.data.data;
      console.log(`   ✅ Status: ${activosResponse.status}`);
      console.log(`   📊 Count: ${activosResponse.data.count || activos.length}`);
      console.log(`   📋 Total: ${activosResponse.data.total}`);
      
      if (activos.length > 0) {
        const primero = activos[0];
        console.log(`   🔍 Primer tipo: "${primero.nombre}"`);
        console.log(`   🏷️  Características: ${primero.caracteristicas ? primero.caracteristicas.length : 0}`);
        console.log(`   🏢 Empresas count: ${primero.empresas_count || 'N/A'}`);
        
        if (primero.caracteristicas && primero.caracteristicas.length > 0) {
          console.log(`   📝 Ejemplo características: [${primero.caracteristicas.slice(0, 2).join(', ')}]`);
        }
      }
    } else {
      console.log(`   ❌ Error: Status ${activosResponse.status}`);
      console.log(`   📄 Response:`, activosResponse.data);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Endpoint dashboard con todos
    console.log('2️⃣ Testing endpoint DASHBOARD (TODOS): /api/tipos_empresa/dashboard/all');
    const dashboardResponse = await makeRequest('/api/tipos_empresa/dashboard/all');
    
    if (dashboardResponse.status === 200 && dashboardResponse.data.success) {
      const todos = dashboardResponse.data.data;
      console.log(`   ✅ Status: ${dashboardResponse.status}`);
      console.log(`   📊 Count: ${dashboardResponse.data.count || todos.length}`);
      console.log(`   📋 Total: ${dashboardResponse.data.total}`);
      
      if (todos.length > 0) {
        const activos = todos.filter(t => t.activo);
        const inactivos = todos.filter(t => !t.activo);
        console.log(`   🟢 Activos: ${activos.length}`);
        console.log(`   🔴 Inactivos: ${inactivos.length}`);
        
        const primero = todos[0];
        console.log(`   🔍 Primer tipo: "${primero.nombre}" (activo: ${primero.activo})`);
        console.log(`   🏷️  Características: ${primero.caracteristicas ? primero.caracteristicas.length : 0}`);
        console.log(`   🏢 Empresas count: ${primero.empresas_count || 'N/A'}`);
        
        if (primero.caracteristicas && primero.caracteristicas.length > 0) {
          console.log(`   📝 Ejemplo características: [${primero.caracteristicas.slice(0, 2).join(', ')}]`);
        }
      }
    } else {
      console.log(`   ❌ Error: Status ${dashboardResponse.status}`);
      console.log(`   📄 Response:`, dashboardResponse.data);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Comparar si ambos endpoints devuelven características
    console.log('3️⃣ COMPARISON: Características en ambos endpoints');
    
    if (activosResponse.data.success && dashboardResponse.data.success) {
      const activosData = activosResponse.data.data;
      const dashboardData = dashboardResponse.data.data;
      
      console.log('   📊 RESUMEN:');
      console.log(`   - Solo activos: ${activosData.length} tipos`);
      console.log(`   - Dashboard (todos): ${dashboardData.length} tipos`);
      
      // Verificar si tienen características
      const activosConCarac = activosData.filter(t => t.caracteristicas && t.caracteristicas.length > 0);
      const dashboardConCarac = dashboardData.filter(t => t.caracteristicas && t.caracteristicas.length > 0);
      
      console.log(`   - Activos con características: ${activosConCarac.length}`);
      console.log(`   - Dashboard con características: ${dashboardConCarac.length}`);
      
      // Verificar si tienen empresas_count
      const activosConCount = activosData.filter(t => t.empresas_count !== undefined);
      const dashboardConCount = dashboardData.filter(t => t.empresas_count !== undefined);
      
      console.log(`   - Activos con empresas_count: ${activosConCount.length}`);
      console.log(`   - Dashboard con empresas_count: ${dashboardConCount.length}`);
      
      if (activosConCarac.length > 0 && dashboardConCarac.length > 0) {
        console.log('   ✅ CARACTERÍSTICAS: Ambos endpoints incluyen características correctamente');
      } else {
        console.log('   ❌ CARACTERÍSTICAS: Problema con características en uno o ambos endpoints');
      }
      
      if (activosConCount.length > 0 && dashboardConCount.length > 0) {
        console.log('   ✅ EMPRESAS_COUNT: Ambos endpoints incluyen conteo de empresas correctamente');
      } else {
        console.log('   ❌ EMPRESAS_COUNT: Problema con conteo de empresas en uno o ambos endpoints');
      }
    }

    console.log('\n🎉 TESTS COMPLETADOS!');

  } catch (error) {
    console.error('💥 Error durante las pruebas:', error);
  }
}

// Ejecutar tests
testEndpoints();
