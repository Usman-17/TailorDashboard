import { AlertTriangle, RefreshCcw, WifiOff } from "lucide-react";

const TableErrorState = ({ isError, message, statusCode }) => {
  if (!isError || statusCode === 200 || message === "No record found.") {
    return null;
  }

  const isNetworkOffline =
    !navigator.onLine ||
    message?.toLowerCase().includes("failed to fetch") ||
    message?.toLowerCase().includes("network") ||
    message?.toLowerCase().includes("offline");

  return (
    <div className="flex flex-col items-center justify-center w-full py-8 px-4 text-center animate-in fade-in zoom-in duration-300">
      <div className="relative mb-6">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center animate-pulse ${
            isNetworkOffline ? "bg-amber-500/10" : "bg-red-500/10"
          }`}
        >
          {isNetworkOffline ? (
            <WifiOff size={40} className="text-amber-500" />
          ) : (
            <AlertTriangle size={40} className="text-red-500" />
          )}
        </div>
        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 p-1.5 rounded-full shadow-lg border border-gray-100 dark:border-gray-800">
          <RefreshCcw
            size={14}
            className={isNetworkOffline ? "text-amber-400" : "text-red-400"}
          />
        </div>
      </div>

      <div className="max-w-md mx-auto space-y-2">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 tracking-tight">
          {isNetworkOffline
            ? "Offline — Network Unavailable"
            : "Oops! Something went wrong"}
        </h3>

        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {isNetworkOffline
            ? "You're currently in offline mode. Live data from server will refresh automatically when you reconnect."
            : message}
        </p>
      </div>
    </div>
  );
};

export default TableErrorState;
