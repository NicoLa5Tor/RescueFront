// /**
//  * SCRIPT DE DEBUGGING PARA ALERTAS INACTIVAS
//  * Herramientas de testing para verificar el funcionamiento del sistema
//  */

// console.log('🔧 DEBUG: Script de testing para alertas inactivas cargado');

// // Función para probar la apertura del modal con datos mock
// function testInactiveModal() {
//     const mockAlert = {
//         _id: 'test-alert-123',
//         nombre_alerta: 'Alerta de Prueba',
//         empresa_nombre: 'Empresa Test',
//         sede: 'Sede Test',
//         prioridad: 'alta',
//         activo: false,
//         fecha_creacion: new Date().toISOString(),
//         fecha_desactivacion: new Date().toISOString(),
//         hardware_nombre: 'Hardware Test',
//         tipo_alerta: 'ROJO',
//         descripcion: 'Esta es una alerta de prueba para verificar el modal',
//         numeros_telefonicos: [
//             {
//                 nombre: 'Contacto Test',
//                 numero: '+57 300 123 4567',
//                 disponible: true
//             }
//         ],
//         data: {
//             origen: 'hardware',
//             tipo_mensaje: 'alarma',
//             id_origen: 'hw-001'
//         },
//         activacion_alerta: {
//             tipo_activacion: 'hardware',
//             nombre: 'Hardware Sensor',
//             id: 'hw-001'
//         },
//         desactivado_por: {
//             tipo: 'empresa',
//             id: 'emp-001',
//             fecha_desactivacion: new Date().toISOString()
//         },
//         mensaje_desactivacion: 'Alerta desactivada por prueba del sistema',
//         ubicacion: {
//             direccion: 'Calle 123 #45-67, Bogotá, Colombia',
//             url_maps: 'https://maps.google.com/?q=4.6097,-74.0817',
//             url_open_maps: 'https://www.openstreetmap.org/?mlat=4.6097&mlon=-74.0817'
//         },
//         topic: 'test/empresa/sede/hardware/alarm'
//     };
    
//     console.log('🧪 TESTING: Creando alerta mock para prueba:', mockAlert);
    
//     // Simular que la alerta está en cache
//     if (window.inactiveAlertsCache) {
//         window.inactiveAlertsCache.set(mockAlert._id, mockAlert);
//         console.log('✅ TESTING: Alerta agregada al cache');
//     }
    
//     // Intentar mostrar el modal
//     if (typeof window.showInactiveAlertDetails === 'function') {
//         console.log('🎯 TESTING: Llamando a showInactiveAlertDetails...');
//         window.showInactiveAlertDetails(mockAlert._id);
//     } else {
//         console.error('❌ TESTING: Función showInactiveAlertDetails no disponible');
//     }
// }

// // Función para verificar el estado del sistema
// function checkSystemStatus() {
//     console.log('🔍 CHECKING SYSTEM STATUS...');
    
//     // Verificar APIs disponibles
//     console.log('API Client:', typeof window.apiClient !== 'undefined' ? '✅' : '❌');
//     console.log('EndpointTestClient:', typeof window.EndpointTestClient !== 'undefined' ? '✅' : '❌');
    
//     // Verificar Modal Manager
//     console.log('Modal Manager:', typeof window.modalManager !== 'undefined' ? '✅' : '❌');
    
//     // Verificar funciones de alertas inactivas
//     console.log('showInactiveAlertDetails:', typeof window.showInactiveAlertDetails !== 'undefined' ? '✅' : '❌');
//     console.log('changePageInactive:', typeof window.changePageInactive !== 'undefined' ? '✅' : '❌');
    
//     // Verificar funciones auxiliares desde alerts-main.js
//     console.log('generateModalContent:', typeof window.generateModalContent !== 'undefined' ? '✅' : '❌');
//     console.log('generateLocationContent:', typeof window.generateLocationContent !== 'undefined' ? '✅' : '❌');
//     console.log('getPriorityClass:', typeof window.getPriorityClass !== 'undefined' ? '✅' : '❌');
//     console.log('formatDate:', typeof window.formatDate !== 'undefined' ? '✅' : '❌');
//     console.log('getAlertTypeColor:', typeof window.getAlertTypeColor !== 'undefined' ? '✅' : '❌');
    
//     // Verificar elementos del DOM
//     console.log('inactiveAlertsContainer:', document.getElementById('inactiveAlertsContainer') ? '✅' : '❌');
//     console.log('alertDetailModal:', document.getElementById('alertDetailModal') ? '✅' : '❌');
//     console.log('alertDetailsContent:', document.getElementById('alertDetailsContent') ? '✅' : '❌');
//     console.log('modalAlertSubtitle:', document.getElementById('modalAlertSubtitle') ? '✅' : '❌');
    
//     // Verificar variables globales de alertas inactivas
//     console.log('currentInactiveAlerts:', typeof window.currentInactiveAlerts !== 'undefined' ? '✅' : '❌');
//     console.log('inactiveAlertsCache:', typeof window.inactiveAlertsCache !== 'undefined' ? '✅' : '❌');
    
//     console.log('📊 SYSTEM STATUS CHECK COMPLETE');
// }

// // Función para simular carga de alertas inactivas
// function simulateLoadInactiveAlerts() {
//     console.log('📡 SIMULATING: Loading inactive alerts...');
    
//     const mockAlerts = [
//         {
//             _id: 'inactive-1',
//             nombre_alerta: 'Alerta Inactiva 1',
//             empresa_nombre: 'Empresa Test 1',
//             sede: 'Sede Principal',
//             prioridad: 'alta',
//             activo: false,
//             fecha_creacion: new Date(Date.now() - 86400000).toISOString(), // Ayer
//             fecha_desactivacion: new Date().toISOString(),
//             hardware_nombre: 'Sensor 001',
//             tipo_alerta: 'ROJO',
//             data: { origen: 'hardware', tipo_mensaje: 'alarma' }
//         },
//         {
//             _id: 'inactive-2',
//             nombre_alerta: 'Alerta Inactiva 2',
//             empresa_nombre: 'Empresa Test 2',
//             sede: 'Sede Norte',
//             prioridad: 'media',
//             activo: false,
//             fecha_creacion: new Date(Date.now() - 172800000).toISOString(), // Hace 2 días
//             fecha_desactivacion: new Date(Date.now() - 3600000).toISOString(), // Hace 1 hora
//             hardware_nombre: 'Sensor 002',
//             tipo_alerta: 'AMARILLO',
//             data: { origen: 'usuario_movil', tipo_mensaje: 'alerta' }
//         }
//     ];
    
//     if (typeof window.renderInactiveAlerts === 'function') {
//         console.log('✅ SIMULATING: Rendering mock alerts...');
//         window.currentInactiveAlerts = mockAlerts;
//         window.renderInactiveAlerts(mockAlerts);
//     } else {
//         console.error('❌ SIMULATING: renderInactiveAlerts function not available');
//     }
// }

// // Función para verificar el loading del API client
// function testApiClient() {
//     console.log('🧪 TESTING API CLIENT...');
    
//     if (window.apiClient && typeof window.apiClient.get_inactive_alerts_by_empresa === 'function') {
//         console.log('✅ API Client disponible y método get_inactive_alerts_by_empresa encontrado');
        
//         // Simular llamada (sin ejecutar realmente)
//         console.log('🔗 Simulando llamada a get_inactive_alerts_by_empresa(test-empresa, 5, 0)');
//         console.log('📡 Endpoint esperado: /api/mqtt-alerts/inactive?empresaId=test-empresa&limit=5&offset=0');
//     } else {
//         console.error('❌ API Client no disponible o método no encontrado');
//     }
// }

// // Exponer funciones globalmente para uso desde consola
// window.testingTools = {
//     checkSystemStatus,
//     testInactiveModal,
//     simulateLoadInactiveAlerts,
//     testApiClient,
    
//     // Utilidad rápida para verificar si todo está listo
//     quickCheck: () => {
//         console.log('🚀 QUICK CHECK...');
//         checkSystemStatus();
//         console.log('\n📝 Para probar el modal: testingTools.testInactiveModal()');
//         console.log('📝 Para simular alertas: testingTools.simulateLoadInactiveAlerts()');
//         console.log('📝 Para probar API: testingTools.testApiClient()');
//     }
// };

// console.log('✅ Testing tools loaded. Use testingTools.quickCheck() to verify system status.');
