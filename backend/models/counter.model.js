import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true,
  },

  name: {
    type: String,
    required: true,
  },

  value: {
    type: Number,
    default: 0,
  },
});

counterSchema.index({ shopId: 1, name: 1 }, { unique: true });

counterSchema.statics.getNextValue = async function (shopId, name) {
  const counter = await this.findOneAndUpdate(
    { shopId, name },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  return counter.value;
};

const Counter = mongoose.model("Counter", counterSchema);

export default Counter;
