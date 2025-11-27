/**
 * InputManager - Handles all keyboard and mouse input
 */
export class InputManager {
  constructor() {
    this.keys = {};
    this.mouse = {
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      leftButton: false,
      rightButton: false,
      locked: false
    };
    
    this.sensitivity = 0.002;
    this.onShoot = null;
    this.onReload = null;
    
    this.init();
  }
  
  init() {
    // Keyboard events
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      
      if (e.code === 'KeyR' && this.onReload) {
        this.onReload();
      }
    });
    
    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
    
    // Mouse move (only when pointer is locked)
    document.addEventListener('mousemove', (e) => {
      if (this.mouse.locked) {
        this.mouse.dx = e.movementX * this.sensitivity;
        this.mouse.dy = e.movementY * this.sensitivity;
      }
    });
    
    // Mouse buttons
    document.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouse.leftButton = true;
        if (this.mouse.locked && this.onShoot) {
          this.onShoot();
        }
      }
      if (e.button === 2) {
        this.mouse.rightButton = true;
      }
    });
    
    document.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.leftButton = false;
      if (e.button === 2) this.mouse.rightButton = false;
    });
    
    // Pointer lock change
    document.addEventListener('pointerlockchange', () => {
      this.mouse.locked = document.pointerLockElement !== null;
    });
    
    // Prevent context menu
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  // Request pointer lock (call this on user interaction)
  requestPointerLock(element) {
    element.requestPointerLock();
  }
  
  // Check if a key is currently pressed
  isKeyDown(code) {
    return this.keys[code] === true;
  }
  
  // Get movement vector based on WASD
  getMovementVector() {
    let forward = 0;
    let right = 0;
    
    if (this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp')) forward += 1;
    if (this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown')) forward -= 1;
    if (this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft')) right -= 1;
    if (this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) right += 1;
    
    return { forward, right };
  }
  
  // Check if sprinting
  isSprinting() {
    return this.isKeyDown('ShiftLeft') || this.isKeyDown('ShiftRight');
  }
  
  // Check if jumping
  isJumping() {
    return this.isKeyDown('Space');
  }
  
  // Get mouse delta and reset it
  getMouseDelta() {
    const dx = this.mouse.dx;
    const dy = this.mouse.dy;
    this.mouse.dx = 0;
    this.mouse.dy = 0;
    return { dx, dy };
  }
  
  // Check if pointer is locked
  isPointerLocked() {
    return this.mouse.locked;
  }
}

