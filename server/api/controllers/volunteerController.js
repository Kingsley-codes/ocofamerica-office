// api/controllers/volunteerController.js
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const bcrypt = require("bcryptjs");
const {
  sendWelcomeEmail,
  sendPasswordResetEmail,
} = require("../../../utils/emailService");
const {
  PERMISSIONS,
  getDepartmentFromRole,
  ROLE_GROUPS,
} = require("../../../lib/permissions");

// Get all volunteers and field staff
const getVolunteers = async (req, res) => {
  try {
    if (!PERMISSIONS.CAN_VIEW_VOLUNTEERS(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Field Operations and Executive team can view volunteers.",
      });
    }

    const { type, status, search, page = 1, limit = 20 } = req.query;

    const fieldRoles = [
      ...ROLE_GROUPS.FIELD,
      "volunteer",
      "canvasser",
      "phone_banker",
      "field_staff",
    ];

    const query = {
      role: { $in: fieldRoles },
    };

    if (type && type !== "all") {
      if (type === "field_staff") {
        query.role = {
          $in: [
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
            "field_staff",
          ],
        };
      } else if (type === "volunteer") {
        query.role = { $in: ["volunteer", "canvasser", "phone_banker"] };
      }
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const volunteers = await User.find(query)
      .select("-password -twoFactorSecret -twoFactorBackupCode")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const volunteersWithDept = volunteers.map((volunteer) => ({
      ...volunteer.toObject(),
      department: getDepartmentFromRole(volunteer.role),
      fullAddress: volunteer.fullAddress,
    }));

    const total = await User.countDocuments(query);

    return res.json({
      success: true,
      volunteers: volunteersWithDept,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get volunteers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch volunteers",
    });
  }
};

// Get volunteer by ID
const getVolunteerById = async (req, res) => {
  try {
    if (!PERMISSIONS.CAN_VIEW_VOLUNTEERS(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const volunteerId = req.params.id;

    const fieldRoles = [
      ...ROLE_GROUPS.FIELD,
      "volunteer",
      "canvasser",
      "phone_banker",
      "field_staff",
    ];

    const volunteer = await User.findOne({
      _id: volunteerId,
      role: { $in: fieldRoles },
    }).select("-password -twoFactorSecret -twoFactorBackupCode");

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer not found",
      });
    }

    const volunteerWithDept = {
      ...volunteer.toObject(),
      department: getDepartmentFromRole(volunteer.role),
      fullAddress: volunteer.fullAddress,
    };

    return res.json({
      success: true,
      volunteer: volunteerWithDept,
    });
  } catch (error) {
    console.error("Get volunteer error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch volunteer",
    });
  }
};

// Add new volunteer with password
const addVolunteer = async (req, res) => {
  try {
    if (!PERMISSIONS.CAN_MANAGE_VOLUNTEERS(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Field Directors and Volunteer Coordinators can add volunteers.",
      });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      role = "volunteer",
      location,
      address,
      city,
      state,
      zip,
      assignedTo = [],
      hourlyRate,
      password,
      accessLevel,
      availability,
      preferredDays,
      preferredRoles,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const finalRole = accessLevel || role;

    const allowedVolunteerRoles = [
      "volunteer",
      "canvasser",
      "phone_banker",
      "field_staff",
      "text_bank_team",
    ];

    if (!allowedVolunteerRoles.includes(finalRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid volunteer role specified",
      });
    }

    const department = getDepartmentFromRole(finalRole);

    const userData = {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      role: finalRole,
      department,
      location,
      address,
      city,
      state,
      zip,
      assignedTo,
      status: "active",
      joinDate: new Date(),
      createdBy: req.user.userId,
      hours: 0,
      password: password,
      availability: availability || "any",
      preferredDays: preferredDays || "anyday",
      preferredRoles: preferredRoles || [],
    };

    if (hourlyRate) {
      userData.hourlyRate = parseFloat(hourlyRate);
    }

    const newUser = await User.create(userData);

    await sendWelcomeEmail(email, password, `${firstName} ${lastName}`);

    const userResponse = newUser.toObject();
    delete userResponse.password;
    delete userResponse.twoFactorSecret;
    delete userResponse.twoFactorBackupCode;

    await AuditLog.create({
      action: "Add volunteer",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: newUser._id,
      targetType: "User",
      details: {
        name: `${newUser.firstName} ${newUser.lastName}`,
        role: newUser.role,
        department: newUser.department,
        email: newUser.email,
        availability: newUser.availability,
        preferredDays: newUser.preferredDays,
        preferredRoles: newUser.preferredRoles,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Volunteer added successfully",
      volunteer: userResponse,
    });
  } catch (error) {
    console.error("Add volunteer error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add volunteer",
    });
  }
};

// Update volunteer
const updateVolunteer = async (req, res) => {
  try {
    if (!PERMISSIONS.CAN_MANAGE_VOLUNTEERS(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Field Directors and Volunteer Coordinators can update volunteers.",
      });
    }

    const volunteerId = req.params.id;
    const updateData = req.body;

    const fieldRoles = [
      ...ROLE_GROUPS.FIELD,
      "volunteer",
      "canvasser",
      "phone_banker",
      "field_staff",
    ];

    const volunteer = await User.findOne({
      _id: volunteerId,
      role: { $in: fieldRoles },
    });

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer not found",
      });
    }

    const allowedFields = [
      "firstName",
      "lastName",
      "phone",
      "dateOfBirth",
      "location",
      "address",
      "city",
      "state",
      "zip",
      "assignedTo",
      "hourlyRate",
      "status",
      "availability",
      "preferredDays",
      "preferredRoles",
      "w9Form",
      "w9SubmittedDate",
    ];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        volunteer[field] = updateData[field];
      }
    });

    if (updateData.role) {
      const allowedVolunteerRoles = [
        "volunteer",
        "canvasser",
        "phone_banker",
        "field_staff",
        "text_bank_team",
      ];

      if (allowedVolunteerRoles.includes(updateData.role)) {
        volunteer.role = updateData.role;
        volunteer.department = getDepartmentFromRole(updateData.role);
      }
    }

    await volunteer.save();

    const volunteerResponse = volunteer.toObject();
    delete volunteerResponse.password;
    delete volunteerResponse.twoFactorSecret;
    delete volunteerResponse.twoFactorBackupCode;

    volunteerResponse.department = getDepartmentFromRole(volunteer.role);
    volunteerResponse.fullAddress = volunteer.fullAddress;

    await AuditLog.create({
      action: "Update volunteer",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: volunteer._id,
      targetType: "User",
      details: updateData,
    });

    return res.json({
      success: true,
      message: "Volunteer updated successfully",
      volunteer: volunteerResponse,
    });
  } catch (error) {
    console.error("Update volunteer error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update volunteer",
    });
  }
};

// Delete volunteer
const deleteVolunteer = async (req, res) => {
  try {
    if (!PERMISSIONS.CAN_MANAGE_VOLUNTEERS(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Field Directors and Volunteer Coordinators can delete volunteers.",
      });
    }

    const volunteerId = req.params.id;

    if (volunteerId === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
    }

    const fieldRoles = [
      ...ROLE_GROUPS.FIELD,
      "volunteer",
      "canvasser",
      "phone_banker",
      "field_staff",
    ];

    const volunteer = await User.findOne({
      _id: volunteerId,
      role: { $in: fieldRoles },
    });

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer not found",
      });
    }

    await User.findByIdAndDelete(volunteerId);

    await AuditLog.create({
      action: "Delete volunteer",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: volunteer._id,
      targetType: "User",
      details: {
        name: `${volunteer.firstName} ${volunteer.lastName}`,
        email: volunteer.email,
        role: volunteer.role,
      },
    });

    return res.json({
      success: true,
      message: "Volunteer deleted successfully",
    });
  } catch (error) {
    console.error("Delete volunteer error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete volunteer",
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const volunteerId = req.params.id;
    const { currentPassword, newPassword } = req.body;

    const isSelf = volunteerId === req.user.userId;
    const canManage = PERMISSIONS.CAN_MANAGE_VOLUNTEERS(req.user.role);

    if (!isSelf && !canManage) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only change your own password.",
      });
    }

    const volunteer = await User.findById(volunteerId);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer not found",
      });
    }

    if (isSelf) {
      const isPasswordValid = await volunteer.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long",
      });
    }

    volunteer.password = newPassword;
    await volunteer.save();

    await AuditLog.create({
      action: "Change volunteer password",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: volunteer._id,
      targetType: "User",
      details: {
        name: `${volunteer.firstName} ${volunteer.lastName}`,
        changedBy: isSelf ? "self" : "manager",
      },
    });

    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    if (!PERMISSIONS.CAN_MANAGE_VOLUNTEERS(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only managers can reset passwords.",
      });
    }

    const volunteerId = req.params.id;
    const { sendEmail = true } = req.body;

    const fieldRoles = [
      ...ROLE_GROUPS.FIELD,
      "volunteer",
      "canvasser",
      "phone_banker",
      "field_staff",
    ];

    const volunteer = await User.findOne({
      _id: volunteerId,
      role: { $in: fieldRoles },
    });

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer not found",
      });
    }

    const newPassword = Math.random().toString(36).slice(-8) + "A1!";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    volunteer.password = hashedPassword;
    await volunteer.save();

    if (sendEmail) {
      await sendPasswordResetEmail(
        volunteer.email,
        newPassword,
        `${volunteer.firstName} ${volunteer.lastName}`,
      );
    }

    await AuditLog.create({
      action: "Reset volunteer password",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: volunteer._id,
      targetType: "User",
      details: {
        name: `${volunteer.firstName} ${volunteer.lastName}`,
        email: volunteer.email,
        sendEmail,
      },
    });

    return res.json({
      success: true,
      message: "Password reset successfully",
      newPassword: sendEmail ? undefined : newPassword,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset password",
    });
  }
};

// Promote volunteer
const promoteVolunteer = async (req, res) => {
  try {
    if (!PERMISSIONS.CAN_MANAGE_VOLUNTEERS(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only managers can promote volunteers.",
      });
    }

    const volunteerId = req.params.id;
    const { newRole } = req.body;

    const volunteer = await User.findById(volunteerId);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer not found",
      });
    }

    const validPromotions = {
      volunteer: ["canvasser", "phone_banker", "field_staff"],
      canvasser: ["field_staff", "precinct_captain"],
      phone_banker: ["field_staff", "text_bank_team"],
      field_staff: ["volunteer_coordinator", "precinct_captain"],
    };

    if (!newRole) {
      return res.status(400).json({
        success: false,
        message: "New role is required",
      });
    }

    if (
      !validPromotions[volunteer.role] ||
      !validPromotions[volunteer.role].includes(newRole)
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot promote from ${volunteer.role} to ${newRole}`,
      });
    }

    const oldRole = volunteer.role;
    volunteer.role = newRole;
    volunteer.department = getDepartmentFromRole(newRole);

    if (
      !volunteer.hourlyRate &&
      ["field_staff", "volunteer_coordinator", "precinct_captain"].includes(
        newRole,
      )
    ) {
      volunteer.hourlyRate = 15;
    }

    await volunteer.save();

    const volunteerResponse = volunteer.toObject();
    delete volunteerResponse.password;
    delete volunteerResponse.twoFactorSecret;
    delete volunteerResponse.twoFactorBackupCode;

    await AuditLog.create({
      action: "Promote volunteer",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: volunteer._id,
      targetType: "User",
      details: {
        from: oldRole,
        to: newRole,
        name: `${volunteer.firstName} ${volunteer.lastName}`,
      },
    });

    return res.json({
      success: true,
      message: `Volunteer promoted to ${newRole} successfully`,
      volunteer: volunteerResponse,
    });
  } catch (error) {
    console.error("Promote volunteer error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to promote volunteer",
    });
  }
};

// Update user access
const updateAccess = async (req, res) => {
  try {
    if (!PERMISSIONS.CAN_MANAGE_VOLUNTEERS(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only managers can update access levels.",
      });
    }

    const volunteerId = req.params.id;
    const { accessLevel, password } = req.body;

    const user = await User.findById(volunteerId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const validRoles = [
      "volunteer",
      "canvasser",
      "phone_banker",
      "field_staff",
      "text_bank_team",
      "volunteer_coordinator",
      "precinct_captain",
    ];

    if (accessLevel && !validRoles.includes(accessLevel)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified",
      });
    }

    if (accessLevel) {
      user.role = accessLevel;
      user.department = getDepartmentFromRole(accessLevel);
    }

    if (password) {
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 8 characters long",
        });
      }
      user.password = password;
    }

    await user.save();

    await AuditLog.create({
      action: "Update user access",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: user._id,
      targetType: "User",
      details: {
        newRole: user.role,
        passwordChanged: !!password,
      },
    });

    return res.json({
      success: true,
      message: "Access updated successfully",
      user: {
        id: user._id,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    console.error("Update access error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update access",
    });
  }
};

// Add volunteer hours
const addVolunteerHours = async (req, res) => {
  try {
    if (!PERMISSIONS.CAN_MANAGE_VOLUNTEERS(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only managers can add volunteer hours.",
      });
    }

    const volunteerId = req.params.id;
    const { hours, date, activity } = req.body;

    const fieldRoles = [
      ...ROLE_GROUPS.FIELD,
      "volunteer",
      "canvasser",
      "phone_banker",
      "field_staff",
    ];

    const volunteer = await User.findOne({
      _id: volunteerId,
      role: { $in: fieldRoles },
    });

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer not found",
      });
    }

    const hoursToAdd = parseFloat(hours) || 0;
    volunteer.hours = (volunteer.hours || 0) + hoursToAdd;
    await volunteer.save();

    await AuditLog.create({
      action: "Add volunteer hours",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: volunteer._id,
      targetType: "User",
      details: {
        hours: hoursToAdd,
        totalHours: volunteer.hours,
        date,
        activity,
      },
    });

    return res.json({
      success: true,
      message: "Hours added successfully",
      totalHours: volunteer.hours,
    });
  } catch (error) {
    console.error("Add volunteer hours error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add hours",
    });
  }
};

// Update W9/1099 form
const updateW9Form = async (req, res) => {
  try {
    if (!PERMISSIONS.CAN_MANAGE_VOLUNTEERS(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only managers can update W9 forms.",
      });
    }

    const volunteerId = req.params.id;
    const { w9Form, submittedDate } = req.body;

    const paidRoles = [
      "field_staff",
      "volunteer_coordinator",
      "precinct_captain",
      "field_director_ops",
      "deputy_field_director",
      "regional_field_coordinator",
    ];

    const volunteer = await User.findOne({
      _id: volunteerId,
      role: { $in: paidRoles },
    });

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Field staff not found or not eligible for W9",
      });
    }

    volunteer.w9Form = w9Form;
    if (submittedDate) {
      volunteer.w9SubmittedDate = new Date(submittedDate);
    } else {
      volunteer.w9SubmittedDate = new Date();
    }

    await volunteer.save();

    await AuditLog.create({
      action: "Update W9/1099 form",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: volunteer._id,
      targetType: "User",
      details: { w9Form, submittedDate: volunteer.w9SubmittedDate },
    });

    return res.json({
      success: true,
      message: "W9/1099 form updated successfully",
      w9Form: volunteer.w9Form,
      submittedDate: volunteer.w9SubmittedDate,
    });
  } catch (error) {
    console.error("Update W9 form error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update W9 form",
    });
  }
};

// Update assignments
const updateAssignments = async (req, res) => {
  try {
    if (!PERMISSIONS.CAN_MANAGE_VOLUNTEERS(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only managers can update assignments.",
      });
    }

    const volunteerId = req.params.id;
    const { assignedTo } = req.body;

    const fieldRoles = [
      ...ROLE_GROUPS.FIELD,
      "volunteer",
      "canvasser",
      "phone_banker",
      "field_staff",
    ];

    const volunteer = await User.findOne({
      _id: volunteerId,
      role: { $in: fieldRoles },
    });

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer not found",
      });
    }

    volunteer.assignedTo = assignedTo || [];
    await volunteer.save();

    await AuditLog.create({
      action: "Update volunteer assignments",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: volunteer._id,
      targetType: "User",
      details: { assignedTo },
    });

    return res.json({
      success: true,
      message: "Assignments updated successfully",
      assignedTo: volunteer.assignedTo,
    });
  } catch (error) {
    console.error("Update assignments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update assignments",
    });
  }
};

// Export volunteers
const exportVolunteers = async (req, res) => {
  try {
    if (!PERMISSIONS.CAN_VIEW_VOLUNTEERS(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const { type } = req.query;

    const fieldRoles = [
      ...ROLE_GROUPS.FIELD,
      "volunteer",
      "canvasser",
      "phone_banker",
      "field_staff",
    ];

    const query = {
      role: { $in: fieldRoles },
    };

    if (type && type !== "all") {
      if (type === "field_staff") {
        query.role = {
          $in: [
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
            "field_staff",
          ],
        };
      } else if (type === "volunteer") {
        query.role = { $in: ["volunteer", "canvasser", "phone_banker"] };
      }
    }

    const volunteers = await User.find(query)
      .select("-password -twoFactorSecret -twoFactorBackupCode")
      .sort({ lastName: 1, firstName: 1 });

    const volunteersWithDept = volunteers.map((volunteer) => ({
      ...volunteer.toObject(),
      department: getDepartmentFromRole(volunteer.role),
      fullAddress: volunteer.fullAddress,
    }));

    await AuditLog.create({
      action: "Export volunteers",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      details: { count: volunteers.length, type },
    });

    return res.json({
      success: true,
      volunteers: volunteersWithDept,
      count: volunteers.length,
    });
  } catch (error) {
    console.error("Export volunteers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export volunteers",
    });
  }
};

// Public signup route (no authentication required)
const signupVolunteer = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      address,
      city,
      state,
      zip,
      preferredRoles,
      availability,
      preferredDays,
      password,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Validate password
    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // Create new volunteer
    const newVolunteer = await User.create({
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      address,
      city,
      state,
      zip,
      preferredRoles: preferredRoles || [],
      availability: availability || "any",
      preferredDays: preferredDays || "anyday",
      password,
      role: "volunteer",
      status: "pending", // Admin will approve
      joinDate: new Date(),
      hours: 0,
    });

    // Send welcome email
    await sendWelcomeEmail(email, password, `${firstName} ${lastName}`);

    // Log the signup
    await AuditLog.create({
      action: "Volunteer self-signup",
      targetId: newVolunteer._id,
      targetType: "User",
      details: {
        name: `${firstName} ${lastName}`,
        email,
        preferredRoles,
      },
    });

    // Notify admins (optional - implement if you have notification system)
    // await notifyAdminsOfNewVolunteer(newVolunteer);

    return res.status(201).json({
      success: true,
      message: "Volunteer account created successfully",
    });
  } catch (error) {
    console.error("Volunteer signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create account",
    });
  }
};

module.exports = {
  getVolunteers,
  getVolunteerById,
  addVolunteer,
  updateVolunteer,
  deleteVolunteer,
  changePassword,
  resetPassword,
  promoteVolunteer,
  updateAccess,
  addVolunteerHours,
  updateW9Form,
  updateAssignments,
  exportVolunteers,
  signupVolunteer,
};
