// components/admin/AdminSubscriptions.jsx
"use client";

import { FiStar, FiZap, FiBriefcase, FiTrendingUp } from "react-icons/fi";

import { StatusBadge, PlanBadge, CampaignAvatar } from "./AdminBadges";

// ── Plan Meta ───────────────────────────────────────────────────
const PLAN_META = {
  enterprise: {
    label: "Enterprise",
    price: 499,
    maxSeats: Infinity,
    Icon: FiStar,
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
  },
  pro: {
    label: "Pro",
    price: 199,
    maxSeats: 30,
    Icon: FiZap,
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
  starter: {
    label: "Starter",
    price: 79,
    maxSeats: 10,
    Icon: FiBriefcase,
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
  },
};

export default function AdminSubscriptions({ campaigns, onSelectCampaign }) {
  const totalMRR = campaigns
    .filter((c) => c.status === "active")
    .reduce((a, c) => a + c.mrr, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Subscriptions</h2>

        <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
          <FiTrendingUp className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            Total MRR:{" "}
            <span className="font-bold">${totalMRR.toLocaleString()}/mo</span>
          </span>
        </div>
      </div>

      {/* Per-plan summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {["enterprise", "pro", "starter"].map((planKey) => {
          const meta = PLAN_META[planKey];
          const Icon = meta.Icon;

          const active = campaigns.filter(
            (c) => c.plan === planKey && c.status === "active",
          );

          const allPlan = campaigns.filter((c) => c.plan === planKey);

          const planMRR = active.reduce((a, c) => a + c.mrr, 0);

          return (
            <div
              key={planKey}
              className="bg-white shadow rounded-lg p-5 flex items-start gap-4"
            >
              <div
                className={`${meta.iconBg} ${meta.iconColor} p-3 rounded-lg flex-shrink-0`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                  {meta.label} Plan
                </p>

                <p className="text-2xl font-bold text-gray-900 mt-0.5">
                  {allPlan.length}
                </p>

                <p className="text-xs text-gray-500 mt-0.5">
                  {active.length} active · ${planMRR.toLocaleString()}/mo
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">
            All Subscriptions
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Campaign",
                  "Plan",
                  "MRR",
                  "Seats Used",
                  "Status",
                  "Next Billing",
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
              {campaigns.map((c) => {
                const meta = PLAN_META[c.plan];
                const maxSeats =
                  meta.maxSeats === Infinity ? null : meta.maxSeats;

                const pct = maxSeats
                  ? Math.min((c.seats / maxSeats) * 100, 100)
                  : 60;

                return (
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
                          <p className="text-xs text-gray-400">
                            {c.adminEmail}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-3">
                      <PlanBadge plan={c.plan} />
                    </td>

                    <td className="px-6 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {c.status === "active" ? (
                        `$${c.mrr}/mo`
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    <td className="px-6 py-3">
                      <p className="text-xs text-gray-600 mb-1">
                        {c.seats} / {maxSeats ?? "∞"}
                      </p>

                      <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>

                    <td className="px-6 py-3">
                      <StatusBadge status={c.status} />
                    </td>

                    <td className="px-6 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {c.nextBilling}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
