import * as THREE from 'three';

/**
 * Player - First-person controller with physics
 */
export class Player {
  constructor(scene, camera, inputManager) {
    this.scene = scene;
    this.camera = camera;
    this.input = inputManager;
    
    // Player stats
    this.health = 100;
    this.maxHealth = 100;
    this.isDead = false;
    
    // Movement settings
    this.walkSpeed = 8;
    this.sprintSpeed = 14;
    this.jumpForce = 10;
    this.gravity = 25;
    
    // Physics state
    this.velocity = new THREE.Vector3();
    this.onGround = true;
    this.height = 1.8;
    this.radius = 0.4;
    
    // Camera rotation limits
    this.pitchLimit = Math.PI / 2 - 0.1;
    this.pitch = 0;
    this.yaw = 0;
    
    // Player collision body (for raycasting)
    this.position = new THREE.Vector3(0, this.height, 0);
    
    // Damage cooldown
    this.lastDamageTime = 0;
    this.damageCooldown = 500; // ms between damage
    
    this.init();
  }
  
  init() {
    // Position camera at player start
    this.camera.position.copy(this.position);
    this.camera.rotation.order = 'YXZ';
  }
  
  update(deltaTime) {
    if (this.isDead) return;
    
    // Get mouse input for look
    const mouseDelta = this.input.getMouseDelta();
    
    if (this.input.isPointerLocked()) {
      // Rotate camera
      this.yaw -= mouseDelta.dx;
      this.pitch -= mouseDelta.dy;
      
      // Clamp pitch
      this.pitch = Math.max(-this.pitchLimit, Math.min(this.pitchLimit, this.pitch));
      
      // Apply rotation
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
    }
    
    // Get movement input
    const movement = this.input.getMovementVector();
    const speed = this.input.isSprinting() ? this.sprintSpeed : this.walkSpeed;
    
    // Calculate movement direction (relative to camera yaw)
    const moveDir = new THREE.Vector3();
    
    // Forward/backward
    moveDir.z = -movement.forward;
    // Left/right
    moveDir.x = movement.right;
    
    // Normalize if moving diagonally
    if (moveDir.length() > 0) {
      moveDir.normalize();
    }
    
    // Rotate movement direction by camera yaw
    moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    
    // Apply movement
    this.velocity.x = moveDir.x * speed;
    this.velocity.z = moveDir.z * speed;
    
    // Jumping
    if (this.input.isJumping() && this.onGround) {
      this.velocity.y = this.jumpForce;
      this.onGround = false;
    }
    
    // Apply gravity
    if (!this.onGround) {
      this.velocity.y -= this.gravity * deltaTime;
    }
    
    // Update position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
    
    // Simple ground check (y = 0 is ground level + player height)
    if (this.position.y < this.height) {
      this.position.y = this.height;
      this.velocity.y = 0;
      this.onGround = true;
    }
    
    // Keep player in bounds (simple arena bounds)
    const bounds = 45;
    this.position.x = Math.max(-bounds, Math.min(bounds, this.position.x));
    this.position.z = Math.max(-bounds, Math.min(bounds, this.position.z));
    
    // Update camera position
    this.camera.position.copy(this.position);
    
    // Add subtle head bob when walking
    if (movement.forward !== 0 || movement.right !== 0) {
      const bobAmount = this.input.isSprinting() ? 0.08 : 0.04;
      const bobSpeed = this.input.isSprinting() ? 12 : 8;
      this.camera.position.y += Math.sin(performance.now() * 0.001 * bobSpeed) * bobAmount;
    }
  }
  
  takeDamage(amount) {
    const now = performance.now();
    if (now - this.lastDamageTime < this.damageCooldown) return false;
    
    this.lastDamageTime = now;
    this.health = Math.max(0, this.health - amount);
    
    // Show damage flash
    const flash = document.getElementById('damage-flash');
    if (flash) {
      flash.style.opacity = '1';
      setTimeout(() => {
        flash.style.opacity = '0';
      }, 100);
    }
    
    if (this.health <= 0) {
      this.isDead = true;
    }
    
    return true;
  }
  
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }
  
  getPosition() {
    return this.position.clone();
  }
  
  getDirection() {
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(this.camera.quaternion);
    return dir;
  }
  
  reset() {
    this.health = this.maxHealth;
    this.isDead = false;
    this.position.set(0, this.height, 0);
    this.velocity.set(0, 0, 0);
    this.pitch = 0;
    this.yaw = 0;
    this.camera.rotation.set(0, 0, 0);
  }
}

