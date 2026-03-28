// components/admin/AdminCampaigns.jsx
"use client";

import { useState } from "react";
import { FiSearch, FiPlus } from "react-icons/fi";

import { StatusBadge, CampaignAvatar } from "./AdminBadges";
import Image from "next/image";

// ── Options ─────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
  { value: "cancelled", label: "Cancelled" },
];

const PLAN_OPTIONS = [
  { value: "all", label: "All Plans" },
  { value: "starter", label: "Starter" },
  { value: "pro", label: "Pro" },
  { value: "enterprise", label: "Enterprise" },
];

// ── Main Component ──────────────────────────────────────────────
export default function AdminCampaigns({
  campaigns = [],
  onSelectCampaign,
  onNewCampaign,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");

  const filtered = campaigns.filter((c) => {
    const q = search.toLowerCase();

    const matchQ =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.candidate.toLowerCase().includes(q) ||
      c.state.toLowerCase().includes(q) ||
      c.adminEmail.toLowerCase().includes(q);

    const matchS = statusFilter === "all" || c.status === statusFilter;
    const matchP = planFilter === "all" || c.plan === planFilter;

    return matchQ && matchS && matchP;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          All Campaigns
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({campaigns.length} total)
          </span>
        </h2>

        <button
          onClick={onNewCampaign}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="h-4 w-4" /> New Campaign
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Search by campaign, candidate, state…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
        >
          {PLAN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <span className="text-xs text-gray-500 ml-auto">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "CampaignID",
                  "Campaign",
                  "Office",
                  "Candidate",
                  "Status",
                  "Campaign Admin",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-sm text-gray-400"
                  >
                    No campaigns match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onSelectCampaign(c)}
                  >
                    {/* Campaign ID */}
                    <td className="px-6 py-3 text-xs text-gray-400 font-mono">
                      {c.campaignID}
                    </td>

                    {/* Campaign title + candidate */}
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        {c.logo?.url ? (
                          <div className="h-8 w-8 relative">
                            <Image
                              src={c.logo.url}
                              alt={c.title}
                              fill
                              className="rounded-full object-cover flex-shrink-0"
                            />
                          </div>
                        ) : (
                          <CampaignAvatar name={c.candidateName} />
                        )}

                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {c.title}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-3">
                      <p className="text-sm font-medium text-gray-500">
                        {c.office}
                      </p>
                      <p className="text-xs text-gray-400">{c.state}</p>
                    </td>

                    {/* Candidate Name */}
                    <td className="px-6 py-3 text-sm text-gray-500">
                      {c.candidateName}
                    </td>

                    <td className="px-6 py-3">
                      <StatusBadge status={c.status} />
                    </td>

                    {/* Campaign Admin */}
                    <td className="px-6 py-3">
                      {c.clientAdmin ? (
                        <div>
                          <p className="text-sm text-gray-900">
                            {c.clientAdmin.firstName} {c.clientAdmin.lastName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {c.clientAdmin.email}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
