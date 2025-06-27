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

      return response.json();
    },

    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  return {
    orders,
    isLoading,
    isPending,
    isError,
    error,
  };
};

export { useGetAllOrders };
