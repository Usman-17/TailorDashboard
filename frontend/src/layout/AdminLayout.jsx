import { Loader } from "lucide-react";
import { Outlet, Navigate } from "react-router-dom";

import Header from "./Header";
import Backdrop from "./Backdrop";
import AdminSidebar from "./AdminSidebar";

import useGetAuth from "../hooks/useGetAuth";

import { SidebarProvider, useSidebar } from "../context/SidebarContext";
// Imports End----

const AdminLayoutContent = () => {
  const { isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen xl:flex">
      <div>
        <AdminSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 min-w-0 transition-all duration-300 ease-in-out lg:ml-[230px] ${isMobileOpen ? "ml-0" : ""}`}
      >
        <Header />
        <div className="p-2 mx-auto max-w-(--breakpoint-2xl) md:p-4 overflow-x-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AdminLayout = () => {
  const { data: authUser, isLoading } = useGetAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!authUser) return <Navigate to="/login" replace />;
  if (authUser.role !== "super_admin") return <Navigate to="/" replace />;

  return (
    <SidebarProvider>
      <AdminLayoutContent />
    </SidebarProvider>
  );
};

export default AdminLayout;
