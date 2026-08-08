import { useState, useRef, useEffect } from "react";
import {
  X,
  UserRound,
  LogOut,
  Shield,
  Store,
  ChevronDown,
  KeyRound,
  Menu,
} from "lucide-react";

import useLogout from "../hooks/useLogout";
import useGetAuth from "../hooks/useGetAuth";

import { useSidebar } from "../context/SidebarContext";
import ChangePasswordModal from "../components/ChangePasswordModal";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../context/ThemeContext";

const ROLE_LABELS = {
  super_admin: "Super Admin",
  owner: "Owner",
  staff: "Staff",
};

const ROLE_COLORS = {
  super_admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  owner: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  staff: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

const Header = () => {
  const { logoutMutation } = useLogout();
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { data: authUser } = useGetAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  return (
    <>
      <header className={`sticky top-0 flex items-center justify-between w-full h-14 sm:h-16 bg-white dark:bg-[#141025] px-3 sm:px-4 z-40 transition-all duration-200 ${scrolled ? "border-b border-gray-100 dark:border-gray-800/60 shadow-sm dark:shadow-[0_1px_12px_rgba(0,0,0,0.3)]" : "border-b border-transparent"}`}>
        <button
          onClick={handleToggle}
          className="flex items-center justify-center w-10 h-10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
          aria-label="Toggle Sidebar"
        >
          {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <UserRound size={18} className="text-gray-600 dark:text-gray-300" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">
                  {authUser?.fullName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                  {authUser?.email}
                </p>
              </div>
              <ChevronDown
                size={16}
                className={`hidden sm:block text-gray-400 dark:text-gray-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1a162e] rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 py-2 z-50 transition-colors">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <UserRound size={20} className="text-gray-600 dark:text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {authUser?.fullName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{authUser?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      toggleTheme();
                    }}
                    className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-3">
                      <ThemeToggle className="p-0 border-0 bg-transparent hover:bg-transparent shadow-none" />
                      Theme Mode
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 capitalize">
                      {isDarkMode ? "Dark" : "Light"}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setPasswordModalOpen(true);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors cursor-pointer"
                  >
                    <KeyRound size={16} />
                    Change Password
                  </button>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logoutMutation();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </>
  );
};

export default Header;
