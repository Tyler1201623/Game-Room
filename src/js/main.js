/**
 * Game Room - Main Application
 * Modern arcade experience with ES6+ features
 */
const gameRoom = {
  // Configuration
  config: {
    apiEndpoint: "https://api.gameroom.example.com", // Replace with actual API endpoint when deployed
    storagePrefix: "gameRoom_",
    version: "2.1.0", // Updated version number
  },

  // State
  state: {
    games: [],
    userPreferences: {
      sound: true,
      notifications: true,
      highContrastMode: false,
    },
    currentUser: null,
    highScores: {},
    achievements: {},
    serviceWorkerRegistration: null,
  },

  /**
   * Initialize the application
   */
  init() {
    console.log(`Game Room v${this.config.version} initialized`);
    this.loadUserPreferences();
    this.registerServiceWorker();
    this.bindEvents();
    this.loadHighScores();
    this.loadGames();
    this.trackAnalytics("app_init");
  },

  /**
   * Load saved user preferences from localStorage
   */
  loadUserPreferences() {
    try {
      const savedPrefs = localStorage.getItem(
        `${this.config.storagePrefix}preferences`
      );
      if (savedPrefs) {
        this.state.userPreferences = {
          ...this.state.userPreferences,
          ...JSON.parse(savedPrefs),
        };
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
    }
  },

  /**
   * Register service worker for offline functionality and PWA support
   * Enhanced with update handling and better error management
   */
  registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
            console.log("ServiceWorker registration successful");

            // Store the registration for future use
            this.state.serviceWorkerRegistration = registration;

            // Check for updates on page load
            registration.update();

            // Setup update detection
            registration.addEventListener("updatefound", () => {
              // A new service worker is being installed
              const newWorker = registration.installing;

              newWorker.addEventListener("statechange", () => {
                // When the new service worker is installed
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  this.showUpdateNotification();
                }
              });
            });
          })
          .catch((error) => {
            console.error("ServiceWorker registration failed:", error);
          });

        // If there's a controller, that means a service worker is already active
        if (navigator.serviceWorker.controller) {
          console.log(
            "Active service worker found, application will be served from cache"
          );
        }

        // Listen for service worker messages
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data && event.data.type === "CACHE_UPDATED") {
            console.log("New content available", event.data.url);
          }
        });
      });
    } else {
      console.log("Service workers not supported in this browser");
    }
  },

  /**
   * Show notification when an app update is available
   */
  showUpdateNotification() {
    // Create a notification for the user to refresh the page
    const updateNotification = document.createElement("div");
    updateNotification.className = "pwa-install-banner visible";
    updateNotification.style.background = "#2563eb";

    updateNotification.innerHTML = `
      <div class="pwa-content">
        <div class="pwa-icon">
          <i class="fas fa-sync-alt" style="color: white; font-size: 24px;"></i>
        </div>
        <div class="pwa-info">
          <div class="pwa-title" style="color: white;">Update Available</div>
          <p class="pwa-description" style="color: rgba(255,255,255,0.9);">A new version is available. Refresh to update.</p>
        </div>
      </div>
      <div class="pwa-buttons">
        <button class="pwa-install-btn" id="update-btn" style="background: white; color: #2563eb;">
          Refresh
        </button>
        <button class="pwa-close-btn" id="update-later-btn" style="color: white;">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    document.body.appendChild(updateNotification);

    // Setup event listeners
    document.getElementById("update-btn").addEventListener("click", () => {
      // Update by refreshing the page
      window.location.reload();
    });

    document
      .getElementById("update-later-btn")
      .addEventListener("click", () => {
        // Just remove the notification, they can update later
        updateNotification.classList.remove("visible");
        setTimeout(() => updateNotification.remove(), 500);
      });
  },

  /**
   * Bind DOM events
   */
  bindEvents() {
    document.getElementById("privacy-link")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.showPrivacyPolicy();
    });

    document.getElementById("about-link")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.showAboutModal();
    });

    // Add custom event listener for game completion
    window.addEventListener("game:completed", (event) => {
      const { game, score } = event.detail;
      this.updateHighScore(game, score);
    });
  },

  /**
   * Show privacy policy modal
   */
  showPrivacyPolicy() {
    // Implementation to show privacy policy modal
    alert(
      "Privacy Policy: Your game data is stored locally on your device and is not shared with third parties."
    );
  },

  /**
   * Show about modal
   */
  showAboutModal() {
    // Implementation to show about modal
    alert("Game Room v2.0 - A modern collection of classic arcade games.");
  },

  /**
   * Track analytics event
   * @param {string} eventName - Name of the event to track
   * @param {Object} data - Additional data to track
   */
  trackAnalytics(eventName, data = {}) {
    // Implementation depends on analytics provider
    console.log(`[Analytics] ${eventName}`, data);
  },

  /**
   * Load available games
   */
  loadGames() {
    const gameLoader = new GameLoader();
    this.state.games = gameLoader.loadAll();

    // Add animation delay to game cards for staggered effect
    const gameCards = document.querySelectorAll(".game-card");
    gameCards.forEach((card, index) => {
      card.style.setProperty("--i", index);
    });
  },

  /**
   * Load high scores from localStorage
   */
  loadHighScores() {
    try {
      const savedScores = localStorage.getItem(
        `${this.config.storagePrefix}highScores`
      );
      if (savedScores) {
        this.state.highScores = JSON.parse(savedScores);
      }
    } catch (error) {
      console.error("Failed to load high scores:", error);
    }
  },

  /**
   * Update high score for a game
   * @param {string} gameId - ID of the game
   * @param {number} score - Score to update
   */
  updateHighScore(gameId, score) {
    const currentHighScore = this.state.highScores[gameId] || 0;

    if (score > currentHighScore) {
      this.state.highScores[gameId] = score;
      localStorage.setItem(
        `${this.config.storagePrefix}highScores`,
        JSON.stringify(this.state.highScores)
      );
      this.showHighScoreNotification(gameId, score);
    }
  },

  /**
   * Show notification for new high score
   * @param {string} gameId - ID of the game
   * @param {number} score - New high score
   */
  showHighScoreNotification(gameId, score) {
    if (this.state.userPreferences.notifications && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("New High Score!", {
          body: `You achieved a new high score of ${score} in ${gameId}!`,
          icon: "/src/assets/images/highscore.svg",
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
  },
};

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => gameRoom.init());
