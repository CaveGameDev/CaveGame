import { World } from './world.js';
import { Player } from './player.js';

class Game {
  constructor() {
    this.setupRenderer();
    this.setupScene();
    this.setupLighting();
    
    if (typeof THREE !== 'undefined') {
      this.world = new World(this.scene);
      this.player = new Player(this.camera, this.world);
      
      this.lastTime = performance.now();
      this.frameCount = 0;
      this.lastFpsUpdate = 0;
      
      this.setupEventListeners();
      this.ensureMobileControlsVisibility();
      this.animate();
    } else {
      console.error('Three.js is not loaded');
    }
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: false, 
      powerPreference: "high-performance",
      alpha: true,
      preserveDrawingBuffer: false  // Optimize memory usage
    });
    
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x7FCDFE, 1); 
    this.renderer.shadowMap.enabled = false;

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    
    this.renderer.domElement.style.position = 'fixed';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.zIndex = '1';
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x7FCDFE); 
    
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);
    this.camera.matrixAutoUpdate = true;
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = false;

    this.scene.add(ambientLight, directionalLight);
  }

  setupEventListeners() {
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
    document.addEventListener('keydown', (e) => this.player.handleKeyDown(e), false);
    document.addEventListener('keyup', (e) => this.player.handleKeyUp(e), false);
    document.addEventListener('mousemove', (e) => this.player.handleMouseMove(e), false);
  }

  ensureMobileControlsVisibility() {
    const mobileControls = document.querySelectorAll('.mobile-controls, .bottom-controls');
    mobileControls.forEach(control => {
      control.style.display = 'flex';
      control.style.visibility = 'visible';
      control.style.opacity = '1';
    });
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    try {
      requestAnimationFrame(() => this.animate());
      
      const currentTime = performance.now();
      const deltaTime = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;
      
      this.player.update(deltaTime);
      this.renderer.render(this.scene, this.camera);
      
      this.frameCount++;
      if (currentTime - this.lastFpsUpdate >= 1000) {
        console.log(`FPS: ${this.frameCount}`);
        this.frameCount = 0;
        this.lastFpsUpdate = currentTime;
      }
    } catch (error) {
      console.error('Animation loop error:', error);
    }
  }

  dispose() {
    // Clean up resources
    window.removeEventListener('resize', this.onWindowResize);
    
    if (this.world) {
      this.world.dispose();
    }
    
    if (this.renderer) {
      this.renderer.dispose();
      document.body.removeChild(this.renderer.domElement);
    }
  }
}

window.addEventListener('load', () => {
  let game;
  try {
    if (typeof THREE !== 'undefined') {
      game = new Game();
    } else {
      console.error('Three.js script must be loaded before game.js');
    }

    // Optional: Add cleanup on page unload
    window.addEventListener('beforeunload', () => {
      if (game) {
        game.dispose();
      }
    });
  } catch (error) {
    console.error('Game initialization error:', error);
  }
});