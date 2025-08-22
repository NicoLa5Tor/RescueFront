// /**
//  * Debug script específico para el problema del PUT de hardware
//  * Este script ayuda a identificar dónde exactamente ocurre el error
//  */

// class HardwarePutDebugger {
//   constructor() {
//     this.originalConsoleLog = console.log;
//     this.originalConsoleError = console.error;
//     this.originalConsoleWarn = console.warn;
//     this.logs = [];
//     this.intercepting = false;
//   }

//   // Interceptar todos los logs para capturar errores
//   startLogging() {
//     this.intercepting = true;
//     this.logs = [];
    
//     const self = this;
    
//     console.log = function(...args) {
//       const message = args.join(' ');
//       self.logs.push({type: 'log', message, timestamp: new Date()});
//       self.originalConsoleLog.apply(console, args);
//     };
    
//     console.error = function(...args) {
//       const message = args.join(' ');
//       self.logs.push({type: 'error', message, timestamp: new Date()});
//       self.originalConsoleError.apply(console, args);
//     };
    
//     console.warn = function(...args) {
//       const message = args.join(' ');
//       self.logs.push({type: 'warn', message, timestamp: new Date()});
//       self.originalConsoleWarn.apply(console, args);
//     };
//   }

//   // Restaurar logs originales
//   stopLogging() {
//     this.intercepting = false;
//     console.log = this.originalConsoleLog;
//     console.error = this.originalConsoleError;
//     console.warn = this.originalConsoleWarn;
//   }

//   // Obtener logs capturados
//   getLogs() {
//     return this.logs;
//   }

//   // Buscar mensajes específicos en los logs
//   findLogsContaining(searchText) {
//     return this.logs.filter(log => 
//       log.message.toLowerCase().includes(searchText.toLowerCase())
//     );
//   }

//   // Interceptar fetch para rastrear llamadas a API
//   interceptFetch() {
//     const originalFetch = window.fetch;
//     const self = this;
    
//     window.fetch = function(...args) {
//       const url = args[0];
//       const options = args[1] || {};
      
//       console.log('🌐 FETCH REQUEST:', url, options);
      
//       return originalFetch.apply(this, args).then(response => {
//         console.log('🌐 FETCH RESPONSE:', url, response.status, response.statusText);
        
//         // Clonar la respuesta para poder leerla sin consumirla
//         const responseClone = response.clone();
        
//         if (url.includes('/api/hardware/') && options.method === 'PUT') {
//           responseClone.json().then(data => {
//             console.log('🔧 PUT HARDWARE RESPONSE DATA:', data);
            
//             if (!data.success && data.errors) {
//               console.error('❌ PUT HARDWARE ERROR:', data.errors);
//               self.logs.push({
//                 type: 'api_error',
//                 message: `PUT Hardware Error: ${data.errors.join(', ')}`,
//                 url: url,
//                 timestamp: new Date()
//               });
//             }
//           }).catch(e => {
//             console.warn('Could not parse response as JSON:', e);
//           });
//         }
        
//         return response;
//       });
//     };
//   }

//   // Interceptar notification functions
//   interceptNotifications() {
//     // Interceptar window.hardwareNotifications si existe
//     if (window.hardwareNotifications && window.hardwareNotifications.show) {
//       const originalShow = window.hardwareNotifications.show;
//       window.hardwareNotifications.show = function(message, type) {
//         console.log('🔔 NOTIFICATION:', type, message);
//         if (message.toLowerCase().includes('ya existe') || message.toLowerCase().includes('already exists')) {
//           console.error('🚨 DUPLICATE ERROR NOTIFICATION:', message);
//           console.trace('Stack trace for duplicate error notification');
//         }
//         return originalShow.apply(this, arguments);
//       };
//     }

//     // Interceptar alert
//     const originalAlert = window.alert;
//     window.alert = function(message) {
//       console.log('🚨 ALERT:', message);
//       if (message.toLowerCase().includes('ya existe') || message.toLowerCase().includes('already exists')) {
//         console.error('🚨 DUPLICATE ERROR ALERT:', message);
//         console.trace('Stack trace for duplicate error alert');
//       }
//       return originalAlert.apply(this, arguments);
//     };
//   }

//   // Simular un PUT de hardware para debug
//   async simulatePutRequest(hardwareId, newName) {
//     console.log('🧪 Simulando PUT request...');
    
//     if (!window.hardwareManager || !window.hardwareManager.apiClient) {
//       console.error('❌ Hardware manager o API client no disponible');
//       return;
//     }

//     const testData = {
//       nombre: newName || 'Test Hardware Update ' + Date.now(),
//       empresa_id: '685c3e04f5b6629f68de7262',
//       empresa_nombre: 'Mi Empresa 3',
//       tipo: 'botonera',
//       sede: 'Principal'
//     };

//     console.log('📤 Datos a enviar:', testData);

//     try {
//       const response = await window.hardwareManager.apiClient.update_hardware(hardwareId, testData);
//       const data = await response.json();
      
//       console.log('📥 Respuesta recibida:', data);
      
//       if (data.success) {
//         console.log('✅ PUT exitoso');
//       } else {
//         console.error('❌ PUT falló:', data.errors);
//       }
      
//       return data;
//     } catch (error) {
//       console.error('💥 Error en PUT:', error);
//       return null;
//     }
//   }

//   // Analizar el estado actual del frontend
//   analyzeCurrentState() {
//     console.log('🔍 Analizando estado actual del frontend...');
    
//     const analysis = {
//       timestamp: new Date(),
//       hardwareManagerExists: !!window.hardwareManager,
//       apiClientExists: !!window.hardwareManager?.apiClient,
//       validatorExists: !!window.hardwareValidator,
//       empresasLoaded: !!window.empresas && window.empresas.length > 0,
//       currentHardwareList: null,
//       modalState: {
//         hardwareModalOpen: !document.getElementById('hardwareModal')?.classList.contains('hidden'),
//         viewModalOpen: !document.getElementById('viewHardwareModal')?.classList.contains('hidden')
//       }
//     };

//     if (window.hardwareManager && window.hardwareManager.hardwareList) {
//       analysis.currentHardwareList = window.hardwareManager.hardwareList.length;
//     }

//     console.log('📊 Estado del frontend:', analysis);
//     return analysis;
//   }

//   // Inicializar debug completo
//   startFullDebug() {
//     console.log('🚀 Iniciando debug completo del PUT de hardware...');
//     this.startLogging();
//     this.interceptFetch();
//     this.interceptNotifications();
//     this.analyzeCurrentState();
    
//     console.log(`
// 🔧 Debug del PUT de Hardware Activado
// ====================================

// Funciones disponibles:
// - debugger.getLogs() - Ver todos los logs capturados
// - debugger.findLogsContaining('texto') - Buscar logs específicos
// - debugger.simulatePutRequest('hardwareId', 'nuevoNombre') - Simular PUT
// - debugger.analyzeCurrentState() - Analizar estado actual
// - debugger.stopLogging() - Detener captura de logs

// Para probar:
// debugger.simulatePutRequest('686a10b57bfe8dddbfee70a3', 'Nombre Test Único')
//     `);
//   }
// }

// // Crear instancia global
// window.hardwarePutDebugger = new HardwarePutDebugger();

// // Alias corto
// window.debugger = window.hardwarePutDebugger;

// console.log('🔧 Hardware PUT Debugger cargado. Ejecuta debugger.startFullDebug() para comenzar.');
