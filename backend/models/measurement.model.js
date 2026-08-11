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
      ref: "TailorCustomer",
      required: [true, "Customer is required"],
    },

    // Lower type
    lower: {
      type: {
        type: String,
        enum: ["shalwar", "trouser"],
        default: "shalwar",
        required: true,
      },
    },

    // Kameez
    length: { type: Number, required: true, min: 0 },
    shoulder: { type: Number, required: true, min: 0 },
    chest: { type: Number, required: true, min: 0 },
    waist: { type: Number, required: true, min: 0 },
    hip: { type: Number, required: true, min: 0 },
    neck: { type: Number, required: true, min: 0 },
    sleeveLength: { type: Number, required: true, min: 0 },
    armHole: { type: Number, required: true, min: 0 },
    bicep: { type: Number, required: true, min: 0 },
    cuff: { type: Number, required: true, min: 0 },

    // Shalwar (existing set)
    shalwarLength: { type: Number, required: true, min: 0 },
    shalwarWaist: { type: Number, required: true, min: 0 },
    shalwarHip: { type: Number, required: true, min: 0 },
    thigh: { type: Number, required: true, min: 0 },
    knee: { type: Number, required: true, min: 0 },
    bottom: { type: Number, required: true, min: 0 },

    // Trouser (parallel set)
    trouserLength: { type: Number, min: 0 },
    trouserWaist: { type: Number, min: 0 },
    trouserHip: { type: Number, min: 0 },
    trouserThigh: { type: Number, min: 0 },
    trouserKnee: { type: Number, min: 0 },
    trouserBottom: { type: Number, min: 0 },

    // Remarks
    remarks: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

measurementSchema.index({ shopId: 1, customer: 1, createdAt: -1 });

const Measurement = mongoose.model("Measurement", measurementSchema);

export default Measurement;
