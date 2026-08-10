import { useQuery } from "@tanstack/react-query";

const useExpenseSummary = () => {
  const {
    data: summary,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["expenseSummary"],
    queryFn: async () => {
      const response = await fetch("/api/expense-records/summary");
      if (!response.ok) throw new Error("Failed to fetch expense summary");
      return response.json();
    },
    staleTime: 30000,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  return { summary: summary ?? null, isLoading, isError, error };
};

export { useExpenseSummary };
