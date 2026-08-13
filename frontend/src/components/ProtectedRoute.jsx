import { Loader } from "lucide-react";
import { Navigate } from "react-router-dom";

import useGetAuth from "../hooks/useGetAuth";
// Imports End-----
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { data: authUser, isLoading } = useGetAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!authUser) {
    return <Navigate to="/login" replace />;
  }

  // When impersonating, super_admin can access owner/staff routes
  const effectiveRole = authUser.isImpersonating ? "owner" : authUser.role;

  if (allowedRoles && !allowedRoles.includes(effectiveRole)) {
    const redirectPath =
      authUser.role === "super_admin" && !authUser.isImpersonating
        ? "/admin"
        : "/";
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
