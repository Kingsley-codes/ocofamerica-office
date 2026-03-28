// components/adminDashboard/CampaignDrawer.jsx
"use client";

import {
  FiX,
  FiUser,
  FiMail,
  FiPhone,
  FiUsers,
  FiCreditCard,
  FiDollarSign,
  FiCalendar,
  FiGlobe,
  FiFileText,
  FiUnlock,
  FiSlash,
  FiXCircle,
  FiMapPin,
  FiFlag,
} from "react-icons/fi";

import { StatusBadge, PlanBadge, CampaignAvatar } from "./AdminBadges";

// ── Detail Row ──────────────────────────────────────────────────
function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="bg-gray-100 p-1.5 rounded-md flex-shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-gray-500" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-900 font-medium">{value}</p>
      </div>
    </div>
  );
}

// ── Component ───────────────────────────────────────────────────
export default function CampaignDrawer({
  campaign: c,
  onClose,
  onStatusChange,
}) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 z-40 flex justify-end"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md h-full shadow-xl flex flex-col overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <CampaignAvatar name={c.candidateName} size="lg" />
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {c.title}
              </h3>
              <p className="text-sm text-gray-500">
                {c.candidateName} · {c.office}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 px-5 py-4 space-y-5">
          {/* Status & Plan */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={c.status} />
            <PlanBadge plan={c.plan} />
            <span className="ml-auto text-xs text-gray-400">
              Created {c.created}
            </span>
          </div>

          {/* Campaign Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-0.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Campaign Info
            </p>

            <DetailRow icon={FiFlag} label="Office" value={c.office} />
            <DetailRow icon={FiMapPin} label="State" value={c.state || "—"} />

            {c.party && (
              <DetailRow icon={FiUsers} label="Party" value={c.party} />
            )}

            {c.website && (
              <DetailRow
                icon={FiGlobe}
                label="Website"
                value={
                  <a
                    href={c.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {c.website}
                  </a>
                }
              />
            )}
          </div>

          {/* Admin Contact */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-0.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Campaign Administrator
            </p>

            <DetailRow
              icon={FiUser}
              label="Name"
              value={`${c.clientAdmin.firstName} ${c.clientAdmin.lastName}`}
            />
            <DetailRow
              icon={FiMail}
              label="Email"
              value={c.clientAdmin.email}
            />
            <DetailRow
              icon={FiPhone}
              label="Phone"
              value={c.clientAdmin.phone || "—"}
            />
            <DetailRow
              icon={FiUsers}
              label="Seats"
              value={`${c.seats} team members`}
            />
          </div>

          {/* Subscription */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-0.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Subscription
            </p>

            <DetailRow
              icon={FiCreditCard}
              label="Plan"
              value={<PlanBadge plan={c.plan} />}
            />

            <DetailRow
              icon={FiDollarSign}
              label="MRR"
              value={c.mrr ? `$${c.mrr}/month` : "—"}
            />

            <DetailRow
              icon={FiCalendar}
              label="Next Billing"
              value={c.nextBilling}
            />
          </div>

          {/* Notes */}
          {c.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wider mb-1.5">
                Internal Notes
              </p>
              <p className="text-sm text-yellow-800">{c.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Actions
            </p>

            <div className="flex flex-wrap gap-2">
              {c.status !== "active" && (
                <button
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-green-400 text-green-700 bg-green-50 rounded-md text-sm font-medium hover:bg-green-100 transition-colors"
                  onClick={() => {
                    onStatusChange(c.id, "active");
                    onClose();
                  }}
                >
                  <FiUnlock className="h-3.5 w-3.5" /> Activate
                </button>
              )}

              {c.status === "active" && (
                <button
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-yellow-400 text-yellow-700 bg-yellow-50 rounded-md text-sm font-medium hover:bg-yellow-100 transition-colors"
                  onClick={() => {
                    onStatusChange(c.id, "suspended");
                    onClose();
                  }}
                >
                  <FiSlash className="h-3.5 w-3.5" /> Suspend
                </button>
              )}

              {c.status !== "cancelled" && (
                <button
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-300 text-red-600 bg-red-50 rounded-md text-sm font-medium hover:bg-red-100 transition-colors"
                  onClick={() => {
                    onStatusChange(c.id, "cancelled");
                    onClose();
                  }}
                >
                  <FiXCircle className="h-3.5 w-3.5" /> Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
