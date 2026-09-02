import { Component, useEffect } from "react";
import { useOfflineStatus } from "../offline/hooks/useOfflineStatus";
import {
  fetchAndCacheServerData,
  runSync,
  cacheDashboardData,
} from "../offline/sync/syncManager";
import useGetAuth from "../hooks/useGetAuth";
import { RefreshCw, Check, AlertTriangle, CloudOff } from "lucide-react";

class SyncErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.warn("[SyncStatus] Error caught:", err);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function SyncStatusInner() {
  const { data: authUser } = useGetAuth();
  const shopId = authUser?.shop?._id || authUser?.shop;
  const { isOffline, syncStats, hasPending, hasFailed } =
    useOfflineStatus(shopId);

  // Fetch and cache server data (customers, orders, etc.) — once per session
  useEffect(() => {
    if (shopId && navigator.onLine) {
      fetchAndCacheServerData(shopId);
    }
  }, [shopId]);

  // Cache dashboard data every time we come online (runs without the initialSyncDone guard)
  useEffect(() => {
    if (!shopId) return;

    const refreshDashboard = () => {
      if (navigator.onLine) cacheDashboardData(shopId);
    };

    // Run immediately if online now
    refreshDashboard();

    window.addEventListener("online", refreshDashboard);
    return () => window.removeEventListener("online", refreshDashboard);
  }, [shopId]);

  if (!shopId) return null;

  if (isOffline) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium">
        <CloudOff size={12} />
        <span>Offline</span>
      </div>
    );
  }

  if (hasFailed) {
    return (
      <button
        onClick={() => runSync(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium cursor-pointer hover:bg-red-200 transition-colors"
        title="Click to retry sync"
      >
        <AlertTriangle size={12} />
        <span>{syncStats.failed} failed</span>
      </button>
    );
  }

  if (hasPending || syncStats.syncing > 0) {
    return (
      <button
        onClick={() => runSync(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium cursor-pointer"
        title="Click to force sync"
      >
        <RefreshCw
          size={12}
          className={syncStats.syncing > 0 ? "animate-spin" : ""}
        />
        <span>{syncStats.pending + syncStats.syncing} syncing</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => runSync(true)}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium cursor-pointer"
      title="All data synced"
    >
      <Check size={12} />
      <span>Synced</span>
    </button>
  );
}

export default function SyncStatus() {
  return (
    <SyncErrorBoundary>
      <SyncStatusInner />
    </SyncErrorBoundary>
  );
}
