// // basic-managers.js - Animation-focused managers and theme management

// // Prevent double declaration by checking window object first
// if (typeof window.StatsManager === 'undefined') {

// // Define StatsManager
// window.StatsManager = class StatsManager {
//     constructor(dashboard) {
//         this.dashboard = dashboard;
//     }

//     // Simple counter animation
//     animate() {
//         const counters = document.querySelectorAll('[data-counter]');
//         counters.forEach(counter => {
//             const target = parseInt(counter.dataset.counter);
//             const duration = 1000;
//             const step = target / (duration / 16);
//             let current = 0;

//             const updateCounter = () => {
//                 current += step;
//                 if (current < target) {
//                     counter.textContent = Math.floor(current);
//                     requestAnimationFrame(updateCounter);
//                 } else {
//                     counter.textContent = target;
//                 }
//             };

//             updateCounter();
//         });
//     }
// };

// }

// // Theme Manager
// if (typeof window.ThemeManager === 'undefined') {

// window.ThemeManager = class ThemeManager {
//     constructor() {
//         this.init();
//     }

//     init() {
//         const themeToggle = document.getElementById('themeToggle');
//         if (themeToggle) {
//             themeToggle.addEventListener('click', () => this.toggleTheme());
//         }

//         // Apply saved theme or system preference
//         this.loadTheme();
        
//         // Listen for system theme changes
//         const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
//         mediaQuery.addEventListener('change', (e) => {
//             if (!localStorage.getItem('theme')) {
//                 this.applyTheme(e.matches);
//             }
//         });
//     }

//     loadTheme() {
//         const savedTheme = localStorage.getItem('theme');
//         const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
//         const isDark = savedTheme === 'dark' || (!savedTheme && systemDark);

//         this.applyTheme(isDark);
//     }

//     applyTheme(isDark) {
//         if (isDark) {
//             document.documentElement.classList.add('dark');
//             document.body.classList.add('dark');
//         } else {
//             document.documentElement.classList.remove('dark');
//             document.body.classList.remove('dark');
//         }
//         this.updateThemeIcon(isDark);
        
//         // Update any existing charts for theme
//         this.updateChartsTheme(isDark);
//     }

//     toggleTheme() {
//         const isDark = document.documentElement.classList.contains('dark');
        
//         if (isDark) {
//             localStorage.setItem('theme', 'light');
//             this.applyTheme(false);
//         } else {
//             localStorage.setItem('theme', 'dark');
//             this.applyTheme(true);
//         }
//     }

//     updateThemeIcon(isDark) {
//         const themeIcon = document.getElementById('themeIcon');
//         if (themeIcon) {
//             themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
//         }
//     }
    
//     updateChartsTheme(isDark) {
//         //console.log('🎨 Actualizando tema de gráficas:', isDark ? 'oscuro' : 'claro');
        
//         // Define colors for light and dark themes
//         const textColor = isDark ? '#e5e7eb' : '#374151';
//         const gridColor = isDark ? '#374151' : '#e5e7eb';
//         const backgroundColor = isDark ? '#1f2937' : '#ffffff';
        
//         // Update Chart.js defaults for new charts
//         if (window.Chart && window.Chart.defaults) {
//             window.Chart.defaults.color = textColor;
//             if (window.Chart.defaults.plugins && window.Chart.defaults.plugins.legend) {
//                 window.Chart.defaults.plugins.legend.labels.color = textColor;
//             }
//             if (window.Chart.defaults.scales) {
//                 if (window.Chart.defaults.scales.x) {
//                     window.Chart.defaults.scales.x.ticks = { color: textColor };
//                     window.Chart.defaults.scales.x.grid = { color: gridColor };
//                 }
//                 if (window.Chart.defaults.scales.y) {
//                     window.Chart.defaults.scales.y.ticks = { color: textColor };
//                     window.Chart.defaults.scales.y.grid = { color: gridColor };
//                 }
//             }
//         }
        
//         // Update existing charts
//         this.updateExistingCharts(isDark, textColor, gridColor, backgroundColor);
        
//         // Update chart containers and backgrounds
//         this.updateChartContainers(isDark);
//     }
    
//     updateExistingCharts(isDark, textColor, gridColor, backgroundColor) {
//         // Update activity chart if it exists
//         if (window.superAdminDashboard && window.superAdminDashboard.activityChart) {
//             const chart = window.superAdminDashboard.activityChart;
//             this.updateChartColors(chart, textColor, gridColor, backgroundColor);
//         }
        
//         // Update distribution chart if it exists
//         if (window.superAdminDashboard && window.superAdminDashboard.distributionChart) {
//             const chart = window.superAdminDashboard.distributionChart;
//             this.updateChartColors(chart, textColor, gridColor, backgroundColor);
//         }
        
//         // Also check for charts in the global scope
//         const activityChartCanvas = document.getElementById('dashboardChart');
//         if (activityChartCanvas && activityChartCanvas.chart) {
//             this.updateChartColors(activityChartCanvas.chart, textColor, gridColor, backgroundColor);
//         }
        
//         const distributionChartCanvas = document.getElementById('distributionChart');
//         if (distributionChartCanvas && distributionChartCanvas.chart) {
//             this.updateChartColors(distributionChartCanvas.chart, textColor, gridColor, backgroundColor);
//         }
//     }
    
//     updateChartColors(chart, textColor, gridColor, backgroundColor) {
//         if (!chart || !chart.options) return;
        
//         //console.log('🎨 Actualizando colores de gráfica:', chart.config.type);
        
//         // Update text colors
//         if (chart.options.plugins && chart.options.plugins.legend && chart.options.plugins.legend.labels) {
//             chart.options.plugins.legend.labels.color = textColor;
//         }
        
//         // Update scale colors
//         if (chart.options.scales) {
//             Object.keys(chart.options.scales).forEach(scaleKey => {
//                 const scale = chart.options.scales[scaleKey];
//                 if (scale.ticks) {
//                     scale.ticks.color = textColor;
//                 }
//                 if (scale.grid) {
//                     scale.grid.color = gridColor;
//                 }
//             });
//         }
        
//         // Update chart background if supported
//         if (chart.options.plugins && chart.options.plugins.legend) {
//             // Some chart types support background color
//             chart.options.backgroundColor = backgroundColor;
//         }
        
//         // Update the chart
//         chart.update('none'); // Update without animation for instant theme change
        
//         //console.log('✅ Gráfica actualizada con nuevo tema');
//     }
    
//     updateChartContainers(isDark) {
//         //console.log('🎨 Actualizando contenedores de gráficas:', isDark ? 'oscuro' : 'claro');
        
//         // Force glass-card elements to update by toggling a class that triggers recalculation
//         const glassCards = document.querySelectorAll('.glass-card');
//         glassCards.forEach(card => {
//             // Remove and re-add the glass-card class to force style recalculation
//             card.classList.remove('glass-card');
//             card.offsetHeight; // Force reflow
//             card.classList.add('glass-card');
            
//             // Also add transition class for smooth change
//             card.classList.add('theme-transition');
//         });
        
//         // Alternative approach: trigger a style recalculation by modifying the DOM
//         setTimeout(() => {
//             glassCards.forEach(card => {
//                 card.style.transform = 'translateZ(0)';
//                 card.offsetHeight;
//                 card.style.transform = '';
//             });
//         }, 50);
        
//         // Update loading overlays
//         const loadingOverlays = document.querySelectorAll('.chart-loading-overlay');
//         loadingOverlays.forEach(overlay => {
//             overlay.style.backgroundColor = isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)';
//         });
        
//         //console.log('✅ Contenedores de gráficas actualizados');
//     }
// };

// } // End of ThemeManager conditional declaration

// // Initialize theme manager when DOM is loaded
// document.addEventListener('DOMContentLoaded', function() {
//     if (typeof window.themeManagerInitialized === 'undefined') {
//         window.themeManagerInitialized = true;
//         new window.ThemeManager();
//     }
// });
