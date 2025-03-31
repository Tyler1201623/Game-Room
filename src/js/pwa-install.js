/**
 * PWA Installation Manager
 * Handles the installation of the PWA and manages the install button visibility
 */
class PWAInstallManager {
  constructor() {
    // Store the installation prompt event
    this.deferredPrompt = null;

    // Get button references
    this.installButton = document.getElementById("install-btn");
    this.mainInstallButton = document.getElementById("main-install-btn");

    // Track installation status
    this.isInstalled = false;

    // Track if prompt was already shown
    this.promptShown = false;

    // Initialize
    this.init();
  }

  init() {
    console.log("PWA Installation Manager initialized");

    // Before install prompt
    window.addEventListener("beforeinstallprompt", (e) => {
      // Prevent automatic showing, but save event for later use
      e.preventDefault();

      console.log("Installation prompt detected and saved");

      // Store the event for later use
      this.deferredPrompt = e;

      // Reset prompt shown flag
      this.promptShown = false;

      // Show the install buttons immediately
      this.showInstallButtons();

      // Make sure we don't prevent showing the prompt when needed
      e.userChoice.then((choiceResult) => {
        console.log("User installation choice:", choiceResult.outcome);
      });
    });

    // When the app is successfully installed
    window.addEventListener("appinstalled", () => {
      // Log the installation
      console.log("PWA was installed");

      // Update UI
      this.isInstalled = true;
      this.hideInstallButtons();
      this.showInstallSuccess();
    });

    // Check if app is already installed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    ) {
      console.log("App is already installed");
      this.isInstalled = true;
      this.hideInstallButtons();
    } else {
      console.log("App is not installed yet, showing buttons");
      // Only show these buttons if the app is not already installed
      const mainInstallContainer = document.querySelector(
        ".main-install-container"
      );
      if (mainInstallContainer) {
        mainInstallContainer.style.display = "flex";
      }
    }

    // Add click event listeners to install buttons with direct binding
    this.setupButtonListeners();

    // Register service worker if not already registered
    this.registerServiceWorker();

    // Check for service worker updates
    this.checkForUpdates();
  }

  // Set up button listeners
  setupButtonListeners() {
    if (this.installButton) {
      console.log("Adding event listener to footer install button");
      this.installButton.addEventListener("click", () => {
        console.log("Footer install button clicked");
        this.handleInstallClick();
      });
    }

    if (this.mainInstallButton) {
      console.log("Adding event listener to main install button");
      this.mainInstallButton.addEventListener("click", () => {
        console.log("Main install button clicked");
        this.handleInstallClick();
      });
    }
  }

  // Register the service worker
  registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      console.log("Registering service worker");
      navigator.serviceWorker
        .register("./service-worker.js")
        .then((registration) => {
          console.log(
            "Service Worker registered with scope:",
            registration.scope
          );
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    } else {
      console.warn("Service workers not supported in this browser");
    }
  }

  // Handle the install button click
  handleInstallClick() {
    console.log("Install button clicked");
    console.log("Deferred prompt available:", !!this.deferredPrompt);
    console.log("Prompt previously shown:", this.promptShown);

    if (this.deferredPrompt && !this.promptShown) {
      // We have an installation prompt and haven't shown it yet
      this.promptShown = true;
      console.log("Showing installation prompt");

      try {
        // Ensure prompt is shown and not just prevented
        const promptEvent = this.deferredPrompt;

        // Force display of installation UI
        promptEvent.prompt();

        // Wait for the user to respond to the prompt
        promptEvent.userChoice
          .then((choiceResult) => {
            console.log("User choice result:", choiceResult.outcome);

            if (choiceResult.outcome === "accepted") {
              console.log("User accepted the install prompt");
              this.showInstallSuccess();
              this.isInstalled = true;
              this.hideInstallButtons();
            } else {
              console.log("User dismissed the install prompt");
              this.promptShown = false; // Reset so user can try again
            }

            // Clear the prompt
            this.deferredPrompt = null;
          })
          .catch((error) => {
            console.error("Error with installation prompt:", error);
            this.promptShown = false;
            // Show manual instructions as fallback
            this.showInstallInstructions();
          });
      } catch (error) {
        console.error("Error triggering prompt:", error);
        this.promptShown = false;
        this.showInstallInstructions();
      }
    } else {
      // Manual installation instructions
      console.log(
        "No valid installation prompt available or prompt already shown"
      );
      console.log("Trying alternative installation approach");

      this.tryAlternativeInstallation();
    }
  }

  // Try alternative installation approach
  tryAlternativeInstallation() {
    // First, check if this is Chrome since it has specific install features
    const isChrome = !!window.chrome;

    if (isChrome) {
      console.log(
        "Detected Chrome browser, trying Chrome-specific installation"
      );

      // Try to access Chrome's installation feature
      if (
        window.chrome &&
        window.chrome.webstore &&
        window.chrome.webstore.install
      ) {
        // Chrome's legacy installation method
        try {
          window.chrome.webstore.install(
            undefined, // Use default URL
            () => {
              console.log("Installation initiated via Chrome API");
              this.showInstallSuccess();
            },
            (error) => {
              console.error("Chrome installation failed:", error);
              this.showInstallInstructions();
            }
          );
          return;
        } catch (error) {
          console.error("Error using Chrome installation API:", error);
        }
      }
    }

    // If we get here, show manual instructions
    this.showInstallInstructions();
  }

  // Show the install buttons
  showInstallButtons() {
    console.log("Showing install buttons");

    if (this.installButton) {
      this.installButton.style.display = "flex";
      this.installButton.classList.add("pulsing");
    }

    if (this.mainInstallButton) {
      const mainInstallContainer = document.querySelector(
        ".main-install-container"
      );
      if (mainInstallContainer) {
        mainInstallContainer.style.display = "flex";
      }
      this.mainInstallButton.style.display = "flex";
      this.mainInstallButton.classList.add("pulsing");
    }
  }

  // Hide the install buttons
  hideInstallButtons() {
    console.log("Hiding install buttons");

    if (this.installButton) {
      this.installButton.style.display = "none";
      this.installButton.classList.remove("pulsing");
    }

    if (this.mainInstallButton) {
      const mainInstallContainer = document.querySelector(
        ".main-install-container"
      );
      if (mainInstallContainer) {
        mainInstallContainer.style.display = "none";
      }
      this.mainInstallButton.style.display = "none";
      this.mainInstallButton.classList.remove("pulsing");
    }
  }

  // Show installation instructions for browsers without prompt support
  showInstallInstructions() {
    console.log("Showing manual installation instructions");

    // Create modal element if it doesn't exist
    if (!document.getElementById("install-instructions-modal")) {
      const modal = document.createElement("div");
      modal.id = "install-instructions-modal";
      modal.className = "install-modal";

      // Determine OS for specific instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      const isChrome = !!window.chrome;
      const isEdge = navigator.userAgent.includes("Edg");
      const isFirefox = navigator.userAgent.includes("Firefox");
      const isSafari = /^((?!chrome|android).)*safari/i.test(
        navigator.userAgent
      );

      let instructions = "";
      let browserSpecificMessage = "";

      if (isIOS) {
        instructions = `
          <h3>Install on iOS</h3>
          <ol>
            <li>Tap the Share button in Safari <i class="fas fa-share-square"></i></li>
            <li>Scroll down and tap "Add to Home Screen" <i class="fas fa-plus-square"></i></li>
            <li>Tap "Add" in the top-right corner</li>
          </ol>
        `;
      } else if (isAndroid) {
        instructions = `
          <h3>Install on Android</h3>
          <ol>
            <li>Tap the menu button in Chrome <i class="fas fa-ellipsis-v"></i></li>
            <li>Tap "Add to Home screen"</li>
            <li>Tap "Add" in the prompt that appears</li>
          </ol>
        `;
      } else {
        // Desktop browser-specific instructions
        if (isChrome) {
          browserSpecificMessage =
            "Look for the install icon in Chrome's address bar ➕";
        } else if (isEdge) {
          browserSpecificMessage =
            "Look for the install icon in Edge's address bar ➕";
        } else if (isFirefox) {
          browserSpecificMessage =
            "Firefox may not support installation. Try using Chrome or Edge.";
        } else if (isSafari) {
          browserSpecificMessage =
            "Desktop Safari doesn't support PWA installation. Try using Chrome or Edge.";
        }

        instructions = `
          <h3>Install on Desktop</h3>
          <ol>
            <li>Click the install icon <i class="fas fa-download"></i> in the address bar</li>
            <li>Click "Install" in the prompt that appears</li>
          </ol>
          <p>${browserSpecificMessage}</p>
          <div class="browser-instruction-image">
            <img src="src/assets/images/install-prompt.png" alt="Install prompt location" style="max-width: 100%; border: 1px solid #ccc; border-radius: 8px; margin-top: 10px;">
          </div>
        `;
      }

      modal.innerHTML = `
        <div class="modal-content">
          <span class="close-modal">&times;</span>
          <h2>Install Game Room App</h2>
          ${instructions}
          <p class="note">* If you don't see the install option, you may already have the app installed, or your browser may not support installation.</p>
          <button id="try-install-again" class="pwa-install-btn" style="margin-top: 20px;">Try Install Again</button>
        </div>
      `;

      document.body.appendChild(modal);

      // Add close functionality
      modal.querySelector(".close-modal").addEventListener("click", () => {
        modal.style.display = "none";
      });

      // Add try again button functionality
      modal
        .querySelector("#try-install-again")
        .addEventListener("click", () => {
          modal.style.display = "none";
          // Force a page reload to try to get a new installation prompt
          window.location.reload();
        });

      // Close when clicking outside
      window.addEventListener("click", (event) => {
        if (event.target === modal) {
          modal.style.display = "none";
        }
      });
    }

    // Show the modal
    document.getElementById("install-instructions-modal").style.display =
      "flex";
  }

  // Show success message after installation
  showInstallSuccess() {
    // Create toast notification
    const toast = document.createElement("div");
    toast.className = "install-toast";
    toast.innerHTML = `
      <i class="fas fa-check-circle"></i>
      <span>Game Room installed successfully!</span>
    `;

    document.body.appendChild(toast);

    // Show toast
    setTimeout(() => {
      toast.classList.add("show");
    }, 100);

    // Remove toast after 5 seconds
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 500);
    }, 5000);
  }

  // Check for service worker updates
  checkForUpdates() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Create message channel
        const channel = new MessageChannel();

        // Handler for receiving messages from service worker
        channel.port1.onmessage = (event) => {
          if (event.data && event.data.type === "VERSION") {
            console.log("Current cache version:", event.data.version);
          }
        };

        // Send message to service worker to check version
        registration.active.postMessage(
          {
            type: "CHECK_VERSION",
          },
          [channel.port2]
        );
      });

      // Set up listener for service worker messages
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "CACHE_UPDATED") {
          this.showUpdateNotification();
        }
      });
    }
  }

  // Show notification for a new version
  showUpdateNotification() {
    const notification = document.createElement("div");
    notification.className = "update-notification";
    notification.innerHTML = `
      <span>New version available!</span>
      <button id="update-button">Update Now</button>
    `;

    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
      notification.classList.add("show");
    }, 100);

    // Update button click handler
    document.getElementById("update-button").addEventListener("click", () => {
      // Send skip waiting message to service worker
      navigator.serviceWorker.ready.then((registration) => {
        registration.active.postMessage({ type: "SKIP_WAITING" });
      });

      // Hide notification
      notification.classList.remove("show");

      // Reload the page to get the new version
      setTimeout(() => {
        window.location.reload();
      }, 500);
    });
  }
}

// Initialize the PWA Install Manager
document.addEventListener("DOMContentLoaded", () => {
  window.pwaInstallManager = new PWAInstallManager();

  // Log important app information for debugging
  console.log(
    "Running in standalone mode:",
    window.matchMedia("(display-mode: standalone)").matches
  );
  console.log("Service worker supported:", "serviceWorker" in navigator);

  // Force beforeinstallprompt event to fire if needed
  try {
    window.dispatchEvent(new Event("beforeinstallprompt"));
  } catch (e) {
    console.log("Custom beforeinstallprompt event failed:", e);
  }
});
