class TicTacToe {
  constructor() {
    this.board = Array(9).fill(null);
    this.currentPlayer = "X";
    this.gameActive = true;
    this.gameMode = "ai"; // 'ai' or 'two-player'
    this.aiDifficulty = "medium"; // 'easy', 'medium', 'hard'
    this.winningCombinations = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // Rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // Columns
      [0, 4, 8],
      [2, 4, 6], // Diagonals
    ];

    this.scores = {
      X: 0,
      O: 0,
      ties: 0,
    };

    this.cells = document.querySelectorAll(".cell");
    this.messageElement = document.getElementById("message");
    this.resetButton = document.getElementById("reset-button");
    this.xScoreElement = document.getElementById("x-score");
    this.oScoreElement = document.getElementById("o-score");
    this.tiesElement = document.getElementById("ties");

    this.init();
    this.updateScoreboard();
  }

  init() {
    // Set up click events for cells
    this.cells.forEach((cell) => {
      cell.addEventListener("click", () => {
        if (this.gameActive) {
          const index = cell.dataset.index;
          this.makeMove(index, cell);
        }
      });
    });

    // Set up reset button
    if (this.resetButton) {
      this.resetButton.addEventListener("click", () => this.resetGame());
    }

    // Set up game mode buttons
    const modeBtns = document.querySelectorAll(".mode-button");
    modeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        modeBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.gameMode = btn.dataset.mode;
        this.resetGame();
      });
    });

    // Set up difficulty buttons
    const difficultyBtns = document.querySelectorAll(".difficulty-button");
    difficultyBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        difficultyBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.aiDifficulty = btn.dataset.difficulty;
        this.resetGame();
      });
    });

    // Show starting message
    if (this.messageElement) {
      this.messageElement.textContent = "Player X's turn";
    }
  }

  makeMove(position, cell) {
    // Check if the cell is already filled
    if (this.board[position] || !this.gameActive) {
      return;
    }

    // Make the move
    this.board[position] = this.currentPlayer;
    cell.textContent = this.currentPlayer;
    cell.classList.add(this.currentPlayer.toLowerCase());

    // Check if game is over
    if (this.checkWin(this.currentPlayer)) {
      this.endGame(false);
      return;
    } else if (this.checkDraw()) {
      this.endGame(true);
      return;
    }

    // Switch player
    this.currentPlayer = this.currentPlayer === "X" ? "O" : "X";

    // Update message
    if (this.messageElement) {
      this.messageElement.textContent = `Player ${this.currentPlayer}'s turn`;
    }

    // If it's AI's turn, make the AI move
    if (
      this.gameMode === "ai" &&
      this.currentPlayer === "O" &&
      this.gameActive
    ) {
      setTimeout(() => this.makeAiMove(), 500);
    }
  }

  makeAiMove() {
    let move;

    switch (this.aiDifficulty) {
      case "easy":
        move = this.getRandomMove();
        break;
      case "hard":
        move = this.getBestMove();
        break;
      case "medium":
      default:
        // 50% chance of making a smart move
        move = Math.random() > 0.5 ? this.getBestMove() : this.getRandomMove();
        break;
    }

    if (move !== null) {
      const cell = this.cells[move];
      this.makeMove(move, cell);
    }
  }

  getRandomMove() {
    // Get all empty cells
    const emptyCells = [];
    for (let i = 0; i < this.board.length; i++) {
      if (this.board[i] === null) {
        emptyCells.push(i);
      }
    }

    // Return a random empty cell
    if (emptyCells.length > 0) {
      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }
    return null;
  }

  getBestMove() {
    // Minimax algorithm for perfect play
    let bestScore = -Infinity;
    let bestMove = null;

    for (let i = 0; i < this.board.length; i++) {
      // If the cell is empty
      if (this.board[i] === null) {
        // Make a move
        this.board[i] = "O";
        // Get score from minimax
        let score = this.minimax(this.board, 0, false);
        // Undo the move
        this.board[i] = null;

        // Update best score
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }

    return bestMove;
  }

  minimax(board, depth, isMaximizing) {
    // Check for terminal states
    if (this.checkWinMinimax(board, "O")) return 10 - depth;
    if (this.checkWinMinimax(board, "X")) return depth - 10;
    if (this.checkDrawMinimax(board)) return 0;

    if (isMaximizing) {
      // AI's turn (O)
      let bestScore = -Infinity;

      for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
          board[i] = "O";
          let score = this.minimax(board, depth + 1, false);
          board[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }

      return bestScore;
    } else {
      // Player's turn (X)
      let bestScore = Infinity;

      for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
          board[i] = "X";
          let score = this.minimax(board, depth + 1, true);
          board[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }

      return bestScore;
    }
  }

  checkWinMinimax(board, player) {
    for (let comb of this.winningCombinations) {
      if (
        board[comb[0]] === player &&
        board[comb[1]] === player &&
        board[comb[2]] === player
      ) {
        return true;
      }
    }
    return false;
  }

  checkDrawMinimax(board) {
    return !board.includes(null);
  }

  checkWin(player) {
    for (let comb of this.winningCombinations) {
      if (
        this.board[comb[0]] === player &&
        this.board[comb[1]] === player &&
        this.board[comb[2]] === player
      ) {
        // Highlight winning cells
        comb.forEach((index) => {
          this.cells[index].classList.add("win");
        });
        return true;
      }
    }
    return false;
  }

  checkDraw() {
    return !this.board.includes(null);
  }

  endGame(isDraw) {
    this.gameActive = false;

    if (isDraw) {
      if (this.messageElement) {
        this.messageElement.textContent = "Game ended in a draw!";
      }
      this.scores.ties++;
    } else {
      if (this.messageElement) {
        this.messageElement.textContent = `Player ${this.currentPlayer} wins!`;
      }
      this.scores[this.currentPlayer]++;

      // Add victory animation
      const boardElement = document.getElementById("board");
      if (boardElement) {
        boardElement.classList.add("victory");
        setTimeout(() => boardElement.classList.remove("victory"), 1500);
      }
    }

    this.updateScoreboard();

    // Show reset button
    if (this.resetButton) {
      this.resetButton.classList.add("visible");
    }
  }

  resetGame() {
    this.board = Array(9).fill(null);
    this.currentPlayer = "X";
    this.gameActive = true;

    // Clear board UI
    this.cells.forEach((cell) => {
      cell.textContent = "";
      cell.classList.remove("x", "o", "win");
    });

    // Reset message
    if (this.messageElement) {
      this.messageElement.textContent = "Player X's turn";
    }

    // Hide reset button
    if (this.resetButton) {
      this.resetButton.classList.remove("visible");
    }

    // If board has victory class, remove it
    const boardElement = document.getElementById("board");
    if (boardElement) {
      boardElement.classList.remove("victory");
    }
  }

  updateScoreboard() {
    if (this.xScoreElement) {
      this.xScoreElement.textContent = this.scores.X;
    }
    if (this.oScoreElement) {
      this.oScoreElement.textContent = this.scores.O;
    }
    if (this.tiesElement) {
      this.tiesElement.textContent = this.scores.ties;
    }
  }
}

// Initialize the game when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const game = new TicTacToe();
});
