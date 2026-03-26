/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import {
  Sparkles,
  Mail,
  Monitor,
  HeadphonesIcon,
  Phone,
  MessageCircle,
  BarChart,
  Upload,
  Users,
  Target,
  Clock,
  CheckCircle,
  PlayCircle,
  FileText,
  Download,
  Settings,
  ChevronRight,
  Calendar,
  MapPin,
  Image as ImageIcon,
  Mic,
  Database,
  Activity,
  ListChecks,
  Script,
  LayoutDashboard,
  PlusCircle,
  Zap,
  Shield,
  TrendingUp,
  ExternalLink,
  Loader,
} from "lucide-react";

export default function PremiumFeatures({ user }) {
  const [activeService, setActiveService] = useState("outreach");
  const [loadingPackage, setLoadingPackage] = useState(null);

  const services = [
    {
      id: "outreach",
      name: "Text Outreach",
      icon: MessageCircle,
      description: "Professional voter text messaging platform",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      hoverColor: "hover:bg-blue-100",
    },
    {
      id: "billboard",
      name: "Digital Billboard",
      icon: Monitor,
      description: "High-traffic digital display advertising",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      hoverColor: "hover:bg-blue-100",
    },
    {
      id: "phonebank",
      name: "Phone Bank & Robo Dialer",
      icon: HeadphonesIcon,
      description: "Automated and live call center solutions",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      hoverColor: "hover:bg-green-100",
    },
  ];

  // All packages including the new higher-tier ones (email references removed)
  const outreachPackages = [
    // Original packages
    {
      id: "starter",
      name: "Starter Outreach",
      price: 200,
      credits: 3300,
      description:
        "Ideal for municipal and local-level campaigns beginning digital voter outreach.",
      features: [
        "Targeted voter distribution",
        "Messaging dashboard access",
        "Performance tracking",
      ],
      packageId: "1000", // Maps to the messaging platform package
    },
    {
      id: "growth",
      name: "Growth Engagement",
      price: 500,
      credits: 8200,
      description:
        "Designed for campaigns expanding visibility and increasing voter contact frequency.",
      features: [
        "Advanced audience targeting",
        "Strategic messaging guidance",
        "Engagement reporting & analytics",
      ],
      packageId: "3000",
      popular: true,
    },
    {
      id: "premier",
      name: "Premier Impact",
      price: 700,
      credits: 11600,
      description:
        "Built for competitive campaigns focused on maximizing reach and measurable engagement.",
      features: [
        "High-volume voter outreach capacity",
        "Messaging consultation support",
        "Priority assistance & enhanced reporting",
      ],
      packageId: "5000",
    },
    // New higher-tier packages (50k, 75k, 100k, 200k)
    {
      id: "professional",
      name: "Professional Outreach",
      price: 2500,
      credits: 50000,
      description:
        "For established campaigns needing substantial outreach capacity.",
      features: [
        "50,000 text credits",
        "Advanced analytics dashboard",
        "Priority support",
        "Custom sender ID",
        "Dedicated campaign phone number",
      ],
      packageId: "50000",
    },
    {
      id: "enterprise",
      name: "Enterprise Outreach",
      price: 3750,
      credits: 75000,
      description: "Comprehensive solution for large-scale campaigns.",
      features: [
        "75,000 text credits",
        "Real-time delivery tracking",
        "Dedicated account manager",
        "API access",
        "Advanced segmentation",
        "Custom reporting dashboard",
      ],
      packageId: "75000",
    },
    {
      id: "premium",
      name: "Premium Outreach",
      price: 5000,
      credits: 100000,
      description: "High-volume outreach for competitive campaigns.",
      features: [
        "100,000 text credits",
        "Advanced segmentation",
        "A/B testing capabilities",
        "Custom reporting",
        "White-label options",
        "Priority support 24/7",
      ],
      packageId: "100000",
    },
    {
      id: "ultimate",
      name: "Ultimate Outreach",
      price: 10000,
      credits: 200000,
      description: "Maximum impact for major campaigns.",
      features: [
        "200,000 text credits",
        "White-label solutions",
        "Dedicated infrastructure",
        "Strategic consulting",
        "Custom development",
        "Enterprise SLA",
      ],
      packageId: "200000",
    },
  ];

  const handleSignup = (pkg) => {
    setLoadingPackage(pkg.id);

    // Build the URL for the text app's campaign-specific page with the selected package
    const textAppUrl = `https://text.votedbythepeople.com/campaign-signup?selectedPackage=${pkg.packageId}`;

    // Open in new tab - this will trigger the modal on the campaign-signup page
    window.open(textAppUrl, "_blank");

    // Reset loading state after a short delay
    setTimeout(() => {
      setLoadingPackage(null);
    }, 1000);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section - OCOFAmerica & Voted For By The People */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl shadow-xl overflow-hidden">
        <div className="relative px-6 py-12 sm:px-12 lg:px-16">
          <div className="absolute right-0 top-0 opacity-10">
            <Sparkles className="h-64 w-64 text-white" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="h-8 w-8 text-blue-300" />
              <h2 className="text-2xl font-bold text-white">
                Organizing Canvassers of America
              </h2>
            </div>
            <p className="text-xl text-blue-100 max-w-3xl mb-6">
              OCOFAmerica is a full-service political campaign management and
              consulting firm specializing in strategic planning, compliance
              structure, and disciplined field operations. We partner with
              candidates, PACs, and grassroots organizations to build winning
              infrastructures that move beyond ideas into execution.
            </p>
            <div className="border-t border-blue-700 my-6"></div>
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="h-8 w-8 text-yellow-300" />
              <h3 className="text-2xl font-bold text-white">
                Voted For By The People
              </h3>
            </div>
            <p className="text-lg text-blue-100 max-w-3xl">
              Our premium communications division delivers strategic text
              messaging and professional phone banking programs fully integrated
              with campaign digital platforms. Built for candidates and
              organizations seeking elevated communication strategy, Voted For
              By The People provides customized outreach solutions that increase
              visibility, mobilize supporters, and transform engagement into
              measurable electoral success.
            </p>
          </div>
        </div>
      </div>

      {/* Service Category Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {services.map((service) => {
          const Icon = service.icon;
          const isActive = activeService === service.id;
          return (
            <button
              key={service.id}
              onClick={() => setActiveService(service.id)}
              className={`
                flex items-center p-4 rounded-xl border-2 transition-all duration-200
                ${
                  isActive
                    ? `${service.bgColor} ${service.borderColor} border-2 shadow-md`
                    : "bg-white border-gray-200 hover:border-gray-300"
                }
              `}
            >
              <div
                className={`
                p-3 rounded-lg mr-4
                ${isActive ? service.bgColor : "bg-gray-100"}
              `}
              >
                <Icon
                  className={`h-6 w-6 ${
                    isActive ? service.color : "text-gray-600"
                  }`}
                />
              </div>
              <div className="text-left">
                <h3
                  className={`font-semibold ${
                    isActive ? "text-gray-900" : "text-gray-800"
                  }`}
                >
                  {service.name}
                </h3>
                <p className="text-xs text-gray-500">{service.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Service Content */}
      <div className="bg-white rounded-xl shadow-md p-6 lg:p-8">
        {activeService === "outreach" && (
          <div className="space-y-8">
            {/* Voted For By The People Header */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Sparkles className="h-6 w-6 text-blue-700" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Voted For By The People
                </h2>
              </div>
              <p className="text-gray-600 ml-11">
                Campaign Text Messaging Packages
              </p>
            </div>

            {/* System Description */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Zap className="h-5 w-5 text-blue-600 mr-2" />
                Exclusive Campaign Packages
              </h3>
              <p className="text-gray-700">
                These premium packages are exclusively available to Campaign
                Back Office users. Click any package below to sign up on our
                secure messaging platform. A new tab will open where you can
                complete registration and payment.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700">
                  A dedicated campaign telephone number
                </span>
              </div>
              <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700">
                  Access to step-by-step training video
                </span>
              </div>
              <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Live chat support</span>
              </div>
              <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Custom sender ID</span>
              </div>
            </div>

            {/* Pricing Packages */}
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Campaign Text Outreach Packages
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {outreachPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`border rounded-xl p-6 hover:shadow-lg transition-shadow relative ${
                      pkg.popular
                        ? "border-2 border-blue-500 bg-blue-50 shadow-lg"
                        : "border-gray-200"
                    }`}
                  >
                    {pkg.popular && (
                      <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 text-xs font-bold rounded-bl-lg rounded-tr-lg">
                        POPULAR
                      </div>
                    )}
                    <div className="text-center mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {pkg.name}
                      </h4>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-gray-900">
                          ${pkg.price.toLocaleString()}
                        </span>
                        <span className="text-gray-600">/month</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-center mb-4">
                        <span className="text-2xl font-bold text-blue-600">
                          {pkg.credits.toLocaleString()}
                        </span>
                        <span className="text-gray-600 ml-2">
                          Text Credits/month
                        </span>
                      </div>
                      <ul className="space-y-3">
                        {pkg.features.map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-start text-sm text-gray-600"
                          >
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-gray-500 mt-4">
                        {pkg.description}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSignup(pkg)}
                      disabled={loadingPackage === pkg.id}
                      className="w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                      {loadingPackage === pkg.id ? (
                        <>
                          <Loader className="h-4 w-4 mr-2 animate-spin" />
                          Opening...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Sign Up on Platform
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeService === "billboard" && (
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Monitor className="h-6 w-6 text-blue-700" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Digital Billboard Services
                </h2>
              </div>
              <p className="text-gray-600 ml-11">
                High-impact digital billboard advertising • Available based on
                region
              </p>
            </div>

            {/* Availability Notice */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <MapPin className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Region availability:</strong> Services are based on
                    market availability. Contact our team to check specific
                    locations and placement options.
                  </p>
                </div>
              </div>
            </div>

            {/* Billboard Packages */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Weekend Package */}
              <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    Friday - Sunday
                  </span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900">
                  Weekend Visibility
                </h4>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">$500</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <div className="border-t border-gray-200 mt-4 pt-4">
                  <ul className="space-y-3">
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      7-second appearance per flip
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      Rotates multiple times daily
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      Location-based targeting
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      Custom creative upload
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      Campaign monitoring
                    </li>
                  </ul>
                </div>
                <button className="w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  Check Availability
                </button>
              </div>

              {/* Weekday Package */}
              <div className="border-2 border-blue-500 rounded-xl p-6 bg-blue-50 shadow-lg relative">
                <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 text-xs font-bold rounded-bl-lg rounded-tr-lg">
                  RECOMMENDED
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    Monday - Friday
                  </span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900">
                  Weekday Exposure
                </h4>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">$800</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <div className="border-t border-blue-200 mt-4 pt-4">
                  <ul className="space-y-3">
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      7-second appearance per flip
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      Rotates multiple times daily
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      Location-based targeting
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      Custom creative upload
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      Campaign monitoring
                    </li>
                  </ul>
                </div>
                <button className="w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  Check Availability
                </button>
              </div>

              {/* Monthly Dominance Package */}
              <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    7 Days/Week
                  </span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900">
                  Monthly Dominance
                </h4>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">
                    $1,200
                  </span>
                  <span className="text-gray-600">/month+</span>
                </div>
                <div className="border-t border-gray-200 mt-4 pt-4">
                  <ul className="space-y-3">
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      7-second appearance per flip
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      Maximum daily rotation
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      Priority location selection
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      Premium placement priority
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      Enhanced performance reporting
                    </li>
                  </ul>
                </div>
                <button className="w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  Check Availability
                </button>
              </div>
            </div>

            {/* Key Features */}
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Sparkles className="h-5 w-5 text-blue-600 mr-2" />
                Key Features
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  High-traffic commuter visibility
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  Strategic location targeting
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  Flexible scheduling by day selection
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  Adjustable messaging by campaign phase
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  Professional creative support available
                </div>
              </div>
            </div>
          </div>
        )}

        {activeService === "phonebank" && (
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 rounded-lg">
                  <HeadphonesIcon className="h-6 w-6 text-green-700" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Phone Bank & Robo Dialer Services
                </h2>
              </div>
              <p className="text-gray-600 ml-11">
                Powerful Voter Outreach Made Simple
              </p>
            </div>

            {/* Robo Dialer Section */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-green-200 rounded-lg mr-3">
                  <Phone className="h-5 w-5 text-green-700" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Robo Dialer System
                </h3>
              </div>
              <p className="text-gray-700 mb-4">
                Our Robo Dialer system makes large-scale voter communication
                efficient, affordable, and results-driven. You upload your voter
                telephone list — we handle the dialing and message delivery.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <PlayCircle className="h-4 w-4 text-green-600 mr-2" />
                    How It Works
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <ChevronRight className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      Upload your voter telephone numbers
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      Record a 10, 15, or 30-second message
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      Our system automatically dials each number
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      Messages are delivered instantly
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      Voicemail is left when available
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      Receive a detailed performance report
                    </li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <BarChart className="h-4 w-4 text-green-600 mr-2" />
                    Smart Reporting & List Scrubbing
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Disconnected number reporting
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Call completion statistics
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Voicemail delivery confirmation
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      List cleaning insights
                    </li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-3">
                    This allows you to scrub and refine your voter database for
                    stronger future outreach.
                  </p>
                </div>
              </div>
            </div>

            {/* Smart Dialer & Mini Call Center */}
            <div className="bg-gray-50 rounded-xl p-6 border border-indigo-100 mt-8">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-indigo-200 rounded-lg mr-3">
                  <LayoutDashboard className="h-5 w-5 text-indigo-700" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Smart Dialer & Mini Call Center System
                </h3>
              </div>
              <p className="text-gray-700 mb-4">
                Powerful. Organized. Results-Driven. Our Dialer & Mini Call
                Center platform is designed for campaigns, advocacy groups, and
                organizations that need structured, measurable voter outreach.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <Zap className="h-4 w-4 text-indigo-600 mr-2" />
                      How It Works
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        Secure Login Access
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        Numbers load directly onto the screen
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        System auto-dials for maximum efficiency
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        Script appears while calling
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        Agents categorize each call instantly
                      </li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-2">
                      No manual dialing. No confusion. No lost data.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <ListChecks className="h-4 w-4 text-indigo-600 mr-2" />
                      Call Decision Tracking
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      During each call, agents can instantly classify results:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        Disconnected
                      </span>
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        No Answer
                      </span>
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        Left Voicemail
                      </span>
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        Spoke to Voter
                      </span>
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        Callback Requested
                      </span>
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        Support / Oppose
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Every click feeds into your reporting dashboard in real
                      time.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <Upload className="h-4 w-4 text-indigo-600 mr-2" />
                      Easy File Upload
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Admin can upload dialer lists via Excel (.xlsx or .csv)
                    </p>
                    <p className="text-xs font-medium text-gray-700">
                      Required fields:
                    </p>
                    <div className="grid grid-cols-2 gap-1 text-xs mt-1">
                      <span>• First Name</span>
                      <span>• Last Name</span>
                      <span>• Telephone</span>
                      <span>• Party</span>
                      <span>• Sex</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Bulk upload in minutes — ready to dial.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <FileText className="h-4 w-4 text-indigo-600 mr-2" />
                      Script Management
                    </h4>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li className="flex items-start">
                        <ChevronRight className="h-3 w-3 text-indigo-500 mr-1 mt-0.5 flex-shrink-0" />
                        Upload campaign scripts directly into the system
                      </li>
                      <li className="flex items-start">
                        <ChevronRight className="h-3 w-3 text-indigo-500 mr-1 mt-0.5 flex-shrink-0" />
                        Customize scripts by audience
                      </li>
                      <li className="flex items-start">
                        <ChevronRight className="h-3 w-3 text-indigo-500 mr-1 mt-0.5 flex-shrink-0" />
                        Edit messaging instantly
                      </li>
                      <li className="flex items-start">
                        <ChevronRight className="h-3 w-3 text-indigo-500 mr-1 mt-0.5 flex-shrink-0" />
                        Assign different scripts to different lists
                      </li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-2">
                      Your callers always stay on message.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <Activity className="h-4 w-4 text-indigo-600 mr-2" />
                      Admin Dashboard & Reporting
                    </h4>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li className="flex items-start">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                        Monitor live calling activity
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                        Track agent productivity
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                        View call completion rates
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                        Download categorized reports
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                        Identify disconnected numbers
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                        Clean and scrub voter lists
                      </li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-2">
                      Full transparency. Full control.
                    </p>
                  </div>
                </div>
              </div>

              {/* Perfect For */}
              <div className="mt-6 bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Target className="h-4 w-4 text-indigo-600 mr-2" />
                  Perfect For:
                </h4>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs">
                    Political Campaigns
                  </span>
                  <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs">
                    PACs & Advocacy Groups
                  </span>
                  <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs">
                    Issue-Based Organizations
                  </span>
                  <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs">
                    Nonprofits
                  </span>
                  <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs">
                    Grassroots Movements
                  </span>
                </div>
              </div>

              {/* Optional Add-Ons */}
              <div className="mt-6 bg-gradient-to-r from-blue-50 to-pink-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <PlusCircle className="h-4 w-4 text-blue-600 mr-2" />
                  Optional Add-Ons
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <span className="text-xs bg-white px-2 py-1 rounded border border-blue-100">
                    Robo Dialer Integration
                  </span>
                  <span className="text-xs bg-white px-2 py-1 rounded border border-blue-100">
                    SMS Follow-Up Messaging
                  </span>
                  <span className="text-xs bg-white px-2 py-1 rounded border border-blue-100">
                    Geo-Targeted Lists
                  </span>
                  <span className="text-xs bg-white px-2 py-1 rounded border border-blue-100">
                    Call Recording
                  </span>
                  <span className="text-xs bg-white px-2 py-1 rounded border border-blue-100">
                    Volunteer Login Access
                  </span>
                  <span className="text-xs bg-white px-2 py-1 rounded border border-blue-100">
                    Multi-Script Targeting
                  </span>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-8 text-center">
              <button className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors inline-flex items-center">
                <HeadphonesIcon className="h-5 w-5 mr-2" />
                Request Phone Bank Consultation
              </button>
              <p className="text-xs text-gray-500 mt-3">
                Our team will help you select the right outreach solution for
                your campaign
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
        <p>
          Premium Services provided by Voted For By The People, a division of
          OCOFAmerica. Click any package to sign up on our secure platform.
        </p>
      </div>
    </div>
  );
}
