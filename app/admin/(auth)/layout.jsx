"use client";

import { useState, useEffect } from "react";
import { Shield, Users, DollarSign, Target } from "lucide-react";
import Image from "next/image"; // Add this import

export default function AuthLayout({ children }) {
  const [features] = useState([
    {
      icon: Shield,
      title: "Secure 2FA",
      description: "Two-factor authentication with time-based codes",
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Manage volunteers, staff, and key personnel",
    },
    {
      icon: DollarSign,
      title: "Financial Tracking",
      description: "Track donations, expenses, and compliance",
    },
    {
      icon: Target,
      title: "Campaign Analytics",
      description: "Monitor goals and projections in real-time",
    },
  ]);

  return (
    <div className="h-screen flex">
      {/* Left Panel - Features - Fixed width, doesn't shrink */}
      <div className="hidden lg:flex lg:w-1/2 flex-shrink-0 bg-gradient-to-br from-blue-900 to-blue-800 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-12">
            {/* Replace the shield icon with your logo */}
            <div className="h-10 w-10 relative rounded-lg overflow-hidden">
              <Image
                src="/logo.png"
                alt="Campaign Back Office Logo"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-white">
              Campaign Back Office
            </h1>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-white leading-tight">
                Secure Campaign
                <br />
                Management System
              </h2>
              <p className="text-blue-200 mt-4">
                Professional platform for political campaign management with
                enterprise-grade security.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm"
                >
                  <feature.icon className="h-5 w-5 text-blue-300" />
                  <div>
                    <p className="font-medium text-white">{feature.title}</p>
                    <p className="text-sm text-blue-200">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-sm text-blue-300">
          <p>© 2026 Campaign Back Office. All rights reserved.</p>
          <p className="mt-1">FEC Compliant • SOC 2 Type II • HIPAA Ready</p>
        </div>
      </div>

      {/* Right Panel - Auth Form - Takes remaining space */}
      <div className="flex-1 min-w-0">
        <div className="h-full overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="w-full md:max-w-lg">
              {/* Mobile Header - Only visible on small screens */}
              <div className="lg:hidden mb-8 text-center">

                <div className="h-16 w-16 mx-auto mb-4 relative">
                  <Image
                    src="/logo.png"
                    alt="Campaign Back Office Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Campaign Back Office
                </h1>
                <p className="text-gray-600 mt-2">Secure Management System</p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:pt-14 mb-8">
                {children}
              </div>

              <div className="text-center text-sm text-gray-600 pb-8">
                <p>
                  For technical support, contact{" "}
                  <span className="font-medium">
                    support@campaignbackoffice.com
                  </span>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  End-to-end encryption • Audit trail • Role-based access
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}