// components/dashboard/VotersData.js
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Search,
  Filter,
  Eye,
  ChevronDown,
  Users,
  FileText,
  PieChart,
  Database,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Building,
  Globe,
  ChevronLeft,
  ChevronRight,
  X,
  PhoneCall,
  Mail as MailIcon,
  Loader2,
} from "lucide-react";
import * as XLSX from "xlsx";
import Modal from "../ui/Modal";

// Florida voter extract field mapping
const VOTER_FIELDS = [
  { key: "countyCode", name: "County Code", required: true },
  { key: "voterId", name: "Voter ID", required: true },
  { key: "nameLast", name: "Last Name", required: true },
  { key: "nameSuffix", name: "Name Suffix" },
  { key: "nameFirst", name: "First Name", required: true },
  { key: "nameMiddle", name: "Name Middle" },
  { key: "requestedExemption", name: "Requested public records exemption" },
  { key: "residenceAddress1", name: "Residence Address Line 1" },
  { key: "residenceAddress2", name: "Residence Address Line 2" },
  { key: "residenceCity", name: "Residence City (USPS)" },
  { key: "residenceState", name: "Residence State" },
  { key: "residenceZip", name: "Residence Zipcode" },
  { key: "mailingAddress1", name: "Mailing Address Line 1" },
  { key: "mailingAddress2", name: "Mailing Address Line 2" },
  { key: "mailingAddress3", name: "Mailing Address Line 3" },
  { key: "mailingCity", name: "Mailing City" },
  { key: "mailingState", name: "Mailing State" },
  { key: "mailingZip", name: "Mailing Zipcode" },
  { key: "mailingCountry", name: "Mailing Country" },
  { key: "gender", name: "Gender" },
  { key: "race", name: "Race" },
  { key: "birthDate", name: "Birth Date" },
  { key: "registrationDate", name: "Registration Date" },
  { key: "partyAffiliation", name: "Party Affiliation" },
  { key: "precinct", name: "Precinct" },
  { key: "precinctGroup", name: "Precinct Group" },
  { key: "precinctSplit", name: "Precinct Split" },
  { key: "precinctSuffix", name: "Precinct Suffix" },
  { key: "voterStatus", name: "Voter Status" },
  { key: "congressionalDistrict", name: "Congressional District" },
  { key: "houseDistrict", name: "House District" },
  { key: "senateDistrict", name: "Senate District" },
  { key: "countyCommissionDistrict", name: "County Commission District" },
  { key: "schoolBoardDistrict", name: "School Board District" },
  { key: "daytimeAreaCode", name: "Daytime Area Code" },
  { key: "daytimePhoneNumber", name: "Daytime Phone Number" },
  { key: "daytimePhoneExtension", name: "Daytime Phone Extension" },
  { key: "email", name: "Email address" },
];

// Header normalization and aliases
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
  "last name": "nameLast",
  "name suffix": "nameSuffix",
  "first name": "nameFirst",
  "name middle": "nameMiddle",
  "requested public records exemption": "requestedExemption",
  "requested public records 1 exemption": "requestedExemption",
  "residence address line 1": "residenceAddress1",
  "residence address line 2": "residenceAddress2",
  "residence city usps": "residenceCity",
  "residence city": "residenceCity",
  "residence state": "residenceState",
  "residence zipcode": "residenceZip",
  "residence zip": "residenceZip",
  "mailing address line 1": "mailingAddress1",
  "mailing address line 2": "mailingAddress2",
  "mailing address line 3": "mailingAddress3",
  "mailing city": "mailingCity",
  "mailing state": "mailingState",
  "mailing zipcode": "mailingZip",
  "mailing zip": "mailingZip",
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

// County codes mapping
const COUNTY_CODES = {
  DAD: "Miami-Dade",
  ALA: "Alachua",
  BAK: "Baker",
  BAY: "Bay",
  BRA: "Bradford",
  BRE: "Brevard",
  BRO: "Broward",
  CAL: "Calhoun",
  CHA: "Charlotte",
  CIT: "Citrus",
  CLA: "Clay",
  CLL: "Collier",
  CLM: "Columbia",
  DES: "Desoto",
  DIX: "Dixie",
  DUV: "Duval",
  ESC: "Escambia",
  FLA: "Flagler",
  FRA: "Franklin",
  GAD: "Gadsden",
  GIL: "Gilchrist",
  GLA: "Glades",
  GUL: "Gulf",
  HAM: "Hamilton",
  HAR: "Hardee",
  HEN: "Hendry",
  HER: "Hernando",
  HIG: "Highlands",
  HIL: "Hillsborough",
  HOL: "Holmes",
  IND: "Indian River",
  JAC: "Jackson",
  JEF: "Jefferson",
  LAF: "Lafayette",
  LAK: "Lake",
  LEE: "Lee",
  LEO: "Leon",
  LEV: "Levy",
  LIB: "Liberty",
  MAD: "Madison",
  MAN: "Manatee",
  MRN: "Marion",
  MRT: "Martin",
  MON: "Monroe",
  NAS: "Nassau",
  OKA: "Okaloosa",
  OKE: "Okeechobee",
  ORA: "Orange",
  OSC: "Osceola",
  PAL: "Palm Beach",
  PAS: "Pasco",
  PIN: "Pinellas",
  POL: "Polk",
  PUT: "Putnam",
  SAN: "Santa Rosa",
  SAR: "Sarasota",
  SEM: "Seminole",
  STJ: "St. Johns",
  STL: "St. Lucie",
  SUM: "Sumter",
  SUW: "Suwannee",
  TAY: "Taylor",
  UNI: "Union",
  VOL: "Volusia",
  WAK: "Wakulla",
  WAL: "Walton",
  WAS: "Washington",
};

// Party codes
const PARTY_CODES = {
  DEM: "Florida Democratic Party",
  REP: "Republican Party of Florida",
  NPA: "No Party Affiliation",
  IND: "Independent Party of Florida",
  LPF: "Libertarian Party of Florida",
  GRE: "Green Party of Florida",
  CPF: "Constitution Party of Florida",
  AMF: "America First Party of Florida",
  ASP: "American Solidarity Party of Florida",
  BPP: "Boricua Party",
  CPP: "Coalition With a Purpose Party",
  CSV: "Conservative Party of Florida",
  ECO: "Ecology Party of Florida",
  FFP: "Florida Forward Party",
  JEF: "Jeffersonian Party of Florida",
  MGT: "MGTOW Party",
  PSL: "Party for Socialism and Liberation - Florida",
  RFM: "Reform Party",
};

// Race codes
const RACE_CODES = {
  1: "American Indian or Alaskan Native",
  2: "Asian Or Pacific Islander",
  3: "Black, Not Hispanic",
  4: "Hispanic",
  5: "White, Not Hispanic",
  6: "Other",
  7: "Multi-racial",
  9: "Unknown",
};

// Contact filter types
const CONTACT_FILTERS = {
  ALL: "all",
  HAS_PHONE: "hasPhone",
  HAS_EMAIL: "hasEmail",
  HAS_BOTH: "hasBoth",
};

// Export types
const EXPORT_TYPES = {
  FULL: "full",
  PHONES: "phones",
  EMAILS: "emails",
};

// Helper function for authenticated fetch
const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("auth_token");

  if (!token) {
    throw new Error("No token provided");
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
    throw new Error("Session expired. Please login again.");
  }

  return response;
};

export default function VotersData({ user }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadStats, setUploadStats] = useState({
    processed: 0,
    inserted: 0,
    errors: 0,
  });
  const [errors, setErrors] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMode, setUploadMode] = useState("append");
  const [filters, setFilters] = useState({
    county: "",
    party: "",
    status: "",
    contactFilter: CONTACT_FILTERS.ALL,
  });
  const [tempFilters, setTempFilters] = useState({ ...filters });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    byParty: {},
    byCounty: {},
    contactStats: { withPhone: 0, withEmail: 0, withBoth: 0 },
  });
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [voters, setVoters] = useState([]);
  const [loadingVoters, setLoadingVoters] = useState(false);
  const [selectedVoter, setSelectedVoter] = useState(null);
  const [showVoterDetail, setShowVoterDetail] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [exportType, setExportType] = useState(EXPORT_TYPES.FULL);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef(null);

  // Load voters whenever filters, search, or page changes
  useEffect(() => {
    loadVoters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, searchTerm, currentPage]);

  // Load stats on mount and after uploads
  useEffect(() => {
    loadStats();
  }, []);

  const loadVoters = async () => {
    setLoadingVoters(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 50,
        ...(filters.county && { county: filters.county }),
        ...(filters.party && { party: filters.party }),
        ...(filters.status && { status: filters.status }),
        ...(filters.contactFilter !== CONTACT_FILTERS.ALL && {
          contactFilter: filters.contactFilter,
        }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await authFetch(`/api/voters?${params}`);
      const data = await response.json();

      if (data.success) {
        setVoters(data.voters || []);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        console.error("Failed to load voters:", data.message);
      }
    } catch (error) {
      console.error("Error loading voters:", error);
    } finally {
      setLoadingVoters(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await authFetch("/api/voters/stats");
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const checkDatabase = async () => {
    try {
      const response = await authFetch("/api/voters/debug/count");
      const data = await response.json();
      setDebugInfo(data);
      setShowDebug(true);
    } catch (error) {
      console.error("Debug check failed:", error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setUploadStatus("ready");
    setErrors([]);
    setUploadStats({ processed: 0, inserted: 0, errors: 0 });
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadStats({ processed: 0, inserted: 0, errors: 0 });
    setErrors([]);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("mode", uploadMode);

    try {
      const token = localStorage.getItem("auth_token");

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percent);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText);
          setUploadStats({
            processed: result.processed || 0,
            inserted: result.inserted || 0,
            errors: result.errors?.length || 0,
          });
          setErrors(result.errors || []);
          setUploadStatus("completed");

          setCurrentPage(1);

          Promise.all([loadVoters(), loadStats()]).then(() => {});

          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          setSelectedFile(null);
        } else {
          setUploadStatus("failed");
          try {
            const error = JSON.parse(xhr.responseText);
            setErrors([{ error: error.message || "Upload failed" }]);
          } catch {
            setErrors([{ error: "Upload failed with status " + xhr.status }]);
          }
        }
        setUploading(false);
      });

      xhr.addEventListener("error", () => {
        setUploadStatus("failed");
        setErrors([{ error: "Network error occurred" }]);
        setUploading(false);
      });

      xhr.open("POST", "/api/voters/upload");
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("failed");
      setErrors([{ error: error.message }]);
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = VOTER_FIELDS.map((f) => f.name);
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "florida_voter_template.xlsx");
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        ...(filters.county && { county: filters.county }),
        ...(filters.party && { party: filters.party }),
        ...(filters.status && { status: filters.status }),
        ...(searchTerm && { search: searchTerm }),
      });

      let url = "";
      let fileName = "";

      switch (exportType) {
        case EXPORT_TYPES.PHONES:
          url = `/api/voters/export/phones?${params}`;
          fileName = `voters_phones_${new Date().toISOString().split("T")[0]}.csv`;
          break;
        case EXPORT_TYPES.EMAILS:
          url = `/api/voters/export/emails?${params}`;
          fileName = `voters_emails_${new Date().toISOString().split("T")[0]}.csv`;
          break;
        default:
          url = `/api/voters/export/full?${params}`;
          fileName = `voters_full_${new Date().toISOString().split("T")[0]}.csv`;
      }

      const response = await authFetch(url);
      const blob = await response.blob();

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      setShowExportModal(false);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const applyFilters = () => {
    setFilters({ ...tempFilters });
    setShowFiltersModal(false);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    const defaultFilters = {
      county: "",
      party: "",
      status: "",
      contactFilter: CONTACT_FILTERS.ALL,
    };
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
    setShowFiltersModal(false);
    setCurrentPage(1);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.county) count++;
    if (filters.party) count++;
    if (filters.status) count++;
    if (filters.contactFilter !== CONTACT_FILTERS.ALL) count++;
    if (searchTerm) count++;
    return count;
  };

  const updateSupportLevel = async (voterId, supportLevel) => {
    try {
      await authFetch(`/api/voters/${voterId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supportLevel }),
      });
      loadVoters();
    } catch (error) {
      console.error("Error updating voter:", error);
    }
  };

  const handleRefresh = () => {
    loadVoters();
    loadStats();
  };

  const getContactInfo = (voter) => {
    const hasPhone =
      voter.daytimePhoneNumber && voter.daytimePhoneNumber.trim() !== "";
    const hasEmail = voter.email && voter.email.trim() !== "";
    return { hasPhone, hasEmail };
  };

  const formatPhoneNumber = (voter) => {
    if (!voter.daytimePhoneNumber) return "No phone";
    const areaCode = voter.daytimeAreaCode || "";
    const phone = voter.daytimePhoneNumber;
    const ext = voter.daytimePhoneExtension
      ? ` ext. ${voter.daytimePhoneExtension}`
      : "";

    if (areaCode) {
      return `(${areaCode}) ${phone}${ext}`;
    }
    return `${phone}${ext}`;
  };

  const activeFilterCount = getActiveFiltersCount();

  return (
    <div className="space-y-4 md:space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold">Florida Voter Data</h3>
            <p className="text-sm text-gray-600">
              Import and manage voter registration records
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={handleRefresh}
              className="px-3 py-2 border rounded flex items-center hover:bg-gray-50 text-sm"
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={downloadTemplate}
              className="px-3 py-2 border rounded flex items-center hover:bg-gray-50 text-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Template</span>
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="px-3 py-2 border rounded flex items-center hover:bg-gray-50 text-sm"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded flex items-center hover:bg-blue-700 text-sm"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Debug Info */}
        {showDebug && debugInfo && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Database Debug Info</h4>
              <button
                onClick={() => setShowDebug(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
            <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-40">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          <div className="bg-blue-50 p-3 md:p-4 rounded">
            <p className="text-xs md:text-sm text-blue-600 font-medium">
              Total Voters
            </p>
            <p className="text-xl md:text-2xl font-bold text-blue-900">
              {stats.total?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-green-50 p-3 md:p-4 rounded">
            <p className="text-xs md:text-sm text-green-600 font-medium">
              Active
            </p>
            <p className="text-xl md:text-2xl font-bold text-green-900">
              {stats.active?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-yellow-50 p-3 md:p-4 rounded">
            <p className="text-xs md:text-sm text-yellow-600 font-medium">
              Inactive
            </p>
            <p className="text-xl md:text-2xl font-bold text-yellow-900">
              {stats.inactive?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-purple-50 p-3 md:p-4 rounded">
            <p className="text-xs md:text-sm text-purple-600 font-medium">
              With Phone
            </p>
            <p className="text-xl md:text-2xl font-bold text-purple-900">
              {stats.contactStats?.withPhone?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-indigo-50 p-3 md:p-4 rounded col-span-2 sm:col-span-1">
            <p className="text-xs md:text-sm text-indigo-600 font-medium">
              With Email
            </p>
            <p className="text-xl md:text-2xl font-bold text-indigo-900">
              {stats.contactStats?.withEmail?.toLocaleString() || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      {selectedFile && (
        <div className="bg-white shadow rounded-lg p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-blue-500 mr-2" />
              <span className="font-medium text-sm md:text-base">
                {selectedFile.name}
              </span>
              <span className="ml-2 text-xs text-gray-500">
                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <select
              value={uploadMode}
              onChange={(e) => setUploadMode(e.target.value)}
              className="border rounded px-3 py-2 text-sm w-full sm:w-auto"
              disabled={uploading}
            >
              <option value="append">Append (skip duplicates)</option>
              <option value="update">Update existing</option>
              <option value="replace">Replace all</option>
            </select>
            <button
              onClick={uploadFile}
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 text-sm w-full sm:w-auto"
            >
              {uploading ? "Uploading..." : "Start Import"}
            </button>
          </div>

          {uploading && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Uploading... {uploadProgress}%</span>
                <span>Processed: {uploadStats.processed}</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded">
                <div
                  className="bg-blue-600 h-2 rounded transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {uploadStatus === "completed" && (
            <div className="bg-green-50 p-4 rounded">
              <div className="flex items-center text-green-800">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="font-medium text-sm">
                  Import complete: {uploadStats.inserted} records imported,{" "}
                  {uploadStats.errors} errors
                </span>
              </div>
              {errors.length > 0 && (
                <div className="mt-2 max-h-40 overflow-auto">
                  {errors.slice(0, 5).map((err, i) => (
                    <div key={i} className="text-xs text-red-600 mt-1">
                      {err.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setTempFilters({ ...filters });
                setShowFiltersModal(true);
              }}
              className={`px-4 py-2 border rounded flex items-center hover:bg-gray-50 text-sm ${
                activeFilterCount > 0 ? "bg-blue-50 border-blue-300" : ""
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 border rounded flex items-center hover:bg-gray-50 text-sm"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {filters.county && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                County: {COUNTY_CODES[filters.county] || filters.county}
                <button
                  onClick={() => setFilters({ ...filters, county: "" })}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.party && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                Party:{" "}
                {PARTY_CODES[filters.party]?.substring(0, 20) || filters.party}
                <button
                  onClick={() => setFilters({ ...filters, party: "" })}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                Status: {filters.status === "ACT" ? "Active" : "Inactive"}
                <button
                  onClick={() => setFilters({ ...filters, status: "" })}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.contactFilter !== CONTACT_FILTERS.ALL && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                Contact:{" "}
                {filters.contactFilter === "hasPhone"
                  ? "Has Phone"
                  : filters.contactFilter === "hasEmail"
                    ? "Has Email"
                    : "Has Both"}
                <button
                  onClick={() =>
                    setFilters({
                      ...filters,
                      contactFilter: CONTACT_FILTERS.ALL,
                    })
                  }
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                Search: {searchTerm}
                <button
                  onClick={() => setSearchTerm("")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filters Modal */}
      <Modal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        title="Filter Voters"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              County
            </label>
            <select
              value={tempFilters.county}
              onChange={(e) =>
                setTempFilters({ ...tempFilters, county: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Counties</option>
              {Object.entries(COUNTY_CODES).map(([code, name]) => (
                <option key={code} value={code}>
                  {name} ({code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Party Affiliation
            </label>
            <select
              value={tempFilters.party}
              onChange={(e) =>
                setTempFilters({ ...tempFilters, party: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Parties</option>
              {Object.entries(PARTY_CODES).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Voter Status
            </label>
            <select
              value={tempFilters.status}
              onChange={(e) =>
                setTempFilters({ ...tempFilters, status: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="ACT">Active</option>
              <option value="INA">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Information
            </label>
            <select
              value={tempFilters.contactFilter}
              onChange={(e) =>
                setTempFilters({
                  ...tempFilters,
                  contactFilter: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={CONTACT_FILTERS.ALL}>All Records</option>
              <option value={CONTACT_FILTERS.HAS_PHONE}>
                Has Phone Number
              </option>
              <option value={CONTACT_FILTERS.HAS_EMAIL}>Has Email</option>
              <option value={CONTACT_FILTERS.HAS_BOTH}>
                Has Both Phone and Email
              </option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setShowFiltersModal(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Reset All
          </button>
          <button
            type="button"
            onClick={applyFilters}
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>
      </Modal>

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Voter Data"
        size="md"
        isSubmitting={exporting}
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Type
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="exportType"
                  value={EXPORT_TYPES.FULL}
                  checked={exportType === EXPORT_TYPES.FULL}
                  onChange={(e) => setExportType(e.target.value)}
                  className="h-4 w-4 text-blue-600"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Full Export
                  </p>
                  <p className="text-xs text-gray-500">
                    All voter data including demographics, addresses, and
                    contact info
                  </p>
                </div>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="exportType"
                  value={EXPORT_TYPES.PHONES}
                  checked={exportType === EXPORT_TYPES.PHONES}
                  onChange={(e) => setExportType(e.target.value)}
                  className="h-4 w-4 text-blue-600"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Phone Numbers Only
                  </p>
                  <p className="text-xs text-gray-500">
                    Export only names and phone numbers for calling campaigns
                  </p>
                </div>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="exportType"
                  value={EXPORT_TYPES.EMAILS}
                  checked={exportType === EXPORT_TYPES.EMAILS}
                  onChange={(e) => setExportType(e.target.value)}
                  className="h-4 w-4 text-blue-600"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Email Addresses Only
                  </p>
                  <p className="text-xs text-gray-500">
                    Export only names and email addresses for email campaigns
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Export Summary:</strong> {stats.total?.toLocaleString()}{" "}
              voters match current filters
            </p>
            {exportType === EXPORT_TYPES.PHONES && (
              <p className="text-xs text-blue-600 mt-1">
                {stats.contactStats?.withPhone?.toLocaleString()} voters with
                phone numbers
              </p>
            )}
            {exportType === EXPORT_TYPES.EMAILS && (
              <p className="text-xs text-blue-600 mt-1">
                {stats.contactStats?.withEmail?.toLocaleString()} voters with
                email addresses
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => setShowExportModal(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </button>
        </div>
      </Modal>

      {/* Voters Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Voter ID
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                  County
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                  Party
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                  Contact
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingVoters ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                  </td>
                </tr>
              ) : voters.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No voters found. Import a Florida voter extract file to get
                    started.
                  </td>
                </tr>
              ) : (
                voters.map((voter) => {
                  const { hasPhone, hasEmail } = getContactInfo(voter);
                  return (
                    <tr key={voter._id} className="hover:bg-gray-50">
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {voter.voterId}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="truncate max-w-[120px] md:max-w-none">
                          {voter.nameLast}, {voter.nameFirst}
                        </div>
                        <div className="text-xs text-gray-500 md:hidden">
                          {COUNTY_CODES[voter.countyCode] || voter.countyCode}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                        {COUNTY_CODES[voter.countyCode] || voter.countyCode}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                        <span className="truncate block max-w-[150px]">
                          {PARTY_CODES[voter.partyAffiliation]?.substring(
                            0,
                            25,
                          ) ||
                            voter.partyAffiliation ||
                            "N/A"}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            voter.voterStatus === "ACT"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {voter.voterStatus === "ACT" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <div className="flex space-x-1">
                          {hasPhone && (
                            <span
                              className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              title={formatPhoneNumber(voter)}
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              <span className="hidden md:inline">Phone</span>
                            </span>
                          )}
                          {hasEmail && (
                            <span
                              className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full"
                              title={voter.email}
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              <span className="hidden md:inline">Email</span>
                            </span>
                          )}
                          {!hasPhone && !hasEmail && (
                            <span className="text-xs text-gray-400">
                              No contact
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => {
                            setSelectedVoter(voter);
                            setShowVoterDetail(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View full details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 md:px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50 flex items-center hover:bg-gray-50 text-sm w-full sm:w-auto justify-center"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50 flex items-center hover:bg-gray-50 text-sm w-full sm:w-auto justify-center"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* Voter Detail Modal */}
      {showVoterDetail && selectedVoter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-4 md:px-6 py-4 border-b flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-semibold">Voter Details</h3>
              <button
                onClick={() => setShowVoterDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="px-4 md:px-6 py-4 space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center">
                  <User className="h-4 w-4 mr-2 text-blue-600" />
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Voter ID</p>
                    <p className="font-medium text-sm">
                      {selectedVoter.voterId}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Full Name</p>
                    <p className="font-medium text-sm">
                      {selectedVoter.nameLast}, {selectedVoter.nameFirst}{" "}
                      {selectedVoter.nameMiddle}
                      {selectedVoter.nameSuffix &&
                        ` ${selectedVoter.nameSuffix}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Gender</p>
                    <p className="text-sm">
                      {selectedVoter.gender || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Race</p>
                    <p className="text-sm">
                      {RACE_CODES[selectedVoter.race] ||
                        selectedVoter.race ||
                        "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Birth Date</p>
                    <p className="text-sm">
                      {selectedVoter.birthDate || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Registration Date</p>
                    <p className="text-sm">
                      {selectedVoter.registrationDate || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-green-600" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="font-medium text-sm">
                      {selectedVoter.daytimePhoneNumber ? (
                        <>
                          {selectedVoter.daytimeAreaCode &&
                            `(${selectedVoter.daytimeAreaCode}) `}
                          {selectedVoter.daytimePhoneNumber}
                          {selectedVoter.daytimePhoneExtension &&
                            ` ext. ${selectedVoter.daytimePhoneExtension}`}
                        </>
                      ) : (
                        "No phone number"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium text-sm break-all">
                      {selectedVoter.email || "No email"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Residence Address */}
              {(selectedVoter.residenceAddress1 ||
                selectedVoter.residenceCity) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-red-600" />
                    Residence Address
                  </h4>
                  <div className="text-sm">
                    <p>{selectedVoter.residenceAddress1}</p>
                    {selectedVoter.residenceAddress2 && (
                      <p>{selectedVoter.residenceAddress2}</p>
                    )}
                    <p>
                      {selectedVoter.residenceCity}
                      {selectedVoter.residenceState &&
                        `, ${selectedVoter.residenceState}`}
                      {selectedVoter.residenceZip &&
                        ` ${selectedVoter.residenceZip}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Mailing Address */}
              {(selectedVoter.mailingAddress1 || selectedVoter.mailingCity) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-purple-600" />
                    Mailing Address
                  </h4>
                  <div className="text-sm">
                    <p>{selectedVoter.mailingAddress1}</p>
                    {selectedVoter.mailingAddress2 && (
                      <p>{selectedVoter.mailingAddress2}</p>
                    )}
                    {selectedVoter.mailingAddress3 && (
                      <p>{selectedVoter.mailingAddress3}</p>
                    )}
                    <p>
                      {selectedVoter.mailingCity}
                      {selectedVoter.mailingState &&
                        `, ${selectedVoter.mailingState}`}
                      {selectedVoter.mailingZip &&
                        ` ${selectedVoter.mailingZip}`}
                    </p>
                    {selectedVoter.mailingCountry && (
                      <p>{selectedVoter.mailingCountry}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Political Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center">
                  <Building className="h-4 w-4 mr-2 text-yellow-600" />
                  Political Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Party</p>
                    <p className="font-medium text-sm">
                      {PARTY_CODES[selectedVoter.partyAffiliation] ||
                        selectedVoter.partyAffiliation ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="font-medium text-sm">
                      {selectedVoter.voterStatus === "ACT"
                        ? "Active"
                        : "Inactive"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Precinct</p>
                    <p className="font-medium text-sm">
                      {selectedVoter.precinct || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Support Level</p>
                    <p className="font-medium text-sm capitalize">
                      {selectedVoter.supportLevel?.replace("_", " ") ||
                        "Unknown"}
                    </p>
                  </div>
                </div>
              </div>

              {/* District Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center">
                  <Globe className="h-4 w-4 mr-2 text-indigo-600" />
                  District Information
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Congressional</p>
                    <p className="font-medium text-sm">
                      {selectedVoter.congressionalDistrict || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">House</p>
                    <p className="font-medium text-sm">
                      {selectedVoter.houseDistrict || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Senate</p>
                    <p className="font-medium text-sm">
                      {selectedVoter.senateDistrict || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">County Commission</p>
                    <p className="font-medium text-sm">
                      {selectedVoter.countyCommissionDistrict || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">School Board</p>
                    <p className="font-medium text-sm">
                      {selectedVoter.schoolBoardDistrict || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedVoter.notes && selectedVoter.notes.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-gray-600" />
                    Notes
                  </h4>
                  <div className="space-y-2">
                    {selectedVoter.notes.map((note, idx) => (
                      <div key={idx} className="bg-white p-2 rounded border">
                        <p className="text-sm">{note.text}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-600" />
                  Record Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Imported</p>
                    <p className="text-sm">
                      {selectedVoter.importedAt
                        ? new Date(
                            selectedVoter.importedAt,
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Source File</p>
                    <p className="text-sm truncate">
                      {selectedVoter.sourceFile || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 md:px-6 py-4 border-t flex justify-end sticky bottom-0 bg-white">
              <button
                onClick={() => setShowVoterDetail(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
