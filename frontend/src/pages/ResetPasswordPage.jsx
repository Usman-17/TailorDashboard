import { useState } from "react";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
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

  const togglePassword = () => setIsShow(!isShow);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black">
      <div className="w-full max-w-md sm:p-6 p-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Reset Password</h1>
          <p className="text-base text-gray-500 px-4 sm:px-8">
            Enter a new password to access your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Password */}
          <div className="grid">
            <label htmlFor="password" className="text-base font-medium">
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={isShow ? "text" : "password"}
                required
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full border border-gray-300 px-2 py-2 rounded text-black"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              {newPassword && (
                <div
                  role="button"
                  aria-label={isShow ? "Hide password" : "Show password"}
                  tabIndex={0}
                  onClick={togglePassword}
                  className="absolute top-1/2 right-4 transform -translate-y-1/2 cursor-pointer text-black"
                >
                  {isShow ? <Eye size={18} /> : <EyeOff size={18} />}
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="mt-3">
            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded hover:bg-gray-900 transition cursor-pointer select-none"
              disabled={isPending}
            >
              {isPending ? (
                <LoadingSpinner content="Submitting..." />
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
