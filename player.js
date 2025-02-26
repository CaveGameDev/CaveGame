export class Player {
  constructor(camera, world) {
   !function(camera, world) {
      this.camera = camera;
      this.world = world;
      // Increase base speed from 3 to 4.5
      this.speed = 4.5;  // 1.5x faster movement speed
      this.moveDirection = { 
        forward: false, 
        backward: false, 
        left: false, 
        right: false,
        lookUp: false,
        lookDown: false,
        lookLeft: false,
        lookRight: false
      };
      // Increase mouse and touch sensitivity
      this.mouseSensitivity = 0.0007;  // Increased from 0.0005
      this.touchSensitivity = 0.0007;  // Increased from 0.0005
      this.rotation = { x: 0, y: 0 };
      this.velocity = new THREE.Vector3();
      this.moveJoystickData = { active: false, startX: 0, startY: 0, moveX: 0, moveY: 0 };
      this.lookJoystickData = { active: false, startX: 0, startY: 0, moveX: 0, moveY: 0 };
      
      // Adjust rotation limits to be more intuitive
      this.minRotationX = -Math.PI / 3;  // Looking up limit
      this.maxRotationX = Math.PI / 3;   // Looking down limit

      this.front = new THREE.Vector3();
      this.right = new THREE.Vector3();
      this.direction = new THREE.Vector3();
      
      // Change initial spawn position to world center
      this.camera.position.set(this.world.worldWidth / 2, 34, this.world.worldDepth / 2);
      
      // Add eye level offset
      this.eyeLevel = 1.6; // Player's eye height
      this.cameraOffset = new THREE.Vector3(0, this.eyeLevel, 0);
      
      // Adjust collision values
      this.height = 1.8;
      this.radius = 0.3;
      this.feet = new THREE.Vector3();
      
      this.camera.rotation.order = 'YXZ';
      this.targetRotation = { x: 0, y: 0 };
      // Adjust smoothing for more responsive movement
      this.rotationLerpFactor = 0.2;  // Increased from 0.15
      
      this.raycaster = new THREE.Raycaster();
      this.breakingCooldown = 500; // 500ms cooldown
      this.lastBreakTime = 0;
      this.placingCooldown = 500; // 500ms cooldown for placing
      this.lastPlaceTime = 0;
      
      // Adjusted physics values
      this.gravity = 20;
      this.jumpForce = 10;  
      this.isJumping = false;  // Track jumping state
      this.jumpCooldown = 0.1;  // Very short cooldown to prevent excessive spam
      this.lastJumpTime = 0;
      this.jumpBufferTime = 0;  // Reduce buffer time to zero
      this.wasGroundedRecently = false;
      this.groundedTimer = 0;
      this.groundedThreshold = 0.2;  // Time considered "recently grounded"
      this.verticalVelocity = 0;
      this.isGrounded = false;

      // Add touch detection
      this.isMobileDevice = this.detectMobileDevice();
      this.setupControlVisibility();
      this.setupToggleMobileControls();
      this.setupEventListeners();
      this.setupBlockBreaking();
      this.setupBlockPlacing();
      this.setupJumpButton();
    }.call(this, camera, world);
  }

  // Detect mobile device
  detectMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Set up control visibility based on device
  setupControlVisibility() {
    const mobileControls = document.querySelectorAll('.mobile-controls, .bottom-controls');
    
    if (this.isMobileDevice) {
      mobileControls.forEach(control => {
        control.style.display = 'flex';
      });
    } else {
      mobileControls.forEach(control => {
        control.style.display = 'none';
      });
    }
  }

  setupToggleMobileControls() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Digit1') {
        const mobileControls = document.querySelectorAll('.mobile-controls, .bottom-controls');
        mobileControls.forEach(control => {
          control.style.display = control.style.display === 'none' ? 'flex' : 'none';
        });
      }
    });
  }

  setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        // Movement (WASD)
        case 'KeyW': this.moveDirection.forward = true; break;
        case 'KeyS': this.moveDirection.backward = true; break;
        case 'KeyA': this.moveDirection.left = true; break;
        case 'KeyD': this.moveDirection.right = true; break;
        
        // Camera rotation (Arrow keys) 
        case 'ArrowLeft': 
          this.moveDirection.lookLeft = true;
          break;
        case 'ArrowRight': 
          this.moveDirection.lookRight = true;
          break;
        case 'ArrowUp': 
          this.moveDirection.lookUp = true;
          break;
        case 'ArrowDown': 
          this.moveDirection.lookDown = true;
          break;
        
        case 'KeyR': 
          this.teleportToRandomLocation(); 
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': this.moveDirection.forward = false; break;
        case 'KeyS': this.moveDirection.backward = false; break;
        case 'KeyA': this.moveDirection.left = false; break;
        case 'KeyD': this.moveDirection.right = false; break;
        case 'ArrowLeft': 
          this.moveDirection.lookLeft = false;
          break;
        case 'ArrowRight': 
          this.moveDirection.lookRight = false;
          break;
        case 'ArrowUp': 
          this.moveDirection.lookUp = false;
          break;
        case 'ArrowDown': 
          this.moveDirection.lookDown = false;
          break;
      }
    });

    if (!this.isMobileDevice) {
      // Only add mouse move for non-mobile
      document.addEventListener('mousemove', (e) => this.handleMouseMove(e), false);
    }
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
    
    if (!placeButton) {
      console.error('Place button not found in the DOM');
      return;
    }
    
    const placeHandler = (e) => {
      try {
        // Prevent default and stop propagation to avoid unwanted behaviors
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        
        // Ensure game and player are initialized
        if (!window.game || !window.game.player) {
          console.error('Game or player not initialized');
          return;
        }
        
        // Prevent placing while jumping
        if (this.isJumping) {
          console.log('Cannot place block while jumping');
          return;
        }
        
        // Call placeBlock method with additional error handling
        const placementResult = window.game.player.placeBlock();
        
        if (!placementResult) {
          console.log('Block placement failed');
        }
      } catch (error) {
        console.error('Error in block placement:', error);
      }
    };
    
    // Desktop key for placing blocks
    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyP') {
        placeHandler();
      }
    });
    
    // Multiple event handlers for mobile and desktop
    const events = ['touchstart', 'mousedown'];
    events.forEach(eventType => {
      placeButton.addEventListener(eventType, placeHandler, { passive: false });
    });
  }

  setupJumpButton() {
    const jumpButton = document.getElementById('jumpButton');
    
    if (jumpButton) {
      // Desktop key for jumping
      document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
          this.attemptJump();
        }
      });
      
      // Mobile jump button
      jumpButton.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent additional events
        this.attemptJump();
      });
      
      // Optional: Add mouse click for desktop
      jumpButton.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.attemptJump();
      });
    }
  }

  setupMobileControls() {
    // Removed old joystick setup
    // Now handled by new touch D-pad in HTML
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
    // Prevent placing block while jumping
    if (this.isJumping) {
      console.log('Cannot place block while jumping');
      return false;
    }

    const currentTime = performance.now();
    if (currentTime - this.lastPlaceTime < this.placingCooldown) {
      console.log('Placing block is on cooldown');
      return false;
    }
    
    try {
      // Use camera's forward direction for placement
      const raycastDirection = new THREE.Vector3(0, 0, -1);
      raycastDirection.applyQuaternion(this.camera.quaternion);
      
      this.raycaster.set(this.camera.position, raycastDirection);
      
      const blocks = Array.from(this.world.blocks.values()).filter(block => block instanceof THREE.Mesh);
      
      const intersects = this.raycaster.intersectObjects(blocks);
      
      if (intersects.length === 0) {
        console.log('No block found to place against');
        return false;
      }
      
      const hitBlock = intersects[0].object;
      const normal = intersects[0].face.normal;
      
      const pos = hitBlock.position;
      
      const placeX = Math.floor(pos.x + normal.x);
      const placeY = Math.floor(pos.y + normal.y);
      const placeZ = Math.floor(pos.z + normal.z);
      
      // Validate placement coordinates
      if (placeX < 0 || placeX >= this.world.worldWidth || 
          placeY < 0 || placeY >= this.world.worldHeight || 
          placeZ < 0 || placeZ >= this.world.worldDepth) {
        console.log('Block placement out of world bounds');
        return false;
      }
      
      // Determine block type dynamically
      let blockType = 'grass';
      if (placeY <= 5) {
        blockType = 'cobblestone';
      }
      
      // Attempt to place block
      const placementSuccess = this.world.placeBlock(placeX, placeY, placeZ, blockType);
      
      if (placementSuccess) {
        this.lastPlaceTime = currentTime;
        console.log(`Block placed at ${placeX}, ${placeY}, ${placeZ}`);
        return true;
      } else {
        console.log('Block placement blocked');
        return false;
      }
    } catch (error) {
      console.error('Critical error during block placement:', error);
      return false;
    }
  }

  handleMouseMove(event) {
    const smoothingFactor = 0.5;
    
    // UN-INVERT mouse movement for x (vertical) axis
    this.targetRotation.x -= event.movementY * this.mouseSensitivity * smoothingFactor;  
    this.targetRotation.y -= event.movementX * this.mouseSensitivity * smoothingFactor;
    
    // Maintain existing rotation constraints
    this.targetRotation.x = Math.max(this.minRotationX, Math.min(this.maxRotationX, this.targetRotation.x));
    
    this.targetRotation.y = ((this.targetRotation.y % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  }

  attemptJump() {
    const currentTime = performance.now() / 1000;  // Convert to seconds
    
    // Allow jump if grounded or very recently grounded
    if ((this.isGrounded || this.groundedTimer < this.groundedThreshold) && 
        (currentTime - this.lastJumpTime > 0.01)) {  // Very short cooldown
      this.verticalVelocity = this.jumpForce;
      this.isGrounded = false;
      this.isJumping = true;
      this.lastJumpTime = currentTime;
      this.groundedTimer = this.groundedThreshold + 1; // Ensure we can't jump again immediately
    }
  }

  checkCollision(position) {
    this.feet.copy(position).sub(this.cameraOffset);
    
    const blockX = Math.floor(this.feet.x);
    const blockY = Math.floor(this.feet.y);
    const blockZ = Math.floor(this.feet.z);
    
    const minX = Math.max(0, blockX - 1);
    const maxX = Math.min(256, blockX + 1);
    const minY = Math.max(0, blockY - 2);  
    const maxY = Math.min(64, blockY + 1);
    const minZ = Math.max(0, blockZ - 1);
    const maxZ = Math.min(256, blockZ + 1);
    
    let supportingBlockFound = false;
    
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
            
            // If block is below player's feet and provides horizontal support
            if (y < blockY && this.checkBoxCollision(playerBB, blockBB)) {
              supportingBlockFound = true;
            }
            
            // Collision check for all other blocks
            if (this.checkBoxCollision(playerBB, blockBB)) {
              return true;
            }
          }
        }
      }
    }
    
    // If no supporting block found directly below, check one block down
    if (!supportingBlockFound) {
      this.isGrounded = false;
    }
    
    return false;
  }

  checkBoxCollision(a, b) {
    return (a.minX <= b.maxX && a.maxX >= b.minX) &&
           (a.minY <= b.maxY && a.maxY >= b.minY) &&
           (a.minZ <= b.maxZ && a.maxZ >= b.minZ);
  }

  update(deltaTime) {
    // Reset jumping state when grounded
    if (this.isGrounded) {
      this.isJumping = false;
    }

    // Simplified ground state tracking 
    if (this.isGrounded) {
      this.groundedTimer += deltaTime;
    } else {
      this.groundedTimer = 0;
    }

    // Smooth rotation interpolation
    const rotationSpeed = 2; // Adjust for smoother camera movement
    
    // When arrow keys are held, gradually change rotation
    if (this.moveDirection.lookUp) {
      // Now looking up increases POSITIVE rotation (looks up)
      this.targetRotation.x = Math.min(this.maxRotationX, this.targetRotation.x + deltaTime * rotationSpeed);
    }
    if (this.moveDirection.lookDown) {
      // Now looking down increases NEGATIVE rotation (looks down)
      this.targetRotation.x = Math.max(this.minRotationX, this.targetRotation.x - deltaTime * rotationSpeed);
    }
    if (this.moveDirection.lookLeft) {
      this.targetRotation.y += deltaTime * rotationSpeed;
    }
    if (this.moveDirection.lookRight) {
      this.targetRotation.y -= deltaTime * rotationSpeed;
    }

    this.rotation.x += (this.targetRotation.x - this.rotation.x) * this.rotationLerpFactor;
    this.rotation.y += (this.targetRotation.y - this.rotation.y) * this.rotationLerpFactor;
    
    this.rotation.x = Math.max(this.minRotationX, Math.min(this.maxRotationX, this.rotation.x));
    
    this.direction.set(0, 0, 0);
    
    this.front.set(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
    this.right.set(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y)

    const smoothingFactor = 0.7;  
    
    if (this.moveDirection.forward) this.direction.add(this.front.clone().multiplyScalar(smoothingFactor));
    if (this.moveDirection.backward) this.direction.sub(this.front.clone().multiplyScalar(smoothingFactor));
    if (this.moveDirection.left) this.direction.sub(this.right.clone().multiplyScalar(smoothingFactor));
    if (this.moveDirection.right) this.direction.add(this.right.clone().multiplyScalar(smoothingFactor));

    // Modify ground detection to allow falling into small gaps
    if (!this.isGrounded) {
      // Set vertical velocity to continue falling if no support block found
      this.verticalVelocity -= this.gravity * deltaTime;
    }

    let newPosition = this.camera.position.clone().sub(this.cameraOffset);
    
    if (this.direction.lengthSq() > 0) {
      this.direction.normalize().multiplyScalar(this.speed * deltaTime);
      newPosition.x += this.direction.x;
      newPosition.z += this.direction.z;
    }
    
    newPosition.y += this.verticalVelocity * deltaTime;
    
    const floorY = 0; 
    if (newPosition.y <= floorY + this.eyeLevel) {
      newPosition.y = floorY + this.eyeLevel;
      this.verticalVelocity = 0;
      this.isGrounded = true;
    }
    
    const cameraPosition = newPosition.clone().add(this.cameraOffset);
    
    // Improved collision handling
    if (!this.checkCollision(cameraPosition)) {
      this.camera.position.copy(cameraPosition);
    } else {
      const horizontalOnlyPosition = this.camera.position.clone();
      
      // Try horizontal movement separately
      horizontalOnlyPosition.x = cameraPosition.x;
      horizontalOnlyPosition.z = cameraPosition.z;
      
      if (!this.checkCollision(horizontalOnlyPosition)) {
        this.camera.position.x = cameraPosition.x;
        this.camera.position.z = cameraPosition.z;
      }
      
      // Vertical collision handling
      const verticalOnlyPosition = this.camera.position.clone();
      verticalOnlyPosition.y = cameraPosition.y;
      
      if (!this.checkCollision(verticalOnlyPosition)) {
        this.camera.position.y = cameraPosition.y;
      }
    }

    this.camera.rotation.x = this.rotation.x;
    this.camera.rotation.y = this.rotation.y;
    this.camera.rotation.z = 0; 
  }

  teleportToRandomLocation() {
    const worldWidth = 256;
    const worldDepth = 256;
    const maxHeight = 100; 

    const randomX = Math.floor(Math.random() * worldWidth);
    const randomZ = Math.floor(Math.random() * worldDepth);
    const randomY = Math.floor(Math.random() * maxHeight) + 50; 

    this.camera.position.set(randomX, randomY, randomZ);
    this.verticalVelocity = 0;
    this.isGrounded = false;
  }
}