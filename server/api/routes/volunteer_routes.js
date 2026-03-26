const express = require("express");
const router = express.Router();
const { verifyToken, authorize } = require("../middleware/authMiddleware");
const {
  getVolunteers,
  getVolunteerById,
  addVolunteer,
  updateVolunteer,
  deleteVolunteer,
  promoteVolunteer,
  updateAccess,
  changePassword,
  resetPassword,
  addVolunteerHours,
  updateW9Form,
  updateAssignments,
  exportVolunteers,
} = require("../controllers/volunteerController");

// Apply authentication to all routes
router.use(verifyToken);

// Get volunteers (manager, field director, and admin can view)
router.get("/", getVolunteers);
router.get("/export", authorize("admin", "manager", "field"), exportVolunteers);
router.get("/:id", authorize("admin", "manager", "field"), getVolunteerById);

// Add new volunteer (admin only)
router.post("/", authorize("admin"), addVolunteer);

// Update volunteer (admin only)
router.put("/:id", authorize("admin"), updateVolunteer);

// Delete volunteer (admin only)
router.delete("/:id", authorize("admin"), deleteVolunteer);

// Password management (admin only)
router.post("/:id/change-password", authorize("admin"), changePassword);
router.post("/:id/reset-password", authorize("admin"), resetPassword);

// Promote volunteer to staff (admin only)
router.post("/:id/promote", authorize("admin"), promoteVolunteer);

// Update access (admin only)
router.put("/:id/access", authorize("admin"), updateAccess);

// Manager and admin only routes
router.post("/:id/hours", authorize("admin", "manager"), addVolunteerHours);
router.put("/:id/w9", authorize("admin", "manager"), updateW9Form);
router.put(
  "/:id/assignments",
  authorize("admin", "manager", "field"),
  updateAssignments,
);

module.exports = router;
