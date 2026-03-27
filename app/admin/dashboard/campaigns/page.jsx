// app/admin/dashboard1/campaigns/page.jsx
"use client";

import { useState } from "react";
import { Bell, Settings, Shield, LogOut, Plus } from "lucide-react";

import AdminCampaigns from "@/components/adminDashboard/AdminCampaigns";
import NewCampaignModal from "@/components/adminDashboard/NewCampaignModal";
import CampaignDrawer from "@/components/adminDashboard/CampaignDrawer";
import { MOCK_CAMPAIGNS } from "@/components/adminDashboard/mockData";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selected, setSelected] = useState(null);

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
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
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
          <div className="mb-4">
            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Campaign
            </button>
          </div>

          <AdminCampaigns
            campaigns={campaigns}
            onSelectCampaign={openCampaign}
            onNewCampaign={() => setShowNewModal(true)}
          />
        </div>
      </main>

      {/* Modals */}
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
