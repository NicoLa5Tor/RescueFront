/**
 * DEBUG SCRIPT PARA FILTROS DE USUARIOS
 * Este archivo fuerza que los filtros sean visibles y funcionen correctamente
 */

// Función para forzar que los filtros se muestren
function forceShowUsuariosFilters() {
  console.log('🔧 DEBUG: Forzando que los filtros de usuarios se muestren...');
  
  // Elementos que necesitamos mostrar
  const elements = [
    'usuariosFilters',
    'usuariosStatsGrid'
  ];
  
  elements.forEach(elementId => {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = element.id.includes('Stats') ? 'grid' : 'block';
      element.style.visibility = 'visible';
      element.style.opacity = '1';
      console.log(`✅ ${elementId} forzado a mostrarse`);
    } else {
      console.warn(`⚠️ ${elementId} no encontrado`);
    }
  });
}

// Función para configurar event listeners de filtros manualmente
function forceSetupUsuariosFiltersListeners() {
  console.log('🎯 DEBUG: Configurando event listeners de filtros manualmente...');
  
  // Search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput && window.usuariosMain) {
    searchInput.addEventListener('input', (e) => {
      console.log('🔍 DEBUG: Manual search input listener triggered:', e.target.value);
      window.usuariosMain.currentFilters.search = e.target.value.toLowerCase();
      window.usuariosMain.applyFilters();
    });
    console.log('✅ Search input listener configured manually');
  }
  
  // Status filter
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter && window.usuariosMain) {
    statusFilter.addEventListener('change', (e) => {
      console.log('📊 DEBUG: Manual status filter listener triggered:', e.target.value);
      window.usuariosMain.currentFilters.status = e.target.value;
      window.usuariosMain.applyFilters();
    });
    console.log('✅ Status filter listener configured manually');
  }
  
  // Include inactive filter
  const includeInactiveFilter = document.getElementById('includeInactiveFilter');
  if (includeInactiveFilter && window.usuariosMain) {
    includeInactiveFilter.addEventListener('change', (e) => {
      console.log('📊 DEBUG: Manual include inactive filter listener triggered:', e.target.value);
      window.usuariosMain.currentFilters.activa = e.target.value;
      window.usuariosMain.loadUsuarios(); // Reload with different endpoint
    });
    console.log('✅ Include inactive filter listener configured manually');
  }
}

// Función para verificar el estado actual de los filtros
function debugUsuariosFiltersState() {
  console.log('🧪 DEBUG: Estado actual de filtros de usuarios:');
  
  const filtersContainer = document.getElementById('usuariosFilters');
  const statsContainer = document.getElementById('usuariosStatsGrid');
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const includeInactiveFilter = document.getElementById('includeInactiveFilter');
  
  console.log('📊 Containers:', {
    filters: {
      exists: !!filtersContainer,
      display: filtersContainer?.style.display,
      visibility: filtersContainer?.style.visibility,
      classList: filtersContainer?.className
    },
    stats: {
      exists: !!statsContainer,
      display: statsContainer?.style.display,
      visibility: statsContainer?.style.visibility,
      classList: statsContainer?.className
    }
  });
  
  console.log('🎛️ Filter inputs:', {
    search: {
      exists: !!searchInput,
      value: searchInput?.value,
      listeners: searchInput?._events || 'no events visible'
    },
    status: {
      exists: !!statusFilter,
      value: statusFilter?.value,
      options: Array.from(statusFilter?.options || []).map(opt => ({ value: opt.value, text: opt.text }))
    },
    includeInactive: {
      exists: !!includeInactiveFilter,
      value: includeInactiveFilter?.value,
      options: Array.from(includeInactiveFilter?.options || []).map(opt => ({ value: opt.value, text: opt.text }))
    }
  });
  
  if (window.usuariosMain) {
    console.log('🏢 UsuariosMain state:', {
      usuarios: window.usuariosMain.usuarios.length,
      usuariosAll: window.usuariosMain.usuariosAll.length,
      currentFilters: window.usuariosMain.currentFilters,
      currentEmpresa: window.usuariosMain.currentEmpresa?.nombre || 'None'
    });
  }
}

// Función principal de debugging
function initDebugUsuariosFilters() {
  console.log('🚀 Iniciando debugging de filtros de usuarios...');
  
  // Esperar a que el DOM esté listo
  setTimeout(() => {
    debugUsuariosFiltersState();
    forceShowUsuariosFilters();
    forceSetupUsuariosFiltersListeners();
    
    // Verificar nuevamente después de configurar
    setTimeout(() => {
      debugUsuariosFiltersState();
    }, 500);
  }, 1000);
}

// Auto-inicialización
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDebugUsuariosFilters);
} else {
  initDebugUsuariosFilters();
}

// Función global para ejecutar manualmente desde consola
window.debugUsuariosFilters = function() {
  console.log('🔧 Ejecutando debug manual de filtros...');
  debugUsuariosFiltersState();
  forceShowUsuariosFilters();
  forceSetupUsuariosFiltersListeners();
};

// Función global para simular datos de prueba
window.simulateUsuariosData = function() {
  if (!window.usuariosMain) {
    console.error('❌ usuariosMain no disponible');
    return;
  }
  
  console.log('🎭 Simulando datos de usuarios para pruebas...');
  
  // Crear datos de prueba
  const testUsers = [
    {
      _id: '1',
      nombre: 'Juan Pérez',
      email: 'juan@empresa.com',
      cedula: '12345678',
      activo: true,
      rol: 'Médico',
      sede: 'Principal'
    },
    {
      _id: '2', 
      nombre: 'María García',
      email: 'maria@empresa.com',
      cedula: '87654321',
      activo: false,
      rol: 'Enfermera',
      sede: 'Secundaria'
    }
  ];
  
  // Asignar datos simulados
  window.usuariosMain.usuariosAll = testUsers;
  window.usuariosMain.usuarios = testUsers;
  
  // Simular empresa
  window.usuariosMain.currentEmpresa = {
    _id: 'test-empresa',
    nombre: 'Empresa de Prueba'
  };
  
  // Mostrar filtros y aplicar
  window.usuariosMain.showFilters();
  window.usuariosMain.applyFilters();
  
  console.log('✅ Datos simulados aplicados');
};

console.log('🔧 Debug script para filtros de usuarios cargado');
