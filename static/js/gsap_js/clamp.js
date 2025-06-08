export function initClampModule(gsap, smoother){
  smoother = smoother || window.gsapApp.getSmoother();
  gsap.from('.draw', {
    drawSVG: "0%",
    ease: "expo.out",
    scrollTrigger: {
      trigger: '.heading',
      start: "clamp(top center)",
      scrub: true,
      pin: '.pin',
      pinSpacing: false,
      markers:false,
    }
  });

  // little setup - ignore
  gsap.set('.logo svg', {opacity: 1});
}
