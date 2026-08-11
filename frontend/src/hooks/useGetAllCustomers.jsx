import { useQuery } from "@tanstack/react-query";

export const useGetAllCustomers = (search = "") => {
  return useQuery({
    queryKey: ["customers", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/customers/all?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch customers");
      return res.json();
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};

export default useGetAllCustomers;
