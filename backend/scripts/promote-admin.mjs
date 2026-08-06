import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

try {
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await mongoose.connection.db.collection("users").updateOne(
    { email: "usmanarif5152@gmail.com" },
    { $set: { role: "super_admin" } }
  );
  console.log("Matched:", result.matchedCount, "Modified:", result.modifiedCount);
  await mongoose.disconnect();
  process.exit(0);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
