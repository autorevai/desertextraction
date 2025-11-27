# 🏜️ DESERT EXTRACTION

A first-person survival shooter built with Three.js. Survive 30 seconds in the desert, kill enemies emerging from a crashed plane, avoid traps, and win money!

## 🎮 Gameplay

- **Objective:** Survive for 30 seconds to win $3 (on a $1 bet)
- **Controls:**
  - `Arrow Keys` - Move
  - `Mouse` - Aim
  - `Space` - Shoot
  - `Enter` - Reload
  - `Shift` - Sprint
  - `J` - Jump

## 🚀 Quick Start

### Option 1: Using npm (Recommended)

```bash
# Navigate to the project folder
cd desert-extraction

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Then open **http://localhost:3000** in Chrome.

### Option 2: Using Cursor

1. Open this folder in Cursor
2. Open the integrated terminal
3. Run `npm install`
4. Run `npm run dev`
5. Click the localhost link or open Chrome to http://localhost:3000

## 🎯 Features (Phase 1 - Complete)

- ✅ First-person camera with mouse look
- ✅ WASD movement with sprint and jump
- ✅ Pistol with shooting, recoil, and reload
- ✅ Enemies that chase and attack you
- ✅ Desert environment with crashed cargo plane
- ✅ Landmine traps that explode
- ✅ Health, ammo, timer, kills, and score HUD
- ✅ Betting system (survive = win money)
- ✅ Start screen and game over screens
- ✅ Shadows, fog, and dust particles

## 🔜 Coming Next (Phase 2)

- [ ] More enemy types (runners, tanks)
- [ ] Boss battle at level 3
- [ ] Enter the crashed plane to get items
- [ ] More weapons (shotgun, rifle)
- [ ] Sound effects and music
- [ ] Multiple levels/biomes

## 🛠️ Tech Stack

- **Three.js** - 3D graphics and rendering
- **Vite** - Fast dev server and build tool
- **Cannon-es** - Physics (ready for Phase 2)
- **Vanilla JS** - No framework bloat

## 📁 Project Structure

```
desert-extraction/
├── index.html          # Main HTML with HUD overlay
├── package.json        # Dependencies
├── vite.config.js      # Vite configuration
├── src/
│   ├── main.js         # Entry point
│   ├── game/
│   │   ├── Game.js     # Main game loop
│   │   ├── Player.js   # First-person controller
│   │   ├── Weapon.js   # Pistol mechanics
│   │   ├── Enemy.js    # Enemy AI
│   │   └── World.js    # Desert environment
│   ├── ui/
│   │   └── HUD.js      # UI management
│   └── utils/
│       └── InputManager.js  # Keyboard/mouse input
└── public/             # Static assets (textures, etc.)
```

## 🎨 Graphics Notes

The game uses:
- PBR materials with metalness/roughness
- Dynamic shadows (PCF soft)
- ACES filmic tone mapping
- Exponential fog for atmosphere
- Procedural sky gradient shader
- Floating dust particles

## 🐛 Troubleshooting

**Game won't start?**
- Make sure you clicked "START MISSION"
- Check browser console for errors

**Controls not working?**
- Click on the game window to activate pointer lock
- Press Escape to release the mouse

**Low FPS?**
- Try a smaller browser window
- Close other tabs/applications

## 📝 License

MIT - Do whatever you want with it!

---

Built with Claude + Cursor 🤖
