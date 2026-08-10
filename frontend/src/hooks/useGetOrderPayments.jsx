import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const useGetOrderPayments = (filters = {}) => {
  const { method, type, from, to, search } = filters;

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (method && method !== "all") params.set("method", method);
    if (type && type !== "all") params.set("type", type);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (search) params.set("search", search);
    return params.toString();
  }, [method, type, from, to, search]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["orderPayments", filters],
    queryFn: async () => {
      const url = `/api/order-payments/all${queryParams ? `?${queryParams}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch payments");
      return response.json();
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  return {
    payments: data?.payments ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError,
    error,
    refetch,
  };
};

export { useGetOrderPayments };
