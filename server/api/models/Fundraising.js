const mongoose = require("mongoose");

const contactAttemptSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  method: {
    type: String,
    enum: ["phone", "email", "text"],
    required: true,
  },
  status: {
    type: String,
    enum: [
      "contacted",
      "no_answer",
      "left_message",
      "disconnected",
      "wrong_number",
      "returned",
      "blocked",
      "scheduled",
    ],
  },
  notes: String,
});

const noteSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  content: {
    type: String,
    required: true,
  },
  fundraiserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const pledgeHistorySchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  type: {
    type: String,
    enum: ["pledge", "gave", "recurring"],
    required: true,
  },
  notes: String,
  fundraiserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const importInfoSchema = new mongoose.Schema({
  fileName: { type: String },
  importDate: { type: Date, default: Date.now },
  month: { type: Number }, // 1-12
  year: { type: Number },
  sheetName: { type: String },
  importId: { type: String }, // To group imports from same file
});

const fundraisingSchema = new mongoose.Schema(
  {
    // Donor Information
    donorFirstName: {
      type: String,
      required: true,
      trim: true,
    },
    donorLastName: {
      type: String,
      required: true,
      trim: true,
    },
    donorCompany: String,
    donorEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    donorPhone: {
      type: String,
      required: true,
      trim: true,
    },
    donorAddress: String,
    donorCity: String,
    donorState: String,
    donorZip: String,
    donorCounty: {
      type: String,
      enum: [
        "dade",
        "broward",
        "palm_beach",
        "orange",
        "hillsborough",
        "duval",
        "pinellas",
        "lee",
        "polk",
        "brevard",
        "volusia",
        "seminole",
        "pasco",
        "sarasota",
        "manatee",
        "other",
      ],
      required: true,
      default: "other",
    },

    // Import tracking
    importInfo: importInfoSchema,

    // Fundraiser Information
    fundraiserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    fundraiserFirstName: String,
    fundraiserLastName: String,

    // Historical Donation Information (for reference - what they've given before)
    historicalDonationAmount: {
      type: Number,
      min: 0,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    historicalDonationCategory: {
      type: String,
      enum: [
        "under_25",
        "25_to_50",
        "50_to_100",
        "100_to_150",
        "150_to_200",
        "200_to_250",
        "250_to_500",
        "500_to_1000",
        "over_1000",
      ],
    },
    politicalParty: {
      type: String,
      enum: ["democrat", "republican", "independent", "unknown"],
      default: "unknown",
    },

    // Pledge Details (what they've committed to give now)
    pledgeAmount: {
      type: Number,
      min: 0,
    },
    pledgedDate: Date,

    // Payment Details
    paymentHistory: [pledgeHistorySchema],
    receivedAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    receivedDate: Date,
    isPledgeFulfilled: {
      type: Boolean,
      default: false,
    },

    // Recurring Donation Details
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringFrequency: {
      type: String,
      enum: ["monthly", "quarterly", "annually", null],
      default: null,
    },
    recurringAmount: Number,

    // Contact Status
    phoneStatus: {
      type: String,
      enum: [
        "active",
        "disconnected",
        "wrong_number",
        "blocked",
        "not_contacted",
      ],
      default: "not_contacted",
    },
    emailStatus: {
      type: String,
      enum: ["active", "returned", "blocked", "not_contacted"],
      default: "not_contacted",
    },
    textStatus: {
      type: String,
      enum: ["active", "blocked", "not_contacted"],
      default: "not_contacted",
    },

    // Contact Attempts
    phoneAttempts: [contactAttemptSchema],
    textAttempts: [contactAttemptSchema],
    emailAttempts: [contactAttemptSchema],

    // Notes (up to 50)
    notes: [noteSchema],

    // Status Tracking
    status: {
      type: String,
      enum: [
        "new",
        "contacted",
        "pledged",
        "fulfilled",
        "not_interested",
        "unreachable",
      ],
      default: "new",
    },

    // Campaign Information
    campaignId: {
      type: String,
      default: "campaign_001",
    },

    // Audit Fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for efficient filtering
fundraisingSchema.index({ "importInfo.month": 1, "importInfo.year": 1 });
fundraisingSchema.index({ "importInfo.importDate": -1 });
fundraisingSchema.index({ donorCounty: 1 });
fundraisingSchema.index({ politicalParty: 1 });
fundraisingSchema.index({ historicalDonationCategory: 1 });
fundraisingSchema.index({ status: 1 });
fundraisingSchema.index({ donorPhone: 1 });
fundraisingSchema.index({ donorEmail: 1 });

// Method to determine donation category based on amount
fundraisingSchema.statics.determineDonationCategory = function (amount) {
  if (!amount || amount <= 0) return "under_25";
  if (amount < 25) return "under_25";
  if (amount >= 25 && amount < 50) return "25_to_50";
  if (amount >= 50 && amount < 100) return "50_to_100";
  if (amount >= 100 && amount < 150) return "100_to_150";
  if (amount >= 150 && amount < 200) return "150_to_200";
  if (amount >= 200 && amount < 250) return "200_to_250";
  if (amount >= 250 && amount < 500) return "250_to_500";
  if (amount >= 500 && amount < 1000) return "500_to_1000";
  if (amount >= 1000) return "over_1000";
  return "under_25";
};

// Method to determine political party from county and context
fundraisingSchema.statics.determineParty = function (county, context = {}) {
  if (context.party) {
    const party = context.party.toLowerCase();
    if (party.includes("dem") || party.includes("democrat")) return "democrat";
    if (party.includes("rep") || party.includes("republican"))
      return "republican";
    if (party.includes("ind") || party.includes("independent"))
      return "independent";
  }
  return "unknown";
};

// Method to get category display name
fundraisingSchema.methods.getCategoryDisplay = function () {
  const partyMap = {
    democrat: "DEM",
    republican: "REP",
    independent: "IND",
    unknown: "",
  };

  const countyMap = {
    dade: "Dade County",
    broward: "Broward County",
    palm_beach: "Palm Beach County",
    orange: "Orange County",
    hillsborough: "Hillsborough County",
    other: "Other County",
  };

  const categoryMap = {
    under_25: "$1 - $25",
    "25_to_50": "$25 - $50",
    "50_to_100": "$50 - $100",
    "100_to_150": "$100 - $150",
    "150_to_200": "$150 - $200",
    "200_to_250": "$200 - $250",
    "250_to_500": "$250 - $500",
    "500_to_1000": "$500 - $1000",
    over_1000: "$1000+",
  };

  const partyDisplay = partyMap[this.politicalParty] || "";
  const countyDisplay = countyMap[this.donorCounty] || this.donorCounty;
  const categoryDisplay = categoryMap[this.historicalDonationCategory] || "";

  if (partyDisplay && countyDisplay && categoryDisplay) {
    return `${countyDisplay} ${partyDisplay} Donors ${categoryDisplay}`;
  }

  return `${countyDisplay} Donors - ${categoryDisplay}`;
};

// Method to add a note (enforces 50 note limit)
fundraisingSchema.methods.addNote = function (content, fundraiserId) {
  if (this.notes.length >= 50) {
    this.notes.shift(); // Remove oldest note
  }
  this.notes.push({
    date: new Date(),
    content,
    fundraiserId,
  });
};

// Method to add pledge
fundraisingSchema.methods.addPledge = function (
  amount,
  type = "pledge",
  notes = "",
) {
  this.pledgeAmount = amount;
  this.pledgedDate = new Date();
  this.status = "pledged";

  this.paymentHistory.push({
    amount,
    date: new Date(),
    type,
    notes,
    fundraiserId: this.lastUpdatedBy,
  });
};

// Method to mark pledge as received
fundraisingSchema.methods.markPledgeReceived = function (
  amount,
  type = "gave",
  notes = "",
) {
  this.receivedAmount = (this.receivedAmount || 0) + amount;
  this.receivedDate = new Date();

  if (this.receivedAmount >= this.pledgeAmount) {
    this.isPledgeFulfilled = true;
    this.status = "fulfilled";
  }

  this.paymentHistory.push({
    amount,
    date: new Date(),
    type,
    notes,
    fundraiserId: this.lastUpdatedBy,
  });
};

// Method to set up recurring donation
fundraisingSchema.methods.setRecurring = function (
  amount,
  frequency,
  notes = "",
) {
  this.isRecurring = true;
  this.recurringAmount = amount;
  this.recurringFrequency = frequency;
  this.status = "pledged";

  this.paymentHistory.push({
    amount,
    date: new Date(),
    type: "recurring",
    notes: `Set up ${frequency} recurring donation. ${notes}`,
    fundraiserId: this.lastUpdatedBy,
  });
};

// Method to get suggested ask amount based on historical giving
fundraisingSchema.methods.getSuggestedAsk = function () {
  const historical = this.historicalDonationAmount || 0;

  if (historical < 25) return 25;
  if (historical < 50) return 50;
  if (historical < 100) return 100;
  if (historical < 150) return 150;
  if (historical < 200) return 200;
  if (historical < 250) return 250;
  if (historical < 500) return 500;
  if (historical < 1000) return 1000;
  return Math.round(historical * 1.5); // Ask for 50% more for high donors
};

const Fundraising = mongoose.model("Fundraising", fundraisingSchema);

module.exports = Fundraising;
