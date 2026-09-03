import { useQuery } from "@tanstack/react-query";
import * as orderRepo from "../offline/repos/orderRepo";
import useGetAuth from "./useGetAuth";

const useOrderPaymentSummary = () => {
  const { data: authUser } = useGetAuth();
  const shopId = authUser?.shop?._id || authUser?.shop;

  const {
    data: summary,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["orderPaymentSummary"],
    queryFn: async () => {
      if (navigator.onLine) {
        try {
          const response = await fetch("/api/order-payments/summary");
          if (response.ok) return response.json();
        } catch {
          // fallback to local
        }
      }

      if (shopId) {
        const orders = await orderRepo.getAll(shopId);
        const syncedOrders = orders.filter((o) => !o.isDeleted && o.serverId);
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(startOfDay);
        endOfDay.setHours(23, 59, 59, 999);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let totalCollected = 0;
        let todayCollection = 0;
        let monthCollection = 0;
        let pendingAmount = 0;

        for (const order of syncedOrders) {
          const payments = order.paymentHistory || [];
          for (const p of payments) {
            const amt = p.amount || 0;
            const date = new Date(p.receivedAt || order.createdAt);
            totalCollected += amt;
            if (date >= startOfDay && date <= endOfDay) todayCollection += amt;
            if (date >= startOfMonth) monthCollection += amt;
          }
          if (!order.isPaid) pendingAmount += order.remainingBalance || 0;
        }

        return {
          totalCollected,
          todayCollection,
          monthCollection,
          pendingAmount,
        };
      }

      return { totalCollected: 0, todayCollection: 0, monthCollection: 0, pendingAmount: 0 };
    },
    staleTime: 30000,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  return { summary: summary ?? null, isLoading, isError, error };
};

export { useOrderPaymentSummary };
