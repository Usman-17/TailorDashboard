import { useQuery } from "@tanstack/react-query";

export const useGetAllCustomers = () => {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await fetch("/api/customers/all", {
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
