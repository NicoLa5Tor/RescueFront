// basic-managers.js - Managers básicos para evitar warnings

// Theme Manager
class ThemeManager {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.init();
    }

    init() {
        // Detectar tema inicial
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.classList.add('dark');
        }
    }

    toggle() {
        const html = document.documentElement;
        const isDark = html.classList.contains('dark');
        
        if (isDark) {
            html.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            html.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
        
        // Update theme icon
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            if (isDark) {
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
            } else {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            }
        }
    }

    set(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }

    get() {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
}

// Chart Manager
class ChartManager {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.charts = [];
    }

    create(config) {
        console.log('Chart created:', config);
        return { id: Date.now() };
    }

    update(chartId, data) {
        console.log('Chart updated:', chartId, data);
    }

    destroy(chartId) {
        console.log('Chart destroyed:', chartId);
    }

    handleResize() {
        console.log('Charts resized');
    }

    pauseAnimations() {
        console.log('Chart animations paused');
    }

    resumeAnimations() {
        console.log('Chart animations resumed');
    }

    refresh() {
        console.log('Charts refreshed');
    }
}

// Stats Manager
class StatsManager {
    constructor(dashboard) {
        this.dashboard = dashboard;
    }

    update(stats) {
        console.log('Stats updated:', stats);
    }

    animate() {
        // Animación simple de contadores
        const counters = document.querySelectorAll('[data-counter]');
        counters.forEach(counter => {
            const target = parseInt(counter.dataset.counter);
            const duration = 1000;
            const step = target / (duration / 16);
            let current = 0;
            
            const updateCounter = () => {
                current += step;
                if (current < target) {
                    counter.textContent = Math.floor(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target;
                }
            };
            
            updateCounter();
        });
    }
}

// Notification Manager
class NotificationManager {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.notifications = [];
        this.createContainer();
    }

    createContainer() {
        if (document.getElementById('notifications-container')) return;
        
        const container = document.createElement('div');
        container.id = 'notifications-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        const id = Date.now();
        
        notification.style.cssText = `
            background: ${this.getTypeColor(type)};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            pointer-events: auto;
            cursor: pointer;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        notification.textContent = message;
        notification.onclick = () => this.hide(id);
        
        const container = document.getElementById('notifications-container');
        container.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto hide
        setTimeout(() => {
            this.hide(id);
        }, duration);
        
        this.notifications.push({ id, element: notification });
        return id;
    }

    hide(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.element.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.element.remove();
                this.notifications = this.notifications.filter(n => n.id !== id);
            }, 300);
        }
    }

    clear() {
        this.notifications.forEach(n => n.element.remove());
        this.notifications = [];
    }

    getTypeColor(type) {
        const colors = {
            info: '#3b82f6',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444'
        };
        return colors[type] || colors.info;
    }
}

// Hacer disponibles globalmente
window.ThemeManager = ThemeManager;
window.ChartManager = ChartManager;
window.StatsManager = StatsManager;
window.NotificationManager = NotificationManager;