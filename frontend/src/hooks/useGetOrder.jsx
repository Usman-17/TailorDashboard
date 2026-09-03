import { useQuery } from "@tanstack/react-query";
import * as orderRepo from "../offline/repos/orderRepo";
import * as customerRepo from "../offline/repos/customerRepo";
import useGetAuth from "./useGetAuth";

const useGetOrder = (orderId) => {
  const { data: authUser } = useGetAuth();
  const shopId = authUser?.shop?._id || authUser?.shop;

  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) return null;

      if (navigator.onLine) {
        try {
          const response = await fetch(`/api/orders/${orderId}`);
          if (response.ok) return response.json();
        } catch {
          // fallback to local
        }
      }

      if (shopId) {
        let localOrder = await orderRepo.getByServerId(shopId, String(orderId));
        if (!localOrder) localOrder = await orderRepo.getById(shopId, String(orderId));
        if (localOrder) {
          let customer = null;
          const custId = localOrder.customerId || localOrder.customerLocalId;
          if (custId) {
            customer = await customerRepo.getByServerId(shopId, String(custId));
            if (!customer) customer = await customerRepo.getById(shopId, String(custId));
          }
          return {
            ...localOrder,
            _id: localOrder.serverId || localOrder.localId,
            customer: customer
              ? { _id: customer.serverId || customer.localId, name: customer.name, phone: customer.phone }
              : localOrder.customerName
                ? { _id: custId || localOrder.localId, name: localOrder.customerName }
                : { _id: custId || "unknown", name: "Unknown" },
            items: localOrder.items || [],
          };
        }
      }

      return null;
    },
    enabled: !!orderId,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  return { order: order ?? null, isLoading, isError, error, refetch };
};

export { useGetOrder };
