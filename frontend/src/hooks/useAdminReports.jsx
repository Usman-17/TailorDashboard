import { useQuery } from "@tanstack/react-query";

const useAdminReports = (period = "month") => {
  return useQuery({
    queryKey: ["adminReports", period],
    queryFn: async () => {
      const res = await fetch(`/api/reports?period=${period}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch reports");
      return res.json();
    },
    staleTime: 0,
  });
};

export default useAdminReports;
