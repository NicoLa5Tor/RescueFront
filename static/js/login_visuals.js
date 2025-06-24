// Animaciones de login sin manejo de autenticación
function initLoginAnimations() {
  if (typeof window.gsap === 'undefined') return;
  window.gsap.set('.fade-in-up', { opacity: 0, y: 30 });
  window.gsap.set('.fade-in-scale', { opacity: 0, scale: 0.8 });
  const tl = window.gsap.timeline({ delay: 0.2 });
  tl.to('.fade-in-up', { opacity: 1, y: 0, stagger: 0.1 });
}

function initVisualEffects() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  const inputs = form.querySelectorAll('input');
  inputs.forEach((input) => {
    input.addEventListener('focus', () => {
      if (window.gsap) {
        window.gsap.to(input, { duration: 0.3, scale: 1.02 });
      }
    });
    input.addEventListener('blur', () => {
      if (window.gsap) {
        window.gsap.to(input, { duration: 0.3, scale: 1 });
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initLoginAnimations();
    initVisualEffects();
  }, 200);
});
