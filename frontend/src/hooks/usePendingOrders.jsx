import { useQuery } from "@tanstack/react-query";

const usePendingOrders = () => {
  const {
    data: pendingOrders,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["pendingOrders"],
    queryFn: async () => {
      const response = await fetch("/api/order-payments/pending-orders");
      if (!response.ok) throw new Error("Failed to fetch pending orders");
      return response.json();
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  return { pendingOrders: pendingOrders ?? [], isLoading, isError, error };
};

export { usePendingOrders };
