/**
 * ObjectPool - Reusable object pooling system
 * Reference: GAME_DEV_CONTEXT.md - Object Pooling Pattern (Page 150)
 * 
 * Benefits:
 * - Reduces garbage collection pressure
 * - Improves performance by reusing objects
 * - Prevents memory allocation spikes
 */

export class ObjectPool {
  constructor(factory, resetFunction, initialSize = 10) {
    this.factory = factory; // Function to create new objects
    this.reset = resetFunction; // Function to reset an object
    this.available = []; // Available objects
    this.inUse = []; // Currently active objects
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.available.push(this.factory());
    }
  }
  
  /**
   * Get an object from the pool
   * @param {...any} args - Arguments to pass to reset function
   * @returns {object} An object from the pool
   */
  acquire(...args) {
    let obj;
    
    if (this.available.length > 0) {
      // Reuse existing object
      obj = this.available.pop();
    } else {
      // Create new object if pool is empty
      obj = this.factory();
      console.log('Pool expanded - created new object');
    }
    
    // Reset the object with provided arguments
    this.reset(obj, ...args);
    
    // Track as in-use
    this.inUse.push(obj);
    
    return obj;
  }
  
  /**
   * Return an object to the pool
   * @param {object} obj - The object to return
   */
  release(obj) {
    const index = this.inUse.indexOf(obj);
    if (index > -1) {
      this.inUse.splice(index, 1);
      this.available.push(obj);
    }
  }
  
  /**
   * Get all active objects
   * @returns {Array} Array of in-use objects
   */
  getActive() {
    return this.inUse;
  }
  
  /**
   * Get pool statistics
   * @returns {object} Pool stats
   */
  getStats() {
    return {
      available: this.available.length,
      inUse: this.inUse.length,
      total: this.available.length + this.inUse.length
    };
  }
  
  /**
   * Clear the pool
   */
  clear() {
    this.available = [];
    this.inUse = [];
  }
}

