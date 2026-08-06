import { useQuery } from "@tanstack/react-query";

const useDashboardRecentOrders = () => {
  return useQuery({
    queryKey: ["dashboardRecentOrders"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/recent-orders", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch recent orders");
      return res.json();
    },
    staleTime: 30000,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};

export default useDashboardRecentOrders;
