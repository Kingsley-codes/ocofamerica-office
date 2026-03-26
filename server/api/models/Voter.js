// models/Voter.js
const mongoose = require("mongoose");

const voterSchema = new mongoose.Schema(
  {
    // Florida Voter Extract Fields
    countyCode: { type: String, required: true, maxlength: 3 },
    voterId: { type: String, required: true, maxlength: 10 },
    nameLast: { type: String, required: true, maxlength: 30 },
    nameSuffix: { type: String, maxlength: 5, default: "" },
    nameFirst: { type: String, required: true, maxlength: 30 },
    nameMiddle: { type: String, maxlength: 30, default: "" },
    requestedExemption: { type: String, maxlength: 1, default: "" },
    residenceAddress1: { type: String, maxlength: 50, default: "" },
    residenceAddress2: { type: String, maxlength: 40, default: "" },
    residenceCity: { type: String, maxlength: 40, default: "" },
    residenceState: { type: String, maxlength: 2, default: "" },
    residenceZip: { type: String, maxlength: 10, default: "" },
    mailingAddress1: { type: String, maxlength: 40, default: "" },
    mailingAddress2: { type: String, maxlength: 40, default: "" },
    mailingAddress3: { type: String, maxlength: 40, default: "" },
    mailingCity: { type: String, maxlength: 40, default: "" },
    mailingState: { type: String, maxlength: 2, default: "" },
    mailingZip: { type: String, maxlength: 12, default: "" },
    mailingCountry: { type: String, maxlength: 40, default: "" },
    gender: { type: String, maxlength: 1, default: "" },
    race: { type: String, maxlength: 1, default: "" },
    birthDate: { type: String, default: "" },
    registrationDate: { type: String, default: "" },
    partyAffiliation: { type: String, maxlength: 3, default: "" },
    precinct: { type: String, maxlength: 6, default: "" },
    precinctGroup: { type: String, maxlength: 3, default: "" },
    precinctSplit: { type: String, maxlength: 6, default: "" },
    precinctSuffix: { type: String, maxlength: 3, default: "" },
    voterStatus: { type: String, maxlength: 3, default: "" },
    congressionalDistrict: { type: String, maxlength: 3, default: "" },
    houseDistrict: { type: String, maxlength: 3, default: "" },
    senateDistrict: { type: String, maxlength: 3, default: "" },
    countyCommissionDistrict: { type: String, maxlength: 3, default: "" },
    schoolBoardDistrict: { type: String, maxlength: 2, default: "" },
    daytimeAreaCode: { type: String, maxlength: 3, default: "" },
    daytimePhoneNumber: { type: String, maxlength: 7, default: "" },
    daytimePhoneExtension: { type: String, maxlength: 4, default: "" },
    email: { type: String, maxlength: 100, default: "" },

    // Campaign fields
    supportLevel: {
      type: String,
      enum: [
        "strong_support",
        "lean_support",
        "undecided",
        "lean_oppose",
        "strong_oppose",
        "unknown",
      ],
      default: "unknown",
    },
    contacted: { type: Boolean, default: false },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    lastContacted: Date,
    notes: [
      {
        text: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Metadata
    importedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    importedAt: { type: Date, default: Date.now },
    sourceFile: String,
  },
  { timestamps: true },
);

// Compound index for unique voter ID per county
voterSchema.index({ countyCode: 1, voterId: 1 }, { unique: true });

// Indexes for queries
voterSchema.index({ partyAffiliation: 1, voterStatus: 1 });
voterSchema.index({ supportLevel: 1 });
voterSchema.index({ nameLast: 1, nameFirst: 1 });

// Text search index
voterSchema.index({
  nameLast: "text",
  nameFirst: "text",
  voterId: "text",
  email: "text",
});

module.exports = mongoose.model("Voter", voterSchema);
