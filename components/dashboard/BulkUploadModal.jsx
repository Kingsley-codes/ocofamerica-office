/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef, useEffect } from "react";
import {
  Upload,
  X,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  User,
  DollarSign,
  Phone,
  Download,
  MapPin,
  Users,
  Filter,
  Eye,
  Shield,
  BarChart3,
  PieChart,
  Layers,
  FileSpreadsheet,
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  Calendar,
  Clock,
  Grid,
  List,
  Search,
} from "lucide-react";
import Modal from "../ui/Modal";
import { apiRequest } from "@/lib/auth";
import toast from "react-hot-toast";

const BulkUploadModal = ({ isOpen, onClose, onSuccess }) => {
  const [uploadState, setUploadState] = useState({
    status: "idle",
    currentStep: "",
    fileName: "",
    fileSize: 0,
  });

  const [importMetadata, setImportMetadata] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const [scanResult, setScanResult] = useState(null);
  const [processingProgress, setProcessingProgress] = useState({
    current: 0,
    total: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    currentDonor: null,
    errors: [],
    sheetProgress: {},
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [expandedSheets, setExpandedSheets] = useState({});
  const [isCancelling, setIsCancelling] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [viewMode, setViewMode] = useState("grid");

  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 6 }, (_, i) => currentYear - i);
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

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setSelectedFile(null);
      setScanResult(null);
    };
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file) => {
    const validExtensions = [".xlsx", ".xls", ".csv"];
    const fileExtension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      toast.error("Please upload an Excel file (.xlsx, .xls) or CSV file");
      return;
    }

    if (file.size > 200 * 1024 * 1024) {
      toast.error("File size exceeds 200MB limit");
      return;
    }

    setSelectedFile(file);
    setUploadState({
      status: "idle",
      currentStep: "",
      fileName: file.name,
      fileSize: file.size,
    });
    setScanResult(null);
    setProcessingProgress({
      current: 0,
      total: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      currentDonor: null,
      errors: [],
      sheetProgress: {},
    });

    toast.success(
      <div className="flex items-center">
        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
        <span>File selected: {file.name}</span>
      </div>,
    );
  };

  const handleCancel = async () => {
    if (abortControllerRef.current) {
      setIsCancelling(true);
      abortControllerRef.current.abort();
      toast.loading("Cancelling operation...", { id: "cancel-toast" });

      setTimeout(() => {
        setIsCancelling(false);
        abortControllerRef.current = null;
        resetForm();
        toast.success("Operation cancelled", { id: "cancel-toast" });
      }, 500);
    }
  };

  const handleScanFile = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to scan");
      return;
    }

    abortControllerRef.current = new AbortController();

    setUploadState({
      status: "scanning",
      currentStep: "Analyzing file structure...",
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
    });

    const toastId = toast.loading("Scanning file...");

    try {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const buffer = await selectedFile.arrayBuffer();

      const response = await fetch("/api/fundraising/bulk-scan", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/octet-stream",
          "X-File-Name": encodeURIComponent(selectedFile.name),
        },
        body: buffer,
        signal: abortControllerRef.current.signal,
      });

      if (response.status === 401) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("session_id");
        toast.error("Session expired. Please log in again.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setScanResult(data.scanResult);
        setUploadState({
          status: "scanned",
          currentStep: "File scanned successfully",
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
        });

        const initialExpand = {};
        data.scanResult.sheets.forEach((sheet, index) => {
          initialExpand[sheet.name] = index === 0;
        });
        setExpandedSheets(initialExpand);

        toast.success(
          <div className="flex items-center">
            <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
            <span>
              Found {data.scanResult.totalRows.toLocaleString()} donors in{" "}
              {data.scanResult.sheets.length} sheets
            </span>
          </div>,
          { id: toastId },
        );
      } else {
        throw new Error(data.message || "Scan failed");
      }
    } catch (error) {
      if (error.name === "AbortError") {
        toast.success("Scan cancelled", { id: toastId });
        return;
      }

      console.error("Scan error:", error);
      setUploadState({
        status: "error",
        currentStep: "Scan failed: " + error.message,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
      });
      toast.error(error.message || "Failed to scan file", { id: toastId });
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleProcessFile = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to process");
      return;
    }

    abortControllerRef.current = new AbortController();

    setUploadState({
      status: "processing",
      currentStep: "Starting import...",
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
    });

    setProcessingProgress((prev) => ({
      ...prev,
      total: scanResult?.totalRows || 0,
      current: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      sheetProgress: {},
    }));

    const toastId = toast.loading("Processing donors...");

    try {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const buffer = await selectedFile.arrayBuffer();

      const response = await fetch("/api/fundraising/bulk-process", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/octet-stream",
          "X-File-Name": encodeURIComponent(selectedFile.name),
          "X-Import-Month": importMetadata.month.toString(),
          "X-Import-Year": importMetadata.year.toString(),
        },
        body: buffer,
        signal: abortControllerRef.current.signal,
      });

      if (response.status === 401) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("session_id");
        toast.error("Session expired. Please log in again.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
        return;
      }

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(
            errorData.message ||
              `Process failed with status ${response.status}`,
          );
        } catch {
          throw new Error(`Process failed with status ${response.status}`);
        }
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(5));
              handleProgressUpdate(data);
            } catch (e) {
              console.error("Failed to parse progress data:", e);
            }
          }
        }
      }

      setUploadState({
        status: "completed",
        currentStep: "Import completed",
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
      });

      toast.success(
        <div className="flex items-center">
          <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
          <span>
            Successfully imported {processingProgress.successful} donors for{" "}
            {months.find((m) => m.value === importMetadata.month)?.label}{" "}
            {importMetadata.year}!
          </span>
        </div>,
        { id: toastId },
      );
      onSuccess?.();
    } catch (error) {
      if (error.name === "AbortError") {
        toast.success("Import cancelled", { id: toastId });
        resetForm();
        return;
      }

      console.error("Process error:", error);
      setUploadState({
        status: "error",
        currentStep: "Import failed: " + error.message,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
      });
      toast.error(error.message || "Failed to process file", { id: toastId });
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleProgressUpdate = (data) => {
    setProcessingProgress((prev) => {
      const newProgress = { ...prev };

      switch (data.type) {
        case "sheet_start":
          newProgress.currentStep = `Processing sheet: ${data.sheetName}`;
          newProgress.sheetProgress[data.sheetName] = {
            total: data.totalRows,
            processed: 0,
            successful: 0,
            failed: 0,
            skipped: 0,
          };
          break;

        case "row_progress":
          newProgress.current = data.processed;
          newProgress.currentDonor = data.donor;

          if (data.sheetName && newProgress.sheetProgress[data.sheetName]) {
            newProgress.sheetProgress[data.sheetName].processed =
              data.sheetProcessed;
            newProgress.sheetProgress[data.sheetName].successful =
              data.sheetSuccessful;
            newProgress.sheetProgress[data.sheetName].failed = data.sheetFailed;
            newProgress.sheetProgress[data.sheetName].skipped =
              data.sheetSkipped;
          }

          newProgress.successful = data.totalSuccessful;
          newProgress.failed = data.totalFailed;
          newProgress.skipped = data.totalSkipped;

          if (data.error) {
            newProgress.errors.push({
              row: data.rowNumber,
              sheet: data.sheetName,
              donor: data.donor,
              error: data.error,
            });
          }
          break;

        case "sheet_complete":
          newProgress.currentStep = `Completed sheet: ${data.sheetName}`;
          break;

        case "complete":
          newProgress.currentStep = "Import complete!";
          break;
      }

      return newProgress;
    });
  };

  const resetForm = () => {
    setSelectedFile(null);
    setScanResult(null);
    setUploadState({
      status: "idle",
      currentStep: "",
      fileName: "",
      fileSize: 0,
    });
    setProcessingProgress({
      current: 0,
      total: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      currentDonor: null,
      errors: [],
      sheetProgress: {},
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsCancelling(false);
    setShowPreview(false);
    setSelectedSheet(null);
  };

  const handleClose = () => {
    if (
      uploadState.status === "scanning" ||
      uploadState.status === "processing"
    ) {
      if (
        window.confirm("Are you sure you want to cancel the current operation?")
      ) {
        handleCancel();
      }
    } else {
      resetForm();
      onClose();
    }
  };

  const toggleSheetExpand = (sheetName) => {
    setExpandedSheets((prev) => ({
      ...prev,
      [sheetName]: !prev[sheetName],
    }));
  };

  const viewSheetPreview = (sheet) => {
    setSelectedSheet(sheet);
    setShowPreview(true);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getProgressPercentage = () => {
    if (processingProgress.total === 0) return 0;
    return Math.round(
      (processingProgress.current / processingProgress.total) * 100,
    );
  };

  const getSheetProgressPercentage = (sheet) => {
    const progress = processingProgress.sheetProgress[sheet];
    if (!progress || progress.total === 0) return 0;
    return Math.round((progress.processed / progress.total) * 100);
  };

  const downloadErrorReport = () => {
    if (processingProgress.errors.length === 0) return;

    const headers = [
      "Sheet",
      "Row",
      "First Name",
      "Last Name",
      "Phone",
      "Pledge Amount",
      "Error",
    ];
    const rows = processingProgress.errors.map((e) => [
      e.sheet,
      e.row,
      e.donor?.firstName || "",
      e.donor?.lastName || "",
      e.donor?.phone || "",
      e.donor?.pledgeAmount || "",
      e.error,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-errors-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getCategoryColor = (category) => {
    const colors = {
      under_25: "bg-gray-100 text-gray-800",
      "25_to_50": "bg-blue-100 text-blue-800",
      "50_to_100": "bg-green-100 text-green-800",
      "100_to_150": "bg-yellow-100 text-yellow-800",
      "150_to_200": "bg-orange-100 text-orange-800",
      "200_to_250": "bg-purple-100 text-purple-800",
      "250_to_500": "bg-pink-100 text-pink-800",
      "500_to_1000": "bg-indigo-100 text-indigo-800",
      over_1000: "bg-red-100 text-red-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const getPartyColor = (party) => {
    const colors = {
      democrat: "bg-blue-100 text-blue-800",
      republican: "bg-red-100 text-red-800",
      independent: "bg-purple-100 text-purple-800",
      unknown: "bg-gray-100 text-gray-800",
    };
    return colors[party] || "bg-gray-100 text-gray-800";
  };

  const getCountyDisplay = (county) => {
    const counties = {
      dade: "Dade County",
      broward: "Broward County",
      palm_beach: "Palm Beach County",
      orange: "Orange County",
      hillsborough: "Hillsborough County",
      other: "Other County",
    };
    return counties[county] || county;
  };

  const getCategoryDisplay = (category) => {
    const categories = {
      under_25: "$1 - $25",
      "25_to_50": "$25 - $50",
      "50_to_100": "$50 - $100",
      "100_to_150": "$100 - $150",
      "150_to_200": "$150 - $200",
      "200_to_250": "$200 - $250",
      "250_to_500": "$250 - $500",
      "500_to_1000": "$500 - $1000",
      over_1000: "Over $1000",
    };
    return categories[category] || category;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Import Donors"
      size="4xl"
      disableClose={isCancelling}
    >
      <div className="space-y-6">
        {selectedFile &&
          uploadState.status !== "processing" &&
          uploadState.status !== "completed" && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200">
              <div className="flex items-start">
                <div className="bg-purple-500 rounded-lg p-2 mr-4">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-purple-900 mb-3">
                    Select Import Period
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-purple-700 mb-1">
                        Month
                      </label>
                      <select
                        value={importMetadata.month}
                        onChange={(e) =>
                          setImportMetadata((prev) => ({
                            ...prev,
                            month: parseInt(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        {months.map((month) => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-purple-700 mb-1">
                        Year
                      </label>
                      <select
                        value={importMetadata.year}
                        onChange={(e) =>
                          setImportMetadata((prev) => ({
                            ...prev,
                            year: parseInt(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        {availableYears.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-purple-600 mt-2">
                    These donors will be tagged as imported for{" "}
                    {
                      months.find((m) => m.value === importMetadata.month)
                        ?.label
                    }{" "}
                    {importMetadata.year}
                  </p>
                </div>
              </div>
            </div>
          )}

        {(uploadState.status === "scanned" ||
          uploadState.status === "processing" ||
          uploadState.status === "completed") &&
          scanResult && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center">
                  <div className="bg-blue-500 rounded-lg p-2 mr-3">
                    <FileSpreadsheet className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-medium">
                      Total Sheets
                    </p>
                    <p className="text-xl font-bold text-blue-900">
                      {scanResult.sheets.length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="flex items-center">
                  <div className="bg-green-500 rounded-lg p-2 mr-3">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-green-600 font-medium">
                      Total Donors
                    </p>
                    <p className="text-xl font-bold text-green-900">
                      {scanResult.totalRows.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center">
                  <div className="bg-purple-500 rounded-lg p-2 mr-3">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 font-medium">
                      Valid Rows
                    </p>
                    <p className="text-xl font-bold text-purple-900">
                      {scanResult.validRows.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
                <div className="flex items-center">
                  <div className="bg-amber-500 rounded-lg p-2 mr-3">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-amber-600 font-medium">
                      Issues Found
                    </p>
                    <p className="text-xl font-bold text-amber-900">
                      {scanResult.sheets.reduce(
                        (acc, sheet) => acc + sheet.invalidRows,
                        0,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        <div
          className={
            uploadState.status !== "idle" && uploadState.status !== "scanned"
              ? "opacity-50 pointer-events-none"
              : ""
          }
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Step 1: Select Excel/CSV File
          </label>
          <div
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-all ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-2 text-center">
              <div
                className={`p-3 rounded-full inline-flex mx-auto ${
                  dragActive ? "bg-blue-100" : "bg-gray-100"
                }`}
              >
                <Upload
                  className={`h-8 w-8 ${
                    dragActive ? "text-blue-600" : "text-gray-500"
                  }`}
                />
              </div>
              <div className="flex text-sm text-gray-600 justify-center">
                <label
                  htmlFor="bulk-file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 px-3 py-1 border border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  <span>Choose a file</span>
                  <input
                    id="bulk-file-upload"
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept=".xlsx,.xls,.csv"
                    disabled={
                      uploadState.status === "scanning" ||
                      uploadState.status === "processing" ||
                      isCancelling
                    }
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                Excel files (.xlsx, .xls) or CSV up to 200MB
              </p>
            </div>
          </div>

          {selectedFile && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-blue-500 rounded-lg p-2 mr-3">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-800">
                      {selectedFile.name}
                    </span>
                    <div className="flex items-center mt-1">
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        {formatFileSize(selectedFile.size)}
                      </span>
                      {uploadState.status === "idle" && (
                        <span className="text-xs text-gray-500 ml-2">
                          Ready to scan
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {(uploadState.status === "idle" ||
                  uploadState.status === "scanned") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setScanResult(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {selectedFile && uploadState.status === "idle" && (
          <div className="flex justify-end">
            <button
              onClick={handleScanFile}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 border border-transparent rounded-xl text-sm font-medium text-white hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 inline-flex items-center shadow-lg shadow-blue-200"
            >
              <FileText className="h-4 w-4 mr-2" />
              Scan File
            </button>
          </div>
        )}

        {uploadState.status === "scanning" && (
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative">
                  <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                  </div>
                </div>
                <div className="ml-3">
                  <span className="text-sm font-medium text-blue-800">
                    {uploadState.currentStep}
                  </span>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Please wait while we analyze your file...
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="px-4 py-2 bg-white text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 border border-red-200 disabled:opacity-50 transition-colors"
              >
                {isCancelling ? (
                  <span className="flex items-center">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Cancelling...
                  </span>
                ) : (
                  "Cancel"
                )}
              </button>
            </div>
          </div>
        )}

        {scanResult && uploadState.status === "scanned" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="bg-green-100 rounded-lg p-2 mr-3">
                    <Database className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Donors</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {scanResult.totalRows}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="bg-purple-100 rounded-lg p-2 mr-3">
                    <Layers className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Categories Found</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {
                        Object.keys(
                          scanResult.sheets[0]?.categoryBreakdown || {},
                        ).filter(
                          (k) => scanResult.sheets[0]?.categoryBreakdown[k] > 0,
                        ).length
                      }
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="bg-amber-100 rounded-lg p-2 mr-3">
                    <MapPin className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Counties</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {
                        Object.keys(scanResult.sheets[0]?.countyBreakdown || {})
                          .length
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <h4 className="text-sm font-semibold text-gray-700">
                Sheet Details
              </h4>
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "grid"
                      ? "bg-white shadow-sm"
                      : "hover:bg-gray-200"
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "list"
                      ? "bg-white shadow-sm"
                      : "hover:bg-gray-200"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div
              className={`space-y-3 max-h-96 overflow-y-auto pr-1 ${
                viewMode === "grid" ? "grid grid-cols-2 gap-3" : ""
              }`}
            >
              {scanResult.sheets.map((sheet) => (
                <div
                  key={sheet.name}
                  className={`bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all ${
                    viewMode === "grid" ? "" : ""
                  }`}
                >
                  <button
                    onClick={() => toggleSheetExpand(sheet.name)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center">
                      <div
                        className={`p-2 rounded-lg mr-3 ${
                          sheet.validRows === sheet.rowCount
                            ? "bg-green-100"
                            : sheet.invalidRows > 0
                              ? "bg-amber-100"
                              : "bg-gray-100"
                        }`}
                      >
                        <FileSpreadsheet
                          className={`h-5 w-5 ${
                            sheet.validRows === sheet.rowCount
                              ? "text-green-600"
                              : sheet.invalidRows > 0
                                ? "text-amber-600"
                                : "text-gray-600"
                          }`}
                        />
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-semibold text-gray-900">
                          {sheet.name}
                        </span>
                        <div className="flex items-center mt-1 space-x-2">
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                            {sheet.rowCount} rows
                          </span>
                          {sheet.validRows > 0 && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                              {sheet.validRows} valid
                            </span>
                          )}
                          {sheet.invalidRows > 0 && (
                            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                              {sheet.invalidRows} issues
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewSheetPreview(sheet);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Preview sheet"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {expandedSheets[sheet.name] ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {expandedSheets[sheet.name] && (
                    <div className="px-5 pb-5 pt-2 border-t border-gray-100">
                      {sheet.detectedColumns && (
                        <div className="mb-4">
                          <h6 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Detected Columns
                          </h6>
                          <div className="grid grid-cols-3 gap-2">
                            {Object.entries(sheet.detectedColumns).map(
                              ([key, value]) => {
                                if (key === "phone" || key === "email") {
                                  return value.length > 0 ? (
                                    <div
                                      key={key}
                                      className="flex items-center text-xs"
                                    >
                                      <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                                      <span className="text-gray-600 capitalize">
                                        {key}
                                      </span>
                                      <span className="ml-1 text-gray-400">
                                        ({value.length})
                                      </span>
                                    </div>
                                  ) : null;
                                }
                                return value && value.index !== -1 ? (
                                  <div
                                    key={key}
                                    className="flex items-center text-xs"
                                  >
                                    <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                                    <span className="text-gray-600 capitalize">
                                      {key}
                                    </span>
                                  </div>
                                ) : null;
                              },
                            )}
                          </div>
                        </div>
                      )}

                      {sheet.categoryBreakdown &&
                        Object.keys(sheet.categoryBreakdown).filter(
                          (k) => sheet.categoryBreakdown[k] > 0,
                        ).length > 0 && (
                          <div className="mb-4">
                            <h6 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                              Donation Categories
                            </h6>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(sheet.categoryBreakdown).map(
                                ([cat, count]) =>
                                  count > 0 && (
                                    <span
                                      key={cat}
                                      className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(cat)}`}
                                    >
                                      {getCategoryDisplay(cat)}: {count}
                                    </span>
                                  ),
                              )}
                            </div>
                          </div>
                        )}

                      {sheet.countyBreakdown &&
                        Object.keys(sheet.countyBreakdown).length > 0 && (
                          <div className="mb-4">
                            <h6 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                              Counties
                            </h6>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(sheet.countyBreakdown).map(
                                ([county, count]) => (
                                  <span
                                    key={county}
                                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                  >
                                    {getCountyDisplay(county)}: {count}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {sheet.partyBreakdown &&
                        Object.keys(sheet.partyBreakdown).filter(
                          (k) => sheet.partyBreakdown[k] > 0,
                        ).length > 0 && (
                          <div className="mb-4">
                            <h6 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                              Party Affiliation
                            </h6>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(sheet.partyBreakdown).map(
                                ([party, count]) =>
                                  count > 0 && (
                                    <span
                                      key={party}
                                      className={`px-2 py-1 text-xs rounded-full ${getPartyColor(party)}`}
                                    >
                                      {party}: {count}
                                    </span>
                                  ),
                              )}
                            </div>
                          </div>
                        )}

                      {sheet.errors && sheet.errors.length > 0 && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex items-center mb-2">
                            <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                            <span className="text-xs font-medium text-red-800">
                              Issues ({sheet.errors.length})
                            </span>
                          </div>
                          <ul className="space-y-1">
                            {sheet.errors.slice(0, 3).map((error, idx) => (
                              <li
                                key={idx}
                                className="text-xs text-red-700 flex items-start"
                              >
                                <span className="mr-1">•</span>
                                {error}
                              </li>
                            ))}
                            {sheet.errors.length > 3 && (
                              <li className="text-xs text-gray-500">
                                ... and {sheet.errors.length - 3} more issues
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setScanResult(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Choose Different File
              </button>
              <button
                onClick={handleProcessFile}
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 border border-transparent rounded-xl text-sm font-medium text-white hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 inline-flex items-center shadow-lg shadow-green-200"
              >
                <Upload className="h-4 w-4 mr-2" />
                Start Import (
                {
                  months.find((m) => m.value === importMetadata.month)?.label
                }{" "}
                {importMetadata.year})
              </button>
            </div>
          </div>
        )}

        {uploadState.status === "processing" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-blue-100 rounded-lg p-2 mr-3">
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      {uploadState.currentStep}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Processing donors for{" "}
                      {
                        months.find((m) => m.value === importMetadata.month)
                          ?.label
                      }{" "}
                      {importMetadata.year}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-2xl font-bold text-blue-600">
                    {getProgressPercentage()}%
                  </span>
                  <button
                    onClick={handleCancel}
                    disabled={isCancelling}
                    className="px-4 py-2 bg-white text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 border border-red-200 disabled:opacity-50 transition-colors"
                  >
                    {isCancelling ? (
                      <span className="flex items-center">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Cancelling...
                      </span>
                    ) : (
                      "Cancel Import"
                    )}
                  </button>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 relative"
                  style={{ width: `${getProgressPercentage()}%` }}
                >
                  <div className="absolute right-0 top-0 h-3 w-3 bg-white rounded-full shadow-lg"></div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500">Processed</div>
                  <div className="text-xl font-bold text-gray-900">
                    {processingProgress.current.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">
                    of {processingProgress.total.toLocaleString()}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-green-600">Successful</div>
                  <div className="text-xl font-bold text-green-700">
                    {processingProgress.successful.toLocaleString()}
                  </div>
                  <CheckCircle2 className="h-3 w-3 text-green-500 mx-auto mt-1" />
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-red-600">Failed</div>
                  <div className="text-xl font-bold text-red-700">
                    {processingProgress.failed.toLocaleString()}
                  </div>
                  <XCircle className="h-3 w-3 text-red-500 mx-auto mt-1" />
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-amber-600">Skipped</div>
                  <div className="text-xl font-bold text-amber-700">
                    {processingProgress.skipped.toLocaleString()}
                  </div>
                  <AlertTriangle className="h-3 w-3 text-amber-500 mx-auto mt-1" />
                </div>
              </div>

              {processingProgress.currentDonor && (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center text-xs text-blue-600">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>Currently processing</span>
                    </div>
                    <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                      Row {processingProgress.current}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="bg-blue-500 rounded-lg p-2 mr-3">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {processingProgress.currentDonor.firstName}{" "}
                        {processingProgress.currentDonor.lastName}
                      </p>
                      <div className="flex items-center mt-1 space-x-3">
                        {processingProgress.currentDonor.pledgeAmount && (
                          <span className="text-xs flex items-center text-gray-600">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {processingProgress.currentDonor.pledgeAmount.toLocaleString()}
                          </span>
                        )}
                        {processingProgress.currentDonor.phone && (
                          <span className="text-xs flex items-center text-gray-600">
                            <Phone className="h-3 w-3 mr-1" />
                            {processingProgress.currentDonor.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {scanResult && scanResult.sheets.length > 0 && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                <h5 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <Layers className="h-4 w-4 mr-2 text-gray-500" />
                  Sheet Progress
                </h5>
                <div className="space-y-4">
                  {scanResult.sheets.map((sheet) => {
                    const progress = processingProgress.sheetProgress[
                      sheet.name
                    ] || {
                      total: sheet.rowCount,
                      processed: 0,
                      successful: 0,
                      failed: 0,
                      skipped: 0,
                    };
                    const percentage = getSheetProgressPercentage(sheet.name);

                    return (
                      <div key={sheet.name}>
                        <div className="flex justify-between items-center mb-1">
                          <div>
                            <span className="text-sm font-medium text-gray-700">
                              {sheet.name}
                            </span>
                            <span className="ml-2 text-xs text-gray-500">
                              {progress.processed}/{progress.total} rows
                            </span>
                          </div>
                          <div className="flex space-x-3 text-xs">
                            <span className="text-green-600 flex items-center">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {progress.successful}
                            </span>
                            <span className="text-red-600 flex items-center">
                              <XCircle className="h-3 w-3 mr-1" />
                              {progress.failed}
                            </span>
                            <span className="text-amber-600 flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {progress.skipped}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {processingProgress.errors.length > 0 && (
              <div className="bg-red-50 rounded-xl border border-red-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                    <h5 className="text-sm font-semibold text-red-800">
                      Errors ({processingProgress.errors.length})
                    </h5>
                  </div>
                  <button
                    onClick={downloadErrorReport}
                    className="text-xs text-red-600 hover:text-red-800 flex items-center"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download Report
                  </button>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {processingProgress.errors.slice(-5).map((error, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-white p-2 rounded-lg border border-red-100"
                    >
                      <span className="font-medium text-red-700">
                        {error.sheet} - Row {error.row}:
                      </span>{" "}
                      <span className="text-gray-600">{error.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {uploadState.status === "completed" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 rounded-full p-4">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-2">
                Import Complete!
              </h4>
              <p className="text-sm text-gray-600 mb-6">
                Successfully processed {processingProgress.total} donors for{" "}
                {months.find((m) => m.value === importMetadata.month)?.label}{" "}
                {importMetadata.year}
              </p>

              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="text-2xl font-bold text-green-600">
                    {processingProgress.successful}
                  </div>
                  <div className="text-xs text-gray-500">Successful</div>
                  <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto mt-2" />
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="text-2xl font-bold text-red-600">
                    {processingProgress.failed}
                  </div>
                  <div className="text-xs text-gray-500">Failed</div>
                  <XCircle className="h-4 w-4 text-red-500 mx-auto mt-2" />
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="text-2xl font-bold text-amber-600">
                    {processingProgress.skipped}
                  </div>
                  <div className="text-xs text-gray-500">Skipped</div>
                  <AlertTriangle className="h-4 w-4 text-amber-500 mx-auto mt-2" />
                </div>
              </div>

              {processingProgress.errors.length > 0 && (
                <div className="mt-6">
                  <button
                    onClick={downloadErrorReport}
                    className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center px-4 py-2 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download error report ({
                      processingProgress.errors.length
                    }{" "}
                    errors)
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="bg-purple-100 rounded-lg p-2 mr-3">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Success Rate</p>
                    <p className="text-xl font-bold text-gray-900">
                      {Math.round(
                        (processingProgress.successful /
                          processingProgress.total) *
                          100,
                      )}
                      %
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="bg-indigo-100 rounded-lg p-2 mr-3">
                    <Clock className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Processing Time</p>
                    <p className="text-xl font-bold text-gray-900">
                      {Math.round(processingProgress.total / 10)}s
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {uploadState.status === "error" && (
          <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 rounded-full p-4">
                <AlertCircle className="h-12 w-12 text-red-600" />
              </div>
            </div>
            <h4 className="text-xl font-bold text-red-800 mb-2">
              Import Failed
            </h4>
            <p className="text-sm text-red-600 mb-6">
              {uploadState.currentStep || "An error occurred during import"}
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={resetForm}
                className="px-6 py-2.5 bg-red-600 border border-transparent rounded-xl text-sm font-medium text-white hover:bg-red-700"
              >
                Try Again
              </button>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {showPreview && selectedSheet && (
          <Modal
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            title={`Preview: ${selectedSheet.name}`}
            size="lg"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Total Rows</p>
                  <p className="text-lg font-bold">{selectedSheet.rowCount}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-600">Valid Rows</p>
                  <p className="text-lg font-bold text-green-700">
                    {selectedSheet.validRows}
                  </p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-xs text-amber-600">Invalid Rows</p>
                  <p className="text-lg font-bold text-amber-700">
                    {selectedSheet.invalidRows}
                  </p>
                </div>
              </div>

              {selectedSheet.detectedColumns && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Detected Columns
                  </h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(selectedSheet.detectedColumns).map(
                      ([key, value]) => {
                        if (key === "phone" || key === "email") {
                          return value.length > 0 ? (
                            <div key={key} className="flex items-center">
                              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                              <span className="capitalize">{key}</span>
                              <span className="ml-1 text-gray-500">
                                ({value.length} columns)
                              </span>
                            </div>
                          ) : null;
                        }
                        return value && value.index !== -1 ? (
                          <div key={key} className="flex items-center">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                            <span className="capitalize">{key}</span>
                          </div>
                        ) : null;
                      },
                    )}
                  </div>
                </div>
              )}

              {selectedSheet.categoryBreakdown && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Donation Categories
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedSheet.categoryBreakdown).map(
                      ([cat, count]) =>
                        count > 0 && (
                          <div
                            key={cat}
                            className="flex justify-between items-center p-2 bg-gray-50 rounded"
                          >
                            <span className="text-sm">
                              {getCategoryDisplay(cat)}
                            </span>
                            <span className="font-bold">{count}</span>
                          </div>
                        ),
                    )}
                  </div>
                </div>
              )}

              {selectedSheet.errors && selectedSheet.errors.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-red-700 mb-2">
                    Issues Found
                  </h5>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {selectedSheet.errors.map((error, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-red-600 p-2 bg-red-50 rounded"
                      >
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}

        {uploadState.status === "idle" && !selectedFile && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-start">
              <div className="bg-blue-500 rounded-lg p-2 mr-4">
                <Info className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-3">
                  File Format Instructions
                </h4>
                <ul className="text-xs text-blue-800 space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Each sheet should be named appropriately</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Required columns: First Name, Last Name, Telephone Number
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Recommended columns: County, Party, Historical Donation
                      Amount
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      The system will automatically categorize donors by amount
                      ranges
                    </span>
                  </li>
                </ul>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <span className="text-xs px-2 py-1 bg-white rounded-full text-center">
                    $1 - $25
                  </span>
                  <span className="text-xs px-2 py-1 bg-white rounded-full text-center">
                    $25 - $50
                  </span>
                  <span className="text-xs px-2 py-1 bg-white rounded-full text-center">
                    $50 - $100
                  </span>
                  <span className="text-xs px-2 py-1 bg-white rounded-full text-center">
                    $100 - $150
                  </span>
                  <span className="text-xs px-2 py-1 bg-white rounded-full text-center">
                    $150 - $200
                  </span>
                  <span className="text-xs px-2 py-1 bg-white rounded-full text-center">
                    $200 - $250
                  </span>
                  <span className="text-xs px-2 py-1 bg-white rounded-full text-center">
                    $250 - $500
                  </span>
                  <span className="text-xs px-2 py-1 bg-white rounded-full text-center">
                    $500 - $1000
                  </span>
                  <span className="text-xs px-2 py-1 bg-white rounded-full text-center">
                    Over $1000
                  </span>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-800 font-medium mb-2">
                    Important: Select the month and year for this import above
                  </p>
                  <p className="text-xs text-yellow-700">
                    All donors will be tagged with the selected month/year for
                    easy filtering later. You will be able to filter and export
                    donors by month and year.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            disabled={isCancelling}
          >
            {uploadState.status === "scanning" ||
            uploadState.status === "processing"
              ? "Cancel Operation"
              : uploadState.status === "completed"
                ? "Close"
                : "Cancel"}
          </button>

          {uploadState.status === "completed" && (
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
                onSuccess?.();
              }}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 border border-transparent rounded-xl text-sm font-medium text-white hover:from-green-700 hover:to-green-800"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default BulkUploadModal;
