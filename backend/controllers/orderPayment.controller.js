import mongoose from "mongoose";
import OrderPayment from "../models/orderPayment.model.js";
import Order from "../models/order.model.js";

// Generate unique payment ID: PAY-YYYYMMDD-XXXX
const generatePaymentId = async (shopId) => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `PAY-${dateStr}`;

  const count = await OrderPayment.countDocuments({
    shopId,
    paymentId: { $regex: `^${prefix}` },
  });

  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
};

// GET /api/order-payments/all
export const getAllPayments = async (req, res) => {
  try {
    const { shopId } = req;
    const { method, type, from, to, search, page = 1, limit = 50 } = req.query;

    const filter = { shopId, isVoided: false };

    if (method && method !== "all") {
      filter.method = method;
    }
    if (type && type !== "all") {
      filter.paymentType = type;
    }
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) {
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }
    if (search) {
      filter.$or = [
        { paymentId: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { orderNumber: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      OrderPayment.find(filter)
        .populate("receivedBy", "fullName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      OrderPayment.countDocuments(filter),
    ]);

    return res.status(200).json({
      payments,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("Error in getAllPayments:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/order-payments/summary
export const getPaymentSummary = async (req, res) => {
  try {
    const { shopId } = req;
    const shopOid = new mongoose.Types.ObjectId(shopId);

    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalCollected, todayCollection, monthCollection, pendingOrders] =
      await Promise.all([
        OrderPayment.aggregate([
          { $match: { shopId: shopOid, isVoided: false } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        OrderPayment.aggregate([
          {
            $match: {
              shopId: shopOid,
              isVoided: false,
              createdAt: { $gte: startOfDay },
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        OrderPayment.aggregate([
          {
            $match: {
              shopId: shopOid,
              isVoided: false,
              createdAt: { $gte: startOfMonth },
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Order.aggregate([
          {
            $match: {
              shopId: shopOid,
              isPaid: false,
              isDeleted: { $ne: true },
            },
          },
          { $group: { _id: null, total: { $sum: "$remainingBalance" } } },
        ]),
      ]);

    return res.status(200).json({
      totalCollected: totalCollected[0]?.total || 0,
      todayCollection: todayCollection[0]?.total || 0,
      monthCollection: monthCollection[0]?.total || 0,
      pendingAmount: pendingOrders[0]?.total || 0,
    });
  } catch (error) {
    console.error("Error in getPaymentSummary:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/order-payments/pending-orders
export const getPendingOrders = async (req, res) => {
  try {
    const { shopId } = req;
    const shopOid = new mongoose.Types.ObjectId(shopId);

    const orders = await Order.aggregate([
      { $match: { shopId: shopOid, isPaid: false, isDeleted: { $ne: true } } },
      {
        $lookup: {
          from: "tailorcustomers",
          localField: "customer",
          foreignField: "_id",
          as: "customerDoc",
        },
      },
      { $unwind: { path: "$customerDoc", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          orderNumber: 1,
          totalAmount: 1,
          advancePaid: 1,
          remainingBalance: 1,
          deliveryDate: 1,
          status: 1,
          createdAt: 1,
          customerName: "$customerDoc.name",
          customerPhone: "$customerDoc.phone",
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    return res.status(200).json(orders);
  } catch (error) {
    console.error("Error in getPendingOrders:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/order-payments/:id
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req;

    const payment = await OrderPayment.findOne({ _id: id, shopId })
      .populate("receivedBy", "fullName")
      .populate("order", "orderNumber totalAmount")
      .populate("customer", "name phone customerId");

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    return res.status(200).json(payment);
  } catch (error) {
    console.error("Error in getPaymentById:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// PUT /api/order-payments/void/:id
export const voidPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId, user } = req;
    const { reason = "" } = req.body;

    const payment = await OrderPayment.findOne({ _id: id, shopId });
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    if (payment.isVoided) {
      return res.status(400).json({ error: "Payment is already voided" });
    }

    payment.isVoided = true;
    payment.voidedAt = new Date();
    payment.voidedBy = user._id;
    payment.voidReason = reason;
    await payment.save();

    // Also reverse the payment on the order
    const Order = (await import("./order.model.js")).default;
    const order = await Order.findById(payment.order);
    if (order) {
      order.advancePaid = Math.max(0, order.advancePaid - payment.amount);
      order.remainingBalance = Math.max(
        0,
        order.totalAmount - order.advancePaid,
      );
      order.isPaid = order.remainingBalance <= 0;

      // Remove the matching entry from paymentHistory
      const idx = order.paymentHistory.findIndex(
        (p) =>
          p.amount === payment.amount &&
          p.method === payment.method &&
          new Date(p.receivedAt).getTime() ===
            new Date(payment.createdAt).getTime(),
      );
      if (idx > -1) {
        order.paymentHistory.splice(idx, 1);
      }
      await order.save();
    }

    return res
      .status(200)
      .json({ message: "Payment voided successfully", payment });
  } catch (error) {
    console.error("Error in voidPayment:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export { generatePaymentId };

// POST /api/order-payments/backfill
export const backfillPayments = async (req, res) => {
  try {
    const { shopId } = req;
    const orders = await Order.find({
      shopId,
      "paymentHistory.0": { $exists: true },
    }).populate("customer", "name phone customerId");

    let created = 0;
    let skipped = 0;

    for (const order of orders) {
      for (const ph of order.paymentHistory) {
        // Check if this payment was already backfilled (match by order + amount + date)
        const existing = await OrderPayment.findOne({
          shopId,
          order: order._id,
          amount: ph.amount,
          createdAt: {
            $gte: new Date(new Date(ph.receivedAt).getTime() - 1000),
            $lte: new Date(new Date(ph.receivedAt).getTime() + 1000),
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        const paymentId = await generatePaymentId(shopId);
        const method = ph.method === "online" ? "bank" : ph.method;

        await OrderPayment.create({
          shopId,
          order: order._id,
          customer: order.customer?._id || order.customer,
          orderNumber: order.orderNumber,
          customerName: order.customer?.name || "Unknown",
          paymentId,
          amount: ph.amount,
          method,
          paymentType: ph.paymentType || "partial",
          referenceNo: ph.referenceNo || "",
          note: ph.note || "",
          receivedBy: ph.receivedBy,
          createdAt: ph.receivedAt,
          updatedAt: ph.receivedAt,
        });
        created++;
      }
    }

    return res
      .status(200)
      .json({ message: "Backfill complete", created, skipped });
  } catch (error) {
    console.error("Error in backfillPayments:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
