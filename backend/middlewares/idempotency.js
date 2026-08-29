import IdempotencyKey from "../models/idempotencyKey.model.js";

export function idempotencyCheck(req, res, next) {
  const clientId = req.headers["x-client-id"] || req.body?.clientId;

  if (!clientId) {
    return next();
  }

  req.clientId = clientId;
  next();
}

export async function checkIdempotency(clientId, operation) {
  if (!clientId) return { isDuplicate: false };

  const existing = await IdempotencyKey.findOne({ clientId, operation });

  if (existing) {
    return {
      isDuplicate: true,
      result: existing.responseData,
    };
  }

  return { isDuplicate: false };
}

export async function storeIdempotencyResult(clientId, operation, responseData) {
  if (!clientId) return;

  try {
    await IdempotencyKey.findOneAndUpdate(
      { clientId, operation },
      { clientId, operation, responseData, createdAt: new Date() },
      { upsert: true, new: true },
    );
  } catch (err) {
    console.error("Failed to store idempotency result:", err.message);
  }
}
