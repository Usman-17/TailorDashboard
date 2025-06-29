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

import Layout from "./layout/Layout";
import DashboardPage from "./pages/DashboardPage";
import AddCustomerPage from "./pages/AddCustomerPage";
import CustomerListingPage from "./pages/CustomerListingPage";
import AddMeasurementPage from "./pages/AddMeasurementPage";
import MeasurementPage from "./pages/MeasurementPage";
import AddOrdersPage from "./pages/AddOrdersPage";
import OrdersListingPage from "./pages/OrdersListingPage";
import SalePage from "./pages/SalePage";
import AddExpensesPage from "./pages/addExpensesPage";
import ExpensesListingPage from "./pages/ExpensesListingPage";
import { Loader } from "lucide-react";

// Lazy load pages
const LoginPage = lazy(() => import("./pages/LoginPage"));

const App = () => {
  const { data: authUser, isLoading } = useGetAuth();

  if (isLoading && !authUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
      window.scrollTo(0, 0);
    }, [pathname]);

    return null;
  };

  return (
    <BrowserRouter>
      <ScrollToTop />

      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen">
            <Loader className="size-10 animate-spin" />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={authUser ? <Layout /> : <LoginPage />}>
            <Route
              index
              element={authUser ? <DashboardPage /> : <LoginPage />}
            />

            {/* Customers Routes */}
            <Route
              path="/customer/add"
              element={
                authUser ? <AddCustomerPage /> : <Navigate to="/login" />
              }
            />
            <Route
              path="customer/edit/:id"
              element={
                authUser ? <AddCustomerPage /> : <Navigate to="/login" />
              }
            />
            <Route
              path="customer/manage"
              element={
                authUser ? <CustomerListingPage /> : <Navigate to="/login" />
              }
            />

            {/* Measurements Routes */}
            <Route
              path="/measurements/add/:customerId"
              element={
                authUser ? <AddMeasurementPage /> : <Navigate to="/login" />
              }
            />
            <Route
              path="measurements/edit/:customerId"
              element={
                authUser ? <AddMeasurementPage /> : <Navigate to="/login" />
              }
            />

            <Route
              path="measurements/:customerId"
              element={
                authUser ? <MeasurementPage /> : <Navigate to="/login" />
              }
            />

            {/* Orders Routes */}
            <Route
              path="/orders/add"
              element={authUser ? <AddOrdersPage /> : <Navigate to="/login" />}
            />

            <Route
              path="/orders/manage"
              element={
                authUser ? <OrdersListingPage /> : <Navigate to="/login" />
              }
            />

            <Route
              path="/sale"
              element={authUser ? <SalePage /> : <Navigate to="/login" />}
            />

            {/* Expenses Routes */}
            <Route
              path="/expenses/add"
              element={
                authUser ? <AddExpensesPage /> : <Navigate to="/login" />
              }
            />

            <Route
              path="/expenses/edit/:id"
              element={
                authUser ? <AddExpensesPage /> : <Navigate to="/login" />
              }
            />
            <Route
              path="/expenses/manage"
              element={
                authUser ? <ExpensesListingPage /> : <Navigate to="/login" />
              }
            />
          </Route>

          <Route
            path="/login"
            element={!authUser ? <LoginPage /> : <Navigate to="/" />}
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
