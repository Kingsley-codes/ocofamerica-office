const Fundraising = require("../models/Fundraising");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const emailService = require("../../../utils/emailService");
const ExcelJS = require("exceljs");
const { PERMISSIONS } = require("../../../lib/permissions");

const getDonors = async (req, res) => {
  try {
    if (!PERMISSIONS.CAN_VIEW_DONOR_DATABASE(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Executive, Oversight, and Finance teams can view donors.",
      });
    }

    const {
      status,
      search,
      minPledge,
      maxPledge,
      fundraiser,
      county,
      party,
      donationCategory,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (fundraiser && fundraiser !== "all") {
      if (fundraiser === "me") {
        query.fundraiserId = req.user.userId;
      } else if (fundraiser === "unassigned") {
        query.fundraiserId = null;
      } else {
        query.fundraiserId = fundraiser;
      }
    }

    if (county && county !== "all") {
      query.donorCounty = county;
    }

    if (party && party !== "all") {
      query.politicalParty = party;
    }

    if (donationCategory && donationCategory !== "all") {
      query.historicalDonationCategory = donationCategory;
    }

    if (search) {
      query.$or = [
        { donorFirstName: { $regex: search, $options: "i" } },
        { donorLastName: { $regex: search, $options: "i" } },
        { donorCompany: { $regex: search, $options: "i" } },
        { donorEmail: { $regex: search, $options: "i" } },
        { donorPhone: { $regex: search, $options: "i" } },
      ];
    }

    if (minPledge || maxPledge) {
      query.pledgeAmount = {};
      if (minPledge) query.pledgeAmount.$gte = parseFloat(minPledge);
      if (maxPledge) query.pledgeAmount.$lte = parseFloat(maxPledge);
    }

    const skip = (page - 1) * limit;

    const donors = await Fundraising.find(query)
      .populate("fundraiserId", "firstName lastName email")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Fundraising.countDocuments(query);

    const stats = await getFundraisingStats(query);

    await AuditLog.create({
      action: "View fundraising donors",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      donors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error) {
    console.error("Get donors error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch donors",
    });
  }
};

const getFundraisingStats = async (query = {}) => {
  try {
    const [
      totalDonors,
      pledgedDonors,
      receivedDonors,
      activeFundraisers,
      totalPledged,
      totalReceived,
      categoryBreakdown,
      countyBreakdown,
      partyBreakdown,
    ] = await Promise.all([
      Fundraising.countDocuments(query),
      Fundraising.countDocuments({ ...query, status: "pledged" }),
      Fundraising.countDocuments({ ...query, status: "fulfilled" }),
      Fundraising.distinct("fundraiserId", {
        ...query,
        fundraiserId: { $ne: null },
      }),
      Fundraising.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$pledgeAmount" } } },
      ]),
      Fundraising.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$receivedAmount" } } },
      ]),
      Fundraising.aggregate([
        { $match: query },
        { $group: { _id: "$historicalDonationCategory", count: { $sum: 1 } } },
      ]),
      Fundraising.aggregate([
        { $match: query },
        { $group: { _id: "$donorCounty", count: { $sum: 1 } } },
      ]),
      Fundraising.aggregate([
        { $match: query },
        { $group: { _id: "$politicalParty", count: { $sum: 1 } } },
      ]),
    ]);

    const conversionRate =
      totalDonors > 0 ? (receivedDonors / totalDonors) * 100 : 0;

    // Format category breakdown
    const categoryMap = {
      under_25: "Under $25",
      "25_to_50": "$25 - $50",
      "50_to_100": "$50 - $100",
      "100_to_150": "$100 - $150",
      "150_to_200": "$150 - $200",
      "200_to_250": "$200 - $250",
      "250_to_500": "$250 - $500",
      "500_to_1000": "$500 - $1000",
      over_1000: "Over $1000",
    };

    const formattedCategoryBreakdown = {};
    categoryBreakdown.forEach((item) => {
      formattedCategoryBreakdown[categoryMap[item._id] || item._id] =
        item.count;
    });

    // Format county breakdown
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

    const formattedCountyBreakdown = {};
    countyBreakdown.forEach((item) => {
      formattedCountyBreakdown[countyMap[item._id] || item._id] = item.count;
    });

    // Format party breakdown
    const partyMap = {
      democrat: "Democrat",
      republican: "Republican",
      independent: "Independent",
      unknown: "Unknown",
    };

    const formattedPartyBreakdown = {};
    partyBreakdown.forEach((item) => {
      formattedPartyBreakdown[partyMap[item._id] || item._id] = item.count;
    });

    return {
      totalDonors,
      totalPledged: totalPledged[0]?.total || 0,
      totalReceived: totalReceived[0]?.total || 0,
      activeFundraisers: activeFundraisers.length,
      conversionRate: conversionRate.toFixed(1),
      categoryBreakdown: formattedCategoryBreakdown,
      countyBreakdown: formattedCountyBreakdown,
      partyBreakdown: formattedPartyBreakdown,
    };
  } catch (error) {
    console.error("Get stats error:", error);
    return {
      totalDonors: 0,
      totalPledged: 0,
      totalReceived: 0,
      activeFundraisers: 0,
      conversionRate: 0,
      categoryBreakdown: {},
      countyBreakdown: {},
      partyBreakdown: {},
    };
  }
};

const addDonor = async (req, res) => {
  try {
    if (!PERMISSIONS.CAN_ADD_DONATIONS(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Executive and Finance teams can add donors.",
      });
    }

    const donorData = req.body;

    if (
      !donorData.donorFirstName ||
      !donorData.donorLastName ||
      !donorData.donorPhone
    ) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, and phone are required",
      });
    }

    const existingDonor = await Fundraising.findOne({
      donorFirstName: donorData.donorFirstName,
      donorLastName: donorData.donorLastName,
      donorPhone: donorData.donorPhone,
    });

    if (existingDonor) {
      return res.status(400).json({
        success: false,
        message: "Donor with this name and phone already exists",
      });
    }

    // Set historical donation category if historical amount is provided
    if (donorData.historicalDonationAmount) {
      donorData.historicalDonationCategory =
        Fundraising.determineDonationCategory(
          donorData.historicalDonationAmount,
        );
    }

    donorData.fundraiserId = req.user.userId;
    donorData.fundraiserFirstName = req.user.name?.split(" ")[0] || "";
    donorData.fundraiserLastName =
      req.user.name?.split(" ").slice(1).join(" ") || "";
    donorData.createdBy = req.user.userId;

    const donor = await Fundraising.create(donorData);

    await AuditLog.create({
      action: "Add donor",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: donor._id,
      targetType: "Fundraising",
      details: {
        name: `${donor.donorFirstName} ${donor.donorLastName}`,
        phone: donor.donorPhone,
        county: donor.donorCounty,
        category: donor.historicalDonationCategory,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(201).json({
      success: true,
      message: "Donor added successfully",
      donor,
    });
  } catch (error) {
    console.error("Add donor error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add donor",
    });
  }
};

const addPledge = async (req, res) => {
  try {
    const donorId = req.params.id;
    const { amount, type = "pledge", notes } = req.body;

    const donor = await Fundraising.findById(donorId);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    const isAssigned = donor.fundraiserId?.toString() === req.user.userId;
    const isAdmin = req.user.role === "admin";

    if (!isAssigned && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only assigned fundraisers can add pledges",
      });
    }

    donor.lastUpdatedBy = req.user.userId;
    donor.addPledge(parseFloat(amount), type, notes);

    await donor.save();

    await AuditLog.create({
      action: "Add pledge",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: donor._id,
      targetType: "Fundraising",
      details: { amount, type },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Pledge recorded",
      donor,
    });
  } catch (error) {
    console.error("Add pledge error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to record pledge",
    });
  }
};

const markPledgeReceived = async (req, res) => {
  try {
    const donorId = req.params.id;
    const { amount, type = "gave", notes } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only administrators can mark pledges as received",
      });
    }

    const donor = await Fundraising.findById(donorId);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    if (!donor.pledgeAmount) {
      return res.status(400).json({
        success: false,
        message: "Donor does not have a pledge",
      });
    }

    donor.lastUpdatedBy = req.user.userId;
    donor.markPledgeReceived(parseFloat(amount), type, notes);
    await donor.save();

    await AuditLog.create({
      action: "Mark pledge received",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: donor._id,
      targetType: "Fundraising",
      details: { amount },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Pledge marked as received",
      donor,
    });
  } catch (error) {
    console.error("Mark pledge received error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark pledge as received",
    });
  }
};

const setRecurringDonation = async (req, res) => {
  try {
    const donorId = req.params.id;
    const { amount, frequency, notes } = req.body;

    const donor = await Fundraising.findById(donorId);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    const isAssigned = donor.fundraiserId?.toString() === req.user.userId;
    const isAdmin = req.user.role === "admin";

    if (!isAssigned && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only assigned fundraisers can set up recurring donations",
      });
    }

    donor.lastUpdatedBy = req.user.userId;
    donor.setRecurring(parseFloat(amount), frequency, notes);
    await donor.save();

    await AuditLog.create({
      action: "Set recurring donation",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: donor._id,
      targetType: "Fundraising",
      details: { amount, frequency },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Recurring donation set up successfully",
      donor,
    });
  } catch (error) {
    console.error("Set recurring donation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to set up recurring donation",
    });
  }
};

const addContactAttempt = async (req, res) => {
  try {
    const donorId = req.params.id;
    const { method, status, notes } = req.body;

    const donor = await Fundraising.findById(donorId);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    const isAssigned = donor.fundraiserId?.toString() === req.user.userId;
    const isAdmin = req.user.role === "admin";

    if (!isAssigned && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only assigned fundraisers can add contact attempts",
      });
    }

    const contactAttempt = {
      date: new Date(),
      method,
      status,
      notes,
    };

    if (method === "phone") {
      donor.phoneAttempts.push(contactAttempt);
      if (status === "disconnected" || status === "wrong_number") {
        donor.phoneStatus = status;
      } else if (status === "contacted") {
        donor.phoneStatus = "active";
      }
    } else if (method === "email") {
      donor.emailAttempts.push(contactAttempt);
      if (status === "returned" || status === "blocked") {
        donor.emailStatus = status;
      } else if (status === "contacted") {
        donor.emailStatus = "active";
      }
    } else if (method === "text") {
      donor.textAttempts.push(contactAttempt);
      if (status === "blocked") {
        donor.textStatus = status;
      } else if (status === "contacted") {
        donor.textStatus = "active";
      }
    }

    if (status === "contacted" && donor.status === "new") {
      donor.status = "contacted";
    }

    donor.lastUpdatedBy = req.user.userId;
    await donor.save();

    await AuditLog.create({
      action: "Add contact attempt",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: donor._id,
      targetType: "Fundraising",
      details: { method, status },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Contact attempt recorded",
      donor,
    });
  } catch (error) {
    console.error("Add contact attempt error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to record contact attempt",
    });
  }
};

const addNote = async (req, res) => {
  try {
    const donorId = req.params.id;
    const { content } = req.body;

    const donor = await Fundraising.findById(donorId);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    const isAssigned = donor.fundraiserId?.toString() === req.user.userId;
    const isAdmin = req.user.role === "admin";

    if (!isAssigned && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only assigned fundraisers can add notes",
      });
    }

    donor.addNote(content, req.user.userId);
    donor.lastUpdatedBy = req.user.userId;
    await donor.save();

    await AuditLog.create({
      action: "Add note to donor",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: donor._id,
      targetType: "Fundraising",
      details: { noteLength: content.length },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Note added",
      donor,
    });
  } catch (error) {
    console.error("Add note error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add note",
    });
  }
};

const getSuggestedAsk = async (req, res) => {
  try {
    const donorId = req.params.id;

    const donor = await Fundraising.findById(donorId);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    const suggestedAmount = donor.getSuggestedAsk();

    return res.json({
      success: true,
      suggestedAmount,
      category: donor.getCategoryDisplay(),
    });
  } catch (error) {
    console.error("Get suggested ask error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get suggested ask amount",
    });
  }
};

const getDonorCategories = async (req, res) => {
  try {
    const categories = await Fundraising.aggregate([
      {
        $group: {
          _id: {
            county: "$donorCounty",
            party: "$politicalParty",
            category: "$historicalDonationCategory",
          },
          count: { $sum: 1 },
          totalHistoricalAmount: { $sum: "$historicalDonationAmount" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const countyMap = {
      dade: "Dade County",
      broward: "Broward County",
      palm_beach: "Palm Beach County",
      orange: "Orange County",
      hillsborough: "Hillsborough County",
      other: "Other Counties",
    };

    const partyMap = {
      democrat: "DEM",
      republican: "REP",
      independent: "IND",
      unknown: "Unknown",
    };

    const categoryMap = {
      under_25: "$1.00 - $25.00",
      "25_to_50": "$25.00 - $50.00",
      "50_to_100": "$50.00 - $100.00",
      "100_to_150": "$100.00 - $150.00",
      "150_to_200": "$150.00 - $200.00",
      "200_to_250": "$200.00 - $250.00",
      "250_to_500": "$250.00 - $500.00",
      "500_to_1000": "$500.00 - $1000.00",
      over_1000: "Over $1000.00",
    };

    const formattedCategories = categories.map((item) => ({
      displayName: `${countyMap[item._id.county] || item._id.county} ${partyMap[item._id.party] || item._id.party} Donors ${categoryMap[item._id.category] || item._id.category}`,
      county: item._id.county,
      party: item._id.party,
      category: item._id.category,
      count: item.count,
      totalHistoricalAmount: item.totalHistoricalAmount,
      averageHistoricalAmount:
        item.count > 0 ? item.totalHistoricalAmount / item.count : 0,
    }));

    return res.json({
      success: true,
      categories: formattedCategories,
    });
  } catch (error) {
    console.error("Get donor categories error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get donor categories",
    });
  }
};

const notifyAdminNewDonor = async (req, res) => {
  try {
    const { donorName, fundraiserName } = req.body;

    const adminUsers = await User.find({ role: "admin", status: "active" });

    for (const admin of adminUsers) {
      await emailService.sendEmail(
        admin.email,
        `New Donor Added by ${fundraiserName}`,
        `
          <p>A new donor has been added to the fundraising system:</p>
          <p><strong>Donor:</strong> ${donorName}</p>
          <p><strong>Added by:</strong> ${fundraiserName}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p>Please review the donor in the fundraising dashboard.</p>
        `,
      );
    }

    return res.json({
      success: true,
      message: "Admin notified",
    });
  } catch (error) {
    console.error("Notify admin error:", error);
    return res.json({
      success: true,
      message: "Donor added, notification may have failed",
    });
  }
};

const notifyAdminPledge = async (req, res) => {
  try {
    const { donorId, donorName, amount, fundraiserName } = req.body;

    const adminUsers = await User.find({ role: "admin", status: "active" });

    for (const admin of adminUsers) {
      await emailService.sendEmail(
        admin.email,
        `New Pledge: $${amount} from ${donorName}`,
        `
          <p>A new pledge has been recorded:</p>
          <p><strong>Donor:</strong> ${donorName}</p>
          <p><strong>Amount:</strong> $${amount}</p>
          <p><strong>Fundraiser:</strong> ${fundraiserName}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p>Please watch for this donation to be received.</p>
        `,
      );
    }

    return res.json({
      success: true,
      message: "Admin notified about pledge",
    });
  } catch (error) {
    console.error("Notify admin pledge error:", error);
    return res.json({
      success: true,
      message: "Pledge recorded, notification may have failed",
    });
  }
};

const exportFundraisingData = async (req, res) => {
  try {
    if (!PERMISSIONS.CAN_EDIT_FINANCE(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Executive and Finance Directors can export data.",
      });
    }

    const { format = "csv", county, party, category } = req.query;

    const query = {};
    if (county && county !== "all") query.donorCounty = county;
    if (party && party !== "all") query.politicalParty = party;
    if (category && category !== "all")
      query.historicalDonationCategory = category;

    const donors = await Fundraising.find(query)
      .populate("fundraiserId", "firstName lastName email")
      .sort({ updatedAt: -1 });

    if (format === "csv") {
      const csvData = generateCSV(donors);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=fundraising-export.csv",
      );
      return res.send(csvData);
    } else if (format === "excel") {
      const buffer = await generateExcel(donors);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=fundraising-export.xlsx",
      );
      return res.send(buffer);
    }

    return res.json({
      success: true,
      donors,
    });
  } catch (error) {
    console.error("Export fundraising error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export data",
    });
  }
};

const generateCSV = (donors) => {
  const headers = [
    "Donor Name",
    "Company",
    "Email",
    "Phone",
    "County",
    "Political Party",
    "Historical Donation Amount",
    "Donation Category",
    "Suggested Ask Amount",
    "Pledge Amount",
    "Received Amount",
    "Status",
    "Phone Status",
    "Email Status",
    "Text Status",
    "Contact Attempts",
    "Notes Count",
    "Last Updated",
  ];

  const rows = donors.map((donor) => [
    `${donor.donorFirstName} ${donor.donorLastName}`,
    donor.donorCompany || "",
    donor.donorEmail || "",
    donor.donorPhone || "",
    donor.donorCounty || "",
    donor.politicalParty || "",
    donor.historicalDonationAmount || 0,
    donor.historicalDonationCategory || "",
    donor.getSuggestedAsk(),
    donor.pledgeAmount || 0,
    donor.receivedAmount || 0,
    donor.status,
    donor.phoneStatus,
    donor.emailStatus,
    donor.textStatus,
    donor.phoneAttempts.length +
      donor.emailAttempts.length +
      donor.textAttempts.length,
    donor.notes.length,
    donor.updatedAt.toLocaleDateString(),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  return csv;
};

const generateExcel = async (donors) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Campaign Fundraising System";
  workbook.created = new Date();

  const donorsSheet = workbook.addWorksheet("Donors");

  donorsSheet.columns = [
    { header: "Donor Name", key: "donorName", width: 25 },
    { header: "Company", key: "company", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 15 },
    { header: "County", key: "county", width: 15 },
    { header: "Political Party", key: "party", width: 15 },
    { header: "Historical Amount", key: "historicalAmount", width: 15 },
    { header: "Donation Category", key: "category", width: 20 },
    { header: "Suggested Ask", key: "suggestedAsk", width: 15 },
    { header: "Pledge Amount", key: "pledgeAmount", width: 15 },
    { header: "Received Amount", key: "receivedAmount", width: 15 },
    { header: "Status", key: "status", width: 15 },
    { header: "Phone Status", key: "phoneStatus", width: 15 },
    { header: "Email Status", key: "emailStatus", width: 15 },
    { header: "Text Status", key: "textStatus", width: 15 },
    { header: "Contact Attempts", key: "contactAttempts", width: 15 },
    { header: "Notes", key: "notes", width: 10 },
    { header: "Created", key: "created", width: 15 },
    { header: "Last Updated", key: "updated", width: 15 },
  ];

  donors.forEach((donor) => {
    donorsSheet.addRow({
      donorName: `${donor.donorFirstName} ${donor.donorLastName}`,
      company: donor.donorCompany || "",
      email: donor.donorEmail || "",
      phone: donor.donorPhone || "",
      county: donor.donorCounty || "",
      party: donor.politicalParty || "",
      historicalAmount: donor.historicalDonationAmount || 0,
      category: donor.historicalDonationCategory || "",
      suggestedAsk: donor.getSuggestedAsk(),
      pledgeAmount: donor.pledgeAmount || 0,
      receivedAmount: donor.receivedAmount || 0,
      status: donor.status,
      phoneStatus: donor.phoneStatus,
      emailStatus: donor.emailStatus,
      textStatus: donor.textStatus,
      contactAttempts:
        donor.phoneAttempts.length +
        donor.emailAttempts.length +
        donor.textAttempts.length,
      notes: donor.notes.length,
      created: donor.createdAt.toLocaleDateString(),
      updated: donor.updatedAt.toLocaleDateString(),
    });
  });

  donorsSheet.getColumn("historicalAmount").numFmt = "$#,##0.00";
  donorsSheet.getColumn("suggestedAsk").numFmt = "$#,##0.00";
  donorsSheet.getColumn("pledgeAmount").numFmt = "$#,##0.00";
  donorsSheet.getColumn("receivedAmount").numFmt = "$#,##0.00";

  const summarySheet = workbook.addWorksheet("Summary");

  const stats = await getFundraisingStats();

  summarySheet.columns = [
    { header: "Metric", key: "metric", width: 30 },
    { header: "Value", key: "value", width: 20 },
  ];

  summarySheet.addRow({ metric: "Total Donors", value: stats.totalDonors });
  summarySheet.addRow({ metric: "Total Pledged", value: stats.totalPledged });
  summarySheet.addRow({ metric: "Total Received", value: stats.totalReceived });
  summarySheet.addRow({
    metric: "Active Fundraisers",
    value: stats.activeFundraisers,
  });
  summarySheet.addRow({
    metric: "Conversion Rate",
    value: `${stats.conversionRate}%`,
  });

  summarySheet.getRow(2).getCell("value").numFmt = "$#,##0.00";
  summarySheet.getRow(3).getCell("value").numFmt = "$#,##0.00";

  const categorySheet = workbook.addWorksheet("Category Breakdown");

  categorySheet.columns = [
    { header: "Category", key: "category", width: 30 },
    { header: "Count", key: "count", width: 15 },
  ];

  Object.entries(stats.categoryBreakdown || {}).forEach(([category, count]) => {
    categorySheet.addRow({ category, count });
  });

  const countySheet = workbook.addWorksheet("County Breakdown");

  countySheet.columns = [
    { header: "County", key: "county", width: 20 },
    { header: "Count", key: "count", width: 15 },
  ];

  Object.entries(stats.countyBreakdown || {}).forEach(([county, count]) => {
    countySheet.addRow({ county, count });
  });

  const partySheet = workbook.addWorksheet("Party Breakdown");

  partySheet.columns = [
    { header: "Party", key: "party", width: 15 },
    { header: "Count", key: "count", width: 15 },
  ];

  Object.entries(stats.partyBreakdown || {}).forEach(([party, count]) => {
    partySheet.addRow({ party, count });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

const lockDonor = async (req, res) => {
  try {
    const donorId = req.params.id;

    if (!PERMISSIONS.CAN_ADD_DONATIONS(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only fundraisers can lock donors.",
      });
    }

    const donor = await Fundraising.findById(donorId);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    if (donor.isLocked && donor.lockedBy.toString() !== req.user.userId) {
      const locker = await User.findById(donor.lockedBy);
      return res.status(400).json({
        success: false,
        message: `Donor is already locked by ${locker?.firstName || "another"} ${locker?.lastName || "fundraiser"}`,
      });
    }

    donor.lockToFundraiser(req.user.userId, req.user.name);
    donor.lastUpdatedBy = req.user.userId;
    await donor.save();

    await AuditLog.create({
      action: "Lock donor",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: donor._id,
      targetType: "Fundraising",
      details: {
        donorName: `${donor.donorFirstName} ${donor.donorLastName}`,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Donor locked successfully",
      donor,
    });
  } catch (error) {
    console.error("Lock donor error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to lock donor",
    });
  }
};

const unlockDonor = async (req, res) => {
  try {
    const donorId = req.params.id;

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only administrators can unlock donors",
      });
    }

    const donor = await Fundraising.findById(donorId);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    donor.unlockDonor();
    donor.lastUpdatedBy = req.user.userId;
    await donor.save();

    await AuditLog.create({
      action: "Unlock donor",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: donor._id,
      targetType: "Fundraising",
      details: {
        donorName: `${donor.donorFirstName} ${donor.donorLastName}`,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Donor unlocked successfully",
      donor,
    });
  } catch (error) {
    console.error("Unlock donor error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to unlock donor",
    });
  }
};

module.exports = {
  getDonors,
  addDonor,
  lockDonor,
  unlockDonor,
  addContactAttempt,
  addPledge,
  markPledgeReceived,
  setRecurringDonation,
  addNote,
  getSuggestedAsk,
  getDonorCategories,
  notifyAdminNewDonor,
  notifyAdminPledge,
  exportFundraisingData,
};
