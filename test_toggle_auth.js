// test_toggle_auth.js - Probar toggle status con autenticación
const http = require('http');

// Función para hacer peticiones HTTP
function makeRequest(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: 'localhost',
      port: 5002,
      path: path,
      method: method,
      headers: headers
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

async function testToggleAuth() {
  console.log('🔐 TESTING TOGGLE STATUS CON AUTENTICACIÓN');
  console.log('==========================================\n');

  try {
    // Step 1: Login para obtener token
    console.log('1️⃣ Haciendo login para obtener token...');
    const loginResponse = await makeRequest('/auth/login', 'POST', {
      usuario: 'superadmin',
      password: 'admin123'
    });

    if (loginResponse.status === 200 && loginResponse.data.success) {
      const token = loginResponse.data.token;
      const user = loginResponse.data.user;
      console.log(`   ✅ Login exitoso!`);
      console.log(`   👤 Usuario: ${user.username} (${user.role})`);
      console.log(`   🎫 Token: ${token.substring(0, 20)}...`);
    } else {
      console.log(`   ❌ Error en login: Status ${loginResponse.status}`);
      console.log(`   📄 Response:`, loginResponse.data);
      return;
    }

    const token = loginResponse.data.token;

    console.log('\n' + '='.repeat(50) + '\n');

    // Step 2: Obtener lista de tipos para encontrar uno
    console.log('2️⃣ Obteniendo lista de tipos de empresa...');
    const tiposResponse = await makeRequest('/api/tipos_empresa/dashboard/all', 'GET', null, token);
    
    if (tiposResponse.status === 200 && tiposResponse.data.success) {
      const tipos = tiposResponse.data.data;
      console.log(`   ✅ Tipos obtenidos: ${tipos.length}`);
      
      if (tipos.length > 0) {
        const tipoTest = tipos[0];
        console.log(`   🎯 Tipo seleccionado para test: "${tipoTest.nombre}" (activo: ${tipoTest.activo})`);
        
        console.log('\n' + '='.repeat(50) + '\n');

        // Step 3: Probar toggle status SIN token (debería fallar con 401)
        console.log('3️⃣ Probando toggle status SIN token (debe fallar con 401)...');
        const toggleWithoutToken = await makeRequest(`/api/tipos_empresa/${tipoTest._id}/toggle-status`, 'PATCH');
        
        console.log(`   📊 Status: ${toggleWithoutToken.status}`);
        if (toggleWithoutToken.status === 401) {
          console.log(`   ✅ Correcto! Error 401 como esperado sin token`);
        } else {
          console.log(`   ❌ Inesperado! Debería ser 401 pero fue ${toggleWithoutToken.status}`);
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Step 4: Probar toggle status CON token (debería funcionar)
        console.log('4️⃣ Probando toggle status CON token (debe funcionar)...');
        const toggleWithToken = await makeRequest(`/api/tipos_empresa/${tipoTest._id}/toggle-status`, 'PATCH', null, token);
        
        console.log(`   📊 Status: ${toggleWithToken.status}`);
        if (toggleWithToken.status === 200 && toggleWithToken.data.success) {
          console.log(`   ✅ Toggle exitoso!`);
          console.log(`   💬 Mensaje: ${toggleWithToken.data.message}`);
          console.log(`   📝 Nuevo estado: ${toggleWithToken.data.data.activo}`);
        } else {
          console.log(`   ❌ Error en toggle: Status ${toggleWithToken.status}`);
          console.log(`   📄 Response:`, toggleWithToken.data);
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Step 5: Revertir el cambio
        console.log('5️⃣ Revirtiendo el cambio...');
        const revertToggle = await makeRequest(`/api/tipos_empresa/${tipoTest._id}/toggle-status`, 'PATCH', null, token);
        
        if (revertToggle.status === 200 && revertToggle.data.success) {
          console.log(`   ✅ Revert exitoso!`);
          console.log(`   📝 Estado original restaurado: ${revertToggle.data.data.activo}`);
        } else {
          console.log(`   ❌ Error en revert: Status ${revertToggle.status}`);
        }

      } else {
        console.log(`   ❌ No hay tipos de empresa para probar`);
      }
    } else {
      console.log(`   ❌ Error obteniendo tipos: Status ${tiposResponse.status}`);
    }

    console.log('\n🎉 TESTS DE AUTENTICACIÓN COMPLETADOS!');

  } catch (error) {
    console.error('💥 Error durante las pruebas:', error);
  }
}

// Ejecutar tests
testToggleAuth();
