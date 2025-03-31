/**
 * Modern Memory Match Game
 * Enhanced with animations, levels, and persistent scores
 */
class MemoryGame {
  constructor() {
    // Game elements
    this.gameBoard = document.getElementById("game-board");
    this.movesElement = document.getElementById("moves");
    this.timerElement = document.getElementById("timer");
    this.levelElement = document.getElementById("level");
    this.startBtn = document.getElementById("startBtn");

    // Game state
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.moves = 0;
    this.timer = 0;
    this.timerInterval = null;
    this.isLocked = false;
    this.gameActive = false;
    this.currentLevel = 1;
    this.maxLevel = 5;
    this.themeIndex = 0;

    // Game settings for each level
    this.levels = [
      { pairs: 6, timeLimit: 60 }, // Level 1: 6 pairs (12 cards)
      { pairs: 8, timeLimit: 90 }, // Level 2: 8 pairs (16 cards)
      { pairs: 10, timeLimit: 120 }, // Level 3: 10 pairs (20 cards)
      { pairs: 12, timeLimit: 150 }, // Level 4: 12 pairs (24 cards)
      { pairs: 15, timeLimit: 180 }, // Level 5: 15 pairs (30 cards)
    ];

    // Card themes
    this.themes = [
      {
        name: "Emoji",
        cards: [
          "🎮",
          "🎲",
          "🎯",
          "🎪",
          "🎨",
          "🎭",
          "🏆",
          "🎬",
          "🎷",
          "🎸",
          "🎺",
          "🎻",
          "🎹",
          "🥁",
          "🎧",
        ],
      },
      {
        name: "Animals",
        cards: [
          "🐶",
          "🐱",
          "🐭",
          "🐰",
          "🦊",
          "🐻",
          "🐼",
          "🐨",
          "🦁",
          "🐯",
          "🐮",
          "🐷",
          "🐸",
          "🐵",
          "🦄",
        ],
      },
      {
        name: "Food",
        cards: [
          "🍎",
          "🍐",
          "🍊",
          "🍋",
          "🍌",
          "🍉",
          "🍇",
          "🍓",
          "🍒",
          "🍍",
          "🥥",
          "🥑",
          "🍔",
          "🍕",
          "🍦",
        ],
      },
      {
        name: "Space",
        cards: [
          "🚀",
          "🌙",
          "⭐",
          "☄️",
          "🌟",
          "✨",
          "🌠",
          "🌌",
          "🪐",
          "👨‍🚀",
          "👽",
          "🛸",
          "🌍",
          "🌞",
          "🌛",
        ],
      },
    ];

    // Initialize the game
    this.setupEventListeners();
    this.loadPreferences();
    this.showStartScreen();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    this.startBtn.addEventListener("click", () => this.startGame());

    document.getElementById("homeBtn").addEventListener("click", () => {
      clearInterval(this.timerInterval);
      window.location.href = "../../../index.html";
    });

    const themeBtn = document.getElementById("themeBtn");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        this.themeIndex = (this.themeIndex + 1) % this.themes.length;
        localStorage.setItem("memoryTheme", this.themeIndex);
        this.showThemeNotification();
        if (this.gameActive) {
          this.resetGame();
          this.startGame();
        }
      });
    }

    // Keyboard shortcuts
    window.addEventListener("keydown", (e) => {
      if (e.key === "r" && !this.isLocked) {
        this.resetGame();
        this.startGame();
      }
      if (e.key === "t") {
        const themeButton = document.getElementById("themeBtn");
        if (themeButton) {
          themeButton.click();
        }
      }
    });
  }

  /**
   * Load user preferences from localStorage
   */
  loadPreferences() {
    const savedTheme = localStorage.getItem("memoryTheme");
    if (savedTheme !== null) {
      this.themeIndex = parseInt(savedTheme);
    }

    const savedLevel = localStorage.getItem("memoryLevel");
    if (savedLevel !== null) {
      this.currentLevel = Math.min(parseInt(savedLevel), this.maxLevel);
    }

    if (this.levelElement) {
      this.levelElement.textContent = this.currentLevel;
    }
  }

  /**
   * Show theme change notification
   */
  showThemeNotification() {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = `Theme: ${this.themes[this.themeIndex].name}`;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("show");
      setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => {
          notification.remove();
        }, 500);
      }, 2000);
    }, 10);
  }

  /**
   * Show start screen or level progress
   */
  showStartScreen() {
    this.gameBoard.innerHTML = "";
    const startScreen = document.createElement("div");
    startScreen.className = "start-screen";

    const title = document.createElement("h2");
    title.textContent = "Memory Match";
    startScreen.appendChild(title);

    const levelInfo = document.createElement("p");
    levelInfo.textContent = `Level ${this.currentLevel}: Match ${
      this.levels[this.currentLevel - 1].pairs
    } pairs`;
    startScreen.appendChild(levelInfo);

    const themeInfo = document.createElement("p");
    themeInfo.textContent = `Theme: ${this.themes[this.themeIndex].name}`;
    startScreen.appendChild(themeInfo);

    const highScore = this.getHighScore();
    if (highScore) {
      const scoreInfo = document.createElement("p");
      scoreInfo.className = "high-score";
      scoreInfo.textContent = `Best Time: ${this.formatTime(
        highScore.time
      )} with ${highScore.moves} moves`;
      startScreen.appendChild(scoreInfo);
    }

    this.gameBoard.appendChild(startScreen);
  }

  /**
   * Start a new game
   */
  startGame() {
    this.gameActive = true;
    this.resetGame();
    this.createCards();
    this.renderCards();
    this.startTimer();

    // Animate cards appearance
    const cards = document.querySelectorAll(".memory-card");
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add("visible");
      }, index * 50);
    });
  }

  /**
   * Reset game state
   */
  resetGame() {
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.moves = 0;
    this.timer = 0;
    this.isLocked = false;
    clearInterval(this.timerInterval);

    if (this.movesElement) {
      this.movesElement.textContent = "0";
    }
    if (this.timerElement) {
      this.timerElement.textContent = "00:00";
    }
  }

  /**
   * Create cards for the current level
   */
  createCards() {
    const level = this.levels[this.currentLevel - 1];
    const cardTypes = this.themes[this.themeIndex].cards.slice(0, level.pairs);

    this.cards = [...cardTypes, ...cardTypes]
      .sort(() => Math.random() - 0.5)
      .map((type, index) => ({
        id: index,
        type: type,
        isFlipped: false,
        isMatched: false,
      }));
  }

  /**
   * Render cards on the game board
   */
  renderCards() {
    this.gameBoard.innerHTML = "";

    // Determine grid size based on card count
    const cardCount = this.cards.length;
    let gridClass = "grid-3x4"; // Default for 12 cards

    if (cardCount === 16) {
      gridClass = "grid-4x4";
    } else if (cardCount === 20) {
      gridClass = "grid-4x5";
    } else if (cardCount === 24) {
      gridClass = "grid-4x6";
    } else if (cardCount >= 30) {
      gridClass = "grid-5x6";
    }

    this.gameBoard.className = gridClass;

    this.cards.forEach((card) => {
      const cardElement = document.createElement("div");
      cardElement.className = "memory-card";
      cardElement.dataset.id = card.id;

      const cardFront = document.createElement("div");
      cardFront.className = "card-front";

      const cardBack = document.createElement("div");
      cardBack.className = "card-back";
      cardBack.textContent = card.type;

      cardElement.appendChild(cardFront);
      cardElement.appendChild(cardBack);

      cardElement.addEventListener("click", () =>
        this.flipCard(card, cardElement)
      );

      this.gameBoard.appendChild(cardElement);
    });
  }

  /**
   * Flip a card when clicked
   * @param {Object} card - Card data
   * @param {Element} element - Card DOM element
   */
  flipCard(card, element) {
    // Prevent flipping if game is locked or card is already flipped/matched
    if (this.isLocked || card.isFlipped || card.isMatched) {
      return;
    }

    // Flip the card
    card.isFlipped = true;
    element.classList.add("flipped");

    // Add to flipped cards
    this.flippedCards.push({ card, element });

    // Check for match if we have 2 cards flipped
    if (this.flippedCards.length === 2) {
      this.moves++;
      this.movesElement.textContent = this.moves;
      this.checkForMatch();
    }
  }

  /**
   * Check if the two flipped cards match
   */
  checkForMatch() {
    this.isLocked = true;
    const [first, second] = this.flippedCards;

    if (first.card.type === second.card.type) {
      // Cards match
      this.handleMatchedCards();
    } else {
      // Cards don't match
      setTimeout(() => {
        first.element.classList.add("shake");
        second.element.classList.add("shake");

        setTimeout(() => {
          first.element.classList.remove("shake", "flipped");
          second.element.classList.remove("shake", "flipped");
          first.card.isFlipped = false;
          second.card.isFlipped = false;
          this.flippedCards = [];
          this.isLocked = false;
        }, 500);
      }, 800);
    }
  }

  /**
   * Handle matched cards
   */
  handleMatchedCards() {
    const [first, second] = this.flippedCards;

    // Mark cards as matched
    first.card.isMatched = true;
    second.card.isMatched = true;

    // Add match animation
    setTimeout(() => {
      first.element.classList.add("matched");
      second.element.classList.add("matched");

      this.matchedPairs++;
      this.flippedCards = [];
      this.isLocked = false;

      // Check if all pairs are matched
      if (this.matchedPairs === this.levels[this.currentLevel - 1].pairs) {
        this.handleLevelComplete();
      }
    }, 500);
  }

  /**
   * Handle level completion
   */
  handleLevelComplete() {
    clearInterval(this.timerInterval);
    this.gameActive = false;

    // Save score
    this.saveScore();

    // Show level complete animation
    const overlay = document.createElement("div");
    overlay.className = "level-complete";

    const message = document.createElement("div");
    message.className = "complete-message";

    const title = document.createElement("h2");
    title.textContent = `Level ${this.currentLevel} Complete!`;

    const stats = document.createElement("p");
    stats.textContent = `Time: ${this.formatTime(this.timer)} - Moves: ${
      this.moves
    }`;

    const nextBtn = document.createElement("button");

    if (this.currentLevel < this.maxLevel) {
      nextBtn.textContent = "Next Level";
      nextBtn.addEventListener("click", () => {
        this.currentLevel++;
        localStorage.setItem("memoryLevel", this.currentLevel);
        if (this.levelElement) {
          this.levelElement.textContent = this.currentLevel;
        }
        overlay.remove();
        this.showStartScreen();
      });
    } else {
      nextBtn.textContent = "Play Again";
      nextBtn.addEventListener("click", () => {
        overlay.remove();
        this.showStartScreen();
      });

      const allComplete = document.createElement("p");
      allComplete.textContent =
        "🏆 Congratulations! You completed all levels! 🏆";
      allComplete.className = "all-complete";
      message.appendChild(allComplete);
    }

    message.appendChild(title);
    message.appendChild(stats);
    message.appendChild(nextBtn);
    overlay.appendChild(message);

    document.body.appendChild(overlay);

    // Notify main app about game completion for high score tracking
    window.dispatchEvent(
      new CustomEvent("game:completed", {
        detail: {
          game: "memory",
          score: Math.floor(10000 / (this.moves * (this.timer / 60))),
          level: this.currentLevel,
        },
      })
    );
  }

  /**
   * Start the game timer
   */
  startTimer() {
    this.timer = 0;
    const timeLimit = this.levels[this.currentLevel - 1].timeLimit;

    this.timerInterval = setInterval(() => {
      this.timer++;

      if (this.timerElement) {
        this.timerElement.textContent = this.formatTime(this.timer);
      }

      // Check time limit
      if (timeLimit && this.timer >= timeLimit) {
        this.handleTimeUp();
      }
    }, 1000);
  }

  /**
   * Handle time up event
   */
  handleTimeUp() {
    clearInterval(this.timerInterval);
    this.gameActive = false;
    this.isLocked = true;

    const overlay = document.createElement("div");
    overlay.className = "time-up";

    const message = document.createElement("div");
    message.className = "time-up-message";

    const title = document.createElement("h2");
    title.textContent = "Time's Up!";

    const tryAgainBtn = document.createElement("button");
    tryAgainBtn.textContent = "Try Again";
    tryAgainBtn.addEventListener("click", () => {
      overlay.remove();
      this.resetGame();
      this.startGame();
    });

    message.appendChild(title);
    message.appendChild(tryAgainBtn);
    overlay.appendChild(message);

    document.body.appendChild(overlay);
  }

  /**
   * Format time in MM:SS format
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }

  /**
   * Save score to localStorage
   */
  saveScore() {
    const levelKey = `memory_level${this.currentLevel}`;
    const currentScore = {
      time: this.timer,
      moves: this.moves,
      date: new Date().toISOString(),
    };

    const existingScore = this.getHighScore();

    // Only save if it's better than the existing score
    if (!existingScore || this.isNewScoreBetter(currentScore, existingScore)) {
      localStorage.setItem(levelKey, JSON.stringify(currentScore));
    }
  }

  /**
   * Get high score from localStorage
   * @returns {Object|null} High score object or null
   */
  getHighScore() {
    const levelKey = `memory_level${this.currentLevel}`;
    const scoreData = localStorage.getItem(levelKey);

    if (scoreData) {
      return JSON.parse(scoreData);
    }

    return null;
  }

  /**
   * Check if new score is better than existing score
   * @param {Object} newScore - New score object
   * @param {Object} oldScore - Existing score object
   * @returns {boolean} True if new score is better
   */
  isNewScoreBetter(newScore, oldScore) {
    // First prioritize by moves (fewer is better)
    if (newScore.moves < oldScore.moves) {
      return true;
    }

    // If moves are equal, prioritize by time (faster is better)
    if (newScore.moves === oldScore.moves && newScore.time < oldScore.time) {
      return true;
    }

    return false;
  }
}

// Initialize game when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new MemoryGame();
});
