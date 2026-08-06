import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import { v2 as cloudinary } from "cloudinary";

import dbConnect from "./db/ConnectMongoDB.js";
import { seedSuperAdmin } from "./controllers/auth.controller.js";

import authRoutes from "./routes/auth.route.js";
import shopRoutes from "./routes/shop.route.js";
import customerRoutes from "./routes/customer.route.js";
import measurementsRoutes from "./routes/measurement.route.js";
import orderRoutes from "./routes/order.route.js";
import expenseRoutes from "./routes/expense.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";

const app = express();
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/measurements", measurementsRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 9000;

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await dbConnect();
  await seedSuperAdmin(null, null);
});
