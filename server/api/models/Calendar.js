// api/models/Calendar.js
const mongoose = require("mongoose");

const calendarEventSchema = new mongoose.Schema(
  {
    // Basic Event Info
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    mapLink: {
      type: String,
      trim: true,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    // Time & Date
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    allDay: {
      type: Boolean,
      default: false,
    },

    // Category (color-coded)
    category: {
      type: String,
      enum: [
        "meeting",
        "vacation",
        "medical",
        "event",
        "debate",
        "public_speaking",
        "fundraiser",
        "canvassing",
        "phone_banking",
        "donor_meeting",
        "press_media",
        "other",
      ],
      required: true,
      default: "other",
    },
    customCategory: {
      type: String,
      trim: true,
    },
    categoryColor: {
      type: String,
      default: "#6B7280", // Gray default
    },

    // Privacy Levels
    visibility: {
      type: String,
      enum: [
        "public", // Everyone sees
        "team", // All team members
        "management", // Management only
        "private", // Only creator + admin
        "invite_only", // Only invited users
      ],
      required: true,
      default: "team",
    },

    // Ownership & Creation
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Attendees & Invites
    attendees: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "declined", "maybe"],
          default: "pending",
        },
        respondedAt: Date,
        notes: String,
      },
    ],

    // Invite groups (for bulk invites)
    inviteGroups: [
      {
        type: String,
        enum: [
          "all_management",
          "all_field",
          "all_finance",
          "all_communications",
          "all_canvassers",
          "all_volunteers",
        ],
      },
    ],

    // Reminders
    reminders: [
      {
        type: {
          type: String,
          enum: ["email", "sms", "push"],
          default: "email",
        },
        time: {
          type: Number, // minutes before event
          required: true,
        },
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
      },
    ],

    // Recurrence - NEW FIELDS
    recurring: {
      isRecurring: {
        type: Boolean,
        default: false,
      },
      pattern: {
        type: String,
        enum: ["daily", "weekly", "monthly", "yearly"],
      },
      interval: {
        type: Number,
        default: 1,
        min: 1,
        max: 30,
      },
      endDate: Date,
      occurrences: {
        type: Number,
        min: 1,
        max: 100,
      },
      dayOfWeek: [
        {
          type: Number,
          min: 0,
          max: 6,
        },
      ], // 0-6 (Sunday-Saturday)
      dayOfMonth: {
        type: Number,
        min: 1,
        max: 31,
      },
      monthOfYear: {
        type: Number,
        min: 0,
        max: 11,
      },
      // For linking recurring series
      parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CalendarEvent",
      },
    },

    // For linking events in a recurring series
    recurringEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CalendarEvent",
    },

    // For edited single occurrence
    originalSeriesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CalendarEvent",
    },

    // Attachments
    attachments: [
      {
        name: String,
        url: String,
        type: String,
        size: Number,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        uploadedAt: Date,
      },
    ],

    // Public notes (visible to all)
    publicNotes: {
      type: String,
      trim: true,
    },

    // Private notes (only visible to management + creator)
    privateNotes: {
      type: String,
      trim: true,
    },

    // Status
    status: {
      type: String,
      enum: ["scheduled", "cancelled", "rescheduled", "completed"],
      default: "scheduled",
    },
    cancellationReason: String,
    rescheduledTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CalendarEvent",
    },

    // For time-off requests
    isTimeOff: {
      type: Boolean,
      default: false,
    },
    timeOffDetails: {
      type: {
        type: String,
        enum: ["vacation", "medical", "other"],
      },
      reason: String,
      emergencyContact: {
        name: String,
        phone: String,
        relationship: String,
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      approvedAt: Date,
      approvalStatus: {
        type: String,
        enum: ["pending", "approved", "denied"],
        default: "pending",
      },
    },

    // Integrations
    zoomLink: String,
    googleCalendarId: String,
    outlookCalendarId: String,

    // Metadata
    icsUrl: String,
    icsToken: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Audit
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for performance
calendarEventSchema.index({ startDate: 1, endDate: 1 });
calendarEventSchema.index({ createdBy: 1 });
calendarEventSchema.index({ owner: 1 });
calendarEventSchema.index({ "attendees.user": 1 });
calendarEventSchema.index({ category: 1 });
calendarEventSchema.index({ visibility: 1 });
calendarEventSchema.index({ recurringEventId: 1 });
calendarEventSchema.index({ "recurring.isRecurring": 1 }); // New index for recurring queries

// Generate ICS token
calendarEventSchema.pre("save", function () {
  if (!this.icsToken) {
    this.icsToken = require("crypto").randomBytes(32).toString("hex");
  }
  this.updatedAt = new Date();
});

// Virtual for duration
calendarEventSchema.virtual("duration").get(function () {
  return (this.endDate - this.startDate) / (1000 * 60); // minutes
});

// Virtual for isPast
calendarEventSchema.virtual("isPast").get(function () {
  return this.endDate < new Date();
});

// Virtual for isUpcoming
calendarEventSchema.virtual("isUpcoming").get(function () {
  return this.startDate > new Date();
});

// Virtual for isOngoing
calendarEventSchema.virtual("isOngoing").get(function () {
  const now = new Date();
  return now >= this.startDate && now <= this.endDate;
});

// Virtual for recurring description
calendarEventSchema.virtual("recurringDescription").get(function () {
  if (!this.recurring?.isRecurring) return null;

  const { pattern, interval, dayOfWeek } = this.recurring;

  switch (pattern) {
    case "daily":
      return interval === 1 ? "Daily" : `Every ${interval} days`;
    case "weekly":
      if (interval === 1) {
        const days = dayOfWeek
          ?.map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d])
          .join(", ");
        return `Weekly on ${days}`;
      }
      return `Every ${interval} weeks`;
    case "monthly":
      return interval === 1 ? "Monthly" : `Every ${interval} months`;
    case "yearly":
      return interval === 1 ? "Yearly" : `Every ${interval} years`;
    default:
      return "Recurring";
  }
});

const CalendarEvent = mongoose.model("CalendarEvent", calendarEventSchema);

module.exports = CalendarEvent;
