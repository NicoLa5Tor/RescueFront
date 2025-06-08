(function(window){
  'use strict';

  function init({gsap}) {
    if(!gsap) return;

    gsap.from('.rescue-7x9k-draw', {
      drawSVG: '0%',
      ease: 'expo.out',
      scrollTrigger: {
        trigger: '.rescue-7x9k-heading',
        start: 'clamp(top center)',
        scrub: true,
        pin: '.rescue-7x9k-pin',
        pinSpacing: false,
        markers: false,
        id: 'rescue-svg-trigger'
      }
    });

    gsap.utils.toArray('.rescue-7x9k-img').forEach((img, i) => {
      const speed = img.getAttribute('data-speed');
      gsap.to(img, {
        yPercent: -30 * (i + 1),
        ease: 'none',
        scrollTrigger: {
          trigger: '.rescue-7x9k-images',
          start: 'top bottom',
          end: 'bottom top',
          scrub: speed,
          id: `rescue-img-${i}`
        }
      });
    });

    gsap.fromTo('.rescue-7x9k-module',
      { opacity: 0 },
      { opacity: 1, duration: 1, ease: 'power2.out' }
    );
  }

  if(window.GSAP_MAIN){
    window.GSAP_MAIN.registerModule(init);
  }else{
    document.addEventListener('DOMContentLoaded', () => init({gsap}));
  }
})(window);
