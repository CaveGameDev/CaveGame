import { World } from './world.js';
import { Player } from './player.js';

class Game {
  constructor() {
    // Ensure mobile controls are already present
    this.ensureMobileControlsVisibility();

    this.setupRenderer();
    this.setupScene();
    this.setupLighting();
    
    // Ensure Three.js is fully loaded before creating world and player
    if (typeof THREE !== 'undefined') {
      this.world = new World(this.scene);
      this.player = new Player(this.camera, this.world);
      
      this.lastTime = performance.now();
      this.frameCount = 0;
      this.lastFpsUpdate = 0;
      
      this.animate();
      this.setupEventListeners();
    } else {
      console.error('Three.js is not loaded');
    }
  }

  ensureMobileControlsVisibility() {
    // Explicitly ensure mobile controls are visible
    const mobileControls = document.querySelectorAll('.mobile-controls, .bottom-controls');
    mobileControls.forEach(control => {
      control.style.display = 'flex';
      control.style.visibility = 'visible';
      control.style.opacity = '1';
    });
  }

  setupRenderer() {
    // Create renderer with additional parameters for better compatibility
    this.renderer = new THREE.WebGLRenderer({
      antialias: false, 
      powerPreference: "high-performance",
      alpha: true, // Add alpha channel support
      preserveDrawingBuffer: true // Helps with some rendering issues
    });
    
    // Improved rendering settings
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x78A7FF, 1); // Explicit clear color
    this.renderer.shadowMap.enabled = false;

    // Size and append renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    
    // Ensure canvas takes full viewport
    this.renderer.domElement.style.position = 'fixed';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.zIndex = '1';
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x78A7FF); 
    
    // Adjust camera settings for better performance and compatibility
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20);
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

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
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
  }
}

// Ensure Three.js is loaded before initializing the game
window.addEventListener('load', () => {
  if (typeof THREE !== 'undefined') {
    new Game();
  } else {
    console.error('Three.js script must be loaded before game.js');
  }
});