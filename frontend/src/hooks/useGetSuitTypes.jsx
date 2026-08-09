import { useQuery } from "@tanstack/react-query";

export const useGetAllSuitTypes = () => {
  return useQuery({
    queryKey: ["suitTypes"],
    queryFn: async () => {
      const res = await fetch("/api/suit-types/all", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch suit types");
      return res.json();
    },
  });
};

export default useGetAllSuitTypes;
