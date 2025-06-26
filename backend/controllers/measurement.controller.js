import Customer from "../models/customer.model.js";
import Measurement from "../models/measurement.model.js";

// PATH     : /api/measurements/customerId
// METHOD   : GET
// ACCESS   : PRIVATE
// DESC     : Get a single measurement by ID
export const getMeasurementById = async (req, res) => {
  const { customerId } = req.params;

  try {
    const measurement = await Measurement.findOne({
      customer: customerId,
    }).populate("customer", "name phone");

    if (!measurement) {
      return res.status(404).json({ message: "Measurement not found" });
    }

    res.status(200).json(measurement);
  } catch (error) {
    console.error("Error in getMeasurementById controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// PATH     : /api/measurements/all
// METHOD   : GET
// ACCESS   : PRIVATE
// DESC     : Get all Measurements
export const getAllMeasurements = async (req, res) => {
  try {
    const measurements = await Measurement.find()
      .populate("customer", "name phone")
      .sort({ createdAt: -1 });

    res.status(200).json(measurements);
  } catch (error) {
    console.error("Error in getAllMeasurements controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// PATH   : /api/measurements/add/customerId
// METHOD : POST
// ACCESS : PRIVATE
// DESC   : Add new measurement for a customer
export const addMeasurement = async (req, res) => {
  try {
    const { customerId } = req.params;

    const {
      length,
      shoulder,
      chest,
      waist,
      hip,
      neck,
      sleeveLength,
      wrist,
      bicep,
      shalwarLength,
      thigh,
      knee,
      bottom,
      pantWaist,
    } = req.body;

    // Validate all fields are provided
    if (
      !length ||
      !shoulder ||
      !chest ||
      !waist ||
      !hip ||
      !neck ||
      !sleeveLength ||
      !wrist ||
      !bicep ||
      !shalwarLength ||
      !thigh ||
      !knee ||
      !bottom ||
      !pantWaist
    ) {
      return res
        .status(400)
        .json({ message: "All measurement fields are required" });
    }

    const existing = await Measurement.findOne({ customer: customerId });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Measurement already exists for this customer" });
    }

    // Create measurement
    const measurement = await Measurement.create({
      customer: customerId,
      length,
      shoulder,
      chest,
      waist,
      hip,
      neck,
      sleeveLength,
      wrist,
      bicep,
      shalwarLength,
      thigh,
      knee,
      bottom,
      pantWaist,
    });

    // Link measurement to customer
    await Customer.findByIdAndUpdate(customerId, {
      measurement: measurement._id,
    });

    return res.status(201).json({
      message: "Measurement added successfully",
      measurement,
    });
  } catch (error) {
    console.error("Error in addMeasurement controller:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// PATH     : /api/measurements/update/customerId
// METHOD   : PUT
// ACCESS   : PRIVATE
// DESC     : Update Measurement
export const updateMeasurement = async (req, res) => {
  try {
    const { customerId } = req.params;
    const {
      length,
      shoulder,
      chest,
      waist,
      hip,
      neck,
      sleeveLength,
      wrist,
      bicep,
      shalwarLength,
      thigh,
      knee,
      bottom,
      pantWaist,
    } = req.body;

    const measurement = await Measurement.findOne({ customer: customerId });
    if (!measurement)
      return res.status(404).json({ message: "Measurement not found" });

    if (length) measurement.length = length;
    if (shoulder) measurement.shoulder = shoulder;
    if (chest) measurement.chest = chest;
    if (waist) measurement.waist = waist;
    if (hip) measurement.hip = hip;
    if (neck) measurement.neck = neck;
    if (sleeveLength) measurement.sleeveLength = sleeveLength;
    if (wrist) measurement.wrist = wrist;
    if (bicep) measurement.bicep = bicep;
    if (shalwarLength) measurement.shalwarLength = shalwarLength;
    if (thigh) measurement.thigh = thigh;
    if (knee) measurement.knee = knee;
    if (bottom) measurement.bottom = bottom;
    if (pantWaist) measurement.pantWaist = pantWaist;

    const updated = await measurement.save();
    res.status(200).json(updated);
  } catch (error) {
    console.error("Error in updateMeasurement controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// PATH     : /api/measurements/customerId
// METHOD   : DELETE
// ACCESS   : PRIVATE
// DESC     : Delete a measurement by ID
export const deleteMeasurement = async (req, res) => {
  const { customerId } = req.params;

  try {
    const measurement = await Measurement.findOne({ customer: customerId });

    if (!measurement)
      return res.status(404).json({ message: "Measurement not found" });

    // Remove reference from customer
    await Customer.findByIdAndUpdate(customerId, {
      $unset: { measurement: "" },
    });

    await Measurement.findByIdAndDelete(measurement._id);

    res.status(200).json({ message: "Measurement deleted successfully" });
  } catch (error) {
    console.error("Error in deleteMeasurement controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
