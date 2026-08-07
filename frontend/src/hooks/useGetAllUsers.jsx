import { useQuery } from "@tanstack/react-query";

const fetchUsers = async () => {
  const res = await fetch("/api/auth/admin/users", {
    credentials: "include",
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Failed to fetch users");
  return result;
};

const useGetAllUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    select: (data) =>
      (data || []).map((user, index) => ({
        _id: user._id,
        sr: index + 1,
        fullName: user.fullName || "-",
        email: user.email || "-",
        mobile: user.mobile || "-",
        role: user.role,
        shop: user.shop?.name || "-",
        isActive: user.isActive,
      })),
  });
};

export default useGetAllUsers;
