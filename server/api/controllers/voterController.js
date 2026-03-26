// api/controllers/voterController.js
const Voter = require("../models/Voter");
const AuditLog = require("../models/AuditLog");
const csv = require("csv-parser");
const xlsx = require("xlsx");
const { Readable } = require("stream");
const { PERMISSIONS } = require("../../../lib/permissions");

const normalizeHeader = (h) => {
  return String(h || "")
    .toLowerCase()
    .trim()
    .replace(/\u00a0/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const HEADER_ALIASES = {
  county: "countyCode",
  "county code": "countyCode",
  "voter id": "voterId",

  // Name variations - added Florida format
  "last name": "nameLast",
  "name last": "nameLast", // Florida format
  "first name": "nameFirst",
  "name first": "nameFirst", // Florida format
  "name suffix": "nameSuffix", // Florida format
  "name middle": "nameMiddle", // Florida format
  "middle name": "nameMiddle",
  suffix: "nameSuffix",

  "requested public records exemption": "requestedExemption",
  "requested public records 1 exemption": "requestedExemption", // Florida format with number

  "residence address line 1": "residenceAddress1",
  "residence address line 2": "residenceAddress2",
  "residence city usps": "residenceCity",
  "residence city": "residenceCity",
  "residence state": "residenceState",
  "residence zipcode": "residenceZip",
  "residence zip code": "residenceZip", // Added space variation

  "mailing address line 1": "mailingAddress1",
  "mailing address line 2": "mailingAddress2",
  "mailing address line 3": "mailingAddress3",
  "mailing city": "mailingCity",
  "mailing state": "mailingState",
  "mailing zipcode": "mailingZip",
  "mailing zip code": "mailingZip", // Added space variation
  "mailing country": "mailingCountry",

  birthdate: "birthDate",
  "birth date": "birthDate",
  "registration date": "registrationDate",
  "party affiliation": "partyAffiliation",
  "precinct group": "precinctGroup",
  "precinct split": "precinctSplit",
  "precinct suffix": "precinctSuffix",
  "voter status": "voterStatus",
  "congressional district": "congressionalDistrict",
  "house district": "houseDistrict",
  "senate district": "senateDistrict",
  "county commission district": "countyCommissionDistrict",
  "country commissioner district": "countyCommissionDistrict",
  "school board district": "schoolBoardDistrict",
  "daytime area code": "daytimeAreaCode",
  "daytime phone number": "daytimePhoneNumber",
  "daytime phone extension": "daytimePhoneExtension",
  "email address": "email",
  email: "email",
};

const parseDate = (value) => {
  if (!value) return "";
  const str = String(value).trim();

  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[2]}/${match[3]}/${match[1]}`;
  }

  const d = new Date(str);
  if (!isNaN(d)) {
    return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}/${d.getFullYear()}`;
  }

  return str;
};

const uploadVoters = async (req, res) => {
  try {
    if (!PERMISSIONS.CAN_EDIT_VOTER_DATA(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Executive team and Data Directors can upload voter data.",
      });
    }

    const { mode = "append" } = req.body;
    const file = req.file;

    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const results = { processed: 0, inserted: 0, errors: [] };
    const batch = [];
    const BATCH_SIZE = 100;

    try {
      if (
        file.originalname.endsWith(".txt") ||
        file.originalname.endsWith(".csv")
      ) {
        const stream = Readable.from(file.buffer.toString().split("\n"));
        let headers = null;
        let headerMap = null;

        await new Promise((resolve, reject) => {
          stream
            .pipe(csv({ separator: "\t", headers: false }))
            .on("headers", (h) => {
              headers = h.map(normalizeHeader);
              headerMap = new Map();
              headers.forEach((h, idx) => {
                if (HEADER_ALIASES[h]) {
                  headerMap.set(HEADER_ALIASES[h], idx);
                }
              });

              if (!headerMap.has("countyCode") || !headerMap.has("voterId")) {
                stream.destroy();
                reject(
                  new Error(
                    "File missing required columns: County Code and Voter ID",
                  ),
                );
              }
            })
            .on("data", async (row) => {
              stream.pause();

              const voter = {};
              for (const [key, idx] of headerMap) {
                voter[key] = (row[idx] || "").toString().trim();
              }

              voter.birthDate = parseDate(voter.birthDate);
              voter.registrationDate = parseDate(voter.registrationDate);

              voter.importedBy = req.user.userId;
              voter.sourceFile = file.originalname;

              batch.push(voter);
              results.processed++;

              if (batch.length >= BATCH_SIZE) {
                await processBatch(batch, mode, results);
                batch.length = 0;
              }

              stream.resume();
            })
            .on("end", async () => {
              if (batch.length > 0) {
                await processBatch(batch, mode, results);
              }
              resolve();
            })
            .on("error", reject);
        });
      } else if (
        file.originalname.endsWith(".xlsx") ||
        file.originalname.endsWith(".xls")
      ) {
        const workbook = xlsx.read(file.buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });

        if (rows.length < 2) {
          return res
            .status(400)
            .json({ success: false, message: "File has no data rows" });
        }

        const headers = rows[0].map(normalizeHeader);
        const headerMap = new Map();
        headers.forEach((h, idx) => {
          if (HEADER_ALIASES[h]) {
            headerMap.set(HEADER_ALIASES[h], idx);
          }
        });

        if (!headerMap.has("countyCode") || !headerMap.has("voterId")) {
          return res.status(400).json({
            success: false,
            message:
              "File missing required columns. Please use the template or provide a Florida voter extract.",
          });
        }

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const voter = {};

          for (const [key, idx] of headerMap) {
            voter[key] = (row[idx] || "").toString().trim();
          }

          voter.birthDate = parseDate(voter.birthDate);
          voter.registrationDate = parseDate(voter.registrationDate);
          voter.importedBy = req.user.userId;
          voter.sourceFile = file.originalname;

          batch.push(voter);
          results.processed++;

          if (batch.length >= BATCH_SIZE) {
            await processBatch(batch, mode, results);
            batch.length = 0;
          }
        }

        if (batch.length > 0) {
          await processBatch(batch, mode, results);
        }
      }

      await AuditLog.create({
        action: "Upload voters",
        user: req.user.userId,
        userEmail: req.user.email,
        userRole: req.user.role,
        details: {
          mode,
          filename: file.originalname,
          processed: results.processed,
          inserted: results.inserted,
          errors: results.errors.length,
        },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.json({
        success: true,
        ...results,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Upload failed",
        errors: results.errors,
      });
    }
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Upload failed",
    });
  }
};

async function processBatch(batch, mode, results) {
  try {
    if (mode === "replace") {
      const operations = batch.map((voter) => ({
        deleteOne: {
          filter: { countyCode: voter.countyCode, voterId: voter.voterId },
        },
      }));
      operations.push(
        ...batch.map((voter) => ({
          insertOne: { document: voter },
        })),
      );

      const result = await Voter.bulkWrite(operations, { ordered: false });
      results.inserted += result.insertedCount || 0;
    } else if (mode === "update") {
      const operations = batch.map((voter) => ({
        updateOne: {
          filter: { countyCode: voter.countyCode, voterId: voter.voterId },
          update: { $set: voter },
          upsert: true,
        },
      }));

      const result = await Voter.bulkWrite(operations, { ordered: false });
      results.inserted +=
        (result.upsertedCount || 0) + (result.modifiedCount || 0);
    } else {
      const operations = batch.map((voter) => ({
        updateOne: {
          filter: { countyCode: voter.countyCode, voterId: voter.voterId },
          update: { $setOnInsert: voter },
          upsert: true,
        },
      }));

      const result = await Voter.bulkWrite(operations, { ordered: false });
      results.inserted += result.upsertedCount || 0;

      if (result.upsertedCount < batch.length) {
        batch.forEach((voter) => {
          results.errors.push({
            row: results.processed - batch.length + batch.indexOf(voter) + 2,
            error: `Duplicate voter: ${voter.countyCode}-${voter.voterId}`,
          });
        });
      }
    }
  } catch (error) {
    console.error("Batch error:", error);
    batch.forEach((voter, idx) => {
      results.errors.push({
        row: results.processed - batch.length + idx + 2,
        error: error.message,
      });
    });
  }
}

const getVoters = async (req, res) => {
  try {
    if (!PERMISSIONS.CAN_VIEW_VOTER_DATA(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You don't have permission to view voter data.",
      });
    }

    const {
      page = 1,
      limit = 50,
      county,
      party,
      status,
      search,
      contactFilter,
    } = req.query;

    const query = {};

    if (county) query.countyCode = county;
    if (party) query.partyAffiliation = party;
    if (status) query.voterStatus = status;

    if (contactFilter) {
      switch (contactFilter) {
        case "hasPhone":
          query.$and = [
            { daytimePhoneNumber: { $exists: true } },
            { daytimePhoneNumber: { $ne: "" } },
          ];
          break;
        case "hasEmail":
          query.$and = [{ email: { $exists: true } }, { email: { $ne: "" } }];
          break;
        case "hasBoth":
          query.$and = [
            { daytimePhoneNumber: { $exists: true, $ne: "" } },
            { email: { $exists: true, $ne: "" } },
          ];
          break;
      }
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const voters = await Voter.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Voter.countDocuments(query);

    res.json({
      success: true,
      voters,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get voters error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getVoterStats = async (req, res) => {
  try {
    if (!PERMISSIONS.CAN_VIEW_VOTER_DATA(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const [
      total,
      active,
      inactive,
      byParty,
      byCounty,
      withPhone,
      withEmail,
      withBoth,
    ] = await Promise.all([
      Voter.countDocuments(),
      Voter.countDocuments({ voterStatus: "ACT" }),
      Voter.countDocuments({ voterStatus: "INA" }),
      Voter.aggregate([
        { $group: { _id: "$partyAffiliation", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Voter.aggregate([
        { $group: { _id: "$countyCode", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Voter.countDocuments({
        daytimePhoneNumber: { $exists: true, $ne: "" },
      }),
      Voter.countDocuments({
        email: { $exists: true, $ne: "" },
      }),
      Voter.countDocuments({
        $and: [
          { daytimePhoneNumber: { $exists: true, $ne: "" } },
          { email: { $exists: true, $ne: "" } },
        ],
      }),
    ]);

    const formatAgg = (agg) => {
      const result = {};
      agg.forEach((item) => (result[item._id || "unknown"] = item.count));
      return result;
    };

    res.json({
      success: true,
      stats: {
        total,
        active,
        inactive,
        byParty: formatAgg(byParty),
        byCounty: formatAgg(byCounty),
        contactStats: {
          withPhone,
          withEmail,
          withBoth,
        },
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateVoter = async (req, res) => {
  try {
    if (!PERMISSIONS.CAN_EDIT_VOTER_DATA(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Executive team and Data Directors can edit voter data.",
      });
    }

    const voter = await Voter.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true },
    );

    if (!voter) {
      return res
        .status(404)
        .json({ success: false, message: "Voter not found" });
    }

    res.json({ success: true, voter });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

const exportVotersFull = async (req, res) => {
  try {
    const { county, party, status, search } = req.query;

    const query = {};
    if (county) query.countyCode = county;
    if (party) query.partyAffiliation = party;
    if (status) query.voterStatus = status;
    if (search) {
      query.$text = { $search: search };
    }

    const voters = await Voter.find(query).sort({ nameLast: 1, nameFirst: 1 });

    // Create CSV headers
    const headers = [
      "County Code",
      "Voter ID",
      "Last Name",
      "First Name",
      "Middle Name",
      "Suffix",
      "Residence Address",
      "Residence City",
      "Residence State",
      "Residence Zip",
      "Mailing Address",
      "Mailing City",
      "Mailing State",
      "Mailing Zip",
      "Phone",
      "Email",
      "Party",
      "Status",
      "Birth Date",
      "Registration Date",
      "Precinct",
      "Congressional District",
      "House District",
      "Senate District",
      "Gender",
      "Race",
      "Support Level",
    ];

    const rows = voters.map((v) => [
      v.countyCode || "",
      v.voterId || "",
      v.nameLast || "",
      v.nameFirst || "",
      v.nameMiddle || "",
      v.nameSuffix || "",
      v.residenceAddress1 || "",
      v.residenceCity || "",
      v.residenceState || "",
      v.residenceZip || "",
      v.mailingAddress1 || "",
      v.mailingCity || "",
      v.mailingState || "",
      v.mailingZip || "",
      v.daytimePhoneNumber
        ? `${v.daytimeAreaCode || ""}${v.daytimePhoneNumber}`
        : "",
      v.email || "",
      v.partyAffiliation || "",
      v.voterStatus || "",
      v.birthDate || "",
      v.registrationDate || "",
      v.precinct || "",
      v.congressionalDistrict || "",
      v.houseDistrict || "",
      v.senateDistrict || "",
      v.gender || "",
      v.race || "",
      v.supportLevel || "",
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=voters_full_${new Date().toISOString().split("T")[0]}.csv`,
    );
    res.send(csv);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ success: false, message: "Export failed" });
  }
};

const exportVotersPhones = async (req, res) => {
  try {
    const { county, party, status, search } = req.query;

    const query = {
      daytimePhoneNumber: { $exists: true, $ne: "" },
    };
    if (county) query.countyCode = county;
    if (party) query.partyAffiliation = party;
    if (status) query.voterStatus = status;
    if (search) {
      query.$text = { $search: search };
    }

    const voters = await Voter.find(query).sort({ nameLast: 1, nameFirst: 1 });

    const headers = [
      "Last Name",
      "First Name",
      "Phone Number",
      "County",
      "Party",
      "Status",
    ];
    const rows = voters.map((v) => [
      v.nameLast || "",
      v.nameFirst || "",
      v.daytimePhoneNumber
        ? `${v.daytimeAreaCode || ""}${v.daytimePhoneNumber}`
        : "",
      v.countyCode || "",
      v.partyAffiliation || "",
      v.voterStatus || "",
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=voters_phones_${new Date().toISOString().split("T")[0]}.csv`,
    );
    res.send(csv);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ success: false, message: "Export failed" });
  }
};

const exportVotersEmails = async (req, res) => {
  try {
    const { county, party, status, search } = req.query;

    const query = {
      email: { $exists: true, $ne: "" },
    };
    if (county) query.countyCode = county;
    if (party) query.partyAffiliation = party;
    if (status) query.voterStatus = status;
    if (search) {
      query.$text = { $search: search };
    }

    const voters = await Voter.find(query).sort({ nameLast: 1, nameFirst: 1 });

    const headers = [
      "Last Name",
      "First Name",
      "Email",
      "County",
      "Party",
      "Status",
    ];
    const rows = voters.map((v) => [
      v.nameLast || "",
      v.nameFirst || "",
      v.email || "",
      v.countyCode || "",
      v.partyAffiliation || "",
      v.voterStatus || "",
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=voters_emails_${new Date().toISOString().split("T")[0]}.csv`,
    );
    res.send(csv);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ success: false, message: "Export failed" });
  }
};

module.exports = {
  uploadVoters,
  getVoters,
  getVoterStats,
  updateVoter,
  exportVotersFull,
  exportVotersPhones,
  exportVotersEmails,
};
