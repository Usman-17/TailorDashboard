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
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOffline, isOnline, hasBeenOffline]);

  if (!isOffline && !showReconnected) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none flex justify-center transition-all duration-300">
      {isOffline ? (
        <div className="flex items-center gap-1.5 px-3 py-1 mt-1 bg-amber-500/90 dark:bg-amber-600/90 text-white rounded-full shadow-sm text-[11px] font-medium backdrop-blur-sm">
          <WifiOff size={11} />
          <span>Offline</span>
        </div>
      ) : showReconnected ? (
        <div className="flex items-center gap-1.5 px-3 py-1 mt-1 bg-emerald-500/90 dark:bg-emerald-600/90 text-white rounded-full shadow-sm text-[11px] font-medium backdrop-blur-sm">
          <Wifi size={11} />
          <span>Online</span>
        </div>
      ) : null}
    </div>
  );
};

export default OfflineIndicator;
