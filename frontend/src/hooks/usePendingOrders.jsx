import { useQuery } from "@tanstack/react-query";
import * as orderRepo from "../offline/repos/orderRepo";
import useGetAuth from "./useGetAuth";

const usePendingOrders = () => {
  const { data: authUser } = useGetAuth();
  const shopId = authUser?.shop?._id || authUser?.shop;

  const {
    data: pendingOrders,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["pendingOrders"],
    queryFn: async () => {
      if (navigator.onLine) {
        try {
          const response = await fetch("/api/order-payments/pending-orders");
          if (response.ok) return response.json();
        } catch {
          // fallback to local
        }
      }

      if (shopId) {
        const orders = await orderRepo.getAll(shopId);
        return orders
          .filter((o) => !o.isDeleted && o.serverId && !o.isPaid && (o.remainingBalance || 0) > 0)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .map((o) => ({
            _id: o.serverId || o.localId,
            orderNumber: o.orderNumber,
            totalAmount: o.totalAmount || 0,
            advancePaid: o.advancePaid || 0,
            remainingBalance: o.remainingBalance || 0,
            deliveryDate: o.deliveryDate,
            status: o.status,
            createdAt: o.createdAt,
            customerName: o.customerName || "",
            customerPhone: o.customerPhone || "",
          }));
      }

      return [];
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  return { pendingOrders: pendingOrders ?? [], isLoading, isError, error };
};

export { usePendingOrders };
