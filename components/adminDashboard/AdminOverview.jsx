// components/admin/AdminOverview.jsx
"use client";

import {
  FiFlag,
  FiCheckCircle,
  FiDollarSign,
  FiSlash,
  FiClock,
  FiArrowUpRight,
  FiArrowDownRight,
  FiChevronRight,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiLock,
} from "react-icons/fi";

import { StatusBadge, PlanBadge, CampaignAvatar } from "./AdminBadges";

// ── Audit Config ────────────────────────────────────────────────
const AUDIT_CONFIG = {
  created: { color: "text-green-700", bgColor: "bg-green-100", Icon: FiPlus },
  suspended: {
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    Icon: FiSlash,
  },
  activated: {
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    Icon: FiCheckCircle,
  },
  deleted: { color: "text-red-700", bgColor: "bg-red-100", Icon: FiTrash2 },
  updated: {
    color: "text-indigo-700",
    bgColor: "bg-indigo-100",
    Icon: FiEdit2,
  },
  login: { color: "text-purple-700", bgColor: "bg-purple-100", Icon: FiLock },
};

// ── Stat Card ───────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  deltaLabel,
  iconBg,
  iconColor,
}) {
  const up = (delta ?? 0) >= 0;

  return (
    <div className="bg-white rounded-lg shadow p-5 flex items-start gap-4">
      <div className={`${iconBg} ${iconColor} p-3 rounded-lg flex-shrink-0`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>

        {delta !== undefined && (
          <p
            className={`text-xs flex items-center gap-0.5 mt-1 ${
              up ? "text-green-600" : "text-red-600"
            }`}
          >
            {up ? (
              <FiArrowUpRight className="h-3 w-3" />
            ) : (
              <FiArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(delta)}% {deltaLabel}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────
export default function AdminOverview({
  campaigns,
  auditLogs,
  onViewAllCampaigns,
  onViewAllAudit,
  onSelectCampaign,
}) {
  const totalMRR = campaigns
    .filter((c) => c.status === "active")
    .reduce((a, c) => a + c.mrr, 0);

  const activeCount = campaigns.filter((c) => c.status === "active").length;
  const suspendedCount = campaigns.filter(
    (c) => c.status === "suspended",
  ).length;
  const pendingCount = campaigns.filter((c) => c.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FiFlag}
          label="Total Campaigns"
          value={campaigns.length}
          delta={12}
          deltaLabel="vs last month"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={FiCheckCircle}
          label="Active"
          value={activeCount}
          delta={8}
          deltaLabel="vs last month"
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          icon={FiDollarSign}
          label="Monthly Revenue"
          value={`$${totalMRR.toLocaleString()}`}
          delta={5}
          deltaLabel="MRR"
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
        />
        <StatCard
          icon={FiSlash}
          label="Suspended"
          value={suspendedCount}
          delta={-2}
          deltaLabel="vs last month"
          iconBg="bg-red-100"
          iconColor="text-red-600"
        />
      </div>

      {pendingCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-2">
          <FiClock className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            <span className="font-semibold">
              {pendingCount} campaign{pendingCount > 1 ? "s" : ""} pending
            </span>{" "}
            — awaiting activation or first payment.
          </p>
        </div>
      )}

      {/* Recent Campaigns */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            Recent Campaigns
          </h2>
          <button
            onClick={onViewAllCampaigns}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View all <FiChevronRight className="h-4 w-4 ml-0.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Campaign", "Office", "Plan", "Status", "MRR"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {campaigns.slice(0, 5).map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onSelectCampaign(c)}
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <CampaignAvatar name={c.candidate} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {c.title}
                        </p>
                        <p className="text-xs text-gray-500">{c.candidate}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-3 text-sm text-gray-500">
                    {c.office}, {c.state}
                  </td>

                  <td className="px-6 py-3">
                    <PlanBadge plan={c.plan} />
                  </td>

                  <td className="px-6 py-3">
                    <StatusBadge status={c.status} />
                  </td>

                  <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                    {c.mrr ? (
                      `$${c.mrr}/mo`
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            Recent Activity
          </h2>
          <button
            onClick={onViewAllAudit}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View all <FiChevronRight className="h-4 w-4 ml-0.5" />
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {auditLogs.slice(0, 5).map((log) => {
            const cfg = AUDIT_CONFIG[log.type] || AUDIT_CONFIG.updated;
            const Icon = cfg.Icon;

            return (
              <div key={log.id} className="px-6 py-3 flex items-start gap-3">
                <div
                  className={`${cfg.bgColor} ${cfg.color} p-2 rounded-full flex-shrink-0 mt-0.5`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {log.target}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{log.detail}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{log.ts}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
