import db from "../db/database";
import { generateLocalId } from "../utils/generateLocalId";
import { addToSyncQueue } from "../db/syncQueue";

const TABLE = "expenses";

export async function getAll(shopId) {
  if (!shopId) return [];
  return db[TABLE].where("shopId").equals(shopId).toArray();
}

export async function getAllFiltered(shopId, filters = {}) {
  if (!shopId) return [];
  const { category, method, status, from, to, search } = filters;

  let results = await db[TABLE].where("shopId").equals(shopId).toArray();

  if (status === "voided") {
    results = results.filter((e) => e.isVoided);
  } else {
    results = results.filter((e) => !e.isVoided);
  }

  if (category && category !== "all") {
    results = results.filter((e) => e.category === category);
  }
  if (method && method !== "all") {
    results = results.filter((e) => e.method === method);
  }
  if (from) {
    const fromDate = new Date(from);
    results = results.filter((e) => new Date(e.date) >= fromDate);
  }
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    results = results.filter((e) => new Date(e.date) <= toDate);
  }
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (e) =>
        (e.expenseId || "").toLowerCase().includes(q) ||
        (e.title || "").toLowerCase().includes(q),
    );
  }

  results.sort((a, b) => {
    const dateDiff = new Date(b.date || 0) - new Date(a.date || 0);
    if (dateDiff !== 0) return dateDiff;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
  return results;
}

export async function getById(shopId, localId) {
  if (!shopId || !localId) return null;
  return db[TABLE].where("localId")
    .equals(localId)
    .and((e) => e.shopId === shopId)
    .first();
}

export async function getByServerId(shopId, serverId) {
  if (!shopId || !serverId) return null;
  return db[TABLE].where("serverId")
    .equals(serverId)
    .and((e) => e.shopId === shopId)
    .first();
}

export async function getSummary(shopId) {
  if (!shopId) return { totalExpenses: 0, todayExpenses: 0, monthExpenses: 0 };

  const all = await db[TABLE].where("shopId")
    .equals(shopId)
    .and((e) => !e.isVoided)
    .toArray();

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let totalExpenses = 0;
  let todayExpenses = 0;
  let monthExpenses = 0;

  for (const e of all) {
    const amt = Number(e.amount) || 0;
    totalExpenses += amt;
    const d = new Date(e.date);
    if (d >= startOfDay) todayExpenses += amt;
    if (d >= startOfMonth) monthExpenses += amt;
  }

  return { totalExpenses, todayExpenses, monthExpenses };
}

export async function create(shopId, data) {
  const localId = generateLocalId();
  const now = new Date().toISOString();

  const record = {
    localId,
    serverId: null,
    shopId: String(shopId || ""),
    expenseId: null,
    title: data.title || "",
    category: data.category || "",
    amount: Number(data.amount) || 0,
    method: data.method || "cash",
    date: data.date || now,
    note: data.note || "",
    isVoided: false,
    createdBy: data.createdBy || null,
    syncStatus: "pending",
    createdAt: now,
    updatedAt: now,
  };

  await db[TABLE].add(record);
  await addToSyncQueue({
    entity: "expense",
    operation: "create",
    localId,
    serverId: null,
    shopId: String(shopId || ""),
    payload: { ...data, localId },
  });

  return record;
}

export async function update(shopId, localId, data) {
  const existing = await getById(shopId, localId);
  if (!existing) throw new Error("Expense not found locally");

  const now = new Date().toISOString();
  const updated = {
    ...existing,
    ...data,
    syncStatus: "pending",
    updatedAt: now,
  };

  await db[TABLE].where("localId").equals(localId).modify(updated);

  if (!existing.serverId) {
    const existingItem = await db.syncQueue
      .where("localId")
      .equals(localId)
      .and(
        (i) =>
          i.entity === "expense" &&
          i.operation === "create" &&
          i.status !== "synced",
      )
      .first();

    if (existingItem) {
      await db.syncQueue.update(existingItem.id, {
        payload: {
          title: updated.title,
          category: updated.category,
          amount: updated.amount,
          method: updated.method,
          date: updated.date,
          note: updated.note || "",
          localId,
        },
      });
      return updated;
    }
  }

  await addToSyncQueue({
    entity: "expense",
    operation: existing.serverId ? "update" : "create",
    localId,
    serverId: existing.serverId,
    shopId,
    payload: { ...data, localId, serverId: existing.serverId },
  });

  return updated;
}

export async function voidExpense(shopId, localId) {
  const existing = await getById(shopId, localId);
  if (!existing) throw new Error("Expense not found locally");

  const now = new Date().toISOString();
  await db[TABLE].where("localId").equals(localId).modify({
    isVoided: true,
    syncStatus: "pending",
    updatedAt: now,
  });

  await addToSyncQueue({
    entity: "expense",
    operation: "void",
    localId,
    serverId: existing.serverId,
    shopId,
    payload: { localId, serverId: existing.serverId },
  });
}

export async function restoreExpense(shopId, localId) {
  const existing = await getById(shopId, localId);
  if (!existing) throw new Error("Expense not found locally");

  const now = new Date().toISOString();
  await db[TABLE].where("localId").equals(localId).modify({
    isVoided: false,
    syncStatus: "pending",
    updatedAt: now,
  });

  await addToSyncQueue({
    entity: "expense",
    operation: "restore",
    localId,
    serverId: existing.serverId,
    shopId,
    payload: { localId, serverId: existing.serverId },
  });
}

export async function markSynced(localId, serverId, serverData) {
  if (!localId) return;
  await db[TABLE].where("localId")
    .equals(localId)
    .modify({
      serverId,
      expenseId: serverData?.expenseId || undefined,
      syncStatus: "synced",
      updatedAt: new Date().toISOString(),
    });
}

export async function markSyncFailed(localId) {
  if (!localId) return;
  await db[TABLE].where("localId")
    .equals(localId)
    .modify({ syncStatus: "failed" });
}

export async function upsertFromServer(shopId, serverRecord) {
  if (!shopId || !serverRecord?._id) return null;

  try {
    const existing = await db[TABLE].where("serverId")
      .equals(String(serverRecord._id))
      .and((e) => e.shopId === shopId)
      .first();

    const record = {
      localId: existing?.localId || generateLocalId(),
      serverId: String(serverRecord._id),
      shopId: String(shopId),
      expenseId: serverRecord.expenseId || null,
      title: serverRecord.title || "",
      category: serverRecord.category || "",
      amount: serverRecord.amount || 0,
      method: serverRecord.method || "cash",
      date: serverRecord.date || new Date().toISOString(),
      note: serverRecord.note || "",
      isVoided: serverRecord.isVoided || false,
      createdBy: serverRecord.createdBy || null,
      syncStatus: "synced",
      createdAt: serverRecord.createdAt || new Date().toISOString(),
      updatedAt: serverRecord.updatedAt || new Date().toISOString(),
    };

    if (existing) {
      if (existing.syncStatus === "pending") return existing;
      await db[TABLE].where("localId").equals(existing.localId).modify(record);
    } else {
      await db[TABLE].add(record);
    }

    return record;
  } catch (err) {
    console.error(
      "expenseRepo.upsertFromServer error:",
      err,
      serverRecord?._id,
    );
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
