class PacMan {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.score = 0;
    this.scoreElement = document.getElementById("score");
    this.gameActive = false;

    // Original Pac-Man maze dimensions
    this.tileSize = 20;
    this.mazeWidth = 28;
    this.mazeHeight = 31;

    // Set canvas size to match original arcade dimensions
    this.canvas.width = this.mazeWidth * this.tileSize;
    this.canvas.height = this.mazeHeight * this.tileSize;

    // Original maze layout
    this.maze = [
      "############################",
      "#............##............#",
      "#.####.#####.##.#####.####.#",
      "#o####.#####.##.#####.####o#",
      "#.####.#####.##.#####.####.#",
      "#..........................#",
      "#.####.##.########.##.####.#",
      "#.####.##.########.##.####.#",
      "#......##....##....##......#",
      "######.##### ## #####.######",
      "     #.##### ## #####.#     ",
      "     #.##          ##.#     ",
      "     #.## ###--### ##.#     ",
      "######.## #      # ##.######",
      "      .   #      #   .      ",
      "######.## #      # ##.######",
      "     #.## ######## ##.#     ",
      "     #.##          ##.#     ",
      "     #.## ######## ##.#     ",
      "######.## ######## ##.######",
      "#............##............#",
      "#.####.#####.##.#####.####.#",
      "#.####.#####.##.#####.####.#",
      "#o..##................##..o#",
      "###.##.##.########.##.##.###",
      "#......##....##....##......#",
      "#.##########.##.##########.#",
      "#.##########.##.##########.#",
      "#..........................#",
      "############################",
    ];

    this.initializeGame();
    this.setupControls();
    this.setupButtons();
  }

  initializeGame() {
    this.pacman = {
      x: 14 * this.tileSize,
      y: 23 * this.tileSize,
      radius: this.tileSize / 2,
      speed: 1.5,
      direction: 0,
      nextDirection: 0,
      mouthOpen: 0,
    };

    this.ghosts = [
      {
        x: 14 * this.tileSize,
        y: 11 * this.tileSize,
        color: "#FF0000",
        speed: 1.5,
        direction: 0,
        mode: "scatter",
      },
      {
        x: 13 * this.tileSize,
        y: 14 * this.tileSize,
        color: "#FFB8FF",
        speed: 1.5,
        direction: Math.PI,
        mode: "scatter",
      },
      {
        x: 14 * this.tileSize,
        y: 14 * this.tileSize,
        color: "#00FFFF",
        speed: 1.5,
        direction: Math.PI,
        mode: "scatter",
      },
      {
        x: 15 * this.tileSize,
        y: 14 * this.tileSize,
        color: "#FFB852",
        speed: 1.5,
        direction: Math.PI,
        mode: "scatter",
      },
    ];

    this.dots = [];
    this.createDots();
    this.score = 0;
    this.scoreElement.textContent = "0";
  }

  setupButtons() {
    const startBtn = document.getElementById("startBtn");
    startBtn.addEventListener("click", () => {
      this.gameActive = true;
      this.initializeGame();
      this.gameLoop();
    });
  }

  createDots() {
    for (let y = 0; y < this.maze.length; y++) {
      for (let x = 0; x < this.maze[y].length; x++) {
        if (this.maze[y][x] === "." || this.maze[y][x] === "o") {
          this.dots.push({
            x: x * this.tileSize + this.tileSize / 2,
            y: y * this.tileSize + this.tileSize / 2,
            radius: this.maze[y][x] === "o" ? 6 : 2,
            eaten: false,
          });
        }
      }
    }
  }

  gameLoop() {
    if (!this.gameActive) return;
    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    this.updatePacman();
    this.updateGhosts();
    this.checkCollisions();
  }

  updatePacman() {
    const nextX =
      this.pacman.x + Math.cos(this.pacman.nextDirection) * this.pacman.speed;
    const nextY =
      this.pacman.y + Math.sin(this.pacman.nextDirection) * this.pacman.speed;

    const nextGridX = Math.floor(nextX / this.tileSize);
    const nextGridY = Math.floor(nextY / this.tileSize);

    if (this.maze[nextGridY] && this.maze[nextGridY][nextGridX] !== "#") {
      this.pacman.direction = this.pacman.nextDirection;
    }

    const newX =
      this.pacman.x + Math.cos(this.pacman.direction) * this.pacman.speed;
    const newY =
      this.pacman.y + Math.sin(this.pacman.direction) * this.pacman.speed;

    const gridX = Math.floor(newX / this.tileSize);
    const gridY = Math.floor(newY / this.tileSize);

    if (this.maze[gridY] && this.maze[gridY][gridX] !== "#") {
      this.pacman.x = newX;
      this.pacman.y = newY;
    }

    this.pacman.mouthOpen = (this.pacman.mouthOpen + 0.07) % Math.PI;
  }

  updateGhosts() {
    this.ghosts.forEach((ghost) => {
      if (Math.random() < 0.02) {
        ghost.direction = Math.random() * Math.PI * 2;
      }
      ghost.x += Math.cos(ghost.direction) * ghost.speed;
      ghost.y += Math.sin(ghost.direction) * ghost.speed;
    });
  }

  checkCollisions() {
    this.ghosts.forEach((ghost) => {
      const dx = this.pacman.x - ghost.x;
      const dy = this.pacman.y - ghost.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.pacman.radius + 14) {
        this.gameOver();
      }
    });

    this.dots.forEach((dot) => {
      if (!dot.eaten) {
        const dx = this.pacman.x - dot.x;
        const dy = this.pacman.y - dot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.pacman.radius + dot.radius) {
          dot.eaten = true;
          this.score += dot.radius === 6 ? 50 : 10;
          this.scoreElement.textContent = this.score;
        }
      }
    });
  }

  draw() {
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawMaze();
    this.drawDots();
    this.drawPacman();
    this.drawGhosts();
  }

  drawMaze() {
    for (let y = 0; y < this.maze.length; y++) {
      for (let x = 0; x < this.maze[y].length; x++) {
        if (this.maze[y][x] === "#") {
          this.ctx.fillStyle = "#2121ff";
          this.ctx.fillRect(
            x * this.tileSize,
            y * this.tileSize,
            this.tileSize,
            this.tileSize
          );
        }
      }
    }
  }

  drawDots() {
    this.dots.forEach((dot) => {
      if (!dot.eaten) {
        this.ctx.beginPath();
        this.ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = "#ffffff";
        this.ctx.fill();
      }
    });
  }

  drawPacman() {
    this.ctx.save();
    this.ctx.translate(this.pacman.x, this.pacman.y);
    this.ctx.rotate(this.pacman.direction);

    this.ctx.beginPath();
    this.ctx.arc(
      0,
      0,
      this.pacman.radius,
      this.pacman.mouthOpen,
      -this.pacman.mouthOpen
    );
    this.ctx.lineTo(0, 0);
    this.ctx.fillStyle = "#FFFF00";
    this.ctx.fill();

    this.ctx.restore();
  }

  drawGhosts() {
    this.ghosts.forEach((ghost) => {
      this.drawGhost(ghost);
    });
  }

  drawGhost(ghost) {
    this.ctx.beginPath();
    this.ctx.arc(ghost.x, ghost.y - 5, 14, Math.PI, 0, false);
    this.ctx.lineTo(ghost.x + 14, ghost.y + 13);

    for (let i = 0; i < 3; i++) {
      this.ctx.quadraticCurveTo(
        ghost.x + 10 - i * 10,
        ghost.y + 20,
        ghost.x + 5 - i * 10,
        ghost.y + 13
      );
    }

    this.ctx.fillStyle = ghost.color;
    this.ctx.fill();

    this.drawGhostEyes(ghost);
  }

  drawGhostEyes(ghost) {
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.beginPath();
    this.ctx.arc(ghost.x - 4, ghost.y - 4, 4, 0, Math.PI * 2);
    this.ctx.arc(ghost.x + 4, ghost.y - 4, 4, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = "#0000FF";
    this.ctx.beginPath();
    this.ctx.arc(ghost.x - 4, ghost.y - 4, 2, 0, Math.PI * 2);
    this.ctx.arc(ghost.x + 4, ghost.y - 4, 2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  setupControls() {
    document.addEventListener("keydown", (e) => {
      if (!this.gameActive) return;

      switch (e.key) {
        case "ArrowLeft":
          this.pacman.nextDirection = Math.PI;
          e.preventDefault();
          break;
        case "ArrowRight":
          this.pacman.nextDirection = 0;
          e.preventDefault();
          break;
        case "ArrowUp":
          this.pacman.nextDirection = -Math.PI / 2;
          e.preventDefault();
          break;
        case "ArrowDown":
          this.pacman.nextDirection = Math.PI / 2;
          e.preventDefault();
          break;
      }
    });

    // Also set up mobile controls
    const mobileUp = document.querySelector(".button-up");
    const mobileDown = document.querySelector(".button-down");
    const mobileLeft = document.querySelector(".button-left");
    const mobileRight = document.querySelector(".button-right");

    if (mobileUp) {
      mobileUp.addEventListener("click", () => {
        if (this.gameActive) this.pacman.nextDirection = -Math.PI / 2;
      });
    }

    if (mobileDown) {
      mobileDown.addEventListener("click", () => {
        if (this.gameActive) this.pacman.nextDirection = Math.PI / 2;
      });
    }

    if (mobileLeft) {
      mobileLeft.addEventListener("click", () => {
        if (this.gameActive) this.pacman.nextDirection = Math.PI;
      });
    }

    if (mobileRight) {
      mobileRight.addEventListener("click", () => {
        if (this.gameActive) this.pacman.nextDirection = 0;
      });
    }
  }

  gameOver() {
    this.gameActive = false;
    alert(`Game Over! Score: ${this.score}`);
    this.initializeGame();
  }
}

new PacMan();
