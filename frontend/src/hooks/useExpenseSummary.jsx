import { useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import useGetAuth from "./useGetAuth";
import * as expenseRepo from "../offline/repos/expenseRepo";
// Imports End-----

const useExpenseSummary = () => {
  const queryClient = useQueryClient();
  const { data: authUser } = useGetAuth();
  const shopId = authUser?.shop?._id || authUser?.shop;

  const {
    data: summary,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["expenseSummary"],
    queryFn: async () => {
      if (!shopId) return null;

      if (!navigator.onLine) {
        return await expenseRepo.getSummary(shopId);
      }

      try {
        const response = await fetch("/api/expense-records/summary", {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch expense summary");
        const result = await response.json();

        const localSummary = await expenseRepo.getSummary(shopId);
        return {
          totalExpenses: result.totalExpenses ?? localSummary.totalExpenses,
          todayExpenses: result.todayExpenses ?? localSummary.todayExpenses,
          monthExpenses: result.monthExpenses ?? localSummary.monthExpenses,
        };
      } catch {
        return await expenseRepo.getSummary(shopId);
      }
    },
    enabled: !!shopId,
    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const handleSyncEvent = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["expenseSummary"] });
  }, [queryClient]);

  useEffect(() => {
    window.addEventListener("tailor-offline-synced", handleSyncEvent);
    return () =>
      window.removeEventListener("tailor-offline-synced", handleSyncEvent);
  }, [handleSyncEvent]);

  return { summary: summary ?? null, isLoading, isError, error };
};

export { useExpenseSummary };
