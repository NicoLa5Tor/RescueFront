gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

let smoother = ScrollSmoother.create({
  smooth: 2, 
  effects: true
});

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
})

















// little setup - ignore
gsap.set(".logo svg", {opacity: 1})


// 💚 This just adds the GSAP link to this pen, don't copy this bit
import { GSAPInfoBar } from "https://codepen.io/GreenSock/pen/vYqpyLg.js"
new GSAPInfoBar({ link: "https://gsap.com/docs/v3/Plugins/ScrollSmoother/"});
// 💚 Happy tweening!