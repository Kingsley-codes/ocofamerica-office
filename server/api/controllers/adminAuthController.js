const Admin = require("../models/Admin");
const Session = require("../models/Session");
const AuditLog = require("../models/AuditLog");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
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

// Login admin - ALWAYS require 2FA for all users
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt for:", email);

    // Find admin
    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.log("User not found:", email);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      console.log("Invalid password for:", email);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Log audit
    await AuditLog.create({
      action: "Admin login attempt",
      admin: admin._id,
      userEmail: admin.email,
      userRole: admin.role,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Update last login
    admin.lastLogin = new Date();
    await admin.updateOne(
      { _id: admin._id },
      { $set: { lastLogin: new Date() } },
    );

    console.log(
      "2FA required for user:",
      email,
      "2FA enabled:",
      admin.twoFactorEnabled,
    );

    // For admin who already have 2FA enabled, send code immediately
    if (admin.twoFactorEnabled) {
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
          adminId: admin._id,
          email: admin.email,
          requires2FA: true,
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
          `${admin.firstName} ${admin.lastName}`,
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
        admin: {
          id: admin._id,
          email: admin.email,
          name: `${admin.firstName} ${admin.lastName}`,
          role: admin.role,
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
          adminId: admin._id,
          email: admin.email,
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
        admin: {
          id: admin._id,
          email: admin.email,
          name: `${admin.firstName} ${admin.lastName}`,
          role: admin.role,
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
const verifyAdmin2FA = async (req, res) => {
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
    const admin = await Admin.findOne({ email, _id: decoded.adminId });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Verify 2FA token - FIXED ORDER
    let isValid = false;
    let verificationMethod = "";

    // 1. For first-time users OR when using email verification, check the email code
    if (!admin.twoFactorEnabled || decoded.verificationMethod === "email") {
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
    // 2. For admin with 2FA already enabled, check authenticator app
    else {
      // Check authenticator app code
      if (admin.twoFactorSecret && admin.twoFactorEnabled) {
        isValid = speakeasy.totp.verify({
          secret: admin.twoFactorSecret,
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
        admin.twoFactorBackupCode &&
        token === admin.twoFactorBackupCode
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
        action: "Amin 2FA verification failed",
        admin: admin._id,
        userEmail: admin.email,
        userRole: admin.role,
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
        "- Admin has 2FA secret:",
        admin.twoFactorSecret ? "yes" : "no",
      );
      console.log("- User 2FA enabled:", admin.twoFactorEnabled);
      console.log(
        "- Admin backup code:",
        admin.twoFactorBackupCode ? "exists" : "doesn't exist",
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

    // If this is a first-time admin successfully verifying their email code,
    // we need to enable 2FA for them
    if (!admin.twoFactorEnabled && verificationMethod === "email") {
      // If they don't have a 2FA secret yet, create one
      if (!admin.twoFactorSecret) {
        const secret = speakeasy.generateSecret({
          name: `Campaign Back Office:${admin.email}`,
          length: 20,
        });
        admin.twoFactorSecret = secret.base32;
        admin.twoFactorBackupCode = Math.floor(
          100000 + Math.random() * 900000,
        ).toString();
      }

      admin.twoFactorEnabled = true;
      await admin.save();
      console.log("2FA enabled for admin via email verification:", admin.email);
    }

    // Create session
    const sessionId = generateSessionId();
    const session = await Session.create({
      sessionId,
      adminId: admin._id,
      email: admin.email,
      name: `${admin.firstName} ${admin.lastName}`,
      role: admin.role,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isActive: true,
    });

    // Create JWT with sessionId
    const authToken = jwt.sign(
      {
        sessionId: session.sessionId,
        adminId: admin._id,
        email: admin.email,
        role: admin.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    // Log successful login
    await AuditLog.create({
      action: "Amin login successful",
      admin: admin._id,
      userEmail: admin.email,
      userRole: admin.role,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      sessionId: session.sessionId,
      details: { verificationMethod },
    });

    console.log(
      "Login successful for:",
      admin.email,
      "via:",
      verificationMethod,
    );

    return res.json({
      success: true,
      token: authToken,
      sessionId: session.sessionId,
      admin: {
        id: admin._id,
        email: admin.email,
        name: `${admin.firstName} ${admin.lastName}`,
        role: admin.role,
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
const adminResend2FACode = async (req, res) => {
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

    console.log("tempToken: ", tempToken);

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
    const admin = await Admin.findOne({ email, _id: decoded.adminId });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Generate new 2FA code
    const newTwoFACode = generate2FACode();
    const codeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log("Generating 2FA code for:", email, "code:", newTwoFACode);

    // Create new temp token with new code
    const newTempToken = jwt.sign(
      {
        adminId: admin._id,
        email: admin.email,
        requires2FA: true,
        twoFactorEnabled: admin.twoFactorEnabled,
        twoFACode: newTwoFACode,
        codeExpiry: codeExpiry.getTime(),
        needsSetup: decoded.needsSetup || false,
        verificationMethod: admin.twoFactorEnabled ? "app" : "email",
      },
      process.env.JWT_SECRET,
      { expiresIn: "10m" },
    );

    // Send 2FA code via email
    try {
      await emailService.send2FACodeEmail(
        email,
        newTwoFACode,
        `${admin.firstName} ${user.lastName}`,
      );
      console.log("2FA code sent to:", email);
    } catch (emailError) {
      console.error("Failed to send 2FA email:", emailError);
      console.log(`2FA Code for ${email}: ${newTwoFACode}`);
    }

    // Log resend action
    await AuditLog.create({
      action: "Admin 2FA code resent",
      admin: admin._id,
      userEmail: admin.email,
      userRole: admin.role,
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

// Validate session
const validateAdminSession = async (req, res) => {
  try {
    console.log("validateSession called");

    if (req.admin) {
      const admin = await Admin.findById(req.admin.userId);
      if (admin) {
        return res.json({
          success: true,
          admin: {
            id: admin._id,
            email: admin.email,
            name: `${admin.firstName} ${admin.lastName}`,
            role: admin.role,
            twoFactorEnabled: admin.twoFactorEnabled,
          },
        });
      }
    }

    // Fall back to session logic
    const sessionId = req.admin?.sessionId;

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

    const admin = await Admin.findById(session.adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.json({
      success: true,
      admin: {
        id: admin._id,
        email: admin.email,
        name: `${admin.firstName} ${admin.lastName}`,
        role: admin.role,
        twoFactorEnabled: admin.twoFactorEnabled,
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
const adminLogout = async (req, res) => {
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
      action: "Admin logout",
      admin: req.admin.adminId,
      userEmail: req.admin.email,
      userRole: req.admin.role,
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
const requestAdminPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const admin = await Admin.findOne({ email, status: "active" });
    if (!admin) {
      // Don't reveal if admin exists for security
      return res.json({
        success: true,
        message:
          "If an account exists with this email, a reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { adminId: admin._id, email: admin.email },
      process.env.JWT_SECRET + admin.password,
      { expiresIn: "1h" },
    );

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(
        email,
        resetToken,
        `${admin.firstName} ${admin.lastName}`,
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
const resetAdminPassword = async (req, res) => {
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

    if (!decoded || !decoded.adminId) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    const admin = await Admin.findById(decoded.adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
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
    admin.password = password;
    await admin.save();

    // Log audit
    await AuditLog.create({
      action: "Admin password reset",
      admin: admin._id,
      userEmail: admin.email,
      userRole: admin.role,
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
const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.admin.adminId;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Verify current password
    const isValid = await admin.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    // Log audit
    await AuditLog.create({
      action: "Password changed",
      admin: admin._id,
      userEmail: admin.email,
      userRole: admin.role,
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
  adminLogin,
  verifyAdmin2FA,
  adminResend2FACode,
  validateAdminSession,
  adminLogout,
  requestAdminPasswordReset,
  resetAdminPassword,
  changeAdminPassword,
};
