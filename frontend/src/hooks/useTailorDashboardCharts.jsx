import { useQuery } from "@tanstack/react-query";

const useTailorDashboardCharts = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["tailorDashboardCharts"],
    queryFn: async () => {
      const response = await fetch("/api/tailor-dashboard/charts");
      if (!response.ok) throw new Error("Failed to fetch chart data");
      return response.json();
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  return { data, isLoading, isError, error };
};

export default useTailorDashboardCharts;
