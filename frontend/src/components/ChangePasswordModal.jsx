import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { X, ArrowLeft, Lock,  Shield } from "lucide-react";
// Imports End----

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${window.scrollY}px`;
      document.body.style.width = "100%";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, parseInt(scrollY || "0") * -1);
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
    };
  }, [isOpen]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      const res = await fetch("/api/auth/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to change password");
      return result;
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setErrors({});
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const validate = () => {
    const errs = {};
    if (!form.currentPassword) errs.currentPassword = "Required";
    if (!form.newPassword) errs.newPassword = "Required";
    else if (form.newPassword.length < 8) errs.newPassword = "Min 8 characters";
    if (form.newPassword !== form.confirmPassword)
      errs.confirmPassword = "Passwords don't match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate(form);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleClose = () => {
    setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  const inputClass = (field) =>
    `w-full h-12 border px-4 rounded-xl text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#1a162e] placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
      errors[field]
        ? "border-red-500 dark:border-red-500"
        : "border-gray-200 dark:border-gray-700"
    }`;

  return (
    <>
      <div
        className="fixed inset-0 z-[99999] flex flex-col bg-gray-50 dark:bg-[#0f0d1b] sm:hidden"
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Purple Header */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 px-4 pt-3 pb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleClose}
              className="p-2 -ml-2 rounded-full hover:bg-white/10 cursor-pointer transition-colors"
            >
              <ArrowLeft size={22} className="text-white" />
            </button>
            <h1 className="text-lg font-bold text-white">Change Password</h1>
            <button
              onClick={handleClose}
              className="p-2 -mr-2 rounded-full hover:bg-white/10 cursor-pointer transition-colors"
            >
              <X size={22} className="text-white" />
            </button>
          </div>

          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <Lock size={28} className="text-white" />
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="flex-1 overflow-y-auto px-4 -mt-3">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Enter your current and new password below.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords ? "text" : "password"}
                    name="currentPassword"
                    value={form.currentPassword}
                    onChange={handleChange}
                    placeholder="Enter current password"
                    className={inputClass("currentPassword")}
                  />
                </div>
                {errors.currentPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.currentPassword}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords ? "text" : "password"}
                    name="newPassword"
                    value={form.newPassword}
                    onChange={handleChange}
                    placeholder="Min 8 characters"
                    className={inputClass("newPassword")}
                  />
                </div>
                {errors.newPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.newPassword}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords ? "text" : "password"}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter new password"
                    className={inputClass("confirmPassword")}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Show Passwords */}
              <label className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showPasswords}
                  onChange={(e) => setShowPasswords(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-purple-600 focus:ring-purple-500"
                />
                Show passwords
              </label>
            </form>
          </div>

          {/* Security Note */}
          <div className="flex items-start gap-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mt-4 border border-purple-100 dark:border-purple-800/30">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0 mt-0.5">
              <Shield
                size={16}
                className="text-purple-600 dark:text-purple-400"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                Your account is protected
              </p>
              <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-0.5">
                We never share your password with anyone. All changes are
                encrypted and secure.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="px-4 pb-6 pt-3 bg-gray-50 dark:bg-[#0f0d1b]">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="w-full h-12 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 cursor-pointer transition-colors flex items-center justify-center gap-2"
          >
            <Lock size={16} />
            {mutation.isPending ? "Saving..." : "Save Password"}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="w-full h-12 mt-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Desktop Modal */}
      <div className="hidden sm:flex fixed inset-0 z-[99999] items-center justify-center">
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/60"
          onClick={handleClose}
        />
        <div className="relative bg-white dark:bg-[#1a162e] rounded-2xl shadow-xl w-full max-w-md mx-4 border border-gray-100 dark:border-gray-800">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
          >
            <X className="size-5 text-gray-500 dark:text-gray-400" />
          </button>

          <div className="p-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Lock
                  size={20}
                  className="text-purple-600 dark:text-purple-400"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Change Password
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enter your current and new password below.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Current Password
                </label>
                <input
                  type={showPasswords ? "text" : "password"}
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter current password"
                  className={inputClass("currentPassword")}
                />
                {errors.currentPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.currentPassword}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  New Password
                </label>
                <input
                  type={showPasswords ? "text" : "password"}
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="Min 8 characters"
                  className={inputClass("newPassword")}
                />
                {errors.newPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.newPassword}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type={showPasswords ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter new password"
                  className={inputClass("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showPasswords}
                  onChange={(e) => setShowPasswords(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-700 text-purple-600 focus:ring-purple-500"
                />
                Show passwords
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="flex-1 px-4 py-2.5 bg-purple-600 dark:bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-700 dark:hover:bg-purple-600 disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {mutation.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChangePasswordModal;
