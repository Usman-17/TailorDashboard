import db from "../db/database";
import { generateLocalId } from "../utils/generateLocalId";
import { addToSyncQueue } from "../db/syncQueue";

const TABLE = "measurements";

export async function getAll(shopId) {
  if (!shopId) return [];
  const results = await db[TABLE].where("shopId").equals(shopId).toArray();
  return results.sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  );
}

export async function getByCustomerId(shopId, customerId) {
  if (!shopId || !customerId) return null;
  return db[TABLE].where("shopId")
    .equals(shopId)
    .and((m) => m.customerId === customerId || m.customerLocalId === customerId)
    .sortBy("createdAt")
    .then((results) => results[results.length - 1] || null);
}

export async function getByCustomerLocalId(shopId, customerLocalId) {
  if (!shopId || !customerLocalId) return null;
  return db[TABLE].where("shopId")
    .equals(shopId)
    .and((m) => m.customerLocalId === customerLocalId)
    .sortBy("createdAt")
    .then((results) => results[results.length - 1] || null);
}

export async function getById(shopId, localId) {
  if (!shopId || !localId) return null;
  return db[TABLE].where("localId")
    .equals(localId)
    .and((m) => m.shopId === shopId)
    .first();
}

export async function create(shopId, data) {
  const localId = generateLocalId();
  const now = new Date().toISOString();

  const record = {
    localId,
    serverId: null,
    shopId: String(shopId || ""),
    customerId: data.customerServerId ? String(data.customerServerId) : null,
    customerLocalId: data.customerLocalId ? String(data.customerLocalId) : null,
    lower: data.lower || { type: "shalwar" },
    length: data.length,
    shoulder: data.shoulder,
    chest: data.chest,
    waist: data.waist,
    ghera: data.ghera,
    hip: data.hip,
    neck: data.neck,
    collar: data.collar,
    ban: data.ban,
    sleeveLength: data.sleeveLength,
    armHole: data.armHole,
    bicep: data.bicep,
    cuff: data.cuff,
    shalwarLength: data.shalwarLength,
    shalwarWaist: data.shalwarWaist,
    shalwarHip: data.shalwarHip,
    shalwarGhera: data.shalwarGhera,
    aasan: data.aasan,
    thigh: data.thigh,
    knee: data.knee,
    bottom: data.bottom,
    trouserLength: data.trouserLength,
    trouserWaist: data.trouserWaist,
    trouserHip: data.trouserHip,
    trouserGhera: data.trouserGhera,
    trouserAasan: data.trouserAasan,
    trouserThigh: data.trouserThigh,
    trouserKnee: data.trouserKnee,
    trouserBottom: data.trouserBottom,
    remarks: data.remarks || "",
    syncStatus: "pending",
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  };

  await db[TABLE].add(record);
  await addToSyncQueue({
    entity: "measurement",
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
  if (!existing) throw new Error("Measurement not found locally");

  const now = new Date().toISOString();
  const updated = {
    ...existing,
    ...data,
    syncStatus: "pending",
    updatedAt: now,
  };

  await db[TABLE].where("localId").equals(localId).modify(updated);

  await addToSyncQueue({
    entity: "measurement",
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
  if (!existing) throw new Error("Measurement not found locally");

  const now = new Date().toISOString();
  await db[TABLE].where("localId").equals(localId).modify({
    isDeleted: true,
    syncStatus: "pending",
    updatedAt: now,
  });

  await addToSyncQueue({
    entity: "measurement",
    operation: "delete",
    localId,
    serverId: existing.serverId,
    shopId,
    payload: {
      localId,
      serverId: existing.serverId,
      customerId: existing.customerId || existing.customerLocalId,
    },
  });
}

export async function markSynced(localId, serverId) {
  if (!localId) return;
  await db[TABLE].where("localId").equals(localId).modify({
    serverId,
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

export async function upsertFromServer(
  shopId,
  serverRecord,
  customerServerIdMap,
) {
  if (!shopId || !serverRecord?._id) return null;

  try {
    const customerId =
      typeof serverRecord.customer === "object"
        ? serverRecord.customer?._id
        : serverRecord.customer;

    const existing = await db[TABLE].where("serverId")
      .equals(String(serverRecord._id))
      .and((m) => m.shopId === shopId)
      .first();

    const record = {
      localId: existing?.localId || generateLocalId(),
      serverId: String(serverRecord._id),
      shopId: String(shopId),
      customerId: customerId ? String(customerId) : null,
      customerLocalId:
        customerServerIdMap?.[customerId] || existing?.customerLocalId || null,
      lower: serverRecord.lower || { type: "shalwar" },
      length: serverRecord.length,
      shoulder: serverRecord.shoulder,
      chest: serverRecord.chest,
      waist: serverRecord.waist,
      ghera: serverRecord.ghera,
      hip: serverRecord.hip,
      neck: serverRecord.neck,
      collar: serverRecord.collar,
      ban: serverRecord.ban,
      sleeveLength: serverRecord.sleeveLength,
      armHole: serverRecord.armHole,
      bicep: serverRecord.bicep,
      cuff: serverRecord.cuff,
      shalwarLength: serverRecord.shalwarLength,
      shalwarWaist: serverRecord.shalwarWaist,
      shalwarHip: serverRecord.shalwarHip,
      shalwarGhera: serverRecord.shalwarGhera,
      aasan: serverRecord.aasan,
      thigh: serverRecord.thigh,
      knee: serverRecord.knee,
      bottom: serverRecord.bottom,
      trouserLength: serverRecord.trouserLength,
      trouserWaist: serverRecord.trouserWaist,
      trouserHip: serverRecord.trouserHip,
      trouserGhera: serverRecord.trouserGhera,
      trouserAasan: serverRecord.trouserAasan,
      trouserThigh: serverRecord.trouserThigh,
      trouserKnee: serverRecord.trouserKnee,
      trouserBottom: serverRecord.trouserBottom,
      remarks: serverRecord.remarks || "",
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
      "measurementRepo.upsertFromServer error:",
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
