(() => {
  const viewName = 'hardware';
  let hardwareViewInitialized = false;
  let hardwareViewActive = false;
  let hardwareObserver = null;
  let visibilityIntervalId = null;

  const setupHardwareView = () => {
    if (hardwareViewInitialized) return;
    hardwareViewInitialized = true;

    ////console.log('🛠️ Hardware page loaded WITHOUT GSAP - Performance optimized');
    initializeModals();
    initializeHardwareApiClient();
    openHardwareFromSession();
    initializeFilterListeners();
  };

  const startHardwareObserver = () => {
    if (hardwareObserver) {
      hardwareObserver.disconnect();
      hardwareObserver = null;
    }

    const hardwareGrid = document.getElementById('hardwareGrid');
    if (!hardwareGrid) return;

    hardwareObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1 && node.classList.contains('ios-hardware-card')) {
            //console.log('👀 Nueva tarjeta detectada, usando sistema global...');
            // Usar la función global del sistema base
            if (window.applyCardOptimizations) {
              window.applyCardOptimizations(node);
            }
          }
        });
      });
    });
    
    hardwareObserver.observe(hardwareGrid, {
      childList: true,
      subtree: true
    });
    
    //console.log('👀 Observer configurado para detectar nuevas tarjetas');
  };

  const startHardwareView = () => {
    if (hardwareViewActive) return;
    hardwareViewActive = true;

    setupHardwareView();
    startHardwareObserver();

    if (!visibilityIntervalId) {
      // Usar el sistema global de visibilidad cada 500ms
      visibilityIntervalId = setInterval(() => {
        if (window.ensureCardsVisibility) {
          window.ensureCardsVisibility();
        }
      }, 500);
    }

    if (window.initHardwareMain) {
      window.initHardwareMain();
    }

    //console.log('✅ Hardware page optimizations applied successfully - Using GLOBAL SYSTEM');
  };

  const stopHardwareView = () => {
    if (!hardwareViewActive) return;
    hardwareViewActive = false;

    if (visibilityIntervalId) {
      clearInterval(visibilityIntervalId);
      visibilityIntervalId = null;
    }

    if (hardwareObserver) {
      hardwareObserver.disconnect();
      hardwareObserver = null;
    }
  };

  const mount = () => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', startHardwareView, { once: true });
      return;
    }
    setTimeout(startHardwareView, 0);
  };

  const unmount = () => {
    stopHardwareView();
  };

  window.EmpresaSpaViews = window.EmpresaSpaViews || {};
  const existing = window.EmpresaSpaViews[viewName];
  if (Array.isArray(existing)) {
    existing.push({ mount, unmount });
  } else if (existing) {
    window.EmpresaSpaViews[viewName] = [existing, { mount, unmount }];
  } else {
    window.EmpresaSpaViews[viewName] = [{ mount, unmount }];
  }

  if (!window.EMPRESA_SPA_MANUAL_INIT) {
    mount();
  }
})();

// Initialize modals when page loads
function initializeModals() {
  //console.log('🚀 Initializing modals...');
  
  if (window.modalManager) {
    // Setup all modals in the page
    const modalIds = ['hardwareModal', 'viewHardwareModal', 'clientUpdateModal', 'locationModal'];
    modalIds.forEach(modalId => {
      window.modalManager.setupModal(modalId);
      //console.log(`✅ Modal ${modalId} configured`);
    });
  } else {
    //console.warn('⚠️ ModalManager not available');
  }
  
  // Ensure theme is properly applied
  if (window.ThemeManager) {
    //console.log('✅ ThemeManager available, theme should be persistent');
  }
}

// Global variables for Leaflet map
let currentMap = null;
let currentMarker = null;
window.currentLocationUrl = null;

// Function to extract coordinates from different URL formats
function extractCoordinates(url) {
  //console.log('🔍 Extracting coordinates from URL:', url);
  
  // OpenStreetMap format: https://www.openstreetmap.org/#map=15/40.7128/-74.0060
  let match = url.match(/#map=(\d+)\/([-\d\.]+)\/([-\d\.]+)/);
  if (match) {
    const result = {
      lat: parseFloat(match[2]),
      lng: parseFloat(match[3]),
      zoom: parseInt(match[1])
    };
    //console.log('✅ OpenStreetMap format matched:', result);
    return result;
  }
  
  // Google Maps format: https://www.google.com/maps/@40.7128,-74.0060,15z
  match = url.match(/@([-\d\.]+),([-\d\.]+),(\d+)z/);
  if (match) {
    const result = {
      lat: parseFloat(match[1]),
      lng: parseFloat(match[2]),
      zoom: parseInt(match[3])
    };
    //console.log('✅ Google Maps @ format matched:', result);
    return result;
  }
  
  // Google Maps query format: https://www.google.com/maps/search/40.7128,-74.0060
  match = url.match(/search\/([-\d\.]+),([-\d\.]+)/);
  if (match) {
    const result = {
      lat: parseFloat(match[1]),
      lng: parseFloat(match[2]),
      zoom: 15
    };
    //console.log('✅ Google Maps search format matched:', result);
    return result;
  }
  
  // Fallback: try to find any lat,lng pattern
  match = url.match(/([-\d\.]+),([-\d\.]+)/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    // Validate lat/lng ranges
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      const result = {
        lat: lat,
        lng: lng,
        zoom: 15
      };
      //console.log('✅ Fallback lat,lng pattern matched:', result);
      return result;
    }
  }
  
  //console.log('❌ No coordinates found in URL');
  return null;
}

// Function to initialize Leaflet map
function initializeLeafletMap(lat, lng, zoom = 15, hardwareName = 'Hardware') {
  //console.log('📍 Initializing Leaflet map with params:', { lat, lng, zoom, hardwareName });
  
  const mapContainer = document.getElementById('locationMap');
  if (!mapContainer) {
    //console.error('❌ Map container not found!');
    return;
  }
  
  //console.log('✅ Map container found:', mapContainer);
  
  // Clear any existing map
  if (currentMap) {
    //console.log('🧹 Removing existing map');
    try {
      currentMap.remove();
    } catch (e) {
      //console.warn('⚠️ Error removing previous map:', e);
    }
    currentMap = null;
    currentMarker = null;
  }
  
  // Clear map container HTML to ensure clean state
  mapContainer.innerHTML = '';
  
  // Show loading spinner
  showMapLoadingSpinner(mapContainer);
  
  try {
    // Wait a bit for DOM to be ready
    setTimeout(() => {
      try {
        //console.log('🌐 Creating new Leaflet map...');
        
        // Ensure the container is visible and has dimensions
        mapContainer.style.height = '600px';
        mapContainer.style.width = '100%';
        mapContainer.style.minHeight = '600px';
        
        // Create new map with error handling
        currentMap = L.map(mapContainer, {
          center: [lat, lng],
          zoom: zoom,
          zoomControl: true,
          attributionControl: true
        });
        
        //console.log('🗺️ Adding OpenStreetMap tiles...');
        
        // Add OpenStreetMap tiles with error handling
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          minZoom: 1
        });
        
        tileLayer.on('tileerror', function(error) {
          //console.warn('⚠️ Tile loading error:', error);
        });
        
        tileLayer.addTo(currentMap);
        
        // Add marker
        //console.log('📍 Adding marker...');
        currentMarker = L.marker([lat, lng], {
          title: hardwareName
        }).addTo(currentMap);
        
        // Add popup
        currentMarker.bindPopup(`
          <div style="text-align: center; padding: 5px;">
            <b>${hardwareName}</b><br>
            <small>Ubicación del hardware</small><br>
            <small>Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}</small>
          </div>
        `).openPopup();
        
        //console.log('✅ Leaflet map successfully initialized!');
        
        // Hide loading spinner once map is ready
        setTimeout(() => {
          //console.log('🎯 Map fully loaded, hiding spinner...');
          // No need to call hideMapLoadingSpinner since the map is now replacing the content
        }, 50);
        
        // Force map resize multiple times
        setTimeout(() => {
          if (currentMap) {
            currentMap.invalidateSize(true);
            //console.log('🔄 Map size invalidated (first time)');
          }
        }, 100);
        
        setTimeout(() => {
          if (currentMap) {
            currentMap.invalidateSize(true);
            currentMap.setView([lat, lng], zoom);
            //console.log('🔄 Map size invalidated (second time) and view reset');
          }
        }, 500);
        
        // Final resize after animation completes
        setTimeout(() => {
          if (currentMap) {
            currentMap.invalidateSize(true);
            //console.log('🔄 Final map resize');
          }
        }, 1000);
        
      } catch (error) {
        //console.error('💥 Error creating Leaflet map:', error);
        
        // Fallback: show error message in map container
        mapContainer.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 600px; 
                      background: linear-gradient(135deg, #fee2e2, #fecaca); color: #dc2626; 
                      border-radius: 12px; text-align: center; padding: 2rem;">
            <div>
              <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i><br>
              <strong>Error al cargar el mapa</strong><br>
              <small>No se pudo inicializar Leaflet</small><br>
              <small>Coordenadas: ${lat}, ${lng}</small>
            </div>
          </div>
        `;
      }
    }, 200);
    
  } catch (error) {
    //console.error('💥 Error in map initialization wrapper:', error);
    
    // Show error in container
    mapContainer.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 600px; 
                  background: linear-gradient(135deg, #fee2e2, #fecaca); color: #dc2626; 
                  border-radius: 12px; text-align: center; padding: 2rem;">
        <div>
          <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i><br>
          <strong>Error al cargar el mapa</strong><br>
          <small>Error de inicialización</small>
        </div>
      </div>
    `;
  }
}

// Function to show loading spinner for map
function showMapLoadingSpinner(container) {
  //console.log('🔄 Showing map loading spinner...');
  
  if (!container) {
    //console.error('❌ Container not provided for spinner');
    return;
  }
  
  // Create loading spinner HTML
  container.innerHTML = `
    <div class="map-loading-container" style="
      width: 100%;
      height: 600px;
      min-height: 600px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #e0f2fe, #b3e5fc);
      border-radius: 12px;
      position: relative;
      overflow: hidden;
    ">
      <div class="map-loading-spinner" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        z-index: 10;
      ">
        <div class="spinner" style="
          width: 50px;
          height: 50px;
          border: 4px solid rgba(59, 130, 246, 0.2);
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: mapSpinnerRotate 1s linear infinite;
        "></div>
        <div class="loading-text" style="
          font-size: 1rem;
          font-weight: 600;
          color: #0277bd;
          text-align: center;
        ">
          <i class="fas fa-map-marked-alt" style="margin-right: 0.5rem;"></i>
          Cargando mapa...
        </div>
        <div style="
          font-size: 0.875rem;
          color: #0288d1;
          text-align: center;
          opacity: 0.8;
        ">
          Inicializando Leaflet
        </div>
      </div>
      
      <!-- Shimmer effect -->
      <div class="map-loading-shimmer" style="
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, 
          transparent 0%, 
          rgba(255, 255, 255, 0.6) 50%, 
          transparent 100%
        );
        animation: mapShimmerSlide 2s ease-in-out infinite;
      "></div>
    </div>
  `;
  
  // Add keyframes if they don't exist
  if (!document.querySelector('#map-loading-styles')) {
    const style = document.createElement('style');
    style.id = 'map-loading-styles';
    style.textContent = `
      @keyframes mapSpinnerRotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes mapShimmerSlide {
        0% { left: -100%; }
        100% { left: 100%; }
      }
    `;
    document.head.appendChild(style);
  }
  
  //console.log('✅ Map loading spinner displayed');
}

// Function to hide loading spinner and show map
function hideMapLoadingSpinner(container) {
  //console.log('🎯 Hiding map loading spinner...');
  
  if (!container) {
    //console.error('❌ Container not provided for hiding spinner');
    return;
  }
  
  // Clear the loading content
  container.innerHTML = '';
  
  //console.log('✅ Map loading spinner hidden');
}

// Function to open location modal - WITH PROFESSIONAL ANIMATIONS
function openLocationModal() {
  if (!window.currentLocationUrl) {
    //console.error('No location URL available');
    return;
  }
  
  const modal = document.getElementById('locationModal');
  const subtitle = document.getElementById('locationModalSubtitle');
  const mapContainer = document.getElementById('locationMap');
  
  if (modal) {
    // Extract coordinates from URL
    const coords = extractCoordinates(window.currentLocationUrl);
    
    if (coords) {
      // Update subtitle with current hardware name
      const currentHardwareName = document.getElementById('viewHardwareName')?.textContent || 'Hardware';
      subtitle.textContent = `Ubicación de ${currentHardwareName}`;
      
      // Use professional animations if available
      if (window.locationModalAnimations) {
        // Show loading state first
        window.locationModalAnimations.showMapLoading(mapContainer);
        
        // Open modal with professional animation
        window.locationModalAnimations.openModal(modal, () => {
          // Initialize map after modal animation completes
          setTimeout(() => {
            try {
              initializeLeafletMap(coords.lat, coords.lng, coords.zoom, currentHardwareName);
              // Show map loaded animation
              setTimeout(() => {
                window.locationModalAnimations.showMapLoaded(mapContainer);
              }, 500); // Wait for map to initialize
            } catch (error) {
              //console.error('Error initializing map:', error);
              window.locationModalAnimations.showMapError(mapContainer, 'Error al cargar el mapa');
            }
          }, 200);
        });
      } else {
        // Fallback to basic modal opening
        //console.warn('⚠️ Professional animations not available, using fallback');
        if (window.modalManager) {
          window.modalManager.openModal('locationModal');
        } else {
          modal.classList.remove('hidden');
          document.body.style.overflow = 'hidden';
          document.body.classList.add('modal-open');
        }
        
        setTimeout(() => {
          initializeLeafletMap(coords.lat, coords.lng, coords.zoom, currentHardwareName);
        }, 200);
      }
      
      //console.log('📍 Location modal opened with coordinates:', coords);
    } else {
      //console.error('Could not extract coordinates from URL:', window.currentLocationUrl);
      // Fallback: open in new tab
      window.open(window.currentLocationUrl, '_blank', 'noopener,noreferrer');
    }
  }
}

// Function to close location modal - EXACTLY LIKE EDIT MODAL
function closeLocationModal() {
  const modal = document.getElementById('locationModal');
  
  if (modal) {
    // Add fade-out animation
    modal.classList.remove('modal-show');
    
    // USE MODAL MANAGER - SAME AS EDIT MODAL
    if (window.modalManager) {
      window.modalManager.closeModal('locationModal');
    } else {
      // Fallback if modalManager not available
      modal.classList.add('hidden');
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    }
    
    // Cleanup map after modal is closed
    setTimeout(() => {
      if (currentMap) {
        currentMap.remove();
        currentMap = null;
        currentMarker = null;
      }
    }, 300);
    
    //console.log('📍 Location modal closed');
  }
}

// Function to open location in new tab
function openInNewTab() {
  if (window.currentLocationUrl) {
    window.open(window.currentLocationUrl, '_blank', 'noopener,noreferrer');
    //console.log('📍 Location opened in new tab:', window.currentLocationUrl);
  }
}

// Function to open location modal directly from card
function openLocationModalFromCard(hardwareId, locationUrl) {
  if (!locationUrl || locationUrl.trim() === '') {
    //console.error('No location URL provided');
    return;
  }
  
  // Decode HTML entities
  const decodedUrl = locationUrl.replace(/\\&quot;/g, '"').replace(/\\&#39;/g, "'");
  
  //console.log('📍 Opening location modal from card:', hardwareId, decodedUrl);
  
  // Store the URL globally
  window.currentLocationUrl = decodedUrl;
  
  // Get hardware name for subtitle
  const hardwareCard = document.querySelector(`[data-hardware-id="${hardwareId}"]`);
  let hardwareName = 'Hardware';
  if (hardwareCard) {
    const titleElement = hardwareCard.querySelector('.ios-card-title');
    if (titleElement) {
      hardwareName = titleElement.textContent || 'Hardware';
    }
  }
  
  // Extract coordinates from URL
  let coords = extractCoordinates(decodedUrl);
  
  // If no coordinates found, show error and don't open modal
  if (!coords) {
    //console.error('❌ No se pudieron extraer coordenadas de la URL:', decodedUrl);
    alert('Error: No se pudo determinar la ubicación del hardware.');
    return;
  }
  
  // Always open modal with Leaflet map - USE MODAL MANAGER
  const modal = document.getElementById('locationModal');
  const subtitle = document.getElementById('locationModalSubtitle');
  
  if (modal) {
    // Update subtitle
    if (subtitle) {
      subtitle.textContent = coords ? `Ubicación de ${hardwareName}` : `${hardwareName} - Ubicación no disponible`;
    }
    
    //console.log('🗺️ Opening modal...');
    
    // USE MODAL MANAGER - SAME AS EDIT MODAL
    if (window.modalManager) {
      window.modalManager.openModal('locationModal');
    } else {
      // Fallback if modalManager not available
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    }
    
    // Add fade-in animation and initialize map
    setTimeout(() => {
      modal.classList.add('modal-show');
      //console.log('🗺️ Initializing Leaflet map with coords:', coords);
      // Initialize Leaflet map after modal is visible
      initializeLeafletMap(coords.lat, coords.lng, coords.zoom, hardwareName);
    }, 100);
    
    //console.log('📍 Location modal opened with Leaflet map:', coords);
  } else {
    //console.error('❌ Modal not found!');
  }
}

// Make function globally available
window.openLocationModalFromCard = openLocationModalFromCard;

// Initialize when DOM is ready

// NOTE: Las funciones openCreateModal() y editHardware() están ahora
// implementadas en hardware-core.js y exportadas al objeto window
// Esto evita duplicación y conflictos de estado

// Función para cargar datos reales en el formulario
function loadHardwareDataIntoForm(hardware) {
  try {
    // Función helper para obtener valor seguro
    const getSafeValue = (obj, path, defaultValue = '') => {
      try {
        const keys = path.split('.');
        let current = obj;
        for (const key of keys) {
          if (current === null || current === undefined) {
            return defaultValue;
          }
          current = current[key];
        }
        return current !== null && current !== undefined ? current : defaultValue;
      } catch (e) {
        return defaultValue;
      }
    };
    
    // Función helper para establecer valor en input de forma segura
    const setInputValue = (inputId, value) => {
      try {
        const input = document.getElementById(inputId);
        if (input) {
          input.value = value || '';
        } else {
          //console.warn(`Input con ID '${inputId}' no encontrado`);
        }
      } catch (e) {
        //console.error(`Error al establecer valor en input '${inputId}':`, e);
      }
    };
    
    // Extraer datos anidados
    let datos = {};
    if (hardware.datos) {
      if (typeof hardware.datos === 'object') {
        datos = hardware.datos.datos || hardware.datos;
      } else if (typeof hardware.datos === 'string') {
        try {
          const parsed = JSON.parse(hardware.datos);
          datos = parsed.datos || parsed;
        } catch (e) {
          //console.warn('Error parsing datos string:', e);
          datos = {};
        }
      }
    }
    
    //console.log('📊 Datos extraídos para formulario:', datos);
    
    // Llenar el formulario con los datos reales
    setInputValue('hardwareName', getSafeValue(hardware, 'nombre'));
    setInputValue('hardwareType', getSafeValue(hardware, 'tipo'));
    
    // Set empresa and sede
    const empresaId = getSafeValue(hardware, 'empresa_id');
    if (empresaId) {
      setInputValue('hardwareEmpresa', empresaId);
      // Trigger sede loading after empresa is set
      setTimeout(() => {
        loadSedesByEmpresa();
        // Set sede after sedes are loaded
        setTimeout(() => {
          setInputValue('hardwareSede', getSafeValue(hardware, 'sede'));
        }, 100);
      }, 100);
    }
    
    setInputValue('hardwareBrand', 
      getSafeValue(datos, 'brand') || 
      getSafeValue(datos, 'marca') || 
      getSafeValue(hardware, 'marca')
    );
    
    setInputValue('hardwareModel', 
      getSafeValue(datos, 'model') || 
      getSafeValue(datos, 'modelo') || 
      getSafeValue(hardware, 'modelo')
    );
    
    setInputValue('hardwarePrice', 
      getSafeValue(datos, 'price') || 
      getSafeValue(datos, 'precio') || 
      getSafeValue(hardware, 'precio')
    );
    
    setInputValue('hardwareStock', 
      getSafeValue(datos, 'stock') || 
      getSafeValue(hardware, 'stock')
    );
    
    // Estado
    const status = getSafeValue(datos, 'status') || 
                  getSafeValue(datos, 'estado') || 
                  getSafeValue(hardware, 'status') || 
                  getSafeValue(hardware, 'estado') || 
                  'available';
    setInputValue('hardwareStatus', status);
    
    // Garantía
    const warranty = getSafeValue(datos, 'warranty') || 
                    getSafeValue(datos, 'garantia') || 
                    getSafeValue(hardware, 'warranty') || 
                    getSafeValue(hardware, 'garantia') || 
                    '12';
    setInputValue('hardwareWarranty', warranty);
    
    // Descripción
    const description = getSafeValue(datos, 'description') || 
                       getSafeValue(datos, 'descripcion') || 
                       getSafeValue(hardware, 'descripcion');
    setInputValue('hardwareDescription', description);
    
    //console.log('✅ Datos cargados en el formulario correctamente');
    
  } catch (error) {
    //console.error('💥 Error al cargar datos en el formulario:', error);
    loadDummyDataIntoForm(); // Fallback a datos dummy
  }
}

// Función para cargar datos dummy en caso de error
function loadDummyDataIntoForm() {
  //console.log('⚠️ Cargando datos dummy en el formulario');
  
  const setInputValue = (inputId, value) => {
    const input = document.getElementById(inputId);
    if (input) input.value = value;
  };
  
  setInputValue('hardwareName', 'Hardware sin nombre');
  setInputValue('hardwareType', 'General');
  setInputValue('hardwareBrand', 'Sin marca');
  setInputValue('hardwareModel', 'Sin modelo');
  setInputValue('hardwarePrice', '0');
  setInputValue('hardwareStock', '0');
  setInputValue('hardwareStatus', 'available');
  setInputValue('hardwareWarranty', '12');
  setInputValue('hardwareDescription', '');
}

// Función closeModal actualizada para usar modalManager como empresas
function closeModal() {
  // Usar el sistema de modales global (igual que empresas)
  if (window.modalManager) {
    window.modalManager.closeModal('hardwareModal');
  } else {
    // Fallback para compatibilidad
    const modal = document.getElementById('hardwareModal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
  
  resetForm();
}

// Función para resetear el formulario
function resetForm() {
  const form = document.getElementById('hardwareForm');
  if (form) {
    form.reset();
  }
}

// NOTE: Función viewHardware() comentada - ahora se usa la implementación en hardware-core.js
// async function viewHardware(id) {
//   // ... implementación comentada para evitar duplicación ...
// }

// Variable para almacenar el hardware actual que se está visualizando
let currentViewingHardware = null;

// Función de utilidad para debuggear estructuras de datos
function debugHardwareStructure(hardware, context = 'Unknown') {
  //console.group(`🔍 Debug Hardware Structure - ${context}`);
  //console.log('📊 Objeto completo:', hardware);
  //console.log('📋 Tipo de objeto:', typeof hardware);
  //console.log('🔑 Claves principales:', Object.keys(hardware || {}));
  
  if (hardware) {
    // Verificar estructura de datos
    //console.log('📝 Nombre:', hardware.nombre || hardware.name || 'No encontrado');
    //console.log('📂 Tipo:', hardware.tipo || hardware.type || 'No encontrado');
    //console.log('🏢 Empresa:', hardware.empresa_nombre || hardware.company || 'No encontrado');
    //console.log('📍 Sede:', hardware.sede || hardware.location || 'No encontrado');
    //console.log('✅ Activa:', hardware.activa || hardware.active || 'No encontrado');
    
    // Verificar estructura de datos anidados
    if (hardware.datos) {
      //console.log('📦 Datos anidados tipo:', typeof hardware.datos);
      if (typeof hardware.datos === 'string') {
        try {
          const parsed = JSON.parse(hardware.datos);
          //console.log('📝 Datos parseados:', parsed);
          //console.log('🔑 Claves de datos parseados:', Object.keys(parsed || {}));
        } catch (e) {
          //console.warn('⚠️ Error al parsear datos string:', e);
        }
      } else if (typeof hardware.datos === 'object') {
        //console.log('📦 Datos como objeto:', hardware.datos);
        //console.log('🔑 Claves de datos:', Object.keys(hardware.datos || {}));
        
        if (hardware.datos.datos) {
          //console.log('📦 Datos.datos:', hardware.datos.datos);
          //console.log('🔑 Claves de datos.datos:', Object.keys(hardware.datos.datos || {}));
        }
      }
    } else {
      //console.log('❌ No hay campo "datos"');
    }
  }
  
  //console.groupEnd();
}

// Función para mostrar los detalles del hardware en el modal
function showHardwareDetails(hardware) {
  try {
    //console.log('📋 Datos completos del hardware recibidos:', hardware);
    
    // Debug de la estructura de datos
    debugHardwareStructure(hardware, 'showHardwareDetails');
    
    currentViewingHardware = hardware;
    
    // Función helper para obtener valor seguro
    const getSafeValue = (obj, path, defaultValue = 'N/A') => {
      try {
        const keys = path.split('.');
        let current = obj;
        for (const key of keys) {
          if (current === null || current === undefined) {
            return defaultValue;
          }
          current = current[key];
        }
        return current !== null && current !== undefined ? current : defaultValue;
      } catch (e) {
        //console.warn(`Error accessing path ${path}:`, e);
        return defaultValue;
      }
    };
    
    // Función helper para obtener elemento del DOM de forma segura
    const setElementText = (elementId, value) => {
      try {
        const element = document.getElementById(elementId);
        if (element) {
          element.textContent = value;
        } else {
          //console.warn(`Element with ID '${elementId}' not found`);
        }
      } catch (e) {
        //console.error(`Error setting text for element '${elementId}':`, e);
      }
    };
    
    // Extraer datos anidados con múltiples posibilidades
    let datos = {};
    if (hardware.datos) {
      if (typeof hardware.datos === 'object') {
        // Si datos es un objeto, puede tener .datos anidado o ser los datos directamente
        datos = hardware.datos.datos || hardware.datos;
      } else if (typeof hardware.datos === 'string') {
        // Si datos es un string JSON, parsearlo
        try {
          const parsed = JSON.parse(hardware.datos);
          datos = parsed.datos || parsed;
        } catch (e) {
          //console.warn('Error parsing datos string:', e);
          datos = {};
        }
      }
    }
    
    //console.log('📊 Datos extraídos para mostrar:', datos);
    
    // Llenar los campos del modal con validaciones defensivas
    setElementText('viewHardwareName', getSafeValue(hardware, 'nombre'));
    setElementText('viewHardwareType', getSafeValue(hardware, 'tipo'));
    setElementText('viewHardwareEmpresa', getSafeValue(hardware, 'empresa_nombre'));
    setElementText('viewHardwareSede', getSafeValue(hardware, 'sede'));
    
    // Campos de datos con múltiples posibilidades
    setElementText('viewHardwareBrand', 
      getSafeValue(datos, 'brand') || 
      getSafeValue(datos, 'marca') || 
      getSafeValue(hardware, 'marca') || 
      'N/A'
    );
    
    setElementText('viewHardwareModel', 
      getSafeValue(datos, 'model') || 
      getSafeValue(datos, 'modelo') || 
      getSafeValue(hardware, 'modelo') || 
      'N/A'
    );
    
    // Precio con formateo
    const price = getSafeValue(datos, 'price') || 
                 getSafeValue(datos, 'precio') || 
                 getSafeValue(hardware, 'precio');
    setElementText('viewHardwarePrice', 
      price && price !== 'N/A' ? `$${price}` : 'N/A'
    );
    
    // Stock con formateo
    const stock = getSafeValue(datos, 'stock') || 
                 getSafeValue(hardware, 'stock');
    setElementText('viewHardwareStock', 
      stock !== 'N/A' && stock !== null && stock !== undefined ? `${stock} unidades` : 'N/A'
    );
    
    // Estado con múltiples posibilidades
    let statusText = 'N/A';
    const status = getSafeValue(datos, 'status') || 
                  getSafeValue(datos, 'estado') || 
                  getSafeValue(hardware, 'status') || 
                  getSafeValue(hardware, 'estado') || 
                  'available';
    
    if (status === 'available' || status === 'disponible') {
      statusText = 'Disponible';
    } else if (status === 'out_of_stock' || status === 'sin_stock') {
      statusText = 'Sin Stock';
    } else if (status === 'discontinued' || status === 'descontinuado') {
      statusText = 'Descontinuado';
    } else if (status !== 'N/A') {
      statusText = status; // Mostrar el estado tal como viene si no es N/A
    }
    setElementText('viewHardwareStatus', statusText);
    
    // Garantía con múltiples posibilidades
    const warranty = getSafeValue(datos, 'warranty') || 
                    getSafeValue(datos, 'garantia') || 
                    getSafeValue(hardware, 'warranty') || 
                    getSafeValue(hardware, 'garantia');
    setElementText('viewHardwareWarranty', 
      warranty && warranty !== 'N/A' ? `${warranty} meses` : 'N/A'
    );
    
    // Activo (con validación de tipo)
    const activa = getSafeValue(hardware, 'activa');
    let activaText = 'N/A';
    if (activa === true || activa === 'true' || activa === 1 || activa === '1') {
      activaText = 'Sí';
    } else if (activa === false || activa === 'false' || activa === 0 || activa === '0') {
      activaText = 'No';
    }
    setElementText('viewHardwareActive', activaText);
    
    // Fecha de creación con múltiples formatos
    let fechaCreacion = 'N/A';
    const fechaRaw = getSafeValue(hardware, 'fecha_creacion') || 
                    getSafeValue(hardware, 'created_at') || 
                    getSafeValue(hardware, 'createdAt');
    
    if (fechaRaw && fechaRaw !== 'N/A') {
      try {
        fechaCreacion = formatDateTimeForUser(fechaRaw);
      } catch (e) {
        fechaCreacion = fechaRaw; // Usar valor original en caso de error
      }
    }
    setElementText('viewHardwareCreated', fechaCreacion);
    
    // Descripción con múltiples posibilidades
    const description = getSafeValue(datos, 'description') || 
                       getSafeValue(datos, 'descripcion') || 
                       getSafeValue(hardware, 'descripcion') || 
                       'Sin descripción';
    setElementText('viewHardwareDescription', description);
    
    // Open modal immediately without scrolling - using modal manager
    
    // Open modal using modal manager
    if (window.modalManager) {
      window.modalManager.openModal('viewHardwareModal');
      // Set up modal if not already configured
      window.modalManager.setupModal('viewHardwareModal');
    } else {
      // Fallback for compatibility
      const modal = document.getElementById('viewHardwareModal');
      modal.classList.remove('hidden');
    }
    
    //console.log('✅ Modal de detalles mostrado correctamente');
    
  } catch (error) {
    //console.error('💥 Error al mostrar detalles del hardware:', error);
    
    // Mostrar un modal de error o alerta
    alert('Error al cargar los detalles del hardware. Por favor, inténtalo de nuevo.');
    
    // Cerrar el modal si estaba abierto
    const modal = document.getElementById('viewHardwareModal');
    if (modal && !modal.classList.contains('hidden')) {
      closeViewModal();
    }
  }
}

// Función para cerrar el modal de vista - IGUAL QUE EMPRESAS
function closeViewModal() {
  // Usar el sistema de modales global (igual que empresas)
  if (window.modalManager) {
    window.modalManager.closeModal('viewHardwareModal');
  } else {
    // Fallback para compatibilidad
    const modal = document.getElementById('viewHardwareModal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
  
  currentViewingHardware = null;
}

// Client Update Modal Functions
function showClientUpdateModal(message = 'El cliente se ha actualizado exitosamente.') {
  //console.log('🔄 Showing client update modal:', message);
  
  const modal = document.getElementById('clientUpdateModal');
  const container = document.getElementById('updateModalContainer');
  const icon = document.getElementById('updateModalIcon');
  const iconFa = document.getElementById('updateModalIconFa');
  const title = document.getElementById('updateModalTitle');
  const messageEl = document.getElementById('updateModalMessage');
  
  if (!modal || !container || !title || !messageEl) {
    //console.error('❌ Client update modal elements missing!');
    return;
  }
  
  // Set success styling with separate classes
  if (icon) icon.className = 'client-update-icon';
  if (iconFa) iconFa.className = 'fas fa-check-circle';
  
  // Set dynamic title based on message
  if (message.includes('creado')) {
    title.textContent = '¡Hardware Creado!';
  } else if (message.includes('actualizado')) {
    title.textContent = '¡Hardware Actualizado!';
  } else {
    title.textContent = '¡Operación Exitosa!';
  }
  
  messageEl.textContent = message;
  
  // Show modal using modalManager (consistent with other modals)
  if (window.modalManager) {
    window.modalManager.openModal('clientUpdateModal');
  } else {
    // Fallback
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
  }
  
  //console.log('✅ Client update modal should now be visible');
  
  // Simple animation
  if (typeof gsap !== 'undefined') {
    gsap.set(container, { scale: 0.8, opacity: 0 });
    gsap.to(container, {
      scale: 1,
      opacity: 1,
      duration: 0.4,
      ease: "back.out(1.7)"
    });
    
    if (icon) {
      gsap.to(icon, {
        scale: 1.1,
        duration: 0.6,
        repeat: 1,
        yoyo: true,
        ease: "power2.inOut"
      });
    }
  } else {
    container.style.transform = 'scale(1)';
    container.style.opacity = '1';
  }
  
  // NO auto-close - wait for user interaction
  //console.log('⏰ Modal will stay open until user clicks Aceptar or clicks outside');
}

// Close update modal
function closeUpdateModal() {
  //console.log('🔄 Closing client update modal');
  
  const modal = document.getElementById('clientUpdateModal');
  const container = document.getElementById('updateModalContainer');
  
  if (!modal) {
    //console.error('❌ Client update modal not found when trying to close');
    return;
  }
  
  // Simple close animation
  if (typeof gsap !== 'undefined' && container) {
    gsap.to(container, {
      scale: 0.8,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        resetAndHideUpdateModal();
      }
    });
  } else {
    resetAndHideUpdateModal();
  }
  
  function resetAndHideUpdateModal() {
    // Use modalManager for consistent closing
    if (window.modalManager) {
      window.modalManager.closeModal('clientUpdateModal');
    } else {
      // Fallback
      modal.classList.add('hidden');
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
    }
    
    //console.log('✅ Client update modal closed');
  }
}

// Test function for client update modal
function testUpdateModal() {
  //console.log('🧪 Testing client update modal...');
  showClientUpdateModal('Hardware actualizado exitosamente para prueba');
}

// Test function for location modal (debugging)
function testLocationModal() {
  //console.log('🧪 Testing location modal...');
  
  // Set up test data
  window.currentLocationUrl = 'https://www.google.com/maps/@40.7128,-74.0060,15z';
  
  const modal = document.getElementById('locationModal');
  //console.log('🔍 Modal element:', modal);
  //console.log('🔍 Modal classes:', modal ? modal.className : 'NOT FOUND');
  //console.log('🔍 GSAP available:', typeof gsap !== 'undefined');
  //console.log('🔍 LocationModalAnimations available:', !!window.locationModalAnimations);
  
  if (window.locationModalAnimations) {
    //console.log('🎬 Using professional animations');
    const mapContainer = document.getElementById('locationMap');
    window.locationModalAnimations.showMapLoading(mapContainer);
    window.locationModalAnimations.openModal(modal, () => {
      //console.log('🎬 Modal animation completed');
    });
  } else {
    //console.log('⚠️ Fallback: opening modal directly');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    modal.style.opacity = '1';
    modal.style.pointerEvents = 'all';
  }
}

// Make test functions available globally
window.testUpdateModal = testUpdateModal;
window.testLocationModal = testLocationModal;

// Initialize API client
let apiClient;
let currentToken = null;

// Check modal elements on page load
function checkModalElements() {
  //console.log('🔍 Checking modal elements...');
  
  const updateElements = {
    updateModal: document.getElementById('clientUpdateModal'),
    updateContainer: document.getElementById('updateModalContainer'),
    updateTitle: document.getElementById('updateModalTitle'),
    updateMessage: document.getElementById('updateModalMessage'),
    updateButton: document.querySelector('.client-update-button')
  };
  
  //console.log('🟢 Update Modal Elements:');
  Object.entries(updateElements).forEach(([name, element]) => {
    if (element) {
      //console.log(`  ✅ ${name}: Found`);
    } else {
      //console.error(`  ❌ ${name}: NOT FOUND`);
    }
  });
  
  return { ...updateElements };
}

const initializeHardwareApiClient = () => {
  if (apiClient) return;

  // Get token from session and initialize
  fetch(window.__buildApiUrl('/health'))
    .then(response => {
      if (response.ok) {
        apiClient = new EndpointTestClient();
        //console.log('API Client initialized');
        
        // Check modal elements
        setTimeout(checkModalElements, 1000);
        
        // Initialize filter listeners first
        initializeFilterListeners();
        
        // NO cargar datos aquí - ya lo hace hardware-main.js
        //console.log('✅ API Client listo, hardware-main.js se encargará de cargar datos');
      }
    })
    .catch(err => console.error('Error initializing API client:', err));
};

// Functions for CRUD operations
let isLoadingHardware = false;

// FUNCIÓN ESPECÍFICA PARA EMPRESAS - NO USA ENDPOINTS DE ADMIN
async function loadHardware() {
  if (isLoadingHardware) {
    //console.warn('⚠️ loadHardware ya en progreso, saltando llamada duplicada...');
    return;
  }
  
  isLoadingHardware = true;
  try {
    //console.log('🔄 Cargando hardware ESPECÍFICO para empresa...');
    
    // Obtener ID de empresa del contexto
    const empresaId = window.EMPRESA_ID || '';
    if (!empresaId) {
      //console.error('❌ No se encontró ID de empresa');
      renderHardware([]);
      return;
    }
    
    //console.log('🏢 ID de empresa:', empresaId);
    
    // Determinar qué endpoint usar basado en el filtro de inactivos
    const includeInactiveFilter = document.getElementById('includeInactiveFilter');
    const includeInactive = includeInactiveFilter ? includeInactiveFilter.value === 'all' : false;
    
    let response;
    // SOLO USAR ENDPOINTS DE EMPRESA - NO FALLBACK A ADMIN
    if (includeInactive) {
      //console.log('🌐 Usando endpoint de empresa con inactivos:', `/proxy/api/hardware/empresa/${empresaId}/including-inactive`);
      response = await apiClient.get_hardware_by_empresa_including_inactive(empresaId);
    } else {
      //console.log('🌐 Usando endpoint de empresa activos:', `/proxy/api/hardware/empresa/${empresaId}`);
      response = await apiClient.get_hardware_by_empresa(empresaId);
    }
    
    //console.log('📡 Respuesta recibida - Status:', response.status, 'OK:', response.ok);
    
    if (!response.ok) {
      if (response.status === 401) {
        //console.error('❌ Error 401: No autorizado. Redirigiendo al login...');
        window.location.href = '/login';
        return;
      } else if (response.status === 404) {
        //console.error('❌ Error 404: Endpoint de empresa no encontrado:', response.status);
        throw new Error(`Endpoint de empresa no disponible: ${response.status}`);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }
    
    const data = await response.json();
    
    //console.log('📦 Datos COMPLETOS recibidos del servidor:');
    //console.log(JSON.stringify(data, null, 2));
    //console.log('🔍 Tipo de dato recibido:', typeof data);
    //console.log('🔍 Es array data?:', Array.isArray(data));
    //console.log('🔍 Es array data.data?:', Array.isArray(data.data));
    //console.log('🔍 Incluye inactivos?:', includeInactive);
    
    if (data.success) {
      //console.log(`✅ Hardware cargado exitosamente: ${data.data.length} elementos`);
      //console.log('📋 Primer elemento de la lista (si existe):');
      if (data.data && data.data.length > 0) {
        //console.log(JSON.stringify(data.data[0], null, 2));
        
        // Verificar si realmente es hardware o empresas
        const firstItem = data.data[0];
        if (firstItem.hasOwnProperty('nombre') && firstItem.hasOwnProperty('tipo')) {
          //console.log('✅ Confirmado: Los datos son HARDWARE');
        } else if (firstItem.hasOwnProperty('nombre') && firstItem.hasOwnProperty('ubicacion')) {
          //console.error('❌ ERROR: Los datos son EMPRESAS, no hardware!');
        } else {
          //console.warn('⚠️ ADVERTENCIA: Estructura de datos desconocida');
        }
      }
      
      // Renderizar hardware
      renderHardware(data.data);
      updateStats(data);
      openHardwareFromSession(data.data);
    } else {
      //console.error('❌ Error en la respuesta del servidor:', data.errors);
      // Mostrar mensaje de error al usuario
      renderHardware([]);
    }
  } catch (error) {
    //console.error('💥 Error al cargar hardware:', error);
    // Mostrar mensaje de error al usuario
    renderHardware([]);
  } finally {
    isLoadingHardware = false;
  }
}

let hardwareSessionOpenPending = false;
function openHardwareFromSession(hardwareList) {
  if (hardwareSessionOpenPending) return;

  const hardwareId = sessionStorage.getItem('openHardwareId');
  if (!hardwareId) return;

  const maxRetries = 20;
  let attempts = 0;

  const tryOpen = () => {
    const hasApiClient = !!window.hardwareCore?.apiClient;
    if (window.viewHardware && typeof window.viewHardware === 'function' && hasApiClient) {
      sessionStorage.removeItem('openHardwareId');
      window.viewHardware(hardwareId);
      return;
    }

    attempts += 1;
    if (attempts < maxRetries) {
      setTimeout(tryOpen, 400);
    }
  };

  hardwareSessionOpenPending = true;
  setTimeout(() => {
    hardwareSessionOpenPending = false;
    tryOpen();
  }, 400);
}


async function createHardwareAPI(hardwareData) {
  try {
    const response = await apiClient.create_hardware(hardwareData);
    const data = await response.json();
    
    if (data.success) {
      // Show client update modal instead of alert for creation
      showClientUpdateModal('Hardware creado exitosamente');
      loadHardware();
      closeModal();
    } else {
      showEnhancedNotification('Error: ' + (data.errors ? data.errors.join(', ') : 'Error desconocido'), 'error');
    }
  } catch (error) {
    //console.error('Error al crear hardware:', error);
    showEnhancedNotification('Error de conexión', 'error');
  }
}

async function updateHardwareAPI(id, hardwareData) {
  try {
    const response = await apiClient.update_hardware(id, hardwareData);
    const data = await response.json();
    
    if (data.success) {
      // Show client update modal instead of alert
      showClientUpdateModal('Hardware actualizado exitosamente');
      loadHardware();
      closeModal();
    } else {
      showEnhancedNotification('Error: ' + (data.errors ? data.errors.join(', ') : 'Error desconocido'), 'error');
    }
  } catch (error) {
    //console.error('Error al actualizar hardware:', error);
    showEnhancedNotification('Error de conexión', 'error');
  }
}

// Make API functions globally available for hardware-core.js
window.createHardwareAPI = createHardwareAPI;
window.updateHardwareAPI = updateHardwareAPI;


// Función helper para mostrar notificaciones menos intrusivas (legacy)
function showNotification(message, type = 'info') {
  showEnhancedNotification(message, type);
}

// Enhanced notification system WITHOUT GSAP - Simple and fast
function showEnhancedNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.enhanced-notification');
  existingNotifications.forEach(notification => notification.remove());
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `enhanced-notification fixed top-4 right-4 max-w-sm w-full`;
  notification.style.zIndex = '999999';
  notification.style.transform = 'translateX(400px)';
  notification.style.opacity = '0';
  notification.style.transition = 'all 0.3s ease';
  
  let iconClass, bgClass, borderClass;
  if (type === 'error') {
    iconClass = 'fas fa-exclamation-circle';
    bgClass = 'bg-red-500';
    borderClass = 'border-red-600';
  } else {
    iconClass = 'fas fa-check-circle';
    bgClass = 'bg-green-500';
    borderClass = 'border-green-600';
  }
  
  notification.innerHTML = `
    <div class="${bgClass} ${borderClass} border-l-4 text-white p-4 rounded-lg shadow-xl backdrop-blur-sm">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <i class="${iconClass} text-xl"></i>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium">${message}</p>
        </div>
        <div class="ml-auto pl-3">
          <button onclick="closeNotification(this)" class="text-white hover:text-gray-200 transition-colors">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(notification);
  
  // Simple CSS animation - slide in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
    notification.style.opacity = '1';
  }, 10);
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    closeNotification(notification.querySelector('button'));
  }, 4000);
}

// Close notification with simple animation
function closeNotification(button) {
  const notification = button.closest('.enhanced-notification');
  if (notification) {
    notification.style.transform = 'translateX(400px)';
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }
}

// Render hardware data
function renderHardware(hardwareList) {
    //console.log('🎨 === INICIANDO RENDERIZADO DE HARDWARE ===');
    //console.log('⚙️ Estado inicial del DOM (por clase):', {
    //   isHidden: document.getElementById('locationModal').classList.contains('hidden'),
    //   isModalOpen: document.getElementById('locationModal').classList.contains('modal-open'),
    //   isModalOpening: document.getElementById('locationModal').classList.contains('modal-opening')
    // });
  //console.log('📋 hardwareList recibida:', hardwareList);
  //console.log('🔢 Tipo de hardwareList:', typeof hardwareList);
  //console.log('🔢 Es array:', Array.isArray(hardwareList));
  //console.log('🔢 Longitud:', hardwareList ? hardwareList.length : 'N/A');
  
  const gridContainer = document.getElementById('hardwareGrid');
  
  if (!gridContainer) {
    //console.error('❌ No se encontró el contenedor del grid');
    return;
  }
  
  // Asegurar que el grid container tenga la clase iOS correcta
  gridContainer.className = 'ios-hardware-grid';
  
  // Clear existing content more thoroughly
  //console.log('🧹 Limpiando contenido existente...');
  gridContainer.innerHTML = '';
  
  // Remove any existing filter messages
  const existingFilterMessage = document.getElementById('filterEmptyMessage');
  if (existingFilterMessage) {
    //console.log('🧹 Removiendo mensaje de filtro existente');
    existingFilterMessage.remove();
  }
  const existingFilterMessageTable = document.getElementById('filterEmptyMessageTable');
  if (existingFilterMessageTable) {
    //console.log('🧹 Removiendo mensaje de tabla existente');
    existingFilterMessageTable.remove();
  }
  
  if (!hardwareList || hardwareList.length === 0) {
    // Show empty state
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'col-span-full text-center py-8';
    emptyMessage.innerHTML = `
      <div class="text-center">
        <i class="fas fa-box-open text-4xl mb-4 text-gray-400"></i>
        <h2 class="text-2xl font-bold text-white mb-2">No hay hardware disponible para este filtro</h2>
        <p class="text-sm text-gray-400">Prueba ajustando los filtros o haz clic en "Nuevo Hardware" para agregar uno.</p>
      </div>
    `;
    gridContainer.appendChild(emptyMessage);
    
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="6" class="text-center py-8"><h2 class="text-2xl font-bold text-white">No hay hardware disponible para este filtro</h2></td>';
    tableBody.appendChild(emptyRow);
    return;
  }
  
  //console.log(`🔨 Creando ${hardwareList.length} elementos de hardware...`);
  
  hardwareList.forEach((hardware, index) => {
    try {
      //console.log(`📦 Procesando hardware ${index + 1}:`, hardware);
      
      // Verificar si ya existe un elemento con este ID para evitar duplicados
      const existingGridItem = document.querySelector(`[data-hardware-id="${hardware._id}"]`);
      if (existingGridItem) {
        //console.warn(`⚠️ Hardware ${hardware._id} ya existe en el DOM, saltando...`);
        return;
      }
      
      // Create grid card
      const gridCard = createHardwareCard(hardware);
      if (gridCard) {
        // Añadir ID único para evitar duplicados
        gridCard.setAttribute('data-hardware-id', hardware._id);
        
        // Asegurar que siempre tenga las clases iOS correctas
        gridCard.className = 'ios-hardware-card hardware-item';
        
        gridContainer.appendChild(gridCard);
        //console.log(`✅ Card ${index + 1} agregada al grid`);
      } else {
        //console.error(`❌ No se pudo crear card para hardware ${index + 1}`);
      }
    } catch (error) {
      //console.error(`💥 Error renderizando hardware ${index + 1}:`, error, hardware);
    }
  });
  
  //console.log(`🎉 === RENDERIZADO COMPLETADO ===`);
  //console.log(`  - Grid tiene: ${gridContainer.children.length} elementos`);
  
  // Verificar que los elementos tengan las clases correctas
  const gridItems = document.querySelectorAll('.hardware-item');
  //console.log(`🔍 Elementos renderizados:`);
  //console.log(`  - Grid items (.hardware-item): ${gridItems.length}`);
  
  if (gridItems.length > 0) {
    //console.log('🔍 Primer elemento del grid:');
    const firstGridItem = gridItems[0];
    //console.log('  - Clases:', firstGridItem.className);
    //console.log('  - data-name:', firstGridItem.dataset.name);
    //console.log('  - data-type:', firstGridItem.dataset.type);
    //console.log('  - data-status:', firstGridItem.dataset.status);
    //console.log('  - data-activa:', firstGridItem.dataset.activa);
  }
  
  // Apply current filters after rendering
  //console.log('🕰️ Programando aplicación de filtros en 100ms...');
  setTimeout(() => {
    //console.log('🕰️ Aplicando filtros ahora...');
    applyCurrentFilters();
  }, 100);
}

// Create hardware card for grid view
function createHardwareCard(hardware) {
  try {
    //console.log('🏗️ Creando card para hardware:', hardware);
    
    const div = document.createElement('div');
    div.className = 'ios-hardware-card hardware-item';
    
    // Extract nested data properly
    const datos = hardware.datos?.datos || hardware.datos || {};
    const status = datos.status || 'available';
    const stock = datos.stock || 0;

    const physicalStatusRaw = hardware.physical_status ||
      hardware.physicalStatus ||
      hardware.estado_fisico ||
      datos.physical_status ||
      datos.physicalStatus ||
      datos.estado_fisico ||
      hardware.datos?.physical_status ||
      hardware.datos?.datos?.physical_status;
    let physicalStatus = physicalStatusRaw;
    if (typeof physicalStatus === 'string') {
      try {
        physicalStatus = JSON.parse(physicalStatus);
      } catch (e) {
        physicalStatus = null;
      }
    }
    let physicalEstado = null;
    if (physicalStatus && typeof physicalStatus === 'object') {
      if (physicalStatus.estado !== undefined) {
        physicalEstado = physicalStatus.estado;
      } else if (physicalStatus.status !== undefined) {
        physicalEstado = physicalStatus.status;
      } else {
        const estadoKey = Object.keys(physicalStatus).find(key => key.toLowerCase() === 'estado');
        if (estadoKey) {
          physicalEstado = physicalStatus[estadoKey];
        }
      }
    }
    let physicalEstadoNormalized = physicalEstado ? String(physicalEstado).trim().toLowerCase() : '';
    if (!physicalEstadoNormalized && physicalStatus && typeof physicalStatus === 'object') {
      const match = Object.values(physicalStatus).find(value =>
        typeof value === 'string' && value.trim().toLowerCase() === 'inactivo'
      );
      physicalEstadoNormalized = match ? 'inactivo' : '';
    }
    const isInactive = physicalEstadoNormalized === 'inactivo' || physicalEstadoNormalized === 'inactive' || hardware.activa === false;
    if (isInactive) {
      div.classList.add('hardware-physical-inactive');
      div.style.cssText += 'background: rgba(239, 68, 68, 0.38) !important; border: 1px solid rgba(239, 68, 68, 0.6) !important; box-shadow: 0 12px 32px rgba(239, 68, 68, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.45) !important;';
    }
    
    //console.log('📊 Datos extraídos:', { datos, status, stock });
    
    // Set data attributes for filtering
    div.setAttribute('data-type', hardware.tipo || '');
    div.setAttribute('data-status', status);
    div.setAttribute('data-name', (hardware.nombre || '').toLowerCase());
    div.setAttribute('data-brand', (datos.brand || '').toLowerCase());
    div.setAttribute('data-model', (datos.model || '').toLowerCase());
    div.setAttribute('data-sede', (hardware.sede || '').toLowerCase());
    div.setAttribute('data-stock', stock);
    div.setAttribute('data-activa', hardware.activa !== false ? 'true' : 'false');
    
    //console.log('🔍 Atributos de filtro establecidos:', {
    //   'data-type': hardware.tipo || '',
    //   'data-status': status,
    //   'data-name': (hardware.nombre || '').toLowerCase(),
    //   'data-activa': hardware.activa !== false ? 'true' : 'false'
    // });
    
    // Determine status display and iOS classes
    let statusClass = 'ios-status-available';
    let statusText = 'Disponible';
    
    if (stock === 0 || status === 'out_of_stock') {
      statusClass = 'ios-status-stock';
      statusText = 'Sin Stock';
    } else if (status === 'discontinued') {
      statusClass = 'ios-status-discontinued';
      statusText = 'Descontinuado';
    } else if (!hardware.activa) {
      statusClass = 'ios-status-discontinued';
      statusText = 'Inactivo';
    }
    
    const inactiveTextStyle = isInactive ? 'color: #ffffff !important;' : '';

    div.innerHTML = `
      <div class="ios-card-header">
        <div class="ios-card-icon">
          <i class="fas fa-microchip"></i>
        </div>
        <span class="ios-status-badge ${statusClass}" style="${inactiveTextStyle}">
          ${statusText}
        </span>
      </div>
      
      <h3 class="ios-card-title" style="${inactiveTextStyle}">${hardware.nombre || 'Sin nombre'}</h3>
      <p class="ios-card-subtitle" style="${inactiveTextStyle}">${datos.brand || 'N/A'} • ${datos.model || 'N/A'}</p>
      
      <div class="ios-card-info">
        <div class="ios-info-item">
          <span class="ios-info-label" style="${inactiveTextStyle}">Precio</span>
          <span class="ios-info-value" style="${inactiveTextStyle}">$${datos.price || 0}</span>
        </div>
        <div class="ios-info-item">
          <span class="ios-info-label" style="${inactiveTextStyle}">Stock</span>
          <span class="ios-info-value" style="${inactiveTextStyle}">${stock}</span>
        </div>
        <div class="ios-info-item">
          <span class="ios-info-label" style="${inactiveTextStyle}">Tipo</span>
          <span class="ios-info-value" style="${inactiveTextStyle}">${hardware.tipo || 'N/A'}</span>
        </div>
        <div class="ios-info-item">
          <span class="ios-info-label" style="${inactiveTextStyle}">Estado</span>
          <span class="ios-info-value" style="${inactiveTextStyle}">${hardware.activa ? 'Activo' : 'Inactivo'}</span>
        </div>
      </div>
      
      <div class="ios-card-actions">
        <button class="ios-card-btn" onclick="viewHardware('${hardware._id}')" title="Ver detalles">
          <i class="fas fa-eye"></i>
        </button>
        <button class="ios-card-btn ios-card-btn-primary" onclick="editHardware('${hardware._id}')" title="Editar">
          <i class="fas fa-edit"></i>
        </button>
        ${hardware.direccion_url && hardware.direccion_url.trim() !== '' ? 
          `<button class="ios-card-btn" onclick="openLocationModalFromCard('${hardware._id}', '${hardware.direccion_url}')" title="Ver ubicación">
            <i class="fas fa-map-location-dot"></i>
          </button>` : ''
        }
      </div>
      
      <!-- iOS Card Shimmer Effect -->
      <div class="ios-card-shimmer"></div>
    `;
    
    // Aplicar optimizaciones de performance a la tarjeta creada
    applyCardOptimizations(div);
    
    //console.log('✅ Card creada exitosamente con optimizaciones');
    return div;
    
  } catch (error) {
    //console.error('💥 Error creando card:', error);
    return null;
  }
}


// Update stats with real data
function updateStats(data) {
  // Update total items
  if (data.count !== undefined) {
    const totalElement = document.getElementById('totalItemsCount');
    if (totalElement) totalElement.textContent = data.count;
  }
  
  // Calculate and update other stats from the hardware list
  if (data.data && Array.isArray(data.data)) {
    const hardwareList = data.data;
    let availableCount = 0;
    let outOfStockCount = 0;
    let totalValue = 0;
    
    hardwareList.forEach(hardware => {
      const datos = hardware.datos?.datos || hardware.datos || {};
      const stock = datos.stock || 0;
      const price = datos.price || 0;
      const status = datos.status || 'available';
      
      // Count availability
      if (hardware.activa && stock > 0 && status !== 'discontinued') {
        availableCount++;
      } else if (stock === 0 || status === 'out_of_stock') {
        outOfStockCount++;
      }
      
      // Calculate total value
      totalValue += price * stock;
    });
    
    // Update DOM elements
    const availableElement = document.getElementById('availableItemsCount');
    const outOfStockElement = document.getElementById('outOfStockCount');
    const totalValueElement = document.getElementById('totalValueCount');
    
    if (availableElement) availableElement.textContent = availableCount;
    if (outOfStockElement) outOfStockElement.textContent = outOfStockCount;
    if (totalValueElement) totalValueElement.textContent = `$${totalValue.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
  }
}

// Load hardware types from backend
async function loadHardwareTypes() {
  try {
    const response = await apiClient.get_hardware_types();
    const data = await response.json();
    
    if (data.success) {
      //console.log('Hardware types loaded:', data);
      populateTypeDropdowns(data.data);
    } else {
      //console.error('Error loading hardware types:', data.errors);
    }
  } catch (error) {
    //console.error('Error al cargar tipos de hardware:', error);
  }
}

// Load empresas from backend
async function loadEmpresas() {
  try {
    //console.log('🏢 Cargando empresas desde /proxy/api/empresas...');
    const response = await apiClient.get_empresas();
    const data = await response.json();
    
    if (data.success) {
      //console.log('🏢 Empresas cargadas:', data.count, 'empresas');
      //console.log('🏢 Primera empresa (si existe):');
      if (data.data && data.data.length > 0) {
        //console.log(JSON.stringify(data.data[0], null, 2));
      }
      // Store empresas for form usage
      window.empresas = data.data;
      // Populate empresa dropdown
      populateEmpresaDropdown(data.data);
      
      // If in empresa mode, pre-select current empresa
      if (window.EMPRESA_MODE && window.EMPRESA_ID) {
        preSelectCurrentEmpresa();
      }
    } else {
      //console.error('❌ Error loading empresas:', data.errors);
    }
  } catch (error) {
    //console.error('💥 Error al cargar empresas:', error);
  }
}

// Populate empresa dropdown with backend data
function populateEmpresaDropdown(empresas) {
  const empresaSelect = document.getElementById('hardwareEmpresa');
  
  if (!empresaSelect) {
    //console.warn('⚠️ Elemento hardwareEmpresa no encontrado');
    return;
  }
  
  // Clear existing options (except the first "Select" option)
  empresaSelect.innerHTML = '<option value="">Seleccionar empresa</option>';
  
  empresas.forEach(empresa => {
    const option = document.createElement('option');
    option.value = empresa._id; // Use the empresa ID
    option.textContent = empresa.nombre;
    option.dataset.nombre = empresa.nombre; // Store nombre for form submission
    empresaSelect.appendChild(option);
  });
  
  //console.log(`✅ ${empresas.length} empresas agregadas al dropdown`);
}

// Pre-select current empresa in empresa mode
function preSelectCurrentEmpresa() {
  if (!window.EMPRESA_ID) {
    //console.warn('⚠️ No hay ID de empresa disponible para pre-seleccionar');
    return;
  }
  
  const empresaSelect = document.getElementById('hardwareEmpresa');
  if (!empresaSelect) {
    //console.warn('⚠️ Elemento hardwareEmpresa no encontrado para pre-selección');
    return;
  }
  
  // Set the current empresa as selected
  empresaSelect.value = window.EMPRESA_ID;
  //console.log('🏢 Empresa pre-seleccionada:', window.EMPRESA_ID);
  
  // Load sedes for the pre-selected empresa
  loadSedesByEmpresa();
  
  // Also disable the empresa select in empresa mode (optional)
  // empresaSelect.disabled = true;
}

// Load sedes for selected empresa
function loadSedesByEmpresa() {
  const empresaSelect = document.getElementById('hardwareEmpresa');
  const sedeSelect = document.getElementById('hardwareSede');
  
  if (!empresaSelect || !sedeSelect) {
    //console.warn('⚠️ Elementos de empresa o sede no encontrados');
    return;
  }
  
  const selectedEmpresaId = empresaSelect.value;
  
  // Reset sede dropdown
  sedeSelect.innerHTML = '<option value="">Seleccionar sede</option>';
  sedeSelect.disabled = true;
  
  if (!selectedEmpresaId) {
    //console.log('🏢 No hay empresa seleccionada');
    return;
  }
  
  // Find selected empresa
  const selectedEmpresa = window.empresas?.find(emp => emp._id === selectedEmpresaId);
  
  if (!selectedEmpresa) {
    //console.error('❌ Empresa seleccionada no encontrada:', selectedEmpresaId);
    return;
  }
  
  //console.log('🏢 Empresa seleccionada:', selectedEmpresa);
  
  // Check if empresa has sedes
  if (selectedEmpresa.sedes && Array.isArray(selectedEmpresa.sedes)) {
    selectedEmpresa.sedes.forEach(sede => {
      const option = document.createElement('option');
      option.value = sede;
      option.textContent = sede;
      sedeSelect.appendChild(option);
    });
    
    sedeSelect.disabled = false;
    //console.log(`✅ ${selectedEmpresa.sedes.length} sedes cargadas para ${selectedEmpresa.nombre}`);
  } else {
    // If no sedes array, create a default "Principal" option
    const defaultOption = document.createElement('option');
    defaultOption.value = 'Principal';
    defaultOption.textContent = 'Principal';
    sedeSelect.appendChild(defaultOption);
    
    sedeSelect.disabled = false;
    //console.log('✅ Sede por defecto "Principal" agregada');
  }
}

// Populate type dropdowns with backend data
function populateTypeDropdowns(types) {
  const typeSelect = document.getElementById('hardwareType');
  const filterSelect = document.getElementById('typeFilter');
  
  // Clear existing options (except the first "Select" option)
  typeSelect.innerHTML = '<option value="">Seleccionar tipo</option>';
  filterSelect.innerHTML = '<option value="">Todos los tipos</option>';
  
  types.forEach(type => {
    const option1 = document.createElement('option');
    option1.value = type.nombre;
    option1.textContent = type.nombre;
    typeSelect.appendChild(option1);
    
    const option2 = document.createElement('option');
    option2.value = type.nombre;
    option2.textContent = type.nombre;
    filterSelect.appendChild(option2);
  });
}

// Form submission handling - REMOVIDO: Causaba envío duplicado
// El manejo del formulario ahora se hace completamente en hardware-core.js
// Este evento listener estaba causando que se enviara tanto POST como PUT
// cuando se editaba hardware, resultando en errores de nombres duplicados

// Filter functionality
function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('typeFilter').value = '';
  document.getElementById('statusFilter').value = '';
  document.getElementById('includeInactiveFilter').value = 'active';
  
  // Remove any filter empty messages
  const filterEmptyMessage = document.getElementById('filterEmptyMessage');
  if (filterEmptyMessage) {
    filterEmptyMessage.remove();
  }
  
  // Use hardware-main.js function instead of reloading
  if (window.hardwareMain) {
    window.hardwareMain.clearFilters();
  } else {
    // Fallback: just show all items without reloading
    const allItems = document.querySelectorAll('.hardware-item');
    allItems.forEach(item => {
      item.style.display = '';
      item.classList.remove('hidden');
    });
  }
}

function filterHardware() {
  //console.log('🚀 === INICIANDO FILTRO DE HARDWARE ===');
  
  const searchInput = document.getElementById('searchInput');
  const typeFilterEl = document.getElementById('typeFilter');
  const statusFilterEl = document.getElementById('statusFilter');
  
  if (!searchInput || !typeFilterEl || !statusFilterEl) {
    //console.error('❌ Elementos de filtro no encontrados:');
    //console.error('  - searchInput:', searchInput ? 'SI' : 'NO');
    //console.error('  - typeFilter:', typeFilterEl ? 'SI' : 'NO');
    //console.error('  - statusFilter:', statusFilterEl ? 'SI' : 'NO');
    return;
  }
  
  const search = searchInput.value.toLowerCase();
  const type = typeFilterEl.value;
  const status = statusFilterEl.value;
  
  //console.log('🔍 Valores de filtros:');
  //console.log('  - search:', search);
  //console.log('  - type:', type);
  //console.log('  - status:', status);
  
  // Filtrar elementos del grid
  const gridItems = document.querySelectorAll('.hardware-item');
  const allItems = [...gridItems];
  let visibleCount = 0;
  
  //console.log(`🔍 Elementos encontrados:`);
  //console.log(`  - Grid items (.hardware-item): ${gridItems.length}`);
  //console.log(`  - Total elementos: ${allItems.length}`);
  
  if (allItems.length === 0) {
    //console.error('❌ NO HAY ELEMENTOS DE HARDWARE EN EL DOM!');
    //console.log('🔍 Verificando contenedor de hardware...');
    const gridContainer = document.getElementById('hardwareGrid');
    //console.log('  - gridContainer children:', gridContainer ? gridContainer.children.length : 'NO ENCONTRADO');
    return;
  }
  
  allItems.forEach((item, index) => {
    const name = item.dataset.name || '';
    const itemType = item.dataset.type || '';
    const itemStatus = item.dataset.status || '';
    const stock = parseInt(item.dataset.stock || '0');
    const activa = item.dataset.activa === 'true';
    
    // Enhanced search - matches name, type, brand, model, or sede
    const brand = item.dataset.brand || '';
    const model = item.dataset.model || '';
    const sede = item.dataset.sede || '';
    
    const matchesSearch = !search || 
      name.includes(search) || 
      itemType.toLowerCase().includes(search) ||
      brand.includes(search) ||
      model.includes(search) ||
      sede.includes(search);
    
    // Type filter
    const matchesType = !type || itemType === type;
    
    // Status filter logic
    let matchesStatus = true;
    if (status) {
      switch (status) {
        case 'available':
          matchesStatus = activa && stock > 0 && itemStatus !== 'discontinued';
          break;
        case 'out_of_stock':
          matchesStatus = stock === 0 || itemStatus === 'out_of_stock';
          break;
        case 'discontinued':
          matchesStatus = itemStatus === 'discontinued';
          break;
        case 'inactive':
          matchesStatus = !activa;
          break;
      }
    }
    
    // Show/hide item
    if (matchesSearch && matchesType && matchesStatus) {
      item.style.display = '';
      item.classList.remove('hidden');
      visibleCount++;
      //console.log(`✅ Elemento ${index + 1} visible: ${name}`);
    } else {
      item.style.display = 'none';
      item.classList.add('hidden');
      //console.log(`❌ Elemento ${index + 1} oculto: ${name}`);
    }
  });
  
  //console.log(`📊 Filtrado completado: ${visibleCount} de ${allItems.length} elementos visibles`);
  
  // Show/hide empty message for filters
  showFilterEmptyMessage(visibleCount);
  
  // Update filter status message
  updateFilterStatus(visibleCount, gridItems.length); // Solo contar grid items para el status
}

// Show empty message when filters return no results
function showFilterEmptyMessage(visibleCount) {
  const hasFilters = document.getElementById('searchInput').value || 
                    document.getElementById('typeFilter').value || 
                    document.getElementById('statusFilter').value;
  
  // Remove existing empty message
  const existingEmptyMessage = document.getElementById('filterEmptyMessage');
  if (existingEmptyMessage) {
    existingEmptyMessage.remove();
  }
  
  // Show empty message if filters are applied and no results
  if (hasFilters && visibleCount === 0) {
    const gridContainer = document.getElementById('hardwareGrid');
    
    // Create empty message for grid
    const emptyMessage = document.createElement('div');
    emptyMessage.id = 'filterEmptyMessage';
    emptyMessage.className = 'col-span-full text-center py-8';
    emptyMessage.innerHTML = `
      <div class="text-center">
        <i class="fas fa-search text-4xl mb-4 text-gray-400"></i>
        <h2 class="text-2xl font-bold text-white mb-2">No se encontró hardware con este filtro</h2>
        <p class="text-sm text-gray-400">Prueba ajustando los criterios de búsqueda.</p>
        <button onclick="clearFilters()" class="mt-4 btn-secondary">
          <i class="fas fa-filter-circle-xmark"></i>
          Limpiar Filtros
        </button>
      </div>
    `;
    gridContainer.appendChild(emptyMessage);
  }
}

// Update filter status message
function updateFilterStatus(visibleCount, totalCount) {
  const hasFilters = document.getElementById('searchInput').value || 
                    document.getElementById('typeFilter').value || 
                    document.getElementById('statusFilter').value;
  
  // You can add a status message here if needed
  if (hasFilters && visibleCount !== totalCount) {
    //console.log(`Filtering: ${visibleCount} of ${totalCount} items shown`);
  }
}

// Helper function to apply current filters (without triggering events)
function applyCurrentFilters() {
  //console.log('🔄 Aplicando filtros actuales...');
  filterHardware();
}

// Función de recarga manual para debugging
function reloadHardwareManual() {
  //console.log('🔄 RECARGA MANUAL DE HARDWARE INICIADA');
  isLoadingHardware = false; // Reset flag
  loadHardware();
}

// Exponer función para uso en consola
window.reloadHardwareManual = reloadHardwareManual;

// Initialize filter event listeners only once
let filtersInitialized = false;

function initializeFilterListeners() {
  if (filtersInitialized) {
    //console.log('⚠️ Event listeners ya inicializados, saltando...');
    return;
  }
  
  //console.log('🎯 Inicializando event listeners de filtros...');
  
  const searchInput = document.getElementById('searchInput');
  const typeFilter = document.getElementById('typeFilter');
  const statusFilter = document.getElementById('statusFilter');
  const includeInactiveFilter = document.getElementById('includeInactiveFilter');
  
  //console.log('🔍 Elementos encontrados:');
  //console.log('  - searchInput:', searchInput ? 'SI' : 'NO');
  //console.log('  - typeFilter:', typeFilter ? 'SI' : 'NO');
  //console.log('  - statusFilter:', statusFilter ? 'SI' : 'NO');
  //console.log('  - includeInactiveFilter:', includeInactiveFilter ? 'SI' : 'NO');
  
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      //console.log('🔍 TRIGGER: searchInput changed to:', searchInput.value);
      filterHardware();
    });
  } else {
    //console.error('❌ No se encontró searchInput');
  }
  
  if (typeFilter) {
    typeFilter.addEventListener('change', function() {
      //console.log('🔍 TRIGGER: typeFilter changed to:', typeFilter.value);
      filterHardware();
    });
  } else {
    //console.error('❌ No se encontró typeFilter');
  }
  
  if (statusFilter) {
    statusFilter.addEventListener('change', function() {
      //console.log('🔍 TRIGGER: statusFilter changed to:', statusFilter.value);
      filterHardware();
    });
  } else {
    //console.error('❌ No se encontró statusFilter');
  }
  
  if (includeInactiveFilter) {
    includeInactiveFilter.addEventListener('change', function() {
      //console.log('🔍 TRIGGER: includeInactiveFilter changed to:', includeInactiveFilter.value);
      // Use hardware-main.js function instead of direct loadHardware
      if (window.hardwareMain) {
        window.hardwareMain.loadHardware();
      } else {
        //console.warn('⚠️ hardwareMain no disponible, usando loadHardware directo');
        loadHardware();
      }
    });
  } else {
    //console.error('❌ No se encontró includeInactiveFilter');
  }
  
  filtersInitialized = true;
  //console.log('✅ Event listeners de filtros inicializados');
}

// EMPRESA MODE: Configurar el cliente JavaScript para empresa
window.EMPRESA_MODE = true;
//console.log('🏢 EMPRESA Hardware mode initialized for ID:', window.EMPRESA_ID);

// Sobrescribir la función de carga de hardware para empresa
if (typeof window.loadHardware === 'function') {
  const originalLoadHardware = window.loadHardware;
  window.loadHardware = function() {
    //console.log('🏢 Loading hardware for empresa:', window.EMPRESA_ID);
    // Llamar al endpoint específico de empresa
    return originalLoadHardware();
  };
}

// Initialize on DOM load

// Close modal when clicking outside
const hardwareModal = document.getElementById('hardwareModal');
if (hardwareModal) {
  hardwareModal.addEventListener('click', function(e) {
    if (e.target === this) {
      closeModal();
    }
  });
}

// Close view modal when clicking outside
const viewHardwareModal = document.getElementById('viewHardwareModal');
if (viewHardwareModal) {
  viewHardwareModal.addEventListener('click', function(e) {
    if (e.target === this) {
      closeViewModal();
    }
  });
}

// Close client update modal when clicking outside
const clientUpdateModal = document.getElementById('clientUpdateModal');
if (clientUpdateModal) {
  clientUpdateModal.addEventListener('click', function(e) {
    if (e.target === this) {
      closeUpdateModal();
    }
  });
}

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    // Check which modal is open and close it
    const hardwareModal = document.getElementById('hardwareModal');
    const viewModal = document.getElementById('viewHardwareModal');
    const updateModal = document.getElementById('clientUpdateModal');
    
    if (hardwareModal && !hardwareModal.classList.contains('hidden')) {
      closeModal();
    } else if (viewModal && !viewModal.classList.contains('hidden')) {
      closeViewModal();
    } else if (updateModal && !updateModal.classList.contains('hidden')) {
      closeUpdateModal();
    }
  }
});
