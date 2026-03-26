// components/admin/NewCampaignModal.jsx
"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import {
  FiX,
  FiUpload,
  FiCheckCircle,
  FiStar,
  FiZap,
  FiBriefcase,
} from "react-icons/fi";

// ── Plan Options ────────────────────────────────────────────────
const PLAN_OPTIONS = [
  {
    key: "starter",
    label: "Starter",
    price: "$79",
    seats: "Up to 10 seats",
    features: [
      "Core dashboard",
      "Voter data access",
      "Media assets",
      "Basic reports",
    ],
    Icon: FiBriefcase,
  },
  {
    key: "pro",
    label: "Pro",
    price: "$199",
    seats: "Up to 30 seats",
    features: [
      "Everything in Starter",
      "Fundraising tools",
      "Advanced reports",
      "Calendar & scheduling",
    ],
    Icon: FiZap,
  },
  {
    key: "enterprise",
    label: "Enterprise",
    price: "$499",
    seats: "Unlimited seats",
    features: [
      "Everything in Pro",
      "Premium features",
      "Priority support",
      "Custom integrations",
    ],
    Icon: FiStar,
  },
];

const PLAN_MRR = {
  starter: 79,
  pro: 199,
  enterprise: 499,
};

const EMPTY_FORM = {
  title: "",
  candidate: "",
  office: "",
  state: "",
  party: "",
  website: "",
  adminName: "",
  adminEmail: "",
  phone: "",
  plan: "starter",
  notes: "",
};

export default function NewCampaignModal({ onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [logo, setLogo] = useState(null);
  const [step, setStep] = useState(1);
  const fileRef = useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const step1Valid =
    form.title.trim() &&
    form.candidate.trim() &&
    form.office.trim() &&
    form.adminName.trim() &&
    form.adminEmail.trim();

  const handleSave = () => {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const fmt = (d) => d.toISOString().split("T")[0];

    onSave({
      ...form,
      logo,
      status: "pending",
      created: fmt(today),
      nextBilling: fmt(nextMonth),
      mrr: PLAN_MRR[form.plan],
      seats: 1,
    });

    onClose();
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setLogo(ev.target?.result);
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
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
              Step {step} of 2 —{" "}
              {step === 1 ? "Campaign & Contact Details" : "Subscription Plan"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-4">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  step > s
                    ? "bg-blue-600 text-white"
                    : step === s
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {step > s ? <FiCheckCircle className="h-3.5 w-3.5" /> : s}
              </div>

              <span
                className={`text-sm font-medium ${
                  step >= s ? "text-blue-600" : "text-gray-400"
                }`}
              >
                {s === 1 ? "Details" : "Plan"}
              </span>

              {s < 2 && <div className="w-8 h-px bg-gray-200 ml-1" />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 1 ? (
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
                      src={logo}
                      fill
                      alt="logo"
                      className="h-14 object-contain mx-auto"
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
                    value={form.candidate}
                    onChange={(e) => set("candidate", e.target.value)}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign Website
                  </label>
                  <input
                    type="url"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com"
                    value={form.website}
                    onChange={(e) => set("website", e.target.value)}
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
                      Admin Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={form.adminName}
                      onChange={(e) => set("adminName", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={form.adminEmail}
                      onChange={(e) => set("adminEmail", e.target.value)}
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
          ) : (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Subscription Plan{" "}
                  <span className="text-red-500">*</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PLAN_OPTIONS.map((p) => {
                    const selected = form.plan === p.key;
                    const Icon = p.Icon;

                    return (
                      <div
                        key={p.key}
                        onClick={() => set("plan", p.key)}
                        className={`border-2 rounded-lg p-4 cursor-pointer ${
                          selected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <Icon
                              className={`h-4 w-4 ${selected ? "text-blue-600" : "text-gray-400"}`}
                            />
                            <p
                              className={`font-semibold text-sm ${selected ? "text-blue-700" : "text-gray-900"}`}
                            >
                              {p.label}
                            </p>
                          </div>

                          {selected && (
                            <FiCheckCircle className="h-4 w-4 text-blue-600" />
                          )}
                        </div>

                        <p className="text-xl font-bold text-gray-900">
                          {p.price}
                          <span className="text-xs text-gray-500">/mo</span>
                        </p>

                        <p className="text-xs text-gray-500 mb-2">{p.seats}</p>

                        <ul className="space-y-1">
                          {p.features.map((f) => (
                            <li
                              key={f}
                              className="text-xs text-gray-600 flex items-start gap-1.5"
                            >
                              <span className="text-green-500 mt-0.5">✓</span>
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Internal Notes
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-between">
          {step === 2 && <button onClick={() => setStep(1)}>← Back</button>}

          <div className="flex gap-3">
            <button onClick={onClose}>Cancel</button>

            {step === 1 ? (
              <button disabled={!step1Valid} onClick={() => setStep(2)}>
                Continue →
              </button>
            ) : (
              <button onClick={handleSave}>Create Campaign</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
