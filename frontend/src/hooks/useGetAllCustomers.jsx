import { useQuery } from "@tanstack/react-query";
import * as customerRepo from "../offline/repos/customerRepo";
import useGetAuth from "./useGetAuth";

export const useGetAllCustomers = (search = "") => {
  const { data: authUser } = useGetAuth();
  const shopId = authUser?.shop?._id || authUser?.shop;

  return useQuery({
    queryKey: ["customers", search],
    queryFn: async () => {
      if (!shopId) return { customers: [] };

      if (navigator.onLine) {
        try {
          const params = new URLSearchParams();
          if (search) params.set("search", search);
          const res = await fetch(`/api/customers/all?${params.toString()}`, {
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            const serverCustomers = data.customers || [];

            for (const c of serverCustomers) {
              await customerRepo.upsertFromServer(shopId, c);
            }

            const localCustomers = await customerRepo.getAll(shopId);
            const pendingLocal = localCustomers.filter(
              (c) => !c.isDeleted && c.syncStatus === "pending",
            );
            const serverIds = new Set(serverCustomers.map((c) => c._id));
            const unsyncedPending = pendingLocal.filter(
              (c) => !serverIds.has(c.serverId),
            );

            const allCustomers = [
              ...unsyncedPending.map((c) => ({
                ...c,
                _id: c.serverId || c.localId,
              })),
              ...serverCustomers,
            ].sort(
              (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
            );

            return {
              customers: allCustomers,
            };
          }
        } catch (err) {
          console.warn("[useGetAllCustomers] Online fetch failed:", err);
        }
      }

      const localCustomers = await customerRepo.getAll(shopId);
      return {
        customers: localCustomers
          .filter((c) => !c.isDeleted)
          .sort(
            (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
          )
          .map((c) => ({
            ...c,
            _id: c.serverId || c.localId,
          })),
      };
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    enabled: !!shopId,
  });
};

export default useGetAllCustomers;
