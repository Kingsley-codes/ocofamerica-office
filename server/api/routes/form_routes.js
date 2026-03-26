const express = require("express");
const router = express.Router();
const { verifyToken, authorize } = require("../middleware/authMiddleware");
const Form = require("../models/Form");
const AuditLog = require("../models/AuditLog");

// Get all forms (all authenticated users)
router.get("/", verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search } = req.query;
    const query = {};

    // Filter by category
    if (category && category !== "all") {
      query.category = category;
    }

    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const forms = await Form.find(query)
      .populate("uploadedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Form.countDocuments(query);

    res.json({
      success: true,
      forms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get forms error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch forms",
    });
  }
});

// Get single form
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const form = await Form.findById(req.params.id).populate(
      "uploadedBy",
      "firstName lastName email",
    );

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    res.json({
      success: true,
      form,
    });
  } catch (error) {
    console.error("Get form error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch form",
    });
  }
});

// Upload form (admin and manager only)
router.post("/", verifyToken, authorize("admin", "manager"), async (req, res) => {
  try {
    // Set content type header to ensure JSON response
    res.setHeader('Content-Type', 'application/json');
    
    const {
      title,
      description,
      category,
      version,
      fileName,
      fileUrl,
      cloudinaryPublicId,
      fileSize,
      mimeType,
    } = req.body;

    // Validate required fields
    if (!title || !fileName || !fileUrl || !fileSize) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const form = await Form.create({
      title,
      description,
      category: category || "other",
      version: version || "1.0",
      fileName,
      fileUrl,
      cloudinaryPublicId,
      fileSize,
      mimeType,
      uploadedBy: req.user.userId,
    });

    // Populate uploadedBy for response
    await form.populate("uploadedBy", "firstName lastName email");

    // Log audit
    await AuditLog.create({
      action: "Upload form",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: form._id,
      targetType: "Form",
      details: { title, category, version },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({
      success: true,
      message: "Form uploaded successfully",
      form,
    });
  } catch (error) {
    console.error("Upload form error:", error);
    
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to upload form",
    });
  }
});

// Delete form (admin and manager only)
router.delete("/:id", verifyToken, authorize("admin", "manager"), async (req, res) => {
  try {
    // Set content type header to ensure JSON response
    res.setHeader('Content-Type', 'application/json');
    
    const form = await Form.findById(req.params.id);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    // Log audit before deletion
    await AuditLog.create({
      action: "Delete form",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: form._id,
      targetType: "Form",
      details: { title: form.title, category: form.category },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    await form.deleteOne();

    res.json({
      success: true,
      message: "Form deleted successfully",
    });
  } catch (error) {
    console.error("Delete form error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete form",
    });
  }
});

// Record download
router.post("/:id/download", verifyToken, async (req, res) => {
  try {
    // Set content type header to ensure JSON response
    res.setHeader('Content-Type', 'application/json');
    
    const form = await Form.findById(req.params.id);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    form.downloadCount = (form.downloadCount || 0) + 1;
    await form.save();

    res.json({
      success: true,
      message: "Download recorded",
    });
  } catch (error) {
    console.error("Record download error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record download",
    });
  }
});

module.exports = router;