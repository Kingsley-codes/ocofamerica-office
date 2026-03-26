const mongoose = require("mongoose");

const campaignGoalSchema = new mongoose.Schema(
  {
    campaignId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    category: {
      type: String,
      enum: [
        "fundraising",
        "voter_outreach",
        "volunteer_recruitment",
        "social_media",
        "events",
        "field_operations",
        "other",
      ],
      default: "fundraising",
    },
    description: String,
    target: {
      type: Number,
      required: true,
      min: 0,
    },
    current: {
      type: Number,
      default: 0,
      min: 0,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ["behind", "on_track", "ahead", "completed"],
      default: "behind",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient querying
campaignGoalSchema.index({ campaignId: 1, category: 1 });
campaignGoalSchema.index({ endDate: 1, status: 1 });

const CampaignGoal = mongoose.model("CampaignGoal", campaignGoalSchema);
module.exports = CampaignGoal;
