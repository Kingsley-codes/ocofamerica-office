// app/volunteer-signup/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Mail,
  Phone,
  User,
  Calendar,
  MapPin,
  Home,
  Clock,
  Sun,
  SunDim,
  Moon,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Info,
  Users,
  Megaphone,
  DollarSign,
  FileSignature,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";

// Involvement options from your intake form
const involvementOptions = [
  {
    id: "canvass",
    label: "Canvass / Knock Doors",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    id: "phone_banking",
    label: "Phone Banking",
    icon: Phone,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    id: "fundraiser",
    label: "Host a Fundraiser",
    icon: DollarSign,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
  },
  {
    id: "postcard",
    label: "Mail a Postcard",
    icon: Mail,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  {
    id: "letter",
    label: "Write a Support Letter",
    icon: FileSignature,
    color: "text-cyan-600",
    bgColor: "bg-cyan-100",
  },
  {
    id: "other",
    label: "Other",
    icon: Star,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
];

const availabilityOptions = [
  {
    id: "morning",
    label: "Morning",
    icon: Sun,
    color: "text-amber-600",
    time: "8AM - 12PM",
  },
  {
    id: "afternoon",
    label: "Afternoon",
    icon: SunDim,
    color: "text-orange-600",
    time: "12PM - 5PM",
  },
  {
    id: "evening",
    label: "Evening",
    icon: Moon,
    color: "text-indigo-600",
    time: "5PM - 9PM",
  },
  {
    id: "any",
    label: "Any",
    icon: Clock,
    color: "text-green-600",
    time: "Flexible",
  },
];

const dayOptions = [
  { id: "weekday", label: "Weekdays", days: "Monday - Friday" },
  { id: "weekend", label: "Weekends", days: "Saturday - Sunday" },
  { id: "anyday", label: "Any Day", days: "All week" },
];

export default function VolunteerSignup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Personal Information
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",

    // Step 2: Address
    address: "",
    city: "",
    state: "",
    zip: "",

    // Step 3: How to Get Involved
    preferredRoles: [],

    // Step 4: Availability
    availability: "any",
    preferredDays: "anyday",

    // Step 5: Account Setup
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value;
    // Remove all non-numeric characters
    const numericValue = value.replace(/\D/g, "");

    // Format the phone number as user types
    let formattedValue = numericValue;
    if (numericValue.length > 0) {
      if (numericValue.length <= 3) {
        formattedValue = `(${numericValue}`;
      } else if (numericValue.length <= 6) {
        formattedValue = `(${numericValue.slice(0, 3)}) ${numericValue.slice(3)}`;
      } else {
        formattedValue = `(${numericValue.slice(0, 3)}) ${numericValue.slice(3, 6)}-${numericValue.slice(6, 10)}`;
      }
    }

    setFormData((prev) => ({ ...prev, phone: formattedValue }));

    // Clear phone error if it exists
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: "" }));
    }
  };

  const handleRoleToggle = (roleId) => {
    setFormData((prev) => ({
      ...prev,
      preferredRoles: prev.preferredRoles.includes(roleId)
        ? prev.preferredRoles.filter((r) => r !== roleId)
        : [...prev.preferredRoles, roleId],
    }));
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else {
      // Remove all non-numeric characters for validation
      const phoneDigits = formData.phone.replace(/\D/g, "");
      if (phoneDigits.length < 10) {
        newErrors.phone = "Phone number must have at least 10 digits";
      } else if (phoneDigits.length > 11) {
        newErrors.phone = "Phone number cannot have more than 11 digits";
      }
    }

    if (!formData.dateOfBirth)
      newErrors.dateOfBirth = "Date of birth is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    else if (formData.state.length !== 2)
      newErrors.state = "Use 2-letter state code (e.g., CA)";
    if (!formData.zip.trim()) newErrors.zip = "ZIP code is required";
    else if (!/^\d{5}(-\d{4})?$/.test(formData.zip))
      newErrors.zip = "ZIP code is invalid";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (formData.preferredRoles.length === 0) {
      newErrors.preferredRoles =
        "Please select at least one way to get involved";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    // Always valid as defaults exist
    return true;
  };

  const validateStep5 = () => {
    const newErrors = {};
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password))
      newErrors.password =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number";

    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (!formData.agreeToTerms)
      newErrors.agreeToTerms = "You must agree to the terms";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;
    switch (step) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      case 4:
        isValid = validateStep4();
        break;
    }

    if (isValid) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep5()) return;

    setLoading(true);

    try {
      // Clean phone number before sending to API (remove formatting)
      const cleanPhone = formData.phone.replace(/\D/g, "");

      const response = await fetch("/api/volunteers/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: cleanPhone, // Send clean phone number
          dateOfBirth: formData.dateOfBirth,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          preferredRoles: formData.preferredRoles,
          availability: formData.availability,
          preferredDays: formData.preferredDays,
          password: formData.password,
          role: "volunteer",
          status: "pending",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      toast.success(
        "Thank you for signing up! Please check your email for login instructions.",
      );

      // Redirect to thank you page or login
      setTimeout(() => {
        router.push("/login?registered=true");
      }, 3000);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {[1, 2, 3, 4, 5].map((num) => (
          <div key={num} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step > num
                  ? "bg-green-500 text-white"
                  : step === num
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
              }`}
            >
              {step > num ? <CheckCircle className="h-5 w-5" /> : num}
            </div>
            {num < 5 && (
              <div
                className={`w-12 sm:w-24 h-1 mx-1 ${
                  step > num ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between max-w-3xl mx-auto mt-2 text-xs text-gray-600">
        <span>Personal</span>
        <span>Address</span>
        <span>Interests</span>
        <span>Availability</span>
        <span>Account</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <div className="relative h-16 w-16 mx-auto">
              <Image
                src="/logo.png"
                alt="Campaign Logo"
                width={64}
                height={64}
                className="object-contain"
              />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Join Our Campaign
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            Make a difference in your community
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center">
              <Info className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-sm font-medium text-blue-800">
                How can you help?
              </span>
            </div>
            {showInfo ? (
              <ChevronUp className="h-4 w-4 text-blue-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-blue-500" />
            )}
          </button>

          {showInfo && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {involvementOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.id}
                    className={`${option.bgColor} rounded-lg p-3 text-center`}
                  >
                    <Icon className={`h-5 w-5 ${option.color} mx-auto mb-1`} />
                    <span className="text-xs text-gray-700">
                      {option.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Personal Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className={`pl-10 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.firstName
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="John"
                      />
                    </div>
                    {errors.firstName && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className={`pl-10 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.lastName ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="Doe"
                      />
                    </div>
                    {errors.lastName && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`pl-10 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      className={`pl-10 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.phone ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="(555) 555-5555"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Enter your 10-digit phone number
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className={`pl-10 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.dateOfBirth
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                  </div>
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Address */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Your Address
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={`pl-10 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.address ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="123 Main St"
                    />
                  </div>
                  {errors.address && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.address}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.city ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Los Angeles"
                    />
                    {errors.city && (
                      <p className="mt-1 text-xs text-red-600">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      maxLength="2"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase ${
                        errors.state ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="CA"
                    />
                    {errors.state && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.state}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    name="zip"
                    value={formData.zip}
                    onChange={handleChange}
                    maxLength="10"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.zip ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="90210"
                  />
                  {errors.zip && (
                    <p className="mt-1 text-xs text-red-600">{errors.zip}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: How to Get Involved */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  How would you like to get involved?
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {involvementOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = formData.preferredRoles.includes(
                      option.id,
                    );

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleRoleToggle(option.id)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${option.bgColor}`}>
                            <Icon className={`h-5 w-5 ${option.color}`} />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {option.label}
                          </span>
                          {isSelected && (
                            <CheckCircle className="h-5 w-5 text-blue-500 ml-auto" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {errors.preferredRoles && (
                  <p className="text-sm text-red-600 text-center">
                    {errors.preferredRoles}
                  </p>
                )}
              </div>
            )}

            {/* Step 4: Availability */}
            {step === 4 && (
              <div className="space-y-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Your Availability
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Preferred Time of Day
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {availabilityOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = formData.availability === option.id;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              availability: option.id,
                            }))
                          }
                          className={`p-4 rounded-xl border-2 transition-all text-center ${
                            isSelected
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-blue-300"
                          }`}
                        >
                          <Icon
                            className={`h-6 w-6 ${option.color} mx-auto mb-2`}
                          />
                          <span className="text-sm font-medium text-gray-900 block">
                            {option.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {option.time}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Preferred Days
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {dayOptions.map((option) => {
                      const isSelected = formData.preferredDays === option.id;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              preferredDays: option.id,
                            }))
                          }
                          className={`p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-blue-300"
                          }`}
                        >
                          <span className="text-sm font-medium text-gray-900 block">
                            {option.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {option.days}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Account Setup */}
            {step === 5 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Create Your Account
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 ${
                        errors.password ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.password}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Must be at least 8 characters with 1 uppercase, 1 lowercase,
                    and 1 number
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 ${
                        errors.confirmPassword
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Next steps:</strong> After signing up, you&apos;ll
                    receive a welcome email with login instructions. You can
                    then access your volunteer dashboard to sign up for shifts
                    and track your hours.
                  </p>
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-3 text-sm text-gray-700">
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Privacy Policy
                    </Link>
                    . I understand that my information will be used for campaign
                    communications.
                  </label>
                </div>
                {errors.agreeToTerms && (
                  <p className="text-sm text-red-600">{errors.agreeToTerms}</p>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Back
                </button>
              )}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="ml-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Sign Up"
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Login Link */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-800"
          >
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}
