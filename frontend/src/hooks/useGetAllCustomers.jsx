import { useQuery } from "@tanstack/react-query";

const useGetAllCustomers = ({ page = 1, limit = 10, search = "" } = {}) => {
  return useQuery({
    queryKey: ["customers", page, limit, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.append("search", search);

      const res = await fetch(`/api/customers/all?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch customers");
      return res.json();
    },
    staleTime: 30000,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};

export { useGetAllCustomers };
export default useGetAllCustomers;
