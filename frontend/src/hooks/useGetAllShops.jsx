import moment from "moment";
import { useQuery } from "@tanstack/react-query";

const fetchShops = async () => {
  const res = await fetch(`/api/shops/all`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch shops");
  return res.json();
};

const useGetAllShops = () => {
  return useQuery({
    queryKey: ["shops"],
    queryFn: fetchShops,

    select: (data) =>
      (data?.shops || []).map((shop) => ({
        _id: shop._id,
        name: shop.name,
        email: shop.email,
        phone: shop.phone,
        owner: shop.owner?.fullName || "N/A",
        subscriptionPlan: shop.subscriptionPlan,
        subscriptionAmount: shop.subscriptionAmount || 0,
        isActive: shop.isActive,
        city: shop.address?.city || "-",
        createdAt: moment(shop.createdAt).format("DD MMM YYYY"),
      })),
  });
};

export default useGetAllShops;
