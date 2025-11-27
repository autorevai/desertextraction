import * as THREE from 'three';
import { Player } from './Player.js';
import { Weapon } from './Weapon.js';
import { Enemy } from './Enemy.js';
import { World } from './World.js';
import { InputManager } from '../utils/InputManager.js';
import { HUD } from '../ui/HUD.js';
import { GameState, GameStateMachine } from './GameStates.js';
import { ObjectPool } from './ObjectPool.js';
import { EventSystem, GameEvents } from './EventSystem.js';

/**
 * Game - Main game controller
 */
export class Game {
  constructor(container) {
    this.container = container;
    
    // Core Systems (Reference: GAME_DEV_CONTEXT.md)
    this.stateMachine = new GameStateMachine();
    this.events = new EventSystem();
    
    // Game state
    this.isRunning = false;
    this.isPaused = false;
    this.currentTime = 0;
    this.kills = 0;
    this.score = 0;
    this.level = 1;
    
    // Level configuration
    this.levelConfig = {
      1: { enemyCount: 8, enemyTypes: ['grunt'] },
      2: { enemyCount: 12, enemyTypes: ['grunt', 'runner'] },
      3: { enemyCount: 15, enemyTypes: ['grunt', 'runner', 'tank'] }
    };
    
    // Enemy management with Object Pooling
    this.totalEnemiesToSpawn = this.levelConfig[this.level].enemyCount;
    this.enemiesSpawned = 0;
    this.spawnInterval = 2; // seconds between spawns
    this.lastSpawnTime = 0;
    
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
    
    // Initialize enemy object pool
    this.enemyPool = new ObjectPool(
      () => new Enemy(this.scene, new THREE.Vector3(0, 0, 0), 'grunt'),
      (enemy, position, type) => enemy.reset(position, type),
      15  // Pre-create 15 enemies
    );
    
    // Setup event listeners
    this.setupEventListeners();
    
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
  
  /**
   * Setup event system listeners
   * Reference: GAME_DEV_CONTEXT.md - Observer/Event System
   */
  setupEventListeners() {
    // Listen for enemy killed events
    this.events.on(GameEvents.ENEMY_KILLED, (enemy) => {
      this.kills++;
      this.score += enemy.scoreValue;
      
      // Update HUD
      this.hud.updateKills(this.kills);
      this.hud.updateScore(this.score);
      
      // Immediately mark as dead and hide
      enemy.isDead = true;
      if (enemy.mesh) {
        enemy.mesh.visible = false;
      }
      
      // Return enemy to pool immediately
      this.enemyPool.release(enemy);
    });
    
    // Listen for objective complete
    this.events.on(GameEvents.OBJECTIVE_COMPLETE, () => {
      this.stateMachine.setState(GameState.OBJECTIVE_COMPLETE);
      this.world.openShipDoor();
      this.hud.showObjectiveComplete();
    });
    
    // Listen for ship door opened
    this.events.on(GameEvents.SHIP_DOOR_OPENED, () => {
      this.stateMachine.setState(GameState.SHIP_ACCESSIBLE);
    });
    
    // Listen for item collected
    this.events.on(GameEvents.ITEM_COLLECTED, () => {
      this.stateMachine.setState(GameState.LEVEL_COMPLETE);
      this.world.removeSecretItem();
      
      setTimeout(() => {
        this.nextLevel();
      }, 1000);
    });
    
    // State machine listeners
    this.stateMachine.on(GameState.OBJECTIVE_COMPLETE, () => {
      console.log('All enemies defeated! Opening ship door...');
    });
    
    this.stateMachine.on(GameState.GAME_OVER, () => {
      this.gameOver();
    });
    
    this.stateMachine.on(GameState.VICTORY, () => {
      this.victory();
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
    // Reset state machine
    this.stateMachine.reset();
    
    // Reset state
    this.currentTime = 0;
    this.kills = 0;
    this.score = 0;
    this.level = 1;
    this.enemiesSpawned = 0;
    this.lastSpawnTime = 0;
    this.totalEnemiesToSpawn = this.levelConfig[1].enemyCount; // Explicitly use level 1
    
    // Reset player
    this.player.reset();
    
    // Reset weapon
    this.weapon.reset();
    
    // Return all enemies to pool and hide them
    const activeEnemies = [...this.enemyPool.getActive()]; // Copy array
    activeEnemies.forEach(enemy => {
      if (enemy.mesh) {
        enemy.mesh.visible = false;
        this.scene.remove(enemy.mesh);
      }
      enemy.isDead = true;
    });
    this.enemyPool.clear();
    
    // Reinitialize pool with fresh enemies
    this.enemyPool = new ObjectPool(
      () => new Enemy(this.scene, new THREE.Vector3(0, 0, 0), 'grunt'),
      (enemy, position, type) => enemy.reset(position, type),
      15
    );
    
    // Reset world (close door, hide item)
    this.world.closeShipDoor();
    
    // Reset HUD
    this.hud.reset();
    
    console.log(`Game reset! Level ${this.level}, Need to kill ${this.totalEnemiesToSpawn} enemies`);
  }
  
  spawnWave() {
    // Spawn initial wave (2-3 enemies at start)
    const initialWaveSize = Math.min(3, this.totalEnemiesToSpawn);
    
    for (let i = 0; i < initialWaveSize; i++) {
      if (this.enemiesSpawned < this.totalEnemiesToSpawn) {
        this.spawnEnemy();
      }
    }
  }
  
  spawnEnemy() {
    if (this.enemiesSpawned >= this.totalEnemiesToSpawn) return;
    
    const spawnPoints = this.world.getSpawnPoints();
    const spawnIndex = Math.floor(Math.random() * spawnPoints.length);
    const spawnPoint = spawnPoints[spawnIndex].clone();
    
    spawnPoint.x += (Math.random() - 0.5) * 5;
    spawnPoint.z += (Math.random() - 0.5) * 5;
    
    // Get enemy types for current level
    const allowedTypes = this.levelConfig[this.level].enemyTypes;
    const type = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
    
    // Use object pool instead of creating new enemy
    const enemy = this.enemyPool.acquire(spawnPoint, type);
    this.enemiesSpawned++;
    
    // Emit event
    this.events.emit(GameEvents.ENEMY_SPAWNED, { enemy, type });
    
    console.log(`Spawned enemy ${this.enemiesSpawned}/${this.totalEnemiesToSpawn} - Pool: ${JSON.stringify(this.enemyPool.getStats())}`);
  }
  
  handleShoot() {
    const hitResult = this.weapon.shoot();
    if (!hitResult) return;
    
    // Emit weapon fired event
    this.events.emit(GameEvents.WEAPON_FIRED);
    
    // Check if we hit any enemies
    const raycaster = hitResult.raycaster;
    
    // Get all active ALIVE enemies from pool
    const activeEnemies = this.enemyPool.getActive().filter(e => !e.isDead && e.mesh && e.mesh.visible);
    
    if (activeEnemies.length === 0) return;
    
    const enemyMeshes = activeEnemies.map(e => e.mesh);
    
    // Raycast with recursive=true to hit hitbox children
    const intersects = raycaster.intersectObjects(enemyMeshes, true);
    
    if (intersects.length > 0) {
      // Find which enemy was hit by checking mesh hierarchy
      const hitObject = intersects[0].object;
      
      for (const enemy of activeEnemies) {
        if (enemy.isDead) continue;
        
        // Check if hitObject is part of this enemy's mesh hierarchy
        let currentParent = hitObject;
        let isThisEnemy = false;
        
        while (currentParent) {
          if (currentParent === enemy.mesh) {
            isThisEnemy = true;
            break;
          }
          currentParent = currentParent.parent;
        }
        
        if (isThisEnemy) {
          // Hit marker at impact point
          this.weapon.createHitMarker(intersects[0].point);
          
          // Apply damage
          const killed = enemy.takeDamage(this.weapon.damage);
          
          // Emit hit event
          this.events.emit(GameEvents.ENEMY_HIT, { enemy, damage: this.weapon.damage });
          
          if (killed) {
            // Emit killed event (event listener handles score/kills/pool)
            this.events.emit(GameEvents.ENEMY_KILLED, enemy);
          }
          
          break;
        }
      }
    }
  }
  
  update(deltaTime) {
    if (!this.isRunning) return;
    
    // Update game time (for tracking)
    this.currentTime += deltaTime;
    
    // Update player
    this.player.update(deltaTime);
    
    // Check trap collisions
    const trapDamage = this.world.checkTrapCollision(this.player.getPosition());
    if (trapDamage > 0) {
      this.player.takeDamage(trapDamage);
      this.events.emit(GameEvents.PLAYER_HIT, { damage: trapDamage });
    }
    
    // Check if player died
    if (this.player.isDead) {
      this.stateMachine.setState(GameState.GAME_OVER);
      return;
    }
    
    // Update health HUD
    this.hud.updateHealth(this.player.health, this.player.maxHealth);
    
    // Update weapon
    this.weapon.update(deltaTime);
    
    // Update enemies from pool (only alive and visible ones)
    const playerPos = this.player.getPosition();
    const activeEnemies = this.enemyPool.getActive();
    
    for (const enemy of activeEnemies) {
      // Skip dead or hidden enemies
      if (enemy.isDead || !enemy.mesh || !enemy.mesh.visible) continue;
      
      enemy.update(deltaTime, playerPos);
      
      // Check if enemy can attack player
      if (enemy.canAttack()) {
        this.player.takeDamage(enemy.damage);
        this.events.emit(GameEvents.PLAYER_HIT, { damage: enemy.damage, source: enemy });
      }
    }
    
    // Spawn new enemies periodically until all spawned (only in PLAYING state)
    if (this.stateMachine.isState(GameState.PLAYING) && this.enemiesSpawned < this.totalEnemiesToSpawn) {
      if (this.currentTime - this.lastSpawnTime > this.spawnInterval) {
        this.spawnEnemy();
        this.lastSpawnTime = this.currentTime;
      }
    }
    
    // Check objective: all enemies killed?
    const aliveEnemies = activeEnemies.filter(e => !e.isDead && e.mesh && e.mesh.visible).length;
    if (this.stateMachine.isState(GameState.PLAYING) && this.enemiesSpawned >= this.totalEnemiesToSpawn && aliveEnemies === 0) {
      console.log('All enemies defeated! Alive count: ' + aliveEnemies);
      this.events.emit(GameEvents.OBJECTIVE_COMPLETE);
      this.events.emit(GameEvents.SHIP_DOOR_OPENED);
    }
    
    // Check if player is near ship when accessible
    if (this.stateMachine.isState(GameState.SHIP_ACCESSIBLE)) {
      this.checkShipEntry();
    }
    
    // Update world
    this.world.update(deltaTime);
  }
  
  checkShipEntry() {
    const playerPos = this.player.getPosition();
    const itemPos = this.world.getSecretItemPosition();
    const distanceToItem = playerPos.distanceTo(itemPos);
    
    // Check if player collected the item
    if (distanceToItem < 2) {
      // Emit item collected event
      this.events.emit(GameEvents.ITEM_COLLECTED);
      console.log('Secret item collected! Progressing to next level...');
    }
  }
  
  nextLevel() {
    this.level++;
    
    if (this.level > 3) {
      // Game complete!
      this.stateMachine.setState(GameState.VICTORY);
    } else {
      // Reset for next level
      this.resetForNextLevel();
    }
  }
  
  resetForNextLevel() {
    // Reset state machine
    this.stateMachine.reset();
    
    // Reset spawn tracking
    this.enemiesSpawned = 0;
    this.totalEnemiesToSpawn = this.levelConfig[this.level].enemyCount;
    
    // Reset player position
    this.player.reset();
    
    // Close ship door
    this.world.closeShipDoor();
    
    // Spawn new wave
    this.spawnWave();
    
    this.hud.showMessage(`Level ${this.level} - Kill ${this.totalEnemiesToSpawn} enemies!`, 3000);
    console.log(`Level ${this.level} started! Kill ${this.totalEnemiesToSpawn} enemies.`);
  }
  
  victory() {
    this.isRunning = false;
    
    this.hud.showGameOver(true, this.kills, this.score, this.level);
    
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

