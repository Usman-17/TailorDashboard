import { useQuery } from "@tanstack/react-query";

const useOrderPaymentSummary = () => {
  const {
    data: summary,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["orderPaymentSummary"],
    queryFn: async () => {
      const response = await fetch("/api/order-payments/summary");
      if (!response.ok) throw new Error("Failed to fetch payment summary");
      return response.json();
    },
    staleTime: 30000,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  return { summary: summary ?? null, isLoading, isError, error };
};

export { useOrderPaymentSummary };
