import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import useGetAuth from "./hooks/useGetAuth";
import "react-loading-skeleton/dist/skeleton.css";
import { lazy, Suspense, useEffect } from "react";

import AdminLayout from "./layout/AdminLayout";
import TailorLayout from "./layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { Loader } from "lucide-react";

import DashboardPage from "./pages/DashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AddCustomerPage from "./pages/AddCustomerPage";
import CustomerListingPage from "./pages/CustomerListingPage";
import AddMeasurementPage from "./pages/AddMeasurementPage";
import MeasurementPage from "./pages/MeasurementPage";
import AddOrdersPage from "./pages/AddOrdersPage";
import OrdersListingPage from "./pages/OrdersListingPage";
import SalePage from "./pages/SalePage";
import AddExpensesPage from "./pages/addExpensesPage";
import ExpensesListingPage from "./pages/ExpensesListingPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const ShopListingPage = lazy(() => import("./pages/ShopListingPage"));
const ShopFormPage = lazy(() => import("./pages/ShopFormPage"));
const ManageUsersPage = lazy(() => import("./pages/ManageUsersPage"));
const AdminSettingsPage = lazy(() => import("./pages/AdminSettingsPage"));

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
            <Route path="shops" element={<ShopListingPage />} />
            <Route path="shops/create" element={<ShopFormPage />} />
            <Route path="shops/edit/:id" element={<ShopFormPage />} />
            <Route path="users" element={<ManageUsersPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
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
            <Route path="customer/add" element={<AddCustomerPage />} />
            <Route path="customer/edit/:id" element={<AddCustomerPage />} />
            <Route path="customer/manage" element={<CustomerListingPage />} />
            <Route
              path="measurements/add/:customerId"
              element={<AddMeasurementPage />}
            />
            <Route
              path="measurements/edit/:customerId"
              element={<AddMeasurementPage />}
            />
            <Route
              path="measurements/:customerId"
              element={<MeasurementPage />}
            />
            <Route path="orders/add" element={<AddOrdersPage />} />
            <Route path="orders/manage" element={<OrdersListingPage />} />
            <Route path="sale" element={<SalePage />} />
            <Route path="expenses/add" element={<AddExpensesPage />} />
            <Route path="expenses/edit/:id" element={<AddExpensesPage />} />
            <Route path="expenses/manage" element={<ExpensesListingPage />} />
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
