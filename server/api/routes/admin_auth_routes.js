const express = require("express");
const router = express.Router();
const { verifyAdminToken } = require("../middleware/authMiddleware");
const {
  adminLogin,
  verifyAdmin2FA,
  adminResend2FACode,
  validateAdminSession,
  adminLogout,
  requestAdminPasswordReset,
  resetAdminPassword,
  changeAdminPassword,
} = require("../controllers/adminAuthController");

// Public routes
router.post("/login", adminLogin);
router.post("/verify-2fa", verifyAdmin2FA);
router.post("/resend-2fa", adminResend2FACode);
router.post("/request-password-reset", requestAdminPasswordReset);
router.post("/reset-password", resetAdminPassword);

// Protected routes (require full authentication with session)
router.use(verifyAdminToken);
router.get("/validate", validateAdminSession);
router.post("/logout", adminLogout);
router.post("/change-password", changeAdminPassword);

module.exports = router;
