import { useState, useEffect, useCallback } from "react";
import { getSyncQueueStats } from "../db/syncQueue";
import db from "../db/database";

export function useOfflineStatus(shopId) {
  const [syncStats, setSyncStats] = useState({
    total: 0,
    pending: 0,
    syncing: 0,
    failed: 0,
    synced: 0,
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const refreshStats = useCallback(async () => {
    if (!shopId) return;
    try {
      const stats = await getSyncQueueStats(shopId);
      setSyncStats(stats);
    } catch {
      // ignore
    }
  }, [shopId]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 5000);

    let hooks = [];
    try {
      hooks = [
        db.syncQueue.hook("creating", refreshStats),
        db.syncQueue.hook("updating", refreshStats),
        db.syncQueue.hook("deleting", refreshStats),
      ];
    } catch (_) {}

    return () => {
      clearInterval(interval);
      hooks.forEach((h) => {
        if (h && typeof h.unsubscribe === "function") h.unsubscribe();
      });
    };
  }, [refreshStats]);

  return {
    isOnline,
    isOffline: !isOnline,
    syncStats,
    refreshStats,
    hasPending: syncStats.pending > 0,
    hasFailed: syncStats.failed > 0,
  };
}
