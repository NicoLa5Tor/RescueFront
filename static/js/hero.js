// static/js/hero.js

document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
  if (typeof DrawSVGPlugin !== 'undefined') {
    gsap.registerPlugin(DrawSVGPlugin);
  }

  ScrollSmoother.create({ smooth: 2, effects: true });

  gsap.from('.draw', {
    drawSVG: '0%',
    ease: 'expo.out',
    scrollTrigger: {
      trigger: '.heading',
      start: 'clamp(top center)',
      scrub: true,
      pin: '.pin',
      pinSpacing: false
    }
  });

  gsap.set('.logo svg', { opacity: 1 });
});
