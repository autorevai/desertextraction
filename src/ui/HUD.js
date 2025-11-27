/**
 * HUD - Manages all UI elements
 */
export class HUD {
  constructor() {
    this.elements = {
      healthBar: document.getElementById('health-bar'),
      healthText: document.getElementById('health-text'),
      ammoText: document.getElementById('ammo-text'),
      timerValue: document.getElementById('timer-value'),
      killsValue: document.getElementById('kills-value'),
      scoreValue: document.getElementById('score-value'),
      potentialWin: document.getElementById('potential-win'),
      startScreen: document.getElementById('start-screen'),
      startBtn: document.getElementById('start-btn'),
      gameoverScreen: document.getElementById('gameover-screen'),
      gameoverTitle: document.getElementById('gameover-title'),
      finalKills: document.getElementById('final-kills'),
      finalScore: document.getElementById('final-score'),
      finalMoney: document.getElementById('final-money'),
      restartBtn: document.getElementById('restart-btn'),
      hud: document.getElementById('hud')
    };
    
    this.betAmount = 1;
    this.winMultiplier = 3;
  }
  
  updateHealth(health, maxHealth) {
    const percent = (health / maxHealth) * 100;
    
    if (this.elements.healthBar) {
      this.elements.healthBar.style.width = `${percent}%`;
      
      // Change color based on health
      if (percent > 60) {
        this.elements.healthBar.style.background = 'linear-gradient(90deg, #44ff44, #66ff66)';
      } else if (percent > 30) {
        this.elements.healthBar.style.background = 'linear-gradient(90deg, #ffcc00, #ffdd44)';
      } else {
        this.elements.healthBar.style.background = 'linear-gradient(90deg, #ff4444, #ff6666)';
      }
    }
    
    if (this.elements.healthText) {
      this.elements.healthText.textContent = Math.ceil(health);
    }
  }
  
  updateAmmo(current, max) {
    if (this.elements.ammoText) {
      this.elements.ammoText.innerHTML = `${current} <span>/ ${max}</span>`;
    }
  }
  
  updateTimer(seconds) {
    if (this.elements.timerValue) {
      this.elements.timerValue.textContent = Math.ceil(seconds);
      
      // Flash red when low
      if (seconds <= 10) {
        this.elements.timerValue.style.color = '#ff4444';
        if (seconds <= 5) {
          this.elements.timerValue.style.animation = 'pulse 0.5s infinite';
        }
      } else {
        this.elements.timerValue.style.color = '#ffcc00';
        this.elements.timerValue.style.animation = 'none';
      }
    }
  }
  
  updateKills(kills) {
    if (this.elements.killsValue) {
      this.elements.killsValue.textContent = kills;
    }
  }
  
  updateScore(score) {
    if (this.elements.scoreValue) {
      this.elements.scoreValue.textContent = score.toLocaleString();
    }
  }
  
  showStartScreen() {
    if (this.elements.startScreen) {
      this.elements.startScreen.style.display = 'flex';
    }
    if (this.elements.gameoverScreen) {
      this.elements.gameoverScreen.style.display = 'none';
    }
    if (this.elements.hud) {
      this.elements.hud.style.display = 'none';
    }
  }
  
  hideStartScreen() {
    if (this.elements.startScreen) {
      this.elements.startScreen.style.display = 'none';
    }
    if (this.elements.hud) {
      this.elements.hud.style.display = 'block';
    }
  }
  
  showGameOver(victory, kills, score, money) {
    if (this.elements.gameoverScreen) {
      this.elements.gameoverScreen.style.display = 'flex';
      
      if (victory) {
        this.elements.gameoverScreen.classList.add('victory');
        this.elements.gameoverTitle.textContent = 'MISSION COMPLETE!';
        this.elements.gameoverTitle.style.color = '#44ff44';
      } else {
        this.elements.gameoverScreen.classList.remove('victory');
        this.elements.gameoverTitle.textContent = 'GAME OVER';
        this.elements.gameoverTitle.style.color = '#ff4444';
      }
      
      this.elements.finalKills.textContent = kills;
      this.elements.finalScore.textContent = score.toLocaleString();
      this.elements.finalMoney.textContent = `$${money.toFixed(2)}`;
      this.elements.finalMoney.style.color = money > 0 ? '#44ff44' : '#ff4444';
    }
  }
  
  hideGameOver() {
    if (this.elements.gameoverScreen) {
      this.elements.gameoverScreen.style.display = 'none';
    }
  }
  
  onStartClick(callback) {
    if (this.elements.startBtn) {
      this.elements.startBtn.addEventListener('click', callback);
    }
  }
  
  onRestartClick(callback) {
    if (this.elements.restartBtn) {
      this.elements.restartBtn.addEventListener('click', callback);
    }
  }
  
  reset() {
    this.updateHealth(100, 100);
    this.updateKills(0);
    this.updateScore(0);
  }
  
  showObjectiveComplete() {
    // Change timer display to show objective complete
    const timerLabel = document.querySelector('#top-hud .stat-box:first-child .stat-label');
    if (timerLabel) {
      timerLabel.textContent = 'OBJECTIVE';
    }
    if (this.elements.timerValue) {
      this.elements.timerValue.textContent = '✓';
      this.elements.timerValue.style.color = '#44ff44';
      this.elements.timerValue.style.fontSize = '32px';
    }
    
    // Show message
    this.showMessage('Ship door opening! Enter to find the secret item!', 5000);
  }
  
  showMessage(text, duration = 3000) {
    // Create or update message element
    let messageEl = document.getElementById('objective-message');
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.id = 'objective-message';
      messageEl.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        color: #ffcc00;
        padding: 20px 40px;
        border-radius: 10px;
        border: 2px solid #ffcc00;
        font-size: 24px;
        font-weight: bold;
        z-index: 150;
        text-align: center;
        pointer-events: none;
      `;
      document.body.appendChild(messageEl);
    }
    
    messageEl.textContent = text;
    messageEl.style.opacity = '1';
    
    setTimeout(() => {
      messageEl.style.opacity = '0';
    }, duration);
  }
}

