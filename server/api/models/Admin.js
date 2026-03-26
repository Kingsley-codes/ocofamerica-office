const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const speakeasy = require("speakeasy");

const adminSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "admin",
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
    },
    twoFactorBackupCode: {
      type: String,
    },
    lastLogin: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Pre-save middleware
adminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  this.passwordChangedAt = Date.now() - 1000;
});

// Compare password method
adminSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// Generate 2FA secret
adminSchema.methods.generateTwoFactorSecret = function () {
  const secret = speakeasy.generateSecret({
    name: `Campaign Back Office:${this.email}`,
    length: 20,
  });

  this.twoFactorSecret = secret.base32;
  this.twoFactorBackupCode = Math.floor(
    100000 + Math.random() * 900000,
  ).toString();
  return secret;
};

// Verify 2FA token
adminSchema.methods.verifyTwoFactorToken = function (token) {
  if (!this.twoFactorSecret) return false;

  return speakeasy.totp.verify({
    secret: this.twoFactorSecret,
    encoding: "base32",
    token: token,
    window: 3,
  });
};

// Method to check if password was changed after token was issued
adminSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Virtual for full name
adminSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;
