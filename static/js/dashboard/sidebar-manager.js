// // sidebar-manager.js - Minimal sidebar animations
// class SidebarManager {
//     constructor(dashboard) {
//         this.dashboard = dashboard;
//         this.sidebar = document.getElementById('sidebar');
//         this.overlay = document.getElementById('sidebarOverlay');
//     }

//     open() {
//         if (!this.sidebar || (this.dashboard.isDesktop && this.dashboard.isDesktop())) return;
//         if (typeof gsap !== 'undefined') {
//             gsap.fromTo(this.sidebar,
//                 { x: this.dashboard.isMobile ? (this.dashboard.isMobile() ? -288 : -320) : -320 },
//                 {
//                     x: 0,
//                     duration: 0.3,
//                     ease: 'power2.out',
//                     onStart: () => {
//                         this.sidebar.classList.remove('sidebar--closed');
//                         this.sidebar.classList.add('sidebar--open');
//                     }
//                 }
//             );
//             if (this.overlay) {
//                 gsap.to(this.overlay, { opacity: 1, duration: 0.3 });
//             }
//         } else {
//             this.sidebar.classList.add('sidebar--open');
//         }
//     }

//     close() {
//         if (!this.sidebar) return;
//         if (typeof gsap !== 'undefined') {
//             gsap.to(this.sidebar, {
//                 x: this.dashboard.isMobile ? (this.dashboard.isMobile() ? -288 : -320) : -320,
//                 duration: 0.3,
//                 ease: 'power2.inOut',
//                 onComplete: () => {
//                     this.sidebar.classList.remove('sidebar--open');
//                     this.sidebar.classList.add('sidebar--closed');
//                 }
//             });
//             if (this.overlay) {
//                 gsap.to(this.overlay, { opacity: 0, duration: 0.3 });
//             }
//         } else {
//             this.sidebar.classList.remove('sidebar--open');
//             this.sidebar.classList.add('sidebar--closed');
//         }
//     }

//     animateIn() {
//         if (!this.sidebar || typeof gsap === 'undefined') return;
//         const tl = gsap.timeline();
//         tl.fromTo(this.sidebar, { x: -320, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' });
//         const navItems = this.sidebar.querySelectorAll('.sidebar__link');
//         tl.fromTo(navItems,
//             { x: -20, opacity: 0 },
//             { x: 0, opacity: 1, duration: 0.3, stagger: 0.05, ease: 'power2.out' },
//             '-=0.2'
//         );
//         return tl;
//     }

//     animateOut() {
//         if (!this.sidebar || typeof gsap === 'undefined') return;
//         const tl = gsap.timeline();
//         const navItems = this.sidebar.querySelectorAll('.sidebar__link');
//         tl.to(navItems, { x: -20, opacity: 0, duration: 0.2, stagger: 0.02, ease: 'power2.in' });
//         tl.to(this.sidebar, { x: -320, opacity: 0, duration: 0.3, ease: 'power2.in' }, '-=0.1');
//         return tl;
//     }

//     destroy() {
//         if (typeof gsap !== 'undefined') {
//             gsap.killTweensOf(this.sidebar);
//             gsap.killTweensOf(this.overlay);
//         }
//     }
// }

// window.SidebarManager = SidebarManager;
