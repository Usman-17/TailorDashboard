import { Link, useLocation } from "react-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { useSidebar } from "../context/SidebarContext";
import {
  ChevronDownIcon,
  Ellipsis,
  LayoutDashboard,
  Store,
  Users,
  Settings,
} from "lucide-react";

import logo from "../assets/logo.png";
import logo_icon from "../assets/s-logo.png";

const adminNavItems = [
  {
    name: "Dashboard",
    icon: <LayoutDashboard />,
    path: "/admin",
  },
  {
    name: "Manage Shops",
    icon: <Store />,
    path: "/admin/shops",
  },
  {
    name: "Manage Users",
    icon: <Users />,
    path: "/admin/users",
  },
  {
    name: "Settings",
    icon: <Settings />,
    path: "/admin/settings",
  },
];

const AdminSidebar = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
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
    <ul className="flex flex-col gap-1.5">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className="flex items-center gap-2.5 ml-2 overflow-hidden text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <span className="[&>svg]:size-[18px]">{nav.icon}</span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="text-[13px]">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`w-3.5 h-3.5 transition-transform duration-200 mt-0.5 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors cursor-pointer ${
                  isActive(nav.path)
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <span className="[&>svg]:size-[18px]">{nav.icon}</span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="text-[13px]">{nav.name}</span>
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
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-1 space-y-0.5 ml-7">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`flex justify-between items-center px-2.5 py-1.5 rounded text-[12px] transition-colors cursor-pointer ${
                        isActive(subItem.path)
                          ? "bg-gray-100 text-gray-900 font-medium"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
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
      ))}
    </ul>
  );

  return (
    <aside
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed top-0 left-0 h-screen mt-5 lg:mt-0 px-3 bg-white border-r border-gray-200 text-gray-900 transition-all duration-300 ease-in-out z-50
        ${
          isExpanded || isMobileOpen
            ? "w-[190px]"
            : isHovered
              ? "w-[190px]"
              : "w-[60px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
    >
      <div className="py-6 sm:py-3 flex justify-center">
        <Link to="/admin" className="hidden sm:block">
          {isExpanded || isHovered || isMobileOpen ? (
            <img src={logo} alt="Logo" width={80} height={32} />
          ) : (
            <img src={logo_icon} alt="Logo" width={26} height={26} />
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar flex-1">
        <nav className="mb-4">
          <div className="flex flex-col gap-2">
            <div>
              <h2
                className={`mb-2 text-[10px] uppercase flex leading-[16px] text-gray-400 ${
                  !isExpanded && !isHovered ? "justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Admin Panel"
                ) : (
                  <Ellipsis size={14} />
                )}
              </h2>
              {renderMenuItems(adminNavItems, "main")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AdminSidebar;
