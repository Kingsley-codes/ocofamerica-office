const express = require("express");
const router = express.Router();
const { verifyAdminToken, authorize } = require("../middleware/authMiddleware");
const {
  addNewClient,
  fetchAllCampaigns,
  suspendCampaign,
  activateCampaign,
} = require("../controllers/adminDashboardController");
const {
  uploadLogo,
  handleUploadErrors,
} = require("../middleware/uploadMiddleware");

router.post(
  "/campaign/create",
  verifyAdminToken,
  authorize("admin"),
  uploadLogo,
  handleUploadErrors,
  addNewClient,
);
router.get(
  "/campaign",
  verifyAdminToken,
  authorize("admin"),
  fetchAllCampaigns,
);
router.post(
  "/campaign/suspend/:campaignId",
  verifyAdminToken,
  authorize("admin"),
  suspendCampaign,
);
router.post(
  "/campaign/activate/:campaignId",
  verifyAdminToken,
  authorize("admin"),
  activateCampaign,
);

module.exports = router;
