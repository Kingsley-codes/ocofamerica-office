const mongoose = require("mongoose");

const mediaAssetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "logo",
        "yard_sign",
        "large_sign",
        "t_shirt",
        "cap",
        "table_cloth",
        "photo",
        "video",
        "document",
      ],
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: String,
    fileSize: {
      type: Number,
      required: true,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    mimeType: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [String],
    campaignId: {
      type: String,
      default: "campaign_001",
    },
    description: String,
    status: {
      type: String,
      enum: ["active", "archived", "pending_review"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

const MediaAsset = mongoose.model("MediaAsset", mediaAssetSchema);
module.exports = MediaAsset;
