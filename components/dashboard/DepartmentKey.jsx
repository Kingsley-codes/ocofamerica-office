// components/dashboard/DepartmentKey.jsx
"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Users,
  Eye,
  DollarSign,
  Image,
  MapPin,
  Phone,
  Lock,
  Globe,
  FileText,
  Calendar,
  Settings,
  UserCog,
  Shield,
  Award,
  Briefcase,
} from "lucide-react";
import { ROLE_GROUPS, getRoleDisplayName } from "@/lib/permissions";

const DepartmentKey = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Define department icons and colors
  const departments = [
    {
      name: "Executive / Leadership Team",
      icon: Award,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      roles: [
        "Candidate",
        "Campaign Manager",
        "Deputy Campaign Manager",
        "Campaign Chair",
        "Chief of Staff",
        "State Director",
        "Regional Director",
        "Field Director",
        "Compliance Officer",
        "General Consultant / Senior Advisor",
      ],
      permissions: [
        "Add/Delete Users",
        "Assign Roles",
        "Full System Access",
        "Premium Features",
        "Financial Reports",
        "Voter Data",
        "Media",
        "Forms",
      ],
      restrictions: [],
    },
    {
      name: "Oversight Access",
      icon: Eye,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      roles: ["Scheduler / Event Coordinator", "Legal"],
      permissions: [
        "View Entire System",
        "View Calendar",
        "View Finance Reports",
        "View Voter Data",
        "View Media",
      ],
      restrictions: ["Cannot Add/Delete Users", "Cannot Change Settings"],
    },
    {
      name: "Finance Access",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      roles: [
        "Finance Director",
        "Fundraiser",
        "Finance Assistant",
        "Call Time Manager",
        "Donor Researcher",
        "Event Fundraising Coordinator",
      ],
      permissions: [
        "Donations",
        "Donor Database",
        "Fundraising Forms",
        "Premium Fundraising Tools",
        "Targeted Voter Data",
      ],
      restrictions: ["Cannot Edit System Roles"],
    },
    {
      name: "Media & Communications",
      icon: Image,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-200",
      roles: [
        "Media Director",
        "Communications Director",
        "Press Secretary",
        "Digital Director",
        "Social Media Manager",
        "Content Creator",
        "Graphic Designer",
        "Videographer / Photographer",
        "Rapid Response Director",
        "Speechwriter",
      ],
      permissions: [
        "Images",
        "Media Library",
        "Voter Data for Targeting",
        "Premium Media Features",
        "Forms",
      ],
      restrictions: ["No Finance Access", "No User Management"],
    },
    {
      name: "Field Operations",
      icon: MapPin,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      roles: [
        "Field Director",
        "Deputy Field Director",
        "Regional Field Coordinators",
        "Precinct Captains",
        "Data Director",
        "Voter File Manager",
        "Volunteer Coordinator",
        "GOTV Director",
        "Ballot Chase Director",
        "Text Bank Team",
        "Canvassers",
        "Phone Bankers",
      ],
      permissions: [
        "Voter Data",
        "Volunteers",
        "Phone Bank Tools",
        "Premium Field Services",
        "Forms",
      ],
      restrictions: ["No Finance Access", "No User Controls"],
    },
    {
      name: "Limited Access Group",
      icon: Users,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      roles: ["Volunteers", "Canvassers", "Phone Bankers"],
      permissions: [
        "Voter Data",
        "Phone Bank",
        "Text Messaging",
        "Images",
        "Forms",
      ],
      restrictions: ["No Finance", "No Settings", "No User Controls"],
    },
  ];

  // Global rule
  const globalRule = {
    title: "Global Rule",
    description:
      "Everyone Can View the Management Directory (Name, Role, Department, Phone, Email)",
    icon: Globe,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center">
          <Shield className="h-5 w-5 text-blue-600 mr-2" />
          <span className="font-medium text-gray-900">
            Department Key / Legend
          </span>
          <span className="ml-2 text-xs text-gray-500">
            Click to expand role permissions
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          {/* Global Rule */}
          <div className={`${globalRule.bgColor} p-4 rounded-lg border`}>
            <div className="flex items-start">
              <div className={`${globalRule.color} mr-3 mt-1`}>
                <globalRule.icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  {globalRule.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {globalRule.description}
                </p>
              </div>
            </div>
          </div>

          {/* Department Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => {
              const Icon = dept.icon;
              return (
                <div
                  key={dept.name}
                  className={`${dept.bgColor} border ${dept.borderColor} rounded-lg overflow-hidden`}
                >
                  {/* Header */}
                  <div className="p-3 border-b border-gray-200 bg-white bg-opacity-50">
                    <div className="flex items-center">
                      <Icon className={`h-5 w-5 ${dept.color} mr-2`} />
                      <h4 className="font-medium text-gray-900">{dept.name}</h4>
                    </div>
                  </div>

                  {/* Roles */}
                  <div className="p-3 border-b border-gray-200">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                      Roles
                    </p>
                    <div className="space-y-1">
                      {dept.roles.map((role) => (
                        <div
                          key={role}
                          className="text-sm text-gray-700 flex items-start"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 mr-2 flex-shrink-0"></span>
                          <span>{role}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Permissions */}
                  <div className="p-3 border-b border-gray-200">
                    <p className="text-xs font-medium text-green-600 uppercase mb-2">
                      Permissions
                    </p>
                    <div className="space-y-1">
                      {dept.permissions.map((perm) => (
                        <div
                          key={perm}
                          className="text-sm text-green-700 flex items-start"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 mr-2 flex-shrink-0"></span>
                          <span>✓ {perm}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Restrictions */}
                  {dept.restrictions.length > 0 && (
                    <div className="p-3">
                      <p className="text-xs font-medium text-red-600 uppercase mb-2">
                        Restrictions
                      </p>
                      <div className="space-y-1">
                        {dept.restrictions.map((rest) => (
                          <div
                            key={rest}
                            className="text-sm text-red-700 flex items-start"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 mr-2 flex-shrink-0"></span>
                            <span>✗ {rest}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Premium Features are only available if the
              client has opted into the service. Field volunteers have access to
              voter data, phone bank, and text messaging only when assigned.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentKey;
