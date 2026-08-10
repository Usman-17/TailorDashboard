import mongoose from "mongoose";
import Order from "../models/order.model.js";
import OrderPayment from "../models/orderPayment.model.js";
import ExpenseRecord from "../models/expenseRecord.model.js";
import TailorCustomer from "../models/tailorCustomer.model.js";

const getDateRange = (period, from, to) => {
  const now = new Date();

  if (from || to) {
    const filter = {};
    if (from) filter.$gte = new Date(from);
    if (to) {
      const endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
      filter.$lte = endDate;
    }
    return filter;
  }

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  endOfLastMonth.setHours(23, 59, 59, 999);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  switch (period) {
    case "today":
      return { $gte: startOfDay };
    case "week":
      return { $gte: startOfWeek };
    case "month":
      return { $gte: startOfMonth };
    case "last_month":
      return { $gte: startOfLastMonth, $lte: endOfLastMonth };
    case "year":
      return { $gte: startOfYear };
    default:
      return {};
  }
};

const getDateLabel = (period, from, to) => {
  if (from || to) return `${from || "Start"} to ${to || "Now"}`;
  const labels = { today: "Today", week: "This Week", month: "This Month", last_month: "Last Month", year: "This Year", all: "All Time" };
  return labels[period] || "All Time";
};

// GET /api/tailor-reports?period=month&from=&to=
export const getTailorReports = async (req, res) => {
  try {
    const { shopId } = req;
    const { period = "month", from, to } = req.query;
    const shopOid = new mongoose.Types.ObjectId(shopId);
    const dateFilter = getDateRange(period, from, to);
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      orderStats,
      paymentStats,
      expenseStats,
      customerCount,
      ordersByStatus,
      expenseByCategory,
      paymentByMethod,
      monthlyOrders,
      monthlyRevenue,
      monthlyExpenses,
      overdueOrders,
      deliveredOrders,
    ] = await Promise.all([
      // Total orders in period
      Order.aggregate([
        { $match: { shopId: shopOid, isDeleted: { $ne: true }, ...(hasDateFilter ? { createdAt: dateFilter } : {}) } },
        { $group: { _id: null, total: { $sum: 1 }, totalAmount: { $sum: "$totalAmount" }, totalPaid: { $sum: "$advancePaid" } } },
      ]),

      // Total payments in period
      OrderPayment.aggregate([
        { $match: { shopId: shopOid, isVoided: false, ...(hasDateFilter ? { createdAt: dateFilter } : {}) } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),

      // Total expenses in period
      ExpenseRecord.aggregate([
        { $match: { shopId: shopOid, ...(hasDateFilter ? { date: dateFilter } : {}) } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),

      // Total customers
      TailorCustomer.countDocuments({ shopId: shopOid, isDeleted: { $ne: true } }),

      // Orders by status in period
      Order.aggregate([
        { $match: { shopId: shopOid, isDeleted: { $ne: true }, ...(hasDateFilter ? { createdAt: dateFilter } : {}) } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // Expenses by category in period
      ExpenseRecord.aggregate([
        { $match: { shopId: shopOid, ...(hasDateFilter ? { date: dateFilter } : {}) } },
        { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),

      // Payments by method in period
      OrderPayment.aggregate([
        { $match: { shopId: shopOid, isVoided: false, ...(hasDateFilter ? { createdAt: dateFilter } : {}) } },
        { $group: { _id: "$method", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),

      // Monthly orders (last 12 months for year view, 6 for others)
      Order.aggregate([
        { $match: { shopId: shopOid, isDeleted: { $ne: true } } },
        { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 }, totalAmount: { $sum: "$totalAmount" } } },
        { $sort: { "_id.year": -1, "_id.month": -1 } },
        { $limit: period === "year" ? 12 : 6 },
      ]),

      // Monthly revenue (last 12 months for year view, 6 for others)
      OrderPayment.aggregate([
        { $match: { shopId: shopOid, isVoided: false } },
        { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, total: { $sum: "$amount" } } },
        { $sort: { "_id.year": -1, "_id.month": -1 } },
        { $limit: period === "year" ? 12 : 6 },
      ]),

      // Monthly expenses (last 12 months for year view, 6 for others)
      ExpenseRecord.aggregate([
        { $match: { shopId: shopOid } },
        { $group: { _id: { year: { $year: "$date" }, month: { $month: "$date" } }, total: { $sum: "$amount" } } },
        { $sort: { "_id.year": -1, "_id.month": -1 } },
        { $limit: period === "year" ? 12 : 6 },
      ]),

      // Overdue orders (pending/in_progress with deliveryDate < today)
      Order.countDocuments({
        shopId: shopOid,
        isDeleted: { $ne: true },
        status: { $in: ["pending", "in_progress"] },
        deliveryDate: { $lt: todayStart },
      }),

      // Delivered orders with delivery timing (for delivery performance)
      Order.aggregate([
        { $match: { shopId: shopOid, isDeleted: { $ne: true }, status: "delivered" } },
        {
          $project: {
            deliveryDate: 1,
            updatedAt: 1,
            deliveredOnTime: { $lte: ["$updatedAt", "$deliveryDate"] },
          },
        },
        {
          $group: {
            _id: null,
            onTime: { $sum: { $cond: ["$deliveredOnTime", 1, 0] } },
            late: { $sum: { $cond: ["$deliveredOnTime", 0, 1] } },
            total: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statusMap = {};
    ordersByStatus.forEach((s) => { statusMap[s._id] = s.count; });

    const totalOrderAmount = orderStats[0]?.totalAmount || 0;
    const paymentsReceived = paymentStats[0]?.total || 0;
    const outstanding = Math.max(0, totalOrderAmount - paymentsReceived);
    const totalExpenses = expenseStats[0]?.total || 0;
    const netCashProfit = paymentsReceived - totalExpenses;
    const cashProfitMargin = paymentsReceived > 0 ? ((netCashProfit / paymentsReceived) * 100) : 0;
    const avgOrderValue = (orderStats[0]?.total || 0) > 0 ? totalOrderAmount / (orderStats[0]?.total || 0) : 0;

    const delivery = deliveredOrders[0] || { onTime: 0, late: 0, total: 0 };

    return res.status(200).json({
      periodLabel: getDateLabel(period, from, to),
      summary: {
        totalOrders: orderStats[0]?.total || 0,
        totalOrderAmount,
        totalPaid: orderStats[0]?.totalPaid || 0,
        paymentsReceived,
        totalPayments: paymentStats[0]?.count || 0,
        totalExpenses,
        totalExpenseCount: expenseStats[0]?.count || 0,
        totalCustomers: customerCount || 0,
        outstanding,
        netCashProfit,
        cashProfitMargin: Number(cashProfitMargin.toFixed(1)),
        avgOrderValue: Math.round(avgOrderValue),
        overdueOrders,
      },
      ordersByStatus: {
        pending: statusMap.pending || 0,
        in_progress: statusMap.in_progress || 0,
        ready: statusMap.ready || 0,
        delivered: statusMap.delivered || 0,
        cancelled: statusMap.cancelled || 0,
      },
      deliveryPerformance: {
        onTime: delivery.onTime || 0,
        late: delivery.late || 0,
        total: delivery.total || 0,
      },
      expenseByCategory: expenseByCategory.map((e) => ({ category: e._id, total: e.total, count: e.count })),
      paymentByMethod: paymentByMethod.map((p) => ({ method: p._id, total: p.total, count: p.count })),
      monthlyOrders: monthlyOrders.reverse(),
      monthlyRevenue: monthlyRevenue.reverse(),
      monthlyExpenses: monthlyExpenses.reverse(),
    });
  } catch (error) {
    console.error("Error in getTailorReports:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
