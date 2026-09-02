import * as customerRepo from "../repos/customerRepo";
import * as orderRepo from "../repos/orderRepo";
import { getDashboardCache } from "../db/dashboardCache";

/**
 * Computes dashboard statistics from IndexedDB data.
 * Falls back to cached data from prior online sessions where appropriate.
 */
export async function getOfflineStats(shopId) {
  try {
    const [customers, orders, cached] = await Promise.all([
      customerRepo.getAll(shopId),
      orderRepo.getAll(shopId),
      getDashboardCache(shopId, "stats"),
    ]);

    const activeCustomers = (customers || []).filter((c) => !c.isDeleted);
    const activeOrders = (orders || []).filter((o) => !o.isDeleted);

    const totalCustomers = activeCustomers.length;
    const totalOrders = activeOrders.length;

    const pendingOrders = activeOrders.filter(
      (o) => o.status === "pending",
    ).length;
    const inProgressOrders = activeOrders.filter(
      (o) => o.status === "in_progress",
    ).length;
    const readyOrders = activeOrders.filter((o) => o.status === "ready").length;
    const deliveredOrders = activeOrders.filter(
      (o) => o.status === "delivered",
    ).length;
    const cancelledOrders = activeOrders.filter(
      (o) => o.status === "cancelled",
    ).length;

    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const todayDeliveries = activeOrders.filter((o) => {
      if (o.status !== "ready" && o.status !== "in_progress") return false;
      if (!o.deliveryDate) return false;
      const d = new Date(o.deliveryDate);
      return d >= startOfDay && d <= endOfDay;
    }).length;

    const overdueOrders = activeOrders.filter((o) => {
      if (!["pending", "in_progress", "ready"].includes(o.status)) return false;
      if (!o.deliveryDate) return false;
      const d = new Date(o.deliveryDate);
      return d < now;
    }).length;

    const base = cached?.data || {};

    return {
      totalCustomers: totalCustomers || base.totalCustomers || 0,
      totalOrders: totalOrders || base.totalOrders || 0,
      pendingOrders: totalOrders ? pendingOrders : base.pendingOrders || 0,
      inProgressOrders: totalOrders
        ? inProgressOrders
        : base.inProgressOrders || 0,
      readyOrders: totalOrders ? readyOrders : base.readyOrders || 0,
      deliveredOrders: totalOrders
        ? deliveredOrders
        : base.deliveredOrders || 0,
      cancelledOrders: totalOrders
        ? cancelledOrders
        : base.cancelledOrders || 0,
      todayDeliveries: totalOrders
        ? todayDeliveries
        : base.todayDeliveries || 0,
      overdueOrders: totalOrders ? overdueOrders : base.overdueOrders || 0,
      monthlyRevenue: base.monthlyRevenue || 0,
      todaysCollection: base.todaysCollection || 0,
      monthlyExpenses: base.monthlyExpenses || 0,
      netProfit: base.netProfit || 0,
      totalIncome: base.totalIncome || 0,
    };
  } catch (err) {
    console.warn("[getOfflineStats] Error computing offline stats:", err);
    return {
      totalCustomers: 0,
      totalOrders: 0,
      pendingOrders: 0,
      readyOrders: 0,
      overdueOrders: 0,
      todayDeliveries: 0,
      inProgressOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
    };
  }
}

/**
 * Computes charts data (monthly orders and status distribution) from IndexedDB.
 */
export async function getOfflineCharts(shopId) {
  try {
    const [orders, cached] = await Promise.all([
      orderRepo.getAll(shopId),
      getDashboardCache(shopId, "charts"),
    ]);

    const activeOrders = (orders || []).filter((o) => !o.isDeleted);
    const cachedData = cached?.data;

    // Status breakdown
    const ordersByStatus = {
      pending: activeOrders.filter((o) => o.status === "pending").length,
      in_progress: activeOrders.filter((o) => o.status === "in_progress")
        .length,
      ready: activeOrders.filter((o) => o.status === "ready").length,
      delivered: activeOrders.filter((o) => o.status === "delivered").length,
      cancelled: activeOrders.filter((o) => o.status === "cancelled").length,
    };

    const hasAnyStatus = Object.values(ordersByStatus).some((v) => v > 0);
    const finalStatus = hasAnyStatus
      ? ordersByStatus
      : cachedData?.ordersByStatus || ordersByStatus;

    // Last 6 months categories
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(
        d.getFullYear(),
        d.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
      const monthLabel = d.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

      const count = activeOrders.filter((o) => {
        const created = new Date(o.createdAt || 0);
        return created >= start && created <= end;
      }).length;

      months.push({ month: monthLabel, count });
    }

    const hasLocalMonthly = months.some((m) => m.count > 0);
    const finalMonths =
      hasLocalMonthly || !cachedData?.ordersByMonth?.length
        ? months
        : cachedData.ordersByMonth;

    return {
      ordersByMonth: finalMonths,
      revenueByMonth: cachedData?.revenueByMonth || [],
      ordersByStatus: finalStatus,
    };
  } catch (err) {
    console.warn("[getOfflineCharts] Error computing offline charts:", err);
    return {
      ordersByMonth: [],
      ordersByStatus: {
        pending: 0,
        in_progress: 0,
        ready: 0,
        delivered: 0,
        cancelled: 0,
      },
    };
  }
}

/**
 * Returns recent orders from IndexedDB.
 */
export async function getOfflineRecentOrders(shopId) {
  try {
    const [orders, cached] = await Promise.all([
      orderRepo.getAll(shopId),
      getDashboardCache(shopId, "recent-orders"),
    ]);

    const activeOrders = (orders || []).filter((o) => !o.isDeleted);
    if (activeOrders.length > 0) {
      return activeOrders
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 8)
        .map((o) => ({
          _id: o.serverId || o.localId,
          orderNumber: o.orderNumber || "-",
          customer: { name: o.customerName || "N/A" },
          totalAmount: o.totalAmount || 0,
          status: o.status || "pending",
          deliveryDate: o.deliveryDate,
          createdAt: o.createdAt,
        }));
    }

    return cached?.data || [];
  } catch (err) {
    console.warn("[getOfflineRecentOrders] Error:", err);
    return [];
  }
}

/**
 * Returns upcoming deliveries from IndexedDB.
 */
export async function getOfflineUpcomingDeliveries(shopId) {
  try {
    const [orders, cached] = await Promise.all([
      orderRepo.getAll(shopId),
      getDashboardCache(shopId, "upcoming-deliveries"),
    ]);

    const activeOrders = (orders || []).filter((o) => !o.isDeleted);
    if (activeOrders.length > 0) {
      return activeOrders
        .filter((o) => ["pending", "in_progress", "ready"].includes(o.status))
        .sort(
          (a, b) =>
            new Date(a.deliveryDate || 0) - new Date(b.deliveryDate || 0),
        )
        .slice(0, 8)
        .map((o) => ({
          _id: o.serverId || o.localId,
          orderNumber: o.orderNumber || "-",
          customer: { name: o.customerName || "N/A" },
          deliveryDate: o.deliveryDate,
          status: o.status || "pending",
          totalAmount: o.totalAmount || 0,
        }));
    }

    return cached?.data || [];
  } catch (err) {
    console.warn("[getOfflineUpcomingDeliveries] Error:", err);
    return [];
  }
}

/**
 * Returns latest customers from IndexedDB.
 */
export async function getOfflineLatestCustomers(shopId) {
  try {
    const [customers, cached] = await Promise.all([
      customerRepo.getAll(shopId),
      getDashboardCache(shopId, "latest-customers"),
    ]);

    const activeCustomers = (customers || []).filter((c) => !c.isDeleted);
    if (activeCustomers.length > 0) {
      return activeCustomers
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 8)
        .map((c) => ({
          _id: c.serverId || c.localId,
          customerId: c.customerId || "-",
          name: c.name || "N/A",
          phone: c.phone || "-",
          createdAt: c.createdAt,
        }));
    }

    return cached?.data || [];
  } catch (err) {
    console.warn("[getOfflineLatestCustomers] Error:", err);
    return [];
  }
}
