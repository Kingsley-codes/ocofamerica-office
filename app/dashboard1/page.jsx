"use client";

import Header from "@/components/dasboard1/Header";
import ProgressBar from "@/components/dasboard1/ProgressBar";
import ActionButtons from "@/components/dasboard1/ActionButtons";
import VolunteerCard from "@/components/dasboard1/VolunteerCard";
import VoterCard from "@/components/dasboard1/VoterCard";
import DonorCard from "@/components/dasboard1/DonorCard";
import YardSigns from "@/components/dasboard1/YardSigns";
import LargeSigns from "@/components/dasboard1/LargeSigns";
import { useSidebar } from "@/context/SidebarContext";
import { validateSession, handleLogout } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { setIsOpen } = useSidebar();
  const router = useRouter();
  const [user, setUser] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication and get user data
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const sessionData = await validateSession();

        if (!sessionData.valid) {
          router.push("/login");
          return;
        }

        setUser(sessionData.user);
        setIsLoading(false);
      } catch (error) {
        console.error("Auth error:", error);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <div className="flex-1 p-4 space-y-4">
        <Header setIsOpen={setIsOpen} />
        <ProgressBar />
        <ActionButtons />

        <div className="grid grid-cols-3 gap-4">
          <VolunteerCard />
          <VoterCard />
          <DonorCard />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <YardSigns />
          <LargeSigns />
        </div>
      </div>
    </div>
  );
}
