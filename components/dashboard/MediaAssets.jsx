/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef } from "react";
import {
  Image,
  Plus,
  Download,
  Search,
  Filter,
  Trash,
  Eye,
  Tag,
  Upload,
  File,
  Video,
  Music,
  X,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { formatDate, formatFileSize } from "@/lib/utils";
import Modal from "../ui/Modal";
import { apiRequest } from "@/lib/auth";

const MediaAssets = ({ user }) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showMultipleUploadModal, setShowMultipleUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaAssets, setMediaAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  // Upload state
  const [uploadProgress, setUploadProgress] = useState({
    isUploading: false,
    progress: 0,
    totalFiles: 0,
    processedFiles: 0,
    fileName: "",
    status: "", // 'uploading', 'processing', 'completed', 'error'
  });

  const [uploadForm, setUploadForm] = useState({
    name: "",
    type: "photo",
    tags: "",
    description: "",
    files: [],
  });

  // Refs for file inputs
  const singleFileInputRef = useRef(null);
  const multipleFileInputRef = useRef(null);

  const mediaTypes = [
    { value: "photo", label: "Photos", icon: Image },
    { value: "video", label: "Videos", icon: Video },
    { value: "logo", label: "Logos", icon: File },
    { value: "yard_sign", label: "Yard Signs", icon: Image },
    { value: "large_sign", label: "Large Signs", icon: Image },
    { value: "t_shirt", label: "T-Shirts", icon: Image },
    { value: "cap", label: "Caps", icon: Image },
    { value: "table_cloth", label: "Table Cloths", icon: Image },
    { value: "document", label: "Documents", icon: File },
  ];

  // File type icon mapping
  const fileTypeIcons = {
    image: <Image className="h-6 w-6 text-blue-500" />,
    video: <Video className="h-6 w-6 text-red-500" />,
    audio: <Music className="h-6 w-6 text-green-500" />,
    default: <File className="h-6 w-6 text-gray-500" />,
  };

  useEffect(() => {
    fetchMediaAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMediaAssets = async (
    page = 1,
    type = selectedType,
    search = searchTerm,
  ) => {
    try {
      setIsLoading(true);
      let url = `/media?page=${page}&limit=20`;
      if (type !== "all") url += `&type=${type}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const response = await apiRequest(url);
      if (response.success) {
        setMediaAssets(response.mediaAssets);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error("Error fetching media assets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Upload to Cloudinary directly from frontend
  const uploadToCloudinary = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "adcn_upload_preset");

      const cloudName = "webofzander";
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error("Cloudinary upload failed");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  };

  const handleSingleUpload = async (e) => {
    e.preventDefault();
    if (uploadForm.files.length === 0) {
      alert("Please select a file to upload");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress({
      isUploading: true,
      progress: 0,
      totalFiles: uploadForm.files.length,
      processedFiles: 0,
      fileName: uploadForm.files[0]?.name || "",
      status: "uploading",
    });

    try {
      const file = uploadForm.files[0];

      // Update progress
      setUploadProgress((prev) => ({
        ...prev,
        progress: 30,
        status: "uploading",
      }));

      // Upload to Cloudinary
      const cloudinaryResult = await uploadToCloudinary(file);

      setUploadProgress((prev) => ({
        ...prev,
        progress: 60,
        status: "processing",
      }));

      // Save to your database
      const mediaData = {
        name: uploadForm.name || file.name.replace(/\.[^/.]+$/, ""),
        type: uploadForm.type,
        fileName: file.name,
        fileUrl: cloudinaryResult.secure_url,
        cloudinaryPublicId: cloudinaryResult.public_id,
        fileSize: file.size,
        mimeType: file.type,
        tags: uploadForm.tags
          ? uploadForm.tags.split(",").map((tag) => tag.trim())
          : [],
        description: uploadForm.description,
      };

      const response = await apiRequest("/media", {
        method: "POST",
        body: JSON.stringify(mediaData),
      });

      if (response.success) {
        setUploadProgress((prev) => ({
          ...prev,
          progress: 100,
          status: "completed",
          processedFiles: 1,
        }));

        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setShowUploadModal(false);
          resetUploadForm();
          setUploadProgress({
            isUploading: false,
            progress: 0,
            totalFiles: 0,
            processedFiles: 0,
            fileName: "",
            status: "",
          });
          fetchMediaAssets();
          alert("File uploaded successfully!");
        }, 3000);
      } else {
        throw new Error(response.message || "Failed to save media to database");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadProgress((prev) => ({
        ...prev,
        progress: 100,
        status: "error",
      }));
      alert(error.message || "Failed to upload file");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMultipleUpload = async (e) => {
    e.preventDefault();
    if (uploadForm.files.length === 0) {
      alert("Please select files to upload");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress({
      isUploading: true,
      progress: 0,
      totalFiles: uploadForm.files.length,
      processedFiles: 0,
      fileName: "",
      status: "uploading",
    });

    try {
      const successfulUploads = [];
      const batchSize = 3; // Upload 3 files at a time

      for (let i = 0; i < uploadForm.files.length; i += batchSize) {
        const batch = uploadForm.files.slice(i, i + batchSize);
        const batchPromises = batch.map(async (file, index) => {
          const fileIndex = i + index + 1;

          // Update progress for current file
          setUploadProgress((prev) => ({
            ...prev,
            fileName: file.name,
            processedFiles: fileIndex - 1,
            progress: Math.round(
              ((fileIndex - 1) / uploadForm.files.length) * 100,
            ),
          }));

          try {
            // Upload to Cloudinary
            const cloudinaryResult = await uploadToCloudinary(file);

            // Save to database
            const mediaData = {
              name: file.name.replace(/\.[^/.]+$/, ""),
              type: uploadForm.type,
              fileName: file.name,
              fileUrl: cloudinaryResult.secure_url,
              cloudinaryPublicId: cloudinaryResult.public_id,
              fileSize: file.size,
              mimeType: file.type,
              tags: uploadForm.tags
                ? uploadForm.tags.split(",").map((tag) => tag.trim())
                : [],
              description: uploadForm.description,
            };

            const response = await apiRequest("/media", {
              method: "POST",
              body: JSON.stringify(mediaData),
            });

            if (response.success) {
              successfulUploads.push(response.mediaAsset);
            } else {
              console.error("Failed to save file:", file.name);
            }
          } catch (error) {
            console.error("Error uploading file:", file.name, error);
          }

          // Update progress after each file
          setUploadProgress((prev) => ({
            ...prev,
            processedFiles: fileIndex,
            progress: Math.round((fileIndex / uploadForm.files.length) * 100),
          }));
        });

        await Promise.all(batchPromises);
      }

      setUploadProgress((prev) => ({
        ...prev,
        progress: 100,
        status: "completed",
      }));

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setShowMultipleUploadModal(false);
        resetUploadForm();
        setUploadProgress({
          isUploading: false,
          progress: 0,
          totalFiles: 0,
          processedFiles: 0,
          fileName: "",
          status: "",
        });
        fetchMediaAssets();
        alert(`${successfulUploads.length} files uploaded successfully!`);
      }, 3000);
    } catch (error) {
      console.error("Multiple upload error:", error);
      setUploadProgress((prev) => ({
        ...prev,
        progress: 100,
        status: "error",
      }));
      alert(error.message || "Failed to upload files");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (media) => {
    try {
      const response = await apiRequest(`/media/${media._id}/download`);
      if (response.success) {
        window.open(response.downloadUrl, "_blank");
      }
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download file");
    }
  };

  const handleDelete = async (media) => {
    if (!confirm(`Are you sure you want to delete "${media.name}"?`)) {
      return;
    }

    try {
      const response = await apiRequest(`/media/${media._id}`, {
        method: "DELETE",
      });

      if (response.success) {
        fetchMediaAssets();
        alert("File deleted successfully!");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert(error.message || "Failed to delete file");
    }
  };

  const handlePreview = (media) => {
    setSelectedMedia(media);
    setShowPreviewModal(true);
  };

  const resetUploadForm = () => {
    setUploadForm({
      name: "",
      type: "photo",
      tags: "",
      description: "",
      files: [],
    });
    if (singleFileInputRef.current) {
      singleFileInputRef.current.value = "";
    }
    if (multipleFileInputRef.current) {
      multipleFileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Set appropriate max size (e.g., 10MB)
    const maxSize = 10 * 1024 * 1024;
    const oversizedFiles = selectedFiles.filter((file) => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      alert(
        `Some files exceed 10MB limit: ${oversizedFiles.map((f) => f.name).join(", ")}`,
      );
      return;
    }

    setUploadForm((prev) => ({
      ...prev,
      files: selectedFiles,
      name:
        prev.name ||
        (selectedFiles.length === 1
          ? selectedFiles[0].name.replace(/\.[^/.]+$/, "")
          : ""),
    }));
  };

  const handleFileRemove = (index) => {
    setUploadForm((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const getFileIcon = (file) => {
    const type = file.type.split("/")[0];
    switch (type) {
      case "image":
        return <Image className="h-5 w-5 text-blue-500" />;
      case "video":
        return <Video className="h-5 w-5 text-red-500" />;
      case "audio":
        return <Music className="h-5 w-5 text-green-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  // Upload Progress Component
  const UploadProgressDisplay = () => {
    if (!uploadProgress.isUploading) return null;

    const getStatusText = () => {
      switch (uploadProgress.status) {
        case "uploading":
          return "Uploading to Cloudinary...";
        case "processing":
          return "Saving to database...";
        case "completed":
          return "Upload completed!";
        case "error":
          return "Upload failed";
        default:
          return "Processing...";
      }
    };

    const getProgressColor = () => {
      switch (uploadProgress.status) {
        case "completed":
          return "bg-green-500";
        case "error":
          return "bg-red-500";
        default:
          return "bg-blue-500";
      }
    };

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <Upload className="h-5 w-5 text-blue-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">
              {uploadProgress.fileName ||
                `Uploading ${uploadProgress.totalFiles} file(s)`}
            </span>
          </div>
          <span className="text-sm text-gray-500">
            {uploadProgress.progress}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${uploadProgress.progress}%` }}
          ></div>
        </div>

        {/* Status Details */}
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Status:</span>
            <span
              className={
                uploadProgress.status === "completed"
                  ? "text-green-600"
                  : uploadProgress.status === "error"
                    ? "text-red-600"
                    : "text-blue-600"
              }
            >
              {getStatusText()}
            </span>
          </div>

          {uploadProgress.totalFiles > 0 && (
            <>
              <div className="flex justify-between">
                <span>Files Processed:</span>
                <span>
                  {uploadProgress.processedFiles} / {uploadProgress.totalFiles}
                </span>
              </div>
              {uploadProgress.status === "completed" && (
                <div className="text-green-600 font-medium mt-2">
                  <Check className="inline h-4 w-4 mr-1" />
                  Successfully uploaded {uploadProgress.processedFiles} files
                </div>
              )}
              {uploadProgress.status === "error" && (
                <div className="text-red-600 font-medium mt-2">
                  <AlertCircle className="inline h-4 w-4 mr-1" />
                  Failed to upload files
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
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
          <h3 className="text-lg font-semibold text-gray-900">Image & Media</h3>
          <p className="text-sm text-gray-600">
            Campaign assets and uploaded files
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowMultipleUploadModal(true)}
            className="btn-secondary inline-flex items-center"
            disabled={uploadProgress.isUploading}
          >
            {uploadProgress.isUploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Upload Multiple
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary inline-flex items-center"
            disabled={uploadProgress.isUploading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="relative flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="search"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Search by name or tags..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                fetchMediaAssets(1, selectedType, e.target.value);
              }}
            />
          </div>
          <div className="flex space-x-3">
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                fetchMediaAssets(1, e.target.value, searchTerm);
              }}
              className="block w-full sm:w-40 pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            >
              <option value="all">All Types</option>
              {mediaTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Upload Progress Display */}
      <UploadProgressDisplay />

      {/* Media Grid */}
      {mediaAssets.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <Image className="h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No media assets</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by uploading your first file.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-primary inline-flex items-center"
              disabled={uploadProgress.isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mediaAssets.map((media) => (
            <div
              key={media._id}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Preview Image/Icon */}
              <div className="h-48 bg-gray-100 flex items-center justify-center relative">
                {media.type === "photo" ||
                media.type === "yard_sign" ||
                media.type === "large_sign" ||
                media.type === "t_shirt" ||
                media.type === "cap" ||
                media.type === "table_cloth" ? (
                  <img
                    src={media.fileUrl}
                    alt={media.name}
                    className="h-full w-full object-cover cursor-pointer"
                    onClick={() => handlePreview(media)}
                  />
                ) : media.type === "video" ? (
                  <div className="text-center">
                    <Video className="h-12 w-12 text-red-500 mx-auto mb-2" />
                    <span className="text-sm text-gray-600">Video File</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <File className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                    <span className="text-sm text-gray-600">{media.type}</span>
                  </div>
                )}

                {/* Actions Overlay */}
                <div className="absolute top-2 right-2 flex space-x-1">
                  <button
                    onClick={() => handlePreview(media)}
                    className="bg-white/80 hover:bg-white p-1.5 rounded-full shadow-sm"
                    title="Preview"
                  >
                    <Eye className="h-4 w-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => handleDownload(media)}
                    className="bg-white/80 hover:bg-white p-1.5 rounded-full shadow-sm"
                    title="Download"
                  >
                    <Download className="h-4 w-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => handleDelete(media)}
                    className="bg-white/80 hover:bg-white p-1.5 rounded-full shadow-sm"
                    title="Delete"
                  >
                    <Trash className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>

              {/* Media Info */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {media.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatFileSize(media.fileSize)}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {media.type.replace("_", " ")}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex items-center text-xs text-gray-500">
                    <span>
                      Uploaded by: {media.uploadedBy?.firstName || "User"}
                    </span>
                    <span className="mx-2">•</span>
                    <span>{formatDate(media.createdAt)}</span>
                  </div>

                  {media.tags && media.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {media.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                      {media.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{media.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="bg-white px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{mediaAssets.length}</span>{" "}
              of <span className="font-medium">{pagination.total}</span> files
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => fetchMediaAssets(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => fetchMediaAssets(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          if (!uploadProgress.isUploading) {
            setShowUploadModal(false);
            resetUploadForm();
          }
        }}
        title="Upload Media File"
        size="lg"
        isSubmitting={isSubmitting || uploadProgress.isUploading}
        disableClose={uploadProgress.isUploading}
      >
        <form id="modal-form" onSubmit={handleSingleUpload}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File *
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="single-file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="single-file-upload"
                        ref={singleFileInputRef}
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
                        disabled={uploadProgress.isUploading}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Images, Videos, PDF, DOC up to 10MB
                  </p>
                </div>
              </div>

              {/* Selected Files */}
              {uploadForm.files.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Selected file:
                  </p>
                  {uploadForm.files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-md mb-1"
                    >
                      <div className="flex items-center truncate">
                        {getFileIcon(file)}
                        <span className="ml-2 text-sm truncate max-w-xs">
                          {file.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileRemove(index)}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                        disabled={uploadProgress.isUploading}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                required
                value={uploadForm.name}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter file name"
                disabled={uploadProgress.isUploading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  value={uploadForm.type}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={uploadProgress.isUploading}
                >
                  {mediaTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                value={uploadForm.tags}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, tags: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="comma, separated, tags"
                disabled={uploadProgress.isUploading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Separate tags with commas
              </p>
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
                placeholder="Brief description of the file"
                disabled={uploadProgress.isUploading}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Multiple Upload Modal */}
      <Modal
        isOpen={showMultipleUploadModal}
        onClose={() => {
          if (!uploadProgress.isUploading) {
            setShowMultipleUploadModal(false);
            resetUploadForm();
          }
        }}
        title="Upload Multiple Files"
        size="lg"
        isSubmitting={isSubmitting || uploadProgress.isUploading}
        disableClose={uploadProgress.isUploading}
      >
        <form id="modal-form" onSubmit={handleMultipleUpload}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Files *
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="multiple-file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload files</span>
                      <input
                        id="multiple-file-upload"
                        ref={multipleFileInputRef}
                        type="file"
                        multiple
                        className="sr-only"
                        onChange={handleFileChange}
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
                        disabled={uploadProgress.isUploading}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Images, Videos, PDF, DOC up to 10MB each
                  </p>
                </div>
              </div>

              {/* Selected Files */}
              {uploadForm.files.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Selected files ({uploadForm.files.length}):
                  </p>
                  <div className="max-h-40 overflow-y-auto">
                    {uploadForm.files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-md mb-1"
                      >
                        <div className="flex items-center truncate">
                          {getFileIcon(file)}
                          <span className="ml-2 text-sm truncate max-w-xs">
                            {file.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleFileRemove(index)}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                          disabled={uploadProgress.isUploading}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  value={uploadForm.type}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={uploadProgress.isUploading}
                >
                  {mediaTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (applied to all files)
              </label>
              <input
                type="text"
                value={uploadForm.tags}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, tags: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="comma, separated, tags"
                disabled={uploadProgress.isUploading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Separate tags with commas
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (applied to all files)
              </label>
              <textarea
                value={uploadForm.description}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, description: e.target.value })
                }
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of the files"
                disabled={uploadProgress.isUploading}
              />
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> All files will be uploaded with the same
                type, tags, and description. File names will be preserved.
              </p>
            </div>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={selectedMedia?.name}
        size="xl"
        showFooter={false}
      >
        {selectedMedia && (
          <div className="space-y-6">
            <div className="flex justify-center">
              {selectedMedia.type === "photo" ||
              selectedMedia.type === "yard_sign" ||
              selectedMedia.type === "large_sign" ||
              selectedMedia.type === "t_shirt" ||
              selectedMedia.type === "cap" ||
              selectedMedia.type === "table_cloth" ? (
                <img
                  src={selectedMedia.fileUrl}
                  alt={selectedMedia.name}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg"
                />
              ) : selectedMedia.type === "video" ? (
                <div className="text-center py-12">
                  <Video className="h-24 w-24 text-red-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900">
                    Video File
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {selectedMedia.fileName}
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <File className="h-24 w-24 text-blue-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900">
                    {selectedMedia.type.replace("_", " ")}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {selectedMedia.fileName}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">File Name</p>
                  <p className="text-sm text-gray-900">
                    {selectedMedia.fileName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">File Size</p>
                  <p className="text-sm text-gray-900">
                    {formatFileSize(selectedMedia.fileSize)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Type</p>
                  <p className="text-sm text-gray-900">
                    {selectedMedia.type.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Uploaded By
                  </p>
                  <p className="text-sm text-gray-900">
                    {selectedMedia.uploadedBy?.firstName}{" "}
                    {selectedMedia.uploadedBy?.lastName}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-700">
                    Upload Date
                  </p>
                  <p className="text-sm text-gray-900">
                    {formatDate(selectedMedia.createdAt)}
                  </p>
                </div>
                {selectedMedia.tags && selectedMedia.tags.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-700">Tags</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedMedia.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedMedia.description && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-700">
                      Description
                    </p>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedMedia.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => handleDownload(selectedMedia)}
                className="btn-primary inline-flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MediaAssets;
