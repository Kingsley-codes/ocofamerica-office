// app/admin/page.jsx
"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Flag,
  CreditCard,
  FileText,
  LogOut,
  Plus,
  Bell,
  Settings,
  Shield,
} from "lucide-react";

import AdminOverview from "@/components/adminDashboard/AdminOverview";
import AdminCampaigns from "@/components/adminDashboard/AdminCampaigns";
import AdminSubscriptions from "@/components/adminDashboard/AdminSubscriptions";
import AdminAuditLogs from "@/components/adminDashboard/AdminAuditLogs";
import NewCampaignModal from "@/components/adminDashboard/NewCampaignModal";
import CampaignDrawer from "@/components/adminDashboard/CampaignDrawer";

import {
  MOCK_CAMPAIGNS,
  MOCK_AUDIT_LOGS,
} from "@/components/adminDashboard/mockData";

// ── Tab config ────────────────────────────────────────────────────
const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "campaigns", label: "Campaigns", icon: Flag },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
  { id: "audit", label: "Audit Logs", icon: FileText },
];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selected, setSelected] = useState(null);

  // ── Handlers ───────────────────────────────────────────────────
  const handleAddCampaign = (data) => {
    const newCampaign = { ...data, id: Date.now() };
    setCampaigns((prev) => [newCampaign, ...prev]);
  };

  const handleStatusChange = (id, status) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c)),
    );
  };

  const openCampaign = (c) => setSelected(c);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo & title */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Campaign Back Office
                </h1>
                <p className="text-xs text-gray-500">Super Admin Panel</p>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <button
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
              </button>
              <button
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>

              {/* Admin chip */}
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

              <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-600 hover:text-red-800 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">
                <LogOut className="h-4 w-4 mr-1.5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <div className="overflow-hidden overflow-x-auto">
            <nav
              className="-mb-px flex space-x-8 px-4 sm:px-0 min-w-max"
              aria-label="Admin tabs"
            >
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      isActive
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
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

              {/* New Campaign button */}
              <div className="ml-auto flex items-center pb-1">
                <button
                  onClick={() => setShowNewModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  New Campaign
                </button>
              </div>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 sm:px-0">
          {activeTab === "overview" && (
            <AdminOverview
              campaigns={campaigns}
              auditLogs={MOCK_AUDIT_LOGS}
              onViewAllCampaigns={() => setActiveTab("campaigns")}
              onViewAllAudit={() => setActiveTab("audit")}
              onSelectCampaign={openCampaign}
            />
          )}

          {activeTab === "campaigns" && (
            <AdminCampaigns
              campaigns={campaigns}
              onSelectCampaign={openCampaign}
              onNewCampaign={() => setShowNewModal(true)}
            />
          )}

          {activeTab === "subscriptions" && (
            <AdminSubscriptions
              campaigns={campaigns}
              onSelectCampaign={openCampaign}
            />
          )}

          {activeTab === "audit" && <AdminAuditLogs logs={MOCK_AUDIT_LOGS} />}
        </div>
      </main>

      {/* ── Modals / Drawers ────────────────────────────────────── */}
      {showNewModal && (
        <NewCampaignModal
          onClose={() => setShowNewModal(false)}
          onSave={handleAddCampaign}
        />
      )}

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
