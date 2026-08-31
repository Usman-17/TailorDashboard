import db from "../db/database";
import { generateLocalId } from "../utils/generateLocalId";
import { addToSyncQueue } from "../db/syncQueue";

const TABLE = "customers";

export async function getAll(shopId) {
  if (!shopId) return [];
  const results = await db[TABLE].where("shopId").equals(shopId).toArray();
  return results.sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  );
}

export async function search(shopId, query) {
  if (!shopId) return [];
  const q = (query || "").toLowerCase().trim();
  if (!q) return getAll(shopId);

  const results = await db[TABLE].where("shopId")
    .equals(shopId)
    .and(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.phone || "").includes(q) ||
        (c.customerId || "").toLowerCase().includes(q),
    )
    .toArray();

  return results.sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  );
}

export async function getById(shopId, localId) {
  if (!shopId || !localId) return null;
  return db[TABLE].where("localId")
    .equals(localId)
    .and((c) => c.shopId === shopId)
    .first();
}

export async function getByServerId(shopId, serverId) {
  if (!shopId || !serverId) return null;
  return db[TABLE].where("serverId")
    .equals(serverId)
    .and((c) => c.shopId === shopId)
    .first();
}

export async function getByPhone(shopId, phone) {
  if (!shopId || !phone) return null;
  const cleaned = String(phone).replace(/[\s\-()]/g, "");
  return db[TABLE].where("shopId")
    .equals(shopId)
    .and((c) => !c.isDeleted && c.phone === cleaned)
    .first();
}

export async function create(shopId, data) {
  const localId = generateLocalId();
  const now = new Date().toISOString();

  const record = {
    localId,
    serverId: null,
    shopId: String(shopId || ""),
    customerId: null,
    name: String(data.name || "").trim(),
    phone: String(data.phone || "").trim(),
    email: data.email ? String(data.email) : null,
    address: data.address ? String(data.address) : null,
    notes: data.notes ? String(data.notes) : "",
    syncStatus: "pending",
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  };

  await db[TABLE].add(record);
  await addToSyncQueue({
    entity: "customer",
    operation: "create",
    localId,
    serverId: null,
    shopId: String(shopId || ""),
    payload: {
      name: record.name,
      phone: record.phone,
      notes: record.notes,
    },
  });

  return record;
}

export async function update(shopId, localId, data) {
  const existing = await getById(shopId, localId);
  if (!existing) throw new Error("Customer not found locally");

  const now = new Date().toISOString();
  const updated = {
    ...existing,
    ...data,
    syncStatus: "pending",
    updatedAt: now,
  };

  await db[TABLE].where("localId").equals(localId).modify(updated);

  await addToSyncQueue({
    entity: "customer",
    operation: existing.serverId ? "update" : "create",
    localId,
    serverId: existing.serverId,
    shopId,
    payload: { ...data, localId, serverId: existing.serverId },
  });

  return updated;
}

export async function remove(shopId, localId) {
  const existing = await getById(shopId, localId);
  if (!existing) throw new Error("Customer not found locally");

  const now = new Date().toISOString();
  await db[TABLE].where("localId").equals(localId).modify({
    isDeleted: true,
    syncStatus: "pending",
    updatedAt: now,
  });

  await addToSyncQueue({
    entity: "customer",
    operation: "delete",
    localId,
    serverId: existing.serverId,
    shopId,
    payload: { localId, serverId: existing.serverId },
  });
}

export async function markSynced(localId, serverId, serverData) {
  if (!localId) return;
  const updateFields = {
    syncStatus: "synced",
    updatedAt: new Date().toISOString(),
  };
  if (serverId) updateFields.serverId = String(serverId);
  if (serverData?.customerId)
    updateFields.customerId = String(serverData.customerId);
  if (serverData?.name) updateFields.name = serverData.name;
  if (serverData?.phone) updateFields.phone = serverData.phone;

  await db[TABLE].where("localId").equals(localId).modify(updateFields);
}

export async function markSyncFailed(localId) {
  if (!localId) return;
  await db[TABLE].where("localId").equals(localId).modify({
    syncStatus: "failed",
  });
}

export async function resolveLocalId(localId, serverId, serverData) {
  if (!localId) return;
  await db[TABLE].where("localId")
    .equals(localId)
    .modify({
      serverId,
      syncStatus: "synced",
      customerId: serverData?.customerId || undefined,
      updatedAt: new Date().toISOString(),
    });
}

export async function getAllPending(shopId) {
  if (!shopId) return [];
  return db[TABLE].where("shopId")
    .equals(shopId)
    .and((c) => c.syncStatus === "pending" || c.syncStatus === "failed")
    .toArray();
}

export async function count(shopId) {
  if (!shopId) return 0;
  return db[TABLE].where("shopId").equals(shopId).count();
}

export async function addOrderId(shopId, customerId, orderLocalId) {
  if (!shopId || !customerId || !orderLocalId) return;
  const now = new Date().toISOString();

  const record = await db[TABLE].where("localId")
    .equals(customerId)
    .and((c) => c.shopId === shopId)
    .first();
  if (record) {
    const orders = record.orders || [];
    if (!orders.includes(orderLocalId)) {
      await db[TABLE].where("localId")
        .equals(customerId)
        .modify({ orders: [...orders, orderLocalId], updatedAt: now });
    }
    return;
  }

  const serverRecord = await db[TABLE].where("serverId")
    .equals(String(customerId))
    .and((c) => c.shopId === shopId)
    .first();
  if (serverRecord) {
    const orders = serverRecord.orders || [];
    if (!orders.includes(orderLocalId)) {
      await db[TABLE].where("localId")
        .equals(serverRecord.localId)
        .modify({ orders: [...orders, orderLocalId], updatedAt: now });
    }
  }
}

export async function setMeasurementId(shopId, customerId, measurementLocalId) {
  if (!shopId || !customerId) return;
  const now = new Date().toISOString();

  const record = await db[TABLE].where("localId")
    .equals(customerId)
    .and((c) => c.shopId === shopId)
    .first();
  if (record) {
    await db[TABLE].where("localId")
      .equals(customerId)
      .modify({ measurement: measurementLocalId, updatedAt: now });
    return;
  }

  const serverRecord = await db[TABLE].where("serverId")
    .equals(String(customerId))
    .and((c) => c.shopId === shopId)
    .first();
  if (serverRecord) {
    await db[TABLE].where("localId")
      .equals(serverRecord.localId)
      .modify({ measurement: measurementLocalId, updatedAt: now });
  }
}

export async function clearAll(shopId) {
  if (!shopId) return;
  await db[TABLE].where("shopId").equals(shopId).delete();
}

export async function bulkPut(records) {
  await db[TABLE].bulkPut(records);
}

export async function upsertFromServer(shopId, serverRecord) {
  if (!shopId || !serverRecord?._id) return null;

  try {
    const existing = await db[TABLE].where("serverId")
      .equals(String(serverRecord._id))
      .and((c) => c.shopId === shopId)
      .first();

    const measurementId = serverRecord.measurement
      ? typeof serverRecord.measurement === "object"
        ? serverRecord.measurement._id || null
        : serverRecord.measurement
      : null;

    const record = {
      localId: existing?.localId || generateLocalId(),
      serverId: String(serverRecord._id),
      shopId: String(shopId),
      customerId: serverRecord.customerId
        ? String(serverRecord.customerId)
        : null,
      name: String(serverRecord.name || ""),
      phone: String(serverRecord.phone || ""),
      measurement: measurementId
        ? String(measurementId)
        : existing?.measurement || null,
      orders: existing?.orders || [],
      syncStatus: "synced",
      createdAt: serverRecord.createdAt || new Date().toISOString(),
      updatedAt: serverRecord.updatedAt || new Date().toISOString(),
      isDeleted: false,
    };

    if (existing) {
      await db[TABLE].where("localId").equals(existing.localId).modify(record);
    } else {
      await db[TABLE].add(record);
    }

    return record;
  } catch (err) {
    console.error(
      "customerRepo.upsertFromServer error:",
      err,
      serverRecord?._id,
    );
    return null;
  }
}
