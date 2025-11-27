# Game Development Expert Context

> **Purpose**: This document provides comprehensive context for AI-assisted game development. Use this as the foundation for all game dev discussions and implementations.

---

## 🎯 Developer Profile & Constraints

### Environment
- **IDE**: Cursor + Claude
- **Primary Goal**: Build games that run locally on PC and/or in browser (WebGL/WebGPU/HTML5)
- **Graphics Standard**: Clean, polished, modern-looking (not ultra-high-end, but professional)
- **Performance Target**: Smooth gameplay on a typical modern laptop

### Preferred Workflow
1. **Minimal prototype first** — player can move, look around, shoot/interact
2. **Add core gameplay** — enemies, AI, scoring, basic UI
3. **Polish phase** — lighting, materials, particles, sound, optimization

---

## 🛠️ Recommended Tech Stacks

### Tier 1: Browser-First (Recommended for Quick Iteration)

#### **Three.js** (WebGL)
- **Best for**: Fast prototyping, browser-native 3D games
- **Strengths**: Huge ecosystem, excellent examples, easy setup
- **Physics**: Use Cannon.js or Rapier.js
- **Docs**: https://threejs.org/docs/ | https://threejs.org/manual/

```bash
# Quick start
npm create vite@latest my-game -- --template vanilla-ts
cd my-game && npm install three @types/three
npm run dev
```

#### **Babylon.js** (WebGL/WebGPU)
- **Best for**: More "engine-like" experience, built-in physics, PBR
- **Strengths**: Visual editor, WebGPU support, comprehensive features
- **Docs**: https://doc.babylonjs.com/

```bash
npm create vite@latest my-game -- --template vanilla-ts
cd my-game && npm install @babylonjs/core @babylonjs/loaders
npm run dev
```

### Tier 2: Full Engine (Desktop + Web Export)

#### **Godot 4.x** (Open Source)
- **Best for**: Complete game engine experience, GDScript or C#
- **Strengths**: Free, open source, exports to desktop + web
- **Docs**: https://docs.godotengine.org/en/stable/

```bash
# Install from https://godotengine.org/download
# Web export requires installing HTML5 export template
```

### Tier 3: Industry Standard (Reference)

#### **Unity** (C#)
- **Best for**: Industry-standard patterns, extensive asset store
- **Note**: Use as reference for patterns; translate to open-source stacks
- **Docs**: https://docs.unity.com/

---

## 📚 Core Knowledge Base

### Graphics Fundamentals

#### Learning Modern 3D Graphics Programming (Jason L. McKesson)
**Key Concepts Covered:**

1. **The Rendering Pipeline**
   - Vertex processing → Primitive assembly → Rasterization → Fragment processing
   - Programmable shaders (vertex, fragment/pixel)
   - Fixed-function vs programmable pipeline

2. **Vector Mathematics**
   - Position vectors vs direction vectors
   - Component-wise operations (add, subtract, multiply)
   - Scalar operations on vectors
   - Dot product, cross product
   - Vector normalization

3. **Transformation Matrices**
   - Model matrix (object space → world space)
   - View matrix (world space → camera space)
   - Projection matrix (camera space → clip space)
   - MVP matrix chain

4. **Coordinate Systems**
   - Object/Model space
   - World space
   - Camera/View space
   - Clip space
   - Normalized Device Coordinates (NDC)
   - Screen/Window space

5. **Depth and Visibility**
   - Z-buffer / depth buffer
   - Depth testing
   - Near/far clipping planes

6. **Lighting Models**
   - Ambient, diffuse, specular (Phong/Blinn-Phong)
   - Normal vectors
   - Light attenuation
   - Multiple light sources

7. **Texturing**
   - UV coordinates
   - Texture sampling
   - Mipmapping
   - Texture filtering (nearest, linear, anisotropic)

8. **Shaders (GLSL)**
   - Vertex shaders
   - Fragment shaders
   - Uniforms, attributes, varyings
   - Built-in variables

### Shader Techniques (3D Game Shaders for Beginners)

**Essential Effects:**
- Normal mapping
- SSAO (Screen-Space Ambient Occlusion)
- Bloom
- Depth of field
- Screen-space reflections
- Fog
- Cel/toon shading
- Outline rendering

### Game Architecture (Game Programming Patterns)

**Core Patterns:**
- Game loop
- Update method
- Component pattern
- Entity-Component-System (ECS)
- State machine
- Command pattern
- Observer/Event system
- Object pooling
- Spatial partitioning
- Double buffering

---

## 🎮 Game Type Templates

### First-Person Shooter (FPS)

```
Phase 1: Core Movement
├── Camera controller (mouse look)
├── Player movement (WASD + sprint + jump)
├── Ground detection / collision
└── Basic level geometry

Phase 2: Weapons & Combat
├── Weapon system (equip, aim, fire)
├── Projectile/raycast shooting
├── Hit detection
├── Health system
└── Ammo system

Phase 3: Enemies & AI
├── Enemy spawning
├── Basic pathfinding (navmesh or simple)
├── Enemy states (patrol, chase, attack)
├── Damage dealing
└── Death/respawn

Phase 4: Polish
├── Weapon models & animations
├── Particle effects (muzzle flash, impacts)
├── Sound effects
├── HUD (health, ammo, crosshair)
├── Lighting & post-processing
└── Performance optimization
```

### Third-Person Shooter (TPS)

```
Phase 1: Character Controller
├── Third-person camera (orbit + collision)
├── Character movement + animations
├── Aim mode (over-shoulder)
└── Cover system (optional)

Phase 2-4: Similar to FPS...
```

### Arcade/Action Game

```
Phase 1: Core Loop
├── Player entity + controls
├── Basic physics
├── Collectibles
└── Score system

Phase 2: Gameplay
├── Enemy types
├── Power-ups
├── Level progression
└── Difficulty scaling

Phase 3: Polish
├── Juice (screen shake, particles)
├── Sound & music
├── UI animations
└── Save/load system
```

---

## 🔧 Implementation Patterns

### Three.js FPS Camera

```typescript
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

class FPSController {
  camera: THREE.PerspectiveCamera;
  controls: PointerLockControls;
  velocity = new THREE.Vector3();
  direction = new THREE.Vector3();
  moveForward = false;
  moveBackward = false;
  moveLeft = false;
  moveRight = false;
  canJump = false;
  
  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.controls = new PointerLockControls(camera, domElement);
    
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));
    
    domElement.addEventListener('click', () => {
      this.controls.lock();
    });
  }
  
  onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case 'KeyW': this.moveForward = true; break;
      case 'KeyS': this.moveBackward = true; break;
      case 'KeyA': this.moveLeft = true; break;
      case 'KeyD': this.moveRight = true; break;
      case 'Space': if (this.canJump) this.velocity.y = 10; break;
    }
  }
  
  onKeyUp(event: KeyboardEvent) {
    switch (event.code) {
      case 'KeyW': this.moveForward = false; break;
      case 'KeyS': this.moveBackward = false; break;
      case 'KeyA': this.moveLeft = false; break;
      case 'KeyD': this.moveRight = false; break;
    }
  }
  
  update(delta: number) {
    if (!this.controls.isLocked) return;
    
    // Apply gravity
    this.velocity.y -= 30 * delta;
    
    // Get movement direction
    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize();
    
    // Apply movement
    const speed = 50;
    if (this.moveForward || this.moveBackward) {
      this.velocity.z = -this.direction.z * speed;
    }
    if (this.moveLeft || this.moveRight) {
      this.velocity.x = -this.direction.x * speed;
    }
    
    // Move
    this.controls.moveRight(-this.velocity.x * delta);
    this.controls.moveForward(-this.velocity.z * delta);
    this.camera.position.y += this.velocity.y * delta;
    
    // Ground check
    if (this.camera.position.y < 2) {
      this.velocity.y = 0;
      this.camera.position.y = 2;
      this.canJump = true;
    }
    
    // Damping
    this.velocity.x *= 0.9;
    this.velocity.z *= 0.9;
  }
}
```

### Babylon.js Quick Setup

```typescript
import { Engine, Scene, FreeCamera, HemisphericLight, 
         MeshBuilder, Vector3 } from '@babylonjs/core';

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
const engine = new Engine(canvas, true);

const createScene = () => {
  const scene = new Scene(engine);
  
  // Camera
  const camera = new FreeCamera('camera', new Vector3(0, 5, -10), scene);
  camera.setTarget(Vector3.Zero());
  camera.attachControl(canvas, true);
  
  // Light
  new HemisphericLight('light', new Vector3(0, 1, 0), scene);
  
  // Ground
  MeshBuilder.CreateGround('ground', { width: 20, height: 20 }, scene);
  
  // Player
  const player = MeshBuilder.CreateBox('player', { size: 1 }, scene);
  player.position.y = 0.5;
  
  return scene;
};

const scene = createScene();
engine.runRenderLoop(() => scene.render());
window.addEventListener('resize', () => engine.resize());
```

### Godot 4 FPS Controller (GDScript)

```gdscript
extends CharacterBody3D

const SPEED = 5.0
const JUMP_VELOCITY = 4.5
const MOUSE_SENSITIVITY = 0.002

@onready var camera = $Camera3D

func _ready():
    Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _input(event):
    if event is InputEventMouseMotion:
        rotate_y(-event.relative.x * MOUSE_SENSITIVITY)
        camera.rotate_x(-event.relative.y * MOUSE_SENSITIVITY)
        camera.rotation.x = clamp(camera.rotation.x, -PI/2, PI/2)
    
    if event.is_action_pressed("ui_cancel"):
        Input.mouse_mode = Input.MOUSE_MODE_VISIBLE

func _physics_process(delta):
    # Gravity
    if not is_on_floor():
        velocity.y -= 9.8 * delta
    
    # Jump
    if Input.is_action_just_pressed("jump") and is_on_floor():
        velocity.y = JUMP_VELOCITY
    
    # Movement
    var input_dir = Input.get_vector("move_left", "move_right", "move_forward", "move_back")
    var direction = (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
    
    if direction:
        velocity.x = direction.x * SPEED
        velocity.z = direction.z * SPEED
    else:
        velocity.x = move_toward(velocity.x, 0, SPEED)
        velocity.z = move_toward(velocity.z, 0, SPEED)
    
    move_and_slide()
```

---

## 📦 Project Structure Templates

### Three.js/Babylon.js Project

```
my-game/
├── src/
│   ├── main.ts              # Entry point
│   ├── Game.ts              # Main game class
│   ├── scenes/
│   │   └── MainScene.ts
│   ├── entities/
│   │   ├── Player.ts
│   │   └── Enemy.ts
│   ├── systems/
│   │   ├── InputSystem.ts
│   │   ├── PhysicsSystem.ts
│   │   └── AudioSystem.ts
│   ├── components/
│   │   ├── Health.ts
│   │   └── Weapon.ts
│   └── utils/
│       └── math.ts
├── public/
│   ├── models/
│   ├── textures/
│   └── sounds/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Godot 4 Project

```
my-game/
├── project.godot
├── scenes/
│   ├── main.tscn
│   ├── player/
│   │   ├── player.tscn
│   │   └── player.gd
│   ├── enemies/
│   │   └── enemy.tscn
│   └── levels/
│       └── level_01.tscn
├── scripts/
│   ├── autoload/
│   │   └── game_manager.gd
│   └── utils/
├── assets/
│   ├── models/
│   ├── textures/
│   └── audio/
└── export_presets.cfg
```

---

## ⚡ Performance Guidelines

### General Rules
1. **Object pooling** for bullets, particles, enemies
2. **Frustum culling** — only render what's visible
3. **LOD (Level of Detail)** for distant objects
4. **Texture atlases** to reduce draw calls
5. **Instanced rendering** for repeated geometry
6. **Fixed timestep** for physics (60 Hz typical)

### Browser-Specific
1. Keep draw calls under 100-200
2. Compress textures (basis, ktx2)
3. Use glTF/GLB for models (optimized for web)
4. Lazy-load assets
5. Use Web Workers for heavy computation
6. Target 60 FPS, gracefully degrade to 30

### Memory Management
1. Dispose unused geometries/materials/textures
2. Reuse objects instead of creating new ones
3. Clear references to enable garbage collection
4. Monitor with browser DevTools Performance tab

---

## 🔗 Essential Resources

### Documentation
- Godot: https://docs.godotengine.org/en/stable/
- Three.js: https://threejs.org/docs/
- Babylon.js: https://doc.babylonjs.com/
- LearnOpenGL: https://learnopengl.com/

### Graphics Theory
- Learning Modern 3D Graphics Programming: https://paroj.github.io/gltut/
- 3D Game Shaders for Beginners: https://lettier.github.io/3d-game-shaders-for-beginners/
- Ray Tracing in One Weekend: https://raytracing.github.io/

### Game Design Patterns
- Game Programming Patterns: https://gameprogrammingpatterns.com/

### Physics Engines (Web)
- Cannon.js: https://github.com/schteppe/cannon.js
- Rapier: https://rapier.rs/
- Ammo.js (Bullet port): https://github.com/kripken/ammo.js

---

## 🚀 Quick Start Commands

### New Three.js Game
```bash
npm create vite@latest my-fps -- --template vanilla-ts
cd my-fps
npm install three @types/three cannon-es
npm run dev
```

### New Babylon.js Game
```bash
npm create vite@latest my-game -- --template vanilla-ts
cd my-game
npm install @babylonjs/core @babylonjs/loaders @babylonjs/gui
npm run dev
```

### Build for Production
```bash
npm run build
# Output in dist/ folder - deploy to any static host
```

---

## 💡 Prompting Tips for Game Dev

When asking for help, include:
1. **Stack**: "Using Three.js with TypeScript"
2. **Goal**: "I want to add enemy AI that chases the player"
3. **Current state**: "I have player movement working"
4. **Constraints**: "Should run at 60fps on mid-range laptop"

Example prompt:
> "Using Three.js + Cannon.js, I have a working FPS controller. Now I want to add a weapon system with raycast shooting. Give me complete code for a Weapon class that fires on click, detects hits, and shows a muzzle flash particle effect."

---

*Last updated: November 2025*
