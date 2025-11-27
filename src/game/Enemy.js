import * as THREE from 'three';

/**
 * Enemy - Basic hostile that chases and attacks the player
 */
export class Enemy {
  constructor(scene, position, type = 'grunt') {
    this.scene = scene;
    this.type = type;
    
    // Stats based on type
    const stats = this.getStats(type);
    this.health = stats.health;
    this.maxHealth = stats.health;
    this.speed = stats.speed;
    this.damage = stats.damage;
    this.attackRange = stats.attackRange;
    this.attackCooldown = stats.attackCooldown;
    this.scoreValue = stats.scoreValue;
    
    // State
    this.isDead = false;
    this.lastAttackTime = 0;
    this.isAttacking = false;
    
    // Physics
    this.position = position.clone();
    this.velocity = new THREE.Vector3();
    this.radius = 0.5;
    this.height = 1.8;
    
    // Mesh
    this.mesh = null;
    this.healthBar = null;
    
    // Animation state
    this.animTime = Math.random() * Math.PI * 2;
    
    this.init();
  }
  
  getStats(type) {
    switch (type) {
      case 'grunt':
        return {
          health: 50,
          speed: 4,
          damage: 10,
          attackRange: 2,
          attackCooldown: 1000,
          scoreValue: 100
        };
      case 'runner':
        return {
          health: 30,
          speed: 8,
          damage: 5,
          attackRange: 1.5,
          attackCooldown: 500,
          scoreValue: 150
        };
      case 'tank':
        return {
          health: 150,
          speed: 2,
          damage: 25,
          attackRange: 2.5,
          attackCooldown: 2000,
          scoreValue: 300
        };
      case 'boss':
        return {
          health: 500,
          speed: 3,
          damage: 40,
          attackRange: 3,
          attackCooldown: 1500,
          scoreValue: 1000
        };
      default:
        return {
          health: 50,
          speed: 4,
          damage: 10,
          attackRange: 2,
          attackCooldown: 1000,
          scoreValue: 100
        };
    }
  }
  
  init() {
    // Create enemy mesh
    const group = new THREE.Group();
    
    // Body color based on type
    let bodyColor = 0x884422;
    let scale = 1;
    
    switch (this.type) {
      case 'grunt':
        bodyColor = 0x664433;
        break;
      case 'runner':
        bodyColor = 0x886644;
        scale = 0.8;
        break;
      case 'tank':
        bodyColor = 0x443322;
        scale = 1.3;
        break;
      case 'boss':
        bodyColor = 0x220000;
        scale = 2;
        break;
    }
    
    // Body (cylinder)
    const bodyGeom = new THREE.CylinderGeometry(0.35 * scale, 0.4 * scale, 1.4 * scale, 8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.8,
      metalness: 0.1
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.7 * scale;
    body.castShadow = true;
    group.add(body);
    
    // Head
    const headGeom = new THREE.SphereGeometry(0.25 * scale, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xcc9966,
      roughness: 0.7
    });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.55 * scale;
    head.castShadow = true;
    group.add(head);
    this.head = head;
    
    // Eyes (menacing red glow)
    const eyeGeom = new THREE.SphereGeometry(0.05 * scale, 6, 6);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-0.1 * scale, 1.58 * scale, 0.2 * scale);
    group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(0.1 * scale, 1.58 * scale, 0.2 * scale);
    group.add(rightEye);
    
    // Arms
    const armGeom = new THREE.CylinderGeometry(0.08 * scale, 0.1 * scale, 0.8 * scale, 6);
    const armMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.8
    });
    
    const leftArm = new THREE.Mesh(armGeom, armMat);
    leftArm.position.set(-0.45 * scale, 0.9 * scale, 0);
    leftArm.rotation.z = 0.3;
    leftArm.castShadow = true;
    group.add(leftArm);
    this.leftArm = leftArm;
    
    const rightArm = new THREE.Mesh(armGeom, armMat);
    rightArm.position.set(0.45 * scale, 0.9 * scale, 0);
    rightArm.rotation.z = -0.3;
    rightArm.castShadow = true;
    group.add(rightArm);
    this.rightArm = rightArm;
    
    // Health bar
    const healthBg = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x333333 })
    );
    healthBg.position.y = 2 * scale;
    group.add(healthBg);
    
    const healthFg = new THREE.Mesh(
      new THREE.PlaneGeometry(0.98, 0.08),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    healthFg.position.y = 2 * scale;
    healthFg.position.z = 0.01;
    group.add(healthFg);
    this.healthBar = healthFg;
    this.healthBg = healthBg;
    
    // Position the group
    group.position.copy(this.position);
    
    this.mesh = group;
    this.scene.add(group);
  }
  
  update(deltaTime, playerPosition) {
    if (this.isDead) return;
    
    // Calculate direction to player
    const toPlayer = new THREE.Vector3();
    toPlayer.subVectors(playerPosition, this.position);
    toPlayer.y = 0; // Keep on ground plane
    
    const distanceToPlayer = toPlayer.length();
    
    // Animation
    this.animTime += deltaTime * 8;
    
    // Check if in attack range
    if (distanceToPlayer <= this.attackRange) {
      this.isAttacking = true;
      // Attack animation (arms reach forward)
      if (this.leftArm) {
        this.leftArm.rotation.x = Math.sin(this.animTime * 2) * 0.5 - 0.3;
      }
      if (this.rightArm) {
        this.rightArm.rotation.x = Math.sin(this.animTime * 2 + Math.PI) * 0.5 - 0.3;
      }
    } else {
      this.isAttacking = false;
      
      // Move toward player
      if (distanceToPlayer > 0.1) {
        toPlayer.normalize();
        
        this.velocity.x = toPlayer.x * this.speed;
        this.velocity.z = toPlayer.z * this.speed;
        
        // Update position
        this.position.x += this.velocity.x * deltaTime;
        this.position.z += this.velocity.z * deltaTime;
        
        // Face player
        const angle = Math.atan2(toPlayer.x, toPlayer.z);
        this.mesh.rotation.y = angle;
        
        // Walking animation
        if (this.leftArm) {
          this.leftArm.rotation.x = Math.sin(this.animTime) * 0.5;
        }
        if (this.rightArm) {
          this.rightArm.rotation.x = Math.sin(this.animTime + Math.PI) * 0.5;
        }
        
        // Bob up and down slightly
        this.mesh.position.y = Math.abs(Math.sin(this.animTime)) * 0.1;
      }
    }
    
    // Update mesh position
    this.mesh.position.x = this.position.x;
    this.mesh.position.z = this.position.z;
    
    // Make health bar face camera (billboard)
    if (this.healthBg) {
      this.healthBg.lookAt(playerPosition.x, this.healthBg.position.y + this.position.y, playerPosition.z);
      this.healthBar.lookAt(playerPosition.x, this.healthBar.position.y + this.position.y, playerPosition.z);
    }
  }
  
  canAttack() {
    if (!this.isAttacking) return false;
    
    const now = performance.now();
    if (now - this.lastAttackTime >= this.attackCooldown) {
      this.lastAttackTime = now;
      return true;
    }
    return false;
  }
  
  takeDamage(amount) {
    if (this.isDead) return false;
    
    this.health -= amount;
    
    // Update health bar
    if (this.healthBar) {
      const healthPercent = Math.max(0, this.health / this.maxHealth);
      this.healthBar.scale.x = healthPercent;
      this.healthBar.position.x = (1 - healthPercent) * -0.5;
    }
    
    // Flash red on hit
    this.mesh.traverse((child) => {
      if (child.isMesh && child.material.color) {
        const originalColor = child.material.color.getHex();
        child.material.color.setHex(0xff0000);
        setTimeout(() => {
          child.material.color.setHex(originalColor);
        }, 100);
      }
    });
    
    if (this.health <= 0) {
      this.die();
      return true; // Enemy died
    }
    
    return false;
  }
  
  die() {
    this.isDead = true;
    
    // Death animation - fall over and fade
    const fallDuration = 500;
    const startTime = performance.now();
    
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / fallDuration, 1);
      
      // Fall over
      this.mesh.rotation.x = progress * Math.PI / 2;
      this.mesh.position.y = Math.max(0, 1 - progress) * 0.5;
      
      // Fade out
      this.mesh.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.transparent = true;
          child.material.opacity = 1 - progress;
        }
      });
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Remove from scene
        this.scene.remove(this.mesh);
      }
    };
    
    animate();
  }
  
  getPosition() {
    return this.position.clone();
  }
  
  getBoundingBox() {
    return new THREE.Box3().setFromCenterAndSize(
      this.position,
      new THREE.Vector3(this.radius * 2, this.height, this.radius * 2)
    );
  }
  
  /**
   * Reset enemy for object pooling
   * Reference: GAME_DEV_CONTEXT.md - Object Pooling Pattern
   */
  reset(position, type = 'grunt') {
    this.type = type;
    
    // Reset stats
    const stats = this.getStats(type);
    this.health = stats.health;
    this.maxHealth = stats.health;
    this.speed = stats.speed;
    this.damage = stats.damage;
    this.attackRange = stats.attackRange;
    this.attackCooldown = stats.attackCooldown;
    this.scoreValue = stats.scoreValue;
    
    // Reset state
    this.isDead = false;
    this.lastAttackTime = 0;
    this.isAttacking = false;
    
    // Reset position
    this.position.copy(position);
    this.velocity.set(0, 0, 0);
    
    // Reset animation
    this.animTime = Math.random() * Math.PI * 2;
    
    // Reset mesh if it exists
    if (this.mesh) {
      this.mesh.position.copy(position);
      this.mesh.rotation.x = 0;
      this.mesh.position.y = 0;
      this.mesh.visible = true;
      
      // Reset materials opacity
      this.mesh.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.transparent = false;
          child.material.opacity = 1;
        }
      });
      
      // Reset health bar
      if (this.healthBar) {
        this.healthBar.scale.x = 1;
        this.healthBar.position.x = 0;
      }
      
      // Add back to scene if removed
      if (!this.mesh.parent) {
        this.scene.add(this.mesh);
      }
    } else {
      // First time - create mesh
      this.init();
    }
  }
}

