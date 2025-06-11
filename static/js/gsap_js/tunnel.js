(function() {
  'use strict';

  const TunnelModule = {
    id: 'tunnel-module',
    container: null,
    init: function(gsapMain) {
      this.gsapMain = gsapMain;
      this.container = document.querySelector('#tunnel');
      if (!this.container) {
        console.warn('Tunnel section not found');
        return;
      }
      initTunnel(this.container);
    },
    destroy: function() {}
  };

  function initTunnel(container) {
    // Video URLs configuration
    const VIDEO_URLS = {
      step1: 'https://example.com/emergency-activation-demo.mp4',
      step2: 'https://example.com/mqtt-transmission-demo.mp4',
      step3: 'https://example.com/ai-processing-demo.mp4',
      step4: 'https://example.com/device-activation-demo.mp4',
      step5: 'https://example.com/confirmation-demo.mp4'
    };

    // Responsive breakpoint detection
    function isMobile() {
      return window.innerWidth < 768;
    }

    function isTablet() {
      return window.innerWidth >= 768 && window.innerWidth < 1024;
    }

    // Create welcome screen with responsive layout
    const welcomeScreen = document.createElement('div');
    welcomeScreen.className = 'tunnel-welcome-screen absolute inset-0 bg-black/80 flex items-center justify-center z-30';
    welcomeScreen.innerHTML = `
      <div class="text-center px-4 sm:px-6 lg:px-8 max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto">
        <h1 class="tunnel-welcome-title text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-bold text-white mb-4 sm:mb-6 lg:mb-8 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent leading-tight">
          Sistema de Emergencia IoT
        </h1>
        <p class="text-sm sm:text-base md:text-xl lg:text-2xl text-gray-300 mb-6 sm:mb-8 lg:mb-12 leading-relaxed px-2">
          Explora el flujo completo de una alerta de emergencia a través de nuestra red inteligente
        </p>
        <button class="tunnel-start-btn bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 sm:px-8 lg:px-12 py-3 sm:py-4 rounded-full text-sm sm:text-base lg:text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl">
          Comenzar Experiencia
        </button>
        <div class="tunnel-scroll-indicator mt-8 sm:mt-12 lg:mt-16 text-white/50">
          <p class="text-xs sm:text-sm mb-2">Usa el scroll para navegar</p>
          <svg class="w-4 h-4 sm:w-6 sm:h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </div>
      </div>
    `;
    container.appendChild(welcomeScreen);

    var canvas = container.querySelector('canvas.experience');

    var Mathutils = {
        normalize: function($value, $min, $max) {
            return ($value - $min) / ($max - $min);
        },
        interpolate: function($normValue, $min, $max) {
            return $min + ($max - $min) * $normValue;
        },
        map: function($value, $min1, $max1, $min2, $max2) {
            if ($value < $min1) {
                $value = $min1;
            }
            if ($value > $max1) {
                $value = $max1;
            }
            var res = this.interpolate(this.normalize($value, $min1, $max1), $min2, $max2);
            return res;
        }
    };
    var markers = [];

    //Get window size
    var ww = window.innerWidth,
      wh = window.innerHeight;

    var composer, params = {
        exposure: 1.3,
        bloomStrength: .9,
        bloomThreshold: 0,
        bloomRadius: 0
      };

    //Create a WebGL renderer
    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: !isMobile(), // Disable antialiasing on mobile for performance
      shadowMapEnabled: !isMobile(),
      shadowMapType: THREE.PCFSoftShadowMap
    });
    renderer.setSize(ww, wh);

    //Create an empty scene
    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 0, 100);

    var clock = new THREE.Clock();

    //Create a perspective camera with responsive FOV and positioning
    var cameraRotationProxyX = 3.14159;
    var cameraRotationProxyY = 0;

    var fov = isMobile() ? 50 : 45; // Slightly wider FOV on mobile
    var camera = new THREE.PerspectiveCamera(fov, ww / wh, 0.001, 200);
    camera.rotation.y = cameraRotationProxyX;
    camera.rotation.z = cameraRotationProxyY;

    var c = new THREE.Group();
    c.position.z = 400;

    // Adjust camera position for mobile to center it in the tunnel
    if (isMobile()) {
      camera.position.y = -1; // Lower the camera slightly
      camera.position.z = 2;  // Move camera forward a bit
    }

    c.add(camera);
    scene.add(c);

    //set up render pass with performance optimization
    var renderScene = new THREE.RenderPass( scene, camera );
    var bloomPass = new THREE.UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
    bloomPass.renderToScreen = true;
    bloomPass.threshold = params.bloomThreshold;
    bloomPass.strength = isMobile() ? params.bloomStrength * 0.7 : params.bloomStrength; // Reduce bloom on mobile
    bloomPass.radius = params.bloomRadius;
    composer = new THREE.EffectComposer( renderer );
    composer.setSize( window.innerWidth, window.innerHeight );
    composer.addPass( renderScene );
    composer.addPass( bloomPass );

    //Array of points
    var points = [
        [10, 89, 0],
        [50, 88, 10],
        [76, 139, 20],
        [126, 141, 12],
        [150, 112, 8],
        [157, 73, 0],
        [180, 44, 5],
        [207, 35, 10],
        [232, 36, 0]
    ];

    var p1, p2;

    //Convert the array of points into vertices
    for (var i = 0; i < points.length; i++) {
      var x = points[i][0];
      var y = points[i][2];
      var z = points[i][1];
      points[i] = new THREE.Vector3(x, y, z);
    }
    //Create a path from the points
    var path = new THREE.CatmullRomCurve3(points);
    path.tension = .5;

    //Create a new geometry with responsive complexity
    var tubeSegments = isMobile() ? 200 : 300; // Reduce segments on mobile
    var geometry = new THREE.TubeGeometry( path, tubeSegments, 4, 32, false );

    var texture = new THREE.TextureLoader().load( 'static/assets/img/espacio2.png' , function ( texture ) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.offset.set( 0, 0 );
        texture.repeat.set( 15, 2 );
    } );

    var mapHeight = new THREE.TextureLoader().load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/68819/waveform-bump3.jpg', function( texture){
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.offset.set( 0, 0 );
        texture.repeat.set( 15, 2 );
    });

    var material = new THREE.MeshPhongMaterial({
      side:THREE.BackSide,
      map: texture,
      shininess: 20,
      bumpMap: mapHeight,
      bumpScale: -.03,
      specular: 0x000000
    });

    //Create a mesh
    var tube = new THREE.Mesh( geometry, material );
    scene.add( tube );

    //inner tube with responsive complexity
    var innerGeometry = new THREE.TubeGeometry( path, isMobile() ? 100 : 150, 3.4, 32, false );
    var geo = new THREE.EdgesGeometry( innerGeometry );

    var mat = new THREE.LineBasicMaterial( {
      linewidth: 2,
      opacity: .2,
      transparent: 1
    } );

    var wireframe = new THREE.LineSegments( geo, mat );
    scene.add( wireframe );

    //Create a point light
    var light = new THREE.PointLight(0xffffff, .35, 4,0);
    light.castShadow = !isMobile(); // Disable shadows on mobile
    scene.add(light);

    function updateCameraPercentage(percentage) {
      p1 = path.getPointAt(percentage);
      p2 = path.getPointAt(percentage + 0.03);

      c.position.set(p1.x, p1.y, p1.z);

      // Adjust camera positioning for mobile to keep it centered in tunnel
      if (isMobile()) {
        // Offset the camera position to center it better in the tunnel
        var offset = new THREE.Vector3(0, -2, 0); // Move down slightly
        c.position.add(offset);
      }

      c.lookAt(p2);
      light.position.set(p2.x, p2.y, p2.z);
    }

    var cameraTargetPercentage = 0;
    var currentCameraPercentage = 0;

    gsap.defaultEase = Linear.easeNone;

    var tubePerc = {
      percent: 0
    }

    gsap.registerPlugin(ScrollTrigger);

    // Enhanced process steps data with responsive adjustments
    var processSteps = [
      {
        title: "Activación de Emergencia",
        subtitle: "Inicio del protocolo de seguridad",
        description: "El usuario inicia el proceso presionando un botón de emergencia, recibiendo una confirmación táctil y visual inmediata para asegurar que la alerta fue generada.",
        details: [
          "Activación instantánea < 100ms",
          "Confirmación táctil mediante vibración",
          "LED de estado multicolor",
          "Registro de ubicación GPS"
        ],
        icon: "🚨",
        color: "from-red-500 to-red-700",
        percent: 0.15,
        videoUrl: VIDEO_URLS.step1
      },
      {
        title: "Transmisión MQTT",
        subtitle: "Comunicación en tiempo real",
        description: "La alerta se transmite instantáneamente a la nube mediante el protocolo MQTT, garantizando que la señal llegue con latencia mínima y alta fiabilidad.",
        details: [
          "Protocolo MQTT v5.0",
          "Encriptación TLS 1.3",
          "QoS nivel 2 garantizado",
          "Latencia < 50ms promedio"
        ],
        icon: "📡",
        color: "from-blue-500 to-blue-700",
        percent: 0.35,
        videoUrl: VIDEO_URLS.step2
      },
      {
        title: "Procesamiento Central",
        subtitle: "Inteligencia artificial en acción",
        description: "Un sistema central con inteligencia artificial recibe la alerta, analiza los datos, prioriza eventos y coordina la respuesta adecuada en tiempo real.",
        details: [
          "Análisis con ML en < 200ms",
          "Priorización inteligente",
          "Detección de patrones",
          "Coordinación multi-agente"
        ],
        icon: "🧠",
        color: "from-purple-500 to-purple-700",
        percent: 0.55,
        videoUrl: VIDEO_URLS.step3
      },
      {
        title: "Activación de Dispositivos",
        subtitle: "Red IoT sincronizada",
        description: "El sistema activa automáticamente una red de dispositivos físicos, como semáforos y displays LED, que informan y coordinan acciones visuales.",
        details: [
          "Activación simultánea",
          "Sincronización < 1 segundo",
          "Cobertura de 5km radio",
          "Redundancia del 99.9%"
        ],
        icon: "💡",
        color: "from-yellow-500 to-yellow-700",
        percent: 0.75,
        videoUrl: VIDEO_URLS.step4
      },
      {
        title: "Confirmación y Registro",
        subtitle: "Verificación completa del ciclo",
        description: "El proceso finaliza con una verificación integral del ciclo, registrando los eventos y enviando notificaciones en tiempo real.",
        details: [
          "Registro blockchain inmutable",
          "Notificaciones multicanal",
          "Analytics en tiempo real",
          "Cumplimiento GDPR"
        ],
        icon: "✅",
        color: "from-green-500 to-green-700",
        percent: 0.95,
        videoUrl: VIDEO_URLS.step5
      }
    ];

    // Create enhanced process overlay with responsive design
    var processOverlay = document.createElement('div');
    processOverlay.className = 'process-overlay absolute top-0 left-0 w-full h-full z-20 pointer-events-none overflow-hidden';
    processOverlay.style.display = 'none';

    // Enhanced progress bar with responsive sizing
    var progressContainer = document.createElement('div');
    progressContainer.className = 'absolute top-4 sm:top-6 lg:top-8 left-1/2 transform -translate-x-1/2 w-11/12 sm:w-10/12 lg:w-11/12 max-w-xs sm:max-w-lg lg:max-w-2xl z-25';
    progressContainer.innerHTML = `
      <div class="bg-black/40 backdrop-blur-md rounded-full p-2 sm:p-3 border border-white/10">
        <div class="bg-gray-800/80 rounded-full h-2 sm:h-3 overflow-hidden relative">
          <div class="tunnel-progress-bar h-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 w-0 transition-all duration-1000 ease-out relative">
            <div class="tunnel-progress-shimmer"></div>
          </div>
        </div>
        <div class="flex justify-between mt-1 sm:mt-2 px-1 sm:px-2">
          ${processSteps.map((step, i) => `
            <div class="progress-dot w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gray-600 transition-all duration-500" data-step="${i}"></div>
          `).join('')}
        </div>
      </div>
    `;

    // Process steps container with responsive layout
    var stepsContainer = document.createElement('div');
    stepsContainer.className = 'absolute inset-0 flex items-center justify-center pointer-events-none px-2 sm:px-4 lg:px-8';

    processSteps.forEach((step, index) => {
      var stepElement = document.createElement('div');
      stepElement.className = `tunnel-process-step opacity-0 transform translate-y-16 absolute w-full max-w-7xl`;
      stepElement.innerHTML = `
        <div class="flex flex-col items-center gap-4 sm:gap-6 lg:gap-8 mx-auto px-2 sm:px-4">
          <div class="tunnel-step-card bg-black/60 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 xl:p-10 border border-white/10 w-full max-w-xs sm:max-w-2xl lg:max-w-4xl">
            <div class="flex flex-col sm:flex-row items-start mb-4 sm:mb-6">
              <div class="text-3xl sm:text-4xl lg:text-5xl mb-3 sm:mb-0 sm:mr-4 lg:mr-6 animate-pulse">${step.icon}</div>
              <div class="flex-1 text-center sm:text-left">
                <h3 class="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white bg-gradient-to-r ${step.color} bg-clip-text text-transparent mb-1 sm:mb-2">
                  ${step.title}
                </h3>
                <p class="text-sm sm:text-base lg:text-lg text-gray-400 mb-2 sm:mb-3">${step.subtitle}</p>
                <div class="w-16 sm:w-20 h-1 bg-gradient-to-r ${step.color} rounded-full mx-auto sm:mx-0"></div>
              </div>
            </div>
            <p class="text-gray-300 leading-relaxed text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 text-center sm:text-left">
              ${step.description}
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
              ${step.details.map(detail => `
                <div class="flex items-center text-xs sm:text-sm text-gray-400 justify-center sm:justify-start">
                  <svg class="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  ${detail}
                </div>
              `).join('')}
            </div>
            <div class="text-center">
              <h4 class="text-sm sm:text-base lg:text-lg font-semibold text-white mb-3 sm:mb-4">Demostración Visual</h4>
              <button class="tunnel-video-btn bg-gradient-to-r ${step.color} text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-full text-sm sm:text-base font-semibold hover:shadow-2xl transition-all duration-300" data-video="${step.videoUrl}">
                <span class="flex items-center justify-center">
                  <svg class="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path>
                  </svg>
                  Ver Video
                </span>
              </button>
              <p class="text-xs sm:text-sm text-gray-400 mt-2 sm:mt-3">Click para ver demostración técnica</p>
            </div>
          </div>
        </div>
      `;
      stepsContainer.appendChild(stepElement);
    });

    // Video modal with responsive design
    // var videoModal = document.createElement('div');
    // videoModal.className = 'tunnel-video-modal absolute inset-0 bg-black/90 hidden items-center justify-center z-40 p-4';
    // videoModal.innerHTML = `
    //   <div class="relative w-full max-w-xs sm:max-w-2xl lg:max-w-4xl">
    //     <button class="absolute -top-8 sm:-top-12 right-0 text-white text-2xl sm:text-4xl hover:text-gray-300 transition-colors">&times;</button>
    //     <video class="w-full rounded-lg" controls playsinline></video>
    //   </div>
    // `;
    // container.appendChild(videoModal);

    // Video modal functionality
    // stepsContainer.addEventListener('click', function(e) {
    //   if (e.target.closest('.tunnel-video-btn')) {
    //     const btn = e.target.closest('.tunnel-video-btn');
    //     const videoUrl = btn.getAttribute('data-video');
    //     const video = videoModal.querySelector('video');
    //     video.src = videoUrl;
    //     videoModal.classList.remove('hidden');
    //     videoModal.classList.add('flex');
    //   }
    // });

    // videoModal.addEventListener('click', function(e) {
    //   if (e.target === videoModal || e.target.tagName === 'BUTTON') {
    //     const video = videoModal.querySelector('video');
    //     video.pause();
    //     video.src = '';
    //     videoModal.classList.add('hidden');
    //     videoModal.classList.remove('flex');
    //   }
    // });

    processOverlay.appendChild(progressContainer);
    processOverlay.appendChild(stepsContainer);
    container.appendChild(processOverlay);

    // Timeline setup
    var tl;

    // Welcome screen interaction
    const startBtn = welcomeScreen.querySelector('.tunnel-start-btn');
    startBtn.addEventListener('click', function() {
      welcomeScreen.classList.add('hidden');
      processOverlay.style.display = 'block';

      // Create timeline with responsive scroll distances
      var scrollDistance = isMobile() ? "+=800%" : isTablet() ? "+=900%" : "+=1000%";

      tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: scrollDistance,
          scrub: isMobile() ? 3 : 5, // Faster scrub on mobile
          pin: true,
          anticipatePin: 1,
          markers: false,
                      onUpdate: function(self) {
            var progress = self.progress;

            // Update progress bar
            var progressBar = progressContainer.querySelector('.tunnel-progress-bar');
            progressBar.style.width = (progress * 100) + '%';

            // Update progress dots
            var dots = progressContainer.querySelectorAll('.progress-dot');
            processSteps.forEach((step, index) => {
              if (progress >= step.percent - 0.05) {
                dots[index].classList.add('bg-gradient-to-r', step.color.split(' ')[0], step.color.split(' ')[2]);
                dots[index].classList.remove('bg-gray-600');
              }
            });

            // Show/hide process steps with enhanced animation
            processSteps.forEach((step, index) => {
              var stepElement = stepsContainer.children[index];
              var showRange = isMobile() ? 0.2 : 0.15; // Longer display time on mobile
              if (progress >= step.percent - 0.05 && progress <= step.percent + showRange) {
                stepElement.classList.add('opacity-100', 'translate-y-0', 'active');
                stepElement.classList.remove('opacity-0', 'translate-y-16');
              } else {
                stepElement.classList.remove('opacity-100', 'translate-y-0', 'active');
                stepElement.classList.add('opacity-0', 'translate-y-16');
              }
            });

            // Trigger contact module when tunnel animation is near completion
            if (progress >= 0.85 && !window.tunnelContactTriggered) {
              window.tunnelContactTriggered = true;

              // Dispatch event to activate contact module
              const tunnelCompleteEvent = new CustomEvent('tunnel:near-complete', {
                detail: { progress: progress }
              });
              window.dispatchEvent(tunnelCompleteEvent);

              // Call integration function if available
              if (typeof integrateContactWithTunnel === 'function') {
                setTimeout(() => {
                  integrateContactWithTunnel();
                }, 1000);
              }
            }

            // Final completion event
            if (progress >= 0.95 && !window.tunnelFullyComplete) {
              window.tunnelFullyComplete = true;

              const tunnelCompleteEvent = new CustomEvent('tunnel:complete', {
                detail: { progress: progress }
              });
              window.dispatchEvent(tunnelCompleteEvent);
            }
          }
        }
      });

      tl.to(tubePerc, {
         percent:.96,
         ease: Linear.easeNone,
         duration: 10,
         onUpdate: function() {
           cameraTargetPercentage = tubePerc.percent;
         }
      });
    });

    //particle system with responsive particle count
    var spikeyTexture = new THREE.TextureLoader().load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/68819/spikey.png');

    var particleCount = isMobile() ? 3000 : isTablet() ? 5000 : 6800, // Reduce particles on mobile
        particles1 = new THREE.Geometry(),
        particles2 = new THREE.Geometry(),
        particles3 = new THREE.Geometry(),
        pMaterial = new THREE.ParticleBasicMaterial({
          color: 0xFFFFFF,
          size: isMobile() ? .3 : .5, // Smaller particles on mobile
          map: spikeyTexture,
          transparent: true,
          blending: THREE.AdditiveBlending
        });

    // create particles
    for (var p = 0; p < particleCount; p++) {
      var pX = Math.random() * 500 - 250,
          pY = Math.random() * 50 - 25,
          pZ = Math.random() * 500 - 250,
          particle = new THREE.Vector3(pX, pY, pZ);
      particles1.vertices.push(particle);
    }

    for (var p = 0; p < particleCount; p++) {
      var pX = Math.random() * 500,
          pY = Math.random() * 10 - 5,
          pZ = Math.random() * 500,
          particle = new THREE.Vector3(pX, pY, pZ);
      particles2.vertices.push(particle);
    }

    for (var p = 0; p < particleCount; p++) {
      var pX = Math.random() * 500,
          pY = Math.random() * 10 - 5,
          pZ = Math.random() * 500,
          particle = new THREE.Vector3(pX, pY, pZ);
      particles3.vertices.push(particle);
    }

    var particleSystem1 = new THREE.ParticleSystem(particles1, pMaterial);
    var particleSystem2 = new THREE.ParticleSystem(particles2, pMaterial);
    var particleSystem3 = new THREE.ParticleSystem(particles3, pMaterial);

    scene.add(particleSystem1);
    scene.add(particleSystem2);
    scene.add(particleSystem3);

    // Optimized render loop with performance considerations
    var lastFrameTime = 0;
    var targetFPS = isMobile() ? 30 : 60;
    var frameInterval = 1000 / targetFPS;

    function render(currentTime){
      if (currentTime - lastFrameTime < frameInterval) {
        requestAnimationFrame(render);
        return;
      }
      lastFrameTime = currentTime;

      currentCameraPercentage = cameraTargetPercentage;

      camera.rotation.y += (cameraRotationProxyX - camera.rotation.y) / 15;
      camera.rotation.x += (cameraRotationProxyY - camera.rotation.x) / 15;

      updateCameraPercentage(currentCameraPercentage);

      // Reduce particle animation on mobile for performance
      var rotationSpeed = isMobile() ? 0.5 : 1;
      particleSystem1.rotation.y += 0.00002 * rotationSpeed;
      particleSystem2.rotation.x += 0.00005 * rotationSpeed;
      particleSystem3.rotation.z += 0.00001 * rotationSpeed;

      composer.render();
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    canvas.addEventListener('click', function(){
      console.clear();
      markers.push(p1);
      console.log(JSON.stringify(markers));
    });

    // Enhanced responsive resize handler
    function handleResize() {
      var width = window.innerWidth;
      var height = window.innerHeight;

      camera.aspect = width / height;
      camera.fov = isMobile() ? 50 : 45; // Adjust FOV based on screen size
      camera.updateProjectionMatrix();

      // Reset camera position for mobile after resize
      if (isMobile()) {
        camera.position.y = -1;
        camera.position.z = 2;
      } else {
        camera.position.y = 0;
        camera.position.z = 0;
      }

      renderer.setSize( width, height );
      composer.setSize( width, height );

      // Update bloom strength based on screen size
      bloomPass.strength = isMobile() ? params.bloomStrength * 0.7 : params.bloomStrength;
    }

    window.addEventListener( 'resize', handleResize, false );

    // Optimized mouse movement for mobile with improved camera controls
    function handleMouseMove(evt) {
      if (isMobile()) return; // Disable mouse movement on mobile to save performance

      cameraRotationProxyX = Mathutils.map(evt.clientX, 0, window.innerWidth, 3.24, 3.04);
      cameraRotationProxyY = Mathutils.map(evt.clientY, 0, window.innerHeight, -0.1, 0.1);
    }

    document.addEventListener('mousemove', handleMouseMove);

    // Enhanced touch support for mobile with better camera centering
    var touchStartX = 0;
    var touchStartY = 0;

    container.addEventListener('touchstart', function(evt) {
      touchStartX = evt.touches[0].clientX;
      touchStartY = evt.touches[0].clientY;
    });

    container.addEventListener('touchmove', function(evt) {
      if (!isMobile()) return;

      var touchX = evt.touches[0].clientX;
      var touchY = evt.touches[0].clientY;

      var deltaX = touchX - touchStartX;
      var deltaY = touchY - touchStartY;

      // Reduce sensitivity for mobile and limit rotation range
      cameraRotationProxyX += deltaX * 0.0005;
      cameraRotationProxyY += deltaY * 0.0003;

      // Clamp rotation values to keep camera centered in tunnel
      cameraRotationProxyX = Math.max(3.04, Math.min(3.24, cameraRotationProxyX));
      cameraRotationProxyY = Math.max(-0.05, Math.min(0.05, cameraRotationProxyY));

      touchStartX = touchX;
      touchStartY = touchY;
    });

  } // end initTunnel

  window.addEventListener('gsap:initialized', () => {
    if (window.GSAPMain) {
      GSAPMain.registerModule(TunnelModule.id, TunnelModule);
    }
  });

  if (window.GSAPMain && window.GSAPMain.initialized) {
    GSAPMain.registerModule(TunnelModule.id, TunnelModule);
  }

})();