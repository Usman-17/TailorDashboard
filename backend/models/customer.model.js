import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
    },

    measurement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Measurement",
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
  }
);

const Customer = mongoose.model("Customer", customerSchema);
export default Customer;
