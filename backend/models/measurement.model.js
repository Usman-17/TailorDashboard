import mongoose from "mongoose";

const measurementSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: [true, "Shop ID is required"],
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },

    // Kameez
    length: { type: Number, required: true, min: 0 },
    shoulder: { type: Number, required: true, min: 0 },
    chest: { type: Number, required: true, min: 0 },
    waist: { type: Number, required: true, min: 0 },
    hip: { type: Number, required: true, min: 0 },
    neck: { type: Number, required: true, min: 0 },
    sleeveLength: { type: Number, required: true, min: 0 },
    wrist: { type: Number, required: true, min: 0 },
    bicep: { type: Number, required: true, min: 0 },

    // Shalwar
    shalwarLength: { type: Number, required: true, min: 0 },
    thigh: { type: Number, required: true, min: 0 },
    knee: { type: Number, required: true, min: 0 },
    bottom: { type: Number, required: true, min: 0 },
    pantWaist: { type: Number, required: true, min: 0 },

    // Extra
    extraNotes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

measurementSchema.index({ shopId: 1, customer: 1 }, { unique: true });

const Measurement = mongoose.model("Measurement", measurementSchema);

export default Measurement;
