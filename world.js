export class World {
  constructor(scene) {
    this.scene = scene;
    this.blockSize = 1;
    this.worldWidth = 256;
    this.worldHeight = 64;
    this.worldDepth = 256;
    this.blocks = new Map(); 
    this.geometry = new THREE.BoxGeometry(1, 1, 1); 
    
    // Load texture for stone/cobblestone block
    this.textureLoader = new THREE.TextureLoader();
    this.materials = {
      bedrock: null, 
      ground: new THREE.MeshBasicMaterial({ color: 0x808080 }), 
      grass: null,
      cobblestone: null
    };
    
    this.loadTextures();
    this.meshes = new Map(); 
  }

  loadTextures() {
    this.textureLoader.load('/Screenshot_20250209-154144~2.png', (grassTexture) => {
      // Configure grass texture
      grassTexture.magFilter = THREE.NearestFilter;
      grassTexture.minFilter = THREE.NearestFilter;
      
      // Load gray pixel texture for cobblestone
      this.textureLoader.load('/3227683066.png', (stoneTexture) => {
        // Configure stone texture
        stoneTexture.magFilter = THREE.NearestFilter;
        stoneTexture.minFilter = THREE.NearestFilter;
        
        // Load bedrock texture from new grayscale image
        this.textureLoader.load('/Screenshot_20250209-205941~2.png', (bedrockTexture) => {
          // Configure bedrock texture
          bedrockTexture.magFilter = THREE.NearestFilter;
          bedrockTexture.minFilter = THREE.NearestFilter;
          
          // Create materials with loaded textures using MeshBasicMaterial
          this.materials.grass = new THREE.MeshBasicMaterial({ map: grassTexture });
          this.materials.cobblestone = new THREE.MeshBasicMaterial({ map: stoneTexture });
          this.materials.bedrock = new THREE.MeshBasicMaterial({ map: bedrockTexture });
          
          // Generate terrain after textures are loaded
          this.generateTerrain();
        });
      });
    });
  }

  generateTerrain() {
    const width = this.worldWidth;
    const depth = this.worldDepth;
    const height = this.worldHeight;
    
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        // Bedrock layer (unbreakable bottom layer)
        const bedrockBlock = new THREE.Mesh(this.geometry, this.materials.bedrock);
        bedrockBlock.position.set(x, 0, z);
        this.scene.add(bedrockBlock);
        this.blocks.set(`${x},0,${z}`, bedrockBlock);
        
        // First cobblestone layer
        const cobblestoneBlock1 = new THREE.Mesh(this.geometry, this.materials.cobblestone);
        cobblestoneBlock1.position.set(x, 1, z);
        this.scene.add(cobblestoneBlock1);
        this.blocks.set(`${x},1,${z}`, cobblestoneBlock1);
        
        // Second cobblestone layer
        const cobblestoneBlock2 = new THREE.Mesh(this.geometry, this.materials.cobblestone);
        cobblestoneBlock2.position.set(x, 2, z);
        this.scene.add(cobblestoneBlock2);
        this.blocks.set(`${x},2,${z}`, cobblestoneBlock2);
        
        // Grass layer (top layer)
        const grassBlock = new THREE.Mesh(this.geometry, this.materials.grass);
        grassBlock.position.set(x, 3, z);
        this.scene.add(grassBlock);
        this.blocks.set(`${x},3,${z}`, grassBlock);
      }
    }
  }

  removeBlock(x, y, z) {
    const key = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
    const block = this.blocks.get(key);
    
    // Prevent removing ground (bedrock) layer
    if (block && y > 0) {
      this.scene.remove(block);
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
    
    // Prevent placing blocks on existing blocks or at world boundaries
    if (this.blocks.has(key) || 
        x < 0 || x >= this.worldWidth || 
        y < 0 || y >= this.worldHeight || 
        z < 0 || z >= this.worldDepth) {
      return false;
    }
    
    // Determine block type based on layer
    let finalBlockType = blockType;
    if (y > 3) {  // Above grass layer
      finalBlockType = 'cobblestone';
    }
    
    // Select material based on block type
    let material;
    switch (finalBlockType) {
      case 'grass':
        material = this.materials.grass;
        break;
      case 'cobblestone':
        material = this.materials.cobblestone;
        break;
      case 'bedrock':
        material = this.materials.bedrock;
        break;
      default:
        material = this.materials.grass;
    }
    
    // Create and place the block
    const block = new THREE.Mesh(this.geometry, material);
    block.position.set(x, y, z);
    this.scene.add(block);
    this.blocks.set(key, block);
    
    return true;
  }
}