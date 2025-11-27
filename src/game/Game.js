import * as THREE from 'three';
import { Player } from './Player.js';
import { Weapon } from './Weapon.js';
import { Enemy } from './Enemy.js';
import { World } from './World.js';
import { InputManager } from '../utils/InputManager.js';
import { HUD } from '../ui/HUD.js';

/**
 * Game - Main game controller
 */
export class Game {
  constructor(container) {
    this.container = container;
    
    // Game state
    this.isRunning = false;
    this.isPaused = false;
    this.gameTime = 30; // Survival time in seconds
    this.currentTime = 0;
    this.kills = 0;
    this.score = 0;
    this.level = 1;
    
    // Betting
    this.betAmount = 1;
    this.winMultiplier = 3;
    
    // Enemies
    this.enemies = [];
    this.maxEnemies = 8;
    this.spawnInterval = 3; // seconds
    this.lastSpawnTime = 0;
    this.enemiesKilledThisWave = 0;
    this.waveSize = 5;
    
    // Three.js
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    
    // Game objects
    this.player = null;
    this.weapon = null;
    this.world = null;
    this.input = null;
    this.hud = null;
    
    // Timing
    this.clock = new THREE.Clock();
    this.lastTime = 0;
    
    this.init();
  }
  
  init() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xd4a574, 0.015);
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);
    
    // Create input manager
    this.input = new InputManager();
    
    // Create HUD
    this.hud = new HUD();
    this.hud.showStartScreen();
    
    // Setup event handlers
    this.setupEventHandlers();
    
    // Create world
    this.world = new World(this.scene);
    
    // Create player
    this.player = new Player(this.scene, this.camera, this.input);
    
    // Create weapon
    this.weapon = new Weapon(this.scene, this.camera, this.player);
    this.input.onShoot = () => this.handleShoot();
    this.input.onReload = () => this.weapon.reload();
    
    // Handle window resize
    window.addEventListener('resize', () => this.onResize());
    
    // Start render loop (but game doesn't start until player clicks)
    this.animate();
  }
  
  setupEventHandlers() {
    // Start button
    this.hud.onStartClick(() => {
      this.startGame();
    });
    
    // Restart button
    this.hud.onRestartClick(() => {
      this.restartGame();
    });
  }
  
  startGame() {
    // Request pointer lock
    this.input.requestPointerLock(this.renderer.domElement);
    
    // Hide start screen
    this.hud.hideStartScreen();
    
    // Reset game state
    this.resetGame();
    
    // Start the game
    this.isRunning = true;
    this.clock.start();
    
    // Spawn initial enemies
    this.spawnWave();
  }
  
  restartGame() {
    // Hide game over
    this.hud.hideGameOver();
    
    // Request pointer lock
    this.input.requestPointerLock(this.renderer.domElement);
    
    // Reset and start
    this.resetGame();
    this.isRunning = true;
    this.clock.start();
    this.spawnWave();
  }
  
  resetGame() {
    // Reset state
    this.currentTime = 0;
    this.kills = 0;
    this.score = 0;
    this.level = 1;
    this.enemiesKilledThisWave = 0;
    
    // Reset player
    this.player.reset();
    
    // Reset weapon
    this.weapon.reset();
    
    // Remove all enemies
    this.enemies.forEach(enemy => {
      this.scene.remove(enemy.mesh);
    });
    this.enemies = [];
    
    // Reset HUD
    this.hud.reset();
  }
  
  spawnWave() {
    const spawnPoints = this.world.getSpawnPoints();
    const count = Math.min(this.waveSize + this.level - 1, this.maxEnemies - this.enemies.length);
    
    for (let i = 0; i < count; i++) {
      // Random spawn point
      const spawnIndex = Math.floor(Math.random() * spawnPoints.length);
      const spawnPoint = spawnPoints[spawnIndex].clone();
      
      // Add some randomness to position
      spawnPoint.x += (Math.random() - 0.5) * 5;
      spawnPoint.z += (Math.random() - 0.5) * 5;
      
      // Determine enemy type based on level and randomness
      let type = 'grunt';
      const roll = Math.random();
      
      if (this.level >= 3 && roll > 0.9) {
        type = 'tank';
      } else if (this.level >= 2 && roll > 0.7) {
        type = 'runner';
      }
      
      // Create enemy
      const enemy = new Enemy(this.scene, spawnPoint, type);
      this.enemies.push(enemy);
    }
  }
  
  spawnEnemy() {
    if (this.enemies.length >= this.maxEnemies) return;
    
    const spawnPoints = this.world.getSpawnPoints();
    const spawnIndex = Math.floor(Math.random() * spawnPoints.length);
    const spawnPoint = spawnPoints[spawnIndex].clone();
    
    spawnPoint.x += (Math.random() - 0.5) * 5;
    spawnPoint.z += (Math.random() - 0.5) * 5;
    
    let type = 'grunt';
    const roll = Math.random();
    if (this.level >= 3 && roll > 0.9) {
      type = 'tank';
    } else if (this.level >= 2 && roll > 0.7) {
      type = 'runner';
    }
    
    const enemy = new Enemy(this.scene, spawnPoint, type);
    this.enemies.push(enemy);
  }
  
  handleShoot() {
    const hitResult = this.weapon.shoot();
    if (!hitResult) return;
    
    // Check if we hit any enemies
    const raycaster = hitResult.raycaster;
    
    // Get all enemy meshes
    const enemyMeshes = this.enemies
      .filter(e => !e.isDead)
      .map(e => e.mesh);
    
    const intersects = raycaster.intersectObjects(enemyMeshes, true);
    
    if (intersects.length > 0) {
      // Find which enemy was hit
      const hitMesh = intersects[0].object;
      
      for (const enemy of this.enemies) {
        if (enemy.isDead) continue;
        
        // Check if this enemy's mesh or any of its children was hit
        let isThisEnemy = false;
        enemy.mesh.traverse((child) => {
          if (child === hitMesh) isThisEnemy = true;
        });
        
        if (isThisEnemy) {
          // Hit marker at impact point
          this.weapon.createHitMarker(intersects[0].point);
          
          // Apply damage
          const killed = enemy.takeDamage(this.weapon.damage);
          
          if (killed) {
            this.kills++;
            this.score += enemy.scoreValue;
            this.enemiesKilledThisWave++;
            
            // Update HUD
            this.hud.updateKills(this.kills);
            this.hud.updateScore(this.score);
            
            // Spawn replacement enemy after delay
            setTimeout(() => {
              if (this.isRunning) {
                this.spawnEnemy();
              }
            }, 2000);
          }
          
          break;
        }
      }
    }
  }
  
  update(deltaTime) {
    if (!this.isRunning) return;
    
    // Update game time
    this.currentTime += deltaTime;
    const timeRemaining = Math.max(0, this.gameTime - this.currentTime);
    this.hud.updateTimer(timeRemaining);
    
    // Check win condition
    if (timeRemaining <= 0) {
      this.victory();
      return;
    }
    
    // Update player
    this.player.update(deltaTime);
    
    // Check trap collisions
    const trapDamage = this.world.checkTrapCollision(this.player.getPosition());
    if (trapDamage > 0) {
      this.player.takeDamage(trapDamage);
    }
    
    // Check if player died
    if (this.player.isDead) {
      this.gameOver();
      return;
    }
    
    // Update health HUD
    this.hud.updateHealth(this.player.health, this.player.maxHealth);
    
    // Update weapon
    this.weapon.update(deltaTime);
    
    // Update enemies
    const playerPos = this.player.getPosition();
    
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      if (enemy.isDead) {
        // Remove dead enemies after animation
        continue;
      }
      
      enemy.update(deltaTime, playerPos);
      
      // Check if enemy can attack player
      if (enemy.canAttack()) {
        this.player.takeDamage(enemy.damage);
      }
    }
    
    // Clean up dead enemies
    this.enemies = this.enemies.filter(e => !e.isDead || e.mesh.parent);
    
    // Spawn new enemies periodically
    if (this.currentTime - this.lastSpawnTime > this.spawnInterval) {
      if (this.enemies.length < this.maxEnemies / 2) {
        this.spawnEnemy();
      }
      this.lastSpawnTime = this.currentTime;
    }
    
    // Update world
    this.world.update(deltaTime);
  }
  
  victory() {
    this.isRunning = false;
    
    const winnings = this.betAmount * this.winMultiplier;
    
    this.hud.showGameOver(true, this.kills, this.score, winnings);
    
    // Exit pointer lock
    document.exitPointerLock();
  }
  
  gameOver() {
    this.isRunning = false;
    
    this.hud.showGameOver(false, this.kills, this.score, -this.betAmount);
    
    // Exit pointer lock
    document.exitPointerLock();
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    const deltaTime = this.clock.getDelta();
    
    // Cap delta time to prevent huge jumps
    const cappedDelta = Math.min(deltaTime, 0.1);
    
    // Update game logic
    this.update(cappedDelta);
    
    // Render
    this.renderer.render(this.scene, this.camera);
  }
  
  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  }
}

