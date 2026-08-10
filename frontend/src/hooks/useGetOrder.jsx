import { useQuery } from "@tanstack/react-query";

const useGetOrder = (orderId) => {
  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) throw new Error("Failed to fetch order");
      return response.json();
    },
    enabled: !!orderId,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  return { order: order ?? null, isLoading, isError, error, refetch };
};

export { useGetOrder };
