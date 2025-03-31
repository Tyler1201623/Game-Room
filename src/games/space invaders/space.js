const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

class SpaceInvaders {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    // Set canvas dimensions
    this.canvas.width = 800;
    this.canvas.height = 600;

    // Game state
    this.gameRunning = false;
    this.gameOver = false;
    this.isPaused = false;
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.enemySpeed = 1;
    this.enemyDirection = 1; // 1 for right, -1 for left
    this.enemyDropDistance = 30;
    this.lastTime = 0;
    this.enemyShootTimer = 0;
    this.enemyShootInterval = 1000; // ms

    // Bind the gameLoop method to this instance
    this.gameLoop = this.gameLoop.bind(this);

    // Player
    this.player = {
      x: this.canvas.width / 2 - 25,
      y: this.canvas.height - 60,
      width: 50,
      height: 30,
      speed: 5,
      color: "#4338ca",
      movingLeft: false,
      movingRight: false,
      isFiring: false,
      lastFired: 0,
      fireRate: 300, // ms
    };

    // Bullets
    this.bullets = [];
    this.enemyBullets = [];
    this.bulletSpeed = 7;
    this.enemyBulletSpeed = 5;

    // Enemies
    this.enemies = [];
    this.enemyRows = 5;
    this.enemyCols = 10;
    this.enemyWidth = 40;
    this.enemyHeight = 30;
    this.enemyGap = 15;
    this.enemiesDefeated = 0;

    // Explosions
    this.explosions = [];

    // Shields
    this.shields = [];
    this.shieldCount = 4;

    // Initialize game
    this.init();

    // Start animation loop
    this.animationId = null;

    // Add event listeners for keyboard
    window.addEventListener("keydown", this.handleKeyDown.bind(this));
    window.addEventListener("keyup", this.handleKeyUp.bind(this));

    // Add event listeners for buttons
    document
      .getElementById("startBtn")
      .addEventListener("click", this.toggleGame.bind(this));
    document
      .getElementById("pauseBtn")
      .addEventListener("click", this.togglePause.bind(this));
    document
      .getElementById("resetBtn")
      .addEventListener("click", this.reset.bind(this));

    // Mobile controls
    const leftBtn = document.getElementById("leftBtn");
    const rightBtn = document.getElementById("rightBtn");
    const fireBtn = document.getElementById("fireBtn");

    if (leftBtn && rightBtn && fireBtn) {
      // Touch events for mobile
      leftBtn.addEventListener(
        "touchstart",
        () => (this.player.movingLeft = true)
      );
      leftBtn.addEventListener(
        "touchend",
        () => (this.player.movingLeft = false)
      );
      rightBtn.addEventListener(
        "touchstart",
        () => (this.player.movingRight = true)
      );
      rightBtn.addEventListener(
        "touchend",
        () => (this.player.movingRight = false)
      );
      fireBtn.addEventListener(
        "touchstart",
        () => (this.player.isFiring = true)
      );
      fireBtn.addEventListener(
        "touchend",
        () => (this.player.isFiring = false)
      );

      // Mouse events for desktop testing
      leftBtn.addEventListener(
        "mousedown",
        () => (this.player.movingLeft = true)
      );
      leftBtn.addEventListener(
        "mouseup",
        () => (this.player.movingLeft = false)
      );
      rightBtn.addEventListener(
        "mousedown",
        () => (this.player.movingRight = true)
      );
      rightBtn.addEventListener(
        "mouseup",
        () => (this.player.movingRight = false)
      );
      fireBtn.addEventListener(
        "mousedown",
        () => (this.player.isFiring = true)
      );
      fireBtn.addEventListener("mouseup", () => (this.player.isFiring = false));
    }

    // Update score display
    this.updateScoreDisplay();
  }

  init() {
    // Create enemies
    this.createEnemies();

    // Create shields
    this.createShields();

    // Reset game state
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.gameOver = false;
    this.enemySpeed = 1 + this.level * 0.2;

    // Hide game over screen if visible
    const gameOverScreen = document.getElementById("gameOverScreen");
    if (gameOverScreen) {
      gameOverScreen.classList.remove("visible");
    }

    // Update displayed values
    this.updateScoreDisplay();
  }

  createEnemies() {
    this.enemies = [];
    const startX =
      (this.canvas.width - this.enemyCols * (this.enemyWidth + this.enemyGap)) /
        2 +
      this.enemyWidth / 2;
    const startY = 80;

    for (let row = 0; row < this.enemyRows; row++) {
      for (let col = 0; col < this.enemyCols; col++) {
        const x = startX + col * (this.enemyWidth + this.enemyGap);
        const y = startY + row * (this.enemyHeight + this.enemyGap);

        // Different enemy types based on row
        let type = 0;
        if (row < 1) {
          type = 2; // top row: hardest enemies
        } else if (row < 3) {
          type = 1; // middle rows: medium enemies
        }

        this.enemies.push({
          x,
          y,
          width: this.enemyWidth,
          height: this.enemyHeight,
          type,
          points: (3 - type) * 10, // points based on type
          alive: true,
        });
      }
    }
  }

  createShields() {
    this.shields = [];
    const shieldWidth = 80;
    const shieldHeight = 60;
    const shieldY = this.canvas.height - 150;

    for (let i = 0; i < this.shieldCount; i++) {
      const x =
        (this.canvas.width / (this.shieldCount + 1)) * (i + 1) -
        shieldWidth / 2;

      this.shields.push({
        x,
        y: shieldY,
        width: shieldWidth,
        height: shieldHeight,
        blocks: this.createShieldBlocks(x, shieldY, shieldWidth, shieldHeight),
      });
    }
  }

  createShieldBlocks(shieldX, shieldY, shieldWidth, shieldHeight) {
    const blocks = [];
    const blockSize = 8;
    const rows = Math.floor(shieldHeight / blockSize);
    const cols = Math.floor(shieldWidth / blockSize);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Create a shape with a hollow middle
        if (
          (row > rows * 0.7 && col > cols * 0.3 && col < cols * 0.7) || // Create a small entrance at the bottom
          (row === 0 && (col === 0 || col === cols - 1)) || // Remove corners
          (row === 1 && (col === 0 || col === cols - 1))
        ) {
          continue;
        }

        blocks.push({
          x: shieldX + col * blockSize,
          y: shieldY + row * blockSize,
          width: blockSize,
          height: blockSize,
          health: 3, // Blocks can take multiple hits
        });
      }
    }

    return blocks;
  }

  handleKeyDown(e) {
    if (this.gameOver) return;
    if (!this.gameRunning) return;

    switch (e.code) {
      case "ArrowLeft":
      case "KeyA":
        this.player.movingLeft = true;
        e.preventDefault();
        break;
      case "ArrowRight":
      case "KeyD":
        this.player.movingRight = true;
        e.preventDefault();
        break;
      case "Space":
      case "KeyW":
      case "ArrowUp":
        if (!this.player.isFiring) {
          this.player.isFiring = true;
          this.tryToFire();
        }
        e.preventDefault();
        break;
      case "KeyP":
        this.togglePause();
        e.preventDefault();
        break;
    }
  }

  handleKeyUp(e) {
    if (this.gameOver) return;
    if (!this.gameRunning) return;

    switch (e.code) {
      case "ArrowLeft":
      case "KeyA":
        this.player.movingLeft = false;
        e.preventDefault();
        break;
      case "ArrowRight":
      case "KeyD":
        this.player.movingRight = false;
        e.preventDefault();
        break;
      case "Space":
      case "KeyW":
      case "ArrowUp":
        this.player.isFiring = false;
        e.preventDefault();
        break;
    }
  }

  toggleGame() {
    if (!this.gameRunning) {
      this.start();
    } else {
      this.stop();
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;

    const pauseBtn = document.getElementById("pauseBtn");
    if (pauseBtn) {
      pauseBtn.textContent = this.isPaused ? "Resume" : "Pause";
    }

    if (!this.isPaused && this.gameRunning) {
      this.lastTime = performance.now();
      this.gameLoop(this.lastTime);
    }
  }

  start() {
    if (this.gameOver) {
      this.reset();
    }

    this.gameRunning = true;
    this.isPaused = false;
    document.getElementById("startBtn").textContent = "Stop";
    document.getElementById("pauseBtn").textContent = "Pause";

    // Start the game loop
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  stop() {
    this.gameRunning = false;
    document.getElementById("startBtn").textContent = "Start";

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  reset() {
    // Reset game elements
    this.bullets = [];
    this.enemyBullets = [];
    this.explosions = [];

    // Reset player position
    this.player.x = this.canvas.width / 2 - 25;

    // Reset game state
    this.gameOver = false;
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.enemySpeed = 1 + this.level * 0.2;

    // Create new enemies and shields
    this.createEnemies();
    this.createShields();

    // Update score display
    this.updateScoreDisplay();

    // Clear the game over screen
    const gameOverElement = document.querySelector(".game-over");
    if (gameOverElement) {
      gameOverElement.classList.remove("show");
    }

    // If the game was running, restart it
    if (this.gameRunning) {
      this.stop();
      this.start();
    } else {
      // Just draw the initial state
      this.draw();
    }
  }

  updateScoreDisplay() {
    const scoreElement = document.getElementById("score");
    const levelElement = document.getElementById("level");
    const livesElement = document.getElementById("lives");

    if (scoreElement)
      scoreElement.textContent = this.score.toString().padStart(5, "0");
    if (levelElement) levelElement.textContent = this.level;
    if (livesElement) livesElement.textContent = this.lives;
  }

  gameLoop(timestamp) {
    // Calculate delta time
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    if (this.gameRunning && !this.isPaused) {
      this.update(deltaTime);
      this.draw();

      if (this.enemiesDefeated === this.enemies.length) {
        this.levelUp();
      }

      if (this.gameOver) {
        this.showGameOver();
        this.stop();
      } else {
        this.animationId = requestAnimationFrame(this.gameLoop);
      }
    } else if (this.isPaused) {
      // If paused, just keep the animation frame going but don't update
      this.drawPauseScreen();
      this.animationId = requestAnimationFrame(this.gameLoop);
    }
  }

  update(deltaTime) {
    // Move player
    if (this.player.movingLeft) {
      this.player.x -= this.player.speed;
      if (this.player.x < 0) this.player.x = 0;
    }
    if (this.player.movingRight) {
      this.player.x += this.player.speed;
      if (this.player.x > this.canvas.width - this.player.width) {
        this.player.x = this.canvas.width - this.player.width;
      }
    }

    // Player shooting
    if (this.player.isFiring) {
      const currentTime = performance.now();
      if (currentTime - this.player.lastFired > this.player.fireRate) {
        this.bullets.push({
          x: this.player.x + this.player.width / 2 - 2,
          y: this.player.y,
          width: 4,
          height: 15,
          color: "#ef4444",
        });
        this.player.lastFired = currentTime;

        // Play sound
        this.playSound("shoot");
      }
    }

    // Move bullets
    this.bullets.forEach((bullet) => {
      bullet.y -= this.bulletSpeed;
    });

    // Move enemy bullets
    this.enemyBullets.forEach((bullet) => {
      bullet.y += this.enemyBulletSpeed;
    });

    // Remove bullets that are off screen
    this.bullets = this.bullets.filter((bullet) => bullet.y > -bullet.height);
    this.enemyBullets = this.enemyBullets.filter(
      (bullet) => bullet.y < this.canvas.height
    );

    // Check if enemies need to move down and change direction
    let moveDown = false;
    let furthestRightEnemy = 0;
    let furthestLeftEnemy = this.canvas.width;

    // Find the furthest right and left enemies
    this.enemies.forEach((enemy) => {
      if (enemy.alive) {
        furthestRightEnemy = Math.max(
          furthestRightEnemy,
          enemy.x + enemy.width
        );
        furthestLeftEnemy = Math.min(furthestLeftEnemy, enemy.x);
      }
    });

    // Check if enemies need to change direction
    if (
      (this.enemyDirection > 0 && furthestRightEnemy >= this.canvas.width) ||
      (this.enemyDirection < 0 && furthestLeftEnemy <= 0)
    ) {
      this.enemyDirection *= -1;
      moveDown = true;
    }

    // Move enemies
    this.enemies.forEach((enemy) => {
      if (enemy.alive) {
        enemy.x += this.enemySpeed * this.enemyDirection;

        if (moveDown) {
          enemy.y += this.enemyDropDistance;

          // Check if enemies have reached the player or the bottom of the screen
          if (enemy.y + enemy.height >= this.player.y) {
            this.gameOver = true;
          }
        }
      }
    });

    // Enemy shooting
    this.enemyShootTimer += deltaTime;
    if (this.enemyShootTimer >= this.enemyShootInterval) {
      // Find the lowest enemy in each column
      const columnsWithEnemies = {};

      this.enemies.forEach((enemy) => {
        if (enemy.alive) {
          const col = Math.floor(enemy.x / (this.enemyWidth + this.enemyGap));
          if (!columnsWithEnemies[col] || enemy.y > columnsWithEnemies[col].y) {
            columnsWithEnemies[col] = enemy;
          }
        }
      });

      // Randomly select a column to shoot from
      const columns = Object.values(columnsWithEnemies);
      if (columns.length > 0) {
        const randomEnemy = columns[Math.floor(Math.random() * columns.length)];
        this.enemyBullets.push({
          x: randomEnemy.x + randomEnemy.width / 2 - 2,
          y: randomEnemy.y + randomEnemy.height,
          width: 4,
          height: 15,
          color: "#34d399",
        });
      }

      this.enemyShootTimer = 0;
      this.enemyShootInterval = Math.max(500, 1000 - this.level * 50); // Decrease interval as level increases
    }

    // Update explosions
    this.explosions = this.explosions.filter((explosion) => {
      explosion.ttl -= deltaTime;
      return explosion.ttl > 0;
    });

    // Check for collisions
    this.checkCollisions();
  }

  checkCollisions() {
    // Check player bullets with enemies
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      // Check collision with enemies
      for (let j = 0; j < this.enemies.length; j++) {
        const enemy = this.enemies[j];

        if (enemy.alive && this.isColliding(bullet, enemy)) {
          // Remove bullet
          this.bullets.splice(i, 1);

          // Kill enemy
          enemy.alive = false;
          this.enemiesDefeated++;

          // Add explosion
          this.addExplosion(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2
          );

          // Add score
          this.score += enemy.points;
          this.updateScoreDisplay();

          // Play sound
          this.playSound("explosion");

          break;
        }
      }
    }

    // Check shields collision with player bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      for (let j = 0; j < this.shields.length; j++) {
        const shield = this.shields[j];

        for (let k = shield.blocks.length - 1; k >= 0; k--) {
          const block = shield.blocks[k];

          if (this.isColliding(bullet, block)) {
            // Remove bullet
            this.bullets.splice(i, 1);

            // Damage shield block
            block.health--;
            if (block.health <= 0) {
              shield.blocks.splice(k, 1);
            }

            break;
          }
        }
      }
    }

    // Check shields collision with enemy bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.enemyBullets[i];

      for (let j = 0; j < this.shields.length; j++) {
        const shield = this.shields[j];

        for (let k = shield.blocks.length - 1; k >= 0; k--) {
          const block = shield.blocks[k];

          if (this.isColliding(bullet, block)) {
            // Remove bullet
            this.enemyBullets.splice(i, 1);

            // Damage shield block
            block.health--;
            if (block.health <= 0) {
              shield.blocks.splice(k, 1);
            }

            break;
          }
        }
      }
    }

    // Check player collision with enemy bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.enemyBullets[i];

      if (this.isColliding(bullet, this.player)) {
        // Remove bullet
        this.enemyBullets.splice(i, 1);

        // Lose a life
        this.lives--;
        this.updateScoreDisplay();

        // Add explosion
        this.addExplosion(
          this.player.x + this.player.width / 2,
          this.player.y + this.player.height / 2
        );

        // Play sound
        this.playSound("playerHit");

        if (this.lives <= 0) {
          this.gameOver = true;
        }

        break;
      }
    }
  }

  isColliding(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  addExplosion(x, y) {
    this.explosions.push({
      x,
      y,
      radius: 5,
      maxRadius: 30,
      ttl: 500, // ms
      color: "#f59e0b",
    });
  }

  playSound(type) {
    // Add sound effects if needed
  }

  levelUp() {
    this.level++;
    this.enemiesDefeated = 0;
    this.enemySpeed = 1 + this.level * 0.2;

    // Create new enemies
    this.createEnemies();

    // Repair shields a bit
    this.shields.forEach((shield) => {
      const newBlocks = this.createShieldBlocks(
        shield.x,
        shield.y,
        shield.width,
        shield.height
      );
      // Only add blocks where there are none
      newBlocks.forEach((newBlock) => {
        if (
          !shield.blocks.some(
            (block) => block.x === newBlock.x && block.y === newBlock.y
          )
        ) {
          newBlock.health = 1; // Repaired blocks have less health
          shield.blocks.push(newBlock);
        }
      });
    });

    // Increment score for completing a level
    this.score += 100 * this.level;

    // Update score display
    this.updateScoreDisplay();

    // Show level up message
    this.showLevelUpMessage();
  }

  showLevelUpMessage() {
    // Display level up message
    const levelMessage = document.getElementById("levelMessage");
    if (levelMessage) {
      levelMessage.classList.add("visible");

      // Hide message after 2 seconds
      setTimeout(() => {
        levelMessage.classList.remove("visible");
      }, 2000);
    }
  }

  showGameOver() {
    // Show game over screen
    const gameOverScreen = document.getElementById("gameOverScreen");
    const finalScoreElement = document.getElementById("finalScore");

    if (gameOverScreen && finalScoreElement) {
      finalScoreElement.textContent = this.score;
      gameOverScreen.classList.add("visible");

      // Setup restart button
      const playAgainBtn = document.getElementById("playAgainBtn");
      if (playAgainBtn) {
        playAgainBtn.addEventListener(
          "click",
          () => {
            gameOverScreen.classList.remove("visible");
            this.reset();
            this.start();
          },
          { once: true }
        );
      }
    }
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw starfield background
    this.drawStarfield();

    // Draw player
    this.drawPlayer();

    // Draw enemies
    this.drawEnemies();

    // Draw bullets
    this.drawBullets();

    // Draw shields
    this.drawShields();

    // Draw explosions
    this.drawExplosions();
  }

  drawPlayer() {
    // Draw player ship
    this.ctx.fillStyle = this.player.color;

    // Ship body
    this.ctx.beginPath();
    this.ctx.moveTo(this.player.x + this.player.width / 2, this.player.y);
    this.ctx.lineTo(
      this.player.x + this.player.width,
      this.player.y + this.player.height
    );
    this.ctx.lineTo(this.player.x, this.player.y + this.player.height);
    this.ctx.closePath();
    this.ctx.fill();

    // Engine glow
    if (this.gameRunning && !this.isPaused) {
      this.ctx.fillStyle = "#818cf8";
      this.ctx.beginPath();
      this.ctx.moveTo(
        this.player.x + this.player.width / 2 - 10,
        this.player.y + this.player.height
      );
      this.ctx.lineTo(
        this.player.x + this.player.width / 2 - 5,
        this.player.y + this.player.height + 10
      );
      this.ctx.lineTo(
        this.player.x + this.player.width / 2 + 5,
        this.player.y + this.player.height + 10
      );
      this.ctx.lineTo(
        this.player.x + this.player.width / 2 + 10,
        this.player.y + this.player.height
      );
      this.ctx.closePath();
      this.ctx.fill();
    }
  }

  drawEnemies() {
    this.enemies.forEach((enemy) => {
      if (enemy.alive) {
        let color;
        switch (enemy.type) {
          case 0:
            color = "#10b981"; // Basic enemy
            break;
          case 1:
            color = "#0891b2"; // Medium enemy
            break;
          case 2:
            color = "#7c3aed"; // Hard enemy
            break;
        }

        this.ctx.fillStyle = color;

        // Draw different enemy shapes based on type
        if (enemy.type === 0) {
          // Simple square with eyes
          this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

          // Eyes
          this.ctx.fillStyle = "#000";
          this.ctx.fillRect(enemy.x + 8, enemy.y + 10, 6, 6);
          this.ctx.fillRect(enemy.x + enemy.width - 14, enemy.y + 10, 6, 6);
        } else if (enemy.type === 1) {
          // Octopus-like
          this.ctx.beginPath();
          this.ctx.ellipse(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2,
            enemy.width / 2,
            enemy.height / 2,
            0,
            0,
            Math.PI * 2
          );
          this.ctx.fill();

          // Tentacles
          this.ctx.strokeStyle = color;
          this.ctx.lineWidth = 3;

          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI + Math.PI / 12;
            const startX =
              enemy.x + enemy.width / 2 + (enemy.width / 2) * Math.cos(angle);
            const startY =
              enemy.y + enemy.height / 2 + (enemy.height / 2) * Math.sin(angle);

            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(
              startX + 5 * Math.cos(angle),
              startY + 5 * Math.sin(angle)
            );
            this.ctx.stroke();
          }

          // Eyes
          this.ctx.fillStyle = "#fff";
          this.ctx.beginPath();
          this.ctx.ellipse(
            enemy.x + enemy.width / 2 - 8,
            enemy.y + enemy.height / 2 - 2,
            4,
            4,
            0,
            0,
            Math.PI * 2
          );
          this.ctx.fill();

          this.ctx.beginPath();
          this.ctx.ellipse(
            enemy.x + enemy.width / 2 + 8,
            enemy.y + enemy.height / 2 - 2,
            4,
            4,
            0,
            0,
            Math.PI * 2
          );
          this.ctx.fill();
        } else if (enemy.type === 2) {
          // Crab-like enemy
          this.ctx.beginPath();
          this.ctx.ellipse(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2,
            enemy.width / 2,
            enemy.height / 2,
            0,
            0,
            Math.PI * 2
          );
          this.ctx.fill();

          // Claws
          this.ctx.beginPath();
          this.ctx.moveTo(enemy.x, enemy.y + enemy.height / 2);
          this.ctx.lineTo(enemy.x - 8, enemy.y + enemy.height / 2 - 8);
          this.ctx.lineTo(enemy.x - 4, enemy.y + enemy.height / 2);
          this.ctx.lineTo(enemy.x - 8, enemy.y + enemy.height / 2 + 8);
          this.ctx.closePath();
          this.ctx.fill();

          this.ctx.beginPath();
          this.ctx.moveTo(enemy.x + enemy.width, enemy.y + enemy.height / 2);
          this.ctx.lineTo(
            enemy.x + enemy.width + 8,
            enemy.y + enemy.height / 2 - 8
          );
          this.ctx.lineTo(
            enemy.x + enemy.width + 4,
            enemy.y + enemy.height / 2
          );
          this.ctx.lineTo(
            enemy.x + enemy.width + 8,
            enemy.y + enemy.height / 2 + 8
          );
          this.ctx.closePath();
          this.ctx.fill();

          // Eyes
          this.ctx.fillStyle = "#fff";
          this.ctx.beginPath();
          this.ctx.ellipse(
            enemy.x + enemy.width / 2 - 8,
            enemy.y + enemy.height / 2 - 2,
            3,
            5,
            0,
            0,
            Math.PI * 2
          );
          this.ctx.fill();

          this.ctx.beginPath();
          this.ctx.ellipse(
            enemy.x + enemy.width / 2 + 8,
            enemy.y + enemy.height / 2 - 2,
            3,
            5,
            0,
            0,
            Math.PI * 2
          );
          this.ctx.fill();

          // Pupils
          this.ctx.fillStyle = "#000";
          this.ctx.beginPath();
          this.ctx.ellipse(
            enemy.x + enemy.width / 2 - 8,
            enemy.y + enemy.height / 2 - 2,
            1.5,
            3,
            0,
            0,
            Math.PI * 2
          );
          this.ctx.fill();

          this.ctx.beginPath();
          this.ctx.ellipse(
            enemy.x + enemy.width / 2 + 8,
            enemy.y + enemy.height / 2 - 2,
            1.5,
            3,
            0,
            0,
            Math.PI * 2
          );
          this.ctx.fill();
        }
      }
    });
  }

  drawBullets() {
    // Draw player bullets
    this.bullets.forEach((bullet) => {
      this.ctx.fillStyle = bullet.color;
      this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Draw enemy bullets
    this.enemyBullets.forEach((bullet) => {
      this.ctx.fillStyle = bullet.color;
      this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
  }

  drawShields() {
    this.shields.forEach((shield) => {
      shield.blocks.forEach((block) => {
        // Different colors based on health
        if (block.health === 3) {
          this.ctx.fillStyle = "#3b82f6";
        } else if (block.health === 2) {
          this.ctx.fillStyle = "#60a5fa";
        } else {
          this.ctx.fillStyle = "#93c5fd";
        }

        this.ctx.fillRect(block.x, block.y, block.width, block.height);
      });
    });
  }

  drawExplosions() {
    this.explosions.forEach((explosion) => {
      const gradient = this.ctx.createRadialGradient(
        explosion.x,
        explosion.y,
        0,
        explosion.x,
        explosion.y,
        explosion.radius
      );

      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.4, explosion.color);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Grow the explosion over time
      explosion.radius = Math.min(
        explosion.maxRadius,
        explosion.radius + explosion.maxRadius / (explosion.ttl / 30)
      );
    });
  }

  drawStarfield() {
    // Create a starfield effect
    const starCount = 100;
    this.ctx.fillStyle = "#ffffff";

    for (let i = 0; i < starCount; i++) {
      const x = ((Math.sin(i * 523) + 1) * this.canvas.width) / 2;
      const y = ((Math.cos(i * 327) + 1) * this.canvas.height) / 2;
      const size = (Math.sin(i) + 1) * 1.5 + 0.5;

      this.ctx.fillRect(x, y, size, size);
    }
  }

  drawPauseScreen() {
    // Draw the game
    this.draw();

    // Add a semi-transparent overlay
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Display pause message
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "30px Poppins, sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.fillText("PAUSED", this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.font = "16px Poppins, sans-serif";
    this.ctx.fillText(
      "Press P or the Pause button to resume",
      this.canvas.width / 2,
      this.canvas.height / 2 + 40
    );
  }
}

// Initialize the game
document.addEventListener("DOMContentLoaded", () => {
  const game = new SpaceInvaders();
  game.draw(); // Initial draw

  // Check if mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    const mobileControls = document.querySelector(".mobile-controls");
    if (mobileControls) {
      mobileControls.style.display = "block";
    }
  }

  // Add keyboard focus to canvas
  const canvas = document.getElementById("gameCanvas");
  if (canvas) {
    canvas.addEventListener("click", () => {
      canvas.focus();
    });
  }
});
