const AuditLog = require("../models/AuditLog");

// Get audit logs
const getAuditLogs = async (req, res) => {
  try {
    const {
      action,
      userEmail,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    // Filter by action
    if (action && action !== "all") {
      query.action = { $regex: action, $options: "i" };
    }

    // Filter by user email
    if (userEmail) {
      query.userEmail = { $regex: userEmail, $options: "i" };
    }

    // Filter by date range
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const skip = (page - 1) * limit;

    // Get audit logs with pagination
    const auditLogs = await AuditLog.find(query)
      .populate("user", "firstName lastName email role")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await AuditLog.countDocuments(query);

    return res.json({
      success: true,
      auditLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get audit logs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
    });
  }
};

// Get audit log by ID
const getAuditLogById = async (req, res) => {
  try {
    const auditLogId = req.params.id;

    const auditLog = await AuditLog.findById(auditLogId).populate(
      "user",
      "firstName lastName email role",
    );

    if (!auditLog) {
      return res.status(404).json({
        success: false,
        message: "Audit log not found",
      });
    }

    return res.json({
      success: true,
      auditLog,
    });
  } catch (error) {
    console.error("Get audit log error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit log",
    });
  }
};

// Clear audit logs (admin only)
const clearAuditLogs = async (req, res) => {
  try {
    const { olderThan } = req.body;

    let query = {};
    if (olderThan) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThan));
      query.timestamp = { $lt: cutoffDate };
    }

    const result = await AuditLog.deleteMany(query);

    // Log audit of the clear action
    await AuditLog.create({
      action: "Clear audit logs",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      details: { deletedCount: result.deletedCount, olderThan },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: `Cleared ${result.deletedCount} audit logs`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Clear audit logs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to clear audit logs",
    });
  }
};

module.exports = {
  getAuditLogs,
  getAuditLogById,
  clearAuditLogs,
};
