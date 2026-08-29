import mongoose from "mongoose";

const idempotencyKeySchema = new mongoose.Schema({
  clientId: {
    type: String,
    required: true,
    index: true,
  },
  operation: {
    type: String,
    required: true,
  },
  responseData: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400,
  },
});

idempotencyKeySchema.index({ clientId: 1, operation: 1 }, { unique: true });

const IdempotencyKey = mongoose.model(
  "IdempotencyKey",
  idempotencyKeySchema,
);

export default IdempotencyKey;
