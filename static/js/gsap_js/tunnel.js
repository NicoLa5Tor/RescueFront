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

    // Create welcome screen
    const welcomeScreen = document.createElement('div');
    welcomeScreen.className = 'tunnel-welcome-screen absolute inset-0 bg-black/80 flex items-center justify-center z-30';
    welcomeScreen.innerHTML = `
      <div class="text-center px-8 max-w-4xl">
        <h1 class="tunnel-welcome-title text-6xl md:text-8xl font-bold text-white mb-8 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Sistema de Emergencia IoT
        </h1>
        <p class="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed">
          Explora el flujo completo de una alerta de emergencia a través de nuestra red inteligente
        </p>
        <button class="tunnel-start-btn bg-gradient-to-r from-blue-500 to-purple-600 text-white px-12 py-4 rounded-full text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl">
          Comenzar Experiencia
        </button>
        <div class="tunnel-scroll-indicator mt-16 text-white/50">
          <p class="text-sm mb-2">Usa el scroll para navegar</p>
          <svg class="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      antialias: true,
      shadowMapEnabled: true,
      shadowMapType: THREE.PCFSoftShadowMap
    });
    renderer.setSize(ww, wh);

    //Create an empty scene
    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 0, 100);

    var clock = new THREE.Clock();

    //Create a perspective camera
    var cameraRotationProxyX = 3.14159;
    var cameraRotationProxyY = 0;

    var camera = new THREE.PerspectiveCamera(45, ww / wh, 0.001, 200);
    camera.rotation.y = cameraRotationProxyX;
    camera.rotation.z = cameraRotationProxyY;

    var c = new THREE.Group();
    c.position.z = 400;

    c.add(camera);
    scene.add(c);

    //set up render pass
    var renderScene = new THREE.RenderPass( scene, camera );
    var bloomPass = new THREE.UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
    bloomPass.renderToScreen = true;
    bloomPass.threshold = params.bloomThreshold;
    bloomPass.strength = params.bloomStrength;
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

    //Create a new geometry with a different radius
    var geometry = new THREE.TubeGeometry( path, 300, 4, 32, false );

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

    //inner tube
    var geometry = new THREE.TubeGeometry( path, 150, 3.4, 32, false );
    var geo = new THREE.EdgesGeometry( geometry );

    var mat = new THREE.LineBasicMaterial( {
      linewidth: 2,
      opacity: .2,
      transparent: 1
    } );

    var wireframe = new THREE.LineSegments( geo, mat );
    scene.add( wireframe );

    //Create a point light in our scene
    var light = new THREE.PointLight(0xffffff, .35, 4,0);
    light.castShadow = true;
    scene.add(light);

    function updateCameraPercentage(percentage) {
      p1 = path.getPointAt(percentage);
      p2 = path.getPointAt(percentage + 0.03);

      c.position.set(p1.x,p1.y,p1.z);
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

    // Enhanced process steps data
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

    // Create enhanced process overlay
    var processOverlay = document.createElement('div');
    processOverlay.className = 'process-overlay absolute top-0 left-0 w-full h-full z-20 pointer-events-none';
    processOverlay.style.display = 'none'; // Hidden initially
    
    // Enhanced progress bar
    var progressContainer = document.createElement('div');
    progressContainer.className = 'absolute top-8 left-1/2 transform -translate-x-1/2 w-11/12 max-w-2xl z-25';
    progressContainer.innerHTML = `
      <div class="bg-black/40 backdrop-blur-md rounded-full p-3 border border-white/10">
        <div class="bg-gray-800/80 rounded-full h-3 overflow-hidden relative">
          <div class="tunnel-progress-bar h-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 w-0 transition-all duration-1000 ease-out relative">
            <div class="tunnel-progress-shimmer"></div>
          </div>
        </div>
        <div class="flex justify-between mt-2 px-2">
          ${processSteps.map((step, i) => `
            <div class="progress-dot w-3 h-3 rounded-full bg-gray-600 transition-all duration-500" data-step="${i}"></div>
          `).join('')}
        </div>
      </div>
    `;
    
    // Process steps container
    var stepsContainer = document.createElement('div');
    stepsContainer.className = 'absolute inset-0 flex items-center justify-center pointer-events-none';
    
    processSteps.forEach((step, index) => {
      var stepElement = document.createElement('div');
      stepElement.className = `tunnel-process-step opacity-0 transform translate-y-16 absolute`;
      stepElement.innerHTML = `
        <div class="flex flex-col lg:flex-row items-center gap-8 max-w-6xl mx-4">
          <div class="tunnel-step-card bg-black/60 rounded-3xl p-8 lg:p-10 border border-white/10 flex-1">
            <div class="flex items-start mb-6">
              <div class="text-5xl mr-6 animate-pulse">${step.icon}</div>
              <div class="flex-1">
                <h3 class="text-2xl lg:text-3xl font-bold text-white bg-gradient-to-r ${step.color} bg-clip-text text-transparent mb-2">
                  ${step.title}
                </h3>
                <p class="text-lg text-gray-400 mb-3">${step.subtitle}</p>
                <div class="w-20 h-1 bg-gradient-to-r ${step.color} rounded-full"></div>
              </div>
            </div>
            <p class="text-gray-300 leading-relaxed text-base lg:text-lg mb-6">
              ${step.description}
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              ${step.details.map(detail => `
                <div class="flex items-center text-sm text-gray-400">
                  <svg class="w-4 h-4 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  ${detail}
                </div>
              `).join('')}
            </div>
          </div>
          <div class="lg:w-96">
            <div class="tunnel-step-card bg-black/60 rounded-2xl p-6 text-center">
              <h4 class="text-lg font-semibold text-white mb-4">Demostración Visual</h4>
              <button class="tunnel-video-btn bg-gradient-to-r ${step.color} text-white px-8 py-3 rounded-full font-semibold hover:shadow-2xl transition-all duration-300" data-video="${step.videoUrl}">
                <span class="flex items-center">
                  <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path>
                  </svg>
                  Ver Video
                </span>
              </button>
              <p class="text-sm text-gray-400 mt-3">Click para ver demostración técnica</p>
            </div>
          </div>
        </div>
      `;
      stepsContainer.appendChild(stepElement);
    });

    // Video modal
    var videoModal = document.createElement('div');
    videoModal.className = 'tunnel-video-modal absolute inset-0 bg-black/90 hidden items-center justify-center z-40';
    videoModal.innerHTML = `
      <div class="relative max-w-4xl w-full mx-4">
        <button class="absolute -top-12 right-0 text-white text-4xl hover:text-gray-300 transition-colors">&times;</button>
        <video class="w-full rounded-lg" controls></video>
      </div>
    `;
    container.appendChild(videoModal);

    // Video modal functionality
    stepsContainer.addEventListener('click', function(e) {
      if (e.target.closest('.tunnel-video-btn')) {
        const btn = e.target.closest('.tunnel-video-btn');
        const videoUrl = btn.getAttribute('data-video');
        const video = videoModal.querySelector('video');
        video.src = videoUrl;
        videoModal.classList.remove('hidden');
        videoModal.classList.add('flex');
      }
    });

    videoModal.addEventListener('click', function(e) {
      if (e.target === videoModal || e.target.tagName === 'BUTTON') {
        const video = videoModal.querySelector('video');
        video.pause();
        video.src = '';
        videoModal.classList.add('hidden');
        videoModal.classList.remove('flex');
      }
    });

    processOverlay.appendChild(progressContainer);
    processOverlay.appendChild(stepsContainer);
    container.appendChild(processOverlay);

    // Timeline setup
    var tl;

    // Welcome screen interaction
    const startBtn = welcomeScreen.querySelector('.tunnel-start-btn');
    startBtn.addEventListener('click', function() {
      welcomeScreen.classList.add('hidden');
      processOverlay.style.display = 'block'; // Show progress overlay after clicking start
      
      // Create timeline after clicking start
      tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "+=1000%",
          scrub: 5,
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
              if (progress >= step.percent - 0.05 && progress <= step.percent + 0.15) {
                stepElement.classList.add('opacity-100', 'translate-y-0', 'active');
                stepElement.classList.remove('opacity-0', 'translate-y-16');
              } else {
                stepElement.classList.remove('opacity-100', 'translate-y-0', 'active');
                stepElement.classList.add('opacity-0', 'translate-y-16');
              }
            });
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

    //particle system
    var spikeyTexture = new THREE.TextureLoader().load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/68819/spikey.png');

    var particleCount = 6800,
        particles1 = new THREE.Geometry(),
        particles2 = new THREE.Geometry(),
        particles3 = new THREE.Geometry(),
        pMaterial = new THREE.ParticleBasicMaterial({
          color: 0xFFFFFF,
          size: .5,
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

    function render(){
      currentCameraPercentage = cameraTargetPercentage;
      
      camera.rotation.y += (cameraRotationProxyX - camera.rotation.y) / 15;
      camera.rotation.x += (cameraRotationProxyY - camera.rotation.x) / 15;
      
      updateCameraPercentage(currentCameraPercentage);
      
      particleSystem1.rotation.y += 0.00002;
      particleSystem2.rotation.x += 0.00005;
      particleSystem3.rotation.z += 0.00001;
      
      composer.render();
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    canvas.addEventListener('click', function(){
      console.clear();
      markers.push(p1);
      console.log(JSON.stringify(markers));
    });

    window.addEventListener( 'resize', function () {
      var width = window.innerWidth;
      var height = window.innerHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      renderer.setSize( width, height );
      composer.setSize( width, height );
    }, false );

    document.addEventListener('mousemove', function(evt) {
      cameraRotationProxyX = Mathutils.map(evt.clientX, 0, window.innerWidth, 3.24, 3.04);
      cameraRotationProxyY = Mathutils.map(evt.clientY, 0, window.innerHeight, -0.1, 0.1);
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