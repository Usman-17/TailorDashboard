import { useQuery } from "@tanstack/react-query";

const useAdminUpcomingRenewals = () => {
  return useQuery({
    queryKey: ["adminUpcomingRenewals"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/admin-upcoming-renewals", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch upcoming renewals");
      return res.json();
    },
  });
};

export default useAdminUpcomingRenewals;
