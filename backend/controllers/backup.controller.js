import fs from "fs";
import TailorCustomer from "../models/tailorCustomer.model.js";
import Customer from "../models/customer.model.js";
import Measurement from "../models/measurement.model.js";
import Order from "../models/order.model.js";
import OrderPayment from "../models/orderPayment.model.js";
import Payment from "../models/payment.model.js";
import SuitType from "../models/suitType.model.js";

const REQUIRED_BACKUP_KEYS = [
  "customers",
  "measurements",
  "orders",
  "payments",
  "suitTypes",
];

/**
 * GET /api/backup/download
 * Export all data belonging to the authenticated tailor as downloadable JSON.
 */
export const downloadBackup = async (req, res) => {
  try {
    const tailorId = req.user?._id;
    const shopId = req.shopId || req.user?.shop || tailorId;

    if (!tailorId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const tenantFilter = {
      $or: [{ shopId }, { tailorId }],
    };

    // Fetch data belonging to the authenticated tailor
    const [tailorCustomers, generalCustomers, measurements, orders, orderPayments, generalPayments, suitTypes] =
      await Promise.all([
        TailorCustomer.find(tenantFilter).lean(),
        Customer.find(tenantFilter).lean(),
        Measurement.find(tenantFilter).lean(),
        Order.find(tenantFilter).lean(),
        OrderPayment.find(tenantFilter).lean(),
        Payment.find(tenantFilter).lean(),
        SuitType.find(tenantFilter).lean(),
      ]);

    // Combine any customers and payments records if present
    const customers = tailorCustomers.length > 0 ? tailorCustomers : generalCustomers;
    const payments = orderPayments.length > 0 ? orderPayments : generalPayments;

    const todayStr = new Date().toISOString().split("T")[0];
    const filename = `tailor-backup-${todayStr}.json`;

    const backupData = {
      version: "1.0",
      backupDate: new Date().toISOString(),
      customers,
      measurements,
      orders,
      payments,
      suitTypes,
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    return res.status(200).send(JSON.stringify(backupData, null, 2));
  } catch (error) {
    console.error("Error in downloadBackup:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to generate backup",
      error: error.message,
    });
  }
};

/**
 * POST /api/backup/restore
 * Restore data from uploaded backup JSON file for the authenticated tailor.
 */
export const restoreBackup = async (req, res) => {
  let tempFilePath = null;

  try {
    const tailorId = req.user?._id;
    const shopId = req.shopId || req.user?.shop || tailorId;

    if (!tailorId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let rawData = null;

    // Handle express-fileupload multipart/form-data
    if (req.files && req.files.backupFile) {
      const file = req.files.backupFile;
      if (file.tempFilePath) {
        tempFilePath = file.tempFilePath;
        rawData = fs.readFileSync(file.tempFilePath, "utf8");
      } else if (file.data) {
        rawData = file.data.toString("utf8");
      }
    } else if (req.body && typeof req.body === "object" && REQUIRED_BACKUP_KEYS.some((k) => k in req.body)) {
      // Direct JSON payload
      rawData = req.body;
    } else if (typeof req.body?.backupData === "string") {
      rawData = req.body.backupData;
    }

    if (!rawData) {
      return res.status(400).json({
        success: false,
        message: "Invalid backup file",
      });
    }

    // Parse JSON
    let backupPayload;
    if (typeof rawData === "string") {
      try {
        backupPayload = JSON.parse(rawData);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid backup file",
        });
      }
    } else {
      backupPayload = rawData;
    }

    // Structure validation
    if (!backupPayload || typeof backupPayload !== "object") {
      return res.status(400).json({
        success: false,
        message: "Invalid backup file",
      });
    }

    // Check all required keys exist and are arrays
    const hasAllKeys = REQUIRED_BACKUP_KEYS.every(
      (key) => key in backupPayload && Array.isArray(backupPayload[key])
    );

    if (!hasAllKeys) {
      return res.status(400).json({
        success: false,
        message: "Invalid backup file",
      });
    }

    const { customers, measurements, orders, payments, suitTypes } = backupPayload;

    const tenantFilter = {
      $or: [{ shopId }, { tailorId }],
    };

    // Step 1: Delete existing data belonging to current tailor
    await Promise.all([
      TailorCustomer.deleteMany(tenantFilter),
      Customer.deleteMany(tenantFilter),
      Measurement.deleteMany(tenantFilter),
      Order.deleteMany(tenantFilter),
      OrderPayment.deleteMany(tenantFilter),
      Payment.deleteMany(tenantFilter),
      SuitType.deleteMany(tenantFilter),
    ]);

    // Helper to format documents with authenticated tailor's ID and shopId
    const prepareDocs = (docs) => {
      if (!Array.isArray(docs) || docs.length === 0) return [];
      return docs.map((doc) => {
        const { __v, ...cleanedDoc } = doc;
        return {
          ...cleanedDoc,
          tailorId: tailorId,
          shopId: shopId,
        };
      });
    };

    const customersToInsert = prepareDocs(customers);
    const measurementsToInsert = prepareDocs(measurements);
    const ordersToInsert = prepareDocs(orders);
    const paymentsToInsert = prepareDocs(payments);
    const suitTypesToInsert = prepareDocs(suitTypes);

    // Step 2: Insert imported data
    if (customersToInsert.length > 0) {
      await TailorCustomer.insertMany(customersToInsert, { ordered: false });
    }

    if (measurementsToInsert.length > 0) {
      await Measurement.insertMany(measurementsToInsert, { ordered: false });
    }

    if (ordersToInsert.length > 0) {
      await Order.insertMany(ordersToInsert, { ordered: false });
    }

    if (paymentsToInsert.length > 0) {
      await OrderPayment.insertMany(paymentsToInsert, { ordered: false });
    }

    if (suitTypesToInsert.length > 0) {
      await SuitType.insertMany(suitTypesToInsert, { ordered: false });
    }

    return res.status(200).json({
      success: true,
      message: "Backup restored successfully",
      stats: {
        customers: customersToInsert.length,
        measurements: measurementsToInsert.length,
        orders: ordersToInsert.length,
        payments: paymentsToInsert.length,
        suitTypes: suitTypesToInsert.length,
      },
    });
  } catch (error) {
    console.error("Error in restoreBackup:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to restore backup",
      error: error.message,
    });
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupErr) {
        console.error("Error cleaning up temp backup file:", cleanupErr.message);
      }
    }
  }
};
