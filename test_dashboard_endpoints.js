#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Configuración de la API
const BASE_URL = 'http://localhost:5002';

// Helper para hacer peticiones HTTP
function makeRequest(endpoint, method = 'GET', data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + endpoint);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseData);
                    resolve({
                        status: res.statusCode,
                        data: parsedData
                    });
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        data: responseData
                    });
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

// Función principal de prueba
async function testDashboardEndpoints() {
    console.log('🔄 Iniciando pruebas de endpoints de dashboard...\n');

    try {
        // 1. Probar endpoint de empresas para formularios (solo activas)
        console.log('📊 1. Probando /api/empresas (solo activas para formularios)');
        const empresasFormularios = await makeRequest('/api/empresas');
        console.log(`   Status: ${empresasFormularios.status}`);
        if (empresasFormularios.data.success) {
            console.log(`   ✅ Total empresas activas: ${empresasFormularios.data.count}`);
            if (empresasFormularios.data.data.length > 0) {
                console.log(`   📝 Primeras 3 empresas: ${empresasFormularios.data.data.slice(0,3).map(e => `${e.nombre} (activa: ${e.activa})`).join(', ')}`);
            }
        } else {
            console.log(`   ❌ Error: ${JSON.stringify(empresasFormularios.data.errors)}`);
        }
        console.log('');

        // 2. Probar nuevo endpoint de empresas para dashboard (todas)
        console.log('📈 2. Probando /api/empresas/dashboard/all (todas para dashboard)');
        const empresasDashboard = await makeRequest('/api/empresas/dashboard/all');
        console.log(`   Status: ${empresasDashboard.status}`);
        if (empresasDashboard.data.success) {
            const activas = empresasDashboard.data.data.filter(e => e.activa);
            const inactivas = empresasDashboard.data.data.filter(e => !e.activa);
            console.log(`   ✅ Total empresas: ${empresasDashboard.data.count} (activas: ${activas.length}, inactivas: ${inactivas.length})`);
            if (empresasDashboard.data.data.length > 0) {
                console.log(`   📝 Primeras 3 empresas: ${empresasDashboard.data.data.slice(0,3).map(e => `${e.nombre} (activa: ${e.activa})`).join(', ')}`);
            }
        } else {
            console.log(`   ❌ Error: ${JSON.stringify(empresasDashboard.data.errors)}`);
        }
        console.log('');

        // 3. Probar endpoint de tipos de empresa para formularios (solo activos)
        console.log('🏭 3. Probando /api/tipos_empresa (solo activos para formularios)');
        const tiposFormularios = await makeRequest('/api/tipos_empresa');
        console.log(`   Status: ${tiposFormularios.status}`);
        if (tiposFormularios.data.success) {
            console.log(`   ✅ Total tipos activos: ${tiposFormularios.data.count}`);
            if (tiposFormularios.data.data.length > 0) {
                console.log(`   📝 Primeros 3 tipos: ${tiposFormularios.data.data.slice(0,3).map(t => `${t.nombre} (activo: ${t.activo})`).join(', ')}`);
            }
        } else {
            console.log(`   ❌ Error: ${JSON.stringify(tiposFormularios.data.errors)}`);
        }
        console.log('');

        // 4. Probar nuevo endpoint de tipos de empresa para dashboard (todos)
        console.log('🏗️ 4. Probando /api/tipos_empresa/dashboard/all (todos para dashboard)');
        const tiposDashboard = await makeRequest('/api/tipos_empresa/dashboard/all');
        console.log(`   Status: ${tiposDashboard.status}`);
        if (tiposDashboard.data.success) {
            const activos = tiposDashboard.data.data.filter(t => t.activo);
            const inactivos = tiposDashboard.data.data.filter(t => !t.activo);
            console.log(`   ✅ Total tipos: ${tiposDashboard.data.count} (activos: ${activos.length}, inactivos: ${inactivos.length})`);
            if (tiposDashboard.data.data.length > 0) {
                console.log(`   📝 Primeros 3 tipos: ${tiposDashboard.data.data.slice(0,3).map(t => `${t.nombre} (activo: ${t.activo})`).join(', ')}`);
            }
        } else {
            console.log(`   ❌ Error: ${JSON.stringify(tiposDashboard.data.errors)}`);
        }
        console.log('');

        // Comparar resultados
        console.log('📋 RESUMEN DE COMPARACIÓN:');
        console.log('─'.repeat(50));
        
        if (empresasFormularios.data.success && empresasDashboard.data.success) {
            console.log(`🏢 EMPRESAS:`);
            console.log(`   - Formularios (activas): ${empresasFormularios.data.count}`);
            console.log(`   - Dashboard (todas): ${empresasDashboard.data.count}`);
            console.log(`   - Diferencia: ${empresasDashboard.data.count - empresasFormularios.data.count} empresas inactivas`);
        }
        
        if (tiposFormularios.data.success && tiposDashboard.data.success) {
            console.log(`🏭 TIPOS DE EMPRESA:`);
            console.log(`   - Formularios (activos): ${tiposFormularios.data.count}`);
            console.log(`   - Dashboard (todos): ${tiposDashboard.data.count}`);
            console.log(`   - Diferencia: ${tiposDashboard.data.count - tiposFormularios.data.count} tipos inactivos`);
        }

        console.log('\n✅ Pruebas completadas. Revisa los logs del backend para ver el debugging detallado.');

    } catch (error) {
        console.error('❌ Error durante las pruebas:', error);
    }
}

// Ejecutar las pruebas
testDashboardEndpoints();
