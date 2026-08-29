import * as customerRepo from "../repos/customerRepo";
import * as measurementRepo from "../repos/measurementRepo";
import * as orderRepo from "../repos/orderRepo";
import {
  getPendingSyncItems,
  updateSyncItemStatus,
  incrementRetryCount,
  removeSyncItem,
} from "../db/syncQueue";
import db from "../db/database";

const MAX_RETRIES = 5;

const ENTITY_ORDER = ["customer", "measurement", "order"];

let syncInProgress = false;
let syncTimeout = null;
let initialSyncDone = {};

export function resetInitialSync(shopId) {
  if (shopId) {
    delete initialSyncDone[shopId];
  } else {
    initialSyncDone = {};
  }
}

export function startSyncManager() {
  window.addEventListener("online", () => scheduleSync());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && navigator.onLine) {
      scheduleSync();
    }
  });
  if (navigator.onLine) {
    scheduleSync();
  }
}

export function scheduleSync(delay = 1000) {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => runSync(), delay);
}

export async function runSync() {
  if (syncInProgress) return;
  if (!navigator.onLine) return;

  syncInProgress = true;

  try {
    const shopIds = new Set();
    await db.customers
      .toCollection()
      .each((c) => {
        if (c.shopId) shopIds.add(c.shopId);
      });

    for (const shopId of shopIds) {
      await syncShop(shopId);
    }
  } catch (err) {
    console.error("Sync manager error:", err);
  } finally {
    syncInProgress = false;
  }
}

async function syncShop(shopId) {
  for (const entity of ENTITY_ORDER) {
    const items = await getPendingSyncItems(shopId);
    const entityItems = items.filter((i) => i.entity === entity);

    for (const item of entityItems) {
      if (item.retryCount >= MAX_RETRIES) {
        await updateSyncItemStatus(item.id, "failed");
        continue;
      }

      await processSyncItem(item);
    }
  }
}

async function processSyncItem(item) {
  await updateSyncItemStatus(item.id, "syncing");

  try {
    switch (item.entity) {
      case "customer":
        await syncCustomerItem(item);
        break;
      case "measurement":
        await syncMeasurementItem(item);
        break;
      case "order":
        await syncOrderItem(item);
        break;
      default:
        console.warn(`Unknown entity type: ${item.entity}`);
    }
    await removeSyncItem(item.id);
  } catch (err) {
    console.error(`Sync failed for ${item.entity} ${item.operation}:`, err);
    await incrementRetryCount(item.id);
  }
}

async function syncCustomerItem(item) {
  const { operation, localId, serverId, payload } = item;

  if (operation === "create") {
    const res = await fetch("/api/customers/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Id": localId,
      },
      credentials: "include",
      body: JSON.stringify({ ...payload, clientId: localId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 409 || err.duplicate) {
        const existing = await res.json();
        await customerRepo.markSynced(
          localId,
          existing._id || serverId,
          existing,
        );
        return;
      }
      throw new Error(err.error || "Customer sync failed");
    }

    const data = await res.json();
    await customerRepo.markSynced(localId, data._id, data);
  } else if (operation === "update") {
    const res = await fetch(`/api/customers/update/${serverId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Id": localId,
      },
      credentials: "include",
      body: JSON.stringify({ ...payload, clientId: localId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Customer update sync failed");
    }

    const data = await res.json();
    await customerRepo.markSynced(localId, serverId, data);
  } else if (operation === "delete") {
    await customerRepo.markSynced(localId, serverId, null);
  }
}

async function syncMeasurementItem(item) {
  const { operation, localId, serverId, payload, shopId } = item;

  if (operation === "create" || operation === "update") {
    const measurement = await measurementRepo.getById(shopId, localId);
    if (!measurement) return;

    const customerServerId = measurement.customerId;
    if (!customerServerId) {
      throw new Error("Customer not yet synced, cannot sync measurement");
    }

    const endpoint =
      operation === "create"
        ? `/api/measurements/add/${customerServerId}`
        : `/api/measurements/update/${customerServerId}`;

    const method = operation === "create" ? "POST" : "PUT";

    const res = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Client-Id": localId,
      },
      credentials: "include",
      body: JSON.stringify({ ...payload, clientId: localId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Measurement sync failed");
    }

    const data = await res.json();
    await measurementRepo.markSynced(localId, data._id || serverId);
  } else if (operation === "delete") {
    const measurement = await measurementRepo.getById(shopId, localId);
    if (measurement?.customerId) {
      await fetch(`/api/measurements/${measurement.customerId}`, {
        method: "DELETE",
        credentials: "include",
      });
    }
    await measurementRepo.markSynced(localId, serverId);
  }
}

async function syncOrderItem(item) {
  const { operation, localId, serverId, payload, shopId } = item;

  if (operation === "create") {
    const order = await orderRepo.getById(shopId, localId);
    if (!order) return;

    const customerServerId = order.customerId;
    if (!customerServerId) {
      throw new Error("Customer not yet synced, cannot sync order");
    }

    const res = await fetch("/api/orders/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Id": localId,
      },
      credentials: "include",
      body: JSON.stringify({
        ...payload,
        customer: customerServerId,
        clientId: localId,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 409 || err.duplicate) {
        const existing = await res.json();
        await orderRepo.markSynced(localId, existing._id || serverId, existing);
        return;
      }
      throw new Error(err.error || "Order sync failed");
    }

    const data = await res.json();
    await orderRepo.markSynced(localId, data._id, data);
  } else if (operation === "update") {
    const res = await fetch(`/api/orders/update/${serverId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Id": localId,
      },
      credentials: "include",
      body: JSON.stringify({ ...payload, clientId: localId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Order update sync failed");
    }

    const data = await res.json();
    await orderRepo.markSynced(localId, serverId, data);
  } else if (operation === "updateStatus") {
    const res = await fetch(`/api/orders/status/${serverId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Id": localId,
      },
      credentials: "include",
      body: JSON.stringify({ status: payload.status, clientId: localId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Order status sync failed");
    }

    await orderRepo.markSynced(localId, serverId, null);
  } else if (operation === "delete") {
    await fetch(`/api/orders/${serverId}`, {
      method: "DELETE",
      credentials: "include",
    });
    await orderRepo.markSynced(localId, serverId, null);
  }
}

async function fetchAllCustomers(shopId) {
  const res = await fetch("/api/customers/all", { credentials: "include" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.customers || [];
}

async function fetchAllOrders(shopId) {
  const allOrders = [];
  let page = 1;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const res = await fetch(
      `/api/orders/all?page=${page}&limit=${limit}`,
      { credentials: "include" },
    );
    if (!res.ok) break;

    const data = await res.json();
    const orders = data.orders || data || [];
    allOrders.push(...(Array.isArray(orders) ? orders : []));

    if (orders.length < limit || !data.pagination) {
      hasMore = false;
    } else {
      page++;
    }
  }

  return allOrders;
}

async function fetchCustomerMeasurements(shopId, customers) {
  for (const c of customers) {
    if (c.measurement) {
      try {
        const mRes = await fetch(`/api/measurements/${c._id}`, {
          credentials: "include",
        });
        if (mRes.ok) {
          const m = await mRes.json();
          if (m) {
            await measurementRepo.upsertFromServer(shopId, m);
          }
        }
      } catch {
        // skip
      }
    }
  }
}

export async function fetchAndCacheServerData(shopId) {
  if (!navigator.onLine || !shopId) return;

  if (initialSyncDone[shopId]) return;
  initialSyncDone[shopId] = true;

  try {
    const customers = await fetchAllCustomers(shopId);
    const customerServerIdMap = {};

    const pendingLocalCustomers = await customerRepo.getAllPending(shopId);
    const pendingLocalIds = new Set(
      pendingLocalCustomers.map((c) => c.serverId).filter(Boolean),
    );

    for (const c of customers) {
      if (pendingLocalIds.has(c._id)) continue;
      const record = await customerRepo.upsertFromServer(shopId, c);
      if (record?.localId) {
        customerServerIdMap[c._id] = record.localId;
      }
    }

    const orders = await fetchAllOrders(shopId);
    const pendingLocalOrders = await db.orders
      .where("shopId")
      .equals(shopId)
      .and((o) => o.syncStatus === "pending")
      .toArray();
    const pendingOrderServerIds = new Set(
      pendingLocalOrders.map((o) => o.serverId).filter(Boolean),
    );

    for (const o of orders) {
      if (pendingOrderServerIds.has(o._id)) continue;
      await orderRepo.upsertFromServer(shopId, o, customerServerIdMap);
    }

    await fetchCustomerMeasurements(shopId, customers);
  } catch (err) {
    console.error("Failed to fetch server data:", err);
    initialSyncDone[shopId] = false;
  }
}
