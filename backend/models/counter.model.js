import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },

  value: {
    type: Number,
    default: 1,
  },
});

const Counter = mongoose.model("Counter", counterSchema);
export default Counter;
