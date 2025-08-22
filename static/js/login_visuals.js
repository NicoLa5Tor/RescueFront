// Animaciones simples y funcionales de login
function initLoginAnimations() {
  if (typeof window.gsap === 'undefined') {
    //////console.log('GSAP no está disponible, usando fallback CSS');
    // Fallback: mostrar elementos inmediatamente si GSAP no está disponible
    const elements = document.querySelectorAll('.fade-in-up, .fade-in-scale');
    elements.forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }
  
  //////console.log('Iniciando animaciones GSAP');
  
  // Configuraciones iniciales más suaves
  window.gsap.set('.fade-in-up', { opacity: 0, y: 30 });
  window.gsap.set('.fade-in-scale', { opacity: 0, scale: 0.8 });
  
  // Timeline simple y confiable
  const tl = window.gsap.timeline({ delay: 0.3 });
  
  // Animaciones básicas que funcionan
  tl.to('.fade-in-scale', {
    opacity: 1,
    scale: 1,
    duration: 0.6,
    ease: "back.out(1.2)"
  })
  .to('.fade-in-up', {
    opacity: 1,
    y: 0,
    duration: 0.5,
    stagger: 0.1,
    ease: "power2.out"
  }, "-=0.3");
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
