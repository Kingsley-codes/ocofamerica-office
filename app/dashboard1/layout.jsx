"use client";

import Sidebar from "@/components/dasboard1/Sidebar";
import { SidebarProvider } from "@/context/SidebarContext";

export default function DashboardLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SidebarProvider>
          <div className="flex">
            <Sidebar />

            <main className="flex-1 bg-gray-100 min-h-screen">
              <div className="p-4">{children}</div>
            </main>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
