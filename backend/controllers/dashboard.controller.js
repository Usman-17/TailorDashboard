import mongoose from "mongoose";
import Order, { ORDER_STATUS } from "../models/order.model.js";
import Customer from "../models/tailorCustomer.model.js";
import Shop from "../models/shop.model.js";
import User from "../models/user.model.js";
import Expense from "../models/expense.model.js";
import Payment from "../models/payment.model.js";
import { ROLES } from "../models/user.model.js";

// GET /api/dashboard/stats
export const getDashboardStats = async (req, res) => {
  try {
    const { user } = req;
    const isSuperAdmin = user.role === ROLES.SUPER_ADMIN;

    const shopFilter = isSuperAdmin ? {} : { shopId: user.shop };

    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());

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
      monthlyRevenueAgg,
      monthlyExpenses,
      activeStaff,
      totalShops,
      todayPaymentsAgg,
    ] = await Promise.all([
      Customer.countDocuments({ ...shopFilter, isDeleted: { $ne: true } }),
      Order.countDocuments({ ...shopFilter, isDeleted: { $ne: true } }),
      Order.countDocuments({
        ...shopFilter,
        status: ORDER_STATUS.PENDING,
        isDeleted: { $ne: true },
      }),
      Order.countDocuments({
        ...shopFilter,
        status: ORDER_STATUS.IN_PROGRESS,
        isDeleted: { $ne: true },
      }),
      Order.countDocuments({
        ...shopFilter,
        status: ORDER_STATUS.READY,
        isDeleted: { $ne: true },
      }),
      Order.countDocuments({
        ...shopFilter,
        status: ORDER_STATUS.DELIVERED,
        isDeleted: { $ne: true },
      }),
      Order.countDocuments({
        ...shopFilter,
        status: ORDER_STATUS.CANCELLED,
        isDeleted: { $ne: true },
      }),
      Order.countDocuments({
        ...shopFilter,
        status: { $in: [ORDER_STATUS.READY, ORDER_STATUS.IN_PROGRESS] },
        deliveryDate: { $gte: startOfDay, $lte: endOfDay },
        isDeleted: { $ne: true },
      }),
      Order.countDocuments({
        ...shopFilter,
        status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.IN_PROGRESS] },
        deliveryDate: { $lt: now },
        isDeleted: { $ne: true },
      }),
      isSuperAdmin
        ? Payment.aggregate([
            {
              $match: {
                createdAt: { $gte: startOfMonth, $lte: endOfMonth },
              },
            },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ])
        : Order.aggregate([
            {
              $match: {
                ...shopFilter,
                status: ORDER_STATUS.DELIVERED,
                updatedAt: { $gte: startOfMonth, $lte: endOfMonth },
                isDeleted: { $ne: true },
              },
            },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
          ]),
      Expense.aggregate([
        {
          $match: {
            ...(isSuperAdmin ? {} : { shopId: user.shop }),
            month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
          },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      isSuperAdmin
        ? User.countDocuments({
            role: { $in: [ROLES.OWNER, ROLES.STAFF] },
            isActive: true,
          })
        : User.countDocuments({
            shop: user.shop,
            role: ROLES.STAFF,
            isActive: true,
          }),
      isSuperAdmin ? Shop.countDocuments({}) : Promise.resolve(0),
      isSuperAdmin
        ? Payment.aggregate([
            {
              $match: {
                createdAt: { $gte: startOfDay, $lte: endOfDay },
              },
            },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ])
        : Promise.resolve([]),
    ]);

    const revenue = monthlyRevenueAgg[0]?.total || 0;
    const todaysCollection = todayPaymentsAgg[0]?.total || 0;
    const expenses = isSuperAdmin ? 0 : monthlyExpenses[0]?.total || 0;

    let activeShopsCount = 0;
    let expiringSoonShopsCount = 0;
    let expiredShopsCount = 0;
    let suspendedShopsCount = 0;

    if (isSuperAdmin) {
      const shops = await Shop.find({})
        .select("isActive subscriptionExpiry")
        .lean();
      shops.forEach((shop) => {
        const expiryDate = shop.subscriptionExpiry
          ? new Date(shop.subscriptionExpiry)
          : null;
        const isPastExpiry = expiryDate ? expiryDate < now : false;
        const diffMs = expiryDate ? expiryDate - now : null;
        const daysUntilExpiry =
          diffMs !== null ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : null;

        if (shop.isActive === "suspended") {
          suspendedShopsCount++;
        } else if (shop.isActive === "expired" || isPastExpiry) {
          expiredShopsCount++;
        } else if (shop.isActive === "active") {
          activeShopsCount++;
          if (
            daysUntilExpiry !== null &&
            daysUntilExpiry >= 0 &&
            daysUntilExpiry <= 7
          ) {
            expiringSoonShopsCount++;
          }
        }
      });
    }

    let totalIncomeAllTime = 0;
    if (isSuperAdmin) {
      const paymentAgg = await Payment.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      if (paymentAgg.length > 0 && paymentAgg[0]?.total !== undefined) {
        totalIncomeAllTime = paymentAgg[0].total;
      } else {
        const shopAgg = await Shop.aggregate([
          { $group: { _id: null, total: { $sum: "$amountReceived" } } },
        ]);
        totalIncomeAllTime = shopAgg[0]?.total || 0;
      }
    } else {
      const shopIncome = await Order.aggregate([
        {
          $match: {
            ...shopFilter,
            status: ORDER_STATUS.DELIVERED,
            isDeleted: { $ne: true },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]);
      totalIncomeAllTime = shopIncome[0]?.total || 0;
    }

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
      monthlyRevenue: revenue,
      todaysCollection,
      monthlyExpenses: expenses,
      netProfit: revenue - expenses,
      totalIncome: totalIncomeAllTime,
      activeStaff,
      totalShops,
      activeShops: activeShopsCount,
      expiringSoonShops: expiringSoonShopsCount,
      expiredShops: expiredShopsCount,
      suspendedShops: suspendedShopsCount,
    });
  } catch (error) {
    console.error("Error in getDashboardStats:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/dashboard/charts
export const getChartData = async (req, res) => {
  try {
    const { user } = req;
    const isSuperAdmin = user.role === ROLES.SUPER_ADMIN;
    const shopFilter = isSuperAdmin ? {} : { shopId: user.shop };

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

    const [ordersByMonth, revenueByMonth, ordersByStatus] = await Promise.all([
      Promise.all(
        months.map(async (m) => {
          const count = await Order.countDocuments({
            ...shopFilter,
            createdAt: { $gte: m.start, $lte: m.end },
            isDeleted: { $ne: true },
          });
          return { month: m.label, count };
        }),
      ),
      Promise.all(
        months.map(async (m) => {
          if (isSuperAdmin) {
            const result = await Payment.aggregate([
              {
                $match: {
                  createdAt: { $gte: m.start, $lte: m.end },
                },
              },
              { $group: { _id: null, total: { $sum: "$amount" } } },
            ]);
            return { month: m.label, total: result[0]?.total || 0 };
          } else {
            const result = await Order.aggregate([
              {
                $match: {
                  ...shopFilter,
                  status: ORDER_STATUS.DELIVERED,
                  updatedAt: { $gte: m.start, $lte: m.end },
                  isDeleted: { $ne: true },
                },
              },
              { $group: { _id: null, total: { $sum: "$totalAmount" } } },
            ]);
            return { month: m.label, total: result[0]?.total || 0 };
          }
        }),
      ),
      Order.aggregate([
        { $match: { ...shopFilter, isDeleted: { $ne: true } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    return res.status(200).json({
      ordersByMonth,
      revenueByMonth,
      ordersByStatus: ordersByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error("Error in getChartData:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/dashboard/recent-orders
export const getRecentOrders = async (req, res) => {
  try {
    const { user } = req;
    const isSuperAdmin = user.role === ROLES.SUPER_ADMIN;
    const shopFilter = isSuperAdmin ? {} : { shopId: user.shop };

    const orders = await Order.find({ ...shopFilter, isDeleted: { $ne: true } })
      .populate("customer", "name phone customerId")
      .populate("createdBy", "fullName")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    return res.status(200).json(orders);
  } catch (error) {
    console.error("Error in getRecentOrders:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/dashboard/upcoming-deliveries
export const getUpcomingDeliveries = async (req, res) => {
  try {
    const { user } = req;
    const isSuperAdmin = user.role === ROLES.SUPER_ADMIN;
    const shopFilter = isSuperAdmin ? {} : { shopId: user.shop };

    const now = new Date();

    const orders = await Order.find({
      ...shopFilter,
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
    console.error("Error in getUpcomingDeliveries:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/dashboard/latest-customers
export const getLatestCustomers = async (req, res) => {
  try {
    const { user } = req;
    const isSuperAdmin = user.role === ROLES.SUPER_ADMIN;
    const shopFilter = isSuperAdmin ? {} : { shopId: user.shop };

    const customers = await Customer.find({
      ...shopFilter,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    return res.status(200).json(customers);
  } catch (error) {
    console.error("Error in getLatestCustomers:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/dashboard/admin-recent-payments
export const getAdminRecentPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("shop", "name logo owner")
      .populate("recordedBy", "fullName")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    return res.status(200).json(payments);
  } catch (error) {
    console.error("Error in getAdminRecentPayments:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/dashboard/admin-upcoming-renewals
export const getAdminUpcomingRenewals = async (req, res) => {
  try {
    const shops = await Shop.find()
      .populate("owner", "fullName mobile email")
      .sort({ subscriptionExpiry: 1 })
      .limit(6)
      .lean();

    return res.status(200).json(shops);
  } catch (error) {
    console.error("Error in getAdminUpcomingRenewals:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
