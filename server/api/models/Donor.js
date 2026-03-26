const mongoose = require("mongoose");

const donorSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
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
    business: String,
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    address: String,
    city: String,
    state: String,
    zip: String,
    phone: String,
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    occupation: String,
    retired: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["recurring", "one_time", "cancelled", "pending"],
      default: "one_time",
    },
    campaignId: {
      type: String,
      default: "campaign_001",
    },
    notes: String,
  },
  {
    timestamps: true,
  },
);

const Donor = mongoose.model("Donor", donorSchema);
module.exports = Donor;
