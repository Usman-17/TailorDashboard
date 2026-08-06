import Customer from "../models/customer.model.js";
import Measurement from "../models/measurement.model.js";
import Counter from "../models/counter.model.js";

const PHONE_REGEX = /^(\+?92|0)?[3]\d{9}$/;

const validatePhone = (phone) => {
  if (!phone) return "Phone number is required";
  if (typeof phone !== "string") return "Phone must be a string";
  const cleaned = phone.replace(/[\s\-()]/g, "");
  if (!PHONE_REGEX.test(cleaned)) return "Invalid Pakistani phone number format";
  return null;
};

const sanitizeCustomer = (customer) => {
  const obj = customer.toObject ? customer.toObject() : { ...customer };
  delete obj.isDeleted;
  delete obj.deletedAt;
  return obj;
};

// GET /api/customers/all
export const getAllCustomers = async (req, res) => {
  try {
    const { shopId } = req;
    const {
      page = 1,
      limit = 20,
      search = "",
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = { shopId };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { customerId: { $regex: search, $options: "i" } },
      ];
    }

    const allowedSorts = ["name", "phone", "customerId", "createdAt"];
    const sortField = allowedSorts.includes(sortBy) ? sortBy : "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .populate("measurement")
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Customer.countDocuments(filter),
    ]);

    return res.status(200).json({
      customers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error in getAllCustomers:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/customers/trash
export const getDeletedCustomers = async (req, res) => {
  try {
    const { shopId } = req;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = { shopId, isDeleted: true };

    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Customer.countDocuments(filter),
    ]);

    return res.status(200).json({
      customers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error in getDeletedCustomers:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/customers/:id
export const getCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req;

    const customer = await Customer.findOne({ _id: id, shopId })
      .populate("measurement")
      .populate("orders");

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    return res.status(200).json(customer);
  } catch (error) {
    console.error("Error in getCustomer:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST /api/customers/add
export const addCustomer = async (req, res) => {
  try {
    const { shopId } = req;
    const { name, phone, email, address, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Customer name is required" });
    }

    const phoneError = validatePhone(phone);
    if (phoneError) {
      return res.status(400).json({ error: phoneError });
    }

    const cleanedPhone = phone.replace(/[\s\-()]/g, "");

    const existingPhone = await Customer.findOne({
      shopId,
      phone: cleanedPhone,
    });
    if (existingPhone) {
      return res.status(409).json({
        error: "A customer with this phone number already exists in your shop",
      });
    }

    const customerNum = await Counter.getNextValue(shopId, "customer");
    const customerId = `C${String(customerNum).padStart(4, "0")}`;

    const customer = await Customer.create({
      customerId,
      shopId,
      name: name.trim(),
      phone: cleanedPhone,
      email: email || undefined,
      address: address || undefined,
      notes: notes || "",
    });

    return res.status(201).json(customer);
  } catch (error) {
    console.error("Error in addCustomer:", error.message);
    if (error.code === 11000) {
      return res.status(409).json({
        error: "A customer with this phone number already exists in your shop",
      });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// PUT /api/customers/update/:id
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req;
    const { name, phone, email, address, notes } = req.body;

    const customer = await Customer.findOne({ _id: id, shopId });
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    if (phone) {
      const phoneError = validatePhone(phone);
      if (phoneError) {
        return res.status(400).json({ error: phoneError });
      }

      const cleanedPhone = phone.replace(/[\s\-()]/g, "");

      if (cleanedPhone !== customer.phone) {
        const existingPhone = await Customer.findOne({
          shopId,
          phone: cleanedPhone,
          _id: { $ne: id },
        });
        if (existingPhone) {
          return res.status(409).json({
            error:
              "A customer with this phone number already exists in your shop",
          });
        }
      }
      customer.phone = cleanedPhone;
    }

    if (name !== undefined) customer.name = name.trim();
    if (email !== undefined) customer.email = email || null;
    if (address !== undefined) customer.address = address;
    if (notes !== undefined) customer.notes = notes;

    const updated = await customer.save();
    return res.status(200).json(updated);
  } catch (error) {
    console.error("Error in updateCustomer:", error.message);
    if (error.code === 11000) {
      return res.status(409).json({
        error: "A customer with this phone number already exists in your shop",
      });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// DELETE /api/customers/:id
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req;

    const customer = await Customer.findOne({ _id: id, shopId });
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    customer.isDeleted = true;
    customer.deletedAt = new Date();
    await customer.save();

    return res.status(200).json({ message: "Customer moved to trash" });
  } catch (error) {
    console.error("Error in deleteCustomer:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// DELETE /api/customers/permanent/:id
export const permanentDeleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req;

    const customer = await Customer.findOne({ _id: id, shopId });
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    await Measurement.deleteOne({ customer: id });
    await Customer.findByIdAndDelete(id);

    return res.status(200).json({ message: "Customer permanently deleted" });
  } catch (error) {
    console.error("Error in permanentDeleteCustomer:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// PUT /api/customers/restore/:id
export const restoreCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req;

    const customer = await Customer.findOne({
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
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
