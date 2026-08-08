import Measurement from "../models/measurement.model.js";
import TailorCustomer from "../models/tailorCustomer.model.js";

const MEASUREMENT_FIELDS = [
  "length",
  "shoulder",
  "chest",
  "waist",
  "hip",
  "neck",
  "sleeveLength",
  "armHole",
  "bicep",
  "cuff",
  "shalwarLength",
  "shalwarWaist",
  "shalwarHip",
  "thigh",
  "knee",
  "bottom",
];

// GET /api/measurements/all
export const getAllMeasurements = async (req, res) => {
  try {
    const { shopId } = req;
    const { page = 1, limit = 20, search = "" } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = { shopId };

    if (search) {
      const customers = await TailorCustomer.find({
        shopId,
        $or: [
          { name: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      filter.customer = { $in: customers.map((c) => c._id) };
    }

    const [measurements, total] = await Promise.all([
      Measurement.find(filter)
        .populate("customer", "name phone customerId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Measurement.countDocuments(filter),
    ]);

    return res.status(200).json({
      measurements,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error in getAllMeasurements:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/measurements/:customerId
export const getMeasurementById = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { shopId } = req;

    const measurement = await Measurement.findOne({
      customer: customerId,
      shopId,
    }).populate("customer", "name phone customerId");

    if (!measurement) {
      return res.status(404).json({ error: "Measurement not found" });
    }

    return res.status(200).json(measurement);
  } catch (error) {
    console.error("Error in getMeasurementById:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST /api/measurements/add/:customerId
export const addMeasurement = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { shopId } = req;

    const customer = await TailorCustomer.findOne({ _id: customerId, shopId });
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const existing = await Measurement.findOne({
      customer: customerId,
      shopId,
    });
    if (existing) {
      return res
        .status(409)
        .json({ error: "Measurement already exists for this customer" });
    }

    const missingFields = MEASUREMENT_FIELDS.filter(
      (field) => req.body[field] === undefined || req.body[field] === null,
    );
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const measurementData = { shopId, customer: customerId };

    // Handle lower type
    if (req.body.lower && req.body.lower.type) {
      if (!["shalwar", "trouser"].includes(req.body.lower.type)) {
        return res
          .status(400)
          .json({
            error: "Invalid lower type. Must be 'shalwar' or 'trouser'",
          });
      }
      measurementData.lower = { type: req.body.lower.type };
    }

    for (const field of MEASUREMENT_FIELDS) {
      const value = Number(req.body[field]);
      if (isNaN(value) || value < 0) {
        return res.status(400).json({
          error: `${field} must be a valid non-negative number`,
        });
      }
      measurementData[field] = value;
    }
    if (req.body.remarks !== undefined) {
      measurementData.remarks = req.body.remarks;
    }

    const measurement = await Measurement.create(measurementData);

    await TailorCustomer.findByIdAndUpdate(customerId, {
      measurement: measurement._id,
    });

    return res.status(201).json(measurement);
  } catch (error) {
    console.error("Error in addMeasurement:", error.message);
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ error: "Measurement already exists for this customer" });
    }
    return res.status(500).json({ error: error.message });
  }
};

// PUT /api/measurements/update/:customerId
export const updateMeasurement = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { shopId } = req;

    const measurement = await Measurement.findOne({
      customer: customerId,
      shopId,
    });
    if (!measurement) {
      return res.status(404).json({ error: "Measurement not found" });
    }

    for (const field of MEASUREMENT_FIELDS) {
      if (req.body[field] !== undefined) {
        const value = Number(req.body[field]);
        if (isNaN(value) || value < 0) {
          return res.status(400).json({
            error: `${field} must be a valid non-negative number`,
          });
        }
        measurement[field] = value;
      }
    }

    // Handle lower type
    if (req.body.lower && req.body.lower.type) {
      if (!["shalwar", "trouser"].includes(req.body.lower.type)) {
        return res
          .status(400)
          .json({
            error: "Invalid lower type. Must be 'shalwar' or 'trouser'",
          });
      }
      measurement.lower = { type: req.body.lower.type };
    }

    if (req.body.remarks !== undefined) {
      measurement.remarks = req.body.remarks;
    }

    const updated = await measurement.save();
    return res.status(200).json(updated);
  } catch (error) {
    console.error("Error in updateMeasurement:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// DELETE /api/measurements/:customerId
export const deleteMeasurement = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { shopId } = req;

    const measurement = await Measurement.findOne({
      customer: customerId,
      shopId,
    });
    if (!measurement) {
      return res.status(404).json({ error: "Measurement not found" });
    }

    await TailorCustomer.findByIdAndUpdate(customerId, {
      $unset: { measurement: "" },
    });

    await Measurement.findByIdAndDelete(measurement._id);

    return res
      .status(200)
      .json({ message: "Measurement deleted successfully" });
  } catch (error) {
    console.error("Error in deleteMeasurement:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
