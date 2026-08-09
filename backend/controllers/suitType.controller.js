import SuitType from "../models/suitType.model.js";
import Order from "../models/order.model.js";

// GET /api/suit-types/all
export const getAllSuitTypes = async (req, res) => {
  try {
    const { shopId } = req;
    const { search = "", status = "" } = req.query;

    const filter = { shopId };

    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const suitTypes = await SuitType.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({ suitTypes });
  } catch (error) {
    console.error("Error in getAllSuitTypes:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/suit-types/active
export const getActiveSuitTypes = async (req, res) => {
  try {
    const { shopId } = req;
    const suitTypes = await SuitType.find({ shopId, isActive: true }).sort({
      name: 1,
    });
    return res.status(200).json({ suitTypes });
  } catch (error) {
    console.error("Error in getActiveSuitTypes:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST /api/suit-types/add
export const addSuitType = async (req, res) => {
  try {
    const { shopId } = req;
    const { name, price, description = "", isActive = true } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Suit type name is required" });
    }

    if (price === undefined || price === null || isNaN(price) || price < 0) {
      return res.status(400).json({ error: "Valid price is required" });
    }

    // Check duplicate name per shop (case-insensitive)
    const existing = await SuitType.findOne({
      shopId,
      name: { $regex: `^${name.trim()}$`, $options: "i" },
    });

    if (existing) {
      return res
        .status(400)
        .json({ error: `Suit type "${name.trim()}" already exists` });
    }

    const suitType = await SuitType.create({
      shopId,
      name: name.trim(),
      price: Number(price),
      description: description.trim(),
      isActive: Boolean(isActive),
    });

    return res.status(201).json(suitType);
  } catch (error) {
    console.error("Error in addSuitType:", error.message);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Suit type name already exists" });
    }
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

// PUT /api/suit-types/update/:id
export const updateSuitType = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req;
    const { name, price, description, isActive } = req.body;

    const suitType = await SuitType.findOne({ _id: id, shopId });
    if (!suitType) {
      return res.status(404).json({ error: "Suit type not found" });
    }

    if (name && name.trim().toLowerCase() !== suitType.name.toLowerCase()) {
      const existing = await SuitType.findOne({
        shopId,
        _id: { $ne: id },
        name: { $regex: `^${name.trim()}$`, $options: "i" },
      });

      if (existing) {
        return res
          .status(400)
          .json({ error: `Suit type "${name.trim()}" already exists` });
      }
      suitType.name = name.trim();
    }

    if (price !== undefined && price !== null) {
      if (isNaN(price) || price < 0) {
        return res.status(400).json({ error: "Valid price is required" });
      }
      suitType.price = Number(price);
    }

    if (description !== undefined) suitType.description = description.trim();
    if (isActive !== undefined) suitType.isActive = Boolean(isActive);

    await suitType.save();

    return res.status(200).json(suitType);
  } catch (error) {
    console.error("Error in updateSuitType:", error.message);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

// DELETE /api/suit-types/:id
export const deleteSuitType = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req;

    const orderCount = await Order.countDocuments({ shopId, suitType: id, isDeleted: { $ne: true } });
    if (orderCount > 0) {
      return res.status(400).json({
        error: `Cannot delete. This suit type is used in ${orderCount} order${orderCount > 1 ? "s" : ""}.`,
      });
    }

    const suitType = await SuitType.findOneAndDelete({ _id: id, shopId });
    if (!suitType) {
      return res.status(404).json({ error: "Suit type not found" });
    }

    return res.status(200).json({ message: "Suit type deleted successfully" });
  } catch (error) {
    console.error("Error in deleteSuitType:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
