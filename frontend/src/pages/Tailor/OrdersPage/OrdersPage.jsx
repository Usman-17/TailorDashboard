import moment from "moment";
import { Search, ChevronLeft } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

import CustomModal from "../../../components/CustomModal";
import BookOrderModal from "../CustomersPage/BookOrderModal";

import OrderDetailPage from "./OrderDetailPage";
import MobileOrdersPage from "./MobileOrdersPage";
import DesktopOrdersPage from "./DesktopOrdersPage";

import EditOrderModal from "./EditOrderModal";

import useGlobalFilter from "../../../hooks/useGlobalFilter";
import { useGetAllOrders } from "../../../hooks/useGetAllOrders";
import useGetAuth from "../../../hooks/useGetAuth";
import useGetAllCustomers from "../../../hooks/useGetAllCustomers";
// Imports End----

const OrdersPage = () => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [bookOrderCustomer, setBookOrderCustomer] = useState(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsMobile(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const { orders, isLoading } = useGetAllOrders();
  const { data: customersData, isLoading: customersLoading } =
    useGetAllCustomers();
  const { data: authUser } = useGetAuth();

  const customers = useMemo(
    () => customersData?.customers || [],
    [customersData],
  );

  const filteredCustomers = useGlobalFilter(customers, customerSearch, [
    "name",
    "phone",
    "customerId",
  ]);

  const openBookOrder = (customer) => {
    setCustomerSearch("");
    setBookOrderCustomer(customer);
  };

  const stats = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const cancelled = orders.filter((o) => o.status === "cancelled").length;
    const pending = orders.filter(
      (o) => !["delivered", "cancelled"].includes(o.status),
    ).length;
    return { total, delivered, cancelled, pending };
  }, [orders]);

  const filtered = useMemo(() => {
    let result = orders;
    if (filterStatus === "pending")
      result = result.filter(
        (o) => !["delivered", "cancelled"].includes(o.status),
      );
    else if (filterStatus !== "all")
      result = result.filter((o) => o.status === filterStatus);

    if (search) {
      const q = search.toLowerCase();
      const match = (val) =>
        val != null && val.toString().toLowerCase().includes(q);
      result = result.filter((o) => {
        const customer = o.customer || {};
        const suits = (o.items || [])
          .map((it) => `${it.suitType || ""} ${it.description || ""}`)
          .join(" ");
        return (
          match(o.orderNumber) ||
          match(customer.name) ||
          match(customer.phone) ||
          match(customer.customerId) ||
          match(o.status) ||
          (suits && suits.toLowerCase().includes(q)) ||
          match(o.totalAmount)
        );
      });
    }

    const isUrgent = (o) => {
      if (!o.deliveryDate || ["delivered", "cancelled"].includes(o.status))
        return false;
      return (
        moment(o.deliveryDate)
          .startOf("day")
          .diff(moment().startOf("day"), "days") <= 3
      );
    };
    const urgent = result.filter(isUrgent);
    const rest = result.filter((o) => !isUrgent(o));
    return [...urgent, ...rest];
  }, [orders, filterStatus, search]);

  const sharedProps = {
    stats,
    filtered,
    isLoading,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    setSelectedOrderId,
    setEditingOrderId,
    openPicker: () => setPickerOpen(true),
    authUser,
  };

  return (
    <>
      {isMobile ? (
        <MobileOrdersPage {...sharedProps} />
      ) : (
        <DesktopOrdersPage {...sharedProps} />
      )}

      <OrderDetailPage
        orderId={selectedOrderId}
        open={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onEditOrder={(id) => setEditingOrderId(id)}
        fullScreen
      />

      <EditOrderModal
        orderId={editingOrderId}
        open={!!editingOrderId}
        onClose={() => setEditingOrderId(null)}
      />

      <BookOrderModal
        open={!!bookOrderCustomer}
        onClose={() => setBookOrderCustomer(null)}
        customer={bookOrderCustomer}
      />

      {/* Customer Picker for New Order */}
      {isMobile ? (
        <>
          {pickerOpen && (
            <div className="fixed inset-0 z-[99999] bg-white dark:bg-[#0d0a1d] flex flex-col">
              <div className="flex items-center justify-between gap-2 px-3 py-3 bg-white dark:bg-[#120e24] border-b border-gray-200 dark:border-purple-500/20 shrink-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPickerOpen(false);
                      setCustomerSearch("");
                    }}
                    className="size-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 text-gray-700 dark:text-gray-200 transition-all cursor-pointer shrink-0"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <div className="min-w-0">
                    <h2 className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight truncate">
                      Select Customer
                    </h2>
                    <p className="text-[11px] text-gray-500 dark:text-purple-300/70 font-medium -mt-1 truncate">
                      Choose a customer to create an order
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-gray-50/40 dark:bg-[#0d0a1d]">
                <div className="relative mb-3">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search by name, phone, ID..."
                    className="w-full pl-10 pr-3.5 h-10 rounded-lg text-[14px] font-['Outfit',sans-serif] text-gray-900 dark:text-white placeholder-gray-400 bg-white dark:bg-[#0f0d1b] border-[1.5px] border-gray-200 dark:border-purple-500/30 focus:border-[var(--secondary-color)] dark:focus:border-purple-400 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.25)] focus:outline-none transition-all duration-200"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  {customersLoading ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
                      Loading customers...
                    </p>
                  ) : filteredCustomers.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
                      No customers found
                    </p>
                  ) : (
                    filteredCustomers.map((cust) => (
                      <button
                        key={cust._id}
                        onClick={() => openBookOrder(cust)}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#15102a] hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 active:scale-[0.98] active:bg-purple-50 dark:active:bg-purple-900/20 transition-all duration-150 cursor-pointer text-left"
                      >
                        <div className="size-9 rounded-full bg-purple-600/15 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold text-sm border border-purple-500/30 shrink-0">
                          {(cust.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {cust.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {cust.phone} • {cust.customerId}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <CustomModal isOpen={pickerOpen} className="w-[92%] max-w-md">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3.5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Select Customer
              </h3>
              <button
                onClick={() => {
                  setPickerOpen(false);
                  setCustomerSearch("");
                }}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search by name, phone, ID..."
                className="w-full pl-10 pr-3.5 h-10 rounded-lg text-[14px] font-['Outfit',sans-serif] text-gray-900 dark:text-white placeholder-gray-400 bg-gray-50 dark:bg-[#0f0d1b] border-[1.5px] border-gray-200 dark:border-purple-500/30 focus:border-[var(--secondary-color)] dark:focus:border-purple-400 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.25)] focus:outline-none transition-all duration-200"
              />
            </div>

            <div className="max-h-80 overflow-y-auto flex flex-col gap-2 pr-1">
              {customersLoading ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
                  Loading customers...
                </p>
              ) : filteredCustomers.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
                  No customers found
                </p>
              ) : (
                filteredCustomers.map((cust) => (
                  <button
                    key={cust._id}
                    onClick={() => openBookOrder(cust)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#15102a] hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 active:scale-[0.98] active:bg-purple-50 dark:active:bg-purple-900/20 transition-all duration-150 cursor-pointer text-left"
                  >
                    <div className="size-9 rounded-full bg-purple-600/15 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold text-sm border border-purple-500/30 shrink-0">
                      {(cust.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {cust.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {cust.phone} • {cust.customerId}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </CustomModal>
      )}
    </>
  );
};

export default OrdersPage;
