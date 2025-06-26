import mongoose from "mongoose";

const measurementSchema = new mongoose.Schema(
  {
    // Kameez
    length: { type: Number, required: true },
    shoulder: { type: Number, required: true },
    chest: { type: Number, required: true },
    waist: { type: Number, required: true },
    hip: { type: Number, required: true },
    neck: { type: Number, required: true },
    sleeveLength: { type: Number, required: true },
    wrist: { type: Number, required: true },
    bicep: { type: Number, required: true },

    // Shalwar
    shalwarLength: { type: Number, required: true },
    thigh: { type: Number, required: true },
    knee: { type: Number, required: true },
    bottom: { type: Number, required: true },
    pantWaist: { type: Number, required: true },

    // Relation
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Measurement = mongoose.model("Measurement", measurementSchema);
export default Measurement;
