import Order, { ORDER_STATUS } from "../models/order.model.js";
import Customer from "../models/tailorCustomer.model.js";
import { ROLES } from "../models/user.model.js";

// GET /api/tailor-dashboard/stats
export const getTailorStats = async (req, res) => {
  try {
    const { shopId } = req;

    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const [
      totalCustomers,
      totalOrders,
      pendingOrders,
      inProgressOrders,
      readyOrders,
      deliveredOrders,
      cancelledOrders,
      todayDeliveries,
      overdueOrders,
    ] = await Promise.all([
      Customer.countDocuments({ shopId, isDeleted: { $ne: true } }),
      Order.countDocuments({ shopId, isDeleted: { $ne: true } }),
      Order.countDocuments({
        shopId,
        status: ORDER_STATUS.PENDING,
        isDeleted: { $ne: true },
      }),
      Order.countDocuments({
        shopId,
        status: ORDER_STATUS.IN_PROGRESS,
        isDeleted: { $ne: true },
      }),
      Order.countDocuments({
        shopId,
        status: ORDER_STATUS.READY,
        isDeleted: { $ne: true },
      }),
      Order.countDocuments({
        shopId,
        status: ORDER_STATUS.DELIVERED,
        isDeleted: { $ne: true },
      }),
      Order.countDocuments({
        shopId,
        status: ORDER_STATUS.CANCELLED,
        isDeleted: { $ne: true },
      }),
      Order.countDocuments({
        shopId,
        status: { $in: [ORDER_STATUS.READY, ORDER_STATUS.IN_PROGRESS] },
        deliveryDate: { $gte: startOfDay, $lte: endOfDay },
        isDeleted: { $ne: true },
      }),
      Order.countDocuments({
        shopId,
        status: {
          $in: [
            ORDER_STATUS.PENDING,
            ORDER_STATUS.IN_PROGRESS,
            ORDER_STATUS.READY,
          ],
        },
        deliveryDate: { $lt: now },
        isDeleted: { $ne: true },
      }),
    ]);

    return res.status(200).json({
      totalCustomers,
      totalOrders,
      pendingOrders,
      inProgressOrders,
      readyOrders,
      deliveredOrders,
      cancelledOrders,
      todayDeliveries,
      overdueOrders,
    });
  } catch (error) {
    console.error("Error in getTailorStats:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/tailor-dashboard/charts
export const getTailorCharts = async (req, res) => {
  try {
    const { shopId } = req;
    const now = new Date();

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleString("default", { month: "short", year: "numeric" }),
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
      });
    }

    const [ordersByMonth, ordersByStatus] = await Promise.all([
      Promise.all(
        months.map(async (m) => {
          const count = await Order.countDocuments({
            shopId,
            createdAt: { $gte: m.start, $lte: m.end },
            isDeleted: { $ne: true },
          });
          return { month: m.label, count };
        }),
      ),
      Order.aggregate([
        { $match: { shopId, isDeleted: { $ne: true } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    return res.status(200).json({
      ordersByMonth,
      ordersByStatus: ordersByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error("Error in getTailorCharts:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/tailor-dashboard/recent-orders
export const getTailorRecentOrders = async (req, res) => {
  try {
    const { shopId } = req;

    const orders = await Order.find({ shopId, isDeleted: { $ne: true } })
      .populate("customer", "name phone customerId")
      .populate("createdBy", "fullName")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    return res.status(200).json(orders);
  } catch (error) {
    console.error("Error in getTailorRecentOrders:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/tailor-dashboard/upcoming-deliveries
export const getTailorUpcomingDeliveries = async (req, res) => {
  try {
    const { shopId } = req;
    const now = new Date();

    const orders = await Order.find({
      shopId,
      status: {
        $in: [
          ORDER_STATUS.PENDING,
          ORDER_STATUS.IN_PROGRESS,
          ORDER_STATUS.READY,
        ],
      },
      deliveryDate: { $gte: now },
      isDeleted: { $ne: true },
    })
      .populate("customer", "name phone customerId")
      .sort({ deliveryDate: 1 })
      .limit(8)
      .lean();

    return res.status(200).json(orders);
  } catch (error) {
    console.error("Error in getTailorUpcomingDeliveries:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/tailor-dashboard/latest-customers
export const getTailorLatestCustomers = async (req, res) => {
  try {
    const { shopId } = req;

    const customers = await Customer.find({
      shopId,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    return res.status(200).json(customers);
  } catch (error) {
    console.error("Error in getTailorLatestCustomers:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
