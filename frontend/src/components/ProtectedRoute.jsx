import { Navigate } from "react-router-dom";
import useGetAuth from "../hooks/useGetAuth";
import { Loader } from "lucide-react";

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

  if (allowedRoles && !allowedRoles.includes(authUser.role)) {
    const redirectPath =
      authUser.role === "super_admin" ? "/admin" : "/";
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
