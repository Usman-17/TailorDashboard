import Order from "../models/order.model.js";

// PATH     : /api/order/add
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
