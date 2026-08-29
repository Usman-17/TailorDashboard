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

    const hook = db.syncQueue.hook("creating", refreshStats);
    const hook2 = db.syncQueue.hook("updating", refreshStats);
    const hook3 = db.syncQueue.hook("deleting", refreshStats);

    return () => {
      clearInterval(interval);
      hook.unsubscribe();
      hook2.unsubscribe();
      hook3.unsubscribe();
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
