import Shop, { SUBSCRIPTION_PLAN } from "../models/shop.model.js";
import User, { ROLES } from "../models/user.model.js";
import Payment from "../models/payment.model.js";
import bcrypt from "bcryptjs";
import { uploadImage, deleteImage } from "../utils/uploadImage.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(\+?92|0)?[3]\d{9}$/;

export const syncMissingShopPayments = async () => {
  try {
    const shops = await Shop.find({ amountReceived: { $gt: 0 } });
    for (const shop of shops) {
      const paymentCount = await Payment.countDocuments({ shop: shop._id });
      if (paymentCount === 0) {
        await Payment.create({
          shop: shop._id,
          amount: shop.amountReceived,
          paymentMethod: "cash",
          referenceNo: "",
          notes: "Initial payment on shop creation",
          subscriptionPlan: shop.subscriptionPlan || "monthly",
          previousExpiry: shop.subscriptionStart || new Date(),
          newExpiry: shop.subscriptionExpiry || new Date(),
          recordedBy: shop.owner,
        });
        console.log(
          `Synced missing initial payment record for shop: ${shop.name}`,
        );
      }
    }
  } catch (err) {
    console.error("Error syncing missing shop payments:", err.message);
  }
};

const sanitizeShop = (shop) => {
  const obj = shop.toObject ? shop.toObject() : { ...shop };
  return obj;
};

// GET /api/shops/all
export const getAllShops = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      status = "",
      plan = "",
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    if (status === "active") filter.isActive = "active";
    if (status === "inactive") filter.isActive = { $ne: "active" };
    if (status === "expired") filter.isActive = "expired";
    if (status === "suspended") filter.isActive = "suspended";

    if (plan && Object.values(SUBSCRIPTION_PLAN).includes(plan)) {
      filter.subscriptionPlan = plan;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const allowedSorts = ["name", "email", "createdAt", "subscriptionPlan"];
    const sortField = allowedSorts.includes(sortBy) ? sortBy : "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    const [shops, total] = await Promise.all([
      Shop.find(filter)
        .populate("owner", "fullName email mobile")
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Shop.countDocuments(filter),
    ]);

    return res.status(200).json({
      shops,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error in getAllShops:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/shops/:id
export const getShop = async (req, res) => {
  try {
    const { id } = req.params;

    const shop = await Shop.findById(id).populate(
      "owner",
      "fullName email mobile role",
    );

    if (!shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    return res.status(200).json(shop);
  } catch (error) {
    console.error("Error in getShop:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST /api/shops
export const createShop = async (req, res) => {
  try {
    const {
      name,
      owner: ownerId,
      phone,
      email,
      address,
      subscriptionPlan = "free",
    } = req.body;

    if (!name || !ownerId || !phone || !email) {
      return res.status(400).json({
        error: "Name, owner, phone, and email are required",
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const owner = await User.findById(ownerId);
    if (!owner) {
      return res.status(404).json({ error: "Owner user not found" });
    }

    if (owner.shop) {
      return res.status(409).json({
        error: "This user already owns a shop",
      });
    }

    const existingEmail = await Shop.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({
        error: "A shop with this email already exists",
      });
    }

    const session = await Shop.startSession();
    session.startTransaction();

    try {
      const shopData = {
        name,
        owner: ownerId,
        phone,
        email,
        address: address || {},
        subscriptionPlan,
      };

      if (subscriptionPlan !== "free") {
        shopData.subscriptionStart = new Date();
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 12);
        shopData.subscriptionExpiry = expiry;
      }

      const shops = await Shop.create([shopData], { session });
      const shop = shops[0];

      owner.shop = shop._id;
      await owner.save({ session });

      await session.commitTransaction();

      const populated = await shop.populate("owner", "fullName email mobile");

      return res.status(201).json(populated);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Error in createShop:", error.message);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        error: `A shop with this ${field} already exists`,
      });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST /api/shops/create-owner
export const createOwner = async (req, res) => {
  try {
    const {
      fullName,
      email,
      mobile,
      shopName,
      subscriptionPlan,
      subscriptionAmount,
      subscriptionDuration,
      subscriptionStart,
      subscriptionExpiry,
      isActive,
      amountReceived,
      notes,
      address: addressRaw,
    } = req.body;

    const address =
      typeof addressRaw === "string" ? JSON.parse(addressRaw) : addressRaw;
    const password = "123456789";

    if (!fullName || !email || !mobile || !shopName) {
      return res.status(400).json({
        error: "fullName, email, mobile, and shopName are required",
      });
    }

    if (!address || !address.city) {
      return res.status(400).json({
        error: "City is required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid owner email format" });
    }

    if (mobile.length !== 11) {
      return res.status(400).json({ error: "Mobile number must be 11 digits" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      return res.status(409).json({
        error:
          existingUser.email === email
            ? "Email is already taken"
            : "Phone number is already taken",
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const session = await User.startSession();
    session.startTransaction();

    try {
      const users = await User.create(
        [
          {
            fullName,
            email,
            mobile,
            password: hashedPassword,
            role: ROLES.OWNER,
          },
        ],
        { session },
      );

      const user = users[0];

      const shops = await Shop.create(
        [
          {
            name: shopName,
            owner: user._id,
            phone: mobile,
            email: email,
            subscriptionPlan: subscriptionPlan || "monthly",
            subscriptionAmount: Number(subscriptionAmount) || 1000,
            amountReceived: Number(amountReceived) || 0,
            subscriptionDuration: subscriptionDuration || null,
            subscriptionStart: subscriptionStart || null,
            subscriptionExpiry: subscriptionExpiry || null,
            isActive: isActive || "active",
            notes: notes || "",
            address: address || {},
          },
        ],
        { session },
      );

      user.shop = shops[0]._id;
      await user.save({ session });

      await session.commitTransaction();

      const populated = await shops[0].populate(
        "owner",
        "fullName email mobile",
      );

      let logo = null;
      if (req.files && req.files.logo) {
        logo = await uploadImage(req.files.logo, "shop-logos");
        populated.logo = logo;
        await populated.save();
      }

      // Auto-create a Payment record if an initial amount was received on shop creation
      const initialAmount = Number(amountReceived) || 0;
      if (initialAmount > 0) {
        await Payment.create({
          shop: shops[0]._id,
          amount: initialAmount,
          paymentMethod: "cash",
          referenceNo: "",
          notes: "Initial payment on shop creation",
          subscriptionPlan: subscriptionPlan || "monthly",
          previousExpiry: subscriptionStart
            ? new Date(subscriptionStart)
            : new Date(),
          newExpiry: subscriptionExpiry
            ? new Date(subscriptionExpiry)
            : new Date(),
          recordedBy: req.user._id,
        });
      }

      return res.status(201).json({
        message: "Owner account and shop created successfully",
        shop: populated,
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Error in createOwner:", error.message);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        error: `A record with this ${field} already exists`,
      });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// PUT /api/shops/:id
export const updateShop = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      shopName,
      phone,
      email,
      address: addressRaw,
      isActive,
      subscriptionPlan,
      subscriptionAmount,
      subscriptionDuration,
      subscriptionStart,
      subscriptionExpiry,
      amountReceived,
      notes,
    } = req.body;

    const address =
      typeof addressRaw === "string" ? JSON.parse(addressRaw) : addressRaw;

    const shop = await Shop.findById(id);
    if (!shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    if (shopName !== undefined) shop.name = shopName;
    if (phone !== undefined) shop.phone = phone;
    if (email !== undefined) shop.email = email;
    if (address !== undefined) shop.address = address;
    if (isActive !== undefined) shop.isActive = isActive;
    if (subscriptionPlan !== undefined)
      shop.subscriptionPlan = subscriptionPlan;
    if (subscriptionAmount !== undefined)
      shop.subscriptionAmount = Number(subscriptionAmount);
    if (subscriptionDuration !== undefined)
      shop.subscriptionDuration = subscriptionDuration || null;
    if (subscriptionStart !== undefined)
      shop.subscriptionStart = subscriptionStart || null;
    if (subscriptionExpiry !== undefined)
      shop.subscriptionExpiry = subscriptionExpiry || null;
    if (amountReceived !== undefined)
      shop.amountReceived = Number(amountReceived) || 0;
    if (notes !== undefined) shop.notes = notes;

    if (req.files && req.files.logo) {
      await deleteImage(shop.logo);
      shop.logo = await uploadImage(req.files.logo, "shop-logos");
    }

    const updated = await shop.save();
    return res.status(200).json(updated);
  } catch (error) {
    console.error("Error in updateShop:", error.message);
    if (error.code === 11000) {
      return res.status(409).json({
        error: "A shop with this email already exists",
      });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// PUT /api/shops/:id/subscription
export const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, durationMonths } = req.body;

    if (!plan || !Object.values(SUBSCRIPTION_PLAN).includes(plan)) {
      return res.status(400).json({
        error: `Invalid plan. Must be one of: ${Object.values(SUBSCRIPTION_PLAN).join(", ")}`,
      });
    }

    const shop = await Shop.findById(id);
    if (!shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    if (plan === "custom") {
      if (!durationMonths || durationMonths < 1 || durationMonths > 60) {
        return res.status(400).json({
          error: "Duration must be between 1 and 60 months",
        });
      }
      shop.activateSubscription(plan, durationMonths);
    } else {
      const months = { monthly: 1, quarterly: 3, "half-yearly": 6, yearly: 12 };
      shop.activateSubscription(plan, months[plan] || 1);
    }

    const updated = await shop.save();
    return res.status(200).json(updated);
  } catch (error) {
    console.error("Error in updateSubscription:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// PUT /api/shops/:id/logo
export const uploadLogo = async (req, res) => {
  try {
    const { id } = req.params;

    const shop = await Shop.findById(id);
    if (!shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    if (!req.files || !req.files.logo) {
      return res.status(400).json({ error: "No logo file provided" });
    }

    await deleteImage(shop.logo);

    const logo = await uploadImage(req.files.logo, "shop-logos");

    shop.logo = logo;
    await shop.save();

    return res.status(200).json({
      message: "Logo uploaded successfully",
      logo: shop.logo,
    });
  } catch (error) {
    console.error("Error in uploadLogo:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// DELETE /api/shops/:id
export const deleteShop = async (req, res) => {
  try {
    const { id } = req.params;

    const shop = await Shop.findById(id);
    if (!shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    const session = await Shop.startSession();
    session.startTransaction();

    try {
      await User.findByIdAndUpdate(
        shop.owner,
        {
          $unset: { shop: "" },
        },
        { session },
      );

      await deleteImage(shop.logo);

      await Shop.findByIdAndDelete(id, { session });

      await session.commitTransaction();

      return res.status(200).json({ message: "Shop deleted successfully" });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Error in deleteShop:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// PUT /api/shops/:id/toggle-status
export const toggleShopStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const shop = await Shop.findById(id);
    if (!shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    const { status } = req.body;

    if (!status || !["active", "suspended", "expired"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    shop.isActive = status;
    await shop.save();

    return res.status(200).json({
      message: `Shop ${status} successfully`,
      isActive: shop.isActive,
    });
  } catch (error) {
    console.error("Error in toggleShopStatus:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/shops/stats
export const getShopStats = async (req, res) => {
  try {
    const [
      totalShops,
      activeShops,
      expiredShops,
      suspendedShops,
      planCounts,
      expiringThisMonth,
    ] = await Promise.all([
      Shop.countDocuments(),
      Shop.countDocuments({ isActive: "active" }),
      Shop.countDocuments({ isActive: "expired" }),
      Shop.countDocuments({ isActive: "suspended" }),
      Shop.aggregate([
        { $group: { _id: "$subscriptionPlan", count: { $sum: 1 } } },
      ]),
      Shop.countDocuments({
        subscriptionPlan: { $ne: "free" },
        subscriptionExpiry: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    return res.status(200).json({
      totalShops,
      activeShops,
      expiredShops,
      suspendedShops,
      expiringThisMonth,
      byPlan: planCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error("Error in getShopStats:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// PUT /api/shops/:id/reset-password
export const resetShopOwnerPassword = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    const owner = await User.findById(shop.owner).select("+password");
    if (!owner) {
      return res.status(404).json({ error: "Shop owner not found" });
    }

    const salt = await bcrypt.genSalt(12);
    owner.password = await bcrypt.hash("123456789", salt);
    owner.passwordChangedAt = Date.now();
    owner.refreshTokens = [];
    await owner.save();

    return res.status(200).json({
      success: true,
      message: `Password for ${shop.name} owner has been reset to 123456789`,
    });
  } catch (error) {
    console.error("Error in resetShopOwnerPassword:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
