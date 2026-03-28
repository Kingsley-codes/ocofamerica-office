// components/admin/NewCampaignModal.jsx
"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { FiX, FiUpload } from "react-icons/fi";
import { adminApiRequest } from "@/lib/auth";

const EMPTY_FORM = {
  title: "",
  candidateName: "",
  office: "",
  state: "",
  party: "",
  website: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

export default function NewCampaignModal({ onClose, onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState(null);
  const fileRef = useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const isValid =
    form.title.trim() &&
    form.candidateName.trim() &&
    form.office.trim() &&
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim();

  const handleSave = async () => {
    try {
      // ✅ Validate logo
      if (!logo) {
        alert("Please upload a campaign logo");
        return;
      }

      setLoading(true);

      const formData = new FormData();

      // Append text fields
      Object.entries(form).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      // Append logo file
      if (logo) {
        formData.append("logo", logo);
      }

      await adminApiRequest("/admin/dashboard/campaign/create", {
        method: "POST",
        body: formData,
      });

      // ✅ refresh parent list
      onSuccess?.(res.campaign);

      // ✅ Success feedback
      alert(res?.message || "Campaign created successfully");

      onClose();
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to create campaign");
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogo(file); // store actual file
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={() => !loading && onClose()}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              New Campaign
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Campaign & Contact Details
            </p>
          </div>

          <button
            onClick={() => !loading && onClose()}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-5">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Campaign Logo
              </label>

              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-5 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {logo ? (
                  <Image
                    src={URL.createObjectURL(logo)}
                    width={60}
                    height={60}
                    alt="logo"
                    className="object-contain mx-auto"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <FiUpload className="h-6 w-6 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      Click to upload logo
                    </p>
                    <p className="text-xs text-gray-400">
                      PNG, JPG, SVG · max 2 MB
                    </p>
                  </div>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={loading}
                onChange={handleLogoChange}
              />
            </div>

            {/* Campaign Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Johnson for Governor"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Candidate Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Legal name"
                  value={form.candidateName}
                  onChange={(e) => set("candidateName", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Office Being Sought <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. U.S. Senate, Mayor"
                  value={form.office}
                  onChange={(e) => set("office", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State / Jurisdiction
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Texas"
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Party Affiliation
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Democratic, Republican, Independent…"
                  value={form.party}
                  onChange={(e) => set("party", e.target.value)}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Campaign Platform Administrator
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button
            className="bg-white text-red-500 border border-red-500 active:bg-red-500 active:text-white rounded-lg px-3 py-1 hover:bg-red-100 focus:outline-none focus:ring-1 focus:ring-red-500"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="bg-blue-500 text-white border border-blue-500 active:bg-blue-500 active:text-white rounded-lg px-3 py-1 hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={!isValid || loading}
            onClick={handleSave}
          >
            {loading ? "Creating..." : "Create Campaign"}
          </button>
        </div>
      </div>
    </div>
  );
}
