// routes/fundraisingRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken, authorize } = require("../middleware/authMiddleware");
const {
  getDonors,
  addDonor,
  addContactAttempt,
  addPledge,
  markPledgeReceived,
  addNote,
  notifyAdminNewDonor,
  notifyAdminPledge,
  exportFundraisingData,
} = require("../controllers/fundraisingController");
const {
  scanBulkFile,
  processBulkFile,
} = require("../controllers/fundraisingBulkController");
const {
  exportPhones,
  exportEmails,
  exportFullDonors,
  getAvailableImports,
  getAvailableCounties,
  getExportSummary,
} = require("../controllers/fundraisingExportController");
const Fundraising = require("../models/Fundraising");

// All routes require authentication
router.use(verifyToken);

// Check fundraising access middleware
const checkFundraisingAccess = (req, res, next) => {
  const allowedRoles = [
    "admin",
    "fundraiser",
    "manager",
    "finance_director",
    "finance_assistant",
    "call_time_manager",
    "donor_researcher",
    "event_fundraising_coordinator",
  ];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Fundraising role required.",
    });
  }
  next();
};

// Apply fundraising access check to all routes
router.use(checkFundraisingAccess);

// Get donors (all fundraising roles can view)
router.get("/", getDonors);

// Add donor (all fundraising roles can add)
router.post("/", addDonor);

// Bulk operations - NO MULTER, just raw binary data
router.post("/bulk-scan", scanBulkFile);
router.post("/bulk-process", processBulkFile);

// Add contact attempt (only assigned fundraiser or admin)
router.post("/:id/contact", addContactAttempt);

// Add pledge (only assigned fundraiser or admin)
router.post("/:id/pledge", addPledge);

// Add note (only assigned fundraiser or admin)
router.post("/:id/note", addNote);

// Mark pledge as received (admin only)
router.post("/:id/received", markPledgeReceived);

// Notifications (internal)
router.post("/notify-admin", notifyAdminNewDonor);
router.post("/notify-pledge", notifyAdminPledge);

// Export data (admin and manager only)
router.post("/export", authorize("admin", "manager"), exportFundraisingData);

// Export endpoints (GET for downloads)
router.get("/export/phones", exportPhones);
router.get("/export/emails", exportEmails);
router.get("/export/full", exportFullDonors);

// Export metadata endpoints
router.get("/exports/available", getAvailableImports);
router.get("/exports/counties", getAvailableCounties);
router.get("/exports/summary", getExportSummary);

router.get("/fundraisers", verifyToken, async (req, res) => {
  try {
    const fundraisers = await User.find({
      role: {
        $in: [
          "fundraiser",
          "finance_director",
          "finance_assistant",
          "call_time_manager",
          "donor_researcher",
          "event_fundraising_coordinator",
        ],
      },
      status: "active",
    }).select("firstName lastName email role");

    res.json({
      success: true,
      users: fundraisers,
    });
  } catch (error) {
    console.error("Error fetching fundraisers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch fundraisers",
    });
  }
});

// Get available counties with counts
router.get("/counties", verifyToken, async (req, res) => {
  try {
    const counties = await Fundraising.aggregate([
      {
        $group: {
          _id: "$donorCounty",
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          _id: { $ne: null },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    const countyMap = {
      dade: "Dade County",
      broward: "Broward County",
      palm_beach: "Palm Beach County",
      orange: "Orange County",
      hillsborough: "Hillsborough County",
      duval: "Duval County",
      pinellas: "Pinellas County",
      lee: "Lee County",
      polk: "Polk County",
      brevard: "Brevard County",
      volusia: "Volusia County",
      seminole: "Seminole County",
      pasco: "Pasco County",
      sarasota: "Sarasota County",
      manatee: "Manatee County",
      other: "Other Counties",
    };

    const formattedCounties = counties.map((item) => ({
      value: item._id,
      label: countyMap[item._id] || item._id,
      count: item.count,
    }));

    res.json({
      success: true,
      counties: formattedCounties,
    });
  } catch (error) {
    console.error("Error fetching counties:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch counties",
    });
  }
});

module.exports = router;
