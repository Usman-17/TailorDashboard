import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";
import useNetworkStatus from "../hooks/useNetworkStatus";

const OfflineIndicator = () => {
  const { isOffline, isOnline } = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [hasBeenOffline, setHasBeenOffline] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setHasBeenOffline(true);
      setShowReconnected(false);
    } else if (isOnline && hasBeenOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setHasBeenOffline(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOffline, isOnline, hasBeenOffline]);

  if (!isOffline && !showReconnected) {
    return null;
  }

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-top-2">
      {isOffline ? (
        <div className="flex items-center gap-2.5 px-4 py-2 bg-amber-600 dark:bg-amber-700 text-white rounded-full shadow-lg shadow-amber-900/20 text-xs font-medium backdrop-blur-sm border border-amber-500/40">
          <WifiOff size={14} className="animate-pulse" />
          <span>You're currently offline. Offline mode active.</span>
        </div>
      ) : showReconnected ? (
        <div className="flex items-center gap-2.5 px-4 py-2 bg-emerald-600 dark:bg-emerald-700 text-white rounded-full shadow-lg shadow-emerald-900/20 text-xs font-medium backdrop-blur-sm border border-emerald-500/40">
          <Wifi size={14} />
          <span>Back online</span>
        </div>
      ) : null}
    </div>
  );
};

export default OfflineIndicator;
