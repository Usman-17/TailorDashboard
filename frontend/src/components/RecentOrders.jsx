import { Link } from "react-router-dom";

const RecentOrders = ({ orders = [] }) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-3 py-5 sm:px-6 text-nowrap">
      {/* Header */}
      <div className="mb-4 flex  gap-2 items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Recent Orders</h3>

        <Link
          to="/orders/manage"
          className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          See all orders
        </Link>
      </div>

      {/* Table */}
      <div className="max-w-full overflow-x-auto">
        <table className="w-full text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Quantity</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 5).map((order) => (
              <tr key={order._id} className="border-b last:border-none">
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                  {order.customer?.name || "N/A"}
                </td>
                <td className="px-4 py-3">{order.customer?.phone || "N/A"}</td>
                <td className="px-4 py-3 pl-10">{order.quantity || 1}</td>
                <td className="px-4 py-3">
                  Rs. {order.totalAmount?.toLocaleString() || "0"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      order.status === "delivered"
                        ? "bg-green-100 text-green-700"
                        : order.status === "completed"
                        ? "bg-yellow-100 text-yellow-700"
                        : order.status === "cancelled"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}

            {orders.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  No recent orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentOrders;
