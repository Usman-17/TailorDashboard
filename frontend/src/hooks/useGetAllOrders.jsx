import { useQuery } from "@tanstack/react-query";

const useGetAllOrders = () => {
  const {
    data: orders,
    isLoading,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await fetch("/api/orders/all");

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const json = await response.json();
      // API may return { orders: [...] } or a plain array
      return Array.isArray(json) ? json : (json.orders ?? json.data ?? []);
    },

    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
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
