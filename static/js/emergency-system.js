// static/js/emergency-system.js

// Register GSAP Plugins
gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initHeroAnimations();
    initParallax();
    initHorizontalSections();
    initScrollAnimations();
    initTimelineAnimation();
    initNetworkAnimation();
    initScrollSmootherNoise();
    attachButtonEffects();
});

// Hero Animations
function initHeroAnimations() {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    
    tl.to('.hero-content > *', {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.2
    })
    .from('.network-device', {
        scale: 0,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "back.out(1.7)"
    }, "-=0.5")
    .from('.central-broker', {
        scale: 0,
        opacity: 0,
        duration: 0.6,
        ease: "back.out(1.7)"
    }, "-=0.8");
}

// Parallax Effects
function initParallax() {
    gsap.utils.toArray('.parallax-layer').forEach(layer => {
        const speed = layer.dataset.speed || 0.5;
        const direction = layer.dataset.direction || 'vertical';

        const props = direction === 'horizontal' ? { xPercent: 50 * speed } : { yPercent: -50 * speed };

        gsap.to(layer, {
            ...props,
            ease: "none",
            scrollTrigger: {
                trigger: layer.closest('section'),
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
    });
    
    // Mouse parallax for floating elements
    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        
        gsap.to('.floating-element', {
            x: x * 20,
            y: y * 20,
            duration: 1,
            ease: "power2.out"
        });
    });
}

// Horizontal parallax sections pinned on scroll
function initHorizontalSections() {
    gsap.utils.toArray('.horizontal-section').forEach(section => {
        const content = section.querySelector('.scroll-content');
        if (!content) return;

        const distance = content.scrollWidth - section.clientWidth;
        gsap.fromTo(content, { x: -distance }, {
            x: 0,
            ease: 'none',
            scrollTrigger: {
                trigger: section,
                start: 'top top',
                end: () => `+=${distance}`,
                scrub: true,
                pin: true,
                invalidateOnRefresh: true
            }
        });
    });
}

// Scroll Animations
function initScrollAnimations() {
    // Emergency Cards
    gsap.from('.emergency-card', {
        scrollTrigger: {
            trigger: '#emergency-types',
            start: 'top 80%'
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1
    });

    // Recent Alerts - slide in from right
    gsap.utils.toArray('#alerts .alert-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%'
            },
            x: 120,
            opacity: 0,
            duration: 0.8,
            delay: i * 0.1,
            ease: "power3.out"
        });
    });

    // IoT Component Cards - slide in with parallax
    gsap.utils.toArray('#components .component-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 90%'
            },
            x: 100,
            opacity: 0,
            duration: 0.8,
            delay: i * 0.1,
            ease: "power3.out"
        });
    });

    // Architecture Section
    gsap.from('#architecture .bg-white', {
        scrollTrigger: {
            trigger: '#architecture',
            start: 'top 70%'
        },
        scale: 0.8,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
    });
}

// Timeline Animation
function initTimelineAnimation() {
    const steps = gsap.utils.toArray('.timeline-step');
    
    steps.forEach((step, index) => {
        gsap.to(step, {
            scrollTrigger: {
                trigger: step,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            opacity: 1,
            x: 0,
            duration: 0.8,
            delay: index * 0.2,
            ease: "power3.out"
        });
    });
    
    // Animate timeline line progress
    gsap.to('.timeline-line', {
        scrollTrigger: {
            trigger: '.timeline-container',
            start: 'top 60%',
            end: 'bottom 40%',
            scrub: 1
        },
        background: 'linear-gradient(to bottom, #dc2626 0%, #dc2626 100%)',
        ease: "none"
    });
}

// Network Animation
function initNetworkAnimation() {
    // Create connection lines
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.position = 'absolute';
    svg.style.inset = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    
    const network = document.querySelector('.mqtt-network');
    if (network) {
        network.appendChild(svg);
        
        // Add animated lines (simplified for now)
        const devices = document.querySelectorAll('.network-device');
        const broker = document.querySelector('.central-broker');
        
        if (broker && devices.length > 0) {
            // Animation would go here
        }
    }
}

// Emergency Simulation
function simulateEmergency(type) {
    const output = document.getElementById('demo-output');
    const display = document.getElementById('demo-display');
    
    // Clear previous states
    output.innerHTML = '';
    const stopTransmission = showDataTransmission(output);
    
    // Simulate processing
    setTimeout(() => {
        // Update output
        stopTransmission();
        output.innerHTML = `
            <div class="flex items-center justify-center text-green-400 text-lg font-semibold">
                <i class="fas fa-check-circle mr-2"></i>
                <span>Alerta ${type} activada en todos los dispositivos</span>
            </div>
        `;
        gsap.fromTo(output, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 });
        showNotification(`Alerta ${type} enviada`, 'success');
        
        
        // Animate display
        gsap.to(display, {
            scale: 1.1,
            duration: 0.3,
            yoyo: true,
            repeat: 3,
            ease: "power2.inOut"
        });
        
    }, 1500);
}

// Smooth scroll function
function scrollToSection(selector) {
    const element = document.querySelector(selector);
    if (element) {
        gsap.to(window, {
            duration: 1,
            scrollTo: {
                y: element,
                offsetY: 80
            },
            ease: "power2.inOut"
        });
    }
}

// Add hover effects to emergency cards
document.querySelectorAll('.emergency-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        gsap.to(card, {
            y: -10,
            duration: 0.3,
            ease: "power2.out"
        });
    });
    
    card.addEventListener('mouseleave', () => {
        gsap.to(card, {
            y: 0,
            duration: 0.3,
            ease: "power2.out"
        });
    });
});

// Component card 3D effect
document.querySelectorAll('.component-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        gsap.to(card, {
            rotationY: rotateY,
            rotationX: rotateX,
            duration: 0.3,
            ease: "power2.out",
            transformPerspective: 1000
        });
    });
    
    card.addEventListener('mouseleave', () => {
        gsap.to(card, {
            rotationY: 0,
            rotationX: 0,
            duration: 0.3,
            ease: "power2.out"
        });
    });
});

// Form submission (demo only)
document.querySelector('form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    showNotification('Mensaje enviado correctamente', 'success');
    e.target.reset();
});

// Notification function
function showNotification(message, type = 'info') {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: type,
            title: message,
            showConfirmButton: false,
            timer: 3000,
            background: '#1f2937',
            color: '#fff'
        });
    } else {
        console.log(`${type}: ${message}`);
    }
}

// Add ripple effect to demo buttons
function attachButtonEffects() {
    document.querySelectorAll('.demo-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            createRipple(e);
        });
    });
}

function createRipple(e) {
    const button = e.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    circle.classList.add('ripple');
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${e.clientY - button.getBoundingClientRect().top - radius}px`;
    button.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
}

// Display data flow animation in demo output
function showDataTransmission(target) {
    const container = document.createElement('div');
    container.className = 'data-flow';
    for (let i = 0; i < 5; i++) {
        const p = document.createElement('span');
        p.className = 'packet';
        container.appendChild(p);
    }
    target.appendChild(container);
    const anim = gsap.to(container.children, {
        x: 16,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        repeat: -1,
        ease: 'power1.inOut'
    });
    return () => {
        anim.kill();
        container.remove();
    };
}

// Initialize ScrollSmoother with animated circles
function initScrollSmootherNoise() {
    if (typeof ScrollSmoother === 'undefined' || typeof SimplexNoise === 'undefined') {
        return;
    }

    const wrapper = document.getElementById('wrapper');
    const content = document.getElementById('content');

    if (!wrapper || !content) return;

    const smoother = ScrollSmoother.create({
        wrapper: wrapper,
        content: content,
        smooth: 1,
        effects: false
    });

    const simplex = new SimplexNoise();
    for (let i = 0; i < 200; i++) {
        const div = document.createElement('div');
        div.classList.add('circle');
        const n1 = simplex.noise2D(i * 0.003, i * 0.0033);
        const n2 = simplex.noise2D(i * 0.002, i * 0.001);
        div.style.transform = `translate(${n2 * 200}px) rotate(${n2 * 270}deg) scale(${1 + n1}, ${1 + n2})`;
        div.style.boxShadow = `0 0 0 .2px hsla(${Math.floor(i*0.3)}, 70%, 70%, .6)`;
        content.appendChild(div);
    }

    const circles = content.querySelectorAll('.circle');
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: content,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.7
        }
    });

    circles.forEach(circle => tl.to(circle, { opacity: 1 }, 0));
}


// Initialize network data flow animation
function animateDataFlow() {
    const packets = [];
    const network = document.querySelector('.mqtt-network');
    
    if (!network) return;
    
    // Create packet elements
    for (let i = 0; i < 4; i++) {
        const packet = document.createElement('div');
        packet.className = 'absolute w-2 h-2 bg-blue-400 rounded-full';
        network.appendChild(packet);
        packets.push(packet);
    }
    
    // Animate packets along paths
    packets.forEach((packet, index) => {
        const tl = gsap.timeline({ repeat: -1, delay: index * 0.5 });
        
        // Define paths based on device positions
        const paths = [
            { start: { left: '20%', top: '20%' }, end: { left: '50%', top: '50%' } },
            { start: { left: '80%', top: '20%' }, end: { left: '50%', top: '50%' } },
            { start: { left: '20%', top: '80%' }, end: { left: '50%', top: '50%' } },
            { start: { left: '80%', top: '80%' }, end: { left: '50%', top: '50%' } }
        ];
        
        const path = paths[index];
        
        tl.set(packet, { ...path.start, opacity: 0 })
          .to(packet, { opacity: 1, duration: 0.3 })
          .to(packet, { ...path.end, duration: 2, ease: "none" })
          .to(packet, { opacity: 0, duration: 0.3 });
    });
}

// Start data flow animation after page load
window.addEventListener('load', () => {
    setTimeout(animateDataFlow, 1000);
});
