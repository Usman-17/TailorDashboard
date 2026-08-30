import { useQuery } from "@tanstack/react-query";
import useGetAuth from "./useGetAuth";
import * as suitTypeRepo from "../offline/repos/suitTypeRepo";

export const useGetAllSuitTypes = () => {
  const { data: authUser } = useGetAuth();
  const shopId = authUser?.shop?._id || authUser?.shop;

  return useQuery({
    queryKey: ["suitTypes"],
    queryFn: async () => {
      if (!shopId) return { suitTypes: [] };

      if (navigator.onLine) {
        try {
          const res = await fetch("/api/suit-types/all", {
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            const serverSuitTypes = data.suitTypes || [];

            for (const s of serverSuitTypes) {
              await suitTypeRepo.upsertFromServer(shopId, s);
            }

            const allLocal = await suitTypeRepo.getAll(shopId);
            return {
              suitTypes: allLocal
                .filter((s) => !s.isDeleted)
                .sort(
                  (a, b) =>
                    new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
                )
                .map((s) => ({
                  ...s,
                  _id: s.serverId || s.localId,
                })),
            };
          }
        } catch (err) {
          console.warn("[useGetAllSuitTypes] Online fetch failed:", err);
        }
      }

      const local = await suitTypeRepo.getAll(shopId);
      return {
        suitTypes: local
          .filter((s) => !s.isDeleted)
          .sort(
            (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
          )
          .map((s) => ({
            ...s,
            _id: s.serverId || s.localId,
          })),
      };
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    enabled: !!shopId,
  });
};

export default useGetAllSuitTypes;
