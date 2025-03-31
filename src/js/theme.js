/**
 * Theme management utility for Game Room
 * Handles dark/light mode preferences and toggling
 */

const ThemeManager = {
  // Theme constants
  THEMES: {
    LIGHT: "light",
    DARK: "dark",
  },

  // Default preferences
  preferences: {
    theme: "auto", // 'auto', 'light', or 'dark'
  },

  // Storage key for theme preferences
  STORAGE_KEY: "gameroom_theme_preferences",

  /**
   * Initialize theme management
   */
  init() {
    this.loadPreferences();
    this.setupThemeToggle();
    this.applyTheme();

    // Listen for system preference changes
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        if (this.preferences.theme === "auto") {
          this.applyTheme();
        }
      });
  },

  /**
   * Load saved theme preferences
   */
  loadPreferences() {
    try {
      const savedPrefs = localStorage.getItem(this.STORAGE_KEY);
      if (savedPrefs) {
        this.preferences = { ...this.preferences, ...JSON.parse(savedPrefs) };
      }
    } catch (error) {
      console.error("Failed to load theme preferences:", error);
    }
  },

  /**
   * Save theme preferences
   */
  savePreferences() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.preferences));
    } catch (error) {
      console.error("Failed to save theme preferences:", error);
    }
  },

  /**
   * Set up theme toggle buttons
   */
  setupThemeToggle() {
    // Find all theme toggle buttons
    const toggleButtons = document.querySelectorAll(".theme-toggle");

    toggleButtons.forEach((button) => {
      button.addEventListener("click", () => {
        this.toggleTheme();
      });
    });
  },

  /**
   * Toggle between light and dark theme
   */
  toggleTheme() {
    // If auto, switch to the opposite of current system preference
    if (this.preferences.theme === "auto") {
      const systemDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      this.preferences.theme = systemDark
        ? this.THEMES.LIGHT
        : this.THEMES.DARK;
    }
    // Otherwise toggle between light and dark
    else {
      this.preferences.theme =
        this.preferences.theme === this.THEMES.DARK
          ? this.THEMES.LIGHT
          : this.THEMES.DARK;
    }

    this.savePreferences();
    this.applyTheme();

    // Dispatch event for others to listen to
    window.dispatchEvent(
      new CustomEvent("themeChanged", {
        detail: { theme: this.getEffectiveTheme() },
      })
    );
  },

  /**
   * Apply the current theme to the document
   */
  applyTheme() {
    const theme = this.getEffectiveTheme();

    if (theme === this.THEMES.DARK) {
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
    } else {
      document.body.classList.add("light-mode");
      document.body.classList.remove("dark-mode");
    }

    // Update toggle buttons if they exist
    const toggleButtons = document.querySelectorAll(".theme-toggle");
    toggleButtons.forEach((button) => {
      const darkIcon = button.querySelector(".dark-icon");
      const lightIcon = button.querySelector(".light-icon");

      if (darkIcon && lightIcon) {
        if (theme === this.THEMES.DARK) {
          darkIcon.style.display = "none";
          lightIcon.style.display = "block";
        } else {
          darkIcon.style.display = "block";
          lightIcon.style.display = "none";
        }
      }
    });
  },

  /**
   * Get the effective theme (accounting for 'auto' preference)
   */
  getEffectiveTheme() {
    if (this.preferences.theme === "auto") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? this.THEMES.DARK
        : this.THEMES.LIGHT;
    }
    return this.preferences.theme;
  },
};

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => ThemeManager.init());

// Export for use in other modules
window.ThemeManager = ThemeManager;
