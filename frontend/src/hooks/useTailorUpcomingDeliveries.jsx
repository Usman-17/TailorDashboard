import { useQuery } from "@tanstack/react-query";

const useTailorUpcomingDeliveries = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["tailorUpcomingDeliveries"],
    queryFn: async () => {
      const response = await fetch("/api/tailor-dashboard/upcoming-deliveries");
      if (!response.ok) throw new Error("Failed to fetch upcoming deliveries");
      return response.json();
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  return { data: data ?? [], isLoading, isError, error };
};

export default useTailorUpcomingDeliveries;
