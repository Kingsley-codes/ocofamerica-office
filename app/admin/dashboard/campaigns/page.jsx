// app/admin/dashboard1/campaigns/page.jsx
"use client";

import { useEffect, useState } from "react";
import { Bell, Settings, Shield, LogOut, Plus } from "lucide-react";

import AdminCampaigns from "@/components/adminDashboard/AdminCampaigns";
import NewCampaignModal from "@/components/adminDashboard/NewCampaignModal";
import CampaignDrawer from "@/components/adminDashboard/CampaignDrawer";
import { FaBars } from "react-icons/fa";
import { useSidebar } from "@/context/SidebarContext";
import { adminApiRequest } from "@/lib/auth";

export default function CampaignsPage() {
  const { setIsOpen } = useSidebar();
  const [campaigns, setCampaigns] = useState([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch campaigns data
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const data = await adminApiRequest("/admin/dashboard/campaign");
        setCampaigns(data.campaigns || []);
      } catch (err) {
        setError(err.message || "Failed to load campaigns");
        console.error("Error fetching campaigns:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  const handleStatusChange = (campaignId, newStatus) => {
    setCampaigns((prev) =>
      prev.map((c) => (c._id === campaignId ? { ...c, status: newStatus } : c)),
    );
  };

  const openCampaign = (campaign) => setSelected(campaign);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
          onSuccess={(newCampaign) =>
            setCampaigns((prev) => [newCampaign, ...prev])
          }
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
