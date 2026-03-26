const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    vendor: {
      type: String,
      required: true,
      trim: true,
    },
    firstName: String,
    lastName: String,
    address: String,
    city: String,
    state: String,
    zip: String,
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
    category: {
      type: String,
      enum: [
        "operations",
        "marketing",
        "events",
        "advertising",
        "field",
        "legal",
        "other",
      ],
      default: "operations",
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["paid", "pending", "cancelled", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
    campaignId: {
      type: String,
      default: "campaign_001",
    },
    receiptUrl: String,
    notes: String,
  },
  {
    timestamps: true,
  },
);

const Expense = mongoose.model("Expense", expenseSchema);
module.exports = Expense;
