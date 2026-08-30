import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clearOfflineAuthSession } from "../utils/offlineAuth";
import { runSync } from "../offline/sync/syncManager";

const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate: logoutMutation } = useMutation({
    mutationFn: async () => {
      // 1. If online, flush any pending sync items before clearing session
      if (typeof navigator !== "undefined" && navigator.onLine) {
        try {
          await runSync(true);
        } catch (syncErr) {
          console.warn("Flush sync before logout:", syncErr);
        }
      }

      // 2. Clear offline active auth session
      clearOfflineAuthSession();

      // 3. Inform backend if online
      if (typeof navigator !== "undefined" && navigator.onLine) {
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
