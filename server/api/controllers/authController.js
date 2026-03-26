const User = require("../models/User");
const Session = require("../models/Session");
const AuditLog = require("../models/AuditLog");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const emailService = require("../../../utils/emailService");

// Generate session ID
const generateSessionId = () => {
  return (
    "session_" +
    Math.random().toString(36).substr(2, 9) +
    Date.now().toString(36)
  );
};

// Generate 6-digit code
const generate2FACode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Login user - ALWAYS require 2FA for all users
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt for:", email);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found:", email);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if user is active
    if (user.status !== "active") {
      console.log("User not active:", email, "status:", user.status);
      return res.status(403).json({
        success: false,
        message: "Account is not active. Please contact administrator.",
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log("Invalid password for:", email);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Log audit
    await AuditLog.create({
      action: "User login attempt",
      user: user._id,
      userEmail: user.email,
      userRole: user.role,
      campaign: user.campaign,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Update last login
    user.lastLogin = new Date();
    await User.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } },
    );

    console.log(
      "2FA required for user:",
      email,
      "2FA enabled:",
      user.twoFactorEnabled,
    );

    // For users who already have 2FA enabled, send code immediately
    if (user.twoFactorEnabled) {
      // Generate 2FA code
      const twoFACode = generate2FACode();
      const codeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // console.log(
      //   "Generating 2FA code for existing user:",
      //   twoFACode,
      //   "for:",
      //   email,
      // );

      // Create temp token with the code
      const tempToken = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          requires2FA: true,
          campaignId: user.campaign,
          twoFactorEnabled: true,
          twoFACode: twoFACode,
          codeExpiry: codeExpiry.getTime(),
          verificationMethod: "app",
        },
        process.env.JWT_SECRET,
        { expiresIn: "10m" },
      );

      // Send 2FA code via email
      try {
        await emailService.send2FACodeEmail(
          email,
          twoFACode,
          `${user.firstName} ${user.lastName}`,
        );
        console.log("2FA email sent successfully to:", email);
      } catch (emailError) {
        console.error("Failed to send 2FA email:", emailError);
        // console.log(`2FA Code for ${email}: ${twoFACode}`);
      }

      return res.json({
        success: true,
        requires2FA: true,
        tempToken,
        user: {
          id: user._id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          campaignId: user.campaign,
          twoFactorEnabled: true,
        },
        message: "Enter the 6-digit code sent to your email",
        ...(process.env.NODE_ENV === "development" && { devCode: twoFACode }),
      });
    }
    // For first-time users (2FA not enabled), don't send code yet
    else {
      console.log("First-time user, prompting for 2FA setup");

      // Create a temp token without a code
      const tempToken = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          requires2FA: true,
          twoFactorEnabled: false,
          needsSetup: true, // Flag to indicate this is a setup flow
        },
        process.env.JWT_SECRET,
        { expiresIn: "30m" }, // Give them more time for setup
      );

      return res.json({
        success: true,
        requires2FA: true,
        tempToken,
        user: {
          id: user._id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          campaignId: user.campaign,
          role: user.role,
          twoFactorEnabled: false,
        },
        needsSetup: true, // Frontend can use this to show setup UI
        message:
          "Two-factor authentication is required. Please set up 2FA to continue.",
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// Verify 2FA token
const verify2FA = async (req, res) => {
  try {
    const { email, token } = req.body;

    console.log("Verifying 2FA for:", email, "with token:", token);

    // Verify temp token
    const tempToken = req.headers["authorization"]?.split(" ")[1];
    if (!tempToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (error) {
      console.error("Token verification error:", error.message);
      return res.status(401).json({
        success: false,
        message: "Session expired",
      });
    }

    // Check if code expired (only if there's a code expiry)
    if (decoded.codeExpiry && Date.now() > decoded.codeExpiry) {
      return res.status(401).json({
        success: false,
        message: "Verification code has expired",
      });
    }

    // Find user
    const user = await User.findOne({ email, _id: decoded.userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify 2FA token - FIXED ORDER
    let isValid = false;
    let verificationMethod = "";

    // 1. For first-time users OR when using email verification, check the email code
    if (!user.twoFactorEnabled || decoded.verificationMethod === "email") {
      // Check email code from token
      if (decoded.twoFACode && token === decoded.twoFACode) {
        isValid = true;
        verificationMethod = "email";
        console.log("Email code verification successful");
      }
      // Development code as fallback
      else if (process.env.NODE_ENV === "development" && token === "123456") {
        isValid = true;
        verificationMethod = "dev";
        console.log("Development code verification successful");
      }
    }
    // 2. For users with 2FA already enabled, check authenticator app
    else {
      // Check authenticator app code
      if (user.twoFactorSecret && user.twoFactorEnabled) {
        isValid = speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: "base32",
          token: token,
          window: 3,
        });
        verificationMethod = "authenticator";
        console.log(
          "Authenticator code verification:",
          isValid ? "success" : "failed",
        );
      }

      // If authenticator fails, check backup code
      if (
        !isValid &&
        user.twoFactorBackupCode &&
        token === user.twoFactorBackupCode
      ) {
        isValid = true;
        verificationMethod = "backup";
        console.log("Backup code verification successful");
      }

      // Finally, try email code as fallback
      if (!isValid && decoded.twoFACode && token === decoded.twoFACode) {
        isValid = true;
        verificationMethod = "email_fallback";
        console.log("Email code (fallback) verification successful");
      }

      // Development code as last resort
      if (
        !isValid &&
        process.env.NODE_ENV === "development" &&
        token === "123456"
      ) {
        isValid = true;
        verificationMethod = "dev";
        console.log("Development code verification successful");
      }
    }

    if (!isValid) {
      // Log failed attempt
      await AuditLog.create({
        action: "2FA verification failed",
        user: user._id,
        userEmail: user.email,
        userRole: user.role,
        campaign: user.campaign,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        details: { attemptedCode: token },
      });

      console.log("2FA verification failed for token:", token);
      console.log("Available options:");
      console.log(
        "- Email code in token:",
        decoded.twoFACode ? `exists (${decoded.twoFACode})` : "doesn't exist",
      );
      console.log(
        "- User has 2FA secret:",
        user.twoFactorSecret ? "yes" : "no",
      );
      console.log("- User 2FA enabled:", user.twoFactorEnabled);
      console.log(
        "- User backup code:",
        user.twoFactorBackupCode ? "exists" : "doesn't exist",
      );
      console.log(
        "- Verification method from token:",
        decoded.verificationMethod,
      );

      return res.status(401).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    // If this is a first-time user successfully verifying their email code,
    // we need to enable 2FA for them
    if (!user.twoFactorEnabled && verificationMethod === "email") {
      // If they don't have a 2FA secret yet, create one
      if (!user.twoFactorSecret) {
        const secret = speakeasy.generateSecret({
          name: `Campaign Back Office:${user.email}`,
          length: 20,
        });
        user.twoFactorSecret = secret.base32;
        user.twoFactorBackupCode = Math.floor(
          100000 + Math.random() * 900000,
        ).toString();
      }

      user.twoFactorEnabled = true;
      await user.save();
      console.log("2FA enabled for user via email verification:", user.email);
    }

    // Create session
    const sessionId = generateSessionId();
    const session = await Session.create({
      sessionId,
      userId: user._id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      ipAddress: req.ip,
      campaign: user.campaign,
      userAgent: req.headers["user-agent"],
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isActive: true,
    });

    // Create JWT with sessionId
    const authToken = jwt.sign(
      {
        sessionId: session.sessionId,
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    // Log successful login
    await AuditLog.create({
      action: "User login successful",
      user: user._id,
      userEmail: user.email,
      userRole: user.role,
      ipAddress: req.ip,
      campaign: user.campaign,
      userAgent: req.headers["user-agent"],
      sessionId: session.sessionId,
      details: { verificationMethod },
    });

    console.log(
      "Login successful for:",
      user.email,
      "via:",
      verificationMethod,
    );

    return res.json({
      success: true,
      token: authToken,
      sessionId: session.sessionId,
      user: {
        id: user._id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        campaignId: user.campaign,
        twoFactorEnabled: true,
      },
    });
  } catch (error) {
    console.error("2FA verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during verification",
    });
  }
};

// Resend 2FA code via email
const resend2FACode = async (req, res) => {
  try {
    const { email } = req.body;

    // Verify temp token
    const tempToken = req.headers["authorization"]?.split(" ")[1];
    if (!tempToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Session expired",
      });
    }

    // Find user
    const user = await User.findOne({ email, _id: decoded.userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate new 2FA code
    const newTwoFACode = generate2FACode();
    const codeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log("Generating 2FA code for:", email, "code:", newTwoFACode);

    // Create new temp token with new code
    const newTempToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        requires2FA: true,
        twoFactorEnabled: user.twoFactorEnabled,
        twoFACode: newTwoFACode,
        codeExpiry: codeExpiry.getTime(),
        needsSetup: decoded.needsSetup || false,
        verificationMethod: user.twoFactorEnabled ? "app" : "email",
      },
      process.env.JWT_SECRET,
      { expiresIn: "10m" },
    );

    // Send 2FA code via email
    try {
      await emailService.send2FACodeEmail(
        email,
        newTwoFACode,
        `${user.firstName} ${user.lastName}`,
      );
      console.log("2FA code sent to:", email);
    } catch (emailError) {
      console.error("Failed to send 2FA email:", emailError);
      console.log(`2FA Code for ${email}: ${newTwoFACode}`);
    }

    // Log resend action
    await AuditLog.create({
      action: "2FA code resent",
      user: user._id,
      userEmail: user.email,
      userRole: user.role,
      campaign: user.campaign,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      tempToken: newTempToken,
      message: "Verification code sent to your email",
      ...(process.env.NODE_ENV === "development" && { devCode: newTwoFACode }),
    });
  } catch (error) {
    console.error("Resend 2FA code error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send verification code",
    });
  }
};

// Generate QR code for 2FA setup
const generateQRCode = async (req, res) => {
  try {
    console.log("Generating QR code...");

    // Check for authorization header
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No authorization token provided",
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization header format",
      });
    }

    let decoded;
    try {
      // Try to verify the token
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.error("Token verification error:", error.message);

      // If token is expired but we can decode it, that's OK for QR code generation
      if (error.name === "TokenExpiredError") {
        decoded = jwt.decode(token);
        if (!decoded || !decoded.userId) {
          return res.status(401).json({
            success: false,
            message: "Token expired and cannot be decoded",
          });
        }
        console.log("Using expired but decodable token for QR code generation");
      } else {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }
    }

    // Now we have the user ID from the token
    const userId = decoded.userId;
    const userEmail = decoded.email;

    console.log("Generating QR code for user:", userEmail);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user already has 2FA enabled
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      return res.json({
        success: true,
        message: "2FA is already enabled for this account",
        twoFactorEnabled: true,
        qrCode: null,
      });
    }

    // Generate new secret if not exists
    if (!user.twoFactorSecret) {
      console.log("Generating new 2FA secret for user");
      const secret = speakeasy.generateSecret({
        name: `Campaign Back Office:${user.email}`,
        length: 20,
      });
      user.twoFactorSecret = secret.base32;
      user.twoFactorBackupCode = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();
      await user.save();
      console.log("Generated new secret for user");
    } else {
      console.log("Using existing 2FA secret");
    }

    // Generate QR code
    const otpauthUrl = speakeasy.otpauthURL({
      secret: user.twoFactorSecret,
      label: encodeURIComponent(`Campaign Back Office:${user.email}`),
      issuer: "Campaign Back Office",
      encoding: "base32",
    });

    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    console.log("QR code generated successfully for:", user.email);

    return res.json({
      success: true,
      qrCode: qrCodeDataUrl,
      secret: user.twoFactorSecret,
      backupCode: user.twoFactorBackupCode,
      userEmail: user.email,
      twoFactorEnabled: user.twoFactorEnabled,
    });
  } catch (error) {
    console.error("QR code generation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate QR code",
    });
  }
};

// Enable 2FA
const enable2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: "2FA not set up. Please generate QR code first.",
      });
    }

    // Verify token
    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: token,
      window: 3,
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    await user.save();

    // Log audit
    await AuditLog.create({
      action: "2FA enabled",
      user: user._id,
      userEmail: user.email,
      userRole: user.role,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Two-factor authentication enabled successfully",
    });
  } catch (error) {
    console.error("Enable 2FA error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to enable two-factor authentication",
    });
  }
};

// Disable 2FA - Only admin can do this now
const disable2FA = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is admin
    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only administrators can disable 2FA",
      });
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorBackupCode = null;
    await user.save();

    // Log audit
    await AuditLog.create({
      action: "2FA disabled by admin",
      user: user._id,
      userEmail: user.email,
      userRole: user.role,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Two-factor authentication disabled successfully",
    });
  } catch (error) {
    console.error("Disable 2FA error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to disable two-factor authentication",
    });
  }
};

// Validate session
const validateSession = async (req, res) => {
  try {
    console.log("validateSession called");

    if (req.user) {
      const user = await User.findById(req.user.userId);
      if (user) {
        return res.json({
          success: true,
          user: {
            id: user._id,
            email: user.email,
            campaignId: user.campaign,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            twoFactorEnabled: user.twoFactorEnabled,
          },
        });
      }
    }

    // Fall back to session logic
    const sessionId = req.user?.sessionId;

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        message: "Session ID missing",
      });
    }

    const session = await Session.findOne({ sessionId, isActive: true });
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        message: "Session expired",
      });
    }

    // Update session expiry
    session.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await session.save();

    const user = await User.findById(session.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        campaignId: user.campaign,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (error) {
    console.error("Session validation error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const sessionId = req.user?.sessionId;

    if (sessionId) {
      // Invalidate session
      await Session.findOneAndUpdate(
        { sessionId },
        { isActive: false, expiresAt: new Date() },
      );
    }

    // Log audit
    await AuditLog.create({
      action: "User logout",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      campaign: req.user.campaignId,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
};

// Reset password request
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email, status: "active" });
    if (!user) {
      // Don't reveal if user exists for security
      return res.json({
        success: true,
        message:
          "If an account exists with this email, a reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET + user.password,
      { expiresIn: "1h" },
    );

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(
        email,
        resetToken,
        `${user.firstName} ${user.lastName}`,
      );
      console.log("Password reset email sent to:", email);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      // In development, log the token
      console.log("Password reset token for", email, ":", resetToken);
    }

    return res.json({
      success: true,
      message:
        "If an account exists with this email, a reset link has been sent.",
      token: process.env.NODE_ENV === "development" ? resetToken : undefined,
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Decode token without verification first to get user
    let decoded;
    try {
      decoded = jwt.decode(token);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    if (!decoded || !decoded.userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify token with user's current password as secret
    try {
      jwt.verify(token, process.env.JWT_SECRET + user.password);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Reset token has expired or is invalid",
      });
    }

    // Update password
    user.password = password;
    await user.save();

    // Log audit
    await AuditLog.create({
      action: "Password reset",
      user: user._id,
      userEmail: user.email,
      userRole: user.role,
      campaign: user.campaign,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log audit
    await AuditLog.create({
      action: "Password changed",
      user: user._id,
      userEmail: user.email,
      userRole: user.role,
      campaign: user.campaign,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  login,
  verify2FA,
  resend2FACode,
  generateQRCode,
  enable2FA,
  disable2FA,
  validateSession,
  logout,
  requestPasswordReset,
  resetPassword,
  changePassword,
};
