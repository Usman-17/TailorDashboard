import { useQuery } from "@tanstack/react-query";
import { getActiveOfflineSession } from "../utils/offlineAuth";

const fetchAuthUser = async () => {
  try {
    const res = await fetch("/api/auth/user", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
    // 401 / 404 / 403 from server means not logged in online
    if (res.status === 401 || res.status === 403) {
      return null;
    }
  } catch {
    const offlineSession = getActiveOfflineSession();
    if (offlineSession) {
      return offlineSession;
    }
    return null;
  }

  // Fallback to offline session if any
  const offlineSession = getActiveOfflineSession();
  return offlineSession || null;
};

const useGetAuth = () => {
  return useQuery({
    queryKey: ["authUser"],
    queryFn: fetchAuthUser,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    refetchOnMount: true,
    refetchOnReconnect: true,
    networkMode: "always",
  });
};

export default useGetAuth;
