"use client";

import { FaTimes } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { Flag, LayoutDashboard, CreditCard, FileText } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function AdminSidebar() {
  const { isOpen, setIsOpen } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();

  const allTabs = [
    {
      id: "overview",
      label: "Overview",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "campaigns",
      label: "Campaigns",
      href: "/admin/dashboard/campaigns",
      icon: Flag,
    },
    {
      id: "subscriptions",
      label: "Subscriptions",
      href: "/admin/dashboard/subscriptions",
      icon: CreditCard,
    },
    {
      id: "audit",
      label: "Audit Logs",
      href: "/admin/dashboard/audit",
      icon: FileText,
    },
  ];

  return (
    <>
      {/* Overlay (mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`
          fixed md:static z-50 top-0 left-0 min-h-screen w-64 bg-blue-900 text-white p-4
          transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Mobile Header */}
        <div className="flex justify-between items-center mb-6 md:hidden">
          <h2 className="text-lg font-bold">MENU</h2>
          <FaTimes
            className="cursor-pointer"
            onClick={() => setIsOpen(false)}
          />
        </div>

        {/* Desktop Title */}
        <h2 className="text-xl font-bold mb-6 hidden md:block">
          CAMPAIGN NAME
        </h2>

        {/* ✅ Dynamic Tabs */}
        <nav className="flex flex-col gap-2 w-full">
          {allTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;

            return (
              <Link
                key={tab.id}
                href={tab.href}
                onClick={() => {
                  setIsOpen(false); // close on mobile
                }}
                className={`
                        flex items-center gap-3 p-2 rounded cursor-pointer transition
                        ${
                          isActive
                            ? "bg-blue-700 font-semibold"
                            : "hover:bg-blue-800"
                        }
                      `}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
