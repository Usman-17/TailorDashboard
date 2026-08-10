import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const useTailorReports = (period = "month", from = "", to = "") => {
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("period", period);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return params.toString();
  }, [period, from, to]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["tailorReports", period, from, to],
    queryFn: async () => {
      const response = await fetch(`/api/tailor-reports?${queryParams}`);
      if (!response.ok) throw new Error("Failed to fetch reports");
      return response.json();
    },
    staleTime: 30000,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  return {
    periodLabel: data?.periodLabel ?? "",
    summary: data?.summary ?? null,
    ordersByStatus: data?.ordersByStatus ?? {},
    deliveryPerformance: data?.deliveryPerformance ?? { onTime: 0, late: 0, total: 0 },
    expenseByCategory: data?.expenseByCategory ?? [],
    paymentByMethod: data?.paymentByMethod ?? [],
    monthlyOrders: data?.monthlyOrders ?? [],
    monthlyRevenue: data?.monthlyRevenue ?? [],
    monthlyExpenses: data?.monthlyExpenses ?? [],
    isLoading,
    isError,
    error,
  };
};

export { useTailorReports };
