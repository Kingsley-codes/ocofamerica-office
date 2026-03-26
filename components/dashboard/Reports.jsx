"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Filter,
  Download,
  DollarSign,
  MapPin,
  CheckCircle,
  AlertCircle,
  Calendar,
  Plus,
  Trash,
  Edit,
  Search,
  X,
  Database,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import Modal from "../ui/Modal";
import { apiRequest } from "@/lib/auth";
import {
  formatCurrency,
  formatDate,
  getInitials,
  generateStatusColor,
} from "@/lib/utils";

const Reports = ({ user }) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddDonorModal, setShowAddDonorModal] = useState(false);
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false);
  const [showEditDonorModal, setShowEditDonorModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [expenses, setExpenses] = useState([]);
  const [donors, setDonors] = useState([]);
  const [campaignGoals, setCampaignGoals] = useState([]);
  const [reportsSummary, setReportsSummary] = useState({
    totalDonations: 0,
    totalExpenses: 0,
    cashOnHand: 0,
    expenseCount: 0,
    donorCount: 0,
  });

  const [hasData, setHasData] = useState(false);
  const [isEmptyDatabase, setIsEmptyDatabase] = useState(true);

  const [exportForm, setExportForm] = useState({
    format: "csv",
    dateRange: "all",
    include: ["expenses", "donors", "summary"],
  });

  const [filterForm, setFilterForm] = useState({
    startDate: "",
    endDate: "",
    minAmount: "",
    maxAmount: "",
    status: "all",
    category: "all",
    page: 1,
    limit: 20,
  });

  const [expenseForm, setExpenseForm] = useState({
    vendor: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    amount: "",
    date: "",
    category: "operations",
    description: "",
    status: "pending",
  });

  const [donorForm, setDonorForm] = useState({
    firstName: "",
    lastName: "",
    business: "",
    amount: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    email: "",
    occupation: "",
    retired: false,
    status: "one_time",
  });

  const [editingExpense, setEditingExpense] = useState(null);
  const [editingDonor, setEditingDonor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  // Fetch reports data from backend
  const fetchReports = async () => {
    try {
      setIsLoading(true);
      setError("");

      const queryParams = new URLSearchParams();

      // Add filter parameters
      Object.entries(filterForm).forEach(([key, value]) => {
        if (value && value !== "all" && value !== "") {
          queryParams.append(key, value);
        }
      });

      // Add search query if exists
      if (searchQuery) {
        queryParams.append("search", searchQuery);
      }

      console.log("Fetching reports from backend...");
      console.log("Query params:", queryParams.toString());

      const response = await apiRequest(`/reports?${queryParams.toString()}`);
      console.log("Backend response:", response);

      if (response.success) {
        const expensesData = response.data.expenses || [];
        const donorsData = response.data.donors || [];
        const goalsData = response.data.campaignGoals || [];

        setExpenses(expensesData);
        setDonors(donorsData);
        setCampaignGoals(goalsData);
        setReportsSummary(response.data.reportsSummary || {});

        // Check if we have any data
        const hasAnyData =
          expensesData.length > 0 ||
          donorsData.length > 0 ||
          goalsData.length > 0;
        setHasData(hasAnyData);
        setIsEmptyDatabase(!hasAnyData);
      } else {
        setError(response.message || "Failed to fetch reports");
        console.error("Failed to fetch reports:", response.message);
        setIsEmptyDatabase(true);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      setError(error.message || "Network error occurred");
      setIsEmptyDatabase(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterForm.page]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        fetchReports();
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Calculate trends based on actual data
  const calculateTrend = (currentValue, previousValue) => {
    if (previousValue === 0 || !previousValue) return "N/A";
    const change = ((currentValue - previousValue) / previousValue) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      direction: change >= 0 ? "up" : "down",
      isPositive: change >= 0,
    };
  };

  // Summary stats with proper empty state handling
  const summaryStats = [
    {
      label: "Total Donations",
      value: formatCurrency(reportsSummary.totalDonations || 0),
      icon: DollarSign,
      color: "bg-green-100 text-green-800",
      trend: isEmptyDatabase ? "No data" : "N/A",
    },
    {
      label: "Total Expenses",
      value: formatCurrency(reportsSummary.totalExpenses || 0),
      icon: DollarSign,
      color: "bg-red-100 text-red-800",
      trend: isEmptyDatabase ? "No data" : "N/A",
    },
    {
      label: "Cash on Hand",
      value: formatCurrency(reportsSummary.cashOnHand || 0),
      icon: DollarSign,
      color: "bg-blue-100 text-blue-800",
      trend: isEmptyDatabase ? "No data" : "N/A",
    },
  ];

  const handleExport = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // For file downloads, we need to handle the response differently
      const response = await apiRequest("/reports/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exportForm),
      });

      // Check if response is a Blob (file) or JSON
      if (
        response instanceof Blob ||
        response.type === "application/octet-stream"
      ) {
        // Handle file download
        let filename = "reports";

        // Determine filename based on format
        switch (exportForm.format) {
          case "csv":
            filename = "campaign-reports.csv";
            break;
          case "excel":
            filename = "campaign-reports.xlsx";
            break;
          case "pdf":
            filename = "campaign-reports.pdf";
            break;
          case "json":
            filename = "campaign-reports.json";
            break;
        }

        // Create download link
        const url = window.URL.createObjectURL(response);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (response.success) {
        // Handle JSON response (for json format)
        if (exportForm.format === "json") {
          const exportData = JSON.stringify(response.data, null, 2);
          downloadFile(exportData, "campaign-reports.json", "application/json");
        } else {
          // For other formats, check if there's a file buffer
          if (response.fileBuffer) {
            // Convert base64 to blob if needed
            const blob = base64ToBlob(
              response.fileBuffer,
              getMimeType(exportForm.format),
            );
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `campaign-reports.${exportForm.format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }
        }
      }

      setShowExportModal(false);
    } catch (error) {
      console.error("Export error:", error);
      setError(error.message || "Export failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions
  const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const getMimeType = (format) => {
    switch (format) {
      case "csv":
        return "text/csv";
      case "excel":
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      case "pdf":
        return "application/pdf";
      case "json":
        return "application/json";
      default:
        return "application/octet-stream";
    }
  };

  const handleFilter = async (e) => {
    e.preventDefault();
    await fetchReports();
    setShowFilterModal(false);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await apiRequest("/reports/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expenseForm),
      });

      if (response.success) {
        setShowAddExpenseModal(false);
        resetExpenseForm();
        await fetchReports();
        setIsEmptyDatabase(false);
      } else {
        setError(response.message || "Failed to add expense");
      }
    } catch (error) {
      console.error("Add expense error:", error);
      setError("Failed to add expense. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDonor = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await apiRequest("/reports/donors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(donorForm),
      });

      if (response.success) {
        setShowAddDonorModal(false);
        resetDonorForm();
        await fetchReports();
        setIsEmptyDatabase(false);
      } else {
        setError(response.message || "Failed to add donor");
      }
    } catch (error) {
      console.error("Add donor error:", error);
      setError("Failed to add donor. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditExpense = async (e) => {
    e.preventDefault();
    if (!editingExpense) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await apiRequest(
        `/reports/expenses/${editingExpense._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(expenseForm),
        },
      );

      if (response.success) {
        setShowEditExpenseModal(false);
        resetExpenseForm();
        setEditingExpense(null);
        await fetchReports();
      } else {
        setError(response.message || "Failed to update expense");
      }
    } catch (error) {
      console.error("Edit expense error:", error);
      setError("Failed to update expense. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDonor = async (e) => {
    e.preventDefault();
    if (!editingDonor) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await apiRequest(`/reports/donors/${editingDonor._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(donorForm),
      });

      if (response.success) {
        setShowEditDonorModal(false);
        resetDonorForm();
        setEditingDonor(null);
        await fetchReports();
      } else {
        setError(response.message || "Failed to update donor");
      }
    } catch (error) {
      console.error("Edit donor error:", error);
      setError("Failed to update donor. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      const response = await apiRequest(`/reports/expenses/${expenseId}`, {
        method: "DELETE",
      });

      if (response.success) {
        await fetchReports();
      } else {
        setError(response.message || "Failed to delete expense");
      }
    } catch (error) {
      console.error("Delete expense error:", error);
      setError("Failed to delete expense. Please try again.");
    }
  };

  const handleDeleteDonor = async (donorId) => {
    if (!confirm("Are you sure you want to delete this donor?")) return;

    try {
      const response = await apiRequest(`/reports/donors/${donorId}`, {
        method: "DELETE",
      });

      if (response.success) {
        await fetchReports();
      } else {
        setError(response.message || "Failed to delete donor");
      }
    } catch (error) {
      console.error("Delete donor error:", error);
      setError("Failed to delete donor. Please try again.");
    }
  };

  const openEditExpenseModal = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      vendor: expense.vendor || "",
      firstName: expense.firstName || "",
      lastName: expense.lastName || "",
      address: expense.address || "",
      city: expense.city || "",
      state: expense.state || "",
      zip: expense.zip || "",
      amount: expense.amount || "",
      date: expense.date ? expense.date.split("T")[0] : "",
      category: expense.category || "operations",
      description: expense.description || "",
      status: expense.status || "pending",
    });
    setShowEditExpenseModal(true);
  };

  const openEditDonorModal = (donor) => {
    setEditingDonor(donor);
    setDonorForm({
      firstName: donor.firstName || "",
      lastName: donor.lastName || "",
      business: donor.business || "",
      amount: donor.amount || "",
      address: donor.address || "",
      city: donor.city || "",
      state: donor.state || "",
      zip: donor.zip || "",
      phone: donor.phone || "",
      email: donor.email || "",
      occupation: donor.occupation || "",
      retired: donor.retired || false,
      status: donor.status || "one_time",
    });
    setShowEditDonorModal(true);
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      vendor: "",
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      amount: "",
      date: "",
      category: "operations",
      description: "",
      status: "pending",
    });
  };

  const resetDonorForm = () => {
    setDonorForm({
      firstName: "",
      lastName: "",
      business: "",
      amount: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      phone: "",
      email: "",
      occupation: "",
      retired: false,
      status: "one_time",
    });
  };

  const convertToCSV = (data) => {
    const csvRows = [];

    // Add expenses
    if (data.expenses && data.expenses.length > 0) {
      csvRows.push("Expenses");
      csvRows.push("Date,Vendor,Address,City,State,Zip,Amount,Category,Status");
      data.expenses.forEach((expense) => {
        csvRows.push(
          [
            formatDate(expense.date),
            `"${expense.vendor}"`,
            `"${expense.address || ""}"`,
            `"${expense.city || ""}"`,
            `"${expense.state || ""}"`,
            `"${expense.zip || ""}"`,
            expense.amount,
            expense.category,
            expense.status,
          ].join(","),
        );
      });
      csvRows.push("");
    }

    // Add donors
    if (data.donors && data.donors.length > 0) {
      csvRows.push("Donors");
      csvRows.push(
        "Date,Name,Address,City,State,Zip,Amount,Email,Occupation,Status",
      );
      data.donors.forEach((donor) => {
        csvRows.push(
          [
            formatDate(donor.date),
            `"${donor.firstName} ${donor.lastName}"`,
            `"${donor.address || ""}"`,
            `"${donor.city || ""}"`,
            `"${donor.state || ""}"`,
            `"${donor.zip || ""}"`,
            donor.amount,
            donor.email,
            donor.occupation || "",
            donor.status,
          ].join(","),
        );
      });
      csvRows.push("");
    }

    // Add summary
    if (data.summary) {
      csvRows.push("Summary");
      csvRows.push("Total Donations,Total Expenses,Cash on Hand");
      csvRows.push(
        [
          data.summary.totalDonations,
          data.summary.totalExpenses,
          data.summary.cashOnHand,
        ].join(","),
      );
    }

    return csvRows.join("\n");
  };

  const downloadFile = (content, fileName, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilterForm({
      startDate: "",
      endDate: "",
      minAmount: "",
      maxAmount: "",
      status: "all",
      category: "all",
      page: 1,
      limit: 20,
    });
    setSearchQuery("");
    fetchReports();
  };

  // Empty State Component
  const EmptyState = () => (
    <div className="bg-white rounded-lg shadow p-8 text-center">
      <div className="flex flex-col items-center justify-center">
        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Database className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Reports Data Yet
        </h3>
        <p className="text-sm text-gray-600 mb-6 max-w-md">
          Start by adding your first expense or donor to see reports and
          analytics. Your data will appear here once added.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowAddExpenseModal(true)}
            className="btn-primary inline-flex items-center px-4 py-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Expense
          </button>
          <button
            onClick={() => setShowAddDonorModal(true)}
            className="btn-secondary inline-flex items-center px-4 py-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Donor
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Reports</h3>
          <p className="text-sm text-gray-600">
            Campaign financials and projections
          </p>
        </div>

        {/* Desktop Actions - Only show if we have data */}
        {hasData && (
          <div className="hidden md:flex space-x-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search expenses or donors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilterModal(true)}
              className="btn-secondary inline-flex items-center px-4 py-2"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="btn-primary inline-flex items-center px-4 py-2"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              onClick={() => setShowAddExpenseModal(true)}
              className="btn-primary inline-flex items-center px-4 py-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </button>
            <button
              onClick={() => setShowAddDonorModal(true)}
              className="btn-primary inline-flex items-center px-4 py-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Donor
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : isEmptyDatabase ? (
        <EmptyState />
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {summaryStats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow p-4 md:p-6"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div
                      className={`h-10 w-10 md:h-12 md:w-12 rounded-full ${
                        stat.color.split(" ")[0]
                      } flex items-center justify-center`}
                    >
                      <stat.icon
                        className={`h-5 w-5 md:h-6 md:w-6 ${stat.color.split(" ")[1]}`}
                      />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-900">
                      {stat.label}
                    </h4>
                    <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">
                      {stat.value}
                    </p>
                    <p
                      className={`text-xs md:text-sm ${stat.trend === "No data" ? "text-gray-500" : "text-gray-600"} mt-1`}
                    >
                      {stat.trend === "No data" ? (
                        "No data"
                      ) : stat.trend === "N/A" ? (
                        "Add more data to see trends"
                      ) : (
                        <span className="flex items-center">
                          {stat.trend.direction === "up" ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {stat.trend.value}%{" "}
                          {stat.trend.direction === "up"
                            ? "increase"
                            : "decrease"}{" "}
                          from last month
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expenses Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Expenses ({expenses.length})
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Date Paid, Vendor, Address, Amount
                    </p>
                  </div>
                  {expenses.length === 0 && (
                    <button
                      onClick={() => setShowAddExpenseModal(true)}
                      className="btn-primary inline-flex items-center px-3 py-1.5 text-sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Expense
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                {expenses.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date Paid
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Company/Vendor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Address
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {expenses.map((expense) => (
                        <tr key={expense._id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(expense.date)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {expense.vendor}
                            </div>
                            {expense.firstName && expense.lastName && (
                              <div className="text-xs text-gray-500">
                                Contact: {expense.firstName} {expense.lastName}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {expense.address ? (
                              <div>
                                <div className="text-sm text-gray-900">
                                  {expense.address}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {expense.city}, {expense.state} {expense.zip}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">
                                No address
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${generateStatusColor(
                                expense.status,
                              )}`}
                            >
                              {expense.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openEditExpenseModal(expense)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit Expense"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense._id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete Expense"
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <p>
                      No expenses yet. Add your first expense to get started.
                    </p>
                    <button
                      onClick={() => setShowAddExpenseModal(true)}
                      className="mt-3 btn-primary inline-flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Expense
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Donors Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Donors ({donors.length})
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Contributors and their contact information
                    </p>
                  </div>
                  {donors.length === 0 && (
                    <button
                      onClick={() => setShowAddDonorModal(true)}
                      className="btn-primary inline-flex items-center px-3 py-1.5 text-sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Donor
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                {donors.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Donor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Address
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Occupation
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {donors.map((donor) => (
                        <tr key={donor._id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-blue-600 text-xs font-semibold">
                                    {getInitials(
                                      donor.firstName,
                                      donor.lastName,
                                    )}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {donor.firstName} {donor.lastName}
                                </div>
                                <div className="text-sm text-gray-500 truncate max-w-[200px]">
                                  {donor.email}
                                </div>
                                {donor.business && (
                                  <div className="text-xs text-gray-400">
                                    {donor.business}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {donor.address ? (
                              <div>
                                <div className="text-sm text-gray-900">
                                  {donor.address}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {donor.city}, {donor.state} {donor.zip}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">
                                No address
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {formatCurrency(donor.amount)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {donor.occupation || "N/A"}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${generateStatusColor(
                                donor.status,
                              )}`}
                            >
                              {donor.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openEditDonorModal(donor)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit Donor"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteDonor(donor._id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete Donor"
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <p>No donors yet. Add your first donor to get started.</p>
                    <button
                      onClick={() => setShowAddDonorModal(true)}
                      className="mt-3 btn-primary inline-flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Donor
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Campaign Goals Section */}
          <div className="bg-white shadow sm:rounded-lg p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Campaign Goals & Projections
              </h3>
              {campaignGoals.length === 0 && (
                <p className="text-sm text-gray-500 mt-1 sm:mt-0">
                  No campaign goals set up yet
                </p>
              )}
            </div>
            <div className="space-y-4 md:space-y-6">
              {campaignGoals.length > 0 ? (
                campaignGoals.map((goal) => (
                  <div key={goal._id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">
                        {goal.title}
                      </span>
                      <span className="text-gray-600">
                        {goal.category === "fundraising"
                          ? formatCurrency(goal.current || 0)
                          : (goal.current || 0).toLocaleString()}{" "}
                        /{" "}
                        {goal.category === "fundraising"
                          ? formatCurrency(goal.target || 0)
                          : (goal.target || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${
                          goal.status === "ahead"
                            ? "bg-green-600"
                            : goal.status === "on_track"
                              ? "bg-blue-600"
                              : "bg-yellow-600"
                        }`}
                        style={{ width: `${goal.progress || 0}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span className="flex items-center">
                        {goal.status === "ahead" ? (
                          <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                        ) : goal.status === "on_track" ? (
                          <CheckCircle className="h-3 w-3 text-blue-500 mr-1" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-yellow-500 mr-1" />
                        )}
                        {(goal.progress || 0).toFixed(1)}% complete
                      </span>
                      <span>Target: {goal.timeline || "N/A"}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No campaign goals set up yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Campaign goals help track progress towards targets
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Mobile Actions Menu - Always show but conditionally style */}
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className={`p-4 rounded-full shadow-lg transition-colors ${
            isEmptyDatabase
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {showMobileMenu ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </button>

        {showMobileMenu && (
          <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl p-2 min-w-[200px] border border-gray-200">
            <div className="space-y-2">
              {isEmptyDatabase && (
                <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
                  Start by adding data:
                </div>
              )}
              <button
                onClick={() => {
                  setShowAddExpenseModal(true);
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <FileText className="h-4 w-4 mr-2" />
                Add Expense
              </button>
              <button
                onClick={() => {
                  setShowAddDonorModal(true);
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Donor
              </button>

              {hasData && (
                <>
                  <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-100 mt-2">
                    Data Actions:
                  </div>
                  <button
                    onClick={() => {
                      setShowFilterModal(true);
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </button>
                  <button
                    onClick={() => {
                      setShowExportModal(true);
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      <Modal
        isOpen={showAddExpenseModal}
        onClose={() => {
          setShowAddExpenseModal(false);
          resetExpenseForm();
        }}
        title="Add New Expense"
        size="lg"
        isSubmitting={isSubmitting}
      >
        <form id="modal-form" onSubmit={handleAddExpense}>
          <div className="space-y-6">
            {/* Date Field - Required by law */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Paid *
              </label>
              <input
                type="date"
                required
                value={expenseForm.date}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, date: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                The date the money was actually spent (required by law)
              </p>
            </div>

            {/* Vendor and Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company/Vendor Name *
                </label>
                <input
                  type="text"
                  required
                  value={expenseForm.vendor}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, vendor: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, amount: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Address Fields - Required by law */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <input
                type="text"
                required
                value={expenseForm.address}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, address: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Street Address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={expenseForm.city}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, city: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  required
                  value={expenseForm.state}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, state: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  required
                  value={expenseForm.zip}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, zip: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Optional name fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name (if individual)
                </label>
                <input
                  type="text"
                  value={expenseForm.firstName}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      firstName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name (if individual)
                </label>
                <input
                  type="text"
                  value={expenseForm.lastName}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, lastName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Category and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={expenseForm.category}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="operations">Operations</option>
                  <option value="marketing">Marketing</option>
                  <option value="events">Events</option>
                  <option value="advertising">Advertising</option>
                  <option value="field">Field Operations</option>
                  <option value="legal">Legal</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={expenseForm.status}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={expenseForm.description}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    description: e.target.value,
                  })
                }
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of the expense"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Add Donor Modal */}
      <Modal
        isOpen={showAddDonorModal}
        onClose={() => {
          setShowAddDonorModal(false);
          resetDonorForm();
        }}
        title="Add New Donor"
        size="lg"
        isSubmitting={isSubmitting}
      >
        <form id="modal-form" onSubmit={handleAddDonor}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={donorForm.firstName}
                  onChange={(e) =>
                    setDonorForm({ ...donorForm, firstName: e.target.value })
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
                  value={donorForm.lastName}
                  onChange={(e) =>
                    setDonorForm({ ...donorForm, lastName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={donorForm.email}
                  onChange={(e) =>
                    setDonorForm({ ...donorForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={donorForm.amount}
                  onChange={(e) =>
                    setDonorForm({ ...donorForm, amount: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Donor Address Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                value={donorForm.address}
                onChange={(e) =>
                  setDonorForm({ ...donorForm, address: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Street Address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={donorForm.city}
                  onChange={(e) =>
                    setDonorForm({ ...donorForm, city: e.target.value })
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
                  value={donorForm.state}
                  onChange={(e) =>
                    setDonorForm({ ...donorForm, state: e.target.value })
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
                  value={donorForm.zip}
                  onChange={(e) =>
                    setDonorForm({ ...donorForm, zip: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={donorForm.phone}
                  onChange={(e) =>
                    setDonorForm({ ...donorForm, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business/Company
                </label>
                <input
                  type="text"
                  value={donorForm.business}
                  onChange={(e) =>
                    setDonorForm({ ...donorForm, business: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Occupation
                </label>
                <input
                  type="text"
                  value={donorForm.occupation}
                  onChange={(e) =>
                    setDonorForm({ ...donorForm, occupation: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={donorForm.status}
                  onChange={(e) =>
                    setDonorForm({ ...donorForm, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="one_time">One-time</option>
                  <option value="recurring">Recurring</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="retired"
                checked={donorForm.retired}
                onChange={(e) =>
                  setDonorForm({ ...donorForm, retired: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="retired" className="ml-2 text-sm text-gray-700">
                Retired
              </label>
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Expense Modal */}
      <Modal
        isOpen={showEditExpenseModal}
        onClose={() => {
          setShowEditExpenseModal(false);
          resetExpenseForm();
          setEditingExpense(null);
        }}
        title="Edit Expense"
        size="lg"
        isSubmitting={isSubmitting}
      >
        <form id="modal-form" onSubmit={handleEditExpense}>
          <div className="space-y-6">
            {/* Date Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Paid *
              </label>
              <input
                type="date"
                required
                value={expenseForm.date}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, date: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company/Vendor Name *
                </label>
                <input
                  type="text"
                  required
                  value={expenseForm.vendor}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, vendor: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, amount: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Address Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <input
                type="text"
                required
                value={expenseForm.address}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, address: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={expenseForm.city}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, city: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  required
                  value={expenseForm.state}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, state: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  required
                  value={expenseForm.zip}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, zip: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name (if individual)
                </label>
                <input
                  type="text"
                  value={expenseForm.firstName}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      firstName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name (if individual)
                </label>
                <input
                  type="text"
                  value={expenseForm.lastName}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, lastName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={expenseForm.category}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="operations">Operations</option>
                  <option value="marketing">Marketing</option>
                  <option value="events">Events</option>
                  <option value="advertising">Advertising</option>
                  <option value="field">Field Operations</option>
                  <option value="legal">Legal</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={expenseForm.status}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={expenseForm.description}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    description: e.target.value,
                  })
                }
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of the expense"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Donor Modal */}
      <Modal
        isOpen={showEditDonorModal}
        onClose={() => {
          setShowEditDonorModal(false);
          resetDonorForm();
          setEditingDonor(null);
        }}
        title="Edit Donor"
        size="lg"
        isSubmitting={isSubmitting}
      >
        <form id="modal-form" onSubmit={handleEditDonor}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={donorForm.firstName}
                  onChange={(e) =>
                    setDonorForm({ ...donorForm, firstName: e.target.value })
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
                  value={donorForm.lastName}
                  onChange={(e) =>
                    setDonorForm({ ...donorForm, lastName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={donorForm.email}
                  onChange={(e) =>
                    setDonorForm({ ...donorForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={donorForm.amount}
                  onChange={(e) =>
                    setDonorForm({ ...donorForm, amount: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Donor Address Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                value={donorForm.address}
                onChange={(e) =>
                  setDonorForm({ ...donorForm, address: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={donorForm.city}
                  onChange={(e) =>
                    setDonorForm({ ...donorForm, city: e.target.value })
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
                  value={donorForm.state}
                  onChange={(e) =>
                    setDonorForm({ ...donorForm, state: e.target.value })
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
                  value={donorForm.zip}
                  onChange={(e) =>
                    setDonorForm({ ...donorForm, zip: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={donorForm.phone}
                  onChange={(e) =>
                    setDonorForm({ ...donorForm, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business/Company
                </label>
                <input
                  type="text"
                  value={donorForm.business}
                  onChange={(e) =>
                    setDonorForm({ ...donorForm, business: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Occupation
                </label>
                <input
                  type="text"
                  value={donorForm.occupation}
                  onChange={(e) =>
                    setDonorForm({ ...donorForm, occupation: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={donorForm.status}
                  onChange={(e) =>
                    setDonorForm({ ...donorForm, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="one_time">One-time</option>
                  <option value="recurring">Recurring</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="retired"
                checked={donorForm.retired}
                onChange={(e) =>
                  setDonorForm({ ...donorForm, retired: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="retired" className="ml-2 text-sm text-gray-700">
                Retired
              </label>
            </div>
          </div>
        </form>
      </Modal>

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Reports"
        size="md"
        isSubmitting={isSubmitting}
      >
        <form id="modal-form" onSubmit={handleExport}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format *
              </label>
              <select
                value={exportForm.format}
                onChange={(e) =>
                  setExportForm({ ...exportForm, format: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="excel">Excel (.xlsx)</option>
                <option value="pdf">PDF</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range *
              </label>
              <select
                value={exportForm.dateRange}
                onChange={(e) =>
                  setExportForm({ ...exportForm, dateRange: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="last_month">Last Month</option>
                <option value="last_quarter">Last Quarter</option>
                <option value="last_year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Include Data *
              </label>
              <div className="space-y-2">
                {[
                  { id: "expenses", label: "Expenses" },
                  { id: "donors", label: "Donors" },
                  { id: "summary", label: "Summary Statistics" },
                  { id: "goals", label: "Campaign Goals" },
                ].map((item) => (
                  <div key={item.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={item.id}
                      checked={exportForm.include.includes(item.id)}
                      onChange={(e) => {
                        const newInclude = e.target.checked
                          ? [...exportForm.include, item.id]
                          : exportForm.include.filter((i) => i !== item.id);
                        setExportForm({ ...exportForm, include: newInclude });
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={item.id}
                      className="ml-3 text-sm text-gray-700"
                    >
                      {item.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Filter Modal */}
      <Modal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Filter Reports"
        size="md"
      >
        <form id="modal-form" onSubmit={handleFilter}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filterForm.startDate}
                  onChange={(e) =>
                    setFilterForm({ ...filterForm, startDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filterForm.endDate}
                  onChange={(e) =>
                    setFilterForm({ ...filterForm, endDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Amount
                </label>
                <input
                  type="number"
                  min="0"
                  value={filterForm.minAmount}
                  onChange={(e) =>
                    setFilterForm({ ...filterForm, minAmount: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Amount
                </label>
                <input
                  type="number"
                  min="0"
                  value={filterForm.maxAmount}
                  onChange={(e) =>
                    setFilterForm({ ...filterForm, maxAmount: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1000000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filterForm.status}
                  onChange={(e) =>
                    setFilterForm({ ...filterForm, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filterForm.category}
                  onChange={(e) =>
                    setFilterForm({ ...filterForm, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="operations">Operations</option>
                  <option value="marketing">Marketing</option>
                  <option value="events">Events</option>
                  <option value="advertising">Advertising</option>
                  <option value="field">Field Operations</option>
                  <option value="legal">Legal</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={clearFilters}
                className="flex-1 btn-secondary"
              >
                Clear All
              </button>
              <button type="submit" className="flex-1 btn-primary">
                Apply Filters
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Reports;
