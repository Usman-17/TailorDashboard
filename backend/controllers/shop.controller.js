import Shop, { SUBSCRIPTION_PLAN } from "../models/shop.model.js";
import User, { ROLES } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(\+?92|0)?[3]\d{9}$/;

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

    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;

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
      "fullName email mobile role"
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

      const populated = await shop.populate(
        "owner",
        "fullName email mobile"
      );

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
      password,
      mobile,
      shopName,
      shopPhone,
      shopEmail,
      subscriptionPlan,
      subscriptionAmount,
    } = req.body;

    if (!fullName || !email || !password || !mobile || !shopName) {
      return res.status(400).json({
        error: "fullName, email, password, mobile, and shopName are required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid owner email format" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }

    if (mobile.length !== 11) {
      return res
        .status(400)
        .json({ error: "Mobile number must be 11 digits" });
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

    if (shopEmail) {
      const existingShop = await Shop.findOne({ email: shopEmail });
      if (existingShop) {
        return res.status(409).json({
          error: "A shop with this email already exists",
        });
      }
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
        { session }
      );

      const user = users[0];

      const shops = await Shop.create(
        [
          {
            name: shopName,
            owner: user._id,
            phone: shopPhone || mobile,
            email: shopEmail || `${email.split("@")[0]}-shop@tailor.local`,
            subscriptionPlan: subscriptionPlan || "free",
            subscriptionAmount: Number(subscriptionAmount) || 0,
          },
        ],
        { session }
      );

      user.shop = shops[0]._id;
      await user.save({ session });

      await session.commitTransaction();

      const populated = await shops[0].populate("owner", "fullName email mobile");

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
    const { name, phone, email, address, settings, isActive, subscriptionPlan, subscriptionAmount } = req.body;

    const shop = await Shop.findById(id);
    if (!shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    if (email && email.toLowerCase() !== shop.email) {
      if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      const existingEmail = await Shop.findOne({
        email: email.toLowerCase(),
        _id: { $ne: id },
      });
      if (existingEmail) {
        return res.status(409).json({
          error: "A shop with this email already exists",
        });
      }
    }

    if (name !== undefined) shop.name = name;
    if (phone !== undefined) shop.phone = phone;
    if (email !== undefined) shop.email = email;
    if (address !== undefined) shop.address = address;
    if (isActive !== undefined) shop.isActive = isActive;
    if (subscriptionPlan !== undefined) shop.subscriptionPlan = subscriptionPlan;
    if (subscriptionAmount !== undefined) shop.subscriptionAmount = Number(subscriptionAmount);

    if (settings) {
      if (settings.currency !== undefined)
        shop.settings.currency = settings.currency;
      if (settings.taxRate !== undefined)
        shop.settings.taxRate = settings.taxRate;
      if (settings.timezone !== undefined)
        shop.settings.timezone = settings.timezone;
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

    if (plan === "free") {
      shop.deactivateSubscription();
    } else {
      if (!durationMonths || durationMonths < 1 || durationMonths > 60) {
        return res.status(400).json({
          error: "Duration must be between 1 and 60 months",
        });
      }
      shop.activateSubscription(plan, durationMonths);
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

    const file = req.files.logo;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        error: "Only JPEG, PNG, WebP, and SVG files are allowed",
      });
    }

    if (file.size > 5 * 1024 * 1024) {
      return res
        .status(400)
        .json({ error: "File size must be less than 5MB" });
    }

    if (shop.logo && shop.logo.publicId) {
      await cloudinary.uploader.destroy(shop.logo.publicId);
    }

    const b64 = Buffer.from(file.data).toString("base64");
    const dataURI = `data:${file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "shop-logos",
      transformation: [{ width: 300, height: 300, crop: "limit" }],
    });

    shop.logo = {
      url: result.secure_url,
      publicId: result.public_id,
    };

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
      await User.findByIdAndUpdate(shop.owner, {
        $unset: { shop: "" },
      }, { session });

      if (shop.logo && shop.logo.publicId) {
        await cloudinary.uploader.destroy(shop.logo.publicId);
      }

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

    shop.isActive = !shop.isActive;
    await shop.save();

    return res.status(200).json({
      message: `Shop ${shop.isActive ? "activated" : "deactivated"} successfully`,
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
      inactiveShops,
      planCounts,
      expiringThisMonth,
    ] = await Promise.all([
      Shop.countDocuments(),
      Shop.countDocuments({ isActive: true }),
      Shop.countDocuments({ isActive: false }),
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
      inactiveShops,
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
