export class Player {
  constructor(camera, world) {
    this.camera = camera;
    this.world = world;
    this.speed = 3;
    this.moveDirection = { forward: false, backward: false, left: false, right: false };
    this.mouseSensitivity = 0.0005;
    this.touchSensitivity = 0.002;
    this.rotation = { x: 0, y: 0 };
    this.velocity = new THREE.Vector3();
    this.moveJoystickData = { active: false, startX: 0, startY: 0, moveX: 0, moveY: 0 };
    this.lookJoystickData = { active: false, startX: 0, startY: 0, moveX: 0, moveY: 0 };
    
    this.minRotationX = -Math.PI / 3;
    this.maxRotationX = Math.PI / 3;
    
    this.front = new THREE.Vector3();
    this.right = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    
    // Changed initial spawn position
    this.camera.position.set(25, 34, 25);
    
    // Add eye level offset
    this.eyeLevel = 1.6; // Player's eye height
    this.cameraOffset = new THREE.Vector3(0, this.eyeLevel, 0);
    
    // Adjust collision values
    this.height = 1.8;
    this.radius = 0.3;
    this.feet = new THREE.Vector3();
    
    this.camera.rotation.order = 'YXZ';
    this.targetRotation = { x: 0, y: 0 };
    this.rotationLerpFactor = 0.15;
    
    this.raycaster = new THREE.Raycaster();
    this.breakingCooldown = 500; // 500ms cooldown
    this.lastBreakTime = 0;
    this.placingCooldown = 500; // 500ms cooldown for placing
    this.lastPlaceTime = 0;
    
    // Adjusted physics values
    this.gravity = 20;
    this.jumpForce = 8; // Increased jump force
    this.verticalVelocity = 0;
    this.isGrounded = false;
    this.setupMobileControls();
    this.setupBlockBreaking();
    this.setupBlockPlacing();
  }

  setupMobileControls() {
    const moveJoystick = document.getElementById('moveJoystick');
    const lookJoystick = document.getElementById('lookJoystick');
    
    moveJoystick.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      this.moveJoystickData.active = true;
      this.moveJoystickData.startX = touch.clientX;
      this.moveJoystickData.startY = touch.clientY;
    });

    moveJoystick.addEventListener('touchmove', (e) => {
      if (!this.moveJoystickData.active) return;
      const touch = e.touches[0];
      this.moveJoystickData.moveX = touch.clientX - this.moveJoystickData.startX;
      this.moveJoystickData.moveY = touch.clientY - this.moveJoystickData.startY;
      this.updateJoystickVisuals(moveJoystick, this.moveJoystickData);
    });

    moveJoystick.addEventListener('touchend', () => {
      this.moveJoystickData.active = false;
      this.moveJoystickData.moveX = 0;
      this.moveJoystickData.moveY = 0;
      this.resetJoystickVisuals(moveJoystick);
    });

    lookJoystick.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      this.lookJoystickData.active = true;
      this.lookJoystickData.startX = touch.clientX;
      this.lookJoystickData.startY = touch.clientY;
    });

    lookJoystick.addEventListener('touchmove', (e) => {
      if (!this.lookJoystickData.active) return;
      const touch = e.touches[0];
      this.lookJoystickData.moveX = touch.clientX - this.lookJoystickData.startX;
      this.lookJoystickData.moveY = touch.clientY - this.lookJoystickData.startY;
      this.updateJoystickVisuals(lookJoystick, this.lookJoystickData);
    });

    lookJoystick.addEventListener('touchend', () => {
      this.lookJoystickData.active = false;
      this.lookJoystickData.moveX = 0;
      this.lookJoystickData.moveY = 0;
      this.resetJoystickVisuals(lookJoystick);
    });
    
    const jumpButton = document.getElementById('jumpButton');
    
    jumpButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.isGrounded) {
        this.verticalVelocity = this.jumpForce;
        this.isGrounded = false;
      }
    });
  }

  setupBlockBreaking() {
    const breakButton = document.getElementById('breakButton');
    
    // Desktop key for breaking blocks
    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyB') {
        this.breakBlock();
      }
    });
    
    // Mobile break button
    breakButton.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Prevent additional events
      this.breakBlock();
    });
  }

  setupBlockPlacing() {
    const placeButton = document.getElementById('placeButton');
    
    // Desktop key for placing blocks
    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyP') {
        this.placeBlock();
      }
    });
    
    // Mobile place button
    placeButton.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Prevent additional events
      this.placeBlock();
    });
  }

  breakBlock() {
    const currentTime = performance.now();
    if (currentTime - this.lastBreakTime < this.breakingCooldown) {
      return; // Still in cooldown
    }
    
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    
    const blocks = Array.from(this.world.blocks.values()).filter(block => block instanceof THREE.Mesh);
    
    const intersects = this.raycaster.intersectObjects(blocks);
    
    if (intersects.length > 0) {
      const hitBlock = intersects[0].object;
      const pos = hitBlock.position;
      if (this.world.removeBlock(pos.x, pos.y, pos.z)) {
        this.lastBreakTime = currentTime;
      }
    }
  }

  placeBlock() {
    const currentTime = performance.now();
    if (currentTime - this.lastPlaceTime < this.placingCooldown) {
      return; // Still in cooldown
    }
    
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    
    const blocks = Array.from(this.world.blocks.values()).filter(block => block instanceof THREE.Mesh);
    
    const intersects = this.raycaster.intersectObjects(blocks);
    
    if (intersects.length > 0) {
      const hitBlock = intersects[0].object;
      const pos = hitBlock.position;
      const normal = intersects[0].face.normal;
      
      const placeX = Math.floor(pos.x + normal.x);
      const placeY = Math.floor(pos.y + normal.y);
      const placeZ = Math.floor(pos.z + normal.z);
      
      // Determine block type based on layer
      let blockType = 'grass';
      if (placeY === 0) blockType = 'bedrock';
      else if (placeY === 1 || placeY === 2) blockType = 'cobblestone';
      
      if (this.world.placeBlock(placeX, placeY, placeZ, blockType)) {
        this.lastPlaceTime = currentTime;
      }
    }
  }

  updateJoystickVisuals(joystickElement, joystickData) {
    const thumb = joystickElement.querySelector('.joystick-thumb');
    const maxDistance = 35; 
    const dx = joystickData.moveX;
    const dy = joystickData.moveY;
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), maxDistance);
    const angle = Math.atan2(dy, dx);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    thumb.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  }

  resetJoystickVisuals(joystickElement) {
    const thumb = joystickElement.querySelector('.joystick-thumb');
    thumb.style.transform = 'translate(-50%, -50%)';
  }

  handleKeyDown(event) {
    switch (event.code) {
      case 'KeyW': this.moveDirection.forward = true; break;
      case 'KeyS': this.moveDirection.backward = true; break;
      case 'KeyA': this.moveDirection.left = true; break;
      case 'KeyD': this.moveDirection.right = true; break;
      case 'Space': 
        if (this.isGrounded) {
          this.verticalVelocity = this.jumpForce;
          this.isGrounded = false;
        }
        break;
      case 'KeyR': this.teleportToRandomLocation(); break; // Add teleport on R key
    }
  }

  handleKeyUp(event) {
    switch (event.code) {
      case 'KeyW': this.moveDirection.forward = false; break;
      case 'KeyS': this.moveDirection.backward = false; break;
      case 'KeyA': this.moveDirection.left = false; break;
      case 'KeyD': this.moveDirection.right = false; break;
    }
  }

  handleMouseMove(event) {
    const smoothingFactor = 0.5;
    
    // Update target rotation with clamped values
    this.targetRotation.y -= event.movementX * this.mouseSensitivity * smoothingFactor;
    this.targetRotation.x -= event.movementY * this.mouseSensitivity * smoothingFactor;
    
    // Clamp vertical rotation
    this.targetRotation.x = Math.max(this.minRotationX, Math.min(this.maxRotationX, this.targetRotation.x));
    
    // Keep horizontal rotation within 0 to 2π
    this.targetRotation.y = ((this.targetRotation.y % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  }

  checkCollision(position) {
    // Calculate feet position (bottom of player hitbox)
    this.feet.copy(position).sub(this.cameraOffset);
    
    const blockX = Math.floor(this.feet.x);
    const blockY = Math.floor(this.feet.y);
    const blockZ = Math.floor(this.feet.z);
    
    // Limit collision checks to world boundaries
    const minX = Math.max(0, blockX - 1);
    const maxX = Math.min(256, blockX + 1);
    const minY = Math.max(0, blockY - 1);
    const maxY = Math.min(64, blockY + 1);
    const minZ = Math.max(0, blockZ - 1);
    const maxZ = Math.min(256, blockZ + 1);
    
    // Check collision with surrounding blocks
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          if (this.world.hasBlock(x, y, z)) {
            const blockBB = {
              minX: x,
              maxX: x + 1,
              minY: y,
              maxY: y + 1,
              minZ: z,
              maxZ: z + 1
            };
            
            const playerBB = {
              minX: this.feet.x - this.radius,
              maxX: this.feet.x + this.radius,
              minY: this.feet.y,
              maxY: this.feet.y + this.height,
              minZ: this.feet.z - this.radius,
              maxZ: this.feet.z + this.radius
            };
            
            if (this.checkBoxCollision(playerBB, blockBB)) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  checkBoxCollision(a, b) {
    return (a.minX <= b.maxX && a.maxX >= b.minX) &&
           (a.minY <= b.maxY && a.maxY >= b.minY) &&
           (a.minZ <= b.maxZ && a.maxZ >= b.minZ);
  }

  update(deltaTime) {
    // Rotation handling
    this.rotation.x += (this.targetRotation.x - this.rotation.x) * this.rotationLerpFactor;
    this.rotation.y += (this.targetRotation.y - this.rotation.y) * this.rotationLerpFactor;
    
    this.rotation.x = Math.max(this.minRotationX, Math.min(this.maxRotationX, this.rotation.x));
    
    // Movement direction
    this.direction.set(0, 0, 0);
    
    this.front.set(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
    this.right.set(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y)

    const smoothingFactor = 0.5;
    if (this.moveDirection.forward) this.direction.add(this.front.clone().multiplyScalar(smoothingFactor));
    if (this.moveDirection.backward) this.direction.sub(this.front.clone().multiplyScalar(smoothingFactor));
    if (this.moveDirection.left) this.direction.sub(this.right.clone().multiplyScalar(smoothingFactor));
    if (this.moveDirection.right) this.direction.add(this.right.clone().multiplyScalar(smoothingFactor));

    // Mobile controls
    if (this.moveJoystickData.active) {
      const joystickX = this.moveJoystickData.moveX * 0.003;
      const joystickY = this.moveJoystickData.moveY * 0.003;
      this.direction.add(this.front.clone().multiplyScalar(-joystickY * smoothingFactor));
      this.direction.add(this.right.clone().multiplyScalar(joystickX * smoothingFactor));
    }

    // Handle look joystick
    if (this.lookJoystickData.active) {
      this.targetRotation.y -= this.lookJoystickData.moveX * this.touchSensitivity * smoothingFactor;
      this.targetRotation.x -= this.lookJoystickData.moveY * this.touchSensitivity * smoothingFactor;
      this.targetRotation.x = Math.max(this.minRotationX, Math.min(this.maxRotationX, this.targetRotation.x));
      this.targetRotation.y = ((this.targetRotation.y % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    }

    // Apply gravity and vertical movement
    this.verticalVelocity -= this.gravity * deltaTime;
    
    // Calculate new position for feet (not camera)
    let newPosition = this.camera.position.clone().sub(this.cameraOffset);
    
    // Apply horizontal movement if any
    if (this.direction.lengthSq() > 0) {
      this.direction.normalize().multiplyScalar(this.speed * deltaTime);
      newPosition.x += this.direction.x;
      newPosition.z += this.direction.z;
    }
    
    // Apply vertical movement
    newPosition.y += this.verticalVelocity * deltaTime;
    
    // Check ground collision
    const floorY = 0; // Ground level for feet
    if (newPosition.y <= floorY) {
      newPosition.y = floorY;
      this.verticalVelocity = 0;
      this.isGrounded = true;
    }
    
    // Add camera offset to get camera position
    const cameraPosition = newPosition.clone().add(this.cameraOffset);
    
    // Check block collisions
    if (!this.checkCollision(cameraPosition)) {
      this.camera.position.copy(cameraPosition);
    } else {
      // If collision detected, try to slide along walls
      const horizontalOnlyPosition = this.camera.position.clone();
      horizontalOnlyPosition.x = cameraPosition.x;
      if (!this.checkCollision(horizontalOnlyPosition)) {
        this.camera.position.x = cameraPosition.x;
      }
      
      horizontalOnlyPosition.x = this.camera.position.x;
      horizontalOnlyPosition.z = cameraPosition.z;
      if (!this.checkCollision(horizontalOnlyPosition)) {
        this.camera.position.z = cameraPosition.z;
      }
    }

    // Apply rotation
    this.camera.rotation.x = this.rotation.x;
    this.camera.rotation.y = this.rotation.y;
    this.camera.rotation.z = 0; 
  }

  teleportToRandomLocation() {
    const worldWidth = 256;
    const worldDepth = 256;
    const maxHeight = 100; // Maximum height for teleportation

    // Generate random coordinates within the world
    const randomX = Math.floor(Math.random() * worldWidth);
    const randomZ = Math.floor(Math.random() * worldDepth);
    const randomY = Math.floor(Math.random() * maxHeight) + 50; // Between 50 and 150

    // Set camera position and reset vertical velocity
    this.camera.position.set(randomX, randomY, randomZ);
    this.verticalVelocity = 0;
    this.isGrounded = false;
  }
}