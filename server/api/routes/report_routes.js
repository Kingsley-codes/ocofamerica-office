const express = require("express");
const router = express.Router();
const { verifyToken, authorize } = require("../middleware/authMiddleware");
const {
  getReports,
  addExpense,
  addDonor,
  updateExpense,
  updateDonor,
  deleteExpense,
  deleteDonor,
  exportReports,
} = require("../controllers/reportController");

// All routes require authentication
router.use(verifyToken);

// Get reports (all authenticated users can view)
router.get("/", getReports);

// Finance and admin only routes - Updated to include all finance roles
const financeRoles = [
  "admin",
  "finance",
  "manager",
  "finance_director",
  "fundraiser",
  "finance_assistant",
  "call_time_manager",
  "donor_researcher",
  "event_fundraising_coordinator",
];

router.post("/expenses", authorize(...financeRoles), addExpense);
router.post("/donors", authorize(...financeRoles), addDonor);
router.put("/expenses/:id", authorize(...financeRoles), updateExpense);
router.put("/donors/:id", authorize(...financeRoles), updateDonor);
router.delete("/expenses/:id", authorize(...financeRoles), deleteExpense);
router.delete("/donors/:id", authorize(...financeRoles), deleteDonor);
router.post("/export", authorize(...financeRoles), exportReports);

module.exports = router;
