// api/routes/socialMediaRoutes.js
const express = require("express");
const router = express.Router();
const SocialMediaAccount = require("../models/SocialMediaAccount");
const AuditLog = require("../models/AuditLog");
const { verifyToken, authorize } = require("../middleware/authMiddleware");

// Apply verifyToken to all routes
router.use(verifyToken);

// Get all social media accounts
router.get("/", async (req, res) => {
  try {
    // Everyone can view social media accounts
    const accounts = await SocialMediaAccount.find()
      .sort({ platform: 1, isPrimary: -1, createdAt: -1 })
      .populate("addedBy", "firstName lastName email")
      .populate("verifiedBy", "firstName lastName email");

    return res.json({ success: true, accounts });
  } catch (error) {
    console.error("Error fetching social accounts:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch accounts" });
  }
});

// Add new social media account (admin/candidate only)
router.post("/", authorize("admin", "candidate"), async (req, res) => {
  try {
    const {
      platform,
      accountName,
      accountUrl,
      username,
      description,
      isPrimary,
      autoPost,
      permissions,
    } = req.body;

    // Check platform limits
    const platformAccounts = await SocialMediaAccount.countDocuments({
      platform,
    });
    const platformLimits = {
      facebook_page: 5,
      facebook_group: 5,
      instagram: 3,
      twitter: 3,
      youtube: 3,
      linkedin: 3,
      tiktok: 3,
      snapchat: 2,
      whatsapp: 2,
      telegram: 2,
      wechat: 2,
      clubhouse: 2,
      bluesky: 2,
    };

    if (platformAccounts >= (platformLimits[platform] || 3)) {
      return res.status(400).json({
        success: false,
        message: `Maximum accounts reached for this platform (${platformLimits[platform] || 3})`,
      });
    }

    // Generate verification code
    const verificationCode = `CAMPAIGN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const newAccount = await SocialMediaAccount.create({
      platform,
      accountName,
      accountUrl,
      username,
      description,
      isPrimary: isPrimary || false,
      isActive: true,
      isVerified: false,
      autoPost: autoPost || false,
      permissions: permissions || "read_write",
      verificationCode,
      addedBy: req.user.userId,
    });

    await AuditLog.create({
      action: "Add social media account",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: newAccount._id,
      targetType: "SocialMediaAccount",
      details: { platform, accountName },
    });

    return res.status(201).json({
      success: true,
      message: "Social media account added successfully",
      account: newAccount,
    });
  } catch (error) {
    console.error("Error adding social account:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to add account" });
  }
});

// Update social media account (admin/candidate only)
router.put("/:id", authorize("admin", "candidate"), async (req, res) => {
  try {
    const account = await SocialMediaAccount.findById(req.params.id);
    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    const {
      accountName,
      accountUrl,
      username,
      description,
      isPrimary,
      isActive,
      autoPost,
      permissions,
    } = req.body;

    // If setting as primary, unset other primaries for this platform
    if (isPrimary && !account.isPrimary) {
      await SocialMediaAccount.updateMany(
        { platform: account.platform, isPrimary: true },
        { isPrimary: false },
      );
    }

    account.accountName = accountName || account.accountName;
    account.accountUrl = accountUrl || account.accountUrl;
    account.username = username || account.username;
    account.description = description || account.description;
    account.isPrimary = isPrimary !== undefined ? isPrimary : account.isPrimary;
    account.isActive = isActive !== undefined ? isActive : account.isActive;
    account.autoPost = autoPost !== undefined ? autoPost : account.autoPost;
    account.permissions = permissions || account.permissions;

    await account.save();

    await AuditLog.create({
      action: "Update social media account",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: account._id,
      targetType: "SocialMediaAccount",
      details: { platform: account.platform, accountName: account.accountName },
    });

    return res.json({
      success: true,
      message: "Account updated successfully",
      account,
    });
  } catch (error) {
    console.error("Error updating social account:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update account" });
  }
});

// Delete social media account (admin/candidate only)
router.delete("/:id", authorize("admin", "candidate"), async (req, res) => {
  try {
    const account = await SocialMediaAccount.findById(req.params.id);
    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    await account.deleteOne();

    await AuditLog.create({
      action: "Delete social media account",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: account._id,
      targetType: "SocialMediaAccount",
      details: { platform: account.platform, accountName: account.accountName },
    });

    return res.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting social account:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete account" });
  }
});

// Verify social media account (admin/candidate only)
router.post(
  "/:id/verify",
  authorize("admin", "candidate"),
  async (req, res) => {
    try {
      const { verificationCode } = req.body;
      const account = await SocialMediaAccount.findById(req.params.id);

      if (!account) {
        return res
          .status(404)
          .json({ success: false, message: "Account not found" });
      }

      if (account.verificationCode === verificationCode) {
        account.isVerified = true;
        account.verifiedAt = new Date();
        account.verifiedBy = req.user.userId;
        await account.save();

        await AuditLog.create({
          action: "Verify social media account",
          user: req.user.userId,
          userEmail: req.user.email,
          userRole: req.user.role,
          targetId: account._id,
          targetType: "SocialMediaAccount",
          details: {
            platform: account.platform,
            accountName: account.accountName,
          },
        });

        return res.json({
          success: true,
          message: "Account verified successfully",
        });
      } else {
        return res
          .status(400)
          .json({ success: false, message: "Invalid verification code" });
      }
    } catch (error) {
      console.error("Error verifying account:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to verify account" });
    }
  },
);

// Toggle account status (admin/candidate only)
router.put("/:id/toggle", authorize("admin", "candidate"), async (req, res) => {
  try {
    const { isActive } = req.body;
    const account = await SocialMediaAccount.findById(req.params.id);

    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    account.isActive = isActive;
    await account.save();

    return res.json({
      success: true,
      message: `Account ${isActive ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    console.error("Error toggling account status:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update status" });
  }
});

// Set as primary account (admin/candidate only)
router.put(
  "/:id/primary",
  authorize("admin", "candidate"),
  async (req, res) => {
    try {
      const account = await SocialMediaAccount.findById(req.params.id);
      if (!account) {
        return res
          .status(404)
          .json({ success: false, message: "Account not found" });
      }

      // Remove primary from all other accounts of same platform
      await SocialMediaAccount.updateMany(
        { platform: account.platform, _id: { $ne: account._id } },
        { isPrimary: false },
      );

      account.isPrimary = true;
      await account.save();

      return res.json({
        success: true,
        message: "Primary account updated successfully",
      });
    } catch (error) {
      console.error("Error setting primary account:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to set primary account" });
    }
  },
);

module.exports = router;
