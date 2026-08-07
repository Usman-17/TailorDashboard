import { useQuery } from "@tanstack/react-query";

const useAdminRecentPayments = () => {
  return useQuery({
    queryKey: ["adminRecentPayments"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/admin-recent-payments", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch recent payments");
      return res.json();
    },
  });
};

export default useAdminRecentPayments;
