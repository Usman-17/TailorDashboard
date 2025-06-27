import SummaryCard from "../components/SummaryCard";
import CustomButton from "../components/CustomButton";
import SectionHeading from "../components/SectionHeading";

import { toast } from "react-hot-toast";
import { useGetAllOrders } from "../hooks/useGetAllOrders";
import { Ban, CheckCircle, Redo, Truck, Users } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
// Imports End

const OrdersListingPage = () => {
  const queryClient = useQueryClient();
  const { orders = [] } = useGetAllOrders();

  const totalOrders = orders.length;
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
  const cancelledOrders = orders.filter((o) => o.status === "cancelled").length;
  const pendingOrders = orders.filter(
    (o) => !["delivered", "cancelled"].includes(o.status)
  ).length;

  //   update Order Status
  const { mutate: updateStatus } = useMutation({
    mutationFn: async ({ orderId, status }) => {
      const res = await fetch(`/api/orders/status/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update order status");
      return res.json();
    },

    onMutate: async ({ orderId, status }) => {
      await queryClient.cancelQueries(["orders"]);
      const previousOrders = queryClient.getQueryData(["orders"]);
      queryClient.setQueryData(["orders"], (oldOrders) =>
        oldOrders?.map((order) =>
          order._id === orderId ? { ...order, status } : order
        )
      );
      return { previousOrders };
    },

    onError: (err, variables, context) => {
      queryClient.setQueryData(["orders"], context.previousOrders);
      toast.error("Failed to update order status");
    },
    onSettled: () => {
      queryClient.invalidateQueries(["orders"]);
    },
    onSuccess: () => {
      toast.success("Order status updated");
    },
  });

  const statusColors = {
    delivered: "text-green-600",
    completed: "text-blue-600",
    cancelled: "text-red-600",
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <SectionHeading
          title="Orders List"
          subtitle="Manage all customer orders below"
        />

        <div className="sm:w-auto w-full">
          <CustomButton title="Add New Orders" to="/orders/add" Icon={Redo} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 my-6">
        <SummaryCard
          icon={Users}
          title="Total Orders"
          count={totalOrders}
          color="#3B82F6"
        />
        <SummaryCard
          icon={CheckCircle}
          title="Delivered"
          count={deliveredOrders}
          color="#10B981"
        />
        <SummaryCard
          icon={Truck}
          title="Pending"
          count={pendingOrders}
          color="#F59E0B"
        />
        <SummaryCard
          icon={Ban}
          title="Cancelled"
          count={cancelledOrders}
          color="#EF4444"
        />
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order._id}
            className="border border-gray-200 rounded-lg p-4 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              {/* Customer Info */}
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-semibold">Customer:</span>{" "}
                  {order.customer?.name} ({order.customer?.phone})
                </p>
                <p>
                  <span className="font-semibold">Suit Type:</span>{" "}
                  {order?.suitType}
                </p>
                <p>
                  <span className="font-semibold">Quantity:</span>{" "}
                  {order.quantity}
                </p>
              </div>

              {/* Payment & Date */}
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-semibold">Total Amount:</span> Rs.{" "}
                  {order.totalAmount.toLocaleString()}
                </p>
                <p>
                  <span className="font-semibold">Advance Paid:</span> Rs.{" "}
                  {order.advancePaid || "00"}
                </p>
                <p>
                  <span className="font-semibold">Delivery Date:</span>{" "}
                  {new Date(order.deliveryDate).toLocaleDateString()}
                </p>
              </div>

              {/* Status & Notes */}
              <div className="text-sm space-y-2">
                <div>
                  <span className="font-semibold">Status:</span>{" "}
                  <select
                    value={order.status}
                    onChange={(e) =>
                      updateStatus({
                        orderId: order._id,
                        status: e.target.value,
                      })
                    }
                    className={`cursor-pointer text-sm border rounded px-2 py-1 focus:outline-none ${
                      statusColors[order.status] || "text-yellow-600"
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="in progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {order.notes && (
                  <p>
                    <span className="font-semibold">Notes:</span> {order.notes}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default OrdersListingPage;
