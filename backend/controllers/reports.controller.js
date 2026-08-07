import Shop from "../models/shop.model.js";
import Payment from "../models/payment.model.js";

// Helper: start/end of a period
const periodRange = (type) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (type === "today") {
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    return { start: today, end };
  }

  if (type === "week") {
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay()); // Sunday
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (type === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  if (type === "year") {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { start, end };
  }

  return null;
};

const sumPayments = async (start, end) => {
  const result = await Payment.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return result[0]?.total || 0;
};

// GET /api/reports?period=today|week|month|year
export const getAdminReports = async (req, res) => {
  try {
    const period = req.query.period || "month";
    const range = periodRange(period);

    const now = new Date();

    // ── Revenue Report ──────────────────────────────────
    const [todayRev, weekRev, monthRev, yearRev] = await Promise.all([
      sumPayments(...Object.values(periodRange("today"))),
      sumPayments(...Object.values(periodRange("week"))),
      sumPayments(...Object.values(periodRange("month"))),
      sumPayments(...Object.values(periodRange("year"))),
    ]);

    // Revenue chart data (monthly series for selected period)
    // Build 12-month chart for year, 7-day chart for week, 30-day for month, single day for today
    let chartLabels = [];
    let chartData = [];

    if (period === "today") {
      for (let h = 0; h < 24; h++) {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, 59, 59, 999);
        const total = await sumPayments(start, end);
        chartLabels.push(`${String(h).padStart(2, "0")}:00`);
        chartData.push(total);
      }
    } else if (period === "week") {
      const weekStart = periodRange("week").start;
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      for (let d = 0; d < 7; d++) {
        const start = new Date(weekStart);
        start.setDate(weekStart.getDate() + d);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        const total = await sumPayments(start, end);
        chartLabels.push(dayNames[start.getDay()]);
        chartData.push(total);
      }
    } else if (period === "month") {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const start = new Date(now.getFullYear(), now.getMonth(), d, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), d, 23, 59, 59, 999);
        const total = await sumPayments(start, end);
        chartLabels.push(`${d}`);
        chartData.push(total);
      }
    } else if (period === "year") {
      for (let m = 0; m < 12; m++) {
        const start = new Date(now.getFullYear(), m, 1);
        const end = new Date(now.getFullYear(), m + 1, 0, 23, 59, 59, 999);
        const total = await sumPayments(start, end);
        chartLabels.push(start.toLocaleString("default", { month: "short" }));
        chartData.push(total);
      }
    }

    // ── Shop Report ─────────────────────────────────────
    const allShops = await Shop.find({}).select("isActive subscriptionExpiry subscriptionPlan").lean();
    const totalShops = allShops.length;
    let activeShops = 0, expiredShops = 0, suspendedShops = 0;

    allShops.forEach((s) => {
      if (s.isActive === "suspended") suspendedShops++;
      else if (s.isActive === "expired" || (s.subscriptionExpiry && new Date(s.subscriptionExpiry) < now)) expiredShops++;
      else activeShops++;
    });

    // ── Subscription Report ──────────────────────────────
    const planCounts = { monthly: 0, quarterly: 0, "half-yearly": 0, yearly: 0, custom: 0 };
    allShops.forEach((s) => {
      const p = s.subscriptionPlan || "custom";
      planCounts[p] = (planCounts[p] || 0) + 1;
    });

    // ── Renewal Report ───────────────────────────────────
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);

    const weekEndDate = new Date(todayStart);
    weekEndDate.setDate(todayStart.getDate() + 7);
    weekEndDate.setHours(23, 59, 59, 999);

    const monthEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    let expireToday = 0, expireThisWeek = 0, expireThisMonth = 0;

    allShops.forEach((s) => {
      if (!s.subscriptionExpiry) return;
      const exp = new Date(s.subscriptionExpiry);
      if (exp >= todayStart && exp <= todayEnd) expireToday++;
      if (exp >= todayStart && exp <= weekEndDate) expireThisWeek++;
      if (exp >= todayStart && exp <= monthEndDate) expireThisMonth++;
    });

    return res.status(200).json({
      revenue: {
        today: todayRev,
        week: weekRev,
        month: monthRev,
        year: yearRev,
      },
      shopReport: {
        total: totalShops,
        active: activeShops,
        expired: expiredShops,
        suspended: suspendedShops,
      },
      subscriptionReport: planCounts,
      renewalReport: {
        expireToday,
        expireThisWeek,
        expireThisMonth,
      },
      chart: {
        labels: chartLabels,
        data: chartData,
        period,
      },
    });
  } catch (error) {
    console.error("Error in getAdminReports:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
