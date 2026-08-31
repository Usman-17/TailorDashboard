import Dexie from "dexie";

class TailorOfflineDB extends Dexie {
  constructor() {
    super("TailorOfflineDB");

    this.version(1).stores({
      customers:
        "++id, localId, serverId, shopId, customerId, name, phone, syncStatus, updatedAt",
      measurements:
        "++id, localId, serverId, shopId, customerId, customerLocalId, syncStatus, updatedAt",
      orders:
        "++id, localId, serverId, shopId, orderNumber, customerId, customerLocalId, status, deliveryDate, syncStatus, updatedAt",
      syncQueue:
        "++id, entity, operation, localId, serverId, shopId, status, createdAt, retryCount",
    });

    this.version(2)
      .stores({
        suitTypes:
          "++id, localId, serverId, shopId, name, syncStatus, updatedAt",
      })
      .upgrade(async (tx) => {
        // No data migration needed — table starts empty
      });

    this.version(3)
      .stores({
        expenses:
          "++id, localId, serverId, shopId, expenseId, category, method, date, isVoided, syncStatus, updatedAt",
      })
      .upgrade(async (tx) => {
        // No data migration needed — table starts empty
      });
  }

  getDatabaseForShop(shopId) {
    return {
      customers: this.customers.where("shopId").equals(shopId),
      measurements: this.measurements.where("shopId").equals(shopId),
      orders: this.orders.where("shopId").equals(shopId),
      suitTypes: this.suitTypes.where("shopId").equals(shopId),
    };
  }
}

const db = new TailorOfflineDB();

export default db;
