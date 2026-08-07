import mongoose from "mongoose";

const PAYMENT_METHOD = {
  CASH: "cash",
  JAZZCASH: "jazzcash",
  EASYPaisa: "easypaisa",
  BANK: "bank",
  OTHER: "other",
};

const paymentSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      default: PAYMENT_METHOD.CASH,
    },
    referenceNo: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    subscriptionPlan: {
      type: String,
      required: true,
    },
    previousExpiry: {
      type: Date,
      default: null,
    },
    newExpiry: {
      type: Date,
      default: null,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ shop: 1 });
paymentSchema.index({ createdAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

export { PAYMENT_METHOD };
export default Payment;
