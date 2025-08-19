// ====================================================
// SPA NAVIGATION SYSTEM - ADMIN PANEL
// Sistema de navegación suave sin recargas de página
// ====================================================

class SPANavigation {
    constructor() {
        this.currentRoute = null;
        this.isNavigating = false;
        this.cache = new Map(); // Cache de contenido
        this.loadingAnimationDuration = 500;
        
        console.log('🚀 SPA Navigation System initialized');
        this.init();
    }
    
    init() {
        // Detectar ruta actual
        this.currentRoute = this.getCurrentRoute();
        
        // Configurar event listeners para navegación
        this.setupNavigationListeners();
        
        // Configurar historial del navegador
        this.setupHistoryNavigation();
        
        // Marcar link activo inicial
        this.updateActiveNavigation(this.currentRoute);
        
        console.log('✅ Current route:', this.currentRoute);
    }
    
    getCurrentRoute() {
        const path = window.location.pathname;
        
        // Mapear rutas a identificadores
        const routeMap = {
            '/admin/super-dashboard': 'dashboard',
            '/admin/users': 'users',
            '/admin/empresas': 'empresas',
            '/admin/hardware': 'hardware',
            '/admin/company-types': 'company_types'
        };
        
        return routeMap[path] || 'dashboard';
    }
    
    setupNavigationListeners() {
        // Interceptar clicks en enlaces del sidebar
        document.addEventListener('click', (e) => {
            const link = e.target.closest('.sidebar__link');
            if (link && this.isAdminNavLink(link)) {
                e.preventDefault();
                const href = link.getAttribute('href');
                const route = this.extractRouteFromHref(href);
                
                if (route && route !== this.currentRoute) {
                    this.navigateTo(route, href);
                }
            }
        });
        
        console.log('✅ Navigation listeners configured');
    }
    
    setupHistoryNavigation() {
        // Manejar navegación con botones del navegador (atrás/adelante)
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.route) {
                this.navigateTo(e.state.route, e.state.url, false);
            }
        });
        
        // Establecer estado inicial
        if (history.state === null) {
            history.replaceState({
                route: this.currentRoute,
                url: window.location.pathname
            }, '', window.location.pathname);
        }
    }
    
    isAdminNavLink(link) {
        const href = link.getAttribute('href');
        return href && (
            href.includes('/admin/users') ||
            href.includes('/admin/empresas') ||
            href.includes('/admin/hardware') ||
            href.includes('/admin/company-types') ||
            href.includes('/admin/super-dashboard')
        );
    }
    
    extractRouteFromHref(href) {
        const routeMap = {
            '/admin/super-dashboard': 'dashboard',
            '/admin/users': 'users', 
            '/admin/empresas': 'empresas',
            '/admin/hardware': 'hardware',
            '/admin/company-types': 'company_types'
        };
        
        // Ordenar por longitud descendente para evitar matches incorrectos
        const sortedRoutes = Object.entries(routeMap).sort((a, b) => b[0].length - a[0].length);
        
        for (const [path, route] of sortedRoutes) {
            if (href.includes(path)) {
                return route;
            }
        }
        
        return null;
    }
    
    async navigateTo(route, url, updateHistory = true) {
        if (this.isNavigating || route === this.currentRoute) {
            return;
        }
        
        console.log(`🧭 Navigating to: ${route} (${url})`);
        
        this.isNavigating = true;
        
        try {
            // 1. Mostrar loading state
            this.showLoadingState();
            
            // 2. Actualizar navegación activa inmediatamente para feedback visual
            this.updateActiveNavigation(route);
            
            // 3. Cargar contenido (desde cache o servidor)
            const content = await this.loadContent(route, url);
            
            // 4. Aplicar transición de salida
            await this.fadeOutContent();
            
            // 5. Actualizar contenido
            this.updateMainContent(content);
            
            // 6. Aplicar transición de entrada
            await this.fadeInContent();
            
            // 7. Actualizar historial del navegador
            if (updateHistory) {
                history.pushState({ route, url }, '', url);
            }
            
            // 8. Actualizar estado interno
            this.currentRoute = route;
            
            // 9. Ejecutar scripts específicos de la página
            this.executePageScripts(route);
            
            // 10. Ocultar loading state
            this.hideLoadingState();
            
            console.log(`✅ Successfully navigated to: ${route}`);
            
        } catch (error) {
            console.error(`❌ Navigation error:`, error);
            this.showErrorState();
        } finally {
            this.isNavigating = false;
        }
    }
    
    async loadContent(route, url) {
        // Verificar cache primero
        if (this.cache.has(route)) {
            console.log(`📋 Loading from cache: ${route}`);
            return this.cache.get(route);
        }
        
        console.log(`🌐 Loading from server: ${route}`);
        
        try {
            const response = await fetch(url, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'text/html'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const html = await response.text();
            
            // Extraer solo el contenido principal usando un parser DOM
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Buscar el bloque main_content
            const mainContent = doc.querySelector('.main-content > div');
            
            if (!mainContent) {
                throw new Error('Main content not found in response');
            }
            
            const content = mainContent.outerHTML;
            
            // Guardar en cache
            this.cache.set(route, content);
            
            return content;
            
        } catch (error) {
            console.error(`Failed to load content for ${route}:`, error);
            throw error;
        }
    }
    
    updateMainContent(content) {
        const mainContentContainer = document.querySelector('.main-content > div');
        if (mainContentContainer) {
            mainContentContainer.outerHTML = content;
            console.log('✅ Main content updated');
        } else {
            console.error('❌ Main content container not found');
        }
    }
    
    updateActiveNavigation(route) {
        // Remover active de todos los links
        document.querySelectorAll('.sidebar__link').forEach(link => {
            link.classList.remove('sidebar__link--active');
        });
        
        // Mapear rutas a selectores específicos
        const routeSelectors = {
            'dashboard': 'a[href*="super-dashboard"]',
            'users': 'a[href*="users"]',
            'empresas': 'a[href*="empresas"]', 
            'hardware': 'a[href*="hardware"]',
            'company_types': 'a[href*="company-types"]'
        };
        
        const selector = routeSelectors[route];
        if (selector) {
            const activeLink = document.querySelector(`.sidebar__link${selector}`);
            if (activeLink) {
                activeLink.classList.add('sidebar__link--active');
                console.log(`✅ Active navigation updated: ${route}`);
            }
        }
    }
    
    showLoadingState() {
        // Crear/mostrar overlay de loading
        let overlay = document.getElementById('spaLoadingOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'spaLoadingOverlay';
            overlay.className = 'spa-loading-overlay';
            overlay.innerHTML = `
                <div class="spa-loading-content">
                    <div class="spa-loading-spinner"></div>
                    <p>Cargando...</p>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        
        overlay.classList.remove('hidden');
        
        // Aplicar CSS en línea si las clases no están definidas
        if (!document.querySelector('style[data-spa-styles]')) {
            const style = document.createElement('style');
            style.setAttribute('data-spa-styles', '');
            style.textContent = `
                .spa-loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(4px);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .spa-loading-overlay:not(.hidden) {
                    opacity: 1;
                }
                
                .spa-loading-content {
                    background: white;
                    border-radius: 12px;
                    padding: 2rem;
                    text-align: center;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                }
                
                .dark .spa-loading-content {
                    background: #1f2937;
                    color: white;
                }
                
                .spa-loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #e5e7eb;
                    border-top: 4px solid #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1rem;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    hideLoadingState() {
        const overlay = document.getElementById('spaLoadingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }
    
    showErrorState() {
        this.hideLoadingState();
        
        // Mostrar error en lugar del loading
        console.log('❌ Showing error state');
        
        // Puedes personalizar esto según tu sistema de notificaciones
        if (window.showEnhancedNotification) {
            window.showEnhancedNotification('Error al cargar el contenido', 'error');
        } else {
            alert('Error al cargar el contenido. Por favor, recarga la página.');
        }
    }
    
    async fadeOutContent() {
        const mainContent = document.querySelector('.main-content > div');
        if (mainContent && typeof gsap !== 'undefined') {
            return new Promise(resolve => {
                gsap.to(mainContent, {
                    opacity: 0,
                    y: -20,
                    duration: 0.2,
                    ease: "power2.in",
                    onComplete: resolve
                });
            });
        }
        
        // Fallback sin GSAP
        if (mainContent) {
            mainContent.style.opacity = '0';
            mainContent.style.transform = 'translateY(-20px)';
        }
        
        return new Promise(resolve => setTimeout(resolve, 200));
    }
    
    async fadeInContent() {
        const mainContent = document.querySelector('.main-content > div');
        if (mainContent && typeof gsap !== 'undefined') {
            return new Promise(resolve => {
                // Reset inicial
                gsap.set(mainContent, { opacity: 0, y: 20 });
                
                // Animación de entrada
                gsap.to(mainContent, {
                    opacity: 1,
                    y: 0,
                    duration: 0.4,
                    ease: "power2.out",
                    onComplete: resolve
                });
            });
        }
        
        // Fallback sin GSAP
        if (mainContent) {
            mainContent.style.opacity = '0';
            mainContent.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                mainContent.style.opacity = '1';
                mainContent.style.transform = 'translateY(0)';
            }, 50);
        }
        
        return new Promise(resolve => setTimeout(resolve, 400));
    }
    
    executePageScripts(route) {
        console.log(`🔧 Executing page scripts for: ${route}`);
        
        // Ejecutar scripts específicos según la ruta
        switch (route) {
            case 'users':
                this.initializeUsersPage();
                break;
            case 'empresas':
                this.initializeEmpresasPage();
                break;
            case 'hardware':
                this.initializeHardwarePage();
                break;
            case 'company_types':
                this.initializeCompanyTypesPage();
                break;
            case 'dashboard':
                this.initializeDashboardPage();
                break;
        }
        
        // Reinitializar componentes comunes
        this.reinitializeCommonComponents();
    }
    
    initializeUsersPage() {
        // Re-inicializar funcionalidades específicas de usuarios
        if (window.loadUsers && typeof window.loadUsers === 'function') {
            window.loadUsers();
        }
        
        // Re-inicializar event listeners específicos
        this.setupPageSpecificListeners('users');
    }
    
    initializeEmpresasPage() {
        // Re-inicializar funcionalidades específicas de empresas
        if (window.loadEmpresas && typeof window.loadEmpresas === 'function') {
            window.loadEmpresas();
        }
        
        this.setupPageSpecificListeners('empresas');
    }
    
    initializeHardwarePage() {
        // Re-inicializar funcionalidades específicas de hardware
        if (window.loadHardware && typeof window.loadHardware === 'function') {
            window.loadHardware();
        }
        
        this.setupPageSpecificListeners('hardware');
    }
    
    initializeCompanyTypesPage() {
        // Re-inicializar funcionalidades específicas de tipos de empresa
        this.setupPageSpecificListeners('company_types');
    }
    
    initializeDashboardPage() {
        // Re-inicializar dashboard
        if (window.initializeDashboard && typeof window.initializeDashboard === 'function') {
            window.initializeDashboard();
        }
        
        this.setupPageSpecificListeners('dashboard');
    }
    
    setupPageSpecificListeners(route) {
        // Configurar listeners específicos de cada página
        // Esto evita conflictos entre páginas
        
        setTimeout(() => {
            // Dar tiempo a que el DOM se actualice antes de configurar listeners
            const buttons = document.querySelectorAll('button[onclick], .btn, .ios-action-btn');
            console.log(`🔧 Re-initialized ${buttons.length} interactive elements for ${route}`);
        }, 100);
    }
    
    reinitializeCommonComponents() {
        // Re-inicializar modales
        if (window.modalManager && window.modalManager.setupAllModals) {
            window.modalManager.setupAllModals();
        }
        
        // Re-inicializar theme manager
        if (window.ThemeManager && window.ThemeManager.init) {
            window.ThemeManager.init();
        }
        
        // Re-inicializar tooltips, dropdowns, etc.
        setTimeout(() => {
            // Aplicar animaciones GSAP si están disponibles
            if (typeof gsap !== 'undefined' && window.HardwareAnimations) {
                const cards = document.querySelectorAll('.ios-hardware-card, .glass-card');
                cards.forEach((card, index) => {
                    gsap.fromTo(card, 
                        { opacity: 0, y: 20 },
                        { 
                            opacity: 1, 
                            y: 0, 
                            duration: 0.3, 
                            delay: index * 0.1,
                            ease: "power2.out"
                        }
                    );
                });
            }
        }, 200);
    }
    
    // Método público para limpiar cache
    clearCache() {
        this.cache.clear();
        console.log('🧹 SPA Cache cleared');
    }
    
    // Método público para precargar una ruta
    async preloadRoute(route) {
        const routeMap = {
            'dashboard': '/admin/super-dashboard',
            'users': '/admin/users',
            'empresas': '/admin/empresas',
            'hardware': '/admin/hardware',
            'company_types': '/admin/company-types'
        };
        
        const url = routeMap[route];
        if (url && !this.cache.has(route)) {
            try {
                await this.loadContent(route, url);
                console.log(`✅ Preloaded route: ${route}`);
            } catch (error) {
                console.error(`❌ Failed to preload route ${route}:`, error);
            }
        }
    }
}

// Inicializar el sistema SPA cuando el DOM esté listo
let spaNavigation;

function initializeSPANavigation() {
    if (!spaNavigation) {
        spaNavigation = new SPANavigation();
        
        // Hacer disponible globalmente para debugging
        window.spaNavigation = spaNavigation;
        
        console.log('🎉 SPA Navigation System ready');
    }
}

// Auto-inicialización
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSPANavigation);
} else {
    initializeSPANavigation();
}

// Export para uso en otros módulos
window.SPANavigation = SPANavigation;
