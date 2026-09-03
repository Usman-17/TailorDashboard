import { Component, useEffect, useState, useRef } from "react";
import { useOfflineStatus } from "../offline/hooks/useOfflineStatus";
import {
  fetchAndCacheServerData,
  runSync,
  cacheDashboardData,
} from "../offline/sync/syncManager";
import { getPendingSyncItems, removeSyncItem } from "../offline/db/syncQueue";
import useGetAuth from "../hooks/useGetAuth";
import { RefreshCw, Check, AlertTriangle, CloudOff, X, Trash2 } from "lucide-react";

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
  const [showDetails, setShowDetails] = useState(false);
  const [failedItems, setFailedItems] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDetails(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showDetails && shopId && hasFailed) {
      getPendingSyncItems(shopId).then((items) => {
        setFailedItems(items.filter((i) => i.status === "failed"));
      });
    }
  }, [showDetails, shopId, hasFailed, syncStats]);

  useEffect(() => {
    if (shopId && navigator.onLine) {
      fetchAndCacheServerData(shopId);
    }
  }, [shopId]);

  useEffect(() => {
    if (!shopId) return;

    const refreshDashboard = () => {
      if (navigator.onLine) cacheDashboardData(shopId);
    };

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

  const clearFailed = async () => {
    for (const item of failedItems) {
      await removeSyncItem(item.id);
    }
    setFailedItems([]);
    setShowDetails(false);
  };

  if (hasFailed) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium cursor-pointer hover:bg-red-200 transition-colors"
          title="Click to see details"
        >
          <AlertTriangle size={12} />
          <span>{syncStats.failed} failed</span>
        </button>
        {showDetails && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#1a1129] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Failed Sync Items</span>
              <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={14} />
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {failedItems.length === 0 ? (
                <div className="px-3 py-4 text-xs text-gray-400 text-center">No failed items</div>
              ) : (
                failedItems.map((item) => (
                  <div key={item.id} className="px-3 py-2 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                    <div className="text-xs font-medium text-gray-800 dark:text-gray-200 capitalize">
                      {item.entity} — {item.operation}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {item.payload?.orderNumber || item.payload?.name || item.localId || ""}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="px-3 py-2 flex gap-2">
              <button
                onClick={() => { runSync(true); setShowDetails(false); }}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[11px] font-medium hover:bg-blue-200 transition-colors"
              >
                <RefreshCw size={11} /> Retry
              </button>
              <button
                onClick={clearFailed}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-[11px] font-medium hover:bg-red-200 transition-colors"
              >
                <Trash2 size={11} /> Clear
              </button>
            </div>
          </div>
        )}
      </div>
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
