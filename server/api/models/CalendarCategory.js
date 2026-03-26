// api/models/CalendarCategory.js
const mongoose = require("mongoose");

const calendarCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    color: {
      type: String,
      required: true,
      default: "#6B7280",
    },
    icon: String,
    description: String,
    isDefault: {
      type: Boolean,
      default: false,
    },
    allowedRoles: [
      {
        type: String,
        enum: [
          "client_admin",
          "manager",
          "finance",
          "field",
          "media",
          "legal",
          "candidate",
          "volunteer",
          "field_staff",
          "fundraiser",
        ],
      },
    ],
    order: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

calendarCategorySchema.index({ name: 1, campaign: 1 }, { unique: true });

// Default categories
calendarCategorySchema.statics.getDefaultCategories = function () {
  return [
    {
      name: "meeting",
      displayName: "Meeting",
      color: "#3B82F6",
      icon: "Users",
      order: 1,
      isDefault: true,
    },
    {
      name: "vacation",
      displayName: "Vacation",
      color: "#10B981",
      icon: "Umbrella",
      order: 2,
      isDefault: true,
    },
    {
      name: "medical",
      displayName: "Medical",
      color: "#EF4444",
      icon: "Heart",
      order: 3,
      isDefault: true,
    },
    {
      name: "event",
      displayName: "Event",
      color: "#8B5CF6",
      icon: "Calendar",
      order: 4,
      isDefault: true,
    },
    {
      name: "debate",
      displayName: "Debate",
      color: "#F59E0B",
      icon: "Mic2",
      order: 5,
      isDefault: true,
    },
    {
      name: "public_speaking",
      displayName: "Public Speaking",
      color: "#FBBF24",
      icon: "Mic",
      order: 6,
      isDefault: true,
    },
    {
      name: "fundraiser",
      displayName: "Fundraiser",
      color: "#14B8A6",
      icon: "DollarSign",
      order: 7,
      isDefault: true,
    },
    {
      name: "canvassing",
      displayName: "Canvassing",
      color: "#1E3A8A",
      icon: "DoorOpen",
      order: 8,
      isDefault: true,
    },
    {
      name: "phone_banking",
      displayName: "Phone Banking",
      color: "#047857",
      icon: "Phone",
      order: 9,
      isDefault: true,
    },
    {
      name: "donor_meeting",
      displayName: "Donor Meeting",
      color: "#7C3AED",
      icon: "Handshake",
      order: 10,
      isDefault: true,
    },
    {
      name: "press_media",
      displayName: "Press/Media",
      color: "#B45309",
      icon: "Newspaper",
      order: 11,
      isDefault: true,
    },
    {
      name: "other",
      displayName: "Other",
      color: "#6B7280",
      icon: "MoreHorizontal",
      order: 12,
      isDefault: true,
    },
  ];
};

const CalendarCategory = mongoose.model(
  "CalendarCategory",
  calendarCategorySchema,
);

module.exports = CalendarCategory;
