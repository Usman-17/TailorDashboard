import { useQuery } from "@tanstack/react-query";

const useGetCustomerDetail = (customerId) => {
  return useQuery({
    queryKey: ["customerDetail", customerId],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${customerId}/detail`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch customer details");
      return res.json();
    },
    enabled: Boolean(customerId),
    staleTime: 0,
    refetchOnMount: true,
  });
};

export default useGetCustomerDetail;
