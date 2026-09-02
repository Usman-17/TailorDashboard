import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clearOfflineAuthSession } from "../utils/offlineAuth";
import { runSync } from "../offline/sync/syncManager";

const useLogout = () => {
  const queryClient = useQueryClient();

  const { mutate: logoutMutation } = useMutation({
    mutationFn: async () => {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        try {
          await runSync(true);
        } catch (syncErr) {
          console.warn("Flush sync before logout:", syncErr);
        }
      }

      clearOfflineAuthSession();
      queryClient.setQueryData(["authUser"], null);
      queryClient.clear();

      if (typeof navigator !== "undefined" && navigator.onLine) {
        try {
          await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include",
          });
        } catch (netErr) {
          console.warn("Offline during logout, cleared local session:", netErr);
        }
      }

      return { success: true };
    },

    onSuccess: () => {
      window.location.replace("/login");
    },

    onError: () => {
      window.location.replace("/login");
    },
  });

  return { logoutMutation };
};

export default useLogout;
