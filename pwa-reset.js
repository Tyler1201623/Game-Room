/**
 * PWA Reset Script
 * This script clears all caches and unregisters service workers
 * Use in the browser console to completely reset PWA state
 */
function clearPWACache() {
  console.log("Starting PWA cache reset...");

  // Clear all caches
  if ("caches" in window) {
    caches
      .keys()
      .then((cacheNames) => {
        console.log("Found caches to delete:", cacheNames);
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log(`Deleting cache: ${cacheName}`);
            return caches.delete(cacheName).then((success) => {
              console.log(`Cache ${cacheName} deleted: ${success}`);
            });
          })
        );
      })
      .catch((err) => {
        console.error("Error clearing caches:", err);
      })
      .finally(() => {
        console.log("Cache clearing completed");
      });
  } else {
    console.log("Cache API not available in this browser");
  }

  // Unregister all service workers
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        if (registrations.length === 0) {
          console.log("No service workers to unregister");
          return;
        }

        console.log(
          `Found ${registrations.length} service worker registrations to remove`
        );
        return Promise.all(
          registrations.map((registration) => {
            console.log(`Unregistering service worker: ${registration.scope}`);
            return registration.unregister().then((success) => {
              console.log(
                `Service worker ${registration.scope} unregistered: ${success}`
              );
            });
          })
        );
      })
      .catch((err) => {
        console.error("Error unregistering service workers:", err);
      })
      .finally(() => {
        console.log("Service worker unregistration completed");
      });
  } else {
    console.log("Service Worker API not available in this browser");
  }

  // Clear localStorage
  try {
    if (
      confirm(
        "Clear localStorage as well? This will reset saved game scores and preferences."
      )
    ) {
      localStorage.clear();
      console.log("localStorage cleared");
    } else {
      console.log("localStorage clearing skipped");
    }
  } catch (e) {
    console.error("Error clearing localStorage:", e);
  }

  console.log("PWA reset completed. Please refresh the page.");

  // Optional: Reload the page after clearing caches
  if (confirm("Reload the page now?")) {
    window.location.reload(true);
  }
}

// If this script is run directly, execute the function
if (
  typeof window !== "undefined" &&
  document.currentScript.getAttribute("data-run-immediately") === "true"
) {
  clearPWACache();
}

// Export the function for future use
window.clearPWACache = clearPWACache;
