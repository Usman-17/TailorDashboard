import db from "../db/database";
import { generateLocalId } from "../utils/generateLocalId";
import { addToSyncQueue } from "../db/syncQueue";

const TABLE = "suitTypes";

export async function getAll(shopId) {
  if (!shopId) return [];
  return db[TABLE].where("shopId")
    .equals(shopId)
    .sortBy("createdAt")
    .then((results) => results.reverse());
}

export async function getById(shopId, localId) {
  if (!shopId || !localId) return null;
  return db[TABLE].where("localId")
    .equals(localId)
    .and((s) => s.shopId === shopId)
    .first();
}

export async function getByServerId(shopId, serverId) {
  if (!shopId || !serverId) return null;
  return db[TABLE].where("serverId")
    .equals(String(serverId))
    .and((s) => s.shopId === shopId)
    .first();
}

export async function create(shopId, data) {
  const localId = generateLocalId();
  const now = new Date().toISOString();

  const record = {
    localId,
    serverId: null,
    shopId: String(shopId || ""),
    name: String(data.name || "").trim(),
    price: Number(data.price) || 0,
    description: data.description ? String(data.description) : "",
    isActive: data.isActive !== false,
    syncStatus: "pending",
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  };

  await db[TABLE].add(record);
  await addToSyncQueue({
    entity: "suitType",
    operation: "create",
    localId,
    serverId: null,
    shopId: String(shopId || ""),
    payload: {
      name: record.name,
      price: record.price,
      description: record.description,
      isActive: record.isActive,
    },
  });

  return record;
}

export async function update(shopId, localId, data) {
  const existing = await getById(shopId, localId);
  if (!existing) throw new Error("Suit type not found locally");

  const now = new Date().toISOString();
  const updated = {
    ...existing,
    ...data,
    syncStatus: "pending",
    updatedAt: now,
  };

  await db[TABLE].where("localId").equals(localId).modify(updated);

  await addToSyncQueue({
    entity: "suitType",
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
  if (!existing) throw new Error("Suit type not found locally");

  const now = new Date().toISOString();
  await db[TABLE].where("localId").equals(localId).modify({
    isDeleted: true,
    syncStatus: "pending",
    updatedAt: now,
  });

  await addToSyncQueue({
    entity: "suitType",
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
  if (serverData?.name) updateFields.name = serverData.name;
  if (serverData?.price !== undefined) updateFields.price = serverData.price;
  if (serverData?.isActive !== undefined)
    updateFields.isActive = serverData.isActive;

  await db[TABLE].where("localId").equals(localId).modify(updateFields);
}

export async function markSyncFailed(localId) {
  if (!localId) return;
  await db[TABLE].where("localId").equals(localId).modify({
    syncStatus: "failed",
  });
}

export async function upsertFromServer(shopId, serverRecord) {
  if (!shopId || !serverRecord?._id) return null;

  try {
    const existing = await db[TABLE].where("serverId")
      .equals(String(serverRecord._id))
      .and((s) => s.shopId === shopId)
      .first();

    const record = {
      localId: existing?.localId || generateLocalId(),
      serverId: String(serverRecord._id),
      shopId: String(shopId),
      name: String(serverRecord.name || ""),
      price: Number(serverRecord.price) || 0,
      description: serverRecord.description || "",
      isActive: serverRecord.isActive !== false,
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
      "suitTypeRepo.upsertFromServer error:",
      err,
      serverRecord?._id,
    );
    return null;
  }
}

export async function clearAll(shopId) {
  if (!shopId) return;
  await db[TABLE].where("shopId").equals(shopId).delete();
}
