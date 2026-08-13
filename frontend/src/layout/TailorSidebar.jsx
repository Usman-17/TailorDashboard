import { Link, useLocation } from "react-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { useSidebar } from "../context/SidebarContext";
import {
  ChevronDownIcon,
  Ellipsis,
  Users,
  LayoutDashboard,
  ShoppingBag,
  Receipt,
  Tag,
  Banknote,
  BarChart3,
  X,
} from "lucide-react";

const tailorNavItems = [
  {
    name: "Dashboard",
    icon: <LayoutDashboard />,
    path: "/",
  },
    {
    name: "Suit Types",
    icon: <Tag />,
    path: "/suit-types",
  },
  {
    name: "Customers",
    icon: <Users />,
    path: "/customers",
  },
  {
    name: "Orders",
    icon: <ShoppingBag />,
    path: "/orders",
  },
  {
    name: "Expenses",
    icon: <Receipt />,
    path: "/expenses",
  },
  {
    name: "Payments",
    icon: <Banknote />,
    path: "/payments",
  },
  {
    name: "Reports",
    icon: <BarChart3 />,
    path: "/reports",
  },
];

const Sidebar = () => {
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
    toggleMobileSidebar,
  } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [subMenuHeight, setSubMenuHeight] = useState({});
  const subMenuRefs = useRef({});

  const isActive = useCallback(
    (path) => location.pathname === path,
    [location.pathname],
  );

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index, menuType) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items, menuType) => (
    <ul className="flex flex-col gap-0.5">
      {items.map((nav, index) => {
        const isSubmenuActive = nav.subItems?.some((sub) => isActive(sub.path));
        const isSubmenuOpen =
          openSubmenu?.type === menuType && openSubmenu?.index === index;

        return (
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`w-full flex items-center py-2.5 rounded-xl transition-all cursor-pointer ${
                  isExpanded || isHovered || isMobileOpen
                    ? "justify-between px-3"
                    : "justify-center px-0"
                } ${
                  isSubmenuActive || isSubmenuOpen
                    ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="[&>svg]:size-[19px] flex-shrink-0">
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="text-[13.5px] font-medium whitespace-nowrap">
                      {nav.name}
                    </span>
                  )}
                </div>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <ChevronDownIcon
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isSubmenuOpen
                        ? "rotate-180 text-purple-600 dark:text-purple-400"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  />
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  onClick={() => {
                    if (isMobileOpen) toggleMobileSidebar();
                  }}
                  className={`flex items-center gap-3 py-2.5 rounded-xl transition-all ${
                    isExpanded || isHovered || isMobileOpen
                      ? "px-3"
                      : "px-0 justify-center"
                  } ${
                    isActive(nav.path)
                      ? "bg-purple-600 text-white font-medium shadow-md shadow-purple-500/25 dark:bg-purple-600 dark:text-white"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800/60"
                  }`}
                >
                  <span className="[&>svg]:size-[19px] flex-shrink-0">
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="text-[13.5px] font-medium whitespace-nowrap">
                      {nav.name}
                    </span>
                  )}
                </Link>
              )
            )}

            {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => {
                  subMenuRefs.current[`${menuType}-${index}`] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height: isSubmenuOpen
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
                }}
              >
                <ul className="mt-1.5 space-y-1 ml-5 pl-3 border-l-2 border-purple-200 dark:border-purple-900/60">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        to={subItem.path}
                        onClick={() => {
                          if (isMobileOpen) toggleMobileSidebar();
                        }}
                        className={`flex justify-between items-center px-3 py-2 rounded-lg text-[12.5px] whitespace-nowrap transition-all ${
                          isActive(subItem.path)
                            ? "bg-purple-600 text-white font-medium shadow-sm shadow-purple-500/20 dark:bg-purple-600 dark:text-white"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800/60"
                        }`}
                      >
                        {subItem.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed top-0 left-0 h-screen px-2 bg-white dark:bg-[#141025] border-r border-gray-200 dark:border-gray-800/80 text-gray-900 dark:text-gray-100 transition-all duration-300 ease-in-out z-50
        ${
          isMobileOpen
            ? "w-full"
            : isExpanded || isHovered
              ? "w-[220px]"
              : "w-[68px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
    >
      <div className="h-14 sm:h-16 flex items-center justify-between px-3 mb-2">
        <Link to="/" className="flex items-center justify-center">
          {isExpanded || isHovered || isMobileOpen ? (
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
              Tailor System
            </span>
          ) : (
            <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
              TS
            </span>
          )}
        </Link>
        {isMobileOpen && (
          <button
            onClick={toggleMobileSidebar}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        )}
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar flex-1">
        <nav className="mb-4">
          <div className="flex flex-col gap-2">
            <div>
              <h2
                className={`mb-2.5 text-[10px] font-semibold uppercase tracking-wider flex leading-[16px] text-gray-400 dark:text-gray-500 px-1 ${
                  !isExpanded && !isHovered ? "justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Main Menu"
                ) : (
                  <Ellipsis size={14} />
                )}
              </h2>
              {renderMenuItems(tailorNavItems, "main")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
