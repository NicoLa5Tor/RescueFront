// basic-managers.js - Animation-focused managers only

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

// Expose globally
window.StatsManager = StatsManager;
