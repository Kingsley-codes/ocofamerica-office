// api/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const speakeasy = require("speakeasy");

const userSchema = new mongoose.Schema(
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

    // ROLE BASED ACCESS CONTROL - Expanded roles based on PDF
    role: {
      type: String,
      enum: [
        // Level 1 - Executive / Leadership (Full Access)
        "client_admin",
        "candidate",
        "campaign_manager",
        "deputy_campaign_manager",
        "campaign_chair",
        "chief_of_staff",
        "state_director",
        "regional_director",
        "field_director",
        "compliance_officer",
        "senior_advisor",

        // Level 2 - Oversight Access
        "scheduler",
        "legal",

        // Level 3 - Finance Access
        "finance_director",
        "fundraiser",
        "finance_assistant",
        "call_time_manager",
        "donor_researcher",
        "event_fundraising_coordinator",

        // Level 4 - Media & Communications
        "media_director",
        "communications_director",
        "press_secretary",
        "digital_director",
        "social_media_manager",
        "content_creator",
        "graphic_designer",
        "videographer",
        "rapid_response_director",
        "speechwriter",

        // Level 5 - Field Operations
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

        // Limited Access
        "volunteer",
        "canvasser",
        "phone_banker",
        "field_staff",
      ],
      default: "volunteer",
      required: true,
    },

    // Display title (can be more specific than role)
    title: {
      type: String,
      trim: true,
    },

    // Department/Area (for filtering)
    department: {
      type: String,
      enum: [
        "Executive Leadership",
        "Legal & Compliance",
        "Finance",
        "Media & Communications",
        "Field Operations",
        "Volunteer",
      ],
      default: "Volunteer",
    },

    reportsTo: {
      type: String,
      trim: true,
    },

    campaignId: {
      type: String,
      default: "campaign_001",
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

    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "pending"],
      default: "active",
    },

    lastLogin: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Profile fields
    dateOfBirth: Date,
    location: String,

    // New address fields from intake form
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 2,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    zip: {
      type: String,
      trim: true,
      maxlength: 10,
    },

    joinDate: {
      type: Date,
      default: Date.now,
    },
    hours: {
      type: Number,
      default: 0,
    },

    // Availability preferences from intake form
    availability: {
      type: String,
      enum: ["morning", "afternoon", "evening", "any"],
      default: "any",
    },

    // Days preference from intake form
    preferredDays: {
      type: String,
      enum: ["weekday", "weekend", "anyday"],
      default: "anyday",
    },

    // How they want to get involved (multiple selections from intake form)
    preferredRoles: {
      type: [String],
      enum: [
        "canvass",
        "phone_banking",
        "fundraiser",
        "postcard",
        "letter",
        "other",
      ],
      default: [],
    },

    // Field staff specific fields
    w9Form: {
      type: String,
      trim: true,
    },
    w9SubmittedDate: {
      type: Date,
    },
    hourlyRate: {
      type: Number,
      min: 0,
    },

    // Assignment tracking
    assignedTo: {
      type: [String],
      default: [],
    },

    // Calendar feed token for ICS subscriptions
    calendarFeedToken: {
      type: String,
      unique: true,
      sparse: true,
    },

    // AGREEMENT FIELDS
    agreements: {
      volunteer: {
        agreed: { type: Boolean, default: false },
        signature: String,
        signedAt: Date,
        signedBy: mongoose.Schema.Types.ObjectId,
        ipAddress: String,
        userAgent: String,
        signatureType: {
          type: String,
          enum: ["drawn", "uploaded"],
        },
      },
      staffer: {
        agreed: { type: Boolean, default: false },
        signature: String,
        signedAt: Date,
        signedBy: mongoose.Schema.Types.ObjectId,
        ipAddress: String,
        userAgent: String,
        signatureType: {
          type: String,
          enum: ["drawn", "uploaded"],
        },
      },
      contractor: {
        agreed: { type: Boolean, default: false },
        signature: String,
        signedAt: Date,
        signedBy: mongoose.Schema.Types.ObjectId,
        ipAddress: String,
        userAgent: String,
        signatureType: {
          type: String,
          enum: ["drawn", "uploaded"],
        },
      },
    },
  },
  {
    timestamps: true,
  },
);

// Pre-save middleware
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  this.passwordChangedAt = Date.now() - 1000;
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// Generate 2FA secret
userSchema.methods.generateTwoFactorSecret = function () {
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
userSchema.methods.verifyTwoFactorToken = function (token) {
  if (!this.twoFactorSecret) return false;

  return speakeasy.totp.verify({
    secret: this.twoFactorSecret,
    encoding: "base32",
    token: token,
    window: 3,
  });
};

// Method to check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
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
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for full address
userSchema.virtual("fullAddress").get(function () {
  const parts = [];
  if (this.address) parts.push(this.address);
  if (this.city) parts.push(this.city);
  if (this.state) parts.push(this.state);
  if (this.zip) parts.push(this.zip);
  return parts.join(", ");
});

const User = mongoose.model("User", userSchema);
module.exports = User;
