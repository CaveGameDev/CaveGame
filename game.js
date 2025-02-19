import { World } from './world.js';
import { Player } from './player.js';

class Game {
  constructor() {
    this.setupRenderer();
    this.setupScene();
    this.setupLighting();
    this.world = new World(this.scene);
    this.player = new Player(this.camera, this.world);
    
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.lastFpsUpdate = 0;
    
    this.animate();
    this.setupEventListeners();
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: false, 
      powerPreference: "high-performance"
    });
    this.renderer.shadowMap.enabled = false;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
    document.body.appendChild(this.renderer.domElement);
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x78A7FF); 
    
    // Removed fog completely
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 30);
    
    this.camera.matrixAutoUpdate = true;
    this.scene.matrixAutoUpdate = false;
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

new Game();