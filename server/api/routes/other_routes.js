// api/routes/other_routes.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const {
  getAuditLogs,
  exportAuditLogs,
  getBackups,
  createBackup,
  restoreBackup,
  deleteBackup,
  downloadBackup,
  getSystemStats,
} = require("../controllers/otherController");

// All routes require authentication
router.use(verifyToken);

// Audit logs routes
router.get("/audit", getAuditLogs);
router.get("/audit/export", exportAuditLogs);

// Backup routes
router.get("/backups", getBackups);
router.post("/backups", createBackup);
router.post("/backups/:id/restore", restoreBackup);
router.delete("/backups/:id", deleteBackup);
router.get("/backups/:id/download", downloadBackup);

// System stats
router.get("/stats", getSystemStats);

module.exports = router;
