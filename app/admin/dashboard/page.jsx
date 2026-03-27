// app/admin/dashboard/page.jsx
"use client";

import { useState } from "react";
import { Bell, Settings, Shield, LogOut } from "lucide-react";

import CampaignDrawer from "@/components/adminDashboard/CampaignDrawer";
import {
  MOCK_CAMPAIGNS,
  MOCK_AUDIT_LOGS,
} from "@/components/adminDashboard/mockData";
import AdminOverview from "@/components/adminDashboard/AdminOverview";
import { useSidebar } from "@/context/SidebarContext";
import { FaBars } from "react-icons/fa";

export default function OverviewPage() {
  const { setIsOpen } = useSidebar();
  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS);
  const [selected, setSelected] = useState(null);

  const handleStatusChange = (id, status) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c)),
    );
  };

  const openCampaign = (c) => setSelected(c);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <FaBars
                className="md:hidden cursor-pointer"
                onClick={() => setIsOpen(true)}
              />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Campaign Back Office
                </h1>
                <p className="text-xs text-gray-500">Super Admin Panel</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
                <Settings className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">
                    SA
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    Super Admin
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </span>
                  </div>
                </div>
              </div>

              <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors">
                <LogOut className="h-4 w-4 mr-1.5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <AdminOverview
            campaigns={campaigns}
            auditLogs={MOCK_AUDIT_LOGS}
            onViewAllCampaigns={() =>
              (window.location.href = "/admin/dashboard1/campaigns")
            }
            onViewAllAudit={() =>
              (window.location.href = "/admin/dashboard1/audit")
            }
            onSelectCampaign={openCampaign}
          />
        </div>
      </main>

      {/* Drawer */}
      {selected && (
        <CampaignDrawer
          campaign={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
