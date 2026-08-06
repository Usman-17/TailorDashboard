import { useQuery } from "@tanstack/react-query";

const useDashboardUpcomingDeliveries = () => {
  return useQuery({
    queryKey: ["dashboardUpcomingDeliveries"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/upcoming-deliveries", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch upcoming deliveries");
      return res.json();
    },
    staleTime: 30000,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};

export default useDashboardUpcomingDeliveries;
