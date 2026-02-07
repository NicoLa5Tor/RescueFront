// // dashboard-core.js - Animation utilities only
// class DashboardCore {
//     constructor() {
//         this.breakpoints = { mobile: 768 };
//     }

//     isMobile() {
//         return window.innerWidth < this.breakpoints.mobile;
//     }

//     initAnimations() {
//         if (typeof gsap === 'undefined') return;
//         gsap.registerPlugin(ScrollTrigger);

//         const config = this.isMobile()
//             ? { duration: 0.6, stagger: 0.05, ease: 'power2.out' }
//             : { duration: 1, stagger: 0.1, ease: 'power3.out' };

//         gsap.from('.gsap-fade-in', {
//             opacity: 0,
//             y: this.isMobile() ? 20 : 30,
//             ...config,
//             delay: 0.2,
//         });

//         gsap.from('.gsap-scale-in', {
//             opacity: 0,
//             scale: this.isMobile() ? 0.95 : 0.9,
//             duration: this.isMobile() ? 0.5 : 0.8,
//             stagger: config.stagger,
//             ease: this.isMobile() ? 'power2.out' : 'back.out(1.7)',
//             delay: 0.4,
//         });

      
//     }

//     hideLoadingState() {
//         const skeletons = document.querySelectorAll('.skeleton');
//         if (skeletons.length === 0 || typeof gsap === 'undefined') return;
//         gsap.to(skeletons, {
//             opacity: 0,
//             scale: 0.9,
//             duration: 0.3,
//             stagger: 0.05,
//             ease: 'power2.out',
//             onComplete: () => skeletons.forEach(el => el.remove()),
//         });
//     }

//     destroy() {
//         if (typeof gsap !== 'undefined') {
//             gsap.killTweensOf('*');
//             if (window.ScrollTrigger) {
//                 ScrollTrigger.getAll().forEach(t => t.kill());
//             }
//         }
//     }
// }

// window.DashboardCore = DashboardCore;
