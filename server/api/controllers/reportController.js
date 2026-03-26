// api/controllers/reportController.js
const Expense = require("../models/Expense");
const Donor = require("../models/Donor");
const CampaignGoal = require("../models/CampaignGoal");
const AuditLog = require("../models/AuditLog");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const { PERMISSIONS } = require("../../../lib/permissions");

const getReports = async (req, res) => {
  try {
    if (!PERMISSIONS.CAN_VIEW_FINANCE(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Executive, Oversight, and Finance teams can view reports.",
      });
    }

    const {
      startDate,
      endDate,
      category,
      status,
      minAmount,
      maxAmount,
      page = 1,
      limit = 20,
    } = req.query;

    const expenseQuery = {};

    if (startDate && endDate) {
      expenseQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (category && category !== "all") {
      expenseQuery.category = category;
    }

    if (status && status !== "all") {
      expenseQuery.status = status;
    }

    if (minAmount || maxAmount) {
      expenseQuery.amount = {};
      if (minAmount) expenseQuery.amount.$gte = parseFloat(minAmount);
      if (maxAmount) expenseQuery.amount.$lte = parseFloat(maxAmount);
    }

    const skip = (page - 1) * limit;
    const expenses = await Expense.find(expenseQuery)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const expenseTotal = await Expense.countDocuments(expenseQuery);

    const donorQuery = {};

    if (startDate && endDate) {
      donorQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (status && status !== "all") {
      donorQuery.status = status;
    }

    if (minAmount || maxAmount) {
      donorQuery.amount = {};
      if (minAmount) donorQuery.amount.$gte = parseFloat(minAmount);
      if (maxAmount) donorQuery.amount.$lte = parseFloat(maxAmount);
    }

    const donors = await Donor.find(donorQuery)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const donorTotal = await Donor.countDocuments(donorQuery);

    const expenseSummary = await Expense.aggregate([
      { $match: expenseQuery },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          averageAmount: { $avg: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const donorSummary = await Donor.aggregate([
      { $match: donorQuery },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          averageAmount: { $avg: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const campaignGoals = await CampaignGoal.find({
      campaignId: "campaign_001",
    });

    const reportsSummary = {
      totalDonations: donorSummary[0]?.totalAmount || 0,
      totalExpenses: expenseSummary[0]?.totalAmount || 0,
      cashOnHand:
        (donorSummary[0]?.totalAmount || 0) -
        (expenseSummary[0]?.totalAmount || 0),
      expenseCount: expenseSummary[0]?.count || 0,
      donorCount: donorSummary[0]?.count || 0,
    };

    await AuditLog.create({
      action: "View reports",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      data: {
        expenses,
        donors,
        campaignGoals,
        reportsSummary,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          expenseTotal,
          donorTotal,
        },
      },
    });
  } catch (error) {
    console.error("Get reports error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reports",
    });
  }
};

const addExpense = async (req, res) => {
  try {
    if (!PERMISSIONS.CAN_EDIT_FINANCE(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Executive and Finance Directors can add expenses.",
      });
    }

    const expenseData = req.body;

    if (req.user.role === "admin" || req.user.role === "finance_director") {
      expenseData.approvedBy = req.user.userId;
      expenseData.approvedAt = new Date();
      expenseData.status = "approved";
    }

    const expense = await Expense.create(expenseData);

    await updateCampaignGoal("fundraising", -expense.amount);

    await AuditLog.create({
      action: "Add expense",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: expense._id,
      targetType: "Expense",
      details: { amount: expense.amount, vendor: expense.vendor },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(201).json({
      success: true,
      message: "Expense added successfully",
      expense,
    });
  } catch (error) {
    console.error("Add expense error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add expense",
    });
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

    const donor = await Donor.create(donorData);

    await updateCampaignGoal("fundraising", donor.amount);

    await AuditLog.create({
      action: "Add donor",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: donor._id,
      targetType: "Donor",
      details: {
        amount: donor.amount,
        name: `${donor.firstName} ${donor.lastName}`,
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

const updateExpense = async (req, res) => {
  try {
    if (!PERMISSIONS.CAN_EDIT_FINANCE(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Executive and Finance Directors can edit expenses.",
      });
    }

    const expenseId = req.params.id;
    const updateData = req.body;

    const oldExpense = await Expense.findById(expenseId);

    const expense = await Expense.findByIdAndUpdate(expenseId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    if (oldExpense && updateData.amount !== undefined) {
      const difference = updateData.amount - oldExpense.amount;
      await updateCampaignGoal("fundraising", -difference);
    }

    await AuditLog.create({
      action: "Update expense",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: expense._id,
      targetType: "Expense",
      details: updateData,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Expense updated successfully",
      expense,
    });
  } catch (error) {
    console.error("Update expense error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update expense",
    });
  }
};

const updateDonor = async (req, res) => {
  try {
    if (!PERMISSIONS.CAN_EDIT_FINANCE(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Executive and Finance Directors can edit donors.",
      });
    }

    const donorId = req.params.id;
    const updateData = req.body;

    const oldDonor = await Donor.findById(donorId);

    const donor = await Donor.findByIdAndUpdate(donorId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    if (oldDonor && updateData.amount !== undefined) {
      const difference = updateData.amount - oldDonor.amount;
      await updateCampaignGoal("fundraising", difference);
    }

    await AuditLog.create({
      action: "Update donor",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: donor._id,
      targetType: "Donor",
      details: updateData,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Donor updated successfully",
      donor,
    });
  } catch (error) {
    console.error("Update donor error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update donor",
    });
  }
};

const deleteExpense = async (req, res) => {
  try {
    if (!PERMISSIONS.CAN_EDIT_FINANCE(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Executive and Finance Directors can delete expenses.",
      });
    }

    const expenseId = req.params.id;

    const expense = await Expense.findByIdAndDelete(expenseId);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    await updateCampaignGoal("fundraising", expense.amount);

    await AuditLog.create({
      action: "Delete expense",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: expense._id,
      targetType: "Expense",
      details: { amount: expense.amount, vendor: expense.vendor },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error("Delete expense error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete expense",
    });
  }
};

const deleteDonor = async (req, res) => {
  try {
    if (!PERMISSIONS.CAN_EDIT_FINANCE(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Executive and Finance Directors can delete donors.",
      });
    }

    const donorId = req.params.id;

    const donor = await Donor.findByIdAndDelete(donorId);

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    await updateCampaignGoal("fundraising", -donor.amount);

    await AuditLog.create({
      action: "Delete donor",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: donor._id,
      targetType: "Donor",
      details: {
        amount: donor.amount,
        name: `${donor.firstName} ${donor.lastName}`,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Donor deleted successfully",
    });
  } catch (error) {
    console.error("Delete donor error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete donor",
    });
  }
};

const updateCampaignGoal = async (category, amount) => {
  try {
    const goal = await CampaignGoal.findOne({
      campaignId: "campaign_001",
      category,
    });

    if (goal) {
      goal.current += amount;
      goal.progress = Math.min(100, (goal.current / goal.target) * 100);

      if (goal.progress >= 100) {
        goal.status = "completed";
      } else if (goal.progress >= 75) {
        goal.status = "ahead";
      } else if (goal.progress >= 50) {
        goal.status = "on_track";
      } else {
        goal.status = "behind";
      }

      goal.lastUpdated = new Date();
      await goal.save();
    }
  } catch (error) {
    console.error("Update campaign goal error:", error);
  }
};

const exportReports = async (req, res) => {
  try {
    if (
      !PERMISSIONS.CAN_EDIT_FINANCE(req.user.role) &&
      req.user.role !== "scheduler" &&
      req.user.role !== "legal"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Executive, Finance, and Oversight teams can export reports.",
      });
    }

    const { format = "csv", dateRange = "all", include = [] } = req.body;

    let dateFilter = {};
    const now = new Date();

    switch (dateRange) {
      case "last_month":
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        dateFilter = { date: { $gte: lastMonth } };
        break;
      case "last_quarter":
        const lastQuarter = new Date();
        lastQuarter.setMonth(lastQuarter.getMonth() - 3);
        dateFilter = { date: { $gte: lastQuarter } };
        break;
      case "last_year":
        const lastYear = new Date();
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        dateFilter = { date: { $gte: lastYear } };
        break;
      case "all":
      default:
        break;
    }

    const data = await fetchExportData(dateFilter, include);

    switch (format) {
      case "json":
        return res.json({
          success: true,
          data,
          format,
        });

      case "csv":
        const csvData = generateCSV(data);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=reports.csv",
        );
        return res.send(csvData);

      case "excel":
        const excelBuffer = await generateExcel(data);
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=reports.xlsx",
        );
        return res.send(excelBuffer);

      case "pdf":
        const pdfBuffer = await generatePDF(data);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=reports.pdf",
        );
        return res.send(pdfBuffer);

      default:
        return res.json({
          success: true,
          data,
          format,
        });
    }
  } catch (error) {
    console.error("Export reports error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export reports",
      error: error.message,
    });
  }
};

const fetchExportData = async (dateFilter, include) => {
  const data = {};

  if (include.includes("expenses")) {
    data.expenses = await Expense.find(dateFilter).sort({ date: -1 });
  }

  if (include.includes("donors")) {
    data.donors = await Donor.find(dateFilter).sort({ date: -1 });
  }

  if (include.includes("summary")) {
    const expenseSummary = await Expense.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          averageAmount: { $avg: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const donorSummary = await Donor.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          averageAmount: { $avg: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    data.summary = {
      totalDonations: donorSummary[0]?.totalAmount || 0,
      totalExpenses: expenseSummary[0]?.totalAmount || 0,
      cashOnHand:
        (donorSummary[0]?.totalAmount || 0) -
        (expenseSummary[0]?.totalAmount || 0),
      expenseCount: expenseSummary[0]?.count || 0,
      donorCount: donorSummary[0]?.count || 0,
    };
  }

  if (include.includes("goals")) {
    data.goals = await CampaignGoal.find({ campaignId: "campaign_001" });
  }

  return data;
};

const generateCSV = (data) => {
  const csvRows = [];

  if (data.expenses && data.expenses.length > 0) {
    csvRows.push("EXPENSES");
    csvRows.push("Date,Vendor,Amount,Category,Status,Description");
    data.expenses.forEach((expense) => {
      csvRows.push(
        [
          expense.date
            ? new Date(expense.date).toLocaleDateString("en-US")
            : "",
          `"${(expense.vendor || "").replace(/"/g, '""')}"`,
          expense.amount || 0,
          expense.category || "",
          expense.status || "",
          `"${(expense.description || "").replace(/"/g, '""')}"`,
        ].join(","),
      );
    });
    csvRows.push("");
  }

  if (data.donors && data.donors.length > 0) {
    csvRows.push("DONORS");
    csvRows.push(
      "Date,First Name,Last Name,Email,Amount,Phone,Occupation,Status,Retired",
    );
    data.donors.forEach((donor) => {
      csvRows.push(
        [
          donor.date ? new Date(donor.date).toLocaleDateString("en-US") : "",
          donor.firstName || "",
          donor.lastName || "",
          donor.email || "",
          donor.amount || 0,
          donor.phone || "",
          donor.occupation || "",
          donor.status || "",
          donor.retired ? "Yes" : "No",
        ].join(","),
      );
    });
    csvRows.push("");
  }

  if (data.summary) {
    csvRows.push("SUMMARY");
    csvRows.push("Metric,Value");
    csvRows.push(`Total Donations,${data.summary.totalDonations || 0}`);
    csvRows.push(`Total Expenses,${data.summary.totalExpenses || 0}`);
    csvRows.push(`Cash on Hand,${data.summary.cashOnHand || 0}`);
    csvRows.push(`Number of Expenses,${data.summary.expenseCount || 0}`);
    csvRows.push(`Number of Donors,${data.summary.donorCount || 0}`);
    csvRows.push("");
  }

  if (data.goals && data.goals.length > 0) {
    csvRows.push("CAMPAIGN GOALS");
    csvRows.push("Title,Category,Current,Target,Progress %,Status,Timeline");
    data.goals.forEach((goal) => {
      csvRows.push(
        [
          `"${(goal.title || "").replace(/"/g, '""')}"`,
          goal.category || "",
          goal.current || 0,
          goal.target || 0,
          goal.progress || 0,
          goal.status || "",
          goal.timeline || "",
        ].join(","),
      );
    });
  }

  return csvRows.join("\n");
};

const generateExcel = async (data) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Campaign Reports System";
  workbook.created = new Date();

  const headerStyle = {
    font: { bold: true, color: { argb: "FFFFFFFF" } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } },
    alignment: { horizontal: "center", vertical: "middle" },
  };

  const currencyStyle = {
    numFmt: "$#,##0.00",
  };

  if (data.expenses && data.expenses.length > 0) {
    const expensesSheet = workbook.addWorksheet("Expenses");

    expensesSheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Vendor", key: "vendor", width: 25 },
      { header: "Amount", key: "amount", width: 15, style: currencyStyle },
      { header: "Category", key: "category", width: 15 },
      { header: "Status", key: "status", width: 12 },
      { header: "Description", key: "description", width: 30 },
    ];

    expensesSheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    data.expenses.forEach((expense) => {
      expensesSheet.addRow({
        date: expense.date ? new Date(expense.date) : "",
        vendor: expense.vendor,
        amount: parseFloat(expense.amount) || 0,
        category: expense.category,
        status: expense.status,
        description: expense.description,
      });
    });

    const lastRow = expensesSheet.lastRow.number + 2;
    expensesSheet.getCell(`C${lastRow}`).value = {
      formula: `SUM(C2:C${expensesSheet.lastRow.number})`,
      result: data.expenses.reduce(
        (sum, exp) => sum + (parseFloat(exp.amount) || 0),
        0,
      ),
    };
    expensesSheet.getCell(`B${lastRow}`).value = "TOTAL";
    expensesSheet.getCell(`B${lastRow}`).style = { font: { bold: true } };
    expensesSheet.getCell(`C${lastRow}`).style = {
      ...currencyStyle,
      font: { bold: true },
    };
  }

  if (data.donors && data.donors.length > 0) {
    const donorsSheet = workbook.addWorksheet("Donors");

    donorsSheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "First Name", key: "firstName", width: 15 },
      { header: "Last Name", key: "lastName", width: 15 },
      { header: "Email", key: "email", width: 25 },
      { header: "Amount", key: "amount", width: 15, style: currencyStyle },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Occupation", key: "occupation", width: 20 },
      { header: "Status", key: "status", width: 12 },
      { header: "Retired", key: "retired", width: 10 },
    ];

    donorsSheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    data.donors.forEach((donor) => {
      donorsSheet.addRow({
        date: donor.date ? new Date(donor.date) : "",
        firstName: donor.firstName,
        lastName: donor.lastName,
        email: donor.email,
        amount: parseFloat(donor.amount) || 0,
        phone: donor.phone,
        occupation: donor.occupation,
        status: donor.status,
        retired: donor.retired ? "Yes" : "No",
      });
    });

    const lastRow = donorsSheet.lastRow.number + 2;
    donorsSheet.getCell(`E${lastRow}`).value = {
      formula: `SUM(E2:E${donorsSheet.lastRow.number})`,
      result: data.donors.reduce(
        (sum, donor) => sum + (parseFloat(donor.amount) || 0),
        0,
      ),
    };
    donorsSheet.getCell(`D${lastRow}`).value = "TOTAL";
    donorsSheet.getCell(`D${lastRow}`).style = { font: { bold: true } };
    donorsSheet.getCell(`E${lastRow}`).style = {
      ...currencyStyle,
      font: { bold: true },
    };
  }

  if (data.summary) {
    const summarySheet = workbook.addWorksheet("Summary");

    summarySheet.columns = [
      { header: "Metric", key: "metric", width: 25 },
      { header: "Value", key: "value", width: 20 },
    ];

    summarySheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    const summaryData = [
      ["Total Donations", data.summary.totalDonations || 0],
      ["Total Expenses", data.summary.totalExpenses || 0],
      ["Cash on Hand", data.summary.cashOnHand || 0],
      ["Number of Expenses", data.summary.expenseCount || 0],
      ["Number of Donors", data.summary.donorCount || 0],
    ];

    summaryData.forEach(([metric, value]) => {
      summarySheet.addRow({ metric, value });
    });

    for (let i = 2; i <= 4; i++) {
      summarySheet.getCell(`B${i}`).style = currencyStyle;
    }
  }

  if (data.goals && data.goals.length > 0) {
    const goalsSheet = workbook.addWorksheet("Goals");

    goalsSheet.columns = [
      { header: "Title", key: "title", width: 30 },
      { header: "Category", key: "category", width: 15 },
      { header: "Current", key: "current", width: 15 },
      { header: "Target", key: "target", width: 15 },
      { header: "Progress %", key: "progress", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Timeline", key: "timeline", width: 20 },
    ];

    goalsSheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    data.goals.forEach((goal) => {
      goalsSheet.addRow({
        title: goal.title,
        category: goal.category,
        current: parseFloat(goal.current) || 0,
        target: parseFloat(goal.target) || 0,
        progress: (goal.progress || 0) / 100,
        status: goal.status,
        timeline: goal.timeline,
      });
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

const generatePDF = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "LETTER" });
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      doc.fontSize(20).text("Campaign Reports", { align: "center" });
      doc.moveDown();
      doc
        .fontSize(10)
        .text(`Generated on: ${new Date().toLocaleDateString()}`, {
          align: "center",
        });
      doc.moveDown(2);

      if (data.summary) {
        doc.fontSize(16).text("Financial Summary", { underline: true });
        doc.moveDown(0.5);

        const summaryY = doc.y;
        let currentX = 50;

        doc.fontSize(12);
        doc.text("Total Donations:", currentX, summaryY);
        doc.text(
          `$${(data.summary.totalDonations || 0).toFixed(2)}`,
          currentX + 150,
          summaryY,
        );

        doc.text("Total Expenses:", currentX, summaryY + 25);
        doc.text(
          `$${(data.summary.totalExpenses || 0).toFixed(2)}`,
          currentX + 150,
          summaryY + 25,
        );

        doc.text("Cash on Hand:", currentX, summaryY + 50);
        doc.text(
          `$${(data.summary.cashOnHand || 0).toFixed(2)}`,
          currentX + 150,
          summaryY + 50,
        );

        doc.text("Number of Expenses:", currentX, summaryY + 75);
        doc.text(
          `${data.summary.expenseCount || 0}`,
          currentX + 150,
          summaryY + 75,
        );

        doc.text("Number of Donors:", currentX, summaryY + 100);
        doc.text(
          `${data.summary.donorCount || 0}`,
          currentX + 150,
          summaryY + 100,
        );

        doc.moveDown(4);
      }

      if (data.expenses && data.expenses.length > 0) {
        doc.addPage();
        doc.fontSize(16).text("Expenses", { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const itemX = 50;
        const amountX = 300;
        const statusX = 400;

        doc.fontSize(10).font("Helvetica-Bold");
        doc.text("Date", itemX, tableTop);
        doc.text("Vendor", itemX + 80, tableTop);
        doc.text("Amount", amountX, tableTop);
        doc.text("Status", statusX, tableTop);

        doc.moveDown(1);
        doc.font("Helvetica");

        let y = doc.y;
        data.expenses.forEach((expense) => {
          if (y > 700) {
            doc.addPage();
            y = 50;
          }

          doc.fontSize(9);
          doc.text(
            expense.date ? new Date(expense.date).toLocaleDateString() : "",
            itemX,
            y,
          );
          doc.text(expense.vendor || "", itemX + 80, y, { width: 200 });
          doc.text(
            `$${(parseFloat(expense.amount) || 0).toFixed(2)}`,
            amountX,
            y,
          );
          doc.text(expense.status || "", statusX, y);

          y += 20;
        });

        doc.moveDown();
        doc.font("Helvetica-Bold");
        doc.text("Total Expenses:", amountX - 80, y);
        doc.text(
          `$${data.expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0).toFixed(2)}`,
          amountX,
          y,
        );
      }

      if (data.donors && data.donors.length > 0) {
        doc.addPage();
        doc.fontSize(16).text("Donors", { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const itemX = 50;
        const amountX = 300;
        const statusX = 400;

        doc.fontSize(10).font("Helvetica-Bold");
        doc.text("Name", itemX, tableTop);
        doc.text("Email", itemX + 120, tableTop);
        doc.text("Amount", amountX, tableTop);
        doc.text("Status", statusX, tableTop);

        doc.moveDown(1);
        doc.font("Helvetica");

        let y = doc.y;
        data.donors.forEach((donor) => {
          if (y > 700) {
            doc.addPage();
            y = 50;
          }

          doc.fontSize(9);
          doc.text(
            `${donor.firstName || ""} ${donor.lastName || ""}`,
            itemX,
            y,
          );
          doc.text(donor.email || "", itemX + 120, y, { width: 170 });
          doc.text(
            `$${(parseFloat(donor.amount) || 0).toFixed(2)}`,
            amountX,
            y,
          );
          doc.text(
            donor.status ? donor.status.replace("_", " ") : "",
            statusX,
            y,
          );

          y += 20;
        });

        doc.moveDown();
        doc.font("Helvetica-Bold");
        doc.text("Total Donations:", amountX - 80, y);
        doc.text(
          `$${data.donors.reduce((sum, donor) => sum + (parseFloat(donor.amount) || 0), 0).toFixed(2)}`,
          amountX,
          y,
        );
      }

      doc.addPage();
      doc.fontSize(10).text("End of Report", { align: "center" });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  getReports,
  addExpense,
  addDonor,
  updateExpense,
  updateDonor,
  deleteExpense,
  deleteDonor,
  exportReports,
};
