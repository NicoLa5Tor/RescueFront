/**
 * Dashboard SPA Loader
 * 
 * Este archivo proporciona una función global para cargar el dashboard
 * cuando se navega por SPA (Single Page Application).
 * 
 * Esta función es llamada por el sistema de navegación SPA cuando
 * se navega a la página de dashboard.
 */

// Función global para cargar el dashboard
window.loadDashboard = function() {
  console.log('🔄 SPA: Iniciando carga dinámica del dashboard...');
  
  // Verificar si hay una instancia de superAdminDashboardEnhanced
  if (window.superAdminDashboardEnhanced && typeof window.superAdminDashboardEnhanced.loadDashboardData === 'function') {
    console.log('✅ Cargando dashboard con superAdminDashboardEnhanced');
    window.superAdminDashboardEnhanced.loadDashboardData();
    return;
  }
  
  // Verificar si hay una instancia de superAdminDashboard
  if (window.superAdminDashboard && typeof window.superAdminDashboard.loadDashboardData === 'function') {
    console.log('✅ Cargando dashboard con superAdminDashboard');
    window.superAdminDashboard.loadDashboardData();
    return;
  }
  
  // Si no hay instancias, crear una nueva
  console.log('⚠️ No se encontró una instancia del dashboard, creando nueva...');
  
  // Verificar si tenemos la clase SuperAdminDashboardEnhanced disponible
  if (typeof SuperAdminDashboardEnhanced !== 'undefined') {
    window.superAdminDashboardEnhanced = new SuperAdminDashboardEnhanced();
    window.superAdminDashboardEnhanced.loadDashboardData();
    return;
  }
  
  // Fallback a la clase SuperAdminDashboard
  if (typeof SuperAdminDashboard !== 'undefined') {
    window.superAdminDashboard = new SuperAdminDashboard();
    window.superAdminDashboard.loadDashboardData();
    return;
  }
  
  // Si no hay ninguna clase disponible, mostrar error
  console.error('❌ SPA: No se encontraron clases de dashboard disponibles');
  
  // Intentar inicializar con la función de inicialización básica
  console.log('🔄 Intentando inicializar con función básica...');
  if (typeof initializeDashboardCards === 'function') {
    initializeDashboardCards();
  } else {
    console.error('❌ SPA: No se pudo inicializar el dashboard');
    showInternalSpinner(false);
  }
};

// Función auxiliar para mostrar/ocultar spinner global
function showInternalSpinner(show = true) {
  const spinnerContainer = document.getElementById('dashboardSpinner');
  if (!spinnerContainer) {
    // Crear spinner si no existe
    if (show) {
      const spinner = document.createElement('div');
      spinner.id = 'dashboardSpinner';
      spinner.className = 'fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50';
      spinner.innerHTML = `
        <div class="bg-white p-4 rounded-lg shadow-lg">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p class="mt-2 text-gray-700">Cargando dashboard...</p>
        </div>
      `;
      document.body.appendChild(spinner);
    }
  } else {
    // Mostrar u ocultar spinner existente
    spinnerContainer.style.display = show ? 'flex' : 'none';
  }
}

// Inicializar automáticamente al cargar la página directamente
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('/admin/super-dashboard') || 
      window.location.pathname === '/admin' || 
      window.location.pathname === '/admin/') {
    
    console.log('🔄 Inicialización automática del dashboard en carga directa...');
    // No llamamos a loadDashboard() aquí para evitar duplicar la carga
    // ya que las clases SuperAdminDashboard y SuperAdminDashboardEnhanced
    // tienen su propia inicialización automática
  }
});

console.log('✅ Dashboard SPA Loader cargado correctamente');
