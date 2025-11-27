import { Game } from './game/Game.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Get container
  const container = document.getElementById('game-container');
  
  if (!container) {
    console.error('Game container not found!');
    return;
  }
  
  // Create and start game
  const game = new Game(container);
  
  // Expose game to console for debugging
  window.game = game;
  
  console.log('🎮 Desert Extraction loaded!');
  console.log('Click START MISSION to begin');
});

