const jwt = require("jsonwebtoken");
const Session = require("../models/Session");
const User = require("../models/User");
const Admin = require("../models/Admin");

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token has sessionId (new format) or userId (old format)
    let session;
    if (decoded.sessionId) {
      // New format with sessionId
      session = await Session.findOne({
        sessionId: decoded.sessionId,
        isActive: true,
      });
    } else if (decoded.userId) {
      // Old format or direct user token
      session = await Session.findOne({
        userId: decoded.userId,
        isActive: true,
      });
    }

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Session expired or not found",
      });
    }

    if (session.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        message: "Session expired",
      });
    }

    // Check if user exists and is active
    const user = await User.findById(session.userId);
    if (!user || user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "User account is not active",
      });
    }

    // Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: "Password was changed. Please login again.",
      });
    }

    // Update session expiry (extend on activity)
    session.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await session.save();

    // Attach user info to request
    req.user = {
      userId: user._id,
      sessionId: session.sessionId,
      email: user.email,
      campaignId: user.campaign,
      role: user.role,
      name: `${user.firstName} ${user.lastName}`,
    };

    next();
  } catch (error) {
    console.error("Token verification error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

// Verify admin JWT token
const verifyAdminToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token has sessionId (new format) or userId (old format)
    let session;
    if (decoded.sessionId) {
      // New format with sessionId
      session = await Session.findOne({
        sessionId: decoded.sessionId,
        isActive: true,
      });
    } else if (decoded.adminId) {
      // Old format or direct user token
      session = await Session.findOne({
        adminId: decoded.adminId,
        isActive: true,
      });
    }

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Session expired or not found",
      });
    }

    if (session.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        message: "Session expired",
      });
    }

    // Check if Admin exists and is active
    const admin = await Admin.findById(session.adminId);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin account is not active",
      });
    }

    // Check if password was changed after token was issued
    if (admin.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: "Password was changed. Please login again.",
      });
    }

    // Update session expiry (extend on activity)
    session.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await session.save();

    // Attach admin info to request
    req.admin = {
      adminId: admin._id,
      sessionId: session.sessionId,
      email: admin.email,
      role: admin.role,
      name: `${admin.firstName} ${admin.lastName}`,
    };

    next();
  } catch (error) {
    console.error("Token verification error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

const verifyTempToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token (temp tokens don't have sessions yet)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "User account is not active",
      });
    }

    // Attach user info to request
    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      campaignId: user.campaign,
      name: `${user.firstName} ${user.lastName}`,
      twoFactorEnabled: decoded.twoFactorEnabled || user.twoFactorEnabled,
      // Note: No sessionId for temp tokens
    };

    next();
  } catch (error) {
    console.error("Temp token verification error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

const verifyAdminTempToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token (temp tokens don't have sessions yet)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if admin exists and is active
    const admin = await Admin.findById(decoded.adminId);
    if (!admin || admin.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Admin account is not active",
      });
    }

    // Attach admin info to request
    req.admin = {
      adminId: admin._id,
      email: admin.email,
      role: admin.role,
      name: `${admin.firstName} ${admin.lastName}`,
      twoFactorEnabled: decoded.twoFactorEnabled || admin.twoFactorEnabled,
      // Note: No sessionId for temp tokens
    };

    next();
  } catch (error) {
    console.error("Temp token verification error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.admin) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    if (!roles.includes(req.user.role) || !roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this resource",
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  verifyAdminToken,
  verifyTempToken,
  verifyAdminTempToken,
  authorize,
};
