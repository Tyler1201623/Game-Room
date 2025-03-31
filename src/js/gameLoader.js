/**
 * GameLoader - Responsible for loading game configurations
 */
class GameLoader {
  constructor() {
    this.games = [];
  }

  /**
   * Load all available games
   * @returns {Array} Array of game configurations
   */
  loadAll() {
    try {
      this.loadSnake();
      this.loadTetris();
      this.loadTicTacToe();
      this.loadPacMan();
      this.loadMemoryMatch();
      this.loadSpaceInvaders();

      console.log(`Loaded ${this.games.length} games`);
      return this.games;
    } catch (error) {
      console.error("Error loading games:", error);
      return [];
    }
  }

  /**
   * Load Snake game configuration
   */
  loadSnake() {
    this.games.push({
      id: "snake",
      name: "Snake",
      path: "/games/snake",
      description:
        "Navigate your snake to collect food and grow longer without hitting walls or yourself!",
      difficulty: "Easy",
      categories: ["arcade", "classic"],
      controls: {
        arrows: "Change direction",
      },
      highScore: this.getHighScore("snake"),
    });
  }

  /**
   * Load Tetris game configuration
   */
  loadTetris() {
    this.games.push({
      id: "tetris",
      name: "Tetris",
      path: "/games/tetris",
      description:
        "Stack falling blocks strategically to clear lines and achieve high scores!",
      difficulty: "Medium",
      categories: ["puzzle", "classic"],
      controls: {
        arrows: "Move/rotate pieces",
        space: "Drop piece",
      },
      highScore: this.getHighScore("tetris"),
    });
  }

  /**
   * Load Tic Tac Toe game configuration
   */
  loadTicTacToe() {
    this.games.push({
      id: "tictactoe",
      name: "Tic Tac Toe",
      path: "/games/tictactoe",
      description:
        "Challenge an intelligent AI or play against friends in this strategic game of X's and O's!",
      difficulty: "Easy",
      categories: ["strategy", "classic", "multiplayer"],
      controls: {
        mouse: "Place X or O",
      },
      highScore: null, // Not applicable for this game
    });
  }

  /**
   * Load Pac-Man game configuration
   */
  loadPacMan() {
    this.games.push({
      id: "pacman",
      name: "Pac-Man",
      path: "/games/pac-man",
      description:
        "Navigate through mazes, collect dots, and avoid ghosts in this arcade classic!",
      difficulty: "Medium",
      categories: ["arcade", "classic", "maze"],
      controls: {
        arrows: "Move Pac-Man",
      },
      highScore: this.getHighScore("pacman"),
    });
  }

  /**
   * Load Memory Match game configuration
   */
  loadMemoryMatch() {
    this.games.push({
      id: "memory",
      name: "Memory Match",
      path: "/games/memory match",
      description:
        "Test your memory skills by matching pairs of cards with beautiful animations!",
      difficulty: "Easy",
      categories: ["puzzle", "memory"],
      controls: {
        mouse: "Flip cards",
      },
      highScore: this.getHighScore("memory"),
    });
  }

  /**
   * Load Space Invaders game configuration
   */
  loadSpaceInvaders() {
    this.games.push({
      id: "spaceinvaders",
      name: "Space Invaders",
      path: "/games/space invaders",
      description:
        "Defend Earth from alien invaders with powerful weapons and shield upgrades!",
      difficulty: "Hard",
      categories: ["arcade", "shooter"],
      controls: {
        arrows: "Move ship",
        space: "Fire weapon",
      },
      highScore: this.getHighScore("spaceinvaders"),
    });
  }

  /**
   * Get high score for a specific game
   * @param {string} gameId - ID of the game
   * @returns {number|null} High score or null if not available
   */
  getHighScore(gameId) {
    try {
      const storageKey = "gameRoom_highScores";
      const highScores = JSON.parse(localStorage.getItem(storageKey)) || {};
      return highScores[gameId] || 0;
    } catch (error) {
      console.error(`Error retrieving high score for ${gameId}:`, error);
      return 0;
    }
  }
}
