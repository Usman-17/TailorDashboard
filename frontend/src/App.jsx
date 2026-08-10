import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import "react-loading-skeleton/dist/skeleton.css";

import useGetAuth from "./hooks/useGetAuth";

import ProtectedRoute from "./components/ProtectedRoute";

import AdminLayout from "./layout/AdminLayout";
import TailorLayout from "./layout/Layout";

import DashboardPage from "./pages/DashboardPage";
import CustomersPage from "./pages/Tailor/CustomersPage/CustomersPage";
import OrdersPage from "./pages/Tailor/OrdersPage/OrdersPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SuitTypesPage from "./pages/Tailor/SuitTypesPage";
import PaymentsPage from "./pages/Tailor/PaymentsPage/PaymentsPage";
import ExpensesPage from "./pages/Tailor/ExpensesPage/ExpensesPage";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const AdminDashboardPage = lazy(() => import("./pages/Admin/DashboardPage"));
const ShopPage = lazy(() => import("./pages/Admin/ShopPage/ShopPage"));
const ManageUsersPage = lazy(() => import("./pages/Admin/ManageUsersPage"));
const SettingsPage = lazy(() => import("./pages/Admin/SettingsPage"));
const ReportsPage = lazy(() => import("./pages/Admin/ReportsPage"));
// Imports End-----

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App = () => {
  const { data: authUser, isLoading } = useGetAuth();

  if (isLoading && !authUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen">
            <Loader className="size-10 animate-spin text-gray-400" />
          </div>
        }
      >
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={!authUser ? <LoginPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/forgot-password"
            element={
              !authUser ? <ForgotPasswordPage /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              !authUser ? <ResetPasswordPage /> : <Navigate to="/" replace />
            }
          />

          {/* Super Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["super_admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="shops" element={<ShopPage />} />
            <Route path="users" element={<ManageUsersPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Tailor (Owner/Staff) routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={["owner", "staff"]}>
                <TailorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="suit-types" element={<SuitTypesPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
          </Route>

          {/* Catch all */}
          <Route
            path="*"
            element={
              <Navigate
                to={
                  authUser
                    ? authUser.role === "super_admin"
                      ? "/admin"
                      : "/"
                    : "/login"
                }
                replace
              />
            }
          />
        </Routes>
      </Suspense>

      <Toaster
        position="bottom-center"
        containerStyle={{ zIndex: 9999999 }}
        toastOptions={{
          style: {
            background: "#363636",
            color: "#fffbfb",
            fontFamily: "Outfit, sans-serif",
            fontSize: "14px",
            padding: "8px 16px",
          },
        }}
      />
    </BrowserRouter>
  );
};

export default App;
