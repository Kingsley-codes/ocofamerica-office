// api/controllers/userController.js
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const {
  sendWelcomeEmail,
  sendPasswordResetEmail,
} = require("../../../utils/emailService");
const {
  PERMISSIONS,
  getDepartmentFromRole,
} = require("../../../lib/permissions");

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;

    const query = {};

    // Filter by role
    if (role && role !== "all") {
      query.role = role;
    }

    // Filter by status
    if (status && status !== "all") {
      query.status = status;
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    // Get users with pagination
    const users = await User.find(query)
      .select("-password -twoFactorSecret -twoFactorBackupCode")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Add department to each user
    const usersWithDepartment = users.map((user) => ({
      ...user.toObject(),
      department: getDepartmentFromRole(user.role),
    }));

    // Get total count
    const total = await User.countDocuments(query);

    // Log audit
    await AuditLog.create({
      action: "View all users",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      users: usersWithDepartment,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).select(
      "-password -twoFactorSecret -twoFactorBackupCode",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user can view this profile
    const canViewFullProfile =
      req.user.userId === userId || PERMISSIONS.CAN_EDIT_USERS(req.user.role);

    if (!canViewFullProfile) {
      // Return only basic info for non-admins viewing others
      const basicInfo = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        title: user.title,
        role: user.role,
        department: getDepartmentFromRole(user.role),
        email: user.email,
        phone: user.phone,
      };
      return res.json({
        success: true,
        user: basicInfo,
      });
    }

    // Add department to user
    const userWithDepartment = {
      ...user.toObject(),
      department: getDepartmentFromRole(user.role),
    };

    return res.json({
      success: true,
      user: userWithDepartment,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Create new user (admin only)
const createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      title,
      phone,
      area,
      reportsTo,
      role,
      password,
      location,
      assignedTo,
    } = req.body;

    // Check if user has permission to create users
    if (!PERMISSIONS.CAN_ADD_DELETE_USERS(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only Executive/Leadership team members can create users",
      });
    }

    // Validate required fields
    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, email, and role are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Generate temporary password if not provided
    let userPassword = password;
    if (!userPassword) {
      userPassword = Math.random().toString(36).slice(-8) + "!1Aa";
    }

    // Determine department from role
    const department = getDepartmentFromRole(role);

    // Create user
    const userData = {
      firstName,
      lastName,
      email,
      title,
      phone,
      area: area || "Operations",
      department,
      reportsTo,
      role,
      password: userPassword,
      createdBy: req.user.userId,
      status: "active",
    };

    // Add volunteer/field staff specific fields
    const fieldRoles = [
      "field_director_ops",
      "deputy_field_director",
      "regional_field_coordinator",
      "precinct_captain",
      "data_director",
      "voter_file_manager",
      "volunteer_coordinator",
      "gotv_director",
      "ballot_chase_director",
      "text_bank_team",
      "canvasser",
      "phone_banker",
    ];

    if (fieldRoles.includes(role)) {
      userData.location = location;
      userData.assignedTo = assignedTo || [];
    }

    const user = await User.create(userData);

    // Send welcome email
    await sendWelcomeEmail(email, userPassword, `${firstName} ${lastName}`);

    // Log audit
    await AuditLog.create({
      action: "Create user",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: user._id,
      targetType: "User",
      details: { email, role, department },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user._id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        department: user.department,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;

    // Remove sensitive fields
    delete updateData.password;
    delete updateData.twoFactorSecret;
    delete updateData.twoFactorBackupCode;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check permissions
    const isAdmin = PERMISSIONS.CAN_ADD_DELETE_USERS(req.user.role);
    const isSelf = req.user.userId === userId;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Executive team members can edit other users.",
      });
    }

    // If not admin, restrict which fields can be updated
    if (!isAdmin && isSelf) {
      const allowedFields = ["firstName", "lastName", "title", "phone"];
      Object.keys(updateData).forEach((key) => {
        if (!allowedFields.includes(key)) {
          delete updateData[key];
        }
      });
    }

    // Update department if role changed
    if (updateData.role && updateData.role !== user.role) {
      updateData.department = getDepartmentFromRole(updateData.role);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -twoFactorSecret -twoFactorBackupCode");

    // Log audit
    await AuditLog.create({
      action: "Update user",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: user._id,
      targetType: "User",
      details: { updatedFields: Object.keys(updateData) },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user has permission to delete users
    if (!PERMISSIONS.CAN_ADD_DELETE_USERS(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only Executive/Leadership team members can delete users",
      });
    }

    // Don't allow self-deletion
    if (userId === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent deleting the last admin
    if (user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete the last admin user",
        });
      }
    }

    await User.findByIdAndDelete(userId);

    // Log audit
    await AuditLog.create({
      action: "Delete user",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: user._id,
      targetType: "User",
      details: { email: user.email, role: user.role },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

// Update user status
const updateUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const { status } = req.body;

    // Check if user has permission
    if (!PERMISSIONS.CAN_EDIT_USERS(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (!["active", "inactive", "suspended", "pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent deactivating last admin
    if (user.role === "admin" && status !== "active") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot deactivate the last admin user",
        });
      }
    }

    user.status = status;
    await user.save();

    // Log audit
    await AuditLog.create({
      action: "Update user status",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: user._id,
      targetType: "User",
      details: { status },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "User status updated successfully",
      user: {
        id: user._id,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Update user status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user status",
    });
  }
};

// Promote volunteer to field staff
const promoteToStaff = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user has permission
    if (!PERMISSIONS.CAN_EDIT_USERS(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Define valid promotion paths based on PDF
    const validPromotions = {
      volunteer: ["canvasser", "phone_banker", "field_staff"],
      canvasser: ["field_staff", "precinct_captain"],
      phone_banker: ["field_staff", "text_bank_team"],
      field_staff: ["volunteer_coordinator", "precinct_captain"],
    };

    const { newRole } = req.body;

    if (!newRole) {
      return res.status(400).json({
        success: false,
        message: "New role is required",
      });
    }

    // Check if promotion is valid
    if (
      !validPromotions[user.role] ||
      !validPromotions[user.role].includes(newRole)
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot promote from ${user.role} to ${newRole}`,
      });
    }

    // Update role
    const oldRole = user.role;
    user.role = newRole;
    user.department = getDepartmentFromRole(newRole);
    await user.save();

    // Log audit
    await AuditLog.create({
      action: "Promote user",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: user._id,
      targetType: "User",
      details: { oldRole, newRole },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: `User promoted to ${newRole} successfully`,
      user: {
        id: user._id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    console.error("Promote to staff error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to promote user",
    });
  }
};

// Reset user password (admin only)
const resetUserPassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { sendEmail } = req.body;

    // Check if user has permission
    if (!PERMISSIONS.CAN_ADD_DELETE_USERS(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only Executive/Leadership team members can reset passwords",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate new password
    const newPassword = Math.random().toString(36).slice(-8) + "!1Aa";

    // Update password
    user.password = newPassword;
    await user.save();

    // Send email if requested
    if (sendEmail) {
      await sendPasswordResetEmail(
        user.email,
        newPassword,
        `${user.firstName} ${user.lastName}`,
      );
    }

    // Log audit
    await AuditLog.create({
      action: "Reset user password",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: user._id,
      targetType: "User",
      details: { sendEmail },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Password reset successfully",
      newPassword: sendEmail ? undefined : newPassword,
    });
  } catch (error) {
    console.error("Reset user password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset password",
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  promoteToStaff,
  resetUserPassword,
};
