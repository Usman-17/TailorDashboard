export function register() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      const swUrl = "/sw.js";

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log(
            "[SW] Service Worker registered with scope:",
            registration.scope,
          );

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }
            installingWorker.onstatechange = () => {
              if (installingWorker.state === "installed") {
                if (navigator.serviceWorker.controller) {
                  console.log("[SW] New content available; please refresh.");
                } else {
                  console.log("[SW] Content cached for offline use.");
                }
              }
            };
          };
        })
        .catch((error) => {
          console.warn("[SW] Error registering Service Worker:", error);
        });
    });
  }
}

export function unregister() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
