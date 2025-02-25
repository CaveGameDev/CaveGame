export class World {
  constructor(scene) {
    this.scene = scene;
    this.blockSize = 1;
    this.worldWidth = 128;  // Reduced world size for performance
    this.worldHeight = 32;  // Reduced height
    this.worldDepth = 128;  // Reduced depth
    this.blocks = new Map(); 
    this.blockGeometry = null;
    this.materials = {
      bedrock: null, 
      ground: null, 
      grass: null,
      cobblestone: null
    };
    this.textureLoader = new THREE.TextureLoader();
    this.blockOffset = 0.5; // Slight adjustment to center blocks
    this.initializeGeometry();
    this.loadTextures();
  }

  initializeGeometry() {
    // Create a single shared geometry for all blocks to reduce memory usage
    this.blockGeometry = new THREE.BoxGeometry(1, 1, 1);
    this.blockGeometry.computeBoundingBox();
  }

  loadTextures() {
    const textureUrls = [
      '/Screenshot_20250209-154144~2.png',   // Grass
      '/3227683066.png',                     // Stone
      '/Screenshot_20250209-205941~2.png'    // Bedrock
    ];

    const texturePromises = textureUrls.map(url => 
      new Promise((resolve, reject) => {
        this.textureLoader.load(
          url, 
          (texture) => {
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            resolve(texture);
          },
          undefined,
          reject
        );
      })
    );

    Promise.all(texturePromises)
      .then(([grassTexture, stoneTexture, bedrockTexture]) => {
        this.materials.grass = new THREE.MeshBasicMaterial({ map: grassTexture });
        this.materials.cobblestone = new THREE.MeshBasicMaterial({ map: stoneTexture });
        this.materials.bedrock = new THREE.MeshBasicMaterial({ map: bedrockTexture });
        
        this.generateTerrain();
      })
      .catch(error => {
        console.error('Texture loading failed:', error);
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
          { y: 0, material: this.materials.bedrock },
          { y: 1, material: this.materials.cobblestone },
          { y: 2, material: this.materials.cobblestone },
          { y: 3, material: this.materials.grass }
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
    if (y === 0) {
      material = this.materials.bedrock;
    } else if (y === 1 || y === 2) {
      material = this.materials.cobblestone;
    } else if (y === 3) {
      material = this.materials.grass;
    } else if (y > 3) {
      material = this.materials.cobblestone; 
    } else {
      material = this.materials.grass; 
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