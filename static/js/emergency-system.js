// static/js/emergency-system.js

// Register GSAP Plugins
gsap.registerPlugin(ScrollTrigger);

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initPixiStage();
    initSmoothHero();
    initIntroAnimation();
    initHeroAnimations();
    initParallax();
    initHorizontalSections();
    initScrollAnimations();
    initTimelineAnimation();
    initNetworkAnimation();
    attachButtonEffects();
});

function initIntroAnimation() {
    const overlay = document.getElementById('intro-overlay');
    const navbar = document.querySelector('nav.navbar');
    if (!overlay) return;

    if (navbar) gsap.set(navbar, { autoAlpha: 0 });

    gsap.to(overlay, {
        autoAlpha: 0,
        pointerEvents: 'none',
        scrollTrigger: {
            trigger: document.body,
            start: 'top top',
            end: '+=100%',
            scrub: true,
            onLeave: () => overlay.remove()
        }
    });

    if (navbar) gsap.to(navbar, { autoAlpha: 1, scrollTrigger: { trigger: document.body, start: 'top top' } });
}

function initSmoothHero() {
    if (typeof ScrollSmoother === 'undefined' || typeof DrawSVGPlugin === 'undefined') return;

    ScrollSmoother.create({
        smooth: 2,
        effects: true
    });

    gsap.from('.draw', {
        drawSVG: '0%',
        ease: 'expo.out',
        scrollTrigger: {
            trigger: '.heading',
            start: 'top center',
            scrub: true,
            pin: '.pin',
            pinSpacing: false
        }
    });
}

function initPixiStage() {
    const stage = document.querySelector('#intro-overlay .stage');
    if (!stage || typeof PIXI === 'undefined') return;

    const app = new PIXI.Application({
        width: 716,
        height: 724,
        backgroundColor: 0xDAE0D2,
        antialias: true
    });

    const gridSize = 11;
    const circD = 63;
    const circOffsetX = 0.11111;
    const circOffsetY = 0.15873;
    const color1 = 0x01AFF6;
    const color2 = 0xF20085;
    const color3 = 0xFFD036;
    const animDuration = 0.8;

    function buildGrid() {
        stage.appendChild(app.view);
        app.ticker.stop();
        gsap.ticker.add(() => app.ticker.update());

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const container = new PIXI.Container();
                const c1 = new PIXI.Graphics();
                c1.beginFill(color1).drawCircle(0, 0, circD / 2).endFill();
                c1.blendMode = PIXI.BLEND_MODES.MULTIPLY;
                const c2 = new PIXI.Graphics();
                c2.beginFill(color2).drawCircle(0, 0, circD / 2).endFill();
                c2.blendMode = PIXI.BLEND_MODES.MULTIPLY;
                const c3 = new PIXI.Graphics();
                c3.beginFill(color3).drawCircle(0, 0, circD / 2).endFill();
                c3.blendMode = PIXI.BLEND_MODES.MULTIPLY;

                const cc1 = new PIXI.Container();
                cc1.addChild(c1);
                const cc2 = new PIXI.Container();
                cc2.addChild(c2);
                const cc3 = new PIXI.Container();
                cc3.addChild(c3);

                cc2.x = -circOffsetX * circD;
                cc2.y = circOffsetY * circD;
                cc3.x = circOffsetX * circD;
                cc3.y = circOffsetY * circD;

                container.addChild(cc1, cc2, cc3);
                app.stage.addChild(container);

                container.x = i * circD + circD / 2 + i * 2;
                container.y = j * circD + circD / 2 + j * 2;
            }
        }

        app.stage.x = 2;
    }

    function animate() {
        const band = new SplitText(stage.querySelector('.band'), { type: 'chars', charsClass: 'char', position: 'relative' });
        new SplitText(stage.querySelectorAll('.details p'), { type: 'lines', charsClass: 'line', position: 'relative' });

        gsap.timeline({ delay: 0.2 })
            .from(app.stage.children, {
                pixi: { scale: 0, rotation: 360 },
                duration: 2,
                ease: 'power4',
                stagger: {
                    each: 0.1,
                    grid: [gridSize, gridSize],
                    from: [0, 1]
                }
            })
            .to(app.stage.children, {
                duration: animDuration,
                ease: 'sine.inOut',
                stagger: {
                    each: 0.1,
                    repeat: -1,
                    yoyo: true,
                    grid: [gridSize, gridSize],
                    from: [0, 1],
                    onStart: function () {
                        gsap.to(this.targets()[0].children, {
                            pixi: { scale: 0.15 },
                            duration: animDuration,
                            ease: 'sine.inOut',
                            repeat: -1,
                            yoyo: true
                        });
                    }
                }
            }, 0.1)
            .from(band.chars, {
                duration: 2,
                y: 150,
                stagger: 0.05,
                scrambleText: { text: 'x', chars: 'lowerCase', speed: 0.3, delimiter: ' ', tweenLength: false },
                ease: 'expo'
            }, 0.5)
            .from(stage.querySelectorAll('.details span'), {
                duration: 1.5,
                y: 50,
                opacity: 0,
                ease: 'expo',
                stagger: 0.1
            }, 0.9);
    }

    function resize() {
        const vh = window.innerHeight;
        const sh = stage.offsetHeight;
        const scaleFactor = vh / sh;
        gsap.set(stage, { scale: scaleFactor < 1 ? scaleFactor : 1 });
    }

    buildGrid();
    resize();
    animate();
    window.addEventListener('resize', resize);
}

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
