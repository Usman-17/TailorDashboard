import { useLocation, useNavigate } from "react-router-dom";
import { Home, Users, ClipboardList, Banknote, BarChart3 } from "lucide-react";

const navItems = [
  {
    id: "home",
    label: "Home",
    icon: Home,
    path: "/",
  },
  {
    id: "customers",
    label: "Customers",
    icon: Users,
    path: "/customers",
  },
  {
    id: "orders",
    label: "Orders",
    icon: ClipboardList,
    path: "/orders",
  },
  {
    id: "payments",
    label: "Payments",
    icon: Banknote,
    path: "/payments",
  },
  {
    id: "reports",
    label: "Reports",
    icon: BarChart3,
    path: "/reports",
  },
];

const MobileBottomBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-[#141025]/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around px-1 pt-2 pb-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center flex-1 py-1 transition-all duration-150 active:scale-95 cursor-pointer select-none"
            >
              <div className="h-6 flex items-center justify-center">
                <Icon
                  size={22}
                  className={`transition-colors duration-200 ${
                    active
                      ? "text-purple-600 dark:text-purple-400 fill-purple-600 dark:fill-purple-400"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                  strokeWidth={active ? 2 : 1.8}
                />
              </div>

              <span
                className={`text-[11px] tracking-tight mt-1 leading-none transition-colors duration-200 ${
                  active
                    ? "font-bold text-purple-600 dark:text-purple-400"
                    : "font-medium text-gray-700 dark:text-gray-300"
                }`}
              >
                {item.label}
              </span>

              {/* Active Indicator Underline matching reference */}
              <span
                className={`h-[2.5px] w-6 rounded-full mt-1 transition-all duration-200 ${
                  active
                    ? "bg-purple-600 dark:bg-purple-400 opacity-100 scale-100"
                    : "bg-transparent opacity-0 scale-0"
                }`}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomBar;
