import { useState } from "react";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState("");
  const [isShow, setIsShow] = useState(false);

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { token } = useParams();

  const { mutate: resetPasswordMutation, isPending } = useMutation({
    mutationFn: async ({ newPassword }) => {
      const res = await fetch(`/api/auth/reset-password/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Reset password failed. Please try again."
        );
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      toast.success("Password reset successfully.");
      navigate("/login");
    },

    onError: (error) => {
      toast.error(error.message || "An error occurred. Please try again.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    resetPasswordMutation({ newPassword });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#111127] text-black dark:text-white">
      <div className="w-full max-w-md sm:p-6 p-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Reset Password</h1>
          <p className="text-base text-gray-500 dark:text-gray-400 px-4 sm:px-8">
            Enter a new password to access your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Password */}
          <div className="grid">
            <label htmlFor="password" className="text-base font-medium">
              New Password
            </label>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={isShow ? "text" : "password"}
                required
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full h-10 px-3 pr-10 rounded-lg text-sm border-[1.5px] transition-all duration-200 bg-white dark:bg-white text-gray-900 dark:text-gray-900 placeholder-gray-400 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] border-gray-300 hover:border-gray-400 focus:border-[var(--secondary-color)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--secondary-color)_15%,transparent)] focus:outline-none"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              {newPassword && (
                <div
                  role="button"
                  aria-label={isShow ? "Hide password" : "Show password"}
                  tabIndex={0}
                  onClick={() => setIsShow(!isShow)}
                  className="absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 transition"
                >
                  {isShow ? <Eye size={18} /> : <EyeOff size={18} />}
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="mt-1">
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-full transition cursor-pointer select-none font-medium disabled:opacity-50"
              disabled={isPending}
            >
              {isPending ? (
                <LoadingSpinner content="Resetting..." />
              ) : (
                "Reset Password"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
