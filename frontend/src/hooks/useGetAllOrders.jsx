import { useQuery } from "@tanstack/react-query";
import * as orderRepo from "../offline/repos/orderRepo";
import useGetAuth from "./useGetAuth";

const useGetAllOrders = () => {
  const { data: authUser } = useGetAuth();
  const shopId = authUser?.shop?._id || authUser?.shop;

  const {
    data: orders,
    isLoading,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      if (shopId) {
        const localOrders = await orderRepo.getAll(shopId);

        if (navigator.onLine) {
          try {
            const response = await fetch("/api/orders/all?limit=999");
            if (response.ok) {
              const json = await response.json();
              const serverOrders = Array.isArray(json)
                ? json
                : (json.orders ?? json.data ?? []);

              for (const o of serverOrders) {
                await orderRepo.upsertFromServer(shopId, o);
              }

              const pendingLocal = localOrders.filter(
                (o) => !o.isDeleted && o.syncStatus === "pending",
              );

              const serverIds = new Set(serverOrders.map((o) => o._id));
              const unsyncedPending = pendingLocal.filter(
                (o) => !serverIds.has(o.serverId),
              );

              const allOrders = [
                ...serverOrders,
                ...unsyncedPending.map((o) => ({
                  ...o,
                  _id: o.serverId || o.localId,
                  customer: o.customerId || o.customerLocalId,
                })),
              ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

              return allOrders;
            }
          } catch {
            // fallback to local
          }
        }

        return localOrders
          .filter((o) => !o.isDeleted)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .map((o) => ({
            ...o,
            _id: o.serverId || o.localId,
            customer: o.customerId || o.customerLocalId,
            createdAt: o.createdAt,
            updatedAt: o.updatedAt,
          }));
      }

      return [];
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
    enabled: !!shopId,
  });

  return {
    orders: orders ?? [],
    isLoading,
    isPending,
    isError,
    error,
  };
};

export { useGetAllOrders };
