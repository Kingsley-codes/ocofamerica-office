const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
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
      unique: true,
    },
    logo: {
      publicId: { type: String },
      url: { type: String },
    },
    clientAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    candidateName: {
      type: String,
      required: true,
      trim: true,
    },
    office: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
    },
    party: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Campaign = mongoose.model("Campaign", campaignSchema);
module.exports = Campaign;
