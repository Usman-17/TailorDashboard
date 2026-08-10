import { useQuery } from "@tanstack/react-query";

const useTailorRecentOrders = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["tailorRecentOrders"],
    queryFn: async () => {
      const response = await fetch("/api/tailor-dashboard/recent-orders");
      if (!response.ok) throw new Error("Failed to fetch recent orders");
      return response.json();
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  return { data: data ?? [], isLoading, isError, error };
};

export default useTailorRecentOrders;
