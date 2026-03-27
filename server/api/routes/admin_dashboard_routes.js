const express = require("express");
const router = express.Router();
const { verifyAdminToken } = require("../middleware/authMiddleware");
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
  uploadLogo,
  handleUploadErrors,
  addNewClient,
);
router.get("/campaign", verifyAdminToken, fetchAllCampaigns);
router.post("/campaign/suspend/:campaignId", verifyAdminToken, suspendCampaign);
router.post(
  "/campaign/activate/:campaignId",
  verifyAdminToken,
  activateCampaign,
);

module.exports = router;
