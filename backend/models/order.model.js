import mongoose from "mongoose";

const ORDER_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  READY: "ready",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

const PAYMENT_METHOD = {
  CASH: "cash",
  BANK: "bank",
  JAZZCASH: "jazzcash",
  EASYPAISA: "easypaisa",
  ONLINE: "online",
};

const paymentEntrySchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      default: PAYMENT_METHOD.CASH,
    },
    paymentType: {
      type: String,
      enum: ["advance", "partial", "final"],
      default: "partial",
    },
    referenceNo: { type: String, trim: true, default: "" },
    note: { type: String, trim: true, default: "" },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    receivedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const orderItemSchema = new mongoose.Schema(
  {
    suitType: {
      type: String,
      required: [true, "Suit type is required"],
      trim: true,
    },
    dressType: { type: String, trim: true, default: "" },
    lowerType: { type: String, trim: true, default: "" },
    collarType: { type: String, trim: true, default: "" },
    collarDetail: { type: String, trim: true, default: "" },
    cuffType: { type: String, trim: true, default: "" },
    pocket: { type: String, trim: true, default: "" },
    fabric: { type: String, trim: true, default: "" },
    color: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
    },

    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: [true, "Shop ID is required"],
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TailorCustomer",
      required: [true, "Customer is required"],
    },

    measurement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Measurement",
      default: null,
    },

    items: {
      type: [orderItemSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: "At least one item is required",
      },
    },

    deliveryDate: {
      type: Date,
      required: [true, "Delivery date is required"],
    },

    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
    },

    statusHistory: [
      {
        status: { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        changedAt: { type: Date, default: Date.now },
        note: { type: String, default: "" },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    advancePaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    remainingBalance: {
      type: Number,
      default: 0,
    },

    paymentHistory: [paymentEntrySchema],

    isPaid: {
      type: Boolean,
      default: false,
    },

    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

orderSchema.index({ shopId: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ shopId: 1, customer: 1 });
orderSchema.index({ shopId: 1, status: 1 });
orderSchema.index({ shopId: 1, deliveryDate: 1 });
orderSchema.index({ shopId: 1, isDeleted: 1 });
orderSchema.index({ shopId: 1, createdAt: -1 });

orderSchema.pre("find", function () {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
});

orderSchema.pre("findOne", function () {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
});

orderSchema.pre("countDocuments", function () {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
});

orderSchema.pre("aggregate", function () {
  const pipeline = this.pipeline();
  const hasDeletedMatch = pipeline.some(
    (stage) =>
      stage.$match &&
      (stage.$match.isDeleted === false ||
        (stage.$match.isDeleted && typeof stage.$match.isDeleted === "object" && "$ne" in stage.$match.isDeleted)),
  );
  if (!hasDeletedMatch) {
    this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  }
});

orderSchema.methods.calculateTotals = function () {
  this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.remainingBalance = Math.max(0, this.totalAmount - this.advancePaid);
  this.isPaid = this.remainingBalance <= 0;
};

orderSchema.methods.addPayment = function (amount, method, userId, note = "", paymentType = "partial", referenceNo = "") {
  this.paymentHistory.push({
    amount,
    method,
    paymentType,
    referenceNo,
    note,
    receivedBy: userId,
    receivedAt: new Date(),
  });
  this.advancePaid += amount;
  this.remainingBalance = Math.max(0, this.totalAmount - this.advancePaid);
  this.isPaid = this.remainingBalance <= 0;
};

orderSchema.methods.addStatusChange = function (status, userId, note = "") {
  this.statusHistory.push({
    status,
    changedBy: userId,
    changedAt: new Date(),
    note,
  });
  this.status = status;
};

const Order = mongoose.model("Order", orderSchema);

export { ORDER_STATUS, PAYMENT_METHOD };
export default Order;
