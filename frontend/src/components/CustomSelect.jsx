import { Select } from "antd";
import { ChevronDown, Search } from "lucide-react";
import { forwardRef, useState, useEffect, useRef, useMemo } from "react";

const CustomSelect = forwardRef(
  (
    {
      id,
      label,
      value,
      placeholder = "Select an option",
      required = false,
      options = [],
      onChange,
      disabled = false,
      loading = false,
      allowClear = true,
      mode = undefined,
      className = "",
      helperText,
      searchable = true,
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchInputRef = useRef(null);
    const historyPushed = useRef(false);
    const selectRef = useRef(null);

    const closeDropdown = () => {
      setIsOpen(false);
      setSearchQuery("");
      if (selectRef.current) {
        selectRef.current.blur();
      }
    };

    useEffect(() => {
      if (!isOpen) return;

      const onPopState = () => {
        closeDropdown();
        historyPushed.current = false;
      };

      if (!historyPushed.current) {
        historyPushed.current = true;
        window.history.pushState({ dropdownOpen: true }, "");
      }

      const scrollY = window.scrollY;
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      window.addEventListener("popstate", onPopState);

      return () => {
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollY);

        window.removeEventListener("popstate", onPopState);
        if (historyPushed.current) {
          historyPushed.current = false;
          window.history.back();
        }
      };
    }, [isOpen]);

    // Filter options based on search query
    const filteredOptions = useMemo(() => {
      if (!searchQuery.trim()) return options;
      const q = searchQuery.toLowerCase();
      return options.filter((opt) =>
        (opt?.label ?? "").toString().toLowerCase().includes(q),
      );
    }, [options, searchQuery]);

    const displayOptions = useMemo(() => {
      if (mode === "multiple" && filteredOptions.length > 0) {
        return [
          {
            label:
              value?.length === options.length ? "Deselect All" : "Select All",
            value: "SELECT_ALL",
            className: "select-all-option font-bold",
          },
          ...filteredOptions,
        ];
      }
      return filteredOptions;
    }, [mode, filteredOptions, value, options]);

    return (
      <div
        className={`flex flex-col w-full ${className}`}
        autoComplete="no-autofill"
      >
        {label && (
          <label
            htmlFor={id}
            className="block text-xs sm:text-sm font-medium mb-1.5 text-gray-700 dark:text-purple-100/90 tracking-wide"
          >
            {label}{" "}
            {required ? (
              <span className="text-red-500 font-semibold">*</span>
            ) : (
              <span className="text-xs font-normal text-gray-400 dark:text-purple-300/50">
                (Optional)
              </span>
            )}
          </label>
        )}

        <Select
          id={id}
          ref={(node) => {
            selectRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          mode={mode}
          showSearch={false}
          inputReadOnly={true}
          allowClear={allowClear}
          value={
            value === "" ||
            value === null ||
            value === undefined ||
            value === 0 ||
            value === "0"
              ? undefined
              : value
          }
          placeholder={placeholder}
          loading={loading}
          onChange={(selectedValues, selectedOptions) => {
            if (mode === "multiple" && selectedValues.includes("SELECT_ALL")) {
              if (value?.length === options.length) {
                onChange([], []);
              } else {
                const allValues = options.map((opt) => opt.value);
                onChange(allValues, options);
              }
            } else {
              onChange(selectedValues, selectedOptions);
            }
          }}
          disabled={disabled}
          maxTagCount="responsive"
          className="w-full my-custom-select cursor-pointer"
          options={displayOptions}
          autoComplete="off"
          popupClassName="!z-[9999999] my-custom-select"
          dropdownStyle={{ zIndex: 9999 }}
          styles={{ popup: { root: { borderRadius: "12px" } } }}
          onOpenChange={(visible) => {
            setIsOpen(visible);
            if (!visible) setSearchQuery("");
          }}
          dropdownRender={(menu) => (
            <div>
              {searchable && options.length > 4 && (
                <div
                  className="p-2 border-b border-gray-100 dark:border-purple-900/30 bg-gray-50/80 dark:bg-[#18112e] sticky top-0 z-10"
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative flex items-center">
                    <Search
                      size={14}
                      className="absolute left-2.5 text-gray-400 pointer-events-none"
                    />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Type to search..."
                      className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-purple-800/40 bg-white dark:bg-[#120d24] text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500 transition"
                      autoFocus={false}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              )}
              {displayOptions.length === 0 ? (
                <div className="py-4 text-center text-xs text-gray-400 dark:text-gray-500">
                  No matching options
                </div>
              ) : (
                menu
              )}
            </div>
          )}
          suffixIcon={
            <ChevronDown
              size={16}
              className={`text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          }
        />

        {helperText && <p className="text-xs text-gray-400">{helperText}</p>}
      </div>
    );
  },
);

export default CustomSelect;
