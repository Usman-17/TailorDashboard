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
      index: true,
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

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const TailorCustomer = mongoose.model("TailorCustomer", tailorCustomerSchema);

export default TailorCustomer;
