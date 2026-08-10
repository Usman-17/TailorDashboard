import { useQuery } from "@tanstack/react-query";

const useTailorLatestCustomers = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["tailorLatestCustomers"],
    queryFn: async () => {
      const response = await fetch("/api/tailor-dashboard/latest-customers");
      if (!response.ok) throw new Error("Failed to fetch latest customers");
      return response.json();
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  return { data: data ?? [], isLoading, isError, error };
};

export default useTailorLatestCustomers;
