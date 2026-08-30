import mongoose from "mongoose";

const tailorCustomerSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      required: true,
    },

    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: [true, "Shop ID is required"],
    },

    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      maxlength: 100,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },

    measurement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Measurement",
      default: null,
    },

    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
  },
  {
    timestamps: true,
  },
);

tailorCustomerSchema.index({ shopId: 1, customerId: 1 }, { unique: true });
tailorCustomerSchema.index({ shopId: 1, phone: 1 });

const TailorCustomer = mongoose.model("TailorCustomer", tailorCustomerSchema);

// Drop stale single-field unique index if present
TailorCustomer.collection.dropIndex("shopId_1").catch(() => {});
TailorCustomer.collection.dropIndex("phone_1").catch(() => {});
TailorCustomer.collection.dropIndex("customerId_1").catch(() => {});

export default TailorCustomer;
