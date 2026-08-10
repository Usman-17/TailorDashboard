import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const useGetExpenses = (filters = {}) => {
  const { category, method, from, to, search } = filters;

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (category && category !== "all") params.set("category", category);
    if (method && method !== "all") params.set("method", method);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (search) params.set("search", search);
    return params.toString();
  }, [category, method, from, to, search]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["expenseRecords", filters],
    queryFn: async () => {
      const url = `/api/expense-records/all${queryParams ? `?${queryParams}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch expenses");
      return response.json();
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  return {
    expenses: data?.expenses ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError,
    error,
    refetch,
  };
};

export { useGetExpenses };
