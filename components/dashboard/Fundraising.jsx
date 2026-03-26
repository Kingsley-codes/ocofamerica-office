"use client";

import { useState, useEffect, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  DollarSign,
  Plus,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  Search,
  User,
  Users,
  TrendingUp,
  Eye,
  MapPin,
  Building,
  CreditCard,
  Clock,
  MessageCircle,
  Upload,
  RefreshCw,
  AlertCircle,
  X,
} from "lucide-react";
import { apiRequest } from "@/lib/auth";
import Modal from "../ui/Modal";
import { toast } from "react-hot-toast";
import BulkUploadModal from "./BulkUploadModal";
import ExportModal from "./ExportModal";

const Fundraising = ({ user: currentUser }) => {
  const [donors, setDonors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPledgeModal, setShowPledgeModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [categories, setCategories] = useState([]);
  const [suggestedAsk, setSuggestedAsk] = useState(null);
  const [availableImports, setAvailableImports] = useState([]);
  const [availableCounties, setAvailableCounties] = useState([]);
  const [availableFundraisers, setAvailableFundraisers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  // Stats
  const [stats, setStats] = useState({
    totalDonors: 0,
    totalPledged: 0,
    totalReceived: 0,
    activeFundraisers: 0,
    conversionRate: 0,
    categoryBreakdown: {},
    countyBreakdown: {},
    partyBreakdown: {},
  });

  // Filters
  const [filters, setFilters] = useState({
    status: "all",
    fundraiser: "all",
    county: "all",
    party: "all",
    donationCategory: "all",
    search: "",
    minPledge: "",
    maxPledge: "",
    importMonth: "",
    importYear: "",
  });

  // Temporary filters for modal
  const [tempFilters, setTempFilters] = useState({ ...filters });
  const [selectedImportDate, setSelectedImportDate] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    donorFirstName: "",
    donorLastName: "",
    donorCompany: "",
    donorEmail: "",
    donorPhone: "",
    donorAddress: "",
    donorCity: "",
    donorState: "",
    donorZip: "",
    donorCounty: "other",
    politicalParty: "unknown",
    historicalDonationAmount: "",
  });

  const [contactForm, setContactForm] = useState({
    method: "phone",
    status: "contacted",
    notes: "",
  });

  const [pledgeForm, setPledgeForm] = useState({
    amount: "",
    type: "pledge",
    notes: "",
  });

  const [recurringForm, setRecurringForm] = useState({
    amount: "",
    frequency: "monthly",
    notes: "",
  });

  const [noteForm, setNoteForm] = useState({
    content: "",
  });

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const categoriesList = [
    { value: "all", label: "All Amounts" },
    { value: "under_25", label: "Under $25" },
    { value: "25_to_50", label: "$25 - $50" },
    { value: "50_to_100", label: "$50 - $100" },
    { value: "100_to_150", label: "$100 - $150" },
    { value: "150_to_200", label: "$150 - $200" },
    { value: "200_to_250", label: "$200 - $250" },
    { value: "250_to_500", label: "$250 - $500" },
    { value: "500_to_1000", label: "$500 - $1000" },
    { value: "over_1000", label: "Over $1000" },
  ];

  const parties = [
    { value: "all", label: "All Parties" },
    { value: "democrat", label: "Democrat" },
    { value: "republican", label: "Republican" },
    { value: "independent", label: "Independent" },
    { value: "unknown", label: "Unknown" },
  ];

  const statuses = [
    { value: "all", label: "All Status" },
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "pledged", label: "Pledged" },
    { value: "fulfilled", label: "Fulfilled" },
    { value: "not_interested", label: "Not Interested" },
    { value: "unreachable", label: "Unreachable" },
  ];

  // Check if user has fundraising access
  const hasFundraisingAccess = () => {
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
    return allowedRoles.includes(currentUser?.role);
  };

  // Load available imports
  const loadAvailableImports = async () => {
    try {
      const response = await apiRequest("/fundraising/exports/available");
      if (response.success) {
        setAvailableImports(response.imports);
      }
    } catch (error) {
      console.error("Failed to load imports:", error);
    }
  };

  // Load available counties
  const loadAvailableCounties = async () => {
    try {
      const response = await apiRequest("/fundraising/counties");
      if (response.success) {
        setAvailableCounties(response.counties);
      }
    } catch (error) {
      console.error("Failed to load counties:", error);
    }
  };

  // Fetch donors
  const fetchDonors = useCallback(
    async (page = 1) => {
      if (!hasFundraisingAccess()) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: "20",
        });

        // Add filters to query params
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== "all" && value !== "") {
            queryParams.append(key, value);
          }
        });

        const response = await apiRequest(`/fundraising?${queryParams}`);

        if (response.success) {
          setDonors(response.donors);
          setPagination(response.pagination);
          setStats(response.stats);
        }
      } catch (error) {
        console.error("Error fetching donors:", error);
        toast.error("Failed to load donors");
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, currentUser],
  );

  // Initial load
  useEffect(() => {
    fetchDonors();
    loadAvailableImports();
    loadAvailableCounties();
  }, [fetchDonors]);

  // Open filters modal
  const openFiltersModal = () => {
    setTempFilters({ ...filters });
    // Set date picker value if month/year exist
    if (filters.importMonth && filters.importYear) {
      setSelectedImportDate(
        new Date(filters.importYear, filters.importMonth - 1),
      );
    } else {
      setSelectedImportDate(null);
    }
    setShowFiltersModal(true);
  };

  // Apply filters
  const applyFilters = () => {
    setFilters({ ...tempFilters });
    setShowFiltersModal(false);
    fetchDonors(1);
  };

  // Handle date picker change
  const handleDateChange = (date) => {
    setSelectedImportDate(date);
    if (date) {
      setTempFilters({
        ...tempFilters,
        importMonth: (date.getMonth() + 1).toString(),
        importYear: date.getFullYear().toString(),
      });
    } else {
      setTempFilters({
        ...tempFilters,
        importMonth: "",
        importYear: "",
      });
    }
  };

  // Reset filters
  const resetFilters = () => {
    const defaultFilters = {
      status: "all",
      fundraiser: "all",
      county: "all",
      party: "all",
      donationCategory: "all",
      search: "",
      minPledge: "",
      maxPledge: "",
      importMonth: "",
      importYear: "",
    };
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
    setSelectedImportDate(null);
    setShowFiltersModal(false);
    fetchDonors(1);
  };

  // Clear a single filter
  const clearFilter = (filterName) => {
    const newFilters = { ...filters };
    if (filterName === "importPeriod") {
      newFilters.importMonth = "";
      newFilters.importYear = "";
    } else {
      newFilters[filterName] = filterName === "search" ? "" : "all";
    }
    setFilters(newFilters);
    fetchDonors(1);
  };

  // Get active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status !== "all") count++;
    if (filters.county !== "all") count++;
    if (filters.party !== "all") count++;
    if (filters.donationCategory !== "all") count++;
    if (filters.fundraiser !== "all") count++;
    if (filters.importMonth && filters.importYear) count++;
    if (filters.search) count++;
    if (filters.minPledge) count++;
    if (filters.maxPledge) count++;
    return count;
  };

  // Get display label for filter value
  const getFilterDisplay = (filterName, value) => {
    if (!value || value === "all") return null;

    switch (filterName) {
      case "status":
        return statuses.find((s) => s.value === value)?.label;
      case "county":
        return availableCounties.find((c) => c.value === value)?.label || value;
      case "party":
        return parties.find((p) => p.value === value)?.label;
      case "donationCategory":
        return categoriesList.find((c) => c.value === value)?.label;
      case "fundraiser":
        if (value === "me") return "Assigned to Me";
        if (value === "unassigned") return "Unassigned";
        return (
          availableFundraisers.find((f) => f._id === value)?.firstName +
            " " +
            availableFundraisers.find((f) => f._id === value)?.lastName ||
          "Assigned"
        );
      case "importPeriod":
        const month = months.find(
          (m) => m.value === parseInt(filters.importMonth),
        )?.label;
        return `${month} ${filters.importYear}`;
      case "minPledge":
        return `Min: $${value}`;
      case "maxPledge":
        return `Max: $${value}`;
      default:
        return value;
    }
  };

  // Get suggested ask for donor
  const getSuggestedAsk = async (donorId) => {
    try {
      const response = await apiRequest(
        `/fundraising/${donorId}/suggested-ask`,
      );
      if (response.success) {
        setSuggestedAsk(response);
        toast.success(`Suggested ask: $${response.suggestedAmount}`);
      }
    } catch (error) {
      console.error("Error getting suggested ask:", error);
    }
  };

  // Handle adding donor
  const handleAddDonor = async (e) => {
    e.preventDefault();
    try {
      const response = await apiRequest("/fundraising", {
        method: "POST",
        body: formData,
      });

      if (response.success) {
        setShowAddModal(false);
        setFormData({
          donorFirstName: "",
          donorLastName: "",
          donorCompany: "",
          donorEmail: "",
          donorPhone: "",
          donorAddress: "",
          donorCity: "",
          donorState: "",
          donorZip: "",
          donorCounty: "other",
          politicalParty: "unknown",
          historicalDonationAmount: "",
        });
        fetchDonors();
        toast.success("Donor added successfully!");

        if (currentUser.role !== "admin") {
          await apiRequest("/fundraising/notify-admin", {
            method: "POST",
            body: {
              donorName: `${formData.donorFirstName}`,
              fundraiserName: currentUser.name,
            },
          });
        }
      }
    } catch (error) {
      console.error("Error adding donor:", error);
      toast.error(error.message || "Failed to add donor");
    }
  };

  // Handle adding contact attempt
  const handleAddContact = async (e) => {
    e.preventDefault();
    try {
      const response = await apiRequest(
        `/fundraising/${selectedDonor._id}/contact`,
        {
          method: "POST",
          body: contactForm,
        },
      );

      if (response.success) {
        setShowContactModal(false);
        setContactForm({
          method: "phone",
          status: "contacted",
          notes: "",
        });
        fetchDonors();
        toast.success("Contact attempt recorded");
      }
    } catch (error) {
      toast.error(error.message || "Failed to record contact");
    }
  };

  // Handle adding pledge
  const handleAddPledge = async (e) => {
    e.preventDefault();
    try {
      const response = await apiRequest(
        `/fundraising/${selectedDonor._id}/pledge`,
        {
          method: "POST",
          body: pledgeForm,
        },
      );

      if (response.success) {
        setShowPledgeModal(false);
        setPledgeForm({
          amount: "",
          type: "pledge",
          notes: "",
        });
        fetchDonors();
        toast.success("Pledge recorded!");

        await apiRequest("/fundraising/notify-pledge", {
          method: "POST",
          body: {
            donorId: selectedDonor._id,
            donorName: `${selectedDonor.donorFirstName}`,
            amount: pledgeForm.amount,
            fundraiserName: currentUser.name,
          },
        });
      }
    } catch (error) {
      toast.error(error.message || "Failed to record pledge");
    }
  };

  // Handle setting up recurring donation
  const handleSetRecurring = async (e) => {
    e.preventDefault();
    try {
      const response = await apiRequest(
        `/fundraising/${selectedDonor._id}/recurring`,
        {
          method: "POST",
          body: recurringForm,
        },
      );

      if (response.success) {
        setShowRecurringModal(false);
        setRecurringForm({
          amount: "",
          frequency: "monthly",
          notes: "",
        });
        fetchDonors();
        toast.success("Recurring donation set up!");
      }
    } catch (error) {
      toast.error(error.message || "Failed to set up recurring donation");
    }
  };

  // Handle adding note
  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      const response = await apiRequest(
        `/fundraising/${selectedDonor._id}/note`,
        {
          method: "POST",
          body: noteForm,
        },
      );

      if (response.success) {
        setShowNotesModal(false);
        setNoteForm({ content: "" });
        fetchDonors();
        toast.success("Note added");
      }
    } catch (error) {
      toast.error(error.message || "Failed to add note");
    }
  };

  // Handle marking pledge as received
  const handleMarkReceived = async (donorId, amount) => {
    try {
      const response = await apiRequest(`/fundraising/${donorId}/received`, {
        method: "POST",
        body: { amount, type: "gave" },
      });

      if (response.success) {
        fetchDonors();
        toast.success("Pledge marked as received!");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update pledge");
    }
  };

  // Handle viewing donor details
  const handleViewDetails = (donor) => {
    setSelectedDonor(donor);
    setShowDetailsModal(true);
    getSuggestedAsk(donor._id);
  };

  // Render status badge
  const renderStatusBadge = (status) => {
    const colors = {
      new: "bg-blue-100 text-blue-800",
      contacted: "bg-yellow-100 text-yellow-800",
      pledged: "bg-purple-100 text-purple-800",
      fulfilled: "bg-green-100 text-green-800",
      not_interested: "bg-red-100 text-red-800",
      unreachable: "bg-gray-100 text-gray-800",
    };

    const labels = {
      new: "New",
      contacted: "Contacted",
      pledged: "Pledged",
      fulfilled: "Fulfilled",
      not_interested: "Not Interested",
      unreachable: "Unreachable",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || "bg-gray-100 text-gray-800"}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  // Render contact status
  const renderContactStatus = (status) => {
    if (!status || status === "not_contacted") {
      return <span className="text-gray-400">Not contacted</span>;
    }

    if (status === "active") {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }

    if (
      status === "blocked" ||
      status === "disconnected" ||
      status === "wrong_number"
    ) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }

    return <span className="text-yellow-500">Issues</span>;
  };

  // Render donor actions
  const renderDonorActions = (donor) => (
    <div className="flex space-x-2">
      <button
        onClick={() => handleViewDetails(donor)}
        className="text-blue-600 hover:text-blue-900"
        title="View Details"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        onClick={() => {
          setSelectedDonor(donor);
          setShowContactModal(true);
        }}
        className="text-green-600 hover:text-green-900"
        title="Add contact attempt"
      >
        <Phone className="h-4 w-4" />
      </button>
      {!donor.pledgeAmount && (
        <button
          onClick={() => {
            setSelectedDonor(donor);
            setShowPledgeModal(true);
          }}
          className="text-purple-600 hover:text-purple-900"
          title="Add pledge"
        >
          <DollarSign className="h-4 w-4" />
        </button>
      )}
      <button
        onClick={() => {
          setSelectedDonor(donor);
          setShowRecurringModal(true);
        }}
        className="text-indigo-600 hover:text-indigo-900"
        title="Set up recurring"
      >
        <RefreshCw className="h-4 w-4" />
      </button>
      <button
        onClick={() => {
          setSelectedDonor(donor);
          setShowNotesModal(true);
        }}
        className="text-gray-600 hover:text-gray-900"
        title="Add note"
      >
        <FileText className="h-4 w-4" />
      </button>
      {donor.pledgeAmount && !donor.isPledgeFulfilled && (
        <button
          onClick={() => {
            if (
              window.confirm(
                `Mark pledge of $${donor.pledgeAmount} as received?`,
              )
            ) {
              handleMarkReceived(donor._id, donor.pledgeAmount);
            }
          }}
          className="text-green-600 hover:text-green-900"
          title="Mark pledge as received"
        >
          <CheckCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  if (!hasFundraisingAccess()) {
    return (
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">
              Access Restricted
            </h3>
            <p className="text-gray-600 mt-2">
              Fundraising access is restricted to administrators, fundraisers,
              and management staff.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Your role: {currentUser?.role}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeFilterCount = getActiveFiltersCount();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Fundraising</h3>
          <p className="text-sm text-gray-600">Donor Management & Tracking</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowBulkUploadModal(true)}
            className="btn-secondary inline-flex items-center"
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="btn-secondary inline-flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Donor
          </button>
        </div>
      </div>

      {/* Stats Cards - Keep existing */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Stats cards remain the same */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Donors</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalDonors}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="bg-purple-100 p-2 rounded-lg mr-3">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pledged</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.totalPledged?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-lg mr-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Received</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.totalReceived?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-2 rounded-lg mr-3">
              <User className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Fundraisers</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.activeFundraisers}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="bg-indigo-100 p-2 rounded-lg mr-3">
              <FileText className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.conversionRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value });
                  fetchDonors(1);
                }}
                placeholder="Search donors by name, company, email, or phone..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Filter Button */}
          <div className="flex gap-2">
            <button
              onClick={openFiltersModal}
              className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                activeFilterCount > 0
                  ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <X className="h-4 w-4 mr-2" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {filters.status !== "all" && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                Status: {getFilterDisplay("status", filters.status)}
                <button
                  onClick={() => clearFilter("status")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.county !== "all" && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                County: {getFilterDisplay("county", filters.county)}
                <button
                  onClick={() => clearFilter("county")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.party !== "all" && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                Party: {getFilterDisplay("party", filters.party)}
                <button
                  onClick={() => clearFilter("party")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.donationCategory !== "all" && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                Category:{" "}
                {getFilterDisplay("donationCategory", filters.donationCategory)}
                <button
                  onClick={() => clearFilter("donationCategory")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.fundraiser !== "all" && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                Fundraiser: {getFilterDisplay("fundraiser", filters.fundraiser)}
                <button
                  onClick={() => clearFilter("fundraiser")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.importMonth && filters.importYear && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                Import Period: {getFilterDisplay("importPeriod", null)}
                <button
                  onClick={() => clearFilter("importPeriod")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.minPledge && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                Min: ${filters.minPledge}
                <button
                  onClick={() => clearFilter("minPledge")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.maxPledge && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                Max: ${filters.maxPledge}
                <button
                  onClick={() => clearFilter("maxPledge")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                Search: {filters.search}
                <button
                  onClick={() => clearFilter("search")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filters Modal with Date Picker */}
      <Modal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        title="Filter Donors"
        size="lg"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={tempFilters.status}
              onChange={(e) =>
                setTempFilters({ ...tempFilters, status: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* County Filter - Now with proper list */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4 inline mr-1" />
              County
            </label>
            <select
              value={tempFilters.county}
              onChange={(e) =>
                setTempFilters({ ...tempFilters, county: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Counties</option>
              {availableCounties.map((county) => (
                <option key={county.value} value={county.value}>
                  {county.label} ({county.count} donors)
                </option>
              ))}
            </select>
          </div>

          {/* Party Filter */}
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
              {parties.map((party) => (
                <option key={party.value} value={party.value}>
                  {party.label}
                </option>
              ))}
            </select>
          </div>

          {/* Donation Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Donation Category
            </label>
            <select
              value={tempFilters.donationCategory}
              onChange={(e) =>
                setTempFilters({
                  ...tempFilters,
                  donationCategory: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {categoriesList.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Fundraiser Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-1" />
              Fundraiser
            </label>
            <select
              value={tempFilters.fundraiser}
              onChange={(e) =>
                setTempFilters({ ...tempFilters, fundraiser: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Fundraisers</option>
              <option value="me">Assigned to Me</option>
              <option value="unassigned">Unassigned</option>
              {availableFundraisers.map((fundraiser) => (
                <option key={fundraiser._id} value={fundraiser._id}>
                  {fundraiser.firstName} {fundraiser.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Import Period Filter with Date Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Import Period
            </label>
            <div className="space-y-2">
              <DatePicker
                selected={selectedImportDate}
                onChange={handleDateChange}
                dateFormat="MMMM yyyy"
                showMonthYearPicker
                placeholderText="Select month and year"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                isClearable
              />
              <p className="text-xs text-gray-500">
                Select a month and year to filter donors imported during that
                period
              </p>
            </div>
          </div>

          {/* Pledge Amount Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="h-4 w-4 inline mr-1" />
              Pledge Amount Range
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                min="0"
                step="0.01"
                value={tempFilters.minPledge}
                onChange={(e) =>
                  setTempFilters({ ...tempFilters, minPledge: e.target.value })
                }
                placeholder="Min Amount"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={tempFilters.maxPledge}
                onChange={(e) =>
                  setTempFilters({ ...tempFilters, maxPledge: e.target.value })
                }
                placeholder="Max Amount"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
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
            onClick={resetFilters}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Reset All
          </button>
          <button
            type="button"
            onClick={applyFilters}
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Apply Filters
          </button>
        </div>
      </Modal>

      {/* Donors Table - Keep existing */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Donor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pledge
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {donors.map((donor) => (
                <tr key={donor._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {donor.donorFirstName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {donor.donorCompany}
                      </div>
                      <div className="text-xs text-gray-400">
                        {donor.donorPhone} • {donor.donorEmail}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-4">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-1 text-gray-400" />
                        {renderContactStatus(donor.phoneStatus)}
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-1 text-gray-400" />
                        {renderContactStatus(donor.emailStatus)}
                      </div>
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1 text-gray-400" />
                        {renderContactStatus(donor.textStatus)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {donor.pledgeAmount ? (
                      <div>
                        <div className="font-bold text-gray-900">
                          ${donor.pledgeAmount?.toLocaleString()}
                        </div>
                        <div className="text-xs">
                          {donor.isRecurring && (
                            <span className="text-purple-600 mr-1">
                              Recurring
                            </span>
                          )}
                          {donor.isPledgeFulfilled ? (
                            <span className="text-green-600">Received</span>
                          ) : (
                            <span className="text-yellow-600">Pending</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">No pledge</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {renderStatusBadge(donor.status)}
                  </td>
                  <td className="px-6 py-4">{renderDonorActions(donor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {donors.length} of {pagination.total} donors
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchDonors(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => fetchDonors(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Donor Modal - Keep existing */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Donor"
        size="lg"
      >
        <form onSubmit={handleAddDonor}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.donorFirstName}
                  onChange={(e) =>
                    setFormData({ ...formData, donorFirstName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.donorLastName}
                  onChange={(e) =>
                    setFormData({ ...formData, donorLastName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={formData.donorCompany}
                onChange={(e) =>
                  setFormData({ ...formData, donorCompany: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.donorEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, donorEmail: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telephone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.donorPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, donorPhone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                value={formData.donorAddress}
                onChange={(e) =>
                  setFormData({ ...formData, donorAddress: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Street Address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.donorCity}
                  onChange={(e) =>
                    setFormData({ ...formData, donorCity: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  value={formData.donorState}
                  onChange={(e) =>
                    setFormData({ ...formData, donorState: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={formData.donorZip}
                  onChange={(e) =>
                    setFormData({ ...formData, donorZip: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  County
                </label>
                <select
                  value={formData.donorCounty}
                  onChange={(e) =>
                    setFormData({ ...formData, donorCounty: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {availableCounties.map((county) => (
                    <option key={county.value} value={county.value}>
                      {county.label}
                    </option>
                  ))}
                  <option value="other">Other County</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Political Party
                </label>
                <select
                  value={formData.politicalParty}
                  onChange={(e) =>
                    setFormData({ ...formData, politicalParty: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="unknown">Unknown</option>
                  <option value="democrat">Democrat</option>
                  <option value="republican">Republican</option>
                  <option value="independent">Independent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Historical Donation Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.historicalDonationAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      historicalDonationAmount: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="$0.00"
                />
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add Donor
            </button>
          </div>
        </form>
      </Modal>

      {/* Contact Attempt Modal - Keep existing */}
      <Modal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        title="Add Contact Attempt"
      >
        <form onSubmit={handleAddContact}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Method *
              </label>
              <select
                value={contactForm.method}
                onChange={(e) =>
                  setContactForm({ ...contactForm, method: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="text">Text</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                value={contactForm.status}
                onChange={(e) =>
                  setContactForm({ ...contactForm, status: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="contacted">Contacted</option>
                <option value="no_answer">No Answer</option>
                <option value="left_message">Left Message</option>
                <option value="disconnected">Disconnected</option>
                <option value="wrong_number">Wrong Number</option>
                <option value="returned">Email Returned</option>
                <option value="blocked">Blocked</option>
                <option value="scheduled">Scheduled Callback</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={contactForm.notes}
                onChange={(e) =>
                  setContactForm({ ...contactForm, notes: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add details about the contact..."
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowContactModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Record Contact
            </button>
          </div>
        </form>
      </Modal>

      {/* Pledge Modal - Keep existing */}
      <Modal
        isOpen={showPledgeModal}
        onClose={() => setShowPledgeModal(false)}
        title="Add Pledge / Donation"
      >
        <form onSubmit={handleAddPledge}>
          <div className="space-y-6">
            {selectedDonor && (
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  <span className="font-bold">
                    Suggested ask based on historical giving:
                  </span>
                  ${selectedDonor.getSuggestedAsk?.() || "N/A"}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={pledgeForm.amount}
                onChange={(e) =>
                  setPledgeForm({ ...pledgeForm, amount: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="$0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select
                value={pledgeForm.type}
                onChange={(e) =>
                  setPledgeForm({ ...pledgeForm, type: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pledge">Pledge (Committed)</option>
                <option value="gave">Gave (Received)</option>
                <option value="recurring">Recurring (Setup)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={pledgeForm.notes}
                onChange={(e) =>
                  setPledgeForm({ ...pledgeForm, notes: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Pledge details, conditions, etc..."
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowPledgeModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Recurring Donation Modal - Keep existing */}
      <Modal
        isOpen={showRecurringModal}
        onClose={() => setShowRecurringModal(false)}
        title="Set Up Recurring Donation"
      >
        <form onSubmit={handleSetRecurring}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={recurringForm.amount}
                onChange={(e) =>
                  setRecurringForm({ ...recurringForm, amount: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="$0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequency *
              </label>
              <select
                value={recurringForm.frequency}
                onChange={(e) =>
                  setRecurringForm({
                    ...recurringForm,
                    frequency: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={recurringForm.notes}
                onChange={(e) =>
                  setRecurringForm({ ...recurringForm, notes: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional details..."
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowRecurringModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Set Up Recurring
            </button>
          </div>
        </form>
      </Modal>

      {/* Notes Modal - Keep existing */}
      <Modal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        title="Add Note"
        size="lg"
      >
        <form onSubmit={handleAddNote}>
          <div className="space-y-6">
            {selectedDonor?.notes?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Existing Notes ({selectedDonor.notes.length}/50)
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {selectedDonor.notes
                    .slice()
                    .reverse()
                    .map((note, index) => (
                      <div
                        key={index}
                        className="mb-3 pb-3 border-b border-gray-200 last:border-0"
                      >
                        <div className="text-xs text-gray-500 mb-1">
                          {new Date(note.date).toLocaleDateString()} at{" "}
                          {new Date(note.date).toLocaleTimeString()}
                        </div>
                        <div className="text-sm text-gray-800">
                          {note.content}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Note *
              </label>
              <textarea
                required
                value={noteForm.content}
                onChange={(e) =>
                  setNoteForm({ ...noteForm, content: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add your note here..."
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {noteForm.content.length}/500 characters
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowNotesModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add Note
            </button>
          </div>
        </form>
      </Modal>

      {/* Donor Details Modal - Keep existing */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Donor Details"
        size="xl"
      >
        {selectedDonor && (
          <div className="space-y-6">
            {/* Donor Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Donor Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Full Name
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedDonor.donorFirstName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Company
                  </label>
                  <p className="text-lg font-medium text-gray-900">
                    {selectedDonor.donorCompany || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Phone
                  </label>
                  <p className="text-lg font-medium text-gray-900 flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                    {selectedDonor.donorPhone}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Email
                  </label>
                  <p className="text-lg font-medium text-gray-900 flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    {selectedDonor.donorEmail || "N/A"}
                  </p>
                </div>
                {selectedDonor.donorAddress && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600">
                      Address
                    </label>
                    <p className="text-lg font-medium text-gray-900 flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                      {selectedDonor.donorAddress}
                      {selectedDonor.donorCity &&
                        `, ${selectedDonor.donorCity}`}
                      {selectedDonor.donorState &&
                        `, ${selectedDonor.donorState}`}
                      {selectedDonor.donorZip && ` ${selectedDonor.donorZip}`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Category Information */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                Donor Category
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    County
                  </label>
                  <p className="text-lg font-medium text-gray-900">
                    {selectedDonor.donorCounty || "Unknown"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Political Party
                  </label>
                  <p className="text-lg font-medium text-gray-900">
                    {selectedDonor.politicalParty || "Unknown"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Historical Donation
                  </label>
                  <p className="text-lg font-medium text-gray-900">
                    $
                    {selectedDonor.historicalDonationAmount?.toLocaleString() ||
                      "0"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedDonor.historicalDonationCategory?.replace(
                      /_/g,
                      " ",
                    )}
                  </p>
                </div>
              </div>
              {suggestedAsk && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
                  <p className="text-sm font-medium text-purple-800">
                    Suggested Ask Amount:{" "}
                    <span className="text-xl">
                      ${suggestedAsk.suggestedAmount}
                    </span>
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    Based on historical giving pattern
                  </p>
                </div>
              )}
            </div>

            {/* Pledge Information */}
            {selectedDonor.pledgeAmount && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                  Current Pledge Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Pledged Amount
                    </label>
                    <p className="text-2xl font-bold text-blue-700">
                      ${selectedDonor.pledgeAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Date Pledged
                    </label>
                    <p className="text-lg font-medium text-gray-900">
                      {selectedDonor.pledgedDate
                        ? new Date(
                            selectedDonor.pledgedDate,
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Status
                    </label>
                    <div className="mt-1">
                      {selectedDonor.isPledgeFulfilled ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Fulfilled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="h-4 w-4 mr-1" />
                          Pending
                        </span>
                      )}
                      {selectedDonor.isRecurring && (
                        <span className="inline-flex items-center px-3 py-1 ml-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Recurring ({selectedDonor.recurringFrequency})
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedDonor.isPledgeFulfilled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">
                          Received Amount
                        </label>
                        <p className="text-xl font-bold text-green-700">
                          $
                          {selectedDonor.receivedAmount?.toLocaleString() ||
                            "0"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">
                          Date Received
                        </label>
                        <p className="text-lg font-medium text-gray-900">
                          {selectedDonor.receivedDate
                            ? new Date(
                                selectedDonor.receivedDate,
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Payment History */}
            {selectedDonor.paymentHistory &&
              selectedDonor.paymentHistory.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                    Payment History
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedDonor.paymentHistory
                      .slice()
                      .reverse()
                      .map((payment, index) => (
                        <div
                          key={index}
                          className="bg-white p-2 rounded border border-green-200 flex justify-between"
                        >
                          <div>
                            <span className="font-medium">
                              ${payment.amount}
                            </span>
                            <span className="ml-2 text-xs px-2 py-1 bg-gray-100 rounded">
                              {payment.type}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(payment.date).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            {/* Contact Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MessageCircle className="h-5 w-5 mr-2 text-blue-600" />
                Contact Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Phone className="h-6 w-6 text-gray-500" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">Phone</div>
                  <div className="mt-1">
                    {renderContactStatus(selectedDonor.phoneStatus)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedDonor.phoneAttempts?.length || 0} attempts
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Mail className="h-6 w-6 text-gray-500" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">Email</div>
                  <div className="mt-1">
                    {renderContactStatus(selectedDonor.emailStatus)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedDonor.emailAttempts?.length || 0} attempts
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <MessageSquare className="h-6 w-6 text-gray-500" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">Text</div>
                  <div className="mt-1">
                    {renderContactStatus(selectedDonor.textStatus)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedDonor.textAttempts?.length || 0} attempts
                  </div>
                </div>
              </div>
            </div>

            {/* Fundraiser Information */}
            {selectedDonor.fundraiserFirstName && (
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-purple-600" />
                  Fundraiser Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Fundraiser
                    </label>
                    <p className="text-lg font-medium text-gray-900">
                      {selectedDonor.fundraiserFirstName}{" "}
                      {selectedDonor.fundraiserLastName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Created By
                    </label>
                    <p className="text-lg font-medium text-gray-900">
                      {selectedDonor.createdBy ? "Fundraiser" : "System"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes Preview */}
            {selectedDonor.notes && selectedDonor.notes.length > 0 && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-yellow-600" />
                  Recent Notes ({selectedDonor.notes.length})
                </h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {selectedDonor.notes
                    .slice()
                    .reverse()
                    .slice(0, 3)
                    .map((note, index) => (
                      <div
                        key={index}
                        className="bg-white p-3 rounded border border-yellow-200"
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-sm text-gray-800">
                            {note.content}
                          </p>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {new Date(note.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
                {selectedDonor.notes.length > 3 && (
                  <p className="text-sm text-gray-600 mt-3 text-center">
                    ... and {selectedDonor.notes.length - 3} more notes
                  </p>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedDonor(selectedDonor);
                  setShowContactModal(true);
                }}
                className="btn-primary inline-flex items-center"
              >
                <Phone className="h-4 w-4 mr-2" />
                Add Contact
              </button>
              {!selectedDonor.pledgeAmount && (
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedDonor(selectedDonor);
                    setShowPledgeModal(true);
                  }}
                  className="btn-primary inline-flex items-center bg-purple-600 hover:bg-purple-700"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Add Pledge
                </button>
              )}
              {selectedDonor.pledgeAmount &&
                !selectedDonor.isPledgeFulfilled && (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Mark pledge of $${selectedDonor.pledgeAmount} as received?`,
                        )
                      ) {
                        handleMarkReceived(
                          selectedDonor._id,
                          selectedDonor.pledgeAmount,
                        );
                        setShowDetailsModal(false);
                      }
                    }}
                    className="btn-primary inline-flex items-center bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Received
                  </button>
                )}
              <button
                type="button"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedDonor(selectedDonor);
                  setShowRecurringModal(true);
                }}
                className="btn-primary inline-flex items-center bg-indigo-600 hover:bg-indigo-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Set Recurring
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedDonor(selectedDonor);
                  setShowNotesModal(true);
                }}
                className="btn-secondary inline-flex items-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                Add Note
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        onSuccess={() => {
          fetchDonors();
          setShowBulkUploadModal(false);
        }}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
};

export default Fundraising;
