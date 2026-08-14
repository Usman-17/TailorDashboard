import express from "express";
const router = express.Router();

import { protectRoute } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import {
  getAllShops,
  getShop,
  createShop,
  createOwner,
  updateShop,
  updateSubscription,
  uploadLogo,
  deleteShop,
  toggleShopStatus,
  getShopStats,
  resetShopOwnerPassword,
} from "../controllers/shop.controller.js";

router.use(protectRoute, authorize("super_admin"));

router.get("/stats", getShopStats);
router.get("/all", getAllShops);
router.get("/:id", getShop);

router.post("/", createShop);
router.post("/create-owner", createOwner);
router.put("/:id", updateShop);
router.put("/:id/subscription", updateSubscription);
router.put("/:id/logo", uploadLogo);
router.put("/:id/toggle-status", toggleShopStatus);
router.put("/:id/reset-password", resetShopOwnerPassword);
router.delete("/:id", deleteShop);

export default router;
