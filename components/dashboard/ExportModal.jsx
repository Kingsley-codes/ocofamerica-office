"use client";

import { useState, useEffect } from "react";
import {
  Download,
  X,
  Mail,
  Phone,
  Users,
  Calendar,
  MapPin,
  Filter,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Search,
  BarChart3,
  Clock,
  DollarSign,
} from "lucide-react";
import Modal from "../ui/Modal";
import { apiRequest } from "@/lib/auth";
import toast from "react-hot-toast";

const ExportModal = ({ isOpen, onClose }) => {
  const [exportType, setExportType] = useState("phones"); // phones, emails, full
  const [filters, setFilters] = useState({
    month: "",
    year: "",
    county: "all",
    party: "all",
    category: "all",
    search: "",
  });

  const [availableImports, setAvailableImports] = useState([]);
  const [availableCounties, setAvailableCounties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [summary, setSummary] = useState(null);

  const [categories] = useState([
    { value: "all", label: "All Categories" },
    { value: "under_25", label: "$1 - $25" },
    { value: "25_to_50", label: "$25 - $50" },
    { value: "50_to_100", label: "$50 - $100" },
    { value: "100_to_150", label: "$100 - $150" },
    { value: "150_to_200", label: "$150 - $200" },
    { value: "200_to_250", label: "$200 - $250" },
    { value: "250_to_500", label: "$250 - $500" },
    { value: "500_to_1000", label: "$500 - $1000" },
    { value: "over_1000", label: "Over $1000" },
  ]);

  const [parties] = useState([
    { value: "all", label: "All Parties" },
    { value: "democrat", label: "Democrat" },
    { value: "republican", label: "Republican" },
    { value: "independent", label: "Independent" },
    { value: "unknown", label: "Unknown" },
  ]);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAvailableImports();
      loadAvailableCounties();
      loadExportSummary();
    }
  }, [isOpen]);

  const loadAvailableImports = async () => {
    setLoading(true);
    try {
      const response = await apiRequest("/fundraising/exports/available");
      if (response.success) {
        setAvailableImports(response.imports);
      }
    } catch (error) {
      console.error("Failed to load imports:", error);
      toast.error("Failed to load available imports");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableCounties = async () => {
    try {
      const response = await apiRequest("/fundraising/exports/counties");
      if (response.success) {
        setAvailableCounties(response.counties);
      }
    } catch (error) {
      console.error("Failed to load counties:", error);
    }
  };

  const loadExportSummary = async () => {
    try {
      const response = await apiRequest("/fundraising/exports/summary");
      if (response.success) {
        setSummary(response.summary);
      }
    } catch (error) {
      console.error("Failed to load export summary:", error);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    const toastId = toast.loading(
      `Preparing ${getExportTypeLabel()} export...`,
    );

    try {
      // Build query string
      const params = new URLSearchParams();
      if (filters.month) params.append("month", filters.month);
      if (filters.year) params.append("year", filters.year);
      if (filters.county && filters.county !== "all")
        params.append("county", filters.county);
      if (filters.party && filters.party !== "all")
        params.append("party", filters.party);
      if (filters.category && filters.category !== "all")
        params.append("category", filters.category);
      if (filters.search) params.append("search", filters.search);

      const response = await fetch(
        `/api/fundraising/export/${exportType}?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get filename from Content-Disposition header or create one
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${exportType}_export.csv`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(
        <div className="flex items-center">
          <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
          <span>Export completed successfully!</span>
        </div>,
        { id: toastId },
      );

      onClose();
    } catch (error) {
      console.error("Export error:", error);
      toast.error(error.message || "Failed to export data", { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  const getExportTypeLabel = () => {
    switch (exportType) {
      case "phones":
        return "phone numbers";
      case "emails":
        return "email addresses";
      case "full":
        return "full donor records";
      default:
        return "data";
    }
  };

  const getExportIcon = () => {
    switch (exportType) {
      case "phones":
        return <Phone className="h-5 w-5" />;
      case "emails":
        return <Mail className="h-5 w-5" />;
      case "full":
        return <Users className="h-5 w-5" />;
      default:
        return <Download className="h-5 w-5" />;
    }
  };

  const getExportDescription = () => {
    switch (exportType) {
      case "phones":
        return "Export phone numbers for cold calling or SMS campaigns";
      case "emails":
        return "Export email addresses for email marketing campaigns";
      case "full":
        return "Export complete donor records with all available data";
      default:
        return "";
    }
  };

  const getEstimatedCount = () => {
    // This would ideally come from an API call that returns count based on filters
    return null;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Donors" size="2xl">
      <div className="space-y-6">
        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <Users className="h-4 w-4 text-blue-600 mx-auto mb-1" />
              <div className="text-xs text-gray-600">Total</div>
              <div className="text-lg font-bold text-blue-700">
                {summary.totalDonors}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <Phone className="h-4 w-4 text-green-600 mx-auto mb-1" />
              <div className="text-xs text-gray-600">With Phone</div>
              <div className="text-lg font-bold text-green-700">
                {summary.totalWithPhone}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <Mail className="h-4 w-4 text-purple-600 mx-auto mb-1" />
              <div className="text-xs text-gray-600">With Email</div>
              <div className="text-lg font-bold text-purple-700">
                {summary.totalWithEmail}
              </div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <DollarSign className="h-4 w-4 text-amber-600 mx-auto mb-1" />
              <div className="text-xs text-gray-600">Pledged</div>
              <div className="text-lg font-bold text-amber-700">
                ${summary.totalPledged?.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Export Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Export Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setExportType("phones")}
              className={`p-4 rounded-xl border-2 transition-all ${
                exportType === "phones"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
              }`}
            >
              <div
                className={`p-2 rounded-lg mx-auto w-fit mb-2 ${
                  exportType === "phones" ? "bg-blue-500" : "bg-gray-100"
                }`}
              >
                <Phone
                  className={`h-5 w-5 ${
                    exportType === "phones" ? "text-white" : "text-gray-600"
                  }`}
                />
              </div>
              <div className="text-sm font-medium">Phone Numbers</div>
              <div className="text-xs text-gray-500 mt-1">Cold calling</div>
            </button>

            <button
              onClick={() => setExportType("emails")}
              className={`p-4 rounded-xl border-2 transition-all ${
                exportType === "emails"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
              }`}
            >
              <div
                className={`p-2 rounded-lg mx-auto w-fit mb-2 ${
                  exportType === "emails" ? "bg-blue-500" : "bg-gray-100"
                }`}
              >
                <Mail
                  className={`h-5 w-5 ${
                    exportType === "emails" ? "text-white" : "text-gray-600"
                  }`}
                />
              </div>
              <div className="text-sm font-medium">Email Addresses</div>
              <div className="text-xs text-gray-500 mt-1">Email campaigns</div>
            </button>

            <button
              onClick={() => setExportType("full")}
              className={`p-4 rounded-xl border-2 transition-all ${
                exportType === "full"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
              }`}
            >
              <div
                className={`p-2 rounded-lg mx-auto w-fit mb-2 ${
                  exportType === "full" ? "bg-blue-500" : "bg-gray-100"
                }`}
              >
                <Users
                  className={`h-5 w-5 ${
                    exportType === "full" ? "text-white" : "text-gray-600"
                  }`}
                />
              </div>
              <div className="text-sm font-medium">Full Records</div>
              <div className="text-xs text-gray-500 mt-1">Complete data</div>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">{getExportDescription()}</p>
        </div>

        {/* Filters */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filter Options
          </h4>

          <div className="grid grid-cols-2 gap-4">
            {/* Search Filter */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                <Search className="h-3 w-3 inline mr-1" />
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                placeholder="Search by name, company, email, or phone..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            {/* Month/Year Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                <Calendar className="h-3 w-3 inline mr-1" />
                Import Period
              </label>
              <select
                value={filters.month ? `${filters.year}-${filters.month}` : ""}
                onChange={(e) => {
                  const [year, month] = e.target.value.split("-");
                  setFilters((prev) => ({
                    ...prev,
                    year: year || "",
                    month: month || "",
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Periods</option>
                {availableImports.map((imp) => (
                  <option
                    key={`${imp.year}-${imp.month}`}
                    value={`${imp.year}-${imp.month}`}
                  >
                    {imp.label} ({imp.count} donors)
                  </option>
                ))}
              </select>
            </div>

            {/* County Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                <MapPin className="h-3 w-3 inline mr-1" />
                County
              </label>
              <select
                value={filters.county}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, county: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Counties</option>
                {availableCounties.map((county) => (
                  <option key={county.value} value={county.value}>
                    {county.label} ({county.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Party Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Party Affiliation
              </label>
              <select
                value={filters.party}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, party: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {parties.map((party) => (
                  <option key={party.value} value={party.value}>
                    {party.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Donation Category
              </label>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, category: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Recent Months Quick Filters */}
          {summary?.recentMonths && summary.recentMonths.length > 0 && (
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-500 mb-2">
                <Clock className="h-3 w-3 inline mr-1" />
                Recent Months
              </label>
              <div className="flex flex-wrap gap-2">
                {summary.recentMonths.map((month) => (
                  <button
                    key={`${month.year}-${month.month}`}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        month: month.month.toString(),
                        year: month.year.toString(),
                      }))
                    }
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    {month.label} ({month.count})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Export Info */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start">
            <FileSpreadsheet className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h5 className="text-sm font-medium text-blue-900">
                Export Format
              </h5>
              <p className="text-xs text-blue-700 mt-1">
                All exports are in CSV format, compatible with Excel, Google
                Sheets, and most CRM systems.
              </p>
              {exportType === "phones" && (
                <p className="text-xs text-blue-700 mt-2">
                  Perfect for batch uploads to phone banking systems or SMS
                  platforms.
                </p>
              )}
              {exportType === "emails" && (
                <p className="text-xs text-blue-700 mt-2">
                  Ideal for email marketing campaigns (Mailchimp, Constant
                  Contact, etc.)
                </p>
              )}
              {exportType === "full" && (
                <p className="text-xs text-blue-700 mt-2">
                  Complete donor profiles including contact status, pledge
                  history, and import information.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={exporting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || loading}
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 border border-transparent rounded-xl text-sm font-medium text-white hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 inline-flex items-center shadow-lg shadow-green-200 disabled:opacity-50"
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export{" "}
                {exportType === "phones"
                  ? "Phones"
                  : exportType === "emails"
                    ? "Emails"
                    : "All Data"}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExportModal;
