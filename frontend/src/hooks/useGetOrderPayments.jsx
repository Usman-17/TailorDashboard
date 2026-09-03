import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import * as orderRepo from "../offline/repos/orderRepo";
import useGetAuth from "./useGetAuth";

const useGetOrderPayments = (filters = {}) => {
  const { method, type, from, to, search } = filters;
  const { data: authUser } = useGetAuth();
  const shopId = authUser?.shop?._id || authUser?.shop;

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (method && method !== "all") params.set("method", method);
    if (type && type !== "all") params.set("type", type);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (search) params.set("search", search);
    return params.toString();
  }, [method, type, from, to, search]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["orderPayments", filters],
    queryFn: async () => {
      if (navigator.onLine) {
        try {
          const url = `/api/order-payments/all${queryParams ? `?${queryParams}` : ""}`;
          const response = await fetch(url);
          if (response.ok) return response.json();
        } catch {
          // fallback to local
        }
      }

      if (shopId) {
        const orders = await orderRepo.getAll(shopId);
        const allPayments = [];
        for (const order of orders) {
          if (order.isDeleted || !order.serverId) continue;
          const history = order.paymentHistory || [];
          for (const p of history) {
            allPayments.push({
              _id: `${order.localId || order.serverId}-${p.receivedAt || Math.random()}`,
              shopId,
              order: order.serverId || order.localId,
              orderNumber: order.orderNumber,
              customerName: order.customerName || "",
              paymentId: `PAY-${allPayments.length + 1}`,
              amount: p.amount || 0,
              method: p.method || "cash",
              paymentType: p.paymentType || "advance",
              referenceNo: p.referenceNo || "",
              note: p.note || "",
              createdAt: p.receivedAt || order.createdAt,
              isVoided: false,
            });
          }
        }

        let filtered = allPayments;
        if (method && method !== "all") filtered = filtered.filter((p) => p.method === method);
        if (type && type !== "all") filtered = filtered.filter((p) => p.paymentType === type);
        if (from) filtered = filtered.filter((p) => new Date(p.createdAt) >= new Date(from));
        if (to) filtered = filtered.filter((p) => new Date(p.createdAt) <= new Date(to + "T23:59:59"));
        if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter((p) =>
            (p.paymentId || "").toLowerCase().includes(q) ||
            (p.customerName || "").toLowerCase().includes(q) ||
            (p.orderNumber || "").toLowerCase().includes(q)
          );
        }

        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return { payments: filtered, total: filtered.length, page: 1, pages: 1 };
      }

      return { payments: [], total: 0, page: 1, pages: 1 };
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  return {
    payments: data?.payments ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError,
    error,
    refetch,
  };
};

export { useGetOrderPayments };
