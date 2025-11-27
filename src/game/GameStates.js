/**
 * GameStates - State machine for game flow
 * Reference: GAME_DEV_CONTEXT.md - State Machine Pattern
 */

export const GameState = {
  PLAYING: 'PLAYING',
  OBJECTIVE_COMPLETE: 'OBJECTIVE_COMPLETE',
  SHIP_ACCESSIBLE: 'SHIP_ACCESSIBLE',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY'
};

/**
 * State Machine class to manage game state transitions
 */
export class GameStateMachine {
  constructor() {
    this.currentState = GameState.PLAYING;
    this.previousState = null;
    this.listeners = {};
  }
  
  /**
   * Change to a new state
   * @param {string} newState - The state to transition to
   */
  setState(newState) {
    if (this.currentState === newState) return;
    
    console.log(`State transition: ${this.currentState} -> ${newState}`);
    
    this.previousState = this.currentState;
    this.currentState = newState;
    
    // Notify listeners
    this.notifyListeners(newState, this.previousState);
  }
  
  /**
   * Check if in a specific state
   * @param {string} state - State to check
   * @returns {boolean}
   */
  isState(state) {
    return this.currentState === state;
  }
  
  /**
   * Register a listener for state changes
   * @param {string} state - State to listen for
   * @param {Function} callback - Callback function
   */
  on(state, callback) {
    if (!this.listeners[state]) {
      this.listeners[state] = [];
    }
    this.listeners[state].push(callback);
  }
  
  /**
   * Notify all listeners for a state
   * @param {string} state - The new state
   * @param {string} previousState - The previous state
   */
  notifyListeners(state, previousState) {
    if (this.listeners[state]) {
      this.listeners[state].forEach(callback => {
        callback(previousState);
      });
    }
  }
  
  /**
   * Reset to initial state
   */
  reset() {
    this.currentState = GameState.PLAYING;
    this.previousState = null;
  }
}

