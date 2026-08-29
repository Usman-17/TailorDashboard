import toast from "react-hot-toast";
import { Eye, EyeOff, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import LoadingSpinner from "../components/LoadingSpinner";
import {
  saveOfflineAuthSession,
  verifyOfflineCredentials,
} from "../utils/offlineAuth";

const LoginPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isShow, setIsShow] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const savedLogin = localStorage.getItem("rememberedEmail");
    const savedPassword = localStorage.getItem("rememberedPassword");
    if (savedLogin) {
      setIdentifier(savedLogin);
      if (savedPassword) setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const validate = () => {
    const newErrors = {};
    const trimmed = identifier.trim();
    if (!trimmed) {
      newErrors.email = "Email or phone is required";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) &&
      !/^\d{11}$/.test(trimmed.replace(/\s/g, ""))
    ) {
      newErrors.email = "Enter a valid email or 11-digit phone number";
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
    mutationFn: async ({ identifier, password, rememberMe }) => {
      // ─── Scenario A: Browser is explicitly Offline ──────────────────────────
      if (!navigator.onLine) {
        const offlineResult = await verifyOfflineCredentials(
          identifier,
          password,
        );
        if (!offlineResult.success) {
          throw new Error(
            offlineResult.message || "Invalid email/phone or password",
          );
        }
        return {
          user: offlineResult.user,
          isOfflineLogin: true,
        };
      }

      // ─── Scenario B: Browser appears Online ─────────────────────────────────
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: identifier, password, rememberMe }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Explicit server credential / account errors (DO NOT fallback to offline login)
        if (!res.ok) {
          let errorMsg = "Login failed. Please try again.";
          try {
            const data = await res.json();
            errorMsg = data.error || errorMsg;
          } catch (_) {}
          throw new Error(errorMsg);
        }

        const data = await res.json();

        // Save local cryptographic verifier for future offline logins
        await saveOfflineAuthSession(data.user, password);

        return {
          user: data.user,
          isOfflineLogin: false,
        };
      } catch (networkOrServerError) {
        const msg = networkOrServerError.message || "";
        const isAuthError =
          msg.includes("Invalid") ||
          msg.includes("deactivated") ||
          msg.includes("locked") ||
          msg.includes("Password") ||
          msg.includes("Email");

        if (isAuthError) {
          throw networkOrServerError;
        }

        // ─── Scenario C: Network / Server Unreachable -> Try Offline Auth ─────
        const offlineResult = await verifyOfflineCredentials(
          identifier,
          password,
        );
        if (offlineResult.success) {
          return {
            user: offlineResult.user,
            isOfflineLogin: true,
          };
        }

        if (navigator.onLine) {
          throw new Error(
            "Server is unreachable. Please check your connection and try again.",
          );
        }

        throw new Error(
          offlineResult.message ||
            "Unable to connect to server and no valid offline session found.",
        );
      }
    },

    onSuccess: (data) => {
      queryClient.setQueryData(["authUser"], data.user);
      queryClient.invalidateQueries({ queryKey: ["authUser"] });

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", identifier);
        localStorage.setItem("rememberedPassword", password);
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberedPassword");
      }

      if (data.isOfflineLogin) {
        toast.success("Signed in offline successfully");
      } else {
        toast.success("Login successful!");
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
        toast.error(error.message || "Invalid email/phone or password");
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    loginMutation({ identifier, password, rememberMe });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#111127] text-black dark:text-white">
      <div className="w-full max-w-md sm:p-6 p-4">
        {!navigator.onLine && (
          <div className="mb-4 flex items-center gap-2 px-3.5 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-600 dark:text-amber-400 text-xs">
            <WifiOff size={15} />
            <span>
              You are offline. You can sign in using previously authenticated
              credentials on this device.
            </span>
          </div>
        )}

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-base text-gray-500 dark:text-gray-400 px-4 sm:px-8">
            Sign in to your account to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          {/* Email / Phone */}
          <div className="grid">
            <label htmlFor="identifier" className="text-base font-medium">
              Login ID
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              placeholder="m@example.com or 03001234567"
              autoComplete="username"
              className={`h-10 px-3 rounded-lg text-sm border-[1.5px] transition-all duration-200 bg-white dark:bg-white text-gray-900 dark:text-gray-900 placeholder-gray-400 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] focus:outline-none ${
                errors.email
                  ? "border-red-400 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]"
                  : "border-gray-300 hover:border-gray-400 focus:border-[var(--secondary-color)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--secondary-color)_15%,transparent)]"
              }`}
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
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
