#!/usr/bin/env node

const http = require('http');

// Helper para hacer peticiones HTTP
function makeRequest(endpoint) {
    return new Promise((resolve, reject) => {
        const url = new URL('http://localhost:5002' + endpoint);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

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
        
        req.end();
    });
}

async function demonstrateNewEndpoints() {
    console.log('🎯 DEMOSTRACIÓN DE NUEVOS ENDPOINTS PARA DASHBOARD\n');
    console.log('=' .repeat(60));

    try {
        // 1. Empresas para formularios (solo activas)
        console.log('\n📊 1. EMPRESAS PARA FORMULARIOS (solo activas)');
        console.log('Endpoint: GET /api/empresas');
        console.log('Uso: Para dropdowns, selects en formularios');
        
        const empresasFormularios = await makeRequest('/api/empresas/');
        if (empresasFormularios.data.success) {
            console.log(`✅ Resultado: ${empresasFormularios.data.count} empresas activas`);
            empresasFormularios.data.data.slice(0, 2).forEach(empresa => {
                console.log(`   • ${empresa.nombre} - Activa: ${empresa.activa} - Email: ${empresa.email}`);
            });
        }

        // 2. Empresas para dashboard (todas)
        console.log('\n📈 2. EMPRESAS PARA DASHBOARD (todas - activas e inactivas)');
        console.log('Endpoint: GET /api/empresas/dashboard/all');
        console.log('Uso: Para dashboards, estadísticas, tablas completas');
        
        const empresasDashboard = await makeRequest('/api/empresas/dashboard/all');
        if (empresasDashboard.data.success) {
            const activas = empresasDashboard.data.data.filter(e => e.activa);
            const inactivas = empresasDashboard.data.data.filter(e => !e.activa);
            
            console.log(`✅ Resultado: ${empresasDashboard.data.count} empresas totales`);
            console.log(`   • Activas: ${activas.length}`);
            console.log(`   • Inactivas: ${inactivas.length}`);
            
            empresasDashboard.data.data.slice(0, 3).forEach(empresa => {
                console.log(`   • ${empresa.nombre} - Activa: ${empresa.activa} - Ubicación: ${empresa.ubicacion}`);
            });
        }

        // 3. Tipos de empresa para formularios (solo activos)
        console.log('\n🏭 3. TIPOS DE EMPRESA PARA FORMULARIOS (solo activos)');
        console.log('Endpoint: GET /api/tipos_empresa');
        console.log('Uso: Para dropdowns, selects en formularios');
        
        const tiposFormularios = await makeRequest('/api/tipos_empresa?skip=0&limit=1000');
        if (tiposFormularios.data.success) {
            console.log(`✅ Resultado: ${tiposFormularios.data.count} tipos activos`);
            tiposFormularios.data.data.slice(0, 2).forEach(tipo => {
                console.log(`   • ${tipo.nombre} - Activo: ${tipo.activo} - Características: ${tipo.caracteristicas?.length || 0}`);
            });
        }

        // 4. Tipos de empresa para dashboard (todos)
        console.log('\n🏗️ 4. TIPOS DE EMPRESA PARA DASHBOARD (todos - activos e inactivos)');
        console.log('Endpoint: GET /api/tipos_empresa/dashboard/all');
        console.log('Uso: Para dashboards, estadísticas, tablas completas');
        
        const tiposDashboard = await makeRequest('/api/tipos_empresa/dashboard/all');
        if (tiposDashboard.data.success) {
            const activos = tiposDashboard.data.data.filter(t => t.activo);
            const inactivos = tiposDashboard.data.data.filter(t => !t.activo);
            
            console.log(`✅ Resultado: ${tiposDashboard.data.count} tipos totales`);
            console.log(`   • Activos: ${activos.length}`);
            console.log(`   • Inactivos: ${inactivos.length}`);
            
            tiposDashboard.data.data.slice(0, 3).forEach(tipo => {
                console.log(`   • ${tipo.nombre} - Activo: ${tipo.activo} - Descripción: ${tipo.descripcion?.substring(0, 50)}...`);
            });
        }

        // 5. Demostración de uso en código
        console.log('\n💻 5. EJEMPLO DE USO EN CÓDIGO JAVASCRIPT:');
        console.log('-'.repeat(50));
        console.log(`
// Para formularios (solo activos)
async function loadFormOptions() {
    const empresas = await fetch('/api/empresas/').then(r => r.json());
    const tipos = await fetch('/api/tipos_empresa?limit=1000').then(r => r.json());
    
    // Llenar selects con solo opciones activas
    fillSelect('empresaSelect', empresas.data);
    fillSelect('tipoSelect', tipos.data);
}

// Para dashboards (incluye inactivos)
async function loadDashboardData() {
    const empresas = await fetch('/api/empresas/dashboard/all').then(r => r.json());
    const tipos = await fetch('/api/tipos_empresa/dashboard/all').then(r => r.json());
    
    // Mostrar estadísticas completas
    showStats({
        totalEmpresas: empresas.count,
        activasEmpresas: empresas.data.filter(e => e.activa).length,
        totalTipos: tipos.count,
        activosTipos: tipos.data.filter(t => t.activo).length
    });
    
    // Mostrar en tabla con estado (activo/inactivo)
    renderTable(empresas.data);
    renderTable(tipos.data);
}
        `);

        console.log('\n✅ RESUMEN:');
        console.log('━'.repeat(60));
        console.log('🎯 Ahora tienes endpoints separados para:');
        console.log('   • FORMULARIOS: Solo elementos activos (para selects, dropdowns)');
        console.log('   • DASHBOARDS: Todos los elementos (para estadísticas completas)');
        console.log('');
        console.log('🔧 En tu frontend, actualiza las llamadas:');
        console.log('   • Formularios: usa los endpoints originales');
        console.log('   • Dashboards: usa los nuevos endpoints /dashboard/all');
        console.log('');
        console.log('📊 Con esto solucionas el problema de solo ver elementos activos');
        console.log('   en dashboards que necesitan mostrar estadísticas completas.');

    } catch (error) {
        console.error('❌ Error durante la demostración:', error);
    }
}

// Ejecutar la demostración
demonstrateNewEndpoints();
