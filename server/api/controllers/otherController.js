// api/controllers/otherController.js
const AuditLog = require("../models/AuditLog");
const Backup = require("../models/Backup");
const User = require("../models/User");
const Donor = require("../models/Donor");
const Expense = require("../models/Expense");
const MediaAsset = require("../models/MediaAsset");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const { promisify } = require("util");

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
const readdirAsync = promisify(fs.readdir);
const unlinkAsync = promisify(fs.unlink);
const statAsync = promisify(fs.stat);

const getAuditLogs = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only administrators can view audit logs.",
      });
    }

    const { page = 1, limit = 20, timeRange = "30days" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let dateFilter = {};
    const now = new Date();

    switch (timeRange) {
      case "24hours":
        dateFilter.timestamp = {
          $gte: new Date(now.setDate(now.getDate() - 1)),
        };
        break;
      case "7days":
        dateFilter.timestamp = {
          $gte: new Date(now.setDate(now.getDate() - 7)),
        };
        break;
      case "30days":
        dateFilter.timestamp = {
          $gte: new Date(now.setDate(now.getDate() - 30)),
        };
        break;
      case "90days":
        dateFilter.timestamp = {
          $gte: new Date(now.setDate(now.getDate() - 90)),
        };
        break;
    }

    const query = { ...dateFilter };

    const total = await AuditLog.countDocuments(query);

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        if (log.user) {
          const user = await User.findById(log.user)
            .select("firstName lastName")
            .lean();
          if (user) {
            return {
              ...log,
              userName: `${user.firstName} ${user.lastName}`,
            };
          }
        }
        return log;
      }),
    );

    res.json({
      success: true,
      logs: enrichedLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get audit logs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
    });
  }
};

const exportAuditLogs = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only administrators can export audit logs.",
      });
    }

    const { timeRange = "30days" } = req.query;

    let dateFilter = {};
    const now = new Date();

    switch (timeRange) {
      case "24hours":
        dateFilter.timestamp = {
          $gte: new Date(now.setDate(now.getDate() - 1)),
        };
        break;
      case "7days":
        dateFilter.timestamp = {
          $gte: new Date(now.setDate(now.getDate() - 7)),
        };
        break;
      case "30days":
        dateFilter.timestamp = {
          $gte: new Date(now.setDate(now.getDate() - 30)),
        };
        break;
      case "90days":
        dateFilter.timestamp = {
          $gte: new Date(now.setDate(now.getDate() - 90)),
        };
        break;
    }

    const logs = await AuditLog.find(dateFilter)
      .sort({ timestamp: -1 })
      .populate("user", "firstName lastName email")
      .lean();

    const formattedLogs = logs.map((log) => ({
      action: log.action,
      user: log.user ? `${log.user.firstName} ${log.user.lastName}` : "N/A",
      email: log.user?.email || log.userEmail || "N/A",
      role: log.userRole || "N/A",
      timestamp: new Date(log.timestamp).toISOString(),
      ipAddress: log.ipAddress || "N/A",
      details: log.details ? JSON.stringify(log.details) : "N/A",
    }));

    await AuditLog.create({
      action: "Audit logs exported",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: { timeRange, count: formattedLogs.length },
    });

    res.json({
      success: true,
      logs: formattedLogs,
      exportDate: new Date().toISOString(),
      count: formattedLogs.length,
    });
  } catch (error) {
    console.error("Export audit logs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export audit logs",
    });
  }
};

const getBackups = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only administrators can view backups.",
      });
    }

    const backups = await Backup.find({ campaignId: "campaign_001" })
      .sort({ createdAt: -1 })
      .populate("createdBy", "firstName lastName email")
      .lean();

    res.json({
      success: true,
      backups,
    });
  } catch (error) {
    console.error("Get backups error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch backups",
    });
  }
};

const createBackup = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only administrators can create backups.",
      });
    }

    const {
      name,
      description,
      includeDatabase,
      includeMedia,
      includeSettings,
    } = req.body;
    const userId = req.user.userId;

    const backup = new Backup({
      name,
      description,
      type: "full",
      status: "processing",
      includes: {
        database: includeDatabase !== false,
        media: includeMedia !== false,
        settings: includeSettings !== false,
      },
      createdBy: userId,
      campaignId: "campaign_001",
    });

    await backup.save();

    await AuditLog.create({
      action: "Backup created",
      user: userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: backup._id,
      targetType: "Backup",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: { backupName: name, includes: backup.includes },
    });

    processBackup(backup._id);

    res.json({
      success: true,
      message: "Backup creation started",
      backupId: backup._id,
    });
  } catch (error) {
    console.error("Create backup error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create backup",
    });
  }
};

const processBackup = async (backupId) => {
  try {
    const backup = await Backup.findById(backupId);
    if (!backup) return;

    const backupDir = path.join(__dirname, "../../backups");
    const backupFilePath = path.join(backupDir, `${backup._id}.json`);

    if (!fs.existsSync(backupDir)) {
      await mkdirAsync(backupDir, { recursive: true });
    }

    const backupData = {
      metadata: {
        backupId: backup._id,
        name: backup.name,
        description: backup.description,
        createdAt: new Date().toISOString(),
        includes: backup.includes,
      },
    };

    if (backup.includes.database) {
      const collections = [];

      const users = await User.find({}).lean();
      if (users.length > 0) {
        collections.push({ name: "users", count: users.length });
        backupData.users = users;
      }

      const donors = await Donor.find({}).lean();
      if (donors.length > 0) {
        collections.push({ name: "donors", count: donors.length });
        backupData.donors = donors;
      }

      const expenses = await Expense.find({}).lean();
      if (expenses.length > 0) {
        collections.push({ name: "expenses", count: expenses.length });
        backupData.expenses = expenses;
      }

      const mediaAssets = await MediaAsset.find({}).lean();
      if (mediaAssets.length > 0) {
        collections.push({ name: "mediaAssets", count: mediaAssets.length });
        backupData.mediaAssets = mediaAssets;
      }

      const auditLogs = await AuditLog.find({})
        .sort({ timestamp: -1 })
        .limit(1000)
        .lean();
      if (auditLogs.length > 0) {
        collections.push({ name: "auditLogs", count: auditLogs.length });
        backupData.auditLogs = auditLogs;
      }

      backup.collectionsBackedUp = collections.map((c) => c.name);
    }

    await writeFileAsync(backupFilePath, JSON.stringify(backupData, null, 2));

    const stats = await statAsync(backupFilePath);
    backup.size = stats.size;
    backup.filePath = backupFilePath;
    backup.status = "completed";

    await backup.save();

    if (backup.includes.media) {
      await createMediaBackup(backup);
    }
  } catch (error) {
    console.error("Process backup error:", error);

    await Backup.findByIdAndUpdate(backupId, {
      status: "failed",
      error: error.message,
    });
  }
};

const createMediaBackup = async (backup) => {
  try {
    const mediaDir = path.join(__dirname, "../../uploads");
    const backupDir = path.join(__dirname, "../../backups");
    const zipFilePath = path.join(backupDir, `${backup._id}_media.zip`);

    if (!fs.existsSync(mediaDir)) {
      return;
    }

    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", async () => {
      console.log(`Media backup created: ${zipFilePath}`);
    });

    archive.on("error", (err) => {
      throw err;
    });

    archive.pipe(output);
    archive.directory(mediaDir, false);
    await archive.finalize();
  } catch (error) {
    console.error("Create media backup error:", error);
  }
};

const restoreBackup = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only administrators can restore backups.",
      });
    }

    const { id } = req.params;
    const userId = req.user.userId;

    const backup = await Backup.findById(id);
    if (!backup) {
      return res.status(404).json({
        success: false,
        message: "Backup not found",
      });
    }

    if (backup.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Backup is not ready for restoration",
      });
    }

    if (!backup.filePath || !fs.existsSync(backup.filePath)) {
      return res.status(400).json({
        success: false,
        message: "Backup file not found",
      });
    }

    const backupData = JSON.parse(fs.readFileSync(backup.filePath, "utf8"));

    restoreBackupData(backupData, userId);

    await AuditLog.create({
      action: "Backup restoration started",
      user: userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: backup._id,
      targetType: "Backup",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: { backupName: backup.name },
    });

    res.json({
      success: true,
      message: "Backup restoration started",
    });
  } catch (error) {
    console.error("Restore backup error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to restore backup",
    });
  }
};

const restoreBackupData = async (backupData, userId) => {
  try {
    if (backupData.users) {
      for (const user of backupData.users) {
        if (user._id === userId) continue;

        await User.findOneAndUpdate(
          { email: user.email },
          { ...user, _id: user._id },
          { upsert: true, new: true },
        );
      }
    }

    if (backupData.donors) {
      for (const donor of backupData.donors) {
        await Donor.findOneAndUpdate(
          { email: donor.email, date: donor.date },
          donor,
          { upsert: true, new: true },
        );
      }
    }

    if (backupData.expenses) {
      for (const expense of backupData.expenses) {
        await Expense.findOneAndUpdate(
          { vendor: expense.vendor, date: expense.date },
          expense,
          { upsert: true, new: true },
        );
      }
    }

    if (backupData.mediaAssets) {
      for (const media of backupData.mediaAssets) {
        await MediaAsset.findOneAndUpdate({ fileName: media.fileName }, media, {
          upsert: true,
          new: true,
        });
      }
    }

    await AuditLog.create({
      action: "System restored from backup",
      user: userId,
      userEmail: "system@restore.com",
      userRole: "system",
      details: {
        backupName: backupData.metadata?.name,
        collectionsRestored: Object.keys(backupData).filter(
          (key) => key !== "metadata",
        ),
      },
    });

    console.log("Backup restoration completed");
  } catch (error) {
    console.error("Restore backup data error:", error);

    await AuditLog.create({
      action: "Backup restoration failed",
      user: userId,
      userEmail: "system@restore.com",
      userRole: "system",
      details: { error: error.message },
    });
  }
};

const deleteBackup = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only administrators can delete backups.",
      });
    }

    const { id } = req.params;
    const userId = req.user.userId;

    const backup = await Backup.findById(id);
    if (!backup) {
      return res.status(404).json({
        success: false,
        message: "Backup not found",
      });
    }

    if (backup.filePath && fs.existsSync(backup.filePath)) {
      await unlinkAsync(backup.filePath);
    }

    const mediaZipPath = backup.filePath?.replace(".json", "_media.zip");
    if (mediaZipPath && fs.existsSync(mediaZipPath)) {
      await unlinkAsync(mediaZipPath);
    }

    await Backup.findByIdAndDelete(id);

    await AuditLog.create({
      action: "Backup deleted",
      user: userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: backup._id,
      targetType: "Backup",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: { backupName: backup.name },
    });

    res.json({
      success: true,
      message: "Backup deleted successfully",
    });
  } catch (error) {
    console.error("Delete backup error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete backup",
    });
  }
};

const downloadBackup = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only administrators can download backups.",
      });
    }

    const { id } = req.params;

    const backup = await Backup.findById(id);
    if (!backup) {
      return res.status(404).json({
        success: false,
        message: "Backup not found",
      });
    }

    if (backup.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Backup is not ready for download",
      });
    }

    if (!backup.filePath || !fs.existsSync(backup.filePath)) {
      return res.status(400).json({
        success: false,
        message: "Backup file not found",
      });
    }

    const backupData = JSON.parse(fs.readFileSync(backup.filePath, "utf8"));

    await AuditLog.create({
      action: "Backup downloaded",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: backup._id,
      targetType: "Backup",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: { backupName: backup.name },
    });

    res.json({
      success: true,
      ...backupData,
    });
  } catch (error) {
    console.error("Download backup error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download backup",
    });
  }
};

const getSystemStats = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only administrators can view system stats.",
      });
    }

    const totalUsers = await User.countDocuments();
    const totalAuditLogs = await AuditLog.countDocuments();
    const totalBackups = await Backup.countDocuments();
    const totalDonors = await Donor.countDocuments();
    const totalExpenses = await Expense.countDocuments();
    const totalMediaAssets = await MediaAsset.countDocuments();

    const dbStats = await mongoose.connection.db.stats();
    const dbSize = dbStats.dataSize;

    const uptimeDays = Math.floor(process.uptime() / 86400);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalAuditLogs,
        totalBackups,
        totalDonors,
        totalExpenses,
        totalMediaAssets,
        dbSize,
        uptimeDays,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Get system stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch system statistics",
    });
  }
};

module.exports = {
  getAuditLogs,
  exportAuditLogs,
  getBackups,
  createBackup,
  restoreBackup,
  deleteBackup,
  downloadBackup,
  getSystemStats,
};
