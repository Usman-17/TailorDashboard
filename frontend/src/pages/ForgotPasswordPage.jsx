import { useState } from "react";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";
import { useMutation } from "@tanstack/react-query";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  const { mutate: forgotPasswordMutation, isPending } = useMutation({
    mutationFn: async ({ email }) => {
      try {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (!res.ok)
          throw new Error(data.error || "Request failed. Please try again.");
      } catch (error) {
        throw new Error(error.message);
      }
    },

    onSuccess: () => {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
      toast.success("Email sent successfully!");
      setEmail("");
    },

    onError: (error) => {
      toast.error(error.message || "Invalid email");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    forgotPasswordMutation({ email });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#111127] text-black dark:text-white">
      <div className="w-full max-w-md sm:p-6 p-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Forgot Password</h1>
          <p className="text-base text-gray-500 dark:text-gray-400 px-4 sm:px-8">
            Please enter your email to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Email */}
          <div className="grid">
            <label htmlFor="email" className="text-base font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="m@example.com"
              required
              autoComplete="email"
              className="h-10 px-3 rounded-lg text-sm border-[1.5px] transition-all duration-200 bg-white dark:bg-white text-gray-900 dark:text-gray-900 placeholder-gray-400 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] border-gray-300 hover:border-gray-400 focus:border-[var(--secondary-color)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--secondary-color)_15%,transparent)] focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Submit */}
          <div className="mt-1">
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-full transition cursor-pointer select-none font-medium disabled:opacity-50"
              disabled={isPending}
            >
              {isPending ? (
                <LoadingSpinner content="Sending..." />
              ) : (
                "Send Reset Link"
              )}
            </button>
          </div>
        </form>

        {showAlert && (
          <div
            className="p-4 rounded-lg border border-green-300 bg-green-50 dark:bg-green-900/30 dark:border-green-700 text-green-700 dark:text-green-400 text-xs font-semibold my-3 sm:text-sm"
            role="alert"
          >
            Email sent successfully! Please check your inbox.
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
