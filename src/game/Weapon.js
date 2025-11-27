import * as THREE from 'three';

/**
 * Weapon - Pistol with shooting, reloading, and visual effects
 */
export class Weapon {
  constructor(scene, camera, player) {
    this.scene = scene;
    this.camera = camera;
    this.player = player;
    
    // Weapon stats
    this.damage = 25;
    this.range = 100;
    this.fireRate = 0.2; // seconds between shots
    this.lastFireTime = 0;
    
    // Ammo
    this.ammo = 12;
    this.maxAmmo = 12;
    this.reserveAmmo = 60;
    this.isReloading = false;
    this.reloadTime = 1.5; // seconds
    
    // Visual
    this.weaponModel = null;
    this.muzzleFlash = null;
    
    // Recoil
    this.recoilAmount = 0;
    this.recoilRecovery = 5;
    
    // Hit effect
    this.hitMarkers = [];
    
    // Raycaster for shooting
    this.raycaster = new THREE.Raycaster();
    
    // Callbacks
    this.onHit = null; // Called when hitting an enemy
    
    this.init();
  }
  
  init() {
    // Create a simple pistol model (attached to camera)
    const weaponGroup = new THREE.Group();
    
    // Pistol body
    const bodyGeom = new THREE.BoxGeometry(0.08, 0.15, 0.3);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.3
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.set(0, -0.05, 0);
    weaponGroup.add(body);
    
    // Barrel
    const barrelGeom = new THREE.BoxGeometry(0.05, 0.05, 0.25);
    const barrelMat = new THREE.MeshStandardMaterial({ 
      color: 0x222222,
      metalness: 0.9,
      roughness: 0.2
    });
    const barrel = new THREE.Mesh(barrelGeom, barrelMat);
    barrel.position.set(0, 0.02, -0.2);
    weaponGroup.add(barrel);
    
    // Grip
    const gripGeom = new THREE.BoxGeometry(0.06, 0.12, 0.08);
    const gripMat = new THREE.MeshStandardMaterial({ 
      color: 0x4a3728,
      metalness: 0.1,
      roughness: 0.8
    });
    const grip = new THREE.Mesh(gripGeom, gripMat);
    grip.position.set(0, -0.12, 0.05);
    grip.rotation.x = 0.2;
    weaponGroup.add(grip);
    
    // Slide
    const slideGeom = new THREE.BoxGeometry(0.06, 0.06, 0.28);
    const slideMat = new THREE.MeshStandardMaterial({ 
      color: 0x444444,
      metalness: 0.85,
      roughness: 0.25
    });
    const slide = new THREE.Mesh(slideGeom, slideMat);
    slide.position.set(0, 0.04, -0.05);
    weaponGroup.add(slide);
    this.slide = slide;
    
    // Position weapon in view
    weaponGroup.position.set(0.25, -0.2, -0.4);
    weaponGroup.rotation.y = 0.05;
    
    this.weaponModel = weaponGroup;
    this.camera.add(weaponGroup);
    
    // Create bullet tracer line (reusable)
    const tracerGeom = new THREE.BufferGeometry();
    const tracerMat = new THREE.LineBasicMaterial({ 
      color: 0xffff00, 
      transparent: true,
      opacity: 0.6
    });
    this.tracerLine = new THREE.Line(tracerGeom, tracerMat);
    this.tracerLine.visible = false;
    this.scene.add(this.tracerLine);
  }
  
  update(deltaTime) {
    // Recover from recoil
    if (this.recoilAmount > 0) {
      this.recoilAmount -= this.recoilRecovery * deltaTime;
      if (this.recoilAmount < 0) this.recoilAmount = 0;
    }
    
    // Animate weapon position with recoil
    if (this.weaponModel) {
      const targetZ = -0.4 + this.recoilAmount * 0.1;
      const targetRotX = this.recoilAmount * 0.2;
      
      this.weaponModel.position.z += (targetZ - this.weaponModel.position.z) * 10 * deltaTime;
      this.weaponModel.rotation.x += (targetRotX - this.weaponModel.rotation.x) * 10 * deltaTime;
    }
    
    // Update hit markers
    for (let i = this.hitMarkers.length - 1; i >= 0; i--) {
      const marker = this.hitMarkers[i];
      marker.life -= deltaTime;
      
      if (marker.life <= 0) {
        this.scene.remove(marker.mesh);
        this.hitMarkers.splice(i, 1);
      } else {
        // Fade out
        marker.mesh.material.opacity = marker.life / marker.maxLife;
      }
    }
  }
  
  shoot() {
    const now = performance.now() / 1000;
    
    // Check fire rate
    if (now - this.lastFireTime < this.fireRate) return false;
    
    // Check ammo
    if (this.ammo <= 0 || this.isReloading) return false;
    
    this.lastFireTime = now;
    this.ammo--;
    
    // Apply recoil
    this.recoilAmount = 1;
    
    // Animate slide
    if (this.slide) {
      this.slide.position.z = 0.1;
      setTimeout(() => {
        if (this.slide) this.slide.position.z = -0.05;
      }, 50);
    }
    
    // Show muzzle flash
    this.showMuzzleFlash();
    
    // Perform raycast from camera center
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    
    // Get origin and direction
    const origin = this.player.getPosition();
    const direction = this.player.getDirection();
    
    // Check for hits (will be handled by Game class)
    const hitResult = {
      origin: origin,
      direction: direction,
      raycaster: this.raycaster
    };
    
    // Update HUD
    this.updateAmmoDisplay();
    
    return hitResult;
  }
  
  showMuzzleFlash() {
    const flash = document.getElementById('muzzle-flash');
    if (flash) {
      flash.style.opacity = '1';
      setTimeout(() => {
        flash.style.opacity = '0';
      }, 50);
    }
  }
  
  createHitMarker(position) {
    // Create a small burst effect at hit point
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 1
    });
    const marker = new THREE.Mesh(geometry, material);
    marker.position.copy(position);
    this.scene.add(marker);
    
    this.hitMarkers.push({
      mesh: marker,
      life: 0.3,
      maxLife: 0.3
    });
  }
  
  reload() {
    if (this.isReloading || this.ammo === this.maxAmmo || this.reserveAmmo <= 0) return;
    
    this.isReloading = true;
    
    // Calculate ammo to reload
    const needed = this.maxAmmo - this.ammo;
    const available = Math.min(needed, this.reserveAmmo);
    
    setTimeout(() => {
      this.ammo += available;
      this.reserveAmmo -= available;
      this.isReloading = false;
      this.updateAmmoDisplay();
    }, this.reloadTime * 1000);
  }
  
  updateAmmoDisplay() {
    const ammoText = document.getElementById('ammo-text');
    if (ammoText) {
      ammoText.innerHTML = `${this.ammo} <span>/ ${this.maxAmmo}</span>`;
    }
  }
  
  reset() {
    this.ammo = this.maxAmmo;
    this.reserveAmmo = 60;
    this.isReloading = false;
    this.recoilAmount = 0;
    this.updateAmmoDisplay();
  }
}

