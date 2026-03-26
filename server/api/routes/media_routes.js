// In your routes file
const express = require("express");
const router = express.Router();
const { verifyToken, authorize } = require("../middleware/authMiddleware");
const {
  getMediaAssets,
  downloadMedia,
  createMedia,
  deleteMedia,
} = require("../controllers/mediaController");

// All routes require authentication
router.use(verifyToken);

// Get media assets (all authenticated users can view)
router.get("/", getMediaAssets);
router.get("/:id/download", downloadMedia);

// Media and admin only routes
router.post(
  "/",
  authorize("client_admin", "media", "manager"),
  createMedia, // Changed from uploadMedia
);

router.delete("/:id", authorize("client_admin", "media"), deleteMedia);

module.exports = router;
