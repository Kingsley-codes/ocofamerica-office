// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const {
  verifyToken,
  verifyTempToken,
  authorize,
} = require("../middleware/authMiddleware");
const {
  login,
  verify2FA,
  resend2FACode,
  requestPasswordReset,
  resetPassword,
  validateSession,
  logout,
  changePassword,
  generateQRCode,
  enable2FA,
  disable2FA,
} = require("../controllers/authController");

// Public routes
router.post("/login", login);
router.post("/verify-2fa", verify2FA);
router.post("/resend-2fa", resend2FACode);
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

// QR code should be accessible with temp token (for first-time setup)
router.get("/qr-code", verifyTempToken, generateQRCode);

// Protected routes (require full authentication with session)
router.use(verifyToken);
router.get("/validate", validateSession);
router.post("/logout", logout);
router.post("/change-password", changePassword);
router.post("/enable-2fa", enable2FA);
router.post("/disable-2fa", disable2FA);

module.exports = router;
