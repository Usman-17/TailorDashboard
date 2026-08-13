import toast from "react-hot-toast";
import { LogOut } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
// Imports End-----

const ImpersonationBanner = ({ shopName, impersonatorName }) => {
  const queryClient = useQueryClient();

  const { mutate: stopImpersonation, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/stop-impersonation", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to stop impersonation");
      return data;
    },
    onSuccess: () => {
      toast.success("Impersonation ended");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      window.location.href = "/admin/shops";
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="bg-orange-500 text-white px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className="font-medium">Viewing as: {shopName}</span>
        {impersonatorName && (
          <span className="text-orange-200">(Admin: {impersonatorName})</span>
        )}
      </div>
      <button
        onClick={() => stopImpersonation()}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition cursor-pointer disabled:opacity-50"
      >
        <LogOut size={14} />
        {isPending ? "Exiting..." : "Exit"}
      </button>
    </div>
  );
};

export default ImpersonationBanner;
