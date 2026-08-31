import { useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import useGetAuth from "./useGetAuth";
import * as expenseRepo from "../offline/repos/expenseRepo";
// Imports End-----

const useGetExpenses = (filters = {}) => {
  const queryClient = useQueryClient();
  const { data: authUser } = useGetAuth();
  const shopId = authUser?.shop?._id || authUser?.shop;

  const { category, method, status, from, to, search } = filters;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["expenseRecords", filters],
    queryFn: async () => {
      if (!shopId) return { expenses: [], total: 0 };

      if (!navigator.onLine) {
        const expenses = await expenseRepo.getAllFiltered(shopId, filters);
        return { expenses, total: expenses.length };
      }

      try {
        const params = new URLSearchParams();
        if (category && category !== "all") params.set("category", category);
        if (method && method !== "all") params.set("method", method);
        if (status && status !== "active") params.set("status", status);
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        if (search) params.set("search", search);

        const url = `/api/expense-records/all${params.toString() ? `?${params}` : ""}`;
        const response = await fetch(url, { credentials: "include" });
        if (!response.ok) throw new Error("Failed to fetch expenses");
        const result = await response.json();

        for (const e of result.expenses || []) {
          await expenseRepo.upsertFromServer(shopId, e);
        }

        const expenses = await expenseRepo.getAllFiltered(shopId, filters);
        return { expenses, total: expenses.length };
      } catch {
        const expenses = await expenseRepo.getAllFiltered(shopId, filters);
        return { expenses, total: expenses.length };
      }
    },
    enabled: !!shopId,
    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const handleSyncEvent = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["expenseRecords"] });
    queryClient.invalidateQueries({ queryKey: ["expenseSummary"] });
  }, [queryClient]);

  useEffect(() => {
    window.addEventListener("tailor-offline-synced", handleSyncEvent);
    return () =>
      window.removeEventListener("tailor-offline-synced", handleSyncEvent);
  }, [handleSyncEvent]);

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
