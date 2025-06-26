// dashboard.js - Initialize dashboard animations only
(function() {
    'use strict';
    function startAnimations() {
        if (typeof DashboardCore !== 'undefined') {
            const dashboard = new DashboardCore();
            dashboard.initAnimations();
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startAnimations);
    } else {
        startAnimations();
    }
})();
