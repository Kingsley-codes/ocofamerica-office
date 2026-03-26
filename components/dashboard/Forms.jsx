/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Upload,
  Download,
  Search,
  Trash,
  Eye,
  X,
  Loader2,
  Check,
  AlertCircle,
  Calendar,
  User,
  File,
  Folder,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatDate, formatFileSize } from "@/lib/utils";
import Modal from "../ui/Modal";
import { apiRequest } from "@/lib/auth";
import toast from "react-hot-toast";

const UPLOAD_ALLOWED_ROLES = ["admin", "manager"];

const Forms = ({ user }) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forms, setForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });
  const [expandedForm, setExpandedForm] = useState(null);

  const [uploadProgress, setUploadProgress] = useState({
    isUploading: false,
    progress: 0,
    fileName: "",
    status: "",
  });

  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    category: "volunteer",
    version: "1.0",
    file: null,
  });

  const fileInputRef = useRef(null);

  const formCategories = [
    { value: "volunteer", label: "Volunteer Forms" },
    { value: "staff", label: "Staff Forms" },
    { value: "contractor", label: "Contractor Forms" },
    { value: "compliance", label: "Compliance" },
    { value: "finance", label: "Finance" },
    { value: "field", label: "Field Operations" },
    { value: "legal", label: "Legal" },
    { value: "other", label: "Other" },
  ];

  const canUpload = UPLOAD_ALLOWED_ROLES.includes(user?.role);

  useEffect(() => {
    fetchForms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchForms = async (
    page = 1,
    category = selectedCategory,
    search = searchTerm,
  ) => {
    try {
      setIsLoading(true);
      let url = `/forms?page=${page}&limit=20`;
      if (category !== "all") url += `&category=${category}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const response = await apiRequest(url);
      if (response.success) {
        setForms(response.forms);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error("Error fetching forms:", error);
      toast.error("Failed to load forms");
    } finally {
      setIsLoading(false);
    }
  };

  const uploadToCloudinary = async (file) => {
    const cloudName = "webofzander";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "adcn_upload_preset");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Cloudinary error:", errorText);
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
  };

  const handleDownload = async (form) => {
    const toastId = toast.loading("Preparing download...");

    try {
      // Fetch the file as blob
      const response = await fetch(form.fileUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`);
      }

      const blob = await response.blob();

      // Create a blob URL
      const blobUrl = window.URL.createObjectURL(blob);

      // Get filename from form data or generate from title
      let fileName = form.fileName;
      if (!fileName) {
        const extension = form.fileUrl.split(".").pop()?.split("?")[0] || "pdf";
        fileName = `${form.title.replace(/\s+/g, "_")}.${extension}`;
      }

      // Create temporary anchor element
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      link.style.display = "none";

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);

      // Record download in backend
      apiRequest(`/forms/${form._id}/download`, {
        method: "POST",
      }).catch((err) => console.error("Failed to record download:", err));

      toast.success("Download started", { id: toastId });
    } catch (error) {
      console.error("Download error:", error);

      // Fallback: Try direct download with anchor tag
      try {
        const link = document.createElement("a");
        link.href = form.fileUrl;
        link.download =
          form.fileName || `${form.title.replace(/\s+/g, "_")}.pdf`;
        link.target = "_blank";
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Download started", { id: toastId });
      } catch (fallbackError) {
        // Last resort: open in new tab
        window.open(form.fileUrl, "_blank");
        toast.success("Opening in new tab - use browser's save option", {
          id: toastId,
        });
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) {
      toast.error("Please select a file to upload");
      return;
    }

    if (!uploadForm.title) {
      toast.error("Please enter a form title");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress({
      isUploading: true,
      progress: 0,
      fileName: uploadForm.file.name,
      status: "uploading",
    });

    const toastId = toast.loading("Uploading form...");

    try {
      const file = uploadForm.file;

      setUploadProgress((prev) => ({
        ...prev,
        progress: 30,
        status: "uploading",
      }));

      const cloudinaryResult = await uploadToCloudinary(file);

      setUploadProgress((prev) => ({
        ...prev,
        progress: 60,
        status: "processing",
      }));

      toast.loading("Saving form to database...", { id: toastId });

      const formData = {
        title: uploadForm.title,
        description: uploadForm.description,
        category: uploadForm.category,
        version: uploadForm.version,
        fileName: file.name,
        fileUrl: cloudinaryResult.secure_url || cloudinaryResult.url,
        cloudinaryPublicId: cloudinaryResult.public_id,
        fileSize: file.size,
        mimeType: file.type,
        uploadedBy: user._id,
        resourceType: cloudinaryResult.resource_type,
      };

      const response = await apiRequest("/forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.success) {
        setUploadProgress((prev) => ({
          ...prev,
          progress: 100,
          status: "completed",
        }));

        toast.success("Form uploaded successfully!", { id: toastId });

        setTimeout(() => {
          setShowUploadModal(false);
          resetUploadForm();
          setUploadProgress({
            isUploading: false,
            progress: 0,
            fileName: "",
            status: "",
          });
          fetchForms();
        }, 2000);
      } else {
        throw new Error(response.message || "Failed to save form to database");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadProgress((prev) => ({
        ...prev,
        progress: 100,
        status: "error",
      }));

      toast.error(error.message || "Failed to upload form", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (form) => {
    if (!confirm(`Are you sure you want to delete "${form.title}"?`)) {
      return;
    }

    const toastId = toast.loading("Deleting form...");

    try {
      const response = await apiRequest(`/forms/${form._id}`, {
        method: "DELETE",
      });

      if (response.success) {
        fetchForms();
        toast.success("Form deleted successfully!", { id: toastId });
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete form", { id: toastId });
    }
  };

  const handlePreview = (form) => {
    setSelectedForm(form);
    setShowPreviewModal(true);
  };

  const resetUploadForm = () => {
    setUploadForm({
      title: "",
      description: "",
      category: "volunteer",
      version: "1.0",
      file: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (selectedFile) {
      const maxSize = 20 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        toast.error("File size exceeds 20MB limit");
        return;
      }

      const allowedExtensions = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i;
      if (!allowedExtensions.test(selectedFile.name)) {
        toast.error(
          "Invalid file type. Please upload PDF, DOC, XLS, PPT, or TXT files.",
        );
        return;
      }

      setUploadForm((prev) => ({
        ...prev,
        file: selectedFile,
        title: prev.title || selectedFile.name.replace(/\.[^/.]+$/, ""),
      }));

      toast.success(`File selected: ${selectedFile.name}`);
    }
  };

  const getFileIcon = (mimeType, fileName) => {
    const extension = fileName?.split(".").pop()?.toLowerCase();

    if (extension === "pdf") {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else if (extension === "doc" || extension === "docx") {
      return <FileText className="h-8 w-8 text-blue-500" />;
    } else if (extension === "xls" || extension === "xlsx") {
      return <FileText className="h-8 w-8 text-green-500" />;
    } else if (extension === "ppt" || extension === "pptx") {
      return <FileText className="h-8 w-8 text-orange-500" />;
    } else if (extension === "txt") {
      return <FileText className="h-8 w-8 text-gray-500" />;
    } else {
      return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const UploadProgressDisplay = () => {
    if (!uploadProgress.isUploading) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <Upload className="h-5 w-5 text-blue-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">
              {uploadProgress.fileName}
            </span>
          </div>
          <span className="text-sm text-gray-500">
            {uploadProgress.progress}%
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              uploadProgress.status === "completed"
                ? "bg-green-500"
                : uploadProgress.status === "error"
                  ? "bg-red-500"
                  : "bg-blue-500"
            }`}
            style={{ width: `${uploadProgress.progress}%` }}
          ></div>
        </div>

        <div className="text-xs text-gray-600">
          <span
            className={
              uploadProgress.status === "completed"
                ? "text-green-600"
                : uploadProgress.status === "error"
                  ? "text-red-600"
                  : "text-blue-600"
            }
          >
            {uploadProgress.status === "uploading" &&
              "Uploading to Cloudinary..."}
            {uploadProgress.status === "processing" && "Saving to database..."}
            {uploadProgress.status === "completed" && "Upload completed!"}
            {uploadProgress.status === "error" && "Upload failed"}
          </span>
        </div>
      </div>
    );
  };

  const toggleExpand = (formId) => {
    setExpandedForm(expandedForm === formId ? null : formId);
  };

  if (isLoading && forms.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Forms Library</h3>
          <p className="text-sm text-gray-600">
            Download campaign forms, agreements, and documents
          </p>
        </div>
        {canUpload && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary inline-flex items-center"
            disabled={uploadProgress.isUploading}
          >
            {uploadProgress.isUploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Upload Form
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="relative flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="search"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Search forms by title or description..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                fetchForms(1, selectedCategory, e.target.value);
              }}
            />
          </div>
          <div className="flex space-x-3">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                fetchForms(1, e.target.value, searchTerm);
              }}
              className="block w-full sm:w-48 pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            >
              <option value="all">All Categories</option>
              {formCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <UploadProgressDisplay />

      {forms.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <FileText className="h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No forms found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {canUpload
              ? "Get started by uploading your first form."
              : "No forms have been uploaded yet."}
          </p>
          {canUpload && (
            <div className="mt-6">
              <button
                onClick={() => setShowUploadModal(true)}
                className="btn-primary inline-flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Form
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {forms.map((form) => (
              <li key={form._id} className="hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="flex-shrink-0 mr-4">
                        {getFileIcon(form.mimeType, form.fileName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {form.title}
                          </h4>
                          {form.version && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              v{form.version}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span className="inline-flex items-center">
                            <Folder className="h-3 w-3 mr-1" />
                            {formCategories.find(
                              (c) => c.value === form.category,
                            )?.label || form.category}
                          </span>
                          <span className="inline-flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {form.uploadedBy?.firstName}{" "}
                            {form.uploadedBy?.lastName}
                          </span>
                          <span className="inline-flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(form.createdAt)}
                          </span>
                          <span className="inline-flex items-center">
                            <File className="h-3 w-3 mr-1" />
                            {formatFileSize(form.fileSize)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handlePreview(form)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(form)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      {canUpload && (
                        <button
                          onClick={() => handleDelete(form)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                          title="Delete"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => toggleExpand(form._id)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                      >
                        {expandedForm === form._id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {expandedForm === form._id && (
                    <div className="mt-4 pl-12 border-t border-gray-100 pt-4">
                      {form.description && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            Description:
                          </p>
                          <p className="text-sm text-gray-700">
                            {form.description}
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                          <p className="font-medium text-gray-500">File Name</p>
                          <p className="text-gray-700 truncate">
                            {form.fileName}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-500">Uploaded</p>
                          <p className="text-gray-700">
                            {formatDate(form.createdAt)}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-500">
                            Last Updated
                          </p>
                          <p className="text-gray-700">
                            {formatDate(form.updatedAt)}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-500">Downloads</p>
                          <p className="text-gray-700">
                            {form.downloadCount || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="bg-white px-6 py-4 border-t border-gray-200 rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{forms.length}</span> of{" "}
              <span className="font-medium">{pagination.total}</span> forms
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => fetchForms(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => fetchForms(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          if (!uploadProgress.isUploading) {
            setShowUploadModal(false);
            resetUploadForm();
          }
        }}
        title="Upload Form"
        size="lg"
        isSubmitting={isSubmitting || uploadProgress.isUploading}
        disableClose={uploadProgress.isUploading}
      >
        <form id="modal-form" onSubmit={handleUpload}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Form File *
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="form-file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="form-file-upload"
                        ref={fileInputRef}
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                        disabled={uploadProgress.isUploading}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, XLS, PPT, TXT up to 20MB
                  </p>
                </div>
              </div>

              {uploadForm.file && (
                <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700 truncate max-w-xs">
                        {uploadForm.file.name}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        ({formatFileSize(uploadForm.file.size)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadForm({ ...uploadForm, file: null });
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                      className="text-gray-400 hover:text-gray-600"
                      disabled={uploadProgress.isUploading}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Form Title *
              </label>
              <input
                type="text"
                required
                value={uploadForm.title}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Volunteer Agreement Form"
                disabled={uploadProgress.isUploading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={uploadForm.category}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={uploadProgress.isUploading}
                >
                  {formCategories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Version
                </label>
                <input
                  type="text"
                  value={uploadForm.version}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, version: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1.0"
                  disabled={uploadProgress.isUploading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={uploadForm.description}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, description: e.target.value })
                }
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of the form and its purpose"
                disabled={uploadProgress.isUploading}
              />
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Uploaded forms will be available for all
                campaign members to download.
                {canUpload &&
                  " Only admins and managers can upload and delete forms."}
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  if (!uploadProgress.isUploading) {
                    setShowUploadModal(false);
                    resetUploadForm();
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={uploadProgress.isUploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  !uploadForm.file ||
                  !uploadForm.title ||
                  isSubmitting ||
                  uploadProgress.isUploading
                }
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting || uploadProgress.isUploading ? (
                  <>
                    <Loader2 className="inline h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload Form"
                )}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={selectedForm?.title}
        size="xl"
        showFooter={false}
      >
        {selectedForm && (
          <div className="space-y-6">
            <div className="flex justify-center bg-gray-100 rounded-lg p-8">
              <div className="text-center">
                {getFileIcon(selectedForm.mimeType, selectedForm.fileName)}
                <p className="text-sm font-medium text-gray-900 mt-2">
                  {selectedForm.fileName}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatFileSize(selectedForm.fileSize)}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Title</p>
                  <p className="text-sm text-gray-900">{selectedForm.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Category</p>
                  <p className="text-sm text-gray-900">
                    {formCategories.find(
                      (c) => c.value === selectedForm.category,
                    )?.label || selectedForm.category}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Version</p>
                  <p className="text-sm text-gray-900">
                    v{selectedForm.version || "1.0"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Uploaded By
                  </p>
                  <p className="text-sm text-gray-900">
                    {selectedForm.uploadedBy?.firstName}{" "}
                    {selectedForm.uploadedBy?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Upload Date
                  </p>
                  <p className="text-sm text-gray-900">
                    {formatDate(selectedForm.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Downloads</p>
                  <p className="text-sm text-gray-900">
                    {selectedForm.downloadCount || 0}
                  </p>
                </div>
                {selectedForm.description && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-700">
                      Description
                    </p>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedForm.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => handleDownload(selectedForm)}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 inline-flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Form
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Forms;
