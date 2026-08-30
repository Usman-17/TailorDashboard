import db from "../db/database";
import { generateLocalId } from "../utils/generateLocalId";
import { addToSyncQueue } from "../db/syncQueue";

const TABLE = "orders";

export async function getAll(shopId) {
  if (!shopId) return [];
  const results = await db[TABLE].where("shopId").equals(shopId).toArray();
  return results.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export async function search(shopId, query) {
  if (!shopId) return [];
  const q = (query || "").toLowerCase().trim();
  if (!q) return getAll(shopId);

  const results = await db[TABLE]
    .where("shopId")
    .equals(shopId)
    .and(
      (o) =>
        (o.orderNumber || "").toLowerCase().includes(q) ||
        (o.customerName || "").toLowerCase().includes(q),
    )
    .toArray();

  return results.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export async function getById(shopId, localId) {
  if (!shopId || !localId) return null;
  return db[TABLE]
    .where("localId")
    .equals(localId)
    .and((o) => o.shopId === shopId)
    .first();
}

export async function getByServerId(shopId, serverId) {
  if (!shopId || !serverId) return null;
  return db[TABLE]
    .where("serverId")
    .equals(serverId)
    .and((o) => o.shopId === shopId)
    .first();
}

export async function create(shopId, data) {
  const localId = generateLocalId();
  const now = new Date().toISOString();

  const record = {
    localId,
    serverId: null,
    shopId: String(shopId || ""),
    orderNumber: data.orderNumber || null,
    customerId: data.customerServerId ? String(data.customerServerId) : null,
    customerLocalId: data.customerLocalId ? String(data.customerLocalId) : null,
    customerName: data.customerName || "",
    measurementId: data.measurementServerId ? String(data.measurementServerId) : null,
    measurementLocalId: data.measurementLocalId ? String(data.measurementLocalId) : null,
    items: data.items || [],
    deliveryDate: data.deliveryDate,
    status: data.status || "pending",
    totalAmount: data.totalAmount || 0,
    discount: data.discount || 0,
    advancePaid: data.advancePaid || 0,
    remainingBalance: data.remainingBalance || 0,
    isPaid: data.isPaid || false,
    priority: data.priority || "normal",
    notes: data.notes || "",
    createdBy: data.createdBy || null,
    syncStatus: "pending",
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  };

  await db[TABLE].add(record);
  await addToSyncQueue({
    entity: "order",
    operation: "create",
    localId,
    serverId: null,
    shopId: String(shopId || ""),
    payload: JSON.parse(JSON.stringify(data || {})),
  });

  return record;
}

export async function update(shopId, localId, data) {
  const existing = await getById(shopId, localId);
  if (!existing) throw new Error("Order not found locally");

  const now = new Date().toISOString();
  const updated = { ...existing, ...data, syncStatus: "pending", updatedAt: now };

  await db[TABLE]
    .where("localId")
    .equals(localId)
    .modify(updated);

  await addToSyncQueue({
    entity: "order",
    operation: existing.serverId ? "update" : "create",
    localId,
    serverId: existing.serverId,
    shopId,
    payload: { ...data, localId, serverId: existing.serverId },
  });

  return updated;
}

export async function updateStatus(shopId, localId, status) {
  const existing = await getById(shopId, localId);
  if (!existing) throw new Error("Order not found locally");

  const now = new Date().toISOString();
  await db[TABLE]
    .where("localId")
    .equals(localId)
    .modify({
    status,
    syncStatus: "pending",
    updatedAt: now,
  });

  await addToSyncQueue({
    entity: "order",
    operation: "updateStatus",
    localId,
    serverId: existing.serverId,
    shopId,
    payload: { status, localId, serverId: existing.serverId },
  });
}

export async function remove(shopId, localId) {
  const existing = await getById(shopId, localId);
  if (!existing) throw new Error("Order not found locally");

  const now = new Date().toISOString();
  await db[TABLE]
    .where("localId")
    .equals(localId)
    .modify({
      isDeleted: true,
      syncStatus: "pending",
      updatedAt: now,
    });

  await addToSyncQueue({
    entity: "order",
    operation: "delete",
    localId,
    serverId: existing.serverId,
    shopId,
    payload: { localId, serverId: existing.serverId },
  });
}

export async function markSynced(localId, serverId, serverData) {
  if (!localId) return;
  await db[TABLE].where("localId").equals(localId).modify({
    serverId,
    syncStatus: "synced",
    orderNumber: serverData?.orderNumber || undefined,
    updatedAt: new Date().toISOString(),
  });
}

export async function markSyncFailed(localId) {
  if (!localId) return;
  await db[TABLE].where("localId").equals(localId).modify({ syncStatus: "failed" });
}

export async function upsertFromServer(shopId, serverRecord, customerServerIdMap) {
  if (!shopId || !serverRecord?._id) return null;

  try {
    const customerId =
      typeof serverRecord.customer === "object"
        ? serverRecord.customer?._id
        : serverRecord.customer;

    const customerName =
      typeof serverRecord.customer === "object"
        ? serverRecord.customer?.name || ""
        : "";

    const existing = await db[TABLE]
      .where("serverId")
      .equals(String(serverRecord._id))
      .and((o) => o.shopId === shopId)
      .first();

    const record = {
      localId: existing?.localId || generateLocalId(),
      serverId: String(serverRecord._id),
      shopId: String(shopId),
      orderNumber: serverRecord.orderNumber || null,
      customerId: customerId ? String(customerId) : null,
      customerLocalId: customerServerIdMap?.[customerId] || existing?.customerLocalId || null,
      customerName,
      measurementId: serverRecord.measurement || null,
      measurementLocalId: existing?.measurementLocalId || null,
      items: serverRecord.items || [],
      deliveryDate: serverRecord.deliveryDate,
      status: serverRecord.status || "pending",
      totalAmount: serverRecord.totalAmount || 0,
      discount: serverRecord.discount || 0,
      advancePaid: serverRecord.advancePaid || 0,
      remainingBalance: serverRecord.remainingBalance || 0,
      isPaid: serverRecord.isPaid || false,
      priority: serverRecord.priority || "normal",
      notes: serverRecord.notes || "",
      createdBy: serverRecord.createdBy || null,
      syncStatus: "synced",
      createdAt: serverRecord.createdAt || new Date().toISOString(),
      updatedAt: serverRecord.updatedAt || new Date().toISOString(),
      isDeleted: serverRecord.isDeleted || false,
    };

    if (existing) {
      await db[TABLE].where("localId").equals(existing.localId).modify(record);
    } else {
      await db[TABLE].add(record);
    }

    return record;
  } catch (err) {
    console.error("orderRepo.upsertFromServer error:", err, serverRecord?._id);
    return null;
  }
}

export async function count(shopId) {
  if (!shopId) return 0;
  return db[TABLE].where("shopId").equals(shopId).count();
}

export async function clearAll(shopId) {
  if (!shopId) return;
  await db[TABLE].where("shopId").equals(shopId).delete();
}
