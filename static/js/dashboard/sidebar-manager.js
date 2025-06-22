// sidebar-manager.js - Optimized Sidebar Management
class SidebarManager {
    constructor(dashboard) {
      this.dashboard = dashboard;
      this.sidebar = null;
      this.overlay = null;
      this.menuToggle = null;
      this.isOpen = false;
      this.isDesktop = false;
      
      this.init();
    }
  
    // ===== INITIALIZATION =====
    init() {
      this.findElements();
      this.setupEventListeners();
      this.setInitialState();
      
      console.log('✅ SidebarManager initialized');
    }
  
    findElements() {
      this.sidebar = document.getElementById('sidebar');
      this.overlay = document.getElementById('sidebarOverlay');
      this.menuToggle = document.querySelector('.navbar__menu-toggle');
      
      if (!this.sidebar) {
        console.error('❌ Sidebar element not found');
        return;
      }
  
      // Ensure proper classes
      this.sidebar.classList.add('sidebar');
      
      if (this.overlay) {
        this.overlay.classList.add('sidebar__overlay');
      }
  
      // Create overlay if it doesn't exist
      if (!this.overlay) {
        this.createOverlay();
      }
    }
  
    createOverlay() {
      this.overlay = document.createElement('div');
      this.overlay.id = 'sidebarOverlay';
      this.overlay.className = 'sidebar__overlay';
      document.body.appendChild(this.overlay);
    }
  
    // ===== EVENT LISTENERS =====
    setupEventListeners() {
      // Menu toggle click
      if (this.menuToggle) {
        this.menuToggle.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggle();
        });
      }
  
      // Overlay click
      if (this.overlay) {
        this.overlay.addEventListener('click', (e) => {
          e.preventDefault();
          this.close();
        });
      }
  
      // Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen && !this.isDesktop) {
          this.close();
        }
      });
  
      // Sidebar links click (close on mobile)
      if (this.sidebar) {
        this.sidebar.addEventListener('click', (e) => {
          const link = e.target.closest('a[href]');
          if (link && !link.href.includes('#') && !this.isDesktop) {
            // Delay to allow navigation
            setTimeout(() => this.close(), 150);
          }
        });
      }
  
      // Touch events for swipe to close
      this.setupTouchEvents();
  
      // Focus trap when sidebar is open on mobile
      document.addEventListener('focusin', (e) => {
        if (!this.isDesktop && this.isOpen && this.sidebar) {
          if (!this.sidebar.contains(e.target) && e.target !== this.menuToggle) {
            e.preventDefault();
            this.focusFirstElement();
          }
        }
      });
    }
  
    setupTouchEvents() {
      if (!this.sidebar) return;
  
      let startX = 0;
      let currentX = 0;
      let isDragging = false;
  
      const handleTouchStart = (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
      };
  
      const handleTouchMove = (e) => {
        if (!isDragging || this.isDesktop) return;
        
        currentX = e.touches[0].clientX;
        const diffX = currentX - startX;
  
        // Only handle swipe to close (left swipe)
        if (this.isOpen && diffX < -50) {
          this.close();
          isDragging = false;
        }
      };
  
      const handleTouchEnd = () => {
        isDragging = false;
        startX = 0;
        currentX = 0;
      };
  
      this.sidebar.addEventListener('touchstart', handleTouchStart, { passive: true });
      this.sidebar.addEventListener('touchmove', handleTouchMove, { passive: true });
      this.sidebar.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
  
    // ===== RESPONSIVE HANDLING =====
    handleResize() {
      const wasDesktop = this.isDesktop;
      this.isDesktop = this.dashboard.isDesktop();
  
      // If switching from mobile to desktop
      if (!wasDesktop && this.isDesktop) {
        this.forceOpen();
      }
      // If switching from desktop to mobile
      else if (wasDesktop && !this.isDesktop) {
        this.forceClose();
      }
  
      this.updateBodyClasses();
    }
  
    setInitialState() {
      this.isDesktop = this.dashboard.isDesktop();
      
      if (this.isDesktop) {
        this.forceOpen();
      } else {
        this.forceClose();
      }
    }
  
    updateBodyClasses() {
      const body = document.body;
      
      // Remove existing device classes
      body.classList.remove('sidebar-open', 'sidebar-closed');
      
      // Add current state class
      if (this.isOpen) {
        body.classList.add('sidebar-open');
      } else {
        body.classList.add('sidebar-closed');
      }
    }
  
    // ===== SIDEBAR CONTROL =====
    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }
  
    open() {
      if (!this.sidebar || (this.isDesktop && this.isOpen)) return;
  
      this.isOpen = true;
      
      // Update classes
      this.sidebar.classList.remove('sidebar--closed');
      this.sidebar.classList.add('sidebar--open');
      
      if (this.overlay && !this.isDesktop) {
        this.overlay.classList.add('sidebar__overlay--visible');
      }
  
      // Prevent body scroll on mobile
      if (!this.isDesktop) {
        document.body.classList.add('body-no-scroll');
      }
  
      // Animate with GSAP if available
      if (typeof gsap !== 'undefined' && !this.isDesktop) {
        gsap.fromTo(this.sidebar, 
          { x: this.dashboard.isMobile() ? -288 : -320 },
          { x: 0, duration: 0.3, ease: "power2.out" }
        );
  
        if (this.overlay) {
          gsap.to(this.overlay, {
            opacity: 1,
            duration: 0.3
          });
        }
      }
  
      // Focus management
      this.focusFirstElement();
  
      // Update menu toggle icon
      this.updateMenuToggleIcon(true);
  
      // Update body classes
      this.updateBodyClasses();
  
      // Emit event
      this.emit('sidebar:opened');
  
      console.log('📂 Sidebar opened');
    }
  
    close() {
      if (!this.sidebar || this.isDesktop) return;
  
      this.isOpen = false;
  
      // Animate with GSAP if available
      if (typeof gsap !== 'undefined') {
        gsap.to(this.sidebar, {
          x: this.dashboard.isMobile() ? -288 : -320,
          duration: 0.3,
          ease: "power2.inOut",
          onComplete: () => {
            this.sidebar.classList.remove('sidebar--open');
            this.sidebar.classList.add('sidebar--closed');
          }
        });
  
        if (this.overlay) {
          gsap.to(this.overlay, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
              this.overlay.classList.remove('sidebar__overlay--visible');
            }
          });
        }
      } else {
        // Fallback without animation
        this.sidebar.classList.remove('sidebar--open');
        this.sidebar.classList.add('sidebar--closed');
        
        if (this.overlay) {
          this.overlay.classList.remove('sidebar__overlay--visible');
        }
      }
  
      // Restore body scroll
      document.body.classList.remove('body-no-scroll');
  
      // Return focus to menu toggle
      if (this.menuToggle && document.activeElement !== this.menuToggle) {
        this.menuToggle.focus();
      }
  
      // Update menu toggle icon
      this.updateMenuToggleIcon(false);
  
      // Update body classes
      this.updateBodyClasses();
  
      // Emit event
      this.emit('sidebar:closed');
  
      console.log('📁 Sidebar closed');
    }
  
    forceOpen() {
      if (!this.sidebar) return;
  
      this.isOpen = true;
      this.sidebar.classList.remove('sidebar--closed');
      this.sidebar.classList.add('sidebar--open');
  
      if (this.overlay) {
        this.overlay.classList.remove('sidebar__overlay--visible');
      }
  
      document.body.classList.remove('body-no-scroll');
      this.updateMenuToggleIcon(true);
      this.updateBodyClasses();
    }
  
    forceClose() {
      if (!this.sidebar) return;
  
      this.isOpen = false;
      this.sidebar.classList.remove('sidebar--open');
      this.sidebar.classList.add('sidebar--closed');
  
      if (this.overlay) {
        this.overlay.classList.remove('sidebar__overlay--visible');
      }
  
      document.body.classList.remove('body-no-scroll');
      this.updateMenuToggleIcon(false);
      this.updateBodyClasses();
    }
  
    // ===== UI UPDATES =====
    updateMenuToggleIcon(isOpen) {
      if (!this.menuToggle) return;
  
      const icon = this.menuToggle.querySelector('i');
      if (icon) {
        if (isOpen) {
          icon.classList.remove('fa-bars');
          icon.classList.add('fa-times');
          this.menuToggle.classList.add('active');
        } else {
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
          this.menuToggle.classList.remove('active');
        }
      }
    }
  
    focusFirstElement() {
      if (!this.sidebar) return;
  
      const focusableElements = this.sidebar.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
  
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  
    // ===== EVENT MANAGEMENT =====
    emit(eventName, detail = {}) {
      const event = new CustomEvent(eventName, {
        detail: {
          isOpen: this.isOpen,
          isDesktop: this.isDesktop,
          sidebar: this.sidebar,
          ...detail
        }
      });
      window.dispatchEvent(event);
    }
  
    // ===== PUBLIC API =====
    getState() {
      return {
        isOpen: this.isOpen,
        isDesktop: this.isDesktop,
        hasOverlay: !!this.overlay,
        hasMenuToggle: !!this.menuToggle,
        element: this.sidebar
      };
    }
  
    isVisible() {
      return this.isOpen || this.isDesktop;
    }
  
    // ===== NAVIGATION MANAGEMENT =====
    setActiveLink(href) {
      if (!this.sidebar) return;
  
      // Remove active class from all links
      this.sidebar.querySelectorAll('.sidebar__link').forEach(link => {
        link.classList.remove('sidebar__link--active');
      });
  
      // Add active class to matching link
      const activeLink = this.sidebar.querySelector(`a[href="${href}"]`);
      if (activeLink) {
        activeLink.classList.add('sidebar__link--active');
      }
    }
  
    updateNavigationBadge(linkHref, badgeText) {
      if (!this.sidebar) return;
  
      const link = this.sidebar.querySelector(`a[href="${linkHref}"]`);
      if (!link) return;
  
      let badge = link.querySelector('.sidebar__link-badge');
      
      if (badgeText) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'sidebar__link-badge';
          link.appendChild(badge);
        }
        badge.textContent = badgeText;
      } else if (badge) {
        badge.remove();
      }
    }
  
    // ===== ANIMATIONS =====
    animateIn() {
      if (!this.sidebar || typeof gsap === 'undefined') return;
  
      const tl = gsap.timeline();
      
      // Animate sidebar
      tl.fromTo(this.sidebar, 
        { x: -320, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
      );
  
      // Animate navigation items
      const navItems = this.sidebar.querySelectorAll('.sidebar__link');
      tl.fromTo(navItems,
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.3, stagger: 0.05, ease: "power2.out" },
        "-=0.2"
      );
  
      return tl;
    }
  
    animateOut() {
      if (!this.sidebar || typeof gsap === 'undefined') return;
  
      const tl = gsap.timeline();
      
      // Animate navigation items out
      const navItems = this.sidebar.querySelectorAll('.sidebar__link');
      tl.to(navItems,
        { x: -20, opacity: 0, duration: 0.2, stagger: 0.02, ease: "power2.in" }
      );
  
      // Animate sidebar out
      tl.to(this.sidebar,
        { x: -320, opacity: 0, duration: 0.3, ease: "power2.in" },
        "-=0.1"
      );
  
      return tl;
    }
  
    // ===== UTILITY METHODS =====
    updateContent(navigationItems) {
      if (!this.sidebar) return;
  
      const nav = this.sidebar.querySelector('#sidebarNav, .sidebar__nav');
      if (!nav) return;
  
      nav.innerHTML = navigationItems.map(item => this.createNavItem(item)).join('');
    }
  
    createNavItem(item) {
      const isCurrentPage = window.location.pathname === item.href;
      const classes = [
        'sidebar__link',
        isCurrentPage || item.active ? 'sidebar__link--active' : '',
        item.adminOnly ? 'admin-only' : '',
        item.superAdminOnly ? 'super-admin-only' : '',
        item.empresaOnly ? 'empresa-only' : ''
      ].filter(Boolean).join(' ');
  
      return `
        <a href="${item.href}" class="${classes}" ${item.href === '#' ? 'onclick="return false;"' : ''}>
          <div class="sidebar__link-icon">
            <i class="fas ${item.icon}"></i>
          </div>
          <span class="sidebar__link-text">${item.label}</span>
          ${item.badge ? `<span class="sidebar__link-badge">${item.badge}</span>` : ''}
        </a>
      `;
    }
  
    // ===== RESPONSIVE UTILITIES =====
    enableMobileMode() {
      this.isDesktop = false;
      if (this.isOpen) {
        this.forceClose();
      }
    }
  
    enableDesktopMode() {
      this.isDesktop = true;
      this.forceOpen();
    }
  
    // ===== ACCESSIBILITY =====
    trapFocus() {
      if (!this.sidebar || this.isDesktop) return;
  
      const focusableElements = this.sidebar.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
  
      if (focusableElements.length === 0) return;
  
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
  
      const handleTabKey = (e) => {
        if (e.key !== 'Tab') return;
  
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };
  
      document.addEventListener('keydown', handleTabKey);
  
      // Return cleanup function
      return () => {
        document.removeEventListener('keydown', handleTabKey);
      };
    }
  
    // ===== ERROR HANDLING =====
    handleError(error, context = 'sidebar') {
      console.error(`❌ SidebarManager error in ${context}:`, error);
      
      // Try to recover
      this.recoverFromError();
    }
  
    recoverFromError() {
      try {
        // Reset to safe state
        this.isOpen = false;
        document.body.classList.remove('body-no-scroll');
        
        if (this.sidebar) {
          this.sidebar.classList.remove('sidebar--open');
          this.sidebar.classList.add('sidebar--closed');
        }
        
        if (this.overlay) {
          this.overlay.classList.remove('sidebar__overlay--visible');
        }
  
        console.log('🔄 Sidebar recovered from error');
      } catch (recoveryError) {
        console.error('❌ Failed to recover sidebar:', recoveryError);
      }
    }
  
    // ===== PERFORMANCE =====
    optimizeForPerformance() {
      if (!this.sidebar) return;
  
      // Add will-change for animations
      this.sidebar.style.willChange = 'transform';
      
      // Use transform3d for hardware acceleration
      this.sidebar.style.transform = 'translate3d(0, 0, 0)';
      
      // Optimize scrolling
      const scrollContainer = this.sidebar.querySelector('.sidebar__content');
      if (scrollContainer) {
        scrollContainer.style.webkitOverflowScrolling = 'touch';
        scrollContainer.style.overscrollBehavior = 'contain';
      }
    }
  
    // ===== CLEANUP =====
    destroy() {
      // Remove event listeners
      if (this.menuToggle) {
        this.menuToggle.removeEventListener('click', this.toggle);
      }
      
      if (this.overlay) {
        this.overlay.removeEventListener('click', this.close);
      }
  
      // Clean up classes
      document.body.classList.remove('body-no-scroll', 'sidebar-open', 'sidebar-closed');
      
      if (this.sidebar) {
        this.sidebar.classList.remove('sidebar--open', 'sidebar--closed');
        this.sidebar.style.willChange = '';
        this.sidebar.style.transform = '';
      }
  
      // Kill GSAP animations
      if (typeof gsap !== 'undefined') {
        gsap.killTweensOf(this.sidebar);
        gsap.killTweensOf(this.overlay);
      }
  
      console.log('🧹 SidebarManager cleaned up');
    }
  }
  
  // Global functions for backward compatibility
  function toggleSidebar() {
    if (window.dashboard?.sidebar) {
      window.dashboard.sidebar.toggle();
    } else if (window.sidebarManager) {
      window.sidebarManager.toggle();
    } else {
      console.warn('⚠️ SidebarManager not available');
    }
  }
  
  function openSidebar() {
    if (window.dashboard?.sidebar) {
      window.dashboard.sidebar.open();
    } else if (window.sidebarManager) {
      window.sidebarManager.open();
    }
  }
  
  function closeSidebar() {
    if (window.dashboard?.sidebar) {
      window.dashboard.sidebar.close();
    } else if (window.sidebarManager) {
      window.sidebarManager.close();
    }
  }
  
  // Export for module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SidebarManager, toggleSidebar, openSidebar, closeSidebar };
  }
  
  // Make available globally
  window.SidebarManager = SidebarManager;
  window.toggleSidebar = toggleSidebar;
  window.openSidebar = openSidebar;
  window.closeSidebar = closeSidebar;