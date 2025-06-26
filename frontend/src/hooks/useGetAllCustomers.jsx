import { useQuery } from "@tanstack/react-query";

const useGetAllCustomers = () => {
  const {
    data: customers,
    isLoading,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers/all");

      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      return response.json();
    },

    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  return {
    customers,
    isLoading,
    isPending,
    isError,
    error,
  };
};

export { useGetAllCustomers };
