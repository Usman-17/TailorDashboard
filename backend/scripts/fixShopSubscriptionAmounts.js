import dotenv from "dotenv";
import dbConnect from "../db/ConnectMongoDB.js";
import Shop from "../models/shop.model.js";

dotenv.config();

const fixAmounts = async () => {
  try {
    await dbConnect();
    const shops = await Shop.find({});
    console.log(`Found ${shops.length} shops.`);

    const PLAN_PRICES = {
      monthly: 1000,
      quarterly: 2500,
      "half-yearly": 4500,
      yearly: 8000,
    };

    for (const shop of shops) {
      if (PLAN_PRICES[shop.subscriptionPlan]) {
        const correctAmount = PLAN_PRICES[shop.subscriptionPlan];
        if (shop.subscriptionAmount !== correctAmount) {
          console.log(
            `Updating ${shop.name}: ${shop.subscriptionAmount} -> ${correctAmount}`,
          );
          shop.subscriptionAmount = correctAmount;
          await shop.save();
        }
      }
    }
    console.log("Fix completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error fixing shop amounts:", err);
    process.exit(1);
  }
};

fixAmounts();
