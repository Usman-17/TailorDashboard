import mongoose from "mongoose";

const PAYMENT_METHODS = ["cash", "bank", "jazzcash", "easypaisa"];
const PAYMENT_TYPES = ["advance", "partial", "final"];

const orderPaymentSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TailorCustomer",
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    paymentId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      enum: PAYMENT_METHODS,
      required: true,
    },
    paymentType: {
      type: String,
      enum: PAYMENT_TYPES,
      default: "partial",
    },
    referenceNo: {
      type: String,
      trim: true,
      default: "",
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isVoided: {
      type: Boolean,
      default: false,
    },
    voidedAt: {
      type: Date,
      default: null,
    },
    voidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    voidReason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

orderPaymentSchema.index({ shopId: 1, createdAt: -1 });
orderPaymentSchema.index({ shopId: 1, order: 1 });
orderPaymentSchema.index({ shopId: 1, customer: 1 });
orderPaymentSchema.index({ shopId: 1, paymentId: 1 }, { unique: true });
orderPaymentSchema.index({ shopId: 1, method: 1 });
orderPaymentSchema.index({ shopId: 1, isVoided: 1 });

const OrderPayment = mongoose.model("OrderPayment", orderPaymentSchema);
export { PAYMENT_METHODS, PAYMENT_TYPES };
export default OrderPayment;
