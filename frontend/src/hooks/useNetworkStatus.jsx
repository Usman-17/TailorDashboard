import { useState, useEffect, useCallback, useRef } from "react";

export const useNetworkStatus = () => {
  const [isBrowserOnline, setIsBrowserOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [isServerReachable, setIsServerReachable] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const checkTimeoutRef = useRef(null);

  const checkReachability = useCallback(async () => {
    if (!navigator.onLine) {
      setIsServerReachable(false);
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      // Lightweight HEAD/GET probe to check backend reachability
      const res = await fetch("/favicon.ico", {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const reachable = res.ok || res.status < 500;
      setIsServerReachable(reachable);
      return reachable;
    } catch {
      setIsServerReachable(false);
      return false;
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsBrowserOnline(true);
      checkReachability().then((reachable) => {
        if (reachable && wasOffline) {
          // Reconnected
        }
      });
    };

    const handleOffline = () => {
      setIsBrowserOnline(false);
      setIsServerReachable(false);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setIsBrowserOnline(false);
      setIsServerReachable(false);
      setWasOffline(true);
    } else {
      checkReachability();
    }

    // Periodic check every 30 seconds when tab is active
    const interval = setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        checkReachability();
      }
    }, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    };
  }, [checkReachability, wasOffline]);

  const isOnline = isBrowserOnline && isServerReachable;
  const isOffline = !isOnline;

  return {
    isOnline,
    isOffline,
    isBrowserOnline,
    isServerReachable,
    wasOffline,
    checkReachability,
  };
};

export default useNetworkStatus;
