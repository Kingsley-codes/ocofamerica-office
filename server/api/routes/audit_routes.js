const express = require("express");
const router = express.Router();
const { verifyAdminToken, authorize } = require("../middleware/authMiddleware");
const {
  getAuditLogs,
  getAuditLogById,
  clearAuditLogs,
} = require("../controllers/auditController");

// All routes require authentication and admin role
router.use(verifyAdminToken);
router.use(authorize("admin"));

// Audit log routes
router.get("/", getAuditLogs);
router.get("/:id", getAuditLogById);
router.delete("/clear", clearAuditLogs);

module.exports = router;
