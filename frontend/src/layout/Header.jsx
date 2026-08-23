import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { LogOut, ChevronDown, KeyRound, Menu, Sun, Moon, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import useLogout from "../hooks/useLogout";
import useGetAuth from "../hooks/useGetAuth";

import ChangePasswordModal from "../components/ChangePasswordModal";
import ImpersonationBanner from "../components/ImpersonationBanner";

import { useTheme } from "../context/ThemeContext";
import { useSidebar } from "../context/SidebarContext";
// Imports End----

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: authUser } = useGetAuth();
  const { logoutMutation } = useLogout();
  const { isDarkMode, toggleTheme } = useTheme();

  const dropdownRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const { toggleSidebar, toggleMobileSidebar } = useSidebar();

  // Pages that show a back-button + page title on mobile instead of shop name
  const mobilePageTitles = {
    "/suit-types": { title: "Suit Types", subtitle: "Manage suit types and stitching prices." },
  };
  const mobilePage = Object.entries(mobilePageTitles).find(([route]) =>
    location.pathname.startsWith(route)
  );
  const mobilePageInfo = mobilePage ? mobilePage[1] : null;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      {authUser?.isImpersonating && (
        <ImpersonationBanner
          shopName={authUser?.shop?.name || "Unknown Shop"}
          impersonatorName={authUser?.impersonator?.fullName}
        />
      )}

      <header className="sticky top-0 flex items-center justify-between w-full h-14 sm:h-16 px-3 sm:px-4 z-40 transition-all duration-200 bg-transparent">
        {/* Desktop Sidebar Toggle Button */}
        <button
          onClick={handleToggle}
          className="hidden lg:flex items-center justify-center w-10 h-10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
          aria-label="Toggle Sidebar"
        >
          <Menu size={22} />
        </button>

        {/* Mobile Left: Back button + Page Title OR Shop Name */}
        {mobilePageInfo ? (
          <div className="flex lg:hidden items-center gap-2.5 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="size-8 flex items-center justify-center rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition shrink-0 cursor-pointer"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="flex flex-col justify-center min-w-0 select-none">
              <span className="text-xl font-extrabold text-gray-900 dark:text-white truncate tracking-tight leading-tight select-none">
                {mobilePageInfo.title}
              </span>
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 leading-none mt-0.5 select-none">
                {mobilePageInfo.subtitle}
              </span>
            </div>
          </div>
        ) : (
          /* Mobile Shop Name & Subtitle */
          <div className="flex lg:hidden flex-col justify-center min-w-0 select-none">
            <span className="text-xl font-extrabold text-gray-900 dark:text-white truncate tracking-tight leading-tight select-none">
              {authUser?.shop?.name || "Tailor Shop"}
            </span>
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 leading-none mt-0.5 select-none">
              Tailor Management Portal
            </span>
          </div>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2 select-none">
          <button
            type="button"
            className="size-9 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer select-none"
            onClick={toggleTheme}
            title={`Switch to ${isDarkMode ? "Light" : "Dark"} Mode`}
          >
            {isDarkMode ? (
              <Sun size={19} className="text-amber-400" />
            ) : (
              <Moon size={19} className="text-gray-600 dark:text-gray-300" />
            )}
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-0.5 sm:px-2.5 sm:py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer select-none"
            >
              <div className="size-8.5 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs select-none">
                {authUser?.fullName
                  ? authUser.fullName.charAt(0).toUpperCase()
                  : "U"}
              </div>

              <div className="hidden sm:block text-left select-none">
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-tight select-none">
                  {authUser?.fullName}
                </p>

                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight select-none">
                  {authUser?.email}
                </p>
              </div>

              <ChevronDown
                size={14}
                className={`hidden sm:block text-gray-400 dark:text-gray-500 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1a162e] rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 py-2 z-50 transition-colors select-none">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3 select-none">
                    <div className="size-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs select-none">
                      {authUser?.fullName
                        ? authUser.fullName.charAt(0).toUpperCase()
                        : "U"}
                    </div>

                    <div className="min-w-0 select-none">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate select-none">
                        {authUser?.fullName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate select-none">
                        {authUser?.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="py-1">
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
