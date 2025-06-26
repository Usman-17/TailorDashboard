import express from "express";
const router = express.Router();

import {
  addCustomer,
  deleteCustomer,
  getAllCustomers,
  getCustomer,
  updateCustomer,
} from "../controllers/customer.controller.js";
import { protectRoute } from "../middlewares/authMiddleware.js";


router.get("/all", protectRoute, getAllCustomers);
router.get("/:id", protectRoute, getCustomer);

router.post("/add", protectRoute, addCustomer);
router.put("/update/:id", protectRoute, updateCustomer);
router.delete("/:id", protectRoute, deleteCustomer);

export default router;
