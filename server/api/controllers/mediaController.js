// api/controllers/mediaController.js
const MediaAsset = require("../models/MediaAsset");
const AuditLog = require("../models/AuditLog");
const { PERMISSIONS } = require("../../../lib/permissions");

const getMediaAssets = async (req, res) => {
  try {
    if (!PERMISSIONS.CAN_VIEW_MEDIA(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You don't have permission to view media.",
      });
    }

    const { type, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (type && type !== "all") {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const mediaAssets = await MediaAsset.find(query)
      .populate("uploadedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MediaAsset.countDocuments(query);

    return res.json({
      success: true,
      mediaAssets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get media assets error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch media assets",
    });
  }
};

const createMedia = async (req, res) => {
  try {
    if (!PERMISSIONS.CAN_UPLOAD_MEDIA(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Media team and Executive team can upload media.",
      });
    }

    const {
      name,
      type,
      fileName,
      fileUrl,
      cloudinaryPublicId,
      fileSize,
      mimeType,
      tags,
      description,
    } = req.body;

    const mediaAsset = await MediaAsset.create({
      name,
      type: type || getFileType(mimeType),
      fileName,
      fileUrl,
      cloudinaryPublicId,
      fileSize,
      mimeType,
      uploadedBy: req.user.userId,
      tags: tags || [],
      description,
    });

    await mediaAsset.populate("uploadedBy", "firstName lastName email");

    await AuditLog.create({
      action: "Upload media asset",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: mediaAsset._id,
      targetType: "MediaAsset",
      details: { name: mediaAsset.name, type: mediaAsset.type },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(201).json({
      success: true,
      message: "Media uploaded successfully",
      mediaAsset,
    });
  } catch (error) {
    console.error("Create media error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create media asset",
    });
  }
};

const deleteMedia = async (req, res) => {
  try {
    const mediaId = req.params.id;

    if (!PERMISSIONS.CAN_UPLOAD_MEDIA(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Media team and Executive team can delete media.",
      });
    }

    const mediaAsset = await MediaAsset.findById(mediaId);

    if (!mediaAsset) {
      return res.status(404).json({
        success: false,
        message: "Media asset not found",
      });
    }

    const isUploader = mediaAsset.uploadedBy.toString() === req.user.userId;
    const isAdmin = req.user.role === "admin";

    if (!isUploader && !isAdmin && req.user.role !== "media_director") {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own uploads",
      });
    }

    await MediaAsset.findByIdAndDelete(mediaId);

    await AuditLog.create({
      action: "Delete media asset",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: mediaAsset._id,
      targetType: "MediaAsset",
      details: { name: mediaAsset.name, type: mediaAsset.type },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Media asset deleted successfully",
    });
  } catch (error) {
    console.error("Delete media error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete media asset",
    });
  }
};

const downloadMedia = async (req, res) => {
  try {
    const mediaId = req.params.id;

    if (!PERMISSIONS.CAN_VIEW_MEDIA(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const mediaAsset = await MediaAsset.findById(mediaId);

    if (!mediaAsset) {
      return res.status(404).json({
        success: false,
        message: "Media asset not found",
      });
    }

    await AuditLog.create({
      action: "Download media asset",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: mediaAsset._id,
      targetType: "MediaAsset",
      details: { name: mediaAsset.name },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      downloadUrl: mediaAsset.fileUrl,
      fileName: mediaAsset.fileName,
    });
  } catch (error) {
    console.error("Download media error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get download URL",
    });
  }
};

const getFileType = (mimeType) => {
  if (!mimeType) return "document";
  if (mimeType.startsWith("image/")) return "photo";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "document";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return "document";
  if (mimeType.includes("word") || mimeType.includes("document"))
    return "document";
  return "document";
};

module.exports = {
  getMediaAssets,
  createMedia,
  deleteMedia,
  downloadMedia,
};
