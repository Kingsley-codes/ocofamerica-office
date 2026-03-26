const Fundraising = require("../models/Fundraising");
const AuditLog = require("../models/AuditLog");
const XLSX = require("xlsx");
const mongoose = require("mongoose");

const getRawBody = (req) => {
  return new Promise((resolve, reject) => {
    let data = [];
    req.on("data", (chunk) => data.push(chunk));
    req.on("end", () => resolve(Buffer.concat(data)));
    req.on("error", reject);
  });
};

// Comprehensive header pattern matching with extensive search words
const headerPatterns = {
  firstName: {
    patterns: [
      "first name",
      "first",
      "firstname",
      "name first",
      "first_name",
      "first-name",
      "donor first",
      "donor first name",
      "donorfirstname",
      "donor_first",
      "fundraiser first",
      "fundraiser first name",
      "fundraiserfirst",
      "voter first",
      "voter first name",
      "voterfirst",
      "namefirst",
      "first name (voter)",
      "first_name (voter)",
      "fname",
      "f name",
      "f-name",
      "given name",
      "christian name",
      "forename",
      "first given name",
      "contact first",
      "contact first name",
      "person first",
      "individual first",
      "individual first name",
      "first name of donor",
      "first name of contributor",
      "donor's first name",
      "contributor's first name",
    ],
    priority: 10,
  },

  lastName: {
    patterns: [
      "last name",
      "last",
      "lastname",
      "name last",
      "last_name",
      "last-name",
      "donor last",
      "donor last name",
      "donorlastname",
      "donor_last",
      "fundraiser last",
      "fundraiser last name",
      "fundraiserlast",
      "voter last",
      "voter last name",
      "voterlast",
      "namelast",
      "last name (voter)",
      "last_name (voter)",
      "lname",
      "l name",
      "l-name",
      "surname",
      "family name",
      "last family name",
      "contact last",
      "contact last name",
      "person last",
      "individual last",
      "individual last name",
      "last name of donor",
      "last name of contributor",
      "donor's last name",
      "contributor's last name",
    ],
    priority: 10,
  },

  fullName: {
    patterns: [
      "name",
      "full name",
      "fullname",
      "complete name",
      "full_name",
      "full-name",
      "donor name",
      "donorname",
      "donor_name",
      "donor-fullname",
      "voter name",
      "votername",
      "voter_name",
      "voter-fullname",
      "name (voter)",
      "voter name (full)",
      "full voter name",
      "name (last, first)",
      "name (first last)",
      "full name (last, first)",
      "display name",
      "full display name",
      "complete name",
      "entity name",
      "contributor name",
      "contributor full name",
      "individual name",
      "person name",
      "contact name",
      "organization name",
      "org name",
      "company name",
      "committee name",
      "political committee name",
    ],
    priority: 8,
  },

  company: {
    patterns: [
      "company",
      "organization",
      "org",
      "employer",
      "business",
      "firm",
      "company name",
      "organization name",
      "org name",
      "employer name",
      "business name",
      "firm name",
      "donor company",
      "donor organization",
      "donor org",
      "donor employer",
      "organization (company)",
      "committee name",
      "political committee",
      "pari mutuel",
      "association",
      "corporation",
      "inc",
      "llc",
      "entity",
      "legal entity",
      "corporate name",
      "workplace",
      "place of employment",
      "employer/company",
      "co",
      "org name",
      "bus name",
      "fuel food and bever",
      "law firm",
      "health care",
      "governmental consult",
      "public affairs",
      "space technology",
      "investment developer",
      "security",
      "agribusiness",
      "agrichemical",
    ],
    priority: 7,
  },

  phone: {
    patterns: [
      "phone",
      "telephone",
      "tel",
      "contact number",
      "mobile",
      "cell",
      "phone number",
      "telephone number",
      "mobile number",
      "cell number",
      "best phone",
      "primary phone",
      "main phone",
      "home phone",
      "phone1",
      "phone 1",
      "phone2",
      "phone 2",
      "phone3",
      "phone 3",
      "phone4",
      "phone 4",
      "phone (best)",
      "phone (primary)",
      "phone (home)",
      "phone (work)",
      "bestphone",
      "source best phone",
      "phone 2",
      "phone 3",
      "phone 4",
      "source phone 2",
      "source phone 3",
      "source phone 4",
      "phone with source",
      "phone (source)",
      "contact phone",
      "daytime phone",
      "evening phone",
      "contact telephone",
      "voter phone",
      "donor phone",
      "contributor phone",
      "phone (international)",
      "tel no",
      "tel no.",
      "ph",
      "ph#",
      "phone #",
      "tele",
      "cell#",
    ],
    priority: 9,
  },

  email: {
    patterns: [
      "email",
      "e-mail",
      "email address",
      "e-mail address",
      "mail",
      "electronic mail",
      "email id",
      "email id",
      "email1",
      "email 1",
      "email2",
      "email 2",
      "email3",
      "email 3",
      "email4",
      "email 4",
      "primary email",
      "secondary email",
      "alternate email",
      "email source",
      "allemail",
      "all email",
      "email (source)",
      "email with source",
      "email source",
      "contact email",
      "donor email",
      "voter email",
      "contributor email",
      "personal email",
      "work email",
      "business email",
      "webmail",
      "internet email",
      "online email",
      "em",
      "eml",
      "e-add",
      "electronic address",
    ],
    priority: 9,
  },

  pledgeAmount: {
    patterns: [
      "contributionamount",
      "contribution amount",
      "pledge",
      "pledged amount",
      "amount",
      "contribution",
      "donation",
      "pledge amount",
      "contribution amount",
      "donation amount",
      "targeted amt",
      "targeted amount",
      "total amt",
      "total amount",
      "candidate amt",
      "candidate amount",
      "rep amt",
      "dem amt",
      "oth amt",
      "house amt",
      "senate amt",
      "judicial amt",
      "cabinet amt",
      "committee amt",
      "contributionamount",
      "contributions",
      "total amt",
      "total amount",
      "amount pledged",
      "pledge $",
      "amount $",
      "donation $",
      "financial contribution",
      "monetary contribution",
      "campaign contribution",
      "political contribution",
      "amount (usd)",
      "amount ($)",
      "usd amount",
      "pledge (usd)",
      "pledge ($)",
      "total contributions",
      "total donated",
      "lifetime giving",
      "this contribution",
      "contribution amount",
      "targeted count",
      "total count",
      "candidate count",
      "rep count",
      "dem count",
      "oth count",
      "house count",
      "senate count",
      "judicial count",
      "cabinet count",
      "committee count",
    ],
    preferredOrder: [
      "contributionamount",
      "pledge amount",
      "contributionamount",
      "contribution amount",
      "candidate amt",
      "total amt",
      "amount",
      "pledge",
      "targeted amt",
      "rep amt",
      "dem amt",
    ],
  },

  historicalAmount: {
    patterns: [
      "contributionamount",
      "contribution amount",
      "total amt",
      "total amount",
      "historical donation",
      "previous donation",
      "past donation",
      "last donation",
      "donation history",
      "prior donation",
      "historical amount",
      "previous amount",
      "past amount",
      "total contributions",
      "lifetime giving",
      "total donated",
      "prior contributions",
      "past contributions",
      "historical giving",
      "donor history amount",
      "previous pledge",
      "last pledge amount",
      "total historical",
    ],
    priority: 10,
  },

  county: {
    patterns: [
      "county",
      "donor county",
      "county name",
      "voter county",
      "residence county",
      "county of residence",
      "fl county",
      "florida county",
      "dade",
      "dade county",
      "miami-dade",
      "miami dade",
      "broward",
      "palm beach",
      "orange",
      "hillsborough",
      "county name (voter)",
      "voter county",
      "source county",
      "county code",
    ],
    priority: 7,
  },

  party: {
    patterns: [
      "party",
      "political party",
      "voter party",
      "party affiliation",
      "affiliation",
      "party registration",
      "registered party",
      "dem",
      "rep",
      "independent",
      "party (dem/rep)",
      "party code",
      "party affiliation (voter)",
      "voter party",
      "political affiliation",
      "party registration status",
    ],
    priority: 7,
  },

  address: {
    patterns: [
      "address",
      "address1",
      "address 1",
      "address line 1",
      "street",
      "street address",
      "mailing address",
      "physical address",
      "residence address",
      "home address",
      "address1",
      "address2",
      "address3",
      "street address",
      "mail street",
      "residence street",
      "address line1",
      "address line 1",
      "addr1",
      "addr 1",
      "primary address",
      "main address",
      "street number",
      "street name",
      "house number",
      "delivery address",
      "shipping address",
      "street (address)",
      "address (street)",
    ],
    priority: 6,
  },

  address2: {
    patterns: [
      "address2",
      "address 2",
      "address line 2",
      "address line2",
      "addr2",
      "addr 2",
      "secondary address",
      "address cont",
      "apt",
      "suite",
      "unit",
      "apartment",
      "ste",
      "floor",
      "building",
      "room",
      "department",
      "address2",
      "address 2",
      "address (line 2)",
      "mail address line 2",
      "residence address line 2",
    ],
    priority: 5,
  },

  city: {
    patterns: [
      "city",
      "town",
      "municipality",
      "village",
      "city/town",
      "residence city",
      "mail city",
      "city name",
      "city",
      "voter city",
      "donor city",
      "mail city",
      "city (voter)",
      "city of residence",
      "city/town/village",
      "town/city",
    ],
    priority: 6,
  },

  state: {
    patterns: [
      "state",
      "province",
      "region",
      "territory",
      "state code",
      "state abbreviation",
      "st",
      "state",
      "voter state",
      "donor state",
      "mail state",
      "state (voter)",
      "state of residence",
      "state (us)",
      "us state",
    ],
    priority: 6,
  },

  zip: {
    patterns: [
      "zip",
      "zip code",
      "postal code",
      "postcode",
      "postal",
      "zip+4",
      "zip4",
      "zip +4",
      "zip+four",
      "zip plus 4",
      "zip",
      "+4",
      "4",
      "zip+4",
      "mail zip",
      "postal code",
      "zip code (voter)",
      "donor zip",
      "residence zip",
      "postal code (zip)",
      "zip/postal",
      "zip or postal",
    ],
    priority: 6,
  },

  occupation: {
    patterns: [
      "occupation",
      "job",
      "profession",
      "job title",
      "position",
      "employment",
      "career",
      "vocation",
      "contributionlistedoccupation",
      "listed occupation",
      "occupation (listed)",
      "donor occupation",
      "occupation/job",
      "job/position",
      "professional role",
    ],
    priority: 4,
  },

  type: {
    patterns: [
      "type",
      "record type",
      "donor type",
      "contributor type",
      "entity type",
      "category",
      "classification",
      "type",
      "record type",
      "contributiontotype",
      "committee type",
      "organization type",
    ],
    priority: 3,
  },

  voterId: {
    patterns: [
      "voter id",
      "voterid",
      "voter identification",
      "voter #",
      "flvoterid",
      "voter registration id",
      "registration id",
      "voter id",
      "flvoterid",
      "voter registration number",
    ],
    priority: 2,
  },

  source: {
    patterns: [
      "source",
      "data source",
      "source code",
      "origin",
      "source best phone",
      "source phone 2",
      "source phone 3",
      "source phone 4",
      "email source",
      "best phone source",
      "phone source",
    ],
    priority: 1,
  },
};

// Helper to normalize header text for comparison
const normalizeHeader = (header) => {
  if (!header) return "";
  return header
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// Enhanced column detection using pattern matching
const detectColumns = (headers) => {
  console.log("=== DETECTING COLUMNS ===");
  console.log("Headers:", headers);

  const normalizedHeaders = headers.map((h) => normalizeHeader(h));
  console.log("Normalized headers:", normalizedHeaders);

  const result = {
    firstName: { index: -1, confidence: "none", matchedPattern: null },
    lastName: { index: -1, confidence: "none", matchedPattern: null },
    fullName: { index: -1, confidence: "none", matchedPattern: null },
    company: { index: -1, confidence: "none", matchedPattern: null },
    phone: [],
    email: [],
    pledgeAmount: { index: -1, confidence: "none", matchedPattern: null },
    historicalAmount: { index: -1, confidence: "none", matchedPattern: null },
    county: { index: -1, confidence: "none", matchedPattern: null },
    party: { index: -1, confidence: "none", matchedPattern: null },
    address: { index: -1, confidence: "none", matchedPattern: null },
    address2: { index: -1, confidence: "none", matchedPattern: null },
    city: { index: -1, confidence: "none", matchedPattern: null },
    state: { index: -1, confidence: "none", matchedPattern: null },
    zip: { index: -1, confidence: "none", matchedPattern: null },
    occupation: { index: -1, confidence: "none", matchedPattern: null },
    type: { index: -1, confidence: "none", matchedPattern: null },
    voterId: { index: -1, confidence: "none", matchedPattern: null },
    detectedFormat: {},
    allMatches: [],
  };

  // Check each header against all patterns
  for (let i = 0; i < headers.length; i++) {
    const originalHeader = headers[i];
    if (!originalHeader) continue;

    const normalizedHeader = normalizedHeaders[i];
    const headerInfo = {
      index: i,
      original: originalHeader,
      normalized: normalizedHeader,
      matches: [],
    };

    for (const [fieldName, fieldConfig] of Object.entries(headerPatterns)) {
      for (const pattern of fieldConfig.patterns) {
        const normalizedPattern = normalizeHeader(pattern);

        if (normalizedHeader === normalizedPattern) {
          if (fieldName === "phone" || fieldName === "email") {
            result[fieldName].push({
              index: i,
              confidence: "exact",
              matchedPattern: pattern,
              originalHeader,
            });
          } else {
            const currentField = result[fieldName];
            const shouldReplace =
              currentField &&
              typeof currentField === "object" &&
              currentField.index !== undefined
                ? currentField.index === -1
                : true;

            if (shouldReplace) {
              result[fieldName] = {
                index: i,
                confidence: "exact",
                matchedPattern: pattern,
                originalHeader,
              };
            }
          }
          headerInfo.matches.push({
            field: fieldName,
            confidence: "exact",
            pattern,
          });
          break;
        } else if (
          normalizedHeader.includes(normalizedPattern) &&
          normalizedPattern.length > 3
        ) {
          if (fieldName === "phone" || fieldName === "email") {
            result[fieldName].push({
              index: i,
              confidence: "contains",
              matchedPattern: pattern,
              originalHeader,
            });
          } else {
            const currentField = result[fieldName];
            const shouldReplace =
              currentField &&
              typeof currentField === "object" &&
              currentField.index !== undefined
                ? currentField.index === -1
                : true;

            if (shouldReplace) {
              result[fieldName] = {
                index: i,
                confidence: "contains",
                matchedPattern: pattern,
                originalHeader,
              };
            }
          }
          headerInfo.matches.push({
            field: fieldName,
            confidence: "contains",
            pattern,
          });
        } else if (
          normalizedPattern.includes(normalizedHeader) &&
          normalizedHeader.length > 3
        ) {
          if (fieldName === "phone" || fieldName === "email") {
            result[fieldName].push({
              index: i,
              confidence: "partial",
              matchedPattern: pattern,
              originalHeader,
            });
          } else {
            const currentField = result[fieldName];
            const shouldReplace =
              currentField &&
              typeof currentField === "object" &&
              currentField.index !== undefined
                ? currentField.index === -1
                : true;

            if (shouldReplace) {
              result[fieldName] = {
                index: i,
                confidence: "partial",
                matchedPattern: pattern,
                originalHeader,
              };
            }
          }
          headerInfo.matches.push({
            field: fieldName,
            confidence: "partial",
            pattern,
          });
        }
      }
    }
    result.allMatches.push(headerInfo);
  }

  // Deduplicate phone and email columns
  result.phone = result.phone.filter(
    (v, i, a) => a.findIndex((t) => t.index === v.index) === i,
  );
  result.email = result.email.filter(
    (v, i, a) => a.findIndex((t) => t.index === v.index) === i,
  );

  const confidenceOrder = { exact: 3, contains: 2, partial: 1 };
  result.phone.sort(
    (a, b) => confidenceOrder[b.confidence] - confidenceOrder[a.confidence],
  );
  result.email.sort(
    (a, b) => confidenceOrder[b.confidence] - confidenceOrder[a.confidence],
  );

  result.detectedFormat = {
    hasSeparateNames:
      result.firstName.index !== -1 && result.lastName.index !== -1,
    hasFullName: result.fullName.index !== -1,
    phoneCount: result.phone.length,
    emailCount: result.email.length,
    hasAddress: result.address.index !== -1,
    hasPledgeAmount: result.pledgeAmount.index !== -1,
    hasHistoricalAmount: result.historicalAmount.index !== -1,
    hasCounty: result.county.index !== -1,
    hasParty: result.party.index !== -1,
    primaryFields: Object.entries(result)
      .filter(
        ([key, value]) =>
          !["allMatches", "detectedFormat", "phone", "email"].includes(key) &&
          value &&
          value.index !== -1,
      )
      .map(([key, value]) => ({ field: key, ...value })),
  };

  console.log("Detected columns:", {
    firstName: result.firstName,
    lastName: result.lastName,
    fullName: result.fullName,
    phone: result.phone,
    email: result.email,
    pledgeAmount: result.pledgeAmount,
    historicalAmount: result.historicalAmount,
  });

  return result;
};

// Parse full name into first and last
const parseFullName = (fullName) => {
  if (!fullName) return { firstName: "", lastName: "" };

  const trimmed = fullName.toString().trim();

  if (trimmed.includes(",")) {
    const parts = trimmed.split(",").map((s) => s.trim());
    if (parts.length >= 2) {
      const last = parts[0];
      const firstParts = parts.slice(1).join(" ").trim().split(/\s+/);
      return {
        firstName: firstParts.join(" "),
        lastName: last,
      };
    }
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  } else if (parts.length === 2) {
    return { firstName: parts[0], lastName: parts[1] };
  } else {
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(" "),
    };
  }
};

// Extract the best phone number from multiple phone columns
const extractBestPhone = (row, phoneColumns, rowIndex) => {
  if (!phoneColumns || phoneColumns.length === 0 || !row) return "";

  for (const col of phoneColumns) {
    // Check if column index exists and row has that index
    if (
      col.index === undefined ||
      col.index === -1 ||
      !row ||
      row.length <= col.index
    ) {
      console.log(
        `Row ${rowIndex}: Phone column index ${col.index} out of bounds (row length: ${row?.length})`,
      );
      continue;
    }

    const phone = row[col.index]?.toString().trim();
    if (!phone) {
      console.log(
        `Row ${rowIndex}: Phone value at index ${col.index} is empty`,
      );
      continue;
    }

    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length >= 10) {
      console.log(`Row ${rowIndex}: Found valid phone: ${cleaned.slice(-10)}`);
      return cleaned.slice(-10);
    } else {
      console.log(
        `Row ${rowIndex}: Phone value "${phone}" cleaned to "${cleaned}" - insufficient digits`,
      );
    }
  }
  return "";
};

// Extract the best email from multiple email columns
const extractBestEmail = (row, emailColumns, rowIndex) => {
  if (!emailColumns || emailColumns.length === 0 || !row) return "";

  for (const col of emailColumns) {
    if (
      col.index === undefined ||
      col.index === -1 ||
      !row ||
      row.length <= col.index
    ) {
      console.log(
        `Row ${rowIndex}: Email column index ${col.index} out of bounds (row length: ${row?.length})`,
      );
      continue;
    }

    const email = row[col.index]?.toString().trim();
    if (!email) {
      console.log(
        `Row ${rowIndex}: Email value at index ${col.index} is empty`,
      );
      continue;
    }

    if (
      email.includes("@") &&
      !email.includes("example.com") &&
      email.includes(".") &&
      email.length > 5
    ) {
      console.log(`Row ${rowIndex}: Found valid email: ${email}`);
      return email;
    } else {
      console.log(`Row ${rowIndex}: Email value "${email}" is invalid`);
    }
  }
  return "";
};

// Extract pledge amount with intelligent selection
const extractPledgeAmount = (row, pledgeAmountCol, rowIndex) => {
  if (
    pledgeAmountCol.index === -1 ||
    !row ||
    row.length <= pledgeAmountCol.index
  ) {
    if (pledgeAmountCol.index !== -1) {
      console.log(
        `Row ${rowIndex}: Pledge amount column index ${pledgeAmountCol.index} out of bounds (row length: ${row?.length})`,
      );
    }
    return null;
  }

  const value = row[pledgeAmountCol.index];
  if (value === undefined || value === null) {
    console.log(`Row ${rowIndex}: Pledge amount value is null/undefined`);
    return null;
  }

  let amount = null;

  if (typeof value === "number") {
    amount = value;
    console.log(`Row ${rowIndex}: Found pledge amount (number): ${amount}`);
  } else if (typeof value === "string") {
    const cleaned = value.replace(/[$,\s]/g, "");
    amount = parseFloat(cleaned);
    console.log(
      `Row ${rowIndex}: Found pledge amount (string): "${value}" -> cleaned: "${cleaned}" -> amount: ${amount}`,
    );
  }

  if (isNaN(amount) || amount <= 0) {
    console.log(`Row ${rowIndex}: Pledge amount invalid: ${amount}`);
    return null;
  }

  return amount;
};

// Extract historical donation amount
const extractHistoricalAmount = (row, columns, rowIndex) => {
  if (
    columns.historicalAmount?.index === -1 ||
    !row ||
    row.length <= columns.historicalAmount.index
  ) {
    if (columns.historicalAmount?.index !== -1) {
      console.log(
        `Row ${rowIndex}: Historical amount column index ${columns.historicalAmount.index} out of bounds (row length: ${row?.length})`,
      );
    }
    return null;
  }

  const value = row[columns.historicalAmount.index];
  if (value === undefined || value === null) {
    console.log(`Row ${rowIndex}: Historical amount value is null/undefined`);
    return null;
  }

  let amount = null;

  if (typeof value === "number") {
    amount = value;
    console.log(`Row ${rowIndex}: Found historical amount (number): ${amount}`);
  } else if (typeof value === "string") {
    const cleaned = value.replace(/[$,\s]/g, "");
    amount = parseFloat(cleaned);
    console.log(
      `Row ${rowIndex}: Found historical amount (string): "${value}" -> cleaned: "${cleaned}" -> amount: ${amount}`,
    );
  }

  if (isNaN(amount) || amount <= 0) {
    console.log(`Row ${rowIndex}: Historical amount invalid: ${amount}`);
    return null;
  }

  return amount;
};

// Detect county from various formats
const detectCounty = (countyValue, context = {}) => {
  if (!countyValue) return "other";

  const value = countyValue.toString().toLowerCase().trim();

  if (
    value.includes("dade") ||
    value.includes("miami-dade") ||
    value.includes("miami dade")
  ) {
    return "dade";
  }
  if (value.includes("broward")) return "broward";
  if (value.includes("palm beach")) return "palm_beach";
  if (value.includes("orange")) return "orange";
  if (value.includes("hillsborough")) return "hillsborough";
  if (value.includes("duval")) return "duval";
  if (value.includes("pinellas")) return "pinellas";
  if (value.includes("lee")) return "lee";
  if (value.includes("polk")) return "polk";
  if (value.includes("brevard")) return "brevard";
  if (value.includes("volusia")) return "volusia";
  if (value.includes("seminole")) return "seminole";
  if (value.includes("pasco")) return "pasco";
  if (value.includes("sarasota")) return "sarasota";
  if (value.includes("manatee")) return "manatee";

  if (context.zip) {
    const zip = context.zip.toString();
    if (
      zip.startsWith("331") ||
      zip.startsWith("332") ||
      zip.startsWith("330")
    ) {
      return "dade";
    }
    if (zip.startsWith("333") || zip.startsWith("334")) {
      return "broward";
    }
    if (zip.startsWith("3341") || zip.startsWith("349")) {
      return "palm_beach";
    }
  }

  return "other";
};

// Detect political party
const detectParty = (partyValue, context = {}) => {
  if (!partyValue) return "unknown";

  const value = partyValue.toString().toLowerCase().trim();

  if (value.includes("dem") || value === "d" || value.includes("democrat")) {
    return "democrat";
  }
  if (value.includes("rep") || value === "r" || value.includes("republican")) {
    return "republican";
  }
  if (value.includes("ind") || value === "i" || value.includes("independent")) {
    return "independent";
  }

  return "unknown";
};

// Extract address components with bounds checking
const extractAddress = (row, columns, rowIndex) => {
  let address = "";
  let address2 = "";
  let city = "";
  let state = "";
  let zip = "";

  if (
    columns.address.index !== -1 &&
    row &&
    row.length > columns.address.index
  ) {
    address = row[columns.address.index]?.toString().trim() || "";
    console.log(`Row ${rowIndex}: Address: "${address}"`);
  } else if (columns.address.index !== -1) {
    console.log(
      `Row ${rowIndex}: Address column index ${columns.address.index} out of bounds (row length: ${row?.length})`,
    );
  }

  if (
    columns.address2.index !== -1 &&
    row &&
    row.length > columns.address2.index
  ) {
    address2 = row[columns.address2.index]?.toString().trim() || "";
    console.log(`Row ${rowIndex}: Address2: "${address2}"`);
  } else if (columns.address2.index !== -1) {
    console.log(
      `Row ${rowIndex}: Address2 column index ${columns.address2.index} out of bounds (row length: ${row?.length})`,
    );
  }

  if (columns.city.index !== -1 && row && row.length > columns.city.index) {
    city = row[columns.city.index]?.toString().trim() || "";
    console.log(`Row ${rowIndex}: City: "${city}"`);
  } else if (columns.city.index !== -1) {
    console.log(
      `Row ${rowIndex}: City column index ${columns.city.index} out of bounds (row length: ${row?.length})`,
    );
  }

  if (columns.state.index !== -1 && row && row.length > columns.state.index) {
    state = row[columns.state.index]?.toString().trim() || "";
    console.log(`Row ${rowIndex}: State: "${state}"`);
  } else if (columns.state.index !== -1) {
    console.log(
      `Row ${rowIndex}: State column index ${columns.state.index} out of bounds (row length: ${row?.length})`,
    );
  }

  if (columns.zip.index !== -1 && row && row.length > columns.zip.index) {
    zip = row[columns.zip.index]?.toString().trim() || "";
    console.log(`Row ${rowIndex}: Zip: "${zip}"`);
  } else if (columns.zip.index !== -1) {
    console.log(
      `Row ${rowIndex}: Zip column index ${columns.zip.index} out of bounds (row length: ${row?.length})`,
    );
  }

  return { address, address2, city, state, zip };
};

// Find existing donor with flexible matching
const findExistingDonor = async (firstName, lastName, phone, email) => {
  // Try exact match on name first
  if (firstName && lastName) {
    const exactMatch = await Fundraising.findOne({
      donorFirstName: { $regex: new RegExp(`^${firstName}$`, "i") },
      donorLastName: { $regex: new RegExp(`^${lastName}$`, "i") },
    });
    if (exactMatch) return exactMatch;
  }

  // Try by phone if available (more reliable)
  if (phone && phone.length >= 10) {
    const phoneMatch = await Fundraising.findOne({
      donorPhone: { $regex: new RegExp(phone, "i") },
    });
    if (phoneMatch) return phoneMatch;
  }

  // Try by email if available
  if (email && email.includes("@")) {
    const emailMatch = await Fundraising.findOne({
      donorEmail: { $regex: new RegExp(`^${email}$`, "i") },
    });
    if (emailMatch) return emailMatch;
  }

  return null;
};

const scanBulkFile = async (req, res) => {
  console.log("=== SCAN BULK FILE CALLED ===");
  console.log("Headers:", req.headers);
  console.log("User from auth:", req.user);

  try {
    const buffer = await getRawBody(req);
    console.log("Received buffer size:", buffer?.length);

    if (!buffer || buffer.length === 0) {
      console.error("No file data received");
      return res.status(400).json({
        success: false,
        message: "No file data received",
      });
    }

    let workbook;
    try {
      workbook = XLSX.read(buffer, { type: "buffer" });
      console.log("Workbook parsed. Sheets:", workbook.SheetNames);
    } catch (e) {
      console.error("Excel parse error:", e);
      return res.status(400).json({
        success: false,
        message: "Invalid Excel/CSV file format",
      });
    }

    const fileName = req.headers["x-file-name"]
      ? decodeURIComponent(req.headers["x-file-name"])
      : "uploaded-file.xlsx";
    console.log("File name:", fileName);

    const scanResult = {
      fileName,
      totalRows: 0,
      validRows: 0,
      sheets: [],
    };

    for (const sheetName of workbook.SheetNames) {
      console.log(`\n--- Processing sheet: ${sheetName} ---`);
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      console.log(
        `Sheet ${sheetName} has ${data.length} rows (including header)`,
      );

      if (data.length < 2) {
        console.log(`Sheet ${sheetName}: No data rows found`);
        scanResult.sheets.push({
          name: sheetName,
          rowCount: 0,
          validRows: 0,
          invalidRows: 0,
          errors: ["No data rows found"],
        });
        continue;
      }

      const headers = data[0].map((h) => h?.toString().trim() || "");
      console.log(`Sheet ${sheetName} headers:`, headers);

      const columns = detectColumns(headers);
      console.log(
        `Sheet ${sheetName} detected columns:`,
        JSON.stringify(columns.detectedFormat, null, 2),
      );

      const missingInfo = [];
      const hasName =
        (columns.firstName.index !== -1 && columns.lastName.index !== -1) ||
        columns.fullName.index !== -1;

      if (!hasName) {
        missingInfo.push("Name information (first/last or full name)");
      }

      if (columns.phone.length === 0) {
        missingInfo.push("Phone number");
      }

      const sheetInfo = {
        name: sheetName,
        rowCount: data.length - 1,
        validRows: 0,
        invalidRows: 0,
        errors: [],
        detectedColumns: {
          firstName: columns.firstName,
          lastName: columns.lastName,
          fullName: columns.fullName,
          phone: columns.phone,
          email: columns.email,
          pledgeAmount: columns.pledgeAmount,
          historicalAmount: columns.historicalAmount,
          county: columns.county,
          party: columns.party,
          address: columns.address,
          city: columns.city,
          state: columns.state,
          zip: columns.zip,
          company: columns.company,
        },
        detectedFormat: columns.detectedFormat,
        categoryBreakdown: {
          under_25: 0,
          "25_to_50": 0,
          "50_to_100": 0,
          "100_to_150": 0,
          "150_to_200": 0,
          "200_to_250": 0,
          "250_to_500": 0,
          "500_to_1000": 0,
          over_1000: 0,
        },
        countyBreakdown: {},
        partyBreakdown: {
          democrat: 0,
          republican: 0,
          independent: 0,
          unknown: 0,
        },
      };

      if (missingInfo.length > 0) {
        const errorMsg = `Missing required columns: ${missingInfo.join(", ")}`;
        console.log(`Sheet ${sheetName}: ${errorMsg}`);
        sheetInfo.errors.push(errorMsg);
        sheetInfo.invalidRows = data.length - 1;
        scanResult.sheets.push(sheetInfo);
        scanResult.totalRows += data.length - 1;
        continue;
      }

      // Determine minimum required columns for validation
      const minRequiredColumns =
        Math.max(
          columns.firstName.index !== -1 ? columns.firstName.index : 0,
          columns.lastName.index !== -1 ? columns.lastName.index : 0,
          columns.fullName.index !== -1 ? columns.fullName.index : 0,
          ...columns.phone.map((p) => (p.index !== -1 ? p.index : 0)),
        ) + 1;

      console.log(
        `Sheet ${sheetName}: Minimum required columns: ${minRequiredColumns}`,
      );

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        console.log(`\nRow ${i + 1}: Raw data:`, JSON.stringify(row));

        // Better row validation
        if (!row || !Array.isArray(row) || row.length === 0) {
          console.log(`Row ${i + 1}: Empty row - skipping`);
          sheetInfo.invalidRows++;
          if (sheetInfo.errors.length < 100) {
            sheetInfo.errors.push(`Row ${i + 1}: Empty row`);
          }
          continue;
        }

        console.log(`Row ${i + 1}: Has ${row.length} columns`);

        // Check if row has enough columns
        if (row.length < minRequiredColumns) {
          console.log(
            `Row ${i + 1}: Insufficient columns - has ${row.length}, needs ${minRequiredColumns}`,
          );
          sheetInfo.invalidRows++;
          if (sheetInfo.errors.length < 100) {
            sheetInfo.errors.push(
              `Row ${i + 1}: Row has only ${row.length} columns, but at least ${minRequiredColumns} are needed`,
            );
          }
          continue;
        }

        let firstName = "";
        let lastName = "";

        // Safely access row data
        if (columns.firstName.index !== -1 && columns.lastName.index !== -1) {
          if (row.length > columns.firstName.index) {
            firstName = row[columns.firstName.index]?.toString().trim() || "";
            console.log(
              `Row ${i + 1}: First name from column ${columns.firstName.index}: "${firstName}"`,
            );
          } else {
            console.log(
              `Row ${i + 1}: First name column ${columns.firstName.index} out of bounds`,
            );
          }

          if (row.length > columns.lastName.index) {
            lastName = row[columns.lastName.index]?.toString().trim() || "";
            console.log(
              `Row ${i + 1}: Last name from column ${columns.lastName.index}: "${lastName}"`,
            );
          } else {
            console.log(
              `Row ${i + 1}: Last name column ${columns.lastName.index} out of bounds`,
            );
          }
        } else if (columns.fullName.index !== -1) {
          if (row.length > columns.fullName.index) {
            const fullName =
              row[columns.fullName.index]?.toString().trim() || "";
            console.log(
              `Row ${i + 1}: Full name from column ${columns.fullName.index}: "${fullName}"`,
            );
            if (fullName) {
              const parsed = parseFullName(fullName);
              firstName = parsed.firstName;
              lastName = parsed.lastName;
              console.log(
                `Row ${i + 1}: Parsed name - first: "${firstName}", last: "${lastName}"`,
              );
            }
          } else {
            console.log(
              `Row ${i + 1}: Full name column ${columns.fullName.index} out of bounds`,
            );
          }
        }

        // Skip rows with missing essential data
        if (!firstName && !lastName) {
          console.log(`Row ${i + 1}: Missing name information - skipping`);
          sheetInfo.invalidRows++;
          if (sheetInfo.errors.length < 100) {
            sheetInfo.errors.push(`Row ${i + 1}: Missing name information`);
          }
          continue;
        }

        const phone = extractBestPhone(row, columns.phone, i + 1);
        console.log(`Row ${i + 1}: Extracted phone: "${phone}"`);

        const pledgeAmount = extractPledgeAmount(
          row,
          columns.pledgeAmount,
          i + 1,
        );
        console.log(`Row ${i + 1}: Extracted pledge amount: ${pledgeAmount}`);

        const historicalAmount = extractHistoricalAmount(row, columns, i + 1);
        console.log(
          `Row ${i + 1}: Extracted historical amount: ${historicalAmount}`,
        );

        const email = extractBestEmail(row, columns.email, i + 1);
        console.log(`Row ${i + 1}: Extracted email: "${email}"`);

        let company = "";
        if (
          columns.company.index !== -1 &&
          row.length > columns.company.index
        ) {
          company = row[columns.company.index]?.toString().trim() || "";
          console.log(`Row ${i + 1}: Company: "${company}"`);
        }

        let county = "";
        if (columns.county.index !== -1 && row.length > columns.county.index) {
          county = row[columns.county.index]?.toString().trim() || "";
          console.log(`Row ${i + 1}: County: "${county}"`);
        }

        let party = "";
        if (columns.party.index !== -1 && row.length > columns.party.index) {
          party = row[columns.party.index]?.toString().trim() || "";
          console.log(`Row ${i + 1}: Party: "${party}"`);
        }

        const { address, city, state, zip } = extractAddress(
          row,
          columns,
          i + 1,
        );

        const detectedCounty = detectCounty(county, { zip });
        const detectedParty = detectParty(party, { county: detectedCounty });

        console.log(
          `Row ${i + 1}: Detected county: ${detectedCounty}, detected party: ${detectedParty}`,
        );

        // Determine donation category from historical amount
        const donationCategory = historicalAmount
          ? Fundraising.determineDonationCategory(historicalAmount)
          : "under_25";
        console.log(`Row ${i + 1}: Donation category: ${donationCategory}`);

        // Update breakdowns
        sheetInfo.categoryBreakdown[donationCategory] =
          (sheetInfo.categoryBreakdown[donationCategory] || 0) + 1;

        sheetInfo.countyBreakdown[detectedCounty] =
          (sheetInfo.countyBreakdown[detectedCounty] || 0) + 1;

        sheetInfo.partyBreakdown[detectedParty] =
          (sheetInfo.partyBreakdown[detectedParty] || 0) + 1;

        let rowValid = true;
        const rowErrors = [];

        if (!firstName && !lastName) {
          rowValid = false;
          rowErrors.push("Missing name");
        }
        if (!phone || phone.length < 10) {
          rowValid = false;
          rowErrors.push(
            `Missing or invalid phone number: ${phone || "empty"}`,
          );
        }

        if (rowValid) {
          sheetInfo.validRows++;
          scanResult.validRows++;
          console.log(`Row ${i + 1}: VALID`);
        } else {
          sheetInfo.invalidRows++;
          console.log(`Row ${i + 1}: INVALID - ${rowErrors.join(", ")}`);
          if (sheetInfo.errors.length < 100) {
            sheetInfo.errors.push(`Row ${i + 1}: ${rowErrors.join(", ")}`);
          } else if (sheetInfo.errors.length === 100) {
            sheetInfo.errors.push(`... and more errors (limited to 100)`);
          }
        }

        scanResult.totalRows++;
      }

      console.log(`Sheet ${sheetName} summary:`, {
        totalRows: sheetInfo.rowCount,
        validRows: sheetInfo.validRows,
        invalidRows: sheetInfo.invalidRows,
        errorCount: sheetInfo.errors.length,
      });

      scanResult.sheets.push(sheetInfo);
    }

    console.log("\n=== SCAN COMPLETE ===");
    console.log("Final scan result:", {
      fileName: scanResult.fileName,
      totalRows: scanResult.totalRows,
      validRows: scanResult.validRows,
      sheetCount: scanResult.sheets.length,
    });

    return res.json({
      success: true,
      scanResult,
    });
  } catch (error) {
    console.error("Scan error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to scan file",
    });
  }
};

const processBulkFile = async (req, res) => {
  console.log("=== PROCESS BULK FILE CALLED ===");
  console.log("Headers:", req.headers);
  console.log("User from auth:", req.user);

  // Get month/year from headers
  const importMonth = req.headers["x-import-month"]
    ? parseInt(req.headers["x-import-month"])
    : new Date().getMonth() + 1;
  const importYear = req.headers["x-import-year"]
    ? parseInt(req.headers["x-import-year"])
    : new Date().getFullYear();
  const importId = new mongoose.Types.ObjectId().toString();

  console.log(
    `Import period: Month ${importMonth}, Year ${importYear}, Import ID: ${importId}`,
  );

  try {
    const buffer = await getRawBody(req);
    console.log("Received buffer size:", buffer?.length);

    if (!buffer || buffer.length === 0) {
      console.error("No file data received");
      return res.status(400).json({
        success: false,
        message: "No file data received",
      });
    }

    let workbook;
    try {
      workbook = XLSX.read(buffer, { type: "buffer" });
      console.log("Workbook parsed. Sheets:", workbook.SheetNames);
    } catch (e) {
      console.error("Excel parse error:", e);
      return res.status(400).json({
        success: false,
        message: "Invalid Excel/CSV file format",
      });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const sendProgress = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    let totalProcessed = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    const allErrors = [];

    for (const sheetName of workbook.SheetNames) {
      console.log(`\n--- Processing sheet: ${sheetName} ---`);
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      console.log(
        `Sheet ${sheetName} has ${data.length} rows (including header)`,
      );

      if (data.length < 2) {
        console.log(`Sheet ${sheetName}: No data rows found - skipping`);
        sendProgress({
          type: "sheet_skipped",
          sheetName,
          error: "No data rows found",
        });
        continue;
      }

      const headers = data[0].map((h) => h?.toString().trim() || "");
      console.log(`Sheet ${sheetName} headers:`, headers);

      const columns = detectColumns(headers);
      console.log(
        `Sheet ${sheetName} detected columns:`,
        JSON.stringify(columns.detectedFormat, null, 2),
      );

      const hasName =
        (columns.firstName.index !== -1 && columns.lastName.index !== -1) ||
        columns.fullName.index !== -1;

      if (!hasName || columns.phone.length === 0) {
        const errorMsg = "Missing required columns (name or phone)";
        console.log(`Sheet ${sheetName}: ${errorMsg}`);
        sendProgress({
          type: "sheet_skipped",
          sheetName,
          error: errorMsg,
          detectedColumns: columns.detectedFormat,
        });
        continue;
      }

      sendProgress({
        type: "sheet_start",
        sheetName,
        totalRows: data.length - 1,
        detectedFormat: columns.detectedFormat,
      });

      let sheetProcessed = 0;
      let sheetSuccessful = 0;
      let sheetFailed = 0;
      let sheetSkipped = 0;

      // Determine minimum required columns for validation
      const minRequiredColumns =
        Math.max(
          columns.firstName.index !== -1 ? columns.firstName.index : 0,
          columns.lastName.index !== -1 ? columns.lastName.index : 0,
          columns.fullName.index !== -1 ? columns.fullName.index : 0,
          ...columns.phone.map((p) => (p.index !== -1 ? p.index : 0)),
        ) + 1;

      console.log(
        `Sheet ${sheetName}: Minimum required columns: ${minRequiredColumns}`,
      );

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        console.log(`\nRow ${i + 1}: Processing...`);

        // Better row validation
        if (!row || !Array.isArray(row) || row.length === 0) {
          console.log(`Row ${i + 1}: Empty row - skipping`);
          sheetSkipped++;
          totalSkipped++;
          allErrors.push({
            sheet: sheetName,
            row: i + 1,
            error: "Empty row",
            type: "invalid",
          });
          continue;
        }

        console.log(`Row ${i + 1}: Has ${row.length} columns`);

        // Check if row has enough columns
        if (row.length < minRequiredColumns) {
          console.log(
            `Row ${i + 1}: Insufficient columns - has ${row.length}, needs ${minRequiredColumns} - skipping`,
          );
          sheetSkipped++;
          totalSkipped++;
          allErrors.push({
            sheet: sheetName,
            row: i + 1,
            error: `Row has only ${row.length} columns, but at least ${minRequiredColumns} are needed`,
            type: "invalid",
          });
          continue;
        }

        totalProcessed++;
        sheetProcessed++;

        try {
          let firstName = "";
          let lastName = "";

          // Safely access row data
          if (columns.firstName.index !== -1 && columns.lastName.index !== -1) {
            if (row.length > columns.firstName.index) {
              firstName = row[columns.firstName.index]?.toString().trim() || "";
              console.log(`Row ${i + 1}: First name: "${firstName}"`);
            }
            if (row.length > columns.lastName.index) {
              lastName = row[columns.lastName.index]?.toString().trim() || "";
              console.log(`Row ${i + 1}: Last name: "${lastName}"`);
            }
          } else if (columns.fullName.index !== -1) {
            if (row.length > columns.fullName.index) {
              const fullName =
                row[columns.fullName.index]?.toString().trim() || "";
              console.log(`Row ${i + 1}: Full name: "${fullName}"`);
              if (fullName) {
                const parsed = parseFullName(fullName);
                firstName = parsed.firstName;
                lastName = parsed.lastName;
                console.log(
                  `Row ${i + 1}: Parsed - first: "${firstName}", last: "${lastName}"`,
                );
              }
            }
          }

          const phone = extractBestPhone(row, columns.phone, i + 1);
          console.log(`Row ${i + 1}: Phone: "${phone}"`);

          const email = extractBestEmail(row, columns.email, i + 1);
          console.log(`Row ${i + 1}: Email: "${email}"`);

          let company = "";
          if (
            columns.company.index !== -1 &&
            row.length > columns.company.index
          ) {
            company = row[columns.company.index]?.toString().trim() || "";
            console.log(`Row ${i + 1}: Company: "${company}"`);
          }

          const historicalAmount = extractHistoricalAmount(row, columns, i + 1);
          console.log(`Row ${i + 1}: Historical amount: ${historicalAmount}`);

          let county = "";
          if (
            columns.county.index !== -1 &&
            row.length > columns.county.index
          ) {
            county = row[columns.county.index]?.toString().trim() || "";
            console.log(`Row ${i + 1}: County: "${county}"`);
          }

          let party = "";
          if (columns.party.index !== -1 && row.length > columns.party.index) {
            party = row[columns.party.index]?.toString().trim() || "";
            console.log(`Row ${i + 1}: Party: "${party}"`);
          }

          const { address, city, state, zip } = extractAddress(
            row,
            columns,
            i + 1,
          );

          const detectedCounty = detectCounty(county, { zip });
          const detectedParty = detectParty(party, { county: detectedCounty });

          console.log(
            `Row ${i + 1}: Detected county: ${detectedCounty}, detected party: ${detectedParty}`,
          );

          const donationCategory = historicalAmount
            ? Fundraising.determineDonationCategory(historicalAmount)
            : "under_25";
          console.log(`Row ${i + 1}: Donation category: ${donationCategory}`);

          if (!firstName || !lastName) {
            throw new Error(
              `Missing name information (first: "${firstName}", last: "${lastName}")`,
            );
          }
          if (!phone || phone.length < 10) {
            throw new Error(
              `Missing or invalid phone number: ${phone || "empty"}`,
            );
          }

          console.log(`Row ${i + 1}: Checking for existing donor...`);
          const existingDonor = await findExistingDonor(
            firstName,
            lastName,
            phone,
            email,
          );

          if (existingDonor) {
            console.log(
              `Row ${i + 1}: Donor already exists - skipping (duplicate)`,
            );
            totalSkipped++;
            sheetSkipped++;
            allErrors.push({
              sheet: sheetName,
              row: i + 1,
              error: "Donor already exists in database",
              type: "duplicate",
              donor: {
                firstName,
                lastName,
                phone,
                email,
              },
            });
            // Continue to next row instead of throwing error
            continue;
          }

          const donorData = {
            donorFirstName: firstName,
            donorLastName: lastName,
            donorPhone: phone,
            donorEmail: email || undefined,
            donorCompany: company || undefined,
            donorAddress: address || undefined,
            donorCity: city || undefined,
            donorState: state || undefined,
            donorZip: zip || undefined,
            donorCounty: detectedCounty,
            politicalParty: detectedParty,
            historicalDonationAmount: historicalAmount || undefined,
            historicalDonationCategory: donationCategory,
            status: "new",
            fundraiserId: req.user.userId,
            fundraiserFirstName:
              req.user.name?.split(" ")[0] ||
              req.user.email?.split("@")[0] ||
              "Unknown",
            fundraiserLastName:
              req.user.name?.split(" ").slice(1).join(" ") || "",
            createdBy: req.user.userId,
            importInfo: {
              fileName: req.headers["x-file-name"]
                ? decodeURIComponent(req.headers["x-file-name"])
                : "unknown",
              importDate: new Date(),
              month: importMonth,
              year: importYear,
              sheetName: sheetName,
              importId: importId,
            },
            notes: [
              {
                content: `Bulk imported from "${sheetName}" for ${importMonth}/${importYear}${historicalAmount ? ` with historical donation of $${historicalAmount.toLocaleString()}` : ""}`,
                date: new Date(),
                createdBy: req.user.userId,
              },
            ],
          };

          console.log(
            `Row ${i + 1}: Creating donor:`,
            JSON.stringify(donorData, null, 2),
          );
          await Fundraising.create(donorData);
          console.log(`Row ${i + 1}: Donor created successfully`);

          totalSuccessful++;
          sheetSuccessful++;
        } catch (rowError) {
          totalFailed++;
          sheetFailed++;

          const errorMsg = rowError.message;
          console.error(`Row ${i + 1}: Error - ${errorMsg}`);

          allErrors.push({
            sheet: sheetName,
            row: i + 1,
            error: errorMsg,
            type: "error",
          });
        }

        if (i % 10 === 0 || i === data.length - 1) {
          console.log(
            `Progress update: Processed ${totalProcessed}/${data.length - 1} rows`,
          );
          sendProgress({
            type: "row_progress",
            sheetName,
            rowNumber: i + 1,
            processed: totalProcessed,
            sheetProcessed,
            totalSuccessful,
            sheetSuccessful,
            totalFailed,
            sheetFailed,
            totalSkipped,
            sheetSkipped,
          });
        }
      }

      console.log(`Sheet ${sheetName} complete:`, {
        processed: sheetProcessed,
        successful: sheetSuccessful,
        failed: sheetFailed,
        skipped: sheetSkipped,
      });

      sendProgress({
        type: "sheet_complete",
        sheetName,
        processed: sheetProcessed,
        successful: sheetSuccessful,
        failed: sheetFailed,
        skipped: sheetSkipped,
      });
    }

    console.log("\n=== PROCESSING COMPLETE ===");
    console.log("Final stats:", {
      processed: totalProcessed,
      successful: totalSuccessful,
      failed: totalFailed,
      skipped: totalSkipped,
      errors: allErrors.length,
    });

    await AuditLog.create({
      action: "Bulk import donors",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetType: "Fundraising",
      details: {
        processed: totalProcessed,
        successful: totalSuccessful,
        failed: totalFailed,
        skipped: totalSkipped,
        errors: allErrors.length,
        importMonth,
        importYear,
        importId,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    sendProgress({
      type: "complete",
      processed: totalProcessed,
      successful: totalSuccessful,
      failed: totalFailed,
      skipped: totalSkipped,
      errors: allErrors,
    });

    res.end();
  } catch (error) {
    console.error("Process error:", error);
    res.write(
      `data: ${JSON.stringify({
        type: "error",
        error: error.message || "Failed to process file",
      })}\n\n`,
    );
    res.end();
  }
};

module.exports = {
  scanBulkFile,
  processBulkFile,
};
