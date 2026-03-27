const express = require("express");
const router = express.Router();
const { verifyAdminToken } = require("../middleware/authMiddleware");
const { addNewClient } = require("../controllers/adminDashboardController");
const {
  uploadLogo,
  handleUploadErrors,
} = require("../middleware/uploadMiddleware");

router.post(
  "/clients/create",
  verifyAdminToken,
  uploadLogo,
  handleUploadErrors,
  addNewClient,
);

module.exports = router;
