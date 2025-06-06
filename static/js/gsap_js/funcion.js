console.clear();

// Registrar plugins
gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, MotionPathPlugin);

// Configuración global
gsap.defaults({ ease: "power2.inOut" });

// Inicializar elementos
gsap.set(".ball, .node-icon", { visibility: "visible", scale: 0 });
gsap.set(".timeline-card", { opacity: 0, y: 40, scale: 0.95 });
gsap.set(".connection-line", { drawSVG: "0%" });

// Timeline principal con scroll
const mainTimeline = gsap.timeline({
    scrollTrigger: {
        trigger: "#svg-stage",
        start: "top 75%",
        end: "bottom 25%",
        scrub: 1.5,
        pin: false,
        onUpdate: (self) => {
            const progress = self.progress;
            updateParticlePosition(progress);
        }
    }
});

// Animación de la línea principal
mainTimeline
    .fromTo(".theLine", 
        { drawSVG: "0%", opacity: 0 },
        { drawSVG: "100%", opacity: 0.8, duration: 2, ease: "none" }
    )
    .to(".connection-line", {
        drawSVG: "100%",
        duration: 1,
        stagger: 0.2,
        ease: "power2.out"
    }, "-=1.5");

// Animación de los nodos
const nodeTimeline = gsap.timeline({
    scrollTrigger: {
        trigger: "#svg-stage",
        start: "top 60%",
        end: "bottom 40%",
        scrub: 1
    }
});

// Secuencia de aparición de nodos
nodeTimeline
    .to(".ball01, .icon01", {
        scale: 1,
        duration: 0.5,
        ease: "back.out(1.7)"
    })
    .to(".pulse-ring", {
        opacity: 1,
        scale: 2,
        duration: 1,
        ease: "power2.out"
    }, "-=0.3")
    .to(".ball02, .icon02", {
        scale: 1,
        duration: 0.5,
        ease: "back.out(1.7)"
    }, "-=0.5")
    .to(".ball03, .icon03", {
        scale: 1,
        duration: 0.5,
        ease: "back.out(1.7)"
    }, "-=0.3")
    .to(".ball04, .icon04", {
        scale: 1,
        duration: 0.5,
        ease: "back.out(1.7)"
    }, "-=0.3")
    .to(".ball05, .icon05", {
        scale: 1,
        duration: 0.5,
        ease: "back.out(1.7)"
    }, "-=0.3");

// Animación de las cards
ScrollTrigger.batch(".timeline-card", {
    onEnter: (batch) => {
        gsap.to(batch, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: "power3.out",
            onComplete: function() {
                batch.forEach(card => card.classList.add('active'));
            }
        });
    },
    start: "top 85%"
});

// Partícula viajera
function updateParticlePosition(progress) {
    const path = document.querySelector(".theLine");
    const length = path.getTotalLength();
    const point = path.getPointAtLength(length * progress);
    
    gsap.set(".traveling-particle", {
        cx: point.x,
        cy: point.y,
        opacity: progress > 0 && progress < 1 ? 1 : 0
    });
}

// Animación de rotación continua para los anillos
gsap.to(".node-ring", {
    rotation: 360,
    duration: 20,
    repeat: -1,
    ease: "none",
    transformOrigin: "center"
});

// Efecto de brillo en las líneas
gsap.to(".theLine", {
    strokeDasharray: "10 5",
    strokeDashoffset: -15,
    duration: 2,
    repeat: -1,
    ease: "none"
});

// Animación del título
gsap.from("#how-it-works h2 span", {
    y: 100,
    opacity: 0,
    duration: 1.2,
    ease: "power4.out",
    scrollTrigger: {
        trigger: "#how-it-works h2",
        start: "top 80%"
    }
});

gsap.from("#how-it-works .text-gray-400, #how-it-works p", {
    y: 30,
    opacity: 0,
    duration: 0.8,
    stagger: 0.1,
    ease: "power3.out",
    scrollTrigger: {
        trigger: "#how-it-works h2",
        start: "top 80%"
    }
});

// Hover effects para los nodos
document.querySelectorAll('.node-group').forEach((node, index) => {
    node.addEventListener('mouseenter', () => {
        gsap.to(node.querySelector('.ball'), {
            scale: 1.2,
            duration: 0.3,
            ease: "power2.out"
        });
        
        gsap.to(node.querySelector('.node-bg'), {
            scale: 1.2,
            opacity: 0.3,
            duration: 0.3
        });
        
        // Activar la card correspondiente
        const card = document.querySelector(`.card0${index + 1}`);
        if (card) {
            gsap.to(card, {
                y: -10,
                scale: 1.02,
                duration: 0.3,
                ease: "power2.out"
            });
        }
    });
    
    node.addEventListener('mouseleave', () => {
        gsap.to(node.querySelector('.ball'), {
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
        });
        
        gsap.to(node.querySelector('.node-bg'), {
            scale: 1,
            opacity: 0.1,
            duration: 0.3
        });
        
        const card = document.querySelector(`.card0${index + 1}`);
        if (card && card.classList.contains('active')) {
            gsap.to(card, {
                y: 0,
                scale: 1,
                duration: 0.3,
                ease: "power2.out"
            });
        }
    });
});

// Efecto parallax para las partículas del fondo
window.addEventListener('mousemove', (e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    
    document.querySelectorAll('.particle').forEach((particle, index) => {
        const speed = (index + 1) * 20;
        gsap.to(particle, {
            x: (x - 0.5) * speed,
            y: (y - 0.5) * speed,
            duration: 1,
            ease: "power2.out"
        });
    });
});

// Animación de las líneas de conexión al hacer hover
document.querySelectorAll('.connection-line').forEach((line, index) => {
    line.addEventListener('mouseenter', () => {
        gsap.to(line, {
            stroke: `rgba(${100 + index * 50}, ${130 - index * 20}, ${246 - index * 30}, 0.5)`,
            strokeWidth: 4,
            duration: 0.3
        });
    });
    
    line.addEventListener('mouseleave', () => {
        gsap.to(line, {
            stroke: `rgba(${100 + index * 50}, ${130 - index * 20}, ${246 - index * 30}, 0.1)`,
            strokeWidth: 2,
            duration: 0.3
        });
    });
});

// Animación de pulso continuo
function createPulse(selector, color) {
    gsap.to(`${selector} .pulse-ring`, {
        scale: 2,
        opacity: 0,
        duration: 2,
        repeat: -1,
        ease: "power2.out"
    });
}

// Activar pulsos
createPulse('.node01', '#EF4444');
createPulse('.node02', '#3B82F6');
createPulse('.node03', '#9333EA');
createPulse('.node04', '#EC4899');
createPulse('.node05', '#22C55E');

// Efecto de respiración para los iconos
gsap.to(".node-icon", {
    scale: 1.1,
    duration: 2,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    stagger: {
        each: 0.2,
        from: "start"
    }
});

// Refresh ScrollTrigger on resize
window.addEventListener('resize', () => {
    ScrollTrigger.refresh();
});

// Animación inicial de carga
window.addEventListener('load', () => {
    gsap.from("#svg-stage", {
        opacity: 0,
        scale: 0.8,
        duration: 1.5,
        ease: "power4.out",
        delay: 0.2
    });
});