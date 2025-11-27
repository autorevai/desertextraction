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
      
      // Space = Shoot
      if (e.code === 'Space' && this.onShoot) {
        this.onShoot();
        e.preventDefault(); // Prevent page scroll
      }
      
      // Enter = Reload
      if (e.code === 'Enter' && this.onReload) {
        this.onReload();
      }
    });
    
    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
    
    // Mouse move for aiming (only when pointer is locked)
    document.addEventListener('mousemove', (e) => {
      if (this.mouse.locked) {
        this.mouse.dx = e.movementX * this.sensitivity;
        this.mouse.dy = e.movementY * this.sensitivity;
      }
    });
    
    // Mouse buttons (kept for future use, but not shooting)
    document.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouse.leftButton = true;
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
  
  // Get movement vector based on Arrow Keys (WASD still works as backup)
  getMovementVector() {
    let forward = 0;
    let right = 0;
    
    // Primary: Arrow keys
    if (this.isKeyDown('ArrowUp')) forward += 1;
    if (this.isKeyDown('ArrowDown')) forward -= 1;
    if (this.isKeyDown('ArrowLeft')) right -= 1;
    if (this.isKeyDown('ArrowRight')) right += 1;
    
    // Backup: WASD still works
    if (this.isKeyDown('KeyW')) forward += 1;
    if (this.isKeyDown('KeyS')) forward -= 1;
    if (this.isKeyDown('KeyA')) right -= 1;
    if (this.isKeyDown('KeyD')) right += 1;
    
    return { forward, right };
  }
  
  // Check if sprinting (Shift key)
  isSprinting() {
    return this.isKeyDown('ShiftLeft') || this.isKeyDown('ShiftRight');
  }
  
  // Check if jumping (J key, since Space is now shoot)
  isJumping() {
    return this.isKeyDown('KeyJ');
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

