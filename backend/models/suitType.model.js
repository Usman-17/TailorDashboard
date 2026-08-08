import mongoose from "mongoose";

const suitTypeSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: [true, "Shop ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Suit type name is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Suit type price is required"],
      min: [0, "Price cannot be negative"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

suitTypeSchema.index({ shopId: 1, name: 1 }, { unique: true });

const SuitType = mongoose.model("SuitType", suitTypeSchema);

export default SuitType;
