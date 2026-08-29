import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clearOfflineAuthSession } from "../utils/offlineAuth";
import * as customerRepo from "../offline/repos/customerRepo";
import * as measurementRepo from "../offline/repos/measurementRepo";
import * as orderRepo from "../offline/repos/orderRepo";
import { clearSyncQueue } from "../offline/db/syncQueue";
import { resetInitialSync } from "../offline/sync/syncManager";

const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate: logoutMutation } = useMutation({
    mutationFn: async () => {
      const authUser = queryClient.getQueryData(["authUser"]);
      const shopId = authUser?.shop?._id || authUser?.shop;

      if (shopId) {
        await Promise.all([
          customerRepo.clearAll(shopId),
          measurementRepo.clearAll(shopId),
          orderRepo.clearAll(shopId),
          clearSyncQueue(shopId),
        ]);
        resetInitialSync(shopId);
      }

      clearOfflineAuthSession();

      if (navigator.onLine) {
        try {
          const res = await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include",
          });
          const data = await res.json();
          if (!res.ok) {
            console.warn("Server logout response:", data);
          }
          return data;
        } catch (netErr) {
          console.warn("Offline during logout, cleared local session:", netErr);
        }
      }
      return { success: true };
    },

    onSuccess: () => {
      queryClient.setQueryData(["authUser"], null);
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      toast.success("Logged out successfully");
      navigate("/login");
    },

    onError: (error) => {
      console.error("Logout error:", error);
      queryClient.setQueryData(["authUser"], null);
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      navigate("/login");
    },
  });

  return { logoutMutation };
};

export default useLogout;
