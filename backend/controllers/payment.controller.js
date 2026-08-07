import Payment, { PAYMENT_METHOD } from "../models/payment.model.js";
import Shop from "../models/shop.model.js";
import dayjs from "dayjs";

const PLAN_MONTHS = {
  monthly: 1,
  quarterly: 3,
  "half-yearly": 6,
  yearly: 12,
};

// POST /api/payments/receive
export const receivePayment = async (req, res) => {
  try {
    const { shopId } = req.params;
    const {
      amount,
      paymentMethod,
      referenceNo,
      notes,
      subscriptionPlan,
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "Valid payment amount is required" });
    }

    if (!subscriptionPlan) {
      return res.status(400).json({ error: "Subscription plan is required" });
    }

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    const previousExpiry = shop.subscriptionExpiry
      ? new Date(shop.subscriptionExpiry)
      : new Date();

    const startFrom = previousExpiry > new Date() ? previousExpiry : new Date();
    let months = PLAN_MONTHS[subscriptionPlan] || 1;
    const newExpiry = dayjs(startFrom).add(months, "month").toDate();

    shop.subscriptionPlan = subscriptionPlan;
    shop.subscriptionStart = startFrom;
    shop.subscriptionExpiry = newExpiry;
    shop.subscriptionAmount = Number(shop.subscriptionAmount) + Number(amount);
    shop.amountReceived = Number(shop.amountReceived) + Number(amount);
    await shop.save();

    const payment = await Payment.create({
      shop: shopId,
      amount: Number(amount),
      paymentMethod: paymentMethod || "cash",
      referenceNo: referenceNo || "",
      notes: notes || "",
      subscriptionPlan,
      previousExpiry,
      newExpiry,
      recordedBy: req.user._id,
    });

    return res.status(201).json({
      message: "Payment recorded successfully",
      payment,
      shop: {
        subscriptionPlan: shop.subscriptionPlan,
        subscriptionStart: shop.subscriptionStart,
        subscriptionExpiry: shop.subscriptionExpiry,
        amountReceived: shop.amountReceived,
      },
    });
  } catch (error) {
    console.error("Error in receivePayment:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/payments/shop/:shopId
export const getShopPayments = async (req, res) => {
  try {
    const { shopId } = req.params;

    const shop = await Shop.findById(shopId).populate("owner", "fullName email");
    if (!shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    const payments = await Payment.find({ shop: shopId })
      .sort({ createdAt: -1 })
      .populate("recordedBy", "fullName");

    return res.status(200).json({ shop, payments });
  } catch (error) {
    console.error("Error in getShopPayments:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
