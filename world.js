export class World {
  constructor(scene) {
    console.log('World initialization started', window.location.hostname);
    
    this.scene = scene;
    this.blockSize = 1;
    this.worldWidth = 128;  
    this.worldHeight = 32;  
    this.worldDepth = 128;  
    this.blocks = new Map(); 
    this.blockGeometry = null;
    this.materials = {
      bedrock: null, 
      ground: null, 
      grass: null,
      cobblestone: null
    };
    
    // Enhanced texture loading paths
    this.textureLoader = new THREE.TextureLoader();
    this.blockOffset = 0.5;
    
    try {
      this.initializeGeometry();
      this.loadTextures();
    } catch (error) {
      console.error('World initialization error:', error);
    }
  }

  initializeGeometry() {
    this.blockGeometry = new THREE.BoxGeometry(1, 1, 1);
    this.blockGeometry.computeBoundingBox();
    console.log('Geometry initialized');
  }

  loadTextures() {
    // Comprehensive path handling
    const isGitHubPages = window.location.hostname === 'cavegamedev.github.io';
    const BASE_PATH = isGitHubPages ? '/CaveGame' : '';

    const textureUrls = [
      `${BASE_PATH}/Screenshot_20250209-154144~2.png`,   // Grass
      `${BASE_PATH}/3227683066.png`,                     // Stone 
      `${BASE_PATH}/Screenshot_20250209-205941~2.png`    // Bedrock
    ];

    const texturePromises = textureUrls.map(url => 
      new Promise((resolve, reject) => {
        console.log(`Loading texture: ${url}`);
        this.textureLoader.load(
          url, 
          (texture) => {
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            resolve(texture);
          },
          undefined,
          (error) => {
            console.error(`Texture load failed for ${url}:`, error);
            reject(error);
          }
        );
      })
    );

    Promise.all(texturePromises)
      .then(([grassTexture, stoneTexture, bedrockTexture]) => {
        console.log('All textures loaded successfully');
        this.materials.grass = new THREE.MeshBasicMaterial({ map: grassTexture });
        this.materials.cobblestone = new THREE.MeshBasicMaterial({ map: stoneTexture });
        this.materials.bedrock = new THREE.MeshBasicMaterial({ map: bedrockTexture });
        
        this.generateTerrain();
      })
      .catch(error => {
        console.error('Texture loading completely failed:', error);
      });
  }

  generateTerrain() {
    console.time('Terrain Generation');
    const width = this.worldWidth;
    const depth = this.worldDepth;
    const height = this.worldHeight;
    
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        const layers = [
          // Replace bottom layer with 5 layers of stone
          { y: 0, material: this.materials.cobblestone },
          { y: 1, material: this.materials.cobblestone },
          { y: 2, material: this.materials.cobblestone },
          { y: 3, material: this.materials.cobblestone },
          { y: 4, material: this.materials.cobblestone },
          { y: 5, material: this.materials.cobblestone },
          { y: 6, material: this.materials.grass }
        ];

        layers.forEach(layer => {
          const block = new THREE.Mesh(this.blockGeometry, layer.material);
          block.position.set(
            x + this.blockOffset, 
            layer.y + this.blockOffset, 
            z + this.blockOffset
          );
          this.scene.add(block);
          this.blocks.set(`${x},${layer.y},${z}`, block);
        });
      }
    }
    console.timeEnd('Terrain Generation');
  }

  removeBlock(x, y, z) {
    const key = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
    const block = this.blocks.get(key);
    
    if (block && y > 0) {
      this.scene.remove(block);
      block.geometry.dispose();
      block.material.dispose();
      this.blocks.delete(key);
      return true;
    }
    return false;
  }

  getBlock(x, y, z) {
    return this.blocks.get(`${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`);
  }

  hasBlock(x, y, z) {
    return this.blocks.has(`${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`);
  }

  placeBlock(x, y, z, blockType) {
    const key = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
    
    if (this.blocks.has(key) || 
        x < 0 || x >= this.worldWidth || 
        y < 0 || y >= this.worldHeight || 
        z < 0 || z >= this.worldDepth) {
      return false;
    }
    
    let material;
    if (y <= 5) {
      material = this.materials.cobblestone;
    } else if (y === 6) {
      material = this.materials.grass;
    } else {
      material = this.materials.cobblestone; 
    }
    
    const block = new THREE.Mesh(this.blockGeometry, material);
    block.position.set(x + this.blockOffset, y + this.blockOffset, z + this.blockOffset);
    this.scene.add(block);
    this.blocks.set(key, block);
    
    return true;
  }

  dispose() {
    this.blocks.forEach((block) => {
      this.scene.remove(block);
      block.geometry.dispose();
      block.material.dispose();
    });
    this.blocks.clear();

    if (this.blockGeometry) {
      this.blockGeometry.dispose();
    }
    Object.values(this.materials).forEach(material => {
      if (material) material.dispose();
    });
  }
}