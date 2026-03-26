"use client";

import { FaCog, FaUser, FaBars } from "react-icons/fa";
import { useSidebar } from "@/context/SidebarContext";

export default function Header() {
  const { setIsOpen } = useSidebar();

  return (
    <div className="flex justify-between items-center bg-white p-4 rounded shadow">
      <div className="flex items-center gap-3">
        <FaBars
          className="md:hidden cursor-pointer"
          onClick={() => setIsOpen(true)}
        />
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </div>

      <div className="flex gap-4">
        <FaCog />
        <FaUser />
      </div>
    </div>
  );
}
