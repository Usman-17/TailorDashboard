import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import LoadingSpinner from "../components/LoadingSpinner";

const LoginPage = () => {
  const [isShow, setIsShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedPassword = localStorage.getItem("rememberedPassword");
    if (savedEmail) {
      setEmail(savedEmail);
      if (savedPassword) setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { mutate: loginMutation, isPending } = useMutation({
    mutationFn: async ({ email, password, rememberMe }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed. Please try again.");
      }

      return data;
    },

    onSuccess: (data) => {
      queryClient.setQueryData(["authUser"], data.user);
      queryClient.invalidateQueries({ queryKey: ["authUser"] });

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
        localStorage.setItem("rememberedPassword", password);
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberedPassword");
      }

      const role = data.user.role;
      if (role === "super_admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    },

    onError: (error) => {
      if (error.message.includes("locked")) {
        toast.error(error.message);
      } else {
        toast.error(error.message || "Invalid email or password");
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    loginMutation({ email, password, rememberMe });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#111127] text-black dark:text-white">
      <div className="w-full max-w-md sm:p-6 p-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-base text-gray-500 dark:text-gray-400 px-4 sm:px-8">
            Sign in to your account to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
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
              autoComplete="email"
              className={`h-10 px-3 rounded-lg text-sm border-[1.5px] transition-all duration-200 bg-white dark:bg-white text-gray-900 dark:text-gray-900 placeholder-gray-400 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] focus:outline-none ${
                errors.email
                  ? "border-red-400 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]"
                  : "border-gray-300 hover:border-gray-400 focus:border-[var(--secondary-color)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--secondary-color)_15%,transparent)]"
              }`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: "" });
              }}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="grid">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-base font-medium">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="ml-auto inline-block text-sm font-semibold hover:text-purple-700 dark:hover:text-purple-400 hover:underline transition duration-75 ease-in-out"
              >
                Forgot password?
              </Link>
            </div>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={isShow ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                className={`w-full h-10 px-3 pr-10 rounded-lg text-sm border-[1.5px] transition-all duration-200 bg-white dark:bg-white text-gray-900 dark:text-gray-900 placeholder-gray-400 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] focus:outline-none ${
                  errors.password
                    ? "border-red-400 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]"
                    : "border-gray-300 hover:border-gray-400 focus:border-[var(--secondary-color)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--secondary-color)_15%,transparent)]"
                }`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: "" });
                }}
              />

              {password && (
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
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center gap-2">
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-purple-600 accent-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <label
              htmlFor="rememberMe"
              className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none"
            >
              Remember me
            </label>
          </div>

          {/* Submit */}
          <div className="mt-1">
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-full transition cursor-pointer select-none font-medium disabled:opacity-50"
              disabled={isPending}
            >
              {isPending ? (
                <LoadingSpinner content="Signing in..." />
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
