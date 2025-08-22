/**
 * LAZY LOAD MAPS - Sistema de carga diferida para mapas Leaflet
 * Optimiza el rendimiento cargando mapas solo cuando son necesarios
 */

class LazyMapLoader {
  constructor() {
    this.loadedMaps = new Set();
    this.leafletLoaded = false;
    this.loadingPromise = null;
    
    ////console.log('🗺️ LazyMapLoader inicializado');
  }
  
  /**
   * Cargar Leaflet de manera asíncrona
   */
  async loadLeaflet() {
    if (this.leafletLoaded) {
      return Promise.resolve();
    }
    
    if (this.loadingPromise) {
      return this.loadingPromise;
    }
    
    this.loadingPromise = new Promise((resolve, reject) => {
      //console.log('📦 Cargando Leaflet de manera diferida...');
      
      // Cargar CSS si no está cargado
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);
      }
      
      // Cargar JS si no está cargado
      if (typeof L === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        
        script.onload = () => {
          this.leafletLoaded = true;
          //console.log('✅ Leaflet cargado exitosamente');
          resolve();
        };
        
        script.onerror = () => {
          //console.error('❌ Error cargando Leaflet');
          reject(new Error('Failed to load Leaflet'));
        };
        
        document.head.appendChild(script);
      } else {
        this.leafletLoaded = true;
        resolve();
      }
    });
    
    return this.loadingPromise;
  }
  
  /**
   * Crear mapa con lazy loading
   */
  async createMap(containerId, lat, lng, zoom = 15, hardwareName = 'Hardware') {
    try {
      //console.log(`🗺️ Creando mapa lazy para ${containerId}...`);
      
      // Mostrar indicador de carga
      this.showLoadingIndicator(containerId);
      
      // Cargar Leaflet si no está cargado
      await this.loadLeaflet();
      
      // Verificar que el contenedor existe
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Contenedor ${containerId} no encontrado`);
      }
      
      // Limpiar contenedor
      container.innerHTML = '';
      
      // Crear mapa
      const map = L.map(containerId, {
        center: [lat, lng],
        zoom: zoom,
        scrollWheelZoom: true,
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        zoomControl: true
      });
      
      // Añadir capa base
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        loading: 'lazy'
      }).addTo(map);
      
      // Añadir marcador
      const marker = L.marker([lat, lng]).addTo(map);
      marker.bindPopup(`<b>${hardwareName}</b><br>Ubicación del hardware`);
      
      // Marcar como cargado
      this.loadedMaps.add(containerId);
      
      //console.log(`✅ Mapa ${containerId} creado exitosamente`);
      
      return { map, marker };
      
    } catch (error) {
      //console.error(`❌ Error creando mapa ${containerId}:`, error);
      this.showErrorIndicator(containerId);
      throw error;
    }
  }
  
  /**
   * Mostrar indicador de carga
   */
  showLoadingIndicator(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="flex items-center justify-center h-full min-h-[400px] bg-gray-100 dark:bg-gray-800 rounded-xl">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p class="text-gray-600 dark:text-gray-400">Cargando mapa...</p>
          </div>
        </div>
      `;
    }
  }
  
  /**
   * Mostrar indicador de error
   */
  showErrorIndicator(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="flex items-center justify-center h-full min-h-[400px] bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-800">
          <div class="text-center">
            <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
            <p class="text-red-600 dark:text-red-400 font-semibold">Error cargando el mapa</p>
            <p class="text-red-500 dark:text-red-500 text-sm">Intenta recargar la página</p>
          </div>
        </div>
      `;
    }
  }
  
  /**
   * Verificar si un mapa ya está cargado
   */
  isMapLoaded(containerId) {
    return this.loadedMaps.has(containerId);
  }
  
  /**
   * Precargar Leaflet para uso futuro
   */
  preloadLeaflet() {
    if (!this.leafletLoaded && !this.loadingPromise) {
      //console.log('🔄 Precargando Leaflet...');
      this.loadLeaflet().catch(err => {
        //console.warn('⚠️ Error precargando Leaflet:', err);
      });
    }
  }
}

// Crear instancia global
window.LazyMapLoader = window.LazyMapLoader || new LazyMapLoader();

// Precargar Leaflet después de que el DOM esté listo (con delay)
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    window.LazyMapLoader.preloadLeaflet();
  }, 2000); // Precargar después de 2 segundos
});

// Exportar para uso como módulo
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LazyMapLoader;
}
