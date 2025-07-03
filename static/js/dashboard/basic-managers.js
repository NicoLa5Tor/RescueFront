// basic-managers.js - Animation-focused managers and theme management

class StatsManager {
    constructor(dashboard) {
        this.dashboard = dashboard;
    }

    // Simple counter animation
    animate() {
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

// Theme Manager
class ThemeManager {
    constructor() {
        this.init();
    }

    init() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Apply saved theme or system preference
        this.loadTheme();
        
        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.applyTheme(e.matches);
            }
        });
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = savedTheme === 'dark' || (!savedTheme && systemDark);

        this.applyTheme(isDark);
    }

    applyTheme(isDark) {
        if (isDark) {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark');
        }
        this.updateThemeIcon(isDark);
        
        // Update any existing charts for theme
        this.updateChartsTheme(isDark);
    }

    toggleTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        
        if (isDark) {
            localStorage.setItem('theme', 'light');
            this.applyTheme(false);
        } else {
            localStorage.setItem('theme', 'dark');
            this.applyTheme(true);
        }
    }

    updateThemeIcon(isDark) {
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
    
    updateChartsTheme(isDark) {
        // Update chart colors when theme changes
        const textColor = isDark ? '#e5e7eb' : '#374151';
        
        // This will be called by charts when they detect theme changes
        if (window.Chart && window.Chart.defaults) {
            window.Chart.defaults.color = textColor;
            if (window.Chart.defaults.plugins && window.Chart.defaults.plugins.legend) {
                window.Chart.defaults.plugins.legend.labels.color = textColor;
            }
        }
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new ThemeManager();
});

// Expose globally
window.StatsManager = StatsManager;
window.ThemeManager = ThemeManager;
