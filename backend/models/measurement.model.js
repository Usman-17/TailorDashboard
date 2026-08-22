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
    length: { type: Number, min: 0 },
    shoulder: { type: Number, min: 0 },
    chest: { type: Number, min: 0 },
    waist: { type: Number, min: 0 },
    ghera: { type: Number, min: 0 },
    hip: { type: Number, min: 0 },
    neck: { type: Number, min: 0 },
    collar: { type: Number, min: 0 },
    ban: { type: Number, min: 0 },
    sleeveLength: { type: Number, min: 0 },
    armHole: { type: Number, min: 0 },
    bicep: { type: Number, min: 0 },
    cuff: { type: Number, min: 0 },

    // Shalwar (existing set)
    shalwarLength: { type: Number, min: 0 },
    shalwarWaist: { type: Number, min: 0 },
    shalwarHip: { type: Number, min: 0 },
    shalwarGhera: { type: Number, min: 0 },
    aasan: { type: Number, min: 0 },
    thigh: { type: Number, min: 0 },
    knee: { type: Number, min: 0 },
    bottom: { type: Number, min: 0 },

    // Trouser (parallel set)
    trouserLength: { type: Number, min: 0 },
    trouserWaist: { type: Number, min: 0 },
    trouserHip: { type: Number, min: 0 },
    trouserGhera: { type: Number, min: 0 },
    trouserAasan: { type: Number, min: 0 },
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
