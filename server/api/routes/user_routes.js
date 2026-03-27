const express = require("express");
const router = express.Router();
const { verifyToken, authorize } = require("../middleware/authMiddleware");
const {
  getAllUsers,
  createUser,
  deleteUser,
  updateUserStatus,
  promoteToStaff,
  resetUserPassword,
  updateUser,
  getUserById,
} = require("../controllers/userController");

// All routes require authentication
router.use(verifyToken);

// Admin only routes
router.get("/", getAllUsers);
router.post("/", authorize("client_admin"), createUser);
router.delete("/:id", authorize("client_admin"), deleteUser);
router.patch("/:id/status", authorize("client_admin"), updateUserStatus);
router.patch(
  "/:id/promote",
  authorize("client_admin", "manager"),
  promoteToStaff,
);
router.post(
  "/:id/reset-password",
  authorize("client_admin"),
  resetUserPassword,
);

// Manager and admin can update users
router.put("/:id", authorize("client_admin", "manager"), updateUser);

// All authenticated users can get their own info
router.get("/:id", getUserById);

module.exports = router;
