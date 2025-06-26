// admin.js - Animations only

class AdminDashboard {
    constructor() {
        this.breakpoints = { mobile: 768 };
    }

    isMobile() {
        return window.innerWidth < this.breakpoints.mobile;
    }

    initAnimations() {
        if (typeof gsap === 'undefined') return;
        gsap.registerPlugin(ScrollTrigger);
        const config = this.isMobile()
            ? { duration: 0.6, stagger: 0.05, ease: 'power2.out' }
            : { duration: 1, stagger: 0.1, ease: 'power3.out' };

        gsap.from('.gsap-fade-in', {
            opacity: 0,
            y: this.isMobile() ? 20 : 30,
            ...config,
            delay: 0.2,
        });

        gsap.from('.gsap-scale-in', {
            opacity: 0,
            scale: this.isMobile() ? 0.95 : 0.9,
            duration: this.isMobile() ? 0.5 : 0.8,
            stagger: config.stagger,
            ease: this.isMobile() ? 'power2.out' : 'back.out(1.7)',
            delay: 0.4,
        });

        gsap.from('.navbar', {
            y: -100,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out',
        });
    }

    animateCounter(element, endValue) {
        if (typeof gsap === 'undefined') {
            element.textContent = endValue;
            return;
        }
        const obj = { value: 0 };
        const duration = this.isMobile() ? 1.5 : 2;
        gsap.to(obj, {
            value: endValue,
            duration,
            ease: 'power2.out',
            onUpdate: () => {
                if (endValue % 1 !== 0) {
                    element.textContent = obj.value.toFixed(1);
                } else {
                    element.textContent = Math.floor(obj.value);
                }
            }
        });
    }

    animateCounters() {
        const ids = [
            'totalEmpresasCount',
            'totalUsersCount',
            'activeEmpresasCount',
            'activeUsersCount',
            'empresaMembersCount',
            'performanceCount',
            'avgPerformanceCount'
        ];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            const val = parseFloat(el.textContent) || 0;
            this.animateCounter(el, val);
        });
    }

    openSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (!sidebar || !overlay) return;

        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('invisible');

        if (typeof gsap !== 'undefined') {
            gsap.fromTo(
                sidebar,
                { x: this.isMobile() ? -288 : -320 },
                { x: 0, duration: 0.3, ease: 'power2.out' }
            );
            gsap.to(overlay, { opacity: 1, duration: 0.3 });
        }
        document.body.style.overflow = 'hidden';
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (!sidebar || !overlay) return;

        if (typeof gsap !== 'undefined') {
            gsap.to(sidebar, {
                x: this.isMobile() ? -288 : -320,
                duration: 0.3,
                ease: 'power2.inOut',
                onComplete: () => sidebar.classList.add('-translate-x-full'),
            });
            gsap.to(overlay, {
                opacity: 0,
                duration: 0.3,
                onComplete: () => overlay.classList.add('invisible'),
            });
        } else {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('invisible');
            overlay.style.opacity = '0';
        }
        document.body.style.overflow = '';
    }

    destroy() {
        if (typeof gsap !== 'undefined') {
            gsap.killTweensOf('*');
            if (window.ScrollTrigger) {
                ScrollTrigger.getAll().forEach(t => t.kill());
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new AdminDashboard();
    dashboard.initAnimations();
    dashboard.animateCounters();
    window.adminDashboard = dashboard;
});

