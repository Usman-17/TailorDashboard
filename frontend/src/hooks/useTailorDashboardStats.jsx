import { useQuery } from "@tanstack/react-query";

const useTailorDashboardStats = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["tailorDashboardStats"],
    queryFn: async () => {
      const response = await fetch("/api/tailor-dashboard/stats");
      if (!response.ok) throw new Error("Failed to fetch dashboard stats");
      return response.json();
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  return { data, isLoading, isError, error };
};

export default useTailorDashboardStats;
