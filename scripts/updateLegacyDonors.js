// scripts/updateLegacyDonors.js
require("dotenv").config({ path: "../.env.local" });
const mongoose = require("mongoose");
const path = require("path");

// Import the Fundraising model
const Fundraising = require("../server/api/models/Fundraising");

const updateLegacyDonors = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to database");

    console.log("Checking for donors without import info...");

    const withoutImportInfo = await Fundraising.countDocuments({
      importInfo: { $exists: false },
    });

    console.log(`Found ${withoutImportInfo} donors without import info`);

    if (withoutImportInfo === 0) {
      console.log("✅ All donors already have import info");
      process.exit(0);
    }

    console.log("Updating donors to February 2026...");

    const result = await Fundraising.updateMany(
      { importInfo: { $exists: false } },
      {
        $set: {
          importInfo: {
            month: 2, // February
            year: 2026,
            importDate: new Date("2026-02-01T00:00:00.000Z"),
            fileName: "legacy-data",
            sheetName: "Legacy Import",
            importId: new mongoose.Types.ObjectId().toString(),
          },
        },
      },
    );

    console.log(`✅ Updated ${result.modifiedCount} donors to February 2026`);

    // Verify the update
    const stillMissing = await Fundraising.countDocuments({
      importInfo: { $exists: false },
    });

    console.log(`Donors still missing import info: ${stillMissing}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating donors:", error);
    process.exit(1);
  }
};

updateLegacyDonors();
