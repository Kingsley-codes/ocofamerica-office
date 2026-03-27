"use client";

import { FaTimes } from "react-icons/fa";
import { IoHomeOutline } from "react-icons/io5";
import { useRouter } from "next/navigation";
import {
  Users,
  Image,
  FileText,
  UserPlus,
  Settings,
  Vote,
  DollarSign,
  Sparkles,
  FileIcon,
  Calendar,
  Share2,
} from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const { isOpen, setIsOpen } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();

  // 🔑 Mock role (replace with real auth later)
  const userRole = "client_admin";

  // Define allowed roles for fundraising
  const FUNDRAISING_ALLOWED_ROLES = [
    "client_admin",
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
    "client_admin",
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

  const allTabs = [
    {
      id: "home",
      label: "Home",
      route: "/dashboard1",
      icon: IoHomeOutline,
      requiredRoles: null,
    },
    {
      id: "management",
      label: "Management Directory",
      route: "/dashboard1/management",
      icon: Users,
      requiredRoles: null,
    },
    {
      id: "media",
      label: "Image & Media",
      route: "/dashboard1/media",
      icon: Image,
      requiredRoles: null,
    },
    {
      id: "reports",
      label: "Reports",
      route: "/dashboard1/reports",
      icon: FileText,
      requiredRoles: REPORTS_ALLOWED_ROLES,
    },
    {
      id: "fundraising",
      label: "Fundraising",
      route: "/dashboard1/fundraising",
      icon: DollarSign,
      requiredRoles: FUNDRAISING_ALLOWED_ROLES,
    },
    {
      id: "voters",
      label: "Voters Data",
      route: "/dashboard1/voters",
      icon: Vote,
      requiredRoles: null,
    },
    {
      id: "volunteers",
      label: "Volunteers & Field Staff",
      route: "/dashboard1/volunteers",
      icon: UserPlus,
      requiredRoles: null,
    },
    {
      id: "calendar",
      label: "Calendar",
      route: "/dashboard1/calendar",
      icon: Calendar,
      requiredRoles: null,
    },
    {
      id: "social",
      label: "Social Media",
      route: "/dashboard1/social",
      icon: Share2,
      requiredRoles: null,
    },
    {
      id: "forms",
      label: "Forms",
      route: "/dashboard1/forms",
      icon: FileIcon,
      requiredRoles: null,
    },
    {
      id: "premium",
      label: "Premium Features",
      route: "/dashboard1/premium",
      icon: Sparkles,
      requiredRoles: null,
    },
    {
      id: "other",
      label: "Other",
      route: "/dashboard1/other",
      icon: Settings,
      requiredRoles: null,
    },
  ];

  const availableTabs = allTabs.filter((tab) => {
    if (!tab.requiredRoles) return true;
    return tab.requiredRoles.includes(userRole);
  });

  return (
    <>
      {/* Overlay (mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`
          fixed md:static z-50 top-0 left-0 min-h-screen w-64 bg-blue-900 text-white p-4
          transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Mobile Header */}
        <div className="flex justify-between items-center mb-6 md:hidden">
          <h2 className="text-lg font-bold">MENU</h2>
          <FaTimes
            className="cursor-pointer"
            onClick={() => setIsOpen(false)}
          />
        </div>

        {/* Desktop Title */}
        <h2 className="text-xl font-bold mb-6 hidden md:block">
          CAMPAIGN NAME
        </h2>

        {/* ✅ Dynamic Tabs */}
        <ul className="space-y-3">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.route;

            return (
              <li
                key={tab.id}
                onClick={() => {
                  router.push(tab.route);
                  setIsOpen(false); // close on mobile
                }}
                className={`
                        flex items-center gap-3 p-2 rounded cursor-pointer transition
                        ${
                          isActive
                            ? "bg-blue-700 font-semibold"
                            : "hover:bg-blue-800"
                        }
                      `}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
