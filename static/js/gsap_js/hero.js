// Hero Module JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize GSAP
    gsap.registerPlugin(ScrollTrigger);
    
    // Create particles
    createParticles();
    
    // Animate hero content on load
    animateHeroContent();
    
    // Setup device connections
    setupDeviceConnections();
    
    // Setup scroll animations
    setupScrollAnimations();
    
    // Device tooltips
    setupTooltips();
});

// Create floating particles
function createParticles() {
    const particlesContainer = document.querySelector('.particles-container');
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 5 + 's';
        particlesContainer.appendChild(particle);
        
        // Animate particle
        gsap.to(particle, {
            y: -window.innerHeight,
            x: (Math.random() - 0.5) * 200,
            opacity: 0,
            duration: 10 + Math.random() * 10,
            repeat: -1,
            ease: "none",
            delay: Math.random() * 5
        });
    }
}

// Animate hero content on page load
function animateHeroContent() {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    
    // Animate title words
    tl.to('.title-word', {
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.1
    })
    
    // Animate status badge
    .from('.status-badge', {
        scale: 0,
        opacity: 0,
        duration: 0.6
    }, "-=0.5")
    
    // Animate description
    .from('.hero-description', {
        y: 20,
        opacity: 0,
        duration: 0.8
    }, "-=0.3")
    
    // Animate buttons
    .from('.hero-buttons button', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1
    }, "-=0.4")
    
    // Animate stats
    .to('.hero-stats', {
        y: 0,
        opacity: 1,
        duration: 0.8
    }, "-=0.2")
    
    // Animate visual
    .to('.hero-visual', {
        scale: 1,
        opacity: 1,
        duration: 1,
        ease: "back.out(1.7)"
    }, "-=0.8");
    
    // Animate hub pulse
    gsap.to('.hub-core', {
        boxShadow: '0 0 80px rgba(239, 68, 68, 0.5), inset 0 0 40px rgba(239, 68, 68, 0.2)',
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut"
    });
}

// Setup device connections animation
function setupDeviceConnections() {
    const devices = document.querySelectorAll('.orbit-device');
    const svg = document.querySelector('.connection-lines');
    const hubCore = document.querySelector('.hub-core');
    
    devices.forEach((device, index) => {
        // Create connection line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', '250');
        line.setAttribute('y1', '250');
        line.setAttribute('stroke', getComputedStyle(device).borderColor);
        line.setAttribute('stroke-width', '1');
        line.setAttribute('opacity', '0');
        line.setAttribute('filter', 'url(#hero-glow)');
        line.className = `connection-${index}`;
        svg.appendChild(line);
        
        // Update line position
        function updateLine() {
            const deviceRect = device.getBoundingClientRect();
            const visualRect = device.closest('.hero-visual').getBoundingClientRect();
            const x2 = deviceRect.left + deviceRect.width / 2 - visualRect.left;
            const y2 = deviceRect.top + deviceRect.height / 2 - visualRect.top;
            
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
        }
        
        updateLine();
        
        // Animate connection on hover
        device.addEventListener('mouseenter', () => {
            gsap.to(line, {
                opacity: 0.6,
                duration: 0.3
            });
            
            // Pulse effect
            gsap.to(device, {
                scale: 1.2,
                duration: 0.3
            });
        });
        
        device.addEventListener('mouseleave', () => {
            gsap.to(line, {
                opacity: 0,
                duration: 0.3
            });
            
            gsap.to(device, {
                scale: 1,
                duration: 0.3
            });
        });
        
        // Periodic connection animation
        gsap.to(line, {
            opacity: 0.3,
            duration: 0.5,
            repeat: -1,
            yoyo: true,
            ease: "power1.inOut",
            delay: index * 0.2,
            repeatDelay: 3
        });
    });
}

// Setup scroll-triggered animations
function setupScrollAnimations() {
    // Parallax effect for background elements
    gsap.to('.gradient-orbs > div', {
        y: -100,
        scrollTrigger: {
            trigger: '#hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1
        }
    });
    
    // Fade out hero content on scroll
    gsap.to('.hero-content', {
        opacity: 0,
        y: -50,
        scrollTrigger: {
            trigger: '#hero',
            start: 'center center',
            end: 'bottom center',
            scrub: 1
        }
    });
    
    // Scale down visual on scroll
    gsap.to('.hero-visual', {
        scale: 0.8,
        opacity: 0,
        scrollTrigger: {
            trigger: '#hero',
            start: 'center center',
            end: 'bottom center',
            scrub: 1
        }
    });
}

// Setup tooltips for devices
function setupTooltips() {
    const devices = document.querySelectorAll('[data-tooltip]');
    
    devices.forEach(device => {
        const tooltip = document.createElement('div');
        tooltip.className = 'device-tooltip';
        tooltip.textContent = device.dataset.tooltip;
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 0.25rem;
            font-size: 0.875rem;
            pointer-events: none;
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.3s ease;
            white-space: nowrap;
            border: 1px solid rgba(239, 68, 68, 0.3);
            z-index: 50;
        `;
        
        document.body.appendChild(tooltip);
        
        device.addEventListener('mouseenter', (e) => {
            const rect = device.getBoundingClientRect();
            tooltip.style.left = rect.left + rect.width / 2 + 'px';
            tooltip.style.top = rect.top - 40 + 'px';
            tooltip.style.transform = 'translateX(-50%) translateY(0)';
            tooltip.style.opacity = '1';
        });
        
        device.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'translateX(-50%) translateY(10px)';
        });
    });
}

// Smooth scroll function
function scrollToSection(selector) {
    const element = document.querySelector(selector);
    if (element) {
        gsap.to(window, {
            duration: 1,
            scrollTo: {
                y: element,
                offsetY: 0
            },
            ease: "power3.inOut"
        });
    }
}

// Add interactive effects to buttons
document.addEventListener('DOMContentLoaded', () => {
    // Primary button hover effect
    const primaryButtons = document.querySelectorAll('.cta-primary');
    primaryButtons.forEach(btn => {
        btn.addEventListener('mouseenter', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Create ripple effect
            const ripple = document.createElement('div');
            ripple.style.cssText = `
                position: absolute;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
                animation: ripple 0.6s ease-out;
            `;
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.style.width = '0px';
            ripple.style.height = '0px';
            
            btn.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
    
    // Add magnetic effect to devices
    const devices = document.querySelectorAll('.orbit-device');
    devices.forEach(device => {
        device.addEventListener('mousemove', (e) => {
            const rect = device.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            gsap.to(device, {
                x: x * 0.3,
                y: y * 0.3,
                duration: 0.3,
                ease: "power2.out"
            });
        });
        
        device.addEventListener('mouseleave', () => {
            gsap.to(device, {
                x: 0,
                y: 0,
                duration: 0.3,
                ease: "elastic.out(1, 0.3)"
            });
        });
    });
    
    // Animate stat numbers on view
    const stats = document.querySelectorAll('.stat-number');
    stats.forEach(stat => {
        const value = stat.textContent;
        const isNumeric = !isNaN(value.replace(/[<>]/g, ''));
        
        if (isNumeric) {
            const finalValue = parseInt(value.replace(/[<>]/g, ''));
            stat.textContent = '0';
            
            ScrollTrigger.create({
                trigger: stat,
                start: 'top 80%',
                onEnter: () => {
                    gsap.to(stat, {
                        textContent: finalValue,
                        duration: 2,
                        ease: "power2.out",
                        snap: { textContent: 1 },
                        onUpdate: function() {
                            stat.textContent = Math.floor(this.targets()[0].textContent);
                            if (value.includes('<')) {
                                stat.textContent = '<' + stat.textContent + 'ms';
                            }
                        }
                    });
                }
            });
        }
    });
    
    // Glitch effect on logo hover
    const hubCore = document.querySelector('.hub-core');
    hubCore.addEventListener('mouseenter', () => {
        hubCore.classList.add('glitch');
        setTimeout(() => hubCore.classList.remove('glitch'), 300);
    });
    
    // Dynamic background gradient
    let mouseX = 0;
    let mouseY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX / window.innerWidth;
        mouseY = e.clientY / window.innerHeight;
        
        gsap.to('.gradient-orbs > div:first-child', {
            x: mouseX * 50,
            y: mouseY * 50,
            duration: 2,
            ease: "power2.out"
        });
        
        gsap.to('.gradient-orbs > div:last-child', {
            x: -mouseX * 50,
            y: -mouseY * 50,
            duration: 2,
            ease: "power2.out"
        });
    });
    
    // Performance optimization - pause animations when not visible
    let observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                gsap.globalTimeline.play();
            } else {
                gsap.globalTimeline.pause();
            }
        });
    });
    
    observer.observe(document.querySelector('#hero'));
    
    // Initialize connection update loop
    function updateConnections() {
        document.querySelectorAll('.orbit-device').forEach((device, index) => {
            const line = document.querySelector(`.connection-${index}`);
            if (line) {
                const deviceRect = device.getBoundingClientRect();
                const visualRect = device.closest('.hero-visual').getBoundingClientRect();
                const x2 = deviceRect.left + deviceRect.width / 2 - visualRect.left;
                const y2 = deviceRect.top + deviceRect.height / 2 - visualRect.top;
                
                line.setAttribute('x2', x2);
                line.setAttribute('y2', y2);
            }
        });
        requestAnimationFrame(updateConnections);
    }
    
    updateConnections();
});

// Add CSS for ripple animation
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            width: 400px;
            height: 400px;
            opacity: 0;
        }
    }
    
    .glitch {
        animation: glitch 0.3s ease-in-out;
    }
    
    @keyframes glitch {
        0%, 100% { 
            transform: translate(-50%, -50%) scale(1);
            filter: hue-rotate(0deg);
        }
        20% {
            transform: translate(-48%, -50%) scale(1.02);
            filter: hue-rotate(90deg);
        }
        40% {
            transform: translate(-52%, -50%) scale(0.98);
            filter: hue-rotate(-90deg);
        }
        60% {
            transform: translate(-50%, -48%) scale(1.01);
            filter: hue-rotate(180deg);
        }
        80% {
            transform: translate(-50%, -52%) scale(0.99);
            filter: hue-rotate(270deg);
        }
    }
`;
document.head.appendChild(style);

// Export functions for external use
window.heroModule = {
    scrollToSection,
    animateHeroContent,
    createParticles
};