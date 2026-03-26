const Fundraising = require("../models/Fundraising");
const AuditLog = require("../models/AuditLog");
const XLSX = require("xlsx");

// Bulk export donors by phone numbers
const exportPhones = async (req, res) => {
  try {
    const { month, year, county, party, category, search } = req.query;

    // Build filter
    const filter = {};

    if (month && year) {
      filter["importInfo.month"] = parseInt(month);
      filter["importInfo.year"] = parseInt(year);
    } else if (year) {
      filter["importInfo.year"] = parseInt(year);
    }

    if (county && county !== "all") {
      filter.donorCounty = county;
    }

    if (party && party !== "all") {
      filter.politicalParty = party;
    }

    if (category && category !== "all") {
      filter.historicalDonationCategory = category;
    }

    if (search) {
      filter.$or = [
        { donorFirstName: { $regex: search, $options: "i" } },
        { donorLastName: { $regex: search, $options: "i" } },
        { donorCompany: { $regex: search, $options: "i" } },
        { donorEmail: { $regex: search, $options: "i" } },
        { donorPhone: { $regex: search, $options: "i" } },
      ];
    }

    console.log("Export phones filter:", filter);

    const donors = await Fundraising.find(filter)
      .select("donorFirstName donorLastName donorPhone importInfo")
      .sort({ "importInfo.importDate": -1, donorLastName: 1 });

    // Create CSV
    const headers = [
      "First Name",
      "Last Name",
      "Phone Number",
      "Import Month",
      "Import Year",
      "Import Date",
    ];
    const rows = donors.map((d) => [
      d.donorFirstName || "",
      d.donorLastName || "",
      d.donorPhone || "",
      d.importInfo?.month || "",
      d.importInfo?.year || "",
      d.importInfo?.importDate
        ? new Date(d.importInfo.importDate).toLocaleDateString()
        : "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const fileName = `phones_export_${month || "all"}_${year || "all"}_${new Date().toISOString().split("T")[0]}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    await AuditLog.create({
      action: "Bulk export phones",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetType: "Fundraising",
      details: {
        count: donors.length,
        filter: { month, year, county, party, category, search },
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.send(csv);
  } catch (error) {
    console.error("Export phones error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to export phones",
    });
  }
};

// Bulk export donors by email
const exportEmails = async (req, res) => {
  try {
    const { month, year, county, party, category, search } = req.query;

    // Build filter
    const filter = {
      donorEmail: { $exists: true, $ne: "" },
    };

    if (month && year) {
      filter["importInfo.month"] = parseInt(month);
      filter["importInfo.year"] = parseInt(year);
    } else if (year) {
      filter["importInfo.year"] = parseInt(year);
    }

    if (county && county !== "all") {
      filter.donorCounty = county;
    }

    if (party && party !== "all") {
      filter.politicalParty = party;
    }

    if (category && category !== "all") {
      filter.historicalDonationCategory = category;
    }

    if (search) {
      filter.$or = [
        { donorFirstName: { $regex: search, $options: "i" } },
        { donorLastName: { $regex: search, $options: "i" } },
        { donorCompany: { $regex: search, $options: "i" } },
        { donorEmail: { $regex: search, $options: "i" } },
        { donorPhone: { $regex: search, $options: "i" } },
      ];
    }

    console.log("Export emails filter:", filter);

    const donors = await Fundraising.find(filter)
      .select("donorFirstName donorLastName donorEmail importInfo")
      .sort({ "importInfo.importDate": -1, donorLastName: 1 });

    // Create CSV
    const headers = [
      "First Name",
      "Last Name",
      "Email Address",
      "Import Month",
      "Import Year",
      "Import Date",
    ];
    const rows = donors.map((d) => [
      d.donorFirstName || "",
      d.donorLastName || "",
      d.donorEmail || "",
      d.importInfo?.month || "",
      d.importInfo?.year || "",
      d.importInfo?.importDate
        ? new Date(d.importInfo.importDate).toLocaleDateString()
        : "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const fileName = `emails_export_${month || "all"}_${year || "all"}_${new Date().toISOString().split("T")[0]}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    await AuditLog.create({
      action: "Bulk export emails",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetType: "Fundraising",
      details: {
        count: donors.length,
        filter: { month, year, county, party, category, search },
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.send(csv);
  } catch (error) {
    console.error("Export emails error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to export emails",
    });
  }
};

// Get available months/years for filtering
const getAvailableImports = async (req, res) => {
  try {
    const result = await Fundraising.aggregate([
      {
        $group: {
          _id: {
            month: "$importInfo.month",
            year: "$importInfo.year",
          },
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          "_id.month": { $ne: null },
          "_id.year": { $ne: null },
        },
      },
      {
        $sort: {
          "_id.year": -1,
          "_id.month": -1,
        },
      },
    ]);

    const imports = result.map((item) => ({
      month: item._id.month,
      year: item._id.year,
      count: item.count,
      label: `${new Date(item._id.year, item._id.month - 1).toLocaleString("default", { month: "long" })} ${item._id.year}`,
    }));

    res.json({
      success: true,
      imports,
    });
  } catch (error) {
    console.error("Get available imports error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get available imports",
    });
  }
};

// Get available counties for filtering
const getAvailableCounties = async (req, res) => {
  try {
    const result = await Fundraising.aggregate([
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

    const counties = result.map((item) => ({
      value: item._id,
      label: countyMap[item._id] || item._id,
      count: item.count,
    }));

    res.json({
      success: true,
      counties,
    });
  } catch (error) {
    console.error("Get available counties error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get available counties",
    });
  }
};

// Export all donors with full details
const exportFullDonors = async (req, res) => {
  try {
    const { month, year, county, party, category, search } = req.query;

    // Build filter
    const filter = {};

    if (month && year) {
      filter["importInfo.month"] = parseInt(month);
      filter["importInfo.year"] = parseInt(year);
    } else if (year) {
      filter["importInfo.year"] = parseInt(year);
    }

    if (county && county !== "all") {
      filter.donorCounty = county;
    }

    if (party && party !== "all") {
      filter.politicalParty = party;
    }

    if (category && category !== "all") {
      filter.historicalDonationCategory = category;
    }

    if (search) {
      filter.$or = [
        { donorFirstName: { $regex: search, $options: "i" } },
        { donorLastName: { $regex: search, $options: "i" } },
        { donorCompany: { $regex: search, $options: "i" } },
        { donorEmail: { $regex: search, $options: "i" } },
        { donorPhone: { $regex: search, $options: "i" } },
      ];
    }

    console.log("Export full donors filter:", filter);

    const donors = await Fundraising.find(filter).sort({
      "importInfo.importDate": -1,
      donorLastName: 1,
    });

    // Create CSV with all fields
    const headers = [
      "First Name",
      "Last Name",
      "Phone",
      "Email",
      "Company",
      "Address",
      "City",
      "State",
      "Zip",
      "County",
      "Party",
      "Historical Amount",
      "Donation Category",
      "Status",
      "Import Month",
      "Import Year",
      "Import Date",
      "File Name",
      "Sheet Name",
      "Pledge Amount",
      "Pledge Status",
      "Received Amount",
      "Is Recurring",
      "Phone Status",
      "Email Status",
      "Text Status",
    ];

    const rows = donors.map((d) => [
      d.donorFirstName || "",
      d.donorLastName || "",
      d.donorPhone || "",
      d.donorEmail || "",
      d.donorCompany || "",
      d.donorAddress || "",
      d.donorCity || "",
      d.donorState || "",
      d.donorZip || "",
      d.donorCounty || "",
      d.politicalParty || "",
      d.historicalDonationAmount || "",
      d.historicalDonationCategory || "",
      d.status || "",
      d.importInfo?.month || "",
      d.importInfo?.year || "",
      d.importInfo?.importDate
        ? new Date(d.importInfo.importDate).toLocaleDateString()
        : "",
      d.importInfo?.fileName || "",
      d.importInfo?.sheetName || "",
      d.pledgeAmount || "",
      d.isPledgeFulfilled
        ? "Fulfilled"
        : d.pledgeAmount
          ? "Pending"
          : "No Pledge",
      d.receivedAmount || "",
      d.isRecurring ? "Yes" : "No",
      d.phoneStatus || "",
      d.emailStatus || "",
      d.textStatus || "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell || ""}"`).join(","))
      .join("\n");

    const fileName = `donors_export_${month || "all"}_${year || "all"}_${new Date().toISOString().split("T")[0]}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    await AuditLog.create({
      action: "Bulk export full donors",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetType: "Fundraising",
      details: {
        count: donors.length,
        filter: { month, year, county, party, category, search },
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.send(csv);
  } catch (error) {
    console.error("Export full donors error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to export donors",
    });
  }
};

// Get export summary statistics
const getExportSummary = async (req, res) => {
  try {
    const stats = await Fundraising.aggregate([
      {
        $group: {
          _id: null,
          totalDonors: { $sum: 1 },
          totalWithPhone: {
            $sum: { $cond: [{ $ne: ["$donorPhone", null] }, 1, 0] },
          },
          totalWithEmail: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$donorEmail", null] },
                    { $ne: ["$donorEmail", ""] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          totalPledged: { $sum: "$pledgeAmount" },
          totalReceived: { $sum: "$receivedAmount" },
        },
      },
    ]);

    const monthStats = await Fundraising.aggregate([
      {
        $group: {
          _id: {
            month: "$importInfo.month",
            year: "$importInfo.year",
          },
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          "_id.month": { $ne: null },
          "_id.year": { $ne: null },
        },
      },
      {
        $sort: {
          "_id.year": -1,
          "_id.month": -1,
        },
      },
      {
        $limit: 12,
      },
    ]);

    res.json({
      success: true,
      summary: stats[0] || {
        totalDonors: 0,
        totalWithPhone: 0,
        totalWithEmail: 0,
        totalPledged: 0,
        totalReceived: 0,
      },
      recentMonths: monthStats.map((item) => ({
        month: item._id.month,
        year: item._id.year,
        count: item.count,
        label: `${new Date(item._id.year, item._id.month - 1).toLocaleString("default", { month: "short" })} ${item._id.year}`,
      })),
    });
  } catch (error) {
    console.error("Get export summary error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get export summary",
    });
  }
};

module.exports = {
  exportPhones,
  exportEmails,
  exportFullDonors,
  getAvailableImports,
  getAvailableCounties,
  getExportSummary,
};
