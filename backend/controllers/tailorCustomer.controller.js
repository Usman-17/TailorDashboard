import TailorCustomer from "../models/tailorCustomer.model.js";
import Measurement from "../models/measurement.model.js";
import Counter from "../models/counter.model.js";

const PHONE_REGEX = /^(\+?92|0)?[3]\d{9}$/;

const validatePhone = (phone) => {
  if (!phone) return "Phone number is required";
  if (typeof phone !== "string") return "Phone must be a string";
  const cleaned = phone.replace(/[\s\-()]/g, "");
  if (!PHONE_REGEX.test(cleaned))
    return "Invalid Pakistani phone number format";
  return null;
};

// GET /api/customers/all
export const getAllCustomers = async (req, res) => {
  try {
    const { shopId } = req;

    const customers = await TailorCustomer.find({ shopId })
      .populate("measurement")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ customers });
  } catch (error) {
    console.error("Error in getAllCustomers:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/customers/trash
export const getDeletedCustomers = async (req, res) => {
  try {
    const { shopId } = req;

    const customers = await TailorCustomer.find({ shopId, isDeleted: true })
      .sort({ deletedAt: -1 })
      .lean();

    return res.status(200).json({ customers });
  } catch (error) {
    console.error("Error in getDeletedCustomers:", error.message);
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
    const { name, phone, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Customer name is required" });
    }

    const phoneError = validatePhone(phone);
    if (phoneError) {
      return res.status(400).json({ error: phoneError });
    }

    const cleanedPhone = phone.replace(/[\s\-()]/g, "");

    const existing = await TailorCustomer.findOne({
      shopId,
      phone: cleanedPhone,
    });
    if (existing) {
      return res
        .status(400)
        .json({ error: "A customer with this phone number already exists" });
    }

    const customerNum = await Counter.getNextValue(shopId, "customer");
    const customerId = `C${String(customerNum).padStart(4, "0")}`;

    const customer = await TailorCustomer.create({
      customerId,
      shopId,
      name: name.trim(),
      phone: cleanedPhone,
      notes: notes || "",
    });

    return res.status(201).json(customer);
  } catch (error) {
    console.error("Error in addCustomer:", error.message);
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
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

// DELETE /api/customers/:id
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req;

    const customer = await TailorCustomer.findOne({ _id: id, shopId });
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    customer.isDeleted = true;
    customer.deletedAt = new Date();
    await customer.save();

    return res.status(200).json({ message: "Customer moved to trash" });
  } catch (error) {
    console.error("Error in deleteCustomer:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

// DELETE /api/customers/permanent/:id
export const permanentDeleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req;

    const customer = await TailorCustomer.findOne({ _id: id, shopId });
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    await Measurement.deleteOne({ customer: id });
    await TailorCustomer.findByIdAndDelete(id);

    return res.status(200).json({ message: "Customer permanently deleted" });
  } catch (error) {
    console.error("Error in permanentDeleteCustomer:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

// PUT /api/customers/restore/:id
export const restoreCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req;

    const customer = await TailorCustomer.findOne({
      _id: id,
      shopId,
      isDeleted: true,
    });
    if (!customer) {
      return res.status(404).json({ error: "Deleted customer not found" });
    }

    customer.isDeleted = false;
    customer.deletedAt = null;
    await customer.save();

    return res.status(200).json(customer);
  } catch (error) {
    console.error("Error in restoreCustomer:", error.message);
    return res.status(500).json({ error: error.message });
  }
};
