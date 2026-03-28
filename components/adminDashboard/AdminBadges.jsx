// components/admin/AdminBadges.jsx
"use client";

import {
  FiCheckCircle,
  FiSlash,
  FiXCircle,
  FiClock,
  FiStar,
  FiZap,
} from "react-icons/fi";

// ── Status Badge ─────────────────────────────────────────────────
const STATUS_CONFIG = {
  active: {
    label: "Active",
    className:
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800",
    Icon: FiCheckCircle,
  },
  suspended: {
    label: "Suspended",
    className:
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800",
    Icon: FiSlash,
  },
  cancelled: {
    label: "Cancelled",
    className:
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800",
    Icon: FiXCircle,
  },
  pending: {
    label: "Pending",
    className:
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800",
    Icon: FiClock,
  },
};

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.Icon;

  return (
    <span className={cfg.className}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ── Plan Badge ───────────────────────────────────────────────────
const PLAN_CONFIG = {
  starter: {
    label: "Starter",
    className:
      "inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium uppercase tracking-wide border-gray-300 text-gray-600 bg-gray-50",
  },
  pro: {
    label: "Pro",
    className:
      "inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium uppercase tracking-wide border-indigo-300 text-indigo-700 bg-indigo-50",
    Icon: FiZap,
  },
  enterprise: {
    label: "Enterprise",
    className:
      "inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium uppercase tracking-wide border-yellow-300 text-yellow-700 bg-yellow-50",
    Icon: FiStar,
  },
};

export function PlanBadge({ plan }) {
  const cfg = PLAN_CONFIG[plan] || PLAN_CONFIG.starter;
  const Icon = cfg.Icon;

  return (
    <span className={cfg.className}>
      {Icon && <Icon className="h-3 w-3" />}
      {cfg.label}
    </span>
  );
}

// ── Avatar (initials) ────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-indigo-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-red-500",
  "bg-purple-500",
  "bg-pink-500",
];

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CampaignAvatar({ name, size = "md" }) {
  const safeName = name || "";
  const color =
    AVATAR_COLORS[(safeName?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

  const sizeClass =
    size === "sm"
      ? "h-7 w-7 text-xs"
      : size === "lg"
        ? "h-11 w-11 text-base"
        : "h-8 w-8 text-sm";

  return (
    <div
      className={`${sizeClass} ${color} rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0 select-none`}
    >
      {getInitials(safeName)}
    </div>
  );
}
