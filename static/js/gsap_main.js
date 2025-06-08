const GSAP_MAIN = (() => {
  const registered = [];
  let smoother = null;

  function init() {
    if (typeof gsap === 'undefined' || typeof ScrollSmoother === 'undefined') {
      console.error('GSAP o ScrollSmoother no disponibles');
      return;
    }

    gsap.registerPlugin(
      ScrollTrigger,
      ScrollSmoother,
      ScrollToPlugin,
      DrawSVGPlugin,
      MotionPathPlugin
    );

    smoother = ScrollSmoother.create({
      wrapper: '#gsap-smoother-wrapper',
      content: '#gsap-smoother-content',
      smooth: 1,
      effects: true,
      smoothTouch: 0.1
    });

    registered.forEach(fn => fn({ gsap, ScrollTrigger, smoother }));
    refresh();
  }

  function registerModule(fn) {
    if (typeof fn === 'function') {
      if (smoother) {
        fn({ gsap, ScrollTrigger, smoother });
        refresh();
      } else {
        registered.push(fn);
      }
    }
  }

  function refresh() {
    ScrollTrigger.refresh();
    if (smoother) smoother.refresh();
  }

  return { init, registerModule, refresh, get smoother() { return smoother; } };
})();

document.addEventListener('DOMContentLoaded', GSAP_MAIN.init);
window.GSAP_MAIN = GSAP_MAIN;
