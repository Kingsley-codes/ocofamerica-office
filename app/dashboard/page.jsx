/* eslint-disable @next/next/no-img-element */
// app/dashboard/page.js (updated tabs configuration with Calendar)
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Image,
  FileText,
  UserPlus,
  Settings,
  LogOut,
  UserCog,
  Vote,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  DollarSign,
  Sparkles,
  FileIcon,
  Calendar,
  Share2,
} from "lucide-react";
import ManagementDirectory from "@/components/dashboard/ManagementDirectory";
import MediaAssets from "@/components/dashboard/MediaAssets";
import Reports from "@/components/dashboard/Reports";
import Volunteers from "@/components/dashboard/Volunteers";
import VotersData from "@/components/dashboard/VotersData";
import Other from "@/components/dashboard/Other";
import { getInitials } from "@/lib/utils";
import { validateSession, logout } from "@/lib/auth";
import Fundraising from "@/components/dashboard/Fundraising";
import PremiumFeatures from "@/components/dashboard/PremiumFeatures";
import Forms from "@/components/dashboard/Forms";
import CalendarView from "@/components/dashboard/Calendar";
import SocialMedia from "@/components/dashboard/SocialMedia";

// Define allowed roles for fundraising
const FUNDRAISING_ALLOWED_ROLES = [
  "admin",
  "fundraiser",
  "manager",
  "finance_director",
  "finance_assistant",
  "call_time_manager",
  "donor_researcher",
  "event_fundraising_coordinator",
];

// Define allowed roles for reports
const REPORTS_ALLOWED_ROLES = [
  "admin",
  "manager",
  "finance_director",
  "fundraiser",
  "finance_assistant",
  "call_time_manager",
  "donor_researcher",
  "event_fundraising_coordinator",
  "scheduler",
  "legal",
];

// All tabs in their natural order with role requirements
const allTabs = [
  {
    id: "management",
    label: "Management Directory",
    icon: Users,
    requiredRoles: null,
  }, // Everyone can view
  { id: "media", label: "Image & Media", icon: Image, requiredRoles: null }, // Everyone can view
  {
    id: "reports",
    label: "Reports",
    icon: FileText,
    requiredRoles: REPORTS_ALLOWED_ROLES,
  },
  {
    id: "fundraising",
    label: "Fundraising",
    icon: DollarSign,
    requiredRoles: FUNDRAISING_ALLOWED_ROLES,
  },
  { id: "voters", label: "Voters Data", icon: Vote, requiredRoles: null }, // Everyone can view
  {
    id: "volunteers",
    label: "Volunteers & Field Staff",
    icon: UserPlus,
    requiredRoles: null,
  }, // Everyone can view
  { id: "calendar", label: "Calendar", icon: Calendar, requiredRoles: null }, // Everyone can view
  { id: "social", label: "Social Media", icon: Share2, requiredRoles: null }, // Everyone can view
  { id: "forms", label: "Forms", icon: FileIcon, requiredRoles: null }, // Everyone can view
  {
    id: "premium",
    label: "Premium Features",
    icon: Sparkles,
    requiredRoles: null,
  }, // Everyone can view
  { id: "other", label: "Other", icon: Settings, requiredRoles: null }, // Everyone can view
];

// Social media platforms
const socialMediaPlatforms = [
  {
    name: "Facebook",
    icon: Facebook,
    color: "text-gray-600 hover:text-blue-800",
    bgColor: "hover:bg-blue-50",
    url: "#",
  },
  {
    name: "Instagram",
    icon: Instagram,
    color: "text-gray-600 hover:text-pink-800",
    bgColor: "hover:bg-pink-50",
    url: "#",
  },
  {
    name: "Twitter",
    icon: Twitter,
    color: "text-gray-600 hover:text-blue-600",
    bgColor: "hover:bg-blue-50",
    url: "#",
  },
  {
    name: "YouTube",
    icon: Youtube,
    color: "text-gray-600 hover:text-red-800",
    bgColor: "hover:bg-red-50",
    url: "#",
  },
];

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("management");
  const [user, setUser] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication and get user data
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const sessionData = await validateSession();

        if (!sessionData.valid) {
          router.push("/login");
          return;
        }

        setUser(sessionData.user);
        setIsLoading(false);
      } catch (error) {
        console.error("Auth error:", error);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const userRole = user?.role;

  // Filter tabs based on user role while preserving order
  const availableTabs = allTabs.filter((tab) => {
    // If tab has no required roles, everyone can see it
    if (!tab.requiredRoles) return true;
    // Otherwise, check if user's role is in the required roles list
    return tab.requiredRoles.includes(userRole);
  });

  const handleSocialMediaClick = (platformName, url) => {
    if (url && url !== "#") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="h-8 w-8 relative mr-3">
                <img
                  src="/logo.png"
                  alt="Campaign Back Office Logo"
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Campaign Back Office
                </h1>
              </div>
            </div>

            {/* Social Media Icons */}
            <div className="hidden md:flex items-center space-x-2">
              <span className="text-xs text-gray-500 mr-2">Follow us:</span>
              {socialMediaPlatforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <button
                    key={platform.name}
                    onClick={() =>
                      handleSocialMediaClick(platform.name, platform.url)
                    }
                    className={`p-2 rounded-full ${platform.bgColor} transition-colors duration-200`}
                    title={`Follow on ${platform.name}`}
                    aria-label={`Follow on ${platform.name}`}
                  >
                    <Icon className={`h-5 w-5 ${platform.color}`} />
                  </button>
                );
              })}
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                    <span className="text-blue-600 font-semibold text-sm">
                      {getInitials(
                        user.name?.split(" ")[0] || "",
                        user.name?.split(" ")[1] || "",
                      )}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user.name}
                    </p>
                    <div className="flex items-center">
                      <p className="text-xs text-gray-500 capitalize">
                        {user.role?.replace(/_/g, " ")}
                      </p>
                      {user.role === "admin" && (
                        <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          <UserCog className="h-3 w-3 mr-1" />
                          Admin
                        </span>
                      )}
                      {user.role === "fundraiser" && (
                        <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Fundraiser
                        </span>
                      )}
                      {user.role === "manager" && (
                        <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          <Users className="h-3 w-3 mr-1" />
                          Manager
                        </span>
                      )}
                      {user.role === "finance_director" && (
                        <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Finance Director
                        </span>
                      )}
                      {user.role === "scheduler" && (
                        <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Calendar className="h-3 w-3 mr-1" />
                          Scheduler
                        </span>
                      )}
                      {user.role === "legal" && (
                        <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                          <FileText className="h-3 w-3 mr-1" />
                          Legal
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-600 hover:text-red-800 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>

          {/* Mobile Social Media Icons */}
          <div className="md:hidden flex items-center justify-center py-2 border-t border-gray-100">
            <span className="text-xs text-gray-500 mr-3">Follow us:</span>
            <div className="flex items-center space-x-2">
              {socialMediaPlatforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <button
                    key={platform.name}
                    onClick={() =>
                      handleSocialMediaClick(platform.name, platform.url)
                    }
                    className={`p-1.5 rounded-full ${platform.bgColor} transition-colors duration-200`}
                    title={`Follow on ${platform.name}`}
                    aria-label={`Follow on ${platform.name}`}
                  >
                    <Icon className={`h-4 w-4 ${platform.color}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <div className="overflow-hidden overflow-x-auto">
            <nav
              className="-mb-px flex space-x-8 px-4 sm:px-0 min-w-max"
              aria-label="Tabs"
            >
              {availableTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                      ${
                        isActive
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }
                    `}
                  >
                    <Icon
                      className={`h-5 w-5 mr-2 ${
                        isActive
                          ? "text-blue-500"
                          : "text-gray-400 group-hover:text-gray-500"
                      }`}
                    />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 sm:px-0">
          {activeTab === "management" && <ManagementDirectory user={user} />}
          {activeTab === "media" && <MediaAssets user={user} />}
          {activeTab === "reports" && <Reports user={user} />}
          {activeTab === "volunteers" && <Volunteers user={user} />}
          {activeTab === "voters" && <VotersData user={user} />}
          {activeTab === "calendar" && <CalendarView user={user} />}
          {activeTab === "social" && <SocialMedia user={user} />}
          {activeTab === "fundraising" && <Fundraising user={user} />}
          {activeTab === "premium" && <PremiumFeatures user={user} />}
          {activeTab === "forms" && <Forms user={user} />}
          {activeTab === "other" && <Other user={user} />}
        </div>
      </main>
    </div>
  );
}
