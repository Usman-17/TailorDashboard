import { useQuery } from "@tanstack/react-query";
import { getActiveOfflineSession } from "../utils/offlineAuth";

const fetchAuthUser = async () => {
  if (!navigator.onLine) {
    return getActiveOfflineSession() || null;
  }

  try {
    const res = await fetch("/api/auth/user", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
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
  });
};

export default useGetAuth;
