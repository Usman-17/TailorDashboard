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

// Lazy load pages
const LoginPage = lazy(() => import("./pages/LoginPage"));

const App = () => {
  const { data: authUser, isLoading } = useGetAuth();

  if (isLoading && !authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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
          <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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
              path="/order/add"
              element={authUser ? <AddOrdersPage /> : <Navigate to="/login" />}
            />

            <Route
              path="/order/add/:id"
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
