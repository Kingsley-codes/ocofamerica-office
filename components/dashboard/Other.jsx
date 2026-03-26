// components/dashboard/Other.jsx
"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Database,
  Bell,
  Save,
  RotateCcw,
  Download,
  Trash2,
  Eye,
  RefreshCw,
  Calendar,
  Clock,
  User,
  FileText,
  DollarSign,
  Users,
} from "lucide-react";
import Modal from "../ui/Modal";
import toast from "react-hot-toast";

// Helper functions
const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
};

const getSessionId = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("session_id");
};

// API Service
const otherService = {
  async getAuditLogs(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const token = getAuthToken();
    const sessionId = getSessionId();

    const response = await fetch(
      `/api/other/audit${queryParams ? `?${queryParams}` : ""}`,
      {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("session_id");
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(error.error || "Failed to fetch audit logs");
    }
    return await response.json();
  },

  async getBackups() {
    const token = getAuthToken();

    const response = await fetch("/api/other/backups", {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("session_id");
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(error.error || "Failed to fetch backups");
    }
    return await response.json();
  },

  async createBackup(data) {
    const token = getAuthToken();

    const response = await fetch("/api/other/backups", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("session_id");
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(error.error || "Failed to create backup");
    }
    return await response.json();
  },

  async restoreBackup(id) {
    const token = getAuthToken();

    const response = await fetch(`/api/other/backups/${id}/restore`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("session_id");
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(error.error || "Failed to restore backup");
    }
    return await response.json();
  },

  async deleteBackup(id) {
    const token = getAuthToken();

    const response = await fetch(`/api/other/backups/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("session_id");
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(error.error || "Failed to delete backup");
    }
    return await response.json();
  },

  async downloadBackup(id) {
    const token = getAuthToken();

    const response = await fetch(`/api/other/backups/${id}/download`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("session_id");
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(error.error || "Failed to download backup");
    }
    return await response.json();
  },

  async getSystemStats() {
    const token = getAuthToken();

    const response = await fetch("/api/other/stats", {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("session_id");
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(error.error || "Failed to fetch system stats");
    }
    return await response.json();
  },

  async exportAuditLogs(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const token = getAuthToken();

    const response = await fetch(
      `/api/other/audit/export${queryParams ? `?${queryParams}` : ""}`,
      {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("session_id");
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(error.error || "Failed to export audit logs");
    }
    return await response.json();
  },
};

const Other = () => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [backups, setBackups] = useState([]);
  const [systemStats, setSystemStats] = useState(null);
  const [timeRange, setTimeRange] = useState("30days");
  const [backupForm, setBackupForm] = useState({
    name: `Backup_${new Date().toISOString().split("T")[0]}`,
    description: "",
    includeMedia: true,
    includeDatabase: true,
    includeSettings: true,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  const settingsForm = {
    campaignName: "Smith for Senate 2024",
    timezone: "America/New_York",
    dateFormat: "MM/DD/YYYY",
    currency: "USD",
    notifications: true,
    autoSave: true,
  };

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      const data = await otherService.getSystemStats();
      setSystemStats(data);
    } catch (error) {
      console.error("Error fetching system stats:", error);
      toast.error(error.message);
    }
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        timeRange,
      };

      const result = await otherService.getAuditLogs(params);
      setAuditLogs(result.logs || []);
      setPagination(
        result.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 1,
        },
      );
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBackups = async () => {
    try {
      const data = await otherService.getBackups();
      setBackups(data.backups || []);
    } catch (error) {
      console.error("Error fetching backups:", error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (showAuditModal) {
      fetchAuditLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAuditModal, pagination.page, timeRange]);

  useEffect(() => {
    if (showBackupModal) {
      fetchBackups();
    }
  }, [showBackupModal]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Add API call here when backend is ready
      toast.success("Settings saved successfully");
      setShowSettingsModal(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateBackup = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await otherService.createBackup(backupForm);
      toast.success("Backup created successfully");
      fetchBackups();
      setBackupForm({
        name: `Backup_${new Date().toISOString().split("T")[0]}`,
        description: "",
        includeMedia: true,
        includeDatabase: true,
        includeSettings: true,
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestoreBackup = async (id, name) => {
    if (!confirm(`Are you sure you want to restore backup: ${name}?`)) {
      return;
    }

    try {
      await otherService.restoreBackup(id);
      toast.success("Backup restoration initiated");
      fetchBackups();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteBackup = async (id, name) => {
    if (!confirm(`Are you sure you want to delete backup: ${name}?`)) {
      return;
    }

    try {
      await otherService.deleteBackup(id);
      toast.success("Backup deleted successfully");
      fetchBackups();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDownloadBackup = async (id, name) => {
    try {
      const data = await otherService.downloadBackup(id);

      // Create a download link for the backup file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Backup download started");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleExportAuditLogs = async () => {
    try {
      const data = await otherService.exportAuditLogs({ timeRange });

      const headers = [
        "Action",
        "User",
        "Email",
        "Role",
        "Timestamp",
        "IP Address",
        "Details",
      ];
      const rows = data.logs.map((log) => [
        log.action,
        log.userName || "N/A",
        log.userEmail,
        log.userRole,
        new Date(log.timestamp).toLocaleString(),
        log.ipAddress || "N/A",
        log.details ? JSON.stringify(log.details) : "N/A",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Audit logs exported successfully");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const PaginationControls = () => (
    <div className="flex items-center justify-between px-3 sm:px-6 py-3 bg-white border-t border-gray-200">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() =>
            setPagination((prev) => ({
              ...prev,
              page: Math.max(1, prev.page - 1),
            }))
          }
          disabled={pagination.page === 1}
          className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <div className="flex items-center px-4">
          <span className="text-sm text-gray-700">
            {pagination.page} / {pagination.pages}
          </span>
        </div>
        <button
          onClick={() =>
            setPagination((prev) => ({
              ...prev,
              page: Math.min(pagination.pages, prev.page + 1),
            }))
          }
          disabled={pagination.page === pagination.pages}
          className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing{" "}
            <span className="font-medium">
              {(pagination.page - 1) * pagination.limit + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{" "}
            of <span className="font-medium">{pagination.total}</span> logs
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                page: Math.max(1, prev.page - 1),
              }))
            }
            disabled={pagination.page === 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm text-gray-700">
            Page {pagination.page}
          </span>
          <button
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                page: Math.min(pagination.pages, prev.page + 1),
              }))
            }
            disabled={pagination.page === pagination.pages}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* System Stats Overview */}
      {/* {systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-xl font-semibold text-gray-900">
                  {systemStats.totalUsers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center mr-3">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Audit Logs</p>
                <p className="text-xl font-semibold text-gray-900">
                  {systemStats?.totalAuditLogs?.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center mr-3">
                <Database className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Backups</p>
                <p className="text-xl font-semibold text-gray-900">
                  {systemStats.totalBackups}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center mr-3">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">System Uptime</p>
                <p className="text-xl font-semibold text-gray-900">
                  {systemStats.uptimeDays} days
                </p>
              </div>
            </div>
          </div>
        </div>
      )} */}

      {/* Main Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Audit Logs Card */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Audit Logs</h3>
            <p className="mt-2 text-sm text-gray-500">
              View system activity and changes
            </p>
            <button
              onClick={() => setShowAuditModal(true)}
              className="mt-4 w-full btn-primary"
            >
              View Logs
            </button>
          </div>
        </div>

        {/* Backup & Restore Card */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
              <Database className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              Backup & Restore
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Backup campaign data and restore points
            </p>
            <button
              onClick={() => setShowBackupModal(true)}
              className="mt-4 w-full btn-primary"
            >
              Manage
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs Modal */}
      <Modal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        title="Audit Logs"
        size="xl"
        showFooter={false}
      >
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  System Activity Log
                </p>
                <p className="text-xs text-gray-500">
                  Last 30 days of activity
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleExportAuditLogs}
                  className="btn-secondary inline-flex items-center text-sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
                <select
                  value={timeRange}
                  onChange={(e) => handleTimeRangeChange(e.target.value)}
                  className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="24hours">Last 24 hours</option>
                  <option value="7days">Last 7 days</option>
                  <option value="30days">Last 30 days</option>
                  <option value="90days">Last 90 days</option>
                  <option value="all">All time</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading audit logs...</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {auditLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No audit logs found</p>
                  </div>
                ) : (
                  auditLogs.map((log, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            {log.action.includes("login") && (
                              <User className="h-4 w-4 text-green-500 mr-2" />
                            )}
                            {log.action.includes("upload") && (
                              <FileText className="h-4 w-4 text-blue-500 mr-2" />
                            )}
                            {log.action.includes("expense") && (
                              <DollarSign className="h-4 w-4 text-amber-500 mr-2" />
                            )}
                            {log.action.includes("volunteer") && (
                              <Users className="h-4 w-4 text-purple-500 mr-2" />
                            )}
                            {log.action.includes("permission") && (
                              <Shield className="h-4 w-4 text-red-500 mr-2" />
                            )}
                            <p className="text-sm font-medium text-gray-900">
                              {log.action}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            By {log.userName || log.userEmail} ({log.userRole})
                            at {new Date(log.timestamp).toLocaleString()}
                          </p>
                          {log.details && (
                            <p className="text-xs text-gray-600 mt-1 truncate">
                              {typeof log.details === "object"
                                ? JSON.stringify(log.details)
                                : log.details}
                            </p>
                          )}
                          {log.ipAddress && (
                            <p className="text-xs text-gray-400 mt-1">
                              IP: {log.ipAddress}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {auditLogs.length > 0 && <PaginationControls />}
            </>
          )}
        </div>
      </Modal>

      {/* Backup & Restore Modal */}
      <Modal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        title="Backup & Restore"
        size="lg"
        isSubmitting={isSubmitting}
      >
        <form id="modal-form" onSubmit={handleCreateBackup}>
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Create New Backup
              </h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Database className="h-5 w-5 text-blue-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      System Backup
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Includes all campaign data, settings, and media assets
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Backup Name
                    </label>
                    <input
                      type="text"
                      value={backupForm.name}
                      onChange={(e) =>
                        setBackupForm({ ...backupForm, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Backup_2024-01-15"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={backupForm.description}
                      onChange={(e) =>
                        setBackupForm({
                          ...backupForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows="2"
                      placeholder="Backup description..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Include
                    </label>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={backupForm.includeDatabase}
                          onChange={(e) =>
                            setBackupForm({
                              ...backupForm,
                              includeDatabase: e.target.checked,
                            })
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                          Database Records
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={backupForm.includeMedia}
                          onChange={(e) =>
                            setBackupForm({
                              ...backupForm,
                              includeMedia: e.target.checked,
                            })
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                          Media Files
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={backupForm.includeSettings}
                          onChange={(e) =>
                            setBackupForm({
                              ...backupForm,
                              includeSettings: e.target.checked,
                            })
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                          System Settings
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">
                  Recent Backups
                </h4>
                <button
                  type="button"
                  onClick={fetchBackups}
                  className="text-blue-600 hover:text-blue-900 text-sm font-medium inline-flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </button>
              </div>
              <div className="space-y-3">
                {backups.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No backups found</p>
                    <p className="text-gray-500 text-sm mt-1">
                      Create your first backup to get started
                    </p>
                  </div>
                ) : (
                  backups.map((backup, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center flex-1">
                        <Database className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {backup.name}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 space-x-2">
                            <span>
                              {new Date(backup.createdAt).toLocaleString()}
                            </span>
                            <span>•</span>
                            <span>{formatFileSize(backup.size)}</span>
                            {backup.status && (
                              <>
                                <span>•</span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-xs ${
                                    backup.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : backup.status === "failed"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {backup.status}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadBackup(backup._id, backup.name)
                          }
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleRestoreBackup(backup._id, backup.name)
                          }
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Restore"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteBackup(backup._id, backup.name)
                          }
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <RotateCcw className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Backups are automatically created daily at midnight. Manual
                    backups are recommended before major system changes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Other;
