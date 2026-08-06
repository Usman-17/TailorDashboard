import { useQuery } from "@tanstack/react-query";

const useDashboardLatestCustomers = () => {
  return useQuery({
    queryKey: ["dashboardLatestCustomers"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/latest-customers", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch latest customers");
      return res.json();
    },
    staleTime: 30000,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};

export default useDashboardLatestCustomers;
