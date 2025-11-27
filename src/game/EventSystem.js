/**
 * EventSystem - Observer pattern for game events
 * Reference: GAME_DEV_CONTEXT.md - Observer/Event System Pattern (Page 147)
 * 
 * Decouples game systems by allowing them to communicate through events
 */

export class EventSystem {
  constructor() {
    this.listeners = {};
  }
  
  /**
   * Subscribe to an event
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(eventName, callback) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    
    this.listeners[eventName].push(callback);
    
    // Return unsubscribe function
    return () => this.off(eventName, callback);
  }
  
  /**
   * Unsubscribe from an event
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Callback to remove
   */
  off(eventName, callback) {
    if (!this.listeners[eventName]) return;
    
    const index = this.listeners[eventName].indexOf(callback);
    if (index > -1) {
      this.listeners[eventName].splice(index, 1);
    }
  }
  
  /**
   * Emit an event
   * @param {string} eventName - Name of the event
   * @param {any} data - Data to pass to listeners
   */
  emit(eventName, data) {
    if (!this.listeners[eventName]) return;
    
    // Call all listeners with the data
    this.listeners[eventName].forEach(callback => {
      callback(data);
    });
  }
  
  /**
   * Subscribe to an event only once
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Callback function
   */
  once(eventName, callback) {
    const onceWrapper = (data) => {
      callback(data);
      this.off(eventName, onceWrapper);
    };
    
    this.on(eventName, onceWrapper);
  }
  
  /**
   * Clear all listeners for an event (or all events)
   * @param {string} [eventName] - Optional event name to clear
   */
  clear(eventName) {
    if (eventName) {
      delete this.listeners[eventName];
    } else {
      this.listeners = {};
    }
  }
}

// Common game events
export const GameEvents = {
  ENEMY_SPAWNED: 'enemy_spawned',
  ENEMY_KILLED: 'enemy_killed',
  ENEMY_HIT: 'enemy_hit',
  PLAYER_HIT: 'player_hit',
  PLAYER_DIED: 'player_died',
  OBJECTIVE_COMPLETE: 'objective_complete',
  SHIP_DOOR_OPENED: 'ship_door_opened',
  ITEM_COLLECTED: 'item_collected',
  LEVEL_COMPLETE: 'level_complete',
  WEAPON_FIRED: 'weapon_fired',
  WEAPON_RELOAD: 'weapon_reload'
};

