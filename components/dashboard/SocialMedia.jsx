// components/dashboard/SocialMedia.js
"use client";

import { useState, useEffect } from "react";
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  MessageCircle,
  MessageSquare,
  Music,
  Video,
  Globe,
  Plus,
  Edit,
  Trash,
  Link,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Settings,
  Share2,
  Users,
  Lock,
  Unlock,
  Copy,
  ExternalLink,
  Star,
  Send,
} from "lucide-react";
import Modal from "../ui/Modal";
import toast from "react-hot-toast";

// Social media platforms configuration - removed colors
const SOCIAL_PLATFORMS = [
  {
    id: "facebook_page",
    name: "Facebook Page",
    icon: Facebook,
    url: "https://facebook.com",
    maxAccounts: 5,
    requiresVerification: true,
  },
  {
    id: "facebook_group",
    name: "Facebook Group",
    icon: Users,
    url: "https://facebook.com/groups",
    maxAccounts: 5,
    requiresVerification: true,
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    url: "https://instagram.com",
    maxAccounts: 3,
    requiresVerification: true,
  },
  {
    id: "twitter",
    name: "Twitter / X",
    icon: Twitter,
    url: "https://twitter.com",
    maxAccounts: 3,
    requiresVerification: true,
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: Youtube,
    url: "https://youtube.com",
    maxAccounts: 3,
    requiresVerification: true,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    url: "https://linkedin.com",
    maxAccounts: 3,
    requiresVerification: true,
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: Music,
    url: "https://tiktok.com",
    maxAccounts: 3,
    requiresVerification: true,
  },
  {
    id: "snapchat",
    name: "Snapchat",
    icon: MessageSquare,
    url: "https://snapchat.com",
    maxAccounts: 2,
    requiresVerification: true,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: MessageCircle,
    url: "https://wa.me",
    maxAccounts: 2,
    requiresVerification: false,
  },
  {
    id: "telegram",
    name: "Telegram",
    icon: Send,
    url: "https://t.me",
    maxAccounts: 2,
    requiresVerification: false,
  },
  {
    id: "wechat",
    name: "WeChat",
    icon: MessageSquare,
    url: "https://wechat.com",
    maxAccounts: 2,
    requiresVerification: true,
  },
  {
    id: "clubhouse",
    name: "Clubhouse",
    icon: Users,
    url: "https://clubhouse.com",
    maxAccounts: 2,
    requiresVerification: true,
  },
  {
    id: "bluesky",
    name: "BlueSky",
    icon: Globe,
    url: "https://bsky.app",
    maxAccounts: 2,
    requiresVerification: true,
  },
];

const SocialMedia = ({ user }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedPlatform, setExpandedPlatform] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");

  const [formData, setFormData] = useState({
    platform: "",
    accountName: "",
    accountUrl: "",
    username: "",
    description: "",
    isPrimary: false,
    isActive: true,
    autoPost: false,
    permissions: "read_write",
  });

  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "candidate")) {
      setIsAdmin(true);
    }
    fetchSocialAccounts();
  }, [user]);

  const fetchSocialAccounts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/social-media", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch accounts");
      const data = await response.json();
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error("Error fetching social accounts:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error("Only admins and candidates can add social media accounts");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/social-media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add account");
      }

      const data = await response.json();
      toast.success("Social media account added successfully");
      setShowAddModal(false);
      resetForm();
      fetchSocialAccounts();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    if (!isAdmin || !selectedAccount) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/social-media/${selectedAccount._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update account");
      }

      toast.success("Account updated successfully");
      setShowEditModal(false);
      resetForm();
      fetchSocialAccounts();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async (account) => {
    if (!isAdmin) {
      toast.error("Only admins can delete accounts");
      return;
    }

    if (!confirm(`Are you sure you want to remove ${account.accountName}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/social-media/${account._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete account");

      toast.success("Account removed successfully");
      fetchSocialAccounts();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleVerifyAccount = async () => {
    if (!selectedAccount) return;

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `/api/social-media/${selectedAccount._id}/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ verificationCode }),
        },
      );

      if (!response.ok) throw new Error("Verification failed");

      toast.success("Account verified successfully");
      setShowVerificationModal(false);
      setVerificationCode("");
      fetchSocialAccounts();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleToggleStatus = async (account) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/social-media/${account._id}/toggle`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !account.isActive }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      toast.success(
        `Account ${account.isActive ? "deactivated" : "activated"}`,
      );
      fetchSocialAccounts();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSetPrimary = async (account) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/social-media/${account._id}/primary`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to set as primary");

      toast.success("Primary account updated");
      fetchSocialAccounts();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handlePlatformClick = (platformUrl) => {
    window.open(platformUrl, "_blank", "noopener,noreferrer");
  };

  const resetForm = () => {
    setFormData({
      platform: "",
      accountName: "",
      accountUrl: "",
      username: "",
      description: "",
      isPrimary: false,
      isActive: true,
      autoPost: false,
      permissions: "read_write",
    });
  };

  const getPlatformIcon = (platformId) => {
    const platform = SOCIAL_PLATFORMS.find((p) => p.id === platformId);
    if (!platform) return Globe;
    return platform.icon;
  };

  const getPlatformUrl = (platformId) => {
    const platform = SOCIAL_PLATFORMS.find((p) => p.id === platformId);
    return platform?.url || "#";
  };

  const accountsByPlatform = accounts.reduce((acc, account) => {
    if (!acc[account.platform]) {
      acc[account.platform] = [];
    }
    acc[account.platform].push(account);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Social Media Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Connect and manage up to 10 social media accounts per platform
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary inline-flex items-center w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Connect Account
          </button>
        )}
      </div>

      {/* Admin/Candidate Banner */}
      {isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Settings className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                Admin & Candidate Access
              </p>
              <p className="text-sm text-blue-700 mt-1">
                You can add, edit, and manage all social media accounts. Up to
                10 accounts per platform.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading social media accounts...</p>
        </div>
      ) : (
        /* Social Media Accounts List */
        <div className="space-y-4">
          {SOCIAL_PLATFORMS.map((platform) => {
            const platformAccounts = accountsByPlatform[platform.id] || [];
            const Icon = platform.icon;
            const isExpanded = expandedPlatform === platform.id;
            const maxReached = platformAccounts.length >= platform.maxAccounts;
            const displayAccounts = isExpanded
              ? platformAccounts
              : platformAccounts.slice(0, 3);

            if (platformAccounts.length === 0 && !isAdmin) return null;

            return (
              <div
                key={platform.id}
                className="bg-white rounded-lg shadow overflow-hidden border border-gray-200"
              >
                {/* Platform Header */}
                <div
                  className="px-6 py-4 bg-white hover:bg-gray-50 cursor-pointer flex items-center justify-between border-b border-gray-100"
                  onClick={() =>
                    setExpandedPlatform(isExpanded ? null : platform.id)
                  }
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gray-100">
                      <Icon className="h-5 w-5 text-gray-700" />
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {platform.name}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlatformClick(platform.url);
                          }}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                          title={`Visit ${platform.name}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        {platformAccounts.length} of {platform.maxAccounts}{" "}
                        accounts connected
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {maxReached && isAdmin && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Max reached
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Accounts List */}
                {displayAccounts.length > 0 && (
                  <div className="divide-y divide-gray-100">
                    {displayAccounts.map((account) => (
                      <div
                        key={account._id}
                        className="px-6 py-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="p-2 rounded-full bg-gray-100">
                              {React.createElement(
                                getPlatformIcon(account.platform),
                                {
                                  className: "h-5 w-5 text-gray-600",
                                },
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center flex-wrap gap-2">
                                <p className="text-sm font-medium text-gray-900">
                                  {account.accountName}
                                </p>
                                {account.isPrimary && (
                                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center">
                                    <Star className="h-3 w-3 mr-1" />
                                    Primary
                                  </span>
                                )}
                                {account.isVerified ? (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verified
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full flex items-center">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Unverified
                                  </span>
                                )}
                                {!account.isActive && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center mt-1 text-xs text-gray-500">
                                <Link className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate max-w-xs">
                                  {account.accountUrl}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(
                                      account.accountUrl,
                                    );
                                    toast.success("URL copied to clipboard");
                                  }}
                                  className="ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              </div>
                              {account.description && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {account.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2">
                            {!account.isVerified &&
                              platform.requiresVerification &&
                              isAdmin && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAccount(account);
                                    setShowVerificationModal(true);
                                  }}
                                  className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-lg"
                                  title="Verify Account"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              )}

                            {!account.isPrimary && isAdmin && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetPrimary(account);
                                }}
                                className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg"
                                title="Set as Primary"
                              >
                                <Star className="h-4 w-4" />
                              </button>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(
                                  account.accountUrl,
                                  "_blank",
                                  "noopener,noreferrer",
                                );
                              }}
                              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg"
                              title="Visit Account"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>

                            {isAdmin && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAccount(account);
                                    setFormData({
                                      platform: account.platform,
                                      accountName: account.accountName,
                                      accountUrl: account.accountUrl,
                                      username: account.username || "",
                                      description: account.description || "",
                                      isPrimary: account.isPrimary || false,
                                      isActive: account.isActive,
                                      autoPost: account.autoPost || false,
                                      permissions:
                                        account.permissions || "read_write",
                                    });
                                    setShowEditModal(true);
                                  }}
                                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg"
                                  title="Edit Account"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleStatus(account);
                                  }}
                                  className={`p-2 rounded-lg ${
                                    account.isActive
                                      ? "text-green-600 hover:text-green-800 hover:bg-green-50"
                                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                  }`}
                                  title={
                                    account.isActive ? "Deactivate" : "Activate"
                                  }
                                >
                                  {account.isActive ? (
                                    <Unlock className="h-4 w-4" />
                                  ) : (
                                    <Lock className="h-4 w-4" />
                                  )}
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteAccount(account);
                                  }}
                                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                                  title="Remove Account"
                                >
                                  <Trash className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Show More / Less */}
                {platformAccounts.length > 3 && (
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                    <button
                      onClick={() =>
                        setExpandedPlatform(isExpanded ? null : platform.id)
                      }
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Show {platformAccounts.length - 3} more accounts
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Add Account Button */}
                {isAdmin && !maxReached && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setFormData({ ...formData, platform: platform.id });
                        setShowAddModal(true);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add {platform.name} Account
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {accounts.length === 0 && (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <div className="flex flex-col items-center">
                <Share2 className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No social media accounts connected
                </h3>
                <p className="text-gray-500 mb-6">
                  Connect your campaign&apos;s social media accounts to manage
                  them all in one place.
                </p>
                {isAdmin && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary inline-flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Connect Your First Account
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Account Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Connect Social Media Account"
        size="lg"
        isSubmitting={isSubmitting}
      >
        <form id="modal-form" onSubmit={handleAddAccount}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform *
              </label>
              <select
                required
                value={formData.platform}
                onChange={(e) =>
                  setFormData({ ...formData, platform: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a platform</option>
                {SOCIAL_PLATFORMS.map((platform) => {
                  const platformAccounts =
                    accountsByPlatform[platform.id] || [];
                  const maxReached =
                    platformAccounts.length >= platform.maxAccounts;
                  return (
                    <option
                      key={platform.id}
                      value={platform.id}
                      disabled={maxReached}
                    >
                      {platform.name} {maxReached ? "(Max reached)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Name *
              </label>
              <input
                type="text"
                required
                value={formData.accountName}
                onChange={(e) =>
                  setFormData({ ...formData, accountName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Campaign Official Page"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account URL *
              </label>
              <input
                type="url"
                required
                value={formData.accountUrl}
                onChange={(e) =>
                  setFormData({ ...formData, accountUrl: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://facebook.com/yourpage"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username / Handle
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="@yourhandle"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of this account's purpose"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={formData.isPrimary}
                  onChange={(e) =>
                    setFormData({ ...formData, isPrimary: e.target.checked })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isPrimary"
                  className="ml-2 text-sm text-gray-700"
                >
                  Set as primary account for this platform
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions
              </label>
              <select
                value={formData.permissions}
                onChange={(e) =>
                  setFormData({ ...formData, permissions: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="read_only">Read Only</option>
                <option value="read_write">Read & Write</option>
                <option value="full">Full Access (Admin)</option>
              </select>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    You may need to verify ownership of this account. A
                    verification code will be sent after adding.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Account Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title="Edit Social Media Account"
        size="lg"
        isSubmitting={isSubmitting}
      >
        <form id="modal-form" onSubmit={handleUpdateAccount}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform
              </label>
              <input
                type="text"
                value={
                  SOCIAL_PLATFORMS.find((p) => p.id === formData.platform)
                    ?.name || ""
                }
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Name *
              </label>
              <input
                type="text"
                required
                value={formData.accountName}
                onChange={(e) =>
                  setFormData({ ...formData, accountName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account URL *
              </label>
              <input
                type="url"
                required
                value={formData.accountUrl}
                onChange={(e) =>
                  setFormData({ ...formData, accountUrl: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username / Handle
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsPrimary"
                  checked={formData.isPrimary}
                  onChange={(e) =>
                    setFormData({ ...formData, isPrimary: e.target.checked })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="editIsPrimary"
                  className="ml-2 text-sm text-gray-700"
                >
                  Set as primary account for this platform
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="editIsActive"
                  className="ml-2 text-sm text-gray-700"
                >
                  Account is active
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editAutoPost"
                  checked={formData.autoPost}
                  onChange={(e) =>
                    setFormData({ ...formData, autoPost: e.target.checked })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="editAutoPost"
                  className="ml-2 text-sm text-gray-700"
                >
                  Enable auto-posting
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions
              </label>
              <select
                value={formData.permissions}
                onChange={(e) =>
                  setFormData({ ...formData, permissions: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="read_only">Read Only</option>
                <option value="read_write">Read & Write</option>
                <option value="full">Full Access (Admin)</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Verification Modal */}
      <Modal
        isOpen={showVerificationModal}
        onClose={() => {
          setShowVerificationModal(false);
          setVerificationCode("");
        }}
        title="Verify Social Media Account"
        size="md"
      >
        <div className="space-y-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  To verify ownership of this account, please add the following
                  code to your profile description or bio, then click Verify.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg text-center">
            <p className="text-2xl font-mono font-bold text-gray-900">
              {selectedAccount?.verificationCode || "CAMPAIGN-123456"}
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  selectedAccount?.verificationCode || "CAMPAIGN-123456",
                );
                toast.success("Code copied to clipboard");
              }}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 inline-flex items-center"
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy Code
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter the code from your profile"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowVerificationModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleVerifyAccount}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Verify Account
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SocialMedia;
