import mongoose from "mongoose";

const SUBSCRIPTION_PLAN = {
  FREE: "free",
  BASIC: "basic",
  PREMIUM: "premium",
  ENTERPRISE: "enterprise",
};

const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Shop name is required"],
      trim: true,
      maxlength: 100,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
      unique: true,
    },

    phone: {
      type: String,
      required: [true, "Shop phone is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Shop email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    address: {
      street: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, default: "" },
      state: { type: String, trim: true, default: "" },
      postalCode: { type: String, trim: true, default: "" },
    },

    logo: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },

    subscriptionPlan: {
      type: String,
      enum: Object.values(SUBSCRIPTION_PLAN),
      default: SUBSCRIPTION_PLAN.FREE,
    },

    subscriptionAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    subscriptionStart: {
      type: Date,
      default: null,
    },

    subscriptionExpiry: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    settings: {
      currency: { type: String, default: "PKR" },
      taxRate: { type: Number, default: 0, min: 0, max: 100 },
      timezone: { type: String, default: "Asia/Karachi" },
    },
  },
  { timestamps: true }
);

shopSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    let baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    this.slug = baseSlug;
  }
  next();
});

shopSchema.virtual("isSubscriptionActive").get(function () {
  if (this.subscriptionPlan === SUBSCRIPTION_PLAN.FREE) return true;
  if (!this.subscriptionExpiry) return false;
  return this.subscriptionExpiry > new Date();
});

shopSchema.methods.activateSubscription = function (plan, durationMonths) {
  const now = new Date();
  this.subscriptionPlan = plan;
  this.subscriptionStart = now;
  const expiry = new Date(now);
  expiry.setMonth(expiry.getMonth() + durationMonths);
  this.subscriptionExpiry = expiry;
};

shopSchema.methods.deactivateSubscription = function () {
  this.subscriptionPlan = SUBSCRIPTION_PLAN.FREE;
  this.subscriptionStart = null;
  this.subscriptionExpiry = null;
};

shopSchema.index({ owner: 1 });
shopSchema.index({ slug: 1 });
shopSchema.index({ isActive: 1 });
shopSchema.index({ subscriptionExpiry: 1 });

const Shop = mongoose.model("Shop", shopSchema);

export { SUBSCRIPTION_PLAN };
export default Shop;
