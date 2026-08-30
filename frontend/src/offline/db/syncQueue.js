import db from "./database";

const dispatchQueueChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("tailor-sync-queue-changed"));
  }
};

export async function addToSyncQueue({
  entity,
  operation,
  localId,
  serverId = null,
  shopId,
  payload,
}) {
  const item = {
    entity,
    operation,
    localId,
    serverId,
    shopId: String(shopId || ""),
    payload: JSON.parse(JSON.stringify(payload || {})),
    createdAt: new Date().toISOString(),
    retryCount: 0,
    status: "pending",
  };
  const id = await db.syncQueue.add(item);
  item.id = id;

  dispatchQueueChange();

  if (typeof navigator !== "undefined" && navigator.onLine) {
    import("../sync/syncManager")
      .then((m) => m.scheduleSync(100))
      .catch(() => {});
  }

  return item;
}

export async function getPendingSyncItems(shopId) {
  const items = await db.syncQueue.toArray();
  return items
    .filter((item) => {
      if (shopId && item.shopId && String(item.shopId) !== String(shopId)) {
        return false;
      }
      return item.status !== "synced";
    })
    .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
}

export async function updateSyncItemStatus(id, status) {
  if (!id) return;
  try {
    await db.syncQueue.update(id, { status });
    dispatchQueueChange();
  } catch (err) {
    console.warn("Failed to update sync item status:", err);
  }
}

export async function incrementRetryCount(itemOrId) {
  if (!itemOrId) return;
  try {
    const id = typeof itemOrId === "object" ? itemOrId.id : itemOrId;
    const localId = typeof itemOrId === "object" ? itemOrId.localId : null;

    let queueItem = id !== undefined ? await db.syncQueue.get(id) : null;
    if (!queueItem && localId) {
      queueItem = await db.syncQueue.where("localId").equals(localId).first();
    }

    if (queueItem && queueItem.id !== undefined) {
      const retryCount = (queueItem.retryCount || 0) + 1;
      await db.syncQueue.update(queueItem.id, {
        retryCount,
        status: retryCount >= 10 ? "failed" : "pending",
      });
      dispatchQueueChange();
    }
  } catch (err) {
    console.warn("Failed to increment retry count:", err);
  }
}

export async function removeSyncItem(itemOrId) {
  if (!itemOrId) return;
  try {
    if (typeof itemOrId === "object") {
      if (itemOrId.id !== undefined) {
        await db.syncQueue.delete(itemOrId.id);
      }
      if (itemOrId.localId) {
        await db.syncQueue.where("localId").equals(itemOrId.localId).delete();
      }
    } else {
      await db.syncQueue.delete(itemOrId);
    }
    dispatchQueueChange();
  } catch (err) {
    console.warn("Failed to remove sync item:", err);
  }
}

export async function getSyncQueueStats(shopId) {
  const items = await db.syncQueue.toArray();
  const shopItems = shopId
    ? items.filter((i) => !i.shopId || String(i.shopId) === String(shopId))
    : items;

  return {
    total: shopItems.length,
    pending: shopItems.filter((i) => i.status === "pending").length,
    syncing: shopItems.filter((i) => i.status === "syncing").length,
    failed: shopItems.filter((i) => i.status === "failed").length,
    synced: shopItems.filter((i) => i.status === "synced").length,
  };
}

export async function clearSyncQueue(shopId) {
  if (!shopId) {
    await db.syncQueue.clear();
    return;
  }
  const items = await db.syncQueue.toArray();
  const ids = items
    .filter((i) => !i.shopId || String(i.shopId) === String(shopId))
    .map((i) => i.id)
    .filter((id) => id !== undefined);
  await db.syncQueue.bulkDelete(ids);
}
