// models/Backup.js
const mongoose = require("mongoose");

const backupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    type: {
      type: String,
      enum: ["full", "database", "media", "settings"],
      default: "full",
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    size: {
      type: Number,
      default: 0,
    },
    filePath: String,
    cloudStorageUrl: String,
    includes: {
      database: {
        type: Boolean,
        default: true,
      },
      media: {
        type: Boolean,
        default: true,
      },
      settings: {
        type: Boolean,
        default: true,
      },
    },
    collectionsBackedUp: [String],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    campaignId: {
      type: String,
      default: "campaign_001",
    },
    metadata: mongoose.Schema.Types.Mixed,
    error: String,
  },
  {
    timestamps: true,
  },
);

// Index for efficient querying
backupSchema.index({ campaignId: 1, createdAt: -1 });
backupSchema.index({ status: 1, createdAt: -1 });

const Backup = mongoose.model("Backup", backupSchema);
module.exports = Backup;
