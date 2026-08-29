import { Component, useEffect } from "react";
import { useOfflineStatus } from "../offline/hooks/useOfflineStatus";
import { fetchAndCacheServerData } from "../offline/sync/syncManager";
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

  useEffect(() => {
    if (shopId && navigator.onLine) {
      fetchAndCacheServerData(shopId);
    }
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
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium">
        <AlertTriangle size={12} />
        <span>{syncStats.failed} failed</span>
      </div>
    );
  }

  if (hasPending || syncStats.syncing > 0) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
        <RefreshCw size={12} className={syncStats.syncing > 0 ? "animate-spin" : ""} />
        <span>{syncStats.pending + syncStats.syncing} syncing</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium">
      <Check size={12} />
      <span>Synced</span>
    </div>
  );
}

export default function SyncStatus() {
  return (
    <SyncErrorBoundary>
      <SyncStatusInner />
    </SyncErrorBoundary>
  );
}
