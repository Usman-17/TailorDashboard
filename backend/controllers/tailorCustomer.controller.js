import TailorCustomer from "../models/tailorCustomer.model.js";
import Measurement from "../models/measurement.model.js";
import Order from "../models/order.model.js";
import OrderPayment from "../models/orderPayment.model.js";
import Counter from "../models/counter.model.js";
import {
  checkIdempotency,
  storeIdempotencyResult,
} from "../middlewares/idempotency.js";

const PHONE_REGEX = /^(\+?92|0)?[3]\d{9}$/;

const validatePhone = (phone) => {
  if (!phone) return "Phone number is required";
  if (typeof phone !== "string") return "Phone must be a string";
  const cleaned = phone.replace(/[\s\-()]/g, "");
  if (!PHONE_REGEX.test(cleaned))
    return "Invalid Pakistani phone number format";
  return null;
};

// GET /api/customers/all?search=
export const getAllCustomers = async (req, res) => {
  try {
    const { shopId } = req;
    const { search = "" } = req.query;

    const filter = { shopId };

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [{ name: regex }, { phone: regex }, { customerId: regex }];
    }

    const customers = await TailorCustomer.find(filter)
      .populate("measurement")
      .populate("orders")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ customers });
  } catch (error) {
    console.error("Error in getAllCustomers:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/customers/:id/detail
export const getCustomerDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req;

    const customer = await TailorCustomer.findOne({ _id: id, shopId })
      .populate("measurement")
      .lean();

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const [orders, payments, measurements] = await Promise.all([
      Order.find({ shopId, customer: id, isDeleted: { $ne: true } })
        .populate("measurement", "lower createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      OrderPayment.find({ shopId, customer: id })
        .sort({ createdAt: -1 })
        .lean(),
      Measurement.find({ shopId, customer: id }).sort({ createdAt: -1 }).lean(),
    ]);

    return res.status(200).json({ customer, orders, payments, measurements });
  } catch (error) {
    console.error("Error in getCustomerDetail:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/customers/:id
export const getCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req;

    const customer = await TailorCustomer.findOne({ _id: id, shopId })
      .populate("measurement")
      .populate("orders");

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    return res.status(200).json(customer);
  } catch (error) {
    console.error("Error in getCustomer:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

// POST /api/customers/add
export const addCustomer = async (req, res) => {
  try {
    const { shopId } = req;
    const { name, phone, notes, clientId } = req.body;

    const idempotencyKey = clientId || req.headers["x-client-id"];
    if (idempotencyKey) {
      const { isDuplicate, result } = await checkIdempotency(
        idempotencyKey,
        "create-customer",
      );
      if (isDuplicate && result) {
        return res.status(200).json(result);
      }
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Customer name is required" });
    }

    const phoneError = validatePhone(phone);
    if (phoneError) {
      return res.status(400).json({ error: phoneError });
    }

    const cleanedPhone = phone.replace(/[\s\-()]/g, "");

    const customerNum = await Counter.getNextValue(shopId, "customer");
    const customerId = `C${String(customerNum).padStart(4, "0")}`;

    let customer;
    try {
      customer = await TailorCustomer.create({
        customerId,
        shopId,
        name: name.trim(),
        phone: cleanedPhone,
        notes: notes || "",
      });
    } catch (createErr) {
      if (createErr.code === 11000) {
        const keyPattern = createErr.keyPattern || {};

        if (keyPattern.shopId && !keyPattern.customerId && !keyPattern.phone) {
          try {
            await TailorCustomer.collection.dropIndex("shopId_1");
            customer = await TailorCustomer.create({
              customerId,
              shopId,
              name: name.trim(),
              phone: cleanedPhone,
              notes: notes || "",
            });
          } catch (retryErr) {
            if (retryErr.code === 11000) {
              const existing = await TailorCustomer.findOne({
                shopId,
                phone: cleanedPhone,
              }).lean();
              if (existing) {
                return res.status(200).json({ ...existing, duplicate: true });
              }
            }
            throw retryErr;
          }
        } else {
          if (keyPattern.phone || keyPattern.shopId) {
            const existing = await TailorCustomer.findOne({
              shopId,
              phone: cleanedPhone,
            }).lean();
            if (existing) {
              return res.status(200).json({ ...existing, duplicate: true });
            }
          }
          throw createErr;
        }
      } else {
        throw createErr;
      }
    }

    if (idempotencyKey) {
      await storeIdempotencyResult(
        idempotencyKey,
        "create-customer",
        customer.toObject(),
      );
    }

    return res.status(201).json(customer);
  } catch (error) {
    console.error("Error in addCustomer:", error.message);
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || "field";
      return res.status(400).json({ error: `This ${field} already exists` });
    }
    return res.status(500).json({ error: error.message });
  }
};

// PUT /api/customers/update/:id
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req;
    const { name, phone, notes } = req.body;

    const customer = await TailorCustomer.findOne({ _id: id, shopId });
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    if (phone) {
      const phoneError = validatePhone(phone);
      if (phoneError) {
        return res.status(400).json({ error: phoneError });
      }

      const cleanedPhone = phone.replace(/[\s\-()]/g, "");

      const existing = await TailorCustomer.findOne({
        shopId,
        phone: cleanedPhone,
        _id: { $ne: id },
      });
      if (existing) {
        return res
          .status(400)
          .json({ error: "A customer with this phone number already exists" });
      }

      customer.phone = cleanedPhone;
    }

    if (name !== undefined) customer.name = name.trim();
    if (notes !== undefined) customer.notes = notes;

    const updated = await customer.save();
    return res.status(200).json(updated);
  } catch (error) {
    console.error("Error in updateCustomer:", error.message);
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ error: `This ${field} already exists` });
    }
    return res.status(500).json({ error: error.message });
  }
};
