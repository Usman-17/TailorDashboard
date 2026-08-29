import { useQuery } from "@tanstack/react-query";
import * as customerRepo from "../offline/repos/customerRepo";
import useGetAuth from "./useGetAuth";

export const useGetAllCustomers = (search = "") => {
  const { data: authUser } = useGetAuth();
  const shopId = authUser?.shop?._id || authUser?.shop;

  return useQuery({
    queryKey: ["customers", search],
    queryFn: async () => {
      if (shopId) {
        const localCustomers = search
          ? await customerRepo.search(shopId, search)
          : await customerRepo.getAll(shopId);

        if (navigator.onLine) {
          try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            const res = await fetch(`/api/customers/all?${params.toString()}`, {
              credentials: "include",
            });
            if (res.ok) {
              const data = await res.json();
              for (const c of data.customers || []) {
                await customerRepo.upsertFromServer(shopId, c);
              }

              const pendingLocal = localCustomers.filter(
                (c) => !c.isDeleted && c.syncStatus === "pending",
              );

              const serverIds = new Set(
                (data.customers || []).map((c) => c._id),
              );
              const unsyncedPending = pendingLocal.filter(
                (c) => !serverIds.has(c.serverId),
              );

              const allCustomers = [
                ...(data.customers || []),
                ...unsyncedPending.map((c) => ({
                  ...c,
                  _id: c.serverId || c.localId,
                })),
              ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

              return { customers: allCustomers };
            }
          } catch {
            // fallback to local
          }
        }

        return {
          customers: localCustomers
            .filter((c) => !c.isDeleted)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((c) => ({
              ...c,
              _id: c.serverId || c.localId,
              createdAt: c.createdAt,
              updatedAt: c.updatedAt,
            })),
        };
      }

      return { customers: [] };
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
    enabled: !!shopId,
  });
};

export default useGetAllCustomers;
