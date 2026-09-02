import db from "./database";

/**
 * Get cached dashboard data for a given key and shopId.
 * Returns { data, updatedAt } or null.
 */
export async function getDashboardCache(shopId, queryKey) {
  if (!shopId) return null;
  try {
    const record = await db.dashboardCache.get(`${shopId}:${queryKey}`);
    return record || null;
  } catch {
    return null;
  }
}

/**
 * Save dashboard data to local cache.
 */
export async function setDashboardCache(shopId, queryKey, data) {
  if (!shopId) return;
  try {
    await db.dashboardCache.put({
      key: `${shopId}:${queryKey}`,
      shopId: String(shopId),
      data: JSON.parse(JSON.stringify(data)),
      updatedAt: new Date().toISOString(),
    });
  } catch {
    // ignore
  }
}
