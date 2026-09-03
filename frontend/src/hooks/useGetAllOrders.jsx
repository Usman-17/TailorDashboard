import { useQuery } from "@tanstack/react-query";
import * as orderRepo from "../offline/repos/orderRepo";
import * as customerRepo from "../offline/repos/customerRepo";
import useGetAuth from "./useGetAuth";

const useGetAllOrders = () => {
  const { data: authUser } = useGetAuth();
  const shopId = authUser?.shop?._id || authUser?.shop;

  const resolveCustomer = async (order) => {
    if (order.customer && typeof order.customer === "object") return order.customer;
    const id = order.customerId || order.customer || null;
    if (id) {
      let customer = await customerRepo.getByServerId(shopId, String(id));
      if (!customer) customer = await customerRepo.getById(shopId, String(id));
      if (customer) return { _id: customer.serverId || customer.localId, name: customer.name, phone: customer.phone };
    }
    if (order.customerName) return { _id: id || order.localId, name: order.customerName };
    return { _id: id || "unknown", name: "Unknown" };
  };

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
                ...await Promise.all(
                  unsyncedPending.map(async (o) => ({
                    ...o,
                    _id: o.serverId || o.localId,
                    customer: await resolveCustomer(o),
                  })),
                ),
              ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

              return allOrders;
            }
          } catch {
            // fallback to local
          }
        }

        return Promise.all(
          localOrders
            .filter((o) => !o.isDeleted)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map(async (o) => ({
              ...o,
              _id: o.serverId || o.localId,
              customer: await resolveCustomer(o),
              createdAt: o.createdAt,
              updatedAt: o.updatedAt,
            })),
        );
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
