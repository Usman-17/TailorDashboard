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
    <div className="min-h-screen flex items-center justify-center bg-white text-black">
      <div className="w-full max-w-md sm:p-6 p-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Forgot Password</h1>
          <p className="text-base text-gray-500 px-4 sm:px-8">
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
              className="border border-gray-300 px-2 py-2 rounded text-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
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

        {showAlert && (
          <div
            className="p-4 rounded border border-green-300 bg-green-50 text-gray-700 text-xs font-semibold my-3 sm:text-sm"
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
