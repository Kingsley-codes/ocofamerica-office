// components/admin/AdminAuditLogs.jsx
"use client";

import { useState } from "react";
import {
  FiSearch,
  FiDownload,
  FiPlus,
  FiSlash,
  FiCheckCircle,
  FiTrash2,
  FiEdit2,
  FiLock,
} from "react-icons/fi";

// ── Config ──────────────────────────────────────────────────────
const AUDIT_CONFIG = {
  created: {
    label: "Created",
    iconBg: "bg-green-100",
    iconColor: "text-green-700",
    Icon: FiPlus,
  },
  suspended: {
    label: "Suspended",
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-700",
    Icon: FiSlash,
  },
  activated: {
    label: "Activated",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-700",
    Icon: FiCheckCircle,
  },
  deleted: {
    label: "Deleted",
    iconBg: "bg-red-100",
    iconColor: "text-red-700",
    Icon: FiTrash2,
  },
  updated: {
    label: "Updated",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-700",
    Icon: FiEdit2,
  },
  login: {
    label: "Login",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-700",
    Icon: FiLock,
  },
};

const TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All Actions" },
  { value: "created", label: "Created" },
  { value: "updated", label: "Updated" },
  { value: "suspended", label: "Suspended" },
  { value: "activated", label: "Activated" },
  { value: "deleted", label: "Deleted" },
  { value: "login", label: "Login" },
];

// ── Component ───────────────────────────────────────────────────
export default function AdminAuditLogs({ logs }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();

    const matchQ =
      !q ||
      l.target.toLowerCase().includes(q) ||
      l.detail.toLowerCase().includes(q);

    const matchT = typeFilter === "all" || l.type === typeFilter;

    return matchQ && matchT;
  });

  const handleExport = () => {
    const rows = [
      ["Timestamp", "Action", "Target", "Detail", "User"],
      ...filtered.map((l) => [l.ts, l.type, l.target, l.detail, l.user]),
    ];

    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-logs.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Audit Logs</h2>

        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <FiDownload className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Search logs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {TYPE_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <span className="text-xs text-gray-500 ml-auto">
          {filtered.length} entr
          {filtered.length !== 1 ? "ies" : "y"}
        </span>
      </div>

      {/* Log List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            No log entries match your search.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((log) => {
              const cfg = AUDIT_CONFIG[log.type] || AUDIT_CONFIG.updated;
              const Icon = cfg.Icon;

              return (
                <div
                  key={log.id}
                  className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`${cfg.iconBg} ${cfg.iconColor} p-2 rounded-full flex-shrink-0 mt-0.5`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {log.target}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {log.detail}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          By {log.user}
                        </p>
                      </div>

                      <div className="flex-shrink-0 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.iconBg} ${cfg.iconColor}`}
                        >
                          {cfg.label}
                        </span>
                        <p className="text-xs text-gray-400 mt-1 whitespace-nowrap">
                          {log.ts}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
