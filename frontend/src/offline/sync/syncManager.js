import * as customerRepo from "../repos/customerRepo";
import * as measurementRepo from "../repos/measurementRepo";
import * as orderRepo from "../repos/orderRepo";
import * as suitTypeRepo from "../repos/suitTypeRepo";
import * as expenseRepo from "../repos/expenseRepo";
import {
  getPendingSyncItems,
  updateSyncItemStatus,
  incrementRetryCount,
  removeSyncItem,
} from "../db/syncQueue";
import db from "../db/database";

const MAX_RETRIES = 5;

const ENTITY_ORDER = [
  "customer",
  "measurement",
  "order",
  "suitType",
  "expense",
];

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
  if (typeof window === "undefined") return;

  window.addEventListener("online", () => scheduleSync(100));
  window.addEventListener("tailor-sync-queue-changed", () => {
    if (navigator.onLine) scheduleSync(100);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && navigator.onLine) {
      scheduleSync(100);
    }
  });

  // Safety periodic sync every 4 seconds when online
  setInterval(() => {
    if (typeof navigator !== "undefined" && navigator.onLine) {
      scheduleSync(100);
    }
  }, 4000);

  if (typeof navigator !== "undefined" && navigator.onLine) {
    scheduleSync(100);
  }
}

export function scheduleSync(delay = 300) {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => runSync(), delay);
}

export async function runSync(force = false) {
  if (syncInProgress) return;
  if (!navigator.onLine) return;

  syncInProgress = true;

  try {
    const allPending = await getPendingSyncItems();
    if (allPending.length === 0) {
      syncInProgress = false;
      return;
    }

    let anySynced = false;

    for (const entity of ENTITY_ORDER) {
      const entityItems = allPending.filter((i) => i.entity === entity);

      for (const item of entityItems) {
        if (!force && item.retryCount >= 10 && item.status === "failed") {
          continue;
        }

        const success = await processSyncItem(item);
        if (success) anySynced = true;
      }
    }

    if (anySynced && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("tailor-offline-synced"));
    }
  } catch (err) {
    console.error("Sync manager error:", err);
  } finally {
    syncInProgress = false;
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
      case "suitType":
        await syncSuitTypeItem(item);
        break;
      case "expense":
        await syncExpenseItem(item);
        break;
      default:
        console.warn(`Unknown entity type: ${item.entity}`);
    }
    await removeSyncItem(item);
    return true;
  } catch (err) {
    console.error(`Sync failed for ${item.entity} ${item.operation}:`, err);
    await incrementRetryCount(item);
    return false;
  }
}

async function syncCustomerItem(item) {
  const { operation, localId, serverId, payload, shopId } = item;

  if (operation === "create") {
    // If local customer already has serverId, mark as synced
    const localCust = await customerRepo.getById(shopId, localId);
    if (localCust?.serverId && localCust.syncStatus === "synced") {
      return;
    }

    const bodyPayload = {
      name: payload?.name || localCust?.name,
      phone: payload?.phone || localCust?.phone,
      notes: payload?.notes || localCust?.notes || "",
    };

    const res = await fetch("/api/customers/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Id": localId,
      },
      credentials: "include",
      body: JSON.stringify({ ...bodyPayload, clientId: localId }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (
        res.status === 409 ||
        data.duplicate ||
        (res.status === 400 && /already exists/i.test(data.error || ""))
      ) {
        await customerRepo.markSynced(localId, data._id || serverId, data);
        return;
      }
      throw new Error(data.error || "Customer sync failed");
    }

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

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || "Customer update sync failed");
    }

    await customerRepo.markSynced(localId, serverId, data);
  } else if (operation === "delete") {
    await customerRepo.markSynced(localId, serverId, null);
  }
}

async function syncMeasurementItem(item) {
  const { operation, localId, serverId, shopId } = item;

  if (operation === "create" || operation === "update") {
    const measurement = await measurementRepo.getById(shopId, localId);
    if (!measurement) return;

    let customerServerId = measurement.customerId;
    if (!customerServerId && measurement.customerLocalId) {
      const cust = await customerRepo.getById(
        shopId,
        measurement.customerLocalId,
      );
      if (cust?.serverId) {
        customerServerId = cust.serverId;
        await measurementRepo.update(shopId, localId, {
          customerId: customerServerId,
        });
      }
    }

    if (!customerServerId) {
      throw new Error("Customer not yet synced, cannot sync measurement");
    }

    const endpoint =
      operation === "create"
        ? `/api/measurements/add/${customerServerId}`
        : `/api/measurements/update/${customerServerId}`;

    const method = operation === "create" ? "POST" : "PUT";

    const fullPayload = {
      lower: measurement.lower || { type: "shalwar" },
      length: measurement.length,
      shoulder: measurement.shoulder,
      chest: measurement.chest,
      waist: measurement.waist,
      ghera: measurement.ghera,
      hip: measurement.hip,
      neck: measurement.neck,
      collar: measurement.collar,
      ban: measurement.ban,
      sleeveLength: measurement.sleeveLength,
      armHole: measurement.armHole,
      bicep: measurement.bicep,
      cuff: measurement.cuff,
      shalwarLength: measurement.shalwarLength,
      shalwarWaist: measurement.shalwarWaist,
      shalwarHip: measurement.shalwarHip,
      shalwarGhera: measurement.shalwarGhera,
      aasan: measurement.aasan,
      thigh: measurement.thigh,
      knee: measurement.knee,
      bottom: measurement.bottom,
      trouserLength: measurement.trouserLength,
      trouserWaist: measurement.trouserWaist,
      trouserHip: measurement.trouserHip,
      trouserGhera: measurement.trouserGhera,
      trouserAasan: measurement.trouserAasan,
      trouserThigh: measurement.trouserThigh,
      trouserKnee: measurement.trouserKnee,
      trouserBottom: measurement.trouserBottom,
      remarks: measurement.remarks || "",
    };

    const res = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Client-Id": localId,
      },
      credentials: "include",
      body: JSON.stringify({ ...fullPayload, clientId: localId }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || "Measurement sync failed");
    }

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

    let customerServerId = order.customerId;
    if (!customerServerId && order.customerLocalId) {
      const cust = await customerRepo.getById(shopId, order.customerLocalId);
      if (cust?.serverId) {
        customerServerId = cust.serverId;
        await orderRepo.update(shopId, localId, {
          customerId: customerServerId,
        });
      }
    }

    if (!customerServerId) {
      throw new Error("Customer not yet synced, cannot sync order");
    }

    let measurementServerId = order.measurementId;
    if (!measurementServerId && order.measurementLocalId) {
      const meas = await measurementRepo.getById(
        shopId,
        order.measurementLocalId,
      );
      if (meas?.serverId) {
        measurementServerId = meas.serverId;
      }
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
        measurement: measurementServerId || undefined,
        clientId: localId,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 409 || data.duplicate) {
        await orderRepo.markSynced(localId, data._id || serverId, data);
        return;
      }
      throw new Error(data.error || "Order sync failed");
    }

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

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || "Order update sync failed");
    }

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

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || "Order status sync failed");
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

async function syncSuitTypeItem(item) {
  const { operation, localId, serverId, payload, shopId } = item;

  if (operation === "create") {
    const localST = await suitTypeRepo.getById(shopId, localId);
    if (localST?.serverId && localST.syncStatus === "synced") {
      return;
    }

    const bodyPayload = {
      name: payload?.name || localST?.name,
      price: payload?.price ?? localST?.price ?? 0,
      description: payload?.description || localST?.description || "",
      isActive: payload?.isActive ?? localST?.isActive ?? true,
    };

    const res = await fetch("/api/suit-types/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Id": localId,
      },
      credentials: "include",
      body: JSON.stringify({ ...bodyPayload, clientId: localId }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (
        res.status === 409 ||
        data.duplicate ||
        (res.status === 400 && /already exists/i.test(data.error || ""))
      ) {
        await suitTypeRepo.markSynced(localId, data._id || serverId, data);
        return;
      }
      throw new Error(data.error || "Suit type sync failed");
    }

    await suitTypeRepo.markSynced(localId, data._id, data);
  } else if (operation === "update") {
    const res = await fetch(`/api/suit-types/update/${serverId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Id": localId,
      },
      credentials: "include",
      body: JSON.stringify({ ...payload, clientId: localId }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || "Suit type update sync failed");
    }

    await suitTypeRepo.markSynced(localId, serverId, data);
  } else if (operation === "delete") {
    await suitTypeRepo.markSynced(localId, serverId, null);
  }
}

async function syncExpenseItem(item) {
  const { operation, localId, serverId, payload, shopId } = item;

  if (operation === "create") {
    const localExp = await expenseRepo.getById(shopId, localId);
    if (localExp?.serverId && localExp.syncStatus === "synced") return;

    const bodyPayload = {
      title: payload?.title || localExp?.title,
      category: payload?.category || localExp?.category,
      amount: payload?.amount ?? localExp?.amount ?? 0,
      method: payload?.method || localExp?.method || "cash",
      date: payload?.date || localExp?.date,
      note: payload?.note || localExp?.note || "",
    };

    const res = await fetch("/api/expense-records/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Id": localId,
      },
      credentials: "include",
      body: JSON.stringify({ ...bodyPayload, clientId: localId }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (
        res.status === 409 ||
        data.duplicate ||
        (res.status === 400 && /already exists/i.test(data.error || ""))
      ) {
        await expenseRepo.markSynced(localId, data._id || serverId, data);
        return;
      }
      throw new Error(data.error || "Expense sync failed");
    }

    await expenseRepo.markSynced(localId, data._id, data);
  } else if (operation === "update") {
    const res = await fetch(`/api/expense-records/update/${serverId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Id": localId,
      },
      credentials: "include",
      body: JSON.stringify({ ...payload, clientId: localId }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Expense update sync failed");
    await expenseRepo.markSynced(localId, serverId, data);
  } else if (operation === "void") {
    const res = await fetch(`/api/expense-records/void/${serverId}`, {
      method: "PUT",
      headers: { "X-Client-Id": localId },
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok && res.status !== 400) {
      throw new Error(data.error || "Expense void sync failed");
    }
    await expenseRepo.markSynced(localId, serverId, data);
  } else if (operation === "restore") {
    const res = await fetch(`/api/expense-records/restore/${serverId}`, {
      method: "PUT",
      headers: { "X-Client-Id": localId },
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok && res.status !== 400) {
      throw new Error(data.error || "Expense restore sync failed");
    }
    await expenseRepo.markSynced(localId, serverId, data);
  }
}

async function fetchAllCustomers() {
  const res = await fetch("/api/customers/all", { credentials: "include" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.customers || [];
}

async function fetchAllOrders() {
  const allOrders = [];
  let page = 1;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const res = await fetch(`/api/orders/all?page=${page}&limit=${limit}`, {
      credentials: "include",
    });
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

    const suitRes = await fetch("/api/suit-types/all", {
      credentials: "include",
    });
    if (suitRes.ok) {
      const suitData = await suitRes.json();
      for (const s of suitData.suitTypes || []) {
        await suitTypeRepo.upsertFromServer(shopId, s);
      }
    }

    const expRes = await fetch("/api/expense-records/all?limit=500", {
      credentials: "include",
    });
    if (expRes.ok) {
      const expData = await expRes.json();
      for (const e of expData.expenses || []) {
        await expenseRepo.upsertFromServer(shopId, e);
      }
    }
  } catch (err) {
    console.error("Failed to fetch server data:", err);
    initialSyncDone[shopId] = false;
  }
}
