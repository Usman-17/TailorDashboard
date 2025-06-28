import Order from "../models/order.model.js";

// PATH     : /api/orders/add
// METHOD   : POST
// ACCESS   : PRIVATE
// DESC     : Add Customer Order
export const addOrder = async (req, res) => {
  try {
    const {
      customer,
      suitType,
      quantity,
      deliveryDate,
      totalAmount,
      advancePaid,
      notes,
    } = req.body;

    if (!customer || !deliveryDate || !totalAmount || !suitType) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const newOrder = await Order.create({
      customer,
      suitType,
      quantity,
      deliveryDate,
      totalAmount,
      advancePaid,
      notes,
    });

    res.status(201).json(newOrder);
  } catch (error) {
    console.error("Add Order Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// PATH     : /api/orders/all
// METHOD   : GET
// ACCESS   : PRIVATE
// DESC     : GEt All Customer Orders
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customer", "name phone")
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error("Get Orders Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// PATH     : /api/orders/status/:id
// METHOD   : POST
// ACCESS   : Private
// DESC     : update customers order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.status = status;
    await order.save();

    res.status(200).json({ message: "Order status updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATH     : /api/orders/sale
// METHOD   : POST
// ACCESS   : Private
// DESC     : get sale
export const getSalesByDateRange = async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ message: "From and to dates are required" });
  }

  try {
    const orders = await Order.find({
      createdAt: {
        $gte: new Date(from),
        $lte: new Date(to),
      },
    });

    const totalAmount = orders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    );

    res.status(200).json({
      totalAmount,
      totalOrders: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Error getting sales by date range:", error);
    res.status(500).json({ message: "Server error" });
  }
};
