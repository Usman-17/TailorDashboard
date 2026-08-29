import db from "./database";
import { generateLocalId } from "../utils/generateLocalId";

export async function addToSyncQueue({
  entity,
  operation,
  localId,
  serverId = null,
  shopId,
  payload,
}) {
  const id = generateLocalId();
  const item = {
    id,
    entity,
    operation,
    localId,
    serverId,
    shopId,
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    status: "pending",
  };
  await db.syncQueue.add(item);
  return item;
}

export async function getPendingSyncItems(shopId) {
  if (!shopId) return [];
  return db.syncQueue
    .where("shopId")
    .equals(shopId)
    .and((item) => item.status === "pending" || item.status === "failed")
    .sortBy("createdAt");
}

export async function updateSyncItemStatus(id, status) {
  await db.syncQueue.update(id, { status });
}

export async function incrementRetryCount(id) {
  const item = await db.syncQueue.get(id);
  if (item) {
    await db.syncQueue.update(id, {
      retryCount: item.retryCount + 1,
      status: item.retryCount + 1 >= 5 ? "failed" : "pending",
    });
  }
}

export async function removeSyncItem(id) {
  await db.syncQueue.delete(id);
}

export async function getSyncQueueStats(shopId) {
  if (!shopId) return { total: 0, pending: 0, syncing: 0, failed: 0, synced: 0 };
  const items = await db.syncQueue
    .where("shopId")
    .equals(shopId)
    .toArray();

  return {
    total: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    syncing: items.filter((i) => i.status === "syncing").length,
    failed: items.filter((i) => i.status === "failed").length,
    synced: items.filter((i) => i.status === "synced").length,
  };
}

export async function clearSyncQueue(shopId) {
  if (!shopId) return;
  const items = await db.syncQueue
    .where("shopId")
    .equals(shopId)
    .toArray();
  const ids = items.map((i) => i.id);
  await db.syncQueue.bulkDelete(ids);
}
