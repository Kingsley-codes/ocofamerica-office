// api/models/SocialMediaAccount.js
const mongoose = require("mongoose");

const socialMediaAccountSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      required: true,
      enum: [
        "facebook_page",
        "facebook_group",
        "instagram",
        "twitter",
        "youtube",
        "linkedin",
        "tiktok",
        "snapchat",
        "whatsapp",
        "telegram",
        "wechat",
        "clubhouse",
        "bluesky",
      ],
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
    },
    accountUrl: {
      type: String,
      required: true,
      trim: true,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    username: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    autoPost: {
      type: Boolean,
      default: false,
    },
    permissions: {
      type: String,
      enum: ["read_only", "read_write", "full"],
      default: "read_write",
    },
    verificationCode: {
      type: String,
      unique: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastUsed: {
      type: Date,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
socialMediaAccountSchema.index({ platform: 1, isPrimary: 1 });
socialMediaAccountSchema.index({ isActive: 1 });

const SocialMediaAccount = mongoose.model(
  "SocialMediaAccount",
  socialMediaAccountSchema,
);
module.exports = SocialMediaAccount;
