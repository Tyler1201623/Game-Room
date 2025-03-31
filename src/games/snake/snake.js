/**
 * Modern Snake Game
 * Enhanced with power-ups, obstacles and different modes
 */
class Snake {
  constructor(canvas) {
    // Game elements
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    // Game configuration
    this.config = {
      gridSize: 20,
      initialSpeed: 150,
      minSpeed: 50,
      speedDecrease: 5,
      powerUpDuration: 5000,
      obstacleCount: 0,
    };

    // Game state
    this.snake = [{ x: 10, y: 10 }];
    this.direction = "right";
    this.pendingDirection = "right";
    this.food = null;
    this.powerUp = null;
    this.obstacles = [];
    this.score = 0;
    this.highScore = this.getHighScore();
    this.gameLoop = null;
    this.speed = this.config.initialSpeed;
    this.isPaused = false;
    this.activePowerUp = null;
    this.powerUpTimer = null;
    this.difficultyLevel = 1;
    this.gameMode = "classic"; // classic, timeAttack, obstacle

    // Colors
    this.colors = {
      background: "#2c3e50",
      snake: "#2ecc71",
      snakeHead: "#27ae60",
      food: "#e74c3c",
      powerUpSpeed: "#f1c40f",
      powerUpGrow: "#9b59b6",
      powerUpShrink: "#3498db",
      obstacle: "#7f8c8d",
      text: "#ecf0f1",
    };

    // Initialize
    this.setupEventListeners();
    this.drawStartScreen();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Keyboard controls
    document.addEventListener("keydown", (e) => {
      this.handleKeyPress(e);
    });

    // Game buttons
    document.getElementById("startBtn").addEventListener("click", () => {
      this.startGame();
    });

    document.getElementById("pauseBtn")?.addEventListener("click", () => {
      this.togglePause();
    });

    // Game mode selection
    document.querySelectorAll(".mode-option")?.forEach((option) => {
      option.addEventListener("click", (e) => {
        document
          .querySelectorAll(".mode-option")
          .forEach((opt) => opt.classList.remove("selected"));
        e.target.classList.add("selected");
        this.gameMode = e.target.dataset.mode;
        this.updateGameMode();
      });
    });

    // Difficulty selection
    document.querySelectorAll(".difficulty-option")?.forEach((option) => {
      option.addEventListener("click", (e) => {
        document
          .querySelectorAll(".difficulty-option")
          .forEach((opt) => opt.classList.remove("selected"));
        e.target.classList.add("selected");
        this.difficultyLevel = parseInt(e.target.dataset.level);
        this.updateDifficulty();
      });
    });
  }

  /**
   * Handle keyboard input
   */
  handleKeyPress(e) {
    if (this.isPaused) {
      if (e.key === " " || e.key === "Escape") {
        this.togglePause();
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowUp":
        if (this.direction !== "down") this.pendingDirection = "up";
        e.preventDefault();
        break;
      case "ArrowDown":
        if (this.direction !== "up") this.pendingDirection = "down";
        e.preventDefault();
        break;
      case "ArrowLeft":
        if (this.direction !== "right") this.pendingDirection = "left";
        e.preventDefault();
        break;
      case "ArrowRight":
        if (this.direction !== "left") this.pendingDirection = "right";
        e.preventDefault();
        break;
      case "p":
      case "P":
      case " ":
      case "Escape":
        this.togglePause();
        e.preventDefault();
        break;
    }
  }

  /**
   * Update configuration based on game mode
   */
  updateGameMode() {
    switch (this.gameMode) {
      case "classic":
        // Default settings
        break;
      case "timeAttack":
        this.config.speedDecrease = 10;
        break;
      case "obstacle":
        this.config.obstacleCount = 5 * this.difficultyLevel;
        break;
    }
  }

  /**
   * Update configuration based on difficulty level
   */
  updateDifficulty() {
    this.config.initialSpeed = 180 - this.difficultyLevel * 30;
    this.speed = this.config.initialSpeed;

    if (this.gameMode === "obstacle") {
      this.config.obstacleCount = 5 * this.difficultyLevel;
    }
  }

  /**
   * Generate food item
   */
  generateFood() {
    let newFood;
    let validPosition = false;

    while (!validPosition) {
      newFood = {
        x: Math.floor(
          Math.random() * (this.canvas.width / this.config.gridSize)
        ),
        y: Math.floor(
          Math.random() * (this.canvas.height / this.config.gridSize)
        ),
      };

      validPosition = true;

      // Check if food overlaps with snake
      for (const segment of this.snake) {
        if (segment.x === newFood.x && segment.y === newFood.y) {
          validPosition = false;
          break;
        }
      }

      // Check if food overlaps with obstacles
      if (validPosition) {
        for (const obstacle of this.obstacles) {
          if (obstacle.x === newFood.x && obstacle.y === newFood.y) {
            validPosition = false;
            break;
          }
        }
      }

      // Check if food overlaps with power-up
      if (validPosition && this.powerUp) {
        if (this.powerUp.x === newFood.x && this.powerUp.y === newFood.y) {
          validPosition = false;
        }
      }
    }

    return newFood;
  }

  /**
   * Generate a power-up with a random type
   */
  generatePowerUp() {
    if (Math.random() < 0.3 || this.powerUp) return;

    const types = ["speed", "grow", "shrink"];
    const type = types[Math.floor(Math.random() * types.length)];

    let powerUp;
    let validPosition = false;

    while (!validPosition) {
      powerUp = {
        x: Math.floor(
          Math.random() * (this.canvas.width / this.config.gridSize)
        ),
        y: Math.floor(
          Math.random() * (this.canvas.height / this.config.gridSize)
        ),
        type: type,
      };

      validPosition = true;

      // Check if power-up overlaps with snake
      for (const segment of this.snake) {
        if (segment.x === powerUp.x && segment.y === powerUp.y) {
          validPosition = false;
          break;
        }
      }

      // Check if power-up overlaps with food
      if (
        validPosition &&
        this.food.x === powerUp.x &&
        this.food.y === powerUp.y
      ) {
        validPosition = false;
      }

      // Check if power-up overlaps with obstacles
      if (validPosition) {
        for (const obstacle of this.obstacles) {
          if (obstacle.x === powerUp.x && obstacle.y === powerUp.y) {
            validPosition = false;
            break;
          }
        }
      }
    }

    return powerUp;
  }

  /**
   * Generate obstacles
   */
  generateObstacles() {
    this.obstacles = [];

    for (let i = 0; i < this.config.obstacleCount; i++) {
      let obstacle;
      let validPosition = false;

      while (!validPosition) {
        obstacle = {
          x: Math.floor(
            Math.random() * (this.canvas.width / this.config.gridSize)
          ),
          y: Math.floor(
            Math.random() * (this.canvas.height / this.config.gridSize)
          ),
        };

        validPosition = true;

        // Don't place obstacles too close to starting snake
        const centerX = this.canvas.width / this.config.gridSize / 2;
        const centerY = this.canvas.height / this.config.gridSize / 2;

        if (
          Math.abs(obstacle.x - centerX) < 3 &&
          Math.abs(obstacle.y - centerY) < 3
        ) {
          validPosition = false;
          continue;
        }

        // Check if obstacle overlaps with existing obstacles
        for (const existingObstacle of this.obstacles) {
          if (
            existingObstacle.x === obstacle.x &&
            existingObstacle.y === obstacle.y
          ) {
            validPosition = false;
            break;
          }
        }
      }

      this.obstacles.push(obstacle);
    }
  }

  /**
   * Apply power-up effect
   */
  applyPowerUp() {
    const type = this.powerUp.type;
    this.activePowerUp = type;

    switch (type) {
      case "speed":
        // Temporarily increase speed
        this.speed = Math.max(this.config.minSpeed, this.speed - 50);
        break;
      case "grow":
        // Add 2 extra segments
        for (let i = 0; i < 2; i++) {
          this.snake.push({ ...this.snake[this.snake.length - 1] });
        }
        break;
      case "shrink":
        // Remove up to 3 segments (keeping at least 1)
        const segments = Math.min(3, this.snake.length - 1);
        if (segments > 0) {
          this.snake.splice(this.snake.length - segments, segments);
        }
        break;
    }

    // Set a timer to end the power-up effect
    if (this.powerUpTimer) {
      clearTimeout(this.powerUpTimer);
    }

    // Reset power-up after duration
    this.powerUpTimer = setTimeout(() => {
      if (type === "speed") {
        this.speed =
          this.config.initialSpeed -
          Math.floor(this.score / 100) * this.config.speedDecrease;
        this.speed = Math.max(this.config.minSpeed, this.speed);
      }
      this.activePowerUp = null;
    }, this.config.powerUpDuration);

    // Reset the power-up
    this.powerUp = null;
  }

  /**
   * Draw the game
   */
  draw() {
    // Clear canvas
    this.ctx.fillStyle = this.colors.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw obstacles
    this.ctx.fillStyle = this.colors.obstacle;
    this.obstacles.forEach((obstacle) => {
      this.ctx.fillRect(
        obstacle.x * this.config.gridSize,
        obstacle.y * this.config.gridSize,
        this.config.gridSize,
        this.config.gridSize
      );
    });

    // Draw snake
    this.snake.forEach((segment, index) => {
      // Use different color for the head
      this.ctx.fillStyle =
        index === 0 ? this.colors.snakeHead : this.colors.snake;

      this.ctx.fillRect(
        segment.x * this.config.gridSize,
        segment.y * this.config.gridSize,
        this.config.gridSize - 2,
        this.config.gridSize - 2
      );
    });

    // Draw food
    this.ctx.fillStyle = this.colors.food;
    this.ctx.beginPath();
    const foodX = this.food.x * this.config.gridSize + this.config.gridSize / 2;
    const foodY = this.food.y * this.config.gridSize + this.config.gridSize / 2;
    this.ctx.arc(foodX, foodY, this.config.gridSize / 2 - 2, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw power-up if exists
    if (this.powerUp) {
      let powerUpColor;
      switch (this.powerUp.type) {
        case "speed":
          powerUpColor = this.colors.powerUpSpeed;
          break;
        case "grow":
          powerUpColor = this.colors.powerUpGrow;
          break;
        case "shrink":
          powerUpColor = this.colors.powerUpShrink;
          break;
      }

      this.ctx.fillStyle = powerUpColor;
      const powerUpX =
        this.powerUp.x * this.config.gridSize + this.config.gridSize / 2;
      const powerUpY =
        this.powerUp.y * this.config.gridSize + this.config.gridSize / 2;

      // Draw star shape for power-up
      this.ctx.beginPath();
      this.drawStar(
        powerUpX,
        powerUpY,
        5,
        this.config.gridSize / 2 - 2,
        this.config.gridSize / 4 - 2
      );
      this.ctx.fill();
    }

    // Draw active power-up indicator
    if (this.activePowerUp) {
      this.ctx.fillStyle = this.colors.text;
      this.ctx.font = "16px Arial";
      this.ctx.textAlign = "left";
      const text = `PowerUp: ${this.activePowerUp.toUpperCase()}`;
      this.ctx.fillText(text, 10, 25);
    }

    // Draw score
    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = "16px Arial";
    this.ctx.textAlign = "right";
    this.ctx.fillText(`Score: ${this.score}`, this.canvas.width - 10, 25);

    // Draw pause overlay if paused
    if (this.isPaused) {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.fillStyle = this.colors.text;
      this.ctx.font = "24px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        "PAUSED",
        this.canvas.width / 2,
        this.canvas.height / 2
      );
      this.ctx.font = "16px Arial";
      this.ctx.fillText(
        "Press SPACE to resume",
        this.canvas.width / 2,
        this.canvas.height / 2 + 30
      );
    }
  }

  /**
   * Draw a star shape
   */
  drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      this.ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.ctx.lineTo(x, y);
      rot += step;
    }

    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.closePath();
  }

  /**
   * Move the snake
   */
  move() {
    // Apply pending direction change
    this.direction = this.pendingDirection;

    const head = { ...this.snake[0] };

    switch (this.direction) {
      case "up":
        head.y--;
        break;
      case "down":
        head.y++;
        break;
      case "left":
        head.x--;
        break;
      case "right":
        head.x++;
        break;
    }

    // Check collision with walls
    if (
      head.x < 0 ||
      head.x >= this.canvas.width / this.config.gridSize ||
      head.y < 0 ||
      head.y >= this.canvas.height / this.config.gridSize
    ) {
      this.gameOver();
      return;
    }

    // Check collision with obstacles
    for (const obstacle of this.obstacles) {
      if (head.x === obstacle.x && head.y === obstacle.y) {
        this.gameOver();
        return;
      }
    }

    // Check collision with self
    for (const segment of this.snake) {
      if (head.x === segment.x && head.y === segment.y) {
        this.gameOver();
        return;
      }
    }

    this.snake.unshift(head);

    // Check if snake ate food
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      this.updateScore();
      this.food = this.generateFood();

      // Generate power-up occasionally
      if (!this.powerUp && Math.random() < 0.3) {
        this.powerUp = this.generatePowerUp();
      }

      // Increase speed
      if (this.activePowerUp !== "speed") {
        this.speed = Math.max(
          this.config.minSpeed,
          this.speed - this.config.speedDecrease
        );
      }
    } else {
      this.snake.pop();
    }

    // Check if snake ate power-up
    if (
      this.powerUp &&
      head.x === this.powerUp.x &&
      head.y === this.powerUp.y
    ) {
      this.applyPowerUp();
    }
  }

  /**
   * Update score display
   */
  updateScore() {
    document.getElementById("score").textContent = this.score;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem("snakeHighScore", this.highScore);
      document.getElementById("highScore").textContent = this.highScore;
    }
  }

  /**
   * Get high score from localStorage
   */
  getHighScore() {
    const savedScore = localStorage.getItem("snakeHighScore");
    return savedScore ? parseInt(savedScore) : 0;
  }

  /**
   * Handle game over
   */
  gameOver() {
    clearInterval(this.gameLoop);

    // Save high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem("snakeHighScore", this.highScore);
    }

    // Notify main app about game completion for high score tracking
    window.dispatchEvent(
      new CustomEvent("game:completed", {
        detail: {
          game: "snake",
          score: this.score,
          mode: this.gameMode,
          level: this.difficultyLevel,
        },
      })
    );

    // Show game over screen
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = "30px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "GAME OVER",
      this.canvas.width / 2,
      this.canvas.height / 2 - 30
    );

    this.ctx.font = "20px Arial";
    this.ctx.fillText(
      `Score: ${this.score}`,
      this.canvas.width / 2,
      this.canvas.height / 2 + 10
    );

    if (this.score >= this.highScore) {
      this.ctx.fillStyle = "#f1c40f";
      this.ctx.fillText(
        "NEW HIGH SCORE!",
        this.canvas.width / 2,
        this.canvas.height / 2 + 40
      );
    }
  }

  /**
   * Toggle pause state
   */
  togglePause() {
    this.isPaused = !this.isPaused;
    this.draw();
  }

  /**
   * Reset game state
   */
  reset() {
    this.snake = [{ x: 10, y: 10 }];
    this.direction = "right";
    this.pendingDirection = "right";

    // Generate new elements
    this.generateObstacles();
    this.food = this.generateFood();
    this.powerUp = null;

    // Reset game state
    this.score = 0;
    this.updateScore();
    this.speed = this.config.initialSpeed;
    this.isPaused = false;
    this.activePowerUp = null;

    if (this.powerUpTimer) {
      clearTimeout(this.powerUpTimer);
      this.powerUpTimer = null;
    }
  }

  /**
   * Start the game
   */
  startGame() {
    if (this.gameLoop) clearInterval(this.gameLoop);

    this.updateGameMode();
    this.updateDifficulty();
    this.reset();

    this.gameLoop = setInterval(() => {
      if (!this.isPaused) {
        this.move();
        this.draw();
      }
    }, this.speed);
  }

  /**
   * Draw start screen
   */
  drawStartScreen() {
    this.ctx.fillStyle = this.colors.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = "30px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText("SNAKE GAME", this.canvas.width / 2, 80);

    this.ctx.font = "16px Arial";
    this.ctx.fillText(
      "Use arrow keys to control the snake",
      this.canvas.width / 2,
      120
    );
    this.ctx.fillText(
      "Collect food to grow and earn points",
      this.canvas.width / 2,
      150
    );
    this.ctx.fillText("Press P or SPACE to pause", this.canvas.width / 2, 180);

    this.ctx.font = "20px Arial";
    this.ctx.fillText(
      "Press START to begin",
      this.canvas.width / 2,
      this.canvas.height - 50
    );
  }
}

// Initialize game when window loads
window.onload = () => {
  const canvas = document.getElementById("gameCanvas");

  // Display high score if element exists
  const highScoreElement = document.getElementById("highScore");
  if (highScoreElement) {
    const savedScore = localStorage.getItem("snakeHighScore") || "0";
    highScoreElement.textContent = savedScore;
  }

  new Snake(canvas);
};
