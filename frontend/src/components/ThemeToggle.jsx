import { useTheme } from "../context/ThemeContext";
import { Sun, Moon } from "lucide-react";

const ThemeToggle = ({ className = "", showLabel = false }) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-300 cursor-pointer ${
        isDarkMode
          ? "bg-gray-800 text-yellow-400 hover:bg-gray-700 hover:text-yellow-300 border border-gray-700"
          : "bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-600 border border-gray-200"
      } ${className}`}
      title={`Switch to ${isDarkMode ? "Light" : "Dark"} Mode`}
      aria-label={`Switch to ${isDarkMode ? "Light" : "Dark"} Mode`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <Sun
          size={20}
          className={`absolute transition-all duration-500 transform ${
            isDarkMode
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100"
          }`}
        />
        <Moon
          size={20}
          className={`absolute transition-all duration-500 transform ${
            isDarkMode
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0"
          }`}
        />
      </div>
      {showLabel && (
        <span className="ml-2.5 text-sm font-medium">
          {isDarkMode ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
