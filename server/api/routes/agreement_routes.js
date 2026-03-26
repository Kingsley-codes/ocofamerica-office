const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const {
  getAgreementTemplates,
  getUserAgreements,
  signAgreement,
  deleteSignature,
  downloadAgreement,
  getAgreementStatus,
  getMyAgreements,
} = require("../controllers/agreementController");

// All routes require authentication
router.use(verifyToken);

// Get agreement templates
router.get("/templates", getAgreementTemplates);

// Get user agreements (user can only get their own)
router.get("/user/:userId", getUserAgreements);

// Get my agreements
router.get("/my-agreements", getMyAgreements);

// Sign agreement (user can only sign their own)
router.post("/sign/:userId", signAgreement);

// Delete signature (user can only delete their own)
router.delete("/signature/:userId/:agreementType", deleteSignature);

// Download agreement (user can only download their own)
router.get("/download/:userId/:agreementType", downloadAgreement);

// Get agreement status (user can only check their own)
router.get("/status/:userId", getAgreementStatus);

module.exports = router;
