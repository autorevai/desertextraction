import * as THREE from 'three';

/**
 * World - Desert environment with crashed plane and props
 */
export class World {
  constructor(scene) {
    this.scene = scene;
    this.objects = []; // For collision detection
    this.traps = [];
    
    this.init();
  }
  
  init() {
    this.createSky();
    this.createGround();
    this.createCrashedPlane();
    this.createRocks();
    this.createCacti();
    this.createTraps();
    this.createLighting();
    this.createDust();
  }
  
  createSky() {
    // Gradient sky using shader
    const skyGeom = new THREE.SphereGeometry(500, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x88ccff) },
        bottomColor: { value: new THREE.Color(0xffeedd) },
        offset: { value: 20 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide
    });
    
    const sky = new THREE.Mesh(skyGeom, skyMat);
    this.scene.add(sky);
  }
  
  createGround() {
    // Main desert floor
    const groundGeom = new THREE.PlaneGeometry(100, 100, 50, 50);
    
    // Add some height variation for dunes
    const positions = groundGeom.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      
      // Perlin-like noise approximation using sin
      const noise = 
        Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5 +
        Math.sin(x * 0.05 + 1) * Math.sin(y * 0.05 + 2) * 1;
      
      positions.setZ(i, noise);
    }
    
    groundGeom.computeVertexNormals();
    
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xd4a574,
      roughness: 0.9,
      metalness: 0.0,
      flatShading: false
    });
    
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    
    // Add subtle ground details (darker patches)
    const detailGeom = new THREE.PlaneGeometry(100, 100);
    const detailMat = new THREE.MeshStandardMaterial({
      color: 0xc49464,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0.3
    });
    const detail = new THREE.Mesh(detailGeom, detailMat);
    detail.rotation.x = -Math.PI / 2;
    detail.position.y = 0.01;
    this.scene.add(detail);
  }
  
  createCrashedPlane() {
    const planeGroup = new THREE.Group();
    
    // Fuselage (main body)
    const fuselageGeom = new THREE.CylinderGeometry(2, 2.5, 15, 12);
    const fuselageMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.6,
      metalness: 0.4
    });
    const fuselage = new THREE.Mesh(fuselageGeom, fuselageMat);
    fuselage.rotation.z = Math.PI / 2;
    fuselage.rotation.y = 0.1; // Slightly tilted
    fuselage.position.y = 1.5;
    fuselage.castShadow = true;
    fuselage.receiveShadow = true;
    planeGroup.add(fuselage);
    
    // Nose cone
    const noseGeom = new THREE.ConeGeometry(2, 4, 12);
    const nose = new THREE.Mesh(noseGeom, fuselageMat);
    nose.rotation.z = -Math.PI / 2;
    nose.position.set(9.5, 1.5, 0);
    nose.castShadow = true;
    planeGroup.add(nose);
    
    // Tail section
    const tailGeom = new THREE.ConeGeometry(2.5, 3, 12);
    const tail = new THREE.Mesh(tailGeom, fuselageMat);
    tail.rotation.z = Math.PI / 2;
    tail.position.set(-9, 1.5, 0);
    tail.castShadow = true;
    planeGroup.add(tail);
    
    // Broken wing (left) - still attached but damaged
    const wingGeom = new THREE.BoxGeometry(1, 0.3, 8);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x777777,
      roughness: 0.5,
      metalness: 0.5
    });
    
    const leftWing = new THREE.Mesh(wingGeom, wingMat);
    leftWing.position.set(0, 2, -5);
    leftWing.rotation.x = -0.2;
    leftWing.castShadow = true;
    planeGroup.add(leftWing);
    
    // Broken wing (right) - on ground
    const rightWing = new THREE.Mesh(wingGeom, wingMat);
    rightWing.position.set(-3, 0.15, 8);
    rightWing.rotation.y = 0.3;
    rightWing.rotation.z = 0.1;
    rightWing.castShadow = true;
    planeGroup.add(rightWing);
    this.objects.push(rightWing);
    
    // Tail fin
    const finGeom = new THREE.BoxGeometry(0.2, 4, 2);
    const fin = new THREE.Mesh(finGeom, wingMat);
    fin.position.set(-8, 4, 0);
    fin.castShadow = true;
    planeGroup.add(fin);
    
    // Engine (fallen off)
    const engineGeom = new THREE.CylinderGeometry(1, 1.2, 3, 8);
    const engineMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.4,
      metalness: 0.7
    });
    const engine = new THREE.Mesh(engineGeom, engineMat);
    engine.position.set(5, 0.6, 10);
    engine.rotation.x = Math.PI / 2;
    engine.rotation.z = 0.3;
    engine.castShadow = true;
    planeGroup.add(engine);
    this.objects.push(engine);
    
    // Cargo door (starts closed, opens when objective complete)
    const doorGeom = new THREE.BoxGeometry(3, 4, 0.2);
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.6,
      metalness: 0.3
    });
    const door = new THREE.Mesh(doorGeom, doorMat);
    door.position.set(-3, 2, -2.5);  // Starts upright (closed)
    door.rotation.x = 0;  // Vertical
    door.castShadow = true;
    planeGroup.add(door);
    this.shipDoor = door;  // Store reference
    
    // Ship interior floor
    const interiorFloorGeom = new THREE.BoxGeometry(3, 0.2, 8);
    const interiorFloorMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.8
    });
    const interiorFloor = new THREE.Mesh(interiorFloorGeom, interiorFloorMat);
    interiorFloor.position.set(-5.5, 0.1, -2.5);
    planeGroup.add(interiorFloor);
    
    // Interior walls (left/right)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.7
    });
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3, 8), wallMat);
    leftWall.position.set(-5.5, 1.5, -4);
    planeGroup.add(leftWall);
    
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3, 8), wallMat);
    rightWall.position.set(-5.5, 1.5, -1);
    planeGroup.add(rightWall);
    
    // Secret item (glowing cube) - starts hidden
    const itemGeom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const itemMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      emissive: 0xffcc00,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });
    const secretItem = new THREE.Mesh(itemGeom, itemMat);
    secretItem.position.set(-7, 0.75, -2.5);
    secretItem.visible = false;  // Hidden until door opens
    planeGroup.add(secretItem);
    this.secretItem = secretItem;
    
    // Add glowing light for the item
    const itemLight = new THREE.PointLight(0xffcc00, 0, 5);
    itemLight.position.copy(secretItem.position);
    planeGroup.add(itemLight);
    this.itemLight = itemLight;
    
    // Cargo boxes spilled out
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x5c4033,
      roughness: 0.8
    });
    
    for (let i = 0; i < 5; i++) {
      const size = 0.5 + Math.random() * 0.8;
      const boxGeom = new THREE.BoxGeometry(size, size, size);
      const box = new THREE.Mesh(boxGeom, boxMat);
      box.position.set(
        -5 + Math.random() * 4,
        size / 2,
        -4 + Math.random() * 3
      );
      box.rotation.y = Math.random() * Math.PI;
      box.castShadow = true;
      planeGroup.add(box);
      this.objects.push(box);
    }
    
    // Smoke particles from wreckage (simplified with mesh)
    const smokeGeom = new THREE.SphereGeometry(0.5, 6, 6);
    const smokeMat = new THREE.MeshBasicMaterial({
      color: 0x444444,
      transparent: true,
      opacity: 0.3
    });
    
    for (let i = 0; i < 8; i++) {
      const smoke = new THREE.Mesh(smokeGeom, smokeMat.clone());
      smoke.position.set(
        -2 + Math.random() * 6,
        2 + Math.random() * 4,
        Math.random() * 2 - 1
      );
      smoke.scale.setScalar(1 + Math.random() * 2);
      planeGroup.add(smoke);
      
      // Animate smoke
      this.animateSmoke(smoke);
    }
    
    // Position the crashed plane in the scene
    planeGroup.position.set(0, 0, -25);
    planeGroup.rotation.y = 0.3;
    
    this.scene.add(planeGroup);
    this.crashedPlane = planeGroup;
    
    // Add collision box for the main fuselage
    this.objects.push(fuselage);
  }
  
  animateSmoke(smoke) {
    const startY = smoke.position.y;
    const speed = 0.5 + Math.random() * 0.5;
    
    const animate = () => {
      smoke.position.y += 0.02 * speed;
      smoke.material.opacity -= 0.001;
      
      if (smoke.material.opacity > 0) {
        requestAnimationFrame(animate);
      } else {
        // Reset
        smoke.position.y = startY;
        smoke.material.opacity = 0.3;
        requestAnimationFrame(animate);
      }
    };
    
    setTimeout(() => animate(), Math.random() * 2000);
  }
  
  createRocks() {
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.9,
      metalness: 0.1
    });
    
    // Create various rock formations
    const rockPositions = [
      { x: 15, z: 10, scale: 2 },
      { x: -20, z: 15, scale: 1.5 },
      { x: 25, z: -20, scale: 3 },
      { x: -30, z: -10, scale: 2.5 },
      { x: 10, z: -35, scale: 2 },
      { x: -15, z: -30, scale: 1.8 },
      { x: 35, z: 5, scale: 2.2 },
      { x: -35, z: 25, scale: 1.7 },
    ];
    
    rockPositions.forEach(pos => {
      const rockGroup = new THREE.Group();
      
      // Main rock
      const mainGeom = new THREE.DodecahedronGeometry(pos.scale, 0);
      const main = new THREE.Mesh(mainGeom, rockMat);
      main.position.y = pos.scale * 0.5;
      main.rotation.set(Math.random(), Math.random(), Math.random());
      main.castShadow = true;
      main.receiveShadow = true;
      rockGroup.add(main);
      
      // Smaller rocks around
      for (let i = 0; i < 3; i++) {
        const smallScale = pos.scale * (0.2 + Math.random() * 0.3);
        const smallGeom = new THREE.DodecahedronGeometry(smallScale, 0);
        const small = new THREE.Mesh(smallGeom, rockMat);
        small.position.set(
          (Math.random() - 0.5) * pos.scale * 2,
          smallScale * 0.5,
          (Math.random() - 0.5) * pos.scale * 2
        );
        small.rotation.set(Math.random(), Math.random(), Math.random());
        small.castShadow = true;
        rockGroup.add(small);
      }
      
      rockGroup.position.set(pos.x, 0, pos.z);
      this.scene.add(rockGroup);
      this.objects.push(main);
    });
  }
  
  createCacti() {
    const cactusMat = new THREE.MeshStandardMaterial({
      color: 0x2d5a27,
      roughness: 0.8
    });
    
    const cactusPositions = [
      { x: 8, z: 20 },
      { x: -12, z: 8 },
      { x: 20, z: -5 },
      { x: -25, z: -20 },
      { x: 30, z: 15 },
      { x: -8, z: 25 },
    ];
    
    cactusPositions.forEach(pos => {
      const cactusGroup = new THREE.Group();
      
      // Main stem
      const height = 2 + Math.random() * 2;
      const stemGeom = new THREE.CylinderGeometry(0.3, 0.4, height, 8);
      const stem = new THREE.Mesh(stemGeom, cactusMat);
      stem.position.y = height / 2;
      stem.castShadow = true;
      cactusGroup.add(stem);
      
      // Arms
      if (Math.random() > 0.3) {
        const armHeight = 1 + Math.random();
        const armGeom = new THREE.CylinderGeometry(0.2, 0.25, armHeight, 6);
        
        const arm1 = new THREE.Mesh(armGeom, cactusMat);
        arm1.position.set(0.4, height * 0.6, 0);
        arm1.rotation.z = -Math.PI / 4;
        arm1.castShadow = true;
        cactusGroup.add(arm1);
        
        if (Math.random() > 0.5) {
          const arm2 = new THREE.Mesh(armGeom, cactusMat);
          arm2.position.set(-0.4, height * 0.4, 0);
          arm2.rotation.z = Math.PI / 4;
          arm2.castShadow = true;
          cactusGroup.add(arm2);
        }
      }
      
      cactusGroup.position.set(pos.x, 0, pos.z);
      this.scene.add(cactusGroup);
      this.objects.push(stem);
    });
  }
  
  createTraps() {
    // Landmines (hidden in sand)
    const minePositions = [
      { x: 5, z: 5 },
      { x: -8, z: 12 },
      { x: 12, z: -8 },
      { x: -15, z: -5 },
      { x: 0, z: 15 },
    ];
    
    minePositions.forEach(pos => {
      const mineGeom = new THREE.CylinderGeometry(0.4, 0.5, 0.15, 12);
      const mineMat = new THREE.MeshStandardMaterial({
        color: 0x4a4a3a,
        roughness: 0.8,
        metalness: 0.3
      });
      const mine = new THREE.Mesh(mineGeom, mineMat);
      mine.position.set(pos.x, 0.05, pos.z);
      mine.receiveShadow = true;
      this.scene.add(mine);
      
      // Slightly visible trigger plate
      const triggerGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 8);
      const triggerMat = new THREE.MeshStandardMaterial({
        color: 0x3a3a2a,
        roughness: 0.6
      });
      const trigger = new THREE.Mesh(triggerGeom, triggerMat);
      trigger.position.set(pos.x, 0.12, pos.z);
      this.scene.add(trigger);
      
      this.traps.push({
        type: 'mine',
        position: new THREE.Vector3(pos.x, 0, pos.z),
        radius: 1.5,
        damage: 50,
        triggered: false,
        mesh: mine
      });
    });
  }
  
  createLighting() {
    // Ambient light (desert sun bouncing)
    const ambient = new THREE.AmbientLight(0xffeedd, 0.6);
    this.scene.add(ambient);
    
    // Main sun (directional)
    const sun = new THREE.DirectionalLight(0xffffee, 1.2);
    sun.position.set(50, 100, 30);
    sun.castShadow = true;
    
    // Shadow settings
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    sun.shadow.bias = -0.001;
    
    this.scene.add(sun);
    
    // Secondary fill light (sky)
    const fill = new THREE.DirectionalLight(0x88ccff, 0.3);
    fill.position.set(-30, 50, -20);
    this.scene.add(fill);
    
    // Ground bounce light
    const bounce = new THREE.DirectionalLight(0xd4a574, 0.2);
    bounce.position.set(0, -1, 0);
    this.scene.add(bounce);
  }
  
  createDust() {
    // Floating dust particles
    const dustGeom = new THREE.BufferGeometry();
    const dustCount = 500;
    const positions = new Float32Array(dustCount * 3);
    
    for (let i = 0; i < dustCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 100;
      positions[i + 1] = Math.random() * 20;
      positions[i + 2] = (Math.random() - 0.5) * 100;
    }
    
    dustGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const dustMat = new THREE.PointsMaterial({
      color: 0xd4a574,
      size: 0.1,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true
    });
    
    this.dust = new THREE.Points(dustGeom, dustMat);
    this.scene.add(this.dust);
  }
  
  update(deltaTime) {
    // Animate dust particles
    if (this.dust) {
      this.dust.rotation.y += deltaTime * 0.02;
      
      const positions = this.dust.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += Math.sin(performance.now() * 0.001 + i) * 0.01;
      }
      this.dust.geometry.attributes.position.needsUpdate = true;
    }
  }
  
  checkTrapCollision(playerPosition) {
    for (const trap of this.traps) {
      if (trap.triggered) continue;
      
      const distance = playerPosition.distanceTo(trap.position);
      if (distance < trap.radius) {
        trap.triggered = true;
        this.triggerTrap(trap);
        return trap.damage;
      }
    }
    return 0;
  }
  
  triggerTrap(trap) {
    if (trap.type === 'mine') {
      // Explosion effect
      const explosionGeom = new THREE.SphereGeometry(2, 16, 16);
      const explosionMat = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.8
      });
      const explosion = new THREE.Mesh(explosionGeom, explosionMat);
      explosion.position.copy(trap.position);
      explosion.position.y = 1;
      this.scene.add(explosion);
      
      // Remove mine mesh
      this.scene.remove(trap.mesh);
      
      // Animate explosion
      let scale = 0.1;
      const animate = () => {
        scale += 0.2;
        explosion.scale.setScalar(scale);
        explosion.material.opacity -= 0.05;
        
        if (explosion.material.opacity > 0) {
          requestAnimationFrame(animate);
        } else {
          this.scene.remove(explosion);
        }
      };
      animate();
    }
  }
  
  getSpawnPoints() {
    // Returns positions where enemies can spawn (around the crashed plane)
    return [
      new THREE.Vector3(-5, 0, -30),
      new THREE.Vector3(5, 0, -30),
      new THREE.Vector3(-10, 0, -25),
      new THREE.Vector3(10, 0, -25),
      new THREE.Vector3(0, 0, -35),
      new THREE.Vector3(-15, 0, -20),
      new THREE.Vector3(15, 0, -20),
    ];
  }
  
  openShipDoor() {
    if (!this.shipDoor) return;
    
    // Animate door falling open
    const startRotation = this.shipDoor.rotation.x;
    const endRotation = -Math.PI / 2 + 0.1;  // Fallen flat
    const startY = this.shipDoor.position.y;
    const endY = 0.1;
    const duration = 1000;  // 1 second
    const startTime = performance.now();
    
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      
      this.shipDoor.rotation.x = startRotation + (endRotation - startRotation) * eased;
      this.shipDoor.position.y = startY + (endY - startY) * eased;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Show the secret item
        if (this.secretItem) {
          this.secretItem.visible = true;
        }
        if (this.itemLight) {
          this.itemLight.intensity = 1;
        }
      }
    };
    
    animate();
  }
  
  closeShipDoor() {
    if (!this.shipDoor) return;
    
    // Reset door to closed position
    this.shipDoor.rotation.x = 0;
    this.shipDoor.position.y = 2;
    
    // Hide and reset secret item
    if (this.secretItem) {
      this.secretItem.visible = false;
      this.secretItem.scale.setScalar(1); // Reset scale in case it was animated
    }
    if (this.itemLight) {
      this.itemLight.intensity = 0;
    }
    
    console.log('Ship door closed, item hidden');
  }
  
  getShipEntrancePosition() {
    // Position of the door entrance (in world space)
    // Plane is at (0, 0, -25), door is at (-3, 0, -2.5) relative to plane
    return new THREE.Vector3(-3, 0, -27.5);
  }
  
  getSecretItemPosition() {
    // Position of the secret item (in world space)
    // Plane is at (0, 0, -25), item is at (-7, 0.75, -2.5) relative to plane
    return new THREE.Vector3(-7, 0.75, -27.5);
  }
  
  removeSecretItem() {
    if (this.secretItem) {
      // Animate item disappearing
      const startScale = 1;
      const duration = 500;
      const startTime = performance.now();
      
      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const scale = startScale * (1 - progress);
        this.secretItem.scale.setScalar(scale);
        
        if (this.itemLight) {
          this.itemLight.intensity = 1 - progress;
        }
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.secretItem.visible = false;
        }
      };
      
      animate();
    }
  }
}

