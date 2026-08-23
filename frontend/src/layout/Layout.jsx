import { Loader } from "lucide-react";
import { Outlet, Navigate } from "react-router-dom";

import useGetAuth from "../hooks/useGetAuth";
import Header from "./Header";
import Sidebar from "./TailorSidebar";
import Backdrop from "./Backdrop";
import MobileBottomBar from "./MobileBottomBar";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";

const TailorLayoutContent = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen xl:flex">
      <div className="hidden lg:block">
        <Sidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[220px]" : "lg:ml-[68px]"
        }`}
      >
        <Header />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-5 overflow-x-hidden pb-20 md:pb-5">
          <Outlet />
        </div>
      </div>
      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomBar />
    </div>
  );
};

const TailorLayout = () => {
  const { data: authUser, isLoading } = useGetAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!authUser) return <Navigate to="/login" replace />;
  if (authUser.role === "super_admin") return <Navigate to="/admin" replace />;

  return (
    <SidebarProvider>
      <TailorLayoutContent />
    </SidebarProvider>
  );
};

export default TailorLayout;
