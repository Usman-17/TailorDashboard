import Order, { ORDER_STATUS, PAYMENT_METHOD } from "../models/order.model.js";
import Customer from "../models/tailorCustomer.model.js";
import Counter from "../models/counter.model.js";
import Shop from "../models/shop.model.js";
import { ROLES } from "../models/user.model.js";

const VALID_TRANSITIONS = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.IN_PROGRESS]: [ORDER_STATUS.READY, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.READY]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: [],
};

// GET /api/orders/all
export const getAllOrders = async (req, res) => {
  try {
    const { shopId } = req;
    const {
      page = 1,
      limit = 20,
      search = "",
      status = "",
      sortBy = "createdAt",
      order = "desc",
      from = "",
      to = "",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = { shopId };

    if (status) {
      filter.status = status;
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDate;
      }
    }

    if (search) {
      const customers = await Customer.find({
        shopId,
        $or: [
          { name: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { customerId: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      filter.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { customer: { $in: customers.map((c) => c._id) } },
      ];
    }

    const allowedSorts = [
      "orderNumber",
      "deliveryDate",
      "totalAmount",
      "status",
      "createdAt",
    ];
    const sortField = allowedSorts.includes(sortBy) ? sortBy : "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("customer", "name phone customerId")
        .populate("createdBy", "fullName")
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error in getAllOrders:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/orders/:id
export const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req;

    const order = await Order.findOne({ _id: id, shopId })
      .populate("customer", "name phone customerId")
      .populate("measurement")
      .populate("createdBy", "fullName")
      .populate("statusHistory.changedBy", "fullName")
      .populate("paymentHistory.receivedBy", "fullName");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.status(200).json(order);
  } catch (error) {
    console.error("Error in getOrder:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/orders/next-number
export const getNextOrderNumber = async (req, res) => {
  try {
    const { shopId } = req;
    const counter = await Counter.findOne({ shopId, name: "order" });
    const currentVal = counter ? counter.value : 0;
    const nextNum = `ORD-${String(currentVal + 1).padStart(4, "0")}`;
    return res.status(200).json({ nextOrderNumber: nextNum });
  } catch (error) {
    console.error("Error in getNextOrderNumber:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST /api/orders/add
export const addOrder = async (req, res) => {
  try {
    const { shopId, user } = req;
    const {
      customer,
      measurement,
      items,
      deliveryDate,
      advancePaid = 0,
      priority = "normal",
      notes = "",
      orderNumber: requestedOrderNumber,
    } = req.body;

    if (!customer || !deliveryDate || !items || !items.length) {
      return res
        .status(400)
        .json({ error: "Customer, delivery date, and items are required" });
    }

    const customerDoc = await Customer.findOne({ _id: customer, shopId });
    if (!customerDoc) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const processedItems = items.map((item) => {
      if (
        !item.suitType ||
        item.unitPrice === undefined ||
        item.unitPrice === null
      ) {
        throw new Error("Each item must have suitType and unitPrice");
      }
      const qty = item.quantity || 1;
      return {
        suitType: item.suitType,
        dressType: item.dressType || item.suitType || "",
        lowerType: item.lowerType || "",
        collarType: item.collarType || "",
        collarDetail: item.collarDetail || "",
        cuffType: item.cuffType || "",
        pocket: item.pocket || "",
        fabric: item.fabric || "",
        color: item.color || "",
        description: item.description || "",
        quantity: qty,
        unitPrice: item.unitPrice,
        totalPrice: qty * item.unitPrice,
      };
    });

    const totalAmount = processedItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0,
    );

    if (advancePaid < 0 || advancePaid > totalAmount) {
      return res.status(400).json({
        error: "Advance payment must be between 0 and total amount",
      });
    }

    let orderNumber = requestedOrderNumber?.trim();
    if (!orderNumber) {
      const orderNum = await Counter.getNextValue(shopId, "order");
      orderNumber = `ORD-${String(orderNum).padStart(4, "0")}`;
    }

    const order = await Order.create({
      orderNumber,
      shopId,
      customer,
      measurement: measurement || null,
      items: processedItems,
      deliveryDate: new Date(deliveryDate),
      totalAmount,
      advancePaid,
      remainingBalance: totalAmount - advancePaid,
      isPaid: advancePaid >= totalAmount,
      priority,
      notes,
      createdBy: user._id,
      statusHistory: [
        {
          status: ORDER_STATUS.PENDING,
          changedBy: user._id,
          changedAt: new Date(),
          note: "Order created",
        },
      ],
      paymentHistory:
        advancePaid > 0
          ? [
              {
                amount: advancePaid,
                method: PAYMENT_METHOD.CASH,
                note: "Advance payment",
                receivedBy: user._id,
                receivedAt: new Date(),
              },
            ]
          : [],
    });

    await Customer.findByIdAndUpdate(customer, {
      $push: { orders: order._id },
    });

    const populated = await order.populate([
      { path: "customer", select: "name phone customerId" },
      { path: "createdBy", select: "fullName" },
    ]);

    return res.status(201).json(populated);
  } catch (error) {
    console.error("Error in addOrder:", error.message);
    if (error.code === 11000) {
      return res.status(409).json({ error: "Order number conflict" });
    }
    return res
      .status(500)
      .json({ error: error.message || "Internal Server Error" });
  }
};

// PUT /api/orders/update/:id
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req;
    const { items, deliveryDate, priority, notes } = req.body;

    const order = await Order.findOne({ _id: id, shopId });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (
      order.status === ORDER_STATUS.DELIVERED ||
      order.status === ORDER_STATUS.CANCELLED
    ) {
      return res.status(400).json({
        error: "Cannot update a delivered or cancelled order",
      });
    }

    if (items && items.length > 0) {
      order.items = items.map((item) => ({
        suitType: item.suitType,
        description: item.description || "",
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice,
        totalPrice: (item.quantity || 1) * item.unitPrice,
      }));
      order.calculateTotals();

      if (order.advancePaid > order.totalAmount) {
        order.advancePaid = order.totalAmount;
        order.remainingBalance = 0;
        order.isPaid = true;
      }
    }

    if (deliveryDate) order.deliveryDate = new Date(deliveryDate);
    if (priority) order.priority = priority;
    if (notes !== undefined) order.notes = notes;

    await order.save();

    const populated = await order.populate([
      { path: "customer", select: "name phone customerId" },
      { path: "createdBy", select: "fullName" },
    ]);

    return res.status(200).json(populated);
  } catch (error) {
    console.error("Error in updateOrder:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// PUT /api/orders/status/:id
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId, user } = req;
    const { status, note = "" } = req.body;

    if (!status || !Object.values(ORDER_STATUS).includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const order = await Order.findOne({ _id: id, shopId });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: `Cannot transition from "${order.status}" to "${status}"`,
      });
    }

    order.addStatusChange(status, user._id, note);
    await order.save();

    return res.status(200).json(order);
  } catch (error) {
    console.error("Error in updateOrderStatus:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST /api/orders/payment/:id
export const addPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId, user } = req;
    const { amount, method = "cash", note = "" } = req.body;

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ error: "Valid payment amount is required" });
    }

    if (!Object.values(PAYMENT_METHOD).includes(method)) {
      return res.status(400).json({ error: "Invalid payment method" });
    }

    const order = await Order.findOne({ _id: id, shopId });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.isPaid) {
      return res.status(400).json({ error: "Order is already fully paid" });
    }

    if (amount > order.remainingBalance) {
      return res.status(400).json({
        error: `Payment exceeds remaining balance of ${order.remainingBalance}`,
      });
    }

    order.addPayment(amount, method, user._id, note);
    await order.save();

    return res.status(200).json({
      message: "Payment recorded successfully",
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        advancePaid: order.advancePaid,
        remainingBalance: order.remainingBalance,
        isPaid: order.isPaid,
        paymentHistory: order.paymentHistory,
      },
    });
  } catch (error) {
    console.error("Error in addPayment:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// DELETE /api/orders/:id
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req;

    const order = await Order.findOne({ _id: id, shopId });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.status === ORDER_STATUS.DELIVERED) {
      return res.status(400).json({
        error: "Cannot delete a delivered order",
      });
    }

    order.isDeleted = true;
    order.deletedAt = new Date();
    await order.save();

    return res.status(200).json({ message: "Order moved to trash" });
  } catch (error) {
    console.error("Error in deleteOrder:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/orders/invoice/:id
export const generateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req;

    const order = await Order.findOne({ _id: id, shopId })
      .populate("customer", "name phone customerId")
      .populate("measurement")
      .populate("createdBy", "fullName");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const shop = await Shop.findById(shopId).select(
      "name address phone email settings",
    );

    const invoice = {
      invoiceNumber: order.orderNumber,
      invoiceDate: order.createdAt,
      dueDate: order.deliveryDate,
      shop: {
        name: shop?.name || "Tailor Shop",
        address: shop?.address || {},
        phone: shop?.phone || "",
        email: shop?.email || "",
        currency: shop?.settings?.currency || "PKR",
      },
      customer: {
        name: order.customer.name,
        phone: order.customer.phone,
        customerId: order.customer.customerId,
        email: order.customer.email || "",
        address: order.customer.address || null,
      },
      items: order.items.map((item) => ({
        description: `${item.suitType}${item.description ? ` - ${item.description}` : ""}`,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.totalPrice,
      })),
      measurement: order.measurement || null,
      summary: {
        totalAmount: order.totalAmount,
        advancePaid: order.advancePaid,
        remainingBalance: order.remainingBalance,
        isPaid: order.isPaid,
        status: order.status,
      },
      payments: order.paymentHistory.map((p) => ({
        amount: p.amount,
        method: p.method,
        date: p.receivedAt,
        note: p.note,
      })),
      notes: order.notes,
    };

    return res.status(200).json(invoice);
  } catch (error) {
    console.error("Error in generateInvoice:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/orders/dashboard
export const getDashboardStats = async (req, res) => {
  try {
    const { shopId } = req;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const [
      totalOrders,
      pendingOrders,
      inProgressOrders,
      readyOrders,
      deliveredThisMonth,
      cancelledOrders,
      revenueThisMonth,
      pendingPayments,
      overdueOrders,
    ] = await Promise.all([
      Order.countDocuments({ shopId }),
      Order.countDocuments({ shopId, status: ORDER_STATUS.PENDING }),
      Order.countDocuments({ shopId, status: ORDER_STATUS.IN_PROGRESS }),
      Order.countDocuments({ shopId, status: ORDER_STATUS.READY }),
      Order.countDocuments({
        shopId,
        status: ORDER_STATUS.DELIVERED,
        updatedAt: { $gte: startOfMonth, $lte: endOfMonth },
      }),
      Order.countDocuments({ shopId, status: ORDER_STATUS.CANCELLED }),
      Order.aggregate([
        {
          $match: {
            shopId,
            status: ORDER_STATUS.DELIVERED,
            updatedAt: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Order.aggregate([
        {
          $match: {
            shopId,
            isPaid: false,
            isDeleted: { $ne: true },
          },
        },
        { $group: { _id: null, total: { $sum: "$remainingBalance" } } },
      ]),
      Order.countDocuments({
        shopId,
        status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.IN_PROGRESS] },
        deliveryDate: { $lt: now },
      }),
    ]);

    return res.status(200).json({
      totalOrders,
      pendingOrders,
      inProgressOrders,
      readyOrders,
      deliveredThisMonth,
      cancelledOrders,
      revenueThisMonth: revenueThisMonth[0]?.total || 0,
      pendingPayments: pendingPayments[0]?.total || 0,
      overdueOrders,
    });
  } catch (error) {
    console.error("Error in getDashboardStats:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/orders/sales
export const getSalesByDateRange = async (req, res) => {
  try {
    const { shopId } = req;
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: "From and to dates are required" });
    }

    const fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      shopId,
      status: ORDER_STATUS.DELIVERED,
      updatedAt: { $gte: fromDate, $lte: toDate },
    }).populate("customer", "name phone");

    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );
    const totalCollected = orders.reduce(
      (sum, order) => sum + order.advancePaid,
      0,
    );

    return res.status(200).json({
      totalRevenue,
      totalCollected,
      totalPending: totalRevenue - totalCollected,
      totalOrders: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Error in getSalesByDateRange:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
