class Tetris {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.nextCanvas = document.getElementById("nextCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.nextCtx = this.nextCanvas.getContext("2d");
    this.blockSize = 30;
    this.cols = this.canvas.width / this.blockSize;
    this.rows = this.canvas.height / this.blockSize;
    this.board = Array(this.rows)
      .fill()
      .map(() => Array(this.cols).fill(0));
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.gameLoop = null;
    this.isPaused = false;
    this.isGameOver = false;

    this.shapes = {
      I: [[1, 1, 1, 1]],
      L: [
        [1, 0],
        [1, 0],
        [1, 1],
      ],
      J: [
        [0, 1],
        [0, 1],
        [1, 1],
      ],
      O: [
        [1, 1],
        [1, 1],
      ],
      Z: [
        [1, 1, 0],
        [0, 1, 1],
      ],
      S: [
        [0, 1, 1],
        [1, 1, 0],
      ],
      T: [
        [1, 1, 1],
        [0, 1, 0],
      ],
    };

    this.colors = {
      I: "#00f0f0",
      L: "#f0a000",
      J: "#0000f0",
      O: "#f0f000",
      Z: "#f00000",
      S: "#00f000",
      T: "#a000f0",
    };

    this.currentPiece = this.newPiece();
    this.nextPiece = this.newPiece();
    this.setupControls();
  }

  newPiece() {
    const pieces = "ILJOZST";
    const piece = pieces[Math.floor(Math.random() * pieces.length)];
    return {
      shape: this.shapes[piece],
      color: this.colors[piece],
      type: piece,
      x:
        Math.floor(this.cols / 2) -
        Math.floor(this.shapes[piece][0].length / 2),
      y: 0,
    };
  }

  setupControls() {
    // Keyboard controls
    document.addEventListener("keydown", (e) => {
      if (this.isGameOver) return;
      if (!this.isPaused) {
        switch (e.key) {
          case "ArrowLeft":
            this.moveLeft();
            e.preventDefault();
            break;
          case "ArrowRight":
            this.moveRight();
            e.preventDefault();
            break;
          case "ArrowDown":
            this.moveDown();
            e.preventDefault();
            break;
          case "ArrowUp":
            this.rotate();
            e.preventDefault();
            break;
          case " ":
            this.hardDrop();
            e.preventDefault();
            break;
        }
      }

      // Pause toggle with P key
      if (e.key === "p" || e.key === "P") {
        this.togglePause();
        e.preventDefault();
      }
    });

    // Mobile controls
    const leftBtn = document.querySelector(".left-btn");
    const rightBtn = document.querySelector(".right-btn");
    const downBtn = document.querySelector(".down-btn");
    const rotateBtn = document.querySelector(".rotate-btn");

    if (leftBtn) leftBtn.addEventListener("click", () => this.moveLeft());
    if (rightBtn) rightBtn.addEventListener("click", () => this.moveRight());
    if (downBtn) downBtn.addEventListener("click", () => this.moveDown());
    if (rotateBtn) rotateBtn.addEventListener("click", () => this.rotate());

    // Button controls
    document
      .getElementById("startBtn")
      .addEventListener("click", () => this.start());
    document
      .getElementById("pauseBtn")
      .addEventListener("click", () => this.togglePause());
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = "#121212";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid lines
    this.ctx.strokeStyle = "#333";
    this.ctx.lineWidth = 0.5;

    // Vertical grid lines
    for (let i = 0; i <= this.cols; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * this.blockSize, 0);
      this.ctx.lineTo(i * this.blockSize, this.canvas.height);
      this.ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = 0; i <= this.rows; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i * this.blockSize);
      this.ctx.lineTo(this.canvas.width, i * this.blockSize);
      this.ctx.stroke();
    }

    // Draw board
    this.board.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          this.drawBlock(x, y, value);
        }
      });
    });

    // Draw current piece
    this.drawPiece(this.currentPiece, this.ctx);

    // Draw shadow piece (preview of where piece will land)
    this.drawShadowPiece();

    // Draw next piece preview
    this.nextCtx.fillStyle = "#121212";
    this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
    this.drawPiece(this.nextPiece, this.nextCtx, true);

    // Draw game over
    if (this.isGameOver) {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.font = "24px Poppins";
      this.ctx.fillStyle = "#fff";
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        "GAME OVER",
        this.canvas.width / 2,
        this.canvas.height / 2 - 50
      );
      this.ctx.fillText(
        `Score: ${this.score}`,
        this.canvas.width / 2,
        this.canvas.height / 2
      );
      this.ctx.fillText(
        "Press START to play again",
        this.canvas.width / 2,
        this.canvas.height / 2 + 50
      );
    }
  }

  drawBlock(x, y, color) {
    // Add 3D effect to blocks
    const highlight = this.lightenColor(color, 30);
    const shadow = this.darkenColor(color, 30);
    const blockMargin = 1; // Space between blocks

    // Main block
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      x * this.blockSize + blockMargin,
      y * this.blockSize + blockMargin,
      this.blockSize - blockMargin * 2,
      this.blockSize - blockMargin * 2
    );

    // Highlight (top and left edges)
    this.ctx.fillStyle = highlight;
    this.ctx.beginPath();
    this.ctx.moveTo(
      x * this.blockSize + blockMargin,
      y * this.blockSize + blockMargin
    );
    this.ctx.lineTo(
      x * this.blockSize + this.blockSize - blockMargin,
      y * this.blockSize + blockMargin
    );
    this.ctx.lineTo(
      x * this.blockSize + this.blockSize - blockMargin - 3,
      y * this.blockSize + blockMargin + 3
    );
    this.ctx.lineTo(
      x * this.blockSize + blockMargin + 3,
      y * this.blockSize + blockMargin + 3
    );
    this.ctx.lineTo(
      x * this.blockSize + blockMargin + 3,
      y * this.blockSize + this.blockSize - blockMargin - 3
    );
    this.ctx.lineTo(
      x * this.blockSize + blockMargin,
      y * this.blockSize + this.blockSize - blockMargin
    );
    this.ctx.closePath();
    this.ctx.fill();

    // Shadow (bottom and right edges)
    this.ctx.fillStyle = shadow;
    this.ctx.beginPath();
    this.ctx.moveTo(
      x * this.blockSize + this.blockSize - blockMargin,
      y * this.blockSize + blockMargin
    );
    this.ctx.lineTo(
      x * this.blockSize + this.blockSize - blockMargin,
      y * this.blockSize + this.blockSize - blockMargin
    );
    this.ctx.lineTo(
      x * this.blockSize + blockMargin,
      y * this.blockSize + this.blockSize - blockMargin
    );
    this.ctx.lineTo(
      x * this.blockSize + blockMargin + 3,
      y * this.blockSize + this.blockSize - blockMargin - 3
    );
    this.ctx.lineTo(
      x * this.blockSize + this.blockSize - blockMargin - 3,
      y * this.blockSize + this.blockSize - blockMargin - 3
    );
    this.ctx.lineTo(
      x * this.blockSize + this.blockSize - blockMargin - 3,
      y * this.blockSize + blockMargin + 3
    );
    this.ctx.closePath();
    this.ctx.fill();
  }

  lightenColor(color, amount) {
    const hex = color.replace("#", "");
    const r = Math.min(255, parseInt(hex.substring(0, 2), 16) + amount);
    const g = Math.min(255, parseInt(hex.substring(2, 4), 16) + amount);
    const b = Math.min(255, parseInt(hex.substring(4, 6), 16) + amount);
    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  darkenColor(color, amount) {
    const hex = color.replace("#", "");
    const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - amount);
    const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - amount);
    const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - amount);
    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  drawPiece(piece, context, isPreview = false) {
    let offsetX, offsetY;

    if (isPreview) {
      // Center the piece in the preview canvas
      const pieceWidth = piece.shape[0].length * this.blockSize;
      const pieceHeight = piece.shape.length * this.blockSize;
      offsetX = (this.nextCanvas.width - pieceWidth) / 2;
      offsetY = (this.nextCanvas.height - pieceHeight) / 2;
    } else {
      offsetX = piece.x * this.blockSize;
      offsetY = piece.y * this.blockSize;
    }

    piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          if (isPreview) {
            // Simplified block drawing for preview
            context.fillStyle = piece.color;
            context.fillRect(
              offsetX + x * this.blockSize + 1,
              offsetY + y * this.blockSize + 1,
              this.blockSize - 2,
              this.blockSize - 2
            );

            // Add simple highlight
            context.fillStyle = this.lightenColor(piece.color, 30);
            context.fillRect(
              offsetX + x * this.blockSize + 1,
              offsetY + y * this.blockSize + 1,
              this.blockSize - 2,
              2
            );
            context.fillRect(
              offsetX + x * this.blockSize + 1,
              offsetY + y * this.blockSize + 1,
              2,
              this.blockSize - 2
            );
          } else {
            this.drawBlock(piece.x + x, piece.y + y, piece.color);
          }
        }
      });
    });
  }

  drawShadowPiece() {
    // Create a shadow piece to show where the current piece will land
    const shadowPiece = {
      shape: this.currentPiece.shape,
      color: this.currentPiece.color,
      x: this.currentPiece.x,
      y: this.currentPiece.y,
    };

    // Drop the shadow piece to its final position
    while (!this.hasCollision(shadowPiece, 0, 1)) {
      shadowPiece.y++;
    }

    // Only draw if shadow is in a different position than the current piece
    if (shadowPiece.y > this.currentPiece.y) {
      // Draw with transparency
      shadowPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            this.ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
            this.ctx.fillRect(
              (shadowPiece.x + x) * this.blockSize + 1,
              (shadowPiece.y + y) * this.blockSize + 1,
              this.blockSize - 2,
              this.blockSize - 2
            );
          }
        });
      });
    }
  }

  moveLeft() {
    if (!this.hasCollision(this.currentPiece, -1, 0)) {
      this.currentPiece.x--;
      this.draw();
    }
  }

  moveRight() {
    if (!this.hasCollision(this.currentPiece, 1, 0)) {
      this.currentPiece.x++;
      this.draw();
    }
  }

  moveDown() {
    if (!this.hasCollision(this.currentPiece, 0, 1)) {
      this.currentPiece.y++;
      this.draw();
      return true;
    } else {
      this.freeze();
      this.clearLines();
      this.currentPiece = this.nextPiece;
      this.nextPiece = this.newPiece();
      if (this.hasCollision(this.currentPiece, 0, 0)) {
        this.gameOver();
      }
      this.draw();
      return false;
    }
  }

  hardDrop() {
    while (this.moveDown()) {
      // Keep moving down until collision
    }
  }

  rotate() {
    const rotated = this.currentPiece.shape[0].map((_, i) =>
      this.currentPiece.shape.map((row) => row[i]).reverse()
    );
    const previousShape = this.currentPiece.shape;
    this.currentPiece.shape = rotated;

    // Handle wall kicks - if rotation causes collision, try to move the piece
    if (this.hasCollision(this.currentPiece, 0, 0)) {
      // Try moving right
      if (!this.hasCollision(this.currentPiece, 1, 0)) {
        this.currentPiece.x += 1;
      }
      // Try moving left
      else if (!this.hasCollision(this.currentPiece, -1, 0)) {
        this.currentPiece.x -= 1;
      }
      // Try moving up (for I piece)
      else if (!this.hasCollision(this.currentPiece, 0, -1)) {
        this.currentPiece.y -= 1;
      }
      // If still colliding, revert
      else {
        this.currentPiece.shape = previousShape;
      }
    }

    this.draw();
  }

  hasCollision(piece, dx = 0, dy = 0) {
    return piece.shape.some((row, y) =>
      row.some((value, x) => {
        if (!value) return false;
        const newX = piece.x + x + dx;
        const newY = piece.y + y + dy;
        return (
          newX < 0 ||
          newX >= this.cols ||
          newY >= this.rows ||
          (newY >= 0 && this.board[newY][newX])
        );
      })
    );
  }

  freeze() {
    this.currentPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const boardY = y + this.currentPiece.y;
          const boardX = x + this.currentPiece.x;
          if (boardY >= 0) {
            this.board[boardY][boardX] = this.currentPiece.color;
          }
        }
      });
    });
  }

  clearLines() {
    let linesCleared = 0;
    for (let y = this.rows - 1; y >= 0; y--) {
      if (this.board[y].every((cell) => cell)) {
        this.board.splice(y, 1);
        this.board.unshift(Array(this.cols).fill(0));
        linesCleared++;
        y++; // Check the same row again
      }
    }

    if (linesCleared > 0) {
      // Update score - give bonus points for multiple lines
      const linePoints = [0, 100, 300, 500, 800];
      this.score += linePoints[linesCleared] * this.level;
      document.getElementById("score").textContent = this.score;

      // Update lines cleared
      this.lines += linesCleared;
      document.getElementById("lines").textContent = this.lines;

      // Update level
      const newLevel = Math.floor(this.lines / 10) + 1;
      if (newLevel !== this.level) {
        this.level = newLevel;
        document.getElementById("level").textContent = this.level;

        // Increase speed when leveling up
        if (this.gameLoop) {
          clearInterval(this.gameLoop);
          this.startLoop();
        }
      }
    }
  }

  gameOver() {
    clearInterval(this.gameLoop);
    this.isGameOver = true;
    this.gameLoop = null;
    this.draw();
  }

  reset() {
    this.board = Array(this.rows)
      .fill()
      .map(() => Array(this.cols).fill(0));
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.isGameOver = false;
    document.getElementById("score").textContent = this.score;
    document.getElementById("level").textContent = this.level;
    document.getElementById("lines").textContent = this.lines;
    this.currentPiece = this.newPiece();
    this.nextPiece = this.newPiece();
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    document.getElementById("pauseBtn").textContent = this.isPaused
      ? "Resume"
      : "Pause";

    if (!this.isPaused && !this.isGameOver) {
      this.draw();
    }
  }

  startLoop() {
    // Speed increases with level
    const speed = Math.max(100, 1000 - (this.level - 1) * 100);
    this.gameLoop = setInterval(() => {
      if (!this.isPaused && !this.isGameOver) {
        this.moveDown();
      }
    }, speed);
  }

  start() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }

    this.reset();
    this.startLoop();
    this.draw();
  }
}

window.onload = () => {
  new Tetris();
};
