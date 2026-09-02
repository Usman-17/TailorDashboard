import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { setDashboardCache } from "../offline/db/dashboardCache";
import { getOfflineRecentOrders } from "../offline/utils/dashboardOffline";
import useGetAuth from "./useGetAuth";

const getEffectiveShopId = (authUser) => {
  if (authUser?.shop?._id) return String(authUser.shop._id);
  if (authUser?.shop && typeof authUser.shop === "string")
    return String(authUser.shop);
  try {
    const raw = localStorage.getItem("tailor_active_offline_session");
    if (raw) {
      const data = JSON.parse(raw);
      const s = data?.user?.shop;
      if (s?._id) return String(s._id);
      if (s && typeof s === "string") return String(s);
    }
  } catch (_) {}
  return "";
};

const useTailorRecentOrders = () => {
  const { data: authUser } = useGetAuth();
  const shopId = getEffectiveShopId(authUser);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleRefresh = () => {
      queryClient.invalidateQueries({ queryKey: ["tailorRecentOrders"] });
    };

    window.addEventListener("tailor-dashboard-cached", handleRefresh);
    window.addEventListener("tailor-offline-synced", handleRefresh);
    window.addEventListener("tailor-sync-queue-changed", handleRefresh);

    return () => {
      window.removeEventListener("tailor-dashboard-cached", handleRefresh);
      window.removeEventListener("tailor-offline-synced", handleRefresh);
      window.removeEventListener("tailor-sync-queue-changed", handleRefresh);
    };
  }, [queryClient]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["tailorRecentOrders", shopId],
    queryFn: async () => {
      // ── Online path ──────────────────────────────────────────────
      if (navigator.onLine) {
        try {
          const response = await fetch("/api/tailor-dashboard/recent-orders", {
            credentials: "include",
          });
          if (response.ok) {
            const json = await response.json();
            if (shopId) {
              setDashboardCache(shopId, "recent-orders", json).catch(() => {});
            }
            return json;
          }
        } catch {
          // fall through to offline computation
        }
      }

      // ── Offline path (fetch directly from IndexedDB) ─────────────
      return await getOfflineRecentOrders(shopId);
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  return { data: data ?? [], isLoading, isError, error };
};

export default useTailorRecentOrders;
