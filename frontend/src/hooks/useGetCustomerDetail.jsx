import { useQuery } from "@tanstack/react-query";
import useGetAuth from "./useGetAuth";
import * as customerRepo from "../offline/repos/customerRepo";
import * as measurementRepo from "../offline/repos/measurementRepo";
import * as orderRepo from "../offline/repos/orderRepo";

const useGetCustomerDetail = (customerId) => {
  const { data: authUser } = useGetAuth();
  const shopId = authUser?.shop?._id || authUser?.shop;

  return useQuery({
    queryKey: ["customerDetail", customerId],
    queryFn: async () => {
      if (navigator.onLine) {
        try {
          const res = await fetch(`/api/customers/${customerId}/detail`, {
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            if (shopId && data.customer) {
              await customerRepo.upsertFromServer(shopId, data.customer);
              if (data.measurements) {
                for (const m of data.measurements) {
                  await measurementRepo.upsertFromServer(shopId, m);
                }
              }
              if (data.orders) {
                for (const o of data.orders) {
                  await orderRepo.upsertFromServer(shopId, o);
                }
              }
            }
            return data;
          }
        } catch (err) {
          console.warn("[useGetCustomerDetail] Online fetch failed:", err);
        }
      }

      const customer =
        (await customerRepo.getByServerId(shopId, customerId)) ||
        (await customerRepo.getById(shopId, customerId));

      const allMeasurements = await measurementRepo.getAll(shopId);
      const customerMeasurements = allMeasurements.filter(
        (m) =>
          m.customerId === customerId ||
          m.customerLocalId === customer?.localId,
      );

      const allOrders = await orderRepo.getAll(shopId);
      const customerOrders = allOrders.filter(
        (o) =>
          (o.customerId === customerId ||
            o.customerLocalId === customer?.localId) &&
          !o.isDeleted,
      );

      return {
        customer: customer
          ? { ...customer, _id: customer.serverId || customer.localId }
          : null,
        orders: customerOrders.map((o) => ({
          ...o,
          _id: o.serverId || o.localId,
          customer: o.customerId || o.customerLocalId,
        })),
        payments: [],
        measurements: customerMeasurements.map((m) => ({
          ...m,
          _id: m.serverId || m.localId,
          customer: m.customerId || m.customerLocalId,
        })),
      };
    },
    enabled: Boolean(customerId),
    staleTime: 0,
    refetchOnMount: true,
  });
};

export default useGetCustomerDetail;
